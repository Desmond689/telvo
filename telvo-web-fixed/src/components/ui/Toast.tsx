import { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import clsx from 'clsx';

export type ToastTone = 'success' | 'error' | 'info';

export interface ToastProps {
  open: boolean;
  message: string;
  tone?: ToastTone;
  onClose: () => void;
  durationMs?: number;
}

const toneStyles: Record<ToastTone, string> = {
  success: 'bg-brand-50 border-brand-200 text-brand-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  info: 'bg-ink-50 border-ink-200 text-ink-800',
};

export function Toast({ open, message, tone = 'info', onClose, durationMs = 4000 }: ToastProps) {
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(onClose, durationMs);
    return () => window.clearTimeout(t);
  }, [open, onClose, durationMs]);

  if (!open) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={clsx(
        'fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] max-w-sm w-[calc(100%-2rem)]',
        'flex items-start gap-3 px-4 py-3 rounded-xl border shadow-card-hover animate-slide-up',
        toneStyles[tone]
      )}
    >
      {tone === 'success' && <CheckCircle2 size={18} className="flex-shrink-0 mt-0.5 text-brand-600" aria-hidden="true" />}
      {tone === 'error' && <AlertCircle size={18} className="flex-shrink-0 mt-0.5 text-red-600" aria-hidden="true" />}
      <p className="text-sm font-medium flex-1">{message}</p>
      <button
        type="button"
        onClick={onClose}
        className="p-1 rounded-lg hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-brand-500"
        aria-label="Dismiss notification"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
