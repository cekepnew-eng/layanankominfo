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

    // 2. Create Default Dinas / Teams
    const defaultTeams = [
      'Dinas Kesehatan',
      'Dinas Komunikasi dan Informatika',
      'Dinas Pendidikan',
      'Dinas PUPR',
      'Tim Aplikasi & Sistem Informasi'
    ];

    for (const teamName of defaultTeams) {
      await client.query(
        `INSERT INTO teams (team_name, description) VALUES ($1, $2) ON CONFLICT (team_name) DO NOTHING`,
        [teamName, 'Unit kerja dan tim pelaksana layanan SPBE Pemerintah Kota Bogor']
      );
    }

    const getTeam = await client.query(`SELECT id FROM teams WHERE team_name = 'Dinas Komunikasi dan Informatika'`);
    const teamId = getTeam.rows[0]?.id || null;

    // 3. Hash Passwords
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    // 4. Create Master Users (Only if not exist)
    const users = [
      { email: 'admin@bogor.go.id', role: 'ADMIN', name: 'Ahmad Faisal', teamName: 'Dinas Komunikasi dan Informatika' },
      { email: 'helpdesk@bogor.go.id', role: 'HELPDESK', name: 'Siti Rahmawati', teamName: 'Dinas Komunikasi dan Informatika' },
      { email: 'pegawai@bogor.go.id', role: 'PEGAWAI', name: 'Rian Hidayat', teamName: 'Dinas Komunikasi dan Informatika' },
      { email: 'opd@bogor.go.id', role: 'USER', name: 'Staf OPD Bogor', teamName: 'Dinas Kesehatan' },
      { email: 'masyarakat@gmail.com', role: 'MASYARAKAT', name: 'Budi Utomo', teamName: null }
    ];

    for (let u of users) {
      const teamRes = u.teamName ? await client.query('SELECT id FROM teams WHERE team_name = $1', [u.teamName]) : { rows: [] };
      const teamRecord = teamRes.rows[0] || null;
      const checkUser = await client.query('SELECT id, role_id, team_id, is_two_factor_enabled FROM users WHERE email = $1', [u.email]);

      if (checkUser.rows.length === 0) {
        const userInsert = await client.query(
          'INSERT INTO users (email, password_hash, full_name, role_id, team_id, is_two_factor_enabled) VALUES ($1, $2, $3, $4, $5, false) RETURNING id',
          [u.email, passwordHash, u.name, roleMap[u.role], teamRecord?.id || null]
        );

        await client.query(
          'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [userInsert.rows[0].id, roleMap[u.role]]
        );

        if (teamRecord) {
          await client.query(
            'INSERT INTO team_members (team_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [teamRecord.id, userInsert.rows[0].id]
          );
        }
      } else {
        const existingUser = checkUser.rows[0];
        await client.query(
          'UPDATE users SET role_id = COALESCE($2, role_id), team_id = COALESCE($3, team_id), is_two_factor_enabled = false, two_factor_secret = NULL WHERE id = $1',
          [existingUser.id, roleMap[u.role], teamRecord?.id || existingUser.team_id]
        );

        await client.query(
          'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [existingUser.id, roleMap[u.role]]
        );

        if (teamRecord) {
          await client.query(
            'INSERT INTO team_members (team_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [teamRecord.id, existingUser.id]
          );
        }
      }
    }

    // 5. Create Default Services Master Data
    console.log('Seeding Service Catalog...');
    const categories = [
      'Pengelolaan Aplikasi Informatika',
      'Pengelolaan Sumber Daya & Perangkat Informatika',
      'Penerapan Persandian & Keamanan Informasi',
      'Tata Kelola SPBE',
      'Statistik Sektoral',
      'Satu Data Daerah',
      'Informasi & Komunikasi Publik',
      'Domain & Infrastruktur Pendukung'
    ];

    for (const catName of categories) {
      await client.query(
        'INSERT INTO service_categories (category_name) VALUES ($1) ON CONFLICT (category_name) DO NOTHING',
        [catName]
      );
    }

    const categoryMap = {};
    const catRows = await client.query('SELECT id, category_name FROM service_categories');
    catRows.rows.forEach(row => { categoryMap[row.category_name] = row.id; });

    const servicesByCategory = [
      { cat: 'Pengelolaan Aplikasi Informatika', services: ['Pengembangan & Pengelolaan Aplikasi', 'Rekomendasi & Evaluasi Aplikasi', 'Uji Kesesuaian Sistem (UKS)', 'Keamanan Aplikasi / VAPT', 'Pembuatan Aplikasi Baru (Web/Mobile)', 'Penambahan Fitur Aplikasi Dinas', 'Perbaikan Bug / Error Sistem', 'Integrasi Single Sign-On (SSO) TND', 'Pengajuan Integrasi API SPLP', 'Pemeliharaan Server Aplikasi Dinas', 'Migrasi Server / Database Aplikasi', 'Pemasangan SSL (HTTPS) Domain Dinas', 'Permohonan Rekomendasi Aplikasi Baru', 'Evaluasi Kelayakan Sistem Aplikasi', 'Uji Kesesuaian Sistem (UKS) Tahap Awal', 'Uji Kesesuaian Sistem (UKS) Pasca Uji Coba', 'Audit Kode Sumber Aplikasi (Code Review)', 'Pendampingan Teknis Penggunaan Aplikasi'] },
      { cat: 'Pengelolaan Sumber Daya & Perangkat Informatika', services: ['Jaringan Intra Pemerintah', 'Server Perangkat Daerah', 'Infrastruktur TIK', 'Perangkat Jaringan & Komunikasi', 'Teleconference & Meeting', 'Video Conference / Zoom', 'CCTV & Video Monitoring', 'Wifi Publik', 'Setup Virtual Machine Server (Hosting)', 'Upgrade Bandwidth Internet Gedung Dinas', 'Pemasangan Switch Hub Tambahan TIK', 'Audit Akses Jaringan Dinas', 'Pemulihan Data Backup Server', 'Pengaduan Koneksi Wifi Publik'] },
      { cat: 'Penerapan Persandian & Keamanan Informasi', services: ['Keamanan Informasi & Persandian', 'Security Operation Center (SOC)', 'CSIRT / Respons Insiden', 'Security Awareness', 'Uji Celah Keamanan (Vulnerability Assessment)', 'Simulasi Serangan Siber (Penetration Testing)', 'Penyelidikan Insiden Kebocoran Data (CSIRT)', 'Pelatihan Keamanan Informasi Staf (Security Awareness)'] },
      { cat: 'Tata Kelola SPBE', services: ['Tata Kelola SPBE', 'Kebijakan SPBE', 'Arsitektur & Peta Rencana SPBE', 'Monev & Pelaporan SPBE', 'Integrasi & Interoperabilitas SPBE', 'Audit Teknologi Informasi', 'Penyusunan Arsitektur SPBE Dinas', 'Konfigurasi Peta Rencana TI Daerah'] },
      { cat: 'Statistik Sektoral', services: ['Statistik Sektoral', 'Sosialisasi Pengisian Metadata Statistik', 'Permintaan Data Dataset Sektoral'] },
      { cat: 'Satu Data Daerah', services: ['Satu Data Daerah'] },
      { cat: 'Informasi & Komunikasi Publik', services: ['Informasi & Komunikasi Publik', 'Pelayanan Informasi Publik', 'Sosialisasi Layanan Digital Publik', 'Permohonan Informasi Publik PPID'] },
      { cat: 'Domain & Infrastruktur Pendukung', services: ['Domain & Subdomain Pemerintah Daerah', 'Portal Pelayanan Digital', 'Pusat Kendali / Command Center', 'Peningkatan Kapasitas SDM TIK', 'Pengajuan Domain Instansi Baru', 'Peminjaman Lisensi Webinar Zoom Dinas', 'Pembuatan Akun Portal Layanan Digital'] }
    ];

    for (const { cat, services } of servicesByCategory) {
      const catId = categoryMap[cat];
      if (!catId) continue;
      for (const serviceName of services) {
        const exists = await client.query('SELECT id FROM services WHERE category_id = $1 AND service_name = $2', [catId, serviceName]);
        if (exists.rows.length === 0) {
          const inserted = await client.query(
            'INSERT INTO services (category_id, service_name, target_sla, verification_type, status) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [catId, serviceName, '7 Hari', 'Wajib Verifikasi', 'Aktif']
          );

          await client.query(
            'INSERT INTO service_requirements (service_id, document_name, is_mandatory) VALUES ($1, $2, $3)',
            [inserted.rows[0].id, 'Surat Permohonan Resmi OPD', true]
          );
        }
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
