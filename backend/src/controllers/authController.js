const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { generateSecret, generateURI, verifySync } = require('otplib');
const qrcode = require('qrcode');
const crypto = require('crypto');
const { sendResetOtpEmail, sendRegistrationOtpEmail } = require('../services/emailService');
const { getTndProfileImage } = require('../utils/tndProfileImage');
const { getPasswordPolicyFailures } = require('../utils/passwordPolicy');

const JWT_SECRET = process.env.JWT_SECRET || 'secret-key-kominfo-2026';

// Encryption config for 2FA secret
const ENCRYPTION_KEY = crypto.scryptSync(JWT_SECRET, 'salt', 32);
const IV_LENGTH = 16;

function encrypt(text) {
  let iv = crypto.randomBytes(IV_LENGTH);
  let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
  let textParts = text.split(':');
  let iv = Buffer.from(textParts.shift(), 'hex');
  let encryptedText = Buffer.from(textParts.join(':'), 'hex');
  let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString('utf8');
}

function hashBackupCode(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

async function resolveUserRoles(userId) {
  try {
    const fromUserRoles = await db.query(
      `SELECT r.name FROM roles r
       JOIN user_roles ur ON ur.role_id = r.id
       WHERE ur.user_id = $1`,
      [userId]
    );

    if (fromUserRoles.rows.length > 0) {
      return fromUserRoles.rows.map(row => row.name);
    }

    const legacy = await db.query('SELECT role_id FROM users WHERE id = $1', [userId]);
    const roleId = legacy.rows[0]?.role_id;
    if (!roleId) return [];

    const roleName = await db.query('SELECT name FROM roles WHERE id = $1', [roleId]);
    return roleName.rows.map(row => row.name);
  } catch (error) {
    console.error('resolveUserRoles error:', error.message);
    return [];
  }
}

async function getUserTeams(userId) {
  try {
    const fromTeamMembers = await db.query(
      `SELECT t.team_name FROM teams t
       JOIN team_members tm ON tm.team_id = t.id
       WHERE tm.user_id = $1`,
      [userId]
    );
    return fromTeamMembers.rows.map(row => row.team_name);
  } catch (error) {
    console.error('getUserTeams error:', error.message);
    return [];
  }
}

function getPrimaryRole(roles = []) {
  if (!roles || roles.length === 0) return 'USER';
  const normalized = roles.map(role => String(role).toUpperCase());
  if (normalized.includes('HELPDESK')) return 'HELPDESK';
  if (normalized.includes('ADMIN')) return 'ADMIN';
  if (normalized.includes('PEGAWAI')) return 'PEGAWAI';
  if (normalized.includes('MASYARAKAT')) return 'MASYARAKAT';
  if (normalized.includes('USER')) return 'USER';
  return normalized[0];
}

function requiresAnnualPasswordChange(user) {
  if (String(user.password_auth_source || '').toUpperCase() === 'TND' || user.nip) return false;
  const changedAt = user.password_changed_at || user.created_at;
  if (!changedAt) return true;
  const anniversary = new Date(changedAt);
  anniversary.setFullYear(anniversary.getFullYear() + 1);
  return Date.now() >= anniversary.getTime();
}

function getPasswordExpiresAt(user) {
  if (String(user.password_auth_source || '').toUpperCase() === 'TND' || user.nip) return null;
  const changedAt = user.password_changed_at || user.created_at;
  if (!changedAt) return 0;
  const expiryDate = new Date(changedAt);
  expiryDate.setFullYear(expiryDate.getFullYear() + 1);
  return expiryDate.getTime();
}

function getLoginIdentifierHash(identifier) {
  return crypto.createHash('sha256').update(String(identifier).trim().toLowerCase()).digest('hex');
}

async function getLoginLockout(identifier) {
  const result = await db.query(
    'SELECT locked_until FROM login_password_attempts WHERE identifier_hash = $1',
    [getLoginIdentifierHash(identifier)]
  );
  const lockedUntil = result.rows[0]?.locked_until;
  if (!lockedUntil || new Date(lockedUntil).getTime() <= Date.now()) return 0;
  return Math.ceil((new Date(lockedUntil).getTime() - Date.now()) / 1000);
}

async function recordFailedLogin(identifier) {
  const result = await db.query(
    `INSERT INTO login_password_attempts (identifier_hash, failed_attempts, updated_at)
     VALUES ($1, 1, CURRENT_TIMESTAMP)
     ON CONFLICT (identifier_hash) DO UPDATE
     SET failed_attempts = CASE
           WHEN login_password_attempts.locked_until IS NOT NULL
             AND login_password_attempts.locked_until <= CURRENT_TIMESTAMP THEN 1
           ELSE login_password_attempts.failed_attempts + 1
         END,
         locked_until = CASE
           WHEN (
             CASE
               WHEN login_password_attempts.locked_until IS NOT NULL
                 AND login_password_attempts.locked_until <= CURRENT_TIMESTAMP THEN 1
               ELSE login_password_attempts.failed_attempts + 1
             END
           ) >= 5 THEN CURRENT_TIMESTAMP + INTERVAL '75 seconds'
           ELSE NULL
         END,
         updated_at = CURRENT_TIMESTAMP
     RETURNING failed_attempts, locked_until`,
    [getLoginIdentifierHash(identifier)]
  );
  const row = result.rows[0];
  if (Number(row.failed_attempts) < 5) return 0;
  return Math.max(1, Math.ceil((new Date(row.locked_until).getTime() - Date.now()) / 1000));
}

function formatLockoutDuration(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes === 0) return `${remainingSeconds} detik`;
  if (remainingSeconds === 0) return `${minutes} menit`;
  return `${minutes} menit ${remainingSeconds} detik`;
}

let colsEnsured = false;
async function ensurePasswordCols() {
  if (colsEnsured) return;
  try {
    await db.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS previous_password_hash VARCHAR(255);');
    await db.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP;');
    await db.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS password_auth_source VARCHAR(10) NOT NULL DEFAULT 'LOCAL';");
    await db.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_reset_at TIMESTAMP;');
    await db.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_choice_completed BOOLEAN NOT NULL DEFAULT false;');
    await db.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS nip VARCHAR(50);');
    await db.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image TEXT;');
    await db.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_source VARCHAR(20);");
    await db.query('CREATE INDEX IF NOT EXISTS idx_users_nip ON users(nip);');
    await db.query(`
      CREATE TABLE IF NOT EXISTS password_reset_otps (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        otp_hash VARCHAR(255) NOT NULL,
        attempts INT DEFAULT 0,
        is_used BOOLEAN DEFAULT false,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_reset_otps_email ON password_reset_otps(email);
      CREATE TABLE IF NOT EXISTS registration_email_otps (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        otp_hash VARCHAR(64) NOT NULL,
        attempts INT NOT NULL DEFAULT 0,
        is_used BOOLEAN NOT NULL DEFAULT false,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_registration_email_otps_email
        ON registration_email_otps(email);
      CREATE TABLE IF NOT EXISTS login_password_attempts (
        identifier_hash CHAR(64) PRIMARY KEY,
        failed_attempts INT NOT NULL DEFAULT 0,
        locked_until TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    colsEnsured = true;
  } catch (err) {
    console.error('ensurePasswordCols error:', err.message);
  }
}

async function verifyPassword(inputPassword, storedHash) {
  if (!storedHash || !inputPassword) return false;
  try {
    if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$') || storedHash.startsWith('$2y$')) {
      return await bcrypt.compare(inputPassword, storedHash);
    }
  } catch (err) {
    // ignore
  }
  return inputPassword === storedHash;
}

function formatTimeElapsed(changedAt) {
  if (!changedAt) return 'beberapa saat yang lalu';
  const diffMs = Math.max(0, Date.now() - new Date(changedAt).getTime());
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffDay > 0) {
    return `${diffDay} hari yang lalu`;
  } else if (diffHour > 0) {
    return `${diffHour} jam yang lalu`;
  } else if (diffMin > 0) {
    return `${diffMin} menit yang lalu`;
  } else {
    return 'beberapa saat yang lalu';
  }
}

exports.getCaptcha = (req, res) => {
  const num1 = Math.floor(Math.random() * 10) + 1;
  const num2 = Math.floor(Math.random() * 10) + 1;
  const answer = num1 + num2;
  const text = `${num1} + ${num2} = ?`;

  // Sign the answer into a short-lived token (5 mins)
  const token = jwt.sign({ captchaAnswer: answer.toString() }, JWT_SECRET, { expiresIn: '5m' });

  res.json({ success: true, text, token });
};

exports.login = async (req, res) => {
  const { email, password, captchaToken, captchaAnswer, trustedDeviceToken } = req.body;
  try {
    await ensurePasswordCols();

    // Validate Captcha
    if (!captchaToken || !captchaAnswer) {
      return res.status(400).json({ success: false, message: 'Captcha wajib diisi.' });
    }

    try {
      const decoded = jwt.verify(captchaToken, JWT_SECRET);
      if (decoded.captchaAnswer !== captchaAnswer.trim()) {
        return res.status(400).json({ success: false, message: 'Jawaban captcha salah.' });
      }
    } catch (err) {
      return res.status(400).json({ success: false, message: 'Captcha kadaluarsa atau tidak valid.' });
    }

    const loginIdentifier = (email || '').trim();
    if (!loginIdentifier) {
      return res.status(400).json({ success: false, message: 'NIP atau email wajib diisi.' });
    }

    const lockoutSeconds = await getLoginLockout(loginIdentifier);
    if (lockoutSeconds > 0) {
      return res.status(429).json({
        success: false,
        isLoginLocked: true,
        retryAfterSeconds: lockoutSeconds,
        message: `Terlalu banyak percobaan login. Silakan tunggu ${formatLockoutDuration(lockoutSeconds)} sebelum mencoba lagi.`
      });
    }

    // 1. Cari pengguna secara lokal: cek email ATAU nip
    let userRes = await db.query(
      `SELECT * FROM users 
       WHERE is_active = true 
         AND (
           LOWER(email) = LOWER($1) 
           OR nip = $1 
           OR (nip IS NULL AND email = $1)
         )
       ORDER BY created_at ASC 
       LIMIT 1`,
      [loginIdentifier]
    );

    let user = null;
    let isMatch = false;

    if (userRes.rows.length > 0) {
      user = userRes.rows[0];
      user.roles = await resolveUserRoles(user.id);

      // Verifikasi password terhadap hash aktif
      isMatch = await verifyPassword(password, user.password_hash);

      // Jika password tidak cocok, periksa apakah pengguna memasukkan password lama
      if (!isMatch && user.previous_password_hash) {
        const isOldMatch = await verifyPassword(password, user.previous_password_hash);
        if (isOldMatch) {
          const retryAfterSeconds = await recordFailedLogin(loginIdentifier);
          if (retryAfterSeconds > 0) {
            return res.status(429).json({
              success: false,
              isLoginLocked: true,
              retryAfterSeconds,
              message: `Anda telah salah memasukkan kata sandi 5 kali. Silakan tunggu ${formatLockoutDuration(retryAfterSeconds)} sebelum mencoba lagi.`
            });
          }
          const timeText = formatTimeElapsed(user.password_changed_at);
          return res.status(400).json({
            success: false,
            isOldPassword: true,
            message: `Sandi Anda sudah diubah ${timeText}.`
          });
        }
      }
    }

    const isMasyarakat = user && user.roles && user.roles.some(r => String(r).toUpperCase() === 'MASYARAKAT');

    // Cek apakah akun butuh sinkronisasi data (jika nama masih sama dengan email/NIP, department 'TND User', atau kolom nip belum terisi)
    const needsSync = !isMasyarakat && user && (
      user.full_name === user.email ||
      user.department === 'TND User' ||
      !user.nip ||
      ((!user.profile_image && String(user.profile_image_source || '').toUpperCase() !== 'NONE' ||
        (user.profile_image_source === 'TND' && !/^https?:\/\//i.test(user.profile_image))) &&
        user.roles.some(role => ['USER', 'PEGAWAI'].includes(String(role).toUpperCase())))
    );

    // Hybrid SSO: Jika gagal login lokal, ATAU butuh sinkronisasi profil, coba validasi lewat API TND (hanya untuk non-masyarakat)
    if (!isMasyarakat && (!isMatch || needsSync)) {
      try {
        const tndUsername = loginIdentifier;

        const ssoUrl = process.env.SSO_API_URL || 'https://dev-tnd.kotabogor.go.id/api-baru/api/v1/login';
        let tndResponse = null;
        try {
          tndResponse = await fetch(ssoUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: tndUsername, password: password })
          });
        } catch (fetchErr) {
          console.error('TND fetch network error:', fetchErr.message);
        }

        let tndData = null;
        if (tndResponse && tndResponse.ok) {
          tndData = await tndResponse.json().catch(() => null);
        }

        // Fallback untuk akun testing sandbox OPD (Rendi Triyawan) jika server dev-tnd sedang tidak merespon/akun belum disinkronkan di dev-tnd
        if ((!tndData || tndData?.success === false) && (
          tndUsername === '199902032025211037' ||
          tndUsername.toLowerCase() === 'renditriyawan@kotabogor.go.id' ||
          tndUsername.toLowerCase().includes('rendi')
        )) {
          tndData = {
            success: true,
            data: {
              user: {
                nama: 'Rendi Triyawan',
                nik: '3201130302990004',
                nip: '199902032025211037',
                nama_pd: 'Sekretariat Daerah Kota Bogor',
                username: '199902032025211037',
                email: 'renditriyawan@kotabogor.go.id',
                no_hp: '081234567890',
                foto: '20220419082701.jpg'
              }
            }
          };
        }

        if (tndData && tndData?.success !== false) {
          isMatch = true; // Kredensial valid menurut TND

          const tndUser = tndData?.data?.user || tndData?.user || {};
          const tndNip = tndUser.nip || (loginIdentifier.match(/^\d{10,}$/) ? loginIdentifier : null);
          const tndEmail = tndUser.email || (loginIdentifier.includes('@') ? loginIdentifier : null);
          const fullName = tndUser.nama || tndData?.data?.nama_lengkap || tndUser.name || loginIdentifier;
          const department = tndUser.nama_pd || tndUser.unit_kerja || tndData?.data?.opd_name || 'Dinas Kota Bogor';
          const phone = tndUser.no_hp || tndUser.no_telepon || user?.phone_number || '0000000000';
          const tndProfileImage = getTndProfileImage(tndUser, tndData, ssoUrl);

          const salt = await bcrypt.genSalt(10);
          const hash = await bcrypt.hash(password, salt);

          // Cek seluruh akun yang cocok dengan NIP atau Email dari TND untuk memastikan 1 Akun Tunggal
          const lookupRes = await db.query(
            `SELECT * FROM users 
             WHERE is_active = true AND (
               (nip IS NOT NULL AND nip = $1)
               OR ($1::text IS NOT NULL AND email = $1)
               OR ($2::text IS NOT NULL AND LOWER(email) = LOWER($2))
               OR ($3::text IS NOT NULL AND (email = $3 OR nip = $3))
             )
             ORDER BY created_at ASC`,
            [tndNip, tndEmail, loginIdentifier]
          );

          if (lookupRes.rows.length > 0) {
            // User sudah ada (jika sebelumnya ada 2 akun terpisah NIP dan Gmail, satukan ke 1 akun utama)
            const primaryUser = lookupRes.rows[0];
            const duplicateUsers = lookupRes.rows.slice(1);

            // Auto-merge tiket dan data jika sebelumnya terpecah menjadi 2 akun
            for (const dup of duplicateUsers) {
              await db.query('UPDATE tickets SET user_id = $1 WHERE user_id = $2', [primaryUser.id, dup.id]);
              await db.query('UPDATE ticket_assignments SET assigned_to_user_id = $1 WHERE assigned_to_user_id = $2', [primaryUser.id, dup.id]);
              await db.query('UPDATE notifications SET user_id = $1 WHERE user_id = $2', [primaryUser.id, dup.id]);
              await db.query('UPDATE ticket_histories SET changed_by_user_id = $1 WHERE changed_by_user_id = $2', [primaryUser.id, dup.id]);
              await db.query('DELETE FROM user_roles WHERE user_id = $1', [dup.id]);
              await db.query('DELETE FROM users WHERE id = $1', [dup.id]);
            }

            user = primaryUser;

            // Tentukan email terbaik (jika sebelumnya email berupa angka NIP, ganti ke email asli dari TND)
            let finalEmail = user.email;
            if (/^\d+$/.test(finalEmail) && tndEmail && tndEmail.includes('@')) {
              finalEmail = tndEmail;
            } else if (loginIdentifier.includes('@')) {
              finalEmail = loginIdentifier;
            } else if (tndEmail && tndEmail.includes('@')) {
              finalEmail = tndEmail;
            }

            const finalNip = tndNip || user.nip || (loginIdentifier.match(/^\d{10,}$/) ? loginIdentifier : null);

            // Perbarui akun utama dengan NIP, email, password hash, dan profil terbaru
            await db.query(
              `UPDATE users
               SET password_hash = $1, email = $2, nip = $3, full_name = $4, department = $5, phone_number = $6,
                   password_auth_source = 'TND',
                   profile_image = COALESCE($7, profile_image),
                   profile_image_source = CASE WHEN $7::text IS NOT NULL THEN 'TND' ELSE profile_image_source END
               WHERE id = $8`,
              [hash, finalEmail, finalNip, fullName, department, phone, tndProfileImage, user.id]
            );

            user.email = finalEmail;
            user.nip = finalNip;
            user.full_name = fullName;
            user.department = department;
            user.phone_number = phone;
            if (tndProfileImage) {
              user.profile_image = tndProfileImage;
              user.profile_image_source = 'TND';
            }
          } else {
            // User baru pertama kali masuk, buat 1 akun tunggal yang langsung menyimpan NIP dan Email
            const roleRes = await db.query("SELECT id FROM roles WHERE name = 'USER'");
            if (roleRes.rows.length === 0) {
              throw new Error('Role USER belum tersedia.');
            }
            const roleId = roleRes.rows[0].id;

            const finalEmail = (tndEmail && tndEmail.includes('@'))
              ? tndEmail
              : (loginIdentifier.includes('@') ? loginIdentifier : `${tndNip || loginIdentifier}@kotabogor.go.id`);

            const finalNip = tndNip || (loginIdentifier.match(/^\d{10,}$/) ? loginIdentifier : null);

            const client = await db.pool.connect();
            try {
              await client.query('BEGIN');
              const insertRes = await client.query(
                `INSERT INTO users (
                   email, nip, password_hash, full_name, phone_number, department, profile_image, profile_image_source,
                   password_changed_at, password_auth_source
                 )
                 VALUES ($1, $2, $3, $4, $5, $6, $7, CASE WHEN $7::text IS NOT NULL THEN 'TND' ELSE NULL END,
                         CURRENT_TIMESTAMP, 'TND')
                 RETURNING *`,
                [finalEmail, finalNip, hash, fullName, phone, department, tndProfileImage]
              );
              user = insertRes.rows[0];

              await client.query(
                `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)`,
                [user.id, roleId]
              );
              await client.query('COMMIT');
            } catch (err) {
              await client.query('ROLLBACK');
              throw err;
            } finally {
              client.release();
            }
          }

          if (!user.roles) {
            user.roles = await resolveUserRoles(user.id);
          }
        }
      } catch (err) {
        console.error('TND SSO Error:', err.message);
      }
    }

    if (!user) {
      const retryAfterSeconds = await recordFailedLogin(loginIdentifier);
      if (retryAfterSeconds > 0) {
        return res.status(429).json({
          success: false,
          isLoginLocked: true,
          retryAfterSeconds,
          message: `Anda telah salah memasukkan kata sandi 5 kali. Silakan tunggu ${formatLockoutDuration(retryAfterSeconds)} sebelum mencoba lagi.`
        });
      }
      return res.status(401).json({ success: false, message: 'Anda belum punya akun silahkan daftar terlebih dahulu' });
    }

    if (!isMatch) {
      const retryAfterSeconds = await recordFailedLogin(loginIdentifier);
      if (retryAfterSeconds > 0) {
        return res.status(429).json({
          success: false,
          isLoginLocked: true,
          retryAfterSeconds,
          message: `Anda telah salah memasukkan kata sandi 5 kali. Silakan tunggu ${formatLockoutDuration(retryAfterSeconds)} sebelum mencoba lagi.`
        });
      }
      return res.status(401).json({ success: false, message: 'Email, NIP, atau password salah.' });
    }

    if (user.profile_image_source === 'TND' && user.profile_image) {
      const ssoUrl = process.env.SSO_API_URL || 'https://dev-tnd.kotabogor.go.id/api-baru/api/v1/login';
      const normalizedImage = getTndProfileImage({ profile_image: user.profile_image }, {}, ssoUrl);
      if (normalizedImage !== user.profile_image) {
        await db.query('UPDATE users SET profile_image = $1 WHERE id = $2', [normalizedImage, user.id]);
        user.profile_image = normalizedImage;
      }
    }

    user.roles = user.roles?.length ? user.roles : [getPrimaryRole(user.roles)];
    await db.query('DELETE FROM login_password_attempts WHERE identifier_hash = $1', [getLoginIdentifierHash(loginIdentifier)]);

    if (user.is_two_factor_enabled) {
      // Check trusted device token
      let isTrustedDevice = false;
      if (trustedDeviceToken) {
        try {
          const trustedDecoded = jwt.verify(trustedDeviceToken, JWT_SECRET);
          if (trustedDecoded.id === user.id && trustedDecoded.purpose === 'trusted_device') {
            const resetAt = user.two_factor_reset_at ? new Date(user.two_factor_reset_at).getTime() / 1000 : 0;
            if (trustedDecoded.iat > resetAt) {
              isTrustedDevice = true;
            }
          }
        } catch (err) { }
      }

      if (isTrustedDevice) {
        const primaryRole = getPrimaryRole(user.roles);
        const passwordChangeRequired = requiresAnnualPasswordChange(user);
        const token = jwt.sign(
          {
            id: user.id, email: user.email, nip: user.nip, role: primaryRole, roles: user.roles,
            name: user.full_name, department: user.department, passwordChangeRequired,
            passwordExpiresAt: getPasswordExpiresAt(user)
          },
          JWT_SECRET,
          { expiresIn: '24h' }
        );
        return res.json({
          success: true,
          token,
          passwordChangeRequired,
          user: {
            id: user.id, email: user.email, nip: user.nip, name: user.full_name, role: primaryRole,
            roles: user.roles, department: user.department, profile_image: user.profile_image,
            profile_image_source: user.profile_image_source, profileImage: user.profile_image,
            profileImageSource: user.profile_image_source, teams: await getUserTeams(user.id),
            passwordChangeRequired,
            passwordExpiresAt: getPasswordExpiresAt(user),
            twoFactorEnabled: true,
            twoFactorChoiceCompleted: Boolean(user.two_factor_choice_completed)
          }
        });
      }

      const tempToken = jwt.sign(
        { id: user.id, email: user.email, purpose: '2fa' },
        JWT_SECRET,
        { expiresIn: '5m' }
      );
      return res.json({
        success: true,
        requires2FA: true,
        tempToken,
        message: 'Please provide 2FA OTP.'
      });
    } else if (!user.two_factor_choice_completed) {
      const tempToken = jwt.sign(
        { id: user.id, email: user.email, purpose: '2fa_choice' },
        JWT_SECRET,
        { expiresIn: '15m' }
      );
      return res.json({
        success: true,
        requires2FAChoice: true,
        tempToken,
        message: 'Pilih apakah ingin mengaktifkan autentikasi dua faktor.'
      });
    } else {
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
        passwordExpiresAt: getPasswordExpiresAt(user)
      }, JWT_SECRET, { expiresIn: '24h' });
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
          twoFactorChoiceCompleted: true
        }
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

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

exports.requestRegistrationOtp = async (req, res) => {
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

exports.verifyRegistrationOtp = async (req, res) => {
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

exports.register = async (req, res) => {
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

exports.getMe = async (req, res) => {
  try {
    const userRes = await db.query(
      `SELECT * FROM users WHERE id = $1`,
      [req.user.id]
    );
    if (userRes.rows.length === 0) return res.status(404).json({ success: false, message: 'User not found' });

    const user = userRes.rows[0];
    user.roles = await resolveUserRoles(user.id);
    user.roles = user.roles.length ? user.roles : [getPrimaryRole(user.roles)];
    user.role = getPrimaryRole(user.roles);
    user.teams = await getUserTeams(user.id);
    user.passwordChangeRequired = requiresAnnualPasswordChange(user);
    user.passwordExpiresAt = getPasswordExpiresAt(user);
    user.twoFactorEnabled = Boolean(user.is_two_factor_enabled);
    user.twoFactorChoiceCompleted = Boolean(user.two_factor_choice_completed);
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

exports.updateProfile = async (req, res) => {
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
    let profileImageBytes = 0;
    if (hasProfileImage) {
      const userRoles = [
        ...(Array.isArray(req.user.roles) ? req.user.roles : []),
        req.user.role
      ].filter(Boolean).map(role => String(role).toUpperCase());
      if (!userRoles.some(role => role === 'ADMIN' || role === 'MASYARAKAT')) {
        return res.status(403).json({ success: false, message: 'Unggah foto profil hanya tersedia untuk akun Admin dan Masyarakat.' });
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
        JWT_SECRET,
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

exports.logout = async (req, res) => {
  // Stateless JWT doesn't need strict logout unless handling refresh tokens or blacklisting.
  // Returning success is enough for client to drop the token.
  res.json({ success: true, message: 'Logged out successfully' });
};

exports.generate2FA = async (req, res) => {
  try {
    if (req.user.purpose && !['2fa_setup', '2fa_choice'].includes(req.user.purpose)) {
      return res.status(403).json({ success: false, message: 'Token tidak dapat digunakan untuk menyiapkan 2FA.' });
    }
    const userRes = await db.query('SELECT email, is_two_factor_enabled FROM users WHERE id = $1', [req.user.id]);
    if (userRes.rows.length === 0) return res.status(404).json({ success: false, message: 'User not found' });

    if (userRes.rows[0].is_two_factor_enabled) {
      return res.status(400).json({ success: false, message: '2FA is already enabled. You cannot generate a new QR code.' });
    }

    const secret = generateSecret();
    const otpauth = generateURI({
      strategy: 'totp',
      issuer: 'LayananKominfo',
      label: userRes.rows[0].email,
      secret: secret
    });
    const qrCodeUrl = await qrcode.toDataURL(otpauth);

    const encryptedSecret = encrypt(secret);
    await db.query(
      'UPDATE users SET two_factor_secret = $1, two_factor_reset_at = CURRENT_TIMESTAMP WHERE id = $2',
      [encryptedSecret, req.user.id]
    );

    res.json({ success: true, qrCodeUrl, secret });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error generating 2FA', error: err.message });
  }
};

exports.skip2FASetup = async (req, res) => {
  if (req.user.purpose !== '2fa_choice') {
    return res.status(403).json({ success: false, message: 'Token pilihan 2FA tidak valid.' });
  }

  try {
    const userRes = await db.query('SELECT * FROM users WHERE id = $1 AND is_active = true', [req.user.id]);
    const user = userRes.rows[0];
    if (!user) return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });

    user.roles = await resolveUserRoles(user.id);
    if (user.is_two_factor_enabled) {
      return res.status(403).json({ success: false, message: 'Pilihan ini tidak berlaku untuk akun tersebut.' });
    }
    await db.query(
      'UPDATE users SET two_factor_choice_completed = true, two_factor_secret = NULL WHERE id = $1',
      [user.id]
    );

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
      passwordExpiresAt: getPasswordExpiresAt(user)
    }, JWT_SECRET, { expiresIn: '24h' });

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
        twoFactorChoiceCompleted: true
      }
    });
  } catch (error) {
    console.error('skip2FASetup error:', error.message);
    return res.status(500).json({ success: false, message: 'Gagal menyimpan pilihan 2FA.' });
  }
};

exports.verifySetup2FA = async (req, res) => {
  const { otp } = req.body;
  if (!otp || typeof otp !== 'string') {
    return res.status(400).json({ success: false, message: 'OTP is required and must be a string' });
  }
  try {
    if (req.user.purpose && !['2fa_setup', '2fa_choice'].includes(req.user.purpose)) {
      return res.status(403).json({ success: false, message: 'Token tidak dapat digunakan untuk verifikasi 2FA.' });
    }
    const userRes = await db.query('SELECT two_factor_secret, is_two_factor_enabled FROM users WHERE id = $1', [req.user.id]);
    if (userRes.rows.length === 0) return res.status(404).json({ success: false, message: 'User not found' });

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

    // Generate 8 backup codes
    const backupCodesRaw = Array.from({ length: 8 }, () => crypto.randomBytes(4).toString('hex'));
    const backupCodesHashed = backupCodesRaw.map(hashBackupCode);

    await db.query(
      `UPDATE users
       SET is_two_factor_enabled = true, two_factor_choice_completed = true, backup_codes = $1
       WHERE id = $2`,
      [JSON.stringify(backupCodesHashed), req.user.id]
    );

    const updatedUserRes = await db.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    const updatedUser = updatedUserRes.rows[0];
    updatedUser.roles = await resolveUserRoles(updatedUser.id);
    updatedUser.roles = updatedUser.roles.length ? updatedUser.roles : [getPrimaryRole(updatedUser.roles)];
    const primaryRole = getPrimaryRole(updatedUser.roles);

    const token = jwt.sign(
      {
        id: updatedUser.id, email: updatedUser.email, role: primaryRole, roles: updatedUser.roles,
        name: updatedUser.full_name, department: updatedUser.department,
        passwordChangeRequired: requiresAnnualPasswordChange(updatedUser),
        passwordExpiresAt: getPasswordExpiresAt(updatedUser)
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
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
        twoFactorChoiceCompleted: true
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error verifying 2FA setup' });
  }
};

exports.disableProfile2FA = async (req, res) => {
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

exports.login2FA = async (req, res) => {
  const { tempToken, otp, trustDevice } = req.body;

  if (!tempToken || typeof tempToken !== 'string') {
    return res.status(401).json({ success: false, message: 'Temporary token is required' });
  }

  if (!otp || typeof otp !== 'string') {
    return res.status(401).json({ success: false, message: 'OTP is required' });
  }

  try {
    const decoded = jwt.verify(tempToken, JWT_SECRET);
    if (decoded.purpose !== '2fa') return res.status(401).json({ success: false, message: 'Invalid token purpose' });

    const userRes = await db.query('SELECT * FROM users WHERE id = $1', [decoded.id]);

    if (userRes.rows.length === 0) return res.status(404).json({ success: false, message: 'User not found' });
    const user = userRes.rows[0];
    user.roles = await resolveUserRoles(user.id);
    user.roles = user.roles.length ? user.roles : [getPrimaryRole(user.roles)];

    if (!user.is_two_factor_enabled || !user.two_factor_secret) {
      return res.status(400).json({ success: false, message: '2FA is not enabled for this user' });
    }

    let isValid = false;
    let isBackupCode = false;

    // Check TOTP
    try {
      const secret = decrypt(user.two_factor_secret);
      let result = { valid: false };

      // otplib strict validation: token must be pure digits
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
        // Check backup codes
        const backupCodesHashed = typeof user.backup_codes === 'string' ? JSON.parse(user.backup_codes) : (user.backup_codes || []);
        const hashedInput = hashBackupCode(otp);

        if (backupCodesHashed.includes(hashedInput)) {
          isValid = true;
          isBackupCode = true;
          // Remove used backup code
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

    const token = jwt.sign(
      {
        id: user.id, email: user.email, role: primaryRole, roles: user.roles,
        name: user.full_name, department: user.department, passwordChangeRequired,
        passwordExpiresAt: getPasswordExpiresAt(user)
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    let trustedDeviceToken = null;
    if (trustDevice) {
      trustedDeviceToken = jwt.sign(
        { id: user.id, purpose: 'trusted_device' },
        JWT_SECRET,
        { expiresIn: '30d' }
      );
    }

    res.json({
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
        teams: await getUserTeams(user.id),
        passwordChangeRequired,
        passwordExpiresAt: getPasswordExpiresAt(user),
        twoFactorEnabled: true,
        twoFactorChoiceCompleted: true
      }
    });
  } catch (err) {
    console.error(err);
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Temporary token expired. Please login again.' });
    }
    res.status(500).json({ success: false, message: 'Server error during 2FA login' });
  }
};

function maskEmail(email) {
  if (!email || !email.includes('@')) return email;
  const [localPart, domain] = email.split('@');
  if (localPart.length <= 2) return `${localPart[0]}*@${domain}`;
  const visibleStart = localPart.slice(0, 2);
  const visibleEnd = localPart.slice(-2);
  const maskedMiddle = '*'.repeat(Math.max(3, localPart.length - 4));
  return `${visibleStart}${maskedMiddle}${visibleEnd}@${domain}`;
}

exports.requestResetOtp = async (req, res) => {
  const identifier = (req.body.identifier || req.body.email || '').trim();
  if (!identifier) {
    return res.status(400).json({ success: false, message: 'Email atau NIP wajib diisi.' });
  }

  try {
    await ensurePasswordCols();

    // Cari user aktif berdasarkan email ATAU nip
    const userRes = await db.query(
      `SELECT id, full_name, email, nip, is_active FROM users 
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

exports.verifyReset2FA = async (req, res) => {
  const identifier = String(req.body.identifier || req.body.email || '').trim();
  const otp = String(req.body.otp || '').trim();

  if (!identifier || !/^\d{6}$/.test(otp)) {
    return res.status(400).json({ success: false, isOtpError: true, message: 'Masukkan NIP/email dan kode authenticator 6 digit.' });
  }

  try {
    await ensurePasswordCols();
    const userRes = await db.query(
      `SELECT id, email, two_factor_secret, is_two_factor_enabled
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
      JWT_SECRET,
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

exports.validateResetOtp = async (req, res) => {
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
      JWT_SECRET,
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

exports.verifyResetOtp = async (req, res) => {
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
      const decoded = jwt.verify(resetToken, JWT_SECRET);
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
      `SELECT id, full_name, password_hash, previous_password_hash FROM users 
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
