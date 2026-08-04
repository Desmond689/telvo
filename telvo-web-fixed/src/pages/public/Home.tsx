import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, MapPin, ShieldCheck, MessageCircle, Receipt, Star, ArrowRight,
  Wrench, Zap, Car, Sparkles, Paintbrush, HardHat, Hammer, Smartphone,
  Snowflake, Truck, Sparkle, Laptop, MoreHorizontal, ClipboardList, Users, CheckCircle2, Heart,
} from 'lucide-react';
import { DownloadAppButtons } from '@/components/ui/DownloadAppButtons';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StarRating } from '@/components/ui/StarRating';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { ProfessionalCardSkeleton } from '@/components/ui/Skeleton';
import { CAMEROON_CITIES } from '@/types';
import { getFeaturedWorkers } from '@/services/userService';
import type { TelvoUser } from '@/types';
import { formatXAF } from '@/utils/format';

const ICONS: Record<string, any> = {
  Wrench, Zap, Car, Sparkles, Paintbrush, HardHat, Hammer, Smartphone, Snowflake, Truck, Sparkle, Laptop, MoreHorizontal,
};

const categories = [
  { icon: 'Wrench', label: 'Plumbing', slug: 'plumbing' },
  { icon: 'Zap', label: 'Electrical', slug: 'electrical' },
  { icon: 'Car', label: 'Mechanics', slug: 'mechanics' },
  { icon: 'Sparkles', label: 'Cleaning', slug: 'cleaning' },
  { icon: 'Paintbrush', label: 'Painting', slug: 'painting' },
  { icon: 'HardHat', label: 'Construction', slug: 'construction' },
  { icon: 'Hammer', label: 'Carpentry', slug: 'carpentry' },
  { icon: 'Smartphone', label: 'Electronics Repair', slug: 'electronics' },
  { icon: 'Snowflake', label: 'AC & Refrigeration', slug: 'ac-refrigeration' },
  { icon: 'Truck', label: 'Moving', slug: 'moving' },
  { icon: 'Sparkle', label: 'Beauty', slug: 'beauty' },
  { icon: 'Laptop', label: 'Tech Services', slug: 'tech-services' },
];

const steps = [
  { n: 1, title: 'Tell us what you need', desc: 'Describe the job, add photos, and set your budget.', icon: ClipboardList },
  { n: 2, title: 'Compare trusted professionals', desc: 'Review verified profiles, ratings, and quotes.', icon: Users },
  { n: 3, title: 'Choose the right professional', desc: 'Pick the best fit for your budget and timeline.', icon: CheckCircle2 },
  { n: 4, title: 'Get the job done', desc: 'Track progress, pay securely, and leave a review.', icon: Star },
];

const testimonials = [
  { name: 'Achille N.', city: 'Douala', text: 'I found an electrician within the hour and the price was exactly what was quoted. No surprises.', rating: 5 },
  { name: 'Solange T.', city: 'Yaoundé', text: 'The verification badge actually means something here. My plumber showed up on time and did great work.', rating: 5 },
  { name: 'Ibrahim M.', city: 'Bamenda', text: 'Comparing three quotes side by side saved me real money. I will use TELVO for every job from now on.', rating: 4 },
];

export function Home() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [city, setCity] = useState('');
  const [featured, setFeatured] = useState<TelvoUser[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getFeaturedWorkers(6)
      .then(setFeatured)
      .catch(() => setError(true));
  }, []);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (city) params.set('city', city);
    navigate(`/find-services?${params.toString()}`);
  };

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50/60 to-white">
        <div className="container-page pt-16 pb-14 sm:pt-24 sm:pb-20 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 text-brand-700 text-xs font-semibold px-3 py-1.5 mb-6 animate-fade-in">
            <ShieldCheck size={14} /> Built for Cameroon
          </span>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-ink-900 animate-slide-up">
            Trusted workers.
            <br />
            <span className="text-brand-500">Real solutions.</span>
          </h1>
          <p className="mt-5 text-lg text-ink-500 max-w-xl mx-auto animate-slide-up">
            Find trusted professionals and businesses near you for the services you need.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 animate-slide-up">
            <Button size="lg" onClick={() => navigate('/find-services')} icon={<Search size={18} />}>
              Find a Professional
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/become-a-professional')}>
              Offer Your Services
            </Button>
          </div>

          {/* Search interface */}
          <form
            onSubmit={handleSearch}
            className="mt-10 max-w-2xl mx-auto bg-white rounded-2xl shadow-card-hover border border-ink-100 p-2 flex flex-col sm:flex-row gap-2 animate-scale-in"
          >
            <div className="flex-1 flex items-center gap-2 px-3 py-2">
              <Search size={18} className="text-ink-400 flex-shrink-0" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="What service do you need? e.g. Plumber, Electrician..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-ink-400"
              />
            </div>
            <div className="hidden sm:block w-px bg-ink-100 my-1" />
            <div className="flex-1 flex items-center gap-2 px-3 py-2">
              <MapPin size={18} className="text-ink-400 flex-shrink-0" />
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-transparent text-sm outline-none text-ink-700"
              >
                <option value="">Where do you need the service?</option>
                {CAMEROON_CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" className="sm:w-auto w-full">
              Search
            </Button>
          </form>
          <p className="mt-3 text-xs text-ink-400">
            Popular: {['Plumber', 'Electrician', 'Mechanic', 'Painter', 'Cleaner', 'Carpenter', 'AC Technician'].map((s, i, arr) => (
              <span key={s}>
                <button className="hover:text-brand-600 underline underline-offset-2" onClick={() => navigate(`/find-services?q=${encodeURIComponent(s)}`)}>
                  {s}
                </button>
                {i < arr.length - 1 ? ', ' : ''}
              </span>
            ))}
          </p>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="container-page py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-ink-900">Popular Categories</h2>
            <p className="text-ink-500 mt-1">Browse services by category</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => {
            const Icon = ICONS[cat.icon];
            return (
              <button
                key={cat.slug}
                onClick={() => navigate(`/find-services?category=${cat.slug}`)}
                className="group flex flex-col items-center gap-3 p-5 rounded-2xl border border-ink-100 bg-white hover:border-brand-500 hover:shadow-card transition-all"
              >
                <span className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center group-hover:bg-brand-500 group-hover:text-white transition-colors">
                  <Icon size={22} />
                </span>
                <span className="text-sm font-medium text-ink-700 text-center">{cat.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-ink-50 py-16">
        <div className="container-page">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-ink-900">How TELVO Works</h2>
            <p className="text-ink-500 mt-2">Four simple steps to get your job done</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s) => (
              <div key={s.n} className="relative">
                <Card className="p-6 h-full">
                  <span className="w-10 h-10 rounded-xl bg-brand-500 text-white flex items-center justify-center font-bold mb-4">{s.n}</span>
                  <s.icon className="text-brand-500 mb-3" size={22} />
                  <h3 className="font-semibold text-ink-900">{s.title}</h3>
                  <p className="text-sm text-ink-500 mt-1.5">{s.desc}</p>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED PROFESSIONALS */}
      <section className="container-page py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-ink-900">Featured Workers</h2>
            <p className="text-ink-500 mt-1">Top-rated professionals and businesses near you</p>
          </div>
          <button onClick={() => navigate('/find-services')} className="hidden sm:flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700">
            View all workers <ArrowRight size={15} />
          </button>
        </div>

        {featured === null && !error && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <ProfessionalCardSkeleton key={i} />
            ))}
          </div>
        )}

        {error && <p className="text-sm text-ink-400 text-center py-8">Featured workers are unavailable right now. Try Find Services instead.</p>}

        {featured && featured.length === 0 && (
          <p className="text-sm text-ink-400 text-center py-8">
            No trusted workers yet — be the first to{' '}
            <button className="text-brand-600 underline" onClick={() => navigate('/become-a-professional')}>
              join TELVO
            </button>
            .
          </p>
        )}

        {featured && featured.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {featured.map((pro) => (
              <Card key={pro.id} hover className="p-5 cursor-pointer" onClick={() => navigate(`/professional/${pro.id}`)}>
                <div className="flex items-center gap-3">
                  <span className="w-14 h-14 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-lg font-bold overflow-hidden flex-shrink-0">
                    {(pro.profilePhoto || pro.businessLogo) ? (
                      <img src={pro.profilePhoto || pro.businessLogo} alt={pro.businessName || pro.fullName} className="w-full h-full object-cover" />
                    ) : (
                      (pro.businessName || pro.fullName)?.[0]
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-ink-900 flex items-center gap-1 truncate">
                      {pro.businessName || pro.fullName} {pro.isVerified && <VerifiedBadge />}
                    </p>
                    <p className="text-sm text-ink-500 truncate">{pro.category || pro.businessCategory || 'General Services'}</p>
                    <p className="text-xs text-ink-400 flex items-center gap-1 mt-0.5">
                      <MapPin size={11} /> {pro.city || 'Cameroon'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <StarRating rating={pro.rating || 0} count={pro.jobsCompleted || 0} size={13} />
                  <span className="text-sm font-semibold text-ink-900">{formatXAF((pro as any).startingPrice || 5000)}+</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* TRUST */}
      <section className="bg-ink-900 py-16">
        <div className="container-page">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Why people trust TELVO</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6 text-center">
            {[
              { icon: ShieldCheck, label: 'Verified professionals' },
              { icon: MessageCircle, label: 'Secure communication' },
              { icon: Receipt, label: 'Transparent quotes' },
              { icon: Star, label: 'Customer reviews' },
              { icon: MapPin, label: 'Local professionals' },
            ].map((t) => (
              <div key={t.label} className="flex flex-col items-center gap-3">
                <span className="w-12 h-12 rounded-xl bg-white/10 text-brand-400 flex items-center justify-center">
                  <t.icon size={22} />
                </span>
                <p className="text-sm font-medium text-white/80">{t.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="container-page py-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-ink-900 text-center mb-10">What customers say</h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <Card key={t.name} className="p-6">
              <StarRating rating={t.rating} showValue={false} />
              <p className="text-sm text-ink-600 mt-3 leading-relaxed">"{t.text}"</p>
              <p className="text-sm font-semibold text-ink-900 mt-4">{t.name}</p>
              <p className="text-xs text-ink-400">{t.city}, Cameroon</p>
            </Card>
          ))}
        </div>
      </section>

      {/* GET THE APP + SUPPORT US */}
      <section className="container-page py-16">
        <div className="grid sm:grid-cols-2 gap-6">
          <Card className="p-8 text-center sm:text-left">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-100 text-ink-600 text-xs font-semibold px-3 py-1.5 mb-3">
              <Smartphone size={13} /> Mobile app
            </span>
            <h3 className="text-xl font-bold text-ink-900">Take TELVO with you</h3>
            <p className="text-sm text-ink-500 mt-2">Post jobs, chat, and track work from your phone — wherever you are.</p>
            <div className="mt-5 flex justify-center sm:justify-start">
              <DownloadAppButtons size="sm" />
            </div>
          </Card>
          <Card className="p-8 text-center sm:text-left bg-brand-50/50 border-brand-100">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 text-brand-700 text-xs font-semibold px-3 py-1.5 mb-3">
              <Heart size={13} /> Support Us
            </span>
            <h3 className="text-xl font-bold text-ink-900">Help TELVO grow</h3>
            <p className="text-sm text-ink-500 mt-2">Your contribution helps us verify more professionals and reach more cities across Cameroon.</p>
            <Button className="mt-5" onClick={() => navigate('/donate')} icon={<Heart size={15} />}>
              Donate now
            </Button>
          </Card>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="container-page pb-20">
        <Card className="bg-brand-500 border-0 p-10 sm:p-14 text-center overflow-hidden relative">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">Ready to get started?</h2>
          <p className="text-brand-50 mt-3 max-w-lg mx-auto">Join thousands of Cameroonians finding trusted help, or start earning by offering your services.</p>
          <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" variant="secondary" className="!bg-white !text-brand-700 hover:!bg-brand-50" onClick={() => navigate('/find-services')}>
              Find a Professional
            </Button>
            <Button size="lg" variant="outline" className="!border-white !text-white hover:!bg-white/10" onClick={() => navigate('/register')}>
              Join TELVO
            </Button>
          </div>
        </Card>
      </section>
    </div>
  );
}
