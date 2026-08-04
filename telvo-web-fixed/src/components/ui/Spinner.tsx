export function Spinner({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      className={`animate-spin text-brand-500 ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

export function PageSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Spinner size={32} />
    </div>
  );
}
