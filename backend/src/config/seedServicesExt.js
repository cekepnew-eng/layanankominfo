const db = require('./database');
const bcrypt = require('bcryptjs');

const seedServicesExt = async () => {
  const client = await db.pool.connect();
  
  try {
    await client.query('BEGIN');
    console.log('Seeding missing users and dummy services...');

    // 1. Add missing User opd@bogor.go.id
    const userRoleRes = await client.query("SELECT id FROM roles WHERE name = 'USER'");
    const roleId = userRoleRes.rows[0].id;
    
    const checkOpd = await client.query("SELECT id FROM users WHERE email = 'opd@bogor.go.id'");
    if (checkOpd.rows.length === 0) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('password123', salt);
      await client.query(
        "INSERT INTO users (email, password_hash, full_name, role_id) VALUES ($1, $2, $3, $4)",
        ['opd@bogor.go.id', hash, 'Staf OPD Bogor', roleId]
      );
      console.log('Added opd@bogor.go.id');
    }

    // 2. Categories
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

    for (const cat of categories) {
      await client.query(
        "INSERT INTO service_categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING",
        [cat]
      );
    }

    // Map sub services to categories
    const servicesMapping = [
      { cat: 'Pengelolaan Aplikasi Informatika', services: ['Pengembangan & Pengelolaan Aplikasi', 'Rekomendasi & Evaluasi Aplikasi', 'Uji Kesesuaian Sistem (UKS)', 'Keamanan Aplikasi / VAPT', 'Pembuatan Aplikasi Baru (Web/Mobile)', 'Penambahan Fitur Aplikasi Dinas', 'Perbaikan Bug / Error Sistem', 'Integrasi Single Sign-On (SSO) TND', 'Pengajuan Integrasi API SPLP', 'Pemeliharaan Server Aplikasi Dinas', 'Migrasi Server / Database Aplikasi', 'Pemasangan SSL (HTTPS) Domain Dinas', 'Permohonan Rekomendasi Aplikasi Baru', 'Evaluasi Kelayakan Sistem Aplikasi', 'Uji Kesesuaian Sistem (UKS) Tahap Awal', 'Uji Kesesuaian Sistem (UKS) Pasca Uji Coba', 'Audit Kode Sumber Aplikasi (Code Review)', 'Pendampingan Teknis Penggunaan Aplikasi'] },
      { cat: 'Pengelolaan Sumber Daya & Perangkat Informatika', services: ['Jaringan Intra Pemerintah', 'Server Perangkat Daerah', 'Infrastruktur TIK', 'Perangkat Jaringan & Komunikasi', 'Teleconference & Meeting', 'Video Conference / Zoom', 'CCTV & Video Monitoring', 'Wifi Publik', 'Setup Virtual Machine Server (Hosting)', 'Upgrade Bandwidth Internet Gedung Dinas', 'Pemasangan Switch Hub Tambahan TIK', 'Audit Akses Jaringan Dinas', 'Pemulihan Data Backup Server', 'Pengaduan Koneksi Wifi Publik'] },
      { cat: 'Penerapan Persandian & Keamanan Informasi', services: ['Keamanan Informasi & Persandian', 'Security Operation Center (SOC)', 'CSIRT / Respons Insiden', 'Security Awareness', 'Uji Celah Keamanan (Vulnerability Assessment)', 'Simulasi Serangan Siber (Penetration Testing)', 'Penyelidikan Insiden Kebocoran Data (CSIRT)', 'Pelatihan Keamanan Informasi Staf (Security Awareness)'] },
      { cat: 'Tata Kelola SPBE', services: ['Tata Kelola SPBE', 'Kebijakan SPBE', 'Arsitektur & Peta Rencana SPBE', 'Monev & Pelaporan SPBE', 'Integrasi & Interoperabilitas SPBE', 'Audit Teknologi Informasi', 'Penyusunan Arsitektur SPBE Dinas', 'Konfigurasi Peta Rencana TI Daerah'] },
      { cat: 'Statistik Sektoral', services: ['Statistik Sektoral', 'Sosialisasi Pengisian Metadata Statistik', 'Permintaan Data Dataset Sektoral'] },
      { cat: 'Satu Data Daerah', services: ['Satu Data Daerah'] },
      { cat: 'Informasi & Komunikasi Publik', services: ['Informasi & Komunikasi Publik', 'Pelayanan Informasi Publik', 'Sosialisasi Layanan Digital Publik', 'Permohonan Informasi Publik PPID'] },
      { cat: 'Domain & Infrastruktur Pendukung', services: ['Domain & Subdomain Pemerintah Daerah', 'Portal Pelayanan Digital', 'Pusat Kendali / Command Center', 'Peningkatan Kapasitas SDM TIK', 'Pengajuan Domain Instansi Baru', 'Peminjaman Lisensi Webinar Zoom Dinas', 'Pembuatan Akun Portal Layanan Digital'] }
    ];

    for (const mapping of servicesMapping) {
      const catRes = await client.query("SELECT id FROM service_categories WHERE name = $1", [mapping.cat]);
      if (catRes.rows.length > 0) {
        const catId = catRes.rows[0].id;
        for (const srvName of mapping.services) {
          // Check if exist
          const checkSrv = await client.query("SELECT id FROM services WHERE name = $1 AND category_id = $2", [srvName, catId]);
          if (checkSrv.rows.length === 0) {
             await client.query(
               "INSERT INTO services (category_id, name, target_sla, verification_type, is_active) VALUES ($1, $2, $3, $4, $5)",
               [catId, srvName, '7 Hari', 'Wajib Verifikasi', true]
             );
          }
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

seedServicesExt();
