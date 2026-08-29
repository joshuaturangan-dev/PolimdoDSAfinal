import express from 'express';
import { getDb, saveDb } from '../db.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// GET /api/lab-zones - get all floor plan zones
router.get('/', (req, res) => {
  const db = getDb();
  res.json({ success: true, data: db.labZones || [] });
});

// PUT /api/lab-zones/:id - update a zone status (protected)
router.put('/:id', authenticateToken, (req, res) => {
  const db = getDb();
  const index = db.labZones.findIndex(z => z.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Zona lab tidak ditemukan' });
  }

  db.labZones[index] = {
    ...db.labZones[index],
    ...req.body,
    id: req.params.id
  };

  saveDb(db);
  res.json({ success: true, message: 'Status zona lab diperbarui', data: db.labZones[index] });
});

export default router;
