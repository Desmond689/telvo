import type { FormEvent } from 'react';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Phone } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Logo } from '@/components/layout/Logo';
import { useAuth } from '@/contexts/AuthContext';

export function Login() {
  const { signInWithEmail, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    setLoading(true);
    try {
      await signInWithEmail(email.trim(), password);
      navigate(from, { replace: true });
    } catch {
      // error surfaced via context
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-50 px-4 py-12">
      <a href="#login-form" className="skip-link">
        Skip to login form
      </a>
      <Card className="w-full max-w-md p-8 shadow-card">
        <div className="flex justify-center mb-6">
          <Logo />
        </div>
        <h1 className="text-xl font-bold text-ink-900 text-center">Welcome back</h1>
        <p className="text-sm text-ink-500 text-center mt-1">Log in to your TELVO account</p>

        <Link
          to="/login/phone"
          className="mt-6 flex items-center justify-center gap-2 w-full h-11 rounded-xl border border-ink-200 text-sm font-medium text-ink-700 hover:border-brand-500 transition-colors focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <Phone size={16} aria-hidden="true" /> Continue with phone number
        </Link>
        <div className="flex items-center gap-3 my-5" role="separator" aria-hidden="true">
          <div className="flex-1 h-px bg-ink-100" />
          <span className="text-xs text-ink-400">or with email</span>
          <div className="flex-1 h-px bg-ink-100" />
        </div>

        <form id="login-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Input
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
            inputMode="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Password"
            type="password"
            name="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && (
            <p role="alert" className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-sm text-brand-600 font-medium hover:underline focus-visible:ring-2 focus-visible:ring-brand-500 rounded">
              Forgot password?
            </Link>
          </div>
          <Button type="submit" fullWidth loading={loading}>
            Log in
          </Button>
        </form>

        <p className="text-sm text-ink-500 text-center mt-6">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-brand-600 font-semibold hover:underline">
            Sign up
          </Link>
        </p>
      </Card>
    </div>
  );
}
