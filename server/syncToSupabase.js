import { supabase, isSupabaseConfigured } from "./supabase.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function syncAll() {
  if (!isSupabaseConfigured) {
    console.error("? SUPABASE_URL atau SUPABASE_KEY belum diisi di .env.local");
    return;
  }

  const raw = fs.readFileSync(path.join(__dirname, "data_store.json"), "utf8");
  const data = JSON.parse(raw);

  console.log("?? Memulai sinkronisasi data ke Supabase...");

  try {
    // 1. Users
    if (data.users?.length) {
      const { error } = await supabase.from("users").upsert(data.users);
      if (error) console.error("Error users:", error.message);
      else console.log(`? Users tersinkron (${data.users.length} akun)`);
    }

    // 2. Schedules
    if (data.schedules?.length) {
      const schData = data.schedules.map(s => ({
        id: s.id,
        day: s.day,
        day_en: s.dayEn,
        start_time: s.startTime,
        end_time: s.endTime,
        course_code: s.courseCode || s.code,
        course_name: s.courseName || s.course || 'Praktikum',
        course_name_en: s.courseNameEn || s.courseEn,
        lecturer: s.lecturer,
        class_name: s.className || s.classGroup,
        semester: typeof s.semester === 'number' ? s.semester : parseInt(s.semester) || 1,
        room: s.room,
        credits: typeof s.credits === 'number' ? s.credits : parseInt(s.credits) || 3,
        topic: s.topic || '',
        upcoming_task: s.upcomingTask || '',
        academic_year: s.academicYear || '2025/2026 Ganjil',
        color: s.color || 'blue'
      }));
      const { error } = await supabase.from("schedules").upsert(schData);
      if (error) console.error("Error schedules:", error.message);
      else console.log(`✅ Schedules tersinkron (${schData.length} jadwal kuliah)`);
    }

    // 3. Faculty
    if (data.faculty?.length) {
      const facData = data.faculty.map(f => ({
        id: f.id,
        name: f.name,
        title: f.title,
        title_en: f.titleEn,
        nip: f.nip,
        nidn: f.nidn,
        role: f.role,
        role_en: f.roleEn,
        room: f.room,
        email: f.email,
        phone: f.phone,
        expertise: f.expertise,
        expertise_en: f.expertiseEn,
        photo: f.photo,
        bio: f.bio,
        bio_en: f.bioEn
      }));
      const { error } = await supabase.from("faculty").upsert(facData);
      if (error) console.error("Error faculty:", error.message);
      else console.log(`? Faculty tersinkron (${facData.length} dosen)`);
    }

    // 4. Inventory
    if (data.inventory?.length) {
      const invData = data.inventory.map(i => ({
        id: i.id,
        name: i.name,
        name_en: i.nameEn,
        code: i.code,
        category: i.category,
        category_en: i.categoryEn,
        brand: i.brand,
        model: i.model,
        total_qty: i.totalQty,
        available_qty: i.availableQty,
        borrowed_qty: i.borrowedQty,
        maintenance_qty: i.maintenanceQty,
        location: i.location,
        condition: i.condition,
        specs: i.specs,
        specs_en: i.specsEn,
        safety_rating: i.safetyRating,
        image: i.image,
        allowed_roles: i.allowedRoles
      }));
      const { error } = await supabase.from("inventory").upsert(invData);
      if (error) console.error("Error inventory:", error.message);
      else console.log(`? Inventory tersinkron (${invData.length} alat)`);
    }

    // 5. Announcements
    if (data.announcements?.length) {
      const annData = data.announcements.map(a => ({
        id: a.id,
        title: a.title,
        title_en: a.titleEn,
        content: a.content,
        content_en: a.contentEn,
        priority: a.priority,
        category: a.category,
        category_en: a.categoryEn,
        date: a.date,
        valid_until: a.validUntil,
        author: a.author
      }));
      const { error } = await supabase.from("announcements").upsert(annData);
      if (error) console.error("Error announcements:", error.message);
      else console.log(`? Announcements tersinkron (${annData.length} pengumuman)`);
    }

    // 6. Videos
    if (data.videos?.length) {
      const vidData = data.videos.map(v => ({
        id: v.id,
        title: v.title,
        title_en: v.titleEn,
        category: v.category,
        category_en: v.categoryEn,
        duration: v.duration,
        duration_sec: v.durationSec,
        url: v.url,
        thumbnail: v.thumbnail,
        description: v.description,
        description_en: v.descriptionEn,
        featured: v.featured,
        active: v.active,
        loop: v.loop,
        order: v.order,
        upload_date: v.uploadDate
      }));
      const { error } = await supabase.from("videos").upsert(vidData);
      if (error) console.error("Error videos:", error.message);
      else console.log(`? Videos tersinkron (${vidData.length} video)`);
    }

    // 7. Lab Zones
    if (data.labZones?.length) {
      const lzData = data.labZones.map(z => ({
        id: z.id,
        name: z.name,
        code: z.code,
        status: z.status,
        current_activity: z.currentActivity,
        current_activity_en: z.currentActivityEn,
        supervisor: z.supervisor,
        max_capacity: z.maxCapacity,
        current_occupancy: z.currentOccupancy,
        equipment_count: z.equipmentCount,
        safety_level: z.safetyLevel,
        bbox: z.bbox
      }));
      const { error } = await supabase.from("lab_zones").upsert(lzData);
      if (error) console.error("Error lab_zones:", error.message);
      else console.log(`? Lab Zones tersinkron (${lzData.length} zona ruangan)`);
    }

    console.log("?? Sinkronisasi seluruh data ke Supabase berhasil!");
  } catch (err) {
    console.error("Error sinkronisasi:", err.message);
  }
}

syncAll();

