import { useNavigate } from 'react-router-dom';
import { ClipboardList, Users, CheckCircle2, Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const steps = [
  { icon: ClipboardList, title: 'Tell us what you need', desc: 'Describe your job, add photos, set a budget and timeline. It takes less than 2 minutes.' },
  { icon: Users, title: 'Compare trusted professionals', desc: 'Verified professionals in your area send quotes. Compare price, rating, and reviews side by side.' },
  { icon: CheckCircle2, title: 'Choose the right professional', desc: 'Accept the quote that fits your budget. We create the job and connect you directly.' },
  { icon: Star, title: 'Get the job done', desc: 'Track progress in real time, pay securely when the work is done, and leave a review.' },
];

export function HowItWorks() {
  const navigate = useNavigate();
  return (
    <div className="container-page py-16">
      <div className="text-center max-w-2xl mx-auto mb-14">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-ink-900">How TELVO Works</h1>
        <p className="text-ink-500 mt-3">From posting a job to getting it done — here's how thousands of Cameroonians use TELVO every day.</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {steps.map((s, i) => (
          <Card key={s.title} className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-9 h-9 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold text-sm">{i + 1}</span>
              <s.icon className="text-brand-500" size={20} />
            </div>
            <h3 className="font-semibold text-ink-900">{s.title}</h3>
            <p className="text-sm text-ink-500 mt-1.5">{s.desc}</p>
          </Card>
        ))}
      </div>
      <div className="text-center mt-14">
        <Button size="lg" onClick={() => navigate('/find-services')}>Find a Professional</Button>
      </div>
    </div>
  );
}
