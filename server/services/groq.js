// Groq API ka server-side wrapper (API key sirf server par rehti hai, browser me kabhi nahi)
const URL = 'https://api.groq.com/openai/v1/chat/completions';

export const groqReady = () => Boolean(process.env.GROQ_API_KEY);

export async function callGroq(messages, { max_tokens = 400, temperature = 0.7, json = false, timeoutMs = 45000 } = {}) {
  if (!groqReady()) throw new Error('GROQ_API_KEY not set');
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const body = { model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile', messages, max_tokens, temperature };
    if (json) body.response_format = { type: 'json_object' };
    const resp = await fetch(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + process.env.GROQ_API_KEY },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error?.message || `Groq API error ${resp.status}`);
    }
    const data = await resp.json();
    return data.choices?.[0]?.message?.content || '';
  } finally {
    clearTimeout(timer);
  }
}
