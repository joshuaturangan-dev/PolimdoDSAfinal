import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext.jsx';

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

  // Fetch all initial data
  const fetchAllData = useCallback(async () => {
    try {
      const [
        resSch,
        resFac,
        resVid,
        resAnn,
        resInv,
        resBk,
        resZn
      ] = await Promise.all([
        fetch('/api/schedules').then(r => r.json()),
        fetch('/api/faculty').then(r => r.json()),
        fetch('/api/videos').then(r => r.json()),
        fetch('/api/announcements').then(r => r.json()),
        fetch('/api/inventory').then(r => r.json()),
        fetch('/api/inventory/bookings').then(r => r.json()),
        fetch('/api/lab-zones').then(r => r.json())
      ]);

      if (resSch.success) setSchedules(resSch.data);
      if (resFac.success) setFaculty(resFac.data);
      if (resVid.success) setVideos(resVid.data);
      if (resAnn.success) setAnnouncements(resAnn.data);
      if (resInv.success) setInventory(resInv.data);
      if (resBk.success) setBookings(resBk.data);
      if (resZn.success) setLabZones(resZn.data);
    } catch (err) {
      console.error('Failed to fetch signage data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
    // Auto refresh data every 30 seconds
    const interval = setInterval(fetchAllData, 30000);
    return () => clearInterval(interval);
  }, [fetchAllData]);

  // Auth header helper
  const authHeaders = () => ({
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  });

  // Schedule operations
  const addSchedule = async (scheduleData) => {
    const res = await fetch('/api/schedules', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(scheduleData)
    });
    const result = await res.json();
    if (result.success) await fetchAllData();
    return result;
  };

  const updateSchedule = async (id, scheduleData) => {
    const res = await fetch(`/api/schedules/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(scheduleData)
    });
    const result = await res.json();
    if (result.success) await fetchAllData();
    return result;
  };

  const deleteSchedule = async (id) => {
    const res = await fetch(`/api/schedules/${id}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    const result = await res.json();
    if (result.success) await fetchAllData();
    return result;
  };

  const importSchedulesFromExcel = async (items, mode = 'append') => {
    const res = await fetch('/api/schedules/import-excel', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ items, mode })
    });
    const result = await res.json();
    if (result.success) await fetchAllData();
    return result;
  };

  // Faculty operations
  const addFaculty = async (facultyData) => {
    const res = await fetch('/api/faculty', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(facultyData)
    });
    const result = await res.json();
    if (result.success) await fetchAllData();
    return result;
  };

  const updateFaculty = async (id, facultyData) => {
    const res = await fetch(`/api/faculty/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(facultyData)
    });
    const result = await res.json();
    if (result.success) await fetchAllData();
    return result;
  };

  const deleteFaculty = async (id) => {
    const res = await fetch(`/api/faculty/${id}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    const result = await res.json();
    if (result.success) await fetchAllData();
    return result;
  };

  const uploadFacultyPhoto = async (file) => {
    const formData = new FormData();
    formData.append('photo', file);
    const res = await fetch('/api/faculty/upload-photo', {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: formData
    });
    return await res.json();
  };

  // Video operations
  const uploadVideoFile = async (file) => {
    const formData = new FormData();
    formData.append('videoFile', file);
    const res = await fetch('/api/videos/upload-video', {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: formData
    });
    return await res.json();
  };

  const uploadVideoThumbnail = async (file) => {
    const formData = new FormData();
    formData.append('thumbnailFile', file);
    const res = await fetch('/api/videos/upload-thumbnail', {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: formData
    });
    return await res.json();
  };

  const addVideo = async (videoData) => {
    const res = await fetch('/api/videos', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(videoData)
    });
    const result = await res.json();
    if (result.success) await fetchAllData();
    return result;
  };

  const updateVideo = async (id, videoData) => {
    const res = await fetch(`/api/videos/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(videoData)
    });
    const result = await res.json();
    if (result.success) await fetchAllData();
    return result;
  };

  const deleteVideo = async (id) => {
    const res = await fetch(`/api/videos/${id}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    const result = await res.json();
    if (result.success) await fetchAllData();
    return result;
  };

  // Announcement operations
  const addAnnouncement = async (annData) => {
    const res = await fetch('/api/announcements', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(annData)
    });
    const result = await res.json();
    if (result.success) await fetchAllData();
    return result;
  };

  const updateAnnouncement = async (id, annData) => {
    const res = await fetch(`/api/announcements/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(annData)
    });
    const result = await res.json();
    if (result.success) await fetchAllData();
    return result;
  };

  const deleteAnnouncement = async (id) => {
    const res = await fetch(`/api/announcements/${id}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    const result = await res.json();
    if (result.success) await fetchAllData();
    return result;
  };

  // Inventory & Booking operations
  const addInventoryItem = async (itemData) => {
    const res = await fetch('/api/inventory', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(itemData)
    });
    const result = await res.json();
    if (result.success) await fetchAllData();
    return result;
  };

  const updateInventoryItem = async (id, itemData) => {
    const res = await fetch(`/api/inventory/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(itemData)
    });
    const result = await res.json();
    if (result.success) await fetchAllData();
    return result;
  };

  const deleteInventoryItem = async (id) => {
    const res = await fetch(`/api/inventory/${id}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    const result = await res.json();
    if (result.success) await fetchAllData();
    return result;
  };

  const submitBookingRequest = async (bookingData) => {
    const res = await fetch('/api/inventory/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData)
    });
    const result = await res.json();
    if (result.success) await fetchAllData();
    return result;
  };

  const updateBookingStatus = async (id, status, notes = '') => {
    const res = await fetch(`/api/inventory/bookings/${id}/status`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ status, notes })
    });
    const result = await res.json();
    if (result.success) await fetchAllData();
    return result;
  };

  // Lab Zones
  const updateLabZone = async (id, zoneData) => {
    const res = await fetch(`/api/lab-zones/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(zoneData)
    });
    const result = await res.json();
    if (result.success) await fetchAllData();
    return result;
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
