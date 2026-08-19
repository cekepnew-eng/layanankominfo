import React, { useState } from 'react';
import { CheckSquare, Clock, FileText, Check, AlertCircle, Upload, ChevronRight } from 'lucide-react';

export const TaskList = () => {
  const [tasks, setTasks] = useState([
    {
      id: 'REQ-2026-0128',
      opd: 'Dinas Pariwisata & Kebudayaan',
      service: 'Pengembangan & Pengelolaan Aplikasi',
      requestType: 'Penambahan Fitur',
      title: 'Fitur Ekspor PDF Laporan Kunjungan Wisata',
      desc: 'Permohonan penambahan tombol ekspor laporan bulanan kunjungan wisata ke format PDF pada aplikasi E-Tourism.',
      date: '12 Agustus 2026',
      progress: 40,
      logs: [
        { date: '13 Agt 09:00', text: 'Analisis kebutuhan data laporan pariwisata' },
        { date: '12 Agt 14:00', text: 'Permohonan diterima & divalidasi oleh Helpdesk' },
        { date: '12 Agt 09:00', text: 'Tiket berhasil dibuat oleh User' }
      ],
      status: 'Diproses'
    },
    {
      id: 'REQ-2026-0125',
      opd: 'Dinas Kesehatan Kota Bogor',
      service: 'Pengembangan & Pengelolaan Aplikasi',
      requestType: 'Penambahan Fitur',
      title: 'Penambahan Fitur Laporan Monitoring',
      desc: 'Kami membutuhkan fitur laporan rekap kunjungan berdasarkan periode dan OPD pada aplikasi ESIR.',
      date: '10 Agustus 2026',
      progress: 80,
      logs: [
        { date: '11 Agt 10:00', text: 'Pekerjaan dimulai oleh Rian Hidayat (Tim Aplikasi)' },
        { date: '10 Agt 11:30', text: 'Permohonan disetujui & divalidasi oleh Helpdesk' },
        { date: '10 Agt 09:00', text: 'Tiket berhasil dibuat oleh User' }
      ],
      status: 'Diproses'
    }
  ]);

  const [selectedTask, setSelectedTask] = useState(null);
  const [progressVal, setProgressVal] = useState(0);
  const [logText, setLogText] = useState('');
  const [fileName, setFileName] = useState('');

  const selectTask = (task) => {
    setSelectedTask(task);
    setProgressVal(task.progress);
    setLogText('');
    setFileName('');
  };

  const handleUpdateProgress = (e) => {
    e.preventDefault();
    if (!selectedTask) return;

    const newLog = logText 
      ? { date: 'Hari ini', text: logText } 
      : { date: 'Hari ini', text: `Progres diperbarui menjadi ${progressVal}%` };

    const updated = tasks.map(t => {
      if (t.id === selectedTask.id) {
        const isFinished = progressVal === 100;
        return {
          ...t,
          progress: progressVal,
          status: isFinished ? 'Menunggu Konfirmasi User' : 'Diproses',
          logs: [newLog, ...(t.logs || [])]
        };
      }
      return t;
    });

    setTasks(updated);
    
    const updatedSelected = updated.find(t => t.id === selectedTask.id);
    if (updatedSelected.status === 'Menunggu Konfirmasi User') {
      setSelectedTask(null);
    } else {
      setSelectedTask(updatedSelected);
    }
    
    setLogText('');
  };

  const handleSimulateUpload = () => {
    setFileName('BAST_Pekerjaan_Selesai.pdf');
  };

  const activeTasks = tasks.filter(t => t.status === 'Diproses');

  return (
    <div className="space-y-8 font-sans text-left">
      <div className="space-y-1.5">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Tugas Pelaksanaan Teknis</h2>
        <p className="text-slate-505 text-base leading-relaxed">Perbarui progres kerja Anda, catat riwayat log aktivitas pengerjaan, dan unggah berkas penyelesaian tugas.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-4">
          {activeTasks.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-550">
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
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-sky-600 uppercase tracking-widest bg-sky-50 px-2 py-0.5 rounded">{t.id}</span>
                        <span className="text-sm text-slate-400 font-semibold">{t.date}</span>
                      </div>
                      <h3 className="font-extrabold text-base text-slate-800 leading-snug">{t.title}</h3>
                      <p className="text-sm text-slate-400 font-bold uppercase tracking-wider">{t.opd}</p>

                      <div className="mt-4 flex items-center gap-4">
                        <div className="flex-1 bg-slate-100 h-2.5 rounded-full overflow-hidden max-w-md">
                          <div className="bg-sky-500 h-full rounded-full" style={{ width: `${t.progress}%` }}></div>
                        </div>
                        <span className="text-sm font-bold text-slate-700">{t.progress}%</span>
                      </div>
                    </div>

                    <button className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-655 hover:bg-slate-50 transition-all self-stretch md:self-auto justify-center">
                      <span>Kelola Progres</span>
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
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 sticky top-24 shadow-sm">
              <div className="space-y-3">
                <span className="text-sm font-bold text-sky-655 uppercase tracking-widest bg-sky-50 px-2 py-0.5 rounded inline-block">{selectedTask.id}</span>
                <h3 className="font-extrabold text-lg text-slate-800 tracking-tight leading-snug">{selectedTask.title}</h3>
                <p className="text-base text-slate-500 leading-relaxed">{selectedTask.desc || selectedTask.description}</p>
              </div>

              <form onSubmit={handleUpdateProgress} className="space-y-4 pt-2 border-t border-slate-100">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-555 uppercase tracking-wider">Update Persentase Progres</span>
                    <span className="text-lg font-black text-sky-600">{progressVal}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={progressVal}
                    onChange={(e) => setProgressVal(Number(e.target.value))}
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-sky-600"
                  />
                  <div className="flex justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
                    <span>Mulai</span>
                    <span>Setengah</span>
                    <span>Selesai (100%)</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-bold text-slate-505 uppercase tracking-wider">Catatan Aktivitas / Log</label>
                  <textarea
                    rows="2"
                    required
                    value={logText}
                    onChange={(e) => setLogText(e.target.value)}
                    placeholder="Contoh: Menyelesaikan instalasi modul ekspor..."
                    className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-base focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>

                {progressVal === 100 && (
                  <div className="bg-sky-50/30 p-4 rounded-xl border border-sky-100 space-y-3">
                    <div className="flex gap-2 text-sky-700">
                      <Upload className="w-4 h-4 shrink-0 mt-0.5" />
                      <div className="text-xs space-y-1">
                        <p className="font-bold">Wajib Unggah Berkas BAST</p>
                        <p className="text-slate-555/80 leading-relaxed">Unggah file laporan Berita Acara Serah Terima pekerjaan agar user dapat melakukan penilaian ulasan.</p>
                      </div>
                    </div>
                    {fileName ? (
                      <div className="flex justify-between items-center p-2.5 bg-white border border-slate-200 rounded-xl text-sm">
                        <span className="font-bold text-slate-700">{fileName}</span>
                        <Check className="w-4 h-4 text-emerald-600" />
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSimulateUpload}
                        className="w-full py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all"
                      >
                        Simulasikan Unggah Berkas BAST
                      </button>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={progressVal === 100 && !fileName}
                  className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-xl text-base font-bold transition-all"
                >
                  Simpan Perubahan Progres
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6 text-center text-slate-400 py-16">
              <CheckSquare className="w-8 h-8 mx-auto mb-2 text-slate-355" />
              <p className="text-sm font-semibold leading-relaxed">Pilih salah satu tugas di sebelah kiri untuk melihat rincian detail, memperbarui progres pengerjaan, dan mencatat log.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
