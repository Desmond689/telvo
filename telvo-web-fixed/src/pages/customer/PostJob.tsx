import type { FormEvent } from 'react';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Camera, X } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { useAuth } from '@/contexts/AuthContext';
import { createJobRequest } from '@/services/jobService';
import { uploadImage } from '@/services/storageService';
import { getCategories } from '@/services/categoryService';
import { useEffect } from 'react';
import type { JobUrgency, ServiceCategory } from '@/types';

export function PostJob() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);

  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [budget, setBudget] = useState('');
  const [urgency, setUrgency] = useState<JobUrgency>((params.get('urgency') as JobUrgency) || 'normal');
  const [scheduledDate, setScheduledDate] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string | null>(null);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [isQuoteRequest, setIsQuoteRequest] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getCategories().then(setCategories);
  }, []);

  useEffect(() => {
    const professionalId = params.get('professionalId');
    const businessId = params.get('businessId');
    setSelectedProfessionalId(professionalId || null);
    setSelectedBusinessId(businessId || null);
    setIsQuoteRequest(params.get('quote') === '1');
  }, [params]);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    setPhotos((prev) => [...prev, ...Array.from(files)].slice(0, 6));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setError('');
    setUploading(true);
    try {
      const photoUrls = await Promise.all(photos.map((f, i) => uploadImage(f, `jobs/${profile.id}/${Date.now()}_${i}_${f.name}`)));
      const jobId = await createJobRequest({
        customerId: profile.id,
        category,
        serviceType: category,
        title,
        description,
        address,
        budget: budget ? Number(budget) : undefined,
        urgency,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        photos: photoUrls,
        professionalId: selectedProfessionalId ?? undefined,
        businessId: selectedBusinessId ?? undefined,
      });
      setSuccess(true);
      setTimeout(() => navigate(`/dashboard/customer/jobs/${jobId}`), 1200);
    } catch (err: any) {
      setError(err?.message || 'Something went wrong posting your job. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (success) {
    return (
      <Card className="p-10 text-center max-w-lg mx-auto animate-scale-in">
        <div className="w-14 h-14 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-4">✓</div>
        <h2 className="text-lg font-bold text-ink-900">Job posted successfully</h2>
        <p className="text-sm text-ink-500 mt-2">Professionals in your area will start sending quotes shortly.</p>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-ink-900">Post a Job</h1>
      <p className="text-ink-500 mt-1 mb-6">Tell us what you need and get quotes from trusted professionals.</p>

      <form onSubmit={handleSubmit}>
        <Card className="p-6 space-y-5">
          {(selectedProfessionalId || selectedBusinessId) && (
            <div className="rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-700">
              {selectedProfessionalId && (
                <p>Request will be sent to the selected professional.</p>
              )}
              {selectedBusinessId && (
                <p>Request will be sent to the selected business.</p>
              )}
              {isQuoteRequest && <p>This is a quote request. Professionals will be notified accordingly.</p>}
            </div>
          )}

          <Select label="Service category" required value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Select a category</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name.en}</option>
            ))}
          </Select>
          <Input label="Job title" required placeholder="e.g. Fix leaking kitchen sink" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea label="Description" required placeholder="Describe the job in detail..." value={description} onChange={(e) => setDescription(e.target.value)} />
          <Input label="Location" required placeholder="Neighborhood, city" value={address} onChange={(e) => setAddress(e.target.value)} />

          <div className="grid grid-cols-2 gap-4">
            <Input label="Preferred date" type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
            <Input label="Budget (FCFA)" type="number" placeholder="Optional" value={budget} onChange={(e) => setBudget(e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-2">Urgency</label>
            <div className="grid grid-cols-3 gap-2">
              {(['normal', 'urgent', 'emergency'] as JobUrgency[]).map((u) => (
                <button
                  type="button"
                  key={u}
                  onClick={() => setUrgency(u)}
                  className={`py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                    urgency === u ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-ink-200 text-ink-500'
                  }`}
                >
                  {u === 'normal' ? 'Normal' : u === 'urgent' ? 'Urgent' : 'Need Help Fast'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-2">Photos (optional, up to 6)</label>
            <div className="flex flex-wrap gap-3">
              {photos.map((f, i) => (
                <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-ink-200">
                  <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setPhotos((p) => p.filter((_, idx) => idx !== i))} className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5">
                    <X size={10} />
                  </button>
                </div>
              ))}
              {photos.length < 6 && (
                <label className="w-16 h-16 rounded-lg border-2 border-dashed border-ink-200 flex items-center justify-center cursor-pointer hover:border-brand-500 text-ink-400">
                  <Camera size={20} />
                  <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
                </label>
              )}
            </div>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <Button type="submit" fullWidth loading={uploading} size="lg">Submit Job Request</Button>
        </Card>
      </form>
    </div>
  );
}
