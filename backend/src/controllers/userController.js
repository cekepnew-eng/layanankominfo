const db = require('../config/database');

exports.getAllUsers = async (req, res) => {
  try {
    const result = await db.pool.query(`
      SELECT u.id, u.email, u.full_name as name, u.phone_number as phone, r.name as role, t.id as team_id, t.team_name as team
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN teams t ON u.team_id = t.id
      ORDER BY u.id ASC
    `);
    
    // Format to match frontend: roles: [uppercase_role], role: uppercase_role
    const formatted = result.rows.map(row => {
      const roleStr = (row.role || 'USER').toUpperCase();
      return {
        ...row,
        department: row.team || 'Bukan Anggota Tim',
        role: roleStr,
        roles: [roleStr]
      };
    });

    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateUserRole = async (req, res) => {
  const { id } = req.params;
  const { roleName, team_id } = req.body;
  try {
    const roleRes = await db.pool.query('SELECT id FROM roles WHERE name = $1', [roleName.toUpperCase()]);
    if (roleRes.rows.length === 0) return res.status(400).json({ success: false, message: 'Role not found' });
    const roleId = roleRes.rows[0].id;
    
    if (team_id !== undefined) {
      await db.pool.query('UPDATE users SET role_id = $1, team_id = $2 WHERE id = $3', [roleId, team_id || null, id]);
    } else {
      await db.pool.query('UPDATE users SET role_id = $1 WHERE id = $2', [roleId, id]);
    }
    
    res.json({ success: true, message: 'User updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
