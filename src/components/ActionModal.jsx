import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, HelpCircle, X } from 'lucide-react';

export const ActionModal = ({
  isOpen,
  onClose,
  type = 'confirm',
  title,
  message,
  confirmText = 'Lanjutkan',
  cancelText = 'Batal',
  onConfirm,
  children
}) => {
  if (!isOpen) return null;

  const getIconConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: CheckCircle2,
          bg: 'bg-emerald-50 border-emerald-100 text-emerald-600',
          btnBg: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
        };
      case 'danger':
        return {
          icon: AlertTriangle,
          bg: 'bg-rose-50 border-rose-100 text-rose-600',
          btnBg: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20'
        };
      case 'warning':
        return {
          icon: AlertCircle,
          bg: 'bg-amber-50 border-amber-100 text-amber-600',
          btnBg: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/20'
        };
      default:
        return {
          icon: HelpCircle,
          bg: 'bg-sky-50 border-sky-100 text-sky-600',
          btnBg: 'bg-sky-600 hover:bg-sky-700 text-white shadow-sky-500/20'
        };
    }
  };

  const config = getIconConfig();
  const IconComponent = config.icon;

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
        className="relative w-full max-w-md sm:max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden text-center animate-in zoom-in-95 duration-200 p-7 sm:p-8 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className={`w-16 h-16 rounded-2xl border-2 ${config.bg} flex items-center justify-center mx-auto shadow-sm`}>
          <IconComponent className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
            {title}
          </h3>
          {message && (
            <p className="text-sm sm:text-base font-medium text-slate-600 leading-relaxed max-w-md mx-auto">
              {message}
            </p>
          )}
        </div>

        {children && (
          <div className="text-left pt-1">
            {children}
          </div>
        )}

        <div className="flex gap-3 pt-2 flex-col-reverse sm:flex-row">
          {type === 'success' ? (
            <button
              type="button"
              onClick={() => {
                if (onConfirm) onConfirm();
                onClose();
              }}
              className={`w-full py-3 px-5 rounded-xl font-bold text-sm sm:text-base transition-all shadow-md hover:shadow-lg cursor-pointer ${config.btnBg}`}
            >
              {confirmText || 'Selesai & Tutup'}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-5 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-xl text-sm sm:text-base font-bold text-slate-700 transition-all cursor-pointer"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onConfirm) onConfirm();
                }}
                className={`flex-1 py-3 px-5 rounded-xl text-sm sm:text-base font-bold transition-all shadow-md hover:shadow-lg cursor-pointer ${config.btnBg}`}
              >
                {confirmText}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
