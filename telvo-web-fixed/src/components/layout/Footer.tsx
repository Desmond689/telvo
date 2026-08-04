import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Linkedin } from 'lucide-react';
import { Logo } from './Logo';
import { DownloadAppButtons } from '../ui/DownloadAppButtons';

const columns = [
  {
    title: 'Services',
    links: [
      { label: 'Find Services', to: '/find-services' },
      { label: 'Browse Professionals', to: '/professionals' },
      { label: 'Browse Businesses', to: '/businesses' },
      { label: 'How TELVO Works', to: '/how-it-works' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About TELVO', to: '/about' },
      { label: 'Become a Professional', to: '/become-a-professional' },
      { label: 'Register Your Business', to: '/register-business' },
      { label: 'Get the App', to: '/download' },
      { label: 'Support Us', to: '/donate' },
      { label: 'Contact', to: '/contact' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Help Center', to: '/help' },
      { label: 'Safety', to: '/safety' },
      { label: 'Community Guidelines', to: '/community-guidelines' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms of Service', to: '/terms' },
      { label: 'Privacy Policy', to: '/privacy' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-ink-900 text-ink-300 mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          <div className="col-span-2">
            <span className="inline-flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white font-extrabold text-sm">T</span>
              <span className="text-lg font-extrabold tracking-tight text-white">TELVO</span>
            </span>
            <p className="mt-3 text-sm text-ink-400 max-w-xs">Trusted workers. Real solutions.</p>
            <div className="mt-5">
              <DownloadAppButtons size="sm" variant="light" />
            </div>
            <div className="flex items-center gap-3 mt-5">
              {[Facebook, Instagram, Twitter, Linkedin].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 rounded-full bg-ink-800 flex items-center justify-center hover:bg-brand-500 transition-colors" aria-label="Social link">
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-white mb-3">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.to}>
                    <Link to={l.to} className="text-sm text-ink-400 hover:text-white transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-6 border-t border-ink-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-ink-500">© {new Date().getFullYear()} TELVO. All rights reserved. Made for Cameroon 🇨🇲</p>
          <p className="text-xs text-ink-500">Yaoundé · Douala · Buea · Limbe · Bamenda · Bafoussam · Kribi · Garoua</p>
        </div>
      </div>
    </footer>
  );
}
