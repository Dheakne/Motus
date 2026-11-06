import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

/** Telas exclusivas de superadmin. O backend também bloqueia (403 SUPERADMIN_REQUIRED). */
export default function SuperadminRoute() {
  const { state } = useAuth();
  if (state.status !== 'signedIn' || state.admin.role !== 'superadmin') {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
