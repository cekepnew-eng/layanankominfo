import React, { useState } from 'react';
import { FileText, Star, AlertCircle, CheckCircle2, ChevronRight, Sparkles, Send } from 'lucide-react';

export const MyTickets = () => {
  const [tickets, setTickets] = useState([
    {
      id: 'REQ-2026-0125',
      service: 'Pengembangan & Pengelolaan Aplikasi',
      requestType: 'Penambahan Fitur',
      title: 'Penambahan Fitur Laporan Monitoring',
      desc: 'Kami membutuhkan fitur laporan rekap kunjungan berdasarkan periode dan OPD pada aplikasi ESIR.',
      date: '10 Agustus 2026',
      progress: 100,
      status: 'Menunggu Konfirmasi User',
      opd: 'Dinas Kesehatan Kota Bogor',
      slaOnTime: true,
      logs: [
        { date: '12 Agt 16:30', text: 'Pekerjaan selesai 100% dan Berita Acara (BAST) diunggah' },
        { date: '11 Agt 10:00', text: 'Pekerjaan dimulai oleh Rian Hidayat (Tim Aplikasi)' },
        { date: '10 Agt 11:30', text: 'Permohonan disetujui & divalidasi oleh Helpdesk' },
        { date: '10 Agt 09:00', text: 'Tiket berhasil dibuat oleh User' }
      ]
    },
    {
      id: 'REQ-2026-0124',
      service: 'Jaringan Intra Pemerintah',
      requestType: 'Permintaan Akses Jaringan',
      title: 'Akses Wifi Untuk Ruang Rapat Sekretariat',
      desc: 'Permohonan penambahan akses point wifi baru di lantai 1 untuk tamu dinas luar.',
      date: '08 Agustus 2026',
      progress: 60,
      status: 'Diproses',
      opd: 'Dinas Kesehatan Kota Bogor',
      slaOnTime: true,
      logs: [
        { date: '09 Agt 09:00', text: 'Tim Jaringan melakukan survei lokasi peletakan AP' },
        { date: '08 Agt 14:00', text: 'Permohonan divalidasi & dialihkan ke Tim Jaringan' },
        { date: '08 Agt 09:00', text: 'Tiket berhasil dibuat oleh User' }
      ]
    },
    {
      id: 'REQ-2026-0120',
      service: 'Server Perangkat Daerah',
      requestType: 'Permohonan Hosting',
      title: 'Hosting Website Profil Kecamatan Bogor Selatan',
      desc: 'Permohonan pembuatan database MySQL dan hosting PHP untuk portal kecamatan.',
      date: '01 Agustus 2026',
      progress: 100,
      status: 'Selesai',
      opd: 'Kecamatan Bogor Selatan',
      slaOnTime: true,
      logs: [
        { date: '03 Agt 14:00', text: 'User mengonfirmasi selesai & mengisi survei rating 5 bintang' },
        { date: '02 Agt 10:00', text: 'Database & hosting siap digunakan' },
        { date: '01 Agt 11:00', text: 'Permohonan disetujui oleh Helpdesk' },
        { date: '01 Agt 09:00', text: 'Tiket berhasil dibuat oleh User' }
      ]
    },
    {
      id: 'REQ-2026-0129',
      opd: 'Dinas Pendidikan Kota Bogor',
      service: 'Server Perangkat Daerah',
      requestType: 'Permohonan Hosting Baru',
      title: 'Kebutuhan VM Hosting Aplikasi PPDB',
      desc: 'Kami memerlukan VM baru dengan spesifikasi 4 Core CPU, 8GB RAM, 100GB SSD untuk hosting sistem PPDB 2026.',
      date: '13 Agustus 2026',
      progress: 0,
      status: 'Verifikasi',
      files: ['Surat_Permohonan_Kadis.pdf', 'Spesifikasi_Teknis.xlsx'],
      logs: [
        { date: '13 Agt 09:00', text: 'Tiket berhasil dibuat oleh User' }
      ]
    },
    {
      id: 'REQ-2026-0128',
      opd: 'Dinas Pariwisata & Kebudayaan',
      service: 'Pengembangan & Pengelolaan Aplikasi',
      requestType: 'Penambahan Fitur',
      title: 'Fitur Ekspor PDF Laporan Kunjungan Wisata',
      desc: 'Permohonan penambahan tombol ekspor laporan bulanan kunjungan wisata ke format PDF pada aplikasi E-Tourism.',
      date: '12 Agustus 2026',
      progress: 40,
      status: 'Diproses',
      files: ['TOR_Penambahan_Fitur.pdf'],
      logs: [
        { date: '12 Agt 14:00', text: 'Permohonan diterima & divalidasi oleh Helpdesk' },
        { date: '13 Agt 09:00', text: 'Analisis kebutuhan data laporan pariwisata' }
      ]
    },
    {
      id: 'REQ-2026-0127',
      opd: 'Dinas Kesehatan Kota Bogor',
      service: 'Jaringan Intra Pemerintah',
      requestType: 'Pemasangan Jaringan',
      title: 'Pemasangan Titik Wifi di Puskesmas Bantarjati',
      desc: 'Penambahan 2 titik akses wifi baru untuk ruang tunggu pelayanan obat Puskesmas Bantarjati.',
      date: '11 Agustus 2026',
      progress: 0,
      status: 'Verifikasi',
      files: ['Form_Survey_Lokasi.pdf'],
      logs: [
        { date: '11 Agt 09:00', text: 'Tiket berhasil dibuat oleh User' }
      ]
    },
    {
      id: 'REQ-2026-0126',
      opd: 'Dinas Kesehatan Kota Bogor',
      service: 'Jaringan Intra Pemerintah',
      requestType: 'Pemasangan Jaringan',
      title: 'Pemasangan Jaringan Wifi Ruang Rapat A',
      desc: 'Pemasangan wifi ruang rapat.',
      date: '10 Agustus 2026',
      progress: 100,
      status: 'Menunggu Konfirmasi User',
      logs: [
        { date: '10 Agt 09:00', text: 'Tiket berhasil dibuat oleh User' }
      ]
    }
  ]);

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showSurvey, setShowSurvey] = useState(false);

  const [ratingSpeed, setRatingSpeed] = useState(5);
  const [ratingResult, setRatingResult] = useState(5);
  const [ratingCommunication, setRatingCommunication] = useState(5);
  const [ratingQuality, setRatingQuality] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');

  const selectTicket = (ticket) => {
    setSelectedTicket(ticket);
    setShowSurvey(false);
  };

  const handleConfirmFinish = () => {
    setShowSurvey(true);
  };

  const handleReopenTicket = (id) => {
    const updatedTickets = tickets.map(t => {
      if (t.id === id) {
        return {
          ...t,
          status: 'Diproses',
          progress: 80,
          logs: [{ date: 'Hari ini', text: 'Pekerjaan dinyatakan belum sesuai oleh User. Tiket dibuka kembali.' }, ...t.logs]
        };
      }
      return t;
    });
    setTickets(updatedTickets);
    setSelectedTicket(updatedTickets.find(t => t.id === id));
    setShowSurvey(false);
  };

  const handleSendSurvey = (e) => {
    e.preventDefault();
    if (!selectedTicket) return;

    const updatedTickets = tickets.map(t => {
      if (t.id === selectedTicket.id) {
        return {
          ...t,
          status: 'Selesai',
          logs: [{ date: 'Hari ini', text: 'User mengonfirmasi selesai & memberikan penilaian kepuasan.' }, ...t.logs]
        };
      }
      return t;
    });

    setTickets(updatedTickets);
    setSelectedTicket(updatedTickets.find(t => t.id === selectedTicket.id));
    setShowSurvey(false);
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

  const myTicketsList = tickets.filter(t => 
    t.opd?.includes('Dinas Kesehatan') || 
    t.id === 'REQ-2026-0120' || 
    t.id === 'REQ-2026-0125' || 
    t.id === 'REQ-2026-0124' ||
    t.id === 'REQ-2026-0126' ||
    t.id === 'REQ-2026-0127'
  );

  return (
    <div className="space-y-8 font-sans text-left">
      <div className="space-y-1.5">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Riwayat Pengajuan Tiket</h2>
        <p className="text-slate-500 text-base leading-relaxed">Pantau status pengerjaan tiket dari Diskominfo secara real-time, lakukan konfirmasi hasil, dan berikan penilaian ulasan.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-4">
          {myTicketsList.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
              <AlertCircle className="w-10 h-10 text-slate-355 mx-auto mb-3" />
              <p className="font-bold text-base">Belum ada pengajuan tiket saat ini.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myTicketsList.map((t) => {
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
                      
                      <div className="flex items-center gap-3 pt-1.5">
                        <div className="w-32 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-sky-500 h-full rounded-full" style={{ width: `${t.progress}%` }}></div>
                        </div>
                        <span className="text-sm text-slate-455 font-bold">{t.progress}% Progres</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-stretch md:self-auto justify-between border-t border-slate-100 pt-3 md:border-t-0 md:pt-0">
                      <span className={`px-2.5 py-1 rounded-xl text-sm font-bold uppercase tracking-wider ${
                        t.status === 'Selesai' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        t.status === 'Menunggu Konfirmasi User' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 animate-pulse' :
                        t.status === 'Diproses' ? 'bg-sky-50 text-sky-700 border border-sky-100' :
                        'bg-slate-50 text-slate-700 border border-slate-100'
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
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 sticky top-24 shadow-sm">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-sky-650 uppercase tracking-widest bg-sky-50 px-2 py-0.5 rounded">{selectedTicket.id}</span>
                  <span className={`px-2.5 py-0.5 rounded-xl text-sm font-bold uppercase tracking-wider ${
                    selectedTicket.status === 'Selesai' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                    selectedTicket.status === 'Menunggu Konfirmasi User' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                    'bg-sky-50 text-sky-700 border border-sky-100'
                  }`}>
                    {selectedTicket.status}
                  </span>
                </div>
                <h3 className="font-extrabold text-lg text-slate-800 tracking-tight leading-snug">{selectedTicket.title}</h3>
                <p className="text-base text-slate-500 leading-relaxed">{selectedTicket.desc || selectedTicket.description}</p>
              </div>

              {!showSurvey && selectedTicket.status === 'Menunggu Konfirmasi User' && (
                <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/50 space-y-4">
                  <div className="flex gap-2.5 text-indigo-800">
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-indigo-600" />
                    <div className="text-sm">
                      <p className="font-bold">Konfirmasi Penyelesaian</p>
                      <p className="mt-0.5 text-indigo-650/80 leading-relaxed">Teknisi telah menyelesaikan tugas dan mengunggah laporan hasil. Silakan periksa.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleReopenTicket(selectedTicket.id)}
                      className="py-2.5 px-3 border border-slate-200 text-slate-700 bg-white rounded-lg text-sm font-bold hover:bg-slate-50 transition-all"
                    >
                      Belum Sesuai
                    </button>
                    <button
                      onClick={handleConfirmFinish}
                      className="py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold transition-all"
                    >
                      Selesai & Sesuai
                    </button>
                  </div>
                </div>
              )}

              {showSurvey && (
                <form onSubmit={handleSendSurvey} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex items-center gap-1.5 text-indigo-700">
                    <Sparkles className="w-4 h-4" />
                    <h4 className="font-bold text-sm uppercase tracking-wider">Penilaian Ulasan Layanan</h4>
                  </div>
                  
                  <div className="space-y-3.5">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-slate-555 uppercase tracking-wider">Kecepatan Pelayanan</span>
                      {renderStars(ratingSpeed, setRatingSpeed)}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-slate-555 uppercase tracking-wider">Kesesuaian Hasil</span>
                      {renderStars(ratingResult, setRatingResult)}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-slate-555 uppercase tracking-wider">Komunikasi Petugas</span>
                      {renderStars(ratingCommunication, setRatingCommunication)}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-slate-555 uppercase tracking-wider">Kualitas Kerja</span>
                      {renderStars(ratingQuality, setRatingQuality)}
                    </div>
                    <div className="space-y-1">
                      <label className="block text-sm font-bold text-slate-555 uppercase tracking-wider">Saran & Masukan</label>
                      <textarea
                        rows="2"
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        placeholder="Tuliskan masukan untuk peningkatan layanan..."
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-base focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 mt-1"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowSurvey(false)}
                      className="flex-1 py-2.5 border border-slate-200 text-slate-650 rounded-lg text-sm font-bold hover:bg-slate-100"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="flex-1 flex items-center justify-center gap-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-base font-bold transition-all"
                    >
                      <span>Kirim Ulasan</span>
                    </button>
                  </div>
                </form>
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
                        <span className="text-sm text-slate-400 font-bold block">{log.date}</span>
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
              <p className="text-sm font-semibold leading-relaxed">Pilih salah satu tiket di sebelah kiri untuk melihat detail histori dan status pengerjaan.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
