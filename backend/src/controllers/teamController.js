const db = require('../config/database');

exports.getAllTeams = async (req, res) => {
  try {
    const result = await db.pool.query('SELECT * FROM teams ORDER BY id ASC');
    
    // Also fetch members for each team to match frontend structure
    const membersRes = await db.pool.query(`
      SELECT u.full_name, t.id as team_id 
      FROM users u 
      JOIN teams t ON u.team_id = t.id
    `);

    const teams = result.rows.map(team => {
      const members = membersRes.rows.filter(m => m.team_id === team.id).map(m => m.full_name);
      return {
        id: team.id,
        name: team.team_name,
        description: team.description,
        members: members,
        leader: members[0] || '' // Mock leader for now
      };
    });

    res.json({ success: true, data: teams });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createTeam = async (req, res) => {
  const { name, description, members, leader } = req.body;
  try {
    const result = await db.pool.query(
      'INSERT INTO teams (team_name, description) VALUES ($1, $2) RETURNING id, team_name as name, description',
      [name, description]
    );
    const teamId = result.rows[0].id;

    if (members && members.length > 0) {
      await db.pool.query(
        'UPDATE users SET team_id = $1 WHERE full_name = ANY($2)',
        [teamId, members]
      );
    }
    
    // Set leader if needed (currently we just return it based on members, but frontend expects it back)
    res.json({ success: true, data: { ...result.rows[0], members: members || [], leader: leader || '' } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateTeam = async (req, res) => {
  const { id } = req.params;
  const { name, description, members, leader } = req.body;
  try {
    const result = await db.pool.query(
      'UPDATE teams SET team_name = $1, description = $2 WHERE id = $3 RETURNING id, team_name as name, description',
      [name, description, id]
    );

    // Reset team_id for all current members
    await db.pool.query('UPDATE users SET team_id = NULL WHERE team_id = $1', [id]);

    if (members && members.length > 0) {
      await db.pool.query(
        'UPDATE users SET team_id = $1 WHERE full_name = ANY($2)',
        [id, members]
      );
    }

    res.json({ success: true, data: { ...result.rows[0], members: members || [], leader: leader || '' } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteTeam = async (req, res) => {
  const { id } = req.params;
  try {
    // Need to unset team_id in users first
    await db.pool.query('UPDATE users SET team_id = NULL WHERE team_id = $1', [id]);
    await db.pool.query('DELETE FROM teams WHERE id = $1', [id]);
    res.json({ success: true, message: 'Team deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
