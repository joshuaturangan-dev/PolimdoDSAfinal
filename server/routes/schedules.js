import express from 'express';
import multer from 'multer';
import * as XLSX from 'xlsx';
import { getDb, saveDb } from '../db.js';
import { authenticateToken } from './auth.js';
import { supabase, isSupabaseConfigured } from '../supabase.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// GET /api/schedules - list all schedules
router.get('/', async (req, res) => {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from('schedules').select('*');
      if (data && !error && data.length > 0) {
        const formatted = data.map(s => ({
          id: s.id,
          day: s.day,
          dayEn: s.day_en,
          startTime: s.start_time,
          endTime: s.end_time,
          courseCode: s.course_code,
          courseName: s.course_name,
          courseNameEn: s.course_name_en,
          lecturer: s.lecturer,
          className: s.class_name,
          semester: s.semester,
          room: s.room,
          credits: s.credits,
          topic: s.topic,
          upcomingTask: s.upcoming_task,
          academicYear: s.academic_year,
          color: s.color
        }));
        return res.json({ success: true, data: formatted });
      }
    } catch (e) {
      console.warn('Supabase schedules fetch fallback:', e.message);
    }
  }

  const db = getDb();
  res.json({ success: true, data: db.schedules || [] });
});

// POST /api/schedules - create new schedule (protected)
router.post('/', authenticateToken, async (req, res) => {
  const db = getDb();
  const newSchedule = {
    id: `sch_${Date.now()}`,
    day: req.body.day || 'Senin',
    dayEn: req.body.dayEn || 'Monday',
    startTime: req.body.startTime || '08:00',
    endTime: req.body.endTime || '11:30',
    courseCode: req.body.courseCode || 'TL-XXXX',
    courseName: req.body.courseName || 'Mata Kuliah Baru',
    courseNameEn: req.body.courseNameEn || req.body.courseName || 'New Course',
    lecturer: req.body.lecturer || 'Dosen Pengampu',
    className: req.body.className || 'D4-TL-1A',
    semester: Number(req.body.semester) || 1,
    room: req.body.room || 'Lab Instalasi Listrik',
    credits: Number(req.body.credits) || 3,
    topic: req.body.topic || '',
    upcomingTask: req.body.upcomingTask || '',
    academicYear: req.body.academicYear || '2025/2026 Ganjil',
    color: req.body.color || 'blue'
  };

  if (isSupabaseConfigured) {
    try {
      await supabase.from('schedules').insert({
        id: newSchedule.id,
        day: newSchedule.day,
        day_en: newSchedule.dayEn,
        start_time: newSchedule.startTime,
        end_time: newSchedule.endTime,
        course_code: newSchedule.courseCode,
        course_name: newSchedule.courseName,
        course_name_en: newSchedule.courseNameEn,
        lecturer: newSchedule.lecturer,
        class_name: newSchedule.className,
        semester: newSchedule.semester,
        room: newSchedule.room,
        credits: newSchedule.credits,
        topic: newSchedule.topic,
        upcoming_task: newSchedule.upcomingTask,
        academic_year: newSchedule.academicYear,
        color: newSchedule.color
      });
    } catch (e) {
      console.warn('Supabase schedule insert error:', e.message);
    }
  }

  db.schedules.push(newSchedule);
  saveDb(db);
  res.status(201).json({ success: true, message: 'Jadwal berhasil ditambahkan', data: newSchedule });
});

// PUT /api/schedules/:id - update schedule (protected)
router.put('/:id', authenticateToken, async (req, res) => {
  const db = getDb();
  const index = db.schedules.findIndex(s => s.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Jadwal tidak ditemukan' });
  }

  db.schedules[index] = {
    ...db.schedules[index],
    ...req.body,
    id: req.params.id
  };

  if (isSupabaseConfigured) {
    try {
      const s = db.schedules[index];
      await supabase.from('schedules').update({
        day: s.day,
        day_en: s.dayEn,
        start_time: s.startTime,
        end_time: s.endTime,
        course_code: s.courseCode,
        course_name: s.courseName,
        course_name_en: s.courseNameEn,
        lecturer: s.lecturer,
        class_name: s.className,
        semester: s.semester,
        room: s.room,
        credits: s.credits,
        topic: s.topic,
        upcoming_task: s.upcomingTask,
        academic_year: s.academicYear,
        color: s.color
      }).eq('id', req.params.id);
    } catch (e) {
      console.warn('Supabase schedule update error:', e.message);
    }
  }

  saveDb(db);
  res.json({ success: true, message: 'Jadwal berhasil diperbarui', data: db.schedules[index] });
});

// DELETE /api/schedules/:id - delete schedule (protected)
router.delete('/:id', authenticateToken, async (req, res) => {
  const db = getDb();
  const initialLen = db.schedules.length;
  db.schedules = db.schedules.filter(s => s.id !== req.params.id);

  if (db.schedules.length === initialLen) {
    return res.status(404).json({ success: false, message: 'Jadwal tidak ditemukan' });
  }

  if (isSupabaseConfigured) {
    try {
      await supabase.from('schedules').delete().eq('id', req.params.id);
    } catch (e) {
      console.warn('Supabase schedule delete error:', e.message);
    }
  }

  saveDb(db);
  res.json({ success: true, message: 'Jadwal berhasil dihapus' });
});

function formatExcelTime(val) {
  if (val === null || val === undefined || val === '') return '';
  if (typeof val === 'number') {
    if (val >= 0 && val < 1) {
      const totalSeconds = Math.round(val * 24 * 3600);
      const hours = Math.floor(totalSeconds / 3600) % 24;
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    if (val >= 1 && val <= 24) {
      const hours = Math.floor(val);
      const minutes = Math.round((val - hours) * 60);
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    return String(val);
  }
  if (typeof val === 'string') {
    val = val.trim();
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(val)) {
      const parts = val.split(':');
      return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
    }
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0 && num < 1) {
      const totalSeconds = Math.round(num * 24 * 3600);
      const hours = Math.floor(totalSeconds / 3600) % 24;
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    if (/^\d{1,2}\.\d{2}$/.test(val)) {
      const parts = val.split('.');
      return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
    }
  }
  if (val instanceof Date && !isNaN(val.getTime())) {
    const hours = val.getHours().toString().padStart(2, '0');
    const minutes = val.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }
  return String(val);
}

// POST /api/schedules/import-excel - upload Excel file and bulk import (protected)
router.post('/import-excel', authenticateToken, upload.single('file'), (req, res) => {
  try {
    let rawItems = [];

    if (req.file) {
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer', cellDates: true });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      rawItems = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    } else if (req.body.items && Array.isArray(req.body.items)) {
      rawItems = req.body.items;
    } else {
      return res.status(400).json({ success: false, message: 'No Excel file or items provided' });
    }

    if (rawItems.length === 0) {
      return res.status(400).json({ success: false, message: 'File Excel kosong atau format tidak sesuai' });
    }

    const dayEnMap = {
      'senin': 'Monday', 'selasa': 'Tuesday', 'rabu': 'Wednesday',
      'kamis': 'Thursday', 'jumat': 'Friday', 'sabtu': 'Saturday', 'minggu': 'Sunday'
    };

    const colors = ['blue', 'cyan', 'emerald', 'amber', 'purple', 'red', 'yellow', 'indigo'];

    const importedSchedules = rawItems.map((row, idx) => {
      let startTime = row['Jam Mulai'] || row['startTime'] || row['Start Time'] || row['Jam_Mulai'] || row['Mulai'] || '';
      let endTime = row['Jam Selesai'] || row['endTime'] || row['End Time'] || row['Jam_Selesai'] || row['Selesai'] || '';

      const combinedTime = row['Waktu'] || row['waktu'] || row['Time'] || row['time'] || row['Jam'] || '';
      if ((!startTime || !endTime) && combinedTime && typeof combinedTime === 'string' && combinedTime.includes('-')) {
        const timeParts = combinedTime.split('-').map(t => t.trim());
        if (timeParts[0]) startTime = timeParts[0];
        if (timeParts[1]) endTime = timeParts[1];
      }

      const cleanStartTime = formatExcelTime(startTime) || '08:00';
      const cleanEndTime = formatExcelTime(endTime) || '11:30';

      const day = row['Hari'] || row['day'] || row['Day'] || 'Senin';
      const dayEn = row['Hari (EN)'] || row['dayEn'] || dayEnMap[String(day).toLowerCase()] || 'Monday';
      const courseCode = row['Kode MK'] || row['Kode'] || row['courseCode'] || row['Code'] || `TL-${4100 + idx}`;
      const courseName = row['Mata Kuliah'] || row['courseName'] || row['Mata_Kuliah'] || row['Course'] || row['Nama MK'] || 'Praktikum Kelistrikan';
      const courseNameEn = row['Mata Kuliah (EN)'] || row['courseNameEn'] || courseName;
      const lecturer = row['Dosen'] || row['lecturer'] || row['Dosen Pengampu'] || row['Lecturer'] || row['Pengajar'] || 'Dosen Pengampu';
      const className = row['Kelas'] || row['className'] || row['Class'] || 'D4-TL-3A';
      const semester = Number(row['Semester'] || row['semester'] || 3) || 3;
      const room = row['Ruangan / Meja'] || row['Ruangan'] || row['room'] || row['Room'] || row['Meja'] || 'Lab Instalasi Listrik';
      const credits = Number(row['SKS'] || row['credits'] || row['Credits'] || 3) || 3;
      const topic = row['Materi'] || row['Topik'] || row['topic'] || row['Topic'] || row['Job Sheet'] || '';
      const upcomingTask = row['Tugas Mendatang'] || row['upcomingTask'] || row['Upcoming Task'] || '';

      return {
        id: `sch_imp_${Date.now()}_${idx}`,
        day,
        dayEn,
        startTime: cleanStartTime,
        endTime: cleanEndTime,
        courseCode,
        courseName,
        courseNameEn,
        lecturer,
        className,
        semester,
        room,
        credits,
        topic,
        upcomingTask,
        academicYear: '2025/2026 Ganjil',
        color: colors[idx % colors.length]
      };
    });

    const db = getDb();
    const mode = req.query.mode || req.body.mode || 'append'; // 'replace' or 'append'

    if (mode === 'replace') {
      db.schedules = importedSchedules;
    } else {
      db.schedules = [...db.schedules, ...importedSchedules];
    }

    saveDb(db);

    res.json({
      success: true,
      message: `Berhasil mengimpor ${importedSchedules.length} jadwal mata kuliah!`,
      importedCount: importedSchedules.length,
      data: db.schedules
    });
  } catch (error) {
    console.error('Error importing excel:', error);
    res.status(500).json({ success: false, message: 'Gagal memproses file Excel: ' + error.message });
  }
});

// GET /api/schedules/template - generate and download sample Excel template
router.get('/template', (req, res) => {
  const sampleData = [
    {
      "Hari": "Senin",
      "Jam Mulai": "08:00",
      "Jam Selesai": "11:30",
      "Kode MK": "TL-4101",
      "Mata Kuliah": "Praktikum Instalasi Tenaga Listrik 1",
      "Mata Kuliah (EN)": "Electrical Power Installation Lab 1",
      "Dosen": "Dr. Eng. Arthur Sanger, S.T., M.T.",
      "Kelas": "D4-TL-3A",
      "Semester": 3,
      "Ruangan / Meja": "Lab Instalasi Listrik (Meja 1-4)",
      "SKS": 3
    },
    {
      "Hari": "Senin",
      "Jam Mulai": "13:00",
      "Jam Selesai": "16:30",
      "Kode MK": "TL-4205",
      "Mata Kuliah": "Praktikum PLC & Otomasi Industri",
      "Mata Kuliah (EN)": "PLC & Industrial Automation Lab",
      "Dosen": "Ir. Marson Budiman, M.T.",
      "Kelas": "D4-TL-5B",
      "Semester": 5,
      "Ruangan / Meja": "Lab PLC & Otomasi (Meja 5-8)",
      "SKS": 3
    },
    {
      "Hari": "Selasa",
      "Jam Mulai": "08:00",
      "Jam Selesai": "11:30",
      "Kode MK": "TL-4102",
      "Mata Kuliah": "Praktikum Rangkaian Listrik & Pengukuran",
      "Mata Kuliah (EN)": "Electric Circuits & Measurement Lab",
      "Dosen": "Stevy Walangitan, S.T., M.Eng.",
      "Kelas": "D4-TL-1A",
      "Semester": 1,
      "Ruangan / Meja": "Lab Instalasi Listrik",
      "SKS": 3
    }
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Jadwal Praktikum D4");
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  res.setHeader('Content-Disposition', 'attachment; filename=Template_Jadwal_POLIMDO_D4_Teknik_Listrik.xlsx');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buffer);
});

export default router;
