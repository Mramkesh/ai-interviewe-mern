import { Router } from 'express';
import Interview from '../models/Interview.js';
import { protect } from '../middleware/auth.js';
import { buildQuestions, getQuestion, publicQ } from '../data/questions.js';
import { analyzeAnswer, countFillers, heuristicEvaluation } from '../services/heuristics.js';
import { evaluateWithGroq } from '../services/evaluator.js';
import { aggregateVoice, avg, cleanFace, cleanVoice, deliveryFeedback, gradeFor, overallScore, scoreFace, scoreVoice, sumFace, WEIGHTS } from '../services/scoring.js';

const router = Router();
router.use(protect);

const LIST_FIELDS = 'company type domain difficulty duration score grade breakdown skills createdAt';

// 1) Interview shuru: questions do (ideal answers server par hi rehte hain)
router.post('/start', (req, res) => {
  const { company = 'general', type = 'mixed', domain = '', difficulty = 'any', count = 5 } = req.body || {};
  const questions = buildQuestions({ company, type, domain, difficulty, count });
  res.json({ questions: questions.map(publicQ) });
});

// 2) Interview khatam: answers + face + voice data -> AI analysis -> score
router.post('/finish', async (req, res, next) => {
  try {
    const { company = 'General', type = 'mixed', domain = '', difficulty = 'any', duration = 0, language = 'en', items } = req.body || {};
    if (!Array.isArray(items) || !items.length || items.length > 12) return res.status(400).json({ message: 'Invalid interview data' });

    // ---- per-question prepare ----
    const rows = [];
    for (const it of items) {
      const q = getQuestion(it.qid);
      if (!q) continue;
      const skipped = Boolean(it.skipped) || !String(it.answer || '').trim();
      const answer = skipped ? '' : String(it.answer).slice(0, 3000);
      const metrics = skipped ? null : analyzeAnswer(answer);
      const face = cleanFace(it.face);
      const voiceRaw = cleanVoice(it.voice);
      rows.push({
        q, skipped, answer, metrics, timeSpent: Math.min(3600, Number(it.timeSpent) || 0), faceRaw: face,
        face: scoreFace(face),
        voice: skipped ? null : scoreVoice(voiceRaw, { words: metrics?.wordCount || 0, fillers: metrics?.fillerCount || 0 }),
      });
    }
    if (!rows.length) return res.status(400).json({ message: 'No valid questions' });

    // ---- face / voice aggregate ----
    const faceAgg = scoreFace(sumFace(rows.map((r) => r.faceRaw)));
    const voiceAgg = aggregateVoice(rows.map((r) => r.voice));
    const delivery = deliveryFeedback(faceAgg, voiceAgg);
    const deliveryText = [
      faceAgg && `Eye contact ${faceAgg.eyeContact}% | dominant expression ${faceAgg.dominant} | facial tension ${faceAgg.stressPct}% | smile ${faceAgg.smilePct}%`,
      voiceAgg && `Pace ${voiceAgg.wpm} wpm | pitch variation ${voiceAgg.pitchVar} semitones | pauses ${voiceAgg.pausePct}% | fluency score ${voiceAgg.fluency}`,
    ].filter(Boolean).join('\n');

    // ---- AI evaluation (Groq) with heuristic fallback ----
    const answered = rows.map((r, index) => ({ r, index })).filter((x) => !x.r.skipped);
    const ai = await evaluateWithGroq(
      answered.map(({ r, index }) => ({ index, question: r.q.q, reference: r.q.a, answer: r.answer })),
      { company, role: req.user.role, type, language, deliveryText }
    );

    rows.forEach((r, index) => {
      if (r.skipped) {
        r.ai = { score: 0, relevance: 0, depth: 0, structure: 0, clarity: 0, strengths: [], mistakes: ['Ye question skip kiya gaya — interview me har question attempt karo, partial answer bhi chalta hai.'], improvedAnswer: r.q.a, tip: 'Agar answer na aaye to bhi approach bolo: "Main ise aise sochunga..."', source: 'skipped' };
        return;
      }
      const e = ai?.answers.get(index) || heuristicEvaluation(r.answer, r.q.a);
      if (!e.improvedAnswer) e.improvedAnswer = r.q.a;
      let score = Math.round(0.35 * e.relevance + 0.25 * e.depth + 0.2 * e.structure + 0.2 * e.clarity);
      if ((r.metrics?.wordCount || 0) < 10) score = Math.min(score, 35);
      r.ai = { ...e, score };
    });

    // ---- skills + overall ----
    const ok = rows.filter((r) => !r.skipped);
    const mean = (fn) => avg(ok.map(fn));
    const heurConf = mean((r) => r.metrics.confidenceScore);
    const skills = {
      relevance: mean((r) => r.ai.relevance), depth: mean((r) => r.ai.depth), structure: mean((r) => r.ai.structure), clarity: mean((r) => r.ai.clarity),
      confidence: Math.round(0.4 * heurConf + 0.3 * (faceAgg?.composure ?? heurConf) + 0.3 * (voiceAgg?.tone ?? heurConf)),
      keywords: mean((r) => r.metrics.keywordUsage), fillerFree: mean((r) => r.metrics.fillerFree),
      completion: Math.round((ok.length / rows.length) * 100),
      eyeContact: faceAgg?.eyeContact ?? null, composure: faceAgg?.composure ?? null, warmth: faceAgg?.warmth ?? null, presence: faceAgg?.presence ?? null,
      volume: voiceAgg?.volume ?? null, tone: voiceAgg?.tone ?? null, pace: voiceAgg?.pace ?? null, fluency: voiceAgg?.fluency ?? null,
    };
    const answerScore = avg(rows.map((r) => r.ai.score));
    const total = overallScore({ answer: answerScore, voice: voiceAgg?.score, face: faceAgg?.score });
    const breakdown = { ...total.parts, weights: WEIGHTS, used: total.used };

    // ---- summary ----
    const summary = ai?.summary?.text ? ai.summary : fallbackSummary(rows, delivery, total.total, language);

    const doc = await Interview.create({
      user: req.user._id, company, type, domain, difficulty, duration: Math.min(14400, Number(duration) || 0),
      score: total.total, grade: gradeFor(total.total), breakdown, skills, face: faceAgg, voice: voiceAgg, delivery, summary,
      questions: rows.map((r) => ({ qid: r.q.id, question: r.q.q, level: r.q.level, ideal: r.q.a, answer: r.skipped ? '' : r.answer, skipped: r.skipped, timeSpent: r.timeSpent, metrics: r.metrics, voice: r.voice, face: r.face, ai: r.ai })),
    });
    res.status(201).json({ interview: doc });
  } catch (e) { next(e); }
});

function fallbackSummary(rows, delivery, score, language) {
  const hi = language === 'hinglish';
  const done = rows.filter((r) => !r.skipped).length;
  const mistakes = rows.flatMap((r) => r.ai?.mistakes || []);
  const strengths = rows.flatMap((r) => r.ai?.strengths || []);
  const bad = delivery.filter((d) => d.level === 'bad').map((d) => `${d.area}: ${d.detail}`);
  const good = delivery.filter((d) => d.level === 'good').map((d) => `${d.area}: ${d.detail}`);
  return {
    text: hi
      ? `Aapne ${rows.length} me se ${done} questions attempt kiye aur overall score ${score}% raha. Neeche diye mistakes par kaam karo aur dobara practice karo.`
      : `You attempted ${done} of ${rows.length} questions and scored ${score}% overall. Work on the mistakes below and practise again.`,
    topStrengths: [...strengths, ...good].slice(0, 3),
    topMistakes: [...bad, ...mistakes].slice(0, 3),
    actionPlan: ['Har answer me STAR/PEEL structure use karo (point → example → result).', 'Roz 10 minute camera ke saamne bol kar practice karo aur khud ko record karke dekho.', 'Har answer me ek number ya measurable result add karo.', 'Is interview ki weak areas par focus karke 2 din baad dobara mock do.'],
    source: 'rules',
  };
}

// 3) Dashboard stats
router.get('/stats', async (req, res, next) => {
  try {
    const list = await Interview.find({ user: req.user._id }).sort({ createdAt: 1 }).select(LIST_FIELDS).lean();
    const keys = ['relevance', 'depth', 'clarity', 'confidence', 'eyeContact', 'tone', 'pace', 'fluency', 'composure'];
    const skills = {};
    keys.forEach((k) => {
      const v = list.map((i) => i.skills?.[k]).filter((x) => x != null);
      skills[k] = v.length ? avg(v) : 0;
    });
    const scores = list.map((i) => i.score);
    const last3 = scores.slice(-3);
    res.json({
      total: list.length, avgScore: avg(scores), best: scores.length ? Math.max(...scores) : 0, readiness: avg(last3),
      trend: list.slice(-12).map((i) => ({ id: i._id, score: i.score, date: i.createdAt, company: i.company })),
      skills, recent: list.slice(-5).reverse(),
      byCompany: Object.entries(list.reduce((m, i) => ((m[i.company] = (m[i.company] || 0) + 1), m), {})).map(([name, count]) => ({ name, count })),
    });
  } catch (e) { next(e); }
});

router.get('/', async (req, res, next) => {
  try {
    const list = await Interview.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(100).select(LIST_FIELDS).lean();
    res.json({ interviews: list });
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const doc = await Interview.findOne({ _id: req.params.id, user: req.user._id }).lean();
    if (!doc) return res.status(404).json({ message: 'Interview not found' });
    res.json({ interview: doc });
  } catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await Interview.deleteOne({ _id: req.params.id, user: req.user._id });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;
