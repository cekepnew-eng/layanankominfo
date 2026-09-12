const db = require('./db');

const seedData = async () => {
  try {
    console.log('Seeding Database...');

    // 1. Roles
    await db.query(`INSERT INTO roles (name) VALUES ('Masyarakat'), ('Admin'), ('Helpdesk'), ('Pegawai'), ('OPD') ON CONFLICT (name) DO NOTHING;`);
    
    // Get Role IDs
    const rolesRes = await db.query('SELECT * FROM roles');
    const roleMap = {};
    rolesRes.rows.forEach(r => roleMap[r.name] = r.id);

    // 2. Users (Passwords are plain for now as temporary auth)
    const users = [
      { email: 'admin@bogor.go.id', pass: 'admin123', name: 'Ahmad Faisal', role: 'Admin', phone: '08111111' },
      { email: 'helpdesk@bogor.go.id', pass: 'helpdesk123', name: 'Siti Rahmawati', role: 'Helpdesk', phone: '08222222' },
      { email: 'opd@bogor.go.id', pass: 'opd123', name: 'Kepala Dinkes', role: 'OPD', phone: '08333333' },
      { email: 'pegawai@bogor.go.id', pass: 'pegawai123', name: 'Budi Utomo', role: 'Pegawai', phone: '08444444' },
      { email: 'masyarakat@gmail.com', pass: 'warga123', name: 'Rian Hidayat', role: 'Masyarakat', phone: '08555555' }
    ];

    for (let u of users) {
      // Upsert User
      const check = await db.query('SELECT id FROM users WHERE email = $1', [u.email]);
      if (check.rows.length === 0) {
        await db.query(
          'INSERT INTO users (email, password_hash, full_name, phone_number, role_id) VALUES ($1, $2, $3, $4, $5)',
          [u.email, u.pass, u.name, u.phone, roleMap[u.role]]
        );
      }
    }

    console.log('Users seeded successfully!');

    // 3. Services
    await db.query(`
      INSERT INTO services (service_code, name) VALUES 
      ('SRV-001', 'Pengelolaan Aplikasi Informatika'),
      ('SRV-002', 'Layanan Infrastruktur Jaringan')
      ON CONFLICT (service_code) DO NOTHING;
    `);

    // We can manually add tickets later or wire them up in API.
    // The user wants the static tickets intact. Let's seed a few static tickets.

    const opdUser = await db.query("SELECT id FROM users WHERE email='opd@bogor.go.id'");
    const opdUserId = opdUser.rows[0].id;
    
    const srvRes = await db.query("SELECT id FROM services WHERE service_code='SRV-001'");
    const srvId = srvRes.rows[0].id;

    // Seed Ticket 1 (REQ-2026-0001)
    const checkTkt = await db.query("SELECT id FROM tickets WHERE ticket_number='REQ-2026-0001'");
    if(checkTkt.rows.length === 0) {
      await db.query(
        "INSERT INTO tickets (ticket_number, user_id, service_id, status) VALUES ($1, $2, $3, $4)",
        ['REQ-2026-0001', opdUserId, srvId, 'Selesai']
      );
    }

    console.log('Static Tickets seeded successfully!');
    process.exit(0);

  } catch (error) {
    console.error('Seeding Error:', error);
    process.exit(1);
  }
};

seedData();
