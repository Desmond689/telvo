import { BadgeCheck } from 'lucide-react';

export function VerifiedBadge({ size = 15 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-brand-600" title="Verified by TELVO">
      <BadgeCheck size={size} className="fill-brand-500 text-white" />
    </span>
  );
}
