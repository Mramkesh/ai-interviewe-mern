import { useEffect, useState } from 'react';

export function useMedia(query) {
  const get = () => (typeof window !== 'undefined' ? window.matchMedia(query).matches : false);
  const [m, setM] = useState(get);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const fn = () => setM(mq.matches);
    mq.addEventListener('change', fn);
    fn();
    return () => mq.removeEventListener('change', fn);
  }, [query]);
  return m;
}
export const useIsMobile = () => useMedia('(max-width: 820px)');

export function canWebGL() {
  try {
    const c = document.createElement('canvas');
    return Boolean(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch { return false; }
}

export const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
export const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
export const scoreColor = (s) => (s >= 80 ? 'var(--green)' : s >= 60 ? 'var(--amber)' : 'var(--red)');
export const scoreBadge = (s) => (s >= 80 ? 'badge-green' : s >= 60 ? 'badge-amber' : 'badge-red');
