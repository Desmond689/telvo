import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { StarRating } from '@/components/ui/StarRating';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { getUserById } from '@/services/userService';
import type { TelvoUser } from '@/types';

export function Favorites() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<TelvoUser[] | null>(null);

  useEffect(() => {
    if (!profile) return;
    if (!profile.favorites?.length) return setFavorites([]);
    Promise.all(profile.favorites.map(getUserById)).then((users) => setFavorites(users.filter(Boolean) as TelvoUser[]));
  }, [profile]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900 mb-6">Favorites</h1>
      {favorites === null && <p className="text-sm text-ink-400">Loading...</p>}
      {favorites?.length === 0 && (
        <EmptyState icon={<Heart size={36} />} title="No favorites yet" description="Save professionals and businesses you like for quick access later." actionLabel="Browse professionals" onAction={() => navigate('/find-services')} />
      )}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {favorites?.map((f) => (
          <Card key={f.id} hover className="p-4 cursor-pointer" onClick={() => navigate(`/professional/${f.id}`)}>
            <div className="flex items-center gap-3">
              <span className="w-12 h-12 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold">{f.fullName?.[0]}</span>
              <div>
                <p className="font-medium text-ink-900 flex items-center gap-1">{f.fullName} {f.isVerified && <VerifiedBadge size={13} />}</p>
                <StarRating rating={f.rating || 0} size={12} />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
