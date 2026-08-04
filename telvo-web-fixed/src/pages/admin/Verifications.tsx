import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { db, COLLECTIONS } from '@/lib/firebase';
import type { TelvoUser } from '@/types';
import { ShieldCheck } from 'lucide-react';

export function AdminVerifications() {
  const [pending, setPending] = useState<TelvoUser[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => {
    getDocs(query(collection(db, COLLECTIONS.USERS), where('verificationStatus', '==', 'pending'))).then((snap) =>
      setPending(snap.docs.map((d) => ({ id: d.id, ...d.data() } as TelvoUser)))
    );
  };
  useEffect(load, []);

  const decide = async (u: TelvoUser, approve: boolean) => {
    setBusyId(u.id);
    try {
      // Verification documents themselves live in a private Storage path
      // (verification/{uid}/...) - admins review them via the Firebase
      // console or an internal tool, never through the public profile.
      await updateDoc(doc(db, COLLECTIONS.USERS, u.id), {
        isVerified: approve,
        verificationStatus: approve ? 'verified' : 'rejected',
      });
      load();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900 mb-6">Verification Requests</h1>
      {pending === null && <p className="text-sm text-ink-400">Loading...</p>}
      {pending?.length === 0 && <EmptyState icon={<ShieldCheck size={36} />} title="No pending verifications" description="New verification submissions will appear here for review." />}
      <div className="space-y-3">
        {pending?.map((u) => (
          <Card key={u.id} className="p-5 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="w-11 h-11 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold">{u.fullName?.[0]}</span>
              <div>
                <p className="font-medium text-ink-900">{u.fullName}</p>
                <p className="text-sm text-ink-500">{u.category || u.userType} · {u.city}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" loading={busyId === u.id} onClick={() => decide(u, false)}>Reject</Button>
              <Button size="sm" loading={busyId === u.id} onClick={() => decide(u, true)}>Approve</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
