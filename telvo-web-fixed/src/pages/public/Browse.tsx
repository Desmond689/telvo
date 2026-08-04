import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { StarRating } from '@/components/ui/StarRating';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProfessionalCardSkeleton } from '@/components/ui/Skeleton';
import { searchProfessionalsOrBusinesses } from '@/services/userService';
import type { TelvoUser } from '@/types';

export function Browse({ userType }: { userType: 'professional' | 'business' }) {
  const navigate = useNavigate();
  const [results, setResults] = useState<TelvoUser[] | null>(null);

  useEffect(() => {
    searchProfessionalsOrBusinesses({ userType }, 24).then((r) => setResults(r.results));
  }, [userType]);

  return (
    <div className="container-page py-10">
      <h1 className="text-2xl sm:text-3xl font-bold text-ink-900 mb-1">{userType === 'professional' ? 'Browse Professionals' : 'Browse Businesses'}</h1>
      <p className="text-ink-500 mb-8">{userType === 'professional' ? 'Verified professionals ready to help' : 'Trusted local businesses on TELVO'}</p>

      {results === null && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => <ProfessionalCardSkeleton key={i} />)}
        </div>
      )}
      {results?.length === 0 && <EmptyState title="Nobody here yet" description="Check back soon, or be the first to join." />}
      {results && results.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {results.map((p) => (
            <Card key={p.id} hover className="p-5 cursor-pointer" onClick={() => navigate(`/${userType}/${p.id}`)}>
              <div className="flex items-center gap-3">
                <span className="w-14 h-14 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-lg font-bold overflow-hidden flex-shrink-0">
                  {(p.profilePhoto || p.businessLogo) ? <img src={p.profilePhoto || p.businessLogo} alt="" className="w-full h-full object-cover" /> : (p.businessName || p.fullName)?.[0]}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-ink-900 flex items-center gap-1 truncate">{p.businessName || p.fullName} {p.isVerified && <VerifiedBadge />}</p>
                  <p className="text-sm text-ink-500 truncate">{p.category || p.businessCategory || 'General Services'}</p>
                  <p className="text-xs text-ink-400 flex items-center gap-1 mt-0.5"><MapPin size={11} /> {p.city || 'Cameroon'}</p>
                </div>
              </div>
              <div className="mt-4"><StarRating rating={p.rating || 0} count={p.jobsCompleted || 0} size={13} /></div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
