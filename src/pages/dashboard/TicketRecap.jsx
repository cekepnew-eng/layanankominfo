import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Download, FileText, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';

const formatDateInput = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDateInput = (value) => {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) || date.getFullYear() !== year ||
    date.getMonth() !== month - 1 || date.getDate() !== day
    ? null
    : date;
};

const getTicketStatus = (ticket) => {
  const status = String(ticket.status_name || '').toUpperCase();
  if (status === 'REJECTED' || Number(ticket.status_id) === 3) return 'Ditolak';
  if (['COMPLETED', 'WAITING_USER_CONFIRMATION'].includes(status) || Number(ticket.status_id) === 7 || Number(ticket.status_id) === 6) {
    return 'Selesai';
  }
  return 'Diproses';
};

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

export const TicketRecap = () => {
  const today = new Date();
  const [startDate, setStartDate] = useState(formatDateInput(new Date(today.getFullYear(), today.getMonth(), 1)));
  const [endDate, setEndDate] = useState(formatDateInput(today));
  const [selectedPreset, setSelectedPreset] = useState('monthly');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [exportError, setExportError] = useState('');

  const fetchTickets = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const response = await api.getAdminTickets();
      setTickets(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setErrorMessage(error.message || 'Gagal memuat rekap tiket.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const start = parseDateInput(startDate);
  const end = parseDateInput(endDate);
  const validRange = Boolean(start && end && start.getTime() <= end.getTime());
  const startTime = validRange ? start.getTime() : null;
  const endTime = validRange
    ? new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1).getTime()
    : null;
  const filteredTickets = useMemo(() => {
    if (!validRange) return [];
    return tickets.filter(ticket => {
      const ticketDate = new Date(ticket.created_at);
      return !Number.isNaN(ticketDate.getTime()) &&
        ticketDate.getTime() >= startTime &&
        ticketDate.getTime() < endTime;
    });
  }, [tickets, startTime, endTime, validRange]);

  const summary = useMemo(() => filteredTickets.reduce((result, ticket) => {
    result[getTicketStatus(ticket)] += 1;
    return result;
  }, { Ditolak: 0, Selesai: 0, Diproses: 0 }), [filteredTickets]);

  const formatDate = (date) => date?.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }) || '-';

  const applyDatePreset = (preset) => {
    const presetEnd = new Date();
    presetEnd.setHours(0, 0, 0, 0);
    const presetStart = new Date(presetEnd);

    if (preset === 'daily') {
      presetStart.setTime(presetEnd.getTime());
    } else if (preset === 'weekly') {
      presetStart.setDate(presetStart.getDate() - 6);
    } else if (preset === 'monthly') {
      presetStart.setDate(1);
    } else if (preset === 'yearly') {
      presetStart.setMonth(0, 1);
    } else if (preset === 'three-years') {
      presetStart.setFullYear(presetStart.getFullYear() - 3);
    }

    setStartDate(formatDateInput(presetStart));
    setEndDate(formatDateInput(presetEnd));
    setSelectedPreset(preset);
  };

  const exportPdf = () => {
    setExportError('');
    const reportWindow = window.open('', '_blank');
    if (!reportWindow) {
      setExportError('Jendela laporan diblokir browser. Izinkan pop-up lalu coba lagi.');
      return;
    }

    const rows = filteredTickets.map((ticket, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(ticket.ticket_number || ticket.id)}</td>
        <td>${escapeHtml(ticket.pemohon || '-')}</td>
        <td>${escapeHtml(ticket.service_name || '-')}</td>
        <td><span class="status ${getTicketStatus(ticket) === 'Selesai' ? 'done' : getTicketStatus(ticket) === 'Diproses' ? 'progress' : ''}">${escapeHtml(getTicketStatus(ticket))}</span></td>
        <td>${escapeHtml(new Date(ticket.created_at).toLocaleDateString('id-ID'))}</td>
      </tr>
    `).join('');
    const rangeLabel = `${formatDate(start)} - ${formatDate(end)}`;
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

    reportWindow.document.open();
    reportWindow.document.write(`<!doctype html>
      <html lang="id">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Rekap Tiket Helpdesk</title>
          <style>
            * { box-sizing: border-box; }
            :root { color-scheme: light; }
            body { margin: 0; background: #eef3f8; color: #172b4d; font: 11px/1.45 Arial, Helvetica, sans-serif; }
            .page { width: 100%; max-width: 210mm; min-height: 297mm; margin: 0 auto; padding: 14mm 13mm 12mm; background: #fff; }
            .masthead { display: grid; grid-template-columns: 22mm minmax(0, 1fr) 31mm; align-items: center; gap: 5mm; padding: 0 0 5mm; border-bottom: 2px solid #174f86; }
            .masthead-logo { width: 19mm; height: 21mm; object-fit: contain; }
            .masthead-logo-diskominfo { width: 30mm; height: 21mm; object-fit: contain; justify-self: end; }
            .agency-copy { min-width: 0; color: #1b3658; line-height: 1.45; }
            .eyebrow { display: block; color: #637b96; font-size: 8px; font-weight: 700; letter-spacing: 1.2px; }
            .agency-copy strong { display: block; margin: 1mm 0; color: #123f70; font-size: 15px; letter-spacing: .25px; }
            .agency-copy b { display: block; color: #174f86; font-size: 10px; letter-spacing: .3px; }
            .agency-copy span.address { display: block; margin-top: 1mm; color: #64748b; font-size: 8px; }
            .document-label { align-self: center; padding: 2.5mm 3mm; border: 1px solid #c8d9e9; border-radius: 3mm; color: #174f86; text-align: center; font-size: 8px; font-weight: 700; letter-spacing: .5px; white-space: nowrap; }
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
            .card .label { color: #526b86; font-size: 8px; font-weight: 700; }
            .card strong { display: block; margin-top: 2mm; color: #123f70; font-size: 23px; line-height: 1; }
            .card.rejected { border-top-color: #d9534f; background: #fffafa; }
            .card.rejected strong { color: #b93838; }
            .card.completed { border-top-color: #1a9b72; background: #f7fcfa; }
            .card.completed strong { color: #137c5c; }
            .card.processing { border-top-color: #d99a22; background: #fffdf7; }
            .card.processing strong { color: #a56a0a; }
            .table-wrap { width: 100%; }
            table { width: 100%; border-collapse: collapse; table-layout: auto; border: 1px solid #cbd9e7; }
            thead { display: table-header-group; }
            th, td { padding: 2.6mm 2.2mm; border: 1px solid #d6e0eb; text-align: left; vertical-align: top; }
            th { background: #174f86; color: #fff; font-size: 8px; font-weight: 700; letter-spacing: .3px; }
            td { color: #334b65; font-size: 8.5px; overflow-wrap: anywhere; }
            tbody tr:nth-child(even) { background: #f6f9fc; }
            th:first-child, td:first-child { width: 8mm; text-align: center; }
            th:nth-child(2), td:nth-child(2) { width: 25mm; }
            th:nth-child(5), td:nth-child(5) { width: 22mm; }
            th:nth-child(6), td:nth-child(6) { width: 23mm; white-space: nowrap; }
            .status { display: inline-block; padding: 1mm 2mm; border-radius: 10mm; background: #fff0f0; color: #b93838; font-size: 7.5px; font-weight: 700; white-space: nowrap; }
            .status.done { background: #e7f7f1; color: #137c5c; }
            .status.progress { background: #fff4dc; color: #98640b; }
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
              .closing { break-inside: avoid; }
              .footer { break-inside: avoid; }
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
                <span class="address">Jl. Ir. H. Juanda No. 10, Bogor Tengah, Kota Bogor · Jawa Barat 16121</span>
              </div>
              <img class="masthead-logo-diskominfo" src="${escapeHtml(logoDiskominfoUrl)}" alt="Logo Diskominfo Kota Bogor">
            </header>

            <section class="report-title">
              <p class="report-kicker">SISTEM LAYANAN HELPDESK</p>
              <h1>REKAPITULASI TIKET</h1>
              <p class="subtitle">Dinas Komunikasi dan Informatika Pemerintah Kota Bogor</p>
              <div class="period-row">
                <span class="period"><strong>Periode:</strong> ${escapeHtml(rangeLabel)}</span>
                <span class="printed">Tanggal cetak: ${escapeHtml(printedAt)}</span>
              </div>
            </section>

            <h2 class="section-heading">Ringkasan Tiket</h2>
            <div class="summary">
              <div class="card"><div class="label">TOTAL TIKET</div><strong>${filteredTickets.length}</strong></div>
              <div class="card rejected"><div class="label">DITOLAK</div><strong>${summary.Ditolak}</strong></div>
              <div class="card completed"><div class="label">SELESAI</div><strong>${summary.Selesai}</strong></div>
              <div class="card processing"><div class="label">DIPROSES</div><strong>${summary.Diproses}</strong></div>
            </div>

            <h2 class="section-heading">Rincian Tiket</h2>
            <div class="table-wrap">
              <table>
                <thead><tr><th>No.</th><th>No. Tiket</th><th>Pemohon</th><th>Layanan</th><th>Status</th><th>Tanggal</th></tr></thead>
                <tbody>${rows || '<tr><td class="empty" colspan="6">Tidak ada tiket pada rentang tanggal ini.</td></tr>'}</tbody>
              </table>
            </div>

            <section class="closing">
              <div class="motto">Kolaborasi Menuju<br>Bogor Digital</div>
              <div class="signoff">Dinas Komunikasi dan Informatika<br>Pemerintah Kota Bogor<div class="signature-space"></div><strong>Petugas / Penanggung Jawab</strong></div>
            </section>
            <footer class="footer"><span><strong>DISKOMINFO KOTA BOGOR</strong> · Laporan Rekapitulasi Tiket Helpdesk</span><span>Dicetak: ${escapeHtml(printedAt)}</span></footer>
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
    reportWindow.document.close();
  };

  return (
    <div className="space-y-6 font-sans text-left">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900">Rekap Tiket</h2>
          <p className="mt-1 text-sm font-medium text-slate-500">Ringkasan tiket ditolak, selesai, dan sedang diproses.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={fetchTickets} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Muat ulang
          </button>
          <button type="button" onClick={exportPdf} disabled={!validRange || loading} className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50">
            <Download className="h-4 w-4" /> Export PDF
          </button>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-sm font-black text-slate-800">
          <CalendarDays className="h-4 w-4 text-sky-600" /> Periode Rekap
        </div>
        <div className="mb-3 flex flex-wrap items-center gap-1 rounded-2xl border border-slate-100 bg-slate-50 p-1">
          {[
            { id: 'daily', label: 'Harian' },
            { id: 'weekly', label: 'Mingguan' },
            { id: 'monthly', label: 'Bulanan' },
            { id: 'yearly', label: 'Tahunan' },
            { id: 'three-years', label: '3 Tahun Terakhir' }
          ].map(preset => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyDatePreset(preset.id)}
              className={`rounded-xl px-3 py-2 text-xs font-black transition-colors ${
                selectedPreset === preset.id
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-white hover:text-sky-700'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs font-bold text-slate-500">
            Tanggal mulai
            <input
              type="date"
              value={startDate}
              onChange={event => {
                setStartDate(event.target.value);
                setSelectedPreset(null);
              }}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-bold text-slate-500">
            Tanggal akhir
            <input
              type="date"
              value={endDate}
              onChange={event => {
                setEndDate(event.target.value);
                setSelectedPreset(null);
              }}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800"
            />
          </label>
          {!validRange && <p className="text-xs font-semibold text-rose-600">Periksa rentang tanggal. Tanggal mulai tidak boleh melewati tanggal akhir.</p>}
        </div>
        {exportError && <p role="alert" className="mt-3 text-sm font-semibold text-rose-600">{exportError}</p>}
      </section>

      {errorMessage && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">{errorMessage}</p>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total Tiket', count: filteredTickets.length, color: 'text-slate-900' },
          { label: 'Ditolak', count: summary.Ditolak, color: 'text-rose-600' },
          { label: 'Selesai', count: summary.Selesai, color: 'text-emerald-600' },
          { label: 'Diproses', count: summary.Diproses, color: 'text-amber-600' }
        ].map(card => (
          <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{card.label}</p>
            <p className={`mt-2 text-3xl font-black ${card.color}`}>{loading ? '—' : card.count}</p>
          </div>
        ))}
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 p-5">
          <FileText className="h-5 w-5 text-sky-600" />
          <div>
            <h3 className="font-black text-slate-800">Rincian Tiket</h3>
            <p className="text-xs text-slate-500">{validRange ? `${formatDate(start)} – ${formatDate(end)}` : 'Rentang tanggal tidak valid'}</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr><th className="px-5 py-3">No. Tiket</th><th className="px-5 py-3">Pemohon</th><th className="px-5 py-3">Layanan</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Tanggal</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="5" className="px-5 py-8 text-center font-semibold text-slate-400">Memuat rekap tiket...</td></tr>
              ) : filteredTickets.length ? filteredTickets.map(ticket => (
                <tr key={ticket.id} className="text-slate-700">
                  <td className="px-5 py-3 font-bold">{ticket.ticket_number || ticket.id}</td>
                  <td className="px-5 py-3">{ticket.pemohon || '-'}</td>
                  <td className="px-5 py-3">{ticket.service_name || '-'}</td>
                  <td className="px-5 py-3 font-bold">{getTicketStatus(ticket)}</td>
                  <td className="px-5 py-3">{new Date(ticket.created_at).toLocaleDateString('id-ID')}</td>
                </tr>
              )) : (
                <tr><td colSpan="5" className="px-5 py-8 text-center font-semibold text-slate-400">{errorMessage ? 'Data tidak tersedia karena gagal dimuat.' : 'Tidak ada tiket pada rentang tanggal ini.'}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      <p className="text-xs text-slate-500">Saat memilih Export PDF, gunakan opsi “Simpan sebagai PDF” pada dialog cetak browser.</p>
    </div>
  );
};
