import React, { useState, useRef } from 'react';
import { CheckSquare, Clock, FileText, Check, AlertCircle, Upload, ChevronRight, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getCurrentLogTimeFormatted } from '../../utils/dateUtils';
import { TicketDetailModal } from '../../components/TicketDetailModal';

export const TaskList = () => {
  const { user, tickets, setTickets, teams } = useAuth();

  const [selectedTask, setSelectedTask] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [logText, setLogText] = useState('');
  const [fileName, setFileName] = useState('');
  const [bastFileUrl, setBastFileUrl] = useState('');
  const bastInputRef = useRef(null);

  const getUserTeam = (u) => {
    if (!u) return '';
    const myTeams = (teams || []).filter(t => t.members.includes(u.name));
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
    if (svc === 'Keamanan Informasi & Persandian' || svc === 'Keamanan Aplikasi / VAPT' || svc === 'CSIRT / Respons Insiden' || svc === 'Penerapan Persandian & Keamanan Informasi') {
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
    return 'Tim Support & Helpdesk Utama';
  };

  const selectTask = (task) => {
    setSelectedTask(task);
    setIsFinished(task.status === 'Selesai');
    setLogText('');
    setFileName(task.bastFile || '');
    setBastFileUrl(task.bastFileUrl || '/bast_selesai.pdf');
  };

  const handleBastFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileName(file.name);
      try {
        const url = URL.createObjectURL(file);
        setBastFileUrl(url);
      } catch (err) {
        setBastFileUrl('/bast_selesai.pdf');
      }
    }
  };

  const handleUpdateProgress = (e) => {
    e.preventDefault();
    if (!selectedTask) return;

    const autoLogText = isFinished
      ? (logText.trim() || (fileName ? 'Pekerjaan teknis selesai dikerjakan 100% oleh Pegawai dan berkas BAST telah diunggah.' : 'Pekerjaan teknis selesai dikerjakan 100% oleh Pegawai.'))
      : (logText.trim() || 'Pekerjaan teknis sedang diproses dan dikerjakan oleh Pegawai Tim Pelaksana.');

    const waitingLog = {
      date: getCurrentLogTimeFormatted(1),
      text: 'Menunggu konfirmasi penyelesaian dan pengisian Survei SKM oleh Pemohon.'
    };
    const stage4Log = {
      date: getCurrentLogTimeFormatted(0),
      text: autoLogText
    };

    const newLogs = isFinished
      ? [waitingLog, stage4Log]
      : [{ date: getCurrentLogTimeFormatted(0), text: autoLogText }];

    const updated = tickets.map(t => {
      if (t.id === selectedTask.id) {
        return {
          ...t,
          progress: isFinished ? 100 : t.progress,
          status: isFinished ? 'Selesai' : 'Diproses',
          bastFile: isFinished ? (fileName || null) : t.bastFile,
          bastFileUrl: isFinished ? (fileName ? (bastFileUrl || '/bast_selesai.pdf') : null) : t.bastFileUrl,
          logs: [...newLogs, ...(t.logs || [])]
        };
      }
      return t;
    });

    setTickets(updated);
    
    if (isFinished) {
      setSelectedTask(null);
      alert('Tugas berhasil diselesaikan! Tiket telah ditutup langsung dan siap untuk diulas & diberi nilai SKM oleh OPD / Pelapor.');
    } else {
      const updatedSelected = updated.find(t => t.id === selectedTask.id);
      setSelectedTask(updatedSelected);
      alert('Log pembaruan aktivitas pengerjaan berhasil disimpan.');
    }
    
    setLogText('');
  };

  const handleSimulateUpload = () => {
    setFileName('BAST_Pekerjaan_Selesai.pdf');
  };

  const handleResumeTask = (ticketId) => {
    const updated = tickets.map(t => {
      if (t.id === ticketId) {
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
    setSelectedTask(updated.find(t => t.id === ticketId));
    alert('Tiket berhasil diaktifkan kembali! Silakan lanjutkan pekerjaan teknis.');
  };

  const [selectedTeamFilter, setSelectedTeamFilter] = useState('all');

  const myTeams = (teams || []).filter(t => (t.members && t.members.includes(user?.name)) || t.leader === user?.name);
  const myTeamNames = myTeams.map(t => t.name);

  const allPegawaiActiveTasks = tickets.filter(t => 
    (t.status === 'Diproses' || t.status === 'Pending') && 
    myTeamNames.includes(t.team || getTicketTeam(t))
  );

  const activeTasks = allPegawaiActiveTasks.filter(t => {
    if (selectedTeamFilter === 'all') return true;
    return (t.team || getTicketTeam(t)) === selectedTeamFilter;
  });

  return (
    <div className="space-y-8 font-sans text-left animate-in fade-in duration-200">
      <div className="space-y-1.5">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Tugas Pelaksanaan Teknis</h2>
        <p className="text-slate-500 text-base leading-relaxed">
          {myTeams.length > 1
            ? `Perbarui aktivitas pengerjaan untuk ${myTeams.length} tim kerja Anda (${myTeams.map(t => t.name).join(', ')}).`
            : 'Perbarui status aktivitas pengerjaan Anda, catat log harian kerja tim, dan unggah lampiran dokumen BAST.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-4">
          {myTeams.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setSelectedTeamFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  selectedTeamFilter === 'all'
                    ? 'bg-sky-50 text-sky-700 border-sky-200'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Semua Tim ({allPegawaiActiveTasks.length})
              </button>
              {myTeams.map(t => {
                const count = allPegawaiActiveTasks.filter(tk => (tk.team || getTicketTeam(tk)) === t.name).length;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTeamFilter(t.name)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      selectedTeamFilter === t.name
                        ? 'bg-sky-50 text-sky-700 border-sky-200'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {t.name} ({count})
                  </button>
                );
              })}
            </div>
          )}
          {activeTasks.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
              <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="font-bold text-base">Tidak ada tugas aktif untuk tim Anda saat ini.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeTasks.map((t) => {
                const isSelected = selectedTask?.id === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => selectTask(t)}
                    className={`p-6 rounded-2xl border transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6 cursor-pointer relative ${
                      isSelected 
                        ? 'border-sky-500 bg-sky-50/20 ring-1 ring-sky-500/30' 
                        : 'border-slate-200 bg-white hover:bg-slate-50/50 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-sky-600 uppercase tracking-widest bg-sky-50 px-2 py-0.5 rounded">{t.id}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${
                          t.status === 'Pending' 
                            ? 'bg-rose-50 text-rose-700 border-rose-100' 
                            : 'bg-sky-50 text-sky-700 border-sky-100'
                        }`}>
                          {t.status === 'Pending' ? 'Tertunda / Sanggahan' : 'Diproses'}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {t.team || getTicketTeam(t)}
                        </span>
                        <span className="text-sm text-slate-400 font-semibold">{t.date}</span>
                      </div>
                      <h3 className="font-extrabold text-base text-slate-800 leading-snug">{t.title}</h3>
                      <p className="text-sm text-slate-400 font-bold uppercase tracking-wider">{t.opd}</p>

                      <div className="text-xs text-slate-450 font-bold mt-2 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>SLA Standar: {t.slaDuration || 7} Hari</span>
                        <span className="text-slate-300">|</span>
                        <span className={t.slaRemainingDays < 0 ? 'text-rose-600 font-extrabold' : 'text-emerald-600 font-extrabold'}>
                          {t.slaRemainingDays < 0 ? `Terlewat ${Math.abs(t.slaRemainingDays)} Hari` : `Sisa ${t.slaRemainingDays} Hari`}
                        </span>
                      </div>
                    </div>

                    <button className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all self-stretch md:self-auto justify-center">
                      <span>Kelola Tugas</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="lg:col-span-5">
          {selectedTask ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 sticky top-24 shadow-sm animate-in fade-in duration-200">
              <div className="space-y-3 text-left">
                <span className="text-sm font-bold text-sky-600 uppercase tracking-widest bg-sky-50 px-2 py-0.5 rounded inline-block">{selectedTask.id}</span>
                <h3 className="font-extrabold text-lg text-slate-800 tracking-tight leading-snug">{selectedTask.title}</h3>
                <p className="text-base text-slate-500 leading-relaxed">{selectedTask.desc || selectedTask.description}</p>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 flex items-center justify-between">
                  <span>SLA Standar: {selectedTask.slaDuration || 7} Hari</span>
                  <span className={selectedTask.slaRemainingDays < 0 ? 'text-rose-600' : 'text-emerald-600'}>
                    {selectedTask.slaRemainingDays < 0 ? `Terlewat ${Math.abs(selectedTask.slaRemainingDays)} Hari` : `Sisa SLA: ${selectedTask.slaRemainingDays} Hari`}
                  </span>
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

              {selectedTask.status === 'Pending' ? (
                <div className="bg-rose-50/50 p-5 rounded-2xl border border-rose-100 space-y-4 text-left animate-in fade-in duration-200">
                  <div className="flex gap-2.5 text-rose-800">
                    <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-extrabold text-rose-900">Pekerjaan Ditangguhkan / Disanggah</p>
                      <p className="mt-1 text-slate-650 leading-relaxed font-semibold">
                        Catatan penangguhan: <span className="italic text-slate-800 block mt-1 p-2 bg-white rounded-lg border border-rose-100/60 font-medium">"{selectedTask.logs?.[0]?.text || 'Tidak ada catatan'}"</span>
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleResumeTask(selectedTask.id)}
                    className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold transition-all shadow-sm shadow-rose-500/10"
                  >
                    Mulai Kerjakan Kembali Tiket Ini
                  </button>
                </div>
              ) : (
                <form onSubmit={handleUpdateProgress} className="space-y-4 pt-2 border-t border-slate-100 text-left">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <input
                      type="checkbox"
                      id="isFinished"
                      checked={isFinished}
                      onChange={(e) => {
                        setIsFinished(e.target.checked);
                        setFileName('');
                      }}
                      className="w-5 h-5 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                    />
                    <label htmlFor="isFinished" className="text-sm font-bold text-slate-700 cursor-pointer select-none">
                      Tandai Pekerjaan Selesai (100%)
                    </label>
                  </div>

                <div className="space-y-1">
                  <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider">Catatan Tambahan (Opsional - Terisi Otomatis)</label>
                  <textarea
                    rows="2"
                    value={logText}
                    onChange={(e) => setLogText(e.target.value)}
                    placeholder={isFinished ? "Opsional: otomatis mencatat penyelesaian & BAST..." : "Opsional: sistem otomatis mencatat log progres pengerjaan..."}
                    className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-base focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>

                {isFinished && (
                  <div className="bg-sky-50/30 p-4 rounded-xl border border-sky-100 space-y-3">
                    <div className="flex gap-2 text-sky-700">
                      <Upload className="w-4 h-4 shrink-0 mt-0.5" />
                      <div className="text-xs space-y-1">
                        <p className="font-bold">Unggah Berkas BAST (Opsional)</p>
                        <p className="text-slate-600 leading-relaxed">Unggah file dokumen resmi Berita Acara Serah Terima (PDF) agar pemohon dapat melihat dokumen dan memberi penilaian SKM.</p>
                      </div>
                    </div>

                    <input
                      type="file"
                      ref={bastInputRef}
                      onChange={handleBastFileChange}
                      accept=".pdf,application/pdf"
                      className="hidden"
                    />

                    {fileName ? (
                      <div className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-xl text-sm">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="font-bold text-slate-700 truncate">{fileName}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <a
                            href={bastFileUrl || '/bast_selesai.pdf'}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-bold text-sky-600 hover:underline px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-all"
                          >
                            Buka
                          </a>
                          <button
                            type="button"
                            onClick={() => bastInputRef.current?.click()}
                            className="text-xs font-bold text-slate-600 hover:underline px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-all"
                          >
                            Ganti
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => bastInputRef.current?.click()}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-white hover:bg-slate-50 border-2 border-dashed border-sky-300 text-sky-700 rounded-xl text-xs font-bold transition-all shadow-sm"
                      >
                        <Upload className="w-4 h-4 text-sky-600" />
                        <span>Pilih File Dokumen BAST (PDF)</span>
                      </button>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-base font-bold transition-all"
                >
                  {isFinished ? 'Selesaikan Tugas' : 'Simpan Pembaruan Aktivitas'}
                </button>
              </form>
            )}
          </div>
        ) : (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6 text-center text-slate-400 py-16">
              <CheckSquare className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-semibold leading-relaxed">Pilih salah satu tugas di sebelah kiri untuk melihat rincian detail, mencatat log aktivitas pengerjaan, atau menyelesaikan tugas.</p>
            </div>
          )}
        </div>
      </div>

      <TicketDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        ticket={selectedTask}
      />
    </div>
  );
};
