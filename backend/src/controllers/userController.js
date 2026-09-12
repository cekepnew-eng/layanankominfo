const db = require('../config/database');

exports.getAllUsers = async (req, res) => {
  try {
    const result = await db.pool.query(`
      SELECT u.id, u.email, u.full_name as name, u.department, r.name as role
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      ORDER BY u.id ASC
    `);
    
    // Format to match frontend: roles: [lowercase_role], role: lowercase_role
    const formatted = result.rows.map(row => {
      const lowercaseRole = (row.role || 'user').toLowerCase();
      return {
        ...row,
        role: lowercaseRole,
        roles: [lowercaseRole]
      };
    });

    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.updateUserRole = async (req, res) => {
  const { id } = req.params;
  const { roleName } = req.body;
  try {
    const roleRes = await db.pool.query('SELECT id FROM roles WHERE name = $1', [roleName.toUpperCase()]);
    if (roleRes.rows.length === 0) return res.status(400).json({ success: false, message: 'Role not found' });
    const roleId = roleRes.rows[0].id;
    await db.pool.query('UPDATE users SET role_id = $1 WHERE id = $2', [roleId, id]);
    res.json({ success: true, message: 'User role updated' });
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
