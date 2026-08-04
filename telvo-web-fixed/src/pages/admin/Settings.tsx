import { type FormEvent, useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { getSupportSettings, saveSupportSettings, getPlatformSettings, savePlatformSettings } from '@/services/settingsService';

export function AdminSettings() {
  const [ownerName, setOwnerName] = useState('');
  const [momoNumber, setMomoNumber] = useState('');
  const [provider, setProvider] = useState<'MTN' | 'Orange'>('MTN');
  const [message, setMessage] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const [commissionPct, setCommissionPct] = useState('10');
  const [platformBusy, setPlatformBusy] = useState(false);
  const [platformSaved, setPlatformSaved] = useState(false);

  useEffect(() => {
    getSupportSettings()
      .then((s) => {
        if (s) {
          setOwnerName(s.ownerName);
          setMomoNumber(s.momoNumber);
          setProvider(s.provider);
          setMessage(s.message);
        }
      })
      .finally(() => setLoaded(true));
    getPlatformSettings().then((s) => setCommissionPct(String(Math.round(s.commissionRate * 100))));
  }, []);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSaved(false);
    if (!momoNumber.trim() || !ownerName.trim()) {
      setError('Owner name and Mobile Money number are required.');
      return;
    }
    setBusy(true);
    try {
      await saveSupportSettings({ ownerName: ownerName.trim(), momoNumber: momoNumber.trim(), provider, message: message.trim() });
      setSaved(true);
    } catch {
      setError('Something went wrong saving settings. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleSavePlatform = async (e: FormEvent) => {
    e.preventDefault();
    const pct = Number(commissionPct);
    if (Number.isNaN(pct) || pct < 0 || pct > 100) return;
    setPlatformBusy(true);
    setPlatformSaved(false);
    try {
      await savePlatformSettings(pct / 100);
      setPlatformSaved(true);
    } finally {
      setPlatformBusy(false);
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Settings</h1>
        <p className="text-sm text-ink-500 mt-1">Platform-wide settings shown to users on the website.</p>
      </div>

      <Card className="p-6">
        <h2 className="font-semibold text-ink-900 mb-1">Platform commission</h2>
        <p className="text-sm text-ink-500 mb-4">The cut TELVO takes from every completed job. Professionals see this reflected live on their Earnings page.</p>
        <form onSubmit={handleSavePlatform} className="flex items-end gap-3">
          <Input
            label="Commission (%)"
            type="number"
            min={0}
            max={100}
            value={commissionPct}
            onChange={(e) => setCommissionPct(e.target.value)}
            className="max-w-[140px]"
          />
          <Button type="submit" loading={platformBusy}>Save</Button>
        </form>
        {platformSaved && <p className="text-sm text-brand-700 bg-brand-50 rounded-lg px-3 py-2 mt-3">Saved — takes effect immediately.</p>}
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold text-ink-900 mb-4">Support TELVO</h2>
        {!loaded ? (
          <p className="text-sm text-ink-400">Loading...</p>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <Input label="Support Number" value={momoNumber} onChange={(e) => setMomoNumber(e.target.value)} placeholder="653574256" />
            <Select label="Provider" value={provider} onChange={(e) => setProvider(e.target.value as 'MTN' | 'Orange')}>
              <option value="MTN">MTN Mobile Money</option>
              <option value="Orange">Orange Money</option>
            </Select>
            <Input label="Owner Name" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Desmond Henry" />
            <Textarea label="Support Message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Help us keep TELVO growing." />

            {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            {saved && <p className="text-sm text-brand-700 bg-brand-50 rounded-lg px-3 py-2">Saved — the Support page is now up to date.</p>}

            <Button type="submit" loading={busy} icon={<Save size={16} />}>Save</Button>
          </form>
        )}
      </Card>
    </div>
  );
}
