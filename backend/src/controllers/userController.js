const db = require('../config/database');
const bcrypt = require('bcryptjs');

async function authenticateTndUser(identifier, password) {
  const normalizedIdentifier = String(identifier || '').trim();
  if (!normalizedIdentifier || !password) {
    const error = new Error('NIP/NIK/Gmail dan password TND wajib diisi.');
    error.status = 400;
    throw error;
  }

  const ssoUrl = process.env.SSO_API_URL || 'https://dev-tnd.kotabogor.go.id/api-baru/api/v1/login';
  const response = await fetch(ssoUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: normalizedIdentifier, password })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.success === false) {
    const error = new Error('NIP/NIK/Gmail tidak terdaftar di TND atau password TND salah.');
    error.status = 400;
    throw error;
  }

  const user = payload?.data?.user || payload?.user || {};
  const nip = user.nip || (/^\d{10,}$/.test(normalizedIdentifier) ? normalizedIdentifier : null);
  const emailFromTnd = user.email || (normalizedIdentifier.includes('@') ? normalizedIdentifier : null);
  const email = emailFromTnd || `${nip || normalizedIdentifier}@kotabogor.go.id`;
  const fullName = user.nama || payload?.data?.nama_lengkap || user.name || '';
  const department = user.nama_pd || user.unit_kerja || payload?.data?.opd_name || '';

  if (!fullName || !department) {
    const error = new Error('Data nama atau OPD tidak ditemukan pada akun TND.');
    error.status = 422;
    throw error;
  }

  return {
    email: String(email).trim().toLowerCase(),
    nip,
    full_name: String(fullName).trim(),
    department: String(department).trim(),
    phone_number: user.no_hp || user.no_telepon || '0000000000'
  };
}

exports.verifyTndManualUser = async (req, res) => {
  try {
    const profile = await authenticateTndUser(req.body.identifier, req.body.password);
    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(error.status || 502).json({
      success: false,
      message: error.status ? error.message : 'Layanan login TND tidak dapat dihubungi. Periksa koneksi server.'
    });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const result = await db.pool.query(`
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
        const roleRes = await db.pool.query(
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

    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateUserRole = async (req, res) => {
  const { id } = req.params;
  const { roleNames, team_id } = req.body;

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    if (team_id !== undefined) {
      await client.query('DELETE FROM team_members WHERE user_id = $1', [id]);
      if (team_id) {
         await client.query('INSERT INTO team_members (user_id, team_id) VALUES ($1, $2)', [id, team_id]);
      }
    }

    if (Array.isArray(roleNames) && roleNames.length > 0) {
      // Pastikan OPD tidak bisa menjadi Masyarakat dan Masyarakat tidak bisa menjadi OPD
      const uRes = await client.query('SELECT department FROM users WHERE id = $1', [id]);
      const dept = (uRes.rows[0]?.department || '').trim().toLowerCase();
      const isMasyarakat = dept === 'masyarakat umum' || dept === 'masyarakat';

      let normalized = roleNames.map(r => String(r).trim().toUpperCase()).filter(Boolean);

      if (isMasyarakat) {
        normalized = ['MASYARAKAT'];
      } else {
        normalized = normalized.filter(r => r !== 'MASYARAKAT');
        if (!normalized.includes('USER')) {
          normalized.push('USER');
        }
      }

      await client.query('DELETE FROM user_roles WHERE user_id = $1', [id]);

      for (const rName of normalized) {
        const roleRes = await client.query('SELECT id FROM roles WHERE name = $1', [rName]);
        if (roleRes.rows.length > 0) {
          await client.query('INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [id, roleRes.rows[0].id]);
        }
      }

      // Primary role is dynamically computed based on user_roles now
      // No need to update users.role_id as it was dropped in the new schema
    }

    await client.query('COMMIT');
    res.json({ success: true, message: 'User updated' });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
};

exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    await db.pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.reset2FA = async (req, res) => {
  const { id } = req.params;
  try {
    await db.pool.query(
      `UPDATE users 
       SET is_two_factor_enabled = false, 
           two_factor_secret = null, 
           two_factor_reset_at = CURRENT_TIMESTAMP 
       WHERE id = $1`,
      [id]
    );
    res.json({ success: true, message: '2FA berhasil direset. User harus scan QR ulang saat login.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createUserManual = async (req, res) => {
  const { identifier, password } = req.body;
  try {
    const profile = await authenticateTndUser(identifier, password);
    const client = await db.pool.connect();
    try {
    await client.query('BEGIN');
    const existingUser = await client.query(
      `SELECT id FROM users
       WHERE LOWER(email) = LOWER($1) OR ($2 IS NOT NULL AND nip = $2)
       LIMIT 1`,
      [profile.email, profile.nip]
    );
    if (existingUser.rows.length > 0) {
      const error = new Error('Akun dengan email atau NIP/NIK tersebut sudah terdaftar.');
      error.status = 409;
      throw error;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRes = await client.query(
      `INSERT INTO users (
         email, nip, password_hash, full_name, phone_number, department, is_active,
         is_two_factor_enabled, two_factor_secret, backup_codes
       )
       VALUES ($1, $2, $3, $4, $5, $6, true, false, NULL, '[]'::jsonb)
       RETURNING id`,
      [profile.email, profile.nip, hashedPassword, profile.full_name, profile.phone_number, profile.department]
    );
    const userId = userRes.rows[0].id;

    const roleRes = await client.query("SELECT id FROM roles WHERE name = 'USER'");
    if (roleRes.rows.length === 0) {
      throw new Error('Role USER belum tersedia.');
    }
    await client.query('INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)', [userId, roleRes.rows[0].id]);

    await client.query('COMMIT');
    res.json({ success: true, message: 'Akun OPD berhasil dibuat.', userId });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

exports.getOpdUsers = async (req, res) => {
  try {
    const { search } = req.query;
    let query = `
      SELECT u.id, u.email, u.nip, u.full_name as name, u.phone_number as phone, u.department,
             COALESCE(array_agg(r.name), ARRAY[]::varchar[]) as roles
      FROM users u
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE (
        u.department IS NOT NULL 
        AND TRIM(u.department) != '' 
        AND LOWER(TRIM(u.department)) NOT IN ('masyarakat umum', 'masyarakat')
      )
    `;
    const params = [];

    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      query += ` AND (u.full_name ILIKE $${params.length} OR u.email ILIKE $${params.length} OR u.department ILIKE $${params.length} OR (u.nip IS NOT NULL AND u.nip ILIKE $${params.length}))`;
    }

    query += `
      GROUP BY u.id, u.email, u.nip, u.full_name, u.phone_number, u.department
      ORDER BY u.department ASC, u.full_name ASC
      LIMIT 100
    `;

    const result = await db.pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
