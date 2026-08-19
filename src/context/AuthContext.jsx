import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState({
    name: 'Dr. Budi Utomo',
    email: 'budi.utomo@bogor.go.id',
    role: 'user',
    department: 'Dinas Kesehatan Kota Bogor',
  });

  const generateRatings = () => {
    return [
      {
        id: 1,
        name: 'Dinas Kesehatan Kota Bogor',
        rating: 5,
        service: 'Server Perangkat Daerah',
        comment: 'Pengerjaan VM hosting untuk website profil dinas sangat cepat. Helpdesk sangat responsif memvalidasi awal berkas kami, dan Tim Jaringan menyelesaikannya tepat waktu.',
        status: 'Selesai (On SLA)',
        selectedForLanding: true,
        aspects: { speed: 5, result: 5, communication: 5, quality: 5 }
      },
      {
        id: 2,
        name: 'Dinas Pendidikan Kota Bogor',
        rating: 5,
        service: 'Pengembangan & Pengelolaan Aplikasi',
        comment: 'Penambahan fitur laporan bulanan pada sistem PPID selesai sebelum target waktu SLA. Laporan BAST terdokumentasi dengan sangat rapi di dalam portal ini.',
        status: 'Selesai (On SLA)',
        selectedForLanding: true,
        aspects: { speed: 5, result: 5, communication: 5, quality: 5 }
      },
      {
        id: 3,
        name: 'Dinas Pariwisata & Kebudayaan',
        rating: 4,
        service: 'Uji Kesesuaian Sistem (UKS)',
        comment: 'Layanan uji kesesuaian sistem sangat membantu kelancaran operasional aplikasi kami. Koordinasi baik meskipun ada kendala teknis minor di awal.',
        status: 'Selesai',
        selectedForLanding: true,
        aspects: { speed: 4, result: 4, communication: 4, quality: 4 }
      },
      {
        id: 4,
        name: 'Dinas Kesehatan Kota Bogor',
        rating: 5,
        service: 'Keamanan Informasi & Persandian',
        comment: 'Layanan instalasi antivirus berjalan sangat cepat dan tidak mengganggu jam operasional staf.',
        status: 'Selesai (On SLA)',
        selectedForLanding: true,
        aspects: { speed: 5, result: 5, communication: 5, quality: 5 }
      },
      {
        id: 5,
        name: 'Dinas Kesehatan Kota Bogor',
        rating: 5,
        service: 'Video Conference / Zoom',
        comment: 'Lisensi Zoom berkapasitas besar diberikan tepat sebelum sosialisasi dimulai. Sangat membantu!',
        status: 'Selesai (On SLA)',
        selectedForLanding: true,
        aspects: { speed: 5, result: 5, communication: 5, quality: 5 }
      },
      {
        id: 6,
        name: 'Dinas Kesehatan Kota Bogor',
        rating: 4,
        service: 'Domain & Subdomain Pemerintah Daerah',
        comment: 'Pointing subdomain dinkes selesai dengan cepat. Terima kasih Diskominfo.',
        status: 'Selesai',
        selectedForLanding: true,
        aspects: { speed: 4, result: 4, communication: 4, quality: 4 }
      },
      {
        id: 7,
        name: 'Dinas Kesehatan Kota Bogor',
        rating: 5,
        service: 'Infrastruktur TIK',
        comment: 'Printer pelayanan sudah bisa digunakan kembali setelah diinstal ulang drivernya.',
        status: 'Selesai (On SLA)',
        selectedForLanding: true,
        aspects: { speed: 5, result: 5, communication: 5, quality: 5 }
      },
      {
        id: 8,
        name: 'Dinas Kesehatan Kota Bogor',
        rating: 5,
        service: 'Keamanan Aplikasi / VAPT',
        comment: 'Uji keamanan aplikasi ESIR sangat teliti dan detail laporannya mudah dipahami.',
        status: 'Selesai (On SLA)',
        selectedForLanding: true,
        aspects: { speed: 5, result: 5, communication: 5, quality: 5 }
      },
      {
        id: 9,
        name: 'Dinas Kesehatan Kota Bogor',
        rating: 5,
        service: 'Jaringan Intra Pemerintah',
        comment: 'Akses internet dinas kesehatan kini jauh lebih cepat setelah bandwidth di-upgrade.',
        status: 'Selesai (On SLA)',
        selectedForLanding: true,
        aspects: { speed: 5, result: 5, communication: 5, quality: 5 }
      },
      {
        id: 10,
        name: 'Dinas Kesehatan Kota Bogor',
        rating: 5,
        service: 'Tata Kelola SPBE',
        comment: 'Pendampingan peta rencana arsitektur SPBE sektor kesehatan sangat komprehensif.',
        status: 'Selesai (On SLA)',
        selectedForLanding: true,
        aspects: { speed: 5, result: 5, communication: 5, quality: 5 }
      },
      {
        id: 11,
        name: 'Dinas Kesehatan Kota Bogor',
        rating: 4,
        service: 'Satu Data Daerah',
        comment: 'Materi pengisian metadata sektoral di portal Satu Data sangat membantu kelancaran data kami.',
        status: 'Selesai',
        selectedForLanding: false,
        aspects: { speed: 4, result: 4, communication: 4, quality: 4 }
      },
      {
        id: 12,
        name: 'Dinas Pendidikan Kota Bogor',
        rating: 5,
        service: 'Jaringan Intra Pemerintah',
        comment: 'Koneksi internet Wifi area lobby sudah stabil dan cepat kembali. Layanan Diskominfo mantap!',
        status: 'Selesai (On SLA)',
        selectedForLanding: false,
        aspects: { speed: 5, result: 5, communication: 5, quality: 5 }
      }
    ];
  };

  const defaultTicketsList = [
    {
      id: 'REQ-2026-0131',
      opd: 'Dinas Perhubungan Kota Bogor',
      service: 'Jaringan Intra Pemerintah',
      requestType: 'Permintaan Akses Jaringan',
      title: 'Akses VPN Bidang Lalu Lintas',
      desc: 'Permohonan pembuatan akun VPN khusus untuk staf Bidang Lalu Lintas guna memantau CCTV simpang jalan.',
      date: '14 Agustus 2026',
      progress: 0,
      status: 'Verifikasi',
      files: ['Surat_Permohonan_VPN.pdf'],
      logs: [
        { date: '14 Agt 09:00', text: 'Tiket berhasil dibuat oleh User' }
      ]
    },
    {
      id: 'REQ-2026-0130',
      opd: 'Kecamatan Bogor Tengah',
      service: 'Infrastruktur TIK',
      requestType: 'Pengadaan Perangkat',
      title: 'Pemasangan Switch Hub Ruang Camat',
      desc: 'Permohonan pengadaan dan pemasangan unit switch hub baru untuk memperbanyak port LAN pelayanan.',
      date: '14 Agustus 2026',
      progress: 0,
      status: 'Verifikasi',
      files: ['Nota_Permintaan_Camat.pdf'],
      logs: [
        { date: '14 Agt 09:00', text: 'Tiket berhasil dibuat oleh User' }
      ]
    },
    {
      id: 'REQ-2026-0129',
      opd: 'Dinas Pendidikan Kota Bogor',
      service: 'Server Perangkat Daerah',
      requestType: 'Permohonan Hosting Baru',
      title: 'Kebutuhan VM Hosting Aplikasi PPDB',
      desc: 'Kami memerlukan VM baru dengan spesifikasi 4 Core CPU, 8GB RAM, 100GB SSD untuk hosting sistem PPDB 2026.',
      date: '13 Agustus 2026',
      progress: 0,
      status: 'Verifikasi',
      files: ['Surat_Permohonan_Kadis.pdf', 'Spesifikasi_Teknis.xlsx'],
      logs: [
        { date: '13 Agt 09:00', text: 'Tiket berhasil dibuat oleh User' }
      ]
    },
    {
      id: 'REQ-2026-0128',
      opd: 'Dinas Pariwisata & Kebudayaan',
      service: 'Pengembangan & Pengelolaan Aplikasi',
      requestType: 'Penambahan Fitur',
      title: 'Fitur Ekspor PDF Laporan Kunjungan Wisata',
      desc: 'Permohonan penambahan tombol ekspor laporan bulanan kunjungan wisata ke format PDF pada aplikasi E-Tourism.',
      date: '12 Agustus 2026',
      progress: 40,
      remainingDays: 3,
      team: 'Tim Aplikasi & Sistem Informasi',
      status: 'Diproses',
      logs: [
        { date: '13 Agt 09:00', text: 'Analisis kebutuhan data laporan pariwisata' },
        { date: '12 Agt 14:00', text: 'Permohonan diterima & divalidasi oleh Helpdesk' },
        { date: '12 Agt 09:00', text: 'Tiket berhasil dibuat oleh User' }
      ]
    },
    {
      id: 'REQ-2026-0127',
      opd: 'Dinas Kesehatan Kota Bogor',
      service: 'Jaringan Intra Pemerintah',
      requestType: 'Pemasangan Jaringan',
      title: 'Pemasangan Titik Wifi di Puskesmas Bantarjati',
      desc: 'Penambahan 2 titik akses wifi baru untuk ruang tunggu pelayanan obat Puskesmas Bantarjati.',
      date: '11 Agustus 2026',
      progress: 0,
      status: 'Verifikasi',
      files: ['Form_Survey_Lokasi.pdf'],
      logs: [
        { date: '11 Agt 09:00', text: 'Tiket berhasil dibuat oleh User' }
      ]
    },
    {
      id: 'REQ-2026-0126',
      opd: 'Dinas Kesehatan Kota Bogor',
      service: 'Jaringan Intra Pemerintah',
      requestType: 'Pemasangan Jaringan',
      title: 'Pemasangan Jaringan Wifi Ruang Rapat A',
      desc: 'Pemasangan wifi ruang rapat utama Gedung Dinas Kesehatan Kota Bogor.',
      date: '10 Agustus 2026',
      progress: 100,
      team: 'Tim Infrastruktur & Jaringan TIK',
      status: 'Menunggu Konfirmasi User',
      logs: [
        { date: '12 Agt 15:00', text: 'Pekerjaan fisik selesai 100% dan uji koneksi sukses' },
        { date: '11 Agt 09:00', text: 'Pemasangan Access Point dimulai oleh Tim Jaringan' },
        { date: '10 Agt 10:00', text: 'Permohonan disetujui & dialihkan ke Tim Jaringan' },
        { date: '10 Agt 09:00', text: 'Tiket berhasil dibuat oleh User' }
      ]
    },
    {
      id: 'REQ-2026-0125',
      opd: 'Dinas Kesehatan Kota Bogor',
      service: 'Pengembangan & Pengelolaan Aplikasi',
      requestType: 'Penambahan Fitur',
      title: 'Penambahan Fitur Laporan Monitoring',
      desc: 'Kami membutuhkan fitur laporan rekap kunjungan berdasarkan periode dan OPD pada aplikasi ESIR.',
      date: '10 Agustus 2026',
      progress: 80,
      remainingDays: 1,
      team: 'Tim Aplikasi & Sistem Informasi',
      status: 'Diproses',
      logs: [
        { date: '11 Agt 10:00', text: 'Pekerjaan dimulai oleh Rian Hidayat (Tim Aplikasi)' },
        { date: '10 Agt 11:30', text: 'Permohonan disetujui & divalidasi oleh Helpdesk' },
        { date: '10 Agt 09:00', text: 'Tiket berhasil dibuat oleh User' }
      ]
    },
    {
      id: 'REQ-2026-0124',
      opd: 'Dinas Kesehatan Kota Bogor',
      service: 'Server Perangkat Daerah',
      requestType: 'Permohonan Hosting',
      title: 'Permohonan Hosting Server & Database',
      desc: 'Permohonan alokasi Virtual Machine dan pembagian alokasi kapasitas RAM/CPU untuk server cadangan.',
      date: '08 Agustus 2026',
      progress: 60,
      remainingDays: 3,
      team: 'Tim Infrastruktur & Jaringan TIK',
      status: 'Diproses',
      logs: [
        { date: '09 Agt 14:00', text: 'Konfigurasi alokasi RAM & CPU diselesaikan oleh tim server' },
        { date: '08 Agt 10:00', text: 'Permohonan disetujui oleh Helpdesk' },
        { date: '08 Agt 09:00', text: 'Tiket berhasil dibuat oleh User' }
      ]
    },
    {
      id: 'REQ-2026-0120',
      opd: 'Dinas Kesehatan Kota Bogor',
      service: 'Server Perangkat Daerah',
      requestType: 'Permohonan Hosting',
      title: 'VM Hosting Website Profil Dinas Kesehatan',
      desc: 'Permohonan pembuatan database MySQL dan hosting PHP untuk portal informasi publik dinas.',
      date: '01 Agustus 2026',
      progress: 100,
      status: 'Selesai',
      logs: [
        { date: '03 Agt 14:00', text: 'User mengonfirmasi selesai & mengisi survei rating 5 bintang' },
        { date: '02 Agt 10:00', text: 'Database & hosting siap digunakan' },
        { date: '01 Agt 11:00', text: 'Permohonan disetujui oleh Helpdesk' },
        { date: '01 Agt 09:00', text: 'Tiket berhasil dibuat oleh User' }
      ],
      rating: {
        speed: 5,
        result: 5,
        communication: 5,
        quality: 5,
        comment: 'Pengerjaan VM hosting untuk website profil dinas sangat cepat. Helpdesk sangat responsif memvalidasi awal berkas kami, dan Tim Jaringan menyelesaikannya tepat waktu.'
      }
    },
    { id: 'REQ-2026-0119', opd: 'Dinas Kesehatan Kota Bogor', service: 'Keamanan Informasi & Persandian', requestType: 'Setup Keamanan', title: 'Instalasi Antivirus Staf Dinas Kesehatan', progress: 100, status: 'Selesai', date: '28 Juli 2026', logs: [{ date: '29 Juli 10:00', text: 'Tiket selesai dikonfirmasi oleh user' }], rating: { speed: 5, result: 5, communication: 5, quality: 5, comment: 'Layanan instalasi antivirus berjalan sangat cepat dan tidak mengganggu jam operasional staf.' } },
    { id: 'REQ-2026-0118', opd: 'Dinas Kesehatan Kota Bogor', service: 'Video Conference / Zoom', requestType: 'Penyediaan Webinar', title: 'Penyediaan Webinar Zoom Sosialisasi Imunisasi', progress: 100, status: 'Selesai', date: '25 Juli 2026', logs: [{ date: '26 Juli 11:00', text: 'Sosialisasi imunisasi nasional sukses menggunakan lisensi Zoom kami' }], rating: { speed: 5, result: 5, communication: 4, quality: 5, comment: 'Lisensi Zoom berkapasitas besar diberikan tepat sebelum sosialisasi dimulai. Sangat membantu!' } },
    { id: 'REQ-2026-0117', opd: 'Dinas Kesehatan Kota Bogor', service: 'Domain & Subdomain Pemerintah Daerah', requestType: 'Pembuatan Subdomain', title: 'Subdomain baru dinkes.bogor.go.id', progress: 100, status: 'Selesai', date: '22 Juli 2026', logs: [{ date: '23 Juli 09:00', text: 'DNS pointing subdomain sukses' }], rating: { speed: 4, result: 5, communication: 5, quality: 4, comment: 'Pointing subdomain dinkes selesai dengan cepat. Terima kasih Diskominfo.' } },
    { id: 'REQ-2026-0116', opd: 'Dinas Kesehatan Kota Bogor', service: 'Infrastruktur TIK', requestType: 'Perbaikan Perangkat', title: 'Perbaikan Printer Bidang P2P Dinkes', progress: 100, status: 'Selesai', date: '18 Juli 2026', logs: [{ date: '19 Juli 15:00', text: 'Perbaikan driver printer selesai dikonfirmasi user' }], rating: { speed: 5, result: 4, communication: 5, quality: 5, comment: 'Printer pelayanan sudah bisa digunakan kembali setelah diinstal ulang drivernya.' } },
    { id: 'REQ-2026-0115', opd: 'Dinas Kesehatan Kota Bogor', service: 'Keamanan Aplikasi / VAPT', requestType: 'Security Audit', title: 'Uji Kelayakan Keamanan Aplikasi ESIR', progress: 100, status: 'Selesai', date: '15 Juli 2026', logs: [{ date: '17 Juli 10:00', text: 'Laporan hasil pentest diserahkan kepada dinkes' }], rating: { speed: 4, result: 5, communication: 4, quality: 5, comment: 'Uji keamanan aplikasi ESIR sangat teliti dan detail laporannya mudah dipahami.' } },
    { id: 'REQ-2026-0114', opd: 'Dinas Kesehatan Kota Bogor', service: 'Jaringan Intra Pemerintah', requestType: 'Upgrade Jaringan', title: 'Penambahan Bandwidth Internet Kantor Dinkes', progress: 100, status: 'Selesai', date: '10 Juli 2026', logs: [{ date: '11 Juli 14:00', text: 'Penyetelan bandwidth baru di mikrotik dinkes selesai' }], rating: { speed: 5, result: 5, communication: 5, quality: 5, comment: 'Akses internet dinas kesehatan kini jauh lebih cepat setelah bandwidth di-upgrade.' } },
    { id: 'REQ-2026-0113', opd: 'Dinas Kesehatan Kota Bogor', service: 'Tata Kelola SPBE', requestType: 'Penyusunan Arsitektur', title: 'Penyusunan Arsitektur SPBE Bidang Kesehatan', progress: 100, status: 'Selesai', date: '05 Juli 2026', logs: [{ date: '07 Juli 16:00', text: 'Kegiatan bimtek peta rencana SPBE selesai' }], rating: { speed: 5, result: 5, communication: 5, quality: 5, comment: 'Pendampingan peta rencana arsitektur SPBE sektor kesehatan sangat komprehensif.' } },
    { id: 'REQ-2026-0112', opd: 'Dinas Kesehatan Kota Bogor', service: 'Satu Data Daerah', requestType: 'Sosialisasi Data', title: 'Sosialisasi Satu Data Sektoral Kesehatan', progress: 100, status: 'Selesai', date: '01 Juli 2026', logs: [{ date: '02 Juli 12:00', text: 'Bimtek metadata Satu Data selesai' }], rating: { speed: 4, result: 4, communication: 5, quality: 5, comment: 'Materi pengisian metadata sektoral di portal Satu Data sangat membantu kelancaran data kami.' } },
    { id: 'REQ-2026-0111', opd: 'Dinas Pendidikan Kota Bogor', service: 'Jaringan Intra Pemerintah', requestType: 'Wifi Publik', title: 'Pemeriksaan Koneksi Wifi Area Lobby Disdik', progress: 100, status: 'Selesai', date: '24 Juli 2026', logs: [{ date: '25 Juli 16:00', text: 'Pemeriksaan selesai, akses poin telah dikonfigurasi ulang.' }], rating: { speed: 5, result: 5, communication: 5, quality: 5, comment: 'Koneksi internet Wifi area lobby sudah stabil dan cepat kembali. Layanan Diskominfo mantap!' } },
    {
      id: 'REQ-2026-0121',
      opd: 'Dinas Pendidikan Kota Bogor',
      service: 'Pengembangan & Pengelolaan Aplikasi',
      requestType: 'Penambahan Fitur',
      title: 'Fitur Laporan Bulanan PPID Dinas Pendidikan',
      desc: 'Penambahan dashboard grafik rekapitulasi data permohonan informasi masuk per bulan.',
      date: '30 Juli 2026',
      progress: 100,
      team: 'Tim Aplikasi & Sistem Informasi',
      status: 'Selesai',
      logs: [
        { date: '02 Agt 11:00', text: 'User mengonfirmasi selesai & mengisi survei ulasan' },
        { date: '01 Agt 14:00', text: 'Pekerjaan selesai 100%' }
      ],
      rating: {
        speed: 5,
        result: 5,
        communication: 5,
        quality: 5,
        comment: 'Penambahan fitur laporan bulanan pada sistem PPID selesai sebelum target waktu SLA. Laporan BAST terdokumentasi dengan sangat rapi di dalam portal ini.'
      }
    },
    {
      id: 'REQ-2026-0122',
      opd: 'Dinas Pariwisata & Kebudayaan',
      service: 'Pengembangan & Pengelolaan Aplikasi',
      requestType: 'Uji Kesesuaian Sistem (UKS)',
      title: 'Uji Kesesuaian Sistem Aplikasi E-Tourism',
      desc: 'Permohonan pelaksanaan audit kelayakan aplikasi pariwisata sebelum peluncuran resmi.',
      date: '25 Juli 2026',
      progress: 100,
      team: 'Tim Aplikasi & Sistem Informasi',
      status: 'Selesai',
      logs: [
        { date: '28 Juli 15:00', text: 'User mengonfirmasi selesai & memberikan nilai bintang 4' }
      ],
      rating: {
        speed: 4,
        result: 4,
        communication: 4,
        quality: 4,
        comment: 'Layanan uji kesesuaian sistem sangat membantu kelancaran operasional aplikasi kami. Koordinasi baik meskipun ada kendala teknis minor di awal.'
      }
    },
    {
      id: 'REQ-2026-0123',
      opd: 'Dinas Kesehatan Kota Bogor',
      service: 'Server Perangkat Daerah',
      requestType: 'Permohonan Hosting',
      title: 'VM Hosting Aplikasi P-Care Puskesmas',
      desc: 'Permohonan hosting VM server database lokal untuk rekam medis P-Care.',
      date: '20 Juli 2026',
      progress: 0,
      status: 'Ditolak',
      logs: [
        { date: '21 Juli 10:00', text: 'Permohonan ditolak oleh Helpdesk. Alasan: Berkas dokumen TOR pendukung spesifikasi teknis server tidak dilampirkan.' }
      ]
    }
  ];

  const defaultTeamsList = [
    {
      id: 1,
      name: 'Tim Aplikasi & Sistem Informasi',
      leader: 'Andi Wijaya',
      members: ['Rian Hidayat', 'Sari Safitri'],
      services: ['Pengembangan & Pengelolaan Aplikasi', 'Rekomendasi & Evaluasi Aplikasi', 'Uji Kesesuaian Sistem (UKS)']
    },
    {
      id: 2,
      name: 'Tim Infrastruktur & Jaringan TIK',
      leader: 'Hermawan',
      members: ['Deni Setiawan', 'Iwan Prasetyo'],
      services: ['Jaringan Intra Pemerintah', 'Server Perangkat Daerah', 'Infrastruktur TIK', 'Wifi Publik']
    },
    {
      id: 3,
      name: 'Tim Pengamanan Informasi & Sandi',
      leader: 'Bambang',
      members: ['Yusuf', 'Fitri'],
      services: ['Keamanan Informasi & Persandian', 'Keamanan Aplikasi / VAPT', 'CSIRT / Respons Insiden']
    },
    {
      id: 4,
      name: 'Tim Tata Kelola SPBE',
      leader: 'Suryana',
      members: ['Hendra', 'Dewi'],
      services: ['Tata Kelola SPBE', 'Audit Teknologi Informasi']
    },
    {
      id: 5,
      name: 'Tim Satu Data & Statistik',
      leader: 'Dian Pratama',
      members: ['Aditya', 'Maya'],
      services: ['Satu Data Daerah', 'Statistik Sektoral']
    },
    {
      id: 6,
      name: 'Tim Hubungan Masyarakat & IKP',
      leader: 'Rina Lestari',
      members: ['Fajar', 'Nisa'],
      services: ['Informasi & Komunikasi Publik', 'Video Conference / Zoom']
    },
    {
      id: 7,
      name: 'Tim Layanan Pengadaan Secara Elektronik (LPSE)',
      leader: 'Budi Santoso',
      members: ['Agus', 'Elisa'],
      services: ['Sistem Informasi LPSE', 'Fasilitasi E-Katalog']
    },
    {
      id: 8,
      name: 'Tim Support & Helpdesk Utama',
      leader: 'Siti Rahmawati',
      members: ['Lina', 'Boni'],
      services: ['Pelayanan Umum TIK', 'Pengaduan SP4N Lapor']
    }
  ];

  const defaultUsersList = [
    { id: 1, name: 'Dr. Budi Utomo', email: 'budi.utomo@bogor.go.id', role: 'user', department: 'Dinas Kesehatan Kota Bogor' },
    { id: 2, name: 'Ahmad Faisal', email: 'faisal.admin@bogor.go.id', role: 'admin', department: 'Diskominfo Kota Bogor (Administrator)' },
    { id: 3, name: 'Siti Rahmawati', email: 'siti.helpdesk@bogor.go.id', role: 'helpdesk', department: 'Diskominfo Kota Bogor (Helpdesk Hub)' },
    { id: 4, name: 'Rian Hidayat', email: 'rian.programmer@bogor.go.id', role: 'pegawai', department: 'Diskominfo Kota Bogor (Tim Aplikasi - Programmer)' },
    { id: 5, name: 'Rudi Gunawan', email: 'rudi.jaringan@bogor.go.id', role: 'pegawai', department: 'Diskominfo Kota Bogor (Tim Jaringan - Network Engineer)' },
    { id: 6, name: 'Deni Setiawan', email: 'deni.jaringan@bogor.go.id', role: 'pegawai', department: 'Diskominfo Kota Bogor (Tim Infrastruktur & Jaringan TIK)' }
  ];

  const [tickets, setTickets] = useState(defaultTicketsList);
  const [ratings, setRatings] = useState(generateRatings());
  const [teams, setTeams] = useState(defaultTeamsList);
  const [users, setUsers] = useState(defaultUsersList);

  const toggleRatingForLanding = (id) => {
    setRatings(prev => {
      const target = prev.find(r => r.id === id);
      if (!target) return prev;
      
      const currentlySelectedCount = prev.filter(r => r.selectedForLanding).length;
      
      if (!target.selectedForLanding) {
        if (currentlySelectedCount >= 10) {
          alert('Maksimal 10 ulasan yang dapat ditampilkan pada Landing Page. Harap nonaktifkan ulasan lain terlebih dahulu.');
          return prev;
        }
        return prev.map(r => r.id === id ? { ...r, selectedForLanding: true } : r);
      } else {
        return prev.map(r => r.id === id ? { ...r, selectedForLanding: false } : r);
      }
    });
  };

  const login = (selectedRole) => {
    const roleMockData = {
      admin: {
        name: 'Ahmad Faisal',
        email: 'faisal.admin@bogor.go.id',
        role: 'admin',
        department: 'Diskominfo Kota Bogor (Administrator)',
      },
      helpdesk: {
        name: 'Siti Rahmawati',
        email: 'siti.helpdesk@bogor.go.id',
        role: 'helpdesk',
        department: 'Diskominfo Kota Bogor (Helpdesk Hub)',
      },
      pegawai: {
        name: 'Rudi Gunawan',
        email: 'rudi.jaringan@bogor.go.id',
        role: 'pegawai',
        department: 'Diskominfo Kota Bogor (Tim Jaringan - Network Engineer)',
      },
      user: {
        name: 'Dr. Budi Utomo',
        email: 'budi.utomo@bogor.go.id',
        role: 'user',
        department: 'Dinas Kesehatan Kota Bogor',
      },
    };

    setUser(roleMockData[selectedRole] || roleMockData.user);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, ratings, setRatings, toggleRatingForLanding, tickets, setTickets, teams, setTeams, users, setUsers }}>
      {children}
    </AuthContext.Provider>
  );
};
