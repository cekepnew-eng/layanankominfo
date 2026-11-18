const db = require('../config/database');
const bcrypt = require('bcryptjs');
const { getTndProfileImage } = require('../utils/tndProfileImage');
const { getPasswordPolicyFailures } = require('../utils/passwordPolicy');
const { recordRequestActivity } = require('../utils/activityLogger');

async function authenticateTndUser(identifier, password) {
  const normalizedIdentifier = String(identifier || '').trim();
  if (!normalizedIdentifier || !password) {
    const error = new Error('NIP/NIK/Gmail dan password TND wajib diisi.');
    error.status = 400;
    throw error;
  }

  const ssoUrl = process.env.SSO_API_URL || 'https://tnd.kotabogor.go.id/api-baru/api/v1/login';
  let response = null;
  try {
    response = await fetch(ssoUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: normalizedIdentifier, password })
    });
  } catch (err) {
    console.error('TND fetch network error in userController:', err.message);
  }

  const payload = await response?.json().catch(() => ({}));
  if (!response || response.status >= 500) {
    const error = new Error('Layanan login TND tidak dapat dihubungi. Periksa koneksi server.');
    error.status = 502;
    throw error;
  }
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

  // Normalize URLs and TND photo filenames to a browser-loadable URL.
  const profileImage = getTndProfileImage(user, payload, ssoUrl);

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
    phone_number: user.no_hp || user.no_telepon || '0000000000',
    profile_image: profileImage,
    profile_image_source: 'TND'
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

exports.createOpdUserFromTnd = async (req, res) => {
  const identifier = typeof req.body?.identifier === 'string' ? req.body.identifier.trim() : '';
  const profileFromRequest = req.body?.profile && typeof req.body.profile === 'object'
    ? req.body.profile
    : null;
  if (!identifier && !profileFromRequest) {
    return res.status(400).json({ success: false, message: 'NIP/NIK/Gmail OPD wajib diisi.' });
  }

  try {
    let profileRecord = profileFromRequest;
    let payload = null;
    let lookupUrl = null;

    if (!profileRecord) {
      const endpoint = process.env.TND_FIND_USER_URL;
      if (!endpoint) {
        return res.status(503).json({ success: false, message: 'Pencarian akun TND belum dikonfigurasi.' });
      }
      lookupUrl = new URL(endpoint);
      if (lookupUrl.protocol !== 'https:') {
        return res.status(500).json({ success: false, message: 'Konfigurasi URL pencarian TND tidak valid.' });
      }
      lookupUrl.searchParams.set('username', identifier);
      const response = await fetch(lookupUrl.toString(), {
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(8000)
      });
      if (response.status === 404) {
        return res.status(404).json({ success: false, message: 'Akun OPD tidak ditemukan di TND.' });
      }
      if (!response.ok) {
        return res.status(502).json({ success: false, message: 'Layanan pencarian akun TND mengembalikan kesalahan.' });
      }
      payload = await response.json().catch(() => null);
      const records = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.data?.users)
            ? payload.data.users
            : [payload?.data?.user || payload?.user || payload?.data || payload?.result || payload];
      profileRecord = records.find(record => record && typeof record === 'object')?.user
        || records.find(record => record && typeof record === 'object');
    }

    if (!profileRecord) {
      return res.status(404).json({ success: false, message: 'Akun OPD tidak ditemukan di TND.' });
    }

    const email = String(profileRecord.email || profileRecord.username || '').trim().toLowerCase();
    const nip = String(profileRecord.nip || profileRecord.nik || '').trim();
    const fullName = String(profileRecord.full_name || profileRecord.nama_lengkap || profileRecord.nama || profileRecord.name || '').trim();
    const department = String(profileRecord.department || profileRecord.nama_pd || profileRecord.unit_kerja || profileRecord.opd_name || '').trim();
    if (!fullName || (!email && !nip)) {
      return res.status(422).json({ success: false, message: 'Data identitas OPD dari TND tidak lengkap.' });
    }

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      const existingResult = await client.query(
        `SELECT id, email, nip, full_name, department, profile_image, profile_image_source
         FROM users
         WHERE ($1::text <> '' AND LOWER(email) = LOWER($1))
            OR ($2::text <> '' AND nip = $2)
         LIMIT 1`,
        [email, nip]
      );

      if (existingResult.rows.length > 0) {
        await client.query('COMMIT');
        const existing = existingResult.rows[0];
        return res.json({
          success: true,
          created: false,
          message: 'Akun OPD sudah terdaftar dan tiket akan terhubung ke akun tersebut.',
          user: {
            id: existing.id,
            email: existing.email,
            nip: existing.nip,
            name: existing.full_name,
            department: existing.department,
            source: 'WEB'
          }
        });
      }

      const roleResult = await client.query("SELECT id FROM roles WHERE name = 'USER'");
      if (roleResult.rows.length === 0) {
        throw new Error('Role USER belum tersedia.');
      }

      const placeholderHash = await bcrypt.hash(require('crypto').randomBytes(32).toString('hex'), 10);
      const finalEmail = email || `${nip}@kotabogor.go.id`;
      const profileImageBase = lookupUrl
        ? lookupUrl.toString()
        : (process.env.SSO_API_URL || 'https://tnd.kotabogor.go.id/api-baru/api/v1/login');
      const profileImage = getTndProfileImage(profileRecord, payload || {}, profileImageBase);
      const userResult = await client.query(
        `INSERT INTO users (
           email, nip, password_hash, full_name, department, profile_image, profile_image_source,
           is_active, is_two_factor_enabled, two_factor_secret, backup_codes, password_changed_at, password_auth_source
         )
         VALUES ($1, $2, $3, $4, $5, $6, 'TND', true, false, NULL, '[]'::jsonb, CURRENT_TIMESTAMP, 'TND')
         RETURNING id, email, nip, full_name, department`,
        [finalEmail, nip || null, placeholderHash, fullName, department, profileImage]
      );
      const user = userResult.rows[0];

      await client.query(
        'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)',
        [user.id, roleResult.rows[0].id]
      );
      await recordRequestActivity(client, req, {
        activityType: 'user_created',
        description: `Helpdesk membuat akun OPD ${fullName} dari data TND.`,
        metadata: { targetUserId: user.id, roles: ['USER'], source: 'TND' }
      });
      await client.query('COMMIT');

      return res.status(201).json({
        success: true,
        created: true,
        message: 'Akun OPD berhasil dibuat otomatis dari TND.',
        user: {
          id: user.id,
          email: user.email,
          nip: user.nip,
          name: user.full_name,
          department: user.department,
          source: 'WEB'
        }
      });
    } catch (error) {
      await client.query('ROLLBACK');
      if (error.code === '23505') {
        return res.status(409).json({ success: false, message: 'Email atau NIP OPD sudah terdaftar.' });
      }
      console.error('createOpdUserFromTnd error:', error);
      return res.status(500).json({ success: false, message: 'Gagal membuat akun OPD otomatis.' });
    } finally {
      client.release();
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      return res.status(504).json({ success: false, message: 'Pencarian akun TND melewati batas waktu.' });
    }
    console.error('createOpdUserFromTnd lookup error:', error);
    return res.status(500).json({ success: false, message: 'Gagal memproses data akun TND.' });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const result = await db.pool.query(`
      SELECT u.id, u.email, u.nip, u.full_name as name, u.phone_number as phone, u.department, u.created_at,
             u.password_auth_source,
             u.profile_image, u.profile_image_source,
             COALESCE(tm.team_name, 'Dinas Komunikasi dan Informatika') as team,
             COALESCE(tm.team_ids, ARRAY[]::INTEGER[]) as team_ids,
             legacy_role.name as legacy_role
      FROM users u
      LEFT JOIN roles legacy_role ON legacy_role.id = u.role_id
      LEFT JOIN (
        SELECT tm.user_id,
               STRING_AGG(teams.team_name, ', ') as team_name,
               ARRAY_AGG(teams.id ORDER BY teams.team_name) as team_ids
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

      if (roles.length === 0) {
        roles.push(String(row.legacy_role || 'USER').toUpperCase());
      }

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
  const shouldUpdateTeams = Array.isArray(req.body?.team_ids) || team_id !== undefined;
  const rawTeamIds = Array.isArray(req.body?.team_ids)
    ? req.body.team_ids
    : team_id === undefined || team_id === null || team_id === ''
      ? []
      : [team_id];
  const teamIds = [...new Set(rawTeamIds.map(Number))];

  if (shouldUpdateTeams && teamIds.some(teamId => !Number.isInteger(teamId) || teamId <= 0)) {
    return res.status(400).json({ success: false, message: 'Penugasan tim kerja tidak valid.' });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    if (shouldUpdateTeams) {
      if (teamIds.length > 0) {
        const teamRes = await client.query('SELECT id FROM teams WHERE id = ANY($1::int[])', [teamIds]);
        if (teamRes.rows.length !== teamIds.length) {
          await client.query('ROLLBACK');
          return res.status(400).json({ success: false, message: 'Tim kerja yang dipilih tidak ditemukan.' });
        }
      }
      await client.query('DELETE FROM team_members WHERE user_id = $1', [id]);
      for (const teamId of teamIds) {
        await client.query('INSERT INTO team_members (user_id, team_id) VALUES ($1, $2)', [id, teamId]);
      }
    }

    if (Array.isArray(roleNames) && roleNames.length > 0) {
      // Pastikan OPD tidak bisa menjadi Masyarakat dan Masyarakat tidak bisa menjadi OPD
      const uRes = await client.query(
        'SELECT department, password_auth_source, nip, profile_image_source FROM users WHERE id = $1 FOR UPDATE',
        [id]
      );
      if (!uRes.rows[0]) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
      }
      const dept = (uRes.rows[0]?.department || '').trim().toLowerCase();
      const isMasyarakat = dept === 'masyarakat umum' || dept === 'masyarakat';
      const isManualLocalUser =
        String(uRes.rows[0].password_auth_source || 'LOCAL').toUpperCase() === 'LOCAL'
        && !uRes.rows[0].nip
        && String(uRes.rows[0].profile_image_source || '').toUpperCase() !== 'TND';

      let normalized = roleNames.map(r => String(r).trim().toUpperCase()).filter(Boolean);

      if (isMasyarakat) {
        normalized = ['MASYARAKAT'];
      } else {
        normalized = normalized.filter(r => r !== 'MASYARAKAT');
        if (!isManualLocalUser && !normalized.includes('USER')) {
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

    const targetUser = await client.query('SELECT full_name FROM users WHERE id = $1', [id]);
    await recordRequestActivity(client, req, {
      activityType: 'user_updated',
      description: `Admin memperbarui role atau penugasan pengguna ${targetUser.rows[0]?.full_name || id}.`,
      metadata: { targetUserId: id, roles: roleNames, teamIds: shouldUpdateTeams ? teamIds : undefined }
    });
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
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const targetUser = await client.query(
      'SELECT full_name, nip, password_auth_source FROM users WHERE id = $1 FOR UPDATE',
      [id]
    );
    if (!targetUser.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
    }
    if (
      String(targetUser.rows[0].password_auth_source || '').toUpperCase() === 'TND'
      || Boolean(targetUser.rows[0].nip)
    ) {
      await client.query('ROLLBACK');
      return res.status(403).json({ success: false, message: 'Akun yang terhubung ke TND/API tidak dapat dihapus.' });
    }
    const ticketHistory = await client.query(
      'SELECT EXISTS (SELECT 1 FROM tickets WHERE user_id = $1) AS has_ticket_history',
      [id]
    );
    if (ticketHistory.rows[0].has_ticket_history) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        message: 'Pengguna tidak dapat dihapus karena memiliki riwayat tiket.'
      });
    }
    await recordRequestActivity(client, req, {
      activityType: 'user_deleted',
      description: `Admin menghapus pengguna ${targetUser.rows[0].full_name}.`,
      metadata: { targetUserId: id }
    });
    await client.query('DELETE FROM users WHERE id = $1', [id]);
    await client.query('COMMIT');
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.code === '23503') {
      return res.status(409).json({
        success: false,
        message: 'Akun ini masih memiliki data yang terkait, seperti notifikasi atau riwayat tiket, sehingga belum dapat dihapus.'
      });
    }
    res.status(500).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
};

exports.reset2FA = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.pool.query(
      `UPDATE users 
       SET is_two_factor_enabled = false, 
           two_factor_secret = null, 
           two_factor_reset_at = CURRENT_TIMESTAMP 
       WHERE id = $1 RETURNING full_name`,
      [id]
    );
    if (result.rows[0]) {
      await recordRequestActivity(db, req, {
        activityType: 'user_2fa_reset',
        description: `Admin mereset autentikasi dua faktor pengguna ${result.rows[0].full_name}.`,
        metadata: { targetUserId: id }
      });
    }
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
       WHERE LOWER(email) = LOWER($1) OR ($2::text IS NOT NULL AND nip = $2)
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
         email, nip, password_hash, full_name, phone_number, department, profile_image, profile_image_source,
         is_active, is_two_factor_enabled, two_factor_secret, backup_codes, password_changed_at, password_auth_source
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, false, NULL, '[]'::jsonb, CURRENT_TIMESTAMP, 'TND')
       RETURNING id`,
        [profile.email, profile.nip, hashedPassword, profile.full_name, profile.phone_number, profile.department, profile.profile_image, profile.profile_image_source]
      );
      const userId = userRes.rows[0].id;

      const roleRes = await client.query("SELECT id FROM roles WHERE name = 'USER'");
      if (roleRes.rows.length === 0) {
        throw new Error('Role USER belum tersedia.');
      }
      await client.query('INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)', [userId, roleRes.rows[0].id]);

      await recordRequestActivity(client, req, {
        activityType: 'user_created',
        description: `Admin membuat akun OPD ${profile.full_name}.`,
        metadata: { targetUserId: userId, roles: ['USER'] }
      });
      await client.query('COMMIT');
      res.json({
        success: true,
        message: 'Akun OPD berhasil dibuat.',
        userId,
        profile_image: profile.profile_image,
        profile_image_source: profile.profile_image_source
      });
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

exports.createManualUser = async (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const fullName = typeof req.body?.fullName === 'string' ? req.body.fullName.trim() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const confirmPassword = typeof req.body?.confirmPassword === 'string' ? req.body.confirmPassword : '';
  const phoneNumber = typeof req.body?.phoneNumber === 'string' ? req.body.phoneNumber.trim() : '';
  const rawRoleNames = Array.isArray(req.body?.roleNames)
    ? req.body.roleNames
    : [typeof req.body?.roleName === 'string' ? req.body.roleName : 'MASYARAKAT'];
  const hasInvalidRoleInput = rawRoleNames.some(role => typeof role !== 'string');
  const roleNames = [...new Set(rawRoleNames
    .filter(role => typeof role === 'string')
    .map(role => role.trim().toUpperCase()))];
  const department = typeof req.body?.department === 'string' ? req.body.department.trim() : '';
  const rawTeamIds = Array.isArray(req.body?.teamIds)
    ? req.body.teamIds
    : req.body?.teamId !== undefined && req.body?.teamId !== null && req.body?.teamId !== ''
      ? [req.body.teamId]
      : [];
  const teamIds = [...new Set(rawTeamIds.map(Number))];
  const allowedRoles = new Set(['ADMIN', 'HELPDESK', 'PEGAWAI', 'USER', 'MASYARAKAT']);
  const rolePriority = ['ADMIN', 'HELPDESK', 'PEGAWAI', 'USER', 'MASYARAKAT'];
  const roleName = rolePriority.find(role => roleNames.includes(role));

  if (!fullName || fullName.length > 255) {
    return res.status(400).json({ success: false, message: 'Nama lengkap wajib diisi dan maksimal 255 karakter.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255) {
    return res.status(400).json({ success: false, message: 'Masukkan alamat email yang valid.' });
  }
  if (hasInvalidRoleInput || roleNames.length === 0 || roleNames.some(role => !allowedRoles.has(role))) {
    return res.status(400).json({ success: false, message: 'Pilih minimal satu role akun yang valid.' });
  }
  if (roleNames.includes('MASYARAKAT') && roleNames.length > 1) {
    return res.status(400).json({ success: false, message: 'Role Masyarakat tidak dapat digabung dengan role lainnya.' });
  }
  if (!roleNames.includes('MASYARAKAT') && (!department || department.length > 255)) {
    return res.status(400).json({ success: false, message: 'Instansi/perangkat daerah wajib diisi dan maksimal 255 karakter.' });
  }
  if (teamIds.some(id => !Number.isInteger(id) || id <= 0)) {
    return res.status(400).json({ success: false, message: 'Tim kerja yang dipilih tidak valid.' });
  }
  if (!roleNames.includes('PEGAWAI') && teamIds.length > 0) {
    return res.status(400).json({ success: false, message: 'Tim kerja hanya dapat ditetapkan untuk role Pegawai.' });
  }
  const passwordFailures = getPasswordPolicyFailures(password);
  if (passwordFailures.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Password belum memenuhi kriteria keamanan: ${passwordFailures.join(', ')}.`
    });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ success: false, message: 'Konfirmasi password tidak cocok.' });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const existingUser = await client.query(
      'SELECT id FROM users WHERE LOWER(email) = $1 LIMIT 1',
      [email]
    );
    if (existingUser.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ success: false, message: 'Email sudah terdaftar.' });
    }

    const roleIds = [];
    let primaryRoleId;
    for (const selectedRole of roleNames) {
      await client.query(
        'INSERT INTO roles (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
        [selectedRole]
      );
      const roleRes = await client.query('SELECT id FROM roles WHERE name = $1', [selectedRole]);
      if (roleRes.rows.length === 0) {
        throw new Error(`Role ${selectedRole} belum tersedia.`);
      }
      roleIds.push(roleRes.rows[0].id);
      if (selectedRole === roleName) primaryRoleId = roleRes.rows[0].id;
    }
    if (teamIds.length > 0) {
      const teamRes = await client.query('SELECT id FROM teams WHERE id = ANY($1::int[])', [teamIds]);
      if (teamRes.rows.length !== teamIds.length) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, message: 'Tim kerja yang dipilih tidak ditemukan.' });
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userRes = await client.query(
      `INSERT INTO users (
         email, password_hash, full_name, phone_number, role_id, department, is_active,
         is_two_factor_enabled, two_factor_secret, backup_codes, password_changed_at, password_auth_source
       )
       VALUES ($1, $2, $3, $4, $5, $6, true, false, NULL, '[]'::jsonb, CURRENT_TIMESTAMP, 'LOCAL')
       RETURNING id`,
      [
        email,
        passwordHash,
        fullName,
        phoneNumber || null,
        primaryRoleId,
        roleNames.includes('MASYARAKAT') ? 'Masyarakat Umum' : department
      ]
    );
    for (const roleId of roleIds) {
      await client.query(
        'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)',
        [userRes.rows[0].id, roleId]
      );
    }
    for (const teamId of teamIds) {
      await client.query('INSERT INTO team_members (user_id, team_id) VALUES ($1, $2)', [userRes.rows[0].id, teamId]);
    }

    await recordRequestActivity(client, req, {
      activityType: 'user_created',
      description: `Admin membuat akun ${fullName}.`,
      metadata: { targetUserId: userRes.rows[0].id, roles: roleNames, teamIds }
    });
    await client.query('COMMIT');
    res.status(201).json({
      success: true,
      message: `Akun dengan role ${roleNames.map(role => role === 'USER' ? 'OPD' : role).join(', ')} berhasil dibuat.`,
      userId: userRes.rows[0].id,
      user: {
        id: userRes.rows[0].id,
        email,
        name: fullName,
        role: roleName,
        roles: roleNames,
        department: roleNames.includes('MASYARAKAT') ? 'Masyarakat Umum' : department,
        team_ids: teamIds
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.code === '23505') {
      return res.status(409).json({ success: false, message: 'Email sudah terdaftar.' });
    }
    console.error('createManualUser error:', error);
    res.status(500).json({ success: false, message: 'Gagal membuat akun manual.' });
  } finally {
    client.release();
  }
};

exports.createMasyarakatUserManual = exports.createManualUser;

exports.getOpdUsers = async (req, res) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const searchTnd = req.query.searchTnd === 'true';
    if (req.query.search !== undefined && typeof req.query.search !== 'string') {
      return res.status(400).json({ success: false, message: 'Kata kunci pencarian tidak valid.' });
    }
    if (searchTnd && search.length < 3) {
      return res.status(400).json({ success: false, message: 'Masukkan minimal 3 karakter untuk mencari akun TND.' });
    }

    let query = `
      SELECT u.id, u.email, u.nip, u.full_name as name, u.phone_number as phone, u.department,
             u.profile_image, u.profile_image_source,
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

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (u.full_name ILIKE $${params.length} OR u.email ILIKE $${params.length} OR u.department ILIKE $${params.length} OR (u.nip IS NOT NULL AND u.nip ILIKE $${params.length}))`;
    }

    query += `
      GROUP BY u.id, u.email, u.nip, u.full_name, u.phone_number, u.department,
               u.profile_image, u.profile_image_source
      ORDER BY u.department ASC, u.full_name ASC
      LIMIT 100
    `;

    const result = await db.pool.query(query, params);
    const localUsers = result.rows;
    let tndUsers = [];

    if (searchTnd) {
      const endpoint = process.env.TND_FIND_USER_URL;
      if (!endpoint) {
        return res.status(503).json({
          success: false,
          message: 'Pencarian akun TND belum dikonfigurasi di backend/.env.',
          data: localUsers
        });
      }

      let lookupUrl;
      try {
        lookupUrl = new URL(endpoint);
        if (lookupUrl.protocol !== 'https:') {
          throw new Error('TND_FIND_USER_URL harus menggunakan HTTPS.');
        }
        lookupUrl.searchParams.set('username', search);
      } catch (error) {
        console.error('Invalid TND_FIND_USER_URL:', error.message);
        return res.status(500).json({
          success: false,
          message: 'Konfigurasi URL pencarian akun TND tidak valid.',
          data: localUsers
        });
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      let response;
      try {
        response = await fetch(lookupUrl.toString(), {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        });
      } catch (error) {
        console.error('TND user search request failed:', error.message);
        return res.status(502).json({
          success: false,
          message: 'Layanan pencarian akun TND tidak dapat dihubungi.',
          data: localUsers
        });
      } finally {
        clearTimeout(timeout);
      }

      if (response.status !== 404 && !response.ok) {
        console.error('TND user search returned HTTP status:', response.status);
        return res.status(502).json({
          success: false,
          message: 'Layanan pencarian akun TND mengembalikan kesalahan.',
          data: localUsers
        });
      }

      if (response.status !== 404) {
        let payload;
        try {
          payload = await response.json();
        } catch (error) {
          console.error('TND user search returned invalid JSON:', error.message);
          return res.status(502).json({
            success: false,
            message: 'Respons layanan pencarian akun TND tidak valid.',
            data: localUsers
          });
        }

        const records = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
            ? payload.data
            : Array.isArray(payload?.data?.users)
              ? payload.data.users
              : [payload?.data?.user || payload?.user || payload?.data || payload?.result || payload];

        tndUsers = records
          .filter(record => record && typeof record === 'object')
          .map(record => {
            const user = record.user || record;
            const email = user.email || user.username || '';
            const nip = user.nip || user.nik || '';
            const name = user.full_name || user.nama_lengkap || user.nama || user.name || email || nip;
            const department = user.department || user.nama_pd || user.unit_kerja || user.opd_name || '';
            if (!name && !email && !nip) return null;

            return {
              email: String(email),
              nip: String(nip),
              name: String(name),
              department: String(department),
              source: 'TND'
            };
          })
          .filter(Boolean);
      }
    }

    const localEmails = new Set(localUsers.map(user => String(user.email || '').toLowerCase()).filter(Boolean));
    const localNips = new Set(localUsers.map(user => String(user.nip || '').toLowerCase()).filter(Boolean));
    const newTndUsers = tndUsers.filter(user =>
      (!user.email || !localEmails.has(user.email.toLowerCase()))
      && (!user.nip || !localNips.has(user.nip.toLowerCase()))
    );

    res.json({ success: true, data: [...localUsers, ...newTndUsers] });
  } catch (error) {
    console.error('getOpdUsers error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
