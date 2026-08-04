import { useState } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import clsx from 'clsx';

const faqs = [
  { q: 'How do I post a job?', a: 'Sign up as a customer, go to your dashboard, and select "Post a Job". Fill in the details and submit — professionals in your area will start sending quotes.' },
  { q: 'How does TELVO verify professionals?', a: 'Professionals submit a government ID and a selfie for review. Once approved by our team, they receive a verified badge visible on their profile.' },
  { q: 'What payment methods are supported?', a: 'Cash, MTN Mobile Money, and Orange Money. More payment options are coming soon.' },
  { q: 'What if I\'m not happy with the work?', a: 'You can open a dispute from the job page. Our team reviews disputes and helps resolve issues between customers and professionals.' },
  { q: 'How much does TELVO charge?', a: 'TELVO charges professionals a 10% platform commission on completed jobs. Posting a job and getting quotes is always free for customers.' },
];

export function HelpCenter() {
  const [open, setOpen] = useState<number | null>(0);
  const [q, setQ] = useState('');
  const filtered = faqs.filter((f) => f.q.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="container-page py-16 max-w-2xl mx-auto">
      <h1 className="text-3xl font-extrabold text-ink-900 text-center">Help Center</h1>
      <div className="relative mt-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search for help..." className="w-full h-12 pl-10 pr-4 rounded-xl border border-ink-200 outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500" />
      </div>
      <div className="mt-8 space-y-3">
        {filtered.map((f, i) => (
          <Card key={f.q} className="overflow-hidden">
            <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center justify-between p-4 text-left font-medium text-ink-900">
              {f.q}
              <ChevronDown size={16} className={clsx('transition-transform', open === i && 'rotate-180')} />
            </button>
            {open === i && <p className="px-4 pb-4 text-sm text-ink-500">{f.a}</p>}
          </Card>
        ))}
      </div>
    </div>
  );
}
