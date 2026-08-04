import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { formatXAF } from '@/utils/format';
import { getAllJobsAdmin } from '@/services/jobService';
import { getPlatformSettings, DEFAULT_COMMISSION_RATE } from '@/services/settingsService';
import type { Job } from '@/types';

export function AdminAnalytics() {
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [commissionRate, setCommissionRate] = useState(DEFAULT_COMMISSION_RATE);

  useEffect(() => {
    getAllJobsAdmin().then(setJobs).catch(console.error);
    getPlatformSettings().then((s) => setCommissionRate(s.commissionRate));
  }, []);

  if (!jobs) return <p className="text-sm text-ink-400">Loading...</p>;

  const byCategory = jobs.reduce<Record<string, number>>((acc, j) => {
    acc[j.category] = (acc[j.category] || 0) + 1;
    return acc;
  }, {});
  const byStatus = jobs.reduce<Record<string, number>>((acc, j) => {
    acc[j.status] = (acc[j.status] || 0) + 1;
    return acc;
  }, {});
  const completed = jobs.filter((j) => j.isPaid);
  const revenue = completed.reduce((sum, j) => sum + (j.finalPrice || 0) * commissionRate, 0);
  const avgJobValue = completed.length ? completed.reduce((s, j) => s + (j.finalPrice || 0), 0) / completed.length : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ink-900">Analytics</h1>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="p-5"><p className="text-2xl font-bold text-ink-900">{jobs.length}</p><p className="text-sm text-ink-500">Total jobs posted</p></Card>
        <Card className="p-5"><p className="text-2xl font-bold text-ink-900">{completed.length}</p><p className="text-sm text-ink-500">Jobs paid</p></Card>
        <Card className="p-5"><p className="text-2xl font-bold text-ink-900">{formatXAF(revenue)}</p><p className="text-sm text-ink-500">Platform revenue (10%)</p></Card>
        <Card className="p-5"><p className="text-2xl font-bold text-ink-900">{formatXAF(avgJobValue)}</p><p className="text-sm text-ink-500">Average job value</p></Card>
      </div>

      <Card className="p-6">
        <h2 className="font-semibold text-ink-900 mb-4">Jobs by category</h2>
        <div className="space-y-2">
          {Object.entries(byCategory).sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
            <div key={cat} className="flex items-center gap-3">
              <span className="text-sm text-ink-600 w-32 shrink-0 truncate">{cat}</span>
              <div className="flex-1 h-2 rounded-full bg-ink-100 overflow-hidden">
                <div className="h-full bg-brand-500" style={{ width: `${(count / jobs.length) * 100}%` }} />
              </div>
              <span className="text-sm text-ink-500 w-8 text-right">{count}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold text-ink-900 mb-4">Jobs by status</h2>
        <div className="space-y-2">
          {Object.entries(byStatus).sort((a, b) => b[1] - a[1]).map(([status, count]) => (
            <div key={status} className="flex items-center gap-3">
              <span className="text-sm text-ink-600 w-32 shrink-0 truncate">{status}</span>
              <div className="flex-1 h-2 rounded-full bg-ink-100 overflow-hidden">
                <div className="h-full bg-ink-700" style={{ width: `${(count / jobs.length) * 100}%` }} />
              </div>
              <span className="text-sm text-ink-500 w-8 text-right">{count}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
