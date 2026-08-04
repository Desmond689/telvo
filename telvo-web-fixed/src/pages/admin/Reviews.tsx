import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { StarRating } from '@/components/ui/StarRating';
import { getAllReviewsAdmin, setReviewHidden } from '@/services/reviewService';
import { getUserById } from '@/services/userService';
import type { Review, TelvoUser } from '@/types';
import { timeAgo } from '@/utils/format';
import { MessageSquareWarning, EyeOff, Eye } from 'lucide-react';

export function AdminReviews() {
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [people, setPeople] = useState<Record<string, TelvoUser>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => getAllReviewsAdmin().then(setReviews);
  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!reviews) return;
    const ids = new Set<string>();
    reviews.forEach((r) => { ids.add(r.reviewerId); ids.add(r.reviewedId); });
    ids.forEach((id) => {
      if (!people[id]) getUserById(id).then((u) => u && setPeople((prev) => ({ ...prev, [id]: u })));
    });
  }, [reviews, people]);

  const toggleHidden = async (r: Review) => {
    setBusyId(r.id);
    try {
      await setReviewHidden(r.id, !r.isHidden, !r.isHidden ? 'Removed by admin' : undefined);
      await load();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <MessageSquareWarning size={22} className="text-brand-600" />
        <h1 className="text-2xl font-bold text-ink-900">Reviews</h1>
      </div>
      <p className="text-sm text-ink-500 mb-6">Hide fraudulent or abusive reviews. Hidden reviews disappear from public profiles but aren't deleted.</p>

      {reviews === null && <p className="text-sm text-ink-400">Loading...</p>}
      {reviews?.length === 0 && <EmptyState icon={<MessageSquareWarning size={36} />} title="No reviews yet" description="Reviews will show up here as customers leave them." />}

      <div className="space-y-3">
        {reviews?.map((r) => (
          <Card key={r.id} className={`p-4 ${r.isHidden ? 'opacity-60' : ''}`}>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-ink-900">{people[r.reviewerId]?.fullName || '...'}</p>
                  <span className="text-ink-300">→</span>
                  <p className="font-medium text-ink-900">{people[r.reviewedId]?.fullName || '...'}</p>
                  {r.isHidden && <span className="text-xs text-red-600 bg-red-50 rounded-full px-2 py-0.5">Hidden</span>}
                </div>
                <StarRating rating={r.rating} size={13} />
                <p className="text-sm text-ink-600 mt-2 max-w-xl">{r.comment}</p>
                <p className="text-xs text-ink-400 mt-1">{timeAgo(r.createdAt)}</p>
              </div>
              <Button
                size="sm"
                variant={r.isHidden ? 'outline' : 'danger'}
                icon={r.isHidden ? <Eye size={14} /> : <EyeOff size={14} />}
                loading={busyId === r.id}
                onClick={() => toggleHidden(r)}
              >
                {r.isHidden ? 'Restore' : 'Hide'}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
