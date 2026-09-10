import React, { useState } from 'react';
import { Edit2, Trash2, Eye, X, Search, FileText, FileCheck, Upload, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SopModal } from '../../components/SopModal';

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

const parseSlaValues = (slaStr) => {
  if (!slaStr) return { min: '', max: '' };
  const rangeMatch = String(slaStr).match(/(\d+)\s*-\s*(\d+)/);
  if (rangeMatch) {
    return { min: rangeMatch[1], max: rangeMatch[2] };
  }
  const singleMatch = String(slaStr).match(/(\d+)/);
  if (singleMatch) {
    return { min: singleMatch[1], max: '' };
  }
  return { min: '', max: '' };
};

const formatSlaString = (min, max) => {
  const minClean = String(min || '').trim();
  const maxClean = String(max || '').trim();
  if (minClean && maxClean && minClean !== maxClean) {
    return `${minClean}-${maxClean} Hari`;
  }
  if (minClean) {
    return `${minClean} Hari`;
  }
  return '7 Hari';
};

export const ManageServices = () => {
  const { services, setServices } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Pengelolaan Aplikasi Informatika');
  const [slaMin, setSlaMin] = useState('');
  const [slaMax, setSlaMax] = useState('');
  const [fieldCount, setFieldCount] = useState(4);
  const [sop, setSop] = useState('');
  const [requiredDocs, setRequiredDocs] = useState('');
  const [requiresHelpdesk, setRequiresHelpdesk] = useState(true);
  const [serviceStatus, setServiceStatus] = useState('Aktif');
  const [formTemplate, setFormTemplate] = useState('standar');
  const [selectedPreviewService, setSelectedPreviewService] = useState(null);
  const [selectedCategoryTab, setSelectedCategoryTab] = useState('all');
  const [selectedVerificationFilter, setSelectedVerificationFilter] = useState('all');
  const [viewingSop, setViewingSop] = useState(null);

  const [editingService, setEditingService] = useState(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editSlaMin, setEditSlaMin] = useState('');
  const [editSlaMax, setEditSlaMax] = useState('');
  const [editFieldCount, setEditFieldCount] = useState(4);
  const [editSop, setEditSop] = useState('');
  const [editRequiredDocs, setEditRequiredDocs] = useState('');
  const [editRequiresHelpdesk, setEditRequiresHelpdesk] = useState(true);
  const [editStatus, setEditStatus] = useState('Aktif');

  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

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

  const toggleServiceStatus = (id) => {
    setServices(prev => prev.map(s => {
      if (s.id === id) {
        const nextStatus = s.status === 'Aktif' ? 'Tahap Pengembangan' : 'Aktif';
        return { ...s, status: nextStatus };
      }
      return s;
    }));
  };

  const toggleServiceVerification = (id) => {
    setServices(prev => prev.map(s => {
      if (s.id === id) {
        const currentReq = s.requiresHelpdesk !== false;
        return { ...s, requiresHelpdesk: !currentReq };
      }
      return s;
    }));
  };

  const toggleCategoryStatus = (catName) => {
    const catServices = services.filter(s => s.category === catName);
    const allActive = catServices.every(s => s.status === 'Aktif');
    const nextStatus = allActive ? 'Tahap Pengembangan' : 'Aktif';
    setServices(prev => prev.map(s => {
      if (s.category === catName) {
        return { ...s, status: nextStatus };
      }
      return s;
    }));
  };

  const handleOpenEdit = (s) => {
    const slaVals = parseSlaValues(s.sla);
    const initialFieldCount = s.fieldCount || getServiceFormFields(s.name, s.template).length || 4;
    setEditingService(s);
    setEditName(s.name);
    setEditCategory(s.category);
    setEditSlaMin(slaVals.min);
    setEditSlaMax(slaVals.max);
    setEditFieldCount(initialFieldCount);
    setEditSop(s.sop || 'sop_layanan.pdf');
    setEditRequiredDocs(s.requiredDocs || '');
    setEditRequiresHelpdesk(s.requiresHelpdesk !== false);
    setEditStatus(s.status || 'Tahap Pengembangan');
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    const formattedSla = formatSlaString(editSlaMin, editSlaMax);
    const parsedFieldCount = parseInt(editFieldCount, 10) || 4;
    setServices(prev => prev.map(s => {
      if (s.id === editingService.id) {
        return {
          ...s,
          name: editName,
          category: editCategory,
          sla: formattedSla,
          fieldCount: parsedFieldCount,
          sop: editSop.trim() || 'sop_layanan.pdf',
          requiredDocs: editRequiredDocs.trim() || 'Surat Permohonan Resmi OPD, KAK / Dokumen Pendukung',
          requiresHelpdesk: editRequiresHelpdesk,
          status: editStatus
        };
      }
      return s;
    }));
    setEditingService(null);
  };

  const handleDeleteService = (id) => {
    setServices(prev => prev.filter(s => s.id !== id));
    setDeleteConfirmId(null);
  };

  const handleAddService = (e) => {
    e.preventDefault();
    const formattedSla = formatSlaString(slaMin, slaMax);
    const parsedFieldCount = parseInt(fieldCount, 10) || 4;
    const newService = {
      id: services.length + 1,
      name,
      category,
      sla: formattedSla,
      fieldCount: parsedFieldCount,
      sop: sop.trim() || 'sop_layanan.pdf',
      requiredDocs: requiredDocs.trim() || 'Surat Permohonan Resmi OPD, KAK / Dokumen Pendukung',
      requiresHelpdesk,
      template: formTemplate,
      status: serviceStatus
    };
    setServices([...services, newService]);
    setName('');
    setCategory('Pengelolaan Aplikasi Informatika');
    setSlaMin('');
    setSlaMax('');
    setFieldCount(4);
    setSop('');
    setRequiredDocs('');
    setRequiresHelpdesk(true);
    setServiceStatus('Aktif');
    setFormTemplate('standar');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-8 font-sans text-left">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="space-y-1.5">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Manajemen Layanan SPBE</h2>
          <p className="text-slate-500 text-base leading-relaxed">
            Kelola master data Layanan SPBE, SLA waktu pengerjaan, verifikasi helpdesk, dokumen persyaratan, dan SOP pelayanan.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative min-w-[260px] sm:min-w-[320px]">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama sub-layanan SPBE..."
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium text-slate-800 shadow-sm"
            />
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-base font-bold transition-all shadow-sm cursor-pointer"
          >
            <span>{showAddForm ? 'Batal' : 'Tambah Layanan'}</span>
          </button>
        </div>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddService} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-md space-y-5 max-w-2xl animate-in fade-in duration-200">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-black text-slate-800 text-lg tracking-tight">Tambah Layanan SPBE</h3>
            <p className="text-xs text-slate-500 mt-0.5">Konfigurasi sub-layanan baru, rentang SLA hari pengerjaan, verifikasi helpdesk, dan jumlah parameter field formulir.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nama Layanan</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Layanan Jaringan Intra Pemerintah"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-sky-500 font-semibold"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Kategori Proses Bisnis</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 font-semibold"
              >
                {categoriesList.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Jumlah Field Formulir</label>
              <input
                type="number"
                min="1"
                max="20"
                required
                value={fieldCount}
                onChange={(e) => setFieldCount(e.target.value)}
                placeholder="4"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-sky-500 font-semibold"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Target Waktu (SLA)</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      required
                      value={slaMin}
                      onChange={(e) => setSlaMin(e.target.value)}
                      placeholder="Contoh: 7"
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-sky-500 font-semibold pr-12"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      Hari
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Hari minimal / target pasti</p>
                </div>
                <div>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      value={slaMax}
                      onChange={(e) => setSlaMax(e.target.value)}
                      placeholder="Contoh: 10 (Opsional)"
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-sky-500 font-semibold pr-12"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      Hari
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Hari maksimal (rentang)</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Verifikasi Helpdesk</label>
              <select
                value={requiresHelpdesk ? 'true' : 'false'}
                onChange={(e) => setRequiresHelpdesk(e.target.value === 'true')}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 font-semibold"
              >
                <option value="true">Wajib Verifikasi Manual Helpdesk</option>
                <option value="false">Otomatis Langsung Diproses (Bypass)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Status Layanan</label>
              <select
                value={serviceStatus}
                onChange={(e) => setServiceStatus(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 font-semibold"
              >
                <option value="Aktif">Aktif (Dapat Diajukan Pemohon)</option>
                <option value="Tahap Pengembangan">Tahap Pengembangan</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Unggah Dokumen SOP (PDF)</label>
              <div className="border border-slate-200 bg-slate-50/80 rounded-2xl p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                      <FileCheck className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{sop || 'sop_layanan.pdf'}</p>
                      <span className="text-[10px] font-bold text-emerald-600">Dokumen PDF Terpilih</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setViewingSop({ name: name || 'Layanan Baru', sop: sop || 'sop_layanan.pdf' })}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer shadow-2xs"
                  >
                    Lihat PDF
                  </button>
                </div>
                <label className="flex items-center justify-center gap-2 py-2 px-3 border border-dashed border-sky-300 hover:border-sky-500 rounded-xl bg-white hover:bg-sky-50/50 cursor-pointer transition-all text-xs font-bold text-sky-700">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Pilih Berkas PDF SOP</span>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setSop(file.name);
                      }
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Templat Formulir Dasar</label>
              <select
                value={formTemplate}
                onChange={(e) => setFormTemplate(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 font-semibold"
              >
                <option value="standar">Formulir Standar (Umum)</option>
                <option value="aplikasi">Formulir Layanan Aplikasi</option>
                <option value="server">Formulir Server & Hosting</option>
                <option value="jaringan">Formulir Jaringan & Infrastruktur</option>
                <option value="zoom">Formulir Webinar & Zoom Meeting</option>
                <option value="keamanan">Formulir Keamanan Informasi / VAPT</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Dokumen yang Harus Disiapkan Pemohon</label>
              <textarea
                rows={2}
                value={requiredDocs}
                onChange={(e) => setRequiredDocs(e.target.value)}
                placeholder="Contoh: Surat Permohonan Resmi OPD, KAK / Kerangka Acuan Kerja, Berkas Pendukung"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-sky-500 font-medium"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-5 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-bold transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-all shadow-md cursor-pointer"
            >
              Simpan Layanan
            </button>
          </div>
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
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3 shadow-2xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mr-1">Filter Verifikasi:</span>
              <button
                type="button"
                onClick={() => setSelectedVerificationFilter('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  selectedVerificationFilter === 'all'
                    ? 'bg-sky-50 text-sky-700 border-sky-200 shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-200'
                }`}
              >
                Semua Layanan ({services.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedVerificationFilter('manual')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                  selectedVerificationFilter === 'manual'
                    ? 'bg-sky-50 text-sky-700 border-sky-200 shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-200'
                }`}
              >
                <span>Wajib Verifikasi Manual ({services.filter(s => s.requiresHelpdesk !== false).length})</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedVerificationFilter('auto')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                  selectedVerificationFilter === 'auto'
                    ? 'bg-sky-50 text-sky-700 border-sky-200 shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-200'
                }`}
              >
                <span>Otomatis Diproses ({services.filter(s => s.requiresHelpdesk === false).length})</span>
              </button>
            </div>
          </div>

          {categoriesList.map((catName) => {
            if (selectedCategoryTab !== 'all' && selectedCategoryTab !== catName) return null;
            
            const query = searchQuery.toLowerCase().trim();
            const catServices = services.filter((s) => {
              const matchesCategory = s.category === catName;
              const matchesVerif = 
                selectedVerificationFilter === 'all' ||
                (selectedVerificationFilter === 'manual' && s.requiresHelpdesk !== false) ||
                (selectedVerificationFilter === 'auto' && s.requiresHelpdesk === false);
              const reqLabel = s.requiresHelpdesk !== false ? 'wajib verifikasi manual helpdesk' : 'otomatis langsung diproses';
              const matchesQuery = query === '' || 
                s.name.toLowerCase().includes(query) || 
                (s.sla && s.sla.toLowerCase().includes(query)) ||
                reqLabel.includes(query);
              return matchesCategory && matchesVerif && matchesQuery;
            });

            if (catServices.length === 0 && query !== '') return null;
            if (catServices.length === 0 && selectedCategoryTab === catName) {
              return (
                <div key={catName} className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 font-medium">
                  Belum ada layanan untuk kategori ini.
                </div>
              );
            }
            if (catServices.length === 0) return null;
            
            return (
              <div key={catName} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="bg-slate-50 border-b border-slate-200/60 px-6 py-4 flex justify-between items-center flex-wrap gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${catServices.some(s => s.status === 'Aktif') ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                    <h3 className="font-extrabold text-slate-800 text-base tracking-tight">{catName}</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggleCategoryStatus(catName)}
                      className="text-xs font-bold text-sky-600 hover:text-sky-800 hover:underline transition-all cursor-pointer"
                    >
                      {catServices.every(s => s.status === 'Aktif') ? 'Set Semua Tahap Pengembangan' : 'Set Semua Aktif'}
                    </button>
                    <span className="text-xs font-black bg-slate-200 text-slate-650 px-2.5 py-1 rounded-full border border-slate-300/40">
                      {catServices.length} Layanan ({catServices.filter(s => s.status === 'Aktif').length} Aktif)
                    </span>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead>
                      <tr className="text-left text-xs font-extrabold text-slate-500 uppercase tracking-wider bg-slate-50/70">
                        <th className="px-5 py-3.5">Sub-Layanan SPBE</th>
                        <th className="px-5 py-3.5">Dokumen Persyaratan</th>
                        <th className="px-5 py-3.5">SOP Pelayanan</th>
                        <th className="px-5 py-3.5">Target SLA</th>
                        <th className="px-5 py-3.5 text-center">Jumlah Field</th>
                        <th className="px-5 py-3.5 text-center">Verifikasi Helpdesk</th>
                        <th className="px-5 py-3.5 text-center">Status</th>
                        <th className="px-5 py-3.5 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                      {catServices.map((s) => (
                        <tr key={s.id} className="transition-all hover:bg-slate-50/60">
                          <td className="px-5 py-4 max-w-[220px]">
                            <p className="font-extrabold text-slate-900 leading-snug text-sm">{s.name}</p>
                          </td>
                          <td className="px-5 py-4 max-w-[240px]">
                            <div className="flex items-start gap-1.5 text-xs text-slate-650 leading-relaxed font-medium">
                              <FileText className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                              <span className="line-clamp-2" title={s.requiredDocs || 'Surat Permohonan Resmi OPD, KAK / Dokumen Pendukung'}>
                                {s.requiredDocs || 'Surat Permohonan Resmi OPD, KAK / Dokumen Pendukung'}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-xs font-mono">
                            <button
                              type="button"
                              onClick={() => setViewingSop(s)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 hover:text-sky-900 rounded-xl border border-sky-200 font-bold transition-all max-w-[170px] truncate cursor-pointer shadow-2xs group"
                              title="Klik untuk melihat dokumen SOP PDF"
                            >
                              <FileCheck className="w-3.5 h-3.5 text-sky-600 shrink-0 group-hover:scale-110 transition-transform" />
                              <span className="truncate">{s.sop || 'sop_layanan.pdf'}</span>
                              <ExternalLink className="w-3 h-3 text-sky-500 ml-0.5 opacity-70 group-hover:opacity-100 shrink-0" />
                            </button>
                          </td>
                          <td className="px-5 py-4 text-sm font-bold text-slate-700 whitespace-nowrap">
                            {s.sla}
                          </td>
                          <td className="px-5 py-4 text-center">
                            <button 
                              type="button"
                              onClick={() => setSelectedPreviewService(s)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-sky-50 text-slate-700 hover:text-sky-700 border border-slate-200 hover:border-sky-200 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-400" />
                              <span>{s.fieldCount || getServiceFormFields(s.name, s.template).length || 4} Field</span>
                            </button>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <button 
                              type="button"
                              onClick={() => toggleServiceVerification(s.id)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                                s.requiresHelpdesk !== false
                                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 shadow-2xs'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 shadow-2xs'
                              }`}
                              title={s.requiresHelpdesk !== false ? 'Klik untuk toggle: Otomatis Langsung Diproses' : 'Klik untuk toggle: Wajib Verifikasi Manual Helpdesk'}
                            >
                              <span className={`w-2 h-2 rounded-full ${s.requiresHelpdesk !== false ? 'bg-indigo-500' : 'bg-emerald-500'}`}></span>
                              <span>{s.requiresHelpdesk !== false ? 'Wajib Verifikasi' : 'Otomatis Diproses'}</span>
                            </button>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <button 
                              type="button"
                              onClick={() => toggleServiceStatus(s.id)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                                s.status === 'Aktif'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 shadow-2xs'
                                  : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 shadow-2xs'
                              }`}
                              title="Klik untuk mengubah status aktif / tahap pengembangan"
                            >
                              <span className={`w-2 h-2 rounded-full ${s.status === 'Aktif' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                              <span>{s.status || 'Tahap Pengembangan'}</span>
                            </button>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button 
                                type="button"
                                onClick={() => handleOpenEdit(s)}
                                className="p-1.5 text-slate-400 hover:text-sky-600 rounded-lg hover:bg-sky-50 transition-all cursor-pointer"
                                title="Edit Layanan"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button 
                                type="button"
                                onClick={() => setDeleteConfirmId(s.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all cursor-pointer"
                                title="Hapus Layanan"
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
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
              <div className="bg-amber-50 border border-amber-200/70 p-4 rounded-2xl text-xs leading-relaxed text-amber-800 font-medium">
                <span className="font-extrabold uppercase tracking-wide block mb-1">💡 Informasi Best-Practice SPBE:</span>
                Setiap layanan SPBE memiliki form dinamis sesuai SOP. Pratinjau berikut menampilkan rancangan kolom formulir yang akan diisi pemohon ({selectedPreviewService.fieldCount || getServiceFormFields(selectedPreviewService.name, selectedPreviewService.template).length || 4} Field).
              </div>

              <div className="space-y-4 bg-slate-50/50 border border-slate-200/60 p-5 rounded-2xl">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-100 pb-2 mb-3">
                  Tampilan Formulir Pemohon ({selectedPreviewService.fieldCount || getServiceFormFields(selectedPreviewService.name, selectedPreviewService.template).length || 4} Field)
                </span>
                {(() => {
                  const baseFields = getServiceFormFields(selectedPreviewService.name, selectedPreviewService.template);
                  const targetCount = selectedPreviewService.fieldCount || baseFields.length || 4;
                  let displayFields = [...baseFields];
                  if (displayFields.length < targetCount) {
                    for (let i = displayFields.length + 1; i <= targetCount; i++) {
                      displayFields.push({
                        label: `Field Kebutuhan Teknis #${i}`,
                        type: 'text',
                        placeholder: `Isi parameter teknis ke-${i}...`
                      });
                    }
                  } else if (displayFields.length > targetCount) {
                    displayFields = displayFields.slice(0, targetCount);
                  }

                  return displayFields.map((field, index) => (
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
                          {(field.options || ['Opsi 1', 'Opsi 2']).map((opt, oIdx) => (
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
                  ));
                })()}
              </div>
            </div>

            <div className="bg-slate-50 border-t border-slate-100 p-5 flex justify-end gap-3">
              <button 
                onClick={() => setSelectedPreviewService(null)}
                className="px-5 py-2.5 bg-slate-200 hover:bg-slate-350 text-slate-700 rounded-xl text-sm font-bold transition-all cursor-pointer"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}

      {editingService && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-xl w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 text-left">
            <div className="bg-slate-50 border-b border-slate-100 p-6 flex justify-between items-center">
              <div>
                <span className="text-xs font-extrabold text-sky-600 uppercase tracking-widest block mb-0.5 font-sans">Edit Layanan SPBE</span>
                <h3 className="text-lg font-black text-slate-800 tracking-tight">{editingService.name}</h3>
              </div>
              <button 
                onClick={() => setEditingService(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nama Layanan</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-sky-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Kategori Proses Bisnis</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 font-semibold"
                  >
                    {categoriesList.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Jumlah Field Formulir</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    required
                    value={editFieldCount}
                    onChange={(e) => setEditFieldCount(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-sky-500 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Target Waktu (SLA)</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        required
                        value={editSlaMin}
                        onChange={(e) => setEditSlaMin(e.target.value)}
                        placeholder="Contoh: 7"
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-sky-500 font-semibold pr-12"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        Hari
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">Hari minimal / target pasti</p>
                  </div>
                  <div>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        value={editSlaMax}
                        onChange={(e) => setEditSlaMax(e.target.value)}
                        placeholder="Contoh: 10 (Opsional)"
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-sky-500 font-semibold pr-12"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        Hari
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">Hari maksimal (rentang)</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Verifikasi Helpdesk</label>
                  <select
                    value={editRequiresHelpdesk ? 'true' : 'false'}
                    onChange={(e) => setEditRequiresHelpdesk(e.target.value === 'true')}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 font-semibold"
                  >
                    <option value="true">Wajib Verifikasi Manual Helpdesk</option>
                    <option value="false">Otomatis Langsung Diproses (Bypass)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Status Layanan</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 font-semibold"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Tahap Pengembangan">Tahap Pengembangan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Unggah Dokumen SOP (PDF)</label>
                <div className="border border-slate-200 bg-slate-50/80 rounded-2xl p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                        <FileCheck className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{editSop || 'sop_layanan.pdf'}</p>
                        <span className="text-[10px] font-bold text-emerald-600">Dokumen PDF Terpasang</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setViewingSop({ name: editName || 'Pratinjau SOP', sop: editSop || 'sop_layanan.pdf' })}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer shadow-2xs"
                    >
                      Lihat PDF
                    </button>
                  </div>
                  <label className="flex items-center justify-center gap-2 py-2 px-3 border border-dashed border-sky-300 hover:border-sky-500 rounded-xl bg-white hover:bg-sky-50/50 cursor-pointer transition-all text-xs font-bold text-sky-700">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Ganti / Unggah Berkas PDF SOP</span>
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setEditSop(file.name);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Dokumen yang Harus Disiapkan Pemohon</label>
                <textarea
                  rows={2}
                  value={editRequiredDocs}
                  onChange={(e) => setEditRequiredDocs(e.target.value)}
                  placeholder="Contoh: Surat Permohonan Resmi OPD, KAK / Kerangka Acuan Kerja, Berkas Pendukung"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-sky-500 font-medium"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingService(null)}
                  className="px-5 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl font-bold text-sm transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-sm transition-all shadow-md cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-sm w-full p-6 shadow-2xl space-y-4 text-center animate-in fade-in zoom-in duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-extrabold text-slate-800 text-lg">Yakin untuk menghapus?</h4>
              <p className="text-xs text-slate-500">Layanan ini akan dihapus dari daftar master data SPBE.</p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl font-bold text-xs transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleDeleteService(deleteConfirmId)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs transition-all cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      <SopModal
        isOpen={!!viewingSop}
        onClose={() => setViewingSop(null)}
        serviceName={viewingSop?.name}
        sopFileName={viewingSop?.sop}
        fileUrl="/sop_layanan.pdf"
      />
    </div>
  );
};
