import React, { useState, useEffect } from 'react';
import { FileText, Star, AlertCircle, CheckCircle2, ChevronRight, Sparkles, Send, RefreshCw, Upload, AlertTriangle, Check, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getCurrentLogTimeFormatted, formatLogDateDisplay } from '../../utils/dateUtils';
import { TicketDetailModal } from '../../components/TicketDetailModal';
import { RefillTicketModal } from '../../components/RefillTicketModal';
import { SkmModal } from '../../components/SkmModal';
import { ActionModal } from '../../components/ActionModal';
import { api } from '../../services/api';

export const MyTickets = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRefillModal, setShowRefillModal] = useState(false);
  const [showSkmModal, setShowSkmModal] = useState(false);
  const [activeTab, setActiveTab] = useState('Semua');

  const getFilteredTickets = () => {
    if (activeTab === 'Semua') return tickets;
    if (activeTab === 'Pending') return tickets.filter(t => t.status_name === 'PENDING' || t.status_name === 'VERIFIED');
    if (activeTab === 'Proses') return tickets.filter(t => t.status_name === 'ASSIGNED' || t.status_name === 'IN_PROGRESS');
    if (activeTab === 'Selesai') return tickets.filter(t => t.status_name === 'WAITING_USER_CONFIRMATION' || t.status_name === 'COMPLETED');
    return tickets;
  };

  const fetchTickets = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      let res;
      if (user?.role === 'ADMIN') {
        res = await api.getAdminTickets();
      } else if (user?.role === 'HELPDESK') {
        res = await api.getHelpdeskTickets();
      } else if (user?.role === 'PEGAWAI') {
        res = await api.getEmployeeTickets();
      } else {
        res = await api.getMyTickets();
      }
      
      if (res.data) {
        const mapped = res.data.map(t => ({
          ...t,
          status: t.status_name === 'PENDING' ? 'Pending'
                : t.status_name === 'VERIFIED' ? 'Menunggu Validasi'
                : t.status_name === 'ASSIGNED' ? 'Diproses'
                : t.status_name === 'IN_PROGRESS' ? 'Diproses'
                : t.status_name === 'WAITING_USER_CONFIRMATION' ? 'Menunggu Konfirmasi'
                : t.status_name === 'COMPLETED' ? 'Selesai'
                : t.status_name
        }));
        setTickets(mapped);
      } else {
        setTickets([]);
      }
    } catch (err) {
      console.error(err);
      // alert dihapus sesuai permintaan
    } finally {
      setLoading(false);
    }
  };
  const [skmQ1, setSkmQ1] = useState('Sangat Baik');
  const [skmQ2, setSkmQ2] = useState('Sangat Baik');
  const [skmQ3, setSkmQ3] = useState('Sangat Baik');

  const [ratingSpeed, setRatingSpeed] = useState(5);
  const [ratingResult, setRatingResult] = useState(5);
  const [ratingCommunication, setRatingCommunication] = useState(5);
  const [ratingQuality, setRatingQuality] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');
  const [showRatingModal, setShowRatingModal] = useState(false);

  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: 'confirm',
    title: '',
    message: '',
    confirmText: 'Lanjutkan',
    cancelText: 'Batal',
    onConfirm: null
  });

  const selectTicket = async (ticket) => {
    let ticketWithLogs = { ...ticket };
    try {
      const res = await api.getHistory(ticket.id);
      if (res.success) {
        ticketWithLogs.logs = res.data;
      }
    } catch (e) {
      console.error('Failed to load history', e);
    }
    setSelectedTicket(ticketWithLogs);
    setShowDisputeForm(false);
    setDisputeReason('');
    setShowRefillModal(false);
    setShowSkmModal(false);
  };

  const handleConfirmSkm = async (ticket) => {
    setShowSkmModal(false);
    try {
      await api.submitFeedback(ticket.id, { rating: 5, comment: 'Selesai mengisi SKM MenPAN-RB.' });
      
      let res;
      if (user?.role === 'ADMIN') res = await api.getAdminTickets();
      else if (user?.role === 'HELPDESK') res = await api.getHelpdeskTickets();
      else if (user?.role === 'PEGAWAI') res = await api.getEmployeeTickets();
      else res = await api.getMyTickets();
      
      let mapped = [];
      if (res.data) {
        mapped = res.data.map(t => ({
          ...t,
          status: t.status_name === 'PENDING' ? 'Pending'
                : t.status_name === 'VERIFIED' ? 'Menunggu Validasi'
                : t.status_name === 'ASSIGNED' ? 'Diproses'
                : t.status_name === 'IN_PROGRESS' ? 'Diproses'
                : t.status_name === 'WAITING_USER_CONFIRMATION' ? 'Menunggu Konfirmasi'
                : t.status_name === 'COMPLETED' ? 'Selesai'
                : t.status_name
        }));
      }
      setTickets(mapped);
      setSelectedTicket(mapped.find(t => t.id === ticket.id) || null);
      
      setModalConfig({
        isOpen: true,
        type: 'success',
        title: 'Tiket Selesai',
        message: 'Terima kasih telah mengisi Survei Kepuasan Masyarakat. Pengajuan layanan ini telah sepenuhnya selesai.',
        confirmText: 'Tutup',
        cancelText: '',
        onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
      });
    } catch (err) {
      console.error(err);
      alert('Gagal menyelesaikan tiket: ' + err.message);
    }
  };

  const handlePreDisputeTicket = (id, reason) => {
    if (!reason.trim()) {
      setModalConfig({
        isOpen: true,
        type: 'warning',
        title: 'Alasan Sanggahan Belum Diisi',
        message: 'Mohon cantumkan rincian alasan sanggahan sebelum mengirimkan permohonan evaluasi ulang.',
        confirmText: 'Lengkapi Alasan',
        cancelText: '',
        onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }

    setModalConfig({
      isOpen: true,
      type: 'warning',
      title: 'Konfirmasi Sanggahan Hasil Layanan',
      message: 'Apakah Anda yakin ingin menyanggah hasil pekerjaan ini? Status tiket akan dialihkan kembali menjadi Pending/Ditangguhkan untuk dievaluasi ulang oleh tim pelaksana teknis.',
      confirmText: 'Ya, Ajukan Sanggahan',
      cancelText: 'Periksa Kembali',
      onConfirm: () => executeDisputeTicket(id, reason)
    });
  };

  const executeDisputeTicket = (id, reason) => {
    const updatedTickets = tickets.map(t => {
      if (t.id === id) {
        const cleanedLogs = (t.logs || []).filter(l => !l.text.includes('Menunggu konfirmasi'));
        return {
          ...t,
          status: 'Pending',
          logs: [
            { date: getCurrentLogTimeFormatted(0), text: `Pemohon menyanggah hasil pekerjaan layanan. Alasan: ${reason.trim()}` },
            ...cleanedLogs
          ]
        };
      }
      return t;
    });
    setTickets(updatedTickets);
    setSelectedTicket(updatedTickets.find(t => t.id === id));
    setShowDisputeForm(false);
    setDisputeReason('');
    setModalConfig({
      isOpen: true,
      type: 'success',
      title: 'Sanggahan Berhasil Diajukan',
      message: 'Sanggahan hasil pengerjaan berhasil dikirim. Tim teknis pelaksana akan meninjau catatan Anda dan menindaklanjuti perbaikan yang diperlukan.',
      confirmText: 'Selesai & Tutup',
      cancelText: '',
      onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
    });
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSendSurvey = async (e) => {
    e.preventDefault();
    if (!selectedTicket) return;
    try {
      await api.submitFeedback(selectedTicket.id, { rating: ratingResult, comment: feedbackText || 'Pelayanan memuaskan.' });
      
      let res;
      if (user?.role === 'ADMIN') res = await api.getAdminTickets();
      else if (user?.role === 'HELPDESK') res = await api.getHelpdeskTickets();
      else if (user?.role === 'PEGAWAI') res = await api.getEmployeeTickets();
      else res = await api.getMyTickets();
      
      let mapped = [];
      if (res.data) {
        mapped = res.data.map(t => ({
          ...t,
          status: t.status_name === 'PENDING' ? 'Pending'
                : t.status_name === 'VERIFIED' ? 'Menunggu Validasi'
                : t.status_name === 'ASSIGNED' ? 'Diproses'
                : t.status_name === 'IN_PROGRESS' ? 'Diproses'
                : t.status_name === 'WAITING_USER_CONFIRMATION' ? 'Menunggu Konfirmasi'
                : t.status_name === 'COMPLETED' ? 'Selesai'
                : t.status_name
        }));
      }
      setTickets(mapped);
      setSelectedTicket(mapped.find(t => t.id === selectedTicket.id) || null);
      
      setModalConfig({
        isOpen: true,
        type: 'success',
        title: 'Berhasil',
        message: 'Terima kasih atas penilaian Anda.',
        confirmText: 'Tutup',
        cancelText: '',
        onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
      });
      setShowRatingModal(false);
    } catch (err) {
      console.error(err);
      alert('Gagal mengirim penilaian');
    }
  };

  const getStatusColor = (statusName) => {
    switch (statusName) {
      case 'PENDING': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'VERIFIED': return 'bg-sky-100 text-sky-700 border-sky-200';
      case 'ASSIGNED': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'IN_PROGRESS': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'WAITING_USER_CONFIRMATION': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'REJECTED': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (loading) return <div className="p-8 text-slate-500 font-bold">Loading tiket saya...</div>;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 text-left">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Tiket Pengajuan Saya</h2>
        <p className="text-slate-500">Pantau status layanan dan berikan penilaian untuk pekerjaan yang telah selesai.</p>
      </div>

      <div className="flex gap-2 border-b border-slate-200/50 overflow-x-auto pb-px">
        {['Semua', 'Pending', 'Proses', 'Selesai'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-3 border-b-2 font-bold text-sm transition-all whitespace-nowrap -mb-px flex items-center gap-2 ${
              activeTab === tab
                ? 'border-sky-500 text-sky-600'
                : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'
            }`}
          >
            {tab}
            <span className={`px-2 py-0.5 rounded-full text-xs font-black transition-all ${
              activeTab === tab 
                ? 'bg-sky-100 text-sky-700' 
                : 'bg-slate-100 text-slate-500'
            }`}>
              {tab === 'Semua' ? tickets.length : getFilteredTickets().length}
            </span>
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {getFilteredTickets().length === 0 ? (
          <div className="glass-card rounded-3xl border border-white/60 shadow-sm overflow-hidden">
            <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Belum Ada Tiket</h3>
            <p className="text-slate-500">Tidak ada tiket di kategori ini.</p>
          </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {getFilteredTickets().map(ticket => (
              <div key={ticket.id} className="glass-card rounded-3xl border border-white/60 shadow-sm p-6 hover:bg-white/80 transition-colors">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-sky-50/80 border border-sky-100 text-sky-600 rounded-2xl shadow-sm">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-mono font-bold text-sm text-slate-500">{ticket.ticket_number}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusColor(ticket.status_name)}`}>
                          {ticket.status_name.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <h4 className="text-lg font-bold text-slate-900 mb-1">{ticket.service_name}</h4>
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span>Diajukan: {new Date(ticket.created_at).toLocaleDateString('id-ID')}</span>
                        {ticket.status_name === 'IN_PROGRESS' && (
                          <span className="text-sky-600 font-semibold">Progress: {ticket.progress}%</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {ticket.status_name === 'WAITING_USER_CONFIRMATION' && (
                      <button 
                        onClick={() => selectTicket(ticket)}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-xl transition-all flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Beri Penilaian
                      </button>
                    )}
                    <button 
                      onClick={() => {
                        selectTicket(ticket);
                        setShowDetailModal(true);
                      }}
                      className="px-4 py-2 glass-card border border-white/60 hover:bg-white/80 text-slate-700 text-sm font-bold rounded-2xl transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                    >
                      <span>Lihat Detail</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedTicket && (
        <div className="mt-8 space-y-4">
          {selectedTicket.status === 'Selesai' && selectedTicket.bastFile && (
            <div className="space-y-2.5 text-left">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Lampiran Penyelesaian Pegawai</span>
              <div className="flex items-center justify-between glass-card p-3 rounded-2xl border border-white/60 text-sm font-semibold shadow-sm">
                <div className="flex items-center gap-2 text-slate-700 overflow-hidden">
                  <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="truncate max-w-[200px]" title={selectedTicket.bastFile}>{selectedTicket.bastFile}</span>
                </div>
                <a
                  href={selectedTicket.bastFileUrl || '/bast_selesai.pdf'}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-emerald-600 hover:underline px-2.5 py-1 glass-card border border-white/60 rounded-xl hover:bg-white/80 transition-all shrink-0 shadow-sm"
                >
                  Buka PDF BAST
                </a>
              </div>
            </div>
          )}

          {selectedTicket.status === 'Pending' && (
            <div className="space-y-4">
              {selectedTicket.logs?.some(l => l.text.toLowerCase().includes('menyanggah')) ? (
                <div className="bg-rose-50/50 p-5 rounded-2xl border border-rose-200 space-y-3 text-left animate-in fade-in duration-200">
                  <div className="flex gap-2.5 text-rose-800">
                    <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-extrabold text-rose-900">Sanggahan Anda Sedang Ditinjau</p>
                      <p className="mt-1 text-slate-650 leading-relaxed font-semibold text-xs">
                        Anda telah mengajukan sanggahan terhadap hasil pekerjaan. Tim teknis pelaksana sedang meninjau dan melakukan tindak lanjut perbaikan.
                      </p>
                      <div className="mt-2.5 p-3 glass-card rounded-2xl border border-rose-100/80 text-xs italic text-slate-700 shadow-sm">
                        "{selectedTicket.logs.find(l => l.text.toLowerCase().includes('menyanggah'))?.text || selectedTicket.logs[0]?.text}"
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="glass-card border border-white/60 rounded-3xl p-5 space-y-4 text-left animate-in fade-in duration-200 shadow-sm">
                  <div className="flex gap-2.5 text-slate-800">
                    <AlertCircle className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-extrabold text-slate-900 text-base">Permohonan Memerlukan Perbaikan / Klarifikasi</p>
                      <p className="mt-1 text-slate-500 leading-relaxed font-semibold text-xs">
                        Helpdesk telah menangguhkan permohonan Anda. Silakan isi ulang seluruh formulir permohonan dan sertakan catatan perbaikan jika diperlukan.
                      </p>
                      {selectedTicket.logs && selectedTicket.logs.length > 0 && (
                        <div className="mt-2.5 p-3 glass-card rounded-2xl border border-white/60 text-xs shadow-sm">
                          <span className="font-bold text-slate-500 uppercase tracking-wider block mb-1">Catatan dari Helpdesk:</span>
                          <p className="text-slate-700 italic font-medium">
                            "{selectedTicket.logs.find(l => l.text.toLowerCase().includes('helpdesk') || l.text.toLowerCase().includes('ditangguhkan') || l.text.toLowerCase().includes('alasan:'))?.text || selectedTicket.logs[0]?.text}"
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowRefillModal(true)}
                    className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-sky-500/10 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Isi Ulang Formulir & Kirim Perbaikan</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {selectedTicket.status_name === 'WAITING_USER_CONFIRMATION' && (
            <div className="bg-sky-50/50 p-4 rounded-xl border border-sky-100/50 space-y-4">
              <div className="flex gap-2.5 text-sky-800">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-sky-600" />
                <div className="text-sm">
                  <p className="font-bold">Layanan Selesai Dikerjakan</p>
                  <p className="mt-0.5 text-sky-650/80 leading-relaxed">
                    Pekerjaan layanan telah diselesaikan oleh tim teknis. Mohon luangkan waktu Anda untuk mengisi Survei Kepuasan Masyarakat (SKM) MenPAN-RB.
                  </p>
                </div>
              </div>

              {showDisputeForm ? (
                <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200 text-left animate-in fade-in duration-200">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Tuliskan Alasan Sanggahan</label>
                  <textarea
                    rows="3"
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    placeholder="Jelaskan apa yang belum sesuai atau kendala yang masih terjadi..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowDisputeForm(false);
                        setDisputeReason('');
                      }}
                      className="flex-1 py-2 border border-slate-200 text-slate-700 bg-white rounded-lg text-xs font-bold hover:bg-slate-100 transition-all cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePreDisputeTicket(selectedTicket.id, disputeReason)}
                      className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      Kirim Sanggahan
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setShowDisputeForm(true)}
                    className="py-2.5 px-3 border border-slate-200 text-slate-700 bg-white rounded-lg text-xs font-bold hover:bg-slate-100 transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Sanggah Hasil</span>
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedTicket(selectedTicket);
                      setShowSkmModal(true);
                    }}
                    className="py-2.5 px-3 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> 
                    <span>Isi SKM & Penilaian</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {selectedTicket.logs && selectedTicket.logs.length > 0 && (
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm mt-4 text-left animate-in fade-in duration-300">
              <h4 className="font-extrabold text-slate-800 text-lg mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Clock className="w-5 h-5 text-sky-600" /> Lacak Progres (Riwayat Tiket)
              </h4>
              <div className="space-y-4 pl-2 border-l-2 border-slate-100 ml-2 mt-2">
                {selectedTicket.logs.map((log, i) => (
                  <div key={i} className="relative pl-4">
                    <div className="absolute w-3 h-3 bg-sky-500 rounded-full border-2 border-white -left-[23px] top-1.5 shadow-sm"></div>
                    <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl shadow-sm">
                      <span className="block text-xs font-bold text-sky-600 mb-1">{log.date || new Date(log.created_at).toLocaleString('id-ID')}</span>
                      <p className="text-sm font-semibold text-slate-700">{log.text || log.log_description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* RATING MODAL */}
      {selectedTicket && showRatingModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Beri Penilaian Layanan</h3>
                <p className="text-sm text-slate-500 mt-1">Tiket: {selectedTicket.ticket_number}</p>
              </div>
            </div>
            <div className="p-6 overflow-y-auto">
              <form onSubmit={handleSendSurvey} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Bintang Penilaian (1-5)</label>
                  <input type="number" min="1" max="5" value={ratingResult} onChange={(e)=>setRatingResult(e.target.value)} className="w-full border p-2 rounded-xl" required />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Ulasan</label>
                  <textarea value={feedbackText} onChange={(e)=>setFeedbackText(e.target.value)} className="w-full border p-2 rounded-xl" rows="4" required></textarea>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowRatingModal(false)} className="flex-1 px-4 py-3 border rounded-xl font-bold">Batal</button>
                  <button type="submit" className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold">Kirim Penilaian</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      <TicketDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        ticket={selectedTicket}
      />

      <RefillTicketModal
        isOpen={showRefillModal}
        onClose={() => setShowRefillModal(false)}
        ticket={selectedTicket}
        onSave={(updatedTicket) => {
          const updatedList = tickets.map(t => t.id === updatedTicket.id ? updatedTicket : t);
          setTickets(updatedList);
          setSelectedTicket(updatedTicket);
        }}
      />

      <SkmModal
        isOpen={showSkmModal}
        onClose={() => setShowSkmModal(false)}
        ticket={selectedTicket}
        onConfirm={handleConfirmSkm}
      />

      <ActionModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
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
