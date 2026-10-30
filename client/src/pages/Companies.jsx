import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { Empty, Page, Stagger, Item, Tilt } from '../components/ui';

const DIFF = { Easy: 'badge-green', Medium: 'badge-amber', Hard: 'badge-red' };
const LV = { easy: 'badge-green', medium: 'badge-amber', hard: 'badge-red' };

function List() {
  const [data, setData] = useState(null);
  const [cat, setCat] = useState('all');
  const [q, setQ] = useState('');
  useEffect(() => { api.get('/companies').then((r) => setData(r.data)).catch(() => setData({ companies: [], categories: [] })); }, []);
  const list = useMemo(() => (data?.companies || []).filter((c) => (cat === 'all' || c.category === cat) && (c.name + c.desc).toLowerCase().includes(q.toLowerCase())), [data, cat, q]);
  return (
    <Page>
      <div className="section">
        <h1 className="page-title">Company Mock Interviews</h1>
        <p className="muted mb">Company chuno, real-style questions padho aur seedha mock interview do.</p>
        <div className="toolbar">
          <input className="input" placeholder="🔍 Search company…" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="chips scroll-x">{(data?.categories || []).map((c) => <button key={c.id} className={`chip ${cat === c.id ? 'on' : ''}`} onClick={() => setCat(c.id)}>{c.label}</button>)}</div>
        </div>
        {!data ? <div className="grid-3"><div className="skeleton h160" /><div className="skeleton h160" /><div className="skeleton h160" /></div> : !list.length ? <Empty icon="🔎" title="Koi company nahi mili" /> : (
          <Stagger className="grid-3" key={cat + q}>
            {list.map((c) => (
              <Item key={c.id}>
                <Link to={`/companies/${c.id}`}>
                  <Tilt className="card co-card" style={{ '--c': c.color }}>
                    <div className="co-logo">{c.logo}</div>
                    <div className="grow"><h3>{c.name}</h3><p>{c.desc}</p>
                      <div className="chips sm"><span className={`badge ${DIFF[c.difficulty]}`}>{c.difficulty}</span>{c.tags.map((t) => <span key={t} className="badge badge-blue">{t}</span>)}</div>
                    </div>
                  </Tilt>
                </Link>
              </Item>
            ))}
          </Stagger>
        )}
      </div>
    </Page>
  );
}

function Detail({ id }) {
  const [d, setD] = useState(null);
  const [tab, setTab] = useState('hr');
  const [open, setOpen] = useState(0);
  const { user } = useAuth();
  const nav = useNavigate();
  useEffect(() => { setD(null); api.get('/companies/' + id).then((r) => setD(r.data)).catch(() => setD({ error: true })); }, [id]);
  if (!d) return <Page><div className="section"><div className="skeleton h160" /></div></Page>;
  if (d.error) return <Page><Empty icon="😕" title="Company not found"><Link className="btn btn-primary" to="/companies">Back</Link></Empty></Page>;
  const { company: c, questions } = d;
  const qs = tab === 'hr' ? questions.hr : tab === 'technical' ? questions.technical : [];
  const practice = () => nav(user ? `/app/interview/setup?company=${c.id}` : '/login', { state: { from: `/app/interview/setup?company=${c.id}` } });
  return (
    <Page>
      <div className="section">
        <Link to="/companies" className="link">← All companies</Link>
        <div className="card co-head" style={{ '--c': c.color }}>
          <div className="co-logo lg">{c.logo}</div>
          <div className="grow"><h1>{c.name}</h1><p className="muted">{c.desc}</p>
            <div className="chips sm"><span className={`badge ${DIFF[c.difficulty]}`}>{c.difficulty}</span>{c.tags.map((t) => <span key={t} className="badge badge-blue">{t}</span>)}</div></div>
          <button className="btn btn-primary" onClick={practice}>🎙️ Start Mock Interview</button>
        </div>
        <div className="tabs">
          {[['hr', `HR Questions (${questions.hr.length})`], ['technical', `Technical (${questions.technical.length})`], ['tips', 'Tips & Process']].map(([id2, l]) => <button key={id2} className={`tab ${tab === id2 ? 'active' : ''}`} onClick={() => { setTab(id2); setOpen(0); }}>{l}</button>)}
        </div>
        {tab === 'tips' ? (
          <div className="grid-2">
            <div className="card"><h3 className="card-title">Interview Rounds</h3><ol className="rounds">{c.rounds.map((r) => <li key={r}>{r}</li>)}</ol></div>
            <div className="card"><h3 className="card-title">Pro Tips</h3><ul className="tips">{c.tips.map((t) => <li key={t}>💡 {t}</li>)}</ul></div>
          </div>
        ) : (
          <div className="qa-list">
            {qs.map((x, i) => (
              <div key={x.id} className={`card qa ${open === i ? 'open' : ''}`}>
                <button className="qa-q" onClick={() => setOpen(open === i ? -1 : i)}><span className="qa-n">Q{i + 1}</span><span className="grow">{x.q}</span><span className={`badge ${LV[x.level]}`}>{x.level}</span><span className="qa-arrow">⌄</span></button>
                <AnimatePresence initial={false}>{open === i && <motion.div className="qa-a" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}><div className="ideal"><b>💡 IDEAL APPROACH</b><p>{x.a}</p></div></motion.div>}</AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </div>
    </Page>
  );
}

export default function Companies() {
  const { id } = useParams();
  return id ? <Detail id={id} /> : <List />;
}
