import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const signToken = (payload, expiresIn = '7d') => jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });

const getToken = (req) => {
  const h = req.headers.authorization || '';
  return h.startsWith('Bearer ') ? h.slice(7) : null;
};

export async function protect(req, res, next) {
  try {
    const token = getToken(req);
    if (!token) return res.status(401).json({ message: 'Please login karo' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'user') return res.status(401).json({ message: 'Invalid token' });
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: 'User not found' });
    if (user.status === 'blocked') return res.status(403).json({ message: 'Aapka account blocked hai. Admin se contact karo.' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: 'Session expire ho gaya, dobara login karo' });
  }
}

export function adminOnly(req, res, next) {
  try {
    const token = getToken(req);
    if (!token) return res.status(401).json({ message: 'Admin login required' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'admin') return res.status(403).json({ message: 'Admin access only' });
    req.admin = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Admin session expired' });
  }
}
