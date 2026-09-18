const db = require('../config/database');

exports.getAllUsers = async (req, res) => {
  try {
    const result = await db.pool.query(`
      SELECT u.id, u.email, u.full_name as name, u.phone_number as phone, u.department,
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

      const primaryRole = roles.includes('MASYARAKAT') ? 'MASYARAKAT' : roles.includes('USER') ? 'USER' : roles.includes('ADMIN') ? 'ADMIN' : roles.includes('HELPDESK') ? 'HELPDESK' : roles.includes('PEGAWAI') ? 'PEGAWAI' : roles[0];
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
      const normalized = roleNames.map(r => String(r).trim().toUpperCase()).filter(Boolean);
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
