import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.js';
import scheduleRoutes from './routes/schedules.js';
import facultyRoutes from './routes/faculty.js';
import videoRoutes from './routes/videos.js';
import announcementRoutes from './routes/announcements.js';
import inventoryRoutes from './routes/inventory.js';
import labZonesRoutes from './routes/labZones.js';
import { getDb } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure uploads directory exists and serve statically
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// Initialize DB with seed on startup
getDb();

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/lab-zones', labZonesRoutes);

// Network Info endpoint for dynamic QR code generation
app.get('/api/system/network-info', (req, res) => {
  const nets = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        ips.push({ iface: name, ip: net.address });
      }
    }
  }
  const primaryIp = ips[0] ? ips[0].ip : 'localhost';
  res.json({
    success: true,
    primaryIp,
    ips,
    localUrl: `http://${primaryIp}:5173/#mobile-floor-plan`,
    offlineReady: true
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'POLIMDO D4 Electrical Engineering Digital Signage API',
    timestamp: new Date().toISOString()
  });
});

// Serve frontend in production build if present
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Only start standalone server if NOT running on Vercel serverless
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`⚡ POLIMDO Lab Signage Server running on http://localhost:${PORT}`);
  });
}

export default app;
