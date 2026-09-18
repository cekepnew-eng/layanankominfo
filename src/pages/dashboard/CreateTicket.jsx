import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, FileText, FileCheck, Upload, ChevronRight, ArrowLeft, Clock, AlertTriangle, Search, CheckCircle2, Eye } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getCurrentDateFormatted, getCurrentLogTimeFormatted } from '../../utils/dateUtils';
import { SkmModal } from '../../components/SkmModal';
import { SopModal } from '../../components/SopModal';
import { api } from '../../services/api';
import { ActionModal } from '../../components/ActionModal';

export const CreateTicket = () => {
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tickets, setTickets] = useState([]);
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const svcRes = await api.getPublicServices();
        setServices(svcRes.data || []);
        if (svcRes.categories) {
          setCategories(svcRes.categories);
        }
        const tktRes = await api.getMyTickets();
        setTickets(tktRes.data || []);
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, []);
  
  const [selectedSubService, setSelectedSubService] = useState('');
  const [subSearchQuery, setSubSearchQuery] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [formData, setFormData] = useState({});
  const [uploadedFile, setUploadedFile] = useState('');
  const [uploadedFileSize, setUploadedFileSize] = useState('');
  const [uploadedFileUrl, setUploadedFileUrl] = useState('/dokumen_permohonan.pdf');
  const [showSkmModal, setShowSkmModal] = useState(false);
  const [viewingSop, setViewingSop] = useState(null);
  const fileInputRef = useRef(null);
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [helpdeskInstansi, setHelpdeskInstansi] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdTicketId, setCreatedTicketId] = useState('');
  const [inactiveCategoryNotice, setInactiveCategoryNotice] = useState('');

  const activeTicket = (user?.role === 'USER' || user?.role === 'MASYARAKAT' || user?.role === 'masyarakat') 
    ? tickets.find(t => t.status_name !== 'COMPLETED' && t.status_name !== 'REJECTED')
    : null;

  const handleCompleteSkm = (t) => {
    setTickets(prev => prev.map(ticket => {
      if (ticket.id === t.id) {
        return {
          ...ticket,
          rating: {
            speed: 5,
            result: 5,
            communication: 5,
            quality: 5,
            comment: 'Survei SKM MenPAN-RB telah diisi oleh pemohon.',
            skm: { completed: true }
          },
          logs: [
            { date: getCurrentLogTimeFormatted(0), text: 'Pemohon telah mengisi dan menyelesaikan Survei Kepuasan Masyarakat (SKM) MenPAN-RB.' },
            ...(ticket.logs || [])
          ]
        };
      }
      return ticket;
    }));
    setShowSkmModal(false);
  };



  const subServicesAptikaOPD = [
    'Pembuatan Aplikasi Baru (Web/Mobile)',
    'Penambahan Fitur Aplikasi Dinas',
    'Perbaikan Bug / Error Sistem',
    'Integrasi Single Sign-On (SSO) TND',
    'Pengajuan Integrasi API SPLP',
    'Pemeliharaan Server Aplikasi Dinas',
    'Migrasi Server / Database Aplikasi',
    'Pemasangan SSL (HTTPS) Domain Dinas',
    'Permohonan Rekomendasi Aplikasi Baru',
    'Evaluasi Kelayakan Sistem Aplikasi',
    'Uji Kesesuaian Sistem (UKS) Tahap Awal',
    'Uji Kesesuaian Sistem (UKS) Pasca Uji Coba',
    'Uji Celah Keamanan (Vulnerability Assessment)',
    'Simulasi Serangan Siber (Penetration Testing)',
    'Audit Kode Sumber Aplikasi (Code Review)',
    'Pendampingan Teknis Penggunaan Aplikasi',
    'Pembuatan Akun Portal Layanan Digital',
    'Penyusunan Arsitektur SPBE Dinas',
    'Sosialisasi Pengisian Metadata Statistik',
    'Pengajuan Domain Instansi Baru',
    'Peminjaman Lisensi Webinar Zoom Dinas',
    'Setup Virtual Machine Server (Hosting)',
    'Penyelidikan Insiden Kebocoran Data (CSIRT)',
    'Pelatihan Keamanan Informasi Staf (Security Awareness)',
    'Upgrade Bandwidth Internet Gedung Dinas',
    'Pemasangan Switch Hub Tambahan TIK',
    'Audit Akses Jaringan Dinas',
    'Konfigurasi Peta Rencana TI Daerah',
    'Pemulihan Data Backup Server'
  ];

  const subServicesMasyarakat = [
    'Pengaduan Koneksi Wifi Publik',
    'Permintaan Data Dataset Sektoral',
    'Sosialisasi Layanan Digital Publik',
    'Permohonan Informasi Publik PPID'
  ];

  const activeSubServices = (user?.role === 'MASYARAKAT' || user?.role === 'masyarakat') ? subServicesMasyarakat : subServicesAptikaOPD;

  const isCategoryActive = (catName) => {
    const catServices = services.filter(s => s.category === catName);
    return catServices.some(s => s.status === 'Aktif');
  };

  const getSubServicesForCategory = (cat) => {
    if (!cat) return [];
    if (cat.name === 'Pengelolaan Aplikasi Informatika') {
      return (user?.role === 'MASYARAKAT' || user?.role === 'masyarakat') ? subServicesMasyarakat : subServicesAptikaOPD;
    }
    return services.filter(s => s.category === cat.name).map(s => s.name);
  };

  const APTIKA_SERVICE_MAPPING = {
    'Pembuatan Aplikasi Baru (Web/Mobile)': 'Pengembangan & Pengelolaan Aplikasi',
    'Penambahan Fitur Aplikasi Dinas': 'Pengembangan & Pengelolaan Aplikasi',
    'Perbaikan Bug / Error Sistem': 'Pengembangan & Pengelolaan Aplikasi',
    'Integrasi Single Sign-On (SSO) TND': 'Integrasi & Interoperabilitas SPBE',
    'Pengajuan Integrasi API SPLP': 'Integrasi & Interoperabilitas SPBE',
    'Pemeliharaan Server Aplikasi Dinas': 'Server Perangkat Daerah',
    'Migrasi Server / Database Aplikasi': 'Server Perangkat Daerah',
    'Pemasangan SSL (HTTPS) Domain Dinas': 'Domain & Subdomain Pemerintah Daerah',
    'Permohonan Rekomendasi Aplikasi Baru': 'Rekomendasi & Evaluasi Aplikasi',
    'Evaluasi Kelayakan Sistem Aplikasi': 'Rekomendasi & Evaluasi Aplikasi',
    'Uji Kesesuaian Sistem (UKS) Tahap Awal': 'Uji Kesesuaian Sistem (UKS)',
    'Uji Kesesuaian Sistem (UKS) Pasca Uji Coba': 'Uji Kesesuaian Sistem (UKS)',
    'Uji Celah Keamanan (Vulnerability Assessment)': 'Keamanan Aplikasi / VAPT',
    'Simulasi Serangan Siber (Penetration Testing)': 'Keamanan Aplikasi / VAPT',
    'Audit Kode Sumber Aplikasi (Code Review)': 'Keamanan Aplikasi / VAPT',
    'Pendampingan Teknis Penggunaan Aplikasi': 'Peningkatan Kapasitas SDM TIK',
    'Pembuatan Akun Portal Layanan Digital': 'Portal Pelayanan Digital',
    'Penyusunan Arsitektur SPBE Dinas': 'Arsitektur & Peta Rencana SPBE',
    'Sosialisasi Pengisian Metadata Statistik': 'Statistik Sektoral',
    'Pengajuan Domain Instansi Baru': 'Domain & Subdomain Pemerintah Daerah',
    'Peminjaman Lisensi Webinar Zoom Dinas': 'Video Conference / Zoom',
    'Setup Virtual Machine Server (Hosting)': 'Server Perangkat Daerah',
    'Penyelidikan Insiden Kebocoran Data (CSIRT)': 'CSIRT / Respons Insiden',
    'Pelatihan Keamanan Informasi Staf (Security Awareness)': 'Security Awareness',
    'Upgrade Bandwidth Internet Gedung Dinas': 'Jaringan Intra Pemerintah',
    'Pemasangan Switch Hub Tambahan TIK': 'Perangkat Jaringan & Komunikasi',
    'Audit Akses Jaringan Dinas': 'Audit Teknologi Informasi',
    'Konfigurasi Peta Rencana TI Daerah': 'Arsitektur & Peta Rencana SPBE',
    'Pemulihan Data Backup Server': 'Server Perangkat Daerah',
    
    // Masyarakat Mapping
    'Pengaduan Koneksi Wifi Publik': 'Wifi Publik',
    'Permintaan Data Dataset Sektoral': 'Statistik Sektoral',
    'Sosialisasi Layanan Digital Publik': 'Informasi & Komunikasi Publik',
    'Permohonan Informasi Publik PPID': 'Pelayanan Informasi Publik'
  };

  const handleSelectCategory = (cat) => {
    setSelectedCategory(cat);
    setSubSearchQuery('');
    const availableSubs = getSubServicesForCategory(cat);
    setSelectedSubService(availableSubs[0] || cat.name);
    setStep(2);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file.name);
      setUploadedFileSize((file.size / 1024).toFixed(1) + ' KB');
      const url = URL.createObjectURL(file);
      setUploadedFileUrl(url);
    }
  };

  const handleFormPreSubmit = (e) => {
    e.preventDefault();
    setShowConfirmModal(true);
  };

  const handleExecuteSubmit = async () => {
    setShowConfirmModal(false);
    
    const actualServiceName = APTIKA_SERVICE_MAPPING[selectedSubService] || selectedSubService;
    const serviceObj = (services || []).find(s => s.name === actualServiceName);
    
    if (!serviceObj) {
      alert(`Error: Layanan terkait '${selectedSubService}' tidak ditemukan di database. Pastikan database Anda mutakhir.`);
      setIsSubmitting(false);
      return;
    }
    
    const service_id = serviceObj.id;

    const payload = {
      service_id,
      title: formData['Judul Permohonan'] || title || `Permohonan ${selectedSubService}`,
      description: formData['Deskripsi Kebutuhan'] || description || `Detail pengerjaan untuk sub-layanan ${selectedSubService}`,
      details: formData,
      priority: 'MEDIUM'
    };

    try {
      const res = await api.createTicket(payload);
      if (res && res.data) {
        setCreatedTicketId(res.data.id || `REQ-2026-0${Math.floor(132 + Math.random() * 800)}`);
      }
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Gagal menyimpan ke database backend', err);
      alert('Gagal mengirim tiket: ' + err.message);
    }
  };

  if (activeTicket) {
    return (
      <div className="max-w-xl mx-auto bg-white p-8 rounded-3xl border border-slate-200 shadow-xl text-center space-y-6 mt-8 font-sans">
        <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center border border-amber-100 mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Tiket Sedang Berjalan</h3>
          <p className="text-slate-500 text-base leading-relaxed">
            Anda masih memiliki tiket yang belum selesai (<strong>{activeTicket.ticket_number || activeTicket.id} - {activeTicket.service_name}</strong>). Harap tunggu atau selesaikan tiket tersebut (SKM/Rating) sebelum mengajukan tiket baru.
          </p>
        </div>
        <div className="pt-2 flex flex-col gap-3">
          <button 
            onClick={() => navigate('/dashboard/history')}
            className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md shadow-sky-200"
          >
            Lihat Tiket Saya
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto font-sans space-y-8 text-left animate-in fade-in duration-200">
      <div className="space-y-1.5">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Ajukan Layanan SPBE</h2>
        <p className="text-slate-500 text-base leading-relaxed mt-1.5">Ikuti langkah mudah untuk mengajukan permohonan digitalisasi layanan Anda.</p>
      </div>

      <div className="flex items-center justify-between bg-white p-5 rounded-xl border border-slate-200 shadow-sm text-base font-bold text-slate-400 uppercase tracking-wider">
        <div className={`flex items-center gap-2.5 ${step >= 1 ? 'text-sky-600' : ''}`}>
          <span className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 1 ? 'border-sky-600 bg-sky-50 font-bold' : 'border-slate-300'}`}>1</span>
          <span>Pilih Kategori</span>
        </div>
        <div className="w-12 h-0.5 bg-slate-200"></div>
        <div className={`flex items-center gap-2.5 ${step >= 2 ? 'text-sky-600' : ''}`}>
          <span className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 2 ? 'border-sky-600 bg-sky-50 font-bold' : 'border-slate-300'}`}>2</span>
          <span>Pilih Sub-layanan</span>
        </div>
        <div className="w-12 h-0.5 bg-slate-200"></div>
        <div className={`flex items-center gap-2.5 ${step >= 3 ? 'text-sky-600' : ''}`}>
          <span className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 3 ? 'border-sky-600 bg-sky-50 font-bold' : 'border-slate-300'}`}>3</span>
          <span>Detail Formulir</span>
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <h3 className="font-extrabold text-slate-800 text-lg">Langkah 1: Pilih Kategori Layanan SPBE</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map((cat) => {
              const catServices = services.filter(s => s.category === cat.name);
              const activeCount = catServices.filter(s => s.status === 'Aktif').length;
              const active = activeCount > 0;
              return (
                <div
                  key={cat.id}
                  onClick={() => {
                    if (active) {
                      handleSelectCategory(cat);
                    } else {
                      setInactiveCategoryNotice(cat.name);
                    }
                  }}
                  className={`bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all flex justify-between items-center group ${
                    active 
                      ? 'hover:border-sky-500 hover:shadow-md cursor-pointer' 
                      : 'opacity-65 cursor-not-allowed bg-slate-50'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className={`font-bold text-base transition-all ${active ? 'text-slate-800 group-hover:text-sky-600' : 'text-slate-550'}`}>{cat.name}</h4>
                      {!active ? (
                        <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[10px] font-bold uppercase tracking-wider">
                          Tahap Pengembangan
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold uppercase tracking-wider">
                          Aktif
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-400">
                      {cat.name === 'Pengelolaan Aplikasi Informatika' ? 
                        `${(user?.role === 'MASYARAKAT' || user?.role === 'masyarakat') ? subServicesMasyarakat.length : subServicesAptikaOPD.length} Layanan Terhubung (${activeCount > 0 ? ((user?.role === 'MASYARAKAT' || user?.role === 'masyarakat') ? subServicesMasyarakat.length : subServicesAptikaOPD.length) : 0} Aktif)` 
                        : `${catServices.length} Layanan Terhubung (${activeCount} Aktif)`}
                    </p>
                  </div>
                  {active && <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-sky-600 transition-all" />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6 animate-in fade-in duration-200">
          <button
            onClick={() => setStep(1)}
            className="flex items-center gap-1.5 text-base font-bold text-slate-500 hover:text-sky-600 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Kategori</span>
          </button>

          <div className="space-y-1">
            <h3 className="font-extrabold text-slate-800 text-xl tracking-tight">Langkah 2: Pilih Sub-layanan</h3>
            <p className="text-sm text-slate-500">
              Pilih salah satu jenis permohonan spesifik untuk kategori <strong className="text-slate-800 font-bold">{selectedCategory.name}</strong>.
            </p>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={subSearchQuery}
                onChange={(e) => setSubSearchQuery(e.target.value)}
                placeholder="Cari nama sub-layanan (contoh: pembuatan aplikasi, akun, vapt, server)..."
                className="w-full pl-11 pr-16 py-3 border border-slate-200 bg-slate-50/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white font-medium text-slate-800 transition-all shadow-sm"
              />
              {subSearchQuery && (
                <button
                  type="button"
                  onClick={() => setSubSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
                >
                  Reset
                </button>
              )}
            </div>

            {(() => {
              const allSubs = getSubServicesForCategory(selectedCategory);
              const q = subSearchQuery.toLowerCase().trim();
              const filtered = allSubs.filter(sub => sub.toLowerCase().includes(q));

              if (filtered.length === 0) {
                return (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 space-y-2">
                    <p className="font-bold text-base">Tidak ada sub-layanan yang sesuai</p>
                    <p className="text-xs text-slate-400">Silakan gunakan kata kunci pencarian lain atau klik tombol reset.</p>
                  </div>
                );
              }

              return (
                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {filtered.map((sub, idx) => {
                    const actualServiceName = APTIKA_SERVICE_MAPPING[sub] || sub;
                    const srv = (services || []).find(s => s.name === actualServiceName);
                    const isActive = srv ? srv.status === 'Aktif' : true;
                    const desc = srv ? (srv.description || `Permohonan terkait ${sub}`) : `Permohonan terkait ${sub}`;
                    const isSelected = selectedSubService === sub;

                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedSubService(sub)}
                        onMouseEnter={() => setHoveredIdx(idx)}
                        onMouseLeave={() => setHoveredIdx(null)}
                        className="group p-4 rounded-2xl border cursor-pointer text-left"
                        style={{
                          transition: 'border-color 0.15s, box-shadow 0.15s, transform 0.15s',
                          transform: (!isSelected && hoveredIdx === idx) ? 'translateY(-2px)' : 'translateY(0)',
                          borderColor: isSelected ? '#38bdf8' : (hoveredIdx === idx ? '#7dd3fc' : '#e2e8f0'),
                          boxShadow: isSelected
                            ? '0 1px 3px 0 rgba(56,189,248,0.15), 0 0 0 1px rgba(56,189,248,0.25)'
                            : hoveredIdx === idx
                              ? '0 4px 12px 0 rgba(56,189,248,0.18), 0 1px 3px 0 rgba(0,0,0,0.06)'
                              : '0 1px 2px 0 rgba(0,0,0,0.04)',
                          backgroundColor: '#fff',
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <div
                              className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5"
                              style={{
                                transition: 'border-color 0.15s, background-color 0.15s',
                                borderColor: isSelected ? '#0284c7' : (hoveredIdx === idx ? '#7dd3fc' : '#cbd5e1'),
                                backgroundColor: isSelected ? '#0284c7' : '#fff',
                              }}
                            >
                              {isSelected && <span className="w-2 h-2 rounded-full bg-white"></span>}
                            </div>
                            <div className="min-w-0">
                              <p className={`text-base font-extrabold ${isSelected ? 'text-sky-950 font-black' : 'text-slate-850'}`}>
                                {sub}
                              </p>
                              {srv && (
                                <p className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                                  <span className="flex items-center gap-1 font-medium bg-slate-100 px-2 py-0.5 rounded">
                                    <Clock className="w-3 h-3 text-slate-400" />
                                    Target SLA: {srv.sla || srv.target_sla || '1-3 Hari'}
                                  </span>
                                  {!isActive && (
                                    <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                                      Tahap Pengembangan
                                    </span>
                                  )}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-2">
                            <ChevronRight className={`w-4 h-4 transition-all ${isSelected ? 'text-sky-600' : 'text-slate-300'}`} />
                          </div>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1.5 pl-8 text-xs">
                          <div className="flex items-start gap-2 text-slate-650">
                            <FileText className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                            <div>
                              <strong className="text-slate-850 font-extrabold">Dokumen yang harus disiapkan: </strong>
                              <span className="text-slate-650 font-medium">
                                {srv?.requiredDocs || 'Surat Permohonan Resmi OPD, KAK / TOR, Dokumen Pendukung'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
                            <div className="flex items-center gap-2">
                              <FileCheck className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                              <strong className="text-slate-850 font-extrabold font-sans">SOP Layanan: </strong>
                              <span className="font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                                {srv?.sop || 'sop_layanan.pdf'}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewingSop({ name: sub, sop: srv?.sop || 'sop_layanan.pdf' });
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 hover:text-sky-900 border border-sky-200 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Lihat Isi SOP</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            <div className="pt-2">
              <button
                type="button"
                disabled={!selectedSubService}
                onClick={() => setStep(3)}
                className="w-full py-3.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-base font-extrabold text-white shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Lanjut ke Formulir</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <form onSubmit={handleFormPreSubmit} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6 animate-in fade-in duration-200">
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
              <h3 className="font-black text-slate-800 text-xl mt-2">{selectedSubService}</h3>
              <p className="text-sm text-slate-400 mt-1">Lengkapi informasi pengajuan sub-layanan berikut.</p>
              
              {(() => {
                const actualServiceName = APTIKA_SERVICE_MAPPING[selectedSubService] || selectedSubService;
                const srv = (services || []).find(s => s.name === actualServiceName);
                const reqDocs = srv?.requiredDocs || 'Surat Permohonan Resmi OPD, KAK / Dokumen Pendukung';
                const sopFile = srv?.sop || 'sop-layanan.pdf';
                return (
                  <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-sky-50/70 via-indigo-50/40 to-slate-50 border border-sky-200 space-y-2.5 text-left">
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-black text-amber-850 uppercase tracking-wider block">Dokumen yang Harus Disiapkan Pemohon:</span>
                        <p className="text-sm font-bold text-slate-800 mt-0.5 leading-relaxed">{reqDocs}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 pt-2.5 border-t border-sky-100 flex-wrap text-xs">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <FileCheck className="w-4 h-4 text-sky-600 shrink-0" />
                          <span className="font-extrabold text-slate-700">SOP Pelayanan:</span>
                          <span className="font-mono font-bold text-sky-700 bg-white px-2 py-0.5 rounded border border-sky-200">
                            {sopFile}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setViewingSop({ name: selectedSubService, sop: sopFile })}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer ml-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Lihat Isi Dokumen SOP</span>
                        </button>
                      </div>
                      {srv && (
                        <span className="font-bold text-slate-500 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          Target Waktu SLA: <strong className="text-slate-800">{srv.sla || srv.target_sla || '1-3 Hari'}</strong>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {user?.role === 'helpdesk' && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Instansi / Asal Pemohon</label>
              <input
                type="text"
                value={helpdeskInstansi}
                onChange={(e) => setHelpdeskInstansi(e.target.value)}
                placeholder="Contoh: Dinas Kesehatan Kota Bogor / Masyarakat Umum"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-base focus:outline-none focus:ring-1 focus:ring-sky-500 font-semibold"
              />
            </div>
          )}

          {(() => {
            const actualServiceName = APTIKA_SERVICE_MAPPING[selectedSubService] || selectedSubService;
            const srv = (services || []).find(s => s.name === actualServiceName);
            const schema = srv?.form_schema || [];
            return schema.filter(f => f.type !== 'file').map((field, idx) => (
              <div key={idx} className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">{field.label}</label>
                {field.type === 'select' ? (
                  <select
                    required
                    value={formData[field.label] || ''}
                    onChange={(e) => setFormData({...formData, [field.label]: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-base focus:outline-none focus:ring-1 focus:ring-sky-500 font-semibold bg-white"
                  >
                    <option value="">-- Pilih --</option>
                    {(field.options || []).map((opt, i) => (
                      <option key={i} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea
                    required
                    rows={4}
                    value={formData[field.label] || ''}
                    onChange={(e) => setFormData({...formData, [field.label]: e.target.value})}
                    placeholder={field.placeholder || ''}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl text-base focus:outline-none focus:ring-1 focus:ring-sky-500 font-semibold"
                  />
                ) : field.type === 'file' ? (
                   <input type="file" className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm" onChange={handleFileChange} />
                ) : (
                  <input
                    type={field.type || 'text'}
                    required
                    value={formData[field.label] || ''}
                    onChange={(e) => setFormData({...formData, [field.label]: e.target.value})}
                    placeholder={field.placeholder || ''}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-base focus:outline-none focus:ring-1 focus:ring-sky-500 font-semibold"
                  />
                )}
              </div>
            ));
          })()}

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Judul Ringkas Permohonan</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Pengajuan integrasi SSO akun dinas untuk aplikasi SIMPATIK"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-base focus:outline-none focus:ring-1 focus:ring-sky-500 font-semibold"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Deskripsi Kebutuhan Detail</label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan kebutuhan teknis layanan secara detail..."
              className="w-full px-4 py-3 border border-slate-300 rounded-xl text-base focus:outline-none focus:ring-1 focus:ring-sky-500 font-semibold"
            />
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Unggah Dokumen Persyaratan (.PDF)</label>
            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 hover:border-sky-500 rounded-2xl p-6 text-center space-y-3 bg-slate-50/50 hover:bg-slate-50 transition-all cursor-pointer group"
            >
              <Upload className="w-8 h-8 text-slate-400 group-hover:text-sky-600 transition-colors mx-auto" />
              <div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-bold shadow-xs transition-all"
                >
                  Pilih Dokumen PDF
                </button>
                <p className="text-xs text-slate-400 mt-2">Maksimal ukuran file 10MB. Format dokumen resmi PDF.</p>
              </div>
              {uploadedFile && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800"
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="truncate">{uploadedFile} ({uploadedFileSize || 'Valid PDF'})</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={uploadedFileUrl || '/dokumen_permohonan.pdf'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 bg-white border border-emerald-300 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-all"
                    >
                      Buka PDF
                    </a>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-slate-500 hover:text-slate-700 underline text-[11px]"
                    >
                      Ganti
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-base font-extrabold text-white shadow-md shadow-sky-500/10 hover:shadow-lg hover:shadow-sky-500/15 transition-all flex items-center justify-center"
          >
            Kirim Permohonan
          </button>
        </form>
      )}

      <SopModal
        isOpen={!!viewingSop}
        onClose={() => setViewingSop(null)}
        serviceName={viewingSop?.name}
        sopFileName={viewingSop?.sop}
        fileUrl="/sop_layanan.pdf"
      />

      <ActionModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        type="confirm"
        title="Konfirmasi Pengajuan Layanan"
        message="Pastikan data permohonan dan dokumen kelengkapan yang Anda masukkan sudah lengkap dan sesuai dengan SOP layanan."
        confirmText="Ya, Kirim Permohonan"
        cancelText="Periksa Kembali"
        onConfirm={handleExecuteSubmit}
      >
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs font-semibold text-slate-700">
          <div className="flex justify-between">
            <span className="text-slate-400">Sub-layanan:</span>
            <span className="font-bold text-slate-800 text-right">{selectedSubService}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Instansi / Asal:</span>
            <span className="font-bold text-slate-800 text-right">
              {user?.role === 'helpdesk' ? (helpdeskInstansi.trim() || 'Masyarakat Umum') : (user?.department || 'Masyarakat Umum')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Judul Ringkas:</span>
            <span className="font-bold text-slate-800 text-right truncate max-w-[200px]">{title || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Lampiran:</span>
            <span className="font-bold text-sky-700 text-right">{uploadedFile || 'Surat_Permohonan_Layanan.pdf'}</span>
          </div>
        </div>
      </ActionModal>

      <ActionModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          navigate('/dashboard/history');
        }}
        type="success"
        title="Permohonan Berhasil Diajukan"
        message={`Tiket permohonan Anda (${createdTicketId}) telah berhasil diterbitkan dan masuk ke sistem Diskominfo Kota Bogor.`}
        confirmText="Buka Riwayat Tiket"
        onConfirm={() => {
          setShowSuccessModal(false);
          navigate('/dashboard/history');
        }}
      />

      <ActionModal
        isOpen={!!inactiveCategoryNotice}
        onClose={() => setInactiveCategoryNotice('')}
        type="warning"
        title="Layanan Tahap Pengembangan"
        message={`Kategori layanan "${inactiveCategoryNotice}" saat ini masih dalam proses standardisasi teknis dan belum dibuka untuk pengajuan umum.`}
        confirmText="Mengerti"
        cancelText=""
        onConfirm={() => setInactiveCategoryNotice('')}
      />
    </div>
  );
};
