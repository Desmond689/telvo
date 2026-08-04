import { type SelectHTMLAttributes, forwardRef, useId } from 'react';
import clsx from 'clsx';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, className, id, children, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = error ? `${inputId}-error` : undefined;
    const hintId = hint && !error ? `${inputId}-hint` : undefined;
    const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-ink-700 mb-1.5">
            {label}
            {props.required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={clsx(
            'w-full h-11 px-4 rounded-xl border bg-white text-ink-900 transition-colors appearance-none',
            'focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500',
            'disabled:bg-ink-50 disabled:text-ink-400 disabled:cursor-not-allowed',
            error ? 'border-red-400 focus:ring-red-500/30 focus:border-red-500' : 'border-ink-200',
            className
          )}
          {...props}
        >
          {children}
        </select>
        {error && (
          <p id={errorId} role="alert" className="mt-1.5 text-xs text-red-600">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={hintId} className="mt-1.5 text-xs text-ink-400">
            {hint}
          </p>
        )}
      </div>
    );
  }
);
Select.displayName = 'Select';
