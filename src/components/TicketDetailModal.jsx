import React from 'react';
import { X, FileText, Download, ExternalLink, Clock, ShieldCheck, CheckCircle2, AlertTriangle, FileCheck, Building, Tag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { parseFileValue } from '../utils/fileUtils';

export const TicketDetailModal = ({ isOpen, onClose, ticket }) => {
  const { user } = useAuth();
  if (!isOpen || !ticket) return null;

  const formData = ticket.form_data || {};
  const actualDocUrl = ticket.fileUrl || formData['Berkas_Persyaratan'] || formData['_uploadedFile'];
  const fileName = (ticket.files && ticket.files.length > 0) ? ticket.files[0] : formData['Nama_File_Persyaratan'] || formData['_uploadedFileName'];
  const hasUploadedDoc = (!!actualDocUrl && actualDocUrl !== '/dokumen_permohonan.pdf') || (!!fileName && fileName.trim() !== '');
  const docUrl = actualDocUrl || '/dokumen_permohonan.pdf';
  const bastUrl = ticket.bastFileUrl || '/bast_selesai.pdf';
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
    <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-hidden animate-in fade-in duration-200">
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
                {ticket.id} • {ticket.date}
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

        <div className="p-6 sm:p-7 space-y-6 max-h-[75vh] overflow-y-auto">
          <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl flex-wrap gap-3">
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
            <div className="space-y-0.5 text-right sm:text-left">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">Target Waktu SLA</span>
              <div className="flex items-center gap-1.5 text-sm font-black text-slate-800">
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
                <span className="text-xs font-bold text-slate-400 block">Unit Kerja / Instansi:</span>
                <p className="font-extrabold text-slate-800 mt-0.5 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{ticket.opd || '-'}</span>
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
                      <div>
                        <span className="text-xs font-bold text-slate-400 block">Deskripsi Lengkap Kebutuhan:</span>
                        <p className="font-medium text-slate-700 mt-1 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                          {ticket.desc || ticket.description}
                        </p>
                      </div>
                    )}

                    {hasFormData && (
                      <div className={`${showBuiltInTitle || showBuiltInDesc ? 'pt-2 border-t border-slate-100 ' : ''}grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs`}>
                        {Object.entries(ticket.form_data)
                    .filter(([key]) => key !== 'Berkas_Persyaratan' && key !== 'Nama_File_Persyaratan' && key !== '_uploadedFile' && key !== '_uploadedFileName' && !key.endsWith('_name'))
                    .map(([key, val], idx) => {
                      const isFile = typeof val === 'string' && val.startsWith('data:');
                      const fileName = isFile ? ticket.form_data[`${key}_name`] || 'Dokumen_Lampiran' : null;
                      return (
                        <div key={idx} className={`p-2.5 bg-slate-50 rounded-xl border border-slate-100 ${!isFile && val && val.toString().length > 50 ? 'sm:col-span-2' : ''}`}>
                          <span className="font-bold text-slate-400 block">{key}:</span>
                          {isFile ? (
                            <a
                              href={val}
                              download={fileName}
                              className="inline-flex items-center gap-1.5 mt-1 text-sky-600 hover:text-sky-700 font-bold bg-white px-3 py-1.5 rounded-lg border border-sky-100 shadow-sm text-xs"
                            >
                              <Download className="w-3.5 h-3.5" />
                              Unduh {fileName}
                            </a>
                          ) : (
                            <span className="font-extrabold text-slate-800 break-words">{val?.toString() || '-'}</span>
                          )}
                        </div>
                      );
                    })}
                  {Object.entries(ticket.form_data).filter(([key]) => key !== 'Berkas_Persyaratan' && key !== 'Nama_File_Persyaratan' && key !== '_uploadedFile' && key !== '_uploadedFileName' && !key.endsWith('_name')).length === 0 && (
                     <div className="sm:col-span-2 text-center py-3 text-slate-500 font-medium italic bg-slate-50 border border-slate-100 border-dashed rounded-xl">Tidak ada detail form kustom.</div>
                  )}
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
            <div className="space-y-3 bg-white p-4 border border-slate-200 rounded-2xl text-xs">
              <div className="flex items-start gap-2 text-slate-650">
                <FileCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800 font-extrabold">Ketentuan Dokumen Syarat: </strong>
                  <div className="mt-1">
                    {(() => {
                      const reqDocsRaw = ticket.required_docs || ticket.requiredDocs;
                      if (!reqDocsRaw) return <span>Surat Permohonan Resmi OPD, KAK / Dokumen Pendukung</span>;
                      const parsed = parseFileValue(reqDocsRaw);
                      if (parsed.data.startsWith('data:')) {
                        return (
                          <a href={parsed.data} download={parsed.name || "Template_Persyaratan.pdf"} className="inline-flex items-center gap-1.5 text-sky-600 hover:text-sky-700 bg-sky-50 px-2 py-1 rounded-md border border-sky-100 font-bold">
                            Unduh Template {parsed.name || 'Dokumen'}
                          </a>
                        );
                      }
                      return <span>{parsed.name}</span>;
                    })()}
                  </div>
                </div>
              </div>

              {hasUploadedDoc && (
                <div className="p-3.5 bg-sky-50/50 border border-sky-100 rounded-xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 text-xs truncate">
                        {fileName || 'Dokumen_Persyaratan_Layanan.pdf'}
                      </p>
                      <span className="text-[10px] text-slate-400 font-semibold block">Dokumen Resmi PDF Pemohon</span>
                    </div>
                  </div>
                  <a
                    href={docUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Buka Berkas PDF</span>
                  </a>
                </div>
              )}

              {ticket.sop && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-sky-600 shrink-0" />
                    <span className="font-bold text-slate-700">SOP Pelayanan: {parseFileValue(ticket.sop).name || 'SOP.pdf'}</span>
                  </div>
                  {parseFileValue(ticket.sop).data?.startsWith('data:') && (
                    <a
                      href={parseFileValue(ticket.sop).data}
                      download={parseFileValue(ticket.sop).name || "SOP_Layanan.pdf"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-600 hover:text-sky-700 font-bold hover:underline shrink-0 flex items-center gap-1 text-[11px]"
                    >
                      <span>Unduh SOP</span>
                      <Download className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}

              {ticket.bastFile && (
                <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 mt-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 text-xs truncate">
                        {ticket.bastFile}
                      </p>
                      <span className="text-[10px] text-emerald-700 font-bold block">Berita Acara Serah Terima (BAST) Pegawai</span>
                    </div>
                  </div>
                  <a
                    href={bastUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Buka BAST PDF</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
