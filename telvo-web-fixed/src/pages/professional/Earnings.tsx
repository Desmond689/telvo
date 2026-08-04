import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { listenToProfessionalJobs } from '@/services/jobService';
import { getPlatformSettings, DEFAULT_COMMISSION_RATE } from '@/services/settingsService';
import type { Job } from '@/types';
import { formatXAF, timeAgo } from '@/utils/format';
import { Wallet, TrendingUp } from 'lucide-react';

export function Earnings() {
  const { profile } = useAuth();
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [commissionRate, setCommissionRate] = useState(DEFAULT_COMMISSION_RATE);

  useEffect(() => {
    if (!profile) return;
    return listenToProfessionalJobs(profile.id, setJobs);
  }, [profile]);

  useEffect(() => {
    getPlatformSettings().then((s) => setCommissionRate(s.commissionRate));
  }, []);

  const paidJobs = jobs?.filter((j) => j.isPaid) || [];
  const grossTotal = paidJobs.reduce((sum, j) => sum + (j.finalPrice || 0), 0);
  const platformFee = grossTotal * commissionRate;
  const netEarnings = grossTotal - platformFee;

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900 mb-6">Earnings</h1>
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <Card className="p-5">
          <Wallet size={18} className="text-brand-500" />
          <p className="text-2xl font-bold text-ink-900 mt-3">{formatXAF(netEarnings)}</p>
          <p className="text-sm text-ink-500">Net earnings</p>
        </Card>
        <Card className="p-5">
          <TrendingUp size={18} className="text-brand-500" />
          <p className="text-2xl font-bold text-ink-900 mt-3">{formatXAF(grossTotal)}</p>
          <p className="text-sm text-ink-500">Gross revenue</p>
        </Card>
        <Card className="p-5">
          <p className="text-2xl font-bold text-ink-900 mt-3">{formatXAF(platformFee)}</p>
          <p className="text-sm text-ink-500">Platform fee ({Math.round(commissionRate * 100)}%)</p>
        </Card>
      </div>
      <Card className="p-6">
        <h2 className="font-semibold text-ink-900 mb-4">Payment History</h2>
        {paidJobs.length === 0 && <p className="text-sm text-ink-400">No payments yet.</p>}
        <div className="divide-y divide-ink-100">
          {paidJobs.map((j) => (
            <div key={j.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-ink-900">{j.title || j.category}</p>
                <p className="text-xs text-ink-400">{timeAgo(j.completedDate || j.createdAt)}</p>
              </div>
              <p className="text-sm font-semibold text-ink-900">{formatXAF((j.finalPrice || 0) * (1 - commissionRate))}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
