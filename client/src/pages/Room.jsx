import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import api, { errMsg } from '../api';
import { useToast } from '../context/ToastContext';
import { AIOrb } from '../components/Scene';
import { Spinner } from '../components/ui';
import { EXPR_EMOJI, FaceSampler, loadFaceModels } from '../lib/faceAnalyzer';
import { VoiceSampler } from '../lib/voiceAnalyzer';
import { Recognizer, hasSpeechRecognition, speak, stopSpeaking } from '../lib/speech';
import { fmtTime, useIsMobile } from '../lib/hooks';

const KEY = 'iai_session';
const FILLERS = /\b(um|uh|like|you know|basically|literally|honestly|actually|kind of|sort of|i mean)\b/gi;
const EXPR_LABEL = { neutral: 'Calm', happy: 'Smiling', sad: 'Low / nervous', angry: 'Tense', fearful: 'Nervous', disgusted: 'Uneasy', surprised: 'Surprised' };
const STEPS = ['Answers transcribe ho rahe hain…', 'Face expressions read ho rahe hain…', 'Voice tone analyze ho raha hai…', 'Groq AI answers ko score kar raha hai…', 'Aapka report ban raha hai…'];

// ---------- chhote isolated components (parent ko re-render nahi karwate) ----------
function Clock({ since }) {
  const [s, setS] = useState(0);
  useEffect(() => { if (!since) return; const t = setInterval(() => setS(Math.floor((Date.now() - since) / 1000)), 1000); return () => clearInterval(t); }, [since]);
  return <span className="mono">{fmtTime(s)}</span>;
}
function Level({ voice }) {
  const [v, setV] = useState(0);
  useEffect(() => { const t = setInterval(() => setV(Math.min(1, (voice.current?.lastLevel || 0) * 7)), 120); return () => clearInterval(t); }, [voice]);
  return <div className="meter" title="Mic level"><i style={{ width: `${v * 100}%` }} /></div>;
}
function Typewriter({ text }) {
  const [n, setN] = useState(0);
  useEffect(() => { setN(0); const t = setInterval(() => setN((x) => (x >= text.length ? (clearInterval(t), x) : x + 2)), 28); return () => clearInterval(t); }, [text]);
  return <>{text.slice(0, n)}<span className="caret">{n < text.length ? '▍' : ''}</span></>;
}

function SelfView({ videoRef, hud, models, camOn, voice, camPresent }) {
  return (
    <div className="selfview">
      {camPresent ? <video ref={videoRef} className={`mirror ${camOn ? '' : 'off'}`} muted playsInline autoPlay /> : <div className="no-cam">🎙️<small>Audio only</small></div>}
      {!camOn && camPresent && <div className="no-cam abs">📷 Camera off</div>}
      <div className="hud">
        {models === 'ready' && camOn && camPresent && (hud ? (<><span className="hud-chip">{EXPR_EMOJI[hud.top]} {EXPR_LABEL[hud.top]}</span><span className={`hud-chip ${hud.away ? 'warn' : 'ok'}`}>{hud.away ? '👀 Camera ko dekho' : '👁️ Eye contact'}</span></>) : <span className="hud-chip warn">🙈 Face dikh nahi raha</span>)}
        {models === 'loading' && <span className="hud-chip">⏳ Face AI loading…</span>}
        <Level voice={voice} />
      </div>
    </div>
  );
}

export default function Room() {
  const nav = useNavigate();
  const session = useMemo(() => { try { return JSON.parse(sessionStorage.getItem(KEY)); } catch { return null; } }, []);
  useEffect(() => { if (!session?.questions?.length) nav('/app/interview/setup', { replace: true }); }, [session, nav]);
  return session?.questions?.length ? <RoomInner session={session} /> : null;
}

function RoomInner({ session }) {
  const { setup, questions } = session;
  const nav = useNavigate();
  const toast = useToast();
  const mobile = useIsMobile();
  const [phase, setPhase] = useState('check'); // check | live | submitting | error
  const [media, setMedia] = useState({ asked: false, cam: false, mic: false });
  const [models, setModels] = useState('idle');
  const [calib, setCalib] = useState('idle');
  const [qi, setQi] = useState(0);
  const [text, setText] = useState('');
  const [mode, setMode] = useState('idle');
  const [hud, setHud] = useState(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [startAt, setStartAt] = useState(0);
  const [ansAt, setAnsAt] = useState(0);
  const [error, setError] = useState('');
  const [step, setStep] = useState(0);
  const [done, setDone] = useState([]); // answered / skipped per q
  const textRef = useRef('');
  const R = useRef({ stream: null, video: null, face: null, voice: null, rec: null, tts: null, items: [], qi: 0, started: 0, camOn: true, micOn: true, payload: null, textMode: false, startAt: 0 });
  const voiceRef = useMemo(() => ({ get current() { return R.current.voice; } }), []);
  const srOk = hasSpeechRecognition();

  const videoRef = useCallback((el) => {
    R.current.video = el;
    if (el && R.current.stream) { el.srcObject = R.current.stream; el.play?.().catch(() => {}); }
    R.current.face?.setVideo(el);
  }, []);
  const setT = (v) => { textRef.current = v; setText(v); };

  // ---------- cleanup ----------
  const stopAll = useCallback(() => {
    const r = R.current;
    try { r.rec?.stop(); r.tts?.cancel(); stopSpeaking(); r.face?.stop(); r.voice?.stop(); r.stream?.getTracks().forEach((t) => t.stop()); } catch { /* ignore */ }
  }, []);
  useEffect(() => () => stopAll(), [stopAll]);
  useEffect(() => { if (phase !== 'submitting') return; const t = setInterval(() => setStep((s) => Math.min(STEPS.length - 1, s + 1)), 2600); return () => clearInterval(t); }, [phase]);

  // ---------- check phase ----------
  const runCalibration = useCallback(() => {
    const f = R.current.face; if (!f) return;
    setCalib('running'); f.startCalibration();
    const t0 = Date.now();
    const poll = setInterval(() => {
      if (f.calibCount() >= 4 || Date.now() - t0 > 10000) { clearInterval(poll); setCalib(f.finishCalibration() >= 3 ? 'done' : 'failed'); }
    }, 400);
  }, []);

  const initFace = useCallback(async () => {
    setModels('loading');
    try {
      await loadFaceModels();
      const fs = new FaceSampler(R.current.video, (info) => setHud(info));
      R.current.face = fs; fs.start(); setModels('ready');
      runCalibration();
    } catch (e) { console.error(e); setModels('failed'); }
  }, [runCalibration]);

  const enableMedia = async () => {
    try {
      let stream;
      try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: { echoCancellation: true, noiseSuppression: true } }); }
      catch { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
      const r = R.current; r.stream = stream;
      const cam = stream.getVideoTracks().length > 0, mic = stream.getAudioTracks().length > 0;
      setMedia({ asked: true, cam, mic });
      if (r.video) { r.video.srcObject = stream; r.video.play?.().catch(() => {}); }
      if (mic) r.voice = new VoiceSampler(stream);
      if (cam) initFace(); else { setModels('failed'); }
    } catch {
      setMedia({ asked: true, cam: false, mic: false });
      toast('Camera/mic access nahi mila. Browser permission check karo, ya text mode me continue karo.', 'info', 5000);
    }
  };

  // ---------- interview flow ----------
  function askQuestion(i) {
    const r = R.current;
    r.qi = i; r.started = Date.now(); setQi(i); setT(''); setMode('speaking');
    r.face?.setActive(false); r.voice?.setActive(false); r.rec?.stop();
    r.tts = speak(questions[i].q, { onEnd: beginAnswer });
  }
  function beginAnswer() {
    const r = R.current;
    setMode('listening'); r.started = Date.now(); setAnsAt(r.started);
    r.face?.reset(); r.face?.setActive(r.camOn); r.voice?.reset(); r.voice?.setActive(r.micOn);
    if (srOk && r.micOn && !r.textMode) { r.rec = new Recognizer((t) => setT(t)); r.rec.start(); }
  }
  async function startInterview() {
    const r = R.current;
    r.textMode = !media.mic; r.startAt = Date.now();
    if (!media.cam) setCamOn(false), (r.camOn = false);
    r.voice?.start();
    setStartAt(r.startAt); setPhase('live');
    askQuestion(0);
  }
  function submit(skip = false) {
    const r = R.current;
    const ans = skip ? '' : textRef.current.trim();
    if (!skip && !ans) return toast('Pehle answer do (bolo ya type karo) — ya Skip karo', 'info');
    r.rec?.stop(); r.tts?.cancel(); stopSpeaking();
    const face = r.camOn && r.face ? r.face.snapshot() : null;
    const voice = !skip && r.micOn && r.voice ? r.voice.snapshot() : null;
    r.items.push({ qid: questions[r.qi].id, answer: ans, skipped: skip || !ans, timeSpent: Math.round((Date.now() - r.started) / 1000), face, voice });
    r.face?.setActive(false); r.voice?.setActive(false);
    setDone((d) => [...d, skip ? 'skip' : 'ok']);
    if (r.qi + 1 >= questions.length) return finish();
    setMode('thinking');
    toast(skip ? 'Skipped ⏭️' : 'Answer recorded ✅', skip ? 'info' : 'success', 1400);
    setTimeout(() => askQuestion(r.qi + 1), 1100);
  }
  async function finish() {
    const r = R.current;
    stopAll();
    setMode('thinking'); setPhase('submitting'); setStep(0);
    r.payload = { company: setup.companyName, type: setup.type, domain: setup.domain, difficulty: setup.difficulty, language: setup.language, duration: Math.round((Date.now() - r.startAt) / 1000), items: r.items };
    await send();
  }
  async function send() {
    setError(''); setPhase('submitting');
    try {
      const { data } = await api.post('/interviews/finish', R.current.payload);
      sessionStorage.removeItem(KEY);
      nav(`/app/results/${data.interview._id}`, { replace: true });
    } catch (e) { setError(errMsg(e, 'Report banane me error aaya')); setPhase('error'); }
  }
  function endEarly() {
    if (!R.current.items.length) { if (confirm('Interview chhod dena hai? Abhi tak koi answer save nahi hua.')) { stopAll(); sessionStorage.removeItem(KEY); nav('/app'); } return; }
    if (confirm('Interview abhi khatam karke score dekhna hai? (Bache hue questions count nahi honge)')) finish();
  }
  const toggleMic = () => { const r = R.current, on = !micOn; setMicOn(on); r.micOn = on; r.stream?.getAudioTracks().forEach((t) => (t.enabled = on)); if (!on) r.rec?.stop(); else if (mode === 'listening' && srOk) { r.rec = new Recognizer((t) => setT(t)); r.rec.start(textRef.current); } r.voice?.setActive(on && mode === 'listening'); };
  const toggleCam = () => { const r = R.current, on = !camOn; setCamOn(on); r.camOn = on; r.stream?.getVideoTracks().forEach((t) => (t.enabled = on)); r.face?.setActive(on && mode === 'listening'); };
  const onType = (e) => { setT(e.target.value); R.current.rec?.setText(e.target.value); };

  // ---------- derived live stats ----------
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const fillers = (text.match(FILLERS) || []).length;
  const ansSecs = ansAt ? Math.max(1, (Date.now() - ansAt) / 1000) : 1;
  const wpm = words > 8 ? Math.round((words / ansSecs) * 60) : 0;

  // =============== RENDER ===============
  if (phase === 'check') {
    const camPresent = media.cam || !media.asked;
    return (
      <div className="room check">
        <motion.div className="card check-card glass" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
          <h2>Pre-interview check ✅</h2>
          <p className="muted">{setup.companyName} • {setup.type.toUpperCase()} • {questions.length} questions</p>
          <div className="check-grid">
            <div className="check-video">
              <video ref={videoRef} className="mirror" muted playsInline autoPlay />
              {!media.cam && <div className="no-cam abs">{media.asked ? '🎙️ Audio only / no camera' : '📷 Camera preview yaha dikhega'}</div>}
              {calib === 'running' && <div className="calib">👁️ Camera ko seedha dekho… calibrating</div>}
            </div>
            <ul className="checklist">
              <li className={media.asked ? (media.cam && media.mic ? 'ok' : 'warn') : ''}><i>{media.asked ? (media.cam && media.mic ? '✅' : '⚠️') : '⬜'}</i>Camera & Mic <small>{media.asked ? `cam ${media.cam ? 'on' : 'off'} • mic ${media.mic ? 'on' : 'off'}` : 'permission chahiye'}</small></li>
              <li className={models === 'ready' ? 'ok' : models === 'failed' ? 'warn' : ''}><i>{models === 'ready' ? '✅' : models === 'failed' ? '⚠️' : models === 'loading' ? '⏳' : '⬜'}</i>Face expression AI <small>{models === 'failed' ? 'load nahi hua — face score skip hoga' : models === 'loading' ? 'loading…' : 'browser me chalta hai'}</small></li>
              <li className={calib === 'done' ? 'ok' : calib === 'failed' ? 'warn' : ''}><i>{calib === 'done' ? '✅' : calib === 'failed' ? '⚠️' : calib === 'running' ? '⏳' : '⬜'}</i>Eye-contact calibration <small>{calib === 'failed' ? 'face detect nahi hua' : calib === 'done' ? 'ready' : 'camera ko 3 sec dekho'}</small>{(calib === 'done' || calib === 'failed') && <button className="link" onClick={runCalibration}>retry</button>}</li>
              <li className={srOk ? 'ok' : 'warn'}><i>{srOk ? '✅' : '⚠️'}</i>Speech-to-text <small>{srOk ? 'supported' : 'Is browser me nahi — Chrome use karo ya answers type karo'}</small></li>
            </ul>
          </div>
          <div className="info-box">🎧 Tip: Earphones use karo taaki AI ki awaaz aapke mic me na aaye. Light aapke chehre ke saamne rakho aur camera eye-level par.</div>
          <div className="btn-row">
            {!media.asked ? <button className="btn btn-primary btn-lg" onClick={enableMedia}>📷 Allow Camera & Mic</button> : <button className="btn btn-primary btn-lg" onClick={startInterview} disabled={models === 'loading' || calib === 'running'}>{models === 'loading' || calib === 'running' ? <><Spinner /> Preparing…</> : '▶️ Start Interview'}</button>}
            {!media.asked && <button className="btn btn-secondary btn-lg" onClick={() => setMedia({ asked: true, cam: false, mic: false }) || setModels('failed')}>Text mode (no camera)</button>}
            <button className="btn btn-ghost" onClick={() => { stopAll(); nav('/app/interview/setup'); }}>← Back</button>
          </div>
        </motion.div>
      </div>
    );
  }

  const q = questions[qi];
  const camPresent = media.cam;
  const listening = mode === 'listening';
  return (
    <div className={`room live ${mobile ? 'm' : 'd'}`}>
      <header className="room-top">
        <div className="room-meta"><span className="badge badge-purple">{setup.companyName}</span><span className="muted">Q {qi + 1}/{questions.length}</span></div>
        <div className="room-timer">⏱ <Clock since={startAt} /></div>
        <button className="btn btn-danger btn-sm" onClick={endEarly}>End</button>
      </header>

      <div className="room-body">
        <section className="stage card">
          <div className="orb-wrap"><AIOrb mode={mode} compact={mobile} /></div>
          <div className={`status-pill ${mode}`}>{mode === 'speaking' ? '🗣️ AI bol raha hai…' : mode === 'listening' ? '🎙️ Aapki baari — boliye' : mode === 'thinking' ? '🤔 Next question…' : ''}</div>
          <div className="q-bubble">
            <div className="q-meta"><span className="badge badge-blue">Question {qi + 1}</span><span className={`badge ${q.level === 'hard' ? 'badge-red' : q.level === 'medium' ? 'badge-amber' : 'badge-green'}`}>{q.level}</span></div>
            <p key={q.id}><Typewriter text={q.q} /></p>
          </div>
          <SelfView videoRef={videoRef} hud={hud} models={models} camOn={camOn} voice={voiceRef} camPresent={camPresent} />
        </section>

        <section className="answer-panel card">
          <div className="dots">{questions.map((_, i) => <i key={i} className={i < done.length ? done[i] : i === qi ? 'cur' : ''} />)}</div>
          <label className="label">Your answer {listening && srOk && micOn && <span className="rec-dot">● LIVE</span>}</label>
          <textarea className="input answer" value={text} onChange={onType} placeholder={listening ? 'Boliye… aapka answer yaha live text me aayega. Aap type ya edit bhi kar sakte ho.' : 'AI ka question khatam hone ka wait karo…'} disabled={mode === 'thinking'} />
          <div className="live-chips">
            <span className="chip-stat">📝 {words} words</span>
            <span className={`chip-stat ${fillers > 2 ? 'bad' : ''}`}>🗯️ {fillers} fillers</span>
            <span className={`chip-stat ${wpm && (wpm < 100 || wpm > 180) ? 'bad' : wpm ? 'good' : ''}`}>⚡ {wpm || '—'} wpm</span>
            <span className="chip-stat">⏱ {ansAt ? <Clock since={ansAt} /> : '00:00'}</span>
          </div>
          <div className="coach-tip">💡 Tip: <b>Point → Example → Result</b> structure use karo. Numbers aur real example do.</div>
          {!mobile && (
            <div className="controls">
              <button className={`btn btn-secondary ${micOn ? '' : 'off'}`} onClick={toggleMic} disabled={!media.mic}>{micOn ? '🎙️ Mic on' : '🔇 Mic off'}</button>
              <button className={`btn btn-secondary ${camOn ? '' : 'off'}`} onClick={toggleCam} disabled={!media.cam}>{camOn ? '📷 Cam on' : '🚫 Cam off'}</button>
              <button className="btn btn-secondary" onClick={() => submit(true)} disabled={mode === 'thinking'}>⏭ Skip</button>
              <button className="btn btn-primary grow" onClick={() => submit(false)} disabled={mode === 'thinking' || !text.trim()}>✔ Submit Answer</button>
            </div>
          )}
        </section>
      </div>

      {mobile && (
        <div className="room-bar">
          <button className={`rb-btn ${micOn ? '' : 'off'}`} onClick={toggleMic} disabled={!media.mic} aria-label="Toggle mic">{micOn ? '🎙️' : '🔇'}</button>
          <button className={`rb-btn ${camOn ? '' : 'off'}`} onClick={toggleCam} disabled={!media.cam} aria-label="Toggle camera">{camOn ? '📷' : '🚫'}</button>
          <button className="rb-btn" onClick={() => submit(true)} disabled={mode === 'thinking'} aria-label="Skip">⏭</button>
          <button className="btn btn-primary rb-submit" onClick={() => submit(false)} disabled={mode === 'thinking' || !text.trim()}>✔ Submit</button>
        </div>
      )}

      <AnimatePresence>
        {(phase === 'submitting' || phase === 'error') && (
          <motion.div className="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="analyzing-orb"><AIOrb mode="thinking" /></div>
            {phase === 'submitting' ? (
              <>
                <h2>AI aapka interview analyze kar raha hai…</h2>
                <AnimatePresence mode="wait"><motion.p key={step} className="muted" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>{STEPS[step]}</motion.p></AnimatePresence>
                <div className="progress"><motion.i initial={{ width: '4%' }} animate={{ width: `${Math.min(94, 12 + step * 20)}%` }} transition={{ duration: 1.2 }} /></div>
                <small className="muted">Pehli baar server jagne me 30-50 sec lag sakte hain — please wait.</small>
              </>
            ) : (
              <>
                <h2>😕 Report nahi ban paya</h2><p className="muted">{error}</p>
                <div className="btn-row"><button className="btn btn-primary" onClick={send}>🔁 Retry</button><button className="btn btn-secondary" onClick={() => nav('/app')}>Dashboard</button></div>
                <small className="muted">Aapka data safe hai — Retry dabao.</small>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
