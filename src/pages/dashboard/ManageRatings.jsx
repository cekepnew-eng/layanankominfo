import React, { useEffect, useState, useRef } from 'react';
import { Star, ShieldAlert, CheckCircle2, AlertCircle, Download, FileSpreadsheet, FileText, ChevronDown } from 'lucide-react';
import { api } from '../../services/api';

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

export const ManageRatings = () => {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [unratedTicketCount, setUnratedTicketCount] = useState(0);
  const [canManageLanding, setCanManageLanding] = useState(true);
  const [updatingRatingId, setUpdatingRatingId] = useState(null);
  const [selectedStarFilter, setSelectedStarFilter] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('all'); // 'all', 'weekly', 'monthly', 'yearly'
  const [isExportOpen, setIsExportOpen] = useState(false);

  const dropdownRef = useRef(null);

  // Menutup dropdown saat klik di luar area
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsExportOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchRatings = async () => {
    setLoadError('');
    try {
      const response = await api.getAdminRatings();
      setRatings(response.data || []);
      setUnratedTicketCount(Number(response.unratedCount) || 0);
      setCanManageLanding(response.canManageLanding !== false);
    } catch (error) {
      setLoadError(error.message || 'Gagal memuat ulasan dan rating.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRatings();
  }, []);

  const toggleRatingForLanding = async (rating) => {
    setUpdatingRatingId(rating.id);
    try {
      const selectedForLanding = !rating.selectedForLanding;
      await api.setRatingLandingVisibility(rating.id, selectedForLanding);
      setRatings(current => current.map(item =>
        item.id === rating.id ? { ...item, selectedForLanding } : item
      ));
      setLoadError('');
    } catch (error) {
      setLoadError(error.message || 'Gagal memperbarui tampilan ulasan.');
    } finally {
      setUpdatingRatingId(null);
    }
  };

  // Logika Filter Berdasarkan Periode Waktu
  const ratingsByPeriod = ratings.filter(r => {
    if (selectedPeriod === 'all') return true;
    const itemDate = new Date(r.createdAt || r.date);
    const now = new Date();

    if (selectedPeriod === 'weekly') {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return itemDate >= oneWeekAgo;
    }
    if (selectedPeriod === 'monthly') {
      return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
    }
    if (selectedPeriod === 'yearly') {
      return itemDate.getFullYear() === now.getFullYear();
    }
    return true;
  });

  const totalRatings = ratingsByPeriod.length;
  const commentedRatings = ratingsByPeriod.filter(r => r.comment && r.comment.trim() !== '');
  const starOnlyRatings = ratingsByPeriod.filter(r => !r.comment || r.comment.trim() === '');
  const selectedRatingsCount = ratings.filter(r => r.selectedForLanding).length;

  const displayedRatings = selectedStarFilter === 'all'
    ? ratingsByPeriod
    : ratingsByPeriod.filter(r => Number(r.rating) === selectedStarFilter);

  // Fungsi Export Excel (CSV)
  const handleExportExcel = () => {
    setIsExportOpen(false);
    const periodNames = { all: 'Keseluruhan', weekly: 'Mingguan', monthly: 'Bulanan', yearly: 'Tahunan' };
    const csvHeader = 'No,ID Tiket/Ulasan,Tanggal,OPD Pengirim,Layanan,Rating Bintang,Komentar,Status\n';

    const csvRows = ratingsByPeriod.map((r, index) => {
      const cleanComment = (r.comment || 'Hanya Bintang').replace(/"/g, '""').replace(/\n/g, ' ');
      const cleanName = (r.name || '-').replace(/"/g, '""');
      const cleanService = (r.service || 'SPBE Diskominfo').replace(/"/g, '""');
      const dateStr = r.createdAt ? new Date(r.createdAt).toLocaleDateString('id-ID') : '-';
      return `"${index + 1}","${r.id}","${dateStr}","${cleanName}","${cleanService}","${r.rating} Bintang","${cleanComment}","${r.status || 'Selesai'}"`;
    }).join('\n');

    const blob = new Blob(['\uFEFF' + csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Rekap_Rating_${periodNames[selectedPeriod]}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Fungsi Export PDF (Print Clean Layout)
  const handleExportPdf = () => {
    setIsExportOpen(false);
    const periodNames = { all: 'Keseluruhan Periode', weekly: 'Mingguan (7 Hari Terakhir)', monthly: 'Bulanan (Bulan Ini)', yearly: 'Tahunan (Tahun Ini)' };
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      setLoadError('Jendela laporan diblokir browser. Izinkan pop-up lalu coba lagi.');
      return;
    }

    const printedAt = new Date().toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    const logoUrl = `${window.location.origin}/bogor.png`;
    const logoDiskominfoUrl = `${window.location.origin}/kominfo.png`;
    const rows = ratingsByPeriod.map((rating, index) => {
      const itemDate = rating.createdAt || rating.date;
      const date = itemDate ? new Date(itemDate).toLocaleDateString('id-ID') : '-';
      const comment = rating.comment?.trim()
        ? escapeHtml(rating.comment)
        : '<i class="muted">(Hanya bintang)</i>';

      return `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(date)}</td>
          <td><strong>${escapeHtml(rating.name || '-')}</strong></td>
          <td>${escapeHtml(rating.service || 'SPBE Diskominfo')}</td>
          <td class="rating">${escapeHtml(rating.rating ?? '-')} ★</td>
          <td class="comment">${comment}</td>
        </tr>
      `;
    }).join('');

    printWindow.document.open();
    printWindow.document.write(`<!doctype html>
      <html lang="id">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Laporan Rekapitulasi Rating - Diskominfo Kota Bogor</title>
          <style>
            * { box-sizing: border-box; }
            :root { color-scheme: light; }
            body { margin: 0; background: #eef3f8; color: #172b4d; font: 11px/1.45 Arial, Helvetica, sans-serif; }
            .page { width: 100%; max-width: 210mm; min-height: 297mm; margin: 0 auto; padding: 14mm 13mm 12mm; background: #fff; }
            .masthead { display: grid; grid-template-columns: 22mm minmax(0, 1fr) 31mm; align-items: center; gap: 5mm; padding: 0 0 5mm; border-bottom: 2px solid #174f86; }
            .masthead-logo { width: 19mm; height: 21mm; object-fit: contain; }
            .masthead-logo-diskominfo { width: 30mm; height: 21mm; object-fit: contain; justify-self: end; }
            .agency-copy { min-width: 0; color: #1b3658; line-height: 1.45; text-align: center; }
            .eyebrow { display: block; color: #637b96; font-size: 8px; font-weight: 700; letter-spacing: 1.2px; }
            .agency-copy strong { display: block; margin: 1mm 0; color: #123f70; font-size: 15px; letter-spacing: .25px; }
            .agency-copy b { display: block; color: #174f86; font-size: 10px; letter-spacing: .3px; }
            .agency-copy span.address { display: block; margin-top: 1mm; color: #64748b; font-size: 8px; }
            .document-label { align-self: center; padding: 2.5mm 3mm; border: 1px solid #c8d9e9; border-radius: 3mm; color: #174f86; text-align: center; font-size: 8px; font-weight: 700; letter-spacing: .5px; }
            .document-label span { display: block; margin-top: 1mm; color: #64748b; font-size: 7px; font-weight: 400; letter-spacing: 0; }
            .report-title { padding: 8mm 0 5mm; text-align: center; }
            .report-kicker { margin: 0 0 2mm; color: #64748b; font-size: 8px; font-weight: 700; letter-spacing: 1.4px; }
            h1 { margin: 0; color: #123f70; font-size: 20px; line-height: 1.25; letter-spacing: .25px; }
            .subtitle { margin: 2mm 0 4mm; color: #526b86; font-size: 10px; }
            .period-row { display: flex; justify-content: center; flex-wrap: wrap; gap: 2mm; }
            .period, .printed { display: inline-block; padding: 2mm 3mm; border-radius: 2mm; background: #f0f6fc; color: #234d78; font-size: 9px; }
            .period strong { color: #123f70; }
            .printed { background: #f7f9fc; color: #64748b; }
            .section-heading { display: flex; align-items: center; gap: 3mm; margin: 0 0 3mm; color: #173f6a; font-size: 12px; font-weight: 700; }
            .section-heading:after { height: 1px; flex: 1; background: #d7e3ef; content: ''; }
            .summary { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 3mm; margin: 0 0 7mm; }
            .card { min-height: 23mm; padding: 3.5mm; border: 1px solid #d6e3ef; border-top: 3px solid #2874b8; border-radius: 2mm; background: #f8fbff; }
            .card:nth-child(2) { border-top-color: #1a9b72; background: #f7fcfa; }
            .card:nth-child(3) { border-top-color: #d99a22; background: #fffdf7; }
            .card:nth-child(4) { border-top-color: #7d68b1; background: #faf9ff; }
            .card .label { color: #526b86; font-size: 8px; font-weight: 700; }
            .card strong { display: block; margin-top: 2mm; color: #123f70; font-size: 19px; line-height: 1.15; }
            .table-wrap { width: 100%; }
            table { width: 100%; border-collapse: collapse; table-layout: auto; border: 1px solid #cbd9e7; }
            thead { display: table-header-group; }
            th, td { padding: 2.6mm 2.2mm; border: 1px solid #d6e0eb; text-align: left; vertical-align: top; }
            th { background: #174f86; color: #fff; font-size: 8px; font-weight: 700; letter-spacing: .3px; }
            td { color: #334b65; font-size: 8.5px; overflow-wrap: anywhere; }
            tbody tr:nth-child(even) { background: #f6f9fc; }
            th:first-child, td:first-child { width: 8mm; text-align: center; }
            th:nth-child(2), td:nth-child(2) { width: 22mm; white-space: nowrap; }
            th:nth-child(5), td:nth-child(5) { width: 18mm; text-align: center; white-space: nowrap; }
            .comment { white-space: pre-wrap; }
            .muted { color: #647b93; }
            .empty { padding: 10mm 3mm; color: #647b93; text-align: center; font-size: 9px; }
            .closing { display: flex; align-items: flex-end; justify-content: space-between; gap: 10mm; margin-top: 12mm; padding-top: 4mm; border-top: 1px solid #e0e8f0; color: #365775; font-size: 8px; }
            .motto { padding-left: 3mm; border-left: 2px solid #2874b8; color: #174f86; font-weight: 700; line-height: 1.6; }
            .signoff { min-width: 48mm; text-align: center; line-height: 1.6; }
            .signoff .signature-space { height: 14mm; }
            .footer { display: flex; align-items: center; justify-content: space-between; gap: 5mm; margin-top: 7mm; padding-top: 3mm; border-top: 2px solid #174f86; color: #647b93; font-size: 7.5px; }
            .footer strong { color: #174f86; }
            @page { size: A4 portrait; margin: 0; }
            @media screen { body { padding: 18px 0; } .page { box-shadow: 0 4px 24px #183b5b22; } }
            @media print {
              body { background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .page { width: 210mm; min-height: 297mm; margin: 0; padding: 13mm 13mm 11mm; box-shadow: none; }
              .masthead, .report-title, .summary, .section-heading { break-inside: avoid; }
              tr { break-inside: avoid; }
              thead { display: table-header-group; }
              .closing, .footer { break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <main class="page">
            <header class="masthead">
              <img class="masthead-logo" src="${escapeHtml(logoUrl)}" alt="Logo Pemerintah Kota Bogor">
              <div class="agency-copy">
                <span class="eyebrow">PEMERINTAH DAERAH</span>
                <strong>PEMERINTAH KOTA BOGOR</strong>
                <b>DINAS KOMUNIKASI DAN INFORMATIKA</b>
                <span class="address">Jl. Ir. H. Juanda No. 10, Bogor Tengah, Kota Bogor, Jawa Barat 16121</span>
              </div>
              <img class="masthead-logo-diskominfo" src="${escapeHtml(logoDiskominfoUrl)}" alt="Logo Diskominfo Kota Bogor">
            </header>

            <section class="report-title">
              <p class="report-kicker">SISTEM LAYANAN HELPDESK</p>
              <h1>REKAPITULASI RATING</h1>
              <p class="subtitle">Kepuasan Layanan SPBE · Dinas Komunikasi dan Informatika Pemerintah Kota Bogor</p>
              <div class="period-row">
                <span class="period"><strong>Periode:</strong> ${escapeHtml(periodNames[selectedPeriod])}</span>
                <span class="printed">Tanggal cetak: ${escapeHtml(printedAt)}</span>
              </div>
            </section>

            <h2 class="section-heading">Ringkasan Rating</h2>
            <div class="summary">
              <div class="card"><div class="label">TOTAL RESPONDEN</div><strong>${totalRatings}</strong></div>
              <div class="card"><div class="label">DENGAN KOMENTAR</div><strong>${commentedRatings.length}</strong></div>
              <div class="card"><div class="label">HANYA BINTANG</div><strong>${starOnlyRatings.length}</strong></div>
              <div class="card"><div class="label">TIKET TANPA RATING</div><strong>${unratedTicketCount}</strong></div>
            </div>

            <h2 class="section-heading">Rincian Rating</h2>
            <div class="table-wrap">
              <table>
                <thead>
                  <tr><th>No.</th><th>Tanggal</th><th>OPD Pengirim</th><th>Layanan</th><th>Rating</th><th>Ulasan / Komentar</th></tr>
                </thead>
                <tbody>${rows || '<tr><td class="empty" colspan="6">Tidak ada rating pada periode ini.</td></tr>'}</tbody>
              </table>
            </div>

            <section class="closing">
              <div class="motto">Kolaborasi Menuju<br>Bogor Digital</div>
              <div class="signoff">Dinas Komunikasi dan Informatika<br>Pemerintah Kota Bogor<div class="signature-space"></div><strong>Petugas / Penanggung Jawab</strong></div>
            </section>
            <footer class="footer"><span><strong>DISKOMINFO KOTA BOGOR</strong> · Laporan Rekapitulasi Rating</span><span>Dicetak: ${escapeHtml(printedAt)}</span></footer>
          </main>
          <script>
            window.addEventListener('load', () => {
              const images = Array.from(document.images);
              Promise.all(images.map(image => image.complete ? Promise.resolve() : new Promise(resolve => { image.onload = image.onerror = resolve; })))
                .then(() => setTimeout(() => window.print(), 350));
            });
          </script>
        </body>
      </html>`);
    printWindow.document.close();
  };

  return (
    <div className="space-y-8 font-sans text-left">
      <div className="space-y-1.5 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Manajemen Ulasan & Rating</h2>
          <p className="text-slate-500 text-base leading-relaxed">Pantau ulasan kepuasan layanan SPBE, rating bintang, dan komentar.</p>
        </div>

        {/* Filter Periode & Dropdown Tombol Ekspor Laporan Sejajar di Samping Kanan */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 shrink-0">
            <button
              type="button"
              onClick={() => setSelectedPeriod('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${selectedPeriod === 'all' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              Keseluruhan
            </button>
            <button
              type="button"
              onClick={() => setSelectedPeriod('weekly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${selectedPeriod === 'weekly' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              Mingguan
            </button>
            <button
              type="button"
              onClick={() => setSelectedPeriod('monthly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${selectedPeriod === 'monthly' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              Bulanan
            </button>
            <button
              type="button"
              onClick={() => setSelectedPeriod('yearly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${selectedPeriod === 'yearly' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              Tahunan
            </button>
          </div>

          {/* Dropdown Menu Export */}
          <div className="relative shrink-0" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsExportOpen(!isExportOpen)}
              className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-extrabold shadow-sm flex items-center gap-2 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Unduh Report</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExportOpen ? 'rotate-180' : ''}`} />
            </button>

            {isExportOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 text-left animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="w-full px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Export ke Excel (CSV)</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportPdf}
                  className="w-full px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer border-t border-slate-100"
                >
                  <FileText className="w-4 h-4 text-rose-600" />
                  <span>Export ke PDF</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Responden Rating</p>
          <p className="text-3xl font-black text-slate-800 mt-1">{totalRatings} Orang</p>
          <p className="text-sm text-slate-500 mt-1.5">Total responden yang mengisi penilaian survei.</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rating Dengan Ulasan Komentar</p>
          <p className="text-3xl font-black text-sky-600 mt-1">{commentedRatings.length} Orang</p>
          <p className="text-sm text-slate-500 mt-1.5">Responden yang menyertakan ulasan tertulis komentar.</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rating Hanya Bintang</p>
          <p className="text-3xl font-black text-slate-800 mt-1">{starOnlyRatings.length} Orang</p>
          <p className="text-sm text-slate-500 mt-1.5">Responden yang hanya memberikan penilaian bintang.</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-amber-200 shadow-sm">
          <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">Tiket Selesai Tanpa Rating</p>
          <p className="text-3xl font-black text-amber-700 mt-1">{unratedTicketCount} Tiket</p>
          <p className="text-sm text-slate-500 mt-1.5">Tiket selesai/menunggu konfirmasi yang belum memiliki penilaian SKM, termasuk tiket yang dibantu Helpdesk.</p>
        </div>
      </div>

      {loadError && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
          {loadError}
        </p>
      )}

      <div className={`p-5 rounded-2xl border flex items-start gap-3 transition-all ${selectedRatingsCount === 10
        ? 'bg-emerald-50 border-emerald-200'
        : selectedRatingsCount > 10
          ? 'bg-rose-50 border-rose-200'
          : 'bg-sky-50 border-sky-100'
        }`}>
        <AlertCircle className={`w-5 h-5 shrink-0 mt-0.5 ${selectedRatingsCount === 10 ? 'text-emerald-600' : selectedRatingsCount > 10 ? 'text-rose-600' : 'text-sky-600'
          }`} />
        <div className="text-sm space-y-1">
          <p className="font-bold text-slate-800">Aturan Tampilan Testimoni Landing Page</p>
          <p className="leading-relaxed text-slate-650">
            Kuota tampilan slider testimoni halaman depan dibatasi maksimal <strong>10 ulasan terpilih</strong>.
            Saat ini terpilih <strong className={`font-black ${selectedRatingsCount === 10 ? 'text-emerald-700' : selectedRatingsCount > 10 ? 'text-rose-700' : 'text-sky-700'}`}>{selectedRatingsCount} / 10 ulasan</strong>
            {selectedRatingsCount === 10 && ' (Kuota Penuh).'}
            {selectedRatingsCount > 10 && ' (Melebihi Kuota! Silakan batalkan salah satu ulasan).'}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/60 pb-5">
        <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mr-2">Filter Bintang:</span>
        <button
          onClick={() => setSelectedStarFilter('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedStarFilter === 'all'
            ? 'bg-sky-600 text-white shadow-sm shadow-sky-500/20'
            : 'bg-white hover:bg-slate-50 text-slate-650 border border-slate-200'
            }`}
        >
          Semua ({ratingsByPeriod.length})
        </button>
        {[5, 4, 3, 2, 1].map((stars) => {
          const count = ratingsByPeriod.filter(r => Number(r.rating) === stars).length;
          return (
            <button
              key={stars}
              onClick={() => setSelectedStarFilter(stars)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${selectedStarFilter === stars
                ? 'bg-sky-600 text-white shadow-sm shadow-sky-500/20'
                : 'bg-white hover:bg-slate-50 text-slate-650 border border-slate-200'
                }`}
            >
              <span>{stars} Bintang</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${selectedStarFilter === stars ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                }`}>{count}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <p className="py-10 text-center font-semibold text-slate-500">Memuat ulasan dan rating...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedRatings.length === 0 ? (
            <div className="col-span-full bg-white rounded-2xl border border-slate-200 p-16 text-center text-slate-400 space-y-3">
              <ShieldAlert className="w-10 h-10 mx-auto text-slate-300" />
              <p className="font-semibold text-base">Tidak ada ulasan komentar pada periode dan filter bintang ini.</p>
            </div>
          ) : (
            displayedRatings.map((r) => (
              <div
                key={r.id}
                className={`bg-white rounded-2xl border p-6 flex flex-col justify-between hover:shadow-md transition-all ${r.selectedForLanding ? 'border-sky-500 ring-1 ring-sky-500/20' : 'border-slate-200'
                  }`}
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-0.5 text-amber-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < r.rating ? 'fill-amber-500 text-amber-500' : 'text-slate-200'}`} />
                      ))}
                    </div>
                    <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${r.status?.includes('SLA') ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-600'
                      }`}>
                      {r.status || 'Selesai'}
                    </span>
                  </div>

                  {/* Badge Layanan Yang Di-rating */}
                  <div className="flex items-center">
                    <span className="px-2.5 py-1 bg-slate-50 border border-slate-200/80 rounded-lg text-xs font-semibold text-slate-500">
                      Layanan: {r.service || 'SPBE Diskominfo'}
                    </span>
                  </div>

                  {r.comment && r.comment.trim() !== '' ? (
                    <p className="text-base text-slate-655 leading-relaxed italic">
                      "{r.comment}"
                    </p>
                  ) : (
                    <p className="text-sm text-slate-400 italic font-medium">
                      (Tidak ada ulasan tertulis / Hanya memberikan rating bintang)
                    </p>
                  )}

                  {r.aspects && (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 bg-slate-50 border border-slate-200/60 rounded-xl p-3 text-xs">
                      <div className="flex justify-between items-center text-slate-550 font-bold">
                        <span>Kecepatan</span>
                        <span className="text-amber-600 flex items-center gap-0.5 font-extrabold">★ {r.aspects.speed}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-550 font-bold">
                        <span>Kesesuaian</span>
                        <span className="text-amber-600 flex items-center gap-0.5 font-extrabold">★ {r.aspects.result}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-550 font-bold">
                        <span>Komunikasi</span>
                        <span className="text-amber-600 flex items-center gap-0.5 font-extrabold">★ {r.aspects.communication}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-550 font-bold">
                        <span>Kualitas</span>
                        <span className="text-amber-600 flex items-center gap-0.5 font-extrabold">★ {r.aspects.quality}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
                  <div>
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">OPD Pengirim</span>
                    <span className="text-sm font-bold text-slate-800">{r.name}</span>
                  </div>

                  {r.comment && r.comment.trim() !== '' && canManageLanding ? (
                    <button
                      type="button"
                      onClick={() => toggleRatingForLanding(r)}
                      disabled={updatingRatingId === r.id || (!r.selectedForLanding && selectedRatingsCount >= 10)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${r.selectedForLanding
                        ? 'bg-sky-600 hover:bg-sky-700 text-white shadow-sm cursor-pointer'
                        : selectedRatingsCount >= 10
                          ? 'bg-slate-100 text-slate-400 border border-slate-200 hover:bg-slate-200/60 cursor-pointer'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-650 border border-slate-200 cursor-pointer'
                        }`}
                      title={!r.selectedForLanding && selectedRatingsCount >= 10 ? 'Kuota 10 ulasan sudah penuh. Batalkan ulasan lain terlebih dahulu.' : ''}
                    >
                      {r.selectedForLanding ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Ditampilkan (Landing)</span>
                        </>
                      ) : (
                        <span>Tampilkan</span>
                      )}
                    </button>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-200/60 px-2.5 py-1 rounded-md">
                      Hanya Bintang
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};