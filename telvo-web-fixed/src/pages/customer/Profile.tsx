import { useState } from 'react';
import { Camera } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useAuth } from '@/contexts/AuthContext';
import { db, COLLECTIONS } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { uploadImage } from '@/services/storageService';
import { CAMEROON_CITIES } from '@/types';

export function CustomerProfile() {
  const { profile } = useAuth();
  const [fullName, setFullName] = useState(profile?.fullName || '');
  const [city, setCity] = useState(profile?.city || '');
  const [neighborhood, setNeighborhood] = useState(profile?.neighborhood || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!profile) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, COLLECTIONS.USERS, profile.id), { fullName, city, neighborhood });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handlePhoto = async (file: File) => {
    const url = await uploadImage(file, `avatars/${profile.id}_${Date.now()}`);
    await updateDoc(doc(db, COLLECTIONS.USERS, profile.id), { profilePhoto: url });
  };

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-ink-900 mb-6">Profile</h1>
      <Card className="p-6 space-y-5">
        <div className="flex items-center gap-4">
          <span className="w-20 h-20 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-2xl font-bold overflow-hidden relative">
            {profile.profilePhoto ? <img src={profile.profilePhoto} className="w-full h-full object-cover" alt="" /> : profile.fullName?.[0]}
          </span>
          <label className="flex items-center gap-2 text-sm font-medium text-brand-600 cursor-pointer">
            <Camera size={15} /> Change photo
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handlePhoto(e.target.files[0])} />
          </label>
        </div>
        <Input label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <Input label="Email" value={profile.email || ''} disabled hint="Contact support to change your email" />
        <Select label="City" value={city} onChange={(e) => setCity(e.target.value)}>
          <option value="">Select city</option>
          {CAMEROON_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
        <Input label="Neighborhood" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} />
        <div className="flex items-center gap-3">
          <Button onClick={handleSave} loading={saving}>Save changes</Button>
          {saved && <span className="text-sm text-brand-600">Saved ✓</span>}
        </div>
      </Card>
    </div>
  );
}
