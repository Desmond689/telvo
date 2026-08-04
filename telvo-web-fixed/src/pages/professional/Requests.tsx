import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { listenToOpenRequestsForCategory } from '@/services/jobService';
import type { Job } from '@/types';
import { timeAgo, formatXAF } from '@/utils/format';
import { Inbox } from 'lucide-react';

export function Requests() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[] | null>(null);

  useEffect(() => {
    if (!profile?.category) return;
    return listenToOpenRequestsForCategory(profile.category, profile.city, setJobs);
  }, [profile?.category, profile?.city]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900 mb-1">Job Requests</h1>
      <p className="text-ink-500 mb-6">Open requests matching your category: {profile?.category}</p>

      {jobs === null && <p className="text-sm text-ink-400">Loading...</p>}
      {jobs?.length === 0 && <EmptyState icon={<Inbox size={36} />} title="No open requests right now" description="We'll notify you the moment a new job matches your skills." />}

      <div className="space-y-3">
        {jobs?.map((j) => (
          <Card key={j.id} hover className="p-5 cursor-pointer" onClick={() => navigate(`/dashboard/professional/requests/${j.id}`)}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-ink-900">{j.title || j.category}</p>
                <p className="text-sm text-ink-500 mt-0.5">{j.address}</p>
                <p className="text-sm text-ink-600 mt-2 line-clamp-2">{j.description}</p>
                <p className="text-xs text-ink-400 mt-2">{timeAgo(j.createdAt)}</p>
              </div>
              <div className="text-right flex-shrink-0">
                {j.urgency === 'emergency' && <Badge tone="red">Need Help Fast</Badge>}
                {j.urgency === 'urgent' && <Badge tone="amber">Urgent</Badge>}
                {j.budget && <p className="text-sm font-semibold text-ink-900 mt-2">{formatXAF(j.budget)}</p>}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
