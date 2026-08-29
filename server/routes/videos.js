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

// Setup Multer directories for videos and thumbnails
const uploadBaseDir = path.join(__dirname, '..', 'uploads');
const videoUploadDir = path.join(uploadBaseDir, 'videos');
const thumbUploadDir = path.join(uploadBaseDir, 'thumbnails');

[uploadBaseDir, videoUploadDir, thumbUploadDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Storage for Video Files (MP4, WebM, MOV, MKV, AVI, etc.)
const videoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, videoUploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname) || '.mp4';
    const cleanName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueName = `video_${Date.now()}_${cleanName}${ext}`;
    cb(null, uniqueName);
  }
});

const videoUpload = multer({
  storage: videoStorage,
  limits: { fileSize: 1024 * 1024 * 1024 }, // 1GB max for high quality lab videos
  fileFilter: (req, file, cb) => {
    // Accept video files
    if (file.mimetype.startsWith('video/') || /\.(mp4|webm|ogg|mov|mkv|avi|m4v)$/i.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Format file harus berupa video (MP4, WebM, MOV, MKV, AVI)!'));
    }
  }
});

// Storage for Thumbnail Images
const thumbStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, thumbUploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname) || '.jpg';
    const uniqueName = `thumb_${Date.now()}_${Math.round(Math.random() * 1E6)}${ext}`;
    cb(null, uniqueName);
  }
});

const thumbUpload = multer({
  storage: thumbStorage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Format thumbnail harus berupa gambar (JPG, PNG, WebP)!'));
    }
  }
});

// POST /api/videos/upload-video - direct video file upload from folder
router.post('/upload-video', authenticateToken, videoUpload.single('videoFile'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Tidak ada file video yang diunggah' });
    }

    const videoUrl = `/uploads/videos/${req.file.filename}`;
    const fileSizeMB = (req.file.size / (1024 * 1024)).toFixed(2);

    res.json({
      success: true,
      message: `Video "${req.file.originalname}" (${fileSizeMB} MB) berhasil diunggah!`,
      url: videoUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileSizeFormatted: `${fileSizeMB} MB`
    });
  } catch (error) {
    console.error('Error uploading video:', error);
    res.status(500).json({ success: false, message: 'Gagal mengunggah video: ' + error.message });
  }
});

// POST /api/videos/upload-thumbnail - upload custom thumbnail from folder
router.post('/upload-thumbnail', authenticateToken, thumbUpload.single('thumbnailFile'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Tidak ada file thumbnail yang diunggah' });
    }

    const thumbUrl = `/uploads/thumbnails/${req.file.filename}`;
    res.json({
      success: true,
      message: 'Thumbnail berhasil diunggah!',
      url: thumbUrl
    });
  } catch (error) {
    console.error('Error uploading thumbnail:', error);
    res.status(500).json({ success: false, message: 'Gagal mengunggah thumbnail: ' + error.message });
  }
});

// GET /api/videos - list all scheduled videos
router.get('/', (req, res) => {
  const db = getDb();
  let list = db.videos || [];
  if (req.query.category) {
    list = list.filter(v => v.category === req.query.category);
  }
  res.json({ success: true, data: list });
});

// POST /api/videos - add new video (protected)
router.post('/', authenticateToken, (req, res) => {
  const db = getDb();
  const categoryNames = {
    course_promo: { id: 'Promosi Mata Kuliah', en: 'Course Promotion' },
    instructional: { id: 'Video Pembelajaran', en: 'Instructional Video' },
    k3_safety: { id: 'K3 & Keselamatan Kerja', en: 'OSH & Lab Safety' },
    campus_ad: { id: 'Iklan & Info Kampus', en: 'Campus Ads & Info' }
  };

  const category = req.body.category || 'course_promo';
  const newVideo = {
    id: `vid_${Date.now()}`,
    title: req.body.title || 'Judul Video Baru',
    titleEn: req.body.titleEn || req.body.title || 'New Video Title',
    category,
    categoryName: categoryNames[category]?.id || 'Umum',
    categoryNameEn: categoryNames[category]?.en || 'General',
    url: req.body.url || '',
    embedUrl: req.body.embedUrl || '',
    duration: req.body.duration || '03:00',
    thumbnail: req.body.thumbnail || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    description: req.body.description || '',
    descriptionEn: req.body.descriptionEn || req.body.description || '',
    scheduleSlot: req.body.scheduleSlot || 'Semua Waktu',
    isActive: req.body.isActive !== undefined ? Boolean(req.body.isActive) : true
  };

  db.videos.push(newVideo);
  saveDb(db);
  res.status(201).json({ success: true, message: 'Video berhasil ditambahkan ke jadwal', data: newVideo });
});

// PUT /api/videos/:id - update video (protected)
router.put('/:id', authenticateToken, (req, res) => {
  const db = getDb();
  const index = db.videos.findIndex(v => v.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Video tidak ditemukan' });
  }

  db.videos[index] = {
    ...db.videos[index],
    ...req.body,
    id: req.params.id
  };

  saveDb(db);
  res.json({ success: true, message: 'Video berhasil diperbarui', data: db.videos[index] });
});

// DELETE /api/videos/:id - delete video (protected)
router.delete('/:id', authenticateToken, (req, res) => {
  const db = getDb();
  const initialLen = db.videos.length;
  db.videos = db.videos.filter(v => v.id !== req.params.id);

  if (db.videos.length === initialLen) {
    return res.status(404).json({ success: false, message: 'Video tidak ditemukan' });
  }

  saveDb(db);
  res.json({ success: true, message: 'Video berhasil dihapus' });
});

export default router;
