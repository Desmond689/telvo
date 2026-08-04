import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Phone, Globe, Clock } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StarRating } from '@/components/ui/StarRating';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { PageSpinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { getUserById } from '@/services/userService';
import { getReviewsForUser } from '@/services/reviewService';
import type { TelvoUser, Review } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export function BusinessProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile: me } = useAuth();
  const [biz, setBiz] = useState<TelvoUser | null | undefined>(undefined);
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    if (!id) return;
    getUserById(id).then((u) => {
      setBiz(u);
      if (u) getReviewsForUser(u.id).then(setReviews);
    });
  }, [id]);

  if (biz === undefined) return <PageSpinner />;
  if (biz === null) return <div className="container-page py-16"><ErrorState message="This business profile doesn't exist or is no longer available." /></div>;

  return (
    <div className="container-page py-8 max-w-5xl">
      <Card className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row gap-6">
          <span className="w-24 h-24 rounded-2xl bg-brand-100 text-brand-700 flex items-center justify-center text-2xl font-bold overflow-hidden flex-shrink-0">
            {biz.businessLogo ? <img src={biz.businessLogo} alt={biz.businessName} className="w-full h-full object-cover" /> : biz.businessName?.[0]}
          </span>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-ink-900">{biz.businessName || biz.fullName}</h1>
              {biz.isVerified && <VerifiedBadge size={18} />}
            </div>
            <p className="text-ink-500 mt-1">{biz.businessCategory || 'Business'}</p>
            <div className="flex items-center gap-4 mt-3 flex-wrap text-sm text-ink-500">
              <span className="flex items-center gap-1"><MapPin size={14} /> {biz.city || 'Cameroon'}</span>
              {biz.phoneNumber && <span className="flex items-center gap-1"><Phone size={14} /> {biz.phoneNumber}</span>}
              {biz.website && <a href={biz.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-brand-600"><Globe size={14} /> Website</a>}
            </div>
            <div className="mt-3"><StarRating rating={biz.rating || 0} count={reviews.length} /></div>
          </div>
          <div className="flex sm:flex-col gap-2 sm:w-44">
            <Button fullWidth variant="ghost" onClick={() => (me ? navigate(`/dashboard/customer/messages?with=${biz.id}`) : navigate('/login'))}>Message</Button>
            <Button fullWidth onClick={() => navigate(`/dashboard/customer/post-job?businessId=${biz.id}`)}>Request Service</Button>
            <Button fullWidth variant="outline" onClick={() => navigate(`/dashboard/customer/post-job?businessId=${biz.id}&quote=1`)}>Get Quote</Button>
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 space-y-6">
          {biz.businessDescription && (
            <Card className="p-6">
              <h2 className="font-semibold text-ink-900 mb-2">About</h2>
              <p className="text-sm text-ink-600 leading-relaxed">{biz.businessDescription}</p>
            </Card>
          )}
          {biz.portfolioPhotos && biz.portfolioPhotos.length > 0 && (
            <Card className="p-6">
              <h2 className="font-semibold text-ink-900 mb-3">Photos</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {biz.portfolioPhotos.map((url, i) => (
                  <img key={i} src={url} alt="" className="rounded-xl aspect-square object-cover" loading="lazy" />
                ))}
              </div>
            </Card>
          )}
          <Card className="p-6">
            <h2 className="font-semibold text-ink-900 mb-4">Reviews ({reviews.length})</h2>
            {reviews.length === 0 ? (
              <p className="text-sm text-ink-400">No reviews yet.</p>
            ) : (
              <div className="space-y-5">
                {reviews.slice(0, 10).map((r) => (
                  <div key={r.id} className="border-b border-ink-100 pb-5 last:border-0">
                    <StarRating rating={r.rating} showValue={false} size={13} />
                    <p className="text-sm text-ink-600 mt-2">{r.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
        <div className="space-y-6">
          {biz.openingHours && (
            <Card className="p-6">
              <h3 className="font-semibold text-ink-900 mb-3 flex items-center gap-2"><Clock size={16} /> Opening Hours</h3>
              <ul className="space-y-1.5 text-sm text-ink-600">
                {Object.entries(biz.openingHours).map(([day, hours]) => (
                  <li key={day} className="flex justify-between">
                    <span className="capitalize">{day}</span>
                    <span>{hours?.available ? `${hours.start} - ${hours.end}` : 'Closed'}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
