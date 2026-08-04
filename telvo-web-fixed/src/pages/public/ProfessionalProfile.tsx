import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Clock, Briefcase, MessageCircle, FileText, Flag, ShieldCheck } from 'lucide-react';
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
import { timeAgo } from '@/utils/format';

export function ProfessionalProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile: me } = useAuth();
  const [pro, setPro] = useState<TelvoUser | null | undefined>(undefined);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    getUserById(id)
      .then((u) => {
        setPro(u);
        return u ? getReviewsForUser(u.id) : [];
      })
      .then(setReviews)
      .catch(() => setError(true));
  }, [id]);

  if (error) return <div className="container-page py-16"><ErrorState /></div>;
  if (pro === undefined) return <PageSpinner />;
  if (pro === null) return <div className="container-page py-16"><ErrorState message="This professional profile doesn't exist or is no longer available." /></div>;

  const startConversation = () => {
    if (!me) return navigate('/login');
    navigate(`/dashboard/customer/messages?with=${pro.id}`);
  };

  return (
    <div className="container-page py-8 max-w-5xl">
      <Card className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row gap-6">
          <span className="w-24 h-24 rounded-2xl bg-brand-100 text-brand-700 flex items-center justify-center text-3xl font-bold overflow-hidden flex-shrink-0">
            {pro.profilePhoto ? <img src={pro.profilePhoto} alt={pro.fullName} className="w-full h-full object-cover" /> : pro.fullName?.[0]}
          </span>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-ink-900">{pro.fullName}</h1>
              {pro.isVerified && <VerifiedBadge size={18} />}
            </div>
            <p className="text-ink-500 mt-1">{pro.category || 'General Services'}</p>
            <div className="flex items-center gap-4 mt-3 flex-wrap text-sm text-ink-500">
              <span className="flex items-center gap-1"><MapPin size={14} /> {pro.city || 'Cameroon'}</span>
              <span className="flex items-center gap-1"><Briefcase size={14} /> {pro.jobsCompleted || 0} jobs completed</span>
              <span className="flex items-center gap-1"><Clock size={14} /> {pro.yearsOfExperience ? `${pro.yearsOfExperience} yrs experience` : 'New on TELVO'}</span>
            </div>
            <div className="mt-3">
              <StarRating rating={pro.rating || 0} count={reviews.length} />
            </div>
          </div>
          <div className="flex sm:flex-col gap-2 sm:w-44">
            <Button fullWidth onClick={() => navigate(`/dashboard/customer/post-job?professionalId=${pro.id}`)}>Request Service</Button>
            <Button fullWidth variant="outline" onClick={() => navigate(`/dashboard/customer/post-job?professionalId=${pro.id}&quote=1`)}>Get a Quote</Button>
            <Button fullWidth variant="ghost" icon={<MessageCircle size={16} />} onClick={startConversation}>Message</Button>
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 space-y-6">
          {pro.description && (
            <Card className="p-6">
              <h2 className="font-semibold text-ink-900 mb-2">About</h2>
              <p className="text-sm text-ink-600 leading-relaxed">{pro.description}</p>
            </Card>
          )}

          {pro.skills && pro.skills.length > 0 && (
            <Card className="p-6">
              <h2 className="font-semibold text-ink-900 mb-3">Services</h2>
              <div className="flex flex-wrap gap-2">
                {pro.skills.map((s) => (
                  <Badge key={s} tone="green">{s}</Badge>
                ))}
              </div>
            </Card>
          )}

          {pro.portfolioPhotos && pro.portfolioPhotos.length > 0 && (
            <Card className="p-6">
              <h2 className="font-semibold text-ink-900 mb-3">Portfolio</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {pro.portfolioPhotos.map((url, i) => (
                  <img key={i} src={url} alt={`Portfolio ${i + 1}`} className="rounded-xl aspect-square object-cover" loading="lazy" />
                ))}
              </div>
            </Card>
          )}

          <Card className="p-6">
            <h2 className="font-semibold text-ink-900 mb-4">Reviews ({reviews.length})</h2>
            {reviews.length === 0 ? (
              <p className="text-sm text-ink-400">No reviews yet. Be the first to work with {pro.fullName.split(' ')[0]}.</p>
            ) : (
              <div className="space-y-5">
                {reviews.slice(0, 10).map((r) => (
                  <div key={r.id} className="border-b border-ink-100 pb-5 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <StarRating rating={r.rating} showValue={false} size={13} />
                      <span className="text-xs text-ink-400">{timeAgo(r.createdAt)}</span>
                    </div>
                    <p className="text-sm text-ink-600 mt-2">{r.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold text-ink-900 mb-3 flex items-center gap-2"><ShieldCheck size={16} className="text-brand-500" /> Trust & Safety</h3>
            <ul className="space-y-2 text-sm text-ink-600">
              <li className="flex items-center gap-2">{pro.isPhoneVerified ? <VerifiedBadge size={13} /> : <span className="w-3 h-3 rounded-full bg-ink-200" />} Phone verified</li>
              <li className="flex items-center gap-2">{pro.isIdVerified ? <VerifiedBadge size={13} /> : <span className="w-3 h-3 rounded-full bg-ink-200" />} ID verified</li>
              <li className="flex items-center gap-2">{pro.isSelfieVerified ? <VerifiedBadge size={13} /> : <span className="w-3 h-3 rounded-full bg-ink-200" />} Selfie verified</li>
            </ul>
          </Card>
          {pro.serviceAreas && pro.serviceAreas.length > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold text-ink-900 mb-3">Service Areas</h3>
              <div className="flex flex-wrap gap-2">
                {pro.serviceAreas.map((a) => <Badge key={a}>{a}</Badge>)}
              </div>
            </Card>
          )}
          <button className="flex items-center gap-2 text-sm text-ink-400 hover:text-red-500 transition-colors mx-auto" onClick={() => navigate(`/safety#report`)}>
            <Flag size={14} /> Report this profile
          </button>
        </div>
      </div>
    </div>
  );
}
