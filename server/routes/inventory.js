import express from 'express';
import { getDb, saveDb } from '../db.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// GET /api/inventory - list all inventory items
router.get('/', (req, res) => {
  const db = getDb();
  res.json({ success: true, data: db.inventory || [] });
});

// POST /api/inventory - add new inventory item (protected)
router.post('/', authenticateToken, (req, res) => {
  const db = getDb();
  const totalStock = Number(req.body.totalStock) || 1;
  const newItem = {
    id: `inv_${Date.now()}`,
    code: req.body.code || `TL-EQ-${Date.now().toString().slice(-4)}`,
    name: req.body.name || 'Alat Praktikum Baru',
    nameEn: req.body.nameEn || req.body.name || 'New Lab Equipment',
    category: req.body.category || 'Alat Ukur / Measurement',
    categoryEn: req.body.categoryEn || 'Measurement Tool',
    totalStock: totalStock,
    availableStock: req.body.availableStock !== undefined ? Number(req.body.availableStock) : totalStock,
    unit: req.body.unit || 'Unit',
    location: req.body.location || 'Lemari Alat Lab',
    status: req.body.status || 'available', // available, low, maintenance
    specs: req.body.specs || '',
    image: req.body.image || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=300&q=80'
  };

  db.inventory.push(newItem);
  saveDb(db);
  res.status(201).json({ success: true, message: 'Alat laboratorium berhasil ditambahkan', data: newItem });
});

// PUT /api/inventory/:id - update item (protected)
router.put('/:id', authenticateToken, (req, res) => {
  const db = getDb();
  const index = db.inventory.findIndex(item => item.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Barang tidak ditemukan' });
  }

  db.inventory[index] = {
    ...db.inventory[index],
    ...req.body,
    id: req.params.id
  };

  saveDb(db);
  res.json({ success: true, message: 'Data alat berhasil diperbarui', data: db.inventory[index] });
});

// DELETE /api/inventory/:id - delete item (protected)
router.delete('/:id', authenticateToken, (req, res) => {
  const db = getDb();
  const initialLen = db.inventory.length;
  db.inventory = db.inventory.filter(item => item.id !== req.params.id);

  if (db.inventory.length === initialLen) {
    return res.status(404).json({ success: false, message: 'Barang tidak ditemukan' });
  }

  saveDb(db);
  res.json({ success: true, message: 'Barang berhasil dihapus dari inventaris' });
});

// --- BOOKINGS & BORROWING SYSTEM ---

// GET /api/inventory/bookings - list all bookings
router.get('/bookings', (req, res) => {
  const db = getDb();
  res.json({ success: true, data: db.bookings || [] });
});

// POST /api/inventory/bookings - submit a new borrowing/booking request (Public for students/lecturers)
router.post('/bookings', (req, res) => {
  const db = getDb();
  const { itemId, borrowerName, nim, className, quantity, borrowDate, returnDate, purpose, notes } = req.body;

  if (!itemId || !borrowerName || !nim) {
    return res.status(400).json({ success: false, message: 'Data peminjam dan alat wajib diisi lengkap' });
  }

  const item = db.inventory.find(i => i.id === itemId);
  if (!item) {
    return res.status(404).json({ success: false, message: 'Alat yang dipilih tidak ditemukan di katalog' });
  }

  const requestedQty = Number(quantity) || 1;
  if (item.availableStock < requestedQty) {
    return res.status(400).json({ 
      success: false, 
      message: `Stok alat tidak mencukupi. Tersedia: ${item.availableStock} ${item.unit}` 
    });
  }

  const newBooking = {
    id: `bk_${Date.now()}`,
    itemId,
    itemName: item.name,
    borrowerName: borrowerName.trim(),
    nim: nim.trim(),
    className: className || 'D4 Teknik Listrik',
    quantity: requestedQty,
    borrowDate: borrowDate || new Date().toISOString().split('T')[0],
    returnDate: returnDate || new Date().toISOString().split('T')[0],
    purpose: purpose || 'Praktikum Mandiri',
    status: 'pending', // pending, approved, returned, rejected
    approvedBy: '-',
    notes: notes || '',
    createdAt: new Date().toISOString()
  };

  db.bookings.unshift(newBooking);
  saveDb(db);

  res.status(201).json({
    success: true,
    message: 'Pengajuan peminjaman berhasil dikirim! Menunggu persetujuan Teknisi / Kepala Lab.',
    data: newBooking
  });
});

// PATCH /api/inventory/bookings/:id/status - approve, reject, or return booking (protected)
router.patch('/bookings/:id/status', authenticateToken, (req, res) => {
  const db = getDb();
  const { status, notes } = req.body; // 'approved', 'rejected', 'returned'
  const booking = db.bookings.find(b => b.id === req.params.id);

  if (!booking) {
    return res.status(404).json({ success: false, message: 'Data peminjaman tidak ditemukan' });
  }

  const prevStatus = booking.status;
  booking.status = status;
  if (notes) booking.notes = notes;
  booking.approvedBy = req.user.name || 'Admin Lab';

  // Update item available stock
  const item = db.inventory.find(i => i.id === booking.itemId);
  if (item) {
    if (status === 'approved' && prevStatus !== 'approved') {
      item.availableStock = Math.max(0, item.availableStock - booking.quantity);
      if (item.availableStock === 0) item.status = 'low';
    } else if (status === 'returned' && prevStatus === 'approved') {
      item.availableStock = Math.min(item.totalStock, item.availableStock + booking.quantity);
      if (item.availableStock > 0) item.status = 'available';
    } else if (status === 'rejected' && prevStatus === 'approved') {
      item.availableStock = Math.min(item.totalStock, item.availableStock + booking.quantity);
      if (item.availableStock > 0) item.status = 'available';
    }
  }

  saveDb(db);
  res.json({
    success: true,
    message: `Status peminjaman berhasil diubah menjadi: ${status.toUpperCase()}`,
    data: booking
  });
});

export default router;
