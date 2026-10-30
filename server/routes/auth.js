import { Router } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { protect, signToken } from '../middleware/auth.js';

const router = Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const publicUser = (u) => ({ id: u._id, firstName: u.firstName, lastName: u.lastName, email: u.email, role: u.role, createdAt: u.createdAt });
const sendAuth = (res, u, code = 200) => res.status(code).json({ token: signToken({ id: u._id, type: 'user' }), user: publicUser(u) });

router.post('/register', async (req, res, next) => {
  try {
    const { firstName, lastName = '', email, password, role } = req.body || {};
    if (!firstName?.trim() || !EMAIL_RE.test(email || '') || (password || '').length < 6)
      return res.status(400).json({ message: 'Name, valid email aur 6+ character password zaroori hai' });
    if (await User.findOne({ email: email.toLowerCase() })) return res.status(409).json({ message: 'Ye email already registered hai' });
    const user = await User.create({ firstName: firstName.trim(), lastName: lastName.trim(), email, role: role?.trim() || undefined, password: await bcrypt.hash(password, 10) });
    sendAuth(res, user, 201);
  } catch (e) { next(e); }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    const user = await User.findOne({ email: String(email || '').toLowerCase() }).select('+password');
    if (!user || !(await bcrypt.compare(password || '', user.password))) return res.status(401).json({ message: 'Email ya password galat hai' });
    if (user.status === 'blocked') return res.status(403).json({ message: 'Aapka account blocked hai' });
    user.lastLogin = new Date();
    await user.save();
    sendAuth(res, user);
  } catch (e) { next(e); }
});

router.get('/me', protect, (req, res) => res.json({ user: publicUser(req.user) }));

router.put('/profile', protect, async (req, res, next) => {
  try {
    const { firstName, lastName, role } = req.body || {};
    if (firstName?.trim()) req.user.firstName = firstName.trim();
    if (lastName !== undefined) req.user.lastName = String(lastName).trim();
    if (role?.trim()) req.user.role = role.trim();
    await req.user.save();
    res.json({ user: publicUser(req.user) });
  } catch (e) { next(e); }
});

export default router;
