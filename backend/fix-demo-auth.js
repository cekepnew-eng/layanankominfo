require('dotenv').config({ path: 'C:/layanankominfo/backend/.env' });
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  const roleRows = await pool.query('SELECT id, name FROM roles');
  const roleMap = Object.fromEntries(roleRows.rows.map((r) => [r.name, r.id]));

  const teamRows = await pool.query('SELECT id, team_name FROM teams');
  const teamMap = Object.fromEntries(teamRows.rows.map((t) => [t.team_name, t.id]));

  const userRows = [
    ['admin@bogor.go.id', 'ADMIN', 'Dinas Komunikasi dan Informatika'],
    ['helpdesk@bogor.go.id', 'HELPDESK', 'Dinas Komunikasi dan Informatika'],
    ['pegawai@bogor.go.id', 'PEGAWAI', 'Dinas Komunikasi dan Informatika'],
    ['opd@bogor.go.id', 'USER', 'Dinas Kesehatan'],
    ['masyarakat@gmail.com', 'MASYARAKAT', null]
  ];

  for (const [email, role, teamName] of userRows) {
    const userRes = await pool.query('SELECT id, team_id FROM users WHERE email = $1', [email]);
    if (userRes.rows.length === 0) continue;
    const user = userRes.rows[0];
    const teamId = teamName ? teamMap[teamName] ?? null : null;

    await pool.query(
      'UPDATE users SET team_id = $1, is_two_factor_enabled = false, two_factor_secret = NULL WHERE id = $2',
      [teamId, user.id]
    );

    if (roleMap[role]) {
      await pool.query(
        'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [user.id, roleMap[role]]
      );
    }
  }

  const result = await pool.query(`
    SELECT u.email, u.full_name, u.is_two_factor_enabled, u.team_id,
           COALESCE(array_agg(r.name ORDER BY r.name) FILTER (WHERE r.name IS NOT NULL), ARRAY[]::text[]) AS roles,
           t.team_name
    FROM users u
    LEFT JOIN user_roles ur ON ur.user_id = u.id
    LEFT JOIN roles r ON r.id = ur.role_id
    LEFT JOIN teams t ON t.id = u.team_id
    WHERE u.email IN ('admin@bogor.go.id','helpdesk@bogor.go.id','pegawai@bogor.go.id','opd@bogor.go.id','masyarakat@gmail.com')
    GROUP BY u.id, u.email, u.full_name, u.is_two_factor_enabled, u.team_id, t.team_name
    ORDER BY u.email;
  `);

  console.log(JSON.stringify(result.rows, null, 2));
  await pool.end();
})();
