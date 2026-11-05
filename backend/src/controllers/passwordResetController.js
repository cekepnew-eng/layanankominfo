const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { verifySync } = require('otplib');
const { sendResetOtpEmail } = require('../services/emailService');
const { getPasswordPolicyFailures } = require('../utils/passwordPolicy');

const createPasswordResetController = ({
  db,
  ensurePasswordCols,
  verifyPassword,
  decrypt,
  jwtSecret,
  maskEmail
}) => {
  const handlers = {};

  // Password recovery handlers
  handlers.requestResetOtp = async (req, res) => {
    const identifier = (req.body.identifier || req.body.email || '').trim();
    if (!identifier) {
      return res.status(400).json({ success: false, message: 'Email atau NIP wajib diisi.' });
    }

    try {
      await ensurePasswordCols();

      // Cari user aktif berdasarkan email ATAU nip
      const userRes = await db.query(
        `SELECT id, full_name, email, nip, is_active, password_auth_source, profile_image_source FROM users
         WHERE is_active = true
           AND (LOWER(email) = LOWER($1) OR nip = $1)
         LIMIT 1`,
        [identifier]
      );

      if (userRes.rows.length === 0) {
        return res.json({
          success: true,
          message: 'Jika akun dengan data tersebut terdaftar dan memiliki email, kode pemulihan akan dikirim.'
        });
      }

      const user = userRes.rows[0];

      if (
        String(user.password_auth_source || '').toUpperCase() === 'TND'
        || String(user.profile_image_source || '').toUpperCase() === 'TND'
        || user.nip
      ) {
        return res.json({
          success: true,
          message: 'Jika akun dapat dipulihkan melalui layanan ini, kode pemulihan akan dikirim.'
        });
      }

      if (!user.email || !user.email.includes('@')) {
        return res.json({
          success: true,
          message: 'Jika akun dengan data tersebut terdaftar dan memiliki email, kode pemulihan akan dikirim.'
        });
      }

      const targetEmail = user.email.toLowerCase().trim();

      // Cooldown 60 detik antar permintaan OTP untuk email yang sama
      const cooldownRes = await db.query(
        `SELECT created_at FROM password_reset_otps
         WHERE email = $1 AND is_used = false AND created_at > NOW() - INTERVAL '60 seconds'
         ORDER BY created_at DESC
         LIMIT 1`,
        [targetEmail]
      );

      if (cooldownRes.rows.length > 0) {
        return res.json({
          success: true,
          message: 'Jika akun terdaftar dan memiliki email, kode pemulihan telah dikirim. Periksa inbox atau spam.'
        });
      }

      // Nonaktifkan OTP lama yang belum terpakai untuk email ini
      await db.query(
        `UPDATE password_reset_otps SET is_used = true WHERE email = $1 AND is_used = false`,
        [targetEmail]
      );

      // Buat kode OTP 6-digit acak
      const rawOtp = crypto.randomInt(100000, 1000000).toString();
      const otpHash = crypto.createHash('sha256').update(rawOtp).digest('hex');
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 menit

      // Simpan hash ke database
      await db.query(
        `INSERT INTO password_reset_otps (email, otp_hash, attempts, is_used, expires_at)
         VALUES ($1, $2, 0, false, $3)`,
        [targetEmail, otpHash, expiresAt]
      );

      try {
        await sendResetOtpEmail({
          to: targetEmail,
          name: user.full_name,
          otp: rawOtp
        });
      } catch (err) {
        await db.query('UPDATE password_reset_otps SET is_used = true WHERE email = $1 AND is_used = false', [targetEmail]);
        throw err;
      }

      return res.json({
        success: true,
        message: 'Jika akun terdaftar dan memiliki email, kode pemulihan telah dikirim. Kode berlaku selama 10 menit.'
      });
    } catch (err) {
      console.error('Error in requestResetOtp:', err);
      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan sistem saat memproses permintaan reset kata sandi.'
      });
    }
  };

  handlers.verifyReset2FA = async (req, res) => {
    const identifier = String(req.body.identifier || req.body.email || '').trim();
    const otp = String(req.body.otp || '').trim();

    if (!identifier || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({ success: false, isOtpError: true, message: 'Masukkan NIP/email dan kode authenticator 6 digit.' });
    }

    try {
      await ensurePasswordCols();
      const userRes = await db.query(
        `SELECT id, email, nip, two_factor_secret, is_two_factor_enabled, password_auth_source, profile_image_source
         FROM users
         WHERE is_active = true AND (LOWER(email) = LOWER($1) OR nip = $1)
         LIMIT 1`,
        [identifier]
      );
      const user = userRes.rows[0];

      if (!user || !user.is_two_factor_enabled || !user.two_factor_secret || !user.email) {
        return res.status(400).json({
          success: false,
          isOtpError: true,
          message: 'Kode authenticator salah atau tidak valid untuk pemulihan ini.'
        });
      }

      if (
        String(user.password_auth_source || '').toUpperCase() === 'TND'
        || String(user.profile_image_source || '').toUpperCase() === 'TND'
        || user.nip
      ) {
        return res.status(400).json({
          success: false,
          isOtpError: true,
          message: 'Reset kata sandi akun TND tidak tersedia melalui Helpdesk.'
        });
      }

      const secret = decrypt(user.two_factor_secret);
      const result = verifySync({ strategy: 'totp', token: otp, secret, window: 2 });
      if (!result.valid) {
        return res.status(400).json({
          success: false,
          isOtpError: true,
          message: 'Kode authenticator salah atau tidak valid untuk pemulihan ini.'
        });
      }

      const cleanEmail = user.email.toLowerCase().trim();
      await db.query(
        'UPDATE password_reset_otps SET is_used = true WHERE email = $1 AND is_used = false',
        [cleanEmail]
      );

      const grantSecret = crypto.randomBytes(32).toString('hex');
      const grantRes = await db.query(
        `INSERT INTO password_reset_otps (email, otp_hash, attempts, is_used, expires_at)
         VALUES ($1, $2, 0, false, NOW() + INTERVAL '15 minutes')
         RETURNING id`,
        [cleanEmail, crypto.createHash('sha256').update(grantSecret).digest('hex')]
      );

      const resetToken = jwt.sign(
        { email: cleanEmail, otpRecordId: grantRes.rows[0].id, purpose: 'reset_password_allowed' },
        jwtSecret,
        { expiresIn: '15m' }
      );

      return res.json({
        success: true,
        message: 'Kode authenticator berhasil diverifikasi.',
        resetToken,
        maskedEmail: maskEmail(cleanEmail)
      });
    } catch (err) {
      console.error('Error in verifyReset2FA:', err);
      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat memverifikasi 2FA. Silakan coba lagi.'
      });
    }
  };

  handlers.validateResetOtp = async (req, res) => {
    const identifier = String(req.body.identifier || req.body.email || '').trim();
    const otp = req.body.otp;
    const cleanOtp = String(otp || '').trim();

    if (!identifier || !cleanOtp) {
      return res.status(400).json({ success: false, message: 'Email/NIP dan kode OTP wajib diisi.' });
    }

    if (cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      return res.status(400).json({ success: false, isOtpError: true, message: 'Kode OTP harus berupa 6 digit angka.' });
    }

    try {
      await ensurePasswordCols();
      const userRes = await db.query(
        `SELECT email FROM users
         WHERE is_active = true AND (LOWER(email) = LOWER($1) OR nip = $1)
         LIMIT 1`,
        [identifier]
      );
      const cleanEmail = String(userRes.rows[0]?.email || '').toLowerCase().trim();
      if (!cleanEmail) {
        return res.status(400).json({
          success: false,
          isOtpError: true,
          message: 'Kode OTP tidak valid atau sudah kedaluwarsa. Silakan minta kode baru.'
        });
      }

      const otpRes = await db.query(
        `SELECT * FROM password_reset_otps
         WHERE email = $1 AND is_used = false AND expires_at > NOW()
         ORDER BY created_at DESC
         LIMIT 1`,
        [cleanEmail]
      );

      if (otpRes.rows.length === 0) {
        return res.status(400).json({
          success: false,
          isOtpError: true,
          message: 'Kode OTP yang Anda masukkan sudah kedaluwarsa atau tidak valid. Silakan minta kode OTP baru.'
        });
      }

      const otpRecord = otpRes.rows[0];

      if (otpRecord.attempts >= 5) {
        await db.query(`UPDATE password_reset_otps SET is_used = true WHERE id = $1`, [otpRecord.id]);
        return res.status(400).json({
          success: false,
          isOtpError: true,
          message: 'Batas percobaan kode OTP telah habis (maksimal 5 kali). Silakan minta kode baru.'
        });
      }

      const inputHash = crypto.createHash('sha256').update(cleanOtp).digest('hex');
      if (inputHash !== otpRecord.otp_hash) {
        const nextAttempts = otpRecord.attempts + 1;
        await db.query(`UPDATE password_reset_otps SET attempts = $1 WHERE id = $2`, [nextAttempts, otpRecord.id]);
        const remaining = Math.max(0, 5 - nextAttempts);
        return res.status(400).json({
          success: false,
          isOtpError: true,
          message: `Kode OTP yang kamu masukkan salah. Sisa kesempatan: ${remaining} kali. Silakan coba lagi!`
        });
      }

      await db.query(
        `UPDATE password_reset_otps
         SET expires_at = NOW() + INTERVAL '15 minutes'
         WHERE id = $1 AND is_used = false`,
        [otpRecord.id]
      );

      const resetToken = jwt.sign(
        { email: cleanEmail, otpRecordId: otpRecord.id, purpose: 'reset_password_allowed' },
        jwtSecret,
        { expiresIn: '15m' }
      );

      return res.json({
        success: true,
        message: 'Kode OTP berhasil diverifikasi!',
        resetToken
      });
    } catch (err) {
      console.error('Error in validateResetOtp:', err);
      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan sistem saat memvalidasi kode OTP.'
      });
    }
  };

  handlers.verifyResetOtp = async (req, res) => {
    const { email, otp, newPassword, confirmPassword, resetToken } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Kata sandi baru wajib diisi.'
      });
    }

    const identifier = String(email || '').trim();
    let cleanEmail = identifier.toLowerCase();
    let otpRecordId = null;

    if (resetToken) {
      try {
        const decoded = jwt.verify(resetToken, jwtSecret);
        if (
          decoded.purpose !== 'reset_password_allowed' ||
          typeof decoded.email !== 'string' ||
          !Number.isInteger(Number(decoded.otpRecordId))
        ) {
          return res.status(400).json({
            success: false,
            message: 'Sesi reset kata sandi tidak valid. Silakan ulangi verifikasi.'
          });
        }
        cleanEmail = decoded.email;
        otpRecordId = Number(decoded.otpRecordId);
      } catch (e) {
        return res.status(400).json({
          success: false,
          message: 'Sesi reset kata sandi telah kedaluwarsa. Silakan ulangi verifikasi OTP.'
        });
      }
    }

    const passwordFailures = getPasswordPolicyFailures(newPassword);
    if (passwordFailures.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Kata sandi baru belum memenuhi kriteria keamanan: ${passwordFailures.join(', ')}.`
      });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Konfirmasi kata sandi tidak cocok dengan kata sandi baru.'
      });
    }

    try {
      await ensurePasswordCols();

      if (!resetToken) {
        const accountRes = await db.query(
          `SELECT email FROM users
           WHERE is_active = true AND (LOWER(email) = LOWER($1) OR nip = $1)
           LIMIT 1`,
          [identifier]
        );
        cleanEmail = String(accountRes.rows[0]?.email || '').toLowerCase().trim();
        if (!cleanEmail) {
          return res.status(400).json({
            success: false,
            isOtpError: true,
            message: 'Kode OTP tidak valid atau sudah kedaluwarsa. Silakan minta kode baru.'
          });
        }

        const cleanOtp = String(otp || '').trim();
        const otpRes = await db.query(
          `SELECT * FROM password_reset_otps
           WHERE email = $1 AND is_used = false AND expires_at > NOW()
           ORDER BY created_at DESC
           LIMIT 1`,
          [cleanEmail]
        );

        if (otpRes.rows.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Kode OTP tidak valid atau sudah kedaluwarsa. Silakan minta kode OTP baru.'
          });
        }

        const otpRecord = otpRes.rows[0];
        otpRecordId = otpRecord.id;

        const inputHash = crypto.createHash('sha256').update(cleanOtp).digest('hex');
        if (inputHash !== otpRecord.otp_hash) {
          const nextAttempts = otpRecord.attempts + 1;
          await db.query(
            `UPDATE password_reset_otps
             SET attempts = $1, is_used = CASE WHEN $1 >= 5 THEN true ELSE is_used END
             WHERE id = $2`,
            [nextAttempts, otpRecord.id]
          );
          const remaining = Math.max(0, 5 - nextAttempts);
          return res.status(400).json({
            success: false,
            isOtpError: true,
            message: remaining > 0
              ? `Kode OTP salah. Sisa percobaan: ${remaining}.`
              : 'Batas percobaan kode OTP habis. Silakan minta kode baru.'
          });
        }

        if (otpRecord.attempts >= 5) {
          await db.query('UPDATE password_reset_otps SET is_used = true WHERE id = $1', [otpRecord.id]);
          return res.status(400).json({
            success: false,
            isOtpError: true,
            message: 'Batas percobaan kode OTP habis. Silakan minta kode baru.'
          });
        }
      }

      // Ambil data user
      const userRes = await db.query(
        `SELECT id, full_name, nip, password_hash, previous_password_hash, password_auth_source, profile_image_source FROM users
         WHERE LOWER(email) = LOWER($1) AND is_active = true
         LIMIT 1`,
        [cleanEmail]
      );

      if (userRes.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Pengguna dengan email ini tidak ditemukan atau sudah tidak aktif.'
        });
      }

      const user = userRes.rows[0];

      if (
        String(user.password_auth_source || '').toUpperCase() === 'TND'
        || String(user.profile_image_source || '').toUpperCase() === 'TND'
        || user.nip
      ) {
        return res.status(400).json({
          success: false,
          message: 'Reset kata sandi akun TND tidak tersedia melalui Helpdesk.'
        });
      }

      // Pastikan kata sandi baru tidak sama dengan kata sandi saat ini
      const isSameAsCurrent = await verifyPassword(newPassword, user.password_hash);
      if (isSameAsCurrent) {
        return res.status(400).json({
          success: false,
          message: 'Kata sandi baru tidak boleh sama dengan kata sandi yang sedang Anda gunakan saat ini.'
        });
      }

      if (resetToken) {
        const grantRes = await db.query(
          `UPDATE password_reset_otps
           SET is_used = true
           WHERE id = $1 AND email = $2 AND is_used = false AND expires_at > NOW()
           RETURNING id`,
          [otpRecordId, cleanEmail]
        );
        if (grantRes.rows.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Sesi reset kata sandi sudah digunakan atau kedaluwarsa. Silakan ulangi verifikasi.'
          });
        }
      }

      // Hash kata sandi baru menggunakan bcrypt
      const salt = await bcrypt.genSalt(10);
      const newHash = await bcrypt.hash(newPassword, salt);

      // Update password dan simpan riwayat password sebelumnya
      await db.query(
        `UPDATE users
         SET password_hash = $1,
             previous_password_hash = $2,
             password_changed_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [newHash, user.password_hash, user.id]
      );

      // Invalidate every outstanding reset grant for this account.
      await db.query(
        'UPDATE password_reset_otps SET is_used = true WHERE email = $1 AND is_used = false',
        [cleanEmail]
      );

      return res.json({
        success: true,
        message: 'Kata sandi Anda berhasil diperbarui! Silakan masuk dengan kata sandi baru Anda.'
      });
    } catch (err) {
      console.error('Error in verifyResetOtp:', err);
      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan sistem saat memperbarui kata sandi.'
      });
    }
  };


  return handlers;
};

module.exports = createPasswordResetController;
