-- ==========================================
-- POLIMDO D4 TEKNIK LISTRIK - SUPABASE SCHEMA
-- ==========================================

-- 1. TABEL USERS (ADMIN & DOSEN)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  email TEXT
);

-- 2. TABEL JADWAL KULIAH
CREATE TABLE IF NOT EXISTS schedules (
  id TEXT PRIMARY KEY,
  day TEXT NOT NULL,
  day_en TEXT,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  course TEXT NOT NULL,
  course_en TEXT,
  code TEXT,
  lecturer TEXT NOT NULL,
  room TEXT NOT NULL,
  class_group TEXT,
  semester TEXT,
  session TEXT
);

-- 3. TABEL PROFIL DOSEN & STAF
CREATE TABLE IF NOT EXISTS faculty (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT,
  title_en TEXT,
  nip TEXT,
  nidn TEXT,
  role TEXT,
  role_en TEXT,
  room TEXT,
  email TEXT,
  phone TEXT,
  expertise TEXT,
  expertise_en TEXT,
  photo TEXT,
  bio TEXT,
  bio_en TEXT
);

-- 4. TABEL INVENTARIS ALAT LAB
CREATE TABLE IF NOT EXISTS inventory (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_en TEXT,
  code TEXT,
  category TEXT,
  category_en TEXT,
  brand TEXT,
  model TEXT,
  total_qty INT DEFAULT 1,
  available_qty INT DEFAULT 1,
  borrowed_qty INT DEFAULT 0,
  maintenance_qty INT DEFAULT 0,
  location TEXT,
  condition TEXT DEFAULT 'Baik',
  specs TEXT,
  specs_en TEXT,
  safety_rating TEXT,
  image TEXT,
  allowed_roles TEXT
);

-- 5. TABEL PEMINJAMAN ALAT MAHASISWA
CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  item_id TEXT,
  item_name TEXT NOT NULL,
  borrower_name TEXT NOT NULL,
  borrower_id TEXT NOT NULL,
  borrower_role TEXT NOT NULL,
  borrower_class TEXT,
  borrow_date TEXT,
  expected_return_date TEXT,
  actual_return_date TEXT,
  quantity INT DEFAULT 1,
  purpose TEXT,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  approved_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABEL INFORMASI AKADEMIK & PENGUMUMAN
CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  title_en TEXT,
  content TEXT NOT NULL,
  content_en TEXT,
  priority TEXT DEFAULT 'normal',
  category TEXT DEFAULT 'Akademik',
  category_en TEXT DEFAULT 'Academic',
  date DATE DEFAULT CURRENT_DATE,
  valid_until DATE,
  author TEXT
);

-- 7. TABEL MEDIA VIDEO KAMPUS
CREATE TABLE IF NOT EXISTS videos (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  title_en TEXT,
  category TEXT,
  category_en TEXT,
  duration TEXT,
  duration_sec INT DEFAULT 0,
  url TEXT NOT NULL,
  thumbnail TEXT,
  description TEXT,
  description_en TEXT,
  featured BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  loop BOOLEAN DEFAULT true,
  "order" INT DEFAULT 1,
  upload_date DATE DEFAULT CURRENT_DATE
);

-- 8. TABEL ZONA & MEJA PRAKTIKUM LAB
CREATE TABLE IF NOT EXISTS lab_zones (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  status TEXT DEFAULT 'available',
  current_activity TEXT,
  current_activity_en TEXT,
  supervisor TEXT,
  max_capacity INT DEFAULT 30,
  current_occupancy INT DEFAULT 0,
  equipment_count INT DEFAULT 0,
  safety_level TEXT DEFAULT 'Sedang',
  bbox JSONB
);

-- DISABLE RLS (AGAR BACKEND DAPAT MEMBACA DAN MENULIS DATA DENGAN LANCAR)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE faculty DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE announcements DISABLE ROW LEVEL SECURITY;
ALTER TABLE videos DISABLE ROW LEVEL SECURITY;
ALTER TABLE lab_zones DISABLE ROW LEVEL SECURITY;

-- SEED AKUN UTAMA (ADMIN & DOSEN)
INSERT INTO users (id, username, password, name, role, email) VALUES 
('u_admin', 'admin', 'Polimdotekniklistrik12-', 'Administrator Akademik & Lab', 'admin', 'admin.lablistrik@polimdo.ac.id'),
('u_dosen', 'dosen', 'Dosenpolimdo18-', 'Dr. Eng. Arthur Sanger, S.T., M.T. (Dosen Pengampu)', 'dosen', 'dosen.lablistrik@polimdo.ac.id')
ON CONFLICT (username) DO NOTHING;

