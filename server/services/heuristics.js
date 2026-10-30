// Original project ka keyword/filler based analysis (fallback + live metrics)
export const GOOD_KEYWORDS = ['because', 'therefore', 'result', 'impact', 'achieved', 'improved', 'led', 'built', 'designed', 'implemented', 'managed', 'increased', 'reduced', 'example', 'situation', 'action', 'learned', 'team', 'project', 'experience', 'solution', 'problem', 'approach', 'strategy', 'metric', 'percent', 'successfully', 'challenge', 'opportunity'];
export const FILLER_WORDS = ['um', 'uh', 'like', 'you know', 'basically', 'literally', 'honestly', 'actually', 'kind of', 'sort of', 'i mean', 'right', 'okay so'];
export const TECH_KEYWORDS = ['algorithm', 'database', 'api', 'code', 'function', 'class', 'object', 'array', 'loop', 'return', 'null', 'async', 'await', 'promise', 'cache', 'server', 'client', 'request', 'response', 'http', 'sql', 'query', 'index', 'performance', 'complexity', 'scalable', 'architecture', 'design', 'pattern', 'framework'];

const clamp = (n, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

export function countFillers(text) {
  const lower = String(text || '').toLowerCase();
  return FILLER_WORDS.reduce((n, f) => n + (lower.match(new RegExp('\\b' + f + '\\b', 'g')) || []).length, 0);
}

export function analyzeAnswer(text = '') {
  const lower = String(text).toLowerCase().trim();
  const words = lower.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const wordSet = new Set(words.map((w) => w.replace(/[^a-z0-9+#]/g, '')));
  let kCount = 0, kScore = 0;
  GOOD_KEYWORDS.forEach((k) => wordSet.has(k) && (kCount++, (kScore += 2)));
  TECH_KEYWORDS.forEach((k) => wordSet.has(k) && (kCount++, (kScore += 3)));
  const fillerCount = countFillers(lower);

  let lengthScore;
  if (wordCount < 5) lengthScore = 10;
  else if (wordCount < 15) lengthScore = 30;
  else if (wordCount < 30) lengthScore = 55;
  else if (wordCount < 80) lengthScore = 75;
  else lengthScore = 90 + Math.min(8, wordCount / 40);

  const keyRich = Math.min(100, kCount * 8 + kScore);
  const fillerPenalty = Math.min(40, fillerCount * 8);
  let bonus = 0;
  if (/\bi\b/.test(lower)) bonus += 10;
  if (/for example|for instance|such as|specifically|in my|when i/.test(lower)) bonus += 15;
  if (/\d+/.test(lower)) bonus += 10;
  if (/because|therefore|as a result|which led/.test(lower)) bonus += 10;

  const depthScore = clamp(Math.round(lengthScore * 0.6 + keyRich * 0.4));
  const communicationScore = clamp(Math.round(lengthScore * 0.5 + keyRich * 0.3 + bonus - fillerPenalty * 0.5), 5);
  const confidenceScore = clamp(Math.round(50 + bonus - fillerPenalty), 5);
  const keywordUsage = clamp(Math.round(keyRich));
  const fillerFree = clamp(100 - fillerCount * 12);
  return { wordCount, kCount, fillerCount, depthScore, communicationScore, confidenceScore, keywordUsage, fillerFree };
}

// AI (Groq) fail ho to ye rule-based evaluation chalega
export function heuristicEvaluation(answer, ideal = '') {
  const m = analyzeAnswer(answer);
  const idealWords = [...new Set(String(ideal).toLowerCase().match(/[a-z][a-z0-9+#]{4,}/g) || [])];
  const ans = String(answer).toLowerCase();
  const hit = idealWords.filter((w) => ans.includes(w)).length;
  const overlap = idealWords.length ? hit / idealWords.length : 0.4;
  const relevance = clamp(Math.round(20 + overlap * 140), 5, 95);
  const structure = clamp(Math.round(35 + (/for example|for instance|first|second|finally|because|result/.test(ans) ? 30 : 0) + (m.wordCount > 40 ? 15 : 0)));
  const strengths = [];
  const mistakes = [];
  if (relevance >= 65) strengths.push('Aapke answer me question ke important points cover hue.');
  else mistakes.push('Answer me expected key concepts kam the — core points miss ho gaye.');
  if (m.wordCount >= 50) strengths.push('Answer detailed tha, achhi length.');
  else mistakes.push(`Answer bahut chhota tha (${m.wordCount} words) — 60-120 words aim karo.`);
  if (m.fillerCount > 2) mistakes.push(`Filler words zyada the (${m.fillerCount}) — pause lo, "um/like" avoid karo.`);
  if (!/\d+/.test(ans)) mistakes.push('Koi number/metric nahi diya — measurable result add karo.');
  return {
    relevance, depth: m.depthScore, structure, clarity: m.communicationScore,
    strengths: strengths.slice(0, 2), mistakes: mistakes.slice(0, 3),
    improvedAnswer: ideal, tip: 'STAR method use karo: Situation, Task, Action, Result.', source: 'heuristic',
  };
}
