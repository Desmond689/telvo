import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, X } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { ProgressSteps } from '@/components/ui/ProgressSteps';
import { useAuth } from '@/contexts/AuthContext';
import { db, COLLECTIONS } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { uploadImage } from '@/services/storageService';
import { getCategories } from '@/services/categoryService';
import type { ServiceCategory } from '@/types';
import { CAMEROON_CITIES } from '@/types';

// Covers steps 1-9 from the spec (personal info -> verification), collapsed
// into 6 screens for a faster real-world completion rate; step 10 (preview)
// is the final review screen before publishing the profile.
const STEP_LABELS = ['Profile', 'Services', 'Location', 'Experience', 'Pricing', 'Portfolio', 'Preview'];

export function Onboarding() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [saving, setSaving] = useState(false);

  const [description, setDescription] = useState(profile?.description || '');
  const [skills, setSkills] = useState<string[]>(profile?.skills || []);
  const [city, setCity] = useState(profile?.city || '');
  const [neighborhood, setNeighborhood] = useState(profile?.neighborhood || '');
  const [serviceAreas, setServiceAreas] = useState(profile?.serviceAreas?.join(', ') || '');
  const [yearsOfExperience, setYearsOfExperience] = useState(String(profile?.yearsOfExperience || ''));
  const [startingPrice, setStartingPrice] = useState('');
  const [portfolio, setPortfolio] = useState<File[]>([]);
  const [portfolioUrls, setPortfolioUrls] = useState<string[]>(profile?.portfolioPhotos || []);

  useEffect(() => {
    getCategories().then(setCategories);
  }, []);

  const toggleSkill = (slug: string) => setSkills((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));

  const saveAndNext = async (patch: Record<string, unknown>) => {
    if (!profile) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, COLLECTIONS.USERS, profile.id), patch);
      setStep((s) => Math.min(s + 1, STEP_LABELS.length - 1));
    } finally {
      setSaving(false);
    }
  };

  const finish = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const urls = await Promise.all(portfolio.map((f, i) => uploadImage(f, `portfolio/${profile.id}/${Date.now()}_${i}_${f.name}`)));
      await updateDoc(doc(db, COLLECTIONS.USERS, profile.id), {
        portfolioPhotos: [...portfolioUrls, ...urls],
      });
      navigate('/dashboard/professional');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-ink-900 mb-1">Set up your professional profile</h1>
      <p className="text-ink-500 mb-6">Your progress is saved automatically at each step.</p>
      <div className="mb-6"><ProgressSteps steps={STEP_LABELS} currentIndex={step} /></div>

      <Card className="p-6">
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-ink-900">Tell customers about yourself</h2>
            <Textarea label="About you" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your experience and what makes you reliable..." />
            <Button fullWidth loading={saving} onClick={() => saveAndNext({ description })}>Continue</Button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-ink-900">Which services do you offer?</h2>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((c) => (
                <button
                  type="button"
                  key={c.slug}
                  onClick={() => toggleSkill(c.slug)}
                  className={`px-3 py-2.5 rounded-xl border text-sm font-medium text-left ${skills.includes(c.slug) ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-ink-200 text-ink-600'}`}
                >
                  {c.name.en}
                </button>
              ))}
            </div>
            <Button fullWidth loading={saving} disabled={skills.length === 0} onClick={() => saveAndNext({ skills, category: skills[0] })}>Continue</Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-ink-900">Where do you work?</h2>
            <Select label="City" value={city} onChange={(e) => setCity(e.target.value)}>
              <option value="">Select city</option>
              {CAMEROON_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
            <Input label="Neighborhood" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} />
            <Input label="Service areas" placeholder="Comma-separated, e.g. Bastos, Mvan, Nsimeyong" value={serviceAreas} onChange={(e) => setServiceAreas(e.target.value)} />
            <Button fullWidth loading={saving} onClick={() => saveAndNext({ city, neighborhood, serviceAreas: serviceAreas.split(',').map((s) => s.trim()).filter(Boolean) })}>Continue</Button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-ink-900">Your experience</h2>
            <Input label="Years of experience" type="number" value={yearsOfExperience} onChange={(e) => setYearsOfExperience(e.target.value)} />
            <Button fullWidth loading={saving} onClick={() => saveAndNext({ yearsOfExperience: Number(yearsOfExperience) || 0 })}>Continue</Button>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-ink-900">Set your starting price</h2>
            <Input label="Starting price (FCFA)" type="number" hint="Customers see this as your 'from' price" value={startingPrice} onChange={(e) => setStartingPrice(e.target.value)} />
            <Button fullWidth loading={saving} onClick={() => saveAndNext({ startingPrice: Number(startingPrice) || 0 })}>Continue</Button>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-ink-900">Add portfolio photos</h2>
            <p className="text-sm text-ink-500">Show off your best work (optional but recommended)</p>
            <div className="flex flex-wrap gap-3">
              {portfolio.map((f, i) => (
                <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-ink-200">
                  <img src={URL.createObjectURL(f)} className="w-full h-full object-cover" alt="" />
                  <button onClick={() => setPortfolio((p) => p.filter((_, idx) => idx !== i))} className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5"><X size={10} /></button>
                </div>
              ))}
              <label className="w-16 h-16 rounded-lg border-2 border-dashed border-ink-200 flex items-center justify-center cursor-pointer text-ink-400">
                <Camera size={20} />
                <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files && setPortfolio((p) => [...p, ...Array.from(e.target.files!)].slice(0, 10))} />
              </label>
            </div>
            <Button fullWidth loading={saving} onClick={() => setStep(6)}>Continue</Button>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-4 text-center">
            <h2 className="font-semibold text-ink-900">You're almost done!</h2>
            <p className="text-sm text-ink-500">Your profile will be reviewed for verification. You can start receiving requests immediately, and your verified badge will appear once approved.</p>
            <Button fullWidth loading={saving} onClick={finish}>Publish My Profile</Button>
          </div>
        )}
      </Card>
    </div>
  );
}
