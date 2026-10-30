export const hasSpeechRecognition = () => typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
export const hasTTS = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

let voicePick = null;
function pickVoice() {
  if (voicePick || !hasTTS()) return voicePick;
  const v = window.speechSynthesis.getVoices();
  voicePick = v.find((x) => /en-IN/i.test(x.lang) && /female|heera|neerja|veena|google/i.test(x.name)) || v.find((x) => /en-IN/i.test(x.lang)) || v.find((x) => /^en/i.test(x.lang) && /female|zira|samantha|google uk english female/i.test(x.name)) || v.find((x) => /^en/i.test(x.lang)) || null;
  return voicePick;
}
if (hasTTS()) window.speechSynthesis.onvoiceschanged = () => { voicePick = null; pickVoice(); };

// AI interviewer ki awaaz. onEnd hamesha ek baar call hota hai (iOS/Chrome bugs ke liye fallback timer ke saath)
export function speak(text, { onStart, onEnd, rate = 0.95 } = {}) {
  let done = false;
  const finish = () => { if (done) return; done = true; clearTimeout(guard); onEnd?.(); };
  const guard = setTimeout(finish, Math.max(3500, text.length * 85 + 2500));
  if (!hasTTS()) return { cancel: () => { done = true; clearTimeout(guard); }, fallback: setTimeout(finish, 1500) };
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const v = pickVoice();
    if (v) { u.voice = v; u.lang = v.lang; } else u.lang = 'en-IN';
    u.rate = rate; u.pitch = 1.05;
    u.onstart = () => onStart?.();
    u.onend = finish; u.onerror = finish;
    window.speechSynthesis.speak(u);
  } catch { finish(); }
  return { cancel: () => { done = true; clearTimeout(guard); try { window.speechSynthesis.cancel(); } catch { /* */ } } };
}
export const stopSpeaking = () => { try { window.speechSynthesis?.cancel(); } catch { /* */ } };

// Continuous speech-to-text (Chrome/Edge/Android Chrome). Silence par browser band kar deta hai, isliye auto-restart.
export class Recognizer {
  constructor(onText, onState) { this.onText = onText; this.onState = onState; this.on = false; this.final = ''; this.rec = null; }
  start(initial = '') {
    if (!hasSpeechRecognition()) return false;
    this.final = initial ? initial.trim() + ' ' : '';
    this.on = true;
    this._boot();
    return true;
  }
  _boot() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.continuous = true; rec.interimResults = true; rec.lang = 'en-IN';
    rec.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) this.final += t.trim() + ' '; else interim += t;
      }
      this.onText((this.final + interim).trim());
    };
    rec.onstart = () => this.onState?.('listening');
    rec.onerror = (e) => { if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { this.on = false; this.onState?.('blocked'); } };
    rec.onend = () => { if (this.on) setTimeout(() => this.on && this._boot(), 250); else this.onState?.('stopped'); };
    this.rec = rec;
    try { rec.start(); } catch { /* already started */ }
  }
  stop() { this.on = false; try { this.rec?.stop(); } catch { /* */ } }
  setText(t) { this.final = t ? t.trim() + ' ' : ''; }
}
