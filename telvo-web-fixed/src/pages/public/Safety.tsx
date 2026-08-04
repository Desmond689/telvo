import { useState } from 'react';
import { ShieldCheck, Flag, MessageSquare, CreditCard } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';

const sections = [
  { icon: ShieldCheck, title: 'How verification works', desc: 'Professionals submit a government ID and selfie, reviewed by our trust & safety team before receiving a verified badge.' },
  { icon: MessageSquare, title: 'Stay on TELVO', desc: 'Keep communication and payments on TELVO. Our dispute resolution and buyer protection only cover jobs booked through the platform.' },
  { icon: CreditCard, title: 'Payment safety', desc: 'Never send full payment before work begins. Use TELVO\'s in-app payment tracking so both parties have a record.' },
];

export function Safety() {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');

  return (
    <div className="container-page py-16 max-w-3xl">
      <h1 className="text-3xl font-extrabold text-ink-900">Safety Center</h1>
      <p className="text-ink-500 mt-3">Your safety is our priority. Here's how TELVO helps keep the platform trustworthy.</p>

      <div className="mt-8 space-y-4">
        {sections.map((s) => (
          <Card key={s.title} className="p-6 flex gap-4">
            <s.icon className="text-brand-500 flex-shrink-0" size={22} />
            <div>
              <h3 className="font-semibold text-ink-900">{s.title}</h3>
              <p className="text-sm text-ink-500 mt-1">{s.desc}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6 mt-8 text-center" id="report">
        <Flag className="mx-auto text-red-500 mb-2" size={24} />
        <h3 className="font-semibold text-ink-900">Report a user, job, or review</h3>
        <p className="text-sm text-ink-500 mt-1">Our moderation team reviews every report within 24 hours.</p>
        <Button className="mt-4" variant="danger" onClick={() => setOpen(true)}>Report</Button>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Submit a report" footer={<Button onClick={() => setOpen(false)} disabled={!reason}>Submit</Button>}>
        <div className="space-y-4">
          <Select label="What are you reporting?" value={reason} onChange={(e) => setReason(e.target.value)}>
            <option value="">Select a reason</option>
            <option value="user">A user</option>
            <option value="job">A job</option>
            <option value="review">A review</option>
          </Select>
          <Textarea label="Details" value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Tell us what happened..." />
        </div>
      </Modal>
    </div>
  );
}
