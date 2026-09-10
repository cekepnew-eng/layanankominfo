import React, { useState } from 'react';
import { FileText, Star, AlertCircle, CheckCircle2, ChevronRight, Sparkles, Send, RefreshCw, Upload, AlertTriangle, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getCurrentLogTimeFormatted, formatLogDateDisplay } from '../../utils/dateUtils';
import { TicketDetailModal } from '../../components/TicketDetailModal';
import { RefillTicketModal } from '../../components/RefillTicketModal';
import { SkmModal } from '../../components/SkmModal';

export const MyTickets = () => {
  const { tickets, setTickets, user } = useAuth();
  
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRefillModal, setShowRefillModal] = useState(false);
  const [showSkmModal, setShowSkmModal] = useState(false);
  const [activeTab, setActiveTab] = useState('semua');

  const [skmQ1, setSkmQ1] = useState('Sangat Baik');
  const [skmQ2, setSkmQ2] = useState('Sangat Baik');
  const [skmQ3, setSkmQ3] = useState('Sangat Baik');

  const [ratingSpeed, setRatingSpeed] = useState(5);
  const [ratingResult, setRatingResult] = useState(5);
  const [ratingCommunication, setRatingCommunication] = useState(5);
  const [ratingQuality, setRatingQuality] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');

  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');

  const selectTicket = (ticket) => {
    setSelectedTicket(ticket);
    setShowDisputeForm(false);
    setDisputeReason('');
    setShowRefillModal(false);
    setShowSkmModal(false);
  };

  const handleConfirmSkm = (ticket) => {
    const updatedTickets = tickets.map(t => {
      if (t.id === ticket.id) {
        return {
          ...t,
          rating: {
            skm: { q1: 'Sangat Baik', q2: 'Sangat Baik', q3: 'Sangat Baik' },
            completed: true
          },
          skmCompleted: true,
          logs: [
            {
              date: getCurrentLogTimeFormatted(0),
              text: 'Pemohon telah mengisi Survei Kepuasan Masyarakat (SKM) melalui portal resmi MenPAN-RB.'
            },
            ...(t.logs || [])
          ]
        };
      }
      return t;
    });
    setTickets(updatedTickets);
    setSelectedTicket({
      ...ticket,
      rating: { completed: true },
      skmCompleted: true
    });
    alert('Terima kasih! Konfirmasi pengisian survei SKM MenPAN-RB berhasil dicatat.');
  };

  const handleDisputeTicket = (id, reason) => {
    if (!reason.trim()) {
      alert('Harap isi alasan sanggahan terlebih dahulu!');
      return;
    }
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
    setShowSurvey(false);
    setShowDisputeForm(false);
    setDisputeReason('');
    alert('Sanggahan berhasil dikirim! Status tiket diubah kembali menjadi Pending untuk ditinjau pegawai.');
  };

  const handleNextSurveyStep = () => {
    setSurveyStep(2);
  };

  const handleSendSurvey = (e) => {
    e.preventDefault();
    if (!selectedTicket) return;

    const updatedTickets = tickets.map(t => {
      if (t.id === selectedTicket.id) {
        const cleanedLogs = (t.logs || []).filter(l => !l.text.includes('Menunggu konfirmasi'));
        return {
          ...t,
          status: 'Selesai',
          progress: 100,
          rating: {
            speed: ratingSpeed,
            result: ratingResult,
            communication: ratingCommunication,
            quality: ratingQuality,
            comment: feedbackText || 'Pelayanan memuaskan dan tepat waktu.',
            skm: { q1: skmQ1, q2: skmQ2, q3: skmQ3 }
          },
          logs: [
            { date: getCurrentLogTimeFormatted(0), text: 'Pemohon telah mengonfirmasi penyelesaian, mengisi Survei SKM, dan memberikan ulasan bintang.' },
            ...cleanedLogs
          ]
        };
      }
      return t;
    });

    setTickets(updatedTickets);
    setSelectedTicket(updatedTickets.find(t => t.id === selectedTicket.id));
    setShowSurvey(false);
    setSurveyStep(1);
    alert('Survei SKM & Rating berhasil dikirimkan! Terima kasih atas penilaian dan masukan Anda.');
  };

  const renderStars = (rating, setRating) => {
    return (
      <div className="flex gap-1 mt-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating && setRating(star)}
            className="focus:outline-none"
          >
            <Star 
              className={`w-5 h-5 transition-all ${
                star <= rating ? 'text-amber-500 fill-amber-500 hover:scale-110' : 'text-slate-200'
              }`} 
            />
          </button>
        ))}
      </div>
    );
  };

  const renderRatingStars = (score) => {
    return (
      <div className="flex gap-0.5 text-amber-500">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className={`w-4 h-4 ${i < score ? 'fill-amber-500 text-amber-500' : 'text-slate-200'}`} />
        ))}
      </div>
    );
  };

  const userTabs = [
    { id: 'semua', label: 'Semua' },
    { id: 'proses', label: 'Dalam Proses' },
    { id: 'ulasan', label: 'Belum Dinilai / SKM' },
    { id: 'selesai', label: 'Selesai & Dinilai' },
    { id: 'pending', label: 'Pending' }
  ];

  const getTabCount = (tabId) => {
    const base = tickets.filter(t => t.opd === user?.department);
    if (tabId === 'proses') {
      return base.filter(t => t.status === 'Verifikasi' || t.status === 'Diproses').length;
    }
    if (tabId === 'ulasan') {
      return base.filter(t => t.status === 'Selesai' && !t.rating).length;
    }
    if (tabId === 'selesai') {
      return base.filter(t => t.status === 'Selesai' && t.rating).length;
    }
    if (tabId === 'pending') {
      return base.filter(t => t.status === 'Pending').length;
    }
    return base.length;
  };

  const filteredTickets = (() => {
    const base = tickets.filter(t => t.opd === user?.department);
    if (activeTab === 'proses') {
      return base.filter(t => t.status === 'Verifikasi' || t.status === 'Diproses');
    }
    if (activeTab === 'ulasan') {
      return base.filter(t => t.status === 'Selesai' && !t.rating);
    }
    if (activeTab === 'selesai') {
      return base.filter(t => t.status === 'Selesai' && t.rating);
    }
    if (activeTab === 'pending') {
      return base.filter(t => t.status === 'Pending');
    }
    return base;
  })();

  return (
    <div className="space-y-8 font-sans text-left animate-in fade-in duration-200">
      <div className="space-y-1.5">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Riwayat Pengajuan Tiket</h2>
        <p className="text-slate-500 text-base leading-relaxed">Pantau status pengerjaan tiket pelayanan digital secara real-time, berikan sanggahan, atau lengkapi survei kepuasan SKM.</p>
      </div>

      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto pb-px">
        {userTabs.map((tab) => {
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
              <p className="font-bold text-base">Tidak ada pengajuan tiket di kategori ini.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTickets.map((t) => {
                const isSelected = selectedTicket?.id === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => selectTicket(t)}
                    className={`p-6 rounded-2xl border transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6 cursor-pointer relative ${
                      isSelected 
                        ? 'border-sky-500 bg-sky-50/20 ring-1 ring-sky-500/30' 
                        : 'border-slate-200 bg-white hover:bg-slate-50/50 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-sky-600 uppercase tracking-widest bg-sky-50 px-2 py-0.5 rounded">{t.id}</span>
                        <span className="text-sm text-slate-400 font-semibold">{t.date}</span>
                      </div>
                      <h3 className="font-extrabold text-base text-slate-800 leading-snug">{t.title}</h3>
                      <p className="text-sm text-slate-400 font-bold uppercase tracking-wider">{t.service}</p>
                      
                      <div className="flex items-center gap-4 text-xs font-bold text-slate-500 pt-1">
                        <span>SLA: {t.slaDuration} Hari</span>
                        <span className="text-slate-300">|</span>
                        {t.status === 'Verifikasi' ? (
                          <span className="text-slate-400 font-semibold">Belum Berjalan (Menunggu Verifikasi)</span>
                        ) : t.status === 'Pending' ? (
                          <span className="text-amber-600 font-semibold">Tertangguh (Menunggu Revisi)</span>
                        ) : (
                          <span className={t.slaRemainingDays < 0 ? 'text-rose-600' : 'text-emerald-600'}>
                            {t.slaRemainingDays < 0 ? `Terlewat ${Math.abs(t.slaRemainingDays)} Hari` : `Sisa ${t.slaRemainingDays} Hari`}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-stretch md:self-auto justify-between border-t border-slate-100 pt-3 md:border-t-0 md:pt-0">
                      <span className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase tracking-wider border ${
                        t.status === 'Selesai' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        t.status === 'Diproses' ? 'bg-sky-50 text-sky-700 border-sky-100' :
                        t.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                        'bg-slate-50 text-slate-700 border-slate-100'
                      }`}>
                        {t.status}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="lg:col-span-5">
          {selectedTicket ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 sticky top-24 shadow-sm animate-in fade-in duration-200">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-sky-650 uppercase tracking-widest bg-sky-50 px-2 py-0.5 rounded">{selectedTicket.id}</span>
                  <span className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase tracking-wider border ${
                    selectedTicket.status === 'Selesai' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                    selectedTicket.status === 'Diproses' ? 'bg-sky-50 text-sky-700 border-sky-100' :
                    selectedTicket.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                    'bg-slate-50 text-slate-700 border-slate-100'
                  }`}>
                    {selectedTicket.status}
                  </span>
                </div>
                <h3 className="font-extrabold text-lg text-slate-800 tracking-tight leading-snug">{selectedTicket.title}</h3>
                <p className="text-base text-slate-500 leading-relaxed">{selectedTicket.desc || selectedTicket.description}</p>
                
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

              <button
                type="button"
                onClick={() => setShowDetailModal(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-sm"
              >
                <FileText className="w-4 h-4 text-sky-600" />
                <span>Lihat Formulir Pengajuan Tiket</span>
              </button>
            </div>

            {selectedTicket.files && selectedTicket.files.length > 0 && (
              <div className="space-y-2.5 text-left">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Dokumen Lampiran Pengajuan</span>
                <div className="space-y-2">
                  {selectedTicket.files.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="w-4 h-4 text-sky-600 shrink-0" />
                        <span className="text-sm font-bold text-slate-700 truncate">{file}</span>
                      </div>
                      <a
                        href={selectedTicket.fileUrl || '/dokumen_permohonan.pdf'}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-sky-600 hover:underline px-2.5 py-1 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-all shrink-0"
                      >
                        Buka PDF
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedTicket.status === 'Selesai' && selectedTicket.bastFile && (
              <div className="space-y-2.5 text-left">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Lampiran Penyelesaian Pegawai</span>
                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200 text-sm font-semibold">
                  <div className="flex items-center gap-2 text-slate-700 overflow-hidden">
                    <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="truncate max-w-[200px]" title={selectedTicket.bastFile}>{selectedTicket.bastFile}</span>
                  </div>
                  <a
                    href={selectedTicket.bastFileUrl || '/bast_selesai.pdf'}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-emerald-600 hover:underline px-2.5 py-1 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-all shrink-0"
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
                        <div className="mt-2.5 p-3 bg-white rounded-xl border border-rose-100/80 text-xs italic text-slate-700">
                          "{selectedTicket.logs.find(l => l.text.toLowerCase().includes('menyanggah'))?.text || selectedTicket.logs[0]?.text}"
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 text-left animate-in fade-in duration-200">
                    <div className="flex gap-2.5 text-slate-800">
                      <AlertCircle className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-extrabold text-slate-900 text-base">Permohonan Memerlukan Perbaikan / Klarifikasi</p>
                        <p className="mt-1 text-slate-500 leading-relaxed font-semibold text-xs">
                          Helpdesk telah menangguhkan permohonan Anda. Silakan isi ulang seluruh formulir permohonan dan sertakan catatan perbaikan jika diperlukan.
                        </p>
                        {selectedTicket.logs && selectedTicket.logs.length > 0 && (
                          <div className="mt-2.5 p-3 bg-white rounded-xl border border-slate-200 text-xs">
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

              {selectedTicket.status === 'Selesai' && !selectedTicket.rating && (
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
                          onClick={() => handleDisputeTicket(selectedTicket.id, disputeReason)}
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
                        onClick={() => setShowSkmModal(true)}
                        className="py-2.5 px-3 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <span>Isi Survei SKM</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {selectedTicket.status === 'Selesai' && selectedTicket.rating && (
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center gap-3 text-left">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-xs font-black text-emerald-900 uppercase tracking-wider">Survei Kepuasan Terisi</p>
                    <p className="text-xs text-emerald-700 font-medium mt-0.5">
                      Survei Kepuasan Masyarakat (SKM) telah selesai diisi oleh Pemohon melalui portal resmi MenPAN-RB.
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-4 border-t border-slate-100 pt-4">
                <span className="text-sm font-bold text-slate-400 uppercase tracking-wider block">Pelacakan Log Progress</span>
                <div className="relative pl-5 border-l border-slate-200 space-y-5">
                  {selectedTicket.logs && selectedTicket.logs.map((log, idx) => {
                    const isNewest = idx === 0;
                    return (
                      <div key={idx} className="relative text-left">
                        <div className={`absolute -left-[25px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                          isNewest && selectedTicket.status !== 'Selesai'
                            ? 'bg-emerald-500 ring-4 ring-emerald-100 animate-pulse'
                            : 'bg-slate-300'
                        }`}></div>
                        <span className="text-sm text-slate-400 font-bold block">{formatLogDateDisplay(log.date)}</span>
                        <p className={`text-base mt-0.5 leading-relaxed ${isNewest ? 'font-bold text-slate-800' : 'text-slate-500'}`}>{log.text}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6 text-center text-slate-400 py-16">
              <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-semibold leading-relaxed">Pilih salah satu tiket di sebelah kiri untuk melihat detail histori dan status pengerjaan.</p>
            </div>
          )}
        </div>
      </div>

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
    </div>
  );
};
