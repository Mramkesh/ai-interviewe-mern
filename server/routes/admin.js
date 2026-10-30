import { Router } from 'express';
import bcrypt from 'bcryptjs';
import Admin from '../models/Admin.js';
import User from '../models/User.js';
import Interview from '../models/Interview.js';
import { adminOnly, signToken } from '../middleware/auth.js';

const router = Router();
const esc = (s) => String(s ?? '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    const admin = await Admin.findOne({ email: String(email || '').toLowerCase() });
    if (!admin || !(await bcrypt.compare(password || '', admin.password))) return res.status(401).json({ message: 'Admin email ya password galat hai' });
    res.json({ token: signToken({ id: admin._id, type: 'admin' }, '12h'), admin: { email: admin.email } });
  } catch (e) { next(e); }
});

router.use(adminOnly);

router.get('/overview', async (_req, res, next) => {
  try {
    const [users, interviews, active, agg, recent] = await Promise.all([
      User.countDocuments(), Interview.countDocuments(), User.countDocuments({ status: 'active' }),
      Interview.aggregate([{ $group: { _id: null, avg: { $avg: '$score' } } }]),
      Interview.find().sort({ createdAt: -1 }).limit(6).populate('user', 'firstName lastName').select('company score duration createdAt user').lean(),
    ]);
    const since = new Date(Date.now() - 7 * 864e5);
    const [newUsers, weekInterviews] = await Promise.all([User.countDocuments({ createdAt: { $gte: since } }), Interview.countDocuments({ createdAt: { $gte: since } })]);
    res.json({ users, interviews, active, avgScore: Math.round(agg[0]?.avg || 0), newUsers, weekInterviews, recent });
  } catch (e) { next(e); }
});

router.get('/users', async (req, res, next) => {
  try {
    const q = String(req.query.search || '').trim();
    const filter = q ? { $or: ['firstName', 'lastName', 'email'].map((f) => ({ [f]: new RegExp(esc(q), 'i') })) } : {};
    const users = await User.find(filter).sort({ createdAt: -1 }).limit(300).lean();
    const stats = await Interview.aggregate([{ $group: { _id: '$user', count: { $sum: 1 }, avg: { $avg: '$score' } } }]);
    const map = new Map(stats.map((s) => [String(s._id), s]));
    res.json({ users: users.map((u) => ({ ...u, password: undefined, interviews: map.get(String(u._id))?.count || 0, avgScore: Math.round(map.get(String(u._id))?.avg || 0) })) });
  } catch (e) { next(e); }
});

router.get('/users/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
    const interviews = await Interview.find({ user: user._id }).sort({ createdAt: -1 }).limit(30).select('company type score grade duration createdAt').lean();
    res.json({ user, interviews });
  } catch (e) { next(e); }
});

router.patch('/users/:id/status', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.status = user.status === 'active' ? 'blocked' : 'active';
    await user.save();
    res.json({ status: user.status });
  } catch (e) { next(e); }
});

router.delete('/users/:id', async (req, res, next) => {
  try {
    await Interview.deleteMany({ user: req.params.id });
    await User.deleteOne({ _id: req.params.id });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.get('/interviews', async (_req, res, next) => {
  try {
    const list = await Interview.find().sort({ createdAt: -1 }).limit(200).populate('user', 'firstName lastName email').select('company type score grade duration createdAt user').lean();
    res.json({ interviews: list });
  } catch (e) { next(e); }
});

router.get('/analytics', async (_req, res, next) => {
  try {
    const [byCompany, byType, daily, dist] = await Promise.all([
      Interview.aggregate([{ $group: { _id: '$company', count: { $sum: 1 }, avg: { $avg: '$score' } } }, { $sort: { count: -1 } }, { $limit: 8 }]),
      Interview.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }]),
      Interview.aggregate([{ $match: { createdAt: { $gte: new Date(Date.now() - 14 * 864e5) } } }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 }, avg: { $avg: '$score' } } }, { $sort: { _id: 1 } }]),
      Interview.aggregate([{ $bucket: { groupBy: '$score', boundaries: [0, 40, 55, 70, 85, 101], default: 'other', output: { count: { $sum: 1 } } } }]),
    ]);
    res.json({ byCompany, byType, daily, dist });
  } catch (e) { next(e); }
});

router.put('/password', async (req, res, next) => {
  try {
    const { current, next: newPass } = req.body || {};
    if ((newPass || '').length < 8) return res.status(400).json({ message: 'Naya password kam se kam 8 characters ka ho' });
    const admin = await Admin.findById(req.admin.id);
    if (!admin || !(await bcrypt.compare(current || '', admin.password))) return res.status(401).json({ message: 'Current password galat hai' });
    admin.password = await bcrypt.hash(newPass, 10);
    await admin.save();
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.get('/export', async (_req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).lean();
    const stats = await Interview.aggregate([{ $group: { _id: '$user', count: { $sum: 1 }, avg: { $avg: '$score' } } }]);
    const map = new Map(stats.map((s) => [String(s._id), s]));
    const cell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = [['Name', 'Email', 'Role', 'Status', 'Interviews', 'Avg Score', 'Joined'].join(',')];
    users.forEach((u) => rows.push([`${u.firstName} ${u.lastName || ''}`.trim(), u.email, u.role, u.status, map.get(String(u._id))?.count || 0, Math.round(map.get(String(u._id))?.avg || 0), new Date(u.createdAt).toISOString().slice(0, 10)].map(cell).join(',')));
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
    res.send(rows.join('\n'));
  } catch (e) { next(e); }
});

export default router;
