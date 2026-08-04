export function formatXAF(amount?: number): string {
  if (amount === undefined || amount === null || Number.isNaN(amount)) return '—';
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(amount) + ' FCFA';
}

export function timeAgo(date: any): string {
  if (!date) return '';
  const d = date?.toDate ? date.toDate() : new Date(date);
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

export function jobStatusLabel(status: string): string {
  const map: Record<string, string> = {
    posted: 'Request Created',
    quoted: 'Quote Received',
    accepted: 'Quote Accepted',
    scheduled: 'Job Scheduled',
    on_the_way: 'Professional On The Way',
    in_progress: 'Work Started',
    completed: 'Work Completed',
    confirmed: 'Customer Confirmed',
    paid: 'Payment Completed',
    reviewed: 'Review Submitted',
    cancelled: 'Cancelled',
    disputed: 'Disputed',
  };
  return map[status] || status;
}
