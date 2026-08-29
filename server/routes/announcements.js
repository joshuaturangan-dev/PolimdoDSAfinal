import express from 'express';
import { getDb, saveDb } from '../db.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// GET /api/announcements
router.get('/', (req, res) => {
  const db = getDb();
  res.json({ success: true, data: db.announcements || [] });
});

// POST /api/announcements (protected)
router.post('/', authenticateToken, (req, res) => {
  const db = getDb();
  const newAnn = {
    id: `ann_${Date.now()}`,
    title: req.body.title || 'Pengumuman Baru',
    titleEn: req.body.titleEn || req.body.title || 'New Announcement',
    priority: req.body.priority || 'normal', // high, medium, normal
    category: req.body.category || 'Akademik',
    categoryEn: req.body.categoryEn || 'Academic',
    date: req.body.date || new Date().toISOString().split('T')[0],
    content: req.body.content || '',
    contentEn: req.body.contentEn || req.body.content || '',
    badge: req.body.badge || (req.body.priority === 'high' ? 'PENTING / URGENT' : 'INFO'),
    isActive: req.body.isActive !== undefined ? Boolean(req.body.isActive) : true
  };

  db.announcements.unshift(newAnn);
  saveDb(db);
  res.status(201).json({ success: true, message: 'Pengumuman berhasil dipublikasikan', data: newAnn });
});

// PUT /api/announcements/:id (protected)
router.put('/:id', authenticateToken, (req, res) => {
  const db = getDb();
  const index = db.announcements.findIndex(a => a.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Pengumuman tidak ditemukan' });
  }

  db.announcements[index] = {
    ...db.announcements[index],
    ...req.body,
    id: req.params.id
  };

  saveDb(db);
  res.json({ success: true, message: 'Pengumuman berhasil diperbarui', data: db.announcements[index] });
});

// DELETE /api/announcements/:id (protected)
router.delete('/:id', authenticateToken, (req, res) => {
  const db = getDb();
  const initialLen = db.announcements.length;
  db.announcements = db.announcements.filter(a => a.id !== req.params.id);

  if (db.announcements.length === initialLen) {
    return res.status(404).json({ success: false, message: 'Pengumuman tidak ditemukan' });
  }

  saveDb(db);
  res.json({ success: true, message: 'Pengumuman berhasil dihapus' });
});

export default router;
