import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { PageSpinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { useAuth } from '@/contexts/AuthContext';
import { getJob, submitQuote } from '@/services/jobService';
import type { Job } from '@/types';
import { formatXAF, timeAgo } from '@/utils/format';

export function SendQuote() {
  const { id } = useParams();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null | undefined>(undefined);
  const [price, setPrice] = useState('');
  const [materialsCost, setMaterialsCost] = useState('');
  const [laborCost, setLaborCost] = useState('');
  const [duration, setDuration] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!id) return;
    getJob(id).then(setJob);
  }, [id]);

  if (job === undefined) return <PageSpinner />;
  if (job === null) return <ErrorState message="This job request could not be found." />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setBusy(true);
    try {
      await submitQuote(job.id, {
        professionalId: profile.id,
        price: Number(price),
        materialsCost: materialsCost ? Number(materialsCost) : undefined,
        laborCost: laborCost ? Number(laborCost) : undefined,
        estimatedDuration: duration,
        message,
      });
      setSent(true);
      setTimeout(() => navigate('/dashboard/professional/requests'), 1200);
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <Card className="p-10 text-center max-w-lg mx-auto">
        <div className="w-14 h-14 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-4">✓</div>
        <h2 className="text-lg font-bold text-ink-900">Quote sent</h2>
        <p className="text-sm text-ink-500 mt-2">The customer will be notified and can now compare your offer.</p>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="p-6">
        <h1 className="text-xl font-bold text-ink-900">{job.title || job.category}</h1>
        <p className="text-sm text-ink-500 mt-1 flex items-center gap-1"><MapPin size={13} /> {job.address}</p>
        <p className="text-sm text-ink-600 mt-3">{job.description}</p>
        <p className="text-xs text-ink-400 mt-2 flex items-center gap-1"><Calendar size={12} /> Posted {timeAgo(job.createdAt)}</p>
      </Card>

      <form onSubmit={handleSubmit}>
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-ink-900">Your Quote</h2>
          <Input label="Total price (FCFA)" type="number" required value={price} onChange={(e) => setPrice(e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Materials cost (optional)" type="number" value={materialsCost} onChange={(e) => setMaterialsCost(e.target.value)} />
            <Input label="Labor cost (optional)" type="number" value={laborCost} onChange={(e) => setLaborCost(e.target.value)} />
          </div>
          <Input label="Estimated duration" required placeholder="e.g. 2-3 hours" value={duration} onChange={(e) => setDuration(e.target.value)} />
          <Textarea label="Message to customer" required value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Explain your approach and what's included..." />
          {price && <p className="text-xs text-ink-400">Customer sees: {formatXAF(Number(price))}</p>}
          <Button type="submit" fullWidth loading={busy}>Send Quote</Button>
        </Card>
      </form>
    </div>
  );
}
