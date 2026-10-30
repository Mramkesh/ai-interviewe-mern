// Voice tone analysis (volume, pitch variation, pauses) using Web Audio API — browser me hi, audio upload nahi hota.
function detectPitch(buf, sr) {
  const n = buf.length;
  const minLag = Math.floor(sr / 350), maxLag = Math.min(Math.floor(sr / 80), n >> 1);
  const corr = new Float32Array(maxLag + 1);
  let best = 0;
  for (let lag = minLag; lag <= maxLag; lag++) {
    let s = 0, e1 = 0, e2 = 0;
    for (let i = 0; i < n - maxLag; i += 2) { const a = buf[i], b = buf[i + lag]; s += a * b; e1 += a * a; e2 += b * b; }
    corr[lag] = s / Math.sqrt(e1 * e2 + 1e-9);
    if (corr[lag] > best) best = corr[lag];
  }
  if (best < 0.8) return 0;
  for (let lag = minLag + 1; lag < maxLag; lag++) {
    if (corr[lag] > best * 0.92 && corr[lag] >= corr[lag - 1] && corr[lag] >= corr[lag + 1]) return sr / lag; // pehla strong peak = octave error se bachav
  }
  return 0;
}

export class VoiceSampler {
  constructor(stream, onLevel) {
    const AC = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AC();
    this.src = this.ctx.createMediaStreamSource(stream);
    this.an = this.ctx.createAnalyser();
    this.an.fftSize = 2048;
    this.src.connect(this.an);
    this.buf = new Float32Array(this.an.fftSize);
    this.onLevel = onLevel; this.lastLevel = 0; this.active = false; this.frames = []; this.timer = null;
  }
  async start() { try { await this.ctx.resume(); } catch { /* ignore */ } clearInterval(this.timer); this.timer = setInterval(() => this.tick(), 100); }
  stop() { clearInterval(this.timer); try { this.src.disconnect(); this.ctx.close(); } catch { /* ignore */ } }
  setActive(on) { this.active = on; }
  reset() { this.frames = []; }

  tick() {
    this.an.getFloatTimeDomainData(this.buf);
    let sum = 0, clip = 0;
    for (let i = 0; i < this.buf.length; i++) { const v = this.buf[i]; sum += v * v; if (Math.abs(v) > 0.98) clip++; }
    const rms = Math.sqrt(sum / this.buf.length);
    this.lastLevel = rms;
    this.onLevel?.(rms);
    if (!this.active) return;
    this.frames.push({ r: rms, c: clip > 4, p: rms > 0.012 ? detectPitch(this.buf, this.ctx.sampleRate) : 0 });
  }

  snapshot() {
    const F = this.frames;
    if (F.length < 20) return { available: false };
    const sorted = F.map((f) => f.r).sort((a, b) => a - b);
    const noise = sorted[Math.floor(sorted.length * 0.15)];
    const thr = Math.max(0.012, noise * 2.5);
    const voiced = F.map((f) => f.r > thr);
    const first = voiced.indexOf(true), last = voiced.lastIndexOf(true);
    const vCount = voiced.filter(Boolean).length;
    if (first < 0 || vCount < 15) return { available: false };
    // pauses (silence runs >= 0.5s inside the speaking window)
    let pauseFrames = 0, longPauses = 0, run = 0;
    for (let i = first; i <= last + 1; i++) {
      if (i <= last && !voiced[i]) run++;
      else { if (run >= 5) pauseFrames += run; if (run >= 15) longPauses++; run = 0; }
    }
    const vf = F.filter((f, i) => voiced[i]);
    const avgRms = vf.reduce((a, f) => a + f.r, 0) / vf.length;
    const clipPct = (vf.filter((f) => f.c).length / vf.length) * 100;
    const pitches = vf.map((f) => f.p).filter((p) => p > 0);
    let pitchStd = 0, pitchMean = 0;
    if (pitches.length >= 15) {
      const med = [...pitches].sort((a, b) => a - b)[pitches.length >> 1];
      const st = pitches.map((p) => 12 * Math.log2(p / med));
      const m = st.reduce((a, b) => a + b, 0) / st.length;
      pitchStd = Math.sqrt(st.reduce((a, b) => a + (b - m) ** 2, 0) / st.length);
      pitchMean = med;
    }
    return { available: true, voicedSec: vCount / 10, activeSec: (last - first + 1) / 10, pauseSec: pauseFrames / 10, longPauses, avgRms, pitchStd, pitchSamples: pitches.length, pitchMean, clipPct };
  }
}
