import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MapPin, SlidersHorizontal, Grid3x3, List, Search } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { StarRating } from '@/components/ui/StarRating';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { ProfessionalCardSkeleton } from '@/components/ui/Skeleton';
import { CAMEROON_CITIES } from '@/types';
import type { TelvoUser } from '@/types';
import { searchProfessionalsOrBusinesses } from '@/services/userService';
import { getCategories } from '@/services/categoryService';
import type { ServiceCategory } from '@/types';
import { formatXAF } from '@/utils/format';
import { auth } from '@/lib/firebase';

const TELVO_APP_DOWNLOAD_URL = 'https://github.com/Desmond689/TELVO-/releases/download/v1.0.0/app-release.apk';

export function FindServices() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [results, setResults] = useState<TelvoUser[] | null>(null);
  const [error, setError] = useState(false);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const category = params.get('category') || '';
  const city = params.get('city') || '';
  const q = params.get('q') || '';
  const verifiedOnly = params.get('verified') === '1';
  const minRating = Number(params.get('minRating') || 0);
  const currentUserId = auth.currentUser?.uid;

  useEffect(() => {
    getCategories().then(setCategories);
  }, []);

  const load = useCallback(() => {
    setResults(null);
    setError(false);
    searchProfessionalsOrBusinesses({ category: category || undefined, city: city || undefined, verifiedOnly, minRating, userType: 'all' }, 24)
      .then((r) => setResults(r.results))
      .catch(() => setError(true));
  }, [category, city, verifiedOnly, minRating]);

  useEffect(() => {
    load();
  }, [load]);

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  };

  const filteredByQuery = results?.filter((r) => {
    if (currentUserId && r.id === currentUserId) return false;
    return q
      ? `${r.fullName || ''} ${r.businessName || ''} ${r.category || ''} ${r.businessCategory || ''} ${(r.skills || []).join(' ')}`
          .toLowerCase()
          .includes(q.toLowerCase())
      : true;
  });

  return (
    <div className="container-page py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-ink-900">Find Services</h1>
          <p className="text-ink-500 mt-1">{filteredByQuery ? `${filteredByQuery.length} workers found` : 'Searching...'}</p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => window.open(TELVO_APP_DOWNLOAD_URL, '_blank', 'noopener,noreferrer')}
        >
          Download TELVO App
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filters */}
        <aside className={`lg:w-64 flex-shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
          <Card className="p-5 space-y-5 sticky top-20">
            <div>
              <h3 className="text-sm font-semibold text-ink-800 mb-3 flex items-center gap-2">
                <SlidersHorizontal size={15} /> Filters
              </h3>
            </div>
            <Select label="Category" value={category} onChange={(e) => updateParam('category', e.target.value)}>
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name.en}
                </option>
              ))}
            </Select>
            <Select label="Location" value={city} onChange={(e) => updateParam('city', e.target.value)}>
              <option value="">All cities</option>
              {CAMEROON_CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
            <Select label="Minimum rating" value={String(minRating)} onChange={(e) => updateParam('minRating', e.target.value)}>
              <option value="0">Any rating</option>
              <option value="3">3+ stars</option>
              <option value="4">4+ stars</option>
              <option value="4.5">4.5+ stars</option>
            </Select>
            <label className="flex items-center gap-2 text-sm text-ink-700">
              <input type="checkbox" checked={verifiedOnly} onChange={(e) => updateParam('verified', e.target.checked ? '1' : '')} className="rounded border-ink-300 text-brand-500 focus:ring-brand-500" />
              Verified only
            </label>
            <Button variant="ghost" size="sm" fullWidth onClick={() => setParams({})}>
              Clear filters
            </Button>
          </Card>
        </aside>

        {/* Results */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4 gap-3">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <Input placeholder="Search by name or skill..." value={q} onChange={(e) => updateParam('q', e.target.value)} className="pl-9" />
            </div>
            <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setShowFilters((v) => !v)} icon={<SlidersHorizontal size={14} />}>
              Filters
            </Button>
            <div className="hidden sm:flex items-center border border-ink-200 rounded-xl overflow-hidden">
              <button onClick={() => setView('grid')} className={`p-2 ${view === 'grid' ? 'bg-brand-50 text-brand-600' : 'text-ink-400'}`} aria-label="Grid view">
                <Grid3x3 size={16} />
              </button>
              <button onClick={() => setView('list')} className={`p-2 ${view === 'list' ? 'bg-brand-50 text-brand-600' : 'text-ink-400'}`} aria-label="List view">
                <List size={16} />
              </button>
            </div>
          </div>

          {results === null && !error && (
            <div className={view === 'grid' ? 'grid sm:grid-cols-2 xl:grid-cols-3 gap-5' : 'space-y-4'}>
              {Array.from({ length: 6 }).map((_, i) => (
                <ProfessionalCardSkeleton key={i} />
              ))}
            </div>
          )}

          {error && <ErrorState onRetry={load} />}

          {filteredByQuery && filteredByQuery.length === 0 && (
            <EmptyState
              title="No workers match your search"
              description="Try widening your filters, or post a job and let workers come to you."
              actionLabel="Post a Job"
              onAction={() => navigate('/dashboard/customer/post-job')}
            />
          )}

          {filteredByQuery && filteredByQuery.length > 0 && (
            <div className={view === 'grid' ? 'grid sm:grid-cols-2 xl:grid-cols-3 gap-5' : 'space-y-4'}>
              {filteredByQuery.map((pro) => (
                <Card key={pro.id} hover className="p-5 cursor-pointer" onClick={() => navigate(`/professional/${pro.id}`)}>
                  <div className="flex items-start gap-3">
                    <span className="w-14 h-14 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-lg font-bold overflow-hidden flex-shrink-0">
                      {(pro.profilePhoto || pro.businessLogo) ? (
                        <img src={pro.profilePhoto || pro.businessLogo} alt={pro.businessName || pro.fullName} className="w-full h-full object-cover" />
                      ) : (
                        (pro.businessName || pro.fullName)?.[0]
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-ink-900 flex items-center gap-1 truncate">
                        {pro.businessName || pro.fullName} {pro.isVerified && <VerifiedBadge />}
                      </p>
                      <p className="text-sm text-ink-500 truncate">{pro.category || pro.businessCategory || 'General Services'}</p>
                      <p className="text-xs text-ink-400 flex items-center gap-1 mt-0.5">
                        <MapPin size={11} /> {pro.city || 'Cameroon'}
                      </p>
                    </div>
                  </div>
                  {pro.description && <p className="text-sm text-ink-500 mt-3 line-clamp-2">{pro.description}</p>}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-ink-100">
                    <StarRating rating={pro.rating || 0} count={pro.jobsCompleted || 0} size={13} />
                    <span className="text-xs text-ink-400">{pro.responseTime ? `Responds in ~${pro.responseTime}m` : 'New'}</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
