import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { Area, Ring } from '../components/Charts';
import { Bar, Counter, Empty, Item, Page, Stagger, Tilt } from '../components/ui';
import { fmtDate, scoreBadge } from '../lib/hooks';

export default function Dashboard() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [s, setS] = useState(null);
  useEffect(() => { api.get('/interviews/stats').then((r) => setS(r.data)).catch(() => setS({ total: 0, avgScore: 0, best: 0, readiness: 0, trend: [], skills: {}, recent: [], byCompany: [] })); }, []);
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  if (!s) return <Page><div className="skeleton-grid"><div className="skeleton h160" /><div className="skeleton h160" /><div className="skeleton h160" /></div></Page>;
  const sk = s.skills || {};
  const tech = Math.round(((sk.relevance || 0) + (sk.depth || 0)) / 2);

  return (
    <Page>
      <Stagger className="section">
        <Item>
          <div className="card hero-card">
            <div className="hero-card-l">
              <small className="muted">{greet} 👋</small>
              <h2>Hi, {user.firstName}!</h2>
              <p className="muted">{s.total ? 'Aapki readiness har interview ke saath badh rahi hai. Keep going!' : 'Apna pehla AI mock interview do aur score dekho.'}</p>
              <div className="btn-row">
                <button className="btn btn-primary" onClick={() => nav('/app/interview/setup')}>🎙️ Start Interview</button>
                <Link className="btn btn-secondary" to="/app/mentor">🤖 Talk to Aria</Link>
              </div>
            </div>
            <div className="hero-card-r"><Ring value={s.readiness} size={150} label={`${s.readiness}%`} sub="Readiness" /></div>
          </div>
        </Item>

        <Item className="grid-4">
          {[['Interviews', s.total, '', 'var(--acc2)'], ['Avg Score', s.avgScore, '%', 'var(--green)'], ['Best Score', s.best, '%', 'var(--amber)'], ['Eye Contact', sk.eyeContact || 0, '%', 'var(--pink)']].map(([l, v, suf, c]) => (
            <Tilt key={l} className="stat" max={6}><div className="stat-v" style={{ color: c }}><Counter value={v} suffix={suf} /></div><div className="stat-l">{l}</div></Tilt>
          ))}
        </Item>

        <Item className="grid-2">
          <div className="card"><h3 className="card-title">Score Trend</h3><Area points={s.trend.map((t) => ({ label: t.company, value: t.score }))} /></div>
          <div className="card">
            <h3 className="card-title">Skill Breakdown</h3>
            {s.total ? (
              <div className="bars">
                <Bar label="Technical / Content" value={tech} color="linear-gradient(90deg,#6c63ff,#a78bfa)" />
                <Bar label="Communication" value={sk.clarity} color="linear-gradient(90deg,#38bdf8,#6c63ff)" />
                <Bar label="Confidence" value={sk.confidence} color="linear-gradient(90deg,#f59e0b,#ec4899)" />
                <Bar label="Voice Tone" value={sk.tone || 0} color="linear-gradient(90deg,#22c55e,#38bdf8)" />
                <Bar label="Eye Contact" value={sk.eyeContact || 0} color="linear-gradient(90deg,#ec4899,#a78bfa)" />
              </div>
            ) : <Empty icon="📊" title="Abhi data nahi" text="Pehla interview complete karte hi skills yaha dikhenge." />}
          </div>
        </Item>

        <Item className="grid-2">
          <div className="card">
            <div className="card-head"><h3 className="card-title">Recent Interviews</h3><Link to="/app/history" className="link">View all →</Link></div>
            {s.recent.length ? s.recent.map((i) => (
              <Link key={i._id} to={`/app/results/${i._id}`} className="row-item">
                <div className="row-ico">🎙️</div>
                <div className="grow"><b>{i.company}</b><small>{i.type?.toUpperCase()} • {fmtDate(i.createdAt)}</small></div>
                <span className={`badge ${scoreBadge(i.score)}`}>{i.score}%</span>
              </Link>
            )) : <Empty icon="🎤" title="No interviews yet" text="Start your first one!" />}
          </div>
          <div className="card">
            <h3 className="card-title">Quick Practice</h3>
            <div className="quick">
              <Link to="/companies" className="quick-item" style={{ '--c': '#6c63ff' }}><span>🏢</span><div><b>Company Mock</b><small>Company-wise questions padho</small></div></Link>
              <Link to="/app/interview/setup?company=general" className="quick-item" style={{ '--c': '#22c55e' }}><span>⚡</span><div><b>Quick Practice</b><small>5 questions • ~10 min</small></div></Link>
              <Link to="/app/mentor" className="quick-item" style={{ '--c': '#f59e0b' }}><span>🤖</span><div><b>AI Mentor</b><small>Career advice, Hindi + English</small></div></Link>
            </div>
          </div>
        </Item>
      </Stagger>
    </Page>
  );
}
