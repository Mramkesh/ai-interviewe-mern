import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import Background from './Background';
import { useAuth } from '../context/AuthContext';
import { useIsMobile } from '../lib/hooks';

const Logo = () => (
  <Link to="/" className="logo" aria-label="InterviewAI Pro">
    <svg width="30" height="30" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="url(#lg)" /><defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#6c63ff" /><stop offset="1" stopColor="#38bdf8" /></linearGradient></defs><circle cx="50" cy="44" r="14" fill="#fff" opacity=".92" /><path d="M24 78c4-16 18-22 26-22s22 6 26 22" fill="#fff" opacity=".92" /></svg>
    <span>InterviewAI <b>Pro</b></span>
  </Link>
);

const NAV = [
  { to: '/app', label: 'Dashboard', icon: '🏠', end: true },
  { to: '/app/interview/setup', label: 'Practice', icon: '🎙️' },
  { to: '/companies', label: 'Companies', icon: '🏢' },
  { to: '/app/mentor', label: 'AI Mentor', icon: '🤖' },
  { to: '/app/history', label: 'History', icon: '📊' },
];

function TopNav() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  return (
    <header className="nav">
      <Logo />
      {user && (
        <nav className="nav-links">
          {NAV.map((n) => <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => 'nav-btn' + (isActive ? ' active' : '')}>{n.label}</NavLink>)}
        </nav>
      )}
      <div className="nav-user">
        {user ? (
          <>
            <span className="nav-username">{user.firstName}</span>
            <button className="avatar" onClick={() => { logout(); nav('/'); }} title="Logout">{user.firstName[0]}</button>
          </>
        ) : (
          <>
            <Link className="btn btn-secondary btn-sm" to="/login">Sign In</Link>
            <Link className="btn btn-primary btn-sm hide-xs" to="/register">Get Started Free</Link>
          </>
        )}
      </div>
    </header>
  );
}

function BottomNav() {
  const loc = useLocation();
  if (loc.pathname.includes('/interview/room')) return null;
  return (
    <nav className="bottom-nav">
      {NAV.map((n, i) => (
        <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => 'bn-item' + (isActive ? ' active' : '') + (i === 1 ? ' fab' : '')}>
          <span className="bn-ico">{n.icon}</span><small>{n.label}</small>
        </NavLink>
      ))}
    </nav>
  );
}

export default function Layout() {
  const { user } = useAuth();
  const mobile = useIsMobile();
  const loc = useLocation();
  const inRoom = loc.pathname.includes('/interview/room');
  return (
    <>
      <Background />
      <div className="app">
        {!inRoom && <TopNav />}
        <Outlet />
        {user && mobile && <BottomNav />}
      </div>
    </>
  );
}
