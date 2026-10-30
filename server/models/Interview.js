import mongoose from 'mongoose';

const { Mixed } = mongoose.Schema.Types;

const qSchema = new mongoose.Schema(
  {
    qid: String,
    question: String,
    level: String,
    ideal: String,
    answer: String,
    skipped: { type: Boolean, default: false },
    timeSpent: Number,
    metrics: Mixed, // words, keywords, fillers (live heuristic)
    voice: Mixed, // per-question voice stats
    face: Mixed, // per-question face stats
    ai: Mixed, // score, relevance, depth, structure, clarity, strengths[], mistakes[], improvedAnswer, tip, source
  },
  { _id: false }
);

const interviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    company: { type: String, default: 'General' },
    type: { type: String, default: 'mixed' },
    domain: { type: String, default: '' },
    difficulty: { type: String, default: 'any' },
    duration: { type: Number, default: 0 }, // seconds
    score: { type: Number, default: 0 },
    grade: String,
    breakdown: Mixed, // { answer, voice, face } (null if unavailable) + weights
    skills: Mixed, // communication, confidence, depth, keywords, fillerFree, completion, eyeContact, voiceTone...
    face: Mixed, // aggregate face stats
    voice: Mixed, // aggregate voice stats
    delivery: [Mixed], // rule-based body-language / voice feedback
    summary: Mixed, // { text, topStrengths[], topMistakes[], actionPlan[], source }
    questions: [qSchema],
  },
  { timestamps: true }
);

export default mongoose.model('Interview', interviewSchema);
