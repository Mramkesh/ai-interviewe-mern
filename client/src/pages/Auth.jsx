import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { errMsg } from '../api';
import { Page, Spinner } from '../components/ui';

const ROLES = ['Software Engineer', 'Frontend Developer', 'Backend Developer', 'Full-Stack (MERN) Developer', 'Python / Django Developer', 'Data Analyst', 'Data Scientist', 'DevOps Engineer', 'Fresher / Other'];

export default function Auth({ mode }) {
  const isReg = mode === 'register';
  const { login, register } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const loc = useLocation();
  const [f, setF] = useState({ firstName: '', lastName: '', email: '', password: '', role: ROLES[0] });
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const u = isReg ? await register(f) : await login({ email: f.email, password: f.password });
      toast(`Welcome ${u.firstName}! 🎉`, 'success');
      nav(loc.state?.from || '/app', { replace: true });
    } catch (err) { toast(errMsg(err), 'error'); } finally { setBusy(false); }
  };

  return (
    <Page className="auth-page">
      <motion.form className="card auth-card glass" onSubmit={submit} initial={{ opacity: 0, scale: 0.96, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}>
        <div className="auth-ico">{isReg ? '🚀' : '👋'}</div>
        <h2>{isReg ? 'Create your account' : 'Welcome back'}</h2>
        <p className="muted">{isReg ? 'Free me start karo — 1 minute lagega' : 'Login karke practice continue karo'}</p>
        {isReg && (
          <div className="row2">
            <label className="field"><span>First name</span><input className="input" required value={f.firstName} onChange={set('firstName')} placeholder="Rahul" autoComplete="given-name" /></label>
            <label className="field"><span>Last name</span><input className="input" value={f.lastName} onChange={set('lastName')} placeholder="Sharma" autoComplete="family-name" /></label>
          </div>
        )}
        <label className="field"><span>Email</span><input className="input" type="email" required value={f.email} onChange={set('email')} placeholder="you@email.com" autoComplete="email" inputMode="email" /></label>
        <label className="field"><span>Password</span>
          <div className="pw"><input className="input" type={show ? 'text' : 'password'} required minLength={6} value={f.password} onChange={set('password')} placeholder="Min 6 characters" autoComplete={isReg ? 'new-password' : 'current-password'} /><button type="button" className="pw-eye" onClick={() => setShow(!show)} aria-label="Show password">{show ? '🙈' : '👁️'}</button></div>
        </label>
        {isReg && <label className="field"><span>Target role</span><select className="input" value={f.role} onChange={set('role')}>{ROLES.map((r) => <option key={r}>{r}</option>)}</select></label>}
        <button className="btn btn-primary btn-lg btn-block" disabled={busy}>{busy ? <Spinner /> : isReg ? 'Create Account' : 'Sign In'}</button>
        <p className="auth-alt">{isReg ? <>Already registered? <Link to="/login">Sign in</Link></> : <>Naye ho? <Link to="/register">Account banao</Link></>}</p>
      </motion.form>
    </Page>
  );
}
