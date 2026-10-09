import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function ProtectedRoute() {
  const { state } = useAuth();
  const location = useLocation();

  if (state.status === 'loading') {
    return <div className="center-screen muted">Carregando…</div>;
  }

  if (state.status === 'signedOut') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
