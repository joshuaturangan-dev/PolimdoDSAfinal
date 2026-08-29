import * as XLSX from 'xlsx';

// Helper to format any Excel time value (number fraction, decimal, Date, string) to HH:mm
export function formatExcelTime(val) {
  if (val === null || val === undefined || val === '') return '';

  // 1. If it's a numeric value from Excel
  if (typeof val === 'number') {
    // If it's a fraction of a day (0.0 to 0.9999...)
    if (val >= 0 && val < 1) {
      const totalSeconds = Math.round(val * 24 * 3600);
      const hours = Math.floor(totalSeconds / 3600) % 24;
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    // If it's a decimal like 8.5 (8:30) or 13.75 (13:45)
    if (val >= 1 && val <= 24) {
      const hours = Math.floor(val);
      const minutes = Math.round((val - hours) * 60);
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    return String(val);
  }

  // 2. If it's a string
  if (typeof val === 'string') {
    val = val.trim();
    // Already standard HH:mm or HH:mm:ss
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(val)) {
      const parts = val.split(':');
      return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
    }

    // Stringified float e.g. "0.3229166666666667"
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0 && num < 1) {
      const totalSeconds = Math.round(num * 24 * 3600);
      const hours = Math.floor(totalSeconds / 3600) % 24;
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    // Handles format like "08.00" (dot instead of colon)
    if (/^\d{1,2}\.\d{2}$/.test(val)) {
      const parts = val.split('.');
      return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
    }
  }

  // 3. If it's a Date object
  if (val instanceof Date && !isNaN(val.getTime())) {
    const hours = val.getHours().toString().padStart(2, '0');
    const minutes = val.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  return String(val);
}

// Normalize raw row object from Excel
export function normalizeScheduleRow(row, idx) {
  let startTime = row['Jam Mulai'] || row['startTime'] || row['Start Time'] || row['Jam_Mulai'] || row['Mulai'] || row['Start'] || '';
  let endTime = row['Jam Selesai'] || row['endTime'] || row['End Time'] || row['Jam_Selesai'] || row['Selesai'] || row['End'] || '';

  // Check if there is a combined "Waktu" or "Time" column (e.g. "07:45 - 10:00" or "0.3229166... - 0.416666...")
  const combinedTime = row['Waktu'] || row['waktu'] || row['Time'] || row['time'] || row['Jam'] || '';
  if ((!startTime || !endTime) && combinedTime && typeof combinedTime === 'string' && combinedTime.includes('-')) {
    const timeParts = combinedTime.split('-').map(t => t.trim());
    if (timeParts[0]) startTime = timeParts[0];
    if (timeParts[1]) endTime = timeParts[1];
  }

  const cleanStartTime = formatExcelTime(startTime) || '08:00';
  const cleanEndTime = formatExcelTime(endTime) || '11:30';

  const day = row['Hari'] || row['day'] || row['Day'] || 'Senin';
  const courseCode = row['Kode MK'] || row['Kode'] || row['courseCode'] || row['Code'] || `TL-${4100 + (idx || 0)}`;
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
    'Hari': day,
    'Jam Mulai': cleanStartTime,
    'Jam Selesai': cleanEndTime,
    'Waktu': `${cleanStartTime} - ${cleanEndTime}`,
    'Kode MK': courseCode,
    'Mata Kuliah': courseName,
    'Mata Kuliah (EN)': courseNameEn,
    'Dosen': lecturer,
    'Kelas': className,
    'Semester': semester,
    'Ruangan / Meja': room,
    'SKS': credits,
    'Materi': topic,
    'Tugas Mendatang': upcomingTask,
    // Standard schema keys
    day,
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
    upcomingTask
  };
}

// Parse uploaded Excel / CSV File into normalized JSON Array
export function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        
        // Normalize each row with robust time formatting
        const normalizedJson = rawJson.map((row, idx) => normalizeScheduleRow(row, idx));
        resolve(normalizedJson);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

// Generate & Download Sample Template
export function downloadSampleExcel() {
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
      "SKS": 3,
      "Materi": "Job 3: Wiring Motor 3 Phasa Forward-Reverse & Proteksi TOR",
      "Tugas Mendatang": "Job 4: Pengujian Panel Distribusi & Megger 1000V"
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
      "SKS": 3,
      "Materi": "Modul 5: Pemrograman Ladder Diagram PLC Omron CP1E",
      "Tugas Mendatang": "Modul 6: Integrasi HMI Touch Screen & Sensor Induktif"
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
      "Ruangan / Meja": "Lab Instalasi Listrik (Meja 1-8)",
      "SKS": 3,
      "Materi": "Job 2: Analisis Rangkaian RLC AC 1-Fasa & Pengukuran Osiloskop",
      "Tugas Mendatang": "Job 3: Pengukuran Daya Aktif & Cos Phi Meter"
    },
    {
      "Hari": "Rabu",
      "Jam Mulai": "08:00",
      "Jam Selesai": "12:00",
      "Kode MK": "TL-4401",
      "Mata Kuliah": "Praktikum Mesin-Mesin Listrik & Penggerak",
      "Mata Kuliah (EN)": "Electrical Machines & Motor Drives Lab",
      "Dosen": "Dr. Ventje Rumambi, S.T., M.T.",
      "Kelas": "D4-TL-3B",
      "Semester": 3,
      "Ruangan / Meja": "Lab Mesin Listrik & Generator",
      "SKS": 4,
      "Materi": "Job 3: Pengujian Karakteristik Beban Generator Sinkron 3 Phasa",
      "Tugas Mendatang": "Job 4: Pengaturan Kecepatan Motor dengan VFD Inverter"
    }
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Jadwal Praktikum D4");
  XLSX.writeFile(wb, "Template_Jadwal_POLIMDO_D4_Teknik_Listrik.xlsx");
}

// Export current schedules to Excel
export function exportSchedulesToExcel(schedules) {
  const exportData = schedules.map(s => ({
    "Hari": s.day,
    "Hari (EN)": s.dayEn || s.day,
    "Jam Mulai": s.startTime,
    "Jam Selesai": s.endTime,
    "Kode MK": s.courseCode,
    "Mata Kuliah": s.courseName,
    "Mata Kuliah (EN)": s.courseNameEn || s.courseName,
    "Dosen": s.lecturer,
    "Kelas": s.className,
    "Semester": s.semester,
    "Ruangan / Meja": s.room,
    "SKS": s.credits,
    "Materi": s.topic || '',
    "Tugas Mendatang": s.upcomingTask || ''
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Jadwal Praktikum Aktif");
  XLSX.writeFile(wb, `Jadwal_Lab_Listrik_POLIMDO_${new Date().toISOString().split('T')[0]}.xlsx`);
}
