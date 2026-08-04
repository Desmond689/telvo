import { useNavigate } from 'react-router-dom';
import { TrendingUp, Clock, ShieldCheck, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const benefits = [
  { icon: TrendingUp, title: 'Grow your client base', desc: 'Get discovered by thousands of customers actively looking for your service.' },
  { icon: Clock, title: 'Work on your schedule', desc: 'Set your own availability and choose the jobs that fit your time.' },
  { icon: Wallet, title: 'Get paid securely', desc: 'Cash, MTN Mobile Money, or Orange Money — track every payment in your earnings dashboard.' },
  { icon: ShieldCheck, title: 'Build trust with reviews', desc: 'Verified badge and customer reviews help you stand out.' },
];

export function BecomeAProfessional() {
  const navigate = useNavigate();
  return (
    <div>
      <section className="bg-gradient-to-b from-brand-50/60 to-white py-16">
        <div className="container-page text-center max-w-2xl mx-auto">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-ink-900">Earn more, on your terms</h1>
          <p className="text-ink-500 mt-4 text-lg">Join thousands of trusted professionals earning a living through TELVO across Cameroon.</p>
          <Button size="lg" className="mt-7" onClick={() => navigate('/register')}>Become a Professional</Button>
        </div>
      </section>
      <section className="container-page py-16 grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {benefits.map((b) => (
          <Card key={b.title} className="p-6">
            <b.icon className="text-brand-500 mb-3" size={22} />
            <h3 className="font-semibold text-ink-900">{b.title}</h3>
            <p className="text-sm text-ink-500 mt-1.5">{b.desc}</p>
          </Card>
        ))}
      </section>
      <section className="bg-ink-50 py-16 text-center">
        <h2 className="text-2xl font-bold text-ink-900">Ready to start earning?</h2>
        <p className="text-ink-500 mt-2">Registration takes about 10 minutes.</p>
        <Button size="lg" className="mt-6" onClick={() => navigate('/register')}>Get Started</Button>
      </section>
    </div>
  );
}
