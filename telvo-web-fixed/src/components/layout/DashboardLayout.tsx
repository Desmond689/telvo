import { useState, useEffect } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Menu, X, Bell, LogOut, type LucideIcon } from 'lucide-react';
import { Logo } from './Logo';
import { useAuth } from '@/contexts/AuthContext';
import { VerifiedBadge } from '../ui/VerifiedBadge';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

export function DashboardLayout({ navItems, roleLabel }: { navItems: NavItem[]; roleLabel: string }) {
  const [open, setOpen] = useState(false);
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  // Close mobile drawer on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  const Sidebar = (
    <div className="flex flex-col h-full">
      <div className="px-5 py-5 border-b border-ink-100 flex items-center justify-between">
        <Logo />
        <button
          type="button"
          className="lg:hidden p-2 rounded-lg hover:bg-ink-100 text-ink-500"
          onClick={() => setOpen(false)}
          aria-label="Close menu"
        >
          <X size={20} aria-hidden="true" />
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5" aria-label="Dashboard">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 ${
                isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-ink-50'
              }`
            }
          >
            <item.icon size={18} aria-hidden="true" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-ink-100">
        <div className="flex items-center gap-3 px-2 py-2">
          <span className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-bold overflow-hidden flex-shrink-0">
            {profile?.profilePhoto ? (
              <img
                src={profile.profilePhoto}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <span aria-hidden="true">{profile?.fullName?.[0]?.toUpperCase() || 'U'}</span>
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink-900 truncate flex items-center gap-1">
              {profile?.fullName || 'User'} {profile?.isVerified && <VerifiedBadge size={13} />}
            </p>
            <p className="text-xs text-ink-400">{roleLabel}</p>
          </div>
          <button
            type="button"
            onClick={() => signOut().then(() => navigate('/'))}
            className="p-2 rounded-lg hover:bg-ink-100 text-ink-400 focus-visible:ring-2 focus-visible:ring-brand-500"
            aria-label="Sign out"
          >
            <LogOut size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-ink-50 flex">
      <a href="#dashboard-main" className="skip-link">
        Skip to main content
      </a>

      <aside
        className="hidden lg:block w-64 flex-shrink-0 bg-white border-r border-ink-100 sticky top-0 h-screen"
        aria-label="Sidebar navigation"
      >
        {Sidebar}
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <div className="absolute inset-0 bg-ink-900/40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute left-0 top-0 h-full w-72 bg-white animate-slide-up shadow-xl">
            {Sidebar}
          </div>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-ink-100 h-16 flex items-center justify-between px-4 sm:px-6">
          <button
            type="button"
            className="lg:hidden p-2 -ml-2 text-ink-700 rounded-lg hover:bg-ink-50 focus-visible:ring-2 focus-visible:ring-brand-500"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
          >
            <Menu size={22} aria-hidden="true" />
          </button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            <Link
              to="notifications"
              className="relative p-2 rounded-lg hover:bg-ink-100 text-ink-500 focus-visible:ring-2 focus-visible:ring-brand-500"
              aria-label="Notifications"
            >
              <Bell size={19} aria-hidden="true" />
            </Link>
            <Link to="/" className="text-sm text-ink-500 hover:text-ink-800 hidden sm:block">
              ← Back to site
            </Link>
          </div>
        </header>
        <main id="dashboard-main" className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
