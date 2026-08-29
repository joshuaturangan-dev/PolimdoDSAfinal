import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { getDb, saveDb } from '../db.js';
import { authenticateToken } from './auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Setup Multer for faculty photo uploads
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = `faculty_${Date.now()}_${Math.round(Math.random() * 1E6)}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file gambar (JPG, PNG, WebP) yang diizinkan!'));
    }
  }
});

// GET /api/faculty - list all faculty
router.get('/', (req, res) => {
  const db = getDb();
  res.json({ success: true, data: db.faculty || [] });
});

// POST /api/faculty - create faculty profile (protected)
router.post('/', authenticateToken, (req, res) => {
  const db = getDb();
  const newFaculty = {
    id: `fac_${Date.now()}`,
    name: req.body.name || 'Nama Dosen / Staf',
    title: req.body.title || 'Dosen Pengampu',
    titleEn: req.body.titleEn || req.body.title || 'Lecturer',
    nip: req.body.nip || '-',
    nidn: req.body.nidn || '-',
    role: req.body.role || 'Dosen',
    roleEn: req.body.roleEn || 'Lecturer',
    email: req.body.email || 'dosen@polimdo.ac.id',
    expertise: req.body.expertise || 'Kelistrikan & Sistem Tenaga',
    expertiseId: req.body.expertiseId || req.body.expertise || 'Kelistrikan',
    courses: Array.isArray(req.body.courses) ? req.body.courses : (req.body.courses ? [req.body.courses] : []),
    officeHours: req.body.officeHours || 'Senin - Jumat',
    room: req.body.room || 'Ruang Dosen Elektro',
    photo: req.body.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
  };

  db.faculty.push(newFaculty);
  saveDb(db);
  res.status(201).json({ success: true, message: 'Profil dosen berhasil ditambahkan', data: newFaculty });
});

// PUT /api/faculty/:id - update faculty profile (protected)
router.put('/:id', authenticateToken, (req, res) => {
  const db = getDb();
  const index = db.faculty.findIndex(f => f.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Dosen tidak ditemukan' });
  }

  db.faculty[index] = {
    ...db.faculty[index],
    ...req.body,
    id: req.params.id
  };

  saveDb(db);
  res.json({ success: true, message: 'Profil dosen berhasil diperbarui', data: db.faculty[index] });
});

// DELETE /api/faculty/:id - delete faculty profile (protected)
router.delete('/:id', authenticateToken, (req, res) => {
  const db = getDb();
  const initialLen = db.faculty.length;
  db.faculty = db.faculty.filter(f => f.id !== req.params.id);

  if (db.faculty.length === initialLen) {
    return res.status(404).json({ success: false, message: 'Dosen tidak ditemukan' });
  }

  saveDb(db);
  res.json({ success: true, message: 'Profil dosen berhasil dihapus' });
});

// POST /api/faculty/upload-photo - upload faculty portrait image (protected)
router.post('/upload-photo', authenticateToken, upload.single('photo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Tidak ada file gambar yang diunggah' });
  }

  const photoUrl = `/uploads/${req.file.filename}`;
  res.json({
    success: true,
    message: 'Foto profil berhasil diunggah!',
    url: photoUrl
  });
});

export default router;
