const { generateSecret, generateURI, verifySync } = require('otplib');
const qrcode = require('qrcode');
const crypto = require('crypto');
const { incrementUserSessionVersion } = require('../utils/userSession');

const createTwoFactorController = ({
  db,
  jwt,
  jwtSecret,
  logSuccessfulLogin,
  encrypt,
  decrypt,
  hashBackupCode,
  resolveUserRoles,
  getUserTeams,
  getPrimaryRole,
  requiresAnnualPasswordChange,
  getPasswordExpiresAt,
  expireOldUserAgreement,
  recordActivity
}) => {
  const generate2FA = async (req, res) => {
    try {
      if (req.user.purpose && !['2fa_setup', '2fa_choice'].includes(req.user.purpose)) {
        return res.status(403).json({ success: false, message: 'Token tidak dapat digunakan untuk menyiapkan 2FA.' });
      }
      const userRes = await db.query(
        'SELECT email, is_two_factor_enabled, session_version FROM users WHERE id = $1',
        [req.user.id]
      );
      if (userRes.rows.length === 0) return res.status(404).json({ success: false, message: 'User not found' });
      if (req.user.purpose && Number(req.user.sessionVersion) !== Number(userRes.rows[0].session_version)) {
        return res.status(401).json({ success: false, message: 'Sesi login telah digantikan oleh login baru. Silakan login kembali.' });
      }

      if (userRes.rows[0].is_two_factor_enabled) {
        return res.status(400).json({ success: false, message: '2FA is already enabled. You cannot generate a new QR code.' });
      }

      const secret = generateSecret();
      const otpauth = generateURI({
        strategy: 'totp',
        issuer: 'LayananKominfo',
        label: userRes.rows[0].email,
        secret
      });
      const qrCodeUrl = await qrcode.toDataURL(otpauth);

      const encryptedSecret = encrypt(secret);
      await db.query(
        'UPDATE users SET two_factor_secret = $1, two_factor_reset_at = CURRENT_TIMESTAMP WHERE id = $2',
        [encryptedSecret, req.user.id]
      );

      return res.json({ success: true, qrCodeUrl, secret });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Server error generating 2FA', error: err.message });
    }
  };

  const skip2FASetup = async (req, res) => {
    if (req.user.purpose !== '2fa_choice') {
      return res.status(403).json({ success: false, message: 'Token pilihan 2FA tidak valid.' });
    }

    try {
      const userRes = await db.query('SELECT * FROM users WHERE id = $1 AND is_active = true', [req.user.id]);
      const user = userRes.rows[0];
      if (!user) return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
      if (Number(req.user.sessionVersion) !== Number(user.session_version)) {
        return res.status(401).json({ success: false, message: 'Sesi login telah digantikan oleh login baru. Silakan login kembali.' });
      }

      expireOldUserAgreement(user);
      user.roles = await resolveUserRoles(user.id);
      if (user.is_two_factor_enabled) {
        return res.status(403).json({ success: false, message: 'Pilihan ini tidak berlaku untuk akun tersebut.' });
      }
      const sessionRes = await db.query(
        `UPDATE users
         SET two_factor_choice_completed = true,
             two_factor_secret = NULL,
             session_version = session_version + 1
         WHERE id = $1 AND session_version = $2
         RETURNING session_version`,
        [user.id, Number(req.user.sessionVersion) || 0]
      );
      if (!sessionRes.rows[0]) {
        return res.status(401).json({ success: false, message: 'Sesi login telah digantikan oleh login baru. Silakan login kembali.' });
      }
      if (user.user_agreement_accepted_at) await logSuccessfulLogin(user, 'password');

      const primaryRole = getPrimaryRole(user.roles);
      const passwordChangeRequired = requiresAnnualPasswordChange(user);
      const token = jwt.sign({
        id: user.id,
        email: user.email,
        nip: user.nip,
        role: primaryRole,
        roles: user.roles,
        name: user.full_name,
        department: user.department,
        passwordChangeRequired,
        passwordExpiresAt: getPasswordExpiresAt(user),
        sessionVersion: Number(sessionRes.rows[0].session_version),
        ...(!user.user_agreement_accepted_at ? { purpose: 'user_agreement' } : {})
      }, jwtSecret, { expiresIn: '24h' });

      return res.json({
        success: true,
        token,
        passwordChangeRequired,
        user: {
          id: user.id,
          email: user.email,
          nip: user.nip,
          name: user.full_name,
          role: primaryRole,
          roles: user.roles,
          department: user.department,
          profile_image: user.profile_image,
          profile_image_source: user.profile_image_source,
          profileImage: user.profile_image,
          profileImageSource: user.profile_image_source,
          teams: await getUserTeams(user.id),
          passwordChangeRequired,
          passwordExpiresAt: getPasswordExpiresAt(user),
          twoFactorEnabled: false,
          twoFactorChoiceCompleted: true,
          userAgreementAccepted: Boolean(user.user_agreement_accepted_at)
        },
        requiresUserAgreement: !user.user_agreement_accepted_at
      });
    } catch (error) {
      console.error('skip2FASetup error:', error.message);
      return res.status(500).json({ success: false, message: 'Gagal menyimpan pilihan 2FA.' });
    }
  };

  const verifySetup2FA = async (req, res) => {
    const { otp } = req.body;
    if (!otp || typeof otp !== 'string') {
      return res.status(400).json({ success: false, message: 'OTP is required and must be a string' });
    }
    try {
      if (req.user.purpose && !['2fa_setup', '2fa_choice'].includes(req.user.purpose)) {
        return res.status(403).json({ success: false, message: 'Token tidak dapat digunakan untuk verifikasi 2FA.' });
      }
      const userRes = await db.query(
        'SELECT two_factor_secret, is_two_factor_enabled, session_version FROM users WHERE id = $1',
        [req.user.id]
      );
      if (userRes.rows.length === 0) return res.status(404).json({ success: false, message: 'User not found' });
      if (req.user.purpose && Number(req.user.sessionVersion) !== Number(userRes.rows[0].session_version)) {
        return res.status(401).json({ success: false, message: 'Sesi login telah digantikan oleh login baru. Silakan login kembali.' });
      }

      if (userRes.rows[0].is_two_factor_enabled) {
        return res.status(400).json({ success: false, message: '2FA is already enabled' });
      }

      const encryptedSecret = userRes.rows[0].two_factor_secret;
      if (!encryptedSecret) {
        return res.status(400).json({ success: false, message: 'Please generate 2FA QR code first' });
      }

      const secret = decrypt(encryptedSecret);
      const result = verifySync({ strategy: 'totp', token: otp, secret, window: 2 });

      if (!result.valid) return res.status(401).json({ success: false, message: 'Kode OTP tidak valid atau sudah kadaluarsa. Silakan coba kode terbaru.' });

      const backupCodesRaw = Array.from({ length: 8 }, () => crypto.randomBytes(4).toString('hex'));
      const backupCodesHashed = backupCodesRaw.map(hashBackupCode);

      const sessionRes = await db.query(
        `UPDATE users
         SET is_two_factor_enabled = true,
             two_factor_choice_completed = true,
             backup_codes = $1,
             session_version = session_version + 1
         WHERE id = $2 AND session_version = $3
         RETURNING session_version`,
        [JSON.stringify(backupCodesHashed), req.user.id, Number(req.user.sessionVersion) || 0]
      );
      if (!sessionRes.rows[0]) {
        return res.status(401).json({ success: false, message: 'Sesi login telah digantikan oleh login baru. Silakan login kembali.' });
      }

      const updatedUserRes = await db.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
      const updatedUser = updatedUserRes.rows[0];
      expireOldUserAgreement(updatedUser);
      updatedUser.roles = await resolveUserRoles(updatedUser.id);
      updatedUser.roles = updatedUser.roles.length ? updatedUser.roles : [getPrimaryRole(updatedUser.roles)];
      await recordActivity(db, {
        actorId: updatedUser.id,
        actorName: updatedUser.full_name,
        actorRole: updatedUser.roles.join(', ') || 'UNKNOWN',
        activityType: 'two_factor_enabled',
        description: 'Pengguna mengaktifkan autentikasi dua faktor.'
      });
      if (updatedUser.user_agreement_accepted_at) await logSuccessfulLogin(updatedUser, 'password_and_2fa');
      const primaryRole = getPrimaryRole(updatedUser.roles);

      const token = jwt.sign(
        {
          id: updatedUser.id, email: updatedUser.email, role: primaryRole, roles: updatedUser.roles,
          name: updatedUser.full_name, department: updatedUser.department,
          passwordChangeRequired: requiresAnnualPasswordChange(updatedUser),
          passwordExpiresAt: getPasswordExpiresAt(updatedUser),
          sessionVersion: Number(sessionRes.rows[0].session_version),
          ...(!updatedUser.user_agreement_accepted_at ? { purpose: 'user_agreement' } : {})
        },
        jwtSecret,
        { expiresIn: '24h' }
      );

      return res.json({
        success: true,
        message: '2FA enabled successfully',
        backupCodes: backupCodesRaw,
        token,
        passwordChangeRequired: requiresAnnualPasswordChange(updatedUser),
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          nip: updatedUser.nip,
          name: updatedUser.full_name,
          role: primaryRole,
          roles: updatedUser.roles,
          department: updatedUser.department,
          profileImage: updatedUser.profile_image,
          profileImageSource: updatedUser.profile_image_source,
          profile_image: updatedUser.profile_image,
          profile_image_source: updatedUser.profile_image_source,
          teams: await getUserTeams(updatedUser.id),
          passwordChangeRequired: requiresAnnualPasswordChange(updatedUser),
          passwordExpiresAt: getPasswordExpiresAt(updatedUser),
          twoFactorEnabled: true,
          twoFactorChoiceCompleted: true,
          userAgreementAccepted: Boolean(updatedUser.user_agreement_accepted_at)
        },
        requiresUserAgreement: !updatedUser.user_agreement_accepted_at
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Server error verifying 2FA setup' });
    }
  };

  const disableProfile2FA = async (req, res) => {
    try {
      const userRes = await db.query(
        'SELECT is_two_factor_enabled FROM users WHERE id = $1',
        [req.user.id]
      );
      const user = userRes.rows[0];
      if (!user?.is_two_factor_enabled) {
        return res.status(400).json({ success: false, message: '2FA belum aktif pada akun ini.' });
      }

      await db.query(
        `UPDATE users
         SET is_two_factor_enabled = false, two_factor_secret = NULL, backup_codes = '[]'::jsonb,
             two_factor_reset_at = CURRENT_TIMESTAMP, two_factor_choice_completed = true
         WHERE id = $1`,
        [req.user.id]
      );
      await recordActivity(db, {
        actorId: req.user.id,
        actorName: req.user.name,
        actorRole: ((Array.isArray(req.user.roles) && req.user.roles.length) ? req.user.roles : [req.user.role])
          .filter(Boolean)
          .map(role => String(role).toUpperCase())
          .join(', ') || 'UNKNOWN',
        activityType: 'two_factor_disabled',
        description: 'Pengguna menonaktifkan autentikasi dua faktor.'
      });
      return res.json({
        success: true,
        twoFactorEnabled: false,
        twoFactorChoiceCompleted: true,
        message: '2FA berhasil dinonaktifkan.'
      });
    } catch (error) {
      console.error('disableProfile2FA error:', error.message);
      return res.status(500).json({ success: false, message: 'Gagal menonaktifkan 2FA.' });
    }
  };

  const login2FA = async (req, res) => {
    const { tempToken, otp, trustDevice } = req.body;

    if (!tempToken || typeof tempToken !== 'string') {
      return res.status(401).json({ success: false, message: 'Temporary token is required' });
    }

    if (!otp || typeof otp !== 'string') {
      return res.status(401).json({ success: false, message: 'OTP is required' });
    }

    try {
      const decoded = jwt.verify(tempToken, jwtSecret);
      if (decoded.purpose !== '2fa') return res.status(401).json({ success: false, message: 'Invalid token purpose' });

      const userRes = await db.query('SELECT * FROM users WHERE id = $1', [decoded.id]);

      if (userRes.rows.length === 0) return res.status(404).json({ success: false, message: 'User not found' });
      const user = userRes.rows[0];
      if (Number(decoded.sessionVersion) !== Number(user.session_version)) {
        return res.status(401).json({ success: false, message: 'Sesi login telah digantikan oleh login baru. Silakan login kembali.' });
      }
      user.roles = await resolveUserRoles(user.id);
      user.roles = user.roles.length ? user.roles : [getPrimaryRole(user.roles)];
      expireOldUserAgreement(user);

      if (!user.is_two_factor_enabled || !user.two_factor_secret) {
        return res.status(400).json({ success: false, message: '2FA is not enabled for this user' });
      }

      let isValid = false;
      try {
        const secret = decrypt(user.two_factor_secret);
        let result = { valid: false };
        const cleanOtp = String(otp || '').trim();
        if (/^\d+$/.test(cleanOtp)) {
          try {
            result = verifySync({ strategy: 'totp', token: cleanOtp, secret, window: 2 });
          } catch (otplibErr) {
            console.error('otplib error:', otplibErr.message);
          }
        }

        if (result.valid) {
          isValid = true;
        } else {
          const backupCodesHashed = typeof user.backup_codes === 'string' ? JSON.parse(user.backup_codes) : (user.backup_codes || []);
          const hashedInput = hashBackupCode(otp);

          if (backupCodesHashed.includes(hashedInput)) {
            isValid = true;
            const newBackupCodes = backupCodesHashed.filter(c => c !== hashedInput);
            await db.query('UPDATE users SET backup_codes = $1 WHERE id = $2', [JSON.stringify(newBackupCodes), user.id]);
          }
        }
      } catch (cryptoErr) {
        console.error('Error during 2FA crypto validation:', cryptoErr);
        return res.status(500).json({ success: false, message: 'Internal error validating 2FA' });
      }

      if (!isValid) {
        return res.status(401).json({ success: false, message: 'Invalid OTP or Backup Code. Access Denied.' });
      }

      const primaryRole = getPrimaryRole(user.roles);
      const passwordChangeRequired = requiresAnnualPasswordChange(user);
      const sessionVersion = await incrementUserSessionVersion(db, user.id);
      if (user.user_agreement_accepted_at) await logSuccessfulLogin(user, 'password_and_2fa');

      const token = jwt.sign(
        {
          id: user.id, email: user.email, role: primaryRole, roles: user.roles,
          name: user.full_name, department: user.department, passwordChangeRequired,
          passwordExpiresAt: getPasswordExpiresAt(user),
          sessionVersion,
          ...(!user.user_agreement_accepted_at ? { purpose: 'user_agreement' } : {})
        },
        jwtSecret,
        { expiresIn: '24h' }
      );

      let trustedDeviceToken = null;
      if (trustDevice) {
        trustedDeviceToken = jwt.sign(
          { id: user.id, purpose: 'trusted_device' },
          jwtSecret,
          { expiresIn: '30d' }
        );
      }

      return res.json({
        success: true,
        token,
        trustedDeviceToken,
        user: {
          id: user.id,
          email: user.email,
          nip: user.nip,
          name: user.full_name,
          role: primaryRole,
          roles: user.roles,
          department: user.department,
          profileImage: user.profile_image,
          profileImageSource: user.profile_image_source,
          profile_image: user.profile_image,
          profile_image_source: user.profile_image_source,
          password_auth_source: user.password_auth_source,
          teams: await getUserTeams(user.id),
          passwordChangeRequired,
          passwordExpiresAt: getPasswordExpiresAt(user),
          twoFactorEnabled: true,
          twoFactorChoiceCompleted: true,
          userAgreementAccepted: Boolean(user.user_agreement_accepted_at)
        },
        requiresUserAgreement: !user.user_agreement_accepted_at
      });
    } catch (err) {
      console.error(err);
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Temporary token expired. Please login again.' });
      }
      return res.status(500).json({ success: false, message: 'Server error during 2FA login' });
    }
  };

  return {
    generate2FA,
    skip2FASetup,
    verifySetup2FA,
    disableProfile2FA,
    login2FA
  };
};

module.exports = createTwoFactorController;
