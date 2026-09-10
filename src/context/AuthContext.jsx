import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('spbe_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.department && parsed.department.includes('(')) {
          if (parsed.department.toLowerCase().includes('diskominfo')) {
            parsed.department = 'Dinas Komunikasi dan Informatika Kota Bogor';
          } else {
            parsed.department = parsed.department.replace(/\s*\(.*?\)\s*/g, '').trim();
          }
        }
        if (parsed && (parsed.role === 'masyarakat' || parsed.roles?.includes('masyarakat') || parsed.department === 'Masyarakat Kota Bogor')) {
          parsed.department = 'Masyarakat Umum';
        }
        if (parsed && parsed.email) {
          if (parsed.email === 'admin@bogor.go.id' || parsed.name === 'Ahmad Faisal') {
            parsed.email = 'ahmad.faisal@kotabogor.go.id';
          } else if (parsed.email === 'helpdesk@bogor.go.id' || parsed.name === 'Siti Rahmawati') {
            parsed.email = 'siti.rahmawati@kotabogor.go.id';
          } else if (parsed.email.includes('rian') && !parsed.email.includes('@kotabogor.go.id')) {
            parsed.email = 'rian.hidayat@kotabogor.go.id';
          } else if (parsed.email === 'budi.utomo@bogor.go.id') {
            parsed.email = 'budi.utomo@kotabogor.go.id';
          }
        }
        return parsed;
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('spbe_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('spbe_user');
    }
  }, [user]);

  const defaultTicketsList = [
    {
      id: 'REQ-2026-0001',
      opd: 'Dinas Kesehatan Kota Bogor',
      service: 'Pengelolaan Aplikasi Informatika',
      requestType: 'Pembuatan Aplikasi Baru (Web/Mobile)',
      title: 'Pembuatan Aplikasi Si-Walan',
      desc: 'Pengembangan sistem pendaftaran pasien online terintegrasi Kota Bogor.',
      date: '20 Agustus 2026',
      progress: 100,
      slaDuration: 7,
      slaRemainingDays: 3,
      status: 'Selesai',
      files: ['TOR_Si_Walan.pdf'],
      bastFile: 'BAST_Si_Walan_Selesai.pdf',
      logs: [
        { date: '21 Agt 16:30', text: 'Menunggu konfirmasi penyelesaian dan pengisian Survei SKM oleh Pemohon.' },
        { date: '21 Agt 16:00', text: 'Pekerjaan teknis selesai dikerjakan 100% oleh Pegawai dan berkas BAST telah diunggah.' },
        { date: '20 Agt 14:00', text: 'Pekerjaan teknis mulai diproses dan dikerjakan oleh Pegawai Tim Pelaksana.' },
        { date: '20 Agt 11:00', text: 'Tiket permohonan telah diverifikasi oleh Helpdesk dan diteruskan ke Tim Teknis.' },
        { date: '20 Agt 09:00', text: 'Tiket permohonan layanan berhasil dibuat dan diajukan oleh Pemohon.' }
      ]
    },
    {
      id: 'REQ-2026-0002',
      opd: 'Dinas Kesehatan Kota Bogor',
      service: 'Pengelolaan Aplikasi Informatika',
      requestType: 'Integrasi Single Sign-On (SSO) TND',
      title: 'Integrasi SSO TND Portal Dinkes',
      desc: 'Integrasi sistem login pegawai dinas kesehatan dengan SSO TND Pemerintah Kota Bogor.',
      date: '22 Agustus 2026',
      progress: 50,
      slaDuration: 7,
      slaRemainingDays: 5,
      status: 'Diproses',
      team: 'Tim Aplikasi & Sistem Informasi',
      files: ['Kebutuhan_SSO.pdf'],
      logs: [
        { date: '23 Agt 14:00', text: 'Pekerjaan teknis mulai diproses dan dikerjakan oleh Pegawai Tim Pelaksana.' },
        { date: '22 Agt 15:00', text: 'Tiket permohonan telah diverifikasi oleh Helpdesk dan diteruskan ke Tim Teknis.' },
        { date: '22 Agt 10:00', text: 'Tiket permohonan layanan berhasil dibuat dan diajukan oleh Pemohon.' }
      ]
    },
    {
      id: 'REQ-2026-0003',
      opd: 'Masyarakat Umum',
      service: 'Pengelolaan Aplikasi Informatika',
      requestType: 'Perbaikan Bug / Error Sistem',
      title: 'Pengaduan Bug Aplikasi Bogor Single Window',
      desc: 'Aplikasi crash saat membuka halaman info tarif angkutan daerah.',
      date: '21 Agustus 2026',
      progress: 100,
      slaDuration: 3,
      slaRemainingDays: 1,
      status: 'Selesai',
      files: [],
      bastFile: 'BAST_Bogor_Single_Window.pdf',
      rating: {
        speed: 5,
        result: 5,
        communication: 5,
        quality: 5,
        comment: 'Bug aplikasi segera tertangani dengan sangat cepat dan tanggap.',
        skm: { q1: 'Sangat Baik', q2: 'Sangat Baik', q3: 'Sangat Baik' }
      },
      selectedForLanding: true,
      logs: [
        { date: '22 Agt 11:30', text: 'Pemohon telah mengonfirmasi penyelesaian, mengisi Survei SKM, dan memberikan ulasan bintang.' },
        { date: '22 Agt 10:00', text: 'Pekerjaan teknis selesai dikerjakan 100% oleh Pegawai dan berkas BAST telah diunggah.' },
        { date: '21 Agt 16:00', text: 'Pekerjaan teknis mulai diproses dan dikerjakan oleh Pegawai Tim Pelaksana.' },
        { date: '21 Agt 14:00', text: 'Tiket permohonan telah diverifikasi oleh Helpdesk dan diteruskan ke Tim Teknis.' },
        { date: '21 Agt 09:00', text: 'Tiket permohonan layanan berhasil dibuat dan diajukan oleh Pemohon.' }
      ]
    },
    {
      id: 'REQ-2026-0004',
      opd: 'Dinas Kesehatan Kota Bogor',
      service: 'Pengelolaan Aplikasi Informatika',
      requestType: 'Uji Celah Keamanan (Vulnerability Assessment)',
      title: 'VAPT Aplikasi SIMPATIK',
      desc: 'Pengujian celah keamanan aplikasi SIMPATIK sebagai berkas pendukung rilis sistem.',
      date: '24 Agustus 2026',
      progress: 0,
      slaDuration: 7,
      slaRemainingDays: null,
      status: 'Verifikasi',
      files: ['Permohonan_VAPT.pdf'],
      logs: [
        { date: '24 Agt 09:00', text: 'Tiket permohonan layanan berhasil dibuat dan diajukan oleh Pemohon (Menunggu verifikasi Helpdesk).' }
      ]
    },
    {
      id: 'REQ-2026-0005',
      opd: 'Dinas Kesehatan Kota Bogor',
      service: 'Pengelolaan Aplikasi Informatika',
      requestType: 'Permohonan Rekomendasi Aplikasi Baru',
      title: 'Rekomendasi Aplikasi SIM-Puskesmas',
      desc: 'Setup rekomendasi teknis pengadaan software Puskesmas.',
      date: '18 Agustus 2026',
      progress: 0,
      slaDuration: 5,
      slaRemainingDays: null,
      status: 'Pending',
      files: [],
      logs: [
        { date: '19 Agt 10:00', text: 'Permohonan diverifikasi & ditangguhkan oleh Helpdesk. Alasan: Berkas dokumen TOR spesifikasi VM belum diunggah.' },
        { date: '18 Agt 09:00', text: 'Tiket permohonan layanan berhasil dibuat dan diajukan oleh Pemohon.' }
      ]
    },
    {
      id: 'REQ-2026-0006',
      opd: 'Masyarakat Umum',
      service: 'Pengelolaan Aplikasi Informatika',
      requestType: 'Perbaikan Bug / Error Sistem',
      title: 'Pengaduan Fitur Search E-Katalog',
      desc: 'Tombol cari produk tidak merespon di browser Safari.',
      date: '23 Agustus 2026',
      progress: 30,
      slaDuration: 3,
      slaRemainingDays: 2,
      status: 'Diproses',
      team: 'Tim Aplikasi & Sistem Informasi',
      files: [],
      logs: [
        { date: '24 Agt 08:00', text: 'Pekerjaan teknis mulai diproses dan dikerjakan oleh Pegawai Tim Pelaksana.' },
        { date: '23 Agt 11:00', text: 'Tiket permohonan telah diverifikasi oleh Helpdesk dan diteruskan ke Tim Teknis.' },
        { date: '23 Agt 09:00', text: 'Tiket permohonan layanan berhasil dibuat dan diajukan oleh Pemohon.' }
      ]
    },
    {
      id: 'REQ-2026-0007',
      opd: 'Dinas Kesehatan Kota Bogor',
      service: 'Pengelolaan Aplikasi Informatika',
      requestType: 'Penambahan Fitur Aplikasi Dinas',
      title: 'Modul Ekspor Laporan Vaksinasi',
      desc: 'Penambahan format ekspor laporan ke format CSV.',
      date: '23 Agustus 2026',
      progress: 80,
      slaDuration: 7,
      slaRemainingDays: 5,
      status: 'Pending',
      files: [],
      bastFile: 'BAST_Modul_Ekspor_Vaksinasi.pdf',
      logs: [
        { date: '24 Agt 11:30', text: 'Pemohon menyanggah hasil pekerjaan layanan. Alasan: Format file CSV hasil ekspor kolom tanggal masih error dan data belum lengkap.' },
        { date: '24 Agt 10:00', text: 'Pekerjaan teknis selesai dikerjakan 100% oleh Pegawai dan berkas BAST telah diunggah.' },
        { date: '23 Agt 14:00', text: 'Pekerjaan teknis mulai diproses dan dikerjakan oleh Pegawai Tim Pelaksana.' },
        { date: '23 Agt 10:00', text: 'Tiket permohonan telah diverifikasi oleh Helpdesk dan diteruskan ke Tim Teknis.' },
        { date: '23 Agt 08:30', text: 'Tiket permohonan layanan berhasil dibuat dan diajukan oleh Pemohon.' }
      ]
    },
    {
      id: 'REQ-2026-0008',
      opd: 'Masyarakat Umum',
      service: 'Pengelolaan Aplikasi Informatika',
      requestType: 'Perbaikan Bug / Error Sistem',
      title: 'Error Login Portal Disparbud',
      desc: 'Gagal verifikasi email saat melakukan registrasi.',
      date: '21 Agustus 2026',
      progress: 0,
      slaDuration: 5,
      slaRemainingDays: null,
      status: 'Pending',
      files: [],
      logs: [
        { date: '22 Agt 09:00', text: 'Permohonan diverifikasi & ditangguhkan oleh Helpdesk. Alasan: Akun email dan bukti tangkapan layar kendala tidak valid.' },
        { date: '21 Agt 08:30', text: 'Tiket permohonan layanan berhasil dibuat dan diajukan oleh Pemohon.' }
      ]
    },
    {
      id: 'REQ-2026-0009',
      opd: 'Dinas Kesehatan Kota Bogor',
      service: 'Pengelolaan Aplikasi Informatika',
      requestType: 'Audit Kode Sumber Aplikasi (Code Review)',
      title: 'Code Review Aplikasi E-Surat',
      desc: 'Pemeriksaan keamanan kode PHP.',
      date: '24 Agustus 2026',
      progress: 40,
      slaDuration: 7,
      slaRemainingDays: 6,
      status: 'Diproses',
      team: 'Tim Aplikasi & Sistem Informasi',
      files: [],
      logs: [
        { date: '24 Agt 11:00', text: 'Pekerjaan teknis mulai diproses dan dikerjakan oleh Pegawai Tim Pelaksana.' },
        { date: '24 Agt 09:30', text: 'Tiket permohonan telah diverifikasi oleh Helpdesk dan diteruskan ke Tim Teknis.' },
        { date: '24 Agt 08:00', text: 'Tiket permohonan layanan berhasil dibuat dan diajukan oleh Pemohon.' }
      ]
    },
    {
      id: 'REQ-2026-0010',
      opd: 'Masyarakat Umum',
      service: 'Pengelolaan Aplikasi Informatika',
      requestType: 'Perbaikan Bug / Error Sistem',
      title: 'Bug Peta Wisata Bogor',
      desc: 'Peta tidak muncul di halaman utama portal wisata.',
      date: '24 Agustus 2026',
      progress: 0,
      slaDuration: 3,
      slaRemainingDays: null,
      status: 'Verifikasi',
      files: [],
      logs: [
        { date: '24 Agt 09:00', text: 'Tiket permohonan layanan berhasil dibuat dan diajukan oleh Pemohon (Menunggu verifikasi Helpdesk).' }
      ]
    },
    {
      id: 'REQ-2026-0011',
      opd: 'Dinas Kesehatan Kota Bogor',
      service: 'Pengelolaan Aplikasi Informatika',
      requestType: 'Pembuatan Aplikasi Baru (Web/Mobile)',
      title: 'Sistem Antrean Dinkes Online',
      desc: 'Aplikasi pendaftaran pasien puskesmas Kota Bogor.',
      date: '10 Agustus 2026',
      progress: 100,
      slaDuration: 7,
      slaRemainingDays: 4,
      status: 'Selesai',
      files: ['Rekomendasi_Antrean.pdf'],
      bastFile: 'BAST_Antrean_Dinkes_Online.pdf',
      rating: {
        speed: 5,
        result: 5,
        communication: 5,
        quality: 5,
        comment: 'Pengerjaan cepat sekali!',
        skm: { q1: 'Sangat Baik', q2: 'Sangat Baik', q3: 'Sangat Baik' }
      },
      selectedForLanding: true,
      logs: [
        { date: '12 Agt 10:30', text: 'Pemohon telah mengonfirmasi penyelesaian, mengisi Survei SKM, dan memberikan ulasan bintang.' },
        { date: '12 Agt 09:00', text: 'Pekerjaan teknis selesai dikerjakan 100% oleh Pegawai dan berkas BAST telah diunggah.' },
        { date: '10 Agt 14:00', text: 'Pekerjaan teknis mulai diproses dan dikerjakan oleh Pegawai Tim Pelaksana.' },
        { date: '10 Agt 11:00', text: 'Tiket permohonan telah diverifikasi oleh Helpdesk dan diteruskan ke Tim Teknis.' },
        { date: '10 Agt 09:00', text: 'Tiket permohonan layanan berhasil dibuat dan diajukan oleh Pemohon.' }
      ]
    },
    {
      id: 'REQ-2026-0012',
      opd: 'Masyarakat Umum',
      service: 'Pengelolaan Aplikasi Informatika',
      requestType: 'Perbaikan Bug / Error Sistem',
      title: 'Perbaikan Bug Formulir Lapor',
      desc: 'Gagal submit form laporan di mobile.',
      date: '12 Agustus 2026',
      progress: 100,
      slaDuration: 3,
      slaRemainingDays: 2,
      status: 'Selesai',
      files: [],
      bastFile: 'BAST_Formulir_Lapor.pdf',
      rating: {
        speed: 5,
        result: 4,
        communication: 5,
        quality: 4,
        comment: 'Sangat responsif.',
        skm: { q1: 'Sangat Baik', q2: 'Baik', q3: 'Baik' }
      },
      selectedForLanding: true,
      logs: [
        { date: '14 Agt 09:30', text: 'Pemohon telah mengonfirmasi penyelesaian, mengisi Survei SKM, dan memberikan ulasan bintang.' },
        { date: '13 Agt 16:00', text: 'Pekerjaan teknis selesai dikerjakan 100% oleh Pegawai dan berkas BAST telah diunggah.' },
        { date: '12 Agt 14:00', text: 'Pekerjaan teknis mulai diproses dan dikerjakan oleh Pegawai Tim Pelaksana.' },
        { date: '12 Agt 11:00', text: 'Tiket permohonan telah diverifikasi oleh Helpdesk dan diteruskan ke Tim Teknis.' },
        { date: '12 Agt 09:00', text: 'Tiket permohonan layanan berhasil dibuat dan diajukan oleh Pemohon.' }
      ]
    },
    {
      id: 'REQ-2026-0013',
      opd: 'Dinas Kesehatan Kota Bogor',
      service: 'Pengelolaan Aplikasi Informatika',
      requestType: 'Penambahan Fitur Aplikasi Dinas',
      title: 'Ekspor Excel Data Imunisasi',
      desc: 'Fitur unduh data format xlsx.',
      date: '14 Agustus 2026',
      progress: 100,
      slaDuration: 7,
      slaRemainingDays: 3,
      status: 'Selesai',
      files: [],
      bastFile: 'BAST_Ekspor_Excel_Imunisasi.pdf',
      rating: {
        speed: 4,
        result: 5,
        communication: 4,
        quality: 5,
        comment: 'Fitur bekerja dengan baik.',
        skm: { q1: 'Baik', q2: 'Sangat Baik', q3: 'Baik' }
      },
      selectedForLanding: true,
      logs: [
        { date: '16 Agt 10:30', text: 'Pemohon telah mengonfirmasi penyelesaian, mengisi Survei SKM, dan memberikan ulasan bintang.' },
        { date: '15 Agt 16:00', text: 'Pekerjaan teknis selesai dikerjakan 100% oleh Pegawai dan berkas BAST telah diunggah.' },
        { date: '14 Agt 14:00', text: 'Pekerjaan teknis mulai diproses dan dikerjakan oleh Pegawai Tim Pelaksana.' },
        { date: '14 Agt 11:00', text: 'Tiket permohonan telah diverifikasi oleh Helpdesk dan diteruskan ke Tim Teknis.' },
        { date: '14 Agt 09:00', text: 'Tiket permohonan layanan berhasil dibuat dan diajukan oleh Pemohon.' }
      ]
    },
    {
      id: 'REQ-2026-0014',
      opd: 'Masyarakat Umum',
      service: 'Pengelolaan Aplikasi Informatika',
      requestType: 'Perbaikan Bug / Error Sistem',
      title: 'Bug Galeri Foto Wisata',
      desc: 'Gambar galeri tidak tampil pada portal wisata daerah.',
      date: '15 Agustus 2026',
      progress: 100,
      slaDuration: 3,
      slaRemainingDays: 1,
      status: 'Selesai',
      files: [],
      bastFile: 'BAST_Galeri_Foto_Wisata.pdf',
      rating: {
        speed: 4,
        result: 4,
        communication: 5,
        quality: 4,
        comment: 'Terima kasih, sudah diperbaiki.',
        skm: { q1: 'Baik', q2: 'Baik', q3: 'Sangat Baik' }
      },
      selectedForLanding: true,
      logs: [
        { date: '16 Agt 09:30', text: 'Pemohon telah mengonfirmasi penyelesaian, mengisi Survei SKM, dan memberikan ulasan bintang.' },
        { date: '15 Agt 16:00', text: 'Pekerjaan teknis selesai dikerjakan 100% oleh Pegawai dan berkas BAST telah diunggah.' },
        { date: '15 Agt 13:00', text: 'Pekerjaan teknis mulai diproses dan dikerjakan oleh Pegawai Tim Pelaksana.' },
        { date: '15 Agt 11:00', text: 'Tiket permohonan telah diverifikasi oleh Helpdesk dan diteruskan ke Tim Teknis.' },
        { date: '15 Agt 09:00', text: 'Tiket permohonan layanan berhasil dibuat dan diajukan oleh Pemohon.' }
      ]
    },
    {
      id: 'REQ-2026-0015',
      opd: 'Dinas Kesehatan Kota Bogor',
      service: 'Pengelolaan Aplikasi Informatika',
      requestType: 'Permohonan Rekomendasi Aplikasi Baru',
      title: 'Rekomendasi Aplikasi SIP-Dinas',
      desc: 'Surat rekomendasi teknis pengadaan software dinas kesehatan.',
      date: '08 Agustus 2026',
      progress: 100,
      slaDuration: 5,
      slaRemainingDays: 2,
      status: 'Selesai',
      files: ['Rekomendasi_SIP.pdf'],
      bastFile: 'BAST_Rekomendasi_SIP_Dinas.pdf',
      rating: {
        speed: 5,
        result: 5,
        communication: 5,
        quality: 5,
        comment: 'Layanan prima.',
        skm: { q1: 'Sangat Baik', q2: 'Sangat Baik', q3: 'Sangat Baik' }
      },
      selectedForLanding: true,
      logs: [
        { date: '10 Agt 10:30', text: 'Pemohon telah mengonfirmasi penyelesaian, mengisi Survei SKM, dan memberikan ulasan bintang.' },
        { date: '09 Agt 16:00', text: 'Pekerjaan teknis selesai dikerjakan 100% oleh Pegawai dan berkas BAST telah diunggah.' },
        { date: '08 Agt 14:00', text: 'Pekerjaan teknis mulai diproses dan dikerjakan oleh Pegawai Tim Pelaksana.' },
        { date: '08 Agt 11:00', text: 'Tiket permohonan telah diverifikasi oleh Helpdesk dan diteruskan ke Tim Teknis.' },
        { date: '08 Agt 09:00', text: 'Tiket permohonan layanan berhasil dibuat dan diajukan oleh Pemohon.' }
      ]
    },
    {
      id: 'REQ-2026-0016',
      opd: 'Masyarakat Umum',
      service: 'Pengelolaan Aplikasi Informatika',
      requestType: 'Perbaikan Bug / Error Sistem',
      title: 'Error Menu Pendaftaran Event',
      desc: 'Halaman pendaftaran menampilkan layar blank.',
      date: '16 Agustus 2026',
      progress: 100,
      slaDuration: 3,
      slaRemainingDays: 2,
      status: 'Selesai',
      files: [],
      bastFile: 'BAST_Pendaftaran_Event.pdf',
      rating: {
        speed: 5,
        result: 5,
        communication: 4,
        quality: 5,
        comment: 'Sangat cepat responnya.',
        skm: { q1: 'Sangat Baik', q2: 'Sangat Baik', q3: 'Baik' }
      },
      selectedForLanding: true,
      logs: [
        { date: '18 Agt 09:30', text: 'Pemohon telah mengonfirmasi penyelesaian, mengisi Survei SKM, dan memberikan ulasan bintang.' },
        { date: '17 Agt 16:00', text: 'Pekerjaan teknis selesai dikerjakan 100% oleh Pegawai dan berkas BAST telah diunggah.' },
        { date: '16 Agt 14:00', text: 'Pekerjaan teknis mulai diproses dan dikerjakan oleh Pegawai Tim Pelaksana.' },
        { date: '16 Agt 11:00', text: 'Tiket permohonan telah diverifikasi oleh Helpdesk dan diteruskan ke Tim Teknis.' },
        { date: '16 Agt 09:00', text: 'Tiket permohonan layanan berhasil dibuat dan diajukan oleh Pemohon.' }
      ]
    },
    {
      id: 'REQ-2026-0017',
      opd: 'Dinas Kesehatan Kota Bogor',
      service: 'Pengelolaan Aplikasi Informatika',
      requestType: 'Integrasi Single Sign-On (SSO) TND',
      title: 'SSO Portal Kesehatan Kota',
      desc: 'Integrasi login portal kesehatan dengan sistem TND.',
      date: '05 Agustus 2026',
      progress: 100,
      slaDuration: 7,
      slaRemainingDays: 4,
      status: 'Selesai',
      files: [],
      bastFile: 'BAST_SSO_Portal_Kesehatan.pdf',
      rating: {
        speed: 5,
        result: 5,
        communication: 5,
        quality: 5,
        comment: 'Sempurna.',
        skm: { q1: 'Sangat Baik', q2: 'Sangat Baik', q3: 'Sangat Baik' }
      },
      selectedForLanding: true,
      logs: [
        { date: '07 Agt 10:30', text: 'Pemohon telah mengonfirmasi penyelesaian, mengisi Survei SKM, dan memberikan ulasan bintang.' },
        { date: '06 Agt 16:00', text: 'Pekerjaan teknis selesai dikerjakan 100% oleh Pegawai dan berkas BAST telah diunggah.' },
        { date: '05 Agt 14:00', text: 'Pekerjaan teknis mulai diproses dan dikerjakan oleh Pegawai Tim Pelaksana.' },
        { date: '05 Agt 11:00', text: 'Tiket permohonan telah diverifikasi oleh Helpdesk dan diteruskan ke Tim Teknis.' },
        { date: '05 Agt 09:00', text: 'Tiket permohonan layanan berhasil dibuat dan diajukan oleh Pemohon.' }
      ]
    },
    {
      id: 'REQ-2026-0018',
      opd: 'Masyarakat Umum',
      service: 'Pengelolaan Aplikasi Informatika',
      requestType: 'Perbaikan Bug / Error Sistem',
      title: 'Bug Pencarian Berita',
      desc: 'Hasil pencarian berita tidak memunculkan data yang relevan.',
      date: '18 Agustus 2026',
      progress: 100,
      slaDuration: 3,
      slaRemainingDays: 2,
      status: 'Selesai',
      files: [],
      bastFile: 'BAST_Pencarian_Berita.pdf',
      rating: {
        speed: 4,
        result: 4,
        communication: 4,
        quality: 4,
        comment: 'Bagus.',
        skm: { q1: 'Baik', q2: 'Baik', q3: 'Baik' }
      },
      selectedForLanding: true,
      logs: [
        { date: '20 Agt 09:30', text: 'Pemohon telah mengonfirmasi penyelesaian, mengisi Survei SKM, dan memberikan ulasan bintang.' },
        { date: '19 Agt 16:00', text: 'Pekerjaan teknis selesai dikerjakan 100% oleh Pegawai dan berkas BAST telah diunggah.' },
        { date: '18 Agt 14:00', text: 'Pekerjaan teknis mulai diproses dan dikerjakan oleh Pegawai Tim Pelaksana.' },
        { date: '18 Agt 11:00', text: 'Tiket permohonan telah diverifikasi oleh Helpdesk dan diteruskan ke Tim Teknis.' },
        { date: '18 Agt 09:00', text: 'Tiket permohonan layanan berhasil dibuat dan diajukan oleh Pemohon.' }
      ]
    },
    {
      id: 'REQ-2026-0019',
      opd: 'Dinas Kesehatan Kota Bogor',
      service: 'Pengelolaan Aplikasi Informatika',
      requestType: 'Audit Kode Sumber Aplikasi (Code Review)',
      title: 'Code Review SIM Puskesmas',
      desc: 'Audit keamanan kode sumber web SIM Puskesmas.',
      date: '02 Agustus 2026',
      progress: 100,
      slaDuration: 7,
      slaRemainingDays: 5,
      status: 'Selesai',
      files: [],
      bastFile: 'BAST_Code_Review_SIM_Puskesmas.pdf',
      rating: {
        speed: 5,
        result: 5,
        communication: 5,
        quality: 5,
        comment: 'Sangat membantu kelayakan sistem.',
        skm: { q1: 'Sangat Baik', q2: 'Sangat Baik', q3: 'Sangat Baik' }
      },
      selectedForLanding: true,
      logs: [
        { date: '04 Agt 10:30', text: 'Pemohon telah mengonfirmasi penyelesaian, mengisi Survei SKM, dan memberikan ulasan bintang.' },
        { date: '03 Agt 16:00', text: 'Pekerjaan teknis selesai dikerjakan 100% oleh Pegawai dan berkas BAST telah diunggah.' },
        { date: '02 Agt 14:00', text: 'Pekerjaan teknis mulai diproses dan dikerjakan oleh Pegawai Tim Pelaksana.' },
        { date: '02 Agt 11:00', text: 'Tiket permohonan telah diverifikasi oleh Helpdesk dan diteruskan ke Tim Teknis.' },
        { date: '02 Agt 09:00', text: 'Tiket permohonan layanan berhasil dibuat dan diajukan oleh Pemohon.' }
      ]
    },
    {
      id: 'REQ-2026-0020',
      opd: 'Masyarakat Umum',
      service: 'Pengelolaan Aplikasi Informatika',
      requestType: 'Perbaikan Bug / Error Sistem',
      title: 'Error Formulir Kritik Saran',
      desc: 'Formulir kritik saran tidak dapat di-submit di mobile browser.',
      date: '19 Agustus 2026',
      progress: 100,
      slaDuration: 3,
      slaRemainingDays: 3,
      status: 'Menunggu Konfirmasi User',
      files: [],
      bastFile: 'BAST_Formulir_Kritik_Saran.pdf',
      logs: [
        { date: '19 Agt 17:00', text: 'Pekerjaan teknis selesai dikerjakan 100% oleh Pegawai dan berkas BAST telah diunggah.' },
        { date: '19 Agt 14:00', text: 'Pekerjaan teknis mulai diproses dan dikerjakan oleh Pegawai Tim Pelaksana.' },
        { date: '19 Agt 11:00', text: 'Tiket permohonan telah diverifikasi oleh Helpdesk dan diteruskan ke Tim Teknis.' },
        { date: '19 Agt 09:00', text: 'Tiket permohonan layanan berhasil dibuat dan diajukan oleh Pemohon.' }
      ]
    }
  ];

  const defaultTeamsList = [
    {
      id: 1,
      name: 'Tim Aplikasi & Sistem Informasi',
      leader: 'Rian Hidayat',
      members: ['Rian Hidayat'],
      services: ['Pengelolaan Aplikasi Informatika']
    }
  ];

  const defaultUsersList = [
    { id: 1, name: 'Ahmad Faisal', email: 'ahmad.faisal@kotabogor.go.id', role: 'admin', roles: ['admin', 'user'], department: 'Dinas Komunikasi dan Informatika Kota Bogor' },
    { id: 2, name: 'Siti Rahmawati', email: 'siti.rahmawati@kotabogor.go.id', role: 'helpdesk', roles: ['helpdesk', 'user'], department: 'Dinas Komunikasi dan Informatika Kota Bogor' },
    { id: 3, name: 'Rian Hidayat', email: 'rian.hidayat@kotabogor.go.id', role: 'pegawai', roles: ['pegawai', 'user'], department: 'Dinas Komunikasi dan Informatika Kota Bogor' },
    { id: 4, name: 'Dr. Budi Utomo', email: 'budi.utomo@kotabogor.go.id', role: 'user', roles: ['user'], department: 'Dinas Kesehatan Kota Bogor' },
    { id: 5, name: 'Azka Mortaza', email: 'mortazaaazkaa2509@gmail.com', role: 'masyarakat', roles: ['masyarakat'], department: 'Masyarakat Umum' }
  ];

  const defaultServicesList = [
    { id: 1, name: 'Pembuatan Aplikasi Baru (Web/Mobile)', category: 'Pengelolaan Aplikasi Informatika', sla: '30-90 Hari', fieldCount: 4, sop: 'sop-pembuatan-aplikasi.pdf', requiredDocs: 'Surat Permohonan Resmi OPD, Dokumen Kerangka Acuan Kerja (KAK/TOR), Dokumen Proses Bisnis', template: 'aplikasi', status: 'Aktif', requiresHelpdesk: true },
    { id: 2, name: 'Penambahan Fitur Aplikasi Dinas', category: 'Pengelolaan Aplikasi Informatika', sla: '14-30 Hari', fieldCount: 4, sop: 'sop-penambahan-fitur.pdf', requiredDocs: 'Surat Permohonan Resmi OPD, Formulir Perubahan Kebutuhan Sistem (Change Request)', template: 'aplikasi', status: 'Aktif', requiresHelpdesk: true },
    { id: 3, name: 'Perbaikan Bug / Error Sistem', category: 'Pengelolaan Aplikasi Informatika', sla: '1-3 Hari', fieldCount: 4, sop: 'sop-perbaikan-bug.pdf', requiredDocs: 'Tangkapan Layar (Screenshot) Error, URL Layanan & Kronologi Kendala', template: 'aplikasi', status: 'Aktif', requiresHelpdesk: false },
    { id: 4, name: 'Integrasi Single Sign-On (SSO) TND', category: 'Pengelolaan Aplikasi Informatika', sla: '5-7 Hari', fieldCount: 4, sop: 'sop-integrasi-sso.pdf', requiredDocs: 'Surat Permohonan Integrasi SSO, Dokumen Teknis Endpoint Aplikasi & Kontak Programmer', template: 'aplikasi', status: 'Aktif', requiresHelpdesk: false },
    { id: 5, name: 'Pengajuan Integrasi API SPLP', category: 'Pengelolaan Aplikasi Informatika', sla: '7-14 Hari', fieldCount: 4, sop: 'sop-integrasi-splp.pdf', requiredDocs: 'Surat Permohonan Integrasi API, Kamus Data & Spesifikasi Parameter Web Service', template: 'aplikasi', status: 'Aktif', requiresHelpdesk: true },
    { id: 6, name: 'Pemeliharaan Server Aplikasi Dinas', category: 'Pengelolaan Aplikasi Informatika', sla: '3-5 Hari', fieldCount: 6, sop: 'sop-pemeliharaan-server.pdf', requiredDocs: 'Surat Permohonan Maintenance Server, Catatan Log Kendala & Kontak Admin Server OPD', template: 'server', status: 'Aktif', requiresHelpdesk: true },
    { id: 7, name: 'Migrasi Server / Database Aplikasi', category: 'Pengelolaan Aplikasi Informatika', sla: '7-10 Hari', fieldCount: 6, sop: 'sop-migrasi-database.pdf', requiredDocs: 'Surat Permohonan Migrasi, Berkas Backup Database Terakhir & Skema Arsitektur Baru', template: 'server', status: 'Aktif', requiresHelpdesk: true },
    { id: 8, name: 'Pemasangan SSL (HTTPS) Domain Dinas', category: 'Pengelolaan Aplikasi Informatika', sla: '1-2 Hari', fieldCount: 3, sop: 'sop-pemasangan-ssl.pdf', requiredDocs: 'Surat Permohonan Sertifikat SSL, Daftar Subdomain Resmi (.bogor.go.id)', template: 'standar', status: 'Aktif', requiresHelpdesk: false },
    { id: 9, name: 'Permohonan Rekomendasi Aplikasi Baru', category: 'Pengelolaan Aplikasi Informatika', sla: '7-14 Hari', fieldCount: 3, sop: 'sop-rekomendasi-aplikasi.pdf', requiredDocs: 'Surat Permohonan Rekomendasi SPBE, Proposal Teknis Rencana Pengadaan Aplikasi & RAB', template: 'standar', status: 'Aktif', requiresHelpdesk: true },
    { id: 10, name: 'Evaluasi Kelayakan Sistem Aplikasi', category: 'Pengelolaan Aplikasi Informatika', sla: '7-14 Hari', fieldCount: 3, sop: 'sop-evaluasi-kelayakan.pdf', requiredDocs: 'Surat Permohonan Evaluasi, Dokumen Spesifikasi Teknis & Hasil Pengujian Mandiri', template: 'standar', status: 'Aktif', requiresHelpdesk: true },
    { id: 11, name: 'Uji Kesesuaian Sistem (UKS) Tahap Awal', category: 'Pengelolaan Aplikasi Informatika', sla: '14 Hari', fieldCount: 3, sop: 'sop-uks-awal.pdf', requiredDocs: 'Surat Permohonan UKS Awal, Buku Manual Aplikasi (User Manual) & Akses Lingkungan Uji', template: 'standar', status: 'Aktif', requiresHelpdesk: true },
    { id: 12, name: 'Uji Kesesuaian Sistem (UKS) Pasca Uji Coba', category: 'Pengelolaan Aplikasi Informatika', sla: '14 Hari', fieldCount: 3, sop: 'sop-uks-pasca.pdf', requiredDocs: 'Surat Permohonan UKS Pasca Uji Coba, Berita Acara Penerimaan Pengguna (UAT Sign-off)', template: 'standar', status: 'Aktif', requiresHelpdesk: true },
    { id: 13, name: 'Uji Celah Keamanan (Vulnerability Assessment)', category: 'Pengelolaan Aplikasi Informatika', sla: '7-10 Hari', fieldCount: 4, sop: 'sop-uji-vapt.pdf', requiredDocs: 'Surat Permohonan Asesmen VAPT, Surat Pernyataan Kepemilikan Sistem, Kontak Teknis Pengelola', template: 'keamanan', status: 'Aktif', requiresHelpdesk: true },
    { id: 14, name: 'Simulasi Serangan Siber (Penetration Testing)', category: 'Pengelolaan Aplikasi Informatika', sla: '10-14 Hari', fieldCount: 4, sop: 'sop-pen-test.pdf', requiredDocs: 'Surat Permohonan Pentest Resmi OPD, Surat Izin Uji Penetrasi Sistem, Kontak Tim CSIRT', template: 'keamanan', status: 'Aktif', requiresHelpdesk: true },
    { id: 15, name: 'Audit Kode Sumber Aplikasi (Code Review)', category: 'Pengelolaan Aplikasi Informatika', sla: '7-10 Hari', fieldCount: 3, sop: 'sop-code-review.pdf', requiredDocs: 'Surat Permohonan Audit Kode Sumber, Repositori Git / Berkas Source Code Terenkripsi', template: 'standar', status: 'Aktif', requiresHelpdesk: true },
    { id: 16, name: 'Pendampingan Teknis Penggunaan Aplikasi', category: 'Pengelolaan Aplikasi Informatika', sla: '3-5 Hari', fieldCount: 3, sop: 'sop-pendampingan-teknis.pdf', requiredDocs: 'Surat Permohonan Pendampingan Teknis, Jadwal Pelaksanaan & Daftar Peserta Bimtek', template: 'standar', status: 'Aktif', requiresHelpdesk: false },
    { id: 17, name: 'Pembuatan Akun Portal Layanan Digital', category: 'Pengelolaan Aplikasi Informatika', sla: '1-2 Hari', fieldCount: 3, sop: 'sop-akun-portal.pdf', requiredDocs: 'Surat Tugas / SK Penunjukan Admin OPD, KTP & Alamat E-mail Dinas Resmi', template: 'standar', status: 'Aktif', requiresHelpdesk: false },
    { id: 18, name: 'Penyusunan Arsitektur SPBE Dinas', category: 'Pengelolaan Aplikasi Informatika', sla: '14-30 Hari', fieldCount: 3, sop: 'sop-arsitektur-spbe.pdf', requiredDocs: 'Surat Permohonan Asistensi SPBE, Dokumen Rencana Strategis (Renstra) & SOP Instansi', template: 'standar', status: 'Aktif', requiresHelpdesk: true },
    { id: 19, name: 'Sosialisasi Pengisian Metadata Statistik', category: 'Pengelolaan Aplikasi Informatika', sla: '5-7 Hari', fieldCount: 3, sop: 'sop-metadata-statistik.pdf', requiredDocs: 'Surat Permohonan Sosialisasi Statistik, Daftar Variabel Indikator Kinerja Sektoral', template: 'standar', status: 'Aktif', requiresHelpdesk: false },
    { id: 20, name: 'Pengajuan Domain Instansi Baru', category: 'Pengelolaan Aplikasi Informatika', sla: '2-3 Hari', fieldCount: 3, sop: 'sop-pengajuan-domain.pdf', requiredDocs: 'Surat Permohonan Domain Resmi (.bogor.go.id), SK Penunjukan Pejabat Pengelola Domain', template: 'standar', status: 'Aktif', requiresHelpdesk: true },
    { id: 21, name: 'Peminjaman Lisensi Webinar Zoom Dinas', category: 'Pengelolaan Aplikasi Informatika', sla: '1 Hari', fieldCount: 5, sop: 'sop-lisensi-zoom.pdf', requiredDocs: 'Surat Permohonan Peminjaman Akun Zoom, Susunan Acara (Rundown) & Jumlah Partisipan', template: 'zoom', status: 'Aktif', requiresHelpdesk: false },
    { id: 22, name: 'Setup Virtual Machine Server (Hosting)', category: 'Pengelolaan Aplikasi Informatika', sla: '3-5 Hari', fieldCount: 6, sop: 'sop-setup-vm.pdf', requiredDocs: 'Surat Permohonan Hosting VM, Formulir Spesifikasi Kebutuhan Server (CPU/RAM/Storage/OS)', template: 'server', status: 'Aktif', requiresHelpdesk: true },
    { id: 23, name: 'Penyelidikan Insiden Kebocoran Data (CSIRT)', category: 'Pengelolaan Aplikasi Informatika', sla: '1-3 Hari', fieldCount: 4, sop: 'sop-csirt-insiden.pdf', requiredDocs: 'Laporan Awal Insiden Keamanan Siber, Tangkapan Layar Anomali & Log Jejak Akses', template: 'keamanan', status: 'Aktif', requiresHelpdesk: true },
    { id: 24, name: 'Pelatihan Keamanan Informasi Staf (Security Awareness)', category: 'Pengelolaan Aplikasi Informatika', sla: '7 Hari', fieldCount: 3, sop: 'sop-security-awareness.pdf', requiredDocs: 'Surat Permohonan Edukasi Keamanan Informasi, Daftar Nama Staf Peserta Pelatihan', template: 'standar', status: 'Aktif', requiresHelpdesk: false },
    { id: 25, name: 'Upgrade Bandwidth Internet Gedung Dinas', category: 'Pengelolaan Aplikasi Informatika', sla: '3-5 Hari', fieldCount: 4, sop: 'sop-upgrade-bandwidth.pdf', requiredDocs: 'Surat Permohonan Upgrade Bandwidth, Laporan Analisis Utilisasi Trafik Jaringan Eksisting', template: 'jaringan', status: 'Aktif', requiresHelpdesk: true },
    { id: 26, name: 'Pemasangan Switch Hub Tambahan TIK', category: 'Pengelolaan Aplikasi Informatika', sla: '2-4 Hari', fieldCount: 4, sop: 'sop-pasang-switch.pdf', requiredDocs: 'Surat Permohonan Pemasangan Perangkat TIK, Denah Ruangan & Jumlah Port Dibutuhkan', template: 'jaringan', status: 'Aktif', requiresHelpdesk: true },
    { id: 27, name: 'Audit Akses Jaringan Dinas', category: 'Pengelolaan Aplikasi Informatika', sla: '5-7 Hari', fieldCount: 4, sop: 'sop-audit-jaringan.pdf', requiredDocs: 'Surat Permohonan Audit Jaringan, Gambar Topologi Jaringan Lokal & Daftar IP Perangkat', template: 'jaringan', status: 'Aktif', requiresHelpdesk: true },
    { id: 28, name: 'Konfigurasi Peta Rencana TI Daerah', category: 'Pengelolaan Aplikasi Informatika', sla: '14-21 Hari', fieldCount: 3, sop: 'sop-peta-rencana-ti.pdf', requiredDocs: 'Surat Permohonan Penyelarasan TI, Matriks Program Kerja Digital OPD & Dokumen Anggaran', template: 'standar', status: 'Aktif', requiresHelpdesk: true },
    { id: 29, name: 'Pemulihan Data Backup Server', category: 'Pengelolaan Aplikasi Informatika', sla: '1-2 Hari', fieldCount: 6, sop: 'sop-backup-restore.pdf', requiredDocs: 'Surat Permohonan Pemulihan Data Resmi, Kronologi Insiden & Titik Tanggal Arsip Backup', template: 'server', status: 'Aktif', requiresHelpdesk: true },
    { id: 30, name: 'Jaringan Intra Pemerintah', category: 'Pengelolaan Sumber Daya & Perangkat Informatika', sla: '3 Hari', fieldCount: 4, sop: 'sop-jaringan.pdf', requiredDocs: 'Surat Permohonan Sambungan Intra Pemerintah, Denah Gedung & Titik Koordinat Lokasi', template: 'jaringan', status: 'Tahap Pengembangan', requiresHelpdesk: true },
    { id: 31, name: 'Server Perangkat Daerah', category: 'Pengelolaan Sumber Daya & Perangkat Informatika', sla: '5 Hari', fieldCount: 6, sop: 'sop-server.pdf', requiredDocs: 'Surat Permohonan Pengelolaan Server OPD, Daftar Inventaris Perangkat Server Fisik', template: 'server', status: 'Tahap Pengembangan', requiresHelpdesk: true },
    { id: 32, name: 'Infrastruktur TIK', category: 'Pengelolaan Sumber Daya & Perangkat Informatika', sla: '7 Hari', fieldCount: 4, sop: 'sop-infra.pdf', requiredDocs: 'Surat Permohonan Fasilitas Infrastruktur TIK, Rincian Kebutuhan Sarana Prasarana', template: 'jaringan', status: 'Tahap Pengembangan', requiresHelpdesk: true },
    { id: 33, name: 'Perangkat Jaringan & Komunikasi', category: 'Pengelolaan Sumber Daya & Perangkat Informatika', sla: '5 Hari', fieldCount: 4, sop: 'sop-perangkat.pdf', requiredDocs: 'Surat Permohonan Perbaikan/Penggantian Perangkat, Berita Acara Kerusakan Alat', template: 'jaringan', status: 'Tahap Pengembangan', requiresHelpdesk: true },
    { id: 34, name: 'Teleconference & Meeting', category: 'Pengelolaan Sumber Daya & Perangkat Informatika', sla: '1 Hari', fieldCount: 5, sop: 'sop-meeting.pdf', requiredDocs: 'Surat Permohonan Fasilitasi Rapat Digital, Jadwal Acara & Estimasi Partisipan', template: 'zoom', status: 'Tahap Pengembangan', requiresHelpdesk: false },
    { id: 35, name: 'Video Conference / Zoom', category: 'Pengelolaan Sumber Daya & Perangkat Informatika', sla: '1 Hari', fieldCount: 5, sop: 'sop-zoom.pdf', requiredDocs: 'Surat Permohonan Layanan Vicon, Undangan Resmi Acara & Agenda Rapat', template: 'zoom', status: 'Tahap Pengembangan', requiresHelpdesk: false },
    { id: 36, name: 'CCTV & Video Monitoring', category: 'Pengelolaan Sumber Daya & Perangkat Informatika', sla: '3 Hari', fieldCount: 3, sop: 'sop-cctv.pdf', requiredDocs: 'Surat Permohonan Titik Pantau CCTV, Denah Lokasi Pengawasan & Titik Listrik', template: 'standar', status: 'Tahap Pengembangan', requiresHelpdesk: true },
    { id: 37, name: 'Wifi Publik', category: 'Pengelolaan Sumber Daya & Perangkat Informatika', sla: '2 Hari', fieldCount: 4, sop: 'sop-wifi.pdf', requiredDocs: 'Identitas Pemohon / KTP, Laporan Lokasi Titik Wifi Publik & Foto Kendala', template: 'jaringan', status: 'Tahap Pengembangan', requiresHelpdesk: false },
    { id: 38, name: 'Keamanan Informasi & Persandian', category: 'Penerapan Persandian & Keamanan Informasi', sla: '5 Hari', fieldCount: 4, sop: 'sop-security.pdf', requiredDocs: 'Surat Permohonan Layanan Persandian, Klasifikasi Kerahasiaan Dokumen Dinas', template: 'keamanan', status: 'Tahap Pengembangan', requiresHelpdesk: true },
    { id: 39, name: 'Security Operation Center (SOC)', category: 'Penerapan Persandian & Keamanan Informasi', sla: '1 Hari', fieldCount: 4, sop: 'sop-soc.pdf', requiredDocs: 'Surat Permohonan Monitoring Keamanan SOC, Daftar IP Publik & Domain Sistem OPD', template: 'keamanan', status: 'Tahap Pengembangan', requiresHelpdesk: true },
    { id: 40, name: 'CSIRT / Respons Insiden', category: 'Penerapan Persandian & Keamanan Informasi', sla: '1 Hari', fieldCount: 4, sop: 'sop-csirt.pdf', requiredDocs: 'Formulir Pelaporan Insiden Siber, Log Bukti Serangan / Screenshot Gangguan', template: 'keamanan', status: 'Tahap Pengembangan', requiresHelpdesk: false },
    { id: 41, name: 'Security Awareness', category: 'Penerapan Persandian & Keamanan Informasi', sla: '3 Hari', fieldCount: 3, sop: 'sop-awareness.pdf', requiredDocs: 'Surat Permohonan Pelatihan Keamanan Siber, Daftar Nama Staf Calon Peserta', template: 'standar', status: 'Tahap Pengembangan', requiresHelpdesk: false },
    { id: 42, name: 'Kebijakan SPBE', category: 'Tata Kelola SPBE', sla: '10 Hari', fieldCount: 3, sop: 'sop-kebijakan.pdf', requiredDocs: 'Surat Permohonan Telaah Regulasi SPBE, Draf Rancangan Keputusan / Peraturan Walikota', template: 'standar', status: 'Tahap Pengembangan', requiresHelpdesk: true },
    { id: 43, name: 'Arsitektur & Peta Rencana SPBE', category: 'Tata Kelola SPBE', sla: '14 Hari', fieldCount: 3, sop: 'sop-arsitektur.pdf', requiredDocs: 'Surat Permohonan Integrasi Peta Rencana, Dokumen Cascading Kinerja Digital OPD', template: 'standar', status: 'Tahap Pengembangan', requiresHelpdesk: true },
    { id: 44, name: 'Monev & Pelaporan SPBE', category: 'Tata Kelola SPBE', sla: '14 Hari', fieldCount: 3, sop: 'sop-monev.pdf', requiredDocs: 'Surat Permohonan Evaluasi SPBE, Berkas Bukti Dukung Pemenuhan Indikator Penilaian', template: 'standar', status: 'Tahap Pengembangan', requiresHelpdesk: true },
    { id: 45, name: 'Integrasi & Interoperabilitas SPBE', category: 'Tata Kelola SPBE', sla: '7 Hari', fieldCount: 3, sop: 'sop-integrasi.pdf', requiredDocs: 'Surat Permohonan Interoperabilitas, Dokumen Format Pertukaran Data (JSON/XML)', template: 'standar', status: 'Tahap Pengembangan', requiresHelpdesk: false },
    { id: 46, name: 'Statistik Sektoral', category: 'Statistik Sektoral', sla: '5 Hari', fieldCount: 3, sop: 'sop-statistik.pdf', requiredDocs: 'Surat Rekomendasi Kegiatan Statistik Sektoral (ROMANIK), Draf Kuisioner & Standar Data', template: 'standar', status: 'Tahap Pengembangan', requiresHelpdesk: true },
    { id: 47, name: 'Satu Data Daerah', category: 'Satu Data Daerah', sla: '5 Hari', fieldCount: 3, sop: 'sop-satudata.pdf', requiredDocs: 'Surat Pengajuan Publikasi Satu Data, Tabel Dataset Sektoral Terverifikasi (XLSX/CSV)', template: 'standar', status: 'Tahap Pengembangan', requiresHelpdesk: false },
    { id: 48, name: 'Informasi & Komunikasi Publik', category: 'Informasi & Komunikasi Publik', sla: '3 Hari', fieldCount: 3, sop: 'sop-publikasi.pdf', requiredDocs: 'Surat Permohonan Publikasi Media Resmi Pemkot, Naskah Berita / Materi Grafis & Foto', template: 'standar', status: 'Tahap Pengembangan', requiresHelpdesk: false },
    { id: 49, name: 'Pelayanan Informasi Publik', category: 'Informasi & Komunikasi Publik', sla: '3 Hari', fieldCount: 3, sop: 'sop-ppid.pdf', requiredDocs: 'KTP / Identitas Sah Pemohon, Formulir Permohonan Informasi Publik PPID', template: 'standar', status: 'Tahap Pengembangan', requiresHelpdesk: false },
    { id: 50, name: 'Domain & Subdomain Pemerintah Daerah', category: 'Domain & Infrastruktur Pendukung', sla: '2 Hari', fieldCount: 3, sop: 'sop-domain.pdf', requiredDocs: 'Surat Permohonan Subdomain Resmi (.bogor.go.id), Dokumen Deskripsi Tujuan Web', template: 'standar', status: 'Tahap Pengembangan', requiresHelpdesk: false },
    { id: 51, name: 'Portal Pelayanan Digital', category: 'Domain & Infrastruktur Pendukung', sla: '3 Hari', fieldCount: 3, sop: 'sop-portal.pdf', requiredDocs: 'Surat Permohonan Integrasi Portal Layanan, Aset Logo/Banner & Tautan Akses Sistem', template: 'standar', status: 'Tahap Pengembangan', requiresHelpdesk: false },
    { id: 52, name: 'Pusat Kendali / Command Center', category: 'Domain & Infrastruktur Pendukung', sla: '5 Hari', fieldCount: 3, sop: 'sop-command.pdf', requiredDocs: 'Surat Permohonan Pemanfaatan Command Center, Jadwal Kegiatan & Jumlah Tamu Hadir', template: 'standar', status: 'Tahap Pengembangan', requiresHelpdesk: true },
    { id: 53, name: 'Peningkatan Kapasitas SDM TIK', category: 'Domain & Infrastruktur Pendukung', sla: '5 Hari', fieldCount: 3, sop: 'sop-sdm.pdf', requiredDocs: 'Surat Permohonan Pelatihan Kompetensi TIK, Daftar Nama Calon Peserta & Bidang Minat', template: 'standar', status: 'Tahap Pengembangan', requiresHelpdesk: true }
  ];

  const [tickets, setTickets] = useState(defaultTicketsList);
  const [teams, setTeams] = useState(defaultTeamsList);
  const [users, setUsers] = useState(() => {
    return defaultUsersList.map(u => {
      if (u.role === 'masyarakat' || u.roles?.includes('masyarakat') || u.department === 'Masyarakat Kota Bogor') {
        return { ...u, department: 'Masyarakat Umum' };
      }
      return u;
    });
  });
  const [services, setServices] = useState(defaultServicesList);

  const ratings = tickets
    .filter(t => t.rating)
    .map((t, idx) => ({
      id: idx + 1,
      ticketId: t.id,
      name: t.opd,
      rating: t.rating.overall || Math.round((t.rating.speed + t.rating.result + t.rating.communication + t.rating.quality) / 4),
      service: t.service,
      comment: t.rating.comment,
      status: `Selesai (${t.slaRemainingDays >= 0 ? 'On SLA' : 'Late'})`,
      selectedForLanding: t.selectedForLanding !== undefined ? t.selectedForLanding : false,
      aspects: {
        speed: t.rating.speed,
        result: t.rating.result,
        communication: t.rating.communication,
        quality: t.rating.quality
      }
    }));

  const toggleRatingForLanding = (ratingId) => {
    const rated = tickets.filter(t => t.rating);
    const targetRating = rated[ratingId - 1];
    if (!targetRating) return;
    
    const isCurrentlySelected = targetRating.selectedForLanding !== undefined ? targetRating.selectedForLanding : false;

    if (!isCurrentlySelected) {
      const currentSelectedCount = tickets.filter(t => t.rating && (t.selectedForLanding !== undefined ? t.selectedForLanding : false)).length;
      if (currentSelectedCount >= 10) {
        alert('Maksimal kuota 10 ulasan landing page telah tercapai! Silakan batalkan pilihan pada salah satu ulasan yang sedang aktif terlebih dahulu sebelum menampilkan ulasan baru.');
        return;
      }
    }
    
    setTickets(prev => prev.map(t => {
      if (t.id === targetRating.id) {
        return {
          ...t,
          selectedForLanding: !isCurrentlySelected
        };
      }
      return t;
    }));
  };

  const login = (roleOrUser, specificCredential) => {
    if (typeof roleOrUser === 'object' && roleOrUser !== null) {
      setUser({ ...roleOrUser });
      return;
    }

    const selectedRole = roleOrUser;
    let targetUser = null;

    if (specificCredential) {
      const query = specificCredential.toLowerCase().trim();
      targetUser = users.find(u => u.email.toLowerCase() === query || (u.name && u.name.toLowerCase() === query));
    }

    if (!targetUser) {
      targetUser = users.find(u => u.role === selectedRole);
    }
    if (!targetUser) {
      targetUser = users.find(u => u.roles?.includes(selectedRole));
    }

    if (targetUser) {
      setUser({ ...targetUser });
    } else {
      const roleMockData = {
        admin: {
          name: 'Ahmad Faisal',
          email: 'ahmad.faisal@kotabogor.go.id',
          role: 'admin',
          roles: ['admin', 'user'],
          department: 'Dinas Komunikasi dan Informatika Kota Bogor',
        },
        helpdesk: {
          name: 'Siti Rahmawati',
          email: 'siti.rahmawati@kotabogor.go.id',
          role: 'helpdesk',
          roles: ['helpdesk', 'user'],
          department: 'Dinas Komunikasi dan Informatika Kota Bogor',
        },
        pegawai: {
          name: 'Rian Hidayat',
          email: 'rian.hidayat@kotabogor.go.id',
          role: 'pegawai',
          roles: ['pegawai', 'user'],
          department: 'Dinas Komunikasi dan Informatika Kota Bogor',
        },
        user: {
          name: 'Dr. Budi Utomo',
          email: 'budi.utomo@kotabogor.go.id',
          role: 'user',
          roles: ['user'],
          department: 'Dinas Kesehatan Kota Bogor',
        },
        masyarakat: {
          name: 'Azka Mortaza',
          email: 'mortazaaazkaa2509@gmail.com',
          role: 'masyarakat',
          roles: ['masyarakat'],
          department: 'Masyarakat Umum',
        }
      };

      const target = roleMockData[selectedRole] || roleMockData.user;
      setUser({ ...target });
    }
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, ratings, toggleRatingForLanding, tickets, setTickets, teams, setTeams, users, setUsers, services, setServices }}>
      {children}
    </AuthContext.Provider>
  );
};
