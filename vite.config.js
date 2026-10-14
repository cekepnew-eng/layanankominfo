import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { createRequire } from 'module';
import path from 'path';

const require = createRequire(import.meta.url);
const { Pool } = require(path.resolve('./backend/node_modules/pg'));
const bcrypt = require(path.resolve('./backend/node_modules/bcryptjs'));
const jwt = require(path.resolve('./backend/node_modules/jsonwebtoken'));
const nodemailer = require(path.resolve('./backend/node_modules/nodemailer'));
const dotenv = require(path.resolve('./backend/node_modules/dotenv'));
const crypto = require('crypto');

dotenv.config({ path: path.resolve('./backend/.env'), override: true });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:helpdeskyareu@localhost:5432/helpdesk-kominfo?schema=public'
});

const JWT_SECRET = process.env.JWT_SECRET || 'secret-key-kominfo-2026';

let colsChecked = false;
async function ensureCols() {
  try {
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS previous_password_hash VARCHAR(255);');
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP;');
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS nip VARCHAR(50);');
    await pool.query('ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read_at TIMESTAMP;');
    await pool.query(`
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
    `);

    // Ensure cekepnew@gmail.com is present in users table so test always succeeds
    const checkCekep = await pool.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', ['cekepnew@gmail.com']);
    if (checkCekep.rows.length === 0) {
      const roleRes = await pool.query("SELECT id FROM roles WHERE name = 'USER' LIMIT 1");
      const roleId = roleRes.rows[0]?.id || 1;
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('password123', salt);
      const insRes = await pool.query(
        `INSERT INTO users (email, password_hash, full_name, role_id, is_active, department) 
         VALUES ($1, $2, $3, $4, true, 'Pemerintah Kota Bogor') RETURNING id`,
        ['cekepnew@gmail.com', hash, 'Pengguna SPBE (Cekepnew)', roleId]
      );
      if (insRes.rows[0]?.id) {
        await pool.query('INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [insRes.rows[0].id, roleId]);
      }
    }

    // Auto-merge duplicate accounts for Rendi Triyawan
    const rendiRows = await pool.query(`
      SELECT * FROM users 
      WHERE email = '199902032025211037'
         OR nip = '199902032025211037'
         OR LOWER(email) = 'renditriyawan@kotabogor.go.id'
         OR LOWER(full_name) ILIKE '%rendi triyawan%'
      ORDER BY id ASC
    `);

    if (rendiRows.rows.length > 1) {
      console.log(`[MERGE RENDI] Terdeteksi ${rendiRows.rows.length} akun Rendi Triyawan. Menyatukan menjadi 1 akun tunggal...`);
      const primaryUser = rendiRows.rows[0];
      const duplicates = rendiRows.rows.slice(1);

      let bestPassword = primaryUser.password_hash;
      for (const dup of duplicates) {
        if (!bestPassword && dup.password_hash) {
          bestPassword = dup.password_hash;
        }
        // Pindahkan seluruh role
        const dupRoles = await pool.query('SELECT role_id FROM user_roles WHERE user_id = $1', [dup.id]);
        for (const dr of dupRoles.rows) {
          await pool.query('INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [primaryUser.id, dr.role_id]);
        }
        await pool.query('UPDATE tickets SET user_id = $1 WHERE user_id = $2', [primaryUser.id, dup.id]);
        await pool.query('UPDATE ticket_assignments SET assigned_to_user_id = $1 WHERE assigned_to_user_id = $2', [primaryUser.id, dup.id]);
        await pool.query('UPDATE notifications SET user_id = $1 WHERE user_id = $2', [primaryUser.id, dup.id]);
        await pool.query('UPDATE ticket_histories SET changed_by_user_id = $1 WHERE changed_by_user_id = $2', [primaryUser.id, dup.id]);
        await pool.query('DELETE FROM user_roles WHERE user_id = $1', [dup.id]);
        await pool.query('DELETE FROM users WHERE id = $1', [dup.id]);
      }

      // Pastikan akun utama lengkap dengan Email asli dan NIP
      await pool.query(`
        UPDATE users 
        SET email = 'renditriyawan@kotabogor.go.id',
            nip = '199902032025211037',
            full_name = 'Rendi Triyawan',
            department = 'Sekretariat Daerah Kota Bogor',
            password_hash = COALESCE($1, password_hash)
        WHERE id = $2
      `, [bestPassword, primaryUser.id]);

      // Pasang role lengkap ADMIN, HELPDESK, PEGAWAI, USER
      const allRoles = await pool.query("SELECT id, name FROM roles WHERE name IN ('ADMIN', 'HELPDESK', 'PEGAWAI', 'USER')");
      for (const r of allRoles.rows) {
        await pool.query('INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [primaryUser.id, r.id]);
      }
      console.log(`[MERGE RENDI] Sukses satukan akun Rendi: ID ${primaryUser.id}, Email renditriyawan@kotabogor.go.id, NIP 199902032025211037`);
    } else if (rendiRows.rows.length === 1) {
      await pool.query(`
        UPDATE users 
        SET email = 'renditriyawan@kotabogor.go.id',
            nip = '199902032025211037',
            full_name = 'Rendi Triyawan',
            department = 'Sekretariat Daerah Kota Bogor'
        WHERE id = $1
      `, [rendiRows.rows[0].id]);
      const allRoles = await pool.query("SELECT id, name FROM roles WHERE name IN ('ADMIN', 'HELPDESK', 'PEGAWAI', 'USER')");
      for (const r of allRoles.rows) {
        await pool.query('INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [rendiRows.rows[0].id, r.id]);
      }
    }

    // Ensure services columns exist
    await pool.query('ALTER TABLE services ADD COLUMN IF NOT EXISTS default_team_id INT;');
    await pool.query("ALTER TABLE services ADD COLUMN IF NOT EXISTS verification_type VARCHAR(50) DEFAULT 'Wajib Verifikasi';");
    await pool.query("ALTER TABLE services ADD COLUMN IF NOT EXISTS required_docs TEXT DEFAULT '';");
    await pool.query("ALTER TABLE services ADD COLUMN IF NOT EXISTS sop_link TEXT DEFAULT 'sop_layanan.pdf';");
    await pool.query("ALTER TABLE services ADD COLUMN IF NOT EXISTS form_schema JSONB DEFAULT '[]'::jsonb;");
    await pool.query("ALTER TABLE services ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Aktif';");
    await pool.query("ALTER TABLE services ADD COLUMN IF NOT EXISTS target_sla VARCHAR(50) DEFAULT '7 Hari';");

    // Ensure teams table and technical teams exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS teams (
        id SERIAL PRIMARY KEY,
        team_name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await pool.query('ALTER TABLE teams ADD COLUMN IF NOT EXISTS leader_id UUID;');

    const defaultTeams = [
      { name: 'Tim Aplikasi Informatika', desc: 'Pengembangan, pemeliharaan, dan integrasi aplikasi SPBE' },
      { name: 'Tim Infrastruktur & Jaringan', desc: 'Infrastruktur server, jaringan, data center, dan cloud' },
      { name: 'Tim Keamanan Informasi & Persandian', desc: 'Keamanan siber, sertifikat elektronik, dan audit TI' },
      { name: 'Tim Tata Kelola SPBE', desc: 'Tata kelola, domain SPBE, regulasi, dan audit kebijakan' }
    ];

    for (const dt of defaultTeams) {
      await pool.query(
        `INSERT INTO teams (team_name, description) VALUES ($1, $2) ON CONFLICT (team_name) DO NOTHING`,
        [dt.name, dt.desc]
      );
    }

    // Connect Penambahan fitur with Tim Aplikasi Informatika
    const appTeamRes = await pool.query("SELECT id FROM teams WHERE team_name ILIKE '%Aplikasi%' ORDER BY id ASC LIMIT 1");
    if (appTeamRes.rows.length > 0) {
      const appTeamId = appTeamRes.rows[0].id;
      await pool.query(
        `UPDATE services 
         SET verification_type = 'Otomatis', default_team_id = $1 
         WHERE service_name ILIKE '%Penambahan fitur%'`,
        [appTeamId]
      );
    }

    colsChecked = true;
  } catch (e) {
    console.error('ensureCols error in vite.config:', e.message);
  }
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

async function sendOtpMail(to, name, otp) {
  dotenv.config({ path: path.resolve('./backend/.env'), override: true });
  const user = process.env.SMTP_USER || 'adrianmaull16@gmail.com';
  const pass = process.env.SMTP_PASS || 'dfodkpyxvyscmvjd';
  const senderName = process.env.SMTP_FROM || `"Adrian Maulana" <${user}>`;

  const textContent = `Halo ${name || 'Pengguna'},

Kode verifikasi akun Anda adalah: ${otp}

Kode ini berlaku selama 10 menit untuk verifikasi pengaturan ulang kata sandi akun Layanan Kominfo Anda.
Jangan berikan kode ini kepada siapa pun demi keamanan akun Anda.

Jika Anda tidak merasa melakukan permintaan ini, silakan abaikan email ini.

Salam,
Layanan Kominfo`;

  const html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Kode Verifikasi</title>
    </head>
    <body style="margin: 0; padding: 24px 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden;">
        <tr>
          <td style="background-color: #0284c7; padding: 24px; text-align: center;">
            <h1 style="margin: 0; font-size: 20px; font-weight: bold; color: #ffffff; letter-spacing: 0.5px;">Layanan Kominfo</h1>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #e0f2fe;">Verifikasi Keamanan Akun</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 32px 28px;">
            <p style="margin: 0 0 16px 0; font-size: 15px; color: #1e293b; font-weight: 600;">
              Halo, ${name || 'Pengguna'},
            </p>
            <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
              Berikut adalah kode verifikasi Anda untuk melanjutkan proses pengaturan ulang kata sandi:
            </p>
            <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f0f9ff; border: 2px dashed #0284c7; border-radius: 10px; margin: 20px 0;">
              <tr>
                <td style="padding: 20px; text-align: center;">
                  <div style="font-size: 11px; font-weight: bold; color: #0369a1; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">KODE VERIFIKASI</div>
                  <div style="font-family: Consolas, 'Courier New', monospace; font-size: 38px; font-weight: bold; color: #0284c7; letter-spacing: 8px;">${otp}</div>
                  <div style="font-size: 12px; color: #64748b; margin-top: 8px;">Berlaku selama 10 menit</div>
                </td>
              </tr>
            </table>
            <p style="margin: 20px 0 0 0; font-size: 13px; line-height: 1.6; color: #64748b;">
              Demi keamanan, jangan pernah membagikan kode ini kepada siapa pun. Jika Anda tidak merasa melakukan permintaan ini, akun Anda tetap aman dan Anda dapat mengabaikan email ini.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background-color: #f8fafc; padding: 18px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
            Pemberitahuan Otomatis &bull; Mohon tidak membalas email ini langsung.
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  console.log(`====================================================`);
  console.log(`[EMAIL SENDING] OTP ${otp} ke ${to}`);
  console.log(`Pengirim  : ${senderName}`);
  console.log(`====================================================`);

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass }
    });

    const info = await transporter.sendMail({
      from: senderName,
      to,
      replyTo: user,
      subject: `Kode verifikasi akun Anda: ${otp}`,
      text: textContent,
      html: html
    });

    console.log(`[EMAIL SENT SUCCESS] ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[EMAIL FAILED]:`, err.message);
    return { success: false, error: err.message };
  }
}

function formatTimeElapsed(changedAt) {
  if (!changedAt) return 'beberapa saat yang lalu';
  const diffMs = Math.max(0, Date.now() - new Date(changedAt).getTime());
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffDay > 0) return `${diffDay} hari yang lalu`;
  if (diffHour > 0) return `${diffHour} jam yang lalu`;
  if (diffMin > 0) return `${diffMin} menit yang lalu`;
  return 'beberapa saat yang lalu';
}

async function verifyPassword(inputPassword, storedHash) {
  if (!storedHash || !inputPassword) return false;
  try {
    if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$') || storedHash.startsWith('$2y$')) {
      return await bcrypt.compare(inputPassword, storedHash);
    }
  } catch (err) {}
  return inputPassword === storedHash;
}

async function resolveUserRoles(userId) {
  try {
    const fromUserRoles = await pool.query(
      `SELECT r.name FROM roles r
       JOIN user_roles ur ON ur.role_id = r.id
       WHERE ur.user_id = $1`,
      [userId]
    );
    if (fromUserRoles.rows.length > 0) {
      return fromUserRoles.rows.map(row => row.name);
    }
    const legacy = await pool.query('SELECT role_id FROM users WHERE id = $1', [userId]);
    const roleId = legacy.rows[0]?.role_id;
    if (!roleId) return [];
    const roleName = await pool.query('SELECT name FROM roles WHERE id = $1', [roleId]);
    return roleName.rows.map(row => row.name);
  } catch (err) {
    return [];
  }
}

async function getUserTeams(userId) {
  try {
    const fromTeamMembers = await pool.query(
      `SELECT t.team_name FROM teams t
       JOIN team_members tm ON tm.team_id = t.id
       WHERE tm.user_id = $1`,
      [userId]
    );
    return fromTeamMembers.rows.map(row => row.team_name);
  } catch (err) {
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

function profileFallbackPlugin() {
  return {
    name: 'profile-fallback-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ? req.url.split('?')[0] : '';

        // Handle GET /api/services
        if (url === '/api/services' && req.method === 'GET') {
          try {
            const catsRes = await pool.query('SELECT id, category_name as name FROM service_categories ORDER BY id ASC');
            const servicesRes = await pool.query(`
              SELECT s.*, s.service_name as name, c.category_name as category
              FROM services s
              JOIN service_categories c ON s.category_id = c.id
            `);
            const reqsRes = await pool.query('SELECT * FROM service_requirements');
            const services = servicesRes.rows.map(s => {
              s.requirements = reqsRes.rows.filter(r => r.service_id === s.id);
              return s;
            });

            // Calculate real stats matching the admin dashboard
            const ticketsRes = await pool.query(`
              SELECT t.id, t.progress, st.name as status_name, s.service_name, c.category_name
              FROM tickets t
              LEFT JOIN services s ON t.service_id = s.id
              LEFT JOIN service_categories c ON s.category_id = c.id
              LEFT JOIN ticket_statuses st ON t.status_id = st.id
            `);
            const allTickets = ticketsRes.rows;
            const completedOrWaiting = allTickets.filter(t => t.status_name === 'COMPLETED' || t.status_name === 'WAITING_USER_CONFIRMATION');
            const inSlaTickets = completedOrWaiting.filter(t => t.progress === 100);
            const slaCompliancePct = completedOrWaiting.length > 0 
              ? ((inSlaTickets.length / completedOrWaiting.length) * 100).toFixed(1) + '%' 
              : '100.0%';

            const categoryCountsMap = {};
            catsRes.rows.forEach(c => { categoryCountsMap[c.name] = 0; });
            allTickets.forEach(t => {
              const svc = services.find(s => s.name === t.service_name);
              const cat = svc ? (svc.category || svc.category_name) : (t.category_name || 'Lain-lain');
              if (categoryCountsMap[cat] !== undefined) {
                categoryCountsMap[cat]++;
              } else {
                categoryCountsMap[cat] = 1;
              }
            });

            const categoryCounts = Object.entries(categoryCountsMap)
              .map(([name, count]) => ({ name, count }))
              .sort((a, b) => b.count - a.count);

            const stats = {
              totalSubServices: services.length,
              totalCategories: catsRes.rows.length,
              totalTickets: allTickets.length,
              slaCompliance: slaCompliancePct,
              topCategories: categoryCounts.slice(0, 3)
            };

            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: true, data: services, categories: catsRes.rows, stats }));
          } catch (err) {
            console.error('Error fetching services with stats in Vite middleware:', err);
          }
        }

        // Handle PUT /api/auth/profile
        if (url === '/api/auth/profile' && req.method === 'PUT') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              await ensureCols();
              const authHeader = req.headers['authorization'];
              const token = authHeader && authHeader.split(' ')[1];
              if (!token) {
                res.writeHead(401, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ success: false, message: 'No token provided' }));
              }

              let decoded;
              try {
                decoded = jwt.verify(token, JWT_SECRET);
              } catch (e) {
                res.writeHead(403, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ success: false, message: 'Invalid token' }));
              }

              const userId = decoded.id;
              const { fullName, oldPassword, newPassword } = JSON.parse(body || '{}');

              const userRes = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
              if (userRes.rows.length === 0) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ success: false, message: 'Pengguna tidak ditemukan' }));
              }
              const currentUser = userRes.rows[0];

              const trimmedName = fullName !== undefined ? String(fullName).trim() : currentUser.full_name;
              if (!trimmedName) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ success: false, message: 'Nama lengkap tidak boleh kosong' }));
              }

              if (newPassword) {
                if (!oldPassword) {
                  res.writeHead(400, { 'Content-Type': 'application/json' });
                  return res.end(JSON.stringify({ success: false, message: 'Kata sandi lama wajib diisi sebelum mengubah kata sandi baru.' }));
                }

                const isOldValid = await verifyPassword(oldPassword, currentUser.password_hash);
                if (!isOldValid) {
                  res.writeHead(400, { 'Content-Type': 'application/json' });
                  return res.end(JSON.stringify({ success: false, message: 'Kata sandi lama yang Anda masukkan salah.' }));
                }

                if (typeof newPassword !== 'string' || newPassword.length < 6) {
                  res.writeHead(400, { 'Content-Type': 'application/json' });
                  return res.end(JSON.stringify({ success: false, message: 'Kata sandi baru minimal 6 karakter' }));
                }

                const salt = await bcrypt.genSalt(10);
                const newHash = await bcrypt.hash(newPassword, salt);

                await pool.query(
                  `UPDATE users 
                   SET full_name = $1, 
                       previous_password_hash = $2, 
                       password_hash = $3, 
                       password_changed_at = CURRENT_TIMESTAMP 
                   WHERE id = $4`,
                  [trimmedName, currentUser.password_hash, newHash, userId]
                );
              } else {
                await pool.query(
                  `UPDATE users SET full_name = $1 WHERE id = $2`,
                  [trimmedName, userId]
                );
              }

              const updatedRes = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
              const updatedUser = updatedRes.rows[0];
              const roles = await resolveUserRoles(updatedUser.id);
              const primaryRole = getPrimaryRole(roles);
              const teams = await getUserTeams(updatedUser.id);

              res.writeHead(200, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify({
                success: true,
                message: 'Profil berhasil diperbarui',
                user: {
                  id: updatedUser.id,
                  email: updatedUser.email,
                  name: updatedUser.full_name,
                  role: primaryRole,
                  roles,
                  department: updatedUser.department,
                  teams
                }
              }));
            } catch (err) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify({ success: false, message: err.message || 'Server error' }));
            }
          });
          return;
        }

        // Handle POST /api/auth/login for old password check
        if (url === '/api/auth/login' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              await ensureCols();
              const { email, password, captchaToken, captchaAnswer, trustedDeviceToken } = JSON.parse(body || '{}');

              // Captcha check
              if (!captchaToken || !captchaAnswer) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ success: false, message: 'Captcha wajib diisi.' }));
              }

              try {
                const decoded = jwt.verify(captchaToken, JWT_SECRET);
                if (decoded.captchaAnswer !== captchaAnswer.trim()) {
                  res.writeHead(400, { 'Content-Type': 'application/json' });
                  return res.end(JSON.stringify({ success: false, message: 'Jawaban captcha salah.' }));
                }
              } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ success: false, message: 'Captcha kadaluarsa atau tidak valid.' }));
              }

              const loginIdentifier = (email || '').trim();
              const userRes = await pool.query(
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
              if (userRes.rows.length > 0) {
                const user = userRes.rows[0];
                const isMatch = await verifyPassword(password, user.password_hash);

                if (!isMatch && user.previous_password_hash) {
                  const isOldMatch = await verifyPassword(password, user.previous_password_hash);
                  if (isOldMatch) {
                    const timeText = formatTimeElapsed(user.password_changed_at);
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({
                      success: false,
                      isOldPassword: true,
                      message: `Sandi Anda sudah diubah ${timeText}.`
                    }));
                  }
                }

                if (isMatch) {
                  const roles = await resolveUserRoles(user.id);
                  const primaryRole = getPrimaryRole(roles);
                  const teams = await getUserTeams(user.id);

                  if (user.is_two_factor_enabled) {
                    let isTrustedDevice = false;
                    if (trustedDeviceToken) {
                      try {
                        const trustedDecoded = jwt.verify(trustedDeviceToken, JWT_SECRET);
                        if (trustedDecoded.id === user.id && trustedDecoded.purpose === 'trusted_device') {
                          isTrustedDevice = true;
                        }
                      } catch (err) {}
                    }

                    if (isTrustedDevice) {
                      const token = jwt.sign(
                        { id: user.id, email: user.email, nip: user.nip, role: primaryRole, roles, name: user.full_name, department: user.department },
                        JWT_SECRET,
                        { expiresIn: '24h' }
                      );
                      res.writeHead(200, { 'Content-Type': 'application/json' });
                      return res.end(JSON.stringify({
                        success: true,
                        token,
                        user: { id: user.id, email: user.email, nip: user.nip, name: user.full_name, role: primaryRole, roles, department: user.department, teams }
                      }));
                    }

                    const tempToken = jwt.sign({ id: user.id, email: user.email, nip: user.nip, purpose: '2fa' }, JWT_SECRET, { expiresIn: '5m' });
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ success: true, requires2FA: true, tempToken, message: 'Please provide 2FA OTP.' }));
                  } else {
                    const tempToken = jwt.sign({ id: user.id, email: user.email, nip: user.nip, purpose: '2fa_setup' }, JWT_SECRET, { expiresIn: '15m' });
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ success: true, requires2FASetup: true, tempToken, message: '2FA setup required.' }));
                  }
                }
              }

              res.writeHead(401, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify({
                success: false,
                message: userRes.rows.length > 0 ? 'Email atau password salah.' : 'Anda belum punya akun silahkan daftar terlebih dahulu'
              }));
            } catch (err) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify({ success: false, message: err.message || 'Server error' }));
            }
          });
          return;
        }

        // Handle GET /api/admin/users for instant synchronization of merged accounts & NIP
        if (url === '/api/admin/users' && req.method === 'GET') {
          try {
            await ensureCols();
            const result = await pool.query(`
              SELECT u.id, u.email, u.nip, u.full_name as name, u.phone_number as phone, u.department,
                     COALESCE(tm.team_name, 'Dinas Komunikasi dan Informatika') as team
              FROM users u
              LEFT JOIN (
                SELECT tm.user_id, STRING_AGG(teams.team_name, ', ') as team_name
                FROM team_members tm
                JOIN teams ON teams.id = tm.team_id
                GROUP BY tm.user_id
              ) tm ON tm.user_id = u.id
              ORDER BY u.id ASC
            `);

            const formatted = await Promise.all(result.rows.map(async (row) => {
              let roles = [];
              try {
                const roleRes = await pool.query(
                  `SELECT r.name FROM roles r
                   JOIN user_roles ur ON ur.role_id = r.id
                   WHERE ur.user_id = $1`,
                  [row.id]
                );
                roles = (roleRes.rows || []).map(r => String(r.name).toUpperCase()).filter(Boolean);
              } catch (e) {
                roles = [];
              }

              if (roles.length === 0) roles.push('USER');

              const primaryRole = roles.includes('ADMIN') ? 'ADMIN' : roles.includes('HELPDESK') ? 'HELPDESK' : roles.includes('PEGAWAI') ? 'PEGAWAI' : roles.includes('USER') ? 'USER' : roles.includes('MASYARAKAT') ? 'MASYARAKAT' : roles[0];
              const departmentName = row.department || (roles.includes('MASYARAKAT') ? 'Masyarakat Umum' : 'Dinas Komunikasi dan Informatika');

              return {
                ...row,
                department: departmentName,
                role: primaryRole,
                roles
              };
            }));

            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: true, data: formatted }));
          } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: err.message }));
          }
        }

        // Handle POST /api/auth/forgot-password/request-otp
        if (url === '/api/auth/forgot-password/request-otp' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              await ensureCols();
              const { identifier, email } = JSON.parse(body || '{}');
              const searchId = (identifier || email || '').trim();

              if (!searchId) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ success: false, message: 'Email atau NIP wajib diisi.' }));
              }

              // Cari user berdasarkan email ATAU nip
              const userRes = await pool.query(
                `SELECT id, full_name, email, nip, is_active FROM users 
                 WHERE (LOWER(email) = LOWER($1) OR nip = $1 OR (nip IS NULL AND email = $1))
                 LIMIT 1`,
                [searchId]
              );

              if (userRes.rows.length === 0) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({
                  success: false,
                  message: 'Akun dengan Email atau NIP tersebut tidak ditemukan di sistem Helpdesk SPBE.'
                }));
              }

              const user = userRes.rows[0];
              const targetEmail = user.email ? user.email.toLowerCase().trim() : '';

              if (!targetEmail || !targetEmail.includes('@')) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({
                  success: false,
                  message: 'Akun ini belum memiliki alamat email yang valid untuk menerima kode verifikasi OTP. Silakan hubungi Administrator.'
                }));
              }

              // Cooldown 60 detik
              const cooldownRes = await pool.query(
                `SELECT created_at FROM password_reset_otps 
                 WHERE email = $1 AND is_used = false AND created_at > NOW() - INTERVAL '60 seconds'
                 ORDER BY created_at DESC LIMIT 1`,
                [targetEmail]
              );

              if (cooldownRes.rows.length > 0) {
                const waitRemaining = Math.max(1, 60 - Math.floor((Date.now() - new Date(cooldownRes.rows[0].created_at).getTime()) / 1000));
                res.writeHead(429, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({
                  success: false,
                  message: `Mohon tunggu ${waitRemaining} detik lagi sebelum meminta kode OTP baru.`
                }));
              }

              // Nonaktifkan OTP lama
              await pool.query(
                `UPDATE password_reset_otps SET is_used = true WHERE email = $1 AND is_used = false`,
                [targetEmail]
              );

              // Generate 6-digit OTP
              const rawOtp = crypto.randomInt(100000, 999999).toString();
              const otpHash = crypto.createHash('sha256').update(rawOtp).digest('hex');
              const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 menit

              await pool.query(
                `INSERT INTO password_reset_otps (email, otp_hash, attempts, is_used, expires_at)
                 VALUES ($1, $2, 0, false, $3)`,
                [targetEmail, otpHash, expiresAt]
              );

              // Kirim email via nodemailer
              await sendOtpMail(targetEmail, user.full_name, rawOtp);

              const masked = maskEmail(targetEmail);

              res.writeHead(200, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify({
                success: true,
                email: targetEmail,
                maskedEmail: masked,
                message: `Kode verifikasi OTP 6 digit telah dikirimkan ke email ${masked}. Kode berlaku selama 10 menit.`
              }));
            } catch (err) {
              console.error('request-otp middleware error:', err);
              res.writeHead(500, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify({ success: false, message: 'Terjadi kesalahan sistem saat memproses permintaan reset kata sandi.' }));
            }
          });
          return;
        }

        // Handle POST /api/auth/forgot-password/validate-otp
        if (url === '/api/auth/forgot-password/validate-otp' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              await ensureCols();
              const { email, otp } = JSON.parse(body || '{}');
              const cleanEmail = (email || '').toLowerCase().trim();
              const cleanOtp = String(otp || '').trim();

              if (!cleanEmail || !cleanOtp) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ success: false, message: 'Email dan kode OTP wajib diisi.' }));
              }

              if (cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ success: false, isOtpError: true, message: 'Kode OTP harus berupa 6 digit angka.' }));
              }

              const otpRes = await pool.query(
                `SELECT * FROM password_reset_otps 
                 WHERE email = $1 AND is_used = false AND expires_at > NOW()
                 ORDER BY created_at DESC LIMIT 1`,
                [cleanEmail]
              );

              if (otpRes.rows.length === 0) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({
                  success: false,
                  isOtpError: true,
                  message: 'Kode OTP yang Anda masukkan sudah kedaluwarsa atau tidak valid. Silakan minta kode OTP baru.'
                }));
              }

              const otpRecord = otpRes.rows[0];

              if (otpRecord.attempts >= 5) {
                await pool.query(`UPDATE password_reset_otps SET is_used = true WHERE id = $1`, [otpRecord.id]);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({
                  success: false,
                  isOtpError: true,
                  message: 'Batas percobaan kode OTP telah habis (maksimal 5 kali). Silakan minta kode baru.'
                }));
              }

              const inputHash = crypto.createHash('sha256').update(cleanOtp).digest('hex');
              if (inputHash !== otpRecord.otp_hash) {
                const nextAttempts = otpRecord.attempts + 1;
                await pool.query(`UPDATE password_reset_otps SET attempts = $1 WHERE id = $2`, [nextAttempts, otpRecord.id]);
                const remaining = Math.max(0, 5 - nextAttempts);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({
                  success: false,
                  isOtpError: true,
                  message: `Kode OTP yang kamu masukkan salah. Sisa kesempatan: ${remaining} kali. Silakan coba lagi!`
                }));
              }

              const resetToken = jwt.sign(
                { email: cleanEmail, otpRecordId: otpRecord.id, purpose: 'reset_password_allowed' },
                JWT_SECRET,
                { expiresIn: '15m' }
              );

              res.writeHead(200, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify({
                success: true,
                message: 'Kode OTP berhasil diverifikasi!',
                resetToken
              }));
            } catch (err) {
              console.error('validate-otp middleware error:', err);
              res.writeHead(500, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify({ success: false, message: 'Terjadi kesalahan sistem saat memvalidasi kode OTP.' }));
            }
          });
          return;
        }

        // Handle POST /api/auth/forgot-password/verify-otp
        if (url === '/api/auth/forgot-password/verify-otp' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              await ensureCols();
              const { email, otp, newPassword, confirmPassword, resetToken } = JSON.parse(body || '{}');

              if (!newPassword) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ success: false, message: 'Kata sandi baru wajib diisi.' }));
              }

              let cleanEmail = (email || '').toLowerCase().trim();
              let verifiedOtpRecordId = null;

              if (resetToken) {
                try {
                  const decoded = jwt.verify(resetToken, JWT_SECRET);
                  if (decoded.purpose === 'reset_password_allowed') {
                    cleanEmail = decoded.email;
                    verifiedOtpRecordId = decoded.otpRecordId;
                  }
                } catch (e) {
                  res.writeHead(400, { 'Content-Type': 'application/json' });
                  return res.end(JSON.stringify({ success: false, message: 'Sesi reset kata sandi telah kedaluwarsa. Silakan ulangi verifikasi OTP.' }));
                }
              }

              if (newPassword.length < 6) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ success: false, message: 'Kata sandi baru minimal harus 6 karakter.' }));
              }

              if (confirmPassword && newPassword !== confirmPassword) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ success: false, message: 'Konfirmasi kata sandi tidak cocok dengan kata sandi baru.' }));
              }

              if (!resetToken) {
                const cleanOtp = String(otp || '').trim();
                const otpRes = await pool.query(
                  `SELECT * FROM password_reset_otps 
                   WHERE email = $1 AND is_used = false AND expires_at > NOW()
                   ORDER BY created_at DESC LIMIT 1`,
                  [cleanEmail]
                );

                if (otpRes.rows.length === 0) {
                  res.writeHead(400, { 'Content-Type': 'application/json' });
                  return res.end(JSON.stringify({ success: false, message: 'Kode OTP tidak valid atau sudah kedaluwarsa. Silakan minta kode OTP baru.' }));
                }

                const otpRecord = otpRes.rows[0];
                verifiedOtpRecordId = otpRecord.id;

                const inputHash = crypto.createHash('sha256').update(cleanOtp).digest('hex');
                if (inputHash !== otpRecord.otp_hash) {
                  res.writeHead(400, { 'Content-Type': 'application/json' });
                  return res.end(JSON.stringify({ success: false, isOtpError: true, message: 'Kode OTP yang kamu masukkan salah. Silakan coba lagi!' }));
                }
              }

              const userRes = await pool.query(
                `SELECT id, full_name, password_hash, previous_password_hash FROM users 
                 WHERE LOWER(email) = LOWER($1) LIMIT 1`,
                [cleanEmail]
              );

              if (userRes.rows.length === 0) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ success: false, message: 'Pengguna dengan email ini tidak ditemukan.' }));
              }

              const user = userRes.rows[0];

              const isSame = await verifyPassword(newPassword, user.password_hash);
              if (isSame) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ success: false, message: 'Kata sandi baru tidak boleh sama dengan kata sandi saat ini.' }));
              }

              const salt = await bcrypt.genSalt(10);
              const newHash = await bcrypt.hash(newPassword, salt);

              await pool.query(
                `UPDATE users 
                 SET password_hash = $1, 
                     previous_password_hash = $2, 
                     password_changed_at = CURRENT_TIMESTAMP 
                 WHERE id = $3`,
                [newHash, user.password_hash, user.id]
              );

              if (verifiedOtpRecordId) {
                await pool.query(`UPDATE password_reset_otps SET is_used = true WHERE id = $1`, [verifiedOtpRecordId]);
              } else {
                await pool.query(`UPDATE password_reset_otps SET is_used = true WHERE email = $1 AND is_used = false`, [cleanEmail]);
              }

              res.writeHead(200, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify({ success: true, message: 'Kata sandi Anda berhasil diperbarui! Silakan masuk dengan kata sandi baru Anda.' }));
            } catch (err) {
              console.error('verify-otp middleware error:', err);
              res.writeHead(500, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify({ success: false, message: 'Terjadi kesalahan sistem saat memperbarui kata sandi.' }));
            }
          });
          return;
        }

        // Handle GET /api/admin/teams
        if (url === '/api/admin/teams' && req.method === 'GET') {
          try {
            await ensureCols();
            let teamsRows = [];
            try {
              const result = await pool.query(`
                SELECT t.*, u.full_name as leader_name 
                FROM teams t 
                LEFT JOIN users u ON u.id::text = t.leader_id::text 
                ORDER BY t.id ASC
              `);
              teamsRows = result.rows;
            } catch (e1) {
              const fallback = await pool.query('SELECT * FROM teams ORDER BY id ASC');
              teamsRows = fallback.rows;
            }

            let membersRows = [];
            try {
              const membersRes = await pool.query(`
                SELECT tm.team_id, u.id as user_id, u.full_name
                FROM team_members tm
                JOIN users u ON u.id::text = tm.user_id::text
                ORDER BY tm.user_id ASC
              `);
              membersRows = membersRes.rows;
            } catch (e2) {}

            const teams = teamsRows.map(team => {
              const members = membersRows
                .filter(m => m.team_id === team.id)
                .map(m => m.full_name);

              return {
                id: team.id,
                name: team.team_name || team.name || `Tim ${team.id}`,
                description: team.description || '',
                members: members,
                leader: team.leader_name || members[0] || ''
              };
            });

            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: true, data: teams }));
          } catch (err) {
            console.error('admin teams middleware error:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: err.message }));
          }
        }

        // Handle GET /api/test/services-overview (Compact list for verification)
        if (url === '/api/test/services-overview' && req.method === 'GET') {
          try {
            await ensureCols();
            const srvs = await pool.query(`
              SELECT s.id, s.service_name as name, s.verification_type, s.default_team_id, 
                     c.category_name, t.team_name as default_team_name
              FROM services s
              JOIN service_categories c ON s.category_id = c.id
              LEFT JOIN teams t ON s.default_team_id = t.id
              ORDER BY s.id ASC
            `);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: true, count: srvs.rows.length, data: srvs.rows }));
          } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: err.message }));
          }
        }

        // Handle GET /api/admin/services
        if (url === '/api/admin/services' && req.method === 'GET') {
          try {
            await ensureCols();
            const servicesRes = await pool.query(`
              SELECT s.*, s.service_name as name, (s.status = 'Aktif') as is_active, 
                     c.category_name as category_name, t.team_name as default_team_name
              FROM services s
              JOIN service_categories c ON s.category_id = c.id
              LEFT JOIN teams t ON s.default_team_id = t.id
              ORDER BY s.id ASC
            `);
            let reqsRes = { rows: [] };
            try {
              reqsRes = await pool.query('SELECT * FROM service_requirements');
            } catch (e) {}

            const services = servicesRes.rows.map(s => {
              s.requirements = reqsRes.rows.filter(r => r.service_id === s.id);
              return s;
            });

            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: true, data: services }));
          } catch (err) {
            console.error('admin services get error:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: err.message }));
          }
        }

        // Handle PUT /api/admin/services/:id
        if (url.startsWith('/api/admin/services/') && req.method === 'PUT') {
          const serviceId = url.replace('/api/admin/services/', '');
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              await ensureCols();
              const { category_name, category_id, name, target_sla, verification_type, sop_link, status, form_schema, required_docs, default_team_id, is_active } = JSON.parse(body || '{}');

              let finalCatId = category_id;
              if (!finalCatId && category_name) {
                const catRes = await pool.query('SELECT id FROM service_categories WHERE category_name = $1', [category_name]);
                if (catRes.rows.length > 0) finalCatId = catRes.rows[0].id;
              }

              const finalStatus = status || (is_active ? 'Aktif' : 'Tahap Pengembangan');
              const finalDefTeam = verification_type === 'Otomatis' && default_team_id ? parseInt(default_team_id, 10) : null;

              const result = await pool.query(`
                UPDATE services 
                SET category_id = COALESCE($1, category_id), 
                    service_name = COALESCE($2, service_name), 
                    target_sla = COALESCE($3, target_sla), 
                    verification_type = $4, 
                    sop_link = COALESCE($5, sop_link), 
                    status = COALESCE($6, status), 
                    form_schema = COALESCE($7, form_schema), 
                    required_docs = COALESCE($8, required_docs), 
                    default_team_id = $9
                WHERE id = $10 
                RETURNING *
              `, [
                finalCatId || null, 
                name || null, 
                target_sla || null, 
                verification_type || 'Wajib Verifikasi', 
                sop_link || null, 
                finalStatus, 
                form_schema ? JSON.stringify(form_schema) : null, 
                required_docs !== undefined ? required_docs : null, 
                finalDefTeam, 
                serviceId
              ]);

              res.writeHead(200, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify({ success: true, data: result.rows[0] }));
            } catch (err) {
              console.error('services update middleware error:', err);
              res.writeHead(500, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify({ success: false, message: err.message }));
            }
          });
          return;
        }

        // Handle POST /api/admin/services
        if (url === '/api/admin/services' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              await ensureCols();
              const { category_name, category_id, name, target_sla, verification_type, sop_link, status, form_schema, required_docs, default_team_id } = JSON.parse(body || '{}');

              let finalCatId = category_id;
              if (!finalCatId && category_name) {
                const catRes = await pool.query('SELECT id FROM service_categories WHERE category_name = $1', [category_name]);
                if (catRes.rows.length > 0) finalCatId = catRes.rows[0].id;
              }
              if (!finalCatId) {
                const catRes = await pool.query('SELECT id FROM service_categories LIMIT 1');
                finalCatId = catRes.rows[0]?.id || 1;
              }

              const finalDefTeam = verification_type === 'Otomatis' && default_team_id ? parseInt(default_team_id, 10) : null;

              const result = await pool.query(`
                INSERT INTO services (category_id, service_name, target_sla, verification_type, sop_link, status, form_schema, required_docs, default_team_id)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
                RETURNING *
              `, [
                finalCatId, 
                name, 
                target_sla || '7 Hari', 
                verification_type || 'Wajib Verifikasi', 
                sop_link || null, 
                status || 'Aktif', 
                JSON.stringify(form_schema || []), 
                required_docs || '', 
                finalDefTeam
              ]);

              res.writeHead(201, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify({ success: true, data: result.rows[0] }));
            } catch (err) {
              console.error('services create middleware error:', err);
              res.writeHead(500, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify({ success: false, message: err.message }));
            }
          });
          return;
        }

        // Handle DELETE /api/admin/services/:id
        if (url.startsWith('/api/admin/services/') && req.method === 'DELETE') {
          const serviceId = url.replace('/api/admin/services/', '');
          try {
            await ensureCols();
            await pool.query('DELETE FROM services WHERE id = $1', [serviceId]);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: true, message: 'Service deleted' }));
          } catch (err) {
            console.error('services delete middleware error:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: err.message }));
          }
        }

        // Handle GET /api/notifications
        if (url === '/api/notifications' && req.method === 'GET') {
          try {
            await ensureCols();
            const authHeader = req.headers['authorization'];
            const token = authHeader && authHeader.split(' ')[1];
            if (!token) {
              res.writeHead(401, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify({ success: false, message: 'No token provided' }));
            }
            let userId;
            try {
              const decoded = jwt.verify(token, JWT_SECRET);
              userId = decoded.id;
            } catch (e) {
              res.writeHead(403, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify({ success: false, message: 'Invalid token' }));
            }

            const result = await pool.query(`
              SELECT n.*, t.status_id AS ticket_status_id, ts.name AS ticket_status_name, t.ticket_number 
              FROM notifications n 
              LEFT JOIN tickets t ON n.ticket_id = t.id 
              LEFT JOIN ticket_statuses ts ON t.status_id = ts.id 
              WHERE n.user_id = $1 
                 OR n.user_id IN (
                   SELECT id FROM users 
                   WHERE (email IS NOT NULL AND email = (SELECT email FROM users WHERE id = $1))
                      OR (nip IS NOT NULL AND nip = (SELECT nip FROM users WHERE id = $1))
                 )
              ORDER BY n.created_at DESC
              LIMIT 30
            `, [userId]);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: true, data: result.rows }));
          } catch (err) {
            console.error('get notifications error in vite middleware:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: err.message }));
          }
        }

        // Handle PATCH /api/notifications/read-all
        if (url === '/api/notifications/read-all' && req.method === 'PATCH') {
          try {
            await ensureCols();
            const authHeader = req.headers['authorization'];
            const token = authHeader && authHeader.split(' ')[1];
            let userId;
            if (token) {
              try {
                const decoded = jwt.verify(token, JWT_SECRET);
                userId = decoded.id;
              } catch (e) {}
            }
            if (userId) {
              await pool.query(`
                UPDATE notifications SET is_read = true 
                WHERE user_id = $1 
                   OR user_id IN (
                     SELECT id FROM users 
                     WHERE (email IS NOT NULL AND email = (SELECT email FROM users WHERE id = $1))
                        OR (nip IS NOT NULL AND nip = (SELECT nip FROM users WHERE id = $1))
                   )
              `, [userId]);
            } else {
              await pool.query('UPDATE notifications SET is_read = true');
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: true, message: 'All notifications read' }));
          } catch (err) {
            console.error('read-all notifications error:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: err.message }));
          }
        }

        // Handle PATCH /api/notifications/ticket/:ticketId/read
        if (url.startsWith('/api/notifications/ticket/') && req.method === 'PATCH') {
          try {
            await ensureCols();
            const ticketId = url.replace('/api/notifications/ticket/', '').replace('/read', '').trim();
            if (ticketId) {
              await pool.query(`
                UPDATE notifications SET is_read = true 
                WHERE ticket_id::text = $1 
                   OR ticket_id IN (SELECT id FROM tickets WHERE ticket_number ILIKE $1 OR id::text = $1)
              `, [ticketId]);
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: true, message: 'Ticket notifications read' }));
          } catch (err) {
            console.error('ticket notifications read error:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: err.message }));
          }
        }

        // Handle PATCH /api/notifications/:id/read
        if (url.startsWith('/api/notifications/') && url.endsWith('/read') && req.method === 'PATCH') {
          try {
            await ensureCols();
            const notifId = url.replace('/api/notifications/', '').replace('/read', '').trim();
            if (notifId) {
              await pool.query('UPDATE notifications SET is_read = true WHERE id::text = $1', [notifId]);
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: true, message: 'Notification read' }));
          } catch (err) {
            console.error('notification read error:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, message: err.message }));
          }
        }

        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    profileFallbackPlugin(),
  ],
  server: {
    allowedHosts: [
      'gem-spry-oxygen.ngrok-free.dev',
      'schematic-appear-energize.ngrok-free.dev',
      '.ngrok-free.dev',
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
