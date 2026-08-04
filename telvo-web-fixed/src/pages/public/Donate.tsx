import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { Heart, ShieldCheck, Copy, Check } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Spinner } from '@/components/ui/Spinner';
import { createDonation } from '@/services/donationService';
import { getSupportSettings } from '@/services/settingsService';
import { formatXAF } from '@/utils/format';
import type { PaymentMethod, SupportSettings } from '@/types';

const PRESET_AMOUNTS = [1000, 2500, 5000, 10000, 25000];

export function Donate() {
  const [settings, setSettings] = useState<SupportSettings | null | undefined>(undefined);
  const [copied, setCopied] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState<number>(2500);
  const [customAmount, setCustomAmount] = useState('');
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getSupportSettings()
      .then(setSettings)
      .catch(() => setSettings(null));
  }, []);

  const finalAmount = customAmount ? Number(customAmount) : amount;
  const providerMethod: PaymentMethod = settings?.provider === 'Orange' ? 'orange_money' : 'mtn_momo';

  const handleCopy = async () => {
    if (!settings?.momoNumber) return;
    await navigator.clipboard.writeText(settings.momoNumber.replace(/\s+/g, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSentSupport = async () => {
    // Logs a record so the admin can see who says they've sent money and
    // reconcile it manually - mobile money can't be auto-confirmed just
    // from this page. Kept anonymous unless they fill in the optional form.
    setBusy(true);
    try {
      await createDonation({ donorName: donorName || 'Anonymous supporter', donorEmail: donorEmail || undefined, amount: finalAmount || 0, method: providerMethod, message: message || undefined, isAnonymous: !donorName });
      setDone(true);
    } catch {
      setError('Something went wrong recording your support. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handlePledgeSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!finalAmount || finalAmount < 500) {
      setError('Please enter an amount of at least 500 FCFA.');
      return;
    }
    if (!isAnonymous && !donorName.trim()) {
      setError('Please enter your name, or choose to donate anonymously.');
      return;
    }
    setBusy(true);
    try {
      await createDonation({ donorName, donorEmail: donorEmail || undefined, amount: finalAmount, method: providerMethod, message: message || undefined, isAnonymous });
      setDone(true);
    } catch {
      setError('Something went wrong submitting your donation. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="container-page py-20 max-w-md mx-auto text-center">
        <div className="w-14 h-14 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-4">
          <Heart size={24} className="fill-brand-500 text-brand-500" />
        </div>
        <h1 className="text-xl font-bold text-ink-900">Thank you for supporting TELVO</h1>
        <p className="text-sm text-ink-500 mt-2">
          Our team will verify your Mobile Money transfer and follow up if there's anything missing.
        </p>
      </div>
    );
  }

  return (
    <div className="container-page py-16">
      <div className="max-w-lg mx-auto text-center mb-10">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 text-brand-700 text-xs font-semibold px-3 py-1.5 mb-4">
          <Heart size={13} /> Support TELVO
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-ink-900">Building TELVO takes time, servers, and maintenance</h1>
        <p className="text-ink-500 mt-3">
          If you enjoy using TELVO, you can support the project directly through Mobile Money. Every contribution helps us verify more professionals and reach more communities.
        </p>
      </div>

      <div className="max-w-md mx-auto">
        <Card className="p-6 text-center">
          {settings === undefined && (
            <div className="py-10 flex justify-center"><Spinner /></div>
          )}

          {settings === null && (
            <p className="text-sm text-ink-500">Support details aren't available right now — please check back shortly.</p>
          )}

          {settings && (
            <>
              <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-2">{settings.provider} Mobile Money</p>
              <p className="text-3xl font-extrabold text-ink-900 tracking-wide">{settings.momoNumber}</p>
              <p className="text-sm text-ink-500 mt-1">Owner: {settings.ownerName}</p>
              {settings.message && <p className="text-sm text-ink-500 mt-4">{settings.message}</p>}

              <div className="mt-5 flex flex-col sm:flex-row gap-2">
                <Button variant="outline" fullWidth onClick={handleCopy} icon={copied ? <Check size={16} /> : <Copy size={16} />}>
                  {copied ? 'Number copied' : 'Copy Number'}
                </Button>
                <Button fullWidth loading={busy} onClick={handleSentSupport} icon={<Heart size={16} />}>
                  I've Sent Support
                </Button>
              </div>

              <p className="flex items-center gap-1.5 justify-center text-xs text-ink-400 mt-4">
                <ShieldCheck size={13} /> Mobile Money transfers are confirmed manually by our team.
              </p>

              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mt-3">{error}</p>}

              <button type="button" onClick={() => setShowForm((v) => !v)} className="text-xs text-brand-600 font-medium mt-5 hover:underline">
                {showForm ? 'Hide details' : "Want a receipt? Add your name and amount"}
              </button>
            </>
          )}
        </Card>

        {settings && showForm && (
          <Card className="p-6 mt-4 space-y-5">
            <form onSubmit={handlePledgeSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">Amount (FCFA)</label>
                <div className="grid grid-cols-3 gap-2">
                  {PRESET_AMOUNTS.map((a) => (
                    <button
                      type="button"
                      key={a}
                      onClick={() => { setAmount(a); setCustomAmount(''); }}
                      className={`py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                        !customAmount && amount === a ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-ink-200 text-ink-600'
                      }`}
                    >
                      {formatXAF(a)}
                    </button>
                  ))}
                </div>
                <Input
                  className="mt-2"
                  type="number"
                  placeholder="Or enter a custom amount"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                />
              </div>

              {!isAnonymous && (
                <>
                  <Input label="Your name" value={donorName} onChange={(e) => setDonorName(e.target.value)} placeholder="e.g. Achille Ndongo" />
                  <Input label="Email (optional, for a receipt)" type="email" value={donorEmail} onChange={(e) => setDonorEmail(e.target.value)} />
                </>
              )}
              <label className="flex items-center gap-2 text-sm text-ink-600">
                <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} className="rounded border-ink-300 text-brand-500 focus:ring-brand-500" />
                Donate anonymously
              </label>

              <Textarea label="Message (optional)" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Say a word of encouragement..." />

              <Button type="submit" fullWidth loading={busy} icon={<Heart size={16} />}>
                Record {formatXAF(finalAmount)} pledge
              </Button>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}
