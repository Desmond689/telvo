import { Link } from 'react-router-dom';

export function Logo({ className = '' }: { className?: string }) {
  return (
    <Link to="/" className={`inline-flex items-center gap-2 group ${className}`} aria-label="TELVO home">
      <span className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white font-extrabold text-sm group-hover:bg-brand-600 transition-colors">
        T
      </span>
      <span className="text-lg font-extrabold tracking-tight text-ink-900">TELVO</span>
    </Link>
  );
}
