import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PageSpinner } from '../ui/Spinner';
import type { UserType } from '@/types';

// Client-side route gating only. This is a UX convenience, not a security
// boundary - real authorization is enforced by firestore.rules (see main
// repo) and by the Node backend, exactly as instructed: never trust the
// frontend's idea of role.
export function ProtectedRoute({ allow }: { allow?: UserType[] }) {
  const { firebaseUser, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageSpinner />;

  if (!firebaseUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!profile) return <PageSpinner />;

  if (allow && !allow.includes(profile.userType)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
