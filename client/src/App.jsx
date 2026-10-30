import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import { PageLoader } from './components/ui';
import { useAuth } from './context/AuthContext';
import { API_URL } from './api';

const Landing = lazy(() => import('./pages/Landing'));
const Auth = lazy(() => import('./pages/Auth'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Setup = lazy(() => import('./pages/Setup'));
const Room = lazy(() => import('./pages/Room'));
const Results = lazy(() => import('./pages/Results'));
const History = lazy(() => import('./pages/History'));
const Companies = lazy(() => import('./pages/Companies'));
const Mentor = lazy(() => import('./pages/Mentor'));
const Admin = lazy(() => import('./pages/Admin'));

function Protected({ children }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <PageLoader text="Loading your workspace…" />;
  return user ? children : <Navigate to="/login" state={{ from: loc.pathname }} replace />;
}

export default function App() {
  // Render free server so jata hai — app khulte hi ek ping bhej dete hain taaki wo jaldi jag jaye
  useEffect(() => { fetch(API_URL + '/api/health').catch(() => {}); }, []);
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/admin/*" element={<Admin />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Auth mode="login" />} />
          <Route path="/register" element={<Auth mode="register" />} />
          <Route path="/companies" element={<Companies />} />
          <Route path="/companies/:id" element={<Companies />} />
          <Route path="/app" element={<Protected><Dashboard /></Protected>} />
          <Route path="/app/interview/setup" element={<Protected><Setup /></Protected>} />
          <Route path="/app/interview/room" element={<Protected><Room /></Protected>} />
          <Route path="/app/results/:id" element={<Protected><Results /></Protected>} />
          <Route path="/app/history" element={<Protected><History /></Protected>} />
          <Route path="/app/mentor" element={<Protected><Mentor /></Protected>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
