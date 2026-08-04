import { Apple, PlayCircle } from 'lucide-react';
import clsx from 'clsx';

// Store URLs are read from env so they can be updated the moment the app
// is published, without a code change. If no Play/App Store links exist yet,
// we fall back to the direct GitHub APK URL so users can still download.
const APP_STORE_URL = import.meta.env.VITE_APP_STORE_URL as string | undefined;
const PLAY_STORE_URL = import.meta.env.VITE_PLAY_STORE_URL as string | undefined;
const TELVO_APK_URL = (import.meta.env.VITE_TELVO_APK_URL || 'https://github.com/Desmond689/TELVO-/releases/download/v1.0.0/app-release.apk') as string;

export function DownloadAppButtons({ variant = 'dark', size = 'md' }: { variant?: 'dark' | 'light'; size?: 'sm' | 'md' }) {
  const base = clsx(
    'inline-flex items-center gap-2 rounded-xl font-semibold transition-colors',
    size === 'sm' ? 'h-10 px-3.5 text-xs' : 'h-12 px-5 text-sm',
    variant === 'dark' ? 'bg-ink-900 text-white hover:bg-ink-800' : 'bg-white text-ink-900 hover:bg-ink-50 border border-ink-200'
  );

  const androidHref = PLAY_STORE_URL || TELVO_APK_URL;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3">
      <a
        href={APP_STORE_URL || '#'}
        target={APP_STORE_URL ? '_blank' : undefined}
        rel="noreferrer"
        aria-disabled={!APP_STORE_URL}
        className={clsx(base, !APP_STORE_URL && 'opacity-60 cursor-not-allowed')}
        onClick={(e) => !APP_STORE_URL && e.preventDefault()}
      >
        <Apple size={size === 'sm' ? 16 : 20} />
        <span className="text-left leading-tight">
          <span className="block text-[10px] opacity-70">{APP_STORE_URL ? 'Download on the' : 'Coming soon to'}</span>
          <span className="block">App Store</span>
        </span>
      </a>
      <a
        href={androidHref}
        target="_blank"
        rel="noreferrer"
        className={base}
      >
        <PlayCircle size={size === 'sm' ? 16 : 20} />
        <span className="text-left leading-tight">
          <span className="block text-[10px] opacity-70">{PLAY_STORE_URL ? 'Get it on' : 'Download'}</span>
          <span className="block">{PLAY_STORE_URL ? 'Google Play' : 'APK'}</span>
        </span>
      </a>
    </div>
  );
}
