import React, { useState, useRef, useEffect } from 'react';
import { X, FileText, Upload, AlertCircle, FileCheck, Clock, Eye, Download } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getCurrentLogTimeFormatted } from '../utils/dateUtils';
import { SopModal } from './SopModal';
import { ActionModal } from './ActionModal';

export const RefillTicketModal = ({ isOpen, onClose, ticket, onSave }) => {
  const { services } = useAuth();
  if (!isOpen || !ticket) return null;

  const subServiceName = (ticket.requestType && ticket.requestType !== 'Baru') ? ticket.requestType : (ticket.service || '');
  const srv = (services || []).find(s => s.name === subServiceName);
  const reqDocs = srv?.requiredDocs || ticket.required_docs || ticket.requiredDocs || 'Surat Permohonan Resmi OPD, KAK / Dokumen Pendukung';
  const sopFile = srv?.sop || ticket.sop || 'sop-layanan.pdf';
  const slaText = srv?.sla || (ticket.slaDuration ? `${ticket.slaDuration} Hari` : '7 Hari');

  const [formData, setFormData] = useState(ticket?.form_data || {});
  const [showSopModal, setShowSopModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    if (ticket) {
      setFormData(ticket.form_data || {});
    }
  }, [ticket]);

  const handlePreSubmit = (e) => {
    e.preventDefault();
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = () => {
    setShowConfirmModal(false);

    const logMessage = `Pemohon telah memperbaiki dan mengajukan ulang formulir permohonan ke Helpdesk.`;

    const updatedTicket = {
      ...ticket,
      title: formData['Judul Permohonan'] || formData['Nama Fitur'] || ticket.title,
      desc: formData['Deskripsi Kebutuhan'] || formData['Deskripsi'] || ticket.desc || ticket.description,
      form_data: formData,
      files: ticket.files || [],
      fileUrl: ticket.fileUrl || '',
      revisionNote: ticket.revisionNote || '',
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
    setShowSuccessModal(true);
  };

  const handleFinishSuccess = () => {
    setShowSuccessModal(false);
    onClose();
  };

  const pendingLog = ticket.logs?.find(l => 
    l.text.toLowerCase().includes('helpdesk') || 
    l.text.toLowerCase().includes('ditangguhkan') || 
    l.text.toLowerCase().includes('alasan:')
  ) || ticket.logs?.[0];

  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-hidden animate-in fade-in duration-200 font-sans">
      <div 
        className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-left max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100 bg-slate-50/90 shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xl font-black text-slate-900 tracking-tight leading-tight">
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

        <form onSubmit={handlePreSubmit} className="p-6 sm:p-7 space-y-6 max-h-[75vh] overflow-y-auto">
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
                <div className="text-sm font-bold text-slate-800 mt-0.5 leading-relaxed">
                  {reqDocs?.startsWith?.('data:') ? (
                    <a href={reqDocs} download="Template_Persyaratan.pdf" className="inline-flex items-center gap-1.5 text-sky-600 hover:text-sky-700 bg-white border border-sky-200 px-3 py-1 rounded-lg">
                      <Download className="w-4 h-4" />
                      Unduh Template Dokumen
                    </a>
                  ) : (
                    reqDocs
                  )}
                </div>
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

          {(() => {
            let schema = srv?.form_schema || [];
            
            if (typeof schema === 'string') {
              try { schema = JSON.parse(schema); } catch (e) { schema = []; }
            }
            if (!Array.isArray(schema)) schema = [];

            if (schema.length === 0) {
              return (
                <div className="p-6 bg-slate-50 border border-slate-200 border-dashed rounded-2xl text-center text-slate-500 font-medium text-sm">
                  Tidak ada detail form kustom yang dikonfigurasi.
                </div>
              );
            }

            const renderField = (field) => {
              if (field.type === 'group') {
                return (
                  <div key={field.id || field.name} className="border border-slate-200 bg-slate-50/70 p-4 rounded-xl space-y-4 shadow-sm">
                    <label className="block text-sm font-black text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-2">{field.label}</label>
                    <div className="pl-3 border-l-2 border-sky-300 space-y-4 pt-1">
                      {(field.subFields || []).map(sub => renderField(sub))}
                    </div>
                  </div>
                );
              }

              const fieldKey = field.label || field.name;

              if (field.type === 'file') {
                return (
                  <div key={field.id || fieldKey} className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {field.label} {field.required !== false && <span className="text-red-500">*</span>}
                    </label>
                    <div className="border-2 border-dashed border-slate-200 hover:border-sky-500 rounded-2xl p-4 text-center bg-slate-50 transition-all">
                      <input
                        type="file"
                        accept=".pdf,image/*"
                        required={field.required !== false && !formData[fieldKey]}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                             const reader = new FileReader();
                             reader.onload = (ev) => {
                               setFormData({...formData, [fieldKey]: ev.target.result, [`${fieldKey}_name`]: file.name});
                             };
                             reader.readAsDataURL(file);
                          }
                        }}
                        className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 cursor-pointer"
                      />
                      {formData[`${fieldKey}_name`] && (
                        <p className="mt-3 text-xs font-bold text-emerald-600 bg-emerald-50 py-1.5 px-3 rounded-lg inline-block border border-emerald-100">
                          ✓ File terpilih: {formData[`${fieldKey}_name`]}
                        </p>
                      )}
                    </div>
                  </div>
                );
              }

              return (
                <div key={field.id || fieldKey} className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {field.label} {field.required !== false && <span className="text-red-500">*</span>}
                  </label>
                  {field.type === 'select' ? (
                    <select
                      required={field.required !== false}
                      value={formData[fieldKey] || ''}
                      onChange={(e) => setFormData({...formData, [fieldKey]: e.target.value})}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-semibold bg-white transition-all"
                    >
                      <option value="">-- Pilih --</option>
                      {(field.options || []).map((opt, i) => (
                        <option key={i} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : field.type === 'textarea' ? (
                    <textarea
                      required={field.required !== false}
                      rows={4}
                      value={formData[fieldKey] || ''}
                      onChange={(e) => setFormData({...formData, [fieldKey]: e.target.value})}
                      placeholder={field.placeholder || ''}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-semibold transition-all"
                    />
                  ) : (
                    <input
                      type={field.type || 'text'}
                      required={field.required !== false}
                      value={formData[fieldKey] || ''}
                      onChange={(e) => setFormData({...formData, [fieldKey]: e.target.value})}
                      placeholder={field.placeholder || ''}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-semibold transition-all"
                    />
                  )}
                </div>
              );
            };

            return (
              <div className="space-y-4">
                {schema.map(f => renderField(f))}
              </div>
            );
          })()}

          {/* Dynamic form ends here */}

          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm sm:text-base font-bold transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-5 rounded-xl bg-sky-600 hover:bg-sky-700 text-sm sm:text-base font-bold text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center cursor-pointer"
            >
              Kirim Permohonan
            </button>
          </div>
        </form>

        <SopModal
          isOpen={showSopModal}
          onClose={() => setShowSopModal(false)}
          serviceName={subServiceName}
          sopFileName={sopFile?.startsWith?.('data:') ? 'SOP_Document.pdf' : sopFile}
          fileUrl={sopFile}
        />

        <ActionModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          type="confirm"
          title="Konfirmasi Pengajuan Perbaikan"
          message="Apakah seluruh berkas dan rincian formulir perbaikan sudah lengkap dan sesuai untuk diajukan kembali ke Helpdesk?"
          confirmText="Ya, Ajukan Perbaikan"
          cancelText="Periksa Kembali"
          onConfirm={handleConfirmSubmit}
        />

        <ActionModal
          isOpen={showSuccessModal}
          onClose={handleFinishSuccess}
          type="success"
          title="Perbaikan Berhasil Diajukan"
          message="Formulir permohonan berhasil diperbarui dan dialihkan kembali ke Helpdesk. Status tiket kini berada pada tahap Verifikasi."
          confirmText="Selesai & Kembali"
          onConfirm={handleFinishSuccess}
        />
      </div>
    </div>
  );
};
