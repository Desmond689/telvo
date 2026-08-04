import { useEffect, useState } from 'react';
import { collection, getCountFromServer, query, where } from 'firebase/firestore';
import { Users, ShieldCheck, Briefcase, DollarSign, AlertTriangle, Building2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { db, COLLECTIONS } from '@/lib/firebase';
import { formatXAF } from '@/utils/format';
import { getAllJobsAdmin } from '@/services/jobService';
import { getPlatformSettings, DEFAULT_COMMISSION_RATE } from '@/services/settingsService';

export function AdminOverview() {
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [revenue, setRevenue] = useState(0);

  useEffect(() => {
    async function load() {
      const usersRef = collection(db, COLLECTIONS.USERS);
      const [totalUsers, customers, professionals, verifiedPros, businesses, pendingVerification] = await Promise.all([
        getCountFromServer(usersRef),
        getCountFromServer(query(usersRef, where('userType', '==', 'customer'))),
        getCountFromServer(query(usersRef, where('userType', '==', 'professional'))),
        getCountFromServer(query(usersRef, where('userType', '==', 'professional'), where('isVerified', '==', true))),
        getCountFromServer(query(usersRef, where('userType', '==', 'business'))),
        getCountFromServer(query(usersRef, where('verificationStatus', '==', 'pending'))),
      ]);
      setStats({
        totalUsers: totalUsers.data().count,
        customers: customers.data().count,
        professionals: professionals.data().count,
        verifiedPros: verifiedPros.data().count,
        businesses: businesses.data().count,
        pendingVerification: pendingVerification.data().count,
      });

      const [jobs, platformSettings] = await Promise.all([getAllJobsAdmin(), getPlatformSettings()]);
      const completedJobs = jobs.filter((j) => j.isPaid);
      setStats((prev) => ({ ...(prev as any), jobsCreated: jobs.length, jobsCompleted: completedJobs.length }));
      setRevenue(completedJobs.reduce((sum, j) => sum + (j.finalPrice || 0) * (platformSettings.commissionRate ?? DEFAULT_COMMISSION_RATE), 0));
    }
    load().catch(console.error);
  }, []);

  const cards = [
    { label: 'Total Users', value: stats?.totalUsers, icon: Users },
    { label: 'Verified Professionals', value: stats ? `${stats.verifiedPros}/${stats.professionals}` : undefined, icon: ShieldCheck },
    { label: 'Businesses', value: stats?.businesses, icon: Building2 },
    { label: 'Jobs Created', value: stats?.jobsCreated, icon: Briefcase },
    { label: 'Platform Revenue (10%)', value: formatXAF(revenue), icon: DollarSign },
    { label: 'Pending Verifications', value: stats?.pendingVerification, icon: AlertTriangle },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ink-900">Admin Overview</h1>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Card key={c.label} className="p-5">
            <c.icon size={18} className="text-brand-500" />
            <p className="text-2xl font-bold text-ink-900 mt-3">{c.value ?? '—'}</p>
            <p className="text-sm text-ink-500">{c.label}</p>
          </Card>
        ))}
      </div>
      <Card className="p-6">
        <p className="text-sm text-ink-500">
          Note: <code className="bg-ink-100 px-1.5 py-0.5 rounded">getCountFromServer</code> requires Firestore's Cloud Functions/Admin SDK
          -level composite indexes for the filtered queries above (userType + isVerified, userType + verificationStatus).
          Create them via the Firestore console link that appears in your browser console on first load, or with{' '}
          <code className="bg-ink-100 px-1.5 py-0.5 rounded">firebase deploy --only firestore:indexes</code>.
        </p>
      </Card>
    </div>
  );
}
