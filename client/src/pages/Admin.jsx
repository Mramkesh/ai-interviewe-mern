import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api, { ADMIN_KEY, errMsg } from '../api';
import Background from '../components/Background';
import { Bar, Counter, Empty, Modal, Spinner, useDebounced } from '../components/ui';
import { useToast } from '../context/ToastContext';
import { fmtDate, fmtTime, scoreBadge, useIsMobile } from '../lib/hooks';

const TABS = [['dashboard', '📊', 'Dashboard'], ['users', '👥', 'Users'], ['interviews', '🎙️', 'Interviews'], ['analytics', '📈', 'Analytics'], ['settings', '⚙️', 'Settings']];

function Login({ onDone }) {
  const [f, setF] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const go = async (e) => {
    e.preventDefault(); setBusy(true);
    try { const { data } = await api.post('/admin/login', f); localStorage.setItem(ADMIN_KEY, data.token); onDone(); } catch (err) { toast(errMsg(err), 'error'); } finally { setBusy(false); }
  };
  return (
    <div className="admin-login">
      <motion.form className="card auth-card glass" onSubmit={go} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
        <div className="auth-ico">🛡️</div><h2>Admin Login</h2><p className="muted">Sirf authorized admins ke liye</p>
        <label className="field"><span>Admin email</span><input className="input" type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
        <label className="field"><span>Password</span><input className="input" type="password" required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></label>
        <button className="btn btn-primary btn-lg btn-block" disabled={busy}>{busy ? <Spinner /> : 'Login'}</button>
        <p className="auth-alt"><Link to="/">← Back to site</Link></p>
      </motion.form>
    </div>
  );
}

const Stat = ({ label, value, suffix, color }) => <div className="stat"><div className="stat-v" style={{ color }}><Counter value={value || 0} suffix={suffix} /></div><div className="stat-l">{label}</div></div>;

function Dashboard() {
  const [o, setO] = useState(null);
  useEffect(() => { api.get('/admin/overview').then((r) => setO(r.data)); }, []);
  if (!o) return <div className="skeleton h160" />;
  return (
    <>
      <div className="grid-4"><Stat label="Total users" value={o.users} color="var(--acc2)" /><Stat label="Total interviews" value={o.interviews} color="var(--green)" /><Stat label="Avg score" value={o.avgScore} suffix="%" color="var(--amber)" /><Stat label="Active users" value={o.active} color="var(--pink)" /></div>
      <div className="grid-2 mt">
        <div className="card"><h3 className="card-title">Last 7 days</h3><div className="stat-row"><div><b>{o.newUsers}</b><small>new users</small></div><div><b>{o.weekInterviews}</b><small>interviews</small></div></div></div>
        <div className="card"><h3 className="card-title">Recent activity</h3>{o.recent.length ? o.recent.map((i) => <div key={i._id} className="row-item"><div className="row-ico">🎙️</div><div className="grow"><b>{i.user?.firstName || 'Deleted user'} • {i.company}</b><small>{fmtDate(i.createdAt)} • {fmtTime(i.duration)}</small></div><span className={`badge ${scoreBadge(i.score)}`}>{i.score}%</span></div>) : <p className="muted">No activity yet.</p>}</div>
      </div>
    </>
  );
}

function Users() {
  const [q, setQ] = useState('');
  const dq = useDebounced(q);
  const [list, setList] = useState(null);
  const [view, setView] = useState(null);
  const mobile = useIsMobile();
  const toast = useToast();
  const load = useCallback(() => api.get('/admin/users', { params: { search: dq } }).then((r) => setList(r.data.users)), [dq]);
  useEffect(() => { load(); }, [load]);
  const toggle = async (u) => { await api.patch(`/admin/users/${u._id}/status`); toast('Status updated', 'success'); load(); };
  const del = async (u) => { if (!confirm(`${u.firstName} aur uske saare interviews delete karne hain?`)) return; await api.delete('/admin/users/' + u._id); toast('User deleted', 'success'); load(); };
  const open = async (u) => { const r = await api.get('/admin/users/' + u._id); setView(r.data); };
  const Actions = ({ u }) => <div className="btn-row tight"><button className="btn btn-secondary btn-sm" onClick={() => open(u)}>View</button><button className="btn btn-sm btn-warn" onClick={() => toggle(u)}>{u.status === 'active' ? 'Block' : 'Unblock'}</button><button className="btn btn-sm btn-danger" onClick={() => del(u)}>🗑️</button></div>;
  return (
    <>
      <input className="input mb" placeholder="🔍 Search name or email…" value={q} onChange={(e) => setQ(e.target.value)} />
      {!list ? <div className="skeleton h160" /> : !list.length ? <Empty icon="👥" title="No users found" /> : mobile ? (
        <div className="list">{list.map((u) => <div key={u._id} className="card ucard"><div className="row-item nolink"><div className="avatar">{u.firstName[0]}</div><div className="grow"><b>{u.firstName} {u.lastName}</b><small>{u.email}</small></div><span className={`badge ${u.status === 'active' ? 'badge-green' : 'badge-red'}`}>{u.status}</span></div><div className="chips sm"><span className="badge badge-purple">{u.role}</span><span className="badge badge-blue">{u.interviews} interviews</span><span className={`badge ${scoreBadge(u.avgScore)}`}>{u.avgScore}%</span></div><Actions u={u} /></div>)}</div>
      ) : (
        <div className="card table-wrap"><table className="table"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Interviews</th><th>Avg</th><th>Joined</th><th>Status</th><th /></tr></thead><tbody>
          {list.map((u) => <tr key={u._id}><td><b>{u.firstName} {u.lastName}</b></td><td className="muted">{u.email}</td><td><span className="badge badge-purple">{u.role}</span></td><td>{u.interviews}</td><td><span className={`badge ${scoreBadge(u.avgScore)}`}>{u.avgScore}%</span></td><td className="muted">{fmtDate(u.createdAt)}</td><td><span className={`badge ${u.status === 'active' ? 'badge-green' : 'badge-red'}`}>{u.status}</span></td><td><Actions u={u} /></td></tr>)}
        </tbody></table></div>
      )}
      <Modal open={!!view} onClose={() => setView(null)} title={view ? `${view.user.firstName} ${view.user.lastName || ''}` : ''}>
        {view && <><p className="muted">{view.user.email} • {view.user.role} • Joined {fmtDate(view.user.createdAt)}</p>{view.interviews.length ? view.interviews.map((i) => <div key={i._id} className="row-item nolink"><div className="grow"><b>{i.company}</b><small>{fmtDate(i.createdAt)} • {i.type}</small></div><span className={`badge ${scoreBadge(i.score)}`}>{i.score}%</span></div>) : <p className="muted">No interviews yet.</p>}</>}
      </Modal>
    </>
  );
}

function Interviews() {
  const [list, setList] = useState(null);
  useEffect(() => { api.get('/admin/interviews').then((r) => setList(r.data.interviews)); }, []);
  if (!list) return <div className="skeleton h160" />;
  if (!list.length) return <Empty icon="🎙️" title="No interviews yet" />;
  return <div className="card">{list.map((i) => <div key={i._id} className="row-item nolink"><div className="row-ico">🎙️</div><div className="grow"><b>{i.user?.firstName || 'Deleted'} {i.user?.lastName || ''} • {i.company}</b><small>{i.user?.email} • {fmtDate(i.createdAt)} • {fmtTime(i.duration)} • {i.type}</small></div><span className={`badge ${scoreBadge(i.score)}`}>{i.score}%</span></div>)}</div>;
}

function Analytics() {
  const [a, setA] = useState(null);
  useEffect(() => { api.get('/admin/analytics').then((r) => setA(r.data)); }, []);
  if (!a) return <div className="skeleton h160" />;
  const max = Math.max(1, ...a.byCompany.map((c) => c.count));
  const labels = { 0: '0-39', 40: '40-54', 55: '55-69', 70: '70-84', 85: '85-100' };
  const total = a.dist.reduce((s, d) => s + d.count, 0) || 1;
  return (
    <div className="grid-2">
      <div className="card"><h3 className="card-title">Top companies</h3>{a.byCompany.length ? a.byCompany.map((c) => <Bar key={c._id} label={`${c._id} (${c.count})`} value={Math.round((c.count / max) * 100)} />) : <p className="muted">No data.</p>}</div>
      <div className="card"><h3 className="card-title">Score distribution</h3>{a.dist.map((d) => <Bar key={d._id} label={`${labels[d._id] || d._id}% (${d.count})`} value={Math.round((d.count / total) * 100)} />)}</div>
      <div className="card full"><h3 className="card-title">Interviews — last 14 days</h3>{a.daily.length ? <div className="daily">{a.daily.map((d) => <div key={d._id} className="daily-col" title={`${d._id}: ${d.count}`}><motion.i initial={{ height: 0 }} animate={{ height: `${Math.max(8, (d.count / Math.max(...a.daily.map((x) => x.count))) * 100)}%` }} /><small>{d._id.slice(5)}</small></div>)}</div> : <p className="muted">No data.</p>}</div>
    </div>
  );
}

function Settings() {
  const [f, setF] = useState({ current: '', next: '' });
  const toast = useToast();
  const save = async (e) => { e.preventDefault(); try { await api.put('/admin/password', f); toast('Password changed ✅', 'success'); setF({ current: '', next: '' }); } catch (err) { toast(errMsg(err), 'error'); } };
  const exportCsv = async () => { const r = await api.get('/admin/export', { responseType: 'blob' }); const a = document.createElement('a'); a.href = URL.createObjectURL(r.data); a.download = 'users.csv'; a.click(); };
  return (
    <div className="grid-2">
      <form className="card" onSubmit={save}><h3 className="card-title">🔑 Change admin password</h3>
        <label className="field"><span>Current password</span><input className="input" type="password" required value={f.current} onChange={(e) => setF({ ...f, current: e.target.value })} /></label>
        <label className="field"><span>New password (min 8)</span><input className="input" type="password" minLength={8} required value={f.next} onChange={(e) => setF({ ...f, next: e.target.value })} /></label>
        <button className="btn btn-primary">Update password</button></form>
      <div className="card"><h3 className="card-title">📤 Export</h3><p className="muted mb">Saare users ki CSV download karo.</p><button className="btn btn-secondary" onClick={exportCsv}>Download users.csv</button></div>
    </div>
  );
}

export default function Admin() {
  const [authed, setAuthed] = useState(Boolean(localStorage.getItem(ADMIN_KEY)));
  const [tab, setTab] = useState('dashboard');
  const mobile = useIsMobile();
  useEffect(() => { const off = () => setAuthed(false); window.addEventListener('iai:admin-logout', off); return () => window.removeEventListener('iai:admin-logout', off); }, []);
  const logout = () => { localStorage.removeItem(ADMIN_KEY); setAuthed(false); };
  const View = { dashboard: Dashboard, users: Users, interviews: Interviews, analytics: Analytics, settings: Settings }[tab];
  return (
    <>
      <Background />
      <div className="app">
        {!authed ? <Login onDone={() => setAuthed(true)} /> : (
          <div className={`admin ${mobile ? 'm' : ''}`}>
            <aside className="admin-side">
              <div className="logo"><span>🛡️ Admin</span></div>
              <nav>{TABS.map(([k, i, l]) => <button key={k} className={`side-btn ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}><span>{i}</span><b>{l}</b></button>)}</nav>
              <button className="side-btn out" onClick={logout}><span>🚪</span><b>Logout</b></button>
            </aside>
            <main className="admin-main"><motion.div key={tab} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}><h1 className="page-title">{TABS.find((t) => t[0] === tab)[2]}</h1><View /></motion.div></main>
          </div>
        )}
      </div>
    </>
  );
}
