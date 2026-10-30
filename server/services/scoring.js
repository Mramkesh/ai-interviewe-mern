const clamp = (n, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Number.isFinite(n) ? n : 0));
const num = (v, max = 1e6) => clamp(Number(v) || 0, 0, max);
const r = Math.round;
export const WEIGHTS = { answer: 0.5, voice: 0.25, face: 0.25 };
const EXPR = ['neutral', 'happy', 'sad', 'angry', 'fearful', 'disgusted', 'surprised'];

// ---------- FACE ----------
export function cleanFace(raw) {
  if (!raw) return null;
  const f = { ticks: num(raw.ticks, 5000), detected: num(raw.detected, 5000), away: num(raw.away, 5000), smile: num(raw.smile, 5000), stress: num(raw.stress, 5000), expr: {} };
  EXPR.forEach((k) => (f.expr[k] = num(raw.expr?.[k], 5000)));
  f.detected = Math.min(f.detected, f.ticks);
  f.away = Math.min(f.away, f.detected);
  return f;
}

export function sumFace(list) {
  const t = { ticks: 0, detected: 0, away: 0, smile: 0, stress: 0, expr: Object.fromEntries(EXPR.map((k) => [k, 0])) };
  list.filter(Boolean).forEach((f) => {
    ['ticks', 'detected', 'away', 'smile', 'stress'].forEach((k) => (t[k] += f[k]));
    EXPR.forEach((k) => (t.expr[k] += f.expr[k]));
  });
  return t;
}

export function scoreFace(f) {
  if (!f || f.ticks < 4) return null;
  const det = Math.max(1, f.detected);
  const presence = f.detected / f.ticks;
  const eye = (f.detected - f.away) / det;
  const smileRatio = f.smile / det;
  const stressRatio = f.stress / det;
  const parts = {
    eyeContact: r(clamp((eye / 0.85) * 100)),
    composure: r(clamp(100 - stressRatio * 160)),
    warmth: r(clamp(45 + smileRatio * 140)),
    presence: r(clamp((presence / 0.9) * 100)),
  };
  const expr = Object.fromEntries(EXPR.map((k) => [k, r((f.expr[k] / det) * 100)]));
  const dominant = EXPR.reduce((a, b) => (f.expr[b] > f.expr[a] ? b : a), 'neutral');
  const score = r(0.35 * parts.eyeContact + 0.3 * parts.composure + 0.2 * parts.warmth + 0.15 * parts.presence);
  return { score, ...parts, expr, dominant, smilePct: r(smileRatio * 100), stressPct: r(stressRatio * 100), awayPct: r((1 - eye) * 100), presencePct: r(presence * 100), samples: f.ticks };
}

// ---------- VOICE ----------
export function cleanVoice(raw) {
  if (!raw || !raw.available) return null;
  return {
    voicedSec: num(raw.voicedSec, 3600), activeSec: num(raw.activeSec, 3600), pauseSec: num(raw.pauseSec, 3600), longPauses: num(raw.longPauses, 500),
    avgRms: num(raw.avgRms, 1), pitchStd: num(raw.pitchStd, 30), pitchSamples: num(raw.pitchSamples, 100000), pitchMean: num(raw.pitchMean, 1000), clipPct: num(raw.clipPct, 100),
  };
}

export function scoreVoice(v, { words = 0, fillers = 0 } = {}) {
  if (!v || v.voicedSec < 3) return null;
  const rms = v.avgRms;
  let volume = rms < 0.015 ? 30 : rms < 0.03 ? 30 + ((rms - 0.015) / 0.015) * 55 : rms <= 0.25 ? 100 : 70;
  if (v.clipPct > 8) volume = Math.min(volume, 65);
  const s = v.pitchStd;
  const tone = v.pitchSamples < 15 ? 60 : s < 0.8 ? 35 : s < 1.5 ? 60 : s < 2.2 ? 80 : s <= 5.5 ? 100 : s <= 7 ? 85 : 65;
  const wpm = v.activeSec > 3 ? words / (v.activeSec / 60) : 0;
  const pace = !wpm ? 60 : wpm >= 120 && wpm <= 160 ? 100 : wpm >= 100 && wpm <= 180 ? 85 : wpm >= 80 && wpm <= 200 ? 65 : 45;
  const pauseRatio = v.pauseSec / Math.max(1, v.activeSec);
  const fillerRate = (fillers / Math.max(1, words)) * 100;
  const fluency = clamp(100 - clamp((pauseRatio - 0.25) * 140, 0, 45) - clamp(fillerRate * 6, 0, 40) - clamp(v.longPauses * 4, 0, 15));
  const score = r(0.2 * volume + 0.3 * tone + 0.25 * pace + 0.25 * fluency);
  return { score, volume: r(volume), tone: r(tone), pace: r(pace), fluency: r(fluency), wpm: r(wpm), pitchVar: +s.toFixed(1), pausePct: r(pauseRatio * 100), longPauses: v.longPauses, loudness: +(rms * 100).toFixed(1), voicedSec: r(v.voicedSec) };
}

export function aggregateVoice(list) {
  const ok = list.filter((x) => x && x.voicedSec >= 3);
  if (!ok.length) return null;
  const w = ok.reduce((a, x) => a + x.voicedSec, 0);
  const avg = (k) => r(ok.reduce((a, x) => a + (x[k] || 0) * x.voicedSec, 0) / w);
  return { score: avg('score'), volume: avg('volume'), tone: avg('tone'), pace: avg('pace'), fluency: avg('fluency'), wpm: avg('wpm'), pausePct: avg('pausePct'), pitchVar: +(ok.reduce((a, x) => a + x.pitchVar * x.voicedSec, 0) / w).toFixed(1), longPauses: ok.reduce((a, x) => a + x.longPauses, 0), answers: ok.length };
}

// ---------- DELIVERY FEEDBACK (rule-based, hamesha chalta hai) ----------
export function deliveryFeedback(face, voice) {
  const out = [];
  const add = (area, level, detail) => out.push({ area, level, detail });
  if (face) {
    if (face.eyeContact < 60) add('Eye contact', 'bad', `Aap ${face.awayPct}% time camera se door/idhar-udhar dekh rahe the. Camera lens ko dekhkar bolo, notes ya screen par nazar mat gadao.`);
    else if (face.eyeContact < 80) add('Eye contact', 'warn', `Eye contact theek tha (${100 - face.awayPct}%), par thoda aur steady rakho.`);
    else add('Eye contact', 'good', 'Camera ke saath achha eye contact bana raha — confident lagta hai.');
    if (face.stressPct > 35) add('Facial tension', 'bad', `Chehre par tension/nervousness ke signs ${face.stressPct}% time dikhe. Shoulders loose rakho, gehri saans lo aur answer se pehle 2 second pause lo.`);
    else if (face.stressPct > 18) add('Facial tension', 'warn', `Kabhi-kabhi nervous expressions aaye (${face.stressPct}%). Practice se kam ho jayenge.`);
    else add('Composure', 'good', 'Aap calm aur composed dikhe.');
    if (face.smilePct < 8) add('Warmth', 'warn', 'Bahut kam smile kiya. Intro aur closing me halki si smile positive impression deti hai.');
    else if (face.smilePct > 70) add('Warmth', 'warn', 'Smile bahut zyada thi — serious questions par thoda serious tone rakho.');
    else add('Warmth', 'good', 'Smile aur seriousness ka balance achha tha.');
    if (face.presencePct < 75) add('Camera framing', 'bad', `Aapka chehra sirf ${face.presencePct}% time camera me clearly dikha. Camera eye-level par rakho aur light face ke saamne rakho.`);
  }
  if (voice) {
    if (voice.wpm && voice.wpm < 100) add('Speaking pace', 'bad', `Pace bahut slow tha (~${voice.wpm} words/min). 120-160 ideal hai — thoda tez aur flow me bolo.`);
    else if (voice.wpm > 180) add('Speaking pace', 'bad', `Pace bahut tez tha (~${voice.wpm} words/min). Important points par ruko.`);
    else if (voice.wpm) add('Speaking pace', 'good', `Pace achha tha (~${voice.wpm} words/min).`);
    if (voice.tone < 65) add('Voice tone', 'bad', 'Awaaz monotone thi. Key words par pitch upar-neeche karo taaki enthusiasm dikhe.');
    else if (voice.tone >= 85) add('Voice tone', 'good', 'Voice me achhi variation thi — engaging lagta hai.');
    if (voice.volume < 55) add('Volume', 'bad', 'Awaaz dheemi thi. Mic ke paas aur thoda loud aur clear bolo.');
    if (voice.fluency < 65) add('Fluency', 'bad', `Bahut zyada pauses/fillers the (pauses ~${voice.pausePct}%). Answer ka structure pehle soch lo: point → example → result.`);
    else if (voice.fluency >= 85) add('Fluency', 'good', 'Bolne me flow achha tha, kam pauses.');
  }
  return out;
}

// ---------- OVERALL ----------
export function overallScore({ answer, voice, face }) {
  const parts = { answer, voice: voice ?? null, face: face ?? null };
  let sum = 0, w = 0;
  Object.entries(parts).forEach(([k, v]) => v != null && ((sum += v * WEIGHTS[k]), (w += WEIGHTS[k])));
  const total = w ? r(sum / w) : 0;
  return { total, parts, used: Object.fromEntries(Object.entries(parts).map(([k, v]) => [k, v != null ? r((WEIGHTS[k] / w) * 100) : 0])) };
}

export const gradeFor = (s) => (s >= 85 ? 'Outstanding' : s >= 70 ? 'Strong' : s >= 55 ? 'Good' : s >= 40 ? 'Needs Work' : 'Beginner');
export const avg = (arr) => (arr.length ? r(arr.reduce((a, b) => a + b, 0) / arr.length) : 0);
export { clamp };
