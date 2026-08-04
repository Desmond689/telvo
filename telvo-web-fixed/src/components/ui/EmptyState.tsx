import type { ReactNode } from 'react';
import { Button } from './Button';

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 animate-fade-in">
      {icon && <div className="mb-4 text-ink-300">{icon}</div>}
      <h3 className="text-base font-semibold text-ink-800">{title}</h3>
      {description && <p className="mt-1.5 text-sm text-ink-400 max-w-sm">{description}</p>}
      {actionLabel && onAction && (
        <Button className="mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
