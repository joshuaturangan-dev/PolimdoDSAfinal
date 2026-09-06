import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, 'data_store.json');

// Default Realistic Seed Data for POLIMDO D4 Electrical Engineering
const initialSeedData = {
  users: [
    {
      id: "u_admin",
      username: "admin",
      password: "Polimdotekniklistrik12-",
      name: "Administrator Akademik & Lab",
      role: "admin",
      email: "admin.lablistrik@polimdo.ac.id"
    },
    {
      id: "u_dosen",
      username: "dosen",
      password: "Dosenpolimdo18-",
      name: "Dr. Eng. Arthur Sanger, S.T., M.T. (Dosen Pengampu)",
      role: "dosen",
      email: "dosen.lablistrik@polimdo.ac.id"
    }
  ],
  schedules: [
    {
      id: "sch_01",
      day: "Senin",
      dayEn: "Monday",
      startTime: "08:00",
      endTime: "11:30",
      courseCode: "TL-4101",
      courseName: "Praktikum Instalasi Tenaga Listrik 1",
      courseNameEn: "Electrical Power Installation Lab 1",
      lecturer: "Dr. Eng. Arthur Sanger, S.T., M.T.",
      className: "D4-TL-3A",
      semester: 3,
      room: "Lab Instalasi Listrik (Meja 1-4)",
      credits: 3,
      academicYear: "2025/2026 Ganjil",
      color: "blue"
    },
    {
      id: "sch_02",
      day: "Senin",
      dayEn: "Monday",
      startTime: "13:00",
      endTime: "16:30",
      courseCode: "TL-4205",
      courseName: "Praktikum PLC & Otomasi Industri",
      courseNameEn: "PLC & Industrial Automation Lab",
      lecturer: "Ir. Marson Budiman, M.T.",
      className: "D4-TL-5B",
      semester: 5,
      room: "Lab PLC & Otomasi (Meja 5-8)",
      credits: 3,
      academicYear: "2025/2026 Ganjil",
      color: "cyan"
    },
    {
      id: "sch_03",
      day: "Selasa",
      dayEn: "Tuesday",
      startTime: "08:00",
      endTime: "11:30",
      courseCode: "TL-4102",
      courseName: "Praktikum Rangkaian Listrik & Pengukuran",
      courseNameEn: "Electric Circuits & Measurement Lab",
      lecturer: "Stevy Walangitan, S.T., M.Eng.",
      className: "D4-TL-1A",
      semester: 1,
      room: "Lab Instalasi Listrik (Meja 1-8)",
      credits: 3,
      academicYear: "2025/2026 Ganjil",
      color: "emerald"
    },
    {
      id: "sch_04",
      day: "Selasa",
      dayEn: "Tuesday",
      startTime: "13:00",
      endTime: "16:30",
      courseCode: "TL-4308",
      courseName: "Praktikum Distribusi & Proteksi Tenaga Listrik",
      courseNameEn: "Power Distribution & Protection Lab",
      lecturer: "Olga E. Engel, S.T., M.T.",
      className: "D4-TL-5A",
      semester: 5,
      room: "Lab Instalasi & Panel MDP",
      credits: 3,
      academicYear: "2025/2026 Ganjil",
      color: "amber"
    },
    {
      id: "sch_05",
      day: "Rabu",
      dayEn: "Wednesday",
      startTime: "08:00",
      endTime: "12:00",
      courseCode: "TL-4401",
      courseName: "Praktikum Mesin-Mesin Listrik & Penggerak",
      courseNameEn: "Electrical Machines & Motor Drives Lab",
      lecturer: "Dr. Ventje Rumambi, S.T., M.T.",
      className: "D4-TL-3B",
      semester: 3,
      room: "Lab Mesin Listrik & Generator",
      credits: 4,
      academicYear: "2025/2026 Ganjil",
      color: "purple"
    },
    {
      id: "sch_06",
      day: "Rabu",
      dayEn: "Wednesday",
      startTime: "13:00",
      endTime: "16:30",
      courseCode: "TL-4502",
      courseName: "Praktikum Sistem SCADA & Smart Grid",
      courseNameEn: "SCADA & Smart Grid Systems Lab",
      lecturer: "Ir. Marson Budiman, M.T.",
      className: "D4-TL-7A",
      semester: 7,
      room: "Lab PLC & Otomasi",
      credits: 3,
      academicYear: "2025/2026 Ganjil",
      color: "cyan"
    },
    {
      id: "sch_07",
      day: "Kamis",
      dayEn: "Thursday",
      startTime: "08:00",
      endTime: "11:30",
      courseCode: "TL-4109",
      courseName: "Keselamatan & Kesehatan Kerja (K3) Listrik",
      courseNameEn: "Electrical Occupational Safety & Health (OSH)",
      lecturer: "Dra. Maryke Panambunan, M.Si.",
      className: "D4-TL-1B",
      semester: 1,
      room: "Lab Instalasi & Safety Station",
      credits: 2,
      academicYear: "2025/2026 Ganjil",
      color: "red"
    },
    {
      id: "sch_08",
      day: "Kamis",
      dayEn: "Thursday",
      startTime: "13:00",
      endTime: "16:30",
      courseCode: "TL-4601",
      courseName: "Praktikum Energi Baru Terbarukan (Solar PV)",
      courseNameEn: "Renewable Energy Lab (Solar PV & Wind)",
      lecturer: "Stevy Walangitan, S.T., M.Eng.",
      className: "D4-TL-7B",
      semester: 7,
      room: "Lab Energi Terbarukan & Atap Gedung",
      credits: 3,
      academicYear: "2025/2026 Ganjil",
      color: "yellow"
    },
    {
      id: "sch_09",
      day: "Jumat",
      dayEn: "Friday",
      startTime: "08:00",
      endTime: "11:00",
      courseCode: "TL-4700",
      courseName: "Asistensi & Uji Kompetensi Kelistrikan",
      courseNameEn: "Electrical Skills Certification & Mentoring",
      lecturer: "Tim Dosen & Teknisi D4 Listrik",
      className: "D4-TL-All",
      semester: 7,
      room: "Lab Instalasi Listrik",
      credits: 2,
      academicYear: "2025/2026 Ganjil",
      color: "indigo"
    }
  ],
  faculty: [
    {
      id: "fac_01",
      name: "Dr. Eng. Arthur Sanger, S.T., M.T.",
      title: "Ketua Jurusan Teknik Elektro / Dosen Ahli Sistem Tenaga",
      titleEn: "Head of Electrical Engineering Dept / Power Systems Specialist",
      nip: "19750812 200212 1 002",
      nidn: "0012087502",
      role: "Ketua Jurusan",
      roleEn: "Department Chair",
      email: "arthur.sanger@polimdo.ac.id",
      expertise: "Power System Stability, High Voltage Engineering, Smart Grid",
      expertiseId: "Stabilitas Sistem Tenaga, Teknik Tegangan Tinggi, Smart Grid",
      courses: ["Sistem Tenaga Listrik", "Teknik Tegangan Tinggi", "Proteksi Tenaga Listrik"],
      officeHours: "Senin & Rabu (10:00 - 12:00 WITA)",
      room: "Ruang Jurusan Elektro Lt. 2",
      photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"
    },
    {
      id: "fac_02",
      name: "Ir. Marson Budiman, M.T.",
      title: "Koordinator Program Studi D4 Teknik Listrik",
      titleEn: "Head of D4 Electrical Engineering Study Program",
      nip: "19680315 199503 1 001",
      nidn: "0015036801",
      role: "Koordinator Prodi",
      roleEn: "Program Coordinator",
      email: "marson.budiman@polimdo.ac.id",
      expertise: "Industrial Automation, Programmable Logic Controller (PLC), SCADA",
      expertiseId: "Otomasi Industri, PLC, SCADA, Kontrol Motor Listrik",
      courses: ["PLC & SCADA Industri", "Otomasi Kelistrikan", "Sistem Kontrol Modern"],
      officeHours: "Selasa & Kamis (09:00 - 11:30 WITA)",
      room: "Ruang Dosen D4 Lt. 1",
      photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80"
    },
    {
      id: "fac_03",
      name: "Stevy Walangitan, S.T., M.Eng.",
      title: "Kepala Laboratorium Instalasi & Pengukuran Listrik",
      titleEn: "Head of Electrical Installation & Measurement Laboratory",
      nip: "19820520 200812 1 003",
      nidn: "0020058203",
      role: "Kepala Laboratorium",
      roleEn: "Head of Laboratory",
      email: "stevy.walangitan@polimdo.ac.id",
      expertise: "Renewable Energy (Solar/Wind), Renewable Integration, Energy Auditing",
      expertiseId: "Energi Baru Terbarukan, Audit Energi Listrik, Instalasi Penerangan",
      courses: ["Energi Terbarukan", "Pengukuran Besaran Listrik", "Manajemen Energi"],
      officeHours: "Setiap Hari Kerja (08:00 - 16:00 WITA)",
      room: "Ruang Kepala Lab Lt. 1",
      photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80"
    },
    {
      id: "fac_04",
      name: "Olga E. Engel, S.T., M.T.",
      title: "Dosen Pengampu Instalasi & Distribusi Listrik",
      titleEn: "Lecturer of Electrical Installation & Distribution",
      nip: "19781104 200501 2 001",
      nidn: "0004117801",
      role: "Dosen Senior",
      roleEn: "Senior Lecturer",
      email: "olga.engel@polimdo.ac.id",
      expertise: "Building Electrical Installation, PUIL 2011 Standards, Transmission Lines",
      expertiseId: "Instalasi Gedung & Industri, Standarisasi PUIL 2011, Distribusi Daya",
      courses: ["Instalasi Listrik Industri", "Perancangan Instalasi Gedung Bertingkat"],
      officeHours: "Rabu & Jumat (09:00 - 11:00 WITA)",
      room: "Ruang Dosen Elektro",
      photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80"
    },
    {
      id: "fac_05",
      name: "Franky Mandey, S.ST",
      title: "Pranata Laboratorium Pendidikan (PLP) / Teknisi Ahli Lab Listrik",
      titleEn: "Educational Laboratory Technician / Senior Electrician",
      nip: "19850918 201012 1 004",
      nidn: "PLP-990812",
      role: "Pranata Lab / Teknisi",
      roleEn: "Lab Technician",
      email: "franky.mandey@polimdo.ac.id",
      expertise: "Electrical Maintenance, Equipment Calibration, K3 Safety Inspector",
      expertiseId: "Pemeliharaan Alat Ukur, Kalibrasi Instrumentasi, Inspektur K3 Lab",
      courses: ["Instruktur Praktikum", "Pelatihan Kalibrasi & Safety"],
      officeHours: "Senin - Jumat (07:30 - 16:30 WITA)",
      room: "Ruang Tool Crib & Teknisi Lab",
      photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80"
    }
  ],
  videos: [],
  announcements: [
    {
      id: "ann_01",
      title: "Uji Sertifikasi Kompetensi Ahli K3 Listrik BNSP 2026",
      titleEn: "BNSP Electrical Safety (K3) Expert Certification Exam 2026",
      priority: "high", // high, medium, normal
      category: "Sertifikasi",
      categoryEn: "Certification",
      date: "2026-08-25",
      content: "Pendaftaran uji sertifikasi kompetensi skema Pemasangan Instalasi Penerangan dan Ahli K3 Listrik dibuka untuk mahasiswa Semester 6 & 8. Kuota subsidi terbatas 50 peserta. Hubungi Kaprodi D4 Teknik Listrik.",
      contentEn: "Registration for BNSP Electrical Installation and K3 Certification is now open for Semesters 6 & 8 students. Subsidized quota limited to 50 participants. Contact D4 Program Coordinator.",
      badge: "PENTING / URGENT",
      isActive: true
    },
    {
      id: "ann_02",
      title: "Jadwal Ujian Tengah Semester (UTS) Praktikum Ganjil",
      titleEn: "Midterm Practicum Exam (UTS) Schedule - Odd Semester",
      priority: "high",
      category: "Akademik",
      categoryEn: "Academic",
      date: "2026-09-01",
      content: "Seluruh praktikan wajib menyelesaikan laporan sementara dan lembar asistensi minimal 80% sebelum mengikuti ujian praktikum. Dilarang membawa barang yang tidak berkepentingan ke ruang lab.",
      contentEn: "All students must complete temporary reports and lab worksheets at least 80% before taking practical exams. Unauthorized items in the lab are prohibited.",
      badge: "AKADEMIK",
      isActive: true
    },
    {
      id: "ann_03",
      title: "SOP Wajib: Pemakaian Alat Pelindung Diri (APD) di Area Lab",
      titleEn: "Mandatory SOP: Personal Protective Equipment (PPE) in Lab Area",
      priority: "medium",
      category: "K3 Lab",
      categoryEn: "Lab Safety",
      date: "2026-08-20",
      content: "Setiap mahasiswa dan asisten yang memasuki Lab Instalasi Tenaga WAJIB mengenakan Sepatu Safety (Safety Shoes), Jas Lab Katun Anti-Statik, dan tidak mengenakan perhiasan logam penghantar listrik.",
      contentEn: "Every student and assistant entering the Power Installation Lab MUST wear Safety Shoes, Anti-Static Cotton Lab Coats, and remove metallic conductive jewelry.",
      badge: "SAFETY K3",
      isActive: true
    },
    {
      id: "ann_04",
      title: "Workshop Industrial IoT & PLC Omron Bersama PT Schneider Electric",
      titleEn: "Industrial IoT & Omron PLC Workshop with PT Schneider Electric",
      priority: "normal",
      category: "Workshop",
      categoryEn: "Workshop",
      date: "2026-09-15",
      content: "Pusat Studi Otomasi POLIMDO mengadakan pelatihan hands-on PLC SCADA berbasis Cloud dengan sertifikat internasional. Tempat di Lab Otomasi D4.",
      contentEn: "POLIMDO Automation Study Center is holding hands-on Cloud-based PLC SCADA training with international certificates at the D4 Automation Lab.",
      badge: "EVENT",
      isActive: true
    }
  ],
  inventory: [
    {
      id: "inv_01",
      code: "TL-MM-001",
      name: "Digital Multimeter True-RMS Fluke 179",
      nameEn: "Fluke 179 True-RMS Digital Multimeter",
      category: "Alat Ukur / Measurement",
      categoryEn: "Measurement Tool",
      totalStock: 12,
      availableStock: 9,
      unit: "Unit",
      location: "Lemari A - Rak 1 (Alat Ukur Presisi)",
      status: "available", // available, low, maintenance
      specs: "AC/DC 1000V, 10A, Frekuensi, Kapasitansi, Suhu Thermocouple",
      image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=300&q=80"
    },
    {
      id: "inv_02",
      code: "TL-MEG-002",
      name: "Insulation Tester / Megger Kyoritsu 3005A",
      nameEn: "Kyoritsu 3005A Digital Insulation Tester (Megger)",
      category: "Alat Ukur / Measurement",
      categoryEn: "Measurement Tool",
      totalStock: 6,
      availableStock: 5,
      unit: "Unit",
      location: "Lemari A - Rak 2",
      status: "available",
      specs: "Tegangan uji 250V / 500V / 1000V, Rentang isolasi hingga 2000MΩ, Continuity test 200mA",
      image: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=300&q=80"
    },
    {
      id: "inv_03",
      code: "TL-EARTH-003",
      name: "Earth Resistance Tester Kyoritsu 4105A",
      nameEn: "Kyoritsu 4105A Earth Resistance Grounding Tester",
      category: "Alat Ukur / Measurement",
      categoryEn: "Measurement Tool",
      totalStock: 5,
      availableStock: 3,
      unit: "Set",
      location: "Lemari A - Rak 3",
      status: "available",
      specs: "Pengujian pentanahan 20Ω / 200Ω / 2000Ω dengan kabel uji 20m/10m/5m dan batang grounding bantu",
      image: "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=300&q=80"
    },
    {
      id: "inv_04",
      code: "TL-CLAMP-004",
      name: "Digital AC/DC Clamp Meter Hioki 3280-10F",
      nameEn: "Hioki 3280-10F Digital AC/DC Clamp Meter",
      category: "Alat Ukur / Measurement",
      categoryEn: "Measurement Tool",
      totalStock: 10,
      availableStock: 8,
      unit: "Unit",
      location: "Lemari A - Rak 1",
      status: "available",
      specs: "Arus AC hingga 1000A, Drop-proof 1 meter, Rentang suhu -25°C s.d 65°C",
      image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=300&q=80"
    },
    {
      id: "inv_05",
      code: "TL-OSC-005",
      name: "Digital Storage Oscilloscope Rigol DS1054Z 50MHz 4-CH",
      nameEn: "Rigol DS1054Z 50MHz 4-Channel Digital Oscilloscope",
      category: "Instrumentasi / Electronic Bench",
      categoryEn: "Instrumentation",
      totalStock: 8,
      availableStock: 6,
      unit: "Unit",
      location: "Meja Praktikum 5-8 (Otomasi)",
      status: "available",
      specs: "4 Channel, 50MHz Bandwidth, 1GSa/s Real-time sample rate, 24Mpts memory depth",
      image: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=300&q=80"
    },
    {
      id: "inv_06",
      code: "TL-PLC-006",
      name: "PLC Trainer Kit Omron CP1E-N30DR-A + HMI NB5Q",
      nameEn: "Omron CP1E-N30DR-A PLC Trainer Kit with HMI Touchscreen",
      category: "Modul Trainer / Automation",
      categoryEn: "Trainer Module",
      totalStock: 8,
      availableStock: 7,
      unit: "Set",
      location: "Meja Praktikum 1-4 (Otomasi)",
      status: "available",
      specs: "18 Digital Input, 12 Relay Output, RS-232/USB, Panel simulasi lampu & motor stepper",
      image: "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?auto=format&fit=crop&w=300&q=80"
    },
    {
      id: "inv_07",
      code: "TL-VAR-007",
      name: "Variable 3-Phase AC/DC Power Supply Variac 0-450V",
      nameEn: "Variable 3-Phase AC/DC Variac Power Source 0-450V",
      category: "Catu Daya / Power Supply",
      categoryEn: "Power Supply",
      totalStock: 4,
      availableStock: 4,
      unit: "Unit",
      location: "Meja Mesin Listrik",
      status: "available",
      specs: "Input 380V 3-Phase, Output 0-450V Variable, Proteksi Overcurrent & Emergency Trip",
      image: "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=300&q=80"
    },
    {
      id: "inv_08",
      code: "TL-APD-008",
      name: "Set APD Kelistrikan Tegangan Menengah 1000V (Sarung Tangan + Helm)",
      nameEn: "1000V Electrical PPE Safety Set (Dielectric Gloves + Visor Helmet)",
      category: "K3 / Safety Equipment",
      categoryEn: "Safety Equipment",
      totalStock: 15,
      availableStock: 12,
      unit: "Set",
      location: "Safety Station - Lemari K3",
      status: "available",
      specs: "Sarung tangan isolasi Kelas 0 (1000V AC IEC 60903), Helm insulasi dengan pelindung arc flash",
      image: "https://images.unsplash.com/photo-1508873696983-2df5293cb32b?auto=format&fit=crop&w=300&q=80"
    }
  ],
  bookings: [
    {
      id: "bk_001",
      itemId: "inv_01",
      itemName: "Digital Multimeter True-RMS Fluke 179",
      borrowerName: "Christian Rumagit",
      nim: "22023045",
      className: "D4-TL-5A",
      quantity: 2,
      borrowDate: "2026-08-19",
      returnDate: "2026-08-19",
      purpose: "Praktikum Pengukuran Beban Panel MDP",
      status: "approved", // pending, approved, returned, rejected
      approvedBy: "Franky Mandey, S.ST",
      notes: "Dipinjam untuk Meja 3, kondisi baik dan terkalibrasi."
    },
    {
      id: "bk_002",
      itemId: "inv_06",
      itemName: "PLC Trainer Kit Omron CP1E-N30DR-A + HMI NB5Q",
      borrowerName: "Gabriella Wenas",
      nim: "21023012",
      className: "D4-TL-7A",
      quantity: 1,
      borrowDate: "2026-08-19",
      returnDate: "2026-08-20",
      purpose: "Uji Coba Tugas Akhir Sistem Sortir Barang Otomatis",
      status: "approved",
      approvedBy: "Franky Mandey, S.ST",
      notes: "Digunakan di Lab Otomasi Meja 6."
    },
    {
      id: "bk_003",
      itemId: "inv_03",
      itemId2: "TL-EARTH-003",
      itemName: "Earth Resistance Tester Kyoritsu 4105A",
      borrowerName: "Aldo Mandagi",
      nim: "23023088",
      className: "D4-TL-3B",
      quantity: 1,
      borrowDate: "2026-08-20",
      returnDate: "2026-08-20",
      purpose: "Pengukuran Tahanan Pentanahan Grounding Gedung Elektro",
      status: "pending",
      approvedBy: "-",
      notes: "Menunggu persetujuan Kepala Lab."
    }
  ],
  labZones: [
    {
      id: "zone_01",
      code: "M1",
      name: "Meja Praktikum 1 (Instalasi Penerangan)",
      nameEn: "Workstation 1 (Lighting Installation)",
      type: "workbench",
      status: "occupied", // available, occupied, maintenance
      currentClass: "D4-TL-3A (Praktikum Instalasi Tenaga 1)",
      capacity: "4 Mahasiswa",
      equipment: ["Panel Uji Penerangan", "MCB 1 Phase", "Sakelar Ganda/Tunggal", "Fitting & Lampu LED"],
      safetyLevel: "220V AC Standard Safety",
      coords: { x: 80, y: 120, w: 120, h: 80 }
    },
    {
      id: "zone_02",
      code: "M2",
      name: "Meja Praktikum 2 (Instalasi Penerangan)",
      nameEn: "Workstation 2 (Lighting Installation)",
      type: "workbench",
      status: "occupied",
      currentClass: "D4-TL-3A (Praktikum Instalasi Tenaga 1)",
      capacity: "4 Mahasiswa",
      equipment: ["Panel Uji Penerangan", "Sakelar Tukar/Hotel", "Stop Kontak"],
      safetyLevel: "220V AC Standard Safety",
      coords: { x: 230, y: 120, w: 120, h: 80 }
    },
    {
      id: "zone_03",
      code: "M3",
      name: "Meja Praktikum 3 (Instalasi Tenaga & Motor)",
      nameEn: "Workstation 3 (Power & Motor Control)",
      type: "workbench",
      status: "occupied",
      currentClass: "D4-TL-3A (Praktikum Instalasi Tenaga 1)",
      capacity: "4 Mahasiswa",
      equipment: ["Kontaktor Magnet Schneider", "Thermal Overload Relay (TOR)", "Timer Delay Relay (TDR)", "Push Button Station"],
      safetyLevel: "380V 3-Phase AC High Voltage",
      coords: { x: 380, y: 120, w: 120, h: 80 }
    },
    {
      id: "zone_04",
      code: "M4",
      name: "Meja Praktikum 4 (Instalasi Tenaga & Motor)",
      nameEn: "Workstation 4 (Power & Motor Control)",
      type: "workbench",
      status: "available",
      currentClass: "Tersedia untuk Sesi Berikutnya",
      capacity: "4 Mahasiswa",
      equipment: ["Rangkaian Bintang-Segitiga (Star-Delta Starter)", "Forward-Reverse Panel"],
      safetyLevel: "380V 3-Phase AC High Voltage",
      coords: { x: 530, y: 120, w: 120, h: 80 }
    },
    {
      id: "zone_05",
      code: "M5",
      name: "Meja Praktikum 5 (PLC & Otomasi Industri)",
      nameEn: "Workstation 5 (PLC & Automation)",
      type: "workbench",
      status: "available",
      currentClass: "Kosong (Jadwal Siang D4-TL-5B)",
      capacity: "4 Mahasiswa",
      equipment: ["Omron CP1E Trainer", "Sensor Proximity Induktif/Kapasitif", "Pneumatic Solenoid Valve"],
      safetyLevel: "24V DC Low Voltage Automation",
      coords: { x: 80, y: 240, w: 120, h: 80 }
    },
    {
      id: "zone_06",
      code: "M6",
      name: "Meja Praktikum 6 (PLC & Otomasi Industri)",
      nameEn: "Workstation 6 (PLC & Automation)",
      type: "workbench",
      status: "available",
      currentClass: "Kosong (Jadwal Siang D4-TL-5B)",
      capacity: "4 Mahasiswa",
      equipment: ["Siemens S7-1200 Trainer", "Inverter Motor VFD ATV12", "HMI Touchscreen"],
      safetyLevel: "24V DC / 220V VFD Inverter",
      coords: { x: 230, y: 240, w: 120, h: 80 }
    },
    {
      id: "zone_07",
      code: "M7",
      name: "Meja Praktikum 7 (Instrumentasi & Kalibrasi)",
      nameEn: "Workstation 7 (Instrumentation & Calibration)",
      type: "workbench",
      status: "available",
      currentClass: "Tersedia untuk Praktikum / TA",
      capacity: "4 Mahasiswa",
      equipment: ["Rigol Digital Oscilloscope", "Process Calibrator 4-20mA", "Regulated Dual Power Supply"],
      safetyLevel: "Instrument Bench Low Voltage",
      coords: { x: 380, y: 240, w: 120, h: 80 }
    },
    {
      id: "zone_08",
      code: "M8",
      name: "Meja Praktikum 8 (Energi Terbarukan Solar PV)",
      nameEn: "Workstation 8 (Renewable Energy Solar PV)",
      type: "workbench",
      status: "available",
      currentClass: "Tersedia untuk Riset & TA",
      capacity: "4 Mahasiswa",
      equipment: ["Solar Charge Controller MPPT", "Pure Sine Wave Inverter 1000W", "Battery Management System (BMS)", "Solar Simulator Light"],
      safetyLevel: "DC 48V / 220V AC Inverter Safety",
      coords: { x: 530, y: 240, w: 120, h: 80 }
    },
    {
      id: "zone_mdp",
      code: "MDP",
      name: "Main Distribution Panel (Panel Distribusi Utama)",
      nameEn: "Main Distribution Panel (MDP)",
      type: "panel",
      status: "active",
      currentClass: "Aktif Melayani Catu Daya 380V/220V Lab",
      capacity: "Suplai Daya 50 kVA",
      equipment: ["MCCB Utama 100A", "Surge Arrester OBO", "Digital Power Quality Meter", "Busbar Tembaga 3-Phase+N+PE"],
      safetyLevel: "PERINGATAN TEGANGAN TINGGI 380V - HANYA PETUGAS BERWENANG",
      coords: { x: 700, y: 60, w: 140, h: 100 }
    },
    {
      id: "zone_sdp",
      code: "SDP",
      name: "Sub Distribution Panel (SDP Bangku Lab)",
      nameEn: "Sub Distribution Panel (SDP)",
      type: "panel",
      status: "active",
      currentClass: "Suplai Proteksi ELCB & MCB per Meja",
      capacity: "30 kVA",
      equipment: ["ELCB 30mA Anti-Kontak", "MCB Grup Meja 1-8", "Voltmeter & Ammeter Analog"],
      safetyLevel: "Proteksi Residual Arus (RCCB 30mA)",
      coords: { x: 700, y: 180, w: 140, h: 90 }
    },
    {
      id: "zone_toolcrib",
      code: "TOOLS",
      name: "Ruang Tool Crib & Gudang Instrumen Presisi",
      nameEn: "Tool Crib & Precision Instrument Storage",
      type: "storage",
      status: "active",
      currentClass: "Penjaga: Franky Mandey, S.ST",
      capacity: "100+ Peralatan Ukur & Perkakas",
      equipment: ["Lemari Alat Ukur A/B/C", "Rak Kabel Jumper & Probe", "Meja Asistensi & Peminjaman"],
      safetyLevel: "Peminjaman Wajib Kartu Mahasiswa / Form",
      coords: { x: 80, y: 360, w: 270, h: 90 }
    },
    {
      id: "zone_safety",
      code: "K3",
      name: "Safety Station K3 (APAR, Eye Wash, P3K & E-Stop)",
      nameEn: "OSH Safety Station (Fire Extinguisher, Eye Wash, First Aid & Master E-Stop)",
      type: "safety",
      status: "active",
      currentClass: "Siaga Darurat 24/7",
      capacity: "Emergency Response Hub",
      equipment: ["APAR CO2 5kg (Listrik)", "APAR Dry Chemical Powder 6kg", "Kotak P3K Lengkap", "Tombol Master Emergency Shutdown"],
      safetyLevel: "EVAKUASI & DARURAT",
      coords: { x: 380, y: 360, w: 270, h: 90 }
    },
    {
      id: "zone_lecturer",
      code: "OFFICE",
      name: "Meja Dosen & Instruktur Laboratorium",
      nameEn: "Lecturer & Lab Instructor Desk",
      type: "office",
      status: "active",
      currentClass: "Dr. Eng. Arthur Sanger / Stevy Walangitan",
      capacity: "4 Staf Dosen",
      equipment: ["PC Workstation Monitoring Lab", "Printer Sertifikat & Laporan", "CCTV Monitor"],
      safetyLevel: "Zona Pengawasan",
      coords: { x: 700, y: 290, w: 140, h: 160 }
    }
  ]
};

// Persistent JSON Store Helpers
export function getDb() {
  if (!fs.existsSync(DATA_FILE)) {
    saveDb(initialSeedData);
    return initialSeedData;
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const data = JSON.parse(raw);
    return data;
  } catch (err) {
    console.error('Error reading data store, resetting to initial seed:', err);
    saveDb(initialSeedData);
    return initialSeedData;
  }
}

export function saveDb(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error saving data store:', err);
    return false;
  }
}
