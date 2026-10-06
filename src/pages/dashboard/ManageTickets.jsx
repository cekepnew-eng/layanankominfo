import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getCurrentLogTimeFormatted, formatLogDateDisplay } from '../../utils/dateUtils';
import { TicketDetailModal } from '../../components/TicketDetailModal';
import { SkmModal } from '../../components/SkmModal';
import { RefillTicketModal } from '../../components/RefillTicketModal';
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
  AlertTriangle,
  ShieldCheck,
  User,
  X
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

export const TicketHistory = ({ mode = 'active' }) => {
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
        const mapped = res.data
          .map(t => ({
            ...t,
            ticket_number: t.ticket_number,
            id: t.ticket_number || t.id,
            uuid: t.id,
            status: t.status_name === 'PENDING' ? 'Verifikasi'
              : t.status_name === 'VERIFIED' ? 'Menunggu Validasi'
                : t.status_name === 'REJECTED' ? 'Pending'
                : t.status_name === 'ASSIGNED' ? 'Diproses'
                  : t.status_name === 'IN_PROGRESS' ? 'Diproses'
                    : t.status_name === 'WAITING_USER_CONFIRMATION' ? 'Selesai'
                      : t.status_name === 'COMPLETED' ? 'Selesai & Dinilai'
                        : (t.status_name || ''),
            title: `Pengajuan Layanan ${t.service_name}`,
            service: t.service_name,
            opd: (t.opd && t.opd !== 'OPD') ? t.opd : 'Dinas Komunikasi dan Informatika',
            date: new Date(t.created_at).toLocaleDateString('id-ID'),
            requestType: 'Baru',
            slaDuration: 7,
            remainingDays: 7,
            bastFile: t.bast_file_name,
            bastFileUrl: t.bast_file_url
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
      if (user?.role !== 'ADMIN' && user?.role !== 'HELPDESK' && user?.role !== 'PEGAWAI') return;
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

  const [rateSpeed, setRateSpeed] = useState(0);
  const [rateResult, setRateResult] = useState(0);
  const [rateComm, setRateComm] = useState(0);
  const [rateQuality, setRateQuality] = useState(0);
  const rateOverall = Math.round((rateSpeed + rateResult + rateComm + rateQuality) / 4);
  const [rateComment, setRateComment] = useState('');

  const [tempProgress, setTempProgress] = useState(0);
  const [progressNote, setProgressNote] = useState('');
  const [tempRemainingDays, setTempRemainingDays] = useState(3);
  const [isFinished, setIsFinished] = useState(false);
  const [pegawaiAction, setPegawaiAction] = useState('pending');
  const [fileName, setFileName] = useState('');
  const [bastFileSize, setBastFileSize] = useState('');
  const [bastFileUrl, setBastFileUrl] = useState('/bast_selesai.pdf');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRefillModal, setShowRefillModal] = useState(false);
  const [showSkmModal, setShowSkmModal] = useState(false);
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [showSubtaskModal, setShowSubtaskModal] = useState(false);
  const [subtaskAssignees, setSubtaskAssignees] = useState({});
  const [rejectSubtaskId, setRejectSubtaskId] = useState(null);
  const [rejectSubtaskReason, setRejectSubtaskReason] = useState('');
  const [showRejectSubtaskModal, setShowRejectSubtaskModal] = useState(false);

  const handleUpdateSubtaskStatus = async (subtaskId, status, comment = '') => {
    try {
      await api.updateSubtaskStatus(selectedTicket.uuid || selectedTicket.id, subtaskId, { status, comment });
      const updatedSubtasks = selectedTicket.subtasks.map(s => s.id === subtaskId ? { ...s, status, comment } : s);
      setSelectedTicket({ ...selectedTicket, subtasks: updatedSubtasks });
      
      if (status === 'REJECTED') {
         setShowRejectSubtaskModal(false);
         setRejectSubtaskReason('');
         setRejectSubtaskId(null);
      }
      loadTickets();
    } catch (err) {
      alert("Gagal update status subtask: " + err.message);
    }
  };

  const handleCreateSubtask = async (e) => {
    e.preventDefault();
    const tasks = Object.entries(subtaskAssignees).filter(([task, assignee]) => assignee && assignee.trim() !== '');
    if (tasks.length === 0) return;
    
    try {
      await Promise.all(tasks.map(([task, assignee]) => 
        api.createSubtask(selectedTicket.uuid || selectedTicket.id, {
          task_name: task,
          assigned_to_name: assignee
        })
      ));
      
      setShowSubtaskModal(false);
      setSubtaskAssignees({});
      loadTickets();
      setModalConfig({
        isOpen: true,
        type: 'success',
        title: 'Berhasil Bagikan Tugas',
        message: 'Tugas asesmen dokumen berhasil disebar ke anggota tim teknis.',
        confirmText: 'Selesai',
        cancelText: '',
        onConfirm: closeModal
      });
    } catch (err) {
      alert("Gagal membagikan tugas: " + err.message);
    }
  };

  const getFileTasks = () => {
    if (!selectedTicket || !selectedTicket.form_data) return ['Evaluasi Dokumen Pemohon'];
    
    const fileFields = [];
    Object.keys(selectedTicket.form_data).forEach(key => {
      // Jika ada key_name, maka field ini adalah upload file
      if (!key.endsWith('_name') && selectedTicket.form_data[`${key}_name`]) {
        fileFields.push(`Asesmen ${key}`);
      }
    });

    return fileFields.length > 0 ? fileFields : ['Evaluasi Dokumen Pemohon'];
  };


  const handleDisputeSubmit = async () => {
    if (!disputeReason.trim()) return;
    try {
      await api.disputeTicket(selectedTicket.uuid || selectedTicket.id, disputeReason);
      setShowDisputeForm(false);
      setDisputeReason('');
      setModalConfig({
        isOpen: true,
        type: 'success',
        title: 'Sanggahan Berhasil',
        message: 'Tiket telah dikembalikan ke Tim Pelaksana untuk diperbaiki.',
        confirmText: 'Tutup',
        onConfirm: closeModal
      });
      loadTickets();
      if (selectedTicket) {
        api.getHistory(selectedTicket.uuid || selectedTicket.id).then(res => {
          if (res && res.data) setHistory(res.data);
        });
      }
    } catch (err) {
      alert('Gagal mengirim sanggahan: ' + err.message);
    }
  };
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

  const [bastFileBase64, setBastFileBase64] = useState('');

  const handleBastFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setBastFileSize((file.size / 1024).toFixed(1) + ' KB');
      const reader = new FileReader();
      reader.onloadend = () => {
        setBastFileBase64(reader.result);
      };
      reader.readAsDataURL(file);
      const url = URL.createObjectURL(file);
      setBastFileUrl(url);
    }
  };

  useEffect(() => {
    if (selectedTicket) {
      setTempProgress(selectedTicket.progress || 0);
      setProgressNote('');
      setPegawaiAction('pending');
      setTempRemainingDays(selectedTicket.remainingDays !== undefined ? selectedTicket.remainingDays : 3);
      setIsFinished(selectedTicket.status.includes('Selesai'));
      setFileName('');
      setShowInlineRating(false);
    }
  }, [selectedTicket?.id]);

  const handleSelectTicket = async (t) => {
    let ticketWithLogs = { ...t };
    try {
      const res = await api.getHistory(t.uuid || t.id);
      if (res.success) {
        // Reverse so newest is first, if backend sends ASC
        ticketWithLogs.logs = res.data.reverse().map(log => ({
          date: log.created_at,
          text: log.log_description,
          author: log.user_name || 'Sistem'
        }));
      }
    } catch (err) {
      console.error('Failed to fetch history', err);
    }
    setSelectedTicket(ticketWithLogs);
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const executeUpdateProgress = async (ticketId) => {
    if (pegawaiAction === 'reject' && !progressNote.trim()) {
      alert('Catatan tambahan wajib diisi ketika mengembalikan tiket ke pemohon.');
      return;
    }

    try {
      await api.updateProgress(ticketId, { 
        progress: pegawaiAction === 'done' ? 100 : tempProgress, 
        note: progressNote.trim(),
        statusAction: pegawaiAction === 'reject' ? 'REJECT' : null,
        ...(pegawaiAction === 'done' && fileName ? { bastFileName: fileName, bastFileBase64: bastFileBase64 } : {})
      });
      loadTickets(); // Refresh from DB
      setProgressNote('');
      setModalConfig({
        isOpen: true,
        type: 'success',
        title: pegawaiAction === 'done' ? 'Tugas Berhasil Diselesaikan' : (pegawaiAction === 'reject' ? 'Tiket Dikembalikan' : 'Progres Berhasil Diperbarui'),
        message: pegawaiAction === 'done'
          ? (fileName ? 'Pekerjaan teknis telah selesai 100% dan Dokumen Pendukung telah diunggah. Pemohon dapat mengisi survei SKM.' : 'Pekerjaan teknis telah selesai 100%! Pemohon dapat mengisi survei SKM.')
          : (pegawaiAction === 'reject' ? 'Tiket berhasil dikembalikan ke pemohon untuk diperbaiki.' : 'Catatan progres pekerjaan berhasil disimpan ke dalam log riwayat tiket.'),
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
    if (rateSpeed === 0 || rateResult === 0 || rateComm === 0 || rateQuality === 0) {
      alert("Harap berikan penilaian bintang untuk semua aspek terlebih dahulu.");
      return;
    }
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


      setRateSpeed(0);
      setRateResult(0);
      setRateComm(0);
      setRateQuality(0);
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

  const executeReject = async (ticketUuid) => {
    const reasonText = rejectReason.trim();
    try {
      await api.rejectTicket(ticketUuid, { note: reasonText });
      loadTickets();
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
    } catch (err) {
      alert('Gagal menangguhkan tiket: ' + err.message);
    }
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
    if (mode === 'history') {
      return [
        { id: 'semua', label: 'Semua Tiket Selesai' }
      ];
    }
    return [
      { id: 'semua', label: 'Semua' },
      { id: 'pending', label: 'Menunggu Verifikasi' },
      { id: 'proses', label: 'Sedang Diproses' }
    ];
  };

  const tabs = getRoleTabs();
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || '');

  useEffect(() => {
    const newTabs = getRoleTabs();
    if (newTabs.length > 0) {
      setActiveTab(newTabs[0].id);
    }
  }, [user?.role, mode]);

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

  const getBaseTickets = () => {
    if (!tickets) return [];
    if (mode === 'history') {
      return tickets.filter(t => {
        const s = t.status || '';
        const sn = t.status_name || '';
        return s.includes('Selesai') || s === 'Menunggu Konfirmasi User' || sn === 'COMPLETED' || sn === 'WAITING_USER_CONFIRMATION';
      });
    }
    return tickets.filter(t => {
      const s = t.status || '';
      const sn = t.status_name || '';
      return !s.includes('Selesai') && s !== 'Menunggu Konfirmasi User' && sn !== 'COMPLETED' && sn !== 'WAITING_USER_CONFIRMATION';
    });
  };

  const getTabCount = (tabId) => {
    if (!user) return 0;
    let base = getBaseTickets();
    if (tabId === 'pending') return base.filter(t => t.status === 'Verifikasi' || t.status === 'Menunggu Validasi' || t.status === 'Pending' || t.status_name === 'PENDING' || t.status_name === 'VERIFIED' || t.status_name === 'REJECTED').length;
    if (tabId === 'proses') return base.filter(t => t.status === 'Diproses' || t.status_name === 'ASSIGNED' || t.status_name === 'IN_PROGRESS').length;
    if (tabId === 'selesai') return base.filter(t => (t.status || '').includes('Selesai') || t.status === 'Menunggu Konfirmasi User' || t.status_name === 'COMPLETED' || t.status_name === 'WAITING_USER_CONFIRMATION').length;
    return base.length;
  };

  const getFilteredTickets = () => {
    if (!user) return [];
    let base = getBaseTickets();
    if (activeTab === 'pending') return base.filter(t => t.status === 'Verifikasi' || t.status === 'Menunggu Validasi' || t.status === 'Pending' || t.status_name === 'PENDING' || t.status_name === 'VERIFIED' || t.status_name === 'REJECTED');
    if (activeTab === 'proses') return base.filter(t => t.status === 'Diproses' || t.status_name === 'ASSIGNED' || t.status_name === 'IN_PROGRESS');
    if (activeTab === 'selesai') return base.filter(t => (t.status || '').includes('Selesai') || t.status === 'Menunggu Konfirmasi User' || t.status_name === 'COMPLETED' || t.status_name === 'WAITING_USER_CONFIRMATION');
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
          {mode === 'history' ? 'Tiket Selesai' :
            (user?.role === 'USER' || user?.role === 'MASYARAKAT') ? 'Pengajuan Tiket Proses' :
              'Tiket Proses SPBE'}
        </h2>
        <p className="text-slate-500 text-base leading-relaxed mt-1.5">
          {mode === 'history' ? 'Daftar riwayat seluruh tiket layanan SPBE yang telah selesai dikerjakan dan dinilai.' :
            'Pantau dan kelola tiket pengajuan layanan SPBE yang saat ini sedang berjalan.'}
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
              className={`px-5 py-3 border-b-2 font-bold text-sm transition-all whitespace-nowrap -mb-px flex items-center gap-2 ${isActive
                  ? 'border-sky-600 text-sky-600 bg-sky-50/50 rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/50'
                }`}
            >
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-black transition-all ${isActive ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-500'
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
            <div className="glass-card rounded-3xl border border-white/60 p-12 text-center text-slate-500 shadow-sm">
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
                    className={`p-6 rounded-3xl border transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 cursor-pointer relative shadow-sm ${isSelected
                        ? 'border-sky-400 bg-sky-50/70 ring-2 ring-sky-300/30'
                        : 'border-white/60 glass-card hover:bg-white/80 hover:border-white'
                      }`}
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-sky-600 uppercase tracking-widest bg-sky-50 px-2 py-0.5 rounded">{t.id}</span>
                        {(t.requires_helpdesk === 'asesmen' || t.requiresHelpdesk === 'asesmen') && (
                          <span className="text-[10px] font-black text-indigo-700 bg-indigo-100 uppercase tracking-wider px-2 py-0.5 rounded">Asesmen</span>
                        )}
                        <span className="text-sm text-slate-400 font-semibold">{t.date}</span>
                      </div>
                      <h3 className="font-extrabold text-base text-slate-800 leading-snug">{t.title}</h3>
                      <p className="text-xs text-slate-450 font-bold uppercase tracking-wider">{t.pemohon}</p>
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
                      <span className={`px-2.5 py-1 rounded text-xs font-extrabold uppercase tracking-wider ${t.status.includes('Selesai') ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
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
            <div className="glass-card rounded-3xl border border-white/60 p-6 space-y-6 sticky top-24 shadow-sm">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-sky-655 uppercase tracking-widest bg-sky-50 px-2 py-0.5 rounded inline-block">{selectedTicket.id}</span>
                    {(selectedTicket?.requires_helpdesk?.toLowerCase() === 'asesmen' || selectedTicket?.requiresHelpdesk?.toLowerCase() === 'asesmen') && (
                      <span className="text-[10px] font-black text-indigo-700 bg-indigo-100 uppercase tracking-wider px-2 py-0.5 rounded inline-block">Asesmen</span>
                    )}
                  </div>
                  <span className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${selectedTicket.status.includes('Selesai') ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
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

                {selectedTicket.status === 'Pending' && (user?.role === 'USER' || user?.role === 'MASYARAKAT') && (
                  <button
                    type="button"
                    onClick={() => setShowRefillModal(true)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md group cursor-pointer mt-3"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Perbaiki & Ajukan Ulang Formulir</span>
                  </button>
                )}
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

              {(selectedTicket.bastFile || selectedTicket.status.includes('Selesai') || selectedTicket.status === 'Menunggu Konfirmasi User') && (
                <div className="space-y-2.5 text-left">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Lampiran Penyelesaian Pegawai (Dokumen Pendukung)</span>
                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200 text-sm font-semibold">
                    <div className="flex items-center gap-2 text-slate-700">
                      <FileText className="w-4 h-4 text-emerald-600" />
                      <span className="truncate max-w-[200px]" title={selectedTicket.bastFile || `Dokumen_${selectedTicket.id}.pdf`}>
                        {selectedTicket.bastFile || `Dokumen_${selectedTicket.id}.pdf`}
                      </span>
                    </div>
                    <a
                      href={selectedTicket.bastFileUrl || '/bast_selesai.pdf'}
                      download={selectedTicket.bastFile || `Dokumen_${selectedTicket.id}.pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-sky-600 hover:underline px-2.5 py-1 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-all shrink-0"
                    >
                      Unduh Dokumen (PDF)
                    </a>
                  </div>
                </div>
              )}



              {(user?.role === 'HELPDESK' && (selectedTicket.status === 'Verifikasi' || selectedTicket.status === 'Pending' || selectedTicket.status === 'Menunggu Validasi' || selectedTicket.status_name === 'PENDING' || selectedTicket.status_name === 'VERIFIED' || selectedTicket.status_name === 'REJECTED')) && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 text-left">
                    <div className="flex justify-between items-center">
                      <h4 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">
                        {selectedTicket.status === 'Pending' ? 'Tindakan Validasi Tiket Pending' : 'Tindakan Validasi Helpdesk'}
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
                            {selectedTicket.status === 'Pending' ? 'Setujui & Lanjutkan Tiket' : 'Process'}
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

              {user?.role === 'PEGAWAI' && (selectedTicket.status === 'Pending' || selectedTicket.status_name === 'REJECTED' || selectedTicket.status_name === 'ASSIGNED') && selectedTicket.status !== 'Diproses' && (
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
                    onClick={async () => {
                      setModalConfig({
                        isOpen: true,
                        type: 'confirm',
                        title: 'Mulai Kerjakan Kembali Tiket',
                        message: 'Apakah Anda yakin ingin mengaktifkan kembali tiket ini ke status Diproses untuk menindaklanjuti perbaikan teknis?',
                        confirmText: 'Ya, Mulai Kerjakan',
                        cancelText: 'Batal',
                        onConfirm: async () => {
                          try {
                            closeModal();
                            await api.updateProgress(selectedTicket.uuid, {
                              progress: selectedTicket.progress || 0,
                              note: 'Pegawai memulai kembali perbaikan pekerjaan teknis pasca sanggahan/revisi pemohon.'
                            });
                            await loadTickets();
                            setSelectedTicket(null);
                            setModalConfig({
                              isOpen: true,
                              type: 'success',
                              title: 'Tiket Berhasil Diaktifkan Kembali',
                              message: 'Tiket telah kembali ke status Diproses. Anda dapat memperbarui progress dan menyelesaikan perbaikan layanan.',
                              confirmText: 'Selesai & Tutup',
                              cancelText: '',
                              onConfirm: closeModal
                            });
                          } catch (err) {
                            alert('Gagal mengaktifkan tiket: ' + err.message);
                          }
                        }
                      });
                    }}
                    className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold transition-all shadow-sm shadow-rose-500/10 cursor-pointer"
                  >
                    Mulai Kerjakan Kembali Tiket Ini
                  </button>
                </div>
              )}

              {/* Fitur UI Subtask Kolegial */}
              {(selectedTicket?.requires_helpdesk?.toLowerCase() === 'asesmen' || selectedTicket?.requiresHelpdesk?.toLowerCase() === 'asesmen') && user?.role !== 'USER' && user?.role !== 'MASYARAKAT' && user?.role !== 'HELPDESK' && (
                <div className="bg-slate-50 border border-indigo-100 rounded-2xl p-5 space-y-4 text-left">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4" /> Tim Asesmen Internal
                      </h4>
                      <p className="text-[10px] text-slate-500 font-medium mt-0.5">Status pembagian tugas ke anggota tim.</p>
                    </div>
                    {(user?.role === 'KETUA TIM' || user?.role === 'ADMIN' || teams?.some(t => t.leader === (user?.full_name || user?.name))) && (
                      <button type="button" onClick={() => setShowSubtaskModal(true)} className="text-[11px] font-bold px-3.5 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-all shadow-xs cursor-pointer">
                        + Bagi Tugas
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                    {(!selectedTicket.subtasks || selectedTicket.subtasks.length === 0) ? (
                       <div className="col-span-full text-center py-4 text-slate-400 font-medium italic text-xs bg-white border border-slate-200 border-dashed rounded-xl">
                         Belum ada pembagian tugas asesmen.
                       </div>
                    ) : (
                       selectedTicket.subtasks.map((sub, idx) => (
                         <div key={idx} className="p-3 bg-white border border-slate-200 rounded-xl flex flex-col justify-between gap-3 shadow-sm hover:border-indigo-200 transition-colors">
                           <div>
                             <p className="text-xs font-bold text-slate-800">{sub.task_name || 'Evaluasi Dokumen'}</p>
                             <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1 mb-2">
                                <User className="w-3 h-3 text-slate-400" />
                                Ditugaskan ke: <span className="font-bold text-indigo-700">{sub.assigned_to_name}</span>
                             </p>

                             {(() => {
                                const tName = sub.task_name || '';
                                if (tName.startsWith('Asesmen ') && selectedTicket?.form_data) {
                                  const key = tName.substring(8);
                                  const fUrl = selectedTicket.form_data[key];
                                  const fName = selectedTicket.form_data[`${key}_name`];
                                  if (fUrl && fName) {
                                    return (
                                      <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100">
                                        <span className="text-[10px] font-bold text-slate-600 truncate mr-2" title={fName}>{fName}</span>
                                        <a href={fUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-2 py-1 bg-sky-100 text-sky-700 hover:bg-sky-200 rounded text-[10px] font-bold transition-all shrink-0 cursor-pointer">
                                          <Eye className="w-3 h-3" /> Lihat
                                        </a>
                                      </div>
                                    );
                                  }
                                }
                                return null;
                             })()}
                           </div>
                           <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                             {sub.status === 'APPROVED' ? (
                               <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-md uppercase tracking-wider flex items-center gap-1">
                                 <CheckCircle2 className="w-3 h-3" /> Approved
                               </span>
                             ) : sub.status === 'REJECTED' ? (
                               <span className="px-2 py-1 bg-rose-100 text-rose-800 text-[10px] font-black rounded-md uppercase tracking-wider flex items-center gap-1">
                                 <X className="w-3 h-3" /> Rejected
                               </span>
                             ) : (
                               <div className="flex gap-2">
                                 {sub.assigned_to_name === (user?.full_name || user?.name) ? (
                                   <>
                                     <button onClick={() => handleUpdateSubtaskStatus(sub.id, 'APPROVED')} className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[10px] font-black rounded-md uppercase tracking-wider transition-all cursor-pointer">✅ Sesuai</button>
                                     <button onClick={() => {
                                        setRejectSubtaskId(sub.id);
                                        setShowRejectSubtaskModal(true);
                                     }} className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 text-[10px] font-black rounded-md uppercase tracking-wider transition-all cursor-pointer">❌ Tidak Sesuai</button>
                                   </>
                                 ) : (
                                   <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-black rounded-md uppercase tracking-wider">
                                     Pending
                                   </span>
                                 )}
                               </div>
                             )}
                           </div>
                         </div>
                       ))
                    )}
                  </div>
                </div>
              )}

              {user?.role === 'PEGAWAI' && (selectedTicket.status === 'Diproses' || selectedTicket.status_name === 'IN_PROGRESS') && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 text-left">
                  <h4 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Perbarui Status Pekerjaan</h4>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Aksi Pekerjaan</label>
                    <select
                      value={pegawaiAction}
                      onChange={(e) => {
                        setPegawaiAction(e.target.value);
                        setFileName('');
                        setIsFinished(e.target.value === 'done');
                      }}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                    >
                      <option value="approve">Approve</option>
                      <option value="pending">Pending</option>
                      <option value="done">Sudah Selesai</option>
                      <option value="reject">Reject</option>
                    </select>
                  </div>



                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                      {pegawaiAction === 'reject' ? 'Catatan Penolakan (Wajib Diisi)' : 'Catatan Tambahan (Opsional - Terisi Otomatis)'}
                    </label>
                    <textarea
                      value={progressNote}
                      onChange={(e) => setProgressNote(e.target.value)}
                      required={pegawaiAction === 'reject'}
                      placeholder={pegawaiAction === 'reject' ? 'Contoh: Dokumen lampiran kurang jelas, mohon perbaiki dan unggah ulang...' : 'Opsional: sistem otomatis mencatat log progres pengerjaan...'}
                      className={`w-full h-24 px-4 py-3 bg-white border rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 resize-none ${pegawaiAction === 'reject' ? 'border-rose-200 focus:ring-rose-500/20 focus:border-rose-500' : 'border-slate-200 focus:ring-sky-500/20 focus:border-sky-500'}`}
                    />
                  </div>

                  {isFinished && (
                    <div className="bg-sky-50/30 p-4 rounded-xl border border-sky-100 space-y-3">
                      <div className="flex gap-2 text-sky-700">
                        <Upload className="w-4 h-4 shrink-0 mt-0.5" />
                        <div className="text-xs space-y-1">
                          <p className="font-bold">Unggah Dokumen Pendukung (Opsional)</p>
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
                          <span>Pilih Dokumen Pendukung (.PDF) - Opsional</span>
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
                    !showDisputeForm ? (
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => setShowSkmModal(true)}
                          className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-indigo-500/20 cursor-pointer"
                        >
                          Terima & Isi SKM
                        </button>
                        <button
                          onClick={() => setShowDisputeForm(true)}
                          className="w-full px-4 py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-xl text-sm font-bold transition-all cursor-pointer"
                        >
                          Sanggah Hasil (Tidak Sesuai)
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3 mt-2 border border-rose-100 bg-white p-4 rounded-xl shadow-sm">
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Alasan Sanggah / Revisi</label>
                        <textarea
                          rows="3"
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-rose-500 font-semibold"
                          placeholder="Jelaskan mengapa hasil belum sesuai..."
                          value={disputeReason}
                          onChange={(e) => setDisputeReason(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setShowDisputeForm(false); setDisputeReason(''); }}
                            className="flex-1 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-bold cursor-pointer"
                          >
                            Batal
                          </button>
                          <button
                            onClick={handleDisputeSubmit}
                            disabled={!disputeReason.trim()}
                            className="flex-1 px-3 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-bold disabled:opacity-50 cursor-pointer"
                          >
                            Kirim Sanggahan
                          </button>
                        </div>
                      </div>
                    )
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
                              type="button"
                              className="focus:outline-none transition-all cursor-default"
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
                        <div className={`absolute -left-[25px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white ${isNewest && !selectedTicket.status.includes('Selesai')
                            ? 'bg-emerald-500 ring-4 ring-emerald-100 animate-pulse'
                            : 'bg-slate-300'
                          }`}></div>
                        <span className="text-xs text-slate-400 font-bold block">{formatLogDateDisplay(log.date)} - {log.author || 'Sistem'}</span>
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
        onBagiTugas={() => {
          setShowDetailModal(false);
          setShowSubtaskModal(true);
        }}
      />

      {showSubtaskModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-lg font-black text-slate-800">Bagi Tugas Asesmen</h3>
              <p className="text-sm text-slate-500 mt-1">Pilih anggota tim untuk mengerjakan evaluasi spesifik.</p>
              
              <form onSubmit={handleCreateSubtask} className="space-y-4 mt-6">
                <div className="space-y-3 max-h-64 overflow-y-auto px-1">
                  {getFileTasks().map((taskName, idx) => (
                    <div key={idx}>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">{taskName}</label>
                      <select 
                        value={subtaskAssignees[taskName] || ''} 
                        onChange={e => setSubtaskAssignees({...subtaskAssignees, [taskName]: e.target.value})} 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      >
                        <option value="">-- Pilih Anggota --</option>
                        {Array.from(new Set((teams || [])
                           .filter(t => t.leader === (user?.full_name || user?.name) || user?.role === 'ADMIN')
                           .flatMap(t => t.members || [])))
                           .filter(m => m !== (user?.full_name || user?.name))
                           .map(m => (
                             <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setShowSubtaskModal(false)} className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-bold transition-all">Batal</button>
                  <button type="submit" className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-md">Bagikan Tugas</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <RefillTicketModal
        isOpen={showRefillModal}
        onClose={() => setShowRefillModal(false)}
        ticket={selectedTicket}
        onSave={async (updatedTicket) => {
          try {
            const formDataPayload = updatedTicket.form_data || selectedTicket?.form_data || {};
            const logMessage = updatedTicket.logs?.[0]?.text || 'Pemohon telah memperbarui dan melengkapi formulir dokumen pengajuan. Tiket dikirim kembali untuk diverifikasi ulang.';

            await api.updateTicketData(updatedTicket.uuid || updatedTicket.id, formDataPayload, logMessage, updatedTicket.files, updatedTicket.fileUrl);
            loadTickets();
          } catch (err) {
            console.error(err);
            alert('Gagal mengirim perbaikan form.');
          }
        }}
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

      {showRejectSubtaskModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-lg font-black text-rose-700">Tugas Tidak Sesuai (Revisi)</h3>
              <p className="text-sm text-slate-500 mt-1">Silakan berikan alasan mengapa dokumen/tugas ini butuh revisi.</p>
              
              <div className="space-y-4 mt-6">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Catatan Penolakan</label>
                  <textarea 
                    required 
                    value={rejectSubtaskReason} 
                    onChange={e => setRejectSubtaskReason(e.target.value)} 
                    placeholder="Tuliskan kekurangan dokumen atau alasan penolakan..." 
                    className="w-full h-24 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none" 
                  />
                </div>
                
                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => {
                    setShowRejectSubtaskModal(false);
                    setRejectSubtaskReason('');
                    setRejectSubtaskId(null);
                  }} className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-bold transition-all cursor-pointer">Batal</button>
                  <button onClick={() => {
                    if(!rejectSubtaskReason.trim()) return alert("Catatan wajib diisi!");
                    handleUpdateSubtaskStatus(rejectSubtaskId, 'REJECTED', rejectSubtaskReason);
                  }} className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold transition-all shadow-md cursor-pointer">Kirim Revisi</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
