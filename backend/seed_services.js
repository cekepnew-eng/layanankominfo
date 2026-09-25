const db = require('./db');

const servicesData = {
  "Aplikasi Informatika": [
    { name: "Pengembangan aplikasi baru", template: "aplikasi" },
    { name: "Penambahan fitur", template: "aplikasi" },
    { name: "Perubahan fitur", template: "aplikasi" },
    { name: "Perbaikan error/bug", template: "aplikasi" },
    { name: "Pemeliharaan aplikasi", template: "aplikasi" },
    { name: "Upgrade aplikasi", template: "aplikasi" },
    { name: "Migrasi aplikasi", template: "aplikasi" },
    { name: "Integrasi API", template: "aplikasi" },
    { name: "Integrasi SSO", template: "aplikasi" },
    { name: "Integrasi SPLP", template: "aplikasi" },
    { name: "Konsultasi aplikasi", template: "aplikasi" },
    { name: "Asistensi teknis", template: "aplikasi" },
    { name: "Permohonan rekomendasi aplikasi", template: "aplikasi" },
    { name: "Evaluasi aplikasi", template: "aplikasi" },
    { name: "Review kebutuhan aplikasi", template: "aplikasi" },
    { name: "Review arsitektur aplikasi", template: "aplikasi" },
    { name: "Konsultasi pengembangan aplikasi", template: "aplikasi" },
    { name: "Pendampingan pengembangan aplikasi", template: "aplikasi" },
    { name: "Permohonan UKS", template: "aplikasi" },
    { name: "Pengajuan uji aplikasi", template: "aplikasi" },
    { name: "Konsultasi UKS", template: "aplikasi" },
    { name: "Perbaikan hasil UKS", template: "aplikasi" },
    { name: "Tindak lanjut hasil UKS", template: "aplikasi" },
    { name: "Vulnerability Assessment", template: "keamanan" },
    { name: "Penetration Testing", template: "keamanan" },
    { name: "VAPT", template: "keamanan" },
    { name: "Security Assessment", template: "keamanan" },
    { name: "Retest keamanan", template: "keamanan" },
    { name: "Konsultasi keamanan aplikasi", template: "keamanan" }
  ],
  "Pengelolaan Sumber Daya & Perangkat Informatika": [
    { name: "Gangguan jaringan", template: "jaringan" },
    { name: "Permintaan akses jaringan", template: "jaringan" },
    { name: "Permintaan koneksi jaringan", template: "jaringan" },
    { name: "Instalasi jaringan", template: "jaringan" },
    { name: "Penambahan titik jaringan", template: "jaringan" },
    { name: "Pemindahan titik jaringan", template: "jaringan" },
    { name: "Perubahan konfigurasi", template: "jaringan" },
    { name: "Pemeriksaan jaringan", template: "jaringan" },
    { name: "Konsultasi jaringan", template: "jaringan" },
    { name: "Permohonan hosting", template: "server" },
    { name: "Permohonan server", template: "server" },
    { name: "Pembuatan virtual server", template: "server" },
    { name: "Deploy aplikasi", template: "server" },
    { name: "Penambahan resource", template: "server" },
    { name: "Perubahan resource", template: "server" },
    { name: "Backup server", template: "server" },
    { name: "Restore server", template: "server" },
    { name: "Pemindahan aplikasi", template: "server" },
    { name: "Gangguan server", template: "server" },
    { name: "Pemeliharaan server", template: "server" },
    { name: "Konsultasi server", template: "server" },
    { name: "Permintaan infrastruktur", template: "standar" },
    { name: "Instalasi perangkat", template: "standar" },
    { name: "Konfigurasi perangkat", template: "standar" },
    { name: "Pemeliharaan infrastruktur", template: "standar" },
    { name: "Perbaikan infrastruktur", template: "standar" },
    { name: "Penggantian perangkat", template: "standar" },
    { name: "Pemeriksaan infrastruktur", template: "standar" },
    { name: "Konsultasi infrastruktur", template: "standar" },
    { name: "Permintaan perangkat", template: "standar" },
    { name: "Peminjaman perangkat", template: "standar" },
    { name: "Peminjaman perangkat teleconference", template: "zoom" },
    { name: "Peminjaman ruang teleconference", template: "zoom" },
    { name: "Permohonan operator teleconference", template: "zoom" },
    { name: "Dukungan teknis meeting", template: "zoom" },
    { name: "Setup perangkat meeting", template: "zoom" },
    { name: "Uji coba teleconference", template: "zoom" },
    { name: "Troubleshooting teleconference", template: "zoom" },
    { name: "Pendampingan kegiatan", template: "zoom" },
    { name: "Permohonan link Zoom", template: "zoom" },
    { name: "Pembuatan Zoom Meeting", template: "zoom" },
    { name: "Pembuatan Zoom Webinar", template: "zoom" },
    { name: "Pengaturan host/co-host", template: "zoom" },
    { name: "Dukungan operator Zoom", template: "zoom" },
    { name: "Pendampingan Zoom", template: "zoom" },
    { name: "Troubleshooting Zoom", template: "zoom" },
    { name: "Permohonan akses CCTV", template: "standar" },
    { name: "Permohonan akses live streaming", template: "standar" },
    { name: "Permohonan rekaman CCTV", template: "standar" },
    { name: "Permintaan informasi CCTV", template: "standar" },
    { name: "Gangguan CCTV", template: "standar" },
    { name: "Pemeriksaan kamera", template: "standar" },
    { name: "Permintaan pemasangan kamera", template: "standar" },
    { name: "Permintaan pemindahan kamera", template: "standar" },
    { name: "Konsultasi CCTV", template: "standar" },
    { name: "Gangguan wifi", template: "jaringan" },
    { name: "Permintaan pemasangan", template: "jaringan" },
    { name: "Permintaan pengecekan", template: "jaringan" },
    { name: "Pelaporan lokasi wifi", template: "jaringan" },
    { name: "Pemeliharaan wifi", template: "jaringan" }
  ],
  "Penerapan Persandian & Sistem Pengamanan Informasi": [
    { name: "Konsultasi keamanan informasi", template: "keamanan" },
    { name: "Konsultasi persandian", template: "keamanan" },
    { name: "Asesmen keamanan", template: "keamanan" },
    { name: "Audit keamanan", template: "keamanan" },
    { name: "Penyusunan tata kelola keamanan", template: "keamanan" },
    { name: "Konsultasi kebijakan keamanan", template: "keamanan" },
    { name: "Pendampingan keamanan", template: "keamanan" },
    { name: "Permintaan monitoring keamanan", template: "keamanan" },
    { name: "Investigasi alert keamanan", template: "keamanan" },
    { name: "Analisis log", template: "keamanan" },
    { name: "Monitoring keamanan", template: "keamanan" },
    { name: "Konsultasi SOC", template: "keamanan" },
    { name: "Tindak lanjut alert", template: "keamanan" },
    { name: "Pelaporan insiden keamanan", template: "keamanan" },
    { name: "Penanganan insiden", template: "keamanan" },
    { name: "Investigasi insiden", template: "keamanan" },
    { name: "Analisis insiden", template: "keamanan" },
    { name: "Pemulihan insiden", template: "keamanan" },
    { name: "Konsultasi insiden", template: "keamanan" },
    { name: "Tindak lanjut insiden", template: "keamanan" },
    { name: "Permohonan sosialisasi", template: "standar" },
    { name: "Permohonan pelatihan", template: "standar" },
    { name: "Permohonan bimtek", template: "standar" },
    { name: "Edukasi keamanan siber", template: "standar" },
    { name: "Pendampingan keamanan", template: "keamanan" }
  ],
  "Tata Kelola SPBE": [
    { name: "Konsultasi kebijakan SPBE", template: "standar" },
    { name: "Konsultasi tata kelola SPBE", template: "standar" },
    { name: "Permintaan rekomendasi SPBE", template: "standar" },
    { name: "Pendampingan SPBE", template: "standar" },
    { name: "Konsultasi regulasi SPBE", template: "standar" },
    { name: "Konsultasi arsitektur SPBE", template: "standar" },
    { name: "Konsultasi peta rencana", template: "standar" },
    { name: "Penyusunan arsitektur", template: "standar" },
    { name: "Review arsitektur", template: "standar" },
    { name: "Pendampingan pemetaan SPBE", template: "standar" },
    { name: "Konsultasi evaluasi SPBE", template: "standar" },
    { name: "Pendampingan evaluasi SPBE", template: "standar" },
    { name: "Konsultasi indikator", template: "standar" },
    { name: "Konsultasi bukti dukung", template: "standar" },
    { name: "Pendampingan pengisian evaluasi", template: "standar" },
    { name: "Konsultasi pelaporan SPBE", template: "standar" },
    { name: "Permohonan integrasi", template: "standar" },
    { name: "Integrasi API", template: "standar" },
    { name: "Integrasi SPLP", template: "standar" },
    { name: "Konsultasi interoperabilitas", template: "standar" },
    { name: "Pengujian integrasi", template: "standar" },
    { name: "Pendampingan integrasi", template: "standar" }
  ],
  "Statistik Sektoral": [
    { name: "Permintaan data statistik", template: "standar" },
    { name: "Permintaan dataset", template: "standar" },
    { name: "Permintaan metadata", template: "standar" },
    { name: "Konsultasi statistik", template: "standar" },
    { name: "Konsultasi metodologi", template: "standar" },
    { name: "Rekomendasi statistik", template: "standar" },
    { name: "Validasi data", template: "standar" },
    { name: "Pendampingan statistik", template: "standar" },
    { name: "Permintaan data", template: "standar" },
    { name: "Standar data", template: "standar" },
    { name: "Kode referensi", template: "standar" },
    { name: "Integrasi data", template: "standar" }
  ],
  "Informasi & Komunikasi Publik": [
    { name: "Permohonan publikasi", template: "standar" },
    { name: "Permohonan diseminasi informasi", template: "standar" },
    { name: "Permohonan peliputan", template: "standar" },
    { name: "Permohonan dokumentasi", template: "standar" },
    { name: "Konsultasi komunikasi publik", template: "standar" },
    { name: "Dukungan komunikasi kegiatan", template: "standar" },
    { name: "Permohonan informasi", template: "standar" },
    { name: "Permintaan data/informasi", template: "standar" },
    { name: "Konsultasi informasi publik", template: "standar" },
    { name: "Permintaan salinan informasi", template: "standar" }
  ],
  "Domain & Infrastruktur Pendukung": [
    { name: "Permohonan domain", template: "standar" },
    { name: "Permohonan subdomain", template: "standar" },
    { name: "Perubahan DNS", template: "standar" },
    { name: "Perubahan konfigurasi domain", template: "standar" },
    { name: "Perpanjangan/pengelolaan domain", template: "standar" },
    { name: "Permohonan integrasi portal", template: "standar" },
    { name: "Permintaan akses", template: "standar" },
    { name: "Permintaan akun", template: "standar" },
    { name: "Perubahan konten", template: "standar" },
    { name: "Gangguan portal", template: "standar" },
    { name: "Konsultasi portal", template: "standar" },
    { name: "Permintaan integrasi data", template: "standar" },
    { name: "Permintaan integrasi API", template: "standar" },
    { name: "Permintaan dashboard", template: "standar" },
    { name: "Permintaan data monitoring", template: "standar" },
    { name: "Dukungan teknis dashboard", template: "standar" }
  ],
  "Pengembangan SDM": [
    { name: "Permohonan pelatihan", template: "standar" },
    { name: "Permohonan bimtek", template: "standar" },
    { name: "Permohonan sosialisasi", template: "standar" },
    { name: "Permohonan narasumber", template: "standar" },
    { name: "Konsultasi kompetensi", template: "standar" },
    { name: "Pendampingan SDM", template: "standar" }
  ]
};

const run = async () => {
  try {
    console.log('Resetting services and service_categories tables...');
    await db.query('TRUNCATE TABLE service_categories CASCADE');
    await db.query('TRUNCATE TABLE services CASCADE');
    
    let categoryOrder = 1;
    for (const [categoryName, services] of Object.entries(servicesData)) {
      console.log(`Inserting category: ${categoryName}`);
      const catRes = await db.query(
        'INSERT INTO service_categories (category_name) VALUES ($1) RETURNING id',
        [categoryName]
      );
      const catId = catRes.rows[0].id;
      
      for (const service of services) {
        await db.query(
          `INSERT INTO services (
            category_id, service_name, target_sla, status
          ) VALUES ($1, $2, $3, $4)`,
          [
            catId, 
            service.name, 
            "7 Hari",
            "Aktif"
          ]
        );
      }
    }
    
    console.log('Successfully seeded services based on PDF structure.');
    process.exit(0);
  } catch (err) {
    console.error('Failed to seed services', err);
    process.exit(1);
  }
};

run();
