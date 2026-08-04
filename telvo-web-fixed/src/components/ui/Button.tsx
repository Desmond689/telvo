import { type ButtonHTMLAttributes, type ReactNode, forwardRef } from 'react';
import clsx from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
}

const variants = {
  primary: 'bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 shadow-sm',
  secondary: 'bg-ink-900 text-white hover:bg-ink-800',
  outline: 'bg-white text-ink-800 border border-ink-200 hover:border-brand-500 hover:text-brand-600',
  ghost: 'bg-transparent text-ink-700 hover:bg-ink-50',
  danger: 'bg-red-600 text-white hover:bg-red-700',
};

const sizes = {
  sm: 'h-9 px-3 text-sm gap-1.5',
  md: 'h-11 px-5 text-sm gap-2',
  lg: 'h-13 px-7 text-base gap-2 min-h-[3.25rem]',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, icon, fullWidth, className, children, disabled, type = 'button', ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        aria-disabled={disabled || loading || undefined}
        className={clsx(
          'inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-150',
          'active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
          'whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {loading ? (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        ) : (
          icon
        )}
        {loading && <span className="sr-only">Loading</span>}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
