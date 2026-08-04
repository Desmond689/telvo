import { useEffect, useState } from 'react';
import { collection, getDocs, limit, orderBy, query, doc, updateDoc } from 'firebase/firestore';
import { Search, Ban, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { db, COLLECTIONS } from '@/lib/firebase';
import type { TelvoUser } from '@/types';

export function AdminUsers() {
  const [users, setUsers] = useState<TelvoUser[] | null>(null);
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => {
    setUsers(null);
    getDocs(query(collection(db, COLLECTIONS.USERS), orderBy('createdAt', 'desc'), limit(100))).then((snap) =>
      setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() } as TelvoUser)))
    );
  };

  useEffect(load, []);

  const toggleSuspend = async (u: TelvoUser) => {
    setBusyId(u.id);
    try {
      // NOTE: This client-side write only works because firestore.rules
      // grants admins field-level write access to isSuspended. Bans and
      // other destructive actions should go through the backend's
      // /admin/users/:id/suspend endpoint (already in backend/src/routes)
      // so they're logged and can trigger notifications/emails.
      await updateDoc(doc(db, COLLECTIONS.USERS, u.id), { isSuspended: !u.isSuspended });
      load();
    } finally {
      setBusyId(null);
    }
  };

  const filtered = users?.filter((u) => `${u.fullName} ${u.email || ''} ${u.phoneNumber || ''}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900 mb-6">Users</h1>
      <div className="mb-4 relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
        <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-left text-ink-500">
              <th className="p-4 font-medium">Name</th>
              <th className="p-4 font-medium">Type</th>
              <th className="p-4 font-medium">Contact</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {users === null && <tr><td className="p-4 text-ink-400" colSpan={5}>Loading...</td></tr>}
            {filtered?.map((u) => (
              <tr key={u.id} className="border-b border-ink-100 last:border-0">
                <td className="p-4 font-medium text-ink-900">{u.fullName}</td>
                <td className="p-4"><Badge>{u.userType}</Badge></td>
                <td className="p-4 text-ink-500">{u.email || u.phoneNumber}</td>
                <td className="p-4">
                  {u.isSuspended ? <Badge tone="red">Suspended</Badge> : u.isVerified ? <Badge tone="green">Verified</Badge> : <Badge>Active</Badge>}
                </td>
                <td className="p-4">
                  <Button size="sm" variant={u.isSuspended ? 'outline' : 'danger'} loading={busyId === u.id} icon={u.isSuspended ? <CheckCircle size={13} /> : <Ban size={13} />} onClick={() => toggleSuspend(u)}>
                    {u.isSuspended ? 'Reinstate' : 'Suspend'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
