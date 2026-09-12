import React from 'react';
import { X, FileCheck, ExternalLink, Download, ShieldCheck } from 'lucide-react';

export const SopModal = ({ isOpen, onClose, serviceName, sopFileName, fileUrl }) => {
  if (!isOpen) return null;

  const resolvedUrl = fileUrl || '/sop_layanan.pdf';
  const resolvedFileName = sopFileName || 'sop_layanan.pdf';

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
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-hidden animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl sm:max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-left flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/90 shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 shadow-2xs">
              <FileCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-snug truncate">
                SOP: {serviceName || 'Standar Operasional Prosedur'}
              </h3>
              <p className="text-xs text-slate-500 font-semibold flex items-center gap-2 mt-0.5 truncate">
                <span className="font-mono bg-sky-50 text-sky-700 px-2 py-0.5 rounded-md border border-sky-200 text-[11px] font-bold">
                  {resolvedFileName}
                </span>
                <span>• Diskominfo Kota Bogor</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={resolvedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer"
              title="Buka PDF di tab baru"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Buka di Tab Baru</span>
            </a>
            <a
              href={resolvedUrl}
              download={resolvedFileName}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="Unduh Berkas SOP PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh SOP</span>
            </a>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-slate-200/80 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-all cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-5 flex-1 min-h-[380px] bg-slate-100/60 overflow-hidden flex flex-col">
          <iframe
            src={resolvedUrl}
            title={`Dokumen SOP - ${serviceName}`}
            className="w-full flex-1 rounded-2xl border border-slate-200 bg-white shadow-inner min-h-[55vh]"
          />
        </div>

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0 flex-wrap text-xs">
          <div className="flex items-center gap-2 text-slate-500 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Dokumen SOP resmi ini menjadi pedoman operasional pelaksanaan layanan SPBE Kota Bogor.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer ml-auto"
          >
            Tutup Pratinjau
          </button>
        </div>
      </div>
    </div>
  );
};
