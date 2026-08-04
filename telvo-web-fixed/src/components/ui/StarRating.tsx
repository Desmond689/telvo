import { Star } from 'lucide-react';
import clsx from 'clsx';

export function StarRating({ rating, size = 14, showValue = true, count }: { rating: number; size?: number; showValue?: boolean; count?: number }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            size={size}
            className={clsx(i <= Math.round(rating) ? 'fill-brand-500 text-brand-500' : 'fill-ink-200 text-ink-200')}
          />
        ))}
      </div>
      {showValue && <span className="text-sm font-medium text-ink-700">{rating.toFixed(1)}</span>}
      {typeof count === 'number' && <span className="text-sm text-ink-400">({count})</span>}
    </div>
  );
}
