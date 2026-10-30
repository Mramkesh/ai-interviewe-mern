import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import api, { errMsg } from '../api';
import { useToast } from '../context/ToastContext';
import { Page } from '../components/ui';
import { AIOrb } from '../components/Scene';

const QUICK = ['Mera next interview kaise prepare karu?', 'STAR method kya hai? Example do', 'Nervousness kaise kam karu?', 'Tell me about yourself ka best answer?', 'Salary negotiation kaise karu?'];

// **bold** + line breaks ko safely render karta hai (no innerHTML)
const Rich = ({ text }) => text.split('\n').map((line, i) => <p key={i}>{line.split(/\*\*(.*?)\*\*/g).map((s, j) => (j % 2 ? <b key={j}>{s}</b> : s))}</p>);
const time = (t) => (t ? new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '');

export default function Mentor() {
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const end = useRef(null);
  const toast = useToast();
  useEffect(() => { api.get('/mentor').then((r) => setMsgs(r.data.messages)).catch((e) => toast(errMsg(e), 'error')); }, [toast]);
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [msgs, busy]);

  const send = async (t = text) => {
    const m = t.trim();
    if (!m || busy) return;
    setText(''); setBusy(true);
    setMsgs((x) => [...x, { role: 'user', text: m, time: new Date() }]);
    try { const r = await api.post('/mentor', { text: m }); setMsgs(r.data.messages); } catch (e) { toast(errMsg(e), 'error'); }
    setBusy(false);
  };
  const clear = async () => { if (!confirm('Chat clear karni hai?')) return; const r = await api.delete('/mentor'); const g = await api.get('/mentor'); setMsgs(g.data.messages); toast('Chat cleared', 'info'); return r; };

  return (
    <Page className="mentor-page">
      <div className="chat-shell">
        <div className="chat-head">
          <div className="chat-orb"><AIOrb mode={busy ? 'thinking' : 'idle'} compact /></div>
          <div className="grow"><b>Aria</b><small>AI Career Mentor • Powered by Groq LLaMA</small></div>
          <button className="btn btn-secondary btn-sm" onClick={clear}>🗑️ Clear</button>
        </div>
        <div className="chat-body">
          <AnimatePresence initial={false}>
            {msgs.map((m, i) => (
              <motion.div key={i} className={`bubble-row ${m.role}`} initial={{ opacity: 0, y: 12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}>
                <div className={`bubble ${m.role}`}><Rich text={m.text} /><small>{time(m.time)}</small></div>
              </motion.div>
            ))}
            {busy && <motion.div key="typing" className="bubble-row ai" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><div className="bubble ai typing"><i /><i /><i /></div></motion.div>}
          </AnimatePresence>
          <div ref={end} />
        </div>
        <div className="chips scroll-x quick-q">{QUICK.map((q) => <button key={q} className="chip" onClick={() => send(q)}>{q}</button>)}</div>
        <div className="chat-input">
          <textarea className="input" rows={1} value={text} placeholder="Aria se kuch bhi poocho…" maxLength={1000} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} />
          <button className="btn btn-primary" onClick={() => send()} disabled={busy || !text.trim()}>Send ➤</button>
        </div>
      </div>
    </Page>
  );
}
