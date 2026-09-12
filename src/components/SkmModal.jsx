import React from 'react';
import { X, ExternalLink, CheckCircle2, QrCode } from 'lucide-react';

export const SkmModal = ({ isOpen, onClose, ticket, onConfirm }) => {
  if (!isOpen || !ticket) return null;

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
    <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4 overflow-hidden animate-in fade-in duration-200 font-sans">
      <div 
        className="relative w-full max-w-md sm:max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-center animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-sky-500 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-left">
            <span className="text-xl">😊</span>
            <h3 className="text-base sm:text-lg font-black tracking-tight leading-snug">
              Seberapa puas Anda terhadap aplikasi ini?
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 sm:p-7 space-y-5">
          <div className="flex items-center justify-center gap-2 text-slate-600 text-sm font-semibold">
            <span className="text-base">☕</span>
            <p>Bagikan pengalaman anda dengan mengisi survey kepuasan :)</p>
          </div>

          <div className="p-4 bg-sky-50/60 rounded-2xl border-2 border-sky-200 inline-block mx-auto shadow-inner">
            <img 
              src="/skm_qr_menpan.jpg" 
              alt="QR Code Survei Kepuasan Masyarakat MenPAN-RB" 
              className="w-52 h-52 sm:w-56 sm:h-56 object-contain rounded-xl shadow-xs mx-auto bg-white"
            />
          </div>

          <div className="space-y-3 pt-1">
            <a
              href="https://kehadiran.menpan.go.id/survey-me"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 break-all shadow-xs hover:shadow-sm group cursor-pointer"
            >
              <span>https://kehadiran.menpan.go.id/survey-me</span>
              <ExternalLink className="w-3.5 h-3.5 text-sky-500 group-hover:translate-x-0.5 transition-transform shrink-0" />
            </a>

            <button
              type="button"
              onClick={() => {
                if (onConfirm) onConfirm(ticket);
                onClose();
              }}
              className="w-full py-3 px-5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm sm:text-base font-bold transition-all shadow-md shadow-sky-500/20 hover:shadow-lg hover:shadow-sky-500/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Saya Sudah Mengisi Survei</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
