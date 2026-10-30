import { Router } from 'express';
import Chat from '../models/Chat.js';
import Interview from '../models/Interview.js';
import { protect } from '../middleware/auth.js';
import { callGroq, groqReady } from '../services/groq.js';

const router = Router();
router.use(protect);

const greeting = (u) => ({ role: 'ai', text: `Namaste ${u.firstName}! 🙏 Main hun **Aria**, aapka AI career mentor. Main aapki interviews aur progress dekhkar personalised advice dunga. Kya poochna hai? 😊`, time: new Date() });

router.get('/', async (req, res, next) => {
  try {
    let chat = await Chat.findOne({ user: req.user._id });
    if (!chat) chat = await Chat.create({ user: req.user._id, messages: [greeting(req.user)] });
    res.json({ messages: chat.messages });
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const text = String(req.body?.text || '').trim().slice(0, 1000);
    if (!text) return res.status(400).json({ message: 'Message empty hai' });
    let chat = (await Chat.findOne({ user: req.user._id })) || new Chat({ user: req.user._id, messages: [greeting(req.user)] });
    chat.messages.push({ role: 'user', text });

    const ints = await Interview.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(5).select('company score skills summary createdAt').lean();
    const avgScore = ints.length ? Math.round(ints.reduce((a, b) => a + b.score, 0) / ints.length) : 0;
    const weak = ints[0]?.summary?.topMistakes?.slice(0, 2).join(' | ') || 'n/a';
    const system = `You are Aria, an expert AI career and interview mentor on the InterviewAI Pro platform.
User: ${req.user.firstName} ${req.user.lastName}, target role: ${req.user.role || 'not set'}.
Stats: ${ints.length} recent interviews, average score ${avgScore}%. Recent: ${ints.map((i) => `${i.company}(${i.score}%)`).join(', ') || 'none'}. Latest weak areas: ${weak}.
Be warm, encouraging and specific. Give actionable advice in 3-5 sentences. Mix Hindi (Roman script) and English naturally. Be like a helpful senior friend, not a formal bot.`;

    const history = chat.messages.slice(-9, -1).map((m) => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text }));
    let reply;
    try {
      if (!groqReady()) throw new Error('no key');
      reply = await callGroq([{ role: 'system', content: system }, ...history, { role: 'user', content: text }], { max_tokens: 400, temperature: 0.7 });
    } catch (e) {
      console.error('Mentor Groq error:', e.message);
      reply = `${req.user.firstName}, abhi AI se connect nahi ho pa raha. Tab tak ye try karo: har answer me STAR method (Situation, Task, Action, Result) use karo aur ek measurable result zaroor bolo. Thodi der baad dobara poochna! 💪`;
    }
    chat.messages.push({ role: 'ai', text: reply });
    if (chat.messages.length > 80) chat.messages = chat.messages.slice(-80);
    await chat.save();
    res.json({ messages: chat.messages });
  } catch (e) { next(e); }
});

router.delete('/', async (req, res, next) => {
  try {
    await Chat.findOneAndUpdate({ user: req.user._id }, { messages: [greeting(req.user)] }, { upsert: true });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;
