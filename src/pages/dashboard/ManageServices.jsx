import React, { useState } from 'react';
import { Edit2, Trash2, Eye, X, Settings } from 'lucide-react';

const getServiceFormFields = (serviceName, template) => {
  if (template === 'aplikasi') {
    return [
      { label: 'Nama Aplikasi', type: 'text', placeholder: 'Contoh: Portal Layanan Kesehatan' },
      { label: 'Platform Aplikasi', type: 'select', options: ['Web', 'Mobile (Android/iOS)', 'Desktop'] },
      { label: 'Deskripsi Kebutuhan / Fitur', type: 'textarea', placeholder: 'Jelaskan modul atau fitur yang dibutuhkan...' },
      { label: 'Surat Permohonan Resmi', type: 'file' }
    ];
  }
  if (template === 'server') {
    return [
      { label: 'Nama Sistem / Database', type: 'text', placeholder: 'Contoh: DB Sektoral Dinas' },
      { label: 'Spesifikasi CPU', type: 'select', options: ['2 Core', '4 Core', '8 Core', '16 Core'] },
      { label: 'Spesifikasi RAM', type: 'select', options: ['4 GB', '8 GB', '16 GB', '32 GB'] },
      { label: 'Kapasitas SSD', type: 'select', options: ['50 GB', '100 GB', '250 GB', '500 GB'] },
      { label: 'Sistem Operasi', type: 'select', options: ['Ubuntu Server 22.04', 'CentOS 7', 'Windows Server 2019', 'Rocky Linux'] },
      { label: 'Surat Permohonan & TOR Spesifikasi', type: 'file' }
    ];
  }
  if (template === 'jaringan') {
    return [
      { label: 'Lokasi Pemasangan / Gedung', type: 'text', placeholder: 'Contoh: Gedung A Lantai 2' },
      { label: 'Jenis Kebutuhan', type: 'select', options: ['Pemasangan Access Point Wifi', 'Instalasi Kabel LAN Baru', 'Akses VPN Staf', 'Penyetelan Bandwidth'] },
      { label: 'Jumlah Node / Pengguna', type: 'number', placeholder: 'Estimasi jumlah pengguna...' },
      { label: 'Surat Permohonan & Denah Ruangan', type: 'file' }
    ];
  }
  if (template === 'zoom') {
    return [
      { label: 'Nama Kegiatan / Agenda', type: 'text', placeholder: 'Contoh: Sosialisasi Imunisasi Puskesmas' },
      { label: 'Tanggal & Waktu Kegiatan', type: 'datetime-local' },
      { label: 'Kapasitas Peserta', type: 'select', options: ['100 Peserta', '300 Peserta', '500 Peserta', '1000 Peserta'] },
      { label: 'Butuh Operator Diskominfo', type: 'select', options: ['Tidak', 'Ya (Asistensi Teknis)'] },
      { label: 'Surat Permohonan Resmi', type: 'file' }
    ];
  }
  if (template === 'keamanan') {
    return [
      { label: 'Nama Aplikasi / Domain Uji', type: 'text', placeholder: 'Contoh: https://esir.bogor.go.id' },
      { label: 'Ruang Lingkup Asesmen', type: 'select', options: ['Uji Penetrasi Web (VAPT)', 'Audit Keamanan Informasi', 'Setup Antivirus Server'] },
      { label: 'Kontak Teknis Pengelola', type: 'text', placeholder: 'Nama & No. WhatsApp penanggung jawab...' },
      { label: 'Surat Permohonan & Surat Pernyataan Kepemilikan Sistem', type: 'file' }
    ];
  }
  if (template === 'standar') {
    return [
      { label: 'Judul Permohonan', type: 'text', placeholder: 'Judul pengajuan...' },
      { label: 'Deskripsi Kebutuhan', type: 'textarea', placeholder: 'Jelaskan kebutuhan layanan secara lengkap...' },
      { label: 'Surat Permohonan Resmi', type: 'file' }
    ];
  }

  if (!serviceName) return [];
  const nameLower = serviceName.toLowerCase();
  if (nameLower.includes('aplikasi') || nameLower.includes('uks') || nameLower.includes('sistem')) {
    return [
      { label: 'Nama Aplikasi', type: 'text', placeholder: 'Contoh: Portal Layanan Kesehatan' },
      { label: 'Platform Aplikasi', type: 'select', options: ['Web', 'Mobile (Android/iOS)', 'Desktop'] },
      { label: 'Deskripsi Kebutuhan / Fitur', type: 'textarea', placeholder: 'Jelaskan modul atau fitur yang dibutuhkan...' },
      { label: 'Surat Permohonan Resmi', type: 'file' }
    ];
  }
  if (nameLower.includes('server') || nameLower.includes('hosting')) {
    return [
      { label: 'Nama Sistem / Database', type: 'text', placeholder: 'Contoh: DB Sektoral Dinas' },
      { label: 'Spesifikasi CPU', type: 'select', options: ['2 Core', '4 Core', '8 Core', '16 Core'] },
      { label: 'Spesifikasi RAM', type: 'select', options: ['4 GB', '8 GB', '16 GB', '32 GB'] },
      { label: 'Kapasitas SSD', type: 'select', options: ['50 GB', '100 GB', '250 GB', '500 GB'] },
      { label: 'Sistem Operasi', type: 'select', options: ['Ubuntu Server 22.04', 'CentOS 7', 'Windows Server 2019', 'Rocky Linux'] },
      { label: 'Surat Permohonan & TOR Spesifikasi', type: 'file' }
    ];
  }
  if (nameLower.includes('jaringan') || nameLower.includes('wifi') || nameLower.includes('infrastruktur')) {
    return [
      { label: 'Lokasi Pemasangan / Gedung', type: 'text', placeholder: 'Contoh: Gedung A Lantai 2' },
      { label: 'Jenis Kebutuhan', type: 'select', options: ['Pemasangan Access Point Wifi', 'Instalasi Kabel LAN Baru', 'Akses VPN Staf', 'Penyetelan Bandwidth'] },
      { label: 'Jumlah Node / Pengguna', type: 'number', placeholder: 'Estimasi jumlah pengguna...' },
      { label: 'Surat Permohonan & Denah Ruangan', type: 'file' }
    ];
  }
  if (nameLower.includes('zoom') || nameLower.includes('conference') || nameLower.includes('publikasi') || nameLower.includes('informasi')) {
    return [
      { label: 'Nama Kegiatan / Agenda', type: 'text', placeholder: 'Contoh: Sosialisasi Imunisasi Puskesmas' },
      { label: 'Tanggal & Waktu Kegiatan', type: 'datetime-local' },
      { label: 'Kapasitas Peserta', type: 'select', options: ['100 Peserta', '300 Peserta', '500 Peserta', '1000 Peserta'] },
      { label: 'Butuh Operator Diskominfo', type: 'select', options: ['Tidak', 'Ya (Asistensi Teknis)'] },
      { label: 'Surat Permohonan Resmi', type: 'file' }
    ];
  }
  if (nameLower.includes('keamanan') || nameLower.includes('vapt') || nameLower.includes('sandi') || nameLower.includes('csirt')) {
    return [
      { label: 'Nama Aplikasi / Domain Uji', type: 'text', placeholder: 'Contoh: https://esir.bogor.go.id' },
      { label: 'Ruang Lingkup Asesmen', type: 'select', options: ['Uji Penetrasi Web (VAPT)', 'Audit Keamanan Informasi', 'Setup Antivirus Server'] },
      { label: 'Kontak Teknis Pengelola', type: 'text', placeholder: 'Nama & No. WhatsApp penanggung jawab...' },
      { label: 'Surat Permohonan & Surat Pernyataan Kepemilikan Sistem', type: 'file' }
    ];
  }
  return [
    { label: 'Judul Permohonan', type: 'text', placeholder: 'Judul pengajuan...' },
    { label: 'Deskripsi Kebutuhan', type: 'textarea', placeholder: 'Jelaskan kebutuhan layanan secara lengkap...' },
    { label: 'Surat Permohonan Resmi', type: 'file' }
  ];
};

export const ManageServices = () => {
  const [services, setServices] = useState([
    { id: 1, name: 'Pengembangan & Pengelolaan Aplikasi', category: 'Pengelolaan Aplikasi Informatika', sla: '30-90 Hari', sop: 'sop-pengembangan.pdf' },
    { id: 2, name: 'Rekomendasi & Evaluasi Aplikasi', category: 'Pengelolaan Aplikasi Informatika', sla: '7 Hari', sop: 'sop-rekomendasi.pdf' },
    { id: 3, name: 'Uji Kesesuaian Sistem (UKS)', category: 'Pengelolaan Aplikasi Informatika', sla: '14 Hari', sop: 'sop-uks.pdf' },
    { id: 4, name: 'Keamanan Aplikasi / VAPT', category: 'Pengelolaan Aplikasi Informatika', sla: '10 Hari', sop: 'sop-vapt.pdf' },
    { id: 5, name: 'Jaringan Intra Pemerintah', category: 'Pengelolaan Sumber Daya & Perangkat Informatika', sla: '3 Hari', sop: 'sop-jaringan.pdf' },
    { id: 6, name: 'Server Perangkat Daerah', category: 'Pengelolaan Sumber Daya & Perangkat Informatika', sla: '5 Hari', sop: 'sop-server.pdf' },
    { id: 7, name: 'Infrastruktur TIK', category: 'Pengelolaan Sumber Daya & Perangkat Informatika', sla: '7 Hari', sop: 'sop-infra.pdf' },
    { id: 8, name: 'Perangkat Jaringan & Komunikasi', category: 'Pengelolaan Sumber Daya & Perangkat Informatika', sla: '5 Hari', sop: 'sop-perangkat.pdf' },
    { id: 9, name: 'Teleconference & Meeting', category: 'Pengelolaan Sumber Daya & Perangkat Informatika', sla: '1 Hari', sop: 'sop-meeting.pdf' },
    { id: 10, name: 'Video Conference / Zoom', category: 'Pengelolaan Sumber Daya & Perangkat Informatika', sla: '1 Hari', sop: 'sop-zoom.pdf' },
    { id: 11, name: 'CCTV & Video Monitoring', category: 'Pengelolaan Sumber Daya & Perangkat Informatika', sla: '3 Hari', sop: 'sop-cctv.pdf' },
    { id: 12, name: 'Wifi Publik', category: 'Pengelolaan Sumber Daya & Perangkat Informatika', sla: '2 Hari', sop: 'sop-wifi.pdf' },
    { id: 13, name: 'Keamanan Informasi & Persandian', category: 'Penerapan Persandian & Keamanan Informasi', sla: '5 Hari', sop: 'sop-security.pdf' },
    { id: 14, name: 'Security Operation Center (SOC)', category: 'Penerapan Persandian & Keamanan Informasi', sla: '1 Hari', sop: 'sop-soc.pdf' },
    { id: 15, name: 'CSIRT / Respons Insiden', category: 'Penerapan Persandian & Keamanan Informasi', sla: '1 Hari', sop: 'sop-csirt.pdf' },
    { id: 16, name: 'Security Awareness', category: 'Penerapan Persandian & Keamanan Informasi', sla: '3 Hari', sop: 'sop-awareness.pdf' },
    { id: 17, name: 'Kebijakan SPBE', category: 'Tata Kelola SPBE', sla: '10 Hari', sop: 'sop-kebijakan.pdf' },
    { id: 18, name: 'Arsitektur & Peta Rencana SPBE', category: 'Tata Kelola SPBE', sla: '14 Hari', sop: 'sop-arsitektur.pdf' },
    { id: 19, name: 'Monev & Pelaporan SPBE', category: 'Tata Kelola SPBE', sla: '14 Hari', sop: 'sop-monev.pdf' },
    { id: 20, name: 'Integrasi & Interoperabilitas SPBE', category: 'Tata Kelola SPBE', sla: '7 Hari', sop: 'sop-integrasi.pdf' },
    { id: 21, name: 'Statistik Sektoral', category: 'Statistik Sektoral', sla: '5 Hari', sop: 'sop-statistik.pdf' },
    { id: 22, name: 'Satu Data Daerah', category: 'Satu Data Daerah', sla: '5 Hari', sop: 'sop-satudata.pdf' },
    { id: 23, name: 'Informasi & Komunikasi Publik', category: 'Informasi & Komunikasi Publik', sla: '3 Hari', sop: 'sop-publikasi.pdf' },
    { id: 24, name: 'Pelayanan Informasi Publik', category: 'Informasi & Komunikasi Publik', sla: '3 Hari', sop: 'sop-ppid.pdf' },
    { id: 25, name: 'Domain & Subdomain Pemerintah Daerah', category: 'Domain & Infrastruktur Pendukung', sla: '2 Hari', sop: 'sop-domain.pdf' },
    { id: 26, name: 'Portal Pelayanan Digital', category: 'Domain & Infrastruktur Pendukung', sla: '3 Hari', sop: 'sop-portal.pdf' },
    { id: 27, name: 'Pusat Kendali / Command Center', category: 'Domain & Infrastruktur Pendukung', sla: '5 Hari', sop: 'sop-command.pdf' },
    { id: 28, name: 'Peningkatan Kapasitas SDM TIK', category: 'Domain & Infrastruktur Pendukung', sla: '5 Hari', sop: 'sop-sdm.pdf' }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Pengelolaan Aplikasi Informatika');
  const [sla, setSla] = useState('');
  const [sop, setSop] = useState('');
  const [formTemplate, setFormTemplate] = useState('standar');
  const [selectedPreviewService, setSelectedPreviewService] = useState(null);
  const [selectedCategoryTab, setSelectedCategoryTab] = useState('all');

  const categoriesList = [
    'Pengelolaan Aplikasi Informatika',
    'Pengelolaan Sumber Daya & Perangkat Informatika',
    'Penerapan Persandian & Keamanan Informasi',
    'Tata Kelola SPBE',
    'Statistik Sektoral',
    'Satu Data Daerah',
    'Informasi & Komunikasi Publik',
    'Domain & Infrastruktur Pendukung'
  ];

  const handleAddService = (e) => {
    e.preventDefault();
    const newService = {
      id: services.length + 1,
      name,
      category,
      sla,
      sop,
      template: formTemplate
    };
    setServices([...services, newService]);
    setName('');
    setCategory('Pengelolaan Aplikasi Informatika');
    setSla('');
    setSop('');
    setFormTemplate('standar');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-8 font-sans text-left">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="space-y-1.5">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Manajemen Layanan SPBE</h2>
          <p className="text-slate-500 text-base leading-relaxed">Kelola master data 28 Layanan SPBE, SLA waktu pengerjaan, dan tautan dokumen SOP.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-base font-bold transition-all"
        >
          <span>{showAddForm ? 'Batal' : 'Tambah Layanan'}</span>
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddService} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 max-w-xl">
          <h3 className="font-extrabold text-slate-800 text-lg">Tambah Layanan SPBE</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-bold text-slate-550 uppercase tracking-wider mb-1">Nama Layanan</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Layanan Jaringan Intra Pemerintah"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-base focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-550 uppercase tracking-wider mb-1">Kategori Proses Bisnis</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-base bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="Pengelolaan Aplikasi Informatika">Pengelolaan Aplikasi Informatika</option>
                <option value="Pengelolaan Sumber Daya & Perangkat Informatika">Pengelolaan Sumber Daya & Perangkat Informatika</option>
                <option value="Penerapan Persandian & Keamanan Informasi">Penerapan Persandian & Keamanan Informasi</option>
                <option value="Tata Kelola SPBE">Tata Kelola SPBE</option>
                <option value="Statistik Sektoral">Statistik Sektoral</option>
                <option value="Satu Data Daerah">Satu Data Daerah</option>
                <option value="Informasi & Komunikasi Publik">Informasi & Komunikasi Publik</option>
                <option value="Domain & Infrastruktur Pendukung">Domain & Infrastruktur Pendukung</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-550 uppercase tracking-wider mb-1">Target Waktu (SLA)</label>
              <input
                type="text"
                required
                value={sla}
                onChange={(e) => setSla(e.target.value)}
                placeholder="Contoh: 3 Hari Kerja"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-base focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-550 uppercase tracking-wider mb-1">Tautan Dokumen SOP</label>
              <input
                type="text"
                value={sop}
                onChange={(e) => setSop(e.target.value)}
                placeholder="sop-layanan.pdf"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-base focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-550 uppercase tracking-wider mb-1">Templat Formulir Pengajuan</label>
              <select
                value={formTemplate}
                onChange={(e) => setFormTemplate(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-base bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="standar">Formulir Standar (3 Field)</option>
                <option value="aplikasi">Formulir Layanan Aplikasi (4 Field)</option>
                <option value="server">Formulir Server & Hosting (6 Field)</option>
                <option value="jaringan">Formulir Jaringan & Infrastruktur (4 Field)</option>
                <option value="zoom">Formulir Webinar & Zoom Meeting (5 Field)</option>
                <option value="keamanan">Formulir Keamanan Informasi / VAPT (4 Field)</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-base font-bold transition-all"
          >
            Simpan Layanan
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-5 space-y-4 lg:sticky lg:top-6 shadow-sm">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider font-sans">Kategori SPBE</h3>
          </div>
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => setSelectedCategoryTab('all')}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold flex justify-between items-center transition-all ${
                selectedCategoryTab === 'all'
                  ? 'bg-sky-50 text-sky-700 border border-sky-100 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 border border-transparent'
              }`}
            >
              <span>Semua Kategori</span>
              <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-extrabold">
                {services.length}
              </span>
            </button>
            {categoriesList.map((catName) => {
              const count = services.filter(s => s.category === catName).length;
              const isSelected = selectedCategoryTab === catName;
              return (
                <button
                  key={catName}
                  type="button"
                  onClick={() => setSelectedCategoryTab(catName)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold flex justify-between items-center transition-all ${
                    isSelected
                      ? 'bg-sky-50 text-sky-700 border border-sky-100 shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <span className="truncate pr-2">{catName}</span>
                  <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-extrabold">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-9 space-y-6">
          {categoriesList.map((catName) => {
            if (selectedCategoryTab !== 'all' && selectedCategoryTab !== catName) return null;
            
            const catServices = services.filter((s) => s.category === catName);
            if (catServices.length === 0) return null;
            
            return (
              <div key={catName} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="bg-slate-50 border-b border-slate-200/60 px-6 py-4 flex justify-between items-center">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                    <h3 className="font-extrabold text-slate-800 text-base tracking-tight">{catName}</h3>
                  </div>
                  <span className="text-xs font-black bg-slate-200 text-slate-650 px-2.5 py-1 rounded-full border border-slate-300/40">
                    {catServices.length} Layanan
                  </span>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead>
                      <tr className="text-left text-sm font-bold text-slate-450 uppercase tracking-wider bg-slate-50/30">
                        <th className="px-6 py-3.5">Nama Layanan SPBE</th>
                        <th className="px-6 py-3.5">Target SLA</th>
                        <th className="px-6 py-3.5">Bukti SOP</th>
                        <th className="px-6 py-3.5 text-center">Formulir</th>
                        <th className="px-6 py-3.5 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-base text-slate-700">
                      {catServices.map((s) => (
                        <tr key={s.id} className="transition-all">
                          <td className="px-6 py-4 font-bold text-slate-800 leading-snug max-w-md">{s.name}</td>
                          <td className="px-6 py-4 font-semibold text-slate-600">{s.sla}</td>
                          <td className="px-6 py-4 text-sm font-mono">
                            <span className="text-sky-600 hover:underline cursor-pointer">{s.sop}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button 
                              type="button"
                              onClick={() => setSelectedPreviewService(s)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-sky-50 text-slate-700 hover:text-sky-700 border border-slate-200 hover:border-sky-200 rounded-xl text-xs font-bold transition-all shadow-sm"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>{getServiceFormFields(s.name, s.template).length} Field</span>
                            </button>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button 
                                type="button"
                                className="p-1.5 text-slate-400 hover:text-sky-600 rounded-lg hover:bg-sky-50 transition-all"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button 
                                type="button"
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedPreviewService && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 text-left">
            <div className="bg-slate-50 border-b border-slate-100 p-6 flex justify-between items-center">
              <div>
                <span className="text-xs font-extrabold text-sky-600 uppercase tracking-widest block mb-0.5 font-sans">Konfigurasi & Pratinjau Form</span>
                <h3 className="text-lg font-black text-slate-800 tracking-tight">{selectedPreviewService.name}</h3>
              </div>
              <button 
                onClick={() => setSelectedPreviewService(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
              <div className="bg-amber-50 border border-amber-200/70 p-4 rounded-2xl text-xs leading-relaxed text-amber-800 font-medium">
                <span className="font-extrabold uppercase tracking-wide block mb-1">💡 Informasi Best-Practice SPBE:</span>
                Setiap layanan SPBE memiliki kebutuhan form dinamis yang disesuaikan saat proses interview SOP. Di bawah ini adalah pratinjau rancangan kolom formulir yang akan diisi oleh OPD ketika mengajukan permohonan layanan ini.
              </div>

              <div className="space-y-4 bg-slate-50/50 border border-slate-200/60 p-5 rounded-2xl">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-100 pb-2 mb-3">Tampilan Formulir Pemohon (OPD)</span>
                {getServiceFormFields(selectedPreviewService.name, selectedPreviewService.template).map((field, index) => (
                  <div key={index} className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700 block">{field.label}</label>
                    {field.type === 'textarea' ? (
                      <textarea 
                        disabled
                        placeholder={field.placeholder}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder-slate-400 cursor-not-allowed focus:outline-none"
                        rows={3}
                      />
                    ) : field.type === 'select' ? (
                      <select 
                        disabled
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-650 cursor-not-allowed focus:outline-none"
                      >
                        {field.options.map((opt, oIdx) => (
                          <option key={oIdx}>{opt}</option>
                        ))}
                      </select>
                    ) : field.type === 'file' ? (
                      <div className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-dashed border-slate-350 rounded-xl text-sm text-slate-450 cursor-not-allowed">
                        <span className="font-semibold text-slate-400">{field.label} (PDF, Maks 5MB)</span>
                        <span className="text-xs font-bold text-sky-600 bg-sky-50 px-2 py-1 rounded-md border border-sky-100">Upload Dokumen</span>
                      </div>
                    ) : (
                      <input 
                        type={field.type}
                        disabled
                        placeholder={field.placeholder}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder-slate-400 cursor-not-allowed focus:outline-none"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-50 border-t border-slate-100 p-5 flex justify-end gap-3">
              <button 
                onClick={() => setSelectedPreviewService(null)}
                className="px-5 py-2.5 bg-slate-200 hover:bg-slate-350 text-slate-700 rounded-xl text-sm font-bold transition-all"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
