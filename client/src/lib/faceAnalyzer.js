// Face expression + head-pose (eye-contact estimate) analysis — runs 100% in the browser (face-api / tfjs).
// Video kahin upload nahi hota; sirf numbers server ko jate hain.
let faceapi = null;
let loading = null;

export function loadFaceModels() {
  if (!loading) {
    loading = (async () => {
      faceapi = await import('@vladmandic/face-api');
      await faceapi.tf.ready();
      const base = import.meta.env.BASE_URL + 'models';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(base),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri(base),
        faceapi.nets.faceExpressionNet.loadFromUri(base),
      ]);
      return true;
    })().catch((e) => { loading = null; throw e; });
  }
  return loading;
}

export const EXPR = ['neutral', 'happy', 'sad', 'angry', 'fearful', 'disgusted', 'surprised'];
export const EXPR_EMOJI = { neutral: '😐', happy: '😊', sad: '😟', angry: '😠', fearful: '😨', disgusted: '😖', surprised: '😲' };
const blank = () => ({ ticks: 0, detected: 0, away: 0, smile: 0, stress: 0, expr: Object.fromEntries(EXPR.map((k) => [k, 0])) });
const mid = (pts) => ({ x: pts.reduce((a, p) => a + p.x, 0) / pts.length, y: pts.reduce((a, p) => a + p.y, 0) / pts.length });
const median = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };

export class FaceSampler {
  constructor(video, onFrame) {
    this.video = video; this.onFrame = onFrame; this.raw = blank();
    this.active = false; this.busy = false; this.timer = null;
    this.base = { yaw: 0, pitch: 0 }; this.calib = null;
  }
  setVideo(v) { this.video = v; }
  // Self-throttling loop: slow phone/CPU par next frame ka gap badh jata hai, taaki UI hang na ho
  start(minMs = 650) {
    this.stop(); this.running = true; this.minMs = minMs; this.lastMs = 0;
    const loop = async () => {
      if (!this.running) return;
      const t0 = performance.now();
      await this.tick();
      this.lastMs = performance.now() - t0;
      if (this.running) this.timer = setTimeout(loop, Math.max(this.minMs, this.lastMs * 3));
    };
    this.timer = setTimeout(loop, 300);
  }
  stop() { this.running = false; clearTimeout(this.timer); this.timer = null; }
  calibCount() { return this.calib?.yaw.length || 0; }
  reset() { this.raw = blank(); }
  setActive(on) { this.active = on; }
  snapshot() { return JSON.parse(JSON.stringify(this.raw)); }

  // User ko 3 sec camera dekhne ko bolte hain => personal "straight look" baseline
  startCalibration() { this.calib = { yaw: [], pitch: [] }; }
  finishCalibration() {
    if (this.calib && this.calib.yaw.length >= 3) this.base = { yaw: median(this.calib.yaw), pitch: median(this.calib.pitch) };
    const n = this.calib?.yaw.length || 0;
    this.calib = null;
    return n;
  }

  async tick() {
    const v = this.video;
    if (this.busy || !faceapi || !v || v.readyState < 2 || v.paused || !v.videoWidth) return;
    this.busy = true;
    try {
      const res = await faceapi
        .detectSingleFace(v, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.45 }))
        .withFaceLandmarks(true)
        .withFaceExpressions();
      let info = null;
      if (res) {
        const p = res.landmarks.positions;
        const le = mid(p.slice(36, 42)), re = mid(p.slice(42, 48));
        const eyeMid = { x: (le.x + re.x) / 2, y: (le.y + re.y) / 2 };
        const eyeDist = Math.max(1, Math.abs(re.x - le.x));
        const mouthY = (p[51].y + p[57].y) / 2;
        const yaw = (p[30].x - eyeMid.x) / eyeDist;
        const pitch = (p[30].y - eyeMid.y) / Math.max(1, mouthY - eyeMid.y);
        if (this.calib) { this.calib.yaw.push(yaw); this.calib.pitch.push(pitch); }
        const away = Math.abs(yaw - this.base.yaw) > 0.24 || Math.abs(pitch - this.base.pitch) > 0.16;
        const ex = res.expressions;
        const top = EXPR.reduce((a, b) => (ex[b] > ex[a] ? b : a), 'neutral');
        const stress = ex.fearful + ex.sad + ex.angry + ex.disgusted;
        info = { top, away, happy: ex.happy, stress };
        if (this.active) {
          const r = this.raw;
          r.detected++; if (away) r.away++;
          if (ex.happy > 0.5) r.smile++;
          if (stress > 0.5) r.stress++;
          EXPR.forEach((k) => (r.expr[k] += ex[k]));
        }
      }
      if (this.active) this.raw.ticks++;
      this.onFrame?.(info);
    } catch (e) {
      /* ek frame fail hua to ignore */
    } finally {
      this.busy = false;
    }
  }
}
