import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';

// Animated particle network + gradient mesh (original project ke particles ka upgrade)
export default function Background() {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) return;
    const c = ref.current, ctx = c.getContext('2d');
    let w, h, raf, pts = [];
    const mobile = window.innerWidth < 820;
    const N = mobile ? 28 : 60;
    const size = () => { w = c.width = window.innerWidth; h = c.height = window.innerHeight; };
    size();
    pts = Array.from({ length: N }, () => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35, r: Math.random() * 1.6 + 0.6 }));
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      pts.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fillStyle = 'rgba(167,139,250,.55)'; ctx.fill();
        for (let j = i + 1; j < pts.length; j++) {
          const q = pts[j], d = Math.hypot(p.x - q.x, p.y - q.y);
          if (d < 130) { ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.strokeStyle = `rgba(108,99,255,${0.14 * (1 - d / 130)})`; ctx.stroke(); }
        }
      });
      raf = requestAnimationFrame(draw);
    };
    const vis = () => { cancelAnimationFrame(raf); if (!document.hidden) draw(); };
    draw();
    window.addEventListener('resize', size);
    document.addEventListener('visibilitychange', vis);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', size); document.removeEventListener('visibilitychange', vis); };
  }, [reduce]);
  return (
    <div className="bg" aria-hidden="true">
      <div className="bg-blob b1" /><div className="bg-blob b2" /><div className="bg-blob b3" /><div className="bg-grid" />
      <canvas ref={ref} />
    </div>
  );
}
