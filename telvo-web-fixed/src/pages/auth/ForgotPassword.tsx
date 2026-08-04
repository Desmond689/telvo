import type { FormEvent } from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Logo } from '@/components/layout/Logo';
import { useAuth } from '@/contexts/AuthContext';

export function ForgotPassword() {
  const { resetPassword, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch {
      // surfaced via context
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-50 px-4 py-12">
      <Card className="w-full max-w-md p-8">
        <div className="flex justify-center mb-6"><Logo /></div>
        {sent ? (
          <div className="text-center">
            <h1 className="text-xl font-bold text-ink-900">Check your email</h1>
            <p className="text-sm text-ink-500 mt-2">We've sent a password reset link to {email}.</p>
            <Link to="/login" className="inline-block mt-6 text-brand-600 font-semibold hover:underline">Back to login</Link>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-bold text-ink-900 text-center">Reset your password</h1>
            <p className="text-sm text-ink-500 text-center mt-1">We'll email you a reset link</p>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <Button type="submit" fullWidth loading={loading}>Send reset link</Button>
            </form>
            <p className="text-sm text-ink-500 text-center mt-6">
              <Link to="/login" className="text-brand-600 font-semibold hover:underline">Back to login</Link>
            </p>
          </>
        )}
      </Card>
    </div>
  );
}
