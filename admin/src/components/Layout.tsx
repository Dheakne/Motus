import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import type { AdminRole } from '../api/adminApi';

interface NavItem {
  to: string;
  label: string;
  /** Visível só para quem tem esse papel */
  role?: AdminRole;
}

const NAV: NavItem[] = [
  { to: '/', label: 'Visão geral' },
  { to: '/users', label: 'Usuários' },
];

export default function Layout() {
  const { state, logout } = useAuth();
  if (state.status !== 'signedIn') return null;

  const items = NAV.filter((item) => !item.role || item.role === state.admin.role);

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
        <nav className="nav" aria-label="Seções do painel">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <div className="sheet">
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
