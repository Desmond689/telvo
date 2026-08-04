import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Briefcase, CheckCircle2, Wallet, Star } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/contexts/AuthContext';
import { listenToOpenRequestsForCategory, listenToProfessionalJobs } from '@/services/jobService';
import type { Job } from '@/types';
import { jobStatusLabel, timeAgo, formatXAF } from '@/utils/format';

export function ProfessionalOverview() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<Job[] | null>(null);
  const [myJobs, setMyJobs] = useState<Job[] | null>(null);

  useEffect(() => {
    if (!profile?.category) return;
    return listenToOpenRequestsForCategory(profile.category, profile.city, setRequests);
  }, [profile?.category, profile?.city]);

  useEffect(() => {
    if (!profile) return;
    return listenToProfessionalJobs(profile.id, setMyJobs);
  }, [profile]);

  const active = myJobs?.filter((j) => !['completed', 'confirmed', 'paid', 'reviewed', 'cancelled'].includes(j.status)) || [];
  const completed = myJobs?.filter((j) => ['completed', 'confirmed', 'paid', 'reviewed'].includes(j.status)) || [];
  const earnings = completed.reduce((sum, j) => sum + (j.finalPrice || 0) * 0.9, 0);

  if (!profile?.category) {
    return (
      <Card className="p-8 text-center max-w-md mx-auto">
        <h2 className="font-semibold text-ink-900">Complete your professional profile</h2>
        <p className="text-sm text-ink-500 mt-2">Finish onboarding to start receiving job requests.</p>
        <button onClick={() => navigate('/dashboard/professional/onboarding')} className="mt-4 text-brand-600 font-semibold hover:underline">Continue onboarding →</button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ink-900">Welcome back, {profile.fullName?.split(' ')[0]}</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'New Requests', value: requests?.length ?? '—', icon: FileText },
          { label: 'Active Jobs', value: active.length, icon: Briefcase },
          { label: 'Completed Jobs', value: completed.length, icon: CheckCircle2 },
          { label: 'Avg. Rating', value: (profile.rating || 0).toFixed(1), icon: Star },
        ].map((s) => (
          <Card key={s.label} className="p-5">
            <s.icon size={18} className="text-brand-500" />
            <p className="text-2xl font-bold text-ink-900 mt-3">{s.value}</p>
            <p className="text-sm text-ink-500">{s.label}</p>
          </Card>
        ))}
      </div>

      <Card className="p-6 bg-brand-500 border-0">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 text-white">
            <Wallet size={22} />
            <div>
              <p className="text-sm text-brand-50">Total earnings (after 10% platform fee)</p>
              <p className="text-2xl font-bold">{formatXAF(earnings)}</p>
            </div>
          </div>
          <button onClick={() => navigate('/dashboard/professional/earnings')} className="text-sm font-semibold text-white underline">View details</button>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-ink-900">New Job Requests</h2>
          <button onClick={() => navigate('/dashboard/professional/requests')} className="text-sm text-brand-600 font-medium">View all</button>
        </div>
        {requests === null && <p className="text-sm text-ink-400">Loading...</p>}
        {requests?.length === 0 && <p className="text-sm text-ink-400">No new requests in your category right now.</p>}
        {requests?.slice(0, 5).map((j) => (
          <button key={j.id} onClick={() => navigate(`/dashboard/professional/requests/${j.id}`)} className="w-full flex items-center justify-between py-3 border-b border-ink-100 last:border-0 text-left hover:bg-ink-50 -mx-2 px-2 rounded-lg">
            <div className="min-w-0">
              <p className="font-medium text-ink-900 truncate">{j.title || j.category}</p>
              <p className="text-xs text-ink-400">{j.address} · {timeAgo(j.createdAt)}</p>
            </div>
            <Badge tone="amber">{jobStatusLabel(j.status)}</Badge>
          </button>
        ))}
      </Card>
    </div>
  );
}
