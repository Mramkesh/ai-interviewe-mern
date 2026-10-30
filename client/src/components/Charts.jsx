import { motion } from 'framer-motion';
import { scoreColor } from '../lib/hooks';

// Animated circular score gauge
export function Ring({ value = 0, size = 160, stroke = 12, label, sub, color }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const col = color || scoreColor(value);
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id={`rg${size}${Math.round(value)}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={col} /><stop offset="100%" stopColor="#38bdf8" /></linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth={stroke} />
        <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`url(#rg${size}${Math.round(value)})`} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - Math.min(100, value) / 100) }} transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }} transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ filter: `drop-shadow(0 0 8px ${col})` }} />
      </svg>
      <div className="ring-in"><b style={{ fontSize: size * 0.26 }}>{label ?? Math.round(value)}</b>{sub && <small>{sub}</small>}</div>
    </div>
  );
}

// Radar / spider chart. data: [{label, value}]
export function Radar({ data, size = 320 }) {
  const n = data.length, cx = size / 2, cy = size / 2, R = size / 2 - 52;
  const pt = (i, v) => { const a = (Math.PI * 2 * i) / n - Math.PI / 2; return [cx + Math.cos(a) * R * (v / 100), cy + Math.sin(a) * R * (v / 100)]; };
  const poly = data.map((d, i) => pt(i, d.value).join(',')).join(' ');
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="radar" role="img" aria-label="Skill radar">
      {[25, 50, 75, 100].map((l) => <polygon key={l} points={data.map((_, i) => pt(i, l).join(',')).join(' ')} fill="none" stroke="rgba(255,255,255,.09)" />)}
      {data.map((_, i) => <line key={i} x1={cx} y1={cy} x2={pt(i, 100)[0]} y2={pt(i, 100)[1]} stroke="rgba(255,255,255,.07)" />)}
      <motion.polygon points={poly} fill="rgba(108,99,255,.28)" stroke="#a78bfa" strokeWidth="2" initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} style={{ transformOrigin: `${cx}px ${cy}px` }} transition={{ duration: 0.9, ease: 'easeOut' }} />
      {data.map((d, i) => { const [x, y] = pt(i, d.value); const [lx, ly] = pt(i, 122); return (
        <g key={d.label}>
          <circle cx={x} cy={y} r="4" fill="#38bdf8" />
          <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontSize="11" fill="#a9a8c8">{d.label}</text>
        </g>); })}
    </svg>
  );
}

// Smooth area/line chart for score trend. points: [{label, value}]
export function Area({ points, height = 180 }) {
  const W = 600, H = height, pad = 24;
  if (points.length < 2) return <div className="chart-empty">Trend dekhne ke liye kam se kam 2 interviews do 📈</div>;
  const xs = (i) => pad + (i * (W - pad * 2)) / (points.length - 1);
  const ys = (v) => H - pad - (v / 100) * (H - pad * 2);
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${xs(i)},${ys(p.value)}`).join(' ');
  const area = `${line} L${xs(points.length - 1)},${H - pad} L${xs(0)},${H - pad} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="area" preserveAspectRatio="none">
      <defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6c63ff" stopOpacity=".5" /><stop offset="100%" stopColor="#6c63ff" stopOpacity="0" /></linearGradient></defs>
      {[0, 50, 100].map((g) => <line key={g} x1={pad} x2={W - pad} y1={ys(g)} y2={ys(g)} stroke="rgba(255,255,255,.07)" strokeDasharray="4 6" />)}
      <motion.path d={area} fill="url(#ag)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }} />
      <motion.path d={line} fill="none" stroke="#a78bfa" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2 }} />
      {points.map((p, i) => <g key={i}><circle cx={xs(i)} cy={ys(p.value)} r="5" fill="#07070d" stroke="#38bdf8" strokeWidth="2.5" /><title>{`${p.label}: ${p.value}%`}</title></g>)}
    </svg>
  );
}
