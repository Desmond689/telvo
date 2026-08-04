import { Check } from 'lucide-react';
import clsx from 'clsx';

export function ProgressSteps({ steps, currentIndex }: { steps: string[]; currentIndex: number }) {
  return (
    <div className="flex items-center w-full overflow-x-auto pb-1">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center flex-shrink-0">
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={clsx(
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors',
                i < currentIndex && 'bg-brand-500 text-white',
                i === currentIndex && 'bg-brand-500 text-white ring-4 ring-brand-100',
                i > currentIndex && 'bg-ink-100 text-ink-400'
              )}
            >
              {i < currentIndex ? <Check size={15} /> : i + 1}
            </div>
            <span className={clsx('text-[11px] whitespace-nowrap', i <= currentIndex ? 'text-ink-700 font-medium' : 'text-ink-400')}>
              {step}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={clsx('h-0.5 w-8 sm:w-14 mx-1 mb-4', i < currentIndex ? 'bg-brand-500' : 'bg-ink-100')} />
          )}
        </div>
      ))}
    </div>
  );
}
