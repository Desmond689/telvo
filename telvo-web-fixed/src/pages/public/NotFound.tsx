import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

export function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <p className="text-brand-500 font-extrabold text-6xl">404</p>
      <h1 className="text-xl font-bold text-ink-900 mt-4">Page not found</h1>
      <p className="text-ink-500 mt-2">The page you're looking for doesn't exist or has moved.</p>
      <Link to="/"><Button className="mt-6">Back to home</Button></Link>
    </div>
  );
}
