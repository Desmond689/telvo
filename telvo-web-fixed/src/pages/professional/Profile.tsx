import { useState } from 'react';
import { Camera } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/contexts/AuthContext';
import { db, COLLECTIONS } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { uploadImage } from '@/services/storageService';

export function ProfessionalProfileEdit() {
  const { profile } = useAuth();
  const [description, setDescription] = useState(profile?.description || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [submittingVerification, setSubmittingVerification] = useState(false);

  if (!profile) return null;

  const handlePhoto = async (file: File) => {
    const url = await uploadImage(file, `avatars/${profile.id}_${Date.now()}`);
    await updateDoc(doc(db, COLLECTIONS.USERS, profile.id), { profilePhoto: url });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, COLLECTIONS.USERS, profile.id), { description });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const submitVerification = async () => {
    if (!idFile || !selfieFile) return;
    setSubmittingVerification(true);
    try {
      // Documents are uploaded to a private storage path only readable by
      // the user and admins (see storage.rules in the main repo). They are
      // never exposed on the public profile.
      await uploadImage(idFile, `verification/${profile.id}/id_${Date.now()}`);
      await uploadImage(selfieFile, `verification/${profile.id}/selfie_${Date.now()}`);
      await updateDoc(doc(db, COLLECTIONS.USERS, profile.id), { verificationStatus: 'pending' });
    } finally {
      setSubmittingVerification(false);
    }
  };

  const verificationLabel = profile.isVerified ? 'Verified' : (profile as any).verificationStatus === 'pending' ? 'Pending review' : 'Not verified';

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold text-ink-900">Profile</h1>
      <Card className="p-6 space-y-5">
        <div className="flex items-center gap-4">
          <span className="w-20 h-20 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-2xl font-bold overflow-hidden">
            {profile.profilePhoto ? <img src={profile.profilePhoto} className="w-full h-full object-cover" alt="" /> : profile.fullName?.[0]}
          </span>
          <label className="flex items-center gap-2 text-sm font-medium text-brand-600 cursor-pointer">
            <Camera size={15} /> Change photo
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handlePhoto(e.target.files[0])} />
          </label>
        </div>
        <Textarea label="About you" value={description} onChange={(e) => setDescription(e.target.value)} />
        <div className="flex items-center gap-3">
          <Button onClick={handleSave} loading={saving}>Save changes</Button>
          {saved && <span className="text-sm text-brand-600">Saved ✓</span>}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-ink-900">Verification</h2>
          <Badge tone={profile.isVerified ? 'green' : 'amber'}>{verificationLabel}</Badge>
        </div>
        {!profile.isVerified && (
          <div className="space-y-4">
            <p className="text-sm text-ink-500">Submit an ID and a selfie to get your verified badge. Documents are private and only visible to TELVO's verification team.</p>
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Government ID</label>
              <input type="file" accept="image/*" onChange={(e) => setIdFile(e.target.files?.[0] || null)} className="text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Selfie</label>
              <input type="file" accept="image/*" onChange={(e) => setSelfieFile(e.target.files?.[0] || null)} className="text-sm" />
            </div>
            <Button disabled={!idFile || !selfieFile} loading={submittingVerification} onClick={submitVerification}>Submit for verification</Button>
          </div>
        )}
      </Card>
    </div>
  );
}
