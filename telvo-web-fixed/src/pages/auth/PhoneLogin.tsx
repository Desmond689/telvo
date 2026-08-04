import type { FormEvent } from 'react';
import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import type { ConfirmationResult } from 'firebase/auth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Logo } from '@/components/layout/Logo';
import { useAuth } from '@/contexts/AuthContext';

const RECAPTCHA_ID = 'telvo-recaptcha-container';

export function PhoneLogin() {
  const { startPhoneSignIn, confirmPhoneOtp, error, clearError, profile } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const sentOnce = useRef(false);

  const sendOtp = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    setLoading(true);
    try {
      const res = await startPhoneSignIn(phone, RECAPTCHA_ID);
      setConfirmation(res);
      sentOnce.current = true;
    } catch {
      // surfaced via context
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    if (!confirmation) return;
    clearError();
    setLoading(true);
    try {
      await confirmPhoneOtp(confirmation, otp);
      navigate(profile ? '/' : '/register/complete-profile');
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
        <h1 className="text-xl font-bold text-ink-900 text-center">{confirmation ? 'Enter the code' : 'Log in with phone'}</h1>
        <p className="text-sm text-ink-500 text-center mt-1">
          {confirmation ? `We sent a 6-digit code to ${phone}` : 'We support Cameroon phone numbers'}
        </p>

        {!confirmation ? (
          <form onSubmit={sendOtp} className="mt-6 space-y-4">
            <Input
              label="Phone number"
              required
              placeholder="6XX XXX XXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              hint="Format: +237 6XX XXX XXX"
            />
            {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            <div id={RECAPTCHA_ID} />
            <Button type="submit" fullWidth loading={loading}>Send code</Button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="mt-6 space-y-4">
            <Input label="Verification code" required maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="123456" />
            {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            <Button type="submit" fullWidth loading={loading}>Verify & continue</Button>
            <button type="button" className="text-sm text-brand-600 hover:underline w-full text-center" onClick={() => setConfirmation(null)}>
              Use a different number
            </button>
          </form>
        )}

        <p className="text-sm text-ink-500 text-center mt-6">
          Prefer email? <Link to="/login" className="text-brand-600 font-semibold hover:underline">Log in with email</Link>
        </p>
      </Card>
    </div>
  );
}
