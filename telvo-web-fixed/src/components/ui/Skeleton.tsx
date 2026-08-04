import clsx from 'clsx';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        'rounded-lg bg-ink-100 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.6),transparent)] bg-[length:400px_100%] animate-shimmer',
        className
      )}
    />
  );
}

export function ProfessionalCardSkeleton() {
  return (
    <div className="rounded-2xl border border-ink-100 p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-14 h-14 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-full rounded-xl" />
      </div>
    </div>
  );
}
