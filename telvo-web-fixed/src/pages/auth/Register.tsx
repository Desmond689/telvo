import type { FormEvent } from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wrench, User, Building2, Phone, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Logo } from '@/components/layout/Logo';
import { useAuth } from '@/contexts/AuthContext';
import type { UserType } from '@/types';
import { dashboardHomeFor } from '@/utils/roles';
import { getCategories } from '@/services/categoryService';
import type { ServiceCategory } from '@/types';
import { useEffect } from 'react';
import clsx from 'clsx';
import { auth, db, COLLECTIONS } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

const roles: { type: UserType; title: string; desc: string; icon: any }[] = [
  { type: 'customer', title: 'I need a service', desc: 'Find and hire trusted professionals', icon: User },
  { type: 'professional', title: 'I want to offer services', desc: 'Get hired for jobs in your skill', icon: Wrench },
  { type: 'business', title: 'I represent a business', desc: 'Manage a team and receive job requests', icon: Building2 },
];

export function Register() {
  const { signUpWithEmail, error, clearError } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<'role' | 'categories' | 'details'>('role');
  const [userType, setUserType] = useState<UserType | null>(null);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getCategories().then(setCategories);
  }, []);

  const pickRole = (type: UserType) => {
    setUserType(type);
    setStep(type === 'professional' ? 'categories' : 'details');
  };

  const toggleCategory = (slug: string) => {
    setSelectedCategories((prev) => (prev.includes(slug) ? prev.filter((c) => c !== slug) : [...prev, slug]));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!userType) return;
    clearError();
    setLoading(true);
    try {
      await signUpWithEmail(email, password, fullName, userType);
      if (userType === 'professional' && selectedCategories.length > 0 && auth.currentUser) {
        await updateDoc(doc(db, COLLECTIONS.USERS, auth.currentUser.uid), {
          skills: selectedCategories,
          category: selectedCategories[0],
        });
      }
      navigate(userType === 'professional' ? '/dashboard/professional/onboarding' : dashboardHomeFor(userType));
    } catch {
      // surfaced via context
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-50 px-4 py-12">
      <Card className="w-full max-w-lg p-8">
        <div className="flex justify-center mb-6"><Logo /></div>

        {step === 'role' && (
          <>
            <h1 className="text-xl font-bold text-ink-900 text-center">What are you here to do?</h1>
            <p className="text-sm text-ink-500 text-center mt-1">You can always add more later</p>
            <div className="mt-6 space-y-3">
              {roles.map((r) => (
                <button
                  key={r.type}
                  onClick={() => pickRole(r.type)}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border border-ink-200 hover:border-brand-500 hover:bg-brand-50/40 transition-colors text-left"
                >
                  <span className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center flex-shrink-0">
                    <r.icon size={20} />
                  </span>
                  <div>
                    <p className="font-semibold text-ink-900">{r.title}</p>
                    <p className="text-sm text-ink-500">{r.desc}</p>
                  </div>
                </button>
              ))}
            </div>
            <Link to="/login/phone" className="mt-6 flex items-center justify-center gap-2 w-full h-11 rounded-xl border border-ink-200 text-sm font-medium text-ink-700 hover:border-brand-500 transition-colors">
              <Phone size={16} /> Continue with phone instead
            </Link>
          </>
        )}

        {step === 'categories' && (
          <>
            <h1 className="text-xl font-bold text-ink-900 text-center">Which services do you offer?</h1>
            <p className="text-sm text-ink-500 text-center mt-1">Select all that apply</p>
            <div className="mt-6 grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
              {categories.map((c) => (
                <button
                  key={c.slug}
                  onClick={() => toggleCategory(c.slug)}
                  className={clsx(
                    'flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium text-left transition-colors',
                    selectedCategories.includes(c.slug) ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-ink-200 text-ink-600 hover:border-ink-300'
                  )}
                >
                  {c.name.en}
                  {selectedCategories.includes(c.slug) && <CheckCircle2 size={15} className="text-brand-500 flex-shrink-0" />}
                </button>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="ghost" fullWidth onClick={() => setStep('role')}>Back</Button>
              <Button fullWidth disabled={selectedCategories.length === 0} onClick={() => setStep('details')}>Continue</Button>
            </div>
          </>
        )}

        {step === 'details' && (
          <>
            <h1 className="text-xl font-bold text-ink-900 text-center">Create your account</h1>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <Input label="Full name" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Desmond Nkeng" />
              <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              <Input label="Password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <div className="flex gap-3">
                <Button type="button" variant="ghost" fullWidth onClick={() => setStep(userType === 'professional' ? 'categories' : 'role')}>Back</Button>
                <Button type="submit" fullWidth loading={loading}>Create account</Button>
              </div>
            </form>
          </>
        )}

        <p className="text-sm text-ink-500 text-center mt-6">
          Already have an account? <Link to="/login" className="text-brand-600 font-semibold hover:underline">Log in</Link>
        </p>
      </Card>
    </div>
  );
}
