-- ==============================================================================
-- POLIMDO D4 TEKNIK LISTRIK - DIGITAL SIGNAGE SUPABASE DATABASE SCHEMA
-- ==============================================================================

-- 1. TABEL JADWAL KULIAH (SCHEDULES)
CREATE TABLE IF NOT EXISTS public.schedules (
    id TEXT PRIMARY KEY,
    day TEXT NOT NULL,
    day_en TEXT,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    course_code TEXT,
    course_name TEXT NOT NULL,
    course_name_en TEXT,
    lecturer TEXT NOT NULL,
    class_name TEXT NOT NULL,
    semester INTEGER DEFAULT 1,
    room TEXT,
    credits INTEGER DEFAULT 3,
    topic TEXT,
    upcoming_task TEXT,
    academic_year TEXT DEFAULT '2025/2026 Ganjil',
    color TEXT DEFAULT 'blue',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABEL PROFIL DOSEN (FACULTY)
CREATE TABLE IF NOT EXISTS public.faculty (
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
    bio_en TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABEL PLAYLIST VIDEO (VIDEOS)
CREATE TABLE IF NOT EXISTS public.videos (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    title_en TEXT,
    category TEXT DEFAULT 'instructional',
    category_en TEXT,
    duration TEXT DEFAULT '03:00',
    duration_sec INTEGER DEFAULT 180,
    url TEXT NOT NULL,
    thumbnail TEXT,
    description TEXT,
    description_en TEXT,
    featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    loop BOOLEAN DEFAULT TRUE,
    "order" INTEGER DEFAULT 1,
    schedule_slot TEXT DEFAULT 'Rotasi Teratur',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABEL PENGUMUMAN (ANNOUNCEMENTS)
CREATE TABLE IF NOT EXISTS public.announcements (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    title_en TEXT,
    content TEXT NOT NULL,
    content_en TEXT,
    priority TEXT DEFAULT 'normal',
    category TEXT DEFAULT 'Akademik',
    category_en TEXT,
    badge TEXT,
    date TEXT,
    valid_until TEXT,
    author TEXT DEFAULT 'Jurusan Teknik Elektro',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABEL INVENTARIS ALAT LAB (INVENTORY)
CREATE TABLE IF NOT EXISTS public.inventory (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    name_en TEXT,
    code TEXT,
    category TEXT DEFAULT 'Alat Ukur / Measurement',
    category_en TEXT,
    brand TEXT,
    model TEXT,
    total_qty INTEGER DEFAULT 1,
    available_qty INTEGER DEFAULT 1,
    borrowed_qty INTEGER DEFAULT 0,
    maintenance_qty INTEGER DEFAULT 0,
    location TEXT DEFAULT 'Laboratorium Listrik',
    condition TEXT DEFAULT 'Baik',
    specs TEXT,
    specs_en TEXT,
    safety_rating TEXT DEFAULT 'Standard Safety',
    image TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABEL PEMINJAMAN ALAT (BOOKINGS)
CREATE TABLE IF NOT EXISTS public.bookings (
    id TEXT PRIMARY KEY,
    item_id TEXT,
    item_name TEXT,
    borrower_name TEXT NOT NULL,
    nim TEXT,
    borrower_id TEXT,
    borrower_role TEXT DEFAULT 'Mahasiswa',
    borrower_class TEXT,
    class_name TEXT,
    phone TEXT,
    start_date TEXT,
    end_date TEXT,
    borrow_date TEXT,
    expected_return_date TEXT,
    return_date TEXT,
    quantity INTEGER DEFAULT 1,
    purpose TEXT,
    notes TEXT,
    status TEXT DEFAULT 'pending',
    approved_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABEL STATUS MEJA & ZONA LAB (LAB_ZONES)
CREATE TABLE IF NOT EXISTS public.lab_zones (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'available',
    current_activity TEXT,
    current_activity_en TEXT,
    supervisor TEXT,
    safety_level TEXT,
    max_capacity INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- KEAMANAN & AKSES DATA (ROW LEVEL SECURITY POLICIES)
-- Mengizinkan pembacaan publik untuk Smart TV/Signage & penulisan dari web client
-- ==============================================================================

ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Access on schedules" ON public.schedules FOR SELECT USING (true);
CREATE POLICY "Public Insert/Update on schedules" ON public.schedules FOR ALL USING (true);

CREATE POLICY "Public Read Access on faculty" ON public.faculty FOR SELECT USING (true);
CREATE POLICY "Public Insert/Update on faculty" ON public.faculty FOR ALL USING (true);

CREATE POLICY "Public Read Access on videos" ON public.videos FOR SELECT USING (true);
CREATE POLICY "Public Insert/Update on videos" ON public.videos FOR ALL USING (true);

CREATE POLICY "Public Read Access on announcements" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "Public Insert/Update on announcements" ON public.announcements FOR ALL USING (true);

CREATE POLICY "Public Read Access on inventory" ON public.inventory FOR SELECT USING (true);
CREATE POLICY "Public Insert/Update on inventory" ON public.inventory FOR ALL USING (true);

CREATE POLICY "Public Read Access on bookings" ON public.bookings FOR SELECT USING (true);
CREATE POLICY "Public Insert/Update on bookings" ON public.bookings FOR ALL USING (true);

CREATE POLICY "Public Read Access on lab_zones" ON public.lab_zones FOR SELECT USING (true);
CREATE POLICY "Public Insert/Update on lab_zones" ON public.lab_zones FOR ALL USING (true);

-- Kolom kompatibilitas tabel videos
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS schedule_slot TEXT DEFAULT 'Rotasi Teratur';

-- ==============================================================================
-- 8. STORAGE BUCKET: VIDEOS (Untuk File Video MP4 Multi-Device di TV, HP, Laptop)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'videos',
    'videos',
    true,
    52428800, -- 50MB (Batas maksimal Free Tier Supabase)
    ARRAY['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Policy agar file video bisa dibaca dan diupload oleh browser/TV
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Public Read Video Objects'
    ) THEN
        CREATE POLICY "Public Read Video Objects" ON storage.objects
            FOR SELECT USING (bucket_id = 'videos');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Public Upload Video Objects'
    ) THEN
        CREATE POLICY "Public Upload Video Objects" ON storage.objects
            FOR INSERT WITH CHECK (bucket_id = 'videos');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Public Update Video Objects'
    ) THEN
        CREATE POLICY "Public Update Video Objects" ON storage.objects
            FOR UPDATE USING (bucket_id = 'videos');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Public Delete Video Objects'
    ) THEN
        CREATE POLICY "Public Delete Video Objects" ON storage.objects
            FOR DELETE USING (bucket_id = 'videos');
    END IF;
END $$;

-- ==============================================================================
-- MIGRASI / PENYESUAIAN KOLOM TABEL BOOKINGS (Untuk database yang sudah dibuat)
-- ==============================================================================
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS borrower_id TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS borrower_role TEXT DEFAULT 'Mahasiswa';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS borrower_class TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS class_name TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS borrow_date TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS expected_return_date TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS return_date TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS approved_by TEXT;

