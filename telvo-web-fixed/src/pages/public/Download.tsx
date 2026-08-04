import { useEffect, useState } from 'react';
import { ShieldCheck, Zap, MessageCircle, Download as DownloadIcon, Smartphone } from 'lucide-react';
import { DownloadAppButtons } from '@/components/ui/DownloadAppButtons';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { getAppConfig } from '@/services/appConfigService';
import type { AppConfig } from '@/types';

const highlights = [
  { icon: Zap, title: 'Post a job in under 2 minutes', desc: 'Faster than typing it into a chat with a friend.' },
  { icon: ShieldCheck, title: 'Verified professionals only', desc: 'ID and selfie verification on every badge you see.' },
  { icon: MessageCircle, title: 'Chat and pay in one place', desc: 'No more juggling phone numbers and cash on the side.' },
];

function formatBytes(bytes?: number): string {
  if (!bytes) return '';
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function Download() {
  const [appConfig, setAppConfig] = useState<AppConfig | null | undefined>(undefined);
  const defaultApkUrl = 'https://github.com/Desmond689/TELVO-/releases/download/v1.0.0/app-release.apk';
  const apkUrl = appConfig?.apkUrl || defaultApkUrl;
  const version = appConfig?.version || '1.0.0';
  const apkSizeText = formatBytes(appConfig?.apkSizeBytes);

  useEffect(() => {
    getAppConfig()
      .then(setAppConfig)
      .catch(() => setAppConfig(null));
  }, []);

  return (
    <div className="container-page py-16">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-3xl sm:text-5xl font-extrabold text-ink-900">Get TELVO on your phone</h1>
        <p className="text-ink-500 mt-4 text-lg">
          Post jobs, compare quotes, message professionals, and track work — all from your pocket.
        </p>
        <div className="mt-8 flex justify-center">
          <DownloadAppButtons size="md" variant="dark" />
        </div>
        <p className="text-xs text-ink-400 mt-3">Available for iOS and Android across Cameroon.</p>

        {apkUrl && (
          <Card className="mt-8 p-5 max-w-sm mx-auto text-left">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0"><Smartphone size={18} /></span>
              <div className="flex-1">
                <p className="font-semibold text-ink-900">Android APK · v{version}</p>
                <p className="text-xs text-ink-500">{apkSizeText}</p>
              </div>
            </div>
            {appConfig?.releaseNotes && (
              <p className="text-sm text-ink-500 mt-3 whitespace-pre-line">{appConfig.releaseNotes}</p>
            )}
            <a href={apkUrl} target="_blank" rel="noreferrer" className="block mt-4">
              <Button fullWidth icon={<DownloadIcon size={16} />}>Download APK</Button>
            </a>
            <p className="text-xs text-ink-400 mt-2">Not on the Play Store yet? Install directly — you may need to allow "unknown sources" in your phone's settings.</p>
          </Card>
        )}
      </div>

      <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto mt-16">
        {highlights.map((h) => (
          <div key={h.title} className="text-center">
            <span className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-3">
              <h.icon size={22} />
            </span>
            <h3 className="font-semibold text-ink-900">{h.title}</h3>
            <p className="text-sm text-ink-500 mt-1.5">{h.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
