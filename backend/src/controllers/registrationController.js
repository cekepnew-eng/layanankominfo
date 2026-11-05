const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { sendRegistrationOtpEmail } = require('../services/emailService');
const { getPasswordPolicyFailures } = require('../utils/passwordPolicy');
const { recordActivity } = require('../utils/activityLogger');

const createRegistrationController = ({ db, ensurePasswordCols, maskEmail }) => {
  const handlers = {};

  // Registration handlers
  const normalizeRegistrationEmail = (email) =>
    typeof email === 'string' ? email.trim().toLowerCase() : '';

  const isValidRegistrationEmail = (email) =>
    email.length <= 255 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const hashRegistrationOtp = (otp) =>
    crypto.createHash('sha256').update(otp).digest('hex');

  const registrationOtpMatches = (otp, otpHash) => {
    const inputHash = Buffer.from(hashRegistrationOtp(otp), 'hex');
    const storedHash = Buffer.from(otpHash, 'hex');
    return inputHash.length === storedHash.length && crypto.timingSafeEqual(inputHash, storedHash);
  };

  handlers.requestRegistrationOtp = async (req, res) => {
    const email = normalizeRegistrationEmail(req.body?.email);
    if (!isValidRegistrationEmail(email)) {
      return res.status(400).json({ success: false, message: 'Masukkan alamat email yang valid.' });
    }

    try {
      await ensurePasswordCols();
      const existingUser = await db.query(
        'SELECT id FROM users WHERE LOWER(email) = $1 LIMIT 1',
        [email]
      );
      if (existingUser.rows.length > 0) {
        return res.status(400).json({ success: false, message: 'Email sudah terdaftar.' });
      }

      const cooldown = await db.query(
        `SELECT created_at FROM registration_email_otps
         WHERE email = $1 AND created_at > NOW() - INTERVAL '60 seconds'
         ORDER BY created_at DESC LIMIT 1`,
        [email]
      );
      if (cooldown.rows.length > 0) {
        const secondsRemaining = Math.max(
          1,
          60 - Math.floor((Date.now() - new Date(cooldown.rows[0].created_at).getTime()) / 1000)
        );
        return res.status(429).json({
          success: false,
          message: `Mohon tunggu ${secondsRemaining} detik sebelum meminta kode OTP baru.`
        });
      }

      const otp = crypto.randomInt(0, 1000000).toString().padStart(6, '0');
      const otpHash = hashRegistrationOtp(otp);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await db.query(
        'UPDATE registration_email_otps SET is_used = true WHERE email = $1 AND is_used = false',
        [email]
      );
      const insertedOtp = await db.query(
        `INSERT INTO registration_email_otps (email, otp_hash, attempts, is_used, expires_at)
         VALUES ($1, $2, 0, false, $3) RETURNING id`,
        [email, otpHash, expiresAt]
      );

      try {
        await sendRegistrationOtpEmail({ to: email, otp });
      } catch (emailError) {
        await db.query(
          'UPDATE registration_email_otps SET is_used = true WHERE id = $1',
          [insertedOtp.rows[0].id]
        );
        console.error('Registration OTP email delivery failed:', emailError.message);
        return res.status(503).json({
          success: false,
          message: 'Email OTP belum dapat dikirim. Periksa konfigurasi email lalu coba lagi.'
        });
      }

      return res.json({
        success: true,
        maskedEmail: maskEmail(email),
        message: `Kode verifikasi telah dikirim ke ${maskEmail(email)}. Kode berlaku selama 10 menit.`
      });
    } catch (err) {
      console.error('Error in requestRegistrationOtp:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan sistem saat mengirim kode verifikasi.'
      });
    }
  };

  handlers.verifyRegistrationOtp = async (req, res) => {
    const email = normalizeRegistrationEmail(req.body?.email);
    const otp = typeof req.body?.otp === 'string' ? req.body.otp.trim() : '';

    if (!isValidRegistrationEmail(email) || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: 'Masukkan email yang valid dan kode OTP 6 digit.'
      });
    }

    try {
      await ensurePasswordCols();
      const result = await db.query(
        `SELECT id, otp_hash, attempts, expires_at FROM registration_email_otps
         WHERE email = $1 AND is_used = false
         ORDER BY created_at DESC LIMIT 1`,
        [email]
      );
      const otpRecord = result.rows[0];

      if (!otpRecord || new Date(otpRecord.expires_at) <= new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Kode OTP sudah kedaluwarsa atau tidak valid. Minta kode baru.'
        });
      }

      if (otpRecord.attempts >= 5) {
        await db.query('UPDATE registration_email_otps SET is_used = true WHERE id = $1', [otpRecord.id]);
        return res.status(400).json({
          success: false,
          message: 'Batas percobaan OTP habis. Minta kode verifikasi baru.'
        });
      }

      if (!registrationOtpMatches(otp, otpRecord.otp_hash)) {
        const attempts = otpRecord.attempts + 1;
        await db.query(
          'UPDATE registration_email_otps SET attempts = $1, is_used = $2 WHERE id = $3',
          [attempts, attempts >= 5, otpRecord.id]
        );
        return res.status(400).json({
          success: false,
          message: `Kode OTP salah. Sisa percobaan: ${Math.max(0, 5 - attempts)}.`
        });
      }

      return res.json({ success: true, message: 'Email berhasil diverifikasi.' });
    } catch (err) {
      console.error('Error in verifyRegistrationOtp:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan sistem saat memverifikasi email.'
      });
    }
  };

  handlers.register = async (req, res) => {
    const email = normalizeRegistrationEmail(req.body?.email);
    const { password, fullName, phone } = req.body || {};
    const otp = typeof req.body?.otp === 'string' ? req.body.otp.trim() : '';

    if (!isValidRegistrationEmail(email)) {
      return res.status(400).json({ success: false, message: 'Masukkan alamat email yang valid.' });
    }
    if (typeof fullName !== 'string' || !fullName.trim() || fullName.trim().length > 255) {
      return res.status(400).json({ success: false, message: 'Nama lengkap wajib diisi.' });
    }
    const passwordFailures = getPasswordPolicyFailures(password);
    if (passwordFailures.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Password belum memenuhi kriteria keamanan: ${passwordFailures.join(', ')}.`
      });
    }
    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({ success: false, message: 'Verifikasi email dengan OTP 6 digit terlebih dahulu.' });
    }

    let client;
    let transactionStarted = false;
    try {
      await ensurePasswordCols();
      const hash = await bcrypt.hash(password, 10);
      client = await db.pool.connect();
      await client.query('BEGIN');
      transactionStarted = true;

      const otpResult = await client.query(
        `SELECT id, otp_hash, attempts, expires_at FROM registration_email_otps
         WHERE email = $1 AND is_used = false
         ORDER BY created_at DESC LIMIT 1 FOR UPDATE`,
        [email]
      );
      const otpRecord = otpResult.rows[0];

      if (!otpRecord || new Date(otpRecord.expires_at) <= new Date()) {
        await client.query('ROLLBACK');
        transactionStarted = false;
        return res.status(400).json({
          success: false,
          message: 'Kode OTP sudah kedaluwarsa atau tidak valid. Verifikasi email kembali.'
        });
      }

      if (otpRecord.attempts >= 5) {
        await client.query('UPDATE registration_email_otps SET is_used = true WHERE id = $1', [otpRecord.id]);
        await client.query('COMMIT');
        transactionStarted = false;
        return res.status(400).json({
          success: false,
          message: 'Batas percobaan OTP habis. Minta kode verifikasi baru.'
        });
      }

      if (!registrationOtpMatches(otp, otpRecord.otp_hash)) {
        const attempts = otpRecord.attempts + 1;
        await client.query(
          'UPDATE registration_email_otps SET attempts = $1, is_used = $2 WHERE id = $3',
          [attempts, attempts >= 5, otpRecord.id]
        );
        await client.query('COMMIT');
        transactionStarted = false;
        return res.status(400).json({
          success: false,
          message: `Kode OTP salah. Sisa percobaan: ${Math.max(0, 5 - attempts)}.`
        });
      }

      const roleResult = await client.query("SELECT id FROM roles WHERE name = 'MASYARAKAT'");
      if (roleResult.rows.length === 0) {
        throw new Error('Role MASYARAKAT is not configured');
      }

      const insertResult = await client.query(
        `INSERT INTO users (email, password_hash, full_name, phone_number, department, password_changed_at, password_auth_source)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, 'LOCAL') RETURNING id, email, full_name`,
        [email, hash, fullName.trim(), phone || '00000', 'Masyarakat Umum']
      );
      await client.query(
        'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)',
        [insertResult.rows[0].id, roleResult.rows[0].id]
      );
      await client.query(
        'UPDATE registration_email_otps SET is_used = true WHERE id = $1',
        [otpRecord.id]
      );
      await recordActivity(client, {
        actorId: insertResult.rows[0].id,
        actorName: insertResult.rows[0].full_name,
        actorRole: 'MASYARAKAT',
        activityType: 'user_created',
        description: `Pengguna mendaftarkan akun masyarakat ${insertResult.rows[0].full_name}.`,
        metadata: { targetUserId: insertResult.rows[0].id }
      });
      await client.query('COMMIT');
      transactionStarted = false;

      return res.status(201).json({
        success: true,
        message: 'Registration successful',
        user: insertResult.rows[0]
      });
    } catch (err) {
      if (client && transactionStarted) {
        await client.query('ROLLBACK');
      }
      if (err.code === '23505') {
        return res.status(400).json({ success: false, message: 'Email sudah terdaftar.' });
      }
      console.error('Error during registration:', err.message);
      return res.status(500).json({ success: false, message: 'Server error during registration' });
    } finally {
      if (client) client.release();
    }
  };


  return handlers;
};

module.exports = createRegistrationController;
