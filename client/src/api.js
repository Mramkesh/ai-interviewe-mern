import axios from 'axios';

export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');
export const TOKEN_KEY = 'iai_token';
export const ADMIN_KEY = 'iai_admin_token';

const api = axios.create({ baseURL: API_URL + '/api', timeout: 90000 });

api.interceptors.request.use((cfg) => {
  const isAdmin = cfg.url?.startsWith('/admin') && !cfg.url.startsWith('/admin/login');
  const token = localStorage.getItem(isAdmin ? ADMIN_KEY : TOKEN_KEY);
  if (token) cfg.headers.Authorization = 'Bearer ' + token;
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const url = err.config?.url || '';
    if (err.response?.status === 401 && !url.includes('/login') && !url.includes('/register')) {
      const isAdmin = url.startsWith('/admin');
      localStorage.removeItem(isAdmin ? ADMIN_KEY : TOKEN_KEY);
      window.dispatchEvent(new Event(isAdmin ? 'iai:admin-logout' : 'iai:logout'));
    }
    return Promise.reject(err);
  }
);

export const errMsg = (e, fallback = 'Kuch gadbad ho gayi, dobara try karo') =>
  e?.response?.data?.message || (e?.code === 'ECONNABORTED' ? 'Server slow hai (free server jag raha hoga), thodi der baad try karo' : e?.message === 'Network Error' ? 'Server se connect nahi ho pa raha. Internet ya API URL check karo.' : fallback);

export default api;
