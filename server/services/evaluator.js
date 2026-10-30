import { callGroq, groqReady } from './groq.js';

const clampN = (v) => Math.max(0, Math.min(100, Math.round(Number(v) || 0)));
const strArr = (a, n) => (Array.isArray(a) ? a.map((s) => String(s).slice(0, 300)).filter(Boolean).slice(0, n) : []);

function parseJSON(text) {
  try {
    return JSON.parse(text);
  } catch {
    const m = String(text).match(/\{[\s\S]*\}/);
    return m ? JSON.parse(m[0]) : null;
  }
}

/**
 * Ek hi Groq call me saare answers ka evaluation + overall summary.
 * items: [{ index, question, reference, answer }]  (sirf answered questions)
 * ctx: { company, role, type, language, deliveryText }
 * returns { answers: Map(index -> ai), summary } ya null (fail hone par heuristics use hoga)
 */
export async function evaluateWithGroq(items, ctx) {
  if (!groqReady() || !items.length) return null;
  const hinglish = ctx.language === 'hinglish';
  const system = `You are a senior interviewer and communication coach evaluating mock-interview answers for ${ctx.company} (${ctx.type} round, candidate role: ${ctx.role}).
Be fair but honest and specific. Never invent facts. Answers come from speech-to-text, so ignore minor punctuation/transcription glitches.
Scoring guide (0-100): 0-30 wrong/irrelevant, 31-50 weak, 51-70 acceptable, 71-85 good, 86-100 excellent.
Language for strengths/mistakes/tip/summary: ${hinglish ? 'Hinglish (Hindi in Roman script mixed with simple English, friendly tone like a senior friend)' : 'clear, simple English'}.
"improvedAnswer" must ALWAYS be in English, first person, 60-120 words, a model answer the candidate could say, reusing their own context where possible.
Return ONLY valid JSON with exactly this shape:
{"answers":[{"i":<index>,"relevance":0-100,"depth":0-100,"structure":0-100,"clarity":0-100,"strengths":["max 2 short items"],"mistakes":["max 3 specific mistakes, quote what was wrong/missing"],"improvedAnswer":"...","tip":"one actionable line"}],
"summary":{"text":"3-4 sentence overall feedback","topStrengths":["exactly 3"],"topMistakes":["exactly 3, most important first"],"actionPlan":["4 concrete steps for next 7 days"]}}`;

  const user = `Candidate delivery stats (from camera/mic analysis; mention them in the summary only if relevant, do not invent numbers):\n${ctx.deliveryText || 'not available'}\n\nQuestions and answers:\n` +
    items.map((it) => `#${it.index}\nQuestion: ${it.question}\nReference key points: ${it.reference}\nCandidate answer: """${String(it.answer).slice(0, 1800)}"""`).join('\n\n');

  try {
    const text = await callGroq([{ role: 'system', content: system }, { role: 'user', content: user }], {
      max_tokens: Math.min(7000, 900 + items.length * 650), temperature: 0.3, json: true, timeoutMs: 55000,
    });
    const data = parseJSON(text);
    if (!data?.answers) return null;
    const map = new Map();
    data.answers.forEach((a) => {
      if (a == null || a.i == null) return;
      map.set(Number(a.i), {
        relevance: clampN(a.relevance), depth: clampN(a.depth), structure: clampN(a.structure), clarity: clampN(a.clarity),
        strengths: strArr(a.strengths, 2), mistakes: strArr(a.mistakes, 3),
        improvedAnswer: String(a.improvedAnswer || '').slice(0, 1200), tip: String(a.tip || '').slice(0, 300), source: 'groq',
      });
    });
    const s = data.summary || {};
    return { answers: map, summary: { text: String(s.text || '').slice(0, 900), topStrengths: strArr(s.topStrengths, 3), topMistakes: strArr(s.topMistakes, 3), actionPlan: strArr(s.actionPlan, 4), source: 'groq' } };
  } catch (e) {
    console.error('Groq evaluation failed:', e.message);
    return null;
  }
}
