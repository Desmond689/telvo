import { type ReactNode, useEffect, useRef, useId } from 'react';
import { X } from 'lucide-react';

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';

    // Focus the panel for screen readers / keyboard
    const t = window.setTimeout(() => {
      panelRef.current?.focus();
    }, 10);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
      // Basic focus trap
      if (e.key === 'Tab' && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      previouslyFocused.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="presentation"
    >
      <div
        className="absolute inset-0 bg-ink-900/40 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto shadow-card-hover animate-slide-up outline-none"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink-100 sticky top-0 bg-white z-10">
          {title ? (
            <h3 id={titleId} className="font-semibold text-ink-900 text-lg">
              {title}
            </h3>
          ) : (
            <span className="sr-only">Dialog</span>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-ink-100 text-ink-500 focus-visible:ring-2 focus-visible:ring-brand-500"
            aria-label="Close dialog"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-ink-100 flex justify-end gap-3 safe-bottom">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
