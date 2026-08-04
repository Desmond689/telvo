import { type HTMLAttributes } from 'react';
import clsx from 'clsx';

export function Card({ className, hover, ...props }: HTMLAttributes<HTMLDivElement> & { hover?: boolean }) {
  return (
    <div
      className={clsx(
        'bg-white rounded-2xl border border-ink-100 shadow-card',
        hover && 'transition-shadow duration-200 hover:shadow-card-hover',
        className
      )}
      {...props}
    />
  );
}
