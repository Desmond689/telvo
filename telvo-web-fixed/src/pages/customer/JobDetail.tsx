import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Calendar, MessageCircle, Star, Flag } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageSpinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { Modal } from '@/components/ui/Modal';
import { StarRating } from '@/components/ui/StarRating';
import { Textarea } from '@/components/ui/Textarea';
import { DisputeModal } from '@/components/shared/DisputeModal';
import { useAuth } from '@/contexts/AuthContext';
import { listenToJob, acceptQuote } from '@/services/jobService';
import { getUserById } from '@/services/userService';
import { submitReview, hasReviewedJob } from '@/services/reviewService';
import { ensureChatThread } from '@/services/chatService';
import type { Job, Quote, TelvoUser } from '@/types';
import { JOB_STATUS_ORDER } from '@/types';
import { jobStatusLabel, formatXAF, timeAgo } from '@/utils/format';
import { ProgressSteps } from '@/components/ui/ProgressSteps';

export function JobDetail() {
  const { id } = useParams();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null | undefined>(undefined);
  const [quoters, setQuoters] = useState<Record<string, TelvoUser>>({});
  const [reviewOpen, setReviewOpen] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    return listenToJob(id, setJob);
  }, [id]);

  useEffect(() => {
    if (!job?.quotes?.length) return;
    Promise.all(job.quotes.map((q) => getUserById(q.professionalId))).then((users) => {
      const map: Record<string, TelvoUser> = {};
      users.forEach((u) => u && (map[u.id] = u));
      setQuoters(map);
    });
  }, [job?.quotes]);

  useEffect(() => {
    if (job?.status && ['completed', 'confirmed', 'paid', 'reviewed'].includes(job.status) && profile) {
      hasReviewedJob(job.id, profile.id).then(setAlreadyReviewed);
    }
  }, [job?.status, job?.id, profile]);

  if (job === undefined) return <PageSpinner />;
  if (job === null) return <ErrorState message="This job could not be found." />;

  const currentIndex = JOB_STATUS_ORDER.indexOf(job.status);

  const handleAccept = async (q: Quote) => {
    setBusy(true);
    try {
      await acceptQuote(job.id, q);
    } finally {
      setBusy(false);
    }
  };

  const handleMessage = async (professionalId: string) => {
    if (!profile) return;
    await ensureChatThread(profile.id, professionalId, job.id);
    navigate(`/dashboard/customer/messages?with=${professionalId}`);
  };

  const handleReview = async () => {
    if (!profile || !job.professionalId) return;
    setBusy(true);
    try {
      await submitReview({ jobId: job.id, reviewerId: profile.id, reviewedId: job.professionalId, rating, comment });
      setAlreadyReviewed(true);
      setReviewOpen(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card className="p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-ink-900">{job.title || job.category}</h1>
            <p className="text-sm text-ink-500 mt-1 flex items-center gap-1"><MapPin size={13} /> {job.address}</p>
          </div>
          <Badge tone={job.status === 'disputed' ? 'red' : 'green'}>{jobStatusLabel(job.status)}</Badge>
        </div>

        {job.status === 'disputed' && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 text-red-700 text-sm">
            <p className="font-medium">This job is under review by TELVO's team.</p>
            {job.disputeReason && <p className="mt-1">Reported issue: {job.disputeReason}</p>}
          </div>
        )}
        {job.resolutionNote && job.status !== 'disputed' && (
          <div className="mt-4 p-3 rounded-xl bg-brand-50 text-brand-700 text-sm">
            <p className="font-medium">Resolved by TELVO's team.</p>
            <p className="mt-1">{job.resolutionNote}</p>
          </div>
        )}

        {currentIndex >= 0 && job.status !== 'cancelled' && (
          <div className="mt-6 overflow-x-auto">
            <ProgressSteps steps={JOB_STATUS_ORDER.map(jobStatusLabel)} currentIndex={currentIndex} />
          </div>
        )}

        <p className="text-sm text-ink-600 mt-6 leading-relaxed">{job.description}</p>
        {job.photos?.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-4">
            {job.photos.map((p, i) => <img key={i} src={p} className="rounded-lg aspect-square object-cover" alt="" />)}
          </div>
        )}
        <div className="flex items-center gap-4 mt-4 text-sm text-ink-400">
          {job.scheduledDate && <span className="flex items-center gap-1"><Calendar size={13} /> {timeAgo(job.scheduledDate)}</span>}
          {job.budget && <span>Budget: {formatXAF(job.budget)}</span>}
        </div>
      </Card>

      {job.status === 'posted' || job.status === 'quoted' ? (
        <Card className="p-6">
          <h2 className="font-semibold text-ink-900 mb-4">Quotes ({job.quotes?.length || 0})</h2>
          {(!job.quotes || job.quotes.length === 0) && <p className="text-sm text-ink-400">No quotes yet. Professionals will send offers soon.</p>}
          <div className="space-y-4">
            {job.quotes?.map((q) => {
              const pro = quoters[q.professionalId];
              return (
                <div key={q.id} className="border border-ink-100 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm">
                        {pro?.fullName?.[0] || '?'}
                      </span>
                      <div>
                        <p className="font-medium text-ink-900">{pro?.fullName || 'Professional'}</p>
                        {pro && <StarRating rating={pro.rating || 0} size={12} />}
                      </div>
                    </div>
                    <p className="font-bold text-ink-900">{formatXAF(q.price)}</p>
                  </div>
                  <p className="text-sm text-ink-600 mt-3">{q.message}</p>
                  <p className="text-xs text-ink-400 mt-1">Estimated: {q.estimatedDuration}</p>
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" onClick={() => handleAccept(q)} loading={busy}>Accept</Button>
                    <Button size="sm" variant="outline" icon={<MessageCircle size={14} />} onClick={() => handleMessage(q.professionalId)}>Ask Question</Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ) : null}

      {job.professionalId && !['posted', 'quoted'].includes(job.status) && (
        <Card className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-ink-500">Assigned professional</p>
            <p className="font-semibold text-ink-900">{quoters[job.professionalId]?.fullName || 'Loading...'}</p>
          </div>
          <Button variant="outline" icon={<MessageCircle size={14} />} onClick={() => handleMessage(job.professionalId!)}>Message</Button>
        </Card>
      )}

      {['completed', 'confirmed', 'paid'].includes(job.status) && !alreadyReviewed && (
        <Card className="p-6 text-center">
          <Star className="mx-auto text-brand-500 mb-2" size={24} />
          <p className="font-semibold text-ink-900">How was your experience?</p>
          <Button className="mt-4" onClick={() => setReviewOpen(true)}>Leave a Review</Button>
        </Card>
      )}

      {profile && !['posted', 'disputed', 'cancelled'].includes(job.status) && !job.resolutionNote && (
        <div className="text-center">
          <button
            onClick={() => setDisputeOpen(true)}
            className="inline-flex items-center gap-1.5 text-sm text-ink-400 hover:text-red-600"
          >
            <Flag size={13} /> Report a problem with this job
          </button>
        </div>
      )}

      <Modal open={reviewOpen} onClose={() => setReviewOpen(false)} title="Rate your professional">
        <div className="space-y-4">
          <div className="flex justify-center">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setRating(n)}>
                <Star size={32} className={n <= rating ? 'fill-brand-500 text-brand-500' : 'fill-ink-100 text-ink-100'} />
              </button>
            ))}
          </div>
          <Textarea label="Comment" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share details about your experience..." />
          <Button fullWidth onClick={handleReview} loading={busy}>Submit Review</Button>
        </div>
      </Modal>

      {profile && (
        <DisputeModal job={job} userId={profile.id} open={disputeOpen} onClose={() => setDisputeOpen(false)} />
      )}
    </div>
  );
}
