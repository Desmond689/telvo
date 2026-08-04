import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { DeleteAccountModal } from '@/components/shared/DeleteAccountModal';

const DEFAULT_PREFS = { jobs: true, messages: true, marketing: false };

// Used by customer, professional, and business dashboards. Notification
// preferences and language are real Firestore-backed settings now (not
// local-only state) - reload the page or log in on another device and they
// still hold.
export function AccountSettings() {
  const { profile, updateProfile, signOut } = useAuth();
  const { i18n } = useTranslation();
  const [notifPrefs, setNotifPrefs] = useState(DEFAULT_PREFS);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    if (profile?.notificationPrefs) {
      setNotifPrefs({ ...DEFAULT_PREFS, ...profile.notificationPrefs });
    }
  }, [profile?.notificationPrefs]);

  useEffect(() => {
    if (profile?.language && profile.language !== i18n.language) {
      i18n.changeLanguage(profile.language);
    }
    // Only run when the saved profile language changes, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.language]);

  const savePrefs = async (next: typeof notifPrefs) => {
    setNotifPrefs(next);
    setSaving(true);
    try {
      await updateProfile({ notificationPrefs: next });
      setSavedAt(Date.now());
    } finally {
      setSaving(false);
    }
  };

  const changeLanguage = async (lng: 'en' | 'fr') => {
    await i18n.changeLanguage(lng);
    try {
      await updateProfile({ language: lng });
    } catch {
      // Write failed - language still switches locally for this session.
    }
  };

  if (!profile) return null;

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold text-ink-900">Settings</h1>

      <Card className="p-6">
        <h2 className="font-semibold text-ink-900 mb-4">Notification Preferences</h2>
        <div className="space-y-3">
          {[
            { key: 'jobs', label: 'Job & quote updates' },
            { key: 'messages', label: 'New messages' },
            { key: 'marketing', label: 'Product updates & offers' },
          ].map((p) => (
            <label key={p.key} className="flex items-center justify-between text-sm text-ink-700">
              {p.label}
              <input
                type="checkbox"
                checked={(notifPrefs as any)[p.key]}
                onChange={(e) => savePrefs({ ...notifPrefs, [p.key]: e.target.checked })}
                disabled={saving}
                className="rounded border-ink-300 text-brand-500 focus:ring-brand-500"
              />
            </label>
          ))}
        </div>
        {savedAt && <p className="text-xs text-brand-600 mt-3">Saved ✓</p>}
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold text-ink-900 mb-2">Language</h2>
        <p className="text-sm text-ink-500 mb-3">Choose your preferred language</p>
        <select
          value={i18n.language?.startsWith('fr') ? 'fr' : 'en'}
          onChange={(e) => changeLanguage(e.target.value as 'en' | 'fr')}
          className="h-10 px-3 rounded-lg border border-ink-200 text-sm"
        >
          <option value="en">English</option>
          <option value="fr">Français</option>
        </select>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold text-ink-900 mb-2">Account</h2>
        <p className="text-sm text-ink-500 mb-4">Signed in as {profile.email || profile.phoneNumber}</p>
        <Button variant="outline" onClick={() => signOut()}>Sign out</Button>
      </Card>

      <Card className="p-6 border-red-100">
        <h2 className="font-semibold text-red-600 mb-2">Danger zone</h2>
        <p className="text-sm text-ink-500 mb-4">
          Permanently delete your account and profile. This can't be undone.
        </p>
        <Button variant="danger" onClick={() => setDeleteOpen(true)}>Delete account</Button>
      </Card>

      <DeleteAccountModal open={deleteOpen} onClose={() => setDeleteOpen(false)} />
    </div>
  );
}
