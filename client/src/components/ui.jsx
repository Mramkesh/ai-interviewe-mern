import { Component, useEffect, useRef, useState } from 'react';
import { AnimatePresence, animate, motion, useInView, useMotionValue, useReducedMotion, useTransform } from 'framer-motion';

export const Spinner = ({ size = 22 }) => <span className="spinner" style={{ width: size, height: size }} />;

export function PageLoader({ text = 'Loading…' }) {
  return (
    <div className="page-loader">
      <div className="orb-fallback sm" />
      <p>{text}</p>
    </div>
  );
}

export const Page = ({ children, className = '' }) => (
  <motion.main className={`page ${className}`} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
    {children}
  </motion.main>
);

export const Empty = ({ icon = '📭', title, text, children }) => (
  <div className="empty">
    <div className="empty-ico">{icon}</div>
    <h3>{title}</h3>
    {text && <p>{text}</p>}
    {children}
  </div>
);

// Number count-up animation
export function Counter({ value = 0, suffix = '', duration = 1.1 }) {
  const ref = useRef(null);
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) => Math.round(v) + suffix);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  useEffect(() => {
    if (!inView) return;
    if (reduce) { mv.set(value); return; }
    const c = animate(mv, value, { duration, ease: 'easeOut' });
    return () => c.stop();
  }, [inView, value, duration, reduce, mv]);
  return <motion.span ref={ref}>{text}</motion.span>;
}

// 3D tilt on hover (desktop only effect, touch par flat)
export function Tilt({ children, className = '', max = 8, ...rest }) {
  const ref = useRef(null);
  const move = (e) => {
    const el = ref.current;
    if (!el || e.pointerType === 'touch') return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(900px) rotateY(${x * max}deg) rotateX(${-y * max}deg) translateZ(0)`;
    el.style.setProperty('--mx', `${(x + 0.5) * 100}%`);
    el.style.setProperty('--my', `${(y + 0.5) * 100}%`);
  };
  const leave = () => { if (ref.current) ref.current.style.transform = ''; };
  return <div ref={ref} className={`tilt ${className}`} onPointerMove={move} onPointerLeave={leave} {...rest}>{children}</div>;
}

export function Modal({ open, onClose, children, title }) {
  useEffect(() => {
    if (!open) return;
    const k = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', k);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', k); document.body.style.overflow = ''; };
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div className="modal" role="dialog" aria-modal="true" initial={{ y: 40, scale: 0.96, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} exit={{ y: 30, opacity: 0 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-head"><h3>{title}</h3><button className="icon-btn" onClick={onClose} aria-label="Close">✕</button></div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export const Stagger = ({ children, className = '', delay = 0.06 }) => (
  <motion.div className={className} initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: delay } } }}>{children}</motion.div>
);
export const Item = ({ children, className = '', ...p }) => (
  <motion.div className={className} variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } } }} {...p}>{children}</motion.div>
);

// Reveal on scroll
export const Reveal = ({ children, className = '', delay = 0, y = 28 }) => (
  <motion.div className={className} initial={{ opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}>{children}</motion.div>
);

export class Boundary extends Component {
  state = { err: false };
  static getDerivedStateFromError() { return { err: true }; }
  render() { return this.state.err ? this.props.fallback ?? null : this.props.children; }
}

export function useDebounced(v, ms = 250) {
  const [d, setD] = useState(v);
  useEffect(() => { const t = setTimeout(() => setD(v), ms); return () => clearTimeout(t); }, [v, ms]);
  return d;
}

export const Bar = ({ label, value, color = 'var(--grad)', hint }) => (
  <div className="bar-row">
    <div className="bar-top"><span>{label}</span><b>{value == null ? '—' : `${value}%`}</b></div>
    <div className="bar-track"><motion.div className="bar-fill" style={{ background: color }} initial={{ width: 0 }} animate={{ width: `${value || 0}%` }} transition={{ duration: 0.9, ease: 'easeOut' }} /></div>
    {hint && <small>{hint}</small>}
  </div>
);
