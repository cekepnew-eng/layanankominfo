import React from 'react';
import { X, FileText, Download, ExternalLink, Clock, ShieldCheck, CheckCircle2, AlertTriangle, FileCheck, Building, Tag, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { parseFileValue } from '../utils/fileUtils';

export const TicketDetailModal = ({ isOpen, onClose, ticket, onBagiTugas }) => {
  const { user, services } = useAuth();
  if (!isOpen || !ticket) return null;

  const formData = ticket.form_data || {};
  const actualDocUrl = ticket.fileUrl || formData['Berkas_Persyaratan'] || formData['_uploadedFile'];
  const fileName = (ticket.files && ticket.files.length > 0) ? ticket.files[0] : formData['Nama_File_Persyaratan'] || formData['_uploadedFileName'];
  const isDefaultDoc = actualDocUrl === '/dokumen_permohonan.pdf';
  const hasUploadedDoc = (!!actualDocUrl && !isDefaultDoc) || (!!fileName && fileName.trim() !== '' && fileName !== 'Dokumen_Persyaratan_Layanan.pdf');
  const docUrl = actualDocUrl || '';
  const bastUrl = ticket.bastFileUrl || '';
  const sopUrl = '/sop_layanan.pdf';

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <div 
      className="fixed inset-0 z-[80] bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-x-hidden overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-full sm:max-w-3xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-left max-h-[90vh] sm:max-h-[92vh] flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 sm:px-7 py-3.5 sm:py-5 border-b border-slate-100 bg-slate-50/90 shrink-0">
          <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-xl font-black text-slate-900 tracking-tight leading-tight truncate">
                Formulir Pengajuan Layanan
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 font-bold mt-0.5 truncate">
                {ticket.id} • {ticket.date}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl hover:bg-slate-200/70 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-all cursor-pointer shrink-0"
            aria-label="Tutup Formulir"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-7 space-y-5 sm:space-y-6 max-h-[75vh] overflow-y-auto overflow-x-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 bg-slate-50 border border-slate-200 rounded-2xl gap-3">
            <div className="space-y-0.5">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">Status Permohonan</span>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                ticket.status === 'Selesai' ? 'bg-emerald-100 text-emerald-800' :
                ticket.status === 'Pending' ? 'bg-amber-100 text-amber-800' :
                ticket.status === 'Diproses' ? 'bg-sky-100 text-sky-800' :
                'bg-slate-200 text-slate-700'
              }`}>
                {ticket.status}
              </span>
            </div>
            <div className="space-y-0.5 text-left sm:text-right">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">Target Waktu SLA</span>
              <div className="flex items-center gap-1.5 text-sm font-black text-slate-800 sm:justify-end">
                <Clock className="w-4 h-4 text-sky-600" />
                <span>{ticket.slaDuration || 7} Hari Kerja</span>
              </div>
              {ticket.status === 'Verifikasi' && (
                <span className="text-[10px] font-bold text-slate-400 block">(Belum Berjalan)</span>
              )}
              {ticket.status === 'Pending' && (
                <span className="text-[10px] font-bold text-amber-600 block">(Tertangguh)</span>
              )}
            </div>

          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Informasi Pemohon & Layanan</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-white p-4 border border-slate-200 rounded-2xl text-sm">
              <div>
                <span className="text-xs font-bold text-slate-400 block">Nama Pengaju:</span>
                <p className="font-extrabold text-slate-800 mt-0.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{ticket.pemohon || '-'}</span>
                </p>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 block">Kategori Layanan:</span>
                <p className="font-extrabold text-slate-800 mt-0.5 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                  <span>{ticket.service}</span>
                </p>
              </div>
              <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-400 block">Sub-Layanan yang Diajukan:</span>
                <p className="text-base font-black text-sky-900 mt-0.5">{ticket.requestType}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Detail Isi Formulir</h4>
            <div className="space-y-3 bg-white p-4 border border-slate-200 rounded-2xl text-sm">
              {(() => {
                const hasFormData = ticket.form_data && Object.keys(ticket.form_data).filter(k => k !== 'Berkas_Persyaratan' && k !== 'Nama_File_Persyaratan' && k !== '_uploadedFile' && k !== '_uploadedFileName' && !k.endsWith('_name')).length > 0;
                
                const showBuiltInTitle = !hasFormData && !(ticket.title === `Pengajuan Layanan ${ticket.service}` || ticket.title === `Permohonan ${ticket.service}` || ticket.title === `Permohonan ${ticket.requestType}`);
                
                const showBuiltInDesc = !hasFormData && !(ticket.desc === `Detail pengerjaan untuk sub-layanan ${ticket.service}` || ticket.description === `Detail pengerjaan untuk sub-layanan ${ticket.service}` || ticket.desc === `Detail pengerjaan untuk sub-layanan ${ticket.requestType}` || ticket.description === `Detail pengerjaan untuk sub-layanan ${ticket.requestType}` || ticket.description === 'Tidak ada deskripsi (menggunakan form kustom)' || ticket.desc === 'Tidak ada deskripsi (menggunakan form kustom)' || (!ticket.desc && !ticket.description));

                return (
                  <>
                    {showBuiltInTitle && (
                      <div>
                        <span className="text-xs font-bold text-slate-400 block">Judul Ringkas Permohonan:</span>
                        <p className="font-black text-slate-900 text-base mt-0.5 leading-snug">{ticket.title}</p>
                      </div>
                    )}
                    {showBuiltInDesc && (
                      <div className="overflow-hidden">
                        <span className="text-xs font-bold text-slate-400 block">Deskripsi Lengkap Kebutuhan:</span>
                        <p className="font-medium text-slate-700 mt-1 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200 break-words break-all">
                          {ticket.desc || ticket.description}
                        </p>
                      </div>
                    )}

                    {hasFormData && (
                      <div className={`${showBuiltInTitle || showBuiltInDesc ? 'pt-2 border-t border-slate-100 ' : ''}grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs overflow-hidden`}>
                        {(() => {
                          const subServiceName = (ticket.requestType && ticket.requestType !== 'Baru') ? ticket.requestType : (ticket.service || '');
                          const srv = (services || []).find(s => s.name === subServiceName);
                          let schema = srv?.form_schema || [];
                          
                          if (typeof schema === 'string') {
                            try { schema = JSON.parse(schema); } catch (e) { schema = []; }
                          }
                          if (!Array.isArray(schema)) schema = [];

                          if (schema.length === 0) {
                            return (
                              <div className="sm:col-span-2 text-center py-3 text-slate-500 font-medium italic bg-slate-50 border border-slate-100 border-dashed rounded-xl">
                                Tidak ada detail form kustom yang dikonfigurasi.
                              </div>
                            );
                          }

                          const renderField = (field) => {
                            if (field.type === 'group') {
                              return (
                                <div key={field.id || field.name} className="col-span-1 sm:col-span-2 p-3 bg-slate-50/50 rounded-xl border border-slate-200 overflow-hidden">
                                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2 border-b border-slate-200 pb-2">{field.label}</label>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-2 border-l-2 border-sky-200 pt-1">
                                    {(field.subFields || []).map(sub => renderField(sub))}
                                  </div>
                                </div>
                              );
                            }

                            const fieldKey = field.id || field.label || field.name;
                            const val = ticket.form_data[fieldKey] !== undefined ? ticket.form_data[fieldKey] : ticket.form_data[field.label || field.name];

                            if (val === undefined || val === null || val === '') return null;

                            if (field.type === 'file') {
                              const fileName = ticket.form_data[`${fieldKey}_name`] || 'Dokumen_Lampiran.pdf';
                              return (
                                <div key={field.id || fieldKey} className="p-2.5 sm:p-3 bg-slate-50 rounded-xl border border-slate-100 sm:col-span-2 overflow-hidden">
                                  <span className="font-bold text-slate-400 block text-xs truncate">{field.label}:</span>
                                  <a
                                    href={val}
                                    download={fileName}
                                    className="inline-flex items-center gap-1.5 mt-1.5 text-sky-600 hover:text-sky-700 font-bold bg-white px-3 py-1.5 rounded-lg border border-sky-100 shadow-sm text-xs max-w-full overflow-hidden"
                                    title={fileName}
                                  >
                                    <Download className="w-3.5 h-3.5 shrink-0" />
                                    <span className="truncate min-w-0">Unduh {fileName}</span>
                                  </a>
                                </div>
                              );
                            }

                            const isLongText = val.toString().length > 50 || field.type === 'textarea';

                            return (
                              <div key={field.id || fieldKey} className={`p-2.5 sm:p-3 bg-slate-50 rounded-xl border border-slate-100 min-w-0 overflow-hidden ${isLongText ? 'sm:col-span-2' : ''}`}>
                                <span className="font-bold text-slate-400 block text-xs truncate">{field.label}:</span>
                                <span className="font-extrabold text-slate-800 break-words break-all whitespace-pre-wrap block mt-0.5">{val.toString()}</span>
                              </div>
                            );
                          };

                          return schema.map(f => renderField(f));
                        })()}
                      </div>
                    )}
              {(!ticket.form_data || Object.keys(ticket.form_data).length === 0) && !showBuiltInTitle && !showBuiltInDesc && (
                 <div className="text-center py-3 text-slate-500 font-medium italic bg-slate-50 border border-slate-100 border-dashed rounded-xl">Tidak ada detail form.</div>
              )}
            </>
          );
        })()}
            </div>
          </div>

          {user?.role !== 'pegawai' && ticket.revisionNote && (
            <div className="space-y-2">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Catatan Perbaikan Pemohon</h4>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-1">
                <p className="font-medium text-slate-700 leading-relaxed italic">
                  "{ticket.revisionNote}"
                </p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Persyaratan & Dokumen Resmi (PDF)</h4>
            <div className="space-y-3 bg-white p-3.5 sm:p-4 border border-slate-200 rounded-2xl text-xs overflow-hidden">
              <div className="flex items-start gap-2.5 text-slate-650 min-w-0">
                <FileCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1 overflow-hidden">
                  <strong className="text-slate-800 font-extrabold block">Ketentuan Dokumen Syarat: </strong>
                  <div className="mt-1 break-words break-all text-slate-600">
                    {(() => {
                      const reqDocsRaw = ticket.required_docs || ticket.requiredDocs;
                      if (!reqDocsRaw) return <span className="break-words break-all">Surat Permohonan Resmi OPD, KAK / Dokumen Pendukung</span>;
                      const parsed = parseFileValue(reqDocsRaw);
                      if (parsed.data.startsWith('data:')) {
                        return (
                          <a href={parsed.data} download={parsed.name || "Template_Persyaratan.pdf"} className="inline-flex items-center gap-1.5 text-sky-600 hover:text-sky-700 bg-sky-50 px-2.5 py-1.5 rounded-lg border border-sky-100 font-bold max-w-full overflow-hidden">
                            <Download className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate min-w-0 block">Unduh Template {parsed.name || 'Dokumen'}</span>
                          </a>
                        );
                      }
                      return <span className="break-words break-all">{parsed.name}</span>;
                    })()}
                  </div>
                </div>
              </div>

              {hasUploadedDoc && (
                <div className="p-3 sm:p-3.5 bg-sky-50/50 border border-sky-100 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 overflow-hidden">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1 overflow-hidden w-full">
                    <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <p className="font-bold text-slate-800 text-xs truncate block min-w-0" title={fileName || 'Dokumen_Persyaratan_Layanan.pdf'}>
                        {fileName || 'Dokumen_Persyaratan_Layanan.pdf'}
                      </p>
                      <span className="text-[10px] text-slate-400 font-semibold block truncate">Dokumen Resmi PDF Pemohon</span>
                    </div>
                  </div>
                  <a
                    href={docUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs shrink-0 w-full sm:w-auto text-center"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Buka Berkas PDF</span>
                  </a>
                </div>
              )}

              {ticket.sop && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 overflow-hidden">
                  <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden w-full">
                    <FileCheck className="w-4 h-4 text-sky-600 shrink-0" />
                    <span className="font-bold text-slate-700 text-xs truncate block min-w-0" title={parseFileValue(ticket.sop).name || 'SOP.pdf'}>
                      SOP Pelayanan: {parseFileValue(ticket.sop).name || 'SOP.pdf'}
                    </span>
                  </div>
                  {parseFileValue(ticket.sop).data?.startsWith('data:') && (
                    <a
                      href={parseFileValue(ticket.sop).data}
                      download={parseFileValue(ticket.sop).name || "SOP_Layanan.pdf"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-600 hover:text-sky-700 font-bold hover:underline shrink-0 flex items-center justify-center gap-1 text-[11px] py-1.5 sm:py-0 w-full sm:w-auto text-center"
                    >
                      <span>Unduh SOP</span>
                      <Download className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}

              {Boolean(ticket.bastFile && ticket.bastFile.trim() !== '' && ticket.bastFileUrl && ticket.bastFileUrl !== '/bast_selesai.pdf') && (
                <div className="p-3 sm:p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 mt-2 overflow-hidden">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1 overflow-hidden w-full">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <p className="font-bold text-slate-800 text-xs truncate block min-w-0" title={ticket.bastFile}>
                        {ticket.bastFile}
                      </p>
                      <span className="text-[10px] text-emerald-700 font-bold block truncate">Berita Acara Serah Terima (BAST) Pegawai</span>
                    </div>
                  </div>
                  <a
                    href={ticket.bastFileUrl}
                    download={ticket.bastFile}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs shrink-0 w-full sm:w-auto text-center"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Buka BAST PDF</span>
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Fitur UI Subtask Kolegial Dipindahkan ke Dashboard */}

        </div>

        <div className="px-4 py-3 sm:px-6 sm:py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
