import { useEffect, useState } from 'react';
import { UserPlus, Users } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { getUserById } from '@/services/userService';
import type { TelvoUser } from '@/types';
import { db, COLLECTIONS } from '@/lib/firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';

export function Employees() {
  const { profile } = useAuth();
  const [employees, setEmployees] = useState<TelvoUser[]>([]);
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (!profile?.employeeIds?.length) return;
    Promise.all(profile.employeeIds.map(getUserById)).then((list) => setEmployees(list.filter(Boolean) as TelvoUser[]));
  }, [profile?.employeeIds]);

  const invite = async () => {
    // In production this calls the backend's employee-invite endpoint
    // (SMS/email invite) rather than writing employeeIds directly from the
    // client - left as a documented backend integration point.
    if (!profile) return;
    await updateDoc(doc(db, COLLECTIONS.USERS, profile.id), { pendingInvites: arrayUnion(phone) });
    setOpen(false);
    setPhone('');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-ink-900">Employees</h1>
        <Button icon={<UserPlus size={16} />} onClick={() => setOpen(true)}>Invite Employee</Button>
      </div>
      {employees.length === 0 && <EmptyState icon={<Users size={36} />} title="No employees yet" description="Invite team members to help manage job requests and quotes." actionLabel="Invite Employee" onAction={() => setOpen(true)} />}
      <div className="grid sm:grid-cols-2 gap-4">
        {employees.map((e) => (
          <Card key={e.id} className="p-4 flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold">{e.fullName?.[0]}</span>
            <div>
              <p className="font-medium text-ink-900">{e.fullName}</p>
              <p className="text-xs text-ink-400">{e.phoneNumber || e.email}</p>
            </div>
          </Card>
        ))}
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Invite an employee" footer={<Button onClick={invite} disabled={!phone}>Send invite</Button>}>
        <Input label="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="6XX XXX XXX" />
      </Modal>
    </div>
  );
}
