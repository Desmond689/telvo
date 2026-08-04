import clsx from 'clsx';
import type { ReactNode } from 'react';

const tones = {
  green: 'bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200',
  gray: 'bg-ink-100 text-ink-600 ring-1 ring-inset ring-ink-200',
  amber: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
  red: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200',
  blue: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200',
};

export function Badge({ children, tone = 'gray', icon }: { children: ReactNode; tone?: keyof typeof tones; icon?: ReactNode }) {
  return (
    <span className={clsx('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium', tones[tone])}>
      {icon}
      {children}
    </span>
  );
}
