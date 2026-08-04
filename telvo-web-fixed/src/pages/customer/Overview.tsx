import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, ClipboardList, FileText, CheckCircle2, MessageCircle, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/contexts/AuthContext';
import { listenToCustomerJobs } from '@/services/jobService';
import type { Job } from '@/types';
import { jobStatusLabel, timeAgo } from '@/utils/format';

export function CustomerOverview() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[] | null>(null);

  useEffect(() => {
    if (!profile) return;
    const unsub = listenToCustomerJobs(profile.id, setJobs);
    return unsub;
  }, [profile]);

  const active = jobs?.filter((j) => !['completed', 'confirmed', 'paid', 'reviewed', 'cancelled'].includes(j.status)) || [];
  const pendingRequests = jobs?.filter((j) => j.status === 'posted') || [];
  const quotesReceived = jobs?.reduce((sum, j) => sum + (j.quotes?.length || 0), 0) || 0;
  const completed = jobs?.filter((j) => ['completed', 'confirmed', 'paid', 'reviewed'].includes(j.status)) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Welcome back, {profile?.fullName?.split(' ')[0]}</h1>
          <p className="text-ink-500 mt-1">Here's what's happening with your jobs</p>
        </div>
        <Button size="lg" variant="danger" icon={<Zap size={16} />} onClick={() => navigate('/dashboard/customer/post-job?urgency=emergency')}>
          Need Help Fast?
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Active Jobs', value: active.length, icon: ClipboardList },
          { label: 'Pending Requests', value: pendingRequests.length, icon: FileText },
          { label: 'Quotes Received', value: quotesReceived, icon: MessageCircle },
          { label: 'Completed Jobs', value: completed.length, icon: CheckCircle2 },
        ].map((s) => (
          <Card key={s.label} className="p-5">
            <s.icon size={18} className="text-brand-500" />
            <p className="text-2xl font-bold text-ink-900 mt-3">{jobs === null ? '—' : s.value}</p>
            <p className="text-sm text-ink-500">{s.label}</p>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-ink-900">Recent Jobs</h2>
          <button onClick={() => navigate('/dashboard/customer/jobs')} className="text-sm text-brand-600 font-medium flex items-center gap-1 hover:text-brand-700">
            View all <ArrowRight size={14} />
          </button>
        </div>
        {jobs === null && <p className="text-sm text-ink-400">Loading...</p>}
        {jobs && jobs.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-ink-500">You haven't posted any jobs yet.</p>
            <Button className="mt-4" onClick={() => navigate('/dashboard/customer/post-job')}>Post a Job</Button>
          </div>
        )}
        {jobs && jobs.slice(0, 5).map((j) => (
          <button
            key={j.id}
            onClick={() => navigate(`/dashboard/customer/jobs/${j.id}`)}
            className="w-full flex items-center justify-between py-3 border-b border-ink-100 last:border-0 text-left hover:bg-ink-50 -mx-2 px-2 rounded-lg transition-colors"
          >
            <div className="min-w-0">
              <p className="font-medium text-ink-900 truncate">{j.title || j.category}</p>
              <p className="text-xs text-ink-400">{timeAgo(j.createdAt)}</p>
            </div>
            <Badge tone={j.status === 'posted' ? 'amber' : j.status === 'cancelled' ? 'red' : 'green'}>{jobStatusLabel(j.status)}</Badge>
          </button>
        ))}
      </Card>
    </div>
  );
}
