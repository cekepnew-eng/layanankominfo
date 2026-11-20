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

const formatWorkDuration = (ticket) => {
  const status = String(ticket.status_name || '').toUpperCase();
  if (!['IN_PROGRESS', 'WAITING_USER_CONFIRMATION', 'COMPLETED'].includes(status)) return '-';

  const workStartedAt = Date.parse(ticket.work_started_at || '');
  const createdAt = Date.parse(ticket.created_at || '');
  const startedAt = Number.isNaN(workStartedAt) ? createdAt : workStartedAt;
  if (Number.isNaN(startedAt)) return '-';

  const savedCompletedAt = Date.parse(ticket.work_completed_at || '');
  const completedAt = Number.isNaN(savedCompletedAt) ? Date.now() : savedCompletedAt;
  const totalMinutes = Math.max(0, Math.floor((completedAt - startedAt) / 60000));
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  const duration = [];

  if (days) duration.push(`${days} hari`);
  if (hours) duration.push(`${hours} jam`);
  if (minutes || duration.length === 0) duration.push(`${minutes} menit`);
  return duration.join(' ');
};

export const TicketRecap = () => {
  const today = new Date();
  const [tickets, setTickets] = useState([]);
  const [endDate, setEndDate] = useState(formatDateInput(today));
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(formatDateInput(new Date(today.getFullYear(), today.getMonth(), 1)));
  const [refreshKey, setRefreshKey] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [exportError, setExportError] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('monthly');
  const [signatoryUsers, setSignatoryUsers] = useState([]);
  const [isExporting, setIsExporting] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState('');
  const [previewPdfName, setPreviewPdfName] = useState('');
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isSignatoryDialogOpen, setIsSignatoryDialogOpen] = useState(false);
  const [signatorySearchQuery, setSignatorySearchQuery] = useState('');
  const [isSignatoryTndSearchRequested, setIsSignatoryTndSearchRequested] = useState(false);
  const [signatoryTndSearchAttempt, setSignatoryTndSearchAttempt] = useState(0);
  const [selectedSignatory, setSelectedSignatory] = useState(null);
  const [isSignatorySearchOpen, setIsSignatorySearchOpen] = useState(false);
  const [signatoryLoading, setSignatoryLoading] = useState(false);
  const [signatoryError, setSignatoryError] = useState('');

  useEffect(() => {
    if (!previewPdfUrl) return undefined;
    return () => URL.revokeObjectURL(previewPdfUrl);
  }, [previewPdfUrl]);

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

  const selectSignatory = async (user) => {
    const name = user.name || user.full_name || '';
    const nip = String(user.nip || '');
    const email = String(user.email || '').trim();
    const username = String(user.username || '').trim();
    const lookupKey = (email || nip || username).toLowerCase();
    const existingJabatan = String(user.jabatan || user.position || user.job_title || '').trim();
    const identifiers = [...new Set([username, email, nip].map(value => value.trim()).filter(value => value.length >= 3))];

    setSelectedSignatory({ name, nip, jabatan: existingJabatan, lookupKey });
    setIsSignatorySearchOpen(false);
    setSignatoryError('');

    if (user.source === 'TND' && existingJabatan) return;
    if (!identifiers.length) {
      if (!existingJabatan) setSignatoryError('Username, email, atau NIP pegawai tidak tersedia untuk mencari jabatan di API TND.');
      return;
    }

    setSignatoryLoading(true);
    try {
      let jabatan = '';
      for (const identifier of identifiers) {
        const response = await api.getOpdUsers(identifier, { searchTnd: true });
        const candidates = Array.isArray(response.data) ? response.data : [];
        const matchesIdentity = candidate => {
          const candidateEmail = String(candidate.email || '').trim().toLowerCase();
          const candidateUsername = String(candidate.username || '').trim().toLowerCase();
          const candidateNip = String(candidate.nip || '').trim().toLowerCase();
          return (email && candidateEmail === email.toLowerCase()) ||
            (username && candidateUsername === username.toLowerCase()) ||
            (nip && candidateNip === nip.toLowerCase());
        };
        const hasJabatan = candidate => Boolean(
          String(candidate.jabatan || candidate.position || candidate.job_title || '').trim()
        );
        const tndCandidates = candidates.filter(candidate => candidate.source === 'TND');
        const matchingUser = candidates.find(candidate => matchesIdentity(candidate) && hasJabatan(candidate))
          || (tndCandidates.length === 1 && hasJabatan(tndCandidates[0]) ? tndCandidates[0] : null)
          || candidates.find(matchesIdentity)
          || (tndCandidates.length === 1 ? tndCandidates[0] : null);
        jabatan = String(matchingUser?.jabatan || matchingUser?.position || matchingUser?.job_title || '').trim();
        if (jabatan) break;
      }

      if (jabatan) {
        setSelectedSignatory(current => current?.lookupKey === lookupKey ? { ...current, jabatan } : current);
      } else if (!existingJabatan) {
        setSignatoryError('Jabatan pegawai tidak ditemukan pada API TND.');
      }
    } catch (error) {
      setSignatoryError(error.message || 'Gagal mengambil jabatan pegawai dari API TND.');
    } finally {
      setSignatoryLoading(false);
    }
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
        const users = Array.isArray(response.data) ? response.data : [];
        if (active) {
          setSignatoryUsers(users);
        }
      } catch (error) {
        if (active) {
          const fallbackUsers = Array.isArray(error.data?.data) ? error.data.data : [];
          setSignatoryUsers(fallbackUsers);
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

  const exportPdf = async (signatory = null) => {
    setExportError('');
    setIsExporting(true);
    const fileName = `Rekap_Tiket_Helpdesk_${startDate}_${endDate}${signatory ? '_Ditandatangani' : ''}`;
    const generatedAt = new Date();
    const rangeLabel = `${formatDate(start)} - ${formatDate(end)}`;
    const printedAt = generatedAt.toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    const printedDate = generatedAt.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    const pageWidth = 210;
    const pageHeight = 297;
    const left = 13;
    const right = pageWidth - left;
    const blue = [23, 79, 134];
    const muted = [100, 123, 147];
    const loadImage = async (url) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Gagal memuat logo laporan.');
      const imageBlob = await response.blob();
      const imageUrl = URL.createObjectURL(imageBlob);
      try {
        const image = new Image();
        image.src = imageUrl;
        await image.decode();
        const scale = Math.min(1, 500 / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Gagal menyiapkan logo laporan.');
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/png');
      } finally {
        URL.revokeObjectURL(imageUrl);
      }
    };

    try {
      const [{ jsPDF }, { default: autoTable }] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable')
      ]);
      const [cityLogo, agencyLogo] = await Promise.all([
        loadImage(`${window.location.origin}/bogor.png`),
        loadImage(`${window.location.origin}/kominfo.png`)
      ]);
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      doc.setProperties({ title: fileName, subject: 'Laporan Rekapitulasi Tiket Helpdesk' });
      doc.setTextColor(23, 43, 77);

      doc.addImage(cityLogo, 'PNG', left, 8, 19, 22);
      doc.addImage(agencyLogo, 'PNG', right - 30, 8, 30, 22);
      doc.setTextColor(...muted);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.text('PEMERINTAH DAERAH', pageWidth / 2, 13, { align: 'center' });
      doc.setTextColor(...blue);
      doc.setFontSize(13);
      doc.text('PEMERINTAH KOTA BOGOR', pageWidth / 2, 19, { align: 'center' });
      doc.setFontSize(8.5);
      doc.text('DINAS KOMUNIKASI DAN INFORMATIKA', pageWidth / 2, 24, { align: 'center' });
      doc.setTextColor(...muted);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.text('Jl. Ir. H. Juanda No. 10, Bogor Tengah, Kota Bogor - Jawa Barat 16121', pageWidth / 2, 29, { align: 'center' });
      doc.setDrawColor(...blue);
      doc.setLineWidth(0.7);
      doc.line(left, 34, right, 34);

      doc.setTextColor(...muted);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('SISTEM LAYANAN HELPDESK DISKOMINFO', pageWidth / 2, 43, { align: 'center' });
      doc.setTextColor(...blue);
      doc.setFontSize(19);
      doc.text('REKAPITULASI TIKET', pageWidth / 2, 51, { align: 'center' });
      doc.setTextColor(82, 107, 134);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text('Dinas Komunikasi dan Informatika Pemerintah Kota Bogor', pageWidth / 2, 57, { align: 'center' });
      doc.setFillColor(240, 246, 252);
      doc.roundedRect(42, 61, 126, 8, 2, 2, 'F');
      doc.setTextColor(35, 77, 120);
      doc.setFontSize(8);
      doc.text(`Periode: ${rangeLabel}  |  Dicetak: ${printedAt}`, pageWidth / 2, 66.2, { align: 'center' });

      const drawSectionHeading = (text, y) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(23, 63, 106);
        doc.text(text, left, y);
        const textWidth = doc.getTextWidth(text);
        doc.setDrawColor(215, 227, 239);
        doc.setLineWidth(0.3);
        doc.line(left + textWidth + 3, y - 1, right, y - 1);
      };
      drawSectionHeading('Ringkasan Tiket', 78);

      const cards = [
        { label: 'TOTAL TIKET', count: filteredTickets.length, color: [40, 116, 184], fill: [248, 251, 255] },
        { label: 'DITOLAK', count: summary.Ditolak, color: [217, 83, 79], fill: [255, 250, 250] },
        { label: 'SELESAI', count: summary.Selesai, color: [26, 155, 114], fill: [247, 252, 250] },
        { label: 'DIPROSES', count: summary.Diproses, color: [217, 154, 34], fill: [255, 253, 247] }
      ];
      const cardGap = 3;
      const cardWidth = (right - left - cardGap * 3) / cards.length;
      cards.forEach((card, index) => {
        const x = left + index * (cardWidth + cardGap);
        doc.setFillColor(...card.fill);
        doc.setDrawColor(214, 227, 239);
        doc.roundedRect(x, 82, cardWidth, 20, 1.5, 1.5, 'FD');
        doc.setFillColor(...card.color);
        doc.rect(x, 82, cardWidth, 1.3, 'F');
        doc.setTextColor(...muted);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.text(card.label, x + 3, 89);
        doc.setTextColor(...card.color);
        doc.setFontSize(16);
        doc.text(String(card.count), x + 3, 98);
      });

      drawSectionHeading('Rincian Tiket', 111);
      const tableRows = filteredTickets.length
        ? filteredTickets.map((ticket, index) => [
          String(index + 1),
          String(ticket.ticket_number || ticket.id || '-'),
          String(ticket.pemohon || '-'),
          String(ticket.service_name || '-'),
          formatWorkDuration(ticket),
          getTicketStatus(ticket),
          new Date(ticket.created_at).toLocaleDateString('id-ID')
        ])
        : [[{ content: 'Tidak ada tiket pada rentang tanggal ini.', colSpan: 7, styles: { halign: 'center' } }]];
      const signatureX = right - 66;
      const signatureCenter = signatureX + 33;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      const departmentLines = signatory
        ? doc.splitTextToSize('Dinas Komunikasi & Informatika Kota Bogor', 66)
        : [];
      const nameLines = signatory ? doc.splitTextToSize(String(signatory.name || ''), 66) : [];
      const signatureNameOffset = 12 + departmentLines.length * 4 + 20;
      const positionOffset = signatureNameOffset + nameLines.length * 4;
      const nipOffset = positionOffset + 4;
      const signatureBlockHeight = signatory ? nipOffset + 5 : 39;
      const tableBottomMargin = signatureBlockHeight + 8 + 18;
      let lastDrawnBodyRow = -1;

      autoTable(doc, {
        head: [['No.', 'No. Tiket', 'Pemohon', 'Layanan', 'Waktu SLA', 'Status', 'Tanggal']],
        body: tableRows,
        startY: 115,
        margin: { left, right: pageWidth - right, top: 14, bottom: 18 },
        tableWidth: right - left,
        showHead: 'everyPage',
        rowPageBreak: 'avoid',
        theme: 'grid',
        styles: {
          font: 'helvetica',
          fontSize: 9,
          cellPadding: { top: 2, right: 1.5, bottom: 2, left: 1.5 },
          textColor: [51, 75, 101],
          lineColor: [214, 224, 235],
          lineWidth: 0.15,
          overflow: 'linebreak',
          valign: 'middle'
        },
        headStyles: {
          fillColor: blue,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9,
          halign: 'center'
        },
        alternateRowStyles: { fillColor: [246, 249, 252] },
        columnStyles: {
          0: { cellWidth: 8, halign: 'center' },
          1: { cellWidth: 32, halign: 'center' },
          2: { cellWidth: 36 },
          3: { cellWidth: 39 },
          4: { cellWidth: 26, halign: 'center' },
          5: { cellWidth: 21, halign: 'center' },
          6: { cellWidth: 22, halign: 'center' }
        },
        didParseCell: (data) => {
          if (data.section !== 'body' || data.column.index !== 5) return;
          if (data.cell.raw === 'Selesai') {
            data.cell.styles.fillColor = [231, 247, 241];
            data.cell.styles.textColor = [19, 124, 92];
          } else if (data.cell.raw === 'Diproses') {
            data.cell.styles.fillColor = [255, 244, 220];
            data.cell.styles.textColor = [152, 100, 11];
          } else {
            data.cell.styles.fillColor = [255, 240, 240];
            data.cell.styles.textColor = [185, 56, 56];
          }
          data.cell.styles.fontStyle = 'bold';
        },
        willDrawPage: (data) => {
          const remainingRowsHeight = data.table.body
            .slice(lastDrawnBodyRow + 1)
            .reduce((height, row) => height + row.height, 0);
          const headerHeight = data.table.head.reduce((height, row) => height + row.height, 0);
          const availableHeight = pageHeight - (data.cursor?.y || 0) - headerHeight;
          data.settings.margin.bottom = remainingRowsHeight <= availableHeight - tableBottomMargin
            ? tableBottomMargin
            : 18;
        },
        didDrawCell: (data) => {
          if (data.section === 'body') {
            lastDrawnBodyRow = Math.max(lastDrawnBodyRow, data.row.index);
          }
        }
      });

      let closingY = doc.lastAutoTable.finalY + 8;
      const closingBottom = closingY + signatureBlockHeight;
      if (closingBottom > pageHeight - 18) {
        doc.addPage();
        closingY = 18;
      }
      const signatureNameY = closingY + signatureNameOffset;

      doc.setDrawColor(224, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(left, closingY, right, closingY);
      doc.setDrawColor(40, 116, 184);
      doc.setLineWidth(0.7);
      doc.line(left, closingY + 8, left, closingY + 17);
      doc.setTextColor(...blue);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(['Kolaborasi Menuju', 'Bogor Digital'], left + 3, closingY + 11);

      if (signatory) {
        doc.setTextColor(54, 87, 117);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.text(`Bogor, ${printedDate}`, signatureCenter, closingY + 7, { align: 'center' });
        doc.text(departmentLines, signatureCenter, closingY + 12, { align: 'center' });
        doc.setTextColor(23, 43, 77);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(nameLines, signatureCenter, signatureNameY, { align: 'center' });
        nameLines.forEach((line, index) => {
          const lineY = signatureNameY + index * 4 + 0.8;
          const lineWidth = doc.getTextWidth(line);
          doc.setDrawColor(23, 43, 77);
          doc.setLineWidth(0.25);
          doc.line(signatureCenter - lineWidth / 2, lineY, signatureCenter + lineWidth / 2, lineY);
        });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(String(signatory.position || '-'), signatureCenter, closingY + positionOffset, { align: 'center' });
        doc.text(`NIP. ${signatory.nip || '-'}`, signatureCenter, closingY + nipOffset, { align: 'center' });
      } else {
        doc.setTextColor(54, 87, 117);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.text(['Dinas Komunikasi dan Informatika', 'Pemerintah Kota Bogor'], signatureX + 33, closingY + 7, { align: 'center' });
        doc.setTextColor(23, 43, 77);
        doc.setFont('helvetica', 'bold');
        doc.text('Petugas / Penanggung Jawab', signatureX + 33, closingY + 36, { align: 'center' });
      }

      const pageCount = doc.getNumberOfPages();
      for (let page = 1; page <= pageCount; page += 1) {
        doc.setPage(page);
        const footerY = pageHeight - 9;
        doc.setDrawColor(...blue);
        doc.setLineWidth(0.6);
        doc.line(left, pageHeight - 14, right, pageHeight - 14);
        doc.setTextColor(...blue);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.text('DISKOMINFO KOTA BOGOR', left, footerY);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...muted);
        doc.text('Laporan Rekapitulasi Tiket Helpdesk', left + 36, footerY);
        doc.text(`Dicetak: ${printedAt}  |  Halaman ${page}/${pageCount}`, right, footerY, { align: 'right' });
      }

      setPreviewPdfName(`${fileName}.pdf`);
      setPreviewPdfUrl(URL.createObjectURL(doc.output('blob')));
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Gagal membuat PDF rekap tiket.');
    } finally {
      setIsExporting(false);
    }
  };

  const matchingSignatoryUsers = signatoryUsers.filter(user => {
    const query = signatorySearchQuery.trim().toLocaleLowerCase('id-ID');
    const name = user.name || user.full_name || '';
    const nip = String(user.nip || '');
    const jabatan = String(user.jabatan || user.position || user.job_title || '');
    const username = String(user.username || user.email || '');
    return !query || [name, nip, jabatan, username].some(value =>
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
              disabled={!validRange || loading || isExporting}
              aria-expanded={isExportMenuOpen}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-4 w-4" /> {isExporting ? 'Menyiapkan PDF...' : 'Export PDF'} <ChevronDown className="h-4 w-4" />
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
                  Pratinjau PDF
                  <span className="mt-0.5 block text-xs font-normal text-slate-500">Tinjau sebelum mengunduh</span>
                </button>
                <button
                  type="button"
                  onClick={openSignatoryDialog}
                  className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Pratinjau dengan penandatangan
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
      <p className="text-xs text-slate-500">Periksa pratinjau terlebih dahulu, lalu unduh PDF dengan nama otomatis.</p>

      {isSignatoryDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <form
            onSubmit={event => {
              event.preventDefault();
              if (!selectedSignatory?.name) return;
              exportPdf({
                name: selectedSignatory.name,
                nip: selectedSignatory.nip || '-',
                position: selectedSignatory.jabatan || '-'
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
                  disabled={signatoryLoading}
                  onClick={() => {
                    setSelectedSignatory(null);
                    setSignatorySearchQuery('');
                    setIsSignatorySearchOpen(true);
                  }}
                  className="shrink-0 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-sky-700 hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-50"
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
                        setIsSignatoryTndSearchRequested(event.target.value.trim().length >= 3);
                        setIsSignatorySearchOpen(true);
                        setSignatoryError('');
                      }}
                      onFocus={() => setIsSignatorySearchOpen(true)}
                      placeholder="Ketik nama, username/email, NIP, atau jabatan"
                      className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm font-medium normal-case tracking-normal text-slate-800 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                  <span className="block text-[11px] font-medium normal-case tracking-normal text-slate-500">
                    Cari nama, username/email, atau NIP akun. Pencarian TND otomatis dimulai dari 3 karakter.
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
                      const username = String(user.username || user.email || '');
                      return (
                        <button
                          key={user.id || `${user.source}-${user.email || nip}`}
                          type="button"
                          disabled={!name}
                          onClick={() => selectSignatory(user)}
                          className="flex w-full items-center justify-between gap-3 p-3 text-left transition-colors hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <span className="min-w-0">
                            <span className="flex flex-wrap items-center gap-2">
                              <span className="truncate text-sm font-extrabold text-slate-900">{name || 'Nama tidak tersedia'}</span>
                              {nip && <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-600">NIP: {nip}</span>}
                              {user.source === 'TND' && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">TND</span>}
                            </span>
                            <span className="mt-1 block truncate text-xs font-medium text-slate-500">Jabatan: {jabatan || 'Tidak tersedia dari API'}</span>
                            {username && <span className="mt-0.5 block truncate text-xs font-medium text-slate-400">{username}</span>}
                          </span>
                          <span className="shrink-0 rounded-lg bg-sky-50 px-2.5 py-1.5 text-xs font-bold text-sky-700">
                            {name ? 'Pilih' : 'Data kurang'}
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

            {selectedSignatory && (
              <div className="space-y-2">
                {signatoryLoading && (
                  <p aria-live="polite" className="text-xs font-medium text-sky-700">
                    Mengambil jabatan dari API TND...
                  </p>
                )}
                {signatoryError && (
                  <p role="alert" className="text-xs font-medium text-rose-700">
                    {signatoryError}
                  </p>
                )}
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block space-y-1.5 text-xs font-bold uppercase tracking-wide text-slate-600">
                    NIP
                    <input
                      value={selectedSignatory.nip || ''}
                      onChange={event => {
                        const value = event.target.value;
                        setSelectedSignatory(current => ({
                          ...current,
                          nip: value
                        }));
                      }}
                      maxLength={50}
                      placeholder="Isi NIP pegawai"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold normal-case tracking-normal text-slate-800 placeholder:font-normal"
                    />
                  </label>
                  <label className="block space-y-1.5 text-xs font-bold uppercase tracking-wide text-slate-600">
                    Jabatan
                    <input
                      value={selectedSignatory.jabatan || ''}
                      onChange={event => {
                        const value = event.target.value;
                        setSelectedSignatory(current => ({
                          ...current,
                          jabatan: value
                        }));
                        if (value.trim()) setSignatoryError('');
                      }}
                      maxLength={150}
                      placeholder={signatoryLoading ? 'Mengambil jabatan dari API TND...' : 'Isi jabatan pegawai'}
                      disabled={signatoryLoading}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold normal-case tracking-normal text-slate-800 placeholder:font-normal"
                    />
                  </label>
                </div>
              </div>
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
                disabled={signatoryLoading || !selectedSignatory?.name}
                className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Pratinjau PDF
              </button>
            </div>
          </form>
        </div>
      )}

      {previewPdfUrl && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/70 p-3 backdrop-blur-sm sm:p-6">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="ticket-recap-preview-title"
            className="flex h-[calc(100vh-1.5rem)] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:h-[calc(100vh-3rem)]"
          >
            <header className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-3 sm:px-6">
              <div className="min-w-0">
                <h3 id="ticket-recap-preview-title" className="text-base font-black text-slate-900">Pratinjau Rekap Tiket</h3>
                <p className="truncate text-xs text-slate-500">{previewPdfName}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPreviewPdfUrl('');
                  setPreviewPdfName('');
                }}
                aria-label="Tutup pratinjau"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </header>
            <iframe title="Pratinjau PDF rekap tiket" src={previewPdfUrl} className="min-h-0 w-full flex-1 bg-slate-200" />
            <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 sm:px-6">
              <p className="text-xs text-slate-500">Nama file akan digunakan otomatis saat diunduh.</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPreviewPdfUrl('');
                    setPreviewPdfName('');
                  }}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  Tutup
                </button>
                <a
                  href={previewPdfUrl}
                  download={previewPdfName}
                  className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-bold text-white hover:bg-sky-700"
                >
                  Unduh PDF
                </a>
              </div>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
};
