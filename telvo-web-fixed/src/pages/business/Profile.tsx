import { useState } from 'react';
import { Camera } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { useAuth } from '@/contexts/AuthContext';
import { db, COLLECTIONS } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { uploadImage } from '@/services/storageService';
import { CAMEROON_CITIES } from '@/types';

export function BusinessProfileEdit() {
  const { profile } = useAuth();
  const [businessName, setBusinessName] = useState(profile?.businessName || '');
  const [businessDescription, setBusinessDescription] = useState(profile?.businessDescription || '');
  const [city, setCity] = useState(profile?.city || '');
  const [website, setWebsite] = useState(profile?.website || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!profile) return null;

  const handleLogo = async (file: File) => {
    const url = await uploadImage(file, `business-logos/${profile.id}_${Date.now()}`);
    await updateDoc(doc(db, COLLECTIONS.USERS, profile.id), { businessLogo: url });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, COLLECTIONS.USERS, profile.id), { businessName, businessDescription, city, website });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-ink-900 mb-6">Business Profile</h1>
      <Card className="p-6 space-y-5">
        <div className="flex items-center gap-4">
          <span className="w-20 h-20 rounded-2xl bg-brand-100 text-brand-700 flex items-center justify-center text-2xl font-bold overflow-hidden">
            {profile.businessLogo ? <img src={profile.businessLogo} className="w-full h-full object-cover" alt="" /> : businessName?.[0] || 'B'}
          </span>
          <label className="flex items-center gap-2 text-sm font-medium text-brand-600 cursor-pointer">
            <Camera size={15} /> Change logo
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleLogo(e.target.files[0])} />
          </label>
        </div>
        <Input label="Business name" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
        <Textarea label="Description" value={businessDescription} onChange={(e) => setBusinessDescription(e.target.value)} />
        <Select label="City" value={city} onChange={(e) => setCity(e.target.value)}>
          <option value="">Select city</option>
          {CAMEROON_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
        <Input label="Website" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" />
        <div className="flex items-center gap-3">
          <Button onClick={handleSave} loading={saving}>Save changes</Button>
          {saved && <span className="text-sm text-brand-600">Saved ✓</span>}
        </div>
      </Card>
    </div>
  );
}
