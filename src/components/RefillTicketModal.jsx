import React, { useState, useRef, useEffect } from 'react';
import { X, FileText, Upload, AlertCircle, FileCheck, Clock, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getCurrentLogTimeFormatted } from '../utils/dateUtils';
import { SopModal } from './SopModal';

export const RefillTicketModal = ({ isOpen, onClose, ticket, onSave }) => {
  const { services } = useAuth();
  if (!isOpen || !ticket) return null;

  const subServiceName = ticket.requestType || ticket.service || '';
  const srv = (services || []).find(s => s.name === subServiceName);
  const reqDocs = srv?.requiredDocs || ticket.requiredDocs || 'Surat Permohonan Resmi OPD, KAK / Dokumen Pendukung';
  const sopFile = srv?.sop || ticket.sop || 'sop-layanan.pdf';
  const slaText = srv?.sla || (ticket.slaDuration ? `${ticket.slaDuration} Hari` : '7 Hari');

  const [title, setTitle] = useState(ticket.title || '');
  const [description, setDescription] = useState(ticket.desc || ticket.description || '');
  const [appName, setAppName] = useState(ticket.appName || '');
  const [targetUsers, setTargetUsers] = useState(ticket.targetUsers || '');
  const [callbackUrl, setCallbackUrl] = useState(ticket.callbackUrl || '');
  const [targetIp, setTargetIp] = useState(ticket.targetIp || '');
  const [revisionNote, setRevisionNote] = useState('');
  
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [fileUrl, setFileUrl] = useState(ticket.fileUrl || '/dokumen_permohonan.pdf');
  const [showSopModal, setShowSopModal] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (ticket) {
      setTitle(ticket.title || '');
      setDescription(ticket.desc || ticket.description || '');
      setAppName(ticket.appName || '');
      setTargetUsers(ticket.targetUsers || '');
      setCallbackUrl(ticket.callbackUrl || '');
      setTargetIp(ticket.targetIp || '');
      setRevisionNote('');
      setFileName('');
      setFileSize('');
      setFileUrl(ticket.fileUrl || '/dokumen_permohonan.pdf');
    }
  }, [ticket]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setFileSize((file.size / 1024).toFixed(1) + ' KB');
      try {
        const url = URL.createObjectURL(file);
        setFileUrl(url);
      } catch (err) {
        setFileUrl('/dokumen_permohonan.pdf');
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      alert('Harap lengkapi judul dan deskripsi permohonan!');
      return;
    }

    if (subServiceName === 'Pembuatan Aplikasi Baru (Web/Mobile)') {
      if (!appName.trim() || !targetUsers.trim()) {
        alert('Harap lengkapi nama aplikasi dan target pengguna!');
        return;
      }
    } else if (subServiceName === 'Integrasi Single Sign-On (SSO) TND') {
      if (!appName.trim() || !callbackUrl.trim()) {
        alert('Harap lengkapi nama platform dan callback URL!');
        return;
      }
    } else if (subServiceName === 'Uji Celah Keamanan (Vulnerability Assessment)') {
      if (!appName.trim() || !targetIp.trim()) {
        alert('Harap lengkapi domain / nama aplikasi dan alamat IP server!');
        return;
      }
    }

    const note = revisionNote.trim();
    const logMessage = `Pemohon telah mengisi ulang formulir permohonan dan mengajukan kembali ke Helpdesk.${note ? ` Catatan Perbaikan: ${note}` : ''}${fileName ? ` (Lampiran: ${fileName})` : ''}`;

    const newFiles = fileName 
      ? [fileName]
      : (ticket.files && ticket.files.length > 0 ? [ticket.files[0]] : ['Dokumen_Persyaratan_Layanan.pdf']);

    const updatedTicket = {
      ...ticket,
      title: title.trim(),
      desc: description.trim(),
      description: description.trim(),
      appName: appName.trim(),
      targetUsers: targetUsers.trim(),
      callbackUrl: callbackUrl.trim(),
      targetIp: targetIp.trim(),
      files: newFiles,
      fileUrl: fileUrl,
      revisionNote: note || ticket.revisionNote || '',
      status: 'Verifikasi',
      logs: [
        {
          date: getCurrentLogTimeFormatted(0),
          text: logMessage
        },
        ...(ticket.logs || [])
      ]
    };

    onSave(updatedTicket);
    alert('Formulir permohonan berhasil diperbarui dan diajukan kembali ke Helpdesk! Status tiket kini kembali ke tahap Verifikasi.');
    onClose();
  };

  const pendingLog = ticket.logs?.find(l => 
    l.text.toLowerCase().includes('helpdesk') || 
    l.text.toLowerCase().includes('ditangguhkan') || 
    l.text.toLowerCase().includes('alasan:')
  ) || ticket.logs?.[0];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200 font-sans">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 shadow-2xs">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
                Formulir Pengajuan Layanan
              </h3>
              <p className="text-xs text-slate-500 font-bold mt-0.5 truncate">
                {ticket.id} • {subServiceName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl hover:bg-slate-200/70 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {pendingLog && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1">
              <div className="flex items-center gap-1.5 text-slate-700 font-bold uppercase tracking-wider">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Catatan Penangguhan dari Helpdesk:</span>
              </div>
              <p className="text-slate-600 italic font-medium leading-relaxed pl-5.5">
                "{pendingLog.text}"
              </p>
            </div>
          )}

          <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-50/70 via-indigo-50/40 to-slate-50 border border-sky-200 space-y-2.5 text-left">
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                <FileText className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-black text-amber-850 uppercase tracking-wider block">Dokumen yang Harus Disiapkan Pemohon:</span>
                <p className="text-sm font-bold text-slate-800 mt-0.5 leading-relaxed">{reqDocs}</p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 pt-2.5 border-t border-sky-100 flex-wrap text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-sky-600 shrink-0" />
                  <span className="font-extrabold text-slate-700">SOP Pelayanan:</span>
                  <button
                    type="button"
                    onClick={() => setShowSopModal(true)}
                    className="font-mono font-bold text-sky-700 hover:text-sky-800 bg-white hover:bg-sky-50 px-2 py-0.5 rounded border border-sky-200 hover:border-sky-300 transition-all cursor-pointer inline-flex items-center gap-1.5"
                    title="Klik untuk melihat dokumen SOP"
                  >
                    <span>{sopFile}</span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSopModal(true)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer ml-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Lihat Dokumen SOP</span>
                </button>
              </div>
              <span className="font-bold text-slate-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Target Waktu SLA: <strong className="text-slate-800">{slaText}</strong>
              </span>
            </div>
          </div>

          {subServiceName === 'Pembuatan Aplikasi Baru (Web/Mobile)' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nama Aplikasi yang Diajukan</label>
                <input
                  type="text"
                  required
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  placeholder="Contoh: Aplikasi Sistem Pengawasan Lalu Lintas (Si-Walan)"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-base focus:outline-none focus:ring-1 focus:ring-sky-500 font-semibold text-slate-800"
                />
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Target Pengguna Utama</label>
                <input
                  type="text"
                  required
                  value={targetUsers}
                  onChange={(e) => setTargetUsers(e.target.value)}
                  placeholder="Contoh: Staf Dinas, Warga Umum"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-base focus:outline-none focus:ring-1 focus:ring-sky-500 font-semibold text-slate-800"
                />
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Estimasi Waktu SLA</label>
                <div className="px-4 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-base font-bold text-slate-700 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-sky-600" />
                  <span>SLA Standar: {ticket.slaDuration || 7} Hari</span>
                </div>
              </div>
            </div>
          ) : subServiceName === 'Integrasi Single Sign-On (SSO) TND' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nama Platform Aplikasi</label>
                <input
                  type="text"
                  required
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  placeholder="Contoh: E-Kinerja Dinas"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-base focus:outline-none focus:ring-1 focus:ring-sky-500 font-semibold text-slate-800"
                />
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Callback URL Integrasi</label>
                <input
                  type="text"
                  required
                  value={callbackUrl}
                  onChange={(e) => setCallbackUrl(e.target.value)}
                  placeholder="Contoh: https://ekinerja.bogor.go.id/sso/callback"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-base focus:outline-none focus:ring-1 focus:ring-sky-500 font-semibold text-slate-800"
                />
              </div>
            </div>
          ) : subServiceName === 'Uji Celah Keamanan (Vulnerability Assessment)' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Domain / Nama Aplikasi Uji</label>
                <input
                  type="text"
                  required
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  placeholder="Contoh: https://esir.bogor.go.id"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-base focus:outline-none focus:ring-1 focus:ring-sky-500 font-semibold text-slate-800"
                />
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Alamat IP Server</label>
                <input
                  type="text"
                  required
                  value={targetIp}
                  onChange={(e) => setTargetIp(e.target.value)}
                  placeholder="Contoh: 103.14.22.45"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-base focus:outline-none focus:ring-1 focus:ring-sky-500 font-semibold text-slate-800"
                />
              </div>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
              Judul Ringkas Permohonan
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Pengajuan integrasi SSO akun dinas untuk aplikasi SIMPATIK"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-base focus:outline-none focus:ring-1 focus:ring-sky-500 font-semibold text-slate-800"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
              Deskripsi Kebutuhan Detail
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan kebutuhan teknis layanan secara detail..."
              className="w-full px-4 py-3 border border-slate-300 rounded-xl text-base focus:outline-none focus:ring-1 focus:ring-sky-500 font-semibold text-slate-800 resize-none leading-relaxed"
            />
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
              Unggah Dokumen Persyaratan (.PDF)
            </label>
            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 hover:border-sky-500 rounded-2xl p-6 text-center space-y-3 bg-slate-50/50 hover:bg-slate-50 transition-all cursor-pointer group"
            >
              <Upload className="w-8 h-8 text-slate-400 group-hover:text-sky-600 transition-colors mx-auto" />
              <div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-bold shadow-xs transition-all cursor-pointer"
                >
                  Pilih Dokumen PDF
                </button>
                <p className="text-xs text-slate-400 mt-2">Maksimal ukuran file 10MB. Format dokumen resmi PDF.</p>
              </div>
              {fileName ? (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800"
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="truncate">{fileName} ({fileSize || 'Valid PDF'})</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={fileUrl || '/dokumen_permohonan.pdf'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 bg-white border border-emerald-300 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-all"
                    >
                      Buka PDF
                    </a>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-slate-500 hover:text-slate-700 underline text-[11px] cursor-pointer"
                    >
                      Ganti
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFileName('');
                        setFileSize('');
                        setFileUrl(ticket.fileUrl || '/dokumen_permohonan.pdf');
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="text-rose-500 hover:text-rose-700 underline text-[11px] cursor-pointer"
                    >
                      Batal Ganti
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center justify-between p-3 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                    <span className="truncate">Dokumen sebelumnya: {ticket.files?.[0] || 'Dokumen_Persyaratan_Layanan.pdf'}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={fileUrl || '/dokumen_permohonan.pdf'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-200 transition-all"
                    >
                      Buka PDF
                    </a>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-sky-600 hover:text-sky-700 underline text-[11px] cursor-pointer"
                    >
                      Ganti
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Catatan Perbaikan
              </label>
              <span className="text-[11px] font-semibold text-slate-400">Opsional</span>
            </div>
            <textarea
              rows={3}
              value={revisionNote}
              onChange={(e) => setRevisionNote(e.target.value)}
              placeholder="Tuliskan catatan atau penjelasan perbaikan untuk Helpdesk (opsional)..."
              className="w-full px-4 py-3 border border-slate-300 rounded-xl text-base focus:outline-none focus:ring-1 focus:ring-sky-500 font-semibold text-slate-800 resize-none leading-relaxed"
            />
          </div>

          <div className="flex gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-bold transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 py-3.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-base font-extrabold text-white shadow-md shadow-sky-500/10 hover:shadow-lg hover:shadow-sky-500/15 transition-all flex items-center justify-center cursor-pointer"
            >
              Kirim Permohonan
            </button>
          </div>
        </form>

        <SopModal
          isOpen={showSopModal}
          onClose={() => setShowSopModal(false)}
          serviceName={subServiceName}
          sopFileName={sopFile}
          fileUrl="/sop_layanan.pdf"
        />
      </div>
    </div>
  );
};
