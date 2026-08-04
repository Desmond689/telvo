import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { listenToCustomerJobs } from '@/services/jobService';
import type { Job } from '@/types';
import { jobStatusLabel, timeAgo, formatXAF } from '@/utils/format';
import { ClipboardList } from 'lucide-react';

const tabs = ['All', 'Active', 'Completed', 'Cancelled'] as const;

export function MyJobs() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [tab, setTab] = useState<(typeof tabs)[number]>('All');

  useEffect(() => {
    if (!profile) return;
    return listenToCustomerJobs(profile.id, setJobs);
  }, [profile]);

  const filtered = jobs?.filter((j) => {
    if (tab === 'All') return true;
    if (tab === 'Active') return !['completed', 'confirmed', 'paid', 'reviewed', 'cancelled'].includes(j.status);
    if (tab === 'Completed') return ['completed', 'confirmed', 'paid', 'reviewed'].includes(j.status);
    return j.status === 'cancelled';
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-ink-900">My Jobs</h1>
        <Button onClick={() => navigate('/dashboard/customer/post-job')}>Post a Job</Button>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              tab === t ? 'bg-brand-500 text-white' : 'bg-white text-ink-600 border border-ink-200'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {jobs === null && <p className="text-sm text-ink-400">Loading...</p>}

      {filtered && filtered.length === 0 && (
        <EmptyState
          icon={<ClipboardList size={40} />}
          title="No jobs here yet"
          description="Post a job and get quotes from trusted professionals near you."
          actionLabel="Post a Job"
          onAction={() => navigate('/dashboard/customer/post-job')}
        />
      )}

      <div className="space-y-3">
        {filtered?.map((j) => (
          <Card key={j.id} hover className="p-5 cursor-pointer" onClick={() => navigate(`/dashboard/customer/jobs/${j.id}`)}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-semibold text-ink-900 truncate">{j.title || j.category}</p>
                <p className="text-sm text-ink-500 mt-0.5">{j.address}</p>
                <p className="text-xs text-ink-400 mt-1">{timeAgo(j.createdAt)} · {j.quotes?.length || 0} quotes</p>
              </div>
              <div className="text-right flex-shrink-0">
                <Badge tone={j.status === 'posted' ? 'amber' : j.status === 'cancelled' ? 'red' : 'green'}>{jobStatusLabel(j.status)}</Badge>
                {j.finalPrice && <p className="text-sm font-semibold text-ink-900 mt-2">{formatXAF(j.finalPrice)}</p>}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
