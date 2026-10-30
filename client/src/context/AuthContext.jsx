import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api, { TOKEN_KEY } from '../api';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem(TOKEN_KEY)));

  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) return;
    api.get('/auth/me').then((r) => setUser(r.data.user)).catch(() => localStorage.removeItem(TOKEN_KEY)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const off = () => setUser(null);
    window.addEventListener('iai:logout', off);
    return () => window.removeEventListener('iai:logout', off);
  }, []);

  const handle = (r) => { localStorage.setItem(TOKEN_KEY, r.data.token); setUser(r.data.user); return r.data.user; };
  const login = useCallback((body) => api.post('/auth/login', body).then(handle), []);
  const register = useCallback((body) => api.post('/auth/register', body).then(handle), []);
  const logout = useCallback(() => { localStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem('iai_session'); setUser(null); }, []);
  const value = useMemo(() => ({ user, setUser, loading, login, register, logout }), [user, loading, login, register, logout]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
