const db = require('../config/database');

exports.getAllUsers = async (req, res) => {
  try {
    const result = await db.pool.query(`
      SELECT u.id, u.email, u.full_name as name, u.phone_number as phone, array_agg(r.name) as roles, t.id as team_id, t.team_name as team
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      LEFT JOIN teams t ON u.team_id = t.id
      GROUP BY u.id, t.id, t.team_name
      ORDER BY u.id ASC
    `);
    
    const formatted = result.rows.map(row => {
      const rawRoles = row.roles ? row.roles.filter(Boolean) : [];
      if (rawRoles.length === 0) rawRoles.push('USER');
      
      const rolesArray = rawRoles.map(r => r.toUpperCase());
      const primaryRole = rolesArray.includes('USER') ? 'USER' : (rolesArray.includes('MASYARAKAT') ? 'MASYARAKAT' : rolesArray[0]);

      return {
        ...row,
        department: row.team || (rolesArray.includes('MASYARAKAT') ? 'Masyarakat Umum' : 'Dinas Komunikasi dan Informatika'),
        role: primaryRole,
        roles: rolesArray
      };
    });

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
      await client.query('UPDATE users SET team_id = $1 WHERE id = $2', [team_id || null, id]);
    }
    
    if (Array.isArray(roleNames) && roleNames.length > 0) {
      await client.query('DELETE FROM user_roles WHERE user_id = $1', [id]);
      
      for (const rName of roleNames) {
        const roleRes = await client.query('SELECT id FROM roles WHERE name = $1', [rName.toUpperCase()]);
        if (roleRes.rows.length > 0) {
           await client.query('INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)', [id, roleRes.rows[0].id]);
        }
      }
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
