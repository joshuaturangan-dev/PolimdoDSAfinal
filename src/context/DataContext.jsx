import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext.jsx";
import { getApiUrl } from "../lib/api.js";
import { supabase } from "../lib/supabaseClient.js";

const DataContext = createContext();

export function DataProvider({ children }) {
  const { token } = useAuth();

  const [schedules, setSchedules] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [videos, setVideos] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [labZones, setLabZones] = useState([]);
  const [loading, setLoading] = useState(true);

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

          if (schData?.length) {
            setSchedules(schData.map(s => ({
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
            })));
          }

          if (facData?.length) {
            setFaculty(facData.map(f => ({
              id: f.id,
              name: f.name,
              title: f.title,
              titleEn: f.title_en,
              nip: f.nip,
              nidn: f.nidn,
              role: f.role,
              roleEn: f.role_en,
              room: f.room,
              email: f.email,
              phone: f.phone,
              expertise: f.expertise,
              expertiseEn: f.expertise_en,
              photo: f.photo,
              bio: f.bio,
              bioEn: f.bio_en
            })));
          }

          if (vidData?.length) {
            setVideos(vidData.map(v => ({
              id: v.id,
              title: v.title,
              titleEn: v.title_en || v.titleEn || v.title,
              category: v.category || 'safety',
              categoryEn: v.category_en || v.categoryEn || 'Lab Safety',
              categoryName: v.category === 'safety' ? 'K3 Laboratorium' : v.category === 'course_promo' ? 'Profil Prodi & Lab' : v.category === 'tutorial' ? 'Tutorial & Panduan' : 'Edukasi Listrik',
              duration: v.duration || '03:00',
              durationSec: v.duration_sec || v.durationSec || 180,
              url: v.url,
              thumbnail: v.thumbnail || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
              description: v.description || '',
              descriptionEn: v.description_en || v.descriptionEn || '',
              featured: Boolean(v.featured),
              active: v.active !== false && v.is_active !== false,
              isActive: v.active !== false && v.is_active !== false && v.isActive !== false,
              loop: v.loop !== false,
              order: v.order || 1,
              scheduleSlot: 'Rotasi Teratur'
            })));
          }

          if (annData?.length) {
            setAnnouncements(annData.map(a => ({
              id: a.id,
              title: a.title,
              titleEn: a.title_en,
              content: a.content,
              contentEn: a.content_en,
              priority: a.priority,
              category: a.category,
              categoryEn: a.category_en,
              date: a.date,
              validUntil: a.valid_until,
              author: a.author
            })));
          }

          if (invData?.length) {
            setInventory(invData.map(i => ({
              id: i.id,
              name: i.name,
              nameEn: i.name_en,
              code: i.code,
              category: i.category,
              categoryEn: i.category_en,
              brand: i.brand,
              model: i.model,
              totalQty: i.total_qty,
              availableQty: i.available_qty,
              borrowedQty: i.borrowed_qty,
              maintenanceQty: i.maintenance_qty,
              location: i.location,
              condition: i.condition,
              specs: i.specs,
              specsEn: i.specs_en,
              safetyRating: i.safety_rating,
              image: i.image,
              allowedRoles: i.allowed_roles
            })));
          }

          if (bkData) setBookings(bkData);

          if (lzData?.length) {
            setLabZones(lzData.map(z => ({
              id: z.id,
              name: z.name,
              code: z.code,
              status: z.status,
              currentActivity: z.current_activity,
              currentActivityEn: z.current_activity_en,
              supervisor: z.supervisor,
              maxCapacity: z.max_capacity,
              currentOccupancy: z.current_occupancy,
              equipmentCount: z.equipment_count,
              safetyLevel: z.safety_level,
              bbox: z.bbox
            })));
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

      if (results[0].status === "fulfilled" && results[0].value?.success) setSchedules(results[0].value.data);
      if (results[1].status === "fulfilled" && results[1].value?.success) setFaculty(results[1].value.data);
      if (results[2].status === "fulfilled" && results[2].value?.success) setVideos(results[2].value.data);
      if (results[3].status === "fulfilled" && results[3].value?.success) setAnnouncements(results[3].value.data);
      if (results[4].status === "fulfilled" && results[4].value?.success) setInventory(results[4].value.data);
      if (results[5].status === "fulfilled" && results[5].value?.success) setBookings(results[5].value.data);
      if (results[6].status === "fulfilled" && results[6].value?.success) setLabZones(results[6].value.data);
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
    const newId = `sch_${Date.now()}`;
    const newObj = { ...scheduleData, id: newId };
    setSchedules(prev => [...prev, newObj]);

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
      } catch (e) { console.warn("Supabase schedule insert error:", e); }
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
    setSchedules(prev => prev.map(s => s.id === id ? { ...s, ...scheduleData } : s));

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
      } catch (e) { console.warn("Supabase schedule update error:", e); }
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
    setSchedules(prev => prev.filter(s => s.id !== id));

    if (supabase) {
      try {
        await supabase.from("schedules").delete().eq("id", id);
      } catch (e) { console.warn("Supabase schedule delete error:", e); }
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
    if (mode === "replace") {
      setSchedules(items);
      if (supabase) {
        try {
          await supabase.from("schedules").delete().neq("id", "0");
        } catch {}
      }
    } else {
      setSchedules(prev => [...prev, ...items]);
    }

    if (supabase) {
      try {
        const rows = items.map(s => ({
          id: s.id || `sch_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
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
      } catch (e) { console.warn("Supabase excel import error:", e); }
    }

    try {
      await fetch(getApiUrl("/api/schedules/import-excel"), {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ items, mode })
      });
    } catch {}

    return { success: true };
  };

  // Faculty operations
  const addFaculty = async (facultyData) => {
    const newId = `fac_${Date.now()}`;
    const newObj = { ...facultyData, id: newId };
    setFaculty(prev => [...prev, newObj]);

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
      } catch (e) { console.warn("Supabase faculty insert error:", e); }
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
    setFaculty(prev => prev.map(f => f.id === id ? { ...f, ...facultyData } : f));

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
      } catch (e) { console.warn("Supabase faculty update error:", e); }
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
    setFaculty(prev => prev.filter(f => f.id !== id));

    if (supabase) {
      try {
        await supabase.from("faculty").delete().eq("id", id);
      } catch (e) { console.warn("Supabase faculty delete error:", e); }
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
    const formData = new FormData();
    formData.append("photo", file);
    try {
      const res = await fetch(getApiUrl("/api/faculty/upload-photo"), {
        method: "POST",
        headers: { ...(token ? { "Authorization": `Bearer ${token}` } : {}) },
        body: formData
      });
      return await res.json();
    } catch {
      return { success: true, url: URL.createObjectURL(file) };
    }
  };

  // Video operations
  const uploadVideoFile = async (file) => {
    const formData = new FormData();
    formData.append("videoFile", file);
    try {
      const res = await fetch(getApiUrl("/api/videos/upload-video"), {
        method: "POST",
        headers: { ...(token ? { "Authorization": `Bearer ${token}` } : {}) },
        body: formData
      });
      return await res.json();
    } catch {
      return { success: true, url: URL.createObjectURL(file) };
    }
  };

  const uploadVideoThumbnail = async (file) => {
    const formData = new FormData();
    formData.append("thumbnailFile", file);
    try {
      const res = await fetch(getApiUrl("/api/videos/upload-thumbnail"), {
        method: "POST",
        headers: { ...(token ? { "Authorization": `Bearer ${token}` } : {}) },
        body: formData
      });
      return await res.json();
    } catch {
      return { success: true, url: URL.createObjectURL(file) };
    }
  };

  const addVideo = async (videoData) => {
    const newId = `vid_${Date.now()}`;
    const newObj = { ...videoData, id: newId };
    setVideos(prev => [...prev, newObj]);

    if (supabase) {
      try {
        await supabase.from("videos").insert({
          id: newId,
          title: newObj.title,
          title_en: newObj.titleEn,
          category: newObj.category,
          category_en: newObj.categoryEn,
          duration: newObj.duration,
          duration_sec: newObj.durationSec,
          url: newObj.url,
          thumbnail: newObj.thumbnail,
          description: newObj.description,
          description_en: newObj.descriptionEn,
          featured: newObj.featured || false,
          active: newObj.active !== false,
          loop: newObj.loop !== false,
          order: newObj.order || 1
        });
      } catch (e) { console.warn("Supabase video insert error:", e); }
    }

    try {
      await fetch(getApiUrl("/api/videos"), {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(newObj)
      });
    } catch {}

    return { success: true, data: newObj };
  };

  const updateVideo = async (id, videoData) => {
    setVideos(prev => prev.map(v => v.id === id ? { ...v, ...videoData } : v));

    if (supabase) {
      try {
        await supabase.from("videos").update({
          title: videoData.title,
          title_en: videoData.titleEn,
          category: videoData.category,
          category_en: videoData.categoryEn,
          duration: videoData.duration,
          duration_sec: videoData.durationSec,
          url: videoData.url,
          thumbnail: videoData.thumbnail,
          description: videoData.description,
          description_en: videoData.descriptionEn,
          featured: videoData.featured,
          active: videoData.active,
          loop: videoData.loop,
          order: videoData.order
        }).eq("id", id);
      } catch (e) { console.warn("Supabase video update error:", e); }
    }

    try {
      await fetch(getApiUrl(`/api/videos/${id}`), {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(videoData)
      });
    } catch {}

    return { success: true };
  };

  const deleteVideo = async (id) => {
    setVideos(prev => prev.filter(v => v.id !== id));

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
    const newId = `ann_${Date.now()}`;
    const newObj = {
      ...annData,
      id: newId,
      date: annData.date || new Date().toISOString().split("T")[0]
    };
    setAnnouncements(prev => [newObj, ...prev]);

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
      } catch (e) { console.warn("Supabase announcement insert error:", e); }
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
    setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, ...annData } : a));

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
      } catch (e) { console.warn("Supabase announcement update error:", e); }
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
    setAnnouncements(prev => prev.filter(a => a.id !== id));

    if (supabase) {
      try {
        await supabase.from("announcements").delete().eq("id", id);
      } catch (e) { console.warn("Supabase announcement delete error:", e); }
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
    const newId = `inv_${Date.now()}`;
    const newObj = { ...itemData, id: newId };
    setInventory(prev => [...prev, newObj]);

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
      } catch (e) { console.warn("Supabase inventory insert error:", e); }
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
    setInventory(prev => prev.map(i => i.id === id ? { ...i, ...itemData } : i));

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
      } catch (e) { console.warn("Supabase inventory update error:", e); }
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
    setInventory(prev => prev.filter(i => i.id !== id));

    if (supabase) {
      try {
        await supabase.from("inventory").delete().eq("id", id);
      } catch (e) { console.warn("Supabase inventory delete error:", e); }
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
    const newId = `bk_${Date.now()}`;
    const newObj = { ...bookingData, id: newId, status: "pending", createdAt: new Date().toISOString() };
    setBookings(prev => [newObj, ...prev]);

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
      } catch (e) { console.warn("Supabase booking insert error:", e); }
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
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status, notes } : b));

    if (supabase) {
      try {
        await supabase.from("bookings").update({ status, notes }).eq("id", id);
      } catch (e) { console.warn("Supabase booking status update error:", e); }
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
    setLabZones(prev => prev.map(z => z.id === id ? { ...z, ...zoneData } : z));

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
      } catch (e) { console.warn("Supabase lab_zone update error:", e); }
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
        updateLabZone
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}

