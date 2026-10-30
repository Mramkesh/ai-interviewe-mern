import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import api from '../api';
import { Ring, Radar } from '../components/Charts';
import { Bar, Empty, Page, Stagger, Item, Counter } from '../components/ui';
import { EXPR_EMOJI } from '../lib/faceAnalyzer';
import { fmtDate, fmtTime, scoreBadge, scoreColor, useIsMobile } from '../lib/hooks';

const LV = { good: ['✅', 'good'], warn: ['⚠️', 'warn'], bad: ['❌', 'bad'] };
const TABS = [['overview', '📋 Overview'], ['answers', '📝 Answers'], ['delivery', '😊 Face & Voice'], ['plan', '🎯 Action Plan']];

function Part({ icon, label, value, weight }) {
  const na = value == null;
  return (
    <div className={`part ${na ? 'na' : ''}`}>
      <div className="part-ico">{icon}</div>
      <div className="grow"><b>{label}</b><small>{na ? 'Not available (camera/mic off)' : `Weight ${weight}%`}</small></div>
      <div className="part-v" style={{ color: na ? 'var(--text3)' : scoreColor(value) }}>{na ? '—' : <Counter value={value} suffix="%" />}</div>
    </div>
  );
}

function Question({ q, i, openDefault }) {
  const [open, setOpen] = useState(openDefault);
  const ai = q.ai || {};
  return (
    <div className={`card qres ${open ? 'open' : ''}`}>
      <button className="qres-head" onClick={() => setOpen(!open)}>
        <span className="qa-n">Q{i + 1}</span><span className="grow">{q.question}</span>
        {q.skipped ? <span className="badge badge-red">Skipped</span> : <span className={`badge ${scoreBadge(ai.score)}`}>{ai.score}%</span>}
        <span className="qa-arrow">⌄</span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div className="qres-body" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            {!q.skipped && (
              <>
                <div className="box you"><b>YOUR ANSWER <small>({q.metrics?.wordCount || 0} words)</small></b><p>{q.answer}</p></div>
                <div className="mini-bars">{[['Relevance', ai.relevance], ['Depth', ai.depth], ['Structure', ai.structure], ['Clarity', ai.clarity]].map(([l, v]) => <Bar key={l} label={l} value={v} />)}</div>
              </>
            )}
            {!!ai.mistakes?.length && <div className="box bad"><b>❌ KAHA GALTI HUI</b><ul>{ai.mistakes.map((m, k) => <li key={k}>{m}</li>)}</ul></div>}
            {!!ai.strengths?.length && <div className="box good"><b>✅ ACHHA KYA THA</b><ul>{ai.strengths.map((m, k) => <li key={k}>{m}</li>)}</ul></div>}
            {ai.improvedAnswer && <div className="box better"><b>✨ BETTER ANSWER (model)</b><p>{ai.improvedAnswer}</p></div>}
            {ai.tip && <div className="box tip"><b>💡 TIP</b><p>{ai.tip}</p></div>}
            {(q.voice || q.face) && (
              <div className="chips sm">
                {q.voice && <><span className="badge badge-blue">🎙️ {q.voice.wpm} wpm</span><span className="badge badge-blue">Tone {q.voice.tone}%</span><span className="badge badge-blue">Fluency {q.voice.fluency}%</span></>}
                {q.face && <><span className="badge badge-pink">👁 Eye {q.face.eyeContact}%</span><span className="badge badge-pink">{EXPR_EMOJI[q.face.dominant]} {q.face.dominant}</span></>}
              </div>
            )}
            <details className="ideal-ref"><summary>Reference key points</summary><p>{q.ideal}</p></details>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Results() {
  const { id } = useParams();
  const nav = useNavigate();
  const mobile = useIsMobile();
  const [d, setD] = useState(null);
  const [tab, setTab] = useState('overview');
  const [checked, setChecked] = useState({});
  useEffect(() => { api.get('/interviews/' + id).then((r) => setD(r.data.interview)).catch(() => setD({ error: true })); }, [id]);

  if (!d) return <Page><div className="section"><div className="skeleton h160" /><div className="skeleton h160" /></div></Page>;
  if (d.error) return <Page><Empty icon="😕" title="Interview not found"><Link className="btn btn-primary" to="/app">Dashboard</Link></Empty></Page>;

  const { breakdown: b = {}, skills: s = {}, face, voice, delivery = [], summary = {}, questions = [] } = d;
  const radar = [['Relevance', s.relevance], ['Depth', s.depth], ['Structure', s.structure], ['Clarity', s.clarity], ['Confidence', s.confidence], ['Eye contact', s.eyeContact], ['Voice tone', s.tone], ['Fluency', s.fluency]].filter(([, v]) => v != null).map(([label, value]) => ({ label, value }));
  const retry = () => nav(`/app/interview/setup?company=${d.company.toLowerCase()}&type=${d.type}`);

  return (
    <Page className="results">
      <div className="section">
        <div className="card score-hero">
          <div className="score-ring"><Ring value={d.score} size={mobile ? 170 : 210} stroke={14} label={`${d.score}%`} sub={d.grade} /></div>
          <div className="score-info">
            <small className="muted">{fmtDate(d.createdAt)} • {fmtTime(d.duration)} • {questions.length} questions</small>
            <h1>{d.company} <span className="badge badge-purple">{d.type}</span></h1>
            <p className="muted">{summary.text}</p>
            <div className="parts">
              <Part icon="📝" label="Answers (AI)" value={b.answer} weight={b.used?.answer} />
              <Part icon="🎙️" label="Voice tone" value={b.voice} weight={b.used?.voice} />
              <Part icon="😊" label="Face & body language" value={b.face} weight={b.used?.face} />
            </div>
          </div>
        </div>

        <div className="tabs sticky">{TABS.map(([k, l]) => <button key={k} className={`tab ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>{l}</button>)}</div>

        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            {tab === 'overview' && (
              <div className="grid-2">
                <div className="card"><h3 className="card-title">Skill Radar</h3>{radar.length >= 3 ? <Radar data={radar} /> : <Empty icon="📡" title="Radar ke liye data kam hai" />}</div>
                <div className="stack">
                  <div className="card good-box"><h3 className="card-title">💪 Top Strengths</h3>{summary.topStrengths?.length ? <ul className="clean">{summary.topStrengths.map((x, i) => <li key={i}>{x}</li>)}</ul> : <p className="muted">Aur practice karo — strengths yaha dikhenge.</p>}</div>
                  <div className="card bad-box"><h3 className="card-title">🚨 Top Mistakes — yaha galti hui</h3>{summary.topMistakes?.length ? <ul className="clean">{summary.topMistakes.map((x, i) => <li key={i}>{x}</li>)}</ul> : <p className="muted">Koi major mistake nahi mili 🎉</p>}</div>
                </div>
                <div className="card full"><h3 className="card-title">Skill scores</h3>
                  <div className="grid-4 bars-grid">{[['Relevance', s.relevance], ['Depth', s.depth], ['Clarity', s.clarity], ['Confidence', s.confidence], ['Keywords', s.keywords], ['Filler-free', s.fillerFree], ['Completion', s.completion], ['Eye contact', s.eyeContact]].map(([l, v]) => <Bar key={l} label={l} value={v} />)}</div></div>
              </div>
            )}

            {tab === 'answers' && <div className="qres-list">{questions.map((q, i) => <Question key={q.qid + i} q={q} i={i} openDefault={i === 0} />)}</div>}

            {tab === 'delivery' && (
              <div className="grid-2">
                <div className="card">
                  <h3 className="card-title">😊 Face Analysis {face && <span className={`badge ${scoreBadge(face.score)}`}>{face.score}%</span>}</h3>
                  {face ? (
                    <>
                      <div className="expr-grid">{Object.entries(face.expr).sort((a, b) => b[1] - a[1]).map(([k, v]) => <div key={k} className="expr"><span>{EXPR_EMOJI[k]}</span><div className="expr-bar"><motion.i initial={{ height: 0 }} animate={{ height: `${Math.max(4, v)}%` }} /></div><small>{k}</small><b>{v}%</b></div>)}</div>
                      <div className="mini-bars"><Bar label="Eye contact" value={face.eyeContact} /><Bar label="Composure (calm)" value={face.composure} /><Bar label="Warmth / smile" value={face.warmth} /><Bar label="Face visible in frame" value={face.presence} /></div>
                      <p className="note">ℹ️ Ye AI estimates hain (camera quality/light par depend karte hain) — practice guide ke liye, final judgement nahi.</p>
                    </>
                  ) : <Empty icon="📷" title="Face data nahi mila" text="Camera off tha ya face detect nahi hua. Next time camera on rakho." />}
                </div>
                <div className="card">
                  <h3 className="card-title">🎙️ Voice Analysis {voice && <span className={`badge ${scoreBadge(voice.score)}`}>{voice.score}%</span>}</h3>
                  {voice ? (
                    <>
                      <div className="stat-row"><div><b>{voice.wpm}</b><small>words/min</small></div><div><b>{voice.pitchVar}</b><small>pitch variation (st)</small></div><div><b>{voice.pausePct}%</b><small>pauses</small></div></div>
                      <div className="mini-bars"><Bar label="Volume" value={voice.volume} /><Bar label="Tone / expressiveness" value={voice.tone} /><Bar label="Pace" value={voice.pace} /><Bar label="Fluency" value={voice.fluency} /></div>
                    </>
                  ) : <Empty icon="🎙️" title="Voice data nahi mila" text="Mic off tha ya answers type kiye gaye." />}
                </div>
                <div className="card full">
                  <h3 className="card-title">🧭 Delivery Feedback</h3>
                  {delivery.length ? <Stagger className="deliv">{delivery.map((x, i) => <Item key={i} className={`deliv-item ${LV[x.level][1]}`}><span>{LV[x.level][0]}</span><div><b>{x.area}</b><p>{x.detail}</p></div></Item>)}</Stagger> : <p className="muted">Delivery feedback ke liye camera/mic on rakhna hoga.</p>}
                </div>
              </div>
            )}

            {tab === 'plan' && (
              <div className="grid-2">
                <div className="card"><h3 className="card-title">🗓️ 7-Day Action Plan</h3>
                  <ul className="plan">{(summary.actionPlan || []).map((x, i) => <li key={i} className={checked[i] ? 'done' : ''}><label><input type="checkbox" checked={!!checked[i]} onChange={() => setChecked({ ...checked, [i]: !checked[i] })} /><span>{x}</span></label></li>)}</ul></div>
                <div className="card center"><div className="big-emoji">🚀</div><h3>Ready for the next round?</h3><p className="muted">Weak areas par dhyan do aur dobara practice karo. Har attempt ke saath score badhta hai.</p>
                  <div className="btn-row center"><button className="btn btn-primary" onClick={retry}>🔁 Practice Again</button><Link className="btn btn-secondary" to="/app/mentor">🤖 Ask Aria</Link><button className="btn btn-secondary hide-xs" onClick={() => window.print()}>🖨️ Save PDF</button></div></div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </Page>
  );
}
