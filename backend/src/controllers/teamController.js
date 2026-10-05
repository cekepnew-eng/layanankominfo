const db = require('../config/database');

exports.getAllTeams = async (req, res) => {
  try {
    const result = await db.pool.query(`
      SELECT t.*, u.full_name as leader_name 
      FROM teams t 
      LEFT JOIN users u ON u.id = t.leader_id 
      ORDER BY t.id ASC
    `);

    const membersRes = await db.pool.query(`
      SELECT tm.team_id, u.id as user_id, u.full_name
      FROM team_members tm
      JOIN users u ON u.id = tm.user_id
      ORDER BY tm.user_id ASC
    `);

    const teams = result.rows.map(team => {
      const members = membersRes.rows
        .filter(m => m.team_id === team.id)
        .map(m => m.full_name);

      return {
        id: team.id,
        name: team.team_name,
        description: team.description,
        members: members,
        leader: team.leader_name || members[0] || ''
      };
    });

    res.json({ success: true, data: teams });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createTeam = async (req, res) => {
  const { name, description, members, leader } = req.body;
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');
    const leaderMatch = leader ? await client.query('SELECT id FROM users WHERE full_name = $1', [leader]) : null;
    const leaderId = leaderMatch?.rows?.[0]?.id || null;

    const result = await client.query(
      'INSERT INTO teams (team_name, description, leader_id) VALUES ($1, $2, $3) RETURNING id, team_name as name, description',
      [name, description, leaderId]
    );
    const teamId = result.rows[0].id;

    let finalMembers = [...(members || [])];
    if (leader) {
      finalMembers = finalMembers.filter(m => m !== leader);
      finalMembers.unshift(leader);
    }

    const memberIds = await Promise.all(finalMembers.map(async (member) => {
      if (typeof member === 'object' && member?.id) return member.id;
      if (typeof member === 'string') {
        const match = await client.query('SELECT id FROM users WHERE full_name = $1', [member]);
        return match.rows[0]?.id || null;
      }
      return null;
    }));

    const validMemberIds = memberIds.filter(Boolean);
    if (validMemberIds.length > 0) {
      await client.query('DELETE FROM team_members WHERE team_id = $1', [teamId]);
      for (const userId of validMemberIds) {
        await client.query(
          'INSERT INTO team_members (team_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [teamId, userId]
        );
        // Grant PEGAWAI role
        await client.query(
          "INSERT INTO user_roles (user_id, role_id) SELECT $1, id FROM roles WHERE name = 'PEGAWAI' ON CONFLICT DO NOTHING",
          [userId]
        );
      }
    }

    await client.query('COMMIT');
    res.json({ success: true, data: { ...result.rows[0], members: members || [], leader: leader || '' } });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
};

exports.updateTeam = async (req, res) => {
  const { id } = req.params;
  const { name, description, members, leader } = req.body;
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');
    const leaderMatch = leader ? await client.query('SELECT id FROM users WHERE full_name = $1', [leader]) : null;
    const leaderId = leaderMatch?.rows?.[0]?.id || null;

    const result = await client.query(
      'UPDATE teams SET team_name = $1, description = $2, leader_id = $3 WHERE id = $4 RETURNING id, team_name as name, description',
      [name, description, leaderId, id]
    );

    await client.query('DELETE FROM team_members WHERE team_id = $1', [id]);

    let finalMembers = [...(members || [])];
    if (leader) {
      finalMembers = finalMembers.filter(m => m !== leader);
      finalMembers.unshift(leader);
    }

    const memberIds = await Promise.all(finalMembers.map(async (member) => {
      if (typeof member === 'object' && member?.id) return member.id;
      if (typeof member === 'string') {
        const match = await client.query('SELECT id FROM users WHERE full_name = $1', [member]);
        return match.rows[0]?.id || null;
      }
      return null;
    }));

    const validMemberIds = memberIds.filter(Boolean);
    for (const userId of validMemberIds) {
      await client.query(
        'INSERT INTO team_members (team_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [id, userId]
      );
      // Grant PEGAWAI role
      await client.query(
        "INSERT INTO user_roles (user_id, role_id) SELECT $1, id FROM roles WHERE name = 'PEGAWAI' ON CONFLICT DO NOTHING",
        [userId]
      );
    }

    await client.query('COMMIT');
    res.json({ success: true, data: { ...result.rows[0], members: members || [], leader: leader || '' } });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
};

exports.deleteTeam = async (req, res) => {
  const { id } = req.params;
  try {
    await db.pool.query('DELETE FROM teams WHERE id = $1', [id]);
    res.json({ success: true, message: 'Team deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
