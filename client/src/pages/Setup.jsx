import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import api, { errMsg } from '../api';
import { useToast } from '../context/ToastContext';
import { Page, Spinner } from '../components/ui';

const TYPES = [['mixed', '🔀 Mixed', 'HR + Technical'], ['hr', '🤝 HR', 'Behavioral'], ['technical', '💻 Technical', 'Concepts + coding']];
const LEVELS = [['any', 'Any'], ['easy', 'Easy'], ['medium', 'Medium'], ['hard', 'Hard']];

export default function Setup() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const toast = useToast();
  const [meta, setMeta] = useState({ companies: [], domains: [] });
  const [f, setF] = useState({ company: params.get('company') || 'general', type: params.get('type') || 'mixed', domain: '', difficulty: 'any', count: 5, language: 'hinglish' });
  const [busy, setBusy] = useState(false);
  useEffect(() => { api.get('/companies').then((r) => setMeta(r.data)).catch(() => {}); }, []);
  const set = (k, v) => setF((o) => ({ ...o, [k]: v }));

  const start = async () => {
    setBusy(true);
    try {
      const co = meta.companies.find((c) => c.id === f.company);
      const { data } = await api.post('/interviews/start', f);
      sessionStorage.setItem('iai_session', JSON.stringify({ setup: { ...f, companyName: co?.name || 'General' }, questions: data.questions }));
      nav('/app/interview/room');
    } catch (e) { toast(errMsg(e), 'error'); setBusy(false); }
  };

  const chips = [{ id: 'general', name: 'General', logo: '🌐' }, ...meta.companies];
  return (
    <Page>
      <div className="section narrow">
        <h1 className="page-title">Setup your interview</h1>
        <p className="muted mb">Apni pasand ke hisab se mock interview customize karo.</p>

        <motion.div className="card setup-block" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h3>1. Company</h3>
          <div className="chip-grid">
            {chips.map((c) => <button key={c.id} className={`chip-co ${f.company === c.id ? 'on' : ''}`} onClick={() => set('company', c.id)}><span>{c.logo}</span>{c.name}</button>)}
          </div>
        </motion.div>

        <motion.div className="card setup-block" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <h3>2. Round type</h3>
          <div className="seg3">
            {TYPES.map(([id, t, d]) => <button key={id} className={`seg-card ${f.type === id ? 'on' : ''}`} onClick={() => set('type', id)}><b>{t}</b><small>{d}</small></button>)}
          </div>
          {f.type !== 'hr' && (
            <>
              <h4 className="mt">Technical focus <small className="muted">(optional)</small></h4>
              <div className="chips">
                <button className={`chip ${f.domain === '' ? 'on' : ''}`} onClick={() => set('domain', '')}>Auto</button>
                {meta.domains.map((d) => <button key={d.id} className={`chip ${f.domain === d.id ? 'on' : ''}`} onClick={() => set('domain', d.id)}>{d.label}</button>)}
              </div>
            </>
          )}
        </motion.div>

        <motion.div className="card setup-block" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
          <div className="grid-2 tight">
            <div><h3>3. Difficulty</h3><div className="chips">{LEVELS.map(([id, l]) => <button key={id} className={`chip ${f.difficulty === id ? 'on' : ''}`} onClick={() => set('difficulty', id)}>{l}</button>)}</div></div>
            <div><h3>4. Questions</h3><div className="chips">{[3, 5, 8, 10].map((n) => <button key={n} className={`chip ${f.count === n ? 'on' : ''}`} onClick={() => set('count', n)}>{n}</button>)}</div></div>
          </div>
          <h4 className="mt">Feedback language</h4>
          <div className="chips">
            <button className={`chip ${f.language === 'hinglish' ? 'on' : ''}`} onClick={() => set('language', 'hinglish')}>Hinglish</button>
            <button className={`chip ${f.language === 'en' ? 'on' : ''}`} onClick={() => set('language', 'en')}>English</button>
          </div>
        </motion.div>

        <div className="info-box">📷 Agle step me camera + mic allow karna hoga. Face aur voice analysis aapke browser me hi hota hai — video/audio kahin upload nahi hota.</div>
        <button className="btn btn-primary btn-lg btn-block sticky-cta" onClick={start} disabled={busy}>{busy ? <Spinner /> : '🚀 Continue to Interview Room'}</button>
      </div>
    </Page>
  );
}
