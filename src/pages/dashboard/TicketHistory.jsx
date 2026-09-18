import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getCurrentLogTimeFormatted, formatLogDateDisplay } from '../../utils/dateUtils';
import { TicketDetailModal } from '../../components/TicketDetailModal';
import { SkmModal } from '../../components/SkmModal';
import { api } from '../../services/api';
import { ActionModal } from '../../components/ActionModal';
import { 
  FileText, 
  Search, 
  ChevronRight, 
  Star, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Eye,
  Upload,
  Check,
  AlertTriangle
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
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadTickets = async () => {
    try {
      if (!user) return;
      let res;
      if (user.role === 'USER' || user.role === 'MASYARAKAT') {
        res = await api.getMyTickets();
      } else if (user.role === 'HELPDESK') {
        res = await api.getHelpdeskTickets();
      } else if (user.role === 'PEGAWAI') {
        res = await api.getEmployeeTickets();
      } else if (user.role === 'ADMIN') {
        res = await api.getAdminTickets();
      }
      
      if (res && res.data) {
        // Map backend names to frontend expected names
        const mapped = res.data.map(t => ({
          ...t,
          ticket_number: t.ticket_number,
          id: t.ticket_number || t.id,
          uuid: t.id,
          status: t.status_name === 'PENDING' ? 'Verifikasi' 
                : t.status_name === 'VERIFIED' ? 'Menunggu Validasi'
                : t.status_name === 'ASSIGNED' ? 'Diproses'
                : t.status_name === 'IN_PROGRESS' ? 'Diproses'
                : t.status_name === 'WAITING_USER_CONFIRMATION' ? 'Selesai'
                : t.status_name === 'COMPLETED' ? 'Selesai'
                : t.status_name,
          title: `Pengajuan Layanan ${t.service_name}`,
          service: t.service_name,
          opd: t.pemohon || 'OPD',
          date: new Date(t.created_at).toLocaleDateString('id-ID'),
          requestType: 'Baru',
          slaDuration: 7,
          remainingDays: 7
        }));
        setTickets(mapped);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [user]);

  useEffect(() => {
    const fetchTeams = async () => {
      if (user?.role !== 'ADMIN' && user?.role !== 'HELPDESK') return;
      try {
        const res = await api.getTeams();
        if (res && res.data) {
          setTeams(res.data);
          if (res.data.length > 0) {
            setSelectedTeam(res.data[0].name);
          }
        }
      } catch (err) {
        console.error("Failed to load teams", err);
      }
    };
    if (user) fetchTeams();
  }, [user]);

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState('Tim Aplikasi & Sistem Informasi');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [ratings, setRatings] = useState([]);

  const [rateOverall, setRateOverall] = useState(5);
  const [rateSpeed, setRateSpeed] = useState(5);
  const [rateResult, setRateResult] = useState(5);
  const [rateComm, setRateComm] = useState(5);
  const [rateQuality, setRateQuality] = useState(5);
  const [rateComment, setRateComment] = useState('');

  const [tempProgress, setTempProgress] = useState(0);
  const [progressNote, setProgressNote] = useState('');
  const [tempRemainingDays, setTempRemainingDays] = useState(3);
  const [isFinished, setIsFinished] = useState(false);
  const [fileName, setFileName] = useState('');
  const [bastFileSize, setBastFileSize] = useState('');
  const [bastFileUrl, setBastFileUrl] = useState('/bast_selesai.pdf');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showSkmModal, setShowSkmModal] = useState(false);
  const [showInlineRating, setShowInlineRating] = useState(false);
  const bastInputRef = useRef(null);

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: 'confirm',
    title: '',
    message: '',
    confirmText: 'Lanjutkan',
    cancelText: 'Batal',
    onConfirm: null
  });

  const closeModal = () => setModalConfig(prev => ({ ...prev, isOpen: false }));

  const handleBastFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setBastFileSize((file.size / 1024).toFixed(1) + ' KB');
      const url = URL.createObjectURL(file);
      setBastFileUrl(url);
    }
  };

  useEffect(() => {
    if (selectedTicket) {
      setTempProgress(selectedTicket.progress || 0);
      setProgressNote('');
      setTempRemainingDays(selectedTicket.remainingDays !== undefined ? selectedTicket.remainingDays : 3);
      setIsFinished(selectedTicket.status === 'Selesai');
      setFileName('');
      setShowInlineRating(false);
    }
  }, [selectedTicket?.id]);

  const handleSelectTicket = (t) => {
    setSelectedTicket(t);
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const executeUpdateProgress = async (ticketId) => {
    const autoLogText = isFinished
      ? (progressNote.trim() || (fileName ? 'Pekerjaan teknis selesai dikerjakan 100% oleh Pegawai dan berkas BAST telah diunggah.' : 'Pekerjaan teknis selesai dikerjakan 100% oleh Pegawai.'))
      : (progressNote.trim() || 'Pekerjaan teknis sedang diproses dan dikerjakan oleh Pegawai Tim Pelaksana.');

    try {
      await api.updateProgress(ticketId, { progress: isFinished ? 100 : tempProgress });
      loadTickets(); // Refresh from DB
      setProgressNote('');
      setModalConfig({
        isOpen: true,
        type: 'success',
        title: isFinished ? 'Tugas Berhasil Diselesaikan' : 'Progres Berhasil Diperbarui',
        message: isFinished 
          ? (fileName ? 'Pekerjaan teknis telah selesai 100% dan berkas BAST telah diunggah. Pemohon dapat mengisi survei SKM.' : 'Pekerjaan teknis telah selesai 100%! Pemohon dapat mengisi survei SKM.')
          : 'Catatan progres pekerjaan berhasil disimpan ke dalam log riwayat tiket.',
        confirmText: 'Selesai & Tutup',
        onConfirm: closeModal
      });
      setSelectedTicket(null);
    } catch (err) {
      alert('Gagal update progress: ' + err.message);
    }
  };

  const handleUpdateProgress = (ticketId) => {
    if (isFinished) {
      setModalConfig({
        isOpen: true,
        type: 'confirm',
        title: 'Konfirmasi Penyelesaian Tugas',
        message: 'Apakah Anda yakin pekerjaan teknis untuk tiket ini telah selesai dikerjakan 100%?',
        confirmText: 'Ya, Selesaikan Tugas',
        cancelText: 'Periksa Kembali',
        onConfirm: () => {
          closeModal();
          executeUpdateProgress(ticketId);
        }
      });
    } else {
      executeUpdateProgress(ticketId);
    }
  };

  const handleConfirmAndRate = async (ticketId) => {
    try {
      await api.submitFeedback(ticketId, { rating: rateOverall, comment: rateComment });
      loadTickets(); // Refresh from DB

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
      setModalConfig({
        isOpen: true,
        type: 'success',
        title: 'Ulasan Berhasil Dikirim',
        message: 'Terima kasih atas penilaian Anda! Tiket berhasil dikonfirmasi dan ulasan telah disimpan ke sistem.',
        confirmText: 'Selesai & Tutup',
        onConfirm: closeModal
      });
      setSelectedTicket(null);
    } catch (err) {
      alert('Gagal mengirim feedback: ' + err.message);
    }
  };

  const executeApprove = async (ticketUuid) => {
    try {
      const teamObj = teams.find(t => t.name === selectedTeam);
      const team_id = teamObj ? teamObj.id : null;
      
      await api.verifyTicket(ticketUuid);
      await api.assignTicket(ticketUuid, { team_id, user_id: null });
      loadTickets(); // Refresh from DB
      setSelectedTicket(null);
      setModalConfig({
        isOpen: true,
        type: 'success',
        title: 'Permohonan Berhasil Diverifikasi',
        message: `Tiket berhasil disetujui dan dialihkan ke status Diproses untuk dikerjakan oleh ${selectedTeam || 'Tim Teknis'}.`,
        confirmText: 'Selesai & Tutup',
        onConfirm: closeModal
      });
    } catch (err) {
      alert('Gagal menyetujui tiket: ' + err.message);
    }
  };

  const handleApprove = (ticketUuid) => {
    setModalConfig({
      isOpen: true,
      type: 'confirm',
      title: 'Konfirmasi Verifikasi Permohonan',
      message: `Apakah berkas permohonan telah memenuhi syarat dan siap diteruskan kepada ${selectedTeam || 'Tim Teknis'}?`,
      confirmText: 'Ya, Setujui & Teruskan',
      cancelText: 'Batal',
      onConfirm: () => {
        closeModal();
        executeApprove(ticketUuid);
      }
    });
  };

  const executeReject = (ticketId) => {
    const reasonText = rejectReason.trim();
    setTickets(prev => prev.map(t => {
      if (t.uuid === ticketId) {
        const stage2RejectLog = {
          date: getCurrentLogTimeFormatted(0),
          text: `Permohonan diverifikasi & ditangguhkan oleh Helpdesk. Alasan: ${reasonText}`
        };
        return {
          ...t,
          status: 'Pending',
          logs: [
            stage2RejectLog,
            ...(t.logs || [])
          ]
        };
      }
      return t;
    }));
    setSelectedTicket(null);
    setRejectReason('');
    setShowRejectForm(false);
    setModalConfig({
      isOpen: true,
      type: 'success',
      title: 'Tiket Berhasil Ditangguhkan',
      message: 'Status tiket berhasil diubah menjadi Pending dan catatan perbaikan telah diteruskan ke pemohon.',
      confirmText: 'Selesai & Tutup',
      onConfirm: closeModal
    });
  };

  const handleReject = (ticketId) => {
    if (user?.role !== 'HELPDESK') return;
    if (!rejectReason.trim()) {
      setModalConfig({
        isOpen: true,
        type: 'warning',
        title: 'Alasan Penangguhan Wajib Diisi',
        message: 'Silakan isi kolom alasan penangguhan terlebih dahulu untuk memberikan instruksi yang jelas kepada pemohon.',
        confirmText: 'Tutup & Lengkapi',
        onConfirm: closeModal
      });
      return;
    }
    setModalConfig({
      isOpen: true,
      type: 'warning',
      title: 'Konfirmasi Penangguhan Tiket',
      message: 'Apakah Anda yakin ingin menangguhkan tiket ini? Pemohon akan diminta untuk memperbaiki atau melengkapi berkas permohonan.',
      confirmText: 'Ya, Tangguhkan Tiket',
      cancelText: 'Batal',
      onConfirm: () => {
        closeModal();
        executeReject(ticketId);
      }
    });
  };

  const getRoleTabs = () => {
    return [
      { id: 'semua', label: 'Semua' },
      { id: 'proses', label: 'Dalam Proses' },
      { id: 'selesai', label: 'Belum Dinilai / SKM' },
      { id: 'dirating', label: 'Selesai & Dinilai' },
      { id: 'pending', label: 'Pending' }
    ];
  };

  const tabs = getRoleTabs();
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || '');

  useEffect(() => {
    const newTabs = getRoleTabs();
    if (newTabs.length > 0) {
      setActiveTab(newTabs[0].id);
    }
  }, [user?.role]);

  const getUserTeams = (u) => {
    if (!u) return [];
    return (teams || []).filter(t => (t.members && t.members.includes(u.name)) || t.leader === u.name);
  };

  const getUserTeam = (u) => {
    const myTeams = getUserTeams(u);
    return myTeams.length > 0 ? myTeams[0].name : '';
  };

  const getTicketTeam = (t) => {
    if (t.team) return t.team;
    const svc = t.service;
    if (svc === 'Pengembangan & Pengelolaan Aplikasi' || svc === 'Rekomendasi & Evaluasi Aplikasi' || svc === 'Uji Kesesuaian Sistem (UKS)' || svc === 'Pengelolaan Aplikasi Informatika') {
      return 'Tim Aplikasi & Sistem Informasi';
    }
    if (svc === 'Jaringan Intra Pemerintah' || svc === 'Server Perangkat Daerah' || svc === 'Infrastruktur TIK' || svc === 'Wifi Publik' || svc === 'Domain & Subdomain Pemerintah Daerah' || svc === 'Pengelolaan Sumber Daya & Perangkat Informatika') {
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
    
    if (tabId === 'proses') return base.filter(t => t.status === 'Verifikasi' || t.status === 'Menunggu Validasi' || t.status === 'Diproses').length;
    if (tabId === 'selesai') return base.filter(t => t.status === 'Selesai' && !t.rating).length;
    if (tabId === 'dirating') return base.filter(t => t.status === 'Selesai' && t.rating).length;
    if (tabId === 'pending') return base.filter(t => t.status === 'Pending').length;
    return base.length;
  };

  const getFilteredTickets = () => {
    if (!user) return [];
    
    let base = tickets || [];

    if (activeTab === 'proses') {
      return base.filter(t => t.status === 'Verifikasi' || t.status === 'Menunggu Validasi' || t.status === 'Diproses');
    }
    if (activeTab === 'selesai') {
      return base.filter(t => t.status === 'Selesai' && !t.rating);
    }
    if (activeTab === 'dirating') {
      return base.filter(t => t.status === 'Selesai' && t.rating);
    }
    if (activeTab === 'pending') {
      return base.filter(t => t.status === 'Pending');
    }
    return base;
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
          {(user?.role === 'USER' || user?.role === 'MASYARAKAT') ? 'Tiket Saya' :
           user?.role === 'HELPDESK' ? 'Kelola Tiket SPBE' :
           user?.role === 'PEGAWAI' ? 'Tiket Pekerjaan TIK' :
           'Daftar Tiket SPBE'}
        </h2>
        <p className="text-slate-500 text-base leading-relaxed mt-1.5">
          {(user?.role === 'USER' || user?.role === 'MASYARAKAT') && 'Pantau seluruh pengajuan tiket instansi Anda, hasil penyelesaian, dan penilaian ulasan yang telah dikirimkan.'}
          {user?.role === 'HELPDESK' && 'Daftar riwayat validasi tiket, baik yang disetujui untuk diteruskan ke tim pelaksana maupun yang ditolak.'}
          {user?.role === 'PEGAWAI' && 'Daftar riwayat tugas pengerjaan teknis yang didelegasikan ke tim Anda beserta evaluasi rating dari OPD.'}
          {user?.role === 'ADMIN' && 'Daftar seluruh riwayat pengajuan tiket layanan SPBE dari seluruh OPD di Kota Bogor.'}
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
                        {(t.team || getTicketTeam(t)) && (
                          <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded font-semibold">
                            {t.team || getTicketTeam(t)}
                          </span>
                        )}
                      </div>
                      {/* Progress bar removed dynamically */}

                      <div className="text-xs text-slate-450 font-bold mt-2.5 flex items-center gap-1.5 flex-wrap">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>SLA Standar: {t.slaDuration || 7} Hari</span>
                        <span className="text-slate-300">|</span>
                        {t.status === 'Verifikasi' ? (
                          <span className="text-slate-400 font-semibold">Belum Berjalan (Menunggu Verifikasi)</span>
                        ) : t.status === 'Pending' ? (
                          <span className="text-amber-600 font-semibold">Tertangguh (Menunggu Revisi)</span>
                        ) : (
                          <span className={(t.slaRemainingDays !== undefined ? t.slaRemainingDays : t.remainingDays) < 0 ? 'text-rose-600 font-extrabold' : 'text-emerald-600 font-extrabold'}>
                            {(t.slaRemainingDays !== undefined ? t.slaRemainingDays : t.remainingDays) < 0 
                              ? `Terlewat ${Math.abs(t.slaRemainingDays !== undefined ? t.slaRemainingDays : t.remainingDays)} Hari` 
                              : `Sisa ${t.slaRemainingDays !== undefined ? t.slaRemainingDays : t.remainingDays} Hari`}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex md:flex-col items-center md:items-end gap-3 self-stretch md:self-auto justify-between shrink-0">
                      <span className={`px-2.5 py-1 rounded text-xs font-extrabold uppercase tracking-wider ${
                        t.status === 'Selesai' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        t.status === 'Pending' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                        t.status === 'Diproses' ? 'bg-sky-50 text-sky-700 border border-sky-100' :
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
                    selectedTicket.status === 'Pending' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                    selectedTicket.status === 'Diproses' ? 'bg-sky-50 text-sky-700 border border-sky-100' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {selectedTicket.status}
                  </span>
                </div>
                <h3 className="font-extrabold text-lg text-slate-800 tracking-tight leading-snug">{selectedTicket.title}</h3>
                <p className="text-base text-slate-500 leading-relaxed">{selectedTicket.desc}</p>
                <button
                  type="button"
                  onClick={() => setShowDetailModal(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-sky-50/90 hover:bg-sky-100 text-sky-800 border border-sky-200/80 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-2xs hover:shadow-xs group cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-sky-600 group-hover:scale-110 transition-transform" />
                  <span>Lihat Formulir Pengajuan Tiket</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 border border-slate-200/60 rounded-2xl p-4 text-left">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Durasi SLA</span>
                  <p className="text-sm font-extrabold text-slate-700 mt-0.5">
                    {selectedTicket.slaDuration || 7} Hari
                  </p>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Status SLA</span>
                  <p className={`text-sm font-black mt-0.5 ${(selectedTicket.status === 'Diproses' && selectedTicket.slaRemainingDays < 0) ? 'text-rose-600' : 'text-slate-700'}`}>
                    {selectedTicket.status === 'Verifikasi' 
                      ? 'Belum Berjalan (Menunggu Verifikasi)' 
                      : selectedTicket.status === 'Pending'
                      ? 'Tertangguh (Menunggu Revisi)'
                      : (selectedTicket.slaRemainingDays !== undefined ? selectedTicket.slaRemainingDays : selectedTicket.remainingDays) < 0 
                      ? `Terlewat ${Math.abs(selectedTicket.slaRemainingDays !== undefined ? selectedTicket.slaRemainingDays : selectedTicket.remainingDays)} Hari` 
                      : `${selectedTicket.slaRemainingDays !== undefined ? selectedTicket.slaRemainingDays : selectedTicket.remainingDays} Hari Tersisa`}
                  </p>
                </div>
              </div>

              {selectedTicket.files && selectedTicket.files.length > 0 && (
                <div className="space-y-2.5 text-left">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Dokumen Lampiran Pengajuan</span>
                  <div className="space-y-2">
                    {selectedTicket.files.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold">
                        <div className="flex items-center gap-2 text-slate-700 min-w-0">
                          <FileText className="w-4 h-4 text-sky-600 shrink-0" />
                          <span className="truncate">{file}</span>
                        </div>
                        <a
                          href={selectedTicket.fileUrl || '/dokumen_permohonan.pdf'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-sky-600 hover:underline px-2.5 py-1 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-all shrink-0"
                        >
                          Buka PDF
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedTicket.bastFile && (
                <div className="space-y-2.5 text-left">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Lampiran Penyelesaian Pegawai (BAST)</span>
                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200 text-sm font-semibold">
                    <div className="flex items-center gap-2 text-slate-700">
                      <FileText className="w-4 h-4 text-emerald-600" />
                      <span className="truncate max-w-[200px]" title={selectedTicket.bastFile}>{selectedTicket.bastFile}</span>
                    </div>
                    <a
                      href={selectedTicket.bastFileUrl || '/bast_selesai.pdf'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-sky-600 hover:underline px-2.5 py-1 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-all shrink-0"
                    >
                      Unduh BAST (PDF)
                    </a>
                  </div>
                </div>
              )}



              {((user?.role === 'HELPDESK' && (selectedTicket.status === 'Verifikasi' || selectedTicket.status === 'Pending')) || 
                (user?.role === 'ADMIN' && selectedTicket.status === 'Verifikasi')) && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 text-left">
                  <div className="flex justify-between items-center">
                    <h4 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">
                      {selectedTicket.status === 'Pending' ? 'Tindakan Validasi Tiket Pending' : (user?.role === 'ADMIN' ? 'Tindakan Penugasan Tim' : 'Tindakan Validasi Helpdesk')}
                    </h4>
                    {selectedTicket.status === 'Pending' && (
                      <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-full text-xs font-black uppercase tracking-wider">
                        Status: Pending
                      </span>
                    )}
                  </div>

                  {selectedTicket.status === 'Pending' && selectedTicket.logs && selectedTicket.logs.length > 0 && (
                    <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs space-y-1">
                      <span className="font-bold text-amber-900 block uppercase tracking-wider">Catatan Riwayat Terakhir:</span>
                      <p className="text-slate-700 italic">
                        "{selectedTicket.logs[0]?.text}"
                      </p>
                    </div>
                  )}

                  {selectedTicket.revisionNote && (
                    <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1">
                      <span className="font-extrabold text-amber-900 block uppercase tracking-wider">Catatan Perbaikan dari Pemohon:</span>
                      <p className="text-slate-800 font-medium italic">
                        "{selectedTicket.revisionNote}"
                      </p>
                    </div>
                  )}
                  
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
                          onClick={() => handleApprove(selectedTicket.uuid)}
                          className="flex-1 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-bold transition-all cursor-pointer"
                        >
                          {selectedTicket.status === 'Pending' ? 'Setujui & Lanjutkan Tiket' : 'Setujui & Tugaskan'}
                        </button>
                        {user?.role === 'HELPDESK' && (
                          <button 
                            onClick={() => setShowRejectForm(true)}
                            className="px-4 py-2.5 border border-amber-200 hover:bg-amber-50 hover:border-amber-300 text-amber-600 rounded-xl text-sm font-bold transition-all cursor-pointer"
                          >
                            {selectedTicket.status === 'Pending' ? 'Perbarui Alasan Pending' : 'Pending'}
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Alasan Penangguhan / Pending</label>
                        <textarea 
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Tuliskan alasan penangguhan..."
                          className="w-full h-24 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-550/20 focus:border-amber-500 resize-none"
                        />
                      </div>

                      <div className="flex gap-3">
                        <button 
                          onClick={() => handleReject(selectedTicket.uuid)}
                          className="flex-1 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-bold transition-all"
                        >
                          Tangguhkan Tiket
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

              {user?.role === 'PEGAWAI' && selectedTicket.status === 'Pending' && (
                <div className="bg-rose-50/50 border border-rose-200 rounded-2xl p-5 space-y-4 text-left animate-in fade-in duration-200">
                  <div className="flex gap-2.5 text-rose-800">
                    <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-extrabold text-rose-900">Pekerjaan Ditangguhkan / Disanggah</p>
                      <p className="mt-1 text-slate-650 leading-relaxed font-semibold">
                        Catatan penangguhan: 
                        <span className="italic text-slate-800 block mt-1 p-2.5 bg-white rounded-xl border border-rose-100/60 font-medium">
                          "{selectedTicket.logs?.[0]?.text || 'Tidak ada catatan'}"
                        </span>
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setModalConfig({
                        isOpen: true,
                        type: 'confirm',
                        title: 'Mulai Kerjakan Kembali Tiket',
                        message: 'Apakah Anda yakin ingin mengaktifkan kembali tiket ini ke status Diproses untuk menindaklanjuti perbaikan teknis?',
                        confirmText: 'Ya, Mulai Kerjakan',
                        cancelText: 'Batal',
                        onConfirm: () => {
                          const updated = tickets.map(t => {
                            if (t.uuid === selectedTicket.uuid) {
                              return {
                                ...t,
                                status: 'Diproses',
                                logs: [
                                  { date: getCurrentLogTimeFormatted(0), text: 'Pegawai memulai kembali perbaikan pekerjaan teknis pasca sanggahan pemohon.' },
                                  ...(t.logs || [])
                                ]
                              };
                            }
                            return t;
                          });
                          setTickets(updated);
                          setSelectedTicket(updated.find(t => t.uuid === selectedTicket.uuid));
                          setModalConfig({
                            isOpen: true,
                            type: 'success',
                            title: 'Tiket Berhasil Diaktifkan Kembali',
                            message: 'Tiket telah kembali ke status Diproses. Anda dapat memperbarui progress dan menyelesaikan perbaikan layanan.',
                            confirmText: 'Selesai & Tutup',
                            cancelText: '',
                            onConfirm: closeModal
                          });
                        }
                      });
                    }}
                    className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold transition-all shadow-sm shadow-rose-500/10 cursor-pointer"
                  >
                    Mulai Kerjakan Kembali Tiket Ini
                  </button>
                </div>
              )}

              {user?.role === 'PEGAWAI' && selectedTicket.status === 'Diproses' && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 text-left">
                  <h4 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Perbarui Status Pekerjaan</h4>
                  
                  <div className="flex items-center gap-3 p-3 bg-white border border-slate-200/60 rounded-xl">
                    <input
                      type="checkbox"
                      id="isFinishedPegawai"
                      checked={isFinished}
                      onChange={(e) => {
                        setIsFinished(e.target.checked);
                        setFileName('');
                      }}
                      className="w-5 h-5 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                    />
                    <label htmlFor="isFinishedPegawai" className="text-sm font-bold text-slate-700 cursor-pointer select-none">
                      Tandai Pekerjaan Selesai (100%)
                    </label>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Catatan Tambahan (Opsional - Terisi Otomatis)</label>
                    <textarea 
                      value={progressNote}
                      onChange={(e) => setProgressNote(e.target.value)}
                      placeholder="Opsional: sistem otomatis mencatat log progres pengerjaan..."
                      className="w-full h-24 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 resize-none"
                    />
                  </div>

                  {isFinished && (
                    <div className="bg-sky-50/30 p-4 rounded-xl border border-sky-100 space-y-3">
                      <div className="flex gap-2 text-sky-700">
                        <Upload className="w-4 h-4 shrink-0 mt-0.5" />
                        <div className="text-xs space-y-1">
                          <p className="font-bold">Unggah Berkas BAST (Opsional)</p>
                          <p className="text-slate-600 leading-relaxed">Opsional: Unggah berkas Berita Acara Serah Terima jika ada.</p>
                        </div>
                      </div>
                      <input
                        type="file"
                        ref={bastInputRef}
                        accept=".pdf,application/pdf"
                        onChange={handleBastFileChange}
                        className="hidden"
                      />
                      {fileName ? (
                        <div className="flex justify-between items-center p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800">
                          <div className="flex items-center gap-2 truncate">
                            <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="truncate">{fileName} ({bastFileSize || 'Valid PDF'})</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <a
                              href={bastFileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 bg-white border border-emerald-300 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-all"
                            >
                              Lihat PDF
                            </a>
                            <button
                              type="button"
                              onClick={() => bastInputRef.current?.click()}
                              className="text-slate-500 hover:text-slate-700 underline text-[11px]"
                            >
                              Ganti
                            </button>
                            <button
                              type="button"
                              onClick={() => { setFileName(''); setBastFileSize(''); }}
                              className="text-rose-500 hover:text-rose-700 underline text-[11px] ml-1"
                            >
                              Hapus
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => bastInputRef.current?.click()}
                          className="w-full py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5 text-sky-600" />
                          <span>Pilih Berkas BAST (.PDF) - Opsional</span>
                        </button>
                      )}
                    </div>
                  )}

                  <button 
                    onClick={() => handleUpdateProgress(selectedTicket.uuid)}
                    className="w-full px-4 py-2.5 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition-all shadow-sm shadow-sky-500/10"
                  >
                    {isFinished ? 'Selesaikan Tugas' : 'Simpan Laporan'}
                  </button>
                </div>
              )}

              {(user?.role === 'USER' || user?.role === 'MASYARAKAT') && selectedTicket.status === 'Selesai' && !selectedTicket.rating && (
                <div className="bg-gradient-to-br from-indigo-50/50 to-sky-50/50 border border-indigo-100 rounded-2xl p-5 space-y-4 text-left">
                  <div className="flex items-center gap-2 text-indigo-700">
                    <Star className="w-5 h-5 fill-indigo-100 text-indigo-650" />
                    <h4 className="font-extrabold text-sm uppercase tracking-wider">Berikan Penilaian & Ulasan</h4>
                  </div>
                  
                  <p className="text-sm text-slate-500 leading-relaxed">Pekerjaan fisik telah selesai 100%. Silakan berikan konfirmasi dan ulasan rating untuk kualitas pelayanan kami.</p>
                  
                  {!showInlineRating ? (
                    <button 
                      onClick={() => setShowSkmModal(true)}
                      className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-indigo-500/20 cursor-pointer"
                    >
                      Isi SKM & Penilaian
                    </button>
                  ) : (
                    <>
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
                    onClick={() => handleConfirmAndRate(selectedTicket.uuid)}
                    className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-indigo-500/20 cursor-pointer"
                  >
                    Konfirmasi Selesai & Kirim Ulasan
                  </button>
                    </>
                  )}
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
                        <span className="text-xs text-slate-400 font-bold block">{formatLogDateDisplay(log.date)}</span>
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

      <TicketDetailModal 
        isOpen={showDetailModal} 
        onClose={() => setShowDetailModal(false)} 
        ticket={selectedTicket} 
      />

      <SkmModal
        isOpen={showSkmModal}
        onClose={() => setShowSkmModal(false)}
        ticket={selectedTicket}
        onConfirm={() => {
          setShowSkmModal(false);
          setShowInlineRating(true);
        }}
      />

      <ActionModal
        isOpen={modalConfig.isOpen}
        onClose={closeModal}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText}
        cancelText={modalConfig.cancelText}
        onConfirm={modalConfig.onConfirm}
      />
    </div>
  );
};
