import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  FileText, 
  Search, 
  ChevronRight, 
  Star, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Eye 
} from 'lucide-react';

const getServiceSlaDays = (serviceName) => {
  if (serviceName === 'Server Perangkat Daerah') return 5;
  if (serviceName === 'Jaringan Intra Pemerintah') return 3;
  if (serviceName === 'Pengembangan & Pengelolaan Aplikasi') return 7;
  return 4;
};

const calculateTargetDate = (dateStr, serviceName) => {
  if (!dateStr) return '';
  const months = {
    'Januari': 0, 'Februari': 1, 'Maret': 2, 'April': 3, 'Mei': 4, 'Juni': 5,
    'Juli': 6, 'Agustus': 7, 'September': 8, 'Oktober': 9, 'November': 10, 'Desember': 11
  };
  const monthsIndo = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  
  const parts = dateStr.split(' ');
  if (parts.length < 3) return dateStr;
  const day = parseInt(parts[0], 10);
  const monthName = parts[1];
  const year = parseInt(parts[2], 10);
  
  const monthIdx = months[monthName];
  if (monthIdx === undefined) return dateStr;
  
  const date = new Date(year, monthIdx, day);
  
  const slaDays = getServiceSlaDays(serviceName);
  
  date.setDate(date.getDate() + slaDays);
  
  const targetDay = date.getDate();
  const targetMonth = monthsIndo[date.getMonth()];
  const targetYear = date.getFullYear();
  
  return `${targetDay} ${targetMonth} ${targetYear}`;
};

const getTargetShortDate = (targetDateStr) => {
  if (!targetDateStr) return '';
  const parts = targetDateStr.split(' ');
  if (parts.length < 3) return targetDateStr;
  const day = parts[0];
  let monthShort = parts[1].slice(0, 3);
  if (parts[1] === 'Agustus') monthShort = 'Agt';
  else if (parts[1] === 'Desember') monthShort = 'Des';
  else if (parts[1] === 'Oktober') monthShort = 'Okt';
  return `${day} ${monthShort}`;
};

export const TicketHistory = () => {
  const { user, tickets, setTickets, ratings, setRatings, teams } = useAuth();
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState('Tim Aplikasi & Sistem Informasi');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const [rateOverall, setRateOverall] = useState(5);
  const [rateSpeed, setRateSpeed] = useState(5);
  const [rateResult, setRateResult] = useState(5);
  const [rateComm, setRateComm] = useState(5);
  const [rateQuality, setRateQuality] = useState(5);
  const [rateComment, setRateComment] = useState('');

  const [tempProgress, setTempProgress] = useState(0);
  const [progressNote, setProgressNote] = useState('');
  const [tempRemainingDays, setTempRemainingDays] = useState(3);

  useEffect(() => {
    if (selectedTicket) {
      setTempProgress(selectedTicket.progress || 0);
      setProgressNote('');
      setTempRemainingDays(selectedTicket.remainingDays !== undefined ? selectedTicket.remainingDays : 3);
    }
  }, [selectedTicket?.id]);

  const handleSelectTicket = (t) => {
    setSelectedTicket(t);
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateProgress = (ticketId) => {
    if (!progressNote.trim()) {
      alert('Silakan tulis catatan laporan pekerjaan terlebih dahulu.');
      return;
    }
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        const isFinished = tempProgress === 100;
        const updated = {
          ...t,
          progress: tempProgress,
          remainingDays: isFinished ? 0 : tempRemainingDays,
          status: isFinished ? 'Menunggu Konfirmasi User' : 'Diproses',
          logs: [
            { 
              date: '18 Agt 09:30', 
              text: progressNote.trim()
            },
            ...t.logs
          ]
        };
        if (isFinished) {
          setSelectedTicket(null);
        } else {
          setSelectedTicket(updated);
        }
        return updated;
      }
      return t;
    }));
    setProgressNote('');
    alert('Progres pekerjaan dan laporan berhasil diperbarui!');
  };

  const handleConfirmAndRate = (ticketId) => {
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        const updated = {
          ...t,
          status: 'Selesai',
          progress: 100,
          rating: {
            overall: rateOverall,
            speed: rateSpeed,
            result: rateResult,
            communication: rateComm,
            quality: rateQuality,
            comment: rateComment
          },
          logs: [
            { date: '18 Agt 08:30', text: `User mengonfirmasi selesai & mengisi survei rating ${rateOverall} bintang` },
            ...t.logs
          ]
        };
        setSelectedTicket(updated);
        return updated;
      }
      return t;
    }));

    if (ratings && setRatings) {
      const newRating = {
        id: ratings.length + 1,
        name: user.department || 'Dinas Kesehatan Kota Bogor',
        rating: rateOverall,
        service: selectedTicket.service,
        comment: rateComment,
        status: 'Selesai (On SLA)',
        selectedForLanding: false,
        aspects: {
          speed: rateSpeed,
          result: rateResult,
          communication: rateComm,
          quality: rateQuality
        }
      };
      setRatings([newRating, ...ratings]);
    }

    setRateOverall(5);
    setRateSpeed(5);
    setRateResult(5);
    setRateComm(5);
    setRateQuality(5);
    setRateComment('');
    alert('Terima kasih! Tiket berhasil dikonfirmasi dan ulasan Anda telah dikirim.');
  };

  const handleApprove = (ticketId) => {
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: 'Diproses',
          progress: 20,
          team: selectedTeam,
          logs: [
            { date: '17 Agt 22:52', text: `Permohonan disetujui & dialihkan ke ${selectedTeam} oleh Helpdesk` },
            ...t.logs
          ]
        };
      }
      return t;
    }));
    setSelectedTicket(null);
    alert('Tiket berhasil disetujui dan dialihkan ke tim pelaksana!');
  };

  const handleReject = (ticketId) => {
    if (!rejectReason.trim()) {
      alert('Silakan isi alasan penolakan terlebih dahulu.');
      return;
    }
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: 'Ditolak',
          logs: [
            { date: '17 Agt 22:52', text: `Permohonan ditolak oleh Helpdesk. Alasan: ${rejectReason}` },
            ...t.logs
          ]
        };
      }
      return t;
    }));
    setSelectedTicket(null);
    setRejectReason('');
    setShowRejectForm(false);
    alert('Tiket berhasil ditolak.');
  };

  const getRoleTabs = () => {
    if (!user) return [];
    switch (user.role) {
      case 'user':
        return [
          { id: 'proses', label: 'Proses Pengerjaan' },
          { id: 'selesai', label: 'Selesai (Menunggu Rating)' },
          { id: 'dirating', label: 'Sudah Dirating' },
          { id: 'ditolak', label: 'Ditolak' }
        ];
      case 'helpdesk':
        return [
          { id: 'antrean', label: 'Antrean Validasi' },
          { id: 'proses', label: 'Dalam Pengerjaan' },
          { id: 'konfirmasi', label: 'Menunggu Konfirmasi User' },
          { id: 'dinilai', label: 'Selesai & Dinilai' },
          { id: 'ditolak', label: 'Ditolak' }
        ];
      case 'pegawai':
        return [
          { id: 'aktif', label: 'Tugas Aktif' },
          { id: 'selesai', label: 'Selesai Pengerjaan' },
          { id: 'dinilai', label: 'Selesai & Dinilai' }
        ];
      case 'admin':
        return [
          { id: 'proses', label: 'Tiket Proses' },
          { id: 'selesai', label: 'Tiket Selesai' },
          { id: 'ditolak', label: 'Tiket Ditolak' }
        ];
      default:
        return [];
    }
  };

  const tabs = getRoleTabs();
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || '');

  useEffect(() => {
    const newTabs = getRoleTabs();
    if (newTabs.length > 0) {
      setActiveTab(newTabs[0].id);
    }
  }, [user?.role]);

  const getUserTeam = (u) => {
    if (!u || !u.department) return '';
    const dept = u.department;
    if (dept.includes('Aplikasi')) return 'Tim Aplikasi & Sistem Informasi';
    if (dept.includes('Jaringan') || dept.includes('Infrastruktur')) return 'Tim Infrastruktur & Jaringan TIK';
    if (dept.includes('Sandi') || dept.includes('Keamanan')) return 'Tim Pengamanan Informasi & Sandi';
    if (dept.includes('SPBE') || dept.includes('Tata Kelola')) return 'Tim Tata Kelola SPBE';
    if (dept.includes('Satu Data') || dept.includes('Statistik')) return 'Tim Satu Data & Statistik';
    if (dept.includes('Humas') || dept.includes('IKP')) return 'Tim Hubungan Masyarakat & IKP';
    if (dept.includes('LPSE')) return 'Tim Layanan Pengadaan Secara Elektronik (LPSE)';
    if (dept.includes('Support') || dept.includes('Helpdesk')) return 'Tim Support & Helpdesk Utama';
    return '';
  };

  const getTicketTeam = (t) => {
    if (t.team) return t.team;
    const svc = t.service;
    if (svc === 'Pengembangan & Pengelolaan Aplikasi' || svc === 'Rekomendasi & Evaluasi Aplikasi' || svc === 'Uji Kesesuaian Sistem (UKS)') {
      return 'Tim Aplikasi & Sistem Informasi';
    }
    if (svc === 'Jaringan Intra Pemerintah' || svc === 'Server Perangkat Daerah' || svc === 'Infrastruktur TIK' || svc === 'Wifi Publik' || svc === 'Domain & Subdomain Pemerintah Daerah') {
      return 'Tim Infrastruktur & Jaringan TIK';
    }
    if (svc === 'Keamanan Informasi & Persandian' || svc === 'Keamanan Aplikasi / VAPT' || svc === 'CSIRT / Respons Insiden') {
      return 'Tim Pengamanan Informasi & Sandi';
    }
    if (svc === 'Tata Kelola SPBE' || svc === 'Audit Teknologi Informasi') {
      return 'Tim Tata Kelola SPBE';
    }
    if (svc === 'Satu Data Daerah' || svc === 'Statistik Sektoral') {
      return 'Tim Satu Data & Statistik';
    }
    if (svc === 'Informasi & Komunikasi Publik' || svc === 'Video Conference / Zoom') {
      return 'Tim Hubungan Masyarakat & IKP';
    }
    if (svc === 'Sistem Informasi LPSE' || svc === 'Fasilitasi E-Katalog') {
      return 'Tim Layanan Pengadaan Secara Elektronik (LPSE)';
    }
    if (svc === 'Pelayanan Umum TIK' || svc === 'Pengaduan SP4N Lapor') {
      return 'Tim Support & Helpdesk Utama';
    }
    return 'Tim Support & Helpdesk Utama';
  };

  const getTabCount = (tabId) => {
    if (!user) return 0;
    let base = tickets || [];
    if (user.role === 'user') {
      base = (tickets || []).filter(t => t.opd.includes('Dinas Kesehatan') || t.id === 'REQ-2026-0120');
    } else if (user.role === 'pegawai') {
      const userTeam = getUserTeam(user);
      base = (tickets || []).filter(t => getTicketTeam(t) === userTeam);
    }
    
    switch (user.role) {
      case 'user':
        if (tabId === 'proses') return base.filter(t => t.status === 'Verifikasi' || t.status === 'Menunggu Validasi' || t.status === 'Diproses').length;
        if (tabId === 'selesai') return base.filter(t => t.status === 'Menunggu Konfirmasi User').length;
        if (tabId === 'dirating') return base.filter(t => t.status === 'Selesai').length;
        if (tabId === 'ditolak') return base.filter(t => t.status === 'Ditolak').length;
        return base.length;
      case 'helpdesk':
        if (tabId === 'antrean') return base.filter(t => t.status === 'Verifikasi' || t.status === 'Menunggu Validasi').length;
        if (tabId === 'proses') return base.filter(t => t.status === 'Diproses').length;
        if (tabId === 'konfirmasi') return base.filter(t => t.status === 'Menunggu Konfirmasi User').length;
        if (tabId === 'dinilai') return base.filter(t => t.status === 'Selesai').length;
        if (tabId === 'ditolak') return base.filter(t => t.status === 'Ditolak').length;
        return base.length;
      case 'pegawai':
        if (tabId === 'aktif') return base.filter(t => t.status === 'Diproses').length;
        if (tabId === 'selesai') return base.filter(t => t.status === 'Menunggu Konfirmasi User').length;
        if (tabId === 'dinilai') return base.filter(t => t.status === 'Selesai').length;
        return base.length;
      case 'admin':
        if (tabId === 'proses') return base.filter(t => t.status === 'Verifikasi' || t.status === 'Menunggu Validasi' || t.status === 'Diproses' || t.status === 'Menunggu Konfirmasi User').length;
        if (tabId === 'selesai') return base.filter(t => t.status === 'Selesai').length;
        if (tabId === 'ditolak') return base.filter(t => t.status === 'Ditolak').length;
        return base.length;
      default:
        return 0;
    }
  };

  const getFilteredTickets = () => {
    if (!user) return [];
    
    let base = tickets;
    if (user.role === 'user') {
      base = tickets.filter(t => t.opd.includes('Dinas Kesehatan') || t.id === 'REQ-2026-0120');
    } else if (user.role === 'pegawai') {
      const userTeam = getUserTeam(user);
      base = tickets.filter(t => getTicketTeam(t) === userTeam);
    }

    switch (user.role) {
      case 'user':
        if (activeTab === 'proses') {
          return base.filter(t => t.status === 'Verifikasi' || t.status === 'Menunggu Validasi' || t.status === 'Diproses');
        }
        if (activeTab === 'selesai') {
          return base.filter(t => t.status === 'Menunggu Konfirmasi User');
        }
        if (activeTab === 'dirating') {
          return base.filter(t => t.status === 'Selesai');
        }
        if (activeTab === 'ditolak') {
          return base.filter(t => t.status === 'Ditolak');
        }
        return base;

      case 'helpdesk':
        if (activeTab === 'antrean') {
          return base.filter(t => t.status === 'Verifikasi' || t.status === 'Menunggu Validasi');
        }
        if (activeTab === 'proses') {
          return base.filter(t => t.status === 'Diproses');
        }
        if (activeTab === 'konfirmasi') {
          return base.filter(t => t.status === 'Menunggu Konfirmasi User');
        }
        if (activeTab === 'dinilai') {
          return base.filter(t => t.status === 'Selesai');
        }
        if (activeTab === 'ditolak') {
          return base.filter(t => t.status === 'Ditolak');
        }
        return base;

      case 'pegawai':
        if (activeTab === 'aktif') {
          return base.filter(t => t.status === 'Diproses');
        }
        if (activeTab === 'selesai') {
          return base.filter(t => t.status === 'Menunggu Konfirmasi User');
        }
        if (activeTab === 'dinilai') {
          return base.filter(t => t.status === 'Selesai');
        }
        return base;

      case 'admin':
        if (activeTab === 'proses') {
          return base.filter(t => t.status === 'Verifikasi' || t.status === 'Menunggu Validasi' || t.status === 'Diproses' || t.status === 'Menunggu Konfirmasi User');
        }
        if (activeTab === 'selesai') {
          return base.filter(t => t.status === 'Selesai');
        }
        if (activeTab === 'ditolak') {
          return base.filter(t => t.status === 'Ditolak');
        }
        return base;

      default:
        return base;
    }
  };

  const filteredTickets = getFilteredTickets();

  const renderRatingStars = (score) => {
    return (
      <div className="flex gap-0.5 text-amber-500">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className={`w-4 h-4 ${i < score ? 'fill-amber-500 text-amber-500' : 'text-slate-200'}`} />
        ))}
      </div>
    );
  };

  const currentOverallRating = Math.round((rateSpeed + rateResult + rateComm + rateQuality) / 4);

  return (
    <div className="space-y-8 font-sans text-left">
      <div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">
          {user?.role === 'user' ? 'Tiket Saya' :
           user?.role === 'helpdesk' ? 'Kelola Tiket SPBE' :
           user?.role === 'pegawai' ? 'Tiket Pekerjaan TIK' :
           'Daftar Tiket SPBE'}
        </h2>
        <p className="text-slate-500 text-base leading-relaxed mt-1.5">
          {user?.role === 'user' && 'Pantau seluruh pengajuan tiket instansi Anda, hasil penyelesaian, dan penilaian ulasan yang telah dikirimkan.'}
          {user?.role === 'helpdesk' && 'Daftar riwayat validasi tiket, baik yang disetujui untuk diteruskan ke tim pelaksana maupun yang ditolak.'}
          {user?.role === 'pegawai' && 'Daftar riwayat tugas pengerjaan teknis yang didelegasikan ke tim Anda beserta evaluasi rating dari OPD.'}
          {user?.role === 'admin' && 'Daftar seluruh riwayat pengajuan tiket layanan SPBE dari seluruh OPD di Kota Bogor.'}
        </p>
      </div>

      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto pb-px">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const count = getTabCount(tab.id);
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSelectedTicket(null);
              }}
              className={`px-5 py-3 border-b-2 font-bold text-sm transition-all whitespace-nowrap -mb-px flex items-center gap-2 ${
                isActive 
                  ? 'border-sky-600 text-sky-600 bg-sky-50/50 rounded-t-lg' 
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/50'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-black transition-all ${
                isActive ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-500'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-4">
          {filteredTickets.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
              <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="font-bold text-base">Tidak ada tiket di kategori ini.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTickets.map((t) => {
                const isSelected = selectedTicket?.id === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => handleSelectTicket(t)}
                    className={`p-6 rounded-2xl border transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 cursor-pointer relative ${
                      isSelected 
                        ? 'border-sky-500 bg-sky-50/20 ring-1 ring-sky-500/30' 
                        : 'border-slate-200 bg-white hover:bg-slate-50/50 hover:border-slate-300'
                    }`}
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-sky-600 uppercase tracking-widest bg-sky-50 px-2 py-0.5 rounded">{t.id}</span>
                        <span className="text-sm text-slate-400 font-semibold">{t.date}</span>
                      </div>
                      <h3 className="font-extrabold text-base text-slate-800 leading-snug">{t.title}</h3>
                      <p className="text-xs text-slate-450 font-bold uppercase tracking-wider">{t.opd}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-xs bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded font-semibold">
                          {t.service}
                        </span>
                        <span className="text-xs bg-sky-50 text-sky-700 border border-sky-100 px-2 py-0.5 rounded font-semibold">
                          {t.requestType}
                        </span>
                      </div>
                      {t.status === 'Diproses' && t.progress !== undefined && (
                        <div className="flex items-center gap-3 mt-3">
                          <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-sky-500 h-full rounded-full" style={{ width: `${t.progress}%` }}></div>
                          </div>
                          <span className="text-xs font-black text-slate-700">{t.progress}% Progres</span>
                        </div>
                      )}

                      <div className="text-xs text-slate-450 font-bold mt-2.5 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {t.status === 'Diproses' ? `Estimasi: Sisa ${t.remainingDays !== undefined ? t.remainingDays : 3} Hari (Target ${getTargetShortDate(calculateTargetDate(t.date, t.service))})` :
                           t.status === 'Selesai' ? `Selesai dalam ${t.id === 'REQ-2026-0120' ? '2 Hari' : '4 Hari'} (On SLA)` :
                           t.status === 'Menunggu Konfirmasi User' ? 'Selesai 100% (Menunggu Konfirmasi)' :
                           t.status === 'Verifikasi' ? `SLA Standar: ${t.service === 'Server Perangkat Daerah' ? '5 Hari Kerja' : '3 Hari Kerja'}` :
                           'Pengajuan Dibatalkan'}
                        </span>
                      </div>
                    </div>
                    <div className="flex md:flex-col items-center md:items-end gap-3 self-stretch md:self-auto justify-between shrink-0">
                      <span className={`px-2.5 py-1 rounded text-xs font-extrabold uppercase tracking-wider ${
                        t.status === 'Selesai' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        t.status === 'Ditolak' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                        t.status === 'Diproses' ? 'bg-sky-50 text-sky-700 border border-sky-100' :
                        t.status === 'Menunggu Konfirmasi User' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 animate-pulse' :
                        'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {t.status}
                      </span>
                      <button className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-650 hover:bg-slate-50 transition-all justify-center self-stretch md:self-auto">
                        <Eye className="w-4 h-4" />
                        <span>Detail</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="lg:col-span-5">
          {selectedTicket ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 sticky top-24 shadow-sm">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-sky-655 uppercase tracking-widest bg-sky-50 px-2 py-0.5 rounded inline-block">{selectedTicket.id}</span>
                  <span className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                    selectedTicket.status === 'Selesai' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                    selectedTicket.status === 'Ditolak' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                    selectedTicket.status === 'Diproses' ? 'bg-sky-50 text-sky-700 border border-sky-100' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {selectedTicket.status}
                  </span>
                </div>
                <h3 className="font-extrabold text-lg text-slate-800 tracking-tight leading-snug">{selectedTicket.title}</h3>
                <p className="text-base text-slate-500 leading-relaxed">{selectedTicket.desc}</p>
                {selectedTicket.status === 'Diproses' && selectedTicket.progress !== undefined && (
                  <div className="flex items-center gap-3 pt-2">
                    <div className="w-32 bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-sky-500 h-full rounded-full" style={{ width: `${selectedTicket.progress}%` }}></div>
                    </div>
                    <span className="text-sm font-bold text-slate-700">{selectedTicket.progress}% Progres</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 border border-slate-200/60 rounded-2xl p-4 text-left">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Standar SLA Layanan</span>
                  <p className="text-sm font-extrabold text-slate-700 mt-0.5">
                    {selectedTicket.service === 'Server Perangkat Daerah' ? '5 Hari Kerja' :
                     selectedTicket.service === 'Jaringan Intra Pemerintah' ? '3 Hari Kerja' :
                     selectedTicket.service === 'Pengembangan & Pengelolaan Aplikasi' ? '7 Hari Kerja' :
                     '4 Hari Kerja'}
                  </p>
                </div>
                <div>
                  {selectedTicket.status === 'Diproses' && (
                    <>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Batas Waktu Selesai</span>
                      <p className="text-sm font-extrabold text-amber-600 mt-0.5">
                        {calculateTargetDate(selectedTicket.date, selectedTicket.service)}
                      </p>
                    </>
                  )}
                  {selectedTicket.status === 'Selesai' && (
                    <>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Durasi Aktual Pengerjaan</span>
                      <p className="text-sm font-extrabold text-emerald-600 mt-0.5">
                        {selectedTicket.id === 'REQ-2026-0120' ? '2 Hari Kerja (On SLA)' :
                         selectedTicket.id === 'REQ-2026-0121' ? '4 Hari Kerja (On SLA)' :
                         selectedTicket.id === 'REQ-2026-0122' ? '3 Hari Kerja (On SLA)' :
                         'Tepat Waktu (On SLA)'}
                      </p>
                    </>
                  )}
                  {selectedTicket.status === 'Verifikasi' && (
                    <>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Estimasi Pengerjaan</span>
                      <p className="text-sm font-extrabold text-slate-600 mt-0.5">Akan ditentukan setelah disetujui</p>
                    </>
                  )}
                  {selectedTicket.status === 'Ditolak' && (
                    <>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Status SLA</span>
                      <p className="text-sm font-extrabold text-rose-600 mt-0.5">Dibatalkan/Ditolak</p>
                    </>
                  )}
                  {selectedTicket.status === 'Menunggu Konfirmasi User' && (
                    <>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Durasi Pengerjaan</span>
                      <p className="text-sm font-extrabold text-indigo-600 mt-0.5">3 Hari Kerja (Siap BAST)</p>
                    </>
                  )}
                </div>
              </div>

              {selectedTicket.files && selectedTicket.files.length > 0 && (
                <div className="space-y-2.5">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Dokumen Lampiran</span>
                  <div className="space-y-2">
                    {selectedTicket.files.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <FileText className="w-4 h-4 text-sky-600" />
                        <span className="text-sm font-bold text-slate-700">{file}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedTicket.rating && (
                <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-5 space-y-3.5 text-left">
                  <div className="flex justify-between items-center border-b border-amber-250 pb-3">
                    <h4 className="font-extrabold text-amber-800 text-sm uppercase tracking-wider">Riwayat Rating Layanan</h4>
                    <div className="flex items-center gap-1.5 bg-amber-100/60 border border-amber-200/60 px-2 py-0.5 rounded-lg">
                      <span className="text-slate-700 font-bold text-xs uppercase tracking-wider">Overall</span>
                      {renderRatingStars(selectedTicket.rating.overall || Math.round((selectedTicket.rating.speed + selectedTicket.rating.result + selectedTicket.rating.communication + selectedTicket.rating.quality) / 4))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-y-2.5 text-sm border-b border-amber-100/50 pb-3">
                    <div className="flex justify-between items-center pr-3 border-r border-amber-100/30">
                      <span className="text-slate-500 font-bold text-xs uppercase tracking-wider">Kecepatan</span>
                      {renderRatingStars(selectedTicket.rating.speed)}
                    </div>
                    <div className="flex justify-between items-center pl-3">
                      <span className="text-slate-500 font-bold text-xs uppercase tracking-wider">Kesesuaian</span>
                      {renderRatingStars(selectedTicket.rating.result)}
                    </div>
                    <div className="flex justify-between items-center pr-3 border-r border-amber-100/30">
                      <span className="text-slate-500 font-bold text-xs uppercase tracking-wider">Komunikasi</span>
                      {renderRatingStars(selectedTicket.rating.communication)}
                    </div>
                    <div className="flex justify-between items-center pl-3">
                      <span className="text-slate-500 font-bold text-xs uppercase tracking-wider">Kualitas</span>
                      {renderRatingStars(selectedTicket.rating.quality)}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Komentar / Masukan OPD</span>
                    <p className="text-base text-slate-700 italic leading-relaxed">
                      "{selectedTicket.rating.comment}"
                    </p>
                  </div>
                </div>
              )}

              {user?.role === 'helpdesk' && selectedTicket.status === 'Verifikasi' && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                  <h4 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Tindakan Validasi Helpdesk</h4>
                  
                  {!showRejectForm ? (
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Tugaskan ke Tim Pelaksana</label>
                        <select 
                          value={selectedTeam} 
                          onChange={(e) => setSelectedTeam(e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/25"
                        >
                          {teams && teams.map(t => (
                            <option key={t.id} value={t.name}>{t.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex gap-3">
                        <button 
                          onClick={() => handleApprove(selectedTicket.id)}
                          className="flex-1 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-bold transition-all"
                        >
                          Setujui & Tugaskan
                        </button>
                        <button 
                          onClick={() => setShowRejectForm(true)}
                          className="px-4 py-2.5 border border-rose-200 hover:bg-rose-50 hover:border-rose-300 text-rose-600 rounded-xl text-sm font-bold transition-all"
                        >
                          Tolak
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Alasan Penolakan</label>
                        <textarea 
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Tuliskan alasan berkas permohonan tidak lengkap..."
                          className="w-full h-24 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none"
                        />
                      </div>

                      <div className="flex gap-3">
                        <button 
                          onClick={() => handleReject(selectedTicket.id)}
                          className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold transition-all"
                        >
                          Kirim Penolakan
                        </button>
                        <button 
                          onClick={() => {
                            setShowRejectForm(false);
                            setRejectReason('');
                          }}
                          className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-650 rounded-xl text-sm font-bold transition-all"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {user?.role === 'pegawai' && selectedTicket.status === 'Diproses' && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 text-left">
                  <h4 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Perbarui Progres Pekerjaan</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Geser slider di bawah untuk memperbarui progres pengerjaan teknis tiket ini dan berikan catatan laporan pekerjaan terbaru Anda.
                  </p>
                  
                  <div className="space-y-4 bg-white border border-slate-200/60 rounded-xl p-4 shadow-sm">
                    <div className="flex justify-between items-center text-sm font-bold">
                      <span className="text-slate-500">Progres Kerja</span>
                      <span className="text-sky-600 font-extrabold text-base">{tempProgress}%</span>
                    </div>
                    
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      step="5" 
                      value={tempProgress}
                      onChange={(e) => setTempProgress(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
                    />
                    
                    <div className="flex justify-between text-[10px] text-slate-400 font-bold px-1">
                      <span>0%</span>
                      <span>25%</span>
                      <span>50%</span>
                      <span>75%</span>
                      <span>100% (Selesai)</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Estimasi Sisa Waktu Pengerjaan</label>
                    <select 
                      value={tempRemainingDays} 
                      onChange={(e) => setTempRemainingDays(Number(e.target.value))}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/25"
                    >
                      {Array.from({ length: getServiceSlaDays(selectedTicket.service) }).map((_, i) => {
                        const day = i + 1;
                        return (
                          <option key={day} value={day}>Sisa {day} Hari</option>
                        );
                      })}
                      <option value={0}>Selesai (0 Hari)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Catatan Laporan Pekerjaan</label>
                    <textarea 
                      value={progressNote}
                      onChange={(e) => setProgressNote(e.target.value)}
                      placeholder="Jelaskan progres pekerjaan yang telah dilakukan (misal: Selesai menarik kabel FO di lantai 3)..."
                      className="w-full h-24 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 resize-none"
                    />
                  </div>

                  <button 
                    onClick={() => handleUpdateProgress(selectedTicket.id)}
                    className="w-full px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-bold transition-all shadow-sm shadow-sky-500/10"
                  >
                    Simpan Laporan & Progres
                  </button>
                </div>
              )}

              {user?.role === 'user' && selectedTicket.status === 'Menunggu Konfirmasi User' && (
                <div className="bg-gradient-to-br from-indigo-50/50 to-sky-50/50 border border-indigo-100 rounded-2xl p-5 space-y-4 text-left">
                  <div className="flex items-center gap-2 text-indigo-700">
                    <Star className="w-5 h-5 fill-indigo-100 text-indigo-650" />
                    <h4 className="font-extrabold text-sm uppercase tracking-wider">Berikan Penilaian & Ulasan</h4>
                  </div>
                  
                  <p className="text-sm text-slate-500 leading-relaxed">Pekerjaan fisik telah selesai 100%. Silakan berikan konfirmasi dan ulasan rating untuk kualitas pelayanan kami.</p>
                  
                  <div className="flex justify-between items-center bg-white border border-indigo-100 rounded-xl p-4 shadow-sm">
                    <div className="space-y-0.5 text-left">
                      <span className="text-slate-700 font-extrabold text-xs uppercase tracking-wider block">Kualitas Pelayanan (Overall)</span>
                      <span className="text-[10px] text-slate-400 font-semibold block">Penilaian umum kinerja pelayanan SPBE</span>
                    </div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button 
                          key={star} 
                          onClick={() => setRateOverall(star)}
                          className="focus:outline-none transition-all hover:scale-110"
                        >
                          <Star className={`w-5 h-5 ${star <= rateOverall ? 'fill-amber-500 text-amber-500' : 'text-slate-200'}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 bg-white border border-indigo-50 rounded-xl p-4 shadow-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 font-bold text-xs uppercase tracking-wider">Kecepatan Layanan</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button 
                            key={star} 
                            onClick={() => setRateSpeed(star)}
                            className="focus:outline-none transition-all hover:scale-110"
                          >
                            <Star className={`w-5 h-5 ${star <= rateSpeed ? 'fill-amber-500 text-amber-500' : 'text-slate-205'}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 font-bold text-xs uppercase tracking-wider">Kesesuaian Hasil</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button 
                            key={star} 
                            onClick={() => setRateResult(star)}
                            className="focus:outline-none transition-all hover:scale-110"
                          >
                            <Star className={`w-5 h-5 ${star <= rateResult ? 'fill-amber-500 text-amber-500' : 'text-slate-205'}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 font-bold text-xs uppercase tracking-wider">Komunikasi Petugas</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button 
                            key={star} 
                            onClick={() => setRateComm(star)}
                            className="focus:outline-none transition-all hover:scale-110"
                          >
                            <Star className={`w-5 h-5 ${star <= rateComm ? 'fill-amber-500 text-amber-500' : 'text-slate-205'}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 font-bold text-xs uppercase tracking-wider">Kualitas Teknis</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button 
                            key={star} 
                            onClick={() => setRateQuality(star)}
                            className="focus:outline-none transition-all hover:scale-110"
                          >
                            <Star className={`w-5 h-5 ${star <= rateQuality ? 'fill-amber-500 text-amber-500' : 'text-slate-205'}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Komentar / Masukan Tambahan</label>
                    <textarea 
                      value={rateComment}
                      onChange={(e) => setRateComment(e.target.value)}
                      placeholder="Tuliskan ulasan kinerja pelayanan Diskominfo..."
                      className="w-full h-20 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                    />
                  </div>

                  <button 
                    onClick={() => handleConfirmAndRate(selectedTicket.id)}
                    className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-indigo-150"
                  >
                    Konfirmasi Selesai & Kirim Ulasan
                  </button>
                </div>
              )}

              <div className="space-y-4 border-t border-slate-100 pt-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Pelacakan Log Progress</span>
                <div className="relative pl-5 border-l border-slate-200 space-y-4">
                  {selectedTicket.logs && selectedTicket.logs.map((log, idx) => {
                    const isNewest = idx === 0;
                    return (
                      <div key={idx} className="relative text-left">
                        <div className={`absolute -left-[25px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                          isNewest && selectedTicket.status !== 'Selesai'
                            ? 'bg-emerald-500 ring-4 ring-emerald-100 animate-pulse'
                            : 'bg-slate-300'
                        }`}></div>
                        <span className="text-xs text-slate-400 font-bold block">{log.date}</span>
                        <p className={`text-base mt-0.5 leading-relaxed ${isNewest ? 'font-bold text-slate-800' : 'text-slate-500'}`}>{log.text}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6 text-center text-slate-400 py-16">
              <FileText className="w-8 h-8 mx-auto mb-2 text-slate-350" />
              <p className="text-sm font-semibold leading-relaxed">Pilih salah satu tiket di sebelah kiri untuk melihat rincian detail pelacakan dan riwayat ulasan rating.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
