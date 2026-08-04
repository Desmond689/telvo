import { useState } from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';

export function Contact() {
  const [sent, setSent] = useState(false);
  return (
    <div className="container-page py-16">
      <div className="max-w-4xl mx-auto grid sm:grid-cols-2 gap-10">
        <div>
          <h1 className="text-3xl font-extrabold text-ink-900">Get in touch</h1>
          <p className="text-ink-500 mt-3">Questions, feedback, or partnership ideas — we'd love to hear from you.</p>
          <div className="mt-6 space-y-4 text-sm text-ink-600">
            <p className="flex items-center gap-2"><Mail size={16} className="text-brand-500" /> support@telvo.com</p>
            <p className="flex items-center gap-2"><Phone size={16} className="text-brand-500" /> +237 6XX XXX XXX</p>
            <p className="flex items-center gap-2"><MapPin size={16} className="text-brand-500" /> Yaoundé, Cameroon</p>
          </div>
        </div>
        <Card className="p-6">
          {sent ? (
            <p className="text-sm text-brand-600 font-medium">Thanks — we'll get back to you shortly.</p>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} className="space-y-4">
              <Input label="Full name" required />
              <Input label="Email" type="email" required />
              <Textarea label="Message" required />
              <Button type="submit" fullWidth>Send message</Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
