import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext.jsx";
import { getApiUrl } from "../lib/api.js";
import { supabase } from "../lib/supabaseClient.js";
import { saveLocalVideoBlob, getLocalVideoBlobUrl, deleteLocalVideoBlob, getAllLocalVideoRecords, parseDurationSeconds, extractYouTubeId } from "../utils/videoStorage.js";

export const DEFAULT_LAB_ZONES = [
  {
    id: "zone_digital",
    code: "LAB-01",
    name: "Laboratorium Digital & Mikroprosessor",
    nameEn: "Digital & Microprocessor Laboratory",
    type: "laboratory",
    status: "occupied",
    currentClass: "D4-TL-3A (Praktikum Rangkaian Digital & Mikro)",
    capacity: "24 Mahasiswa / 6 Kelompok",
    equipment: [
      "Trainer Kit Mikroprosesor 8086 & STM32 ARM Cortex",
      "Arduino Mega 2560 & ESP32 IoT Development Boards",
      "Digital Logic Analyzer 16-Channel 100MHz USB",
      "Catu Daya Digital DC Terisolasi 0-30V / 5A"
    ],
    safetyLevel: "5V - 12V DC Digital Safe Voltage Standard",
    color: "#EF4444",
    accentColor: "red",
    coords: { x: 15, y: 15, w: 185, h: 310 }
  },
  {
    id: "zone_otomasi",
    code: "LAB-02",
    name: "Laboratorium Otomasi",
    nameEn: "Industrial Automation Laboratory",
    type: "laboratory",
    status: "available",
    currentClass: "Tersedia (Sesi Siang: D4-TL-7A SCADA & Smart Grid)",
    capacity: "24 Mahasiswa / 6 Kelompok",
    equipment: [
      "SCADA Wonderware InTouch Workstation System",
      "DCS Industrial Controller Trainer Module",
      "Modbus TCP/IP & RTU Telemetry Industrial Gateway",
      "Power Quality Analyzer Fluke 435 Series II"
    ],
    safetyLevel: "24V DC Industrial Automation Standard",
    color: "#FACC15",
    accentColor: "yellow",
    coords: { x: 210, y: 15, w: 220, h: 310 }
  },
  {
    id: "zone_bengkel",
    code: "BENGKEL",
    name: "Bengkel Listrik",
    nameEn: "Electrical Workshop & Panel Fabrication",
    type: "workshop",
    status: "occupied",
    currentClass: "D4-TL-5A (Fabrikasi Panel MDP & Wiring Listrik)",
    capacity: "32 Mahasiswa / 8 Kelompok",
    equipment: [
      "Mesin Bending & Pemotong Busbar Cu Hidrolik",
      "Hydraulic Crimping Tool 16-400mm² & Cable Lug Set",
      "Meja Kerja Pelat & Perakitan Panel MDP/SDP",
      "Bor Duduk Industri Heavy Duty & Gerinda"
    ],
    safetyLevel: "Wajib APD Lengkap: Safety Shoes, Kacamata, Helm K3",
    color: "#4F75FF",
    accentColor: "blue",
    coords: { x: 440, y: 15, w: 545, h: 425 }
  },
  {
    id: "zone_instalasi",
    code: "LAB-03",
    name: "Laboratorium Instalasi Listrik",
    nameEn: "Electrical Power Installation Laboratory",
    type: "laboratory",
    status: "occupied",
    currentClass: "D4-TL-3A (Praktikum Instalasi Tenaga 1)",
    capacity: "30 Mahasiswa / 8 Meja Praktikum",
    equipment: [
      "Panel Uji Instalasi Penerangan & Gedung Bertingkat",
      "Panel Kontrol Motor 3-Phasa Forward-Reverse & Star-Delta",
      "Megger Digital Insulation Tester 1000V MIT420",
      "Earth Ground Resistance Tester Kyoritsu 4105A"
    ],
    safetyLevel: "220V / 380V AC Standard Installation Safety",
    color: "#F1F5F9",
    accentColor: "slate",
    coords: { x: 15, y: 335, w: 415, h: 105 }
  },
  {
    id: "zone_pengukuran",
    code: "LAB-04",
    name: "Laboratorium Pengukuran & Elektronika Dasar",
    nameEn: "Measurement & Basic Electronics Laboratory",
    type: "laboratory",
    status: "available",
    currentClass: "Tersedia (Sesi Berikutnya: D4-TL-1A)",
    capacity: "24 Mahasiswa / 6 Kelompok",
    equipment: [
      "Rigol DS1102Z-E Digital Storage Oscilloscope 100MHz",
      "Function Generator DDS Audio/RF 25MHz",
      "Digital Precision Multimeter Sanwa CD800a",
      "LCR Meter & Dekade Resistor/Kapasitor Presisi"
    ],
    safetyLevel: "Electronic Instrument Bench Low Voltage Standard",
    color: "#06B6D4",
    accentColor: "cyan",
    coords: { x: 15, y: 450, w: 215, h: 235 }
  },
  {
    id: "zone_plc",
    code: "LAB-05",
    name: "Laboratorium Otomasi & PLC",
    nameEn: "Automation & PLC Laboratory",
    type: "laboratory",
    status: "occupied",
    currentClass: "D4-TL-5B (Praktikum PLC & Otomasi Industri)",
    capacity: "24 Mahasiswa / 6 Kelompok",
    equipment: [
      "Omron CP1E-N40DR & CJ2M PLC Trainer Kit",
      "Siemens SIMATIC S7-1200 CPU 1214C DC/DC/DC",
      "Festo Pneumatic & Electro-Pneumatic Actuator Kit",
      "Delta HMI Touchscreen Panel 7 Inch & Inverter VFD"
    ],
    safetyLevel: "24V DC / Pneumatic 6 Bar Working Pressure",
    color: "#F97316",
    accentColor: "orange",
    coords: { x: 240, y: 450, w: 275, h: 235 }
  },
  {
    id: "zone_dosen",
    code: "RUANG-DOSEN",
    name: "Ruangan Dosen",
    nameEn: "Faculty & Lecturer Office",
    type: "office",
    status: "available",
    currentClass: "Jam Konsultasi & Asistensi: 09:00 - 15:00 WITA",
    capacity: "10 Dosen & Instruktur Laboratorium",
    equipment: [
      "Workstation Komputer Dosen & Sistem Akademik",
      "Arsip Kurikulum, Silabus & Sertifikasi BNSP",
      "Pusat Asistensi Laporan Praktikum & Ujian Komprehensif",
      "Meja Diskusi Bimbingan Tugas Akhir (TA)"
    ],
    safetyLevel: "Office Environment / Non-Hazardous Area",
    color: "#84CC16",
    accentColor: "lime",
    coords: { x: 625, y: 495, w: 155, h: 190 }
  },
  {
    id: "zone_ujicoba",
    code: "RUANG-UJI",
    name: "Ruangan Uji Coba",
    nameEn: "High Voltage & Certification Testing Room",
    type: "testing",
    status: "available",
    currentClass: "Uji Kompetensi BNSP & Uji Laik Operasi (PLO)",
    capacity: "12 Mahasiswa / Peserta Uji Sertifikasi",
    equipment: [
      "High Voltage Test Transformer 50kV AC/DC Hipot",
      "Relay Proteksi OCR/GFR Test Set Sverker 760",
      "Kamera Thermal Imaging Fluke Ti401 Pro",
      "Alat Uji Tegangan Tembus Minyak Trafo Otomatis"
    ],
    safetyLevel: "High Voltage Hazard: Wajib Izin Instruktur & SOP Khusus",
    color: "#1D4ED8",
    accentColor: "blue",
    coords: { x: 790, y: 450, w: 195, h: 235 }
  }
];

export const DEFAULT_ANNOUNCEMENTS = [
  {
    id: "ann_01",
    title: "Uji Sertifikasi Kompetensi Ahli K3 Listrik & Otomasi BNSP 2026",
    titleEn: "BNSP Electrical Safety (K3) & Automation Certification Exam 2026",
    priority: "high",
    category: "Sertifikasi",
    categoryEn: "Certification",
    date: "2026-08-25",
    content: "Pendaftaran uji sertifikasi kompetensi skema Pemasangan Instalasi Penerangan dan Ahli K3 Listrik dibuka untuk mahasiswa Semester 6 & 8. Kuota subsidi terbatas 50 peserta. Hubungi Kaprodi D4 Teknik Listrik.",
    contentEn: "Registration for BNSP Electrical Installation and K3 Certification is now open for Semesters 6 & 8 students. Subsidized quota limited to 50 participants. Contact D4 Program Coordinator.",
    badge: "PENTING / URGENT",
    isActive: true,
    active: true
  },
  {
    id: "ann_02",
    title: "Jadwal Pelaksanaan Ujian Praktikum & Asistensi Laporan Semester Ganjil",
    titleEn: "Midterm Practicum Exam & Lab Report Assistance Schedule",
    priority: "high",
    category: "Akademik",
    categoryEn: "Academic",
    date: "2026-09-01",
    content: "Seluruh praktikan wajib menyelesaikan laporan sementara dan lembar asistensi minimal 80% sebelum mengikuti ujian praktikum. Dilarang membawa barang yang tidak berkepentingan ke ruang lab.",
    contentEn: "All students must complete temporary reports and lab worksheets at least 80% before taking practical exams. Unauthorized items in the lab are prohibited.",
    badge: "AKADEMIK",
    isActive: true,
    active: true
  },
  {
    id: "ann_03",
    title: "SOP Wajib: Pemakaian Alat Pelindung Diri (APD) di Area Lab & Bengkel",
    titleEn: "Mandatory SOP: Personal Protective Equipment (PPE) in Lab Area",
    priority: "medium",
    category: "K3 Lab",
    categoryEn: "Lab Safety",
    date: "2026-08-20",
    content: "Setiap mahasiswa dan asisten yang memasuki Lab Instalasi Tenaga dan Bengkel Fabrikasi WAJIB mengenakan Sepatu Safety (Safety Shoes), Jas Lab Katun Anti-Statik, dan kacamata pelindung.",
    contentEn: "Every student and assistant entering the Power Installation Lab and Workshop MUST wear Safety Shoes, Anti-Static Cotton Lab Coats, and protective glasses.",
    badge: "SAFETY K3",
    isActive: true,
    active: true
  },
  {
    id: "ann_04",
    title: "Workshop Industrial IoT, SCADA & PLC Bersama Industri Mitra POLIMDO",
    titleEn: "Industrial IoT, SCADA & PLC Workshop with Industry Partners",
    priority: "normal",
    category: "Workshop",
    categoryEn: "Workshop",
    date: "2026-09-15",
    content: "Pusat Studi Otomasi POLIMDO mengadakan pelatihan hands-on PLC SCADA berbasis Cloud dengan sertifikat internasional. Tempat di Lab Otomasi & PLC.",
    contentEn: "POLIMDO Automation Study Center is holding hands-on Cloud-based PLC SCADA training with international certificates at the Automation & PLC Lab.",
    badge: "EVENT",
    isActive: true,
    active: true
  }
];

export const DEFAULT_SCHEDULES = [
  {
    id: "sch_01",
    day: "Senin",
    dayEn: "Monday",
    startTime: "07:45",
    endTime: "10:00",
    courseCode: "TL-4101",
    courseName: "Praktikum Instalasi Tenaga Listrik 1",
    courseNameEn: "Electrical Power Installation Lab 1",
    lecturer: "Dr. Eng. Arthur Sanger, S.T., M.T.",
    className: "D4-TL-3A",
    semester: 3,
    room: "Lab Instalasi Listrik (Meja 1-4)",
    credits: 3,
    topic: "Pengawatan Sirkit Daya & Hubungan Instalasi Penerangan",
    upcomingTask: "Laporan Asistensi Modul 2",
    academicYear: "2025/2026 Ganjil",
    color: "blue"
  },
  {
    id: "sch_02",
    day: "Selasa",
    dayEn: "Tuesday",
    startTime: "07:45",
    endTime: "09:45",
    courseCode: "TL-4205",
    courseName: "Praktikum PLC & Otomasi Industri",
    courseNameEn: "PLC & Industrial Automation Lab",
    lecturer: "Ir. Marson Budiman, M.T.",
    className: "D4-TL-5B",
    semester: 5,
    room: "Lab PLC & Otomasi (Meja 5-8)",
    credits: 3,
    topic: "Pemrograman Ladder Diagram Timer & Counter Omron CP1E",
    upcomingTask: "Simulasi CX-Programmer",
    academicYear: "2025/2026 Ganjil",
    color: "cyan"
  },
  {
    id: "sch_03",
    day: "Selasa",
    dayEn: "Tuesday",
    startTime: "10:00",
    endTime: "12:30",
    courseCode: "TL-4205",
    courseName: "Praktikum PLC & Otomasi Industri",
    courseNameEn: "PLC & Industrial Automation Lab",
    lecturer: "Ir. Marson Budiman, M.T.",
    className: "D4-TL-5B",
    semester: 5,
    room: "Lab PLC & Otomasi (Meja 5-8)",
    credits: 3,
    topic: "Integrasi HMI Touchscreen NB5Q dengan SCADA InTouch",
    upcomingTask: "Desain GUI HMI",
    academicYear: "2025/2026 Ganjil",
    color: "emerald"
  },
  {
    id: "sch_04",
    day: "Rabu",
    dayEn: "Wednesday",
    startTime: "07:45",
    endTime: "11:30",
    courseCode: "TL-4401",
    courseName: "Praktikum Mesin-Mesin Listrik & Penggerak",
    courseNameEn: "Electrical Machines & Motor Drives Lab",
    lecturer: "Dr. Eng. Arthur Sanger, S.T., M.T.",
    className: "D4-TL-3A",
    semester: 3,
    room: "Lab Mesin Listrik & Generator",
    credits: 3,
    topic: "Uji Karakteristik Motor Induksi 3-Fasa Hubungan Bintang-Segitiga",
    upcomingTask: "Perhitungan Efisiensi Mesin",
    academicYear: "2025/2026 Ganjil",
    color: "amber"
  },
  {
    id: "sch_05",
    day: "Kamis",
    dayEn: "Thursday",
    startTime: "07:45",
    endTime: "09:45",
    courseCode: "TL-4205",
    courseName: "Praktikum Rangkaian Listrik & Pengukuran",
    courseNameEn: "Electric Circuits & Measurement Lab",
    lecturer: "Stevy Walangitan, S.T., M.Eng.",
    className: "D4-TL-5B",
    semester: 7,
    room: "Lab Instalasi Listrik (Meja 1-8)",
    credits: 4,
    topic: "Analisis Harmonisa & Faktor Daya Sistem 3-Fasa Fluke 435",
    upcomingTask: "Plot Osiloskop FFT",
    academicYear: "2025/2026 Ganjil",
    color: "purple"
  },
  {
    id: "sch_06",
    day: "Kamis",
    dayEn: "Thursday",
    startTime: "10:00",
    endTime: "13:00",
    courseCode: "TL-4205",
    courseName: "Praktikum Rangkaian Listrik & Pengukuran",
    courseNameEn: "Electric Circuits & Measurement Lab",
    lecturer: "Stevy Walangitan, S.T., M.Eng.",
    className: "D4-TL-1A",
    semester: 1,
    room: "Lab Instalasi Listrik (Meja 1-8)",
    credits: 3,
    topic: "Pengukuran Tegangan DC/AC & Hukum Ohm Menggunakan Multimeter Sanwa",
    upcomingTask: "Tugas Pendahuluan Modul 3",
    academicYear: "2025/2026 Ganjil",
    color: "red"
  },
  {
    id: "sch_07",
    day: "Jumat",
    dayEn: "Friday",
    startTime: "07:45",
    endTime: "12:00",
    courseCode: "TL-4102",
    courseName: "Praktikum Mesin-Mesin Listrik & Penggerak",
    courseNameEn: "Electrical Machines & Motor Drives Lab",
    lecturer: "Dr. Ventje Rumambi, S.T., M.T.",
    className: "D4-TL-1A",
    semester: 1,
    room: "Lab Mesin Listrik & Generator",
    credits: 3,
    topic: "Pengujian Generator Sinkron Tanpa Beban & Berbeban",
    upcomingTask: "Kurva Eksitasi Generator",
    academicYear: "2025/2026 Ganjil",
    color: "yellow"
  }
];

export const DEFAULT_FACULTY = [
  {
    id: "fac_01",
    name: "Marson James Budiman, S.ST., M.T.",
    title: "KETUA JURUSAN TEKNIK ELEKTRO",
    titleEn: "Head of Electrical Engineering Department",
    nip: "197405121999031002",
    nidn: "0012057401",
    role: "Dosen & Ketua Jurusan",
    roleEn: "Department Head & Senior Lecturer",
    email: "marson.budiman@polimdo.ac.id",
    expertise: "Sistem Kendali & Otomasi Industri / PLC",
    expertiseEn: "Control Systems & Industrial Automation",
    room: "Ruang Jurusan Elektro",
    phone: "+62 812-4456-7890",
    photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
    bio: "Dosen senior bidang Sistem Kontrol dan Otomasi Industri dengan pengalaman lebih dari 20 tahun di Politeknik Negeri Manado."
  },
  {
    id: "fac_02",
    name: "Maksy Sandiang, S.ST., M.I.T.",
    title: "SEKRETARIS JURUSAN TEKNIK ELEKTRO",
    titleEn: "Secretary of Electrical Engineering Department",
    nip: "197808202003121001",
    nidn: "0020087802",
    role: "Dosen & Sekretaris Jurusan",
    roleEn: "Department Secretary & Lecturer",
    email: "maksy.sandiang@polimdo.ac.id",
    expertise: "Teknologi Informasi & Smart Grid",
    expertiseEn: "Information Technology & Smart Grid",
    room: "Ruang Jurusan Elektro",
    phone: "+62 813-5678-9012",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
    bio: "Pengampu mata kuliah integrasi IoT kelistrikan dan sistem jaringan monitoring energi."
  },
  {
    id: "fac_03",
    name: "Donald Bastian Noya, S.ST., M.T.",
    title: "KOORDINATOR PROGRAM STUDI D-IV TEKNIK LISTRIK",
    titleEn: "Head of D4 Electrical Power Engineering Study Program",
    nip: "198002142005011003",
    nidn: "0014028003",
    role: "Koordinator Prodi D4",
    roleEn: "Study Program Coordinator",
    email: "donald.noya@polimdo.ac.id",
    expertise: "Sistem Tenaga Listrik & Proteksi Gardu Induk",
    expertiseEn: "Power Systems & Substation Protection",
    room: "Ruang Kaprodi D4",
    phone: "+62 811-4321-9876",
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
    bio: "Spesialis analisis kestabilan sistem tenaga listrik, koordinasi relay proteksi, dan audit energi industri."
  },
  {
    id: "fac_04",
    name: "Dr. Eng. Arthur Sanger, S.T., M.T.",
    title: "DOSEN PENGAMPU / KEPALA LABORATORIUM LISTRIK",
    titleEn: "Head of Electrical Lab & Senior Lecturer",
    nip: "197509182001121002",
    nidn: "0018097501",
    role: "Kepala Laboratorium",
    roleEn: "Head of Electrical Lab",
    email: "arthur.sanger@polimdo.ac.id",
    expertise: "Instalasi Tenaga Listrik, K3 & Energi Terbarukan",
    expertiseEn: "Power Installation, Safety (K3) & Renewable Energy",
    room: "Ruangan Dosen Lab Elektro",
    phone: "+62 821-9012-3456",
    photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80",
    bio: "Asesor kompetensi BNSP bidang Ketenagalistrikan dan instruktur utama praktikum instalasi tegangan menengah."
  }
];

export const DEFAULT_INVENTORY = [
  {
    id: "inv_01",
    code: "TL-MM-001",
    name: "Digital Multimeter True-RMS Fluke 179",
    nameEn: "Fluke 179 True-RMS Digital Multimeter",
    category: "Alat Ukur / Measurement",
    categoryEn: "Measurement Tool",
    totalQty: 12,
    availableQty: 9,
    borrowedQty: 3,
    maintenanceQty: 0,
    unit: "Unit",
    location: "Lemari A - Rak 1 (Alat Ukur Presisi)",
    condition: "Baik",
    safetyRating: "CAT IV 600V / CAT III 1000V",
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
    totalQty: 6,
    availableQty: 5,
    borrowedQty: 1,
    maintenanceQty: 0,
    unit: "Unit",
    location: "Lemari A - Rak 2",
    condition: "Baik",
    safetyRating: "CAT III 600V",
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
    totalQty: 5,
    availableQty: 3,
    borrowedQty: 2,
    maintenanceQty: 0,
    unit: "Set",
    location: "Lemari A - Rak 3",
    condition: "Baik",
    safetyRating: "CAT III 300V IEC 61010-1",
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
    totalQty: 10,
    availableQty: 8,
    borrowedQty: 2,
    maintenanceQty: 0,
    unit: "Unit",
    location: "Lemari A - Rak 1",
    condition: "Baik",
    safetyRating: "CAT IV 300V / CAT III 600V",
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
    totalQty: 8,
    availableQty: 6,
    borrowedQty: 2,
    maintenanceQty: 0,
    unit: "Unit",
    location: "Meja Praktikum 5-8 (Otomasi)",
    condition: "Baik",
    safetyRating: "CAT II 300V",
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
    totalQty: 8,
    availableQty: 7,
    borrowedQty: 1,
    maintenanceQty: 0,
    unit: "Set",
    location: "Meja Praktikum 1-4 (Otomasi)",
    condition: "Baik",
    safetyRating: "24V DC Industrial Safe Standard",
    specs: "18 Digital Input, 12 Relay Output, RS-232/USB, Panel simulasi lampu & motor stepper",
    image: "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?auto=format&fit=crop&w=300&q=80"
  },
  {
    id: "inv_07",
    code: "TL-APD-008",
    name: "Set APD Kelistrikan Tegangan Menengah 1000V (Sarung Tangan + Helm)",
    nameEn: "1000V Electrical PPE Safety Set (Dielectric Gloves + Visor Helmet)",
    category: "K3 / Safety Equipment",
    categoryEn: "Safety Equipment",
    totalQty: 15,
    availableQty: 12,
    borrowedQty: 3,
    maintenanceQty: 0,
    unit: "Set",
    location: "Safety Station - Lemari K3",
    condition: "Baik",
    safetyRating: "IEC 60903 Class 0 (1000V AC)",
    specs: "Sarung tangan isolasi Kelas 0 (1000V AC IEC 60903), Helm insulasi dengan pelindung arc flash",
    image: "https://images.unsplash.com/photo-1508873696983-2df5293cb32b?auto=format&fit=crop&w=300&q=80"
  }
];

export const DEFAULT_VIDEOS = [];

export async function fileToBase64(file, maxWidth = 600, quality = 0.85) {
  return new Promise((resolve) => {
    if (!file) return resolve('');
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(e.target.result);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

const getInitialSchedules = () => {
  if (typeof window === 'undefined') return DEFAULT_SCHEDULES;
  try {
    const raw = localStorage.getItem('polimdo_cached_schedules');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_SCHEDULES;
};

const getInitialFaculty = () => {
  if (typeof window === 'undefined') return DEFAULT_FACULTY;
  try {
    const raw = localStorage.getItem('polimdo_cached_faculty');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_FACULTY;
};

const getInitialAnnouncements = () => {
  if (typeof window === 'undefined') return DEFAULT_ANNOUNCEMENTS;
  try {
    const raw = localStorage.getItem('polimdo_cached_announcements');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_ANNOUNCEMENTS;
};

const getInitialInventory = () => {
  if (typeof window === 'undefined') return DEFAULT_INVENTORY;
  try {
    const raw = localStorage.getItem('polimdo_cached_inventory');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_INVENTORY;
};

const getInitialBookings = () => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('polimdo_cached_bookings');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
};

const getInitialLabZones = () => {
  if (typeof window === 'undefined') return DEFAULT_LAB_ZONES;
  try {
    const raw = localStorage.getItem('polimdo_cached_lab_zones');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_LAB_ZONES;
};

const getInitialVideos = () => {
  if (typeof window === 'undefined') return DEFAULT_VIDEOS;
  try {
    const raw = localStorage.getItem('polimdo_cached_videos');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.filter(v => v.id && !['vid_01', 'vid_02', 'vid_03', 'vid_04', 'vid_05'].includes(v.id));
      }
    }
  } catch {}
  return DEFAULT_VIDEOS;
};

const DataContext = createContext();

export function DataProvider({ children }) {
  const { token } = useAuth();

  const [schedules, setSchedules] = useState(getInitialSchedules);
  const [faculty, setFaculty] = useState(getInitialFaculty);
  const [videos, setVideos] = useState(getInitialVideos);
  const [announcements, setAnnouncements] = useState(getInitialAnnouncements);
  const [inventory, setInventory] = useState(getInitialInventory);
  const [bookings, setBookings] = useState(getInitialBookings);
  const [labZones, setLabZones] = useState(getInitialLabZones);
  const [loading, setLoading] = useState(false);

  // Automatic URL Sync Payload Importer (e.g. ?sync=... opened on Smart TV or another device)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const syncPayload = urlParams.get('sync') || hashParams.get('sync');

      if (syncPayload) {
        let jsonStr = '';
        try {
          jsonStr = decodeURIComponent(escape(atob(syncPayload)));
        } catch {
          jsonStr = decodeURIComponent(syncPayload);
        }

        if (jsonStr) {
          const parsed = JSON.parse(jsonStr);
          if (parsed && typeof parsed === 'object') {
            if (Array.isArray(parsed.videos) && parsed.videos.length > 0) {
              setVideos(parsed.videos);
              try { localStorage.setItem('polimdo_cached_videos', JSON.stringify(parsed.videos)); } catch {}
            }
            if (Array.isArray(parsed.schedules) && parsed.schedules.length > 0) {
              setSchedules(parsed.schedules);
              try { localStorage.setItem('polimdo_cached_schedules', JSON.stringify(parsed.schedules)); } catch {}
            }
            if (Array.isArray(parsed.announcements) && parsed.announcements.length > 0) {
              setAnnouncements(parsed.announcements);
              try { localStorage.setItem('polimdo_cached_announcements', JSON.stringify(parsed.announcements)); } catch {}
            }
            if (Array.isArray(parsed.faculty) && parsed.faculty.length > 0) {
              setFaculty(parsed.faculty);
              try { localStorage.setItem('polimdo_cached_faculty', JSON.stringify(parsed.faculty)); } catch {}
            }
            if (Array.isArray(parsed.inventory) && parsed.inventory.length > 0) {
              setInventory(parsed.inventory);
              try { localStorage.setItem('polimdo_cached_inventory', JSON.stringify(parsed.inventory)); } catch {}
            }
            // Clean URL query without page reload
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
            console.log('✅ Synchronized state imported from TV Sync URL successfully!');
          }
        }
      }
    } catch (e) {
      console.warn('URL sync payload parser notice:', e);
    }
  }, []);

  // Fetch all data from Supabase Cloud or API
  const fetchAllData = useCallback(async () => {
    try {
      // 1. Prioritize direct Supabase Cloud Fetch (Fastest & 100% Reliable on Cloud)
      if (supabase) {
        try {
          const [
            { data: schData },
            { data: facData },
            { data: vidData },
            { data: annData },
            { data: invData },
            { data: bkData },
            { data: lzData }
          ] = await Promise.all([
            supabase.from("schedules").select("*"),
            supabase.from("faculty").select("*"),
            supabase.from("videos").select("*"),
            supabase.from("announcements").select("*"),
            supabase.from("inventory").select("*"),
            supabase.from("bookings").select("*"),
            supabase.from("lab_zones").select("*")
          ]);

          if (schData && schData.length > 0) {
            const mappedSchedules = schData.map(s => ({
              id: s.id,
              day: s.day,
              dayEn: s.day_en || s.dayEn,
              startTime: s.start_time || s.startTime,
              endTime: s.end_time || s.endTime,
              courseCode: s.course_code || s.courseCode,
              courseName: s.course_name || s.courseName,
              courseNameEn: s.course_name_en || s.courseNameEn,
              lecturer: s.lecturer,
              className: s.class_name || s.className,
              semester: Number(s.semester) || 1,
              room: s.room,
              credits: Number(s.credits) || 3,
              topic: s.topic,
              upcomingTask: s.upcoming_task || s.upcomingTask,
              academicYear: s.academic_year || s.academicYear,
              color: s.color || "blue"
            }));
            setSchedules(mappedSchedules);
            try {
              localStorage.setItem('polimdo_cached_schedules', JSON.stringify(mappedSchedules));
            } catch {}
          }

          if (facData && facData.length > 0) {
            const mappedFaculty = facData.map(f => ({
              id: f.id,
              name: f.name,
              title: f.title,
              titleEn: f.title_en || f.titleEn,
              nip: f.nip,
              nidn: f.nidn,
              role: f.role,
              roleEn: f.role_en || f.roleEn,
              room: f.room,
              email: f.email,
              phone: f.phone,
              expertise: f.expertise,
              expertiseEn: f.expertise_en || f.expertiseEn,
              photo: f.photo,
              bio: f.bio,
              bioEn: f.bio_en || f.bioEn
            }));
            setFaculty(mappedFaculty);
            try {
              localStorage.setItem('polimdo_cached_faculty', JSON.stringify(mappedFaculty));
            } catch {}
          }

          if (supabase) {
            try {
              await supabase.from("videos").delete().in("id", ["vid_01", "vid_02", "vid_03", "vid_04", "vid_05"]);
            } catch {}
          }

          if (vidData) {
            const mergedMap = new Map();

            // 1. Populate Supabase Cloud videos
            vidData
              .filter(v => v.url && !v.url.startsWith('blob:') && !['vid_01', 'vid_02', 'vid_03', 'vid_04', 'vid_05'].includes(v.id))
              .forEach((v) => {
                const ytId = extractYouTubeId(v.url);
                const autoThumb = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : '';
                mergedMap.set(v.id, {
                  id: v.id,
                  title: v.title || 'Video Signage',
                  titleEn: v.title_en || v.titleEn || v.title || 'Signage Video',
                  category: v.category || 'instructional',
                  categoryEn: v.category_en || v.categoryEn || 'Instructional & Practicum',
                  categoryName: v.category === 'safety' || v.category === 'k3_safety' ? 'K3 Laboratorium' : v.category === 'course_promo' ? 'Profil Prodi & Lab' : 'Tutorial & Panduan',
                  duration: v.duration || '03:00',
                  durationSec: parseDurationSeconds(v.duration, v.duration_sec || v.durationSec || 180),
                  url: v.url,
                  rawUrl: v.url,
                  thumbnail: v.thumbnail || autoThumb || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
                  description: v.description || '',
                  descriptionEn: v.description_en || v.descriptionEn || '',
                  featured: Boolean(v.featured),
                  active: v.active !== false && v.is_active !== false,
                  isActive: v.active !== false && v.is_active !== false,
                  loop: v.loop !== false,
                  order: v.order || 1,
                  scheduleSlot: v.schedule_slot || v.scheduleSlot || 'Rotasi Teratur'
                });
              });

            // 2. Also check IndexedDB for locally stored videos (YouTube links and file blobs)
            try {
              const localDbRecords = await getAllLocalVideoRecords();
              for (const rec of localDbRecords) {
                if (rec && rec.id && !['vid_01', 'vid_02', 'vid_03', 'vid_04', 'vid_05'].includes(rec.id)) {
                  let playableUrl = rec.url || rec.rawUrl || '';
                  if (rec.blob && rec.blob instanceof Blob) {
                    try {
                      playableUrl = URL.createObjectURL(rec.blob);
                    } catch {}
                  } else if (playableUrl.startsWith('indexeddb://')) {
                    const localBlobUrl = await getLocalVideoBlobUrl(rec.id);
                    if (localBlobUrl) playableUrl = localBlobUrl;
                  }

                  if (playableUrl) {
                    const existing = mergedMap.get(rec.id) || {};
                    const ytId = extractYouTubeId(playableUrl);
                    const autoThumb = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : '';

                    mergedMap.set(rec.id, {
                      ...existing,
                      id: rec.id,
                      title: rec.title || existing.title || 'Video Signage',
                      titleEn: rec.titleEn || rec.title || existing.titleEn || 'Signage Video',
                      category: rec.category || existing.category || 'instructional',
                      categoryEn: rec.categoryEn || existing.categoryEn || 'Instructional & Practicum',
                      categoryName: rec.category === 'safety' || rec.category === 'k3_safety' ? 'K3 Laboratorium' : rec.category === 'course_promo' ? 'Profil Prodi & Lab' : 'Tutorial & Panduan',
                      duration: rec.duration || existing.duration || '03:00',
                      durationSec: parseDurationSeconds(rec.duration || existing.duration, rec.durationSec || existing.durationSec || 180),
                      url: playableUrl,
                      rawUrl: rec.rawUrl || rec.url || existing.rawUrl || playableUrl,
                      thumbnail: rec.thumbnail || existing.thumbnail || autoThumb || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
                      description: rec.description || existing.description || '',
                      descriptionEn: rec.descriptionEn || existing.descriptionEn || '',
                      featured: Boolean(rec.featured ?? existing.featured),
                      active: rec.active !== false && existing.active !== false,
                      isActive: rec.isActive !== false && existing.isActive !== false,
                      loop: rec.loop !== false && existing.loop !== false,
                      order: rec.order || existing.order || 1,
                      scheduleSlot: rec.scheduleSlot || existing.scheduleSlot || 'Rotasi Teratur'
                    });
                  }
                }
              }
            } catch (err) {
              console.warn('IndexedDB fallback fetch notice:', err);
            }

            const validVids = Array.from(mergedMap.values());
            setVideos(validVids);
            try {
              localStorage.setItem('polimdo_cached_videos', JSON.stringify(validVids.map(v => ({ ...v, url: v.rawUrl || v.url }))));
            } catch {}
          }

          if (annData && annData.length > 0) {
            const mappedAnnouncements = annData.map(a => ({
              id: a.id,
              title: a.title,
              titleEn: a.title_en || a.titleEn || a.title,
              content: a.content,
              contentEn: a.content_en || a.contentEn || a.content,
              priority: a.priority || "normal",
              category: a.category || "Akademik",
              categoryEn: a.category_en || a.categoryEn || "Academic",
              badge: a.badge || (a.priority === 'high' ? 'PENTING / URGENT' : (a.category || 'INFO')),
              date: a.date || new Date().toISOString().split("T")[0],
              validUntil: a.valid_until || a.validUntil,
              author: a.author || "Jurusan Teknik Elektro",
              isActive: a.is_active !== false && a.isActive !== false && a.active !== false,
              active: a.is_active !== false && a.isActive !== false && a.active !== false
            }));
            setAnnouncements(mappedAnnouncements);
            try {
              localStorage.setItem('polimdo_cached_announcements', JSON.stringify(mappedAnnouncements));
            } catch {}
          }

          if (invData && invData.length > 0) {
            const mappedInventory = invData.map(i => ({
              id: i.id,
              name: i.name,
              nameEn: i.name_en || i.nameEn || i.name,
              code: i.code,
              category: i.category || "Alat Ukur / Measurement",
              categoryEn: i.category_en || i.categoryEn || "Measurement Tool",
              brand: i.brand || "",
              model: i.model || "",
              totalQty: i.total_qty ?? i.totalQty ?? 1,
              availableQty: i.available_qty ?? i.availableQty ?? 1,
              borrowedQty: i.borrowed_qty ?? i.borrowedQty ?? 0,
              maintenanceQty: i.maintenance_qty ?? i.maintenanceQty ?? 0,
              location: i.location || "Laboratorium Listrik",
              condition: i.condition || "Baik",
              specs: i.specs || "",
              specsEn: i.specs_en || i.specsEn || i.specs || "",
              safetyRating: i.safety_rating || i.safetyRating || "Standard Safety",
              image: i.image || "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=300&q=80",
            }));
            setInventory(mappedInventory);
            try {
              localStorage.setItem('polimdo_cached_inventory', JSON.stringify(mappedInventory));
            } catch {}
          }

          if (bkData) {
            setBookings(bkData);
            try {
              localStorage.setItem('polimdo_cached_bookings', JSON.stringify(bkData));
            } catch {}
          }

          if (lzData?.length) {
            const mappedZones = DEFAULT_LAB_ZONES.map(defaultZone => {
              const supaZone = lzData.find(z => z.id === defaultZone.id || z.code === defaultZone.code);
              if (!supaZone) return defaultZone;
              return {
                ...defaultZone,
                status: supaZone.status || defaultZone.status,
                currentClass: supaZone.current_activity || supaZone.current_activity_en || defaultZone.currentClass,
                currentActivity: supaZone.current_activity || defaultZone.currentClass,
                currentActivityEn: supaZone.current_activity_en || defaultZone.currentClass,
                supervisor: supaZone.supervisor || defaultZone.supervisor,
                name: supaZone.name || defaultZone.name,
                code: supaZone.code || defaultZone.code,
                safetyLevel: supaZone.safety_level || defaultZone.safetyLevel,
                capacity: supaZone.max_capacity ? `${supaZone.max_capacity} Mahasiswa` : defaultZone.capacity
              };
            });
            setLabZones(mappedZones);
            try {
              localStorage.setItem('polimdo_cached_lab_zones', JSON.stringify(mappedZones));
            } catch {}
          }

          setLoading(false);
          return;
        } catch (supaErr) {
          console.warn("Supabase fetch error, falling back to API:", supaErr);
        }
      }

      // 2. Fallback to REST API
      const endpoints = ["schedules", "faculty", "videos", "announcements", "inventory", "inventory/bookings", "lab-zones"];
      const results = await Promise.allSettled(
        endpoints.map(ep => fetch(getApiUrl(`/api/${ep}`)).then(r => r.ok ? r.json() : null))
      );

      if (results[0].status === "fulfilled" && results[0].value?.success && results[0].value.data?.length > 0) {
        setSchedules(results[0].value.data);
        try { localStorage.setItem('polimdo_cached_schedules', JSON.stringify(results[0].value.data)); } catch {}
      }
      if (results[1].status === "fulfilled" && results[1].value?.success && results[1].value.data?.length > 0) {
        setFaculty(results[1].value.data);
        try { localStorage.setItem('polimdo_cached_faculty', JSON.stringify(results[1].value.data)); } catch {}
      }
      if (results[2].status === "fulfilled" && results[2].value?.success && results[2].value.data?.length > 0) {
        setVideos(results[2].value.data);
        try { localStorage.setItem('polimdo_cached_videos', JSON.stringify(results[2].value.data)); } catch {}
      }
      if (results[3].status === "fulfilled" && results[3].value?.success && results[3].value.data?.length > 0) {
        setAnnouncements(results[3].value.data);
        try { localStorage.setItem('polimdo_cached_announcements', JSON.stringify(results[3].value.data)); } catch {}
      }
      if (results[4].status === "fulfilled" && results[4].value?.success && results[4].value.data?.length > 0) {
        setInventory(results[4].value.data);
        try { localStorage.setItem('polimdo_cached_inventory', JSON.stringify(results[4].value.data)); } catch {}
      }
      if (results[5].status === "fulfilled" && results[5].value?.success && results[5].value.data) {
        setBookings(results[5].value.data);
        try { localStorage.setItem('polimdo_cached_bookings', JSON.stringify(results[5].value.data)); } catch {}
      }
      if (results[6].status === "fulfilled" && results[6].value?.success && results[6].value.data?.length) {
        const mappedZones = DEFAULT_LAB_ZONES.map(defaultZone => {
          const apiZone = results[6].value.data.find(z => z.id === defaultZone.id || z.code === defaultZone.code);
          if (!apiZone) return defaultZone;
          return {
            ...defaultZone,
            ...apiZone,
            coords: apiZone.coords || defaultZone.coords,
            equipment: apiZone.equipment || defaultZone.equipment
          };
        });
        setLabZones(mappedZones);
        try { localStorage.setItem('polimdo_cached_lab_zones', JSON.stringify(mappedZones)); } catch {}
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 30000);
    return () => clearInterval(interval);
  }, [fetchAllData]);

  // Auth header helper
  const authHeaders = () => ({
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {})
  });

  // Schedule operations
  const addSchedule = async (scheduleData) => {
    const dayEnMap = {
      'senin': 'Monday', 'selasa': 'Tuesday', 'rabu': 'Wednesday',
      'kamis': 'Thursday', 'jumat': 'Friday', 'sabtu': 'Saturday', 'minggu': 'Sunday'
    };
    const newId = scheduleData.id || `sch_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const newObj = {
      ...scheduleData,
      id: newId,
      dayEn: scheduleData.dayEn || dayEnMap[String(scheduleData.day || '').trim().toLowerCase()] || 'Monday',
      semester: Number(scheduleData.semester) || 1,
      credits: Number(scheduleData.credits) || 3,
      academicYear: scheduleData.academicYear || "2025/2026 Ganjil",
      color: scheduleData.color || "blue"
    };

    setSchedules(prev => {
      const nextList = [...prev, newObj];
      try {
        localStorage.setItem('polimdo_cached_schedules', JSON.stringify(nextList));
      } catch {}
      return nextList;
    });

    if (supabase) {
      try {
        await supabase.from("schedules").insert({
          id: newId,
          day: newObj.day,
          day_en: newObj.dayEn,
          start_time: newObj.startTime,
          end_time: newObj.endTime,
          course_code: newObj.courseCode,
          course_name: newObj.courseName,
          course_name_en: newObj.courseNameEn,
          lecturer: newObj.lecturer,
          class_name: newObj.className,
          semester: Number(newObj.semester) || 1,
          room: newObj.room,
          credits: Number(newObj.credits) || 3,
          topic: newObj.topic || "",
          upcoming_task: newObj.upcomingTask || "",
          academic_year: newObj.academicYear || "2025/2026 Ganjil",
          color: newObj.color || "blue"
        });
      } catch (e) { console.warn("Supabase schedule insert notice:", e); }
    }

    try {
      await fetch(getApiUrl("/api/schedules"), {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(newObj)
      });
    } catch {}

    return { success: true, data: newObj };
  };

  const updateSchedule = async (id, scheduleData) => {
    setSchedules(prev => {
      const nextList = prev.map(s => s.id === id ? { ...s, ...scheduleData } : s);
      try {
        localStorage.setItem('polimdo_cached_schedules', JSON.stringify(nextList));
      } catch {}
      return nextList;
    });

    if (supabase) {
      try {
        await supabase.from("schedules").update({
          day: scheduleData.day,
          day_en: scheduleData.dayEn,
          start_time: scheduleData.startTime,
          end_time: scheduleData.endTime,
          course_code: scheduleData.courseCode,
          course_name: scheduleData.courseName,
          course_name_en: scheduleData.courseNameEn,
          lecturer: scheduleData.lecturer,
          class_name: scheduleData.className,
          semester: Number(scheduleData.semester) || 1,
          room: scheduleData.room,
          credits: Number(scheduleData.credits) || 3,
          topic: scheduleData.topic || "",
          upcoming_task: scheduleData.upcomingTask || "",
          academic_year: scheduleData.academicYear,
          color: scheduleData.color
        }).eq("id", id);
      } catch (e) { console.warn("Supabase schedule update notice:", e); }
    }

    try {
      await fetch(getApiUrl(`/api/schedules/${id}`), {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(scheduleData)
      });
    } catch {}

    return { success: true };
  };

  const deleteSchedule = async (id) => {
    setSchedules(prev => {
      const nextList = prev.filter(s => s.id !== id);
      try {
        localStorage.setItem('polimdo_cached_schedules', JSON.stringify(nextList));
      } catch {}
      return nextList;
    });

    if (supabase) {
      try {
        await supabase.from("schedules").delete().eq("id", id);
      } catch (e) { console.warn("Supabase schedule delete notice:", e); }
    }

    try {
      await fetch(getApiUrl(`/api/schedules/${id}`), {
        method: "DELETE",
        headers: authHeaders()
      });
    } catch {}

    return { success: true };
  };

  const importSchedulesFromExcel = async (items, mode = "append") => {
    const dayEnMap = {
      'senin': 'Monday', 'selasa': 'Tuesday', 'rabu': 'Wednesday',
      'kamis': 'Thursday', 'jumat': 'Friday', 'sabtu': 'Saturday', 'minggu': 'Sunday'
    };
    const colors = ['blue', 'cyan', 'emerald', 'amber', 'purple', 'red', 'yellow', 'indigo'];

    const formattedItems = items.map((s, idx) => {
      const day = s.day || s['Hari'] || 'Senin';
      const dayEn = s.dayEn || s['Hari (EN)'] || dayEnMap[String(day).trim().toLowerCase()] || 'Monday';
      return {
        id: s.id || `sch_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 4)}`,
        day,
        dayEn,
        startTime: s.startTime || s['Jam Mulai'] || '08:00',
        endTime: s.endTime || s['Jam Selesai'] || '11:30',
        courseCode: s.courseCode || s['Kode MK'] || `TL-${4100 + idx}`,
        courseName: s.courseName || s['Mata Kuliah'] || 'Praktikum Kelistrikan',
        courseNameEn: s.courseNameEn || s['Mata Kuliah (EN)'] || s.courseName || 'Electrical Practicum',
        lecturer: s.lecturer || s['Dosen'] || 'Dosen Pengampu',
        className: s.className || s['Kelas'] || 'D4-TL-3A',
        semester: Number(s.semester || s['Semester']) || 1,
        room: s.room || s['Ruangan / Meja'] || 'Lab Instalasi Listrik',
        credits: Number(s.credits || s['SKS']) || 3,
        topic: s.topic || s['Materi'] || '',
        upcomingTask: s.upcomingTask || s['Tugas Mendatang'] || '',
        academicYear: s.academicYear || s['Tahun Akademik'] || '2025/2026 Ganjil',
        color: s.color || colors[idx % colors.length]
      };
    });

    setSchedules(prev => {
      let nextList = [];
      if (mode === "replace") {
        nextList = formattedItems;
      } else {
        nextList = [...prev, ...formattedItems];
      }
      try {
        localStorage.setItem('polimdo_cached_schedules', JSON.stringify(nextList));
      } catch (e) {
        console.warn("LocalStorage save error:", e);
      }
      return nextList;
    });

    if (supabase) {
      try {
        if (mode === "replace") {
          await supabase.from("schedules").delete().neq("id", "0");
        }
        const rows = formattedItems.map(s => ({
          id: s.id,
          day: s.day,
          day_en: s.dayEn,
          start_time: s.startTime,
          end_time: s.endTime,
          course_code: s.courseCode,
          course_name: s.courseName,
          course_name_en: s.courseNameEn,
          lecturer: s.lecturer,
          class_name: s.className,
          semester: Number(s.semester) || 1,
          room: s.room,
          credits: Number(s.credits) || 3,
          topic: s.topic || "",
          upcoming_task: s.upcomingTask || "",
          academic_year: s.academicYear || "2025/2026 Ganjil",
          color: s.color || "blue"
        }));
        await supabase.from("schedules").upsert(rows);
      } catch (e) { console.warn("Supabase excel import notice:", e); }
    }

    try {
      await fetch(getApiUrl("/api/schedules/import-excel"), {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ items: formattedItems, mode })
      });
    } catch {}

    return { success: true, count: formattedItems.length };
  };

  // Faculty operations
  const addFaculty = async (facultyData) => {
    const newId = facultyData.id || `fac_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const newObj = { ...facultyData, id: newId };
    setFaculty(prev => {
      const nextList = [...prev, newObj];
      try {
        localStorage.setItem('polimdo_cached_faculty', JSON.stringify(nextList));
      } catch {}
      return nextList;
    });

    if (supabase) {
      try {
        await supabase.from("faculty").insert({
          id: newId,
          name: newObj.name,
          title: newObj.title,
          title_en: newObj.titleEn,
          nip: newObj.nip,
          nidn: newObj.nidn,
          role: newObj.role,
          role_en: newObj.roleEn,
          room: newObj.room,
          email: newObj.email,
          phone: newObj.phone,
          expertise: newObj.expertise,
          expertise_en: newObj.expertiseEn,
          photo: newObj.photo,
          bio: newObj.bio,
          bio_en: newObj.bioEn
        });
      } catch (e) { console.warn("Supabase faculty insert notice:", e); }
    }

    try {
      await fetch(getApiUrl("/api/faculty"), {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(newObj)
      });
    } catch {}

    return { success: true, data: newObj };
  };

  const updateFaculty = async (id, facultyData) => {
    setFaculty(prev => {
      const nextList = prev.map(f => f.id === id ? { ...f, ...facultyData } : f);
      try {
        localStorage.setItem('polimdo_cached_faculty', JSON.stringify(nextList));
      } catch {}
      return nextList;
    });

    if (supabase) {
      try {
        await supabase.from("faculty").update({
          name: facultyData.name,
          title: facultyData.title,
          title_en: facultyData.titleEn,
          nip: facultyData.nip,
          nidn: facultyData.nidn,
          role: facultyData.role,
          role_en: facultyData.roleEn,
          room: facultyData.room,
          email: facultyData.email,
          phone: facultyData.phone,
          expertise: facultyData.expertise,
          expertise_en: facultyData.expertiseEn,
          photo: facultyData.photo,
          bio: facultyData.bio,
          bio_en: facultyData.bioEn
        }).eq("id", id);
      } catch (e) { console.warn("Supabase faculty update notice:", e); }
    }

    try {
      await fetch(getApiUrl(`/api/faculty/${id}`), {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(facultyData)
      });
    } catch {}

    return { success: true };
  };

  const deleteFaculty = async (id) => {
    setFaculty(prev => {
      const nextList = prev.filter(f => f.id !== id);
      try {
        localStorage.setItem('polimdo_cached_faculty', JSON.stringify(nextList));
      } catch {}
      return nextList;
    });

    if (supabase) {
      try {
        await supabase.from("faculty").delete().eq("id", id);
      } catch (e) { console.warn("Supabase faculty delete notice:", e); }
    }

    try {
      await fetch(getApiUrl(`/api/faculty/${id}`), {
        method: "DELETE",
        headers: authHeaders()
      });
    } catch {}

    return { success: true };
  };

  const uploadFacultyPhoto = async (file) => {
    try {
      const base64Url = await fileToBase64(file, 500, 0.85);
      if (base64Url) {
        return { success: true, url: base64Url };
      }
      return { success: true, url: URL.createObjectURL(file) };
    } catch {
      return { success: true, url: URL.createObjectURL(file) };
    }
  };

  // Video operations
  const uploadVideoFile = async (file) => {
    try {
      const newId = `vid_${Date.now()}`;
      const ext = file.name.split('.').pop() || 'mp4';
      const fileName = `${newId}.${ext}`;

      // 1. Always store locally in IndexedDB first (instant on current device)
      await saveLocalVideoBlob(newId, file);
      const localUrl = URL.createObjectURL(file);

      // 2. Try Supabase Storage Upload if bucket "videos" exists for multi-device sync
      if (supabase && file.size < 50 * 1024 * 1024) {
        try {
          const { data, error } = await supabase.storage
            .from('videos')
            .upload(`public/${fileName}`, file, {
              cacheControl: '3600',
              upsert: true
            });

          if (!error && data) {
            const { data: publicUrlData } = supabase.storage
              .from('videos')
              .getPublicUrl(`public/${fileName}`);

            if (publicUrlData && publicUrlData.publicUrl) {
              return {
                success: true,
                id: newId,
                url: publicUrlData.publicUrl,
                localBlobUrl: localUrl,
                fileName: file.name,
                fileSizeMB: (file.size / (1024 * 1024)).toFixed(2),
                isCloudUrl: true
              };
            }
          }
        } catch (storageErr) {
          console.warn("Supabase Storage upload fallback:", storageErr);
        }
      }

      return { 
        success: true, 
        id: newId, 
        url: `indexeddb://${newId}`, 
        localBlobUrl: localUrl,
        fileName: file.name,
        fileSizeMB: (file.size / (1024 * 1024)).toFixed(2),
        isCloudUrl: false
      };
    } catch (err) {
      console.warn("Local video storage warning:", err);
      return { success: true, url: URL.createObjectURL(file) };
    }
  };

  const uploadVideoThumbnail = async (file) => {
    try {
      const base64Url = await fileToBase64(file, 640, 0.85);
      if (base64Url) {
        return { success: true, url: base64Url };
      }
      return { success: true, url: URL.createObjectURL(file) };
    } catch {
      return { success: true, url: URL.createObjectURL(file) };
    }
  };

  const addVideo = async (videoData) => {
    const newId = videoData.id || `vid_${Date.now()}`;
    const playUrl = videoData.localBlobUrl || videoData.url;
    const persistentUrl = videoData.url?.startsWith('blob:') ? `indexeddb://${newId}` : (videoData.url || `indexeddb://${newId}`);
    const finalDurationSec = parseDurationSeconds(videoData.duration, videoData.durationSec || 180);
    const ytId = extractYouTubeId(persistentUrl || playUrl);
    const autoThumb = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : '';

    const newObj = {
      ...videoData,
      id: newId,
      title: videoData.title || 'Video Signage',
      titleEn: videoData.titleEn || videoData.title || 'Signage Video',
      category: videoData.category || 'instructional',
      categoryEn: videoData.categoryEn || 'Instructional & Practicum',
      categoryName: videoData.category === 'safety' || videoData.category === 'k3_safety' ? 'K3 Laboratorium' : videoData.category === 'course_promo' ? 'Profil Prodi & Lab' : 'Tutorial & Panduan',
      duration: videoData.duration || '03:00',
      durationSec: finalDurationSec,
      thumbnail: videoData.thumbnail || autoThumb || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
      url: playUrl,
      rawUrl: persistentUrl,
      active: videoData.active !== false,
      isActive: videoData.isActive !== false,
      loop: videoData.loop !== false,
      order: videoData.order || 1,
      scheduleSlot: videoData.scheduleSlot || 'Rotasi Teratur'
    };

    // 1. Immediately update React state and LocalStorage cache
    setVideos(prev => {
      const filtered = prev.filter(v => v.id !== newId);
      const nextList = [...filtered, newObj];
      try {
        localStorage.setItem('polimdo_cached_videos', JSON.stringify(nextList.map(v => ({ ...v, url: v.rawUrl || v.url }))));
      } catch {}
      return nextList;
    });

    // 2. Save to IndexedDB permanent storage
    try {
      await saveLocalVideoBlob(newId, videoData.fileBlob || null, newObj);
    } catch (e) {
      console.warn("IndexedDB save warning:", e);
    }

    // 3. Upsert to Supabase Cloud
    if (supabase) {
      try {
        const { error } = await supabase.from("videos").upsert({
          id: newId,
          title: newObj.title,
          title_en: newObj.titleEn || newObj.title,
          category: newObj.category || 'instructional',
          category_en: newObj.categoryEn || 'Instructional & Practicum',
          duration: newObj.duration || '03:00',
          duration_sec: finalDurationSec,
          url: persistentUrl,
          thumbnail: newObj.thumbnail,
          description: newObj.description || '',
          description_en: newObj.descriptionEn || '',
          featured: newObj.featured || false,
          active: newObj.active !== false,
          loop: newObj.loop !== false,
          order: newObj.order || 1
        });
        if (error) {
          console.warn("Supabase video insert notice:", error);
        }
      } catch (e) { console.warn("Supabase video insert error:", e); }
    }

    try {
      await fetch(getApiUrl("/api/videos"), {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ ...newObj, url: persistentUrl, durationSec: finalDurationSec })
      });
    } catch {}

    return { success: true, data: newObj };
  };

  const updateVideo = async (id, videoData) => {
    const persistentUrl = videoData.url?.startsWith('blob:') ? `indexeddb://${id}` : videoData.url;
    const playUrl = videoData.localBlobUrl || videoData.url;
    const finalDurationSec = parseDurationSeconds(videoData.duration, videoData.durationSec || 180);
    const ytId = extractYouTubeId(persistentUrl || playUrl);
    const autoThumb = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : '';

    const updatedObj = {
      ...videoData,
      id,
      title: videoData.title || 'Video Signage',
      titleEn: videoData.titleEn || videoData.title || 'Signage Video',
      category: videoData.category || 'instructional',
      categoryEn: videoData.categoryEn || 'Instructional & Practicum',
      categoryName: videoData.category === 'safety' || videoData.category === 'k3_safety' ? 'K3 Laboratorium' : videoData.category === 'course_promo' ? 'Profil Prodi & Lab' : 'Tutorial & Panduan',
      duration: videoData.duration || '03:00',
      durationSec: finalDurationSec,
      thumbnail: videoData.thumbnail || autoThumb || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
      url: playUrl,
      rawUrl: persistentUrl,
      active: videoData.active !== false,
      isActive: videoData.isActive !== false,
      loop: videoData.loop !== false,
      order: videoData.order || 1,
      scheduleSlot: videoData.scheduleSlot || 'Rotasi Teratur'
    };

    // 1. Immediately update React state & LocalStorage cache
    setVideos(prev => {
      const exists = prev.some(v => v.id === id);
      const nextList = !exists
        ? [...prev, updatedObj]
        : prev.map(v => v.id === id ? updatedObj : v);
      try {
        localStorage.setItem('polimdo_cached_videos', JSON.stringify(nextList.map(v => ({ ...v, url: v.rawUrl || v.url }))));
      } catch {}
      return nextList;
    });

    // 2. Save to IndexedDB
    try {
      await saveLocalVideoBlob(id, videoData.fileBlob || null, updatedObj);
    } catch (e) {
      console.warn("IndexedDB update warning:", e);
    }

    // 3. Upsert to Supabase
    if (supabase) {
      try {
        const { error } = await supabase.from("videos").upsert({
          id: id,
          title: updatedObj.title,
          title_en: updatedObj.titleEn || updatedObj.title,
          category: updatedObj.category || 'instructional',
          category_en: updatedObj.categoryEn || 'Instructional & Practicum',
          duration: updatedObj.duration || '03:00',
          duration_sec: finalDurationSec,
          url: persistentUrl,
          thumbnail: updatedObj.thumbnail,
          description: updatedObj.description || '',
          description_en: updatedObj.descriptionEn || '',
          featured: updatedObj.featured || false,
          active: updatedObj.active !== false,
          loop: updatedObj.loop !== false,
          order: updatedObj.order || 1
        });
        if (error) {
          console.warn("Supabase video update notice:", error);
        }
      } catch (e) { console.warn("Supabase video update error:", e); }
    }

    try {
      await fetch(getApiUrl(`/api/videos/${id}`), {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ ...updatedObj, url: persistentUrl })
      });
    } catch {}

    return { success: true };
  };

  const deleteVideo = async (id) => {
    setVideos(prev => {
      const nextList = prev.filter(v => v.id !== id);
      try {
        localStorage.setItem('polimdo_cached_videos', JSON.stringify(nextList.map(v => ({ ...v, url: v.rawUrl || v.url }))));
      } catch {}
      return nextList;
    });

    // Delete from IndexedDB permanent storage
    try {
      await deleteLocalVideoBlob(id);
    } catch {}

    if (supabase) {
      try {
        await supabase.from("videos").delete().eq("id", id);
      } catch (e) { console.warn("Supabase video delete error:", e); }
    }

    try {
      await fetch(getApiUrl(`/api/videos/${id}`), {
        method: "DELETE",
        headers: authHeaders()
      });
    } catch {}

    return { success: true };
  };

  // Announcement operations
  const addAnnouncement = async (annData) => {
    const newId = annData.id || `ann_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const newObj = {
      ...annData,
      id: newId,
      date: annData.date || new Date().toISOString().split("T")[0]
    };
    setAnnouncements(prev => {
      const nextList = [newObj, ...prev];
      try {
        localStorage.setItem('polimdo_cached_announcements', JSON.stringify(nextList));
      } catch {}
      return nextList;
    });

    if (supabase) {
      try {
        await supabase.from("announcements").insert({
          id: newId,
          title: newObj.title,
          title_en: newObj.titleEn || newObj.title,
          content: newObj.content,
          content_en: newObj.contentEn || newObj.content,
          priority: newObj.priority || "normal",
          category: newObj.category || "Akademik",
          category_en: newObj.categoryEn || "Academic",
          date: newObj.date,
          valid_until: newObj.validUntil,
          author: newObj.author || "Admin Lab"
        });
      } catch (e) { console.warn("Supabase announcement insert notice:", e); }
    }

    try {
      await fetch(getApiUrl("/api/announcements"), {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(newObj)
      });
    } catch {}

    return { success: true, data: newObj };
  };

  const updateAnnouncement = async (id, annData) => {
    setAnnouncements(prev => {
      const nextList = prev.map(a => a.id === id ? { ...a, ...annData } : a);
      try {
        localStorage.setItem('polimdo_cached_announcements', JSON.stringify(nextList));
      } catch {}
      return nextList;
    });

    if (supabase) {
      try {
        await supabase.from("announcements").update({
          title: annData.title,
          title_en: annData.titleEn,
          content: annData.content,
          content_en: annData.contentEn,
          priority: annData.priority,
          category: annData.category,
          category_en: annData.categoryEn,
          date: annData.date,
          valid_until: annData.validUntil,
          author: annData.author
        }).eq("id", id);
      } catch (e) { console.warn("Supabase announcement update notice:", e); }
    }

    try {
      await fetch(getApiUrl(`/api/announcements/${id}`), {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(annData)
      });
    } catch {}

    return { success: true };
  };

  const deleteAnnouncement = async (id) => {
    setAnnouncements(prev => {
      const nextList = prev.filter(a => a.id !== id);
      try {
        localStorage.setItem('polimdo_cached_announcements', JSON.stringify(nextList));
      } catch {}
      return nextList;
    });

    if (supabase) {
      try {
        await supabase.from("announcements").delete().eq("id", id);
      } catch (e) { console.warn("Supabase announcement delete notice:", e); }
    }

    try {
      await fetch(getApiUrl(`/api/announcements/${id}`), {
        method: "DELETE",
        headers: authHeaders()
      });
    } catch {}

    return { success: true };
  };

  // Inventory & Booking operations
  const addInventoryItem = async (itemData) => {
    const newId = itemData.id || `inv_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const newObj = { ...itemData, id: newId };
    setInventory(prev => {
      const nextList = [...prev, newObj];
      try {
        localStorage.setItem('polimdo_cached_inventory', JSON.stringify(nextList));
      } catch {}
      return nextList;
    });

    if (supabase) {
      try {
        await supabase.from("inventory").insert({
          id: newId,
          name: newObj.name,
          name_en: newObj.nameEn,
          code: newObj.code,
          category: newObj.category,
          category_en: newObj.categoryEn,
          brand: newObj.brand,
          model: newObj.model,
          total_qty: Number(newObj.totalQty) || 1,
          available_qty: Number(newObj.availableQty) || 1,
          borrowed_qty: Number(newObj.borrowedQty) || 0,
          maintenance_qty: Number(newObj.maintenanceQty) || 0,
          location: newObj.location,
          condition: newObj.condition || "Baik",
          specs: newObj.specs,
          specs_en: newObj.specsEn,
          safety_rating: newObj.safetyRating,
          image: newObj.image,
          allowed_roles: newObj.allowedRoles
        });
      } catch (e) { console.warn("Supabase inventory insert notice:", e); }
    }

    try {
      await fetch(getApiUrl("/api/inventory"), {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(newObj)
      });
    } catch {}

    return { success: true, data: newObj };
  };

  const updateInventoryItem = async (id, itemData) => {
    setInventory(prev => {
      const nextList = prev.map(i => i.id === id ? { ...i, ...itemData } : i);
      try {
        localStorage.setItem('polimdo_cached_inventory', JSON.stringify(nextList));
      } catch {}
      return nextList;
    });

    if (supabase) {
      try {
        await supabase.from("inventory").update({
          name: itemData.name,
          name_en: itemData.nameEn,
          code: itemData.code,
          category: itemData.category,
          category_en: itemData.categoryEn,
          brand: itemData.brand,
          model: itemData.model,
          total_qty: Number(itemData.totalQty),
          available_qty: Number(itemData.availableQty),
          borrowed_qty: Number(itemData.borrowedQty),
          maintenance_qty: Number(itemData.maintenanceQty),
          location: itemData.location,
          condition: itemData.condition,
          specs: itemData.specs,
          specs_en: itemData.specsEn,
          safety_rating: itemData.safetyRating,
          image: itemData.image,
          allowed_roles: itemData.allowedRoles
        }).eq("id", id);
      } catch (e) { console.warn("Supabase inventory update notice:", e); }
    }

    try {
      await fetch(getApiUrl(`/api/inventory/${id}`), {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(itemData)
      });
    } catch {}

    return { success: true };
  };

  const deleteInventoryItem = async (id) => {
    setInventory(prev => {
      const nextList = prev.filter(i => i.id !== id);
      try {
        localStorage.setItem('polimdo_cached_inventory', JSON.stringify(nextList));
      } catch {}
      return nextList;
    });

    if (supabase) {
      try {
        await supabase.from("inventory").delete().eq("id", id);
      } catch (e) { console.warn("Supabase inventory delete notice:", e); }
    }

    try {
      await fetch(getApiUrl(`/api/inventory/${id}`), {
        method: "DELETE",
        headers: authHeaders()
      });
    } catch {}

    return { success: true };
  };

  const submitBookingRequest = async (bookingData) => {
    const newId = bookingData.id || `bk_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const newObj = { ...bookingData, id: newId, status: "pending", createdAt: new Date().toISOString() };
    setBookings(prev => {
      const nextList = [newObj, ...prev];
      try {
        localStorage.setItem('polimdo_cached_bookings', JSON.stringify(nextList));
      } catch {}
      return nextList;
    });

    if (supabase) {
      try {
        await supabase.from("bookings").insert({
          id: newId,
          item_id: newObj.itemId,
          item_name: newObj.itemName,
          borrower_name: newObj.borrowerName,
          borrower_id: newObj.borrowerId || newObj.nim,
          borrower_role: newObj.borrowerRole || "Mahasiswa",
          borrower_class: newObj.borrowerClass || newObj.className,
          borrow_date: newObj.borrowDate,
          expected_return_date: newObj.expectedReturnDate || newObj.returnDate,
          quantity: Number(newObj.quantity) || 1,
          purpose: newObj.purpose,
          status: "pending",
          notes: newObj.notes || ""
        });
      } catch (e) { console.warn("Supabase booking insert notice:", e); }
    }

    try {
      await fetch(getApiUrl("/api/inventory/bookings"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newObj)
      });
    } catch {}

    return { success: true, data: newObj };
  };

  const updateBookingStatus = async (id, status, notes = "") => {
    setBookings(prev => {
      const nextList = prev.map(b => b.id === id ? { ...b, status, notes } : b);
      try {
        localStorage.setItem('polimdo_cached_bookings', JSON.stringify(nextList));
      } catch {}
      return nextList;
    });

    if (supabase) {
      try {
        await supabase.from("bookings").update({ status, notes }).eq("id", id);
      } catch (e) { console.warn("Supabase booking status update notice:", e); }
    }

    try {
      await fetch(getApiUrl(`/api/inventory/bookings/${id}/status`), {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ status, notes })
      });
    } catch {}

    return { success: true };
  };

  // Lab Zones
  const updateLabZone = async (id, zoneData) => {
    setLabZones(prev => {
      const nextList = prev.map(z => z.id === id ? { ...z, ...zoneData } : z);
      try {
        localStorage.setItem('polimdo_cached_lab_zones', JSON.stringify(nextList));
      } catch {}
      return nextList;
    });

    if (supabase) {
      try {
        await supabase.from("lab_zones").update({
          status: zoneData.status,
          current_activity: zoneData.currentActivity,
          current_activity_en: zoneData.currentActivityEn,
          supervisor: zoneData.supervisor,
          current_occupancy: Number(zoneData.currentOccupancy),
          safety_level: zoneData.safetyLevel
        }).eq("id", id);
      } catch (e) { console.warn("Supabase lab_zone update notice:", e); }
    }

    try {
      await fetch(getApiUrl(`/api/lab-zones/${id}`), {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(zoneData)
      });
    } catch {}

    return { success: true };
  };

  // Generate a universal TV Sync URL with full playlist, schedules, faculty, and announcements
  const generateTvSyncUrl = (originOverride) => {
    try {
      const payload = {
        videos: videos.map(v => ({
          id: v.id,
          title: v.title,
          titleEn: v.titleEn,
          category: v.category,
          categoryName: v.categoryName,
          duration: v.duration,
          durationSec: v.durationSec,
          url: v.rawUrl || v.url,
          rawUrl: v.rawUrl || v.url,
          thumbnail: v.thumbnail,
          active: v.active,
          isActive: v.isActive,
          loop: v.loop,
          scheduleSlot: v.scheduleSlot,
          order: v.order
        })),
        schedules: schedules.map(s => ({
          id: s.id,
          day: s.day,
          dayEn: s.dayEn,
          startTime: s.startTime,
          endTime: s.endTime,
          courseCode: s.courseCode,
          courseName: s.courseName,
          courseNameEn: s.courseNameEn,
          lecturer: s.lecturer,
          className: s.className,
          semester: s.semester,
          room: s.room,
          credits: s.credits,
          topic: s.topic,
          upcomingTask: s.upcomingTask,
          academicYear: s.academicYear,
          color: s.color
        })),
        faculty: faculty.map(f => ({
          id: f.id,
          name: f.name,
          title: f.title,
          titleEn: f.titleEn,
          nip: f.nip,
          nidn: f.nidn,
          role: f.role,
          roleEn: f.roleEn,
          room: f.room,
          email: f.email,
          phone: f.phone,
          expertise: f.expertise,
          expertiseEn: f.expertiseEn,
          photo: f.photo,
          bio: f.bio,
          bioEn: f.bioEn
        })),
        announcements: announcements.slice(0, 10),
        timestamp: Date.now()
      };

      const jsonString = JSON.stringify(payload);
      const encoded = btoa(unescape(encodeURIComponent(jsonString)));
      const base = originOverride || (typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '');
      // Use #sync= for unlimited URL length in modern browsers & smart TVs
      return `${base}#sync=${encoded}`;
    } catch (err) {
      console.warn('generateTvSyncUrl error:', err);
      return typeof window !== 'undefined' ? window.location.href : '';
    }
  };

  // Full Signage Backup Export (.json)
  const exportFullBackup = () => {
    try {
      const backupData = {
        app: "POLIMDO Digital Signage",
        version: "2.0",
        exportedAt: new Date().toISOString(),
        videos: videos.map(v => ({ ...v, url: v.rawUrl || v.url })),
        schedules,
        faculty,
        announcements,
        inventory,
        labZones
      };
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `POLIMDO_Signage_Backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.warn("Export backup error:", err);
    }
  };

  // Full Signage Backup Import (.json)
  const importFullBackup = (backupData) => {
    try {
      if (!backupData || typeof backupData !== 'object') return false;
      if (Array.isArray(backupData.videos)) {
        setVideos(backupData.videos);
        try { localStorage.setItem('polimdo_cached_videos', JSON.stringify(backupData.videos)); } catch {}
      }
      if (Array.isArray(backupData.schedules)) {
        setSchedules(backupData.schedules);
        try { localStorage.setItem('polimdo_cached_schedules', JSON.stringify(backupData.schedules)); } catch {}
      }
      if (Array.isArray(backupData.faculty)) {
        setFaculty(backupData.faculty);
        try { localStorage.setItem('polimdo_cached_faculty', JSON.stringify(backupData.faculty)); } catch {}
      }
      if (Array.isArray(backupData.announcements)) {
        setAnnouncements(backupData.announcements);
        try { localStorage.setItem('polimdo_cached_announcements', JSON.stringify(backupData.announcements)); } catch {}
      }
      if (Array.isArray(backupData.inventory)) {
        setInventory(backupData.inventory);
        try { localStorage.setItem('polimdo_cached_inventory', JSON.stringify(backupData.inventory)); } catch {}
      }
      if (Array.isArray(backupData.labZones)) {
        setLabZones(backupData.labZones);
        try { localStorage.setItem('polimdo_cached_lab_zones', JSON.stringify(backupData.labZones)); } catch {}
      }
      return true;
    } catch (err) {
      console.warn("Import backup error:", err);
      return false;
    }
  };

  return (
    <DataContext.Provider
      value={{
        schedules,
        faculty,
        videos,
        announcements,
        inventory,
        bookings,
        labZones,
        loading,
        refetch: fetchAllData,
        addSchedule,
        updateSchedule,
        deleteSchedule,
        importSchedulesFromExcel,
        addFaculty,
        updateFaculty,
        deleteFaculty,
        uploadFacultyPhoto,
        uploadVideoFile,
        uploadVideoThumbnail,
        addVideo,
        updateVideo,
        deleteVideo,
        addAnnouncement,
        updateAnnouncement,
        deleteAnnouncement,
        addInventoryItem,
        updateInventoryItem,
        deleteInventoryItem,
        submitBookingRequest,
        updateBookingStatus,
        updateLabZone,
        generateTvSyncUrl,
        exportFullBackup,
        importFullBackup
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}


