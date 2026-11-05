const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const createTwoFactorController = require('./twoFactorController');
const createRegistrationController = require('./registrationController');
const createPasswordResetController = require('./passwordResetController');
const createProfileController = require('./profileController');
const { getTndProfileImage } = require('../utils/tndProfileImage');
const { recordActivity } = require('../utils/activityLogger');

const JWT_SECRET = process.env.JWT_SECRET || 'secret-key-kominfo-2026';

const logSuccessfulLogin = async (user, method = 'password') => {
  const roles = user.roles?.length ? user.roles : await resolveUserRoles(user.id);
  await recordActivity(db, {
    actorId: user.id,
    actorName: user.full_name,
    actorRole: roles.join(', ') || 'UNKNOWN',
    activityType: 'login',
    description: 'Pengguna berhasil login.',
    metadata: { method }
  });
};

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

function expireOldUserAgreement(user) {
  if (!user?.user_agreement_accepted_at) return;

  const expiresAt = new Date(user.user_agreement_accepted_at);
  if (Number.isNaN(expiresAt.getTime())) {
    user.user_agreement_accepted_at = null;
    return;
  }

  const originalDay = expiresAt.getUTCDate();
  expiresAt.setUTCDate(1);
  expiresAt.setUTCMonth(expiresAt.getUTCMonth() + 4);
  const lastDayOfMonth = new Date(Date.UTC(
    expiresAt.getUTCFullYear(),
    expiresAt.getUTCMonth() + 1,
    0
  )).getUTCDate();
  expiresAt.setUTCDate(Math.min(originalDay, lastDayOfMonth));

  if (expiresAt.getTime() <= Date.now()) {
    user.user_agreement_accepted_at = null;
  }
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
    await db.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS user_agreement_accepted_at TIMESTAMPTZ;');
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


function maskEmail(email) {
  if (!email || !email.includes('@')) return email;
  const [localPart, domain] = email.split('@');
  if (localPart.length <= 2) return `${localPart[0]}*@${domain}`;
  const visibleStart = localPart.slice(0, 2);
  const visibleEnd = localPart.slice(-2);
  const maskedMiddle = '*'.repeat(Math.max(3, localPart.length - 4));
  return `${visibleStart}${maskedMiddle}${visibleEnd}@${domain}`;
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

// Authentication and session handlers
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

    const loginIdentifier = typeof email === 'string' ? email.trim() : '';
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
           LOWER(BTRIM(email)) = LOWER($1)
           OR BTRIM(nip) = $1
         )
       ORDER BY created_at ASC 
       LIMIT 1`,
      [loginIdentifier]
    );

    let user = null;
    let isMatch = false;
    let isTndPasswordAccount = false;

    if (userRes.rows.length > 0) {
      user = userRes.rows[0];
      user.roles = await resolveUserRoles(user.id);
      const userRoleNames = user.roles.map(role => String(role).toUpperCase());
      const passwordAuthSource = String(user.password_auth_source || '').toUpperCase();
      isTndPasswordAccount = passwordAuthSource === 'TND'
        || (passwordAuthSource !== 'LOCAL' && (
          String(user.profile_image_source || '').toUpperCase() === 'TND'
          || (Boolean(user.nip) && !userRoleNames.includes('MASYARAKAT'))
        ));

      if (!isTndPasswordAccount) {
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
    }

    const isMasyarakat = user && user.roles && user.roles.some(r => String(r).toUpperCase() === 'MASYARAKAT');

    // Refresh TND-linked profiles on login, even when the account uses a local password.
    const isTndLinkedProfile = String(user?.password_auth_source || '').toUpperCase() === 'TND'
      || String(user?.profile_image_source || '').toUpperCase() === 'TND';
    if (isTndPasswordAccount || (!isMasyarakat && (!isMatch || isTndLinkedProfile))) {
      try {
        const tndUsername = loginIdentifier;

        const ssoUrl = process.env.SSO_API_URL || 'https://tnd.kotabogor.go.id/api-baru/api/v1/login';
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

        if (isTndPasswordAccount && (!tndResponse || tndResponse.status >= 500)) {
          return res.status(503).json({
            success: false,
            message: 'Layanan login TND sedang tidak tersedia. Silakan coba lagi.'
          });
        }

        if (isTndPasswordAccount && tndResponse?.ok && !tndData) {
          return res.status(502).json({
            success: false,
            message: 'Respons layanan login TND tidak valid. Silakan coba lagi.'
          });
        }

        if (isTndPasswordAccount && (!tndResponse?.ok || tndData?.success === false)) {
          isMatch = false;
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
               SET email = $1, nip = $2, full_name = $3, department = $4, phone_number = $5,
                   password_auth_source = 'TND',
                   profile_image = $6,
                   profile_image_source = CASE WHEN $6::text IS NOT NULL THEN 'TND' ELSE 'NONE' END
               WHERE id = $7`,
              [finalEmail, finalNip, fullName, department, phone, tndProfileImage, user.id]
            );

            user.email = finalEmail;
            user.nip = finalNip;
            user.full_name = fullName;
            user.department = department;
            user.phone_number = phone;
            user.profile_image = tndProfileImage;
            user.profile_image_source = tndProfileImage ? 'TND' : 'NONE';
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
            const passwordPlaceholderHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);

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
                [finalEmail, finalNip, passwordPlaceholderHash, fullName, phone, department, tndProfileImage]
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
        if (isTndPasswordAccount) {
          return res.status(503).json({
            success: false,
            message: 'Layanan login TND sedang tidak tersedia. Silakan coba lagi.'
          });
        }
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

    expireOldUserAgreement(user);

    if (user.profile_image_source === 'TND' && user.profile_image) {
      const ssoUrl = process.env.SSO_API_URL || 'https://tnd.kotabogor.go.id/api-baru/api/v1/login';
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
            passwordExpiresAt: getPasswordExpiresAt(user),
            ...(!user.user_agreement_accepted_at ? { purpose: 'user_agreement' } : {})
          },
          JWT_SECRET,
          { expiresIn: '24h' }
        );
        if (user.user_agreement_accepted_at) await logSuccessfulLogin(user, 'trusted_device');
        return res.json({
          success: true,
          token,
          passwordChangeRequired,
          user: {
            id: user.id, email: user.email, nip: user.nip, name: user.full_name, role: primaryRole,
            roles: user.roles, department: user.department, profile_image: user.profile_image,
            profile_image_source: user.profile_image_source, profileImage: user.profile_image,
            profileImageSource: user.profile_image_source, teams: await getUserTeams(user.id),
            password_auth_source: user.password_auth_source,
            passwordChangeRequired,
            passwordExpiresAt: getPasswordExpiresAt(user),
            twoFactorEnabled: true,
            twoFactorChoiceCompleted: Boolean(user.two_factor_choice_completed),
            userAgreementAccepted: Boolean(user.user_agreement_accepted_at)
          },
          requiresUserAgreement: !user.user_agreement_accepted_at
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
        passwordExpiresAt: getPasswordExpiresAt(user),
        ...(!user.user_agreement_accepted_at ? { purpose: 'user_agreement' } : {})
      }, JWT_SECRET, { expiresIn: '24h' });
      if (user.user_agreement_accepted_at) await logSuccessfulLogin(user);
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
          password_auth_source: user.password_auth_source,
          teams: await getUserTeams(user.id),
          passwordChangeRequired,
          passwordExpiresAt: getPasswordExpiresAt(user),
          twoFactorEnabled: false,
          twoFactorChoiceCompleted: true,
          userAgreementAccepted: Boolean(user.user_agreement_accepted_at)
        },
        requiresUserAgreement: !user.user_agreement_accepted_at
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

exports.logout = async (req, res) => {
  try {
    await recordActivity(db, {
      actorId: req.user.id,
      actorName: req.user.name,
      actorRole: ((Array.isArray(req.user.roles) && req.user.roles.length) ? req.user.roles : [req.user.role])
        .filter(Boolean)
        .map(role => String(role).toUpperCase())
        .join(', ') || 'UNKNOWN',
      activityType: 'logout',
      description: 'Pengguna logout.'
    });
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('logout activity log error:', error);
    res.status(500).json({ success: false, message: 'Gagal mencatat aktivitas logout.' });
  }
};

Object.assign(exports, createTwoFactorController({
  db,
  jwt,
  jwtSecret: JWT_SECRET,
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
}));

Object.assign(exports, createRegistrationController({ db, ensurePasswordCols, maskEmail }));
Object.assign(exports, createProfileController({
  db,
  jwt,
  jwtSecret: JWT_SECRET,
  expireOldUserAgreement,
  resolveUserRoles,
  getPrimaryRole,
  getUserTeams,
  requiresAnnualPasswordChange,
  getPasswordExpiresAt,
  logSuccessfulLogin,
  ensurePasswordCols,
  verifyPassword
}));
Object.assign(exports, createPasswordResetController({
  db,
  ensurePasswordCols,
  verifyPassword,
  decrypt,
  jwtSecret: JWT_SECRET,
  maskEmail
}));
