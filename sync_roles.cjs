const { pool } = require('./backend/src/config/database');
async function run() {
  await pool.query("INSERT INTO user_roles (user_id, role_id) SELECT DISTINCT tm.user_id, r.id FROM team_members tm CROSS JOIN roles r WHERE r.name = 'PEGAWAI' ON CONFLICT DO NOTHING");
  console.log('Synced');
  process.exit(0);
}
run();
