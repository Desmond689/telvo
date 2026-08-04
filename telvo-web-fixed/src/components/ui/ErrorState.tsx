import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 animate-fade-in">
      <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
        <AlertTriangle className="w-6 h-6 text-red-500" />
      </div>
      <h3 className="text-base font-semibold text-ink-800">Something went wrong</h3>
      <p className="mt-1.5 text-sm text-ink-400 max-w-sm">
        {message || "We couldn't load this right now. Please check your connection and try again."}
      </p>
      {onRetry && (
        <Button variant="outline" className="mt-5" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
