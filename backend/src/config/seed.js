const db = require('./database');
const bcrypt = require('bcryptjs');

const seedMasterData = async () => {
  const client = await db.pool.connect();
  
  try {
    await client.query('BEGIN');
    console.log('Seeding Teams and Master Users...');

    // 1. Get Role IDs
    const rolesRes = await client.query('SELECT * FROM roles');
    const roleMap = {};
    rolesRes.rows.forEach(r => roleMap[r.name] = r.id);

    // 2. Create Default Team
    const teamRes = await client.query(`
      INSERT INTO teams (name, description) 
      VALUES ('Tim Aplikasi & Sistem Informasi', 'Menangani pembuatan dan perbaikan aplikasi')
      ON CONFLICT (name) DO NOTHING RETURNING id;
    `);
    
    let teamId;
    if (teamRes.rows.length > 0) {
      teamId = teamRes.rows[0].id;
    } else {
      const getTeam = await client.query(`SELECT id FROM teams WHERE name = 'Tim Aplikasi & Sistem Informasi'`);
      teamId = getTeam.rows[0].id;
    }

    // 3. Hash Passwords
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    // 4. Create Master Users (Only if not exist)
    const users = [
      { email: 'admin@bogor.go.id', role: 'ADMIN', name: 'Ahmad Faisal', teamId: null },
      { email: 'helpdesk@bogor.go.id', role: 'HELPDESK', name: 'Siti Rahmawati', teamId: null },
      { email: 'pegawai@bogor.go.id', role: 'PEGAWAI', name: 'Rian Hidayat', teamId: teamId },
      { email: 'masyarakat@gmail.com', role: 'USER', name: 'Budi Utomo', teamId: null }
    ];

    for (let u of users) {
      const checkUser = await client.query('SELECT id FROM users WHERE email = $1', [u.email]);
      if (checkUser.rows.length === 0) {
        await client.query(
          'INSERT INTO users (email, password_hash, full_name, role_id) VALUES ($1, $2, $3, $4)',
          [u.email, passwordHash, u.name, roleMap[u.role]]
        );
      }
    }

    // Get the Pegawai User ID to assign to Team Members
    const pegawaiUser = await client.query('SELECT id FROM users WHERE email = $1', ['pegawai@bogor.go.id']);
    if (pegawaiUser.rows.length > 0) {
      await client.query(`
        INSERT INTO team_members (team_id, user_id) 
        VALUES ($1, $2) ON CONFLICT DO NOTHING
      `, [teamId, pegawaiUser.rows[0].id]);
    }

    // 5. Create Default Services Master Data
    console.log('Seeding Service Catalog...');
    const catRes = await client.query(`SELECT id FROM service_categories WHERE name = 'Pengelolaan Aplikasi Informatika'`);
    if (catRes.rows.length > 0) {
      const catId = catRes.rows[0].id;
      
      const srvRes = await client.query(`
        INSERT INTO services (category_id, name, target_sla, verification_type) 
        VALUES ($1, 'Pembuatan Aplikasi Baru (Web/Mobile)', '30-90 Hari', 'Wajib Verifikasi')
        RETURNING id;
      `, [catId]);

      if (srvRes.rows.length > 0) {
        const srvId = srvRes.rows[0].id;
        await client.query(`
          INSERT INTO service_requirements (service_id, document_name, is_mandatory) VALUES
          ($1, 'Surat Permohonan Resmi OPD', true),
          ($1, 'Dokumen Kerangka Acuan Kerja (KAK)', true)
        `, [srvId]);
      }
    }

    await client.query('COMMIT');
    console.log('Seed completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', err);
  } finally {
    client.release();
    process.exit(0);
  }
};

seedMasterData();
