import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HeroOrb } from '../components/Scene';
import { Page, Reveal, Tilt, Counter } from '../components/ui';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
  { ico: '😊', title: 'Face Expression AI', text: 'Camera se aapke expressions, nervousness aur eye-contact estimate hota hai — sab browser me, video upload nahi hota.', c: '#ec4899' },
  { ico: '🎙️', title: 'Voice Tone Analysis', text: 'Pace, pitch variation, volume, pauses aur filler words — aapki awaaz kitni confident lagti hai.', c: '#38bdf8' },
  { ico: '🧠', title: 'Answer Evaluation (Groq)', text: 'Llama 3.3 70B har answer ko relevance, depth, structure aur clarity par score karta hai.', c: '#a78bfa' },
  { ico: '🎯', title: 'Mistakes + Better Answer', text: 'Kaha galti hui, kya miss hua aur ek model answer — sab har question ke saath milta hai.', c: '#22c55e' },
  { ico: '🏢', title: 'Company-wise Mock', text: 'Google, Amazon, TCS, Razorpay jaisi 10 companies ke real-style HR + technical questions.', c: '#f59e0b' },
  { ico: '🤖', title: 'Aria — AI Mentor', text: 'Aapki history dekhkar personalised advice — Hindi + English me, dost ki tarah.', c: '#6c63ff' },
];
const STEPS = [
  ['1', 'Setup', 'Company, round type aur difficulty chuno'],
  ['2', 'Interview do', 'AI avatar sawal puchta hai, aap bolkar answer do'],
  ['3', 'Score + Feedback', 'Face, voice aur answer — teeno ka score aur improvement plan'],
];
const LOGOS = ['Google', 'Amazon', 'Microsoft', 'TCS', 'Infosys', 'Wipro', 'Flipkart', 'Zomato', 'Accenture', 'Razorpay'];

export default function Landing() {
  const { user } = useAuth();
  const cta = user ? '/app/interview/setup' : '/register';
  return (
    <Page className="landing">
      <section className="hero">
        <div className="hero-3d"><HeroOrb /></div>
        <div className="hero-copy">
          <motion.span className="badge badge-purple" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>🤖 AI-Powered Career Platform</motion.span>
          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            Ace Every Interview with <span className="glow-text">Your AI Coach</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            AI avatar ke saamne real interview jaisa practice karo. Aapka <b>chehra, awaaz aur answer</b> — teeno analyze hote hain, score milta hai aur batata hai ki galti kaha hui.
          </motion.p>
          <motion.div className="hero-cta" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Link to={cta} className="btn btn-primary btn-lg">Start Free Interview →</Link>
            <Link to="/companies" className="btn btn-secondary btn-lg">Company Questions</Link>
          </motion.div>
          <div className="hero-stats">
            <div><b><Counter value={126} suffix="+" /></b><small>Curated questions</small></div>
            <div><b><Counter value={10} /></b><small>Company tracks</small></div>
            <div><b><Counter value={3} /></b><small>AI analyzers</small></div>
          </div>
        </div>
      </section>

      <div className="marquee" aria-hidden="true"><div className="marquee-track">{[...LOGOS, ...LOGOS].map((l, i) => <span key={i}>{l}</span>)}</div></div>

      <section className="section">
        <Reveal><h2 className="sec-title">Sirf answer nahi — <span className="glow-text">poora interview</span> analyze hota hai</h2><p className="sec-sub">Real interviewer jaisa 360° feedback.</p></Reveal>
        <div className="grid-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 0.08}>
              <Tilt className="card feature" style={{ '--c': f.c }}>
                <div className="feature-ico">{f.ico}</div>
                <h3>{f.title}</h3><p>{f.text}</p>
              </Tilt>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section">
        <Reveal><h2 className="sec-title">Kaise kaam karta hai?</h2></Reveal>
        <div className="steps">
          {STEPS.map(([n, t, d], i) => (
            <Reveal key={n} delay={i * 0.1}><div className="step"><span className="step-n">{n}</span><h3>{t}</h3><p>{d}</p></div></Reveal>
          ))}
        </div>
      </section>

      <section className="section">
        <Reveal>
          <div className="cta-box">
            <h2>Aaj hi apna pehla mock interview do 🚀</h2>
            <p>Free hai. Camera + mic allow karo aur 5 minute me apna score dekho.</p>
            <Link to={cta} className="btn btn-primary btn-lg">Start Now →</Link>
          </div>
        </Reveal>
      </section>
      <footer className="footer">© {new Date().getFullYear()} InterviewAI Pro • Built with MERN + Groq</footer>
    </Page>
  );
}
