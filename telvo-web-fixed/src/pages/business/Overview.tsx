import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Eye, FileText, CheckCircle2, DollarSign } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { listenToProfessionalJobs } from '@/services/jobService';
import type { Job } from '@/types';
import { formatXAF } from '@/utils/format';

export function BusinessOverview() {
  const { profile } = useAuth();
  const [jobs, setJobs] = useState<Job[] | null>(null);

  useEffect(() => {
    if (!profile) return;
    return listenToProfessionalJobs(profile.id, setJobs);
  }, [profile]);

  const completed = jobs?.filter((j) => ['completed', 'confirmed', 'paid', 'reviewed'].includes(j.status)) || [];
  const revenue = completed.reduce((sum, j) => sum + (j.finalPrice || 0), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ink-900">{profile?.businessName || 'Business Dashboard'}</h1>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Profile Views', value: '—', icon: Eye },
          { label: 'Requests Received', value: jobs?.length ?? '—', icon: FileText },
          { label: 'Jobs Completed', value: completed.length, icon: CheckCircle2 },
          { label: 'Revenue', value: formatXAF(revenue), icon: DollarSign },
        ].map((s) => (
          <Card key={s.label} className="p-5">
            <s.icon size={18} className="text-brand-500" />
            <p className="text-2xl font-bold text-ink-900 mt-3">{s.value}</p>
            <p className="text-sm text-ink-500">{s.label}</p>
          </Card>
        ))}
      </div>
      <Card className="p-6">
        <p className="text-sm text-ink-500">Analytics on profile views require Firebase Analytics wiring (VITE_FIREBASE_MEASUREMENT_ID) — the counter above will populate once that's connected in your Firebase project.</p>
      </Card>
    </div>
  );
}
