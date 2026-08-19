import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, FileText, Upload, ChevronRight, ArrowLeft, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const CreateTicket = () => {
  const { tickets, setTickets } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedRequestType, setSelectedRequestType] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [appName, setAppName] = useState('');
  const [installLocation, setInstallLocation] = useState('');
  const [uploadedFile, setUploadedFile] = useState('');

  const categories = [
    {
      id: 'cat1',
      title: 'Pengelolaan Aplikasi Informatika',
      services: [
        { name: 'Pengembangan & Pengelolaan Aplikasi', types: ['Pengembangan aplikasi baru', 'Penambahan fitur', 'Perubahan fitur', 'Perbaikan error/bug', 'Pemeliharaan aplikasi', 'Upgrade aplikasi', 'Migrasi aplikasi', 'Integrasi API', 'Integrasi SSO', 'Integrasi SPLP', 'Konsultasi aplikasi', 'Asistensi teknis'] },
        { name: 'Rekomendasi & Evaluasi Aplikasi', types: ['Permohonan rekomendasi aplikasi', 'Evaluasi aplikasi', 'Review kebutuhan aplikasi', 'Review arsitektur aplikasi', 'Konsultasi pengembangan aplikasi', 'Pendampingan pengembangan aplikasi'] },
        { name: 'Uji Kesesuaian Sistem (UKS)', types: ['Permohonan UKS', 'Pengajuan uji aplikasi', 'Konsultasi UKS', 'Perbaikan hasil UKS', 'Tindak lanjut hasil UKS'] },
        { name: 'Keamanan Aplikasi / VAPT', types: ['Vulnerability Assessment', 'Penetration Testing', 'VAPT', 'Security Assessment', 'Retest keamanan', 'Konsultasi keamanan aplikasi'] }
      ]
    },
    {
      id: 'cat2',
      title: 'Pengelolaan Sumber Daya & Perangkat Informatika',
      services: [
        { name: 'Jaringan Intra Pemerintah', types: ['Gangguan jaringan', 'Permintaan akses jaringan', 'Permintaan koneksi jaringan', 'Instalasi jaringan', 'Penambahan titik jaringan', 'Pemindahan titik jaringan', 'Perubahan konfigurasi', 'Pemeriksaan jaringan', 'Konsultasi jaringan'] },
        { name: 'Server Perangkat Daerah', types: ['Permohonan hosting', 'Permohonan server', 'Pembuatan virtual server', 'Deploy aplikasi', 'Penambahan resource', 'Perubahan resource', 'Backup server', 'Restore server', 'Pemindahan aplikasi', 'Gangguan server', 'Pemeliharaan server', 'Konsultasi server'] },
        { name: 'Infrastruktur TIK', types: ['Permintaan infrastruktur', 'Instalasi perangkat', 'Konfigurasi perangkat', 'Pemeliharaan infrastruktur', 'Perbaikan infrastruktur', 'Penggantian perangkat', 'Pemeriksaan infrastruktur', 'Konsultasi infrastruktur'] },
        { name: 'Perangkat Jaringan & Komunikasi', types: ['Permintaan perangkat', 'Peminjaman perangkat', 'Instalasi perangkat', 'Konfigurasi perangkat', 'Perbaikan perangkat', 'Pemeliharaan perangkat', 'Penggantian perangkat', 'Konsultasi perangkat'] },
        { name: 'Teleconference & Meeting', types: ['Peminjaman perangkat teleconference', 'Peminjaman ruang teleconference', 'Permohonan operator teleconference', 'Dukungan teknis meeting', 'Setup perangkat meeting', 'Uji coba teleconference', 'Troubleshooting teleconference', 'Pendampingan kegiatan'] },
        { name: 'Video Conference / Zoom', types: ['Permohonan link Zoom', 'Pembuatan Zoom Meeting', 'Pembuatan Zoom Webinar', 'Pengaturan host/co-host', 'Dukungan operator Zoom', 'Pendampingan Zoom', 'Troubleshooting Zoom'] },
        { name: 'CCTV & Video Monitoring', types: ['Permohonan akses CCTV', 'Permohonan akses live streaming', 'Permohonan rekaman CCTV', 'Permintaan informasi CCTV', 'Gangguan CCTV', 'Pemeriksaan kamera', 'Permintaan pemasangan kamera', 'Permintaan pemindahan kamera', 'Konsultasi CCTV'] },
        { name: 'Wifi Publik', types: ['Gangguan wifi', 'Permintaan pemasangan', 'Permintaan pengecekan', 'Pelaporan lokasi wifi', 'Pemeliharaan wifi'] }
      ]
    },
    {
      id: 'cat3',
      title: 'Penerapan Persandian & Keamanan Informasi',
      services: [
        { name: 'Keamanan Informasi & Persandian', types: ['Konsultasi keamanan informasi', 'Konsultasi persandian', 'Asesmen keamanan', 'Audit keamanan', 'Penyusunan tata kelola keamanan', 'Konsultasi kebijakan keamanan', 'Pendampingan keamanan'] },
        { name: 'Security Operation Center (SOC)', types: ['Permintaan monitoring keamanan', 'Investigasi alert keamanan', 'Analisis log', 'Monitoring keamanan', 'Konsultasi SOC', 'Tindak lanjut alert'] },
        { name: 'CSIRT / Respons Insiden', types: ['Pelaporan insiden keamanan', 'Penanganan insiden', 'Investigasi insiden', 'Analisis insiden', 'Pemulihan insiden', 'Konsultasi insiden', 'Tindak lanjut insiden'] },
        { name: 'Security Awareness', types: ['Permohonan sosialisasi', 'Permohonan pelatihan', 'Permohonan bimtek', 'Edukasi keamanan siber', 'Pendampingan keamanan'] }
      ]
    },
    {
      id: 'cat4',
      title: 'Tata Kelola SPBE',
      services: [
        { name: 'Kebijakan SPBE', types: ['Konsultasi kebijakan SPBE', 'Konsultasi tata kelola SPBE', 'Permintaan rekomendasi SPBE', 'Pendampingan SPBE', 'Konsultasi regulasi SPBE'] },
        { name: 'Arsitektur & Peta Rencana SPBE', types: ['Konsultasi arsitektur SPBE', 'Konsultasi peta rencana', 'Penyusunan arsitektur', 'Review arsitektur', 'Pendampingan pemetaan SPBE'] },
        { name: 'Monev & Pelaporan SPBE', types: ['Konsultasi evaluasi SPBE', 'Pendampingan evaluasi SPBE', 'Konsultasi indikator', 'Konsultasi bukti dukung', 'Pendampingan pengisian evaluasi', 'Konsultasi pelaporan SPBE'] },
        { name: 'Integrasi & Interoperabilitas SPBE', types: ['Permohonan integrasi', 'Integrasi API', 'Integrasi SPLP', 'Konsultasi interoperabilitas', 'Pengujian integrasi', 'Pendampingan integrasi'] }
      ]
    },
    {
      id: 'cat5',
      title: 'Statistik Sektoral',
      services: [
        { name: 'Statistik Sektoral', types: ['Permintaan data statistik', 'Permintaan dataset', 'Permintaan metadata', 'Konsultasi statistik', 'Konsultasi metodologi', 'Rekomendasi statistik', 'Validasi data', 'Pendampingan statistik'] }
      ]
    },
    {
      id: 'cat6',
      title: 'Satu Data Daerah',
      services: [
        { name: 'Satu Data Daerah', types: ['Permintaan data', 'Permintaan dataset', 'Permintaan metadata', 'Konsultasi Satu Data', 'Standar data', 'Kode referensi', 'Integrasi data', 'Validasi data'] }
      ]
    },
    {
      id: 'cat7',
      title: 'Informasi & Komunikasi Publik',
      services: [
        { name: 'Informasi & Komunikasi Publik', types: ['Permohonan publikasi', 'Permohonan diseminasi informasi', 'Permohonan peliputan', 'Permohonan dokumentasi', 'Konsultasi komunikasi publik', 'Dukungan komunikasi kegiatan'] },
        { name: 'Pelayanan Informasi Publik', types: ['Permohonan informasi', 'Permintaan data/informasi', 'Konsultasi informasi publik', 'Permintaan salinan informasi'] }
      ]
    },
    {
      id: 'cat8',
      title: 'Domain & Infrastruktur Pendukung',
      services: [
        { name: 'Domain & Subdomain Pemerintah Daerah', types: ['Permohonan domain', 'Permohonan subdomain', 'Perubahan DNS', 'Perubahan konfigurasi domain', 'Perpanjangan/pengelolaan domain'] },
        { name: 'Portal Pelayanan Digital', types: ['Permohonan integrasi portal', 'Permintaan akses', 'Permintaan akun', 'Perubahan konten', 'Gangguan portal', 'Konsultasi portal'] },
        { name: 'Pusat Kendali / Command Center', types: ['Permintaan integrasi data', 'Permintaan integrasi API', 'Permintaan dashboard', 'Permintaan data monitoring', 'Dukungan teknis dashboard'] },
        { name: 'Peningkatan Kapasitas SDM TIK', types: ['Permohonan pelatihan', 'Permohonan bimtek', 'Permohonan sosialisasi', 'Permohonan narasumber', 'Konsultasi kompetensi', 'Pendampingan SDM'] }
      ]
    }
  ];

  const handleSelectCategory = (cat) => {
    setSelectedCategory(cat);
    setStep(2);
  };

  const handleSelectService = (srv) => {
    setSelectedService(srv);
    setSelectedRequestType(srv.types[0]);
    setStep(3);
  };

  const handleSimulateUpload = () => {
    setUploadedFile('Dokumen_Persyaratan_Layanan.pdf');
  };

  const getSlaDetails = (serviceName, requestType) => {
    if (serviceName === 'Pengembangan & Pengelolaan Aplikasi') {
      if (requestType === 'Pengembangan aplikasi baru') return { time: '30 Hari Kerja', desc: 'Pembuatan aplikasi dari tahap analisis, rancangan, coding, hingga deployment.' };
      if (requestType === 'Penambahan fitur') return { time: '7 Hari Kerja', desc: 'Modifikasi modul atau penambahan fungsionalitas menu pada sistem.' };
      if (requestType === 'Perbaikan error/bug') return { time: '3 Hari Kerja', desc: 'Troubleshooting eror kritis yang mengganggu operasional.' };
      return { time: '5 Hari Kerja', desc: 'Pemeliharaan server aplikasi rutin atau asistensi teknis.' };
    }
    if (serviceName === 'Jaringan Intra Pemerintah') {
      if (requestType === 'Gangguan jaringan') return { time: '4 Jam', desc: 'Pemulihan koneksi internet atau jaringan intranet gedung OPD.' };
      if (requestType === 'Permintaan akses jaringan') return { time: '1 Hari Kerja', desc: 'Pembuatan hak akses port jaringan atau akun VPN Dinas.' };
      return { time: '3 Hari Kerja', desc: 'Penarikan kabel LAN fisik atau relokasi titik access point.' };
    }
    if (serviceName === 'Server Perangkat Daerah') {
      if (requestType === 'Permohonan hosting') return { time: '5 Hari Kerja', desc: 'Penyediaan VM server (CPU/RAM/SSD) dan konfigurasi database.' };
      return { time: '3 Hari Kerja', desc: 'Pencadangan data berkala atau perubahan alokasi resource server.' };
    }
    return { time: '3 Hari Kerja', desc: 'Estimasi standar penyelesaian layanan SPBE oleh tim teknis.' };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newTicket = {
      id: `REQ-2026-0${Math.floor(132 + Math.random() * 800)}`,
      opd: 'Dinas Kesehatan Kota Bogor',
      service: selectedService.name,
      requestType: selectedRequestType,
      title: title,
      desc: description,
      date: '18 Agustus 2026',
      progress: 0,
      status: 'Verifikasi',
      files: uploadedFile ? [uploadedFile] : [],
      logs: [{ date: '18 Agt 08:00', text: 'Tiket berhasil dibuat oleh User' }]
    };
    setTickets([newTicket, ...tickets]);
    navigate('/dashboard/history');
  };

  return (
    <div className="max-w-3xl mx-auto font-sans space-y-8 text-left">
      <div className="space-y-1.5">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Ajukan Layanan SPBE</h2>
        <p className="text-slate-500 text-base leading-relaxed mt-1.5">Ikuti 3 langkah mudah untuk mengajukan permohonan digitalisasi layanan Anda.</p>
      </div>

      <div className="flex items-center justify-between bg-white p-5 rounded-xl border border-slate-200 shadow-sm text-base font-bold text-slate-400 uppercase tracking-wider">
        <div className={`flex items-center gap-2.5 ${step >= 1 ? 'text-sky-600' : ''}`}>
          <span className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 1 ? 'border-sky-600 bg-sky-50 font-bold' : 'border-slate-300'}`}>1</span>
          <span>Kategori</span>
        </div>
        <div className="w-12 h-0.5 bg-slate-200"></div>
        <div className={`flex items-center gap-2.5 ${step >= 2 ? 'text-sky-600' : ''}`}>
          <span className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 2 ? 'border-sky-600 bg-sky-50 font-bold' : 'border-slate-300'}`}>2</span>
          <span>Layanan</span>
        </div>
        <div className="w-12 h-0.5 bg-slate-200"></div>
        <div className={`flex items-center gap-2.5 ${step >= 3 ? 'text-sky-600' : ''}`}>
          <span className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 3 ? 'border-sky-600 bg-sky-50 font-bold' : 'border-slate-300'}`}>3</span>
          <span>Formulir</span>
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <h3 className="font-extrabold text-slate-800 text-lg">Langkah 1: Pilih Kategori Proses Bisnis</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map((cat) => (
              <div
                key={cat.id}
                onClick={() => handleSelectCategory(cat)}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-sky-500 hover:shadow-md cursor-pointer transition-all flex justify-between items-center group"
              >
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-800 text-base group-hover:text-sky-600 transition-all">{cat.title}</h4>
                  <p className="text-base text-slate-400">{cat.services.length} Layanan Terhubung</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-sky-600 transition-all" />
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <button
            onClick={() => setStep(1)}
            className="flex items-center gap-1.5 text-base font-bold text-slate-500 hover:text-sky-600 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Kategori</span>
          </button>
          <h3 className="font-extrabold text-slate-800 text-lg">Langkah 2: Pilih Spesifikasi Layanan</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedCategory.services.map((srv, idx) => (
              <div
                key={idx}
                onClick={() => handleSelectService(srv)}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-sky-500 hover:shadow-md cursor-pointer transition-all flex justify-between items-center group"
              >
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-800 text-base group-hover:text-sky-600 transition-all">{srv.name}</h4>
                  <p className="text-base text-slate-400">{srv.types.length} Jenis Permintaan</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-sky-600 transition-all" />
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center gap-1.5 text-base font-bold text-slate-500 hover:text-sky-600 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali</span>
              </button>
              <h3 className="font-black text-slate-800 text-xl mt-2">{selectedService.name}</h3>
              <p className="text-base text-slate-400 mt-1">Isi formulir pengajuan di bawah ini dengan lengkap.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-550 uppercase tracking-wider mb-2">Jenis Permintaan</label>
              <select
                value={selectedRequestType}
                onChange={(e) => setSelectedRequestType(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-base bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 font-semibold text-slate-700"
              >
                {selectedService.types.map((type, tIdx) => (
                  <option key={tIdx} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-550 uppercase tracking-wider mb-2">Estimasi Waktu Pengerjaan (SLA)</label>
              <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl text-left flex items-start gap-2.5">
                <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-extrabold text-amber-800">{getSlaDetails(selectedService.name, selectedRequestType).time}</p>
                  <p className="text-xs text-amber-650 mt-0.5 font-medium leading-relaxed">{getSlaDetails(selectedService.name, selectedRequestType).desc}</p>
                </div>
              </div>
            </div>

            {selectedService.name === 'Pengembangan & Pengelolaan Aplikasi' && (
              <div>
                <label className="block text-sm font-bold text-slate-550 uppercase tracking-wider mb-2">Nama Aplikasi</label>
                <input
                  type="text"
                  required
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  placeholder="Contoh: SIBADRA / E-Puskesmas"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-base focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
            )}

            {selectedService.name === 'Jaringan Intra Pemerintah' && (
              <div>
                <label className="block text-sm font-bold text-slate-550 uppercase tracking-wider mb-2">Lokasi Penambahan / Gangguan Jaringan</label>
                <input
                  type="text"
                  required
                  value={installLocation}
                  onChange={(e) => setInstallLocation(e.target.value)}
                  placeholder="Gedung Rapat Utama Lantai 2"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-base focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
            )}

            <div className="col-span-2">
              <label className="block text-sm font-bold text-slate-550 uppercase tracking-wider mb-2">Judul Permohonan</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Penambahan tombol unduh BA untuk dinas"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-base focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-bold text-slate-550 uppercase tracking-wider mb-2">Deskripsi Detail Permasalahan / Kebutuhan</label>
              <textarea
                required
                rows="4"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tuliskan secara lengkap rincian apa saja yang ingin diajukan..."
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-base focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <div className="col-span-2 space-y-2">
              <label className="block text-sm font-bold text-slate-550 uppercase tracking-wider">Unggah Berkas Persyaratan (SOP/TOR/Surat Tugas)</label>
              {uploadedFile ? (
                <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700">
                  <FileText className="w-5 h-5 text-sky-600" />
                  <span className="flex-1 truncate">{uploadedFile}</span>
                  <span className="text-sm text-sky-600 font-bold bg-sky-50 px-2 py-0.5 rounded border border-sky-100">Tersimpan</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleSimulateUpload}
                  className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-slate-300 hover:bg-slate-50 rounded-xl text-sm font-bold text-slate-650 transition-all"
                >
                  <Upload className="w-5 h-5" />
                  <span>Simulasi Unggah Berkas Persyaratan (.pdf)</span>
                </button>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-1.5 py-3.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-base font-bold transition-all"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Kirim Pengajuan Layanan</span>
          </button>
        </form>
      )}
    </div>
  );
};
