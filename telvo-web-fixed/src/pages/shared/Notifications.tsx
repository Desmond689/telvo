import { useEffect, useState } from 'react';
import { Bell, MessageSquare, FileText, CreditCard, Star, ShieldCheck, Megaphone } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { listenToNotifications, markNotificationRead } from '@/services/notificationService';
import type { AppNotification } from '@/types';
import { timeAgo } from '@/utils/format';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';

const ICONS: Record<string, any> = {
  new_request: FileText, new_quote: FileText, quote_accepted: FileText, quote_rejected: FileText,
  new_message: MessageSquare, job_status: FileText, payment: CreditCard, review: Star, verification: ShieldCheck, system: Megaphone,
};

export function Notifications() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<AppNotification[] | null>(null);

  useEffect(() => {
    if (!profile) return;
    return listenToNotifications(profile.id, setItems);
  }, [profile]);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-ink-900 mb-6">Notifications</h1>
      {items === null && <p className="text-sm text-ink-400">Loading...</p>}
      {items?.length === 0 && <EmptyState icon={<Bell size={36} />} title="You're all caught up" description="New job updates, messages, and quotes will show up here." />}
      <div className="space-y-2">
        {items?.map((n) => {
          const Icon = ICONS[n.type] || Bell;
          return (
            <Card
              key={n.id}
              className={clsx('p-4 flex gap-3 cursor-pointer', !n.isRead && 'bg-brand-50/40 border-brand-100')}
              onClick={() => {
                markNotificationRead(n.id);
                if (n.actionUrl) navigate(n.actionUrl);
              }}
            >
              <span className="w-9 h-9 rounded-lg bg-white border border-ink-100 flex items-center justify-center text-brand-500 flex-shrink-0">
                <Icon size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink-900">{n.title}</p>
                <p className="text-sm text-ink-500 mt-0.5">{n.body}</p>
                <p className="text-xs text-ink-400 mt-1">{timeAgo(n.createdAt)}</p>
              </div>
              {!n.isRead && <span className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0 mt-1.5" />}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
