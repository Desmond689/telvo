import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, Bell, ChevronDown, Heart, Download } from 'lucide-react';
import { Logo } from './Logo';
import { Button } from '../ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { dashboardHomeFor } from '@/utils/roles';

const navLinks = [
  { to: '/find-services', label: 'Find Services' },
  { to: '/professionals', label: 'Professionals' },
  { to: '/businesses', label: 'Businesses' },
  { to: '/how-it-works', label: 'How It Works' },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { firebaseUser, profile, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  // Close mobile menu on route-ish actions
  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-ink-100 safe-top">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between" aria-label="Primary">
        <div className="flex items-center gap-8">
          <Logo />
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 ${
                    isActive ? 'text-brand-600 bg-brand-50' : 'text-ink-600 hover:text-ink-900 hover:bg-ink-50'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </div>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/donate"
            className="px-3 py-2 rounded-lg text-sm font-medium text-ink-600 hover:text-brand-600 hover:bg-brand-50 flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <Heart size={15} aria-hidden="true" /> Support Us
          </Link>
          <Link
            to="/download"
            className="px-3 py-2 rounded-lg text-sm font-medium text-ink-600 hover:text-ink-900 hover:bg-ink-50 flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <Download size={15} aria-hidden="true" /> Get the App
          </Link>
          {firebaseUser && profile ? (
            <>
              <button
                type="button"
                className="relative p-2 rounded-lg hover:bg-ink-50 text-ink-500 focus-visible:ring-2 focus-visible:ring-brand-500"
                onClick={() => navigate(`${dashboardHomeFor(profile.userType)}/notifications`)}
                aria-label="Notifications"
              >
                <Bell size={19} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => navigate(dashboardHomeFor(profile.userType))}
                className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-ink-50 focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                <span className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold overflow-hidden">
                  {profile.profilePhoto ? (
                    <img src={profile.profilePhoto} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span aria-hidden="true">{profile.fullName?.[0]?.toUpperCase() || 'U'}</span>
                  )}
                </span>
                <span className="text-sm font-medium text-ink-800 max-w-[120px] truncate hidden sm:inline">
                  {profile.fullName?.split(' ')[0] || 'Account'}
                </span>
                <ChevronDown size={14} className="text-ink-400" aria-hidden="true" />
              </button>
              <Button variant="ghost" size="sm" onClick={() => signOut().then(() => navigate('/'))}>
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                Log in
              </Button>
              <Button size="sm" onClick={() => navigate('/register')}>
                Join TELVO
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          className="md:hidden p-2 text-ink-700 rounded-lg hover:bg-ink-50 focus-visible:ring-2 focus-visible:ring-brand-500"
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="mobile-menu"
        >
          {open ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
        </button>
      </nav>

      {open && (
        <div
          id="mobile-menu"
          className="md:hidden border-t border-ink-100 px-4 py-4 space-y-1 animate-slide-up bg-white safe-bottom"
          role="navigation"
          aria-label="Mobile"
        >
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={close}
              className="block px-3 py-2.5 rounded-lg text-sm font-medium text-ink-700 hover:bg-ink-50 focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              {l.label}
            </Link>
          ))}
          <Link
            to="/donate"
            onClick={close}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-brand-700 bg-brand-50 focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <Heart size={16} aria-hidden="true" /> Support Us
          </Link>
          <Link
            to="/download"
            onClick={close}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-ink-700 hover:bg-ink-50 focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <Download size={16} aria-hidden="true" /> Get the App
          </Link>
          <div className="pt-3 mt-3 border-t border-ink-100 flex flex-col gap-2">
            {firebaseUser && profile ? (
              <>
                <Button variant="outline" onClick={() => { close(); navigate(dashboardHomeFor(profile.userType)); }}>
                  Go to dashboard
                </Button>
                <Button variant="ghost" onClick={() => signOut().then(() => navigate('/'))}>
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => { close(); navigate('/login'); }}>
                  Log in
                </Button>
                <Button onClick={() => { close(); navigate('/register'); }}>Join TELVO</Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
