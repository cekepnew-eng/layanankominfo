import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronDown, Download, FileText, RefreshCw, Search, X } from 'lucide-react';
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
  const [refreshKey, setRefreshKey] = useState(0);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [exportError, setExportError] = useState('');
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isSignatoryDialogOpen, setIsSignatoryDialogOpen] = useState(false);
  const [signatoryUsers, setSignatoryUsers] = useState([]);
  const [signatorySearchQuery, setSignatorySearchQuery] = useState('');
  const [isSignatoryTndSearchRequested, setIsSignatoryTndSearchRequested] = useState(false);
  const [signatoryTndSearchAttempt, setSignatoryTndSearchAttempt] = useState(0);
  const [selectedSignatory, setSelectedSignatory] = useState(null);
  const [isSignatorySearchOpen, setIsSignatorySearchOpen] = useState(false);
  const [signatoryLoading, setSignatoryLoading] = useState(false);
  const [signatoryError, setSignatoryError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    const loadTickets = async () => {
      if (!startDate || !endDate || startDate > endDate) {
        setTickets([]);
        setLoading(false);
        setErrorMessage('');
        return;
      }

      setLoading(true);
      setErrorMessage('');
      try {
        const response = await api.getAdminTicketRecap({
          startDate,
          endDate,
          signal: controller.signal
        });
        setTickets(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        if (error.name !== 'AbortError') {
          setErrorMessage(error.message || 'Gagal memuat rekap tiket.');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    loadTickets();
    return () => controller.abort();
  }, [startDate, endDate, refreshKey]);

  const fetchTickets = () => setRefreshKey(current => current + 1);

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

  const openSignatoryDialog = () => {
    setIsExportMenuOpen(false);
    setSignatorySearchQuery('');
    setIsSignatoryTndSearchRequested(false);
    setSignatoryTndSearchAttempt(0);
    setSelectedSignatory(null);
    setIsSignatorySearchOpen(true);
    setIsSignatoryDialogOpen(true);
    setSignatoryError('');
  };

  useEffect(() => {
    if (!isSignatoryDialogOpen) return undefined;
    let active = true;
    const controller = new AbortController();
    let timeout;
    const timer = setTimeout(async () => {
      setSignatoryLoading(true);
      setSignatoryError('');
      timeout = setTimeout(() => controller.abort(), 15000);
      try {
        const query = signatorySearchQuery.trim();
        const response = await api.getOpdUsers(query, {
          searchTnd: isSignatoryTndSearchRequested,
          signal: controller.signal
        });
        const users = (Array.isArray(response.data) ? response.data : []).filter(user =>
          user.source === 'TND' ||
          String(user.role || '').toUpperCase() === 'PEGAWAI' ||
          (Array.isArray(user.roles) && user.roles.some(role => String(role).toUpperCase() === 'PEGAWAI'))
        );
        if (active) {
          setSignatoryUsers(users);
        }
      } catch (error) {
        if (active) {
          const fallbackUsers = Array.isArray(error.data?.data) ? error.data.data : [];
          setSignatoryUsers(fallbackUsers.filter(user =>
            user.source === 'TND' ||
            String(user.role || '').toUpperCase() === 'PEGAWAI' ||
            (Array.isArray(user.roles) && user.roles.some(role => String(role).toUpperCase() === 'PEGAWAI'))
          ));
          setSignatoryError(controller.signal.aborted
            ? 'Pencarian pegawai melewati batas waktu. Silakan coba lagi.'
            : error.message || 'Gagal mencari data pegawai.');
        }
      } finally {
        clearTimeout(timeout);
        if (active) setSignatoryLoading(false);
      }
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
      clearTimeout(timeout);
      controller.abort();
    };
  }, [isSignatoryDialogOpen, signatorySearchQuery, isSignatoryTndSearchRequested, signatoryTndSearchAttempt]);

  const exportPdf = (signatory = null) => {
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
    const printedDate = new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    const logoUrl = `${window.location.origin}/bogor.png`;
    const logoDiskominfoUrl = `${window.location.origin}/kominfo.png`;
    const signatorySection = signatory ? `
      <section class="signatory-block">
        <p class="signatory-date">Bogor, ${escapeHtml(printedDate)}</p>
        <p class="signatory-description">Rekapitulasi ini memuat ${filteredTickets.length} tiket layanan pada periode ${escapeHtml(rangeLabel)}.</p>
        <div class="signature-space"></div>
        <strong class="signatory-name">${escapeHtml(signatory.name)}</strong>
        <span class="signatory-detail">NIP. ${escapeHtml(signatory.nip || '-')}</span>
        <span class="signatory-detail">${escapeHtml(signatory.position)}</span>
      </section>
    ` : '';
    const closingSection = signatory
      ? '<section class="closing"><div class="motto">Kolaborasi Menuju<br>Bogor Digital</div></section>'
      : '<section class="closing"><div class="motto">Kolaborasi Menuju<br>Bogor Digital</div><div class="signoff">Dinas Komunikasi dan Informatika<br>Pemerintah Kota Bogor<div class="signature-space"></div><strong>Petugas / Penanggung Jawab</strong></div></section>';

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
            .agency-copy { min-width: 0; color: #1b3658; line-height: 1.45; text-align: center; }
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
            .signatory-block { width: 66mm; margin: 6mm 0 8mm auto; color: #365775; text-align: center; font-size: 9px; line-height: 1.5; break-inside: avoid; page-break-inside: avoid; }
            .signatory-date { margin: 0 0 2mm; text-align: right; }
            .signatory-description { margin: 0 0 1mm; }
            .signatory-block .signature-space { height: 22mm; }
            .signatory-name { display: block; color: #172b4d; text-decoration: underline; }
            .signatory-detail { display: block; }
            .footer { display: flex; align-items: center; justify-content: space-between; gap: 5mm; margin-top: 7mm; padding-top: 3mm; border-top: 2px solid #174f86; color: #647b93; font-size: 7.5px; }
            .footer strong { color: #174f86; }
            @page { size: A4 portrait; margin: 36mm 13mm 18mm; }
            @media screen { body { padding: 18px 0; } .page { box-shadow: 0 4px 24px #183b5b22; } }
            @media print {
              body { background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .page { width: auto; min-height: 0; margin: 0; padding: 0; box-shadow: none; }
              .masthead { position: fixed; top: -31mm; left: 0; right: 0; width: 100%; padding-bottom: 3mm; background: #fff; }
              .masthead, .report-title, .summary, .section-heading { break-inside: avoid; }
              tr { break-inside: avoid; }
              thead { display: table-header-group; }
              .closing { break-inside: avoid; }
              .footer { position: fixed; right: 0; bottom: -14mm; left: 0; margin-top: 0; padding-top: 2mm; background: #fff; }
              .signatory-block { break-inside: avoid; page-break-inside: avoid; }
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

            ${signatorySection}

            <h2 class="section-heading">Rincian Tiket</h2>
            <div class="table-wrap">
              <table>
                <thead><tr><th>No.</th><th>No. Tiket</th><th>Pemohon</th><th>Layanan</th><th>Status</th><th>Tanggal</th></tr></thead>
                <tbody>${rows || '<tr><td class="empty" colspan="6">Tidak ada tiket pada rentang tanggal ini.</td></tr>'}</tbody>
              </table>
            </div>

            ${closingSection}
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

  const matchingSignatoryUsers = signatoryUsers.filter(user => {
    const query = signatorySearchQuery.trim().toLocaleLowerCase('id-ID');
    const name = user.name || user.full_name || '';
    const nip = String(user.nip || '');
    const jabatan = String(user.jabatan || user.position || user.job_title || '');
    return !query || [name, nip, jabatan].some(value =>
      String(value).toLocaleLowerCase('id-ID').includes(query)
    );
  });

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
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsExportMenuOpen(open => !open)}
              disabled={!validRange || loading}
              aria-expanded={isExportMenuOpen}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-4 w-4" /> Export PDF <ChevronDown className="h-4 w-4" />
            </button>
            {isExportMenuOpen && (
              <div className="absolute right-0 z-20 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                <button
                  type="button"
                  onClick={() => {
                    setIsExportMenuOpen(false);
                    exportPdf();
                  }}
                  className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cetak PDF langsung
                  <span className="mt-0.5 block text-xs font-normal text-slate-500">Format laporan seperti sebelumnya</span>
                </button>
                <button
                  type="button"
                  onClick={openSignatoryDialog}
                  className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cetak dengan penandatangan
                  <span className="mt-0.5 block text-xs font-normal text-slate-500">Cari pegawai lewat API</span>
                </button>
              </div>
            )}
          </div>
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
      <p className="text-xs text-slate-500">Pilih opsi ekspor PDF, lalu gunakan “Simpan sebagai PDF” pada dialog cetak browser.</p>

      {isSignatoryDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <form
            onSubmit={event => {
              event.preventDefault();
              if (!selectedSignatory?.name || !selectedSignatory?.nip || !selectedSignatory?.jabatan) return;
              exportPdf({
                name: selectedSignatory.name,
                nip: selectedSignatory.nip,
                position: selectedSignatory.jabatan
              });
              setIsSignatoryDialogOpen(false);
            }}
            className="w-full max-w-lg space-y-5 rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Penandatangan Laporan</h3>
                <p className="mt-1 text-sm text-slate-500">Pilih pegawai yang akan menandatangani rekap tiket.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsSignatoryDialogOpen(false)}
                aria-label="Tutup"
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {selectedSignatory ? (
              <div className="flex items-start justify-between gap-3 rounded-xl border-2 border-sky-400 bg-sky-50 p-3.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold text-slate-900">{selectedSignatory.name}</p>
                  <p className="mt-1 text-xs font-medium text-slate-600">NIP: {selectedSignatory.nip}</p>
                  {selectedSignatory.jabatan && (
                    <p className="text-xs font-medium text-slate-600">Jabatan: {selectedSignatory.jabatan}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSignatory(null);
                    setSignatorySearchQuery('');
                    setIsSignatorySearchOpen(true);
                  }}
                  className="shrink-0 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-sky-700 hover:bg-sky-100"
                >
                  Ganti
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="block space-y-1.5 text-xs font-bold uppercase tracking-wide text-slate-600">
                  Cari Pegawai
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="search"
                      value={signatorySearchQuery}
                      onChange={event => {
                        setSignatorySearchQuery(event.target.value);
                        setIsSignatoryTndSearchRequested(false);
                        setIsSignatorySearchOpen(true);
                        setSignatoryError('');
                      }}
                      onFocus={() => setIsSignatorySearchOpen(true)}
                      placeholder="Ketik nama, NIP, atau jabatan"
                      className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm font-medium normal-case tracking-normal text-slate-800 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                  <span className="block text-[11px] font-medium normal-case tracking-normal text-slate-500">
                    Cari nama atau NIP akun. Pencarian TND tersedia setelah minimal 3 karakter.
                  </span>
                </label>

                {isSignatorySearchOpen && (
                  <div className="max-h-64 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                    {signatoryError && (
                      <p role="alert" className="border-b border-rose-100 bg-rose-50 p-3 text-center text-xs font-semibold text-rose-700">
                        {signatoryError}
                      </p>
                    )}
                    {signatoryLoading ? (
                      <p className="p-4 text-center text-sm font-medium text-slate-500">Mencari pegawai dari API...</p>
                    ) : matchingSignatoryUsers.length ? matchingSignatoryUsers.map(user => {
                      const name = user.name || user.full_name || '';
                      const nip = String(user.nip || '');
                      const jabatan = String(user.jabatan || user.position || user.job_title || '');
                      return (
                        <button
                          key={user.id || `${user.source}-${user.email || nip}`}
                          type="button"
                          disabled={!name || !nip}
                          onClick={() => {
                            setSelectedSignatory({ name, nip, jabatan });
                            setIsSignatorySearchOpen(false);
                          }}
                          className="flex w-full items-center justify-between gap-3 p-3 text-left transition-colors hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <span className="min-w-0">
                            <span className="flex flex-wrap items-center gap-2">
                              <span className="truncate text-sm font-extrabold text-slate-900">{name || 'Nama tidak tersedia'}</span>
                              {nip && <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-600">NIP: {nip}</span>}
                              {user.source === 'TND' && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">TND</span>}
                            </span>
                            <span className="mt-1 block truncate text-xs font-medium text-slate-500">Jabatan: {jabatan || 'Tidak tersedia dari API'}</span>
                          </span>
                          <span className="shrink-0 rounded-lg bg-sky-50 px-2.5 py-1.5 text-xs font-bold text-sky-700">
                            {name && nip ? 'Pilih' : 'Data kurang'}
                          </span>
                        </button>
                      );
                    }                    ) : (
                      <p className="p-4 text-center text-sm font-medium text-slate-500">
                        {isSignatoryTndSearchRequested
                          ? `Pegawai "${signatorySearchQuery}" tidak ditemukan di akun lokal atau TND.`
                          : signatorySearchQuery
                            ? `Pegawai "${signatorySearchQuery}" tidak ditemukan di akun lokal.`
                            : 'Tidak ada pegawai yang cocok.'}
                      </p>
                    )}
                    {!signatoryLoading &&
                      (!isSignatoryTndSearchRequested || signatoryError) &&
                      signatorySearchQuery.trim().length >= 3 && (
                        <div className="border-t border-slate-100 p-3 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setIsSignatoryTndSearchRequested(true);
                              setSignatoryTndSearchAttempt(attempt => attempt + 1);
                            }}
                            className="rounded-lg bg-sky-600 px-3 py-2 text-xs font-bold text-white hover:bg-sky-700"
                          >
                            {signatoryError ? 'Coba cari lagi di TND' : 'Cari pegawai ini di TND'}
                          </button>
                        </div>
                      )}
                  </div>
                )}
              </div>
            )}

            {selectedSignatory && !selectedSignatory.jabatan && (
              <label className="block space-y-1.5 text-xs font-bold uppercase tracking-wide text-slate-600">
                Jabatan
                <input
                  required
                  value={selectedSignatory.jabatan || ''}
                  onChange={event => setSelectedSignatory(current => ({
                    ...current,
                    jabatan: event.target.value
                  }))}
                  maxLength={150}
                  placeholder="Jabatan belum tersedia dari API, isi jabatan pegawai"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold normal-case tracking-normal text-slate-800 placeholder:font-normal"
                />
              </label>
            )}

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setIsSignatoryDialogOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={signatoryLoading || Boolean(signatoryError) || !selectedSignatory?.name || !selectedSignatory?.nip || !selectedSignatory?.jabatan}
                className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Export PDF
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
