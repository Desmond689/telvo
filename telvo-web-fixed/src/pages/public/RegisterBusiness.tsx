import { useNavigate } from 'react-router-dom';
import { Users, BarChart3, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const benefits = [
  { icon: Users, title: 'Manage your whole team', desc: 'Add employees, assign jobs, and track performance from one dashboard.' },
  { icon: MessageSquare, title: 'Centralized communication', desc: 'Respond to customer requests and quotes without juggling phone numbers.' },
  { icon: BarChart3, title: 'Real analytics', desc: 'Profile views, quotes sent, jobs completed, and revenue — all in one place.' },
];

export function RegisterBusiness() {
  const navigate = useNavigate();
  return (
    <div>
      <section className="bg-gradient-to-b from-brand-50/60 to-white py-16">
        <div className="container-page text-center max-w-2xl mx-auto">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-ink-900">Grow your business on TELVO</h1>
          <p className="text-ink-500 mt-4 text-lg">Reach more customers, manage your team, and get paid faster.</p>
          <Button size="lg" className="mt-7" onClick={() => navigate('/register')}>Register Your Business</Button>
        </div>
      </section>
      <section className="container-page py-16 grid sm:grid-cols-3 gap-6">
        {benefits.map((b) => (
          <Card key={b.title} className="p-6">
            <b.icon className="text-brand-500 mb-3" size={22} />
            <h3 className="font-semibold text-ink-900">{b.title}</h3>
            <p className="text-sm text-ink-500 mt-1.5">{b.desc}</p>
          </Card>
        ))}
      </section>
    </div>
  );
}
