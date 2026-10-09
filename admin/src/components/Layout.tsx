import { Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function Layout() {
  const { state, logout } = useAuth();
  if (state.status !== 'signedIn') return null;

  return (
    <div className="layout">
      <header className="topbar">
        <span className="brand">
          Motus <span className="brand-tag">Admin</span>
        </span>
        <div className="topbar-user">
          <span className="muted">{state.admin.email}</span>
          <span className="role-badge">{state.admin.role}</span>
          <button className="btn btn-ghost" onClick={logout}>
            Sair
          </button>
        </div>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
