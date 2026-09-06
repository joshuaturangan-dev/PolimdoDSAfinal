import express from 'express';
import jwt from 'jsonwebtoken';
import { getDb } from '../db.js';
import { supabase, isSupabaseConfigured } from '../supabase.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'polimdo_lab_signage_secret_2026';

// Middleware to verify auth token
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required / Akses memerlukan login' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Token invalid or expired / Sesi telah kedaluwarsa' });
    }
    req.user = user;
    next();
  });
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required' });
  }

  let user = null;

  // 1. Try Supabase cloud database first
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .ilike('username', username.trim())
        .eq('password', password.trim())
        .maybeSingle();

      if (data && !error) {
        user = data;
      }
    } catch (e) {
      console.warn('Supabase auth check fallback:', e.message);
    }
  }

  // 2. Fallback to local DB
  if (!user) {
    const db = getDb();
    user = db.users.find(u => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password.trim());
  }

  if (!user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Username atau password salah! Silakan periksa kembali atau gunakan akun demo.' 
    });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return res.json({
    success: true,
    message: `Selamat datang, ${user.name}!`,
    token,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      email: user.email
    }
  });
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req, res) => {
  const db = getDb();
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  return res.json({
    success: true,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      email: user.email
    }
  });
});

export default router;
