import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { EmptyState } from '@/components/ui/EmptyState';
import { listenToDisputedJobs, resolveDispute } from '@/services/jobService';
import { getUserById } from '@/services/userService';
import type { Job, JobStatus, TelvoUser } from '@/types';
import { formatXAF, timeAgo } from '@/utils/format';
import { AlertTriangle, ShieldAlert } from 'lucide-react';

// Every job either party marks "disputed" (see DisputeModal on the customer
// and professional dashboards) lands here instead of silently stalling.
export function AdminDisputes() {
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [people, setPeople] = useState<Record<string, TelvoUser>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => listenToDisputedJobs(setJobs), []);

  useEffect(() => {
    if (!jobs) return;
    const ids = new Set<string>();
    jobs.forEach((j) => {
      ids.add(j.customerId);
      if (j.professionalId) ids.add(j.professionalId);
    });
    ids.forEach((id) => {
      if (!people[id]) getUserById(id).then((u) => u && setPeople((prev) => ({ ...prev, [id]: u })));
    });
  }, [jobs, people]);

  const handleResolve = async (job: Job, newStatus: JobStatus) => {
    const note = notes[job.id]?.trim();
    if (!note) return;
    setBusyId(job.id);
    try {
      await resolveDispute(job.id, note, newStatus);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <ShieldAlert size={22} className="text-red-600" />
        <h1 className="text-2xl font-bold text-ink-900">Disputes</h1>
      </div>
      <p className="text-sm text-ink-500 mb-6">Jobs flagged by a customer or professional, waiting on a decision.</p>

      {jobs === null && <p className="text-sm text-ink-400">Loading...</p>}
      {jobs?.length === 0 && (
        <EmptyState icon={<ShieldAlert size={36} />} title="No open disputes" description="Reported jobs will show up here for review." />
      )}

      <div className="space-y-4">
        {jobs?.map((job) => {
          const customer = people[job.customerId];
          const pro = job.professionalId ? people[job.professionalId] : undefined;
          const restoreTo = (job.previousStatus && job.previousStatus !== 'disputed' ? job.previousStatus : 'accepted') as JobStatus;
          return (
            <Card key={job.id} className="p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-semibold text-ink-900">{job.title || job.category}</p>
                  <p className="text-sm text-ink-500">{job.address}</p>
                  <p className="text-xs text-ink-400 mt-1">Reported {timeAgo(job.disputedAt)}</p>
                </div>
                {job.finalPrice && <p className="font-semibold text-ink-900">{formatXAF(job.finalPrice)}</p>}
              </div>

              <div className="flex items-start gap-2 mt-3 p-3 rounded-xl bg-red-50 text-red-700 text-sm">
                <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                <p>{job.disputeReason || 'No reason given.'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                <div>
                  <p className="text-ink-400 text-xs">Customer</p>
                  <p className="font-medium text-ink-900">{customer?.fullName || '...'}</p>
                </div>
                <div>
                  <p className="text-ink-400 text-xs">Professional</p>
                  <p className="font-medium text-ink-900">{pro?.fullName || '—'}</p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <Textarea
                  label="Resolution note (shown to both parties)"
                  value={notes[job.id] || ''}
                  onChange={(e) => setNotes((prev) => ({ ...prev, [job.id]: e.target.value }))}
                  placeholder="Explain the decision..."
                />
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" loading={busyId === job.id} disabled={!notes[job.id]?.trim()} onClick={() => handleResolve(job, restoreTo)}>
                    Reopen job
                  </Button>
                  <Button size="sm" variant="outline" loading={busyId === job.id} disabled={!notes[job.id]?.trim()} onClick={() => handleResolve(job, 'completed')}>
                    Mark completed
                  </Button>
                  <Button size="sm" variant="danger" loading={busyId === job.id} disabled={!notes[job.id]?.trim()} onClick={() => handleResolve(job, 'cancelled')}>
                    Cancel job
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
