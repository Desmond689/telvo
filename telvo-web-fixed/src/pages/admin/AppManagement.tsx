import { type FormEvent, useEffect, useRef, useState } from 'react';
import { Smartphone, UploadCloud, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { getAppConfig, publishAppUpdate } from '@/services/appConfigService';
import { uploadApk } from '@/services/storageService';
import type { AppConfig } from '@/types';

function formatBytes(bytes?: number): string {
  if (!bytes) return '';
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

export function AppManagement() {
  const [current, setCurrent] = useState<AppConfig | null | undefined>(undefined);
  const [version, setVersion] = useState('');
  const [versionCode, setVersionCode] = useState('');
  const [releaseNotes, setReleaseNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getAppConfig()
      .then((cfg) => {
        setCurrent(cfg);
        if (cfg) {
          setVersion(cfg.version);
          setVersionCode(String(cfg.versionCode + 1));
          setReleaseNotes('');
        }
      })
      .catch(() => setCurrent(null));
  }, []);

  const handlePublish = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setDone(false);
    if (!version.trim()) return setError('Enter a version name, e.g. 2.0.1.');
    const code = Number(versionCode);
    if (!code || code <= 0) return setError('Enter a numeric version code, e.g. 201.');
    if (current && code <= current.versionCode) return setError(`Version code must be greater than the current one (${current.versionCode}).`);
    if (!file) return setError('Choose an APK file to upload.');

    setBusy(true);
    setProgress(0);
    try {
      const { url, sizeBytes } = await uploadApk(file, code, setProgress);
      await publishAppUpdate({
        version: version.trim(),
        versionCode: code,
        apkUrl: url,
        apkSizeBytes: sizeBytes,
        releaseNotes: releaseNotes.trim(),
      });
      setDone(true);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      const cfg = await getAppConfig();
      setCurrent(cfg);
    } catch (err: any) {
      setError(err?.message || 'Something went wrong publishing the update.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">App Management</h1>
        <p className="text-sm text-ink-500 mt-1">Upload a new TELVO Android build and publish it — the website's Download page updates automatically, no code changes needed.</p>
      </div>

      {current !== undefined && (
        <Card className="p-5">
          <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-2">Currently published</p>
          {current ? (
            <div className="flex items-center gap-3 flex-wrap">
              <span className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center"><Smartphone size={18} /></span>
              <div>
                <p className="font-semibold text-ink-900">Version {current.version} <span className="text-ink-400 font-normal">(code {current.versionCode})</span></p>
                <p className="text-xs text-ink-500">{formatBytes(current.apkSizeBytes)}</p>
              </div>
              <Badge tone="green" icon={<CheckCircle2 size={12} />}>Live</Badge>
            </div>
          ) : (
            <p className="text-sm text-ink-500">No APK has been published yet — the Download page will show store buttons only until you publish one.</p>
          )}
        </Card>
      )}

      <Card className="p-6">
        <form onSubmit={handlePublish} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Current Version" placeholder="2.0.1" value={version} onChange={(e) => setVersion(e.target.value)} />
            <Input label="Version Code" placeholder="201" type="number" value={versionCode} onChange={(e) => setVersionCode(e.target.value)} hint="Must increase with every release." />
          </div>
          <Textarea
            label="Release Notes"
            placeholder={'• Fixed notifications\n• Improved search\n• Added ID verification'}
            value={releaseNotes}
            onChange={(e) => setReleaseNotes(e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">Upload APK</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".apk"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-ink-600 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:bg-ink-100 file:text-ink-700 file:font-medium hover:file:bg-ink-200"
            />
            {file && <p className="text-xs text-ink-500 mt-1.5">{file.name} · {formatBytes(file.size)}</p>}
          </div>

          {busy && (
            <div className="w-full h-2 rounded-full bg-ink-100 overflow-hidden">
              <div className="h-full bg-brand-500 transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          {done && <p className="text-sm text-brand-700 bg-brand-50 rounded-lg px-3 py-2">Update published. It's now live on the Download page.</p>}

          <Button type="submit" loading={busy} icon={<UploadCloud size={16} />}>
            Publish Update
          </Button>
        </form>
      </Card>
    </div>
  );
}
