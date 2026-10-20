const db = require('./src/config/database');

const detailedSubServicesData = [
  // -------------------------------------------------------------------------
  // Kategori 1: Aplikasi Informatika
  // -------------------------------------------------------------------------
  {
    categoryName: 'Aplikasi Informatika',
    items: [
      // 1. Pengembangan & Pengelolaan Aplikasi (SLA: 30-90 Hari)
      { name: 'Pengembangan aplikasi baru', sla: '30-90 Hari', parent: 'Pengembangan & Pengelolaan Aplikasi' },
      { name: 'Penambahan fitur', sla: '30-90 Hari', parent: 'Pengembangan & Pengelolaan Aplikasi' },
      { name: 'Perubahan fitur', sla: '30-90 Hari', parent: 'Pengembangan & Pengelolaan Aplikasi' },
      { name: 'Perbaikan error/bug', sla: '30-90 Hari', parent: 'Pengembangan & Pengelolaan Aplikasi' },
      { name: 'Pemeliharaan aplikasi', sla: '30-90 Hari', parent: 'Pengembangan & Pengelolaan Aplikasi' },
      { name: 'Upgrade aplikasi', sla: '30-90 Hari', parent: 'Pengembangan & Pengelolaan Aplikasi' },
      { name: 'Migrasi aplikasi', sla: '30-90 Hari', parent: 'Pengembangan & Pengelolaan Aplikasi' },
      { name: 'Integrasi API', sla: '30-90 Hari', parent: 'Pengembangan & Pengelolaan Aplikasi' },
      { name: 'Integrasi SSO', sla: '30-90 Hari', parent: 'Pengembangan & Pengelolaan Aplikasi' },
      { name: 'Integrasi SPLP', sla: '30-90 Hari', parent: 'Pengembangan & Pengelolaan Aplikasi' },
      { name: 'Konsultasi aplikasi', sla: '30-90 Hari', parent: 'Pengembangan & Pengelolaan Aplikasi' },
      { name: 'Asistensi teknis', sla: '30-90 Hari', parent: 'Pengembangan & Pengelolaan Aplikasi' },

      // 2. Rekomendasi & Evaluasi Aplikasi (SLA: 7 Hari)
      { name: 'Permohonan rekomendasi aplikasi', sla: '7 Hari', parent: 'Rekomendasi & Evaluasi Aplikasi' },
      { name: 'Evaluasi aplikasi', sla: '7 Hari', parent: 'Rekomendasi & Evaluasi Aplikasi' },
      { name: 'Review kebutuhan aplikasi', sla: '7 Hari', parent: 'Rekomendasi & Evaluasi Aplikasi' },
      { name: 'Review arsitektur aplikasi', sla: '7 Hari', parent: 'Rekomendasi & Evaluasi Aplikasi' },
      { name: 'Konsultasi pengembangan aplikasi', sla: '7 Hari', parent: 'Rekomendasi & Evaluasi Aplikasi' },
      { name: 'Pendampingan pengembangan aplikasi', sla: '7 Hari', parent: 'Rekomendasi & Evaluasi Aplikasi' },

      // 3. Uji Kesesuaian Sistem (UKS) (SLA: 14 Hari)
      { name: 'Permohonan UKS', sla: '14 Hari', parent: 'Uji Kesesuaian Sistem (UKS)' },
      { name: 'Pengajuan uji aplikasi', sla: '14 Hari', parent: 'Uji Kesesuaian Sistem (UKS)' },
      { name: 'Konsultasi UKS', sla: '14 Hari', parent: 'Uji Kesesuaian Sistem (UKS)' },
      { name: 'Perbaikan hasil UKS', sla: '14 Hari', parent: 'Uji Kesesuaian Sistem (UKS)' },
      { name: 'Tindak lanjut hasil UKS', sla: '14 Hari', parent: 'Uji Kesesuaian Sistem (UKS)' },

      // 4. Keamanan Aplikasi / VAPT (SLA: 10 Hari)
      { name: 'Vulnerability Assessment', sla: '10 Hari', parent: 'Keamanan Aplikasi / VAPT' },
      { name: 'Penetration Testing', sla: '10 Hari', parent: 'Keamanan Aplikasi / VAPT' },
      { name: 'VAPT', sla: '10 Hari', parent: 'Keamanan Aplikasi / VAPT' },
      { name: 'Security Assessment', sla: '10 Hari', parent: 'Keamanan Aplikasi / VAPT' },
      { name: 'Retest keamanan', sla: '10 Hari', parent: 'Keamanan Aplikasi / VAPT' },
      { name: 'Konsultasi keamanan aplikasi', sla: '10 Hari', parent: 'Keamanan Aplikasi / VAPT' },

      // 25. Domain & Subdomain Pemerintah Daerah (SLA: 2 Hari)
      { name: 'Permohonan domain', sla: '2 Hari', parent: 'Domain & Subdomain Pemerintah Daerah' },
      { name: 'Permohonan subdomain', sla: '2 Hari', parent: 'Domain & Subdomain Pemerintah Daerah' },
      { name: 'Perubahan DNS', sla: '2 Hari', parent: 'Domain & Subdomain Pemerintah Daerah' },
      { name: 'Perubahan konfigurasi domain', sla: '2 Hari', parent: 'Domain & Subdomain Pemerintah Daerah' },
      { name: 'Perpanjangan/pengelolaan domain', sla: '2 Hari', parent: 'Domain & Subdomain Pemerintah Daerah' },

      // 26. Portal Pelayanan Digital (SLA: 3 Hari)
      { name: 'Permohonan integrasi portal', sla: '3 Hari', parent: 'Portal Pelayanan Digital' },
      { name: 'Permintaan akses', sla: '3 Hari', parent: 'Portal Pelayanan Digital' },
      { name: 'Permintaan akun', sla: '3 Hari', parent: 'Portal Pelayanan Digital' },
      { name: 'Perubahan konten', sla: '3 Hari', parent: 'Portal Pelayanan Digital' },
      { name: 'Gangguan portal', sla: '3 Hari', parent: 'Portal Pelayanan Digital' },
      { name: 'Konsultasi portal', sla: '3 Hari', parent: 'Portal Pelayanan Digital' },

      // 27. Pusat Kendali / Command Center (SLA: 5 Hari)
      { name: 'Permintaan integrasi data', sla: '5 Hari', parent: 'Pusat Kendali / Command Center' },
      { name: 'Permintaan integrasi API', sla: '5 Hari', parent: 'Pusat Kendali / Command Center' },
      { name: 'Permintaan dashboard', sla: '5 Hari', parent: 'Pusat Kendali / Command Center' },
      { name: 'Permintaan data monitoring', sla: '5 Hari', parent: 'Pusat Kendali / Command Center' },
      { name: 'Dukungan teknis dashboard', sla: '5 Hari', parent: 'Pusat Kendali / Command Center' }
    ]
  },

  // -------------------------------------------------------------------------
  // Kategori 2: Pengelolaan Sumber Daya & Perangkat Informatika
  // -------------------------------------------------------------------------
  {
    categoryName: 'Pengelolaan Sumber Daya & Perangkat Informatika',
    items: [
      // 5. Jaringan Intra Pemerintah (SLA: 3 Hari)
      { name: 'Gangguan jaringan', sla: '3 Hari', parent: 'Jaringan Intra Pemerintah' },
      { name: 'Permintaan akses jaringan', sla: '3 Hari', parent: 'Jaringan Intra Pemerintah' },
      { name: 'Permintaan koneksi jaringan', sla: '3 Hari', parent: 'Jaringan Intra Pemerintah' },
      { name: 'Instalasi jaringan', sla: '3 Hari', parent: 'Jaringan Intra Pemerintah' },
      { name: 'Penambahan titik jaringan', sla: '3 Hari', parent: 'Jaringan Intra Pemerintah' },
      { name: 'Pemindahan titik jaringan', sla: '3 Hari', parent: 'Jaringan Intra Pemerintah' },
      { name: 'Perubahan konfigurasi', sla: '3 Hari', parent: 'Jaringan Intra Pemerintah' },
      { name: 'Pemeriksaan jaringan', sla: '3 Hari', parent: 'Jaringan Intra Pemerintah' },
      { name: 'Konsultasi jaringan', sla: '3 Hari', parent: 'Jaringan Intra Pemerintah' },

      // 6. Server Perangkat Daerah (SLA: 5 Hari)
      { name: 'Permohonan hosting', sla: '5 Hari', parent: 'Server Perangkat Daerah' },
      { name: 'Permohonan server', sla: '5 Hari', parent: 'Server Perangkat Daerah' },
      { name: 'Pembuatan virtual server', sla: '5 Hari', parent: 'Server Perangkat Daerah' },
      { name: 'Deploy aplikasi', sla: '5 Hari', parent: 'Server Perangkat Daerah' },
      { name: 'Penambahan resource', sla: '5 Hari', parent: 'Server Perangkat Daerah' },
      { name: 'Perubahan resource', sla: '5 Hari', parent: 'Server Perangkat Daerah' },
      { name: 'Backup server', sla: '5 Hari', parent: 'Server Perangkat Daerah' },
      { name: 'Restore server', sla: '5 Hari', parent: 'Server Perangkat Daerah' },
      { name: 'Pemindahan aplikasi', sla: '5 Hari', parent: 'Server Perangkat Daerah' },
      { name: 'Gangguan server', sla: '5 Hari', parent: 'Server Perangkat Daerah' },
      { name: 'Pemeliharaan server', sla: '5 Hari', parent: 'Server Perangkat Daerah' },
      { name: 'Konsultasi server', sla: '5 Hari', parent: 'Server Perangkat Daerah' },

      // 7. Infrastruktur TIK (SLA: 7 Hari)
      { name: 'Permintaan infrastruktur', sla: '7 Hari', parent: 'Infrastruktur TIK' },
      { name: 'Instalasi perangkat', sla: '7 Hari', parent: 'Infrastruktur TIK' },
      { name: 'Konfigurasi perangkat', sla: '7 Hari', parent: 'Infrastruktur TIK' },
      { name: 'Pemeliharaan infrastruktur', sla: '7 Hari', parent: 'Infrastruktur TIK' },
      { name: 'Perbaikan infrastruktur', sla: '7 Hari', parent: 'Infrastruktur TIK' },
      { name: 'Penggantian perangkat', sla: '7 Hari', parent: 'Infrastruktur TIK' },
      { name: 'Pemeriksaan infrastruktur', sla: '7 Hari', parent: 'Infrastruktur TIK' },
      { name: 'Konsultasi infrastruktur', sla: '7 Hari', parent: 'Infrastruktur TIK' },

      // 8. Perangkat Jaringan & Komunikasi (SLA: 5 Hari)
      { name: 'Permintaan perangkat', sla: '5 Hari', parent: 'Perangkat Jaringan & Komunikasi' },
      { name: 'Peminjaman perangkat', sla: '5 Hari', parent: 'Perangkat Jaringan & Komunikasi' },
      { name: 'Instalasi perangkat jaringan', sla: '5 Hari', parent: 'Perangkat Jaringan & Komunikasi' },
      { name: 'Konfigurasi perangkat jaringan', sla: '5 Hari', parent: 'Perangkat Jaringan & Komunikasi' },
      { name: 'Perbaikan perangkat jaringan', sla: '5 Hari', parent: 'Perangkat Jaringan & Komunikasi' },
      { name: 'Pemeliharaan perangkat jaringan', sla: '5 Hari', parent: 'Perangkat Jaringan & Komunikasi' },
      { name: 'Penggantian perangkat jaringan', sla: '5 Hari', parent: 'Perangkat Jaringan & Komunikasi' },
      { name: 'Konsultasi perangkat', sla: '5 Hari', parent: 'Perangkat Jaringan & Komunikasi' },

      // 9. Teleconference & Meeting (SLA: 1 Hari)
      { name: 'Peminjaman perangkat teleconference', sla: '1 Hari', parent: 'Teleconference & Meeting' },
      { name: 'Peminjaman ruang teleconference', sla: '1 Hari', parent: 'Teleconference & Meeting' },
      { name: 'Permohonan operator teleconference', sla: '1 Hari', parent: 'Teleconference & Meeting' },
      { name: 'Dukungan teknis meeting', sla: '1 Hari', parent: 'Teleconference & Meeting' },
      { name: 'Setup perangkat meeting', sla: '1 Hari', parent: 'Teleconference & Meeting' },
      { name: 'Uji coba teleconference', sla: '1 Hari', parent: 'Teleconference & Meeting' },
      { name: 'Troubleshooting teleconference', sla: '1 Hari', parent: 'Teleconference & Meeting' },
      { name: 'Pendampingan kegiatan', sla: '1 Hari', parent: 'Teleconference & Meeting' },

      // 10. Video Conference / Zoom (SLA: 1 Hari)
      { name: 'Permohonan link Zoom', sla: '1 Hari', parent: 'Video Conference / Zoom' },
      { name: 'Pembuatan Zoom Meeting', sla: '1 Hari', parent: 'Video Conference / Zoom' },
      { name: 'Pembuatan Zoom Webinar', sla: '1 Hari', parent: 'Video Conference / Zoom' },
      { name: 'Pengaturan host/co-host', sla: '1 Hari', parent: 'Video Conference / Zoom' },
      { name: 'Dukungan operator Zoom', sla: '1 Hari', parent: 'Video Conference / Zoom' },
      { name: 'Pendampingan Zoom', sla: '1 Hari', parent: 'Video Conference / Zoom' },
      { name: 'Troubleshooting Zoom', sla: '1 Hari', parent: 'Video Conference / Zoom' },

      // 11. CCTV & Video Monitoring (SLA: 3 Hari)
      { name: 'Permohonan akses CCTV', sla: '3 Hari', parent: 'CCTV & Video Monitoring' },
      { name: 'Permohonan akses live streaming', sla: '3 Hari', parent: 'CCTV & Video Monitoring' },
      { name: 'Permohonan rekaman CCTV', sla: '3 Hari', parent: 'CCTV & Video Monitoring' },
      { name: 'Permintaan informasi CCTV', sla: '3 Hari', parent: 'CCTV & Video Monitoring' },
      { name: 'Gangguan CCTV', sla: '3 Hari', parent: 'CCTV & Video Monitoring' },
      { name: 'Pemeriksaan kamera', sla: '3 Hari', parent: 'CCTV & Video Monitoring' },
      { name: 'Permintaan pemasangan kamera', sla: '3 Hari', parent: 'CCTV & Video Monitoring' },
      { name: 'Permintaan pemindahan kamera', sla: '3 Hari', parent: 'CCTV & Video Monitoring' },
      { name: 'Konsultasi CCTV', sla: '3 Hari', parent: 'CCTV & Video Monitoring' },

      // 12. Wifi Publik (SLA: 2 Hari)
      { name: 'Gangguan wifi', sla: '2 Hari', parent: 'Wifi Publik' },
      { name: 'Permintaan pemasangan wifi', sla: '2 Hari', parent: 'Wifi Publik' },
      { name: 'Permintaan pengecekan wifi', sla: '2 Hari', parent: 'Wifi Publik' },
      { name: 'Pelaporan lokasi wifi', sla: '2 Hari', parent: 'Wifi Publik' },
      { name: 'Pemeliharaan wifi', sla: '2 Hari', parent: 'Wifi Publik' }
    ]
  },

  // -------------------------------------------------------------------------
  // Kategori 3: Penerapan Persandian & Sistem Pengamanan Informasi
  // -------------------------------------------------------------------------
  {
    categoryName: 'Penerapan Persandian & Sistem Pengamanan Informasi',
    items: [
      // 13. Keamanan Informasi & Persandian (SLA: 5 Hari)
      { name: 'Konsultasi keamanan informasi', sla: '5 Hari', parent: 'Keamanan Informasi & Persandian' },
      { name: 'Konsultasi persandian', sla: '5 Hari', parent: 'Keamanan Informasi & Persandian' },
      { name: 'Asesmen keamanan', sla: '5 Hari', parent: 'Keamanan Informasi & Persandian' },
      { name: 'Audit keamanan', sla: '5 Hari', parent: 'Keamanan Informasi & Persandian' },
      { name: 'Penyusunan tata kelola keamanan', sla: '5 Hari', parent: 'Keamanan Informasi & Persandian' },
      { name: 'Konsultasi kebijakan keamanan', sla: '5 Hari', parent: 'Keamanan Informasi & Persandian' },
      { name: 'Pendampingan keamanan', sla: '5 Hari', parent: 'Keamanan Informasi & Persandian' },

      // 14. Security Operation Center (SOC) (SLA: 1 Hari)
      { name: 'Permintaan monitoring keamanan', sla: '1 Hari', parent: 'Security Operation Center (SOC)' },
      { name: 'Investigasi alert keamanan', sla: '1 Hari', parent: 'Security Operation Center (SOC)' },
      { name: 'Analisis log', sla: '1 Hari', parent: 'Security Operation Center (SOC)' },
      { name: 'Monitoring keamanan', sla: '1 Hari', parent: 'Security Operation Center (SOC)' },
      { name: 'Konsultasi SOC', sla: '1 Hari', parent: 'Security Operation Center (SOC)' },
      { name: 'Tindak lanjut alert', sla: '1 Hari', parent: 'Security Operation Center (SOC)' },

      // 15. CSIRT / Respons Insiden (SLA: 1 Hari)
      { name: 'Pelaporan insiden keamanan', sla: '1 Hari', parent: 'CSIRT / Respons Insiden' },
      { name: 'Penanganan insiden', sla: '1 Hari', parent: 'CSIRT / Respons Insiden' },
      { name: 'Investigasi insiden', sla: '1 Hari', parent: 'CSIRT / Respons Insiden' },
      { name: 'Analisis insiden', sla: '1 Hari', parent: 'CSIRT / Respons Insiden' },
      { name: 'Pemulihan insiden', sla: '1 Hari', parent: 'CSIRT / Respons Insiden' },
      { name: 'Konsultasi insiden', sla: '1 Hari', parent: 'CSIRT / Respons Insiden' },
      { name: 'Tindak lanjut insiden', sla: '1 Hari', parent: 'CSIRT / Respons Insiden' },

      // 16. Security Awareness (SLA: 3 Hari)
      { name: 'Permohonan sosialisasi keamanan', sla: '3 Hari', parent: 'Security Awareness' },
      { name: 'Permohonan pelatihan keamanan', sla: '3 Hari', parent: 'Security Awareness' },
      { name: 'Permohonan bimtek keamanan', sla: '3 Hari', parent: 'Security Awareness' },
      { name: 'Edukasi keamanan siber', sla: '3 Hari', parent: 'Security Awareness' },
      { name: 'Pendampingan keamanan siber', sla: '3 Hari', parent: 'Security Awareness' }
    ]
  },

  // -------------------------------------------------------------------------
  // Kategori 4: Tata Kelola SPBE
  // -------------------------------------------------------------------------
  {
    categoryName: 'Tata Kelola SPBE',
    items: [
      // 17. Kebijakan SPBE (SLA: 10 Hari)
      { name: 'Konsultasi kebijakan SPBE', sla: '10 Hari', parent: 'Kebijakan SPBE' },
      { name: 'Konsultasi tata kelola SPBE', sla: '10 Hari', parent: 'Kebijakan SPBE' },
      { name: 'Permintaan rekomendasi SPBE', sla: '10 Hari', parent: 'Kebijakan SPBE' },
      { name: 'Pendampingan SPBE', sla: '10 Hari', parent: 'Kebijakan SPBE' },
      { name: 'Konsultasi regulasi SPBE', sla: '10 Hari', parent: 'Kebijakan SPBE' },

      // 18. Arsitektur & Peta Rencana SPBE (SLA: 14 Hari)
      { name: 'Konsultasi arsitektur SPBE', sla: '14 Hari', parent: 'Arsitektur & Peta Rencana SPBE' },
      { name: 'Konsultasi peta rencana', sla: '14 Hari', parent: 'Arsitektur & Peta Rencana SPBE' },
      { name: 'Penyusunan arsitektur', sla: '14 Hari', parent: 'Arsitektur & Peta Rencana SPBE' },
      { name: 'Review arsitektur', sla: '14 Hari', parent: 'Arsitektur & Peta Rencana SPBE' },
      { name: 'Pendampingan pemetaan SPBE', sla: '14 Hari', parent: 'Arsitektur & Peta Rencana SPBE' },

      // 19. Monev & Pelaporan SPBE (SLA: 14 Hari)
      { name: 'Konsultasi evaluasi SPBE', sla: '14 Hari', parent: 'Monev & Pelaporan SPBE' },
      { name: 'Pendampingan evaluasi SPBE', sla: '14 Hari', parent: 'Monev & Pelaporan SPBE' },
      { name: 'Konsultasi indikator', sla: '14 Hari', parent: 'Monev & Pelaporan SPBE' },
      { name: 'Konsultasi bukti dukung', sla: '14 Hari', parent: 'Monev & Pelaporan SPBE' },
      { name: 'Pendampingan pengisian evaluasi', sla: '14 Hari', parent: 'Monev & Pelaporan SPBE' },
      { name: 'Konsultasi pelaporan SPBE', sla: '14 Hari', parent: 'Monev & Pelaporan SPBE' },

      // 20. Integrasi & Interoperabilitas SPBE (SLA: 7 Hari)
      { name: 'Permohonan integrasi SPBE', sla: '7 Hari', parent: 'Integrasi & Interoperabilitas SPBE' },
      { name: 'Integrasi API SPBE', sla: '7 Hari', parent: 'Integrasi & Interoperabilitas SPBE' },
      { name: 'Integrasi SPLP SPBE', sla: '7 Hari', parent: 'Integrasi & Interoperabilitas SPBE' },
      { name: 'Konsultasi interoperabilitas', sla: '7 Hari', parent: 'Integrasi & Interoperabilitas SPBE' },
      { name: 'Pengujian integrasi', sla: '7 Hari', parent: 'Integrasi & Interoperabilitas SPBE' },
      { name: 'Pendampingan integrasi', sla: '7 Hari', parent: 'Integrasi & Interoperabilitas SPBE' }
    ]
  },

  // -------------------------------------------------------------------------
  // Kategori 5: Statistik Sektoral
  // -------------------------------------------------------------------------
  {
    categoryName: 'Statistik Sektoral',
    items: [
      // 21. Statistik Sektoral (SLA: 5 Hari)
      { name: 'Permintaan data statistik', sla: '5 Hari', parent: 'Statistik Sektoral' },
      { name: 'Permintaan dataset', sla: '5 Hari', parent: 'Statistik Sektoral' },
      { name: 'Permintaan metadata', sla: '5 Hari', parent: 'Statistik Sektoral' },
      { name: 'Konsultasi statistik', sla: '5 Hari', parent: 'Statistik Sektoral' },
      { name: 'Konsultasi metodologi', sla: '5 Hari', parent: 'Statistik Sektoral' },
      { name: 'Rekomendasi statistik', sla: '5 Hari', parent: 'Statistik Sektoral' },
      { name: 'Validasi data', sla: '5 Hari', parent: 'Statistik Sektoral' },

      // 22. Satu Data Daerah (SLA: 5 Hari)
      { name: 'Pendampingan statistik', sla: '5 Hari', parent: 'Satu Data Daerah' },
      { name: 'Permintaan data Satu Data', sla: '5 Hari', parent: 'Satu Data Daerah' },
      { name: 'Permintaan dataset Satu Data', sla: '5 Hari', parent: 'Satu Data Daerah' },
      { name: 'Permintaan metadata Satu Data', sla: '5 Hari', parent: 'Satu Data Daerah' },
      { name: 'Konsultasi Satu Data', sla: '5 Hari', parent: 'Satu Data Daerah' },
      { name: 'Standar data', sla: '5 Hari', parent: 'Satu Data Daerah' },
      { name: 'Kode referensi', sla: '5 Hari', parent: 'Satu Data Daerah' },
      { name: 'Integrasi data', sla: '5 Hari', parent: 'Satu Data Daerah' },
      { name: 'Validasi data daerah', sla: '5 Hari', parent: 'Satu Data Daerah' }
    ]
  },

  // -------------------------------------------------------------------------
  // Kategori 6: Informasi & Komunikasi Publik
  // -------------------------------------------------------------------------
  {
    categoryName: 'Informasi & Komunikasi Publik',
    items: [
      // 23. Informasi & Komunikasi Publik (SLA: 3 Hari)
      { name: 'Permohonan publikasi', sla: '3 Hari', parent: 'Informasi & Komunikasi Publik' },
      { name: 'Permohonan diseminasi informasi', sla: '3 Hari', parent: 'Informasi & Komunikasi Publik' },
      { name: 'Permohonan peliputan', sla: '3 Hari', parent: 'Informasi & Komunikasi Publik' },
      { name: 'Permohonan dokumentasi', sla: '3 Hari', parent: 'Informasi & Komunikasi Publik' },
      { name: 'Konsultasi komunikasi publik', sla: '3 Hari', parent: 'Informasi & Komunikasi Publik' },
      { name: 'Dukungan komunikasi kegiatan', sla: '3 Hari', parent: 'Informasi & Komunikasi Publik' },

      // 24. Pelayanan Informasi Publik (SLA: 3 Hari)
      { name: 'Permohonan informasi', sla: '3 Hari', parent: 'Pelayanan Informasi Publik' },
      { name: 'Permintaan data/informasi', sla: '3 Hari', parent: 'Pelayanan Informasi Publik' },
      { name: 'Konsultasi informasi publik', sla: '3 Hari', parent: 'Pelayanan Informasi Publik' },
      { name: 'Permintaan salinan informasi', sla: '3 Hari', parent: 'Pelayanan Informasi Publik' }
    ]
  },

  // -------------------------------------------------------------------------
  // Kategori 7: Pengembangan SDM
  // -------------------------------------------------------------------------
  {
    categoryName: 'Pengembangan SDM',
    items: [
      // 28. Peningkatan Kapasitas SDM TIK (SLA: 5 Hari)
      { name: 'Permohonan pelatihan', sla: '5 Hari', parent: 'Peningkatan Kapasitas SDM TIK' },
      { name: 'Permohonan bimtek', sla: '5 Hari', parent: 'Peningkatan Kapasitas SDM TIK' },
      { name: 'Permohonan sosialisasi', sla: '5 Hari', parent: 'Peningkatan Kapasitas SDM TIK' },
      { name: 'Permohonan narasumber', sla: '5 Hari', parent: 'Peningkatan Kapasitas SDM TIK' },
      { name: 'Konsultasi kompetensi', sla: '5 Hari', parent: 'Peningkatan Kapasitas SDM TIK' },
      { name: 'Pendampingan SDM', sla: '5 Hari', parent: 'Peningkatan Kapasitas SDM TIK' }
    ]
  }
];

const seedServices = async () => {
  try {
    console.log('[Seeder] Memulai sinkronisasi sub layanan terkecil (Jenis Permintaan) sesuai PDF...');

    // 1. Cari layanan Asesmen Aplikasi yang harus dipertahankan
    let asesmen = await db.query("SELECT * FROM services WHERE service_name ILIKE '%Asesmen Aplikasi%' OR id = 453 LIMIT 1");
    let asesmenId = 453;
    let asesmenData = null;

    if (asesmen.rows.length > 0) {
      asesmenData = asesmen.rows[0];
      asesmenId = asesmenData.id;
      console.log(`[Seeder] Layanan Asesmen Aplikasi ditemukan (ID: ${asesmenId}) dengan ${asesmenData.form_schema ? asesmenData.form_schema.length : 0} field.`);
    }

    // 2. Amankan foreign key tiket lama: arahkan tiket ke Asesmen Aplikasi agar aman saat delete
    if (asesmenId) {
      const updateTickets = await db.query('UPDATE tickets SET service_id = $1 WHERE service_id != $1', [asesmenId]);
      if (updateTickets.rowCount > 0) {
        console.log(`[Seeder] Mengamankan ${updateTickets.rowCount} tiket ke service_id ${asesmenId}.`);
      }
    }

    // 3. Hapus semua service KECUALI Asesmen Aplikasi
    if (asesmenId) {
      const delRes = await db.query('DELETE FROM services WHERE id != $1', [asesmenId]);
      console.log(`[Seeder] Berhasil membersihkan ${delRes.rowCount} sub layanan lama. Layanan Asesmen Aplikasi tetap dipertahankan.`);
    } else {
      await db.query('DELETE FROM services');
      console.log('[Seeder] Membersihkan seluruh services.');
    }

    // 4. Pastikan kategori-kategori resmi tersedia di database
    const categoryCache = {};
    const existingCats = await db.query('SELECT id, category_name FROM service_categories');
    existingCats.rows.forEach(c => {
      categoryCache[c.category_name.toLowerCase()] = c.id;
    });

    for (const group of detailedSubServicesData) {
      let catId = categoryCache[group.categoryName.toLowerCase()];
      if (!catId) {
        const insertCat = await db.query(
          'INSERT INTO service_categories (category_name) VALUES ($1) RETURNING id',
          [group.categoryName]
        );
        catId = insertCat.rows[0].id;
        categoryCache[group.categoryName.toLowerCase()] = catId;
        console.log(`[Seeder] Kategori baru dibuat: "${group.categoryName}" (ID: ${catId})`);
      }

      // 5. Masukkan masing-masing sub layanan terkecil
      for (const item of group.items) {
        await db.query(
          `INSERT INTO services (category_id, service_name, target_sla, verification_type, sop_link, status, form_schema, required_docs)
           VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)`,
          [
            catId,
            item.name,
            item.sla || '3-7 Hari',
            'Manual Helpdesk',
            'sop_layanan.pdf',
            'Aktif',
            '[]',
            item.parent ? `Layanan Induk: ${item.parent}` : 'Surat Permohonan Resmi OPD, KAK / Dokumen Pendukung'
          ]
        );
      }
    }

    // 6. Pastikan Asesmen Aplikasi tetap memiliki form_schema 7 field lengkap & kategori valid
    const aptikaCatId = categoryCache['aplikasi informatika'] || existingCats.rows[0]?.id;
    if (asesmenData) {
      await db.query(
        `UPDATE services 
         SET category_id = $1, status = 'Aktif', sop_link = 'sop_layanan.pdf' 
         WHERE id = $2`,
        [aptikaCatId, asesmenId]
      );
    } else {
      const defaultAsesmenSchema = [
        { id: "field_7jzrjzui5", name: "field_7jzrjzui5", type: "file", label: "KAK (Kerangka Acuan Kerja)", required: true },
        { id: "field_v38tqabx8", name: "field_v38tqabx8", type: "file", label: "LAPORAN AWAL", required: true },
        { id: "field_j5g4srx4p", name: "field_j5g4srx4p", type: "file", label: "SURAT KEPUTUSAN/SURAT PERINTAH TIM PENGELOLA APLIKASI", required: true },
        { id: "field_6gpubrcxz", name: "field_6gpubrcxz", type: "file", label: "SURAT KEPUTUSAN/SURAT PERINTAH TIM HELPDESK APLIKASI", required: true },
        { id: "field_hpdy17j5p", name: "field_hpdy17j5p", type: "file", label: "LAPORAN AKHIR", required: true },
        { id: "field_4lcjdp90r", name: "field_4lcjdp90r", type: "file", label: "STANDAR OPERASIONAL PROSEDUR (SOP)", required: true },
        { id: "field_wl4dvhy0u", name: "field_wl4dvhy0u", type: "file", label: "BUKU PANDUAN PENGELOLAAN APLIKASI", required: true }
      ];
      await db.query(
        `INSERT INTO services (category_id, service_name, target_sla, verification_type, sop_link, status, form_schema, required_docs)
         VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)`,
        [
          aptikaCatId,
          'Asesmen Aplikasi',
          '3-11 Hari',
          'Asesmen',
          'sop_layanan.pdf',
          'Aktif',
          JSON.stringify(defaultAsesmenSchema),
          'KAK, Laporan Awal, SK Tim Pengelola, SK Tim Helpdesk, Laporan Akhir, SOP, Buku Panduan'
        ]
      );
      console.log('[Seeder] Layanan Asesmen Aplikasi berhasil diinisialisasi.');
    }

    const countRes = await db.query('SELECT count(*) FROM services');
    console.log(`[Seeder] Selesai! Total sub layanan terkecil saat ini di database: ${countRes.rows[0].count} sub layanan (termasuk 1 Asesmen Aplikasi).`);
  } catch (err) {
    console.error('[Seeder Error]:', err);
    throw err;
  }
};

if (require.main === module) {
  seedServices().then(() => {
    console.log('[Seeder] Eksekusi tuntas.');
    process.exit(0);
  }).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

module.exports = { seedServices, detailedSubServicesData };
