const bcrypt = require('bcryptjs');
const { getPasswordPolicyFailures } = require('../utils/passwordPolicy');

const createProfileController = ({
  db,
  jwt,
  jwtSecret,
  expireOldUserAgreement,
  resolveUserRoles,
  getPrimaryRole,
  getUserTeams,
  requiresAnnualPasswordChange,
  getPasswordExpiresAt,
  logSuccessfulLogin,
  ensurePasswordCols,
  verifyPassword
}) => {
  const handlers = {};

  // Profile handlers
  handlers.getMe = async (req, res) => {
    try {
      const userRes = await db.query(
        `SELECT * FROM users WHERE id = $1`,
        [req.user.id]
      );
      if (userRes.rows.length === 0) return res.status(404).json({ success: false, message: 'User not found' });

      const user = userRes.rows[0];
      expireOldUserAgreement(user);
      user.roles = await resolveUserRoles(user.id);
      user.roles = user.roles.length ? user.roles : [getPrimaryRole(user.roles)];
      user.role = getPrimaryRole(user.roles);
      user.teams = await getUserTeams(user.id);
      user.passwordChangeRequired = requiresAnnualPasswordChange(user);
      user.passwordExpiresAt = getPasswordExpiresAt(user);
      user.twoFactorEnabled = Boolean(user.is_two_factor_enabled);
      user.twoFactorChoiceCompleted = Boolean(user.two_factor_choice_completed);
      user.userAgreementAccepted = Boolean(user.user_agreement_accepted_at);
      const safeUser = { ...user };
      delete safeUser.password_hash;
      delete safeUser.previous_password_hash;
      delete safeUser.two_factor_secret;
      delete safeUser.backup_codes;

      res.json({
        success: true,
        user: {
          ...safeUser,
          profileImage: user.profile_image,
          profileImageSource: user.profile_image_source
        }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Server error fetching profile' });
    }
  };

  handlers.acceptUserAgreement = async (req, res) => {
    if (req.user.purpose !== 'user_agreement') {
      return res.status(403).json({ success: false, message: 'Token persetujuan pengguna tidak valid.' });
    }
    if (req.body?.accepted !== true) {
      return res.status(400).json({ success: false, message: 'Persetujuan pengguna wajib diberikan.' });
    }

    try {
      const result = await db.query(
        `UPDATE users
         SET user_agreement_accepted_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND is_active = true
         RETURNING *`,
        [req.user.id]
      );
      const user = result.rows[0];
      if (!user) return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });

      user.roles = await resolveUserRoles(user.id);
      user.roles = user.roles.length ? user.roles : [getPrimaryRole(user.roles)];
      await logSuccessfulLogin(user, 'user_agreement');
      const role = getPrimaryRole(user.roles);
      const passwordChangeRequired = requiresAnnualPasswordChange(user);
      const token = jwt.sign({
        id: user.id,
        email: user.email,
        nip: user.nip,
        role,
        roles: user.roles,
        name: user.full_name,
        department: user.department,
        passwordChangeRequired,
        passwordExpiresAt: getPasswordExpiresAt(user)
      }, jwtSecret, { expiresIn: '24h' });

      const safeUser = { ...user };
      delete safeUser.password_hash;
      delete safeUser.previous_password_hash;
      delete safeUser.two_factor_secret;
      delete safeUser.backup_codes;

      return res.json({
        success: true,
        token,
        user: {
          ...safeUser,
          role,
          roles: user.roles,
          teams: await getUserTeams(user.id),
          passwordChangeRequired,
          passwordExpiresAt: getPasswordExpiresAt(user),
          twoFactorEnabled: Boolean(user.is_two_factor_enabled),
          twoFactorChoiceCompleted: Boolean(user.two_factor_choice_completed),
          userAgreementAccepted: true,
          profileImage: user.profile_image,
          profileImageSource: user.profile_image_source
        }
      });
    } catch (error) {
      console.error('acceptUserAgreement error:', error.message);
      return res.status(500).json({ success: false, message: 'Persetujuan pengguna tidak dapat disimpan.' });
    }
  };

  handlers.updateProfile = async (req, res) => {
    const { fullName, newPassword, oldPassword } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Tidak terotentikasi' });
    }

    try {
      await ensurePasswordCols();

      const currentUserRes = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
      if (currentUserRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan' });
      }
      const currentUser = currentUserRes.rows[0];

      const trimmedName = fullName !== undefined ? String(fullName).trim() : currentUser.full_name;
      if (!trimmedName) {
        return res.status(400).json({ success: false, message: 'Nama lengkap tidak boleh kosong' });
      }

      const hasProfileImage = req.body.profileImage !== undefined;
      const profileImage = req.body.profileImage;
      const userRoles = [
        ...(Array.isArray(req.user.roles) ? req.user.roles : []),
        req.user.role
      ].filter(Boolean).map(role => String(role).toUpperCase());
      const isTndAccount = String(currentUser.password_auth_source || '').toUpperCase() === 'TND'
        || String(currentUser.profile_image_source || '').toUpperCase() === 'TND'
        || (Boolean(currentUser.nip) && !userRoles.includes('MASYARAKAT'));
      if (isTndAccount && (
        Boolean(newPassword) ||
        hasProfileImage ||
        (fullName !== undefined && trimmedName !== currentUser.full_name)
      )) {
        return res.status(403).json({
          success: false,
          message: 'Data profil dan kata sandi akun ini dikelola oleh TND dan tidak dapat diubah melalui Helpdesk.'
        });
      }

      let profileImageBytes = 0;
      if (hasProfileImage) {
        if (!userRoles.some(role => ['ADMIN', 'HELPDESK', 'MASYARAKAT'].includes(role))) {
          return res.status(403).json({ success: false, message: 'Unggah foto profil hanya tersedia untuk akun Admin, Helpdesk, dan Masyarakat.' });
        }
        if (currentUser.profile_image_source === 'TND' && !userRoles.includes('ADMIN')) {
          return res.status(403).json({ success: false, message: 'Foto profil akun ini dikelola oleh TND.' });
        }
        if (profileImage !== null) {
          const match = typeof profileImage === 'string'
            ? profileImage.match(/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/)
            : null;
          if (!match) {
            return res.status(400).json({ success: false, message: 'Foto harus berupa JPG, PNG, atau WEBP.' });
          }
          if (profileImage.length > 2 * 1024 * 1024 * 4 / 3 + 64) {
            return res.status(400).json({ success: false, message: 'Ukuran foto maksimal 2 MB.' });
          }
          profileImageBytes = Buffer.from(match[2], 'base64').length;
          if (profileImageBytes === 0 || profileImageBytes > 2 * 1024 * 1024) {
            return res.status(400).json({ success: false, message: 'Ukuran foto maksimal 2 MB.' });
          }
        }
      }

      if (req.user.passwordChangeRequired && !newPassword) {
        return res.status(400).json({
          success: false,
          requiresPasswordChange: true,
          message: 'Anda wajib mengganti kata sandi untuk melanjutkan.'
        });
      }

      if (newPassword) {
        if (!oldPassword) {
          return res.status(400).json({ success: false, message: 'Kata sandi lama wajib diisi sebelum mengubah kata sandi baru.' });
        }

        const isOldValid = await verifyPassword(oldPassword, currentUser.password_hash);
        if (!isOldValid) {
          return res.status(400).json({ success: false, message: 'Kata sandi lama yang Anda masukkan salah.' });
        }

        const passwordFailures = getPasswordPolicyFailures(newPassword);
        if (passwordFailures.length > 0) {
          return res.status(400).json({
            success: false,
            message: `Kata sandi baru belum memenuhi kriteria keamanan: ${passwordFailures.join(', ')}.`
          });
        }

        const salt = await bcrypt.genSalt(10);
        const newHash = await bcrypt.hash(newPassword, salt);

        await db.query(
          `UPDATE users
           SET full_name = $1,
               previous_password_hash = $2,
               password_hash = $3,
               password_changed_at = CURRENT_TIMESTAMP,
               profile_image = CASE WHEN $4 THEN $5 ELSE profile_image END,
               profile_image_source = CASE WHEN $4 THEN CASE WHEN $5::text IS NULL THEN 'NONE' ELSE 'MANUAL' END ELSE profile_image_source END
           WHERE id = $6`,
          [trimmedName, currentUser.password_hash, newHash, hasProfileImage, hasProfileImage ? profileImage : null, userId]
        );
      } else {
        await db.query(
          `UPDATE users
           SET full_name = $1,
               profile_image = CASE WHEN $2 THEN $3 ELSE profile_image END,
               profile_image_source = CASE WHEN $2 THEN CASE WHEN $3::text IS NULL THEN 'NONE' ELSE 'MANUAL' END ELSE profile_image_source END
           WHERE id = $4`,
          [trimmedName, hasProfileImage, hasProfileImage ? profileImage : null, userId]
        );
      }

      const updatedRes = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
      const updatedUser = updatedRes.rows[0];
      updatedUser.roles = await resolveUserRoles(updatedUser.id);
      const primaryRole = getPrimaryRole(updatedUser.roles);
      const passwordChangeRequired = newPassword ? false : requiresAnnualPasswordChange(updatedUser);
      const token = newPassword
        ? jwt.sign(
          {
            id: updatedUser.id, email: updatedUser.email, role: primaryRole, roles: updatedUser.roles,
            name: updatedUser.full_name, department: updatedUser.department, passwordChangeRequired,
            passwordExpiresAt: getPasswordExpiresAt(updatedUser)
          },
          jwtSecret,
          { expiresIn: '24h' }
        )
        : undefined;

      return res.json({
        success: true,
        message: 'Profil berhasil diperbarui',
        ...(token ? { token } : {}),
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.full_name,
          role: primaryRole,
          roles: updatedUser.roles,
          department: updatedUser.department,
          profileImage: updatedUser.profile_image,
          profileImageSource: updatedUser.profile_image_source,
          profile_image: updatedUser.profile_image,
          profile_image_source: updatedUser.profile_image_source,
          teams: await getUserTeams(updatedUser.id),
          passwordChangeRequired,
          passwordExpiresAt: getPasswordExpiresAt(updatedUser),
          twoFactorEnabled: Boolean(updatedUser.is_two_factor_enabled),
          twoFactorChoiceCompleted: Boolean(updatedUser.two_factor_choice_completed)
        }
      });
    } catch (err) {
      console.error('updateProfile error:', err);
      return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server saat memperbarui profil' });
    }
  };


  return handlers;
};

module.exports = createProfileController;
