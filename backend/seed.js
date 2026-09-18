const db = require('./db');

const seedData = async () => {
  try {
    console.log('Seeding Database...');

    // Get Role IDs
    const rolesRes = await db.query('SELECT * FROM roles');
    const roleMap = {};
    rolesRes.rows.forEach(r => roleMap[r.name] = r.id);

    // Seed Teams
    const teams = ['Tim Infrastruktur', 'Tim Aplikasi', 'Tim Keamanan'];
    for (let t of teams) {
      await db.query('INSERT INTO teams (team_name) VALUES ($1) ON CONFLICT DO NOTHING', [t]);
    }
    const teamsRes = await db.query('SELECT * FROM teams');
    const teamMap = {};
    teamsRes.rows.forEach(t => teamMap[t.team_name] = t.id);

    // 2. Users (Passwords are plain for now as temporary auth)
    const users = [
      { email: 'admin@bogor.go.id', pass: 'admin123', name: 'Administrator Sistem', role: 'ADMIN', department: 'Dinas Komunikasi dan Informatika', phone: '08111111', teams: [] },
      { email: 'helpdesk@bogor.go.id', pass: 'admin123', name: 'Helpdesk Diskominfo', role: 'HELPDESK', department: 'Dinas Komunikasi dan Informatika', phone: '08222222', teams: [] },
      { email: 'opd@bogor.go.id', pass: 'admin123', name: 'Kepala Dinas Kesehatan', role: 'USER', department: 'Dinas Kesehatan', phone: '08333333', teams: [] },
      { email: 'pegawai@bogor.go.id', pass: 'admin123', name: 'Pegawai Teknis', role: 'PEGAWAI', department: 'Dinas Komunikasi dan Informatika', phone: '08444444', teams: ['Tim Infrastruktur', 'Tim Aplikasi'] },
      { email: 'masyarakat@bogor.go.id', pass: 'admin123', name: 'Warga Kota Bogor', role: 'MASYARAKAT', department: 'Masyarakat Umum', phone: '08555555', teams: [] }
    ];

    for (let u of users) {
      // Upsert User
      const check = await db.query('SELECT id FROM users WHERE email = $1', [u.email]);
      if (check.rows.length === 0) {
        const userRes = await db.query(
          'INSERT INTO users (email, password_hash, full_name, phone_number, role_id, department) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
          [u.email, u.pass, u.name, u.phone, roleMap[u.role], u.department]
        );
        const userId = userRes.rows[0].id;

        // Insert into user_roles (this is what the frontend reads)
        await db.query('INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [userId, roleMap[u.role]]);

        if (u.teams && u.teams.length > 0) {
          for (let teamName of u.teams) {
             if (teamMap[teamName]) {
               await db.query('INSERT INTO team_members (user_id, team_id) VALUES ($1, $2)', [userId, teamMap[teamName]]);
             }
          }
        }
      }
    }

    console.log('Users seeded successfully!');

    // 3. Services and Categories
    const categoriesList = [
      { name: 'Pengelolaan Aplikasi Informatika', services: ['Pengembangan & Pengelolaan Aplikasi', 'Rekomendasi & Evaluasi Aplikasi', 'Uji Kesesuaian Sistem (UKS)', 'Keamanan Aplikasi / VAPT'] },
      { name: 'Pengelolaan Sumber Daya & Perangkat Informatika', services: ['Jaringan Intra Pemerintah', 'Server Perangkat Daerah', 'Infrastruktur TIK', 'Perangkat Jaringan & Komunikasi', 'Teleconference & Meeting', 'Video Conference / Zoom', 'CCTV & Video Monitoring', 'Wifi Publik'] },
      { name: 'Penerapan Persandian & Keamanan Informasi', services: ['Keamanan Informasi & Persandian', 'Security Operation Center (SOC)', 'CSIRT / Respons Insiden', 'Security Awareness'] },
      { name: 'Tata Kelola SPBE', services: ['Tata Kelola SPBE', 'Kebijakan SPBE', 'Arsitektur & Peta Rencana SPBE', 'Monev & Pelaporan SPBE', 'Integrasi & Interoperabilitas SPBE', 'Audit Teknologi Informasi'] },
      { name: 'Statistik Sektoral', services: ['Statistik Sektoral'] },
      { name: 'Satu Data Daerah', services: ['Satu Data Daerah'] },
      { name: 'Informasi & Komunikasi Publik', services: ['Informasi & Komunikasi Publik', 'Pelayanan Informasi Publik'] },
      { name: 'Domain & Infrastruktur Pendukung', services: ['Domain & Subdomain Pemerintah Daerah', 'Portal Pelayanan Digital', 'Pusat Kendali / Command Center', 'Peningkatan Kapasitas SDM TIK', 'Domain & Infrastruktur Pendukung'] }
    ];

    for (let cat of categoriesList) {
      await db.query('INSERT INTO service_categories (category_name) VALUES ($1) ON CONFLICT DO NOTHING', [cat.name]);
      const catRes = await db.query('SELECT id FROM service_categories WHERE category_name = $1', [cat.name]);
      if (catRes.rows.length > 0) {
        const catId = catRes.rows[0].id;
        for (let svc of cat.services) {
          await db.query(`
            INSERT INTO services (category_id, service_name, target_sla) VALUES 
            ($1, $2, '1-3 Hari')
            ON CONFLICT DO NOTHING;
          `, [catId, svc]);
        }
      }
    }

    // We can manually add tickets later or wire them up in API.
    const opdUser = await db.query("SELECT id FROM users WHERE email='opd@bogor.go.id'");
    
    if (opdUser.rows.length > 0) {
      const opdUserId = opdUser.rows[0].id;
      
      const srvRes = await db.query("SELECT id FROM services WHERE service_name='Pengembangan & Pengelolaan Aplikasi'");
      if(srvRes.rows.length > 0) {
         const srvId = srvRes.rows[0].id;

        // Seed Ticket 1 (REQ-2026-0001)
        const checkTkt = await db.query("SELECT id FROM tickets WHERE ticket_number='REQ-2026-0001'");
        if(checkTkt.rows.length === 0) {
          const tkt = await db.query(
            "INSERT INTO tickets (ticket_number, user_id, service_id, status_id) VALUES ($1, $2, $3, 7) RETURNING id",
            ['REQ-2026-0001', opdUserId, srvId]
          );
          
          await db.query(
             "INSERT INTO ticket_details (ticket_id, title, description) VALUES ($1, 'Migrasi Server', 'Mohon migrasi server aplikasi')",
             [tkt.rows[0].id]
          );
        }
      }
    }

    console.log('Static Tickets seeded successfully!');
    process.exit(0);

  } catch (error) {
    console.error('Seeding Error:', error);
    process.exit(1);
  }
};

seedData();
