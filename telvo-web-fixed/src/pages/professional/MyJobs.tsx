import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { DisputeModal } from '@/components/shared/DisputeModal';
import { useAuth } from '@/contexts/AuthContext';
import { listenToProfessionalJobs, updateJobStatus } from '@/services/jobService';
import type { Job, JobStatus } from '@/types';
import { jobStatusLabel, formatXAF } from '@/utils/format';
import { Briefcase, Flag } from 'lucide-react';

const NEXT_STATUS: Partial<Record<JobStatus, { next: JobStatus; label: string }>> = {
  accepted: { next: 'scheduled', label: 'Mark as Scheduled' },
  scheduled: { next: 'on_the_way', label: "I'm On The Way" },
  on_the_way: { next: 'in_progress', label: 'Start Work' },
  in_progress: { next: 'completed', label: 'Mark Completed' },
};

export function ProfessionalMyJobs() {
  const { profile } = useAuth();
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [disputeJob, setDisputeJob] = useState<Job | null>(null);

  useEffect(() => {
    if (!profile) return;
    return listenToProfessionalJobs(profile.id, setJobs);
  }, [profile]);

  const handleAdvance = async (job: Job) => {
    const step = NEXT_STATUS[job.status];
    if (!step) return;
    setBusyId(job.id);
    try {
      await updateJobStatus(job.id, step.next);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900 mb-6">My Jobs</h1>
      {jobs === null && <p className="text-sm text-ink-400">Loading...</p>}
      {jobs?.length === 0 && <EmptyState icon={<Briefcase size={36} />} title="No jobs yet" description="Accepted quotes will turn into jobs here." />}
      <div className="space-y-3">
        {jobs?.map((j) => {
          const step = NEXT_STATUS[j.status];
          const canDispute = !['posted', 'disputed', 'cancelled'].includes(j.status) && !j.resolutionNote;
          return (
            <Card key={j.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-ink-900">{j.title || j.category}</p>
                  <p className="text-sm text-ink-500">{j.address}</p>
                </div>
                <div className="text-right">
                  <Badge tone={j.status === 'disputed' ? 'red' : 'green'}>{jobStatusLabel(j.status)}</Badge>
                  {j.finalPrice && <p className="text-sm font-semibold text-ink-900 mt-2">{formatXAF(j.finalPrice)}</p>}
                </div>
              </div>
              {j.status === 'disputed' && j.disputeReason && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mt-3">Under review: {j.disputeReason}</p>
              )}
              <div className="flex items-center gap-4 mt-4">
                {step && (
                  <Button size="sm" loading={busyId === j.id} onClick={() => handleAdvance(j)}>
                    {step.label}
                  </Button>
                )}
                {canDispute && (
                  <button
                    onClick={() => setDisputeJob(j)}
                    className="inline-flex items-center gap-1.5 text-xs text-ink-400 hover:text-red-600"
                  >
                    <Flag size={12} /> Report a problem
                  </button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {profile && disputeJob && (
        <DisputeModal job={disputeJob} userId={profile.id} open={!!disputeJob} onClose={() => setDisputeJob(null)} />
      )}
    </div>
  );
}
