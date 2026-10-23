import { Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function Layout() {
  const { state, logout } = useAuth();
  if (state.status !== 'signedIn') return null;

  return (
    <div className="layout">
      <header className="topbar">
        <div className="topbar-inner">
          <span className="brand">
            Motus <span className="brand-tag">Admin</span>
          </span>
          <div className="topbar-user">
            <span className="topbar-email">{state.admin.email}</span>
            <span className="role-badge">{state.admin.role}</span>
            <button className="btn btn-ghost" onClick={logout}>
              Sair
            </button>
          </div>
        </div>
      </header>
      <div className="sheet">
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
