import React from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function ToastBanner() {
  const { toast, setToast } = useApp();
  if (!toast) return null;

  const styles = {
    success: 'bg-emerald-900/95 border-emerald-500 text-white',
    error: 'bg-rose-900/95 border-rose-500 text-white',
    info: 'bg-slate-900/95 border-brand-400 text-white',
  };

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    error: <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />,
    info: <Info className="w-5 h-5 text-brand-400 shrink-0" />,
  };

  return (
    <div className="fixed top-24 right-4 z-50 max-w-md w-[calc(100%-2rem)] animate-fade-in">
      <div
        className={`flex items-start gap-3 p-4 rounded-2xl border shadow-2xl backdrop-blur-md ${
          styles[toast.type] || styles.info
        }`}
      >
        {icons[toast.type] || icons.info}
        <p className="text-sm font-medium leading-snug flex-1">{toast.message}</p>
        <button
          type="button"
          onClick={() => setToast(null)}
          className="text-white/70 hover:text-white p-0.5"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
