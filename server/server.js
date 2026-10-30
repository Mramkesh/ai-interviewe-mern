import 'dotenv/config';
import dns from "dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import { connectDB } from './config/db.js';
import Admin from './models/Admin.js';
import authRoutes from './routes/auth.js';
import companyRoutes from './routes/companies.js';
import interviewRoutes from './routes/interviews.js';
import mentorRoutes from './routes/mentor.js';
import adminRoutes from './routes/admin.js';

const app = express();
app.set('trust proxy', 1); // Render proxy ke peeche hai

const allowed = (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map((s) => s.trim().replace(/\/$/, ''));
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: (origin, cb) => (!origin || allowed.includes(origin) ? cb(null, true) : cb(new Error('CORS blocked: ' + origin))),
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));

app.get('/', (_req, res) => res.json({ name: 'InterviewAI API', ok: true }));
app.get('/api/health', (_req, res) => res.json({ ok: true, time: Date.now() }));

const limiter = (max, windowMin = 15) => rateLimit({ windowMs: windowMin * 60 * 1000, max, standardHeaders: true, legacyHeaders: false, message: { message: 'Bahut zyada requests — thodi der baad try karo' } });
app.use('/api/auth', limiter(60), authRoutes);
app.use('/api/admin', limiter(120), adminRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/interviews', limiter(200), interviewRoutes);
app.use('/api/mentor', limiter(80), mentorRoutes);

app.use((_req, res) => res.status(404).json({ message: 'Route not found' }));
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('❌', err.message);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL || 'admin@interviewai.com').toLowerCase();
  if (await Admin.findOne({ email })) return;
  if (await Admin.estimatedDocumentCount()) return; // admin already exists (password change ho chuka ho sakta hai)
  await Admin.create({ email, password: await bcrypt.hash(process.env.ADMIN_PASSWORD || 'ChangeMe@12345', 10) });
  console.log('👑 Admin created:', email);
}

const PORT = process.env.PORT || 5000;
connectDB()
  .then(seedAdmin)
  .then(() => app.listen(PORT, () => console.log(`🚀 API running on port ${PORT}`)))
  .catch((e) => {
    console.error('Startup failed:', e.message);
    process.exit(1);
  });
