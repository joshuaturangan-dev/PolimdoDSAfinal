import React, { useState } from 'react';
import { 
  X, 
  Lock, 
  UserCheck, 
  Calendar, 
  Users, 
  Film, 
  Package, 
  Megaphone, 
  FileSpreadsheet, 
  Upload, 
  Download, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Camera, 
  Image as ImageIcon,
  MapPin,
  RefreshCw,
  LogOut,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useData } from '../context/DataContext.jsx';
import { parseExcelFile, downloadSampleExcel, exportSchedulesToExcel } from '../utils/excelHelper.js';
import { generateVideoThumbnail, extractVideoDuration } from '../utils/videoStorage.js';

function extractYouTubeId(url) {
  if (!url || typeof url !== 'string') return null;
  const match = url.trim().match(
    /(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

function extractGoogleDrivePreview(url) {
  if (!url || typeof url !== 'string') return null;
  const clean = url.trim();
  const matchFile = clean.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (matchFile) return `https://drive.google.com/file/d/${matchFile[1]}/preview`;
  const matchId = clean.match(/drive\.google\.com\/(?:open|uc|file)\?(?:.*&)?id=([a-zA-Z0-9_-]+)/);
  if (matchId) return `https://drive.google.com/file/d/${matchId[1]}/preview`;
  return null;
}

export function AdminModal({ onClose }) {
  const { user, isAuthenticated, login, logout } = useAuth();
  const { lang, t } = useLanguage();
  const {
    schedules,
    faculty,
    videos,
    announcements,
    inventory,
    bookings,
    labZones,
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
    updateBookingStatus,
    updateLabZone
  } = useData();

  // Login Form States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Active Tab state & Role-Based Tab Guard
  const [activeTab, setActiveTab] = useState('schedules');

  const isAdmin = user?.role === 'admin';
  const isDosen = user?.role === 'dosen';

  const allowedTabs = isAdmin 
    ? ['announcements', 'videos', 'faculty', 'inventory', 'zones']
    : ['schedules', 'inventory', 'zones'];

  // CurrentTab is guaranteed to always be an allowed tab for the current role
  const currentTab = allowedTabs.includes(activeTab) ? activeTab : allowedTabs[0];

  // Sync activeTab when user changes
  React.useEffect(() => {
    if (!isAuthenticated || !user) return;
    if (user.role === 'admin' && activeTab === 'schedules') {
      setActiveTab('announcements');
    } else if (user.role === 'dosen' && (activeTab === 'faculty' || activeTab === 'announcements' || activeTab === 'videos')) {
      setActiveTab('schedules');
    }
  }, [isAuthenticated, user, activeTab]);

  // Schedule States
  const [scheduleForm, setScheduleForm] = useState(null); // null or obj
  const [excelPreview, setExcelPreview] = useState(null);
  const [excelImportMode, setExcelImportMode] = useState('append'); // append or replace
  const [excelLoading, setExcelLoading] = useState(false);

  // Faculty States
  const [facultyForm, setFacultyForm] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState('');

  // Video States
  const [videoForm, setVideoForm] = useState(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoUploadInfo, setVideoUploadInfo] = useState(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState('');
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [thumbPreviewUrl, setThumbPreviewUrl] = useState('');
  const [videoInputTab, setVideoInputTab] = useState('file'); // 'file' (IndexedDB persistent) or 'url' (YouTube / direct link)

  // Announcement States
  const [annForm, setAnnForm] = useState(null);

  // Inventory States
  const [invForm, setInvForm] = useState(null);

  // Notification Toast
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // Handle Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    const res = await login(username, password);
    setLoginLoading(false);
    if (!res.success) {
      setLoginError(res.message);
    } else {
      if (res.user?.role === 'admin') {
        setActiveTab('announcements');
      } else {
        setActiveTab('schedules');
      }
    }
  };

  // Quick Demo Login Fill
  const fillDemoLogin = (u, p) => {
    setUsername(u);
    setPassword(p);
  };

  // Excel File Upload Handler
  const handleExcelUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setExcelLoading(true);
    try {
      const data = await parseExcelFile(file);
      if (data && data.length > 0) {
        setExcelPreview(data);
        showToast(`Berhasil membaca ${data.length} baris dari Excel!`);
      } else {
        alert('File Excel kosong atau format kolom tidak dikenali.');
      }
    } catch (err) {
      alert('Gagal membaca file Excel: ' + err.message);
    } finally {
      setExcelLoading(false);
    }
  };

  // Commit Excel Import
  const handleCommitExcelImport = async () => {
    if (!excelPreview || excelPreview.length === 0) return;
    setExcelLoading(true);
    try {
      const res = await importSchedulesFromExcel(excelPreview, excelImportMode);
      if (res.success) {
        showToast(`Sukses mengimpor ${excelPreview.length} jadwal ke database!`);
        setExcelPreview(null);
      } else {
        if (res.message && (res.message.includes('Token') || res.message.includes('Sesi') || res.message.includes('Authentication'))) {
          alert('Sesi login Anda telah kedaluwarsa. Silakan login kembali pada formulir login di bawah.');
          logout();
        } else {
          alert(res.message || 'Gagal menyimpan data Excel.');
        }
      }
    } catch (err) {
      alert('Terjadi kesalahan import: ' + err.message);
    } finally {
      setExcelLoading(false);
    }
  };

  // Faculty Photo Upload
  const handlePhotoFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const res = await uploadFacultyPhoto(file);
      if (res.success) {
        setPhotoPreview(res.url);
        if (facultyForm) {
          setFacultyForm({ ...facultyForm, photo: res.url });
        }
        showToast('Foto profil berhasil diunggah!');
      } else {
        alert(res.message || 'Gagal mengunggah foto.');
      }
    } catch (err) {
      alert('Error saat upload foto: ' + err.message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Video Direct File Upload Handler (Permanent IndexedDB Storage)
  const handleVideoFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    setVideoUploadInfo({
      fileName: file.name,
      fileSizeFormatted: `${fileSizeMB} MB`
    });

    setUploadingVideo(true);

    try {
      // 1. Instant local object URL for immediate interactive preview
      const localUrl = URL.createObjectURL(file);
      setVideoPreviewUrl(localUrl);

      // 2. Extract Duration and Thumbnail automatically in parallel
      const [durationInfo, autoThumbBase64] = await Promise.all([
        extractVideoDuration(file),
        generateVideoThumbnail(file)
      ]);

      if (autoThumbBase64 && !thumbPreviewUrl) {
        setThumbPreviewUrl(autoThumbBase64);
      }

      // 3. Save to permanent browser IndexedDB storage
      const res = await uploadVideoFile(file);
      
      const cleanTitle = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");

      setVideoForm(prev => ({
        ...(prev || {}),
        id: res.id || prev?.id || `vid_${Date.now()}`,
        title: prev?.title ? prev.title : cleanTitle,
        titleEn: prev?.titleEn ? prev.titleEn : cleanTitle,
        category: prev?.category || 'instructional',
        categoryEn: prev?.categoryEn || 'Instructional & Practicum',
        duration: durationInfo.duration || '03:00',
        durationSec: durationInfo.durationSec || 180,
        url: res.url, // 'indexeddb://vid_xxx'
        localBlobUrl: localUrl,
        fileBlob: file,
        thumbnail: prev?.thumbnail || autoThumbBase64 || "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
        description: prev?.description || `Video praktikum & pembelajaran: ${file.name}`,
        descriptionEn: prev?.descriptionEn || `Practicum & instructional video: ${file.name}`,
        scheduleSlot: prev?.scheduleSlot || 'Rotasi Teratur',
        active: true,
        featured: false,
        isNew: prev?.isNew !== false
      }));

      showToast(`Video "${file.name}" (${fileSizeMB} MB) berhasil disimpan permanen!`);
    } catch (err) {
      console.error('Error processing video upload:', err);
      alert('Gagal memproses file video: ' + err.message);
    } finally {
      setUploadingVideo(false);
    }
  };

  // Video Custom Thumbnail Upload Handler
  const handleVideoThumbFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setUploadingThumb(true);
    try {
      const res = await uploadVideoThumbnail(file);
      if (res.success) {
        setThumbPreviewUrl(res.url);
        setVideoForm(prev => prev ? ({ ...prev, thumbnail: res.url }) : prev);
        showToast('Thumbnail video berhasil diunggah!');
      } else {
        alert(res.message || 'Gagal mengunggah thumbnail.');
      }
    } catch (err) {
      alert('Error upload thumbnail: ' + err.message);
    } finally {
      setUploadingThumb(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl max-w-5xl w-full h-[90vh] flex flex-col shadow-2xl relative overflow-hidden glass-panel-glow">
        
        {/* Modal Header */}
        <div className="p-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">
                {t('adminDashboard')}
              </h2>
              <p className="text-xs text-slate-400">
                {isAuthenticated 
                  ? `${t('loggedInAs')} ${user?.name} (${user?.role?.toUpperCase()})` 
                  : 'Otentikasi Diperlukan untuk Mengubah Data'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <button
                onClick={logout}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 text-red-300 text-xs font-bold border border-red-500/40 transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t('logout')}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toast Alert */}
        {toastMsg && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xl border border-emerald-400 animate-bounce">
            {toastMsg}
          </div>
        )}

        {/* Content Body: If NOT Authenticated, show Login Form */}
        {!isAuthenticated ? (
          <div className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
            <div className="max-w-md w-full p-6 rounded-2xl bg-slate-950/80 border border-cyan-500/30 shadow-2xl space-y-4">
              
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 mx-auto flex items-center justify-center">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-white">{t('adminLogin')}</h3>
                <p className="text-xs text-slate-400">
                  Masukkan username dan password pengelola lab / dosen.
                </p>
              </div>

              {loginError && (
                <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/40 text-red-300 text-xs">
                  {loginError}
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Username</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin / dosen"
                    className="w-full px-3 py-2 bg-slate-900 text-xs rounded-lg border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 bg-slate-900 text-xs rounded-lg border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-extrabold shadow-lg shadow-cyan-950/50 transition-all disabled:opacity-50"
                >
                  {loginLoading ? 'Memverifikasi...' : 'Masuk ke Panel Pengelola'}
                </button>
              </form>

              {/* Demo Credentials Helper - Only Admin & Dosen */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-center">
                  ⚡ Pilih Akun Login Sesuai Hak Akses Fitur:
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => fillDemoLogin('admin', 'Polimdotekniklistrik12-')}
                    className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 text-left transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-cyan-300 group-hover:text-cyan-200">👑 Admin</span>
                      <span className="text-[9px] bg-cyan-950 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-500/30 font-mono">Polimdotekniklistrik12-</span>
                    </div>
                    <p className="text-[10px] text-slate-300 mt-1 leading-tight">
                      1. Info Akademik & K3<br/>
                      2. Profil Dosen & Foto<br/>
                      3. Inventaris & Alat
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => fillDemoLogin('dosen', 'Dosenpolimdo18-')}
                    className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-emerald-500/40 text-left transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-emerald-300 group-hover:text-emerald-200">👨‍🏫 Dosen</span>
                      <span className="text-[9px] bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30 font-mono">Dosenpolimdo18-</span>
                    </div>
                    <p className="text-[10px] text-slate-300 mt-1 leading-tight">
                      1. Jadwal Kuliah (Excel)<br/>
                      2. Inventaris & Meja Lab
                    </p>
                  </button>
                </div>
              </div>

            </div>
          </div>
        ) : (
          /* Authenticated Admin Management Tabs */
          <div className="flex-1 flex flex-row overflow-hidden min-h-0">
            
            {/* Sidebar Tabs Filtered by Role */}
            <div className="w-56 sm:w-64 bg-slate-950/95 border-r border-slate-800 p-2.5 flex flex-col gap-1.5 overflow-y-auto shrink-0">
              
              {/* Active Role Info Badge */}
              <div className="p-2.5 mb-1 rounded-xl bg-slate-900/90 border border-slate-800">
                <span className="text-[9px] font-black uppercase tracking-wider block text-slate-400">
                  Hak Akses Akun:
                </span>
                <span className={`text-xs font-black flex items-center gap-1.5 mt-0.5 ${
                  user?.role === 'admin' ? 'text-cyan-400' : 'text-emerald-400'
                }`}>
                  {user?.role === 'admin' ? '👑 Administrator Lab' : '👨‍🏫 Dosen Pengampu'}
                </span>
                <p className="text-[10px] text-slate-400 mt-1 leading-tight">
                  {user?.role === 'admin' 
                    ? 'Akses: 1. Info Akademik, 2. Profil Dosen, 3. Inventaris.'
                    : 'Akses: 1. Jadwal Kuliah (Excel), 2. Inventaris & Meja.'}
                </p>
              </div>

              {/* DOSEN ONLY: 1. Manage Schedules */}
              {isDosen && (
                <button
                  onClick={() => setActiveTab('schedules')}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-left transition-all whitespace-nowrap ${
                    currentTab === 'schedules'
                      ? 'bg-cyan-600 text-white shadow-md'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  <span>1. {t('tabManageSchedules') || 'Jadwal Kuliah (Excel)'}</span>
                </button>
              )}

              {/* ADMIN ONLY: 1. Manage Announcements & Academic Info */}
              {isAdmin && (
                <>
                  <button
                    onClick={() => setActiveTab('announcements')}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-left transition-all whitespace-nowrap ${
                      currentTab === 'announcements'
                        ? 'bg-cyan-600 text-white shadow-md'
                        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                    }`}
                  >
                    <Megaphone className="w-4 h-4 text-amber-400" />
                    <span>1. Informasi Akademik & K3</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('videos')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-left transition-all whitespace-nowrap ${
                      currentTab === 'videos'
                        ? 'bg-cyan-600 text-white shadow-md'
                        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                    }`}
                  >
                    <Film className="w-4 h-4 text-blue-400" />
                    <span>• Video Promosi & Info</span>
                  </button>

                  {/* ADMIN ONLY: 2. Manage Faculty Profiles */}
                  <button
                    onClick={() => setActiveTab('faculty')}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-left transition-all whitespace-nowrap ${
                      currentTab === 'faculty'
                        ? 'bg-cyan-600 text-white shadow-md'
                        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                    }`}
                  >
                    <Users className="w-4 h-4 text-emerald-400" />
                    <span>2. {t('tabManageFaculty') || 'Profil Dosen & Staf'}</span>
                  </button>
                </>
              )}

              {/* BOTH ADMIN & DOSEN: Manage Inventory & Zones */}
              <button
                onClick={() => setActiveTab('inventory')}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-left transition-all whitespace-nowrap ${
                  currentTab === 'inventory'
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <Package className="w-4 h-4 text-purple-400" />
                <span>{isAdmin ? '3.' : '2.'} {t('tabManageInventory') || 'Inventaris Alat'}</span>
                {bookings.filter(b => b.status === 'pending').length > 0 && (
                  <span className="ml-auto bg-amber-500 text-black text-[10px] font-black px-1.5 py-0.2 rounded-full">
                    {bookings.filter(b => b.status === 'pending').length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('zones')}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-left transition-all whitespace-nowrap ${
                  currentTab === 'zones'
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <MapPin className="w-4 h-4 text-cyan-400" />
                <span>• Status Meja & Zona Lab</span>
              </button>
            </div>

            {/* Main Tab Panel Content */}
            <div className="flex-1 p-4 overflow-y-auto bg-slate-900/60 min-w-0">
              
              {/* TAB 1: SCHEDULES & EXCEL IMPORT (Dosen) */}
              {currentTab === 'schedules' && (
                <div className="space-y-4">
                  
                  {/* Excel Import & Template Actions Card */}
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-cyan-500/40 shadow-lg space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                        <div>
                          <h4 className="text-sm font-bold text-white">
                            {t('importExcelTitle')}
                          </h4>
                          <p className="text-[11px] text-slate-400">
                            {t('importExcelDesc')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={downloadSampleExcel}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold border border-slate-700 transition-all"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>{t('downloadTemplate')}</span>
                        </button>

                        <button
                          onClick={() => exportSchedulesToExcel(schedules)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 text-xs font-bold border border-emerald-500/40 transition-all"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Ekspor Excel</span>
                        </button>
                      </div>
                    </div>

                    {/* File Upload Input */}
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <label className="flex-1 w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-cyan-500/40 bg-slate-900/50 hover:bg-slate-900 cursor-pointer text-xs text-cyan-300 font-bold transition-all">
                        <Upload className="w-4 h-4 text-cyan-400" />
                        <span>{t('dragDropExcel')}</span>
                        <input
                          type="file"
                          accept=".xlsx, .xls, .csv"
                          onChange={handleExcelUpload}
                          className="hidden"
                        />
                      </label>

                      {excelPreview && (
                        <div className="flex items-center gap-2">
                          <select
                            value={excelImportMode}
                            onChange={(e) => setExcelImportMode(e.target.value)}
                            className="px-3 py-2 bg-slate-950 text-xs rounded-lg border border-slate-700 text-slate-200"
                          >
                            <option value="append">{t('importModeAppend')}</option>
                            <option value="replace">{t('importModeReplace')}</option>
                          </select>

                          <button
                            onClick={handleCommitExcelImport}
                            disabled={excelLoading}
                            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all"
                          >
                            {excelLoading ? 'Memproses...' : t('confirmImport')}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Excel Preview Table */}
                    {excelPreview && (
                      <div className="mt-3 p-3 rounded-lg bg-slate-900 border border-slate-800 overflow-x-auto max-h-48">
                        <span className="text-[10px] font-bold text-cyan-400 uppercase block mb-1">
                          Pratinjau ({excelPreview.length} baris):
                        </span>
                        <table className="w-full text-[11px] text-left text-slate-300">
                          <thead>
                            <tr className="border-b border-slate-800 text-slate-400">
                              <th className="p-1">Hari</th>
                              <th className="p-1">Waktu</th>
                              <th className="p-1">Mata Kuliah</th>
                              <th className="p-1">Dosen</th>
                              <th className="p-1">Kelas</th>
                              <th className="p-1">Ruangan</th>
                            </tr>
                          </thead>
                          <tbody>
                            {excelPreview.map((row, idx) => (
                              <tr key={idx} className="border-b border-slate-800/40">
                                <td className="p-1 font-bold text-cyan-300">{row['Hari'] || row['day'] || 'Senin'}</td>
                                <td className="p-1">{row['Jam Mulai'] || '08:00'} - {row['Jam Selesai'] || '11:30'}</td>
                                <td className="p-1 font-semibold text-white">{row['Mata Kuliah'] || row['courseName']}</td>
                                <td className="p-1">{row['Dosen'] || row['lecturer']}</td>
                                <td className="p-1">{row['Kelas'] || row['className']}</td>
                                <td className="p-1">{row['Ruangan / Meja'] || row['room']}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Add New Schedule Manual Form */}
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Daftar Jadwal Praktikum Aktif ({schedules.length})
                    </h4>

                    <button
                      onClick={() => setScheduleForm({
                        day: 'Senin',
                        startTime: '08:00',
                        endTime: '11:30',
                        courseCode: 'TL-4101',
                        courseName: '',
                        courseNameEn: '',
                        lecturer: '',
                        className: 'D4-TL-3A',
                        semester: 3,
                        room: 'Lab Instalasi Listrik',
                        credits: 3,
                        color: 'blue'
                      })}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Jadwal</span>
                    </button>
                  </div>

                  {/* Schedule Edit/Create Modal Overlay */}
                  {scheduleForm && (
                    <div className="p-4 rounded-xl bg-slate-950 border border-blue-500/40 shadow-xl space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-bold text-white">
                          {scheduleForm.id ? 'Edit Jadwal Praktikum' : 'Tambah Jadwal Praktikum Baru'}
                        </h4>
                        <button onClick={() => setScheduleForm(null)} className="text-slate-400 hover:text-white">
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                        <div>
                          <label className="text-slate-400 block mb-1">Hari</label>
                          <select
                            value={scheduleForm.day}
                            onChange={(e) => setScheduleForm({ ...scheduleForm, day: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-slate-900 rounded border border-slate-700 text-white"
                          >
                            <option value="Senin">Senin</option>
                            <option value="Selasa">Selasa</option>
                            <option value="Rabu">Rabu</option>
                            <option value="Kamis">Kamis</option>
                            <option value="Jumat">Jumat</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-slate-400 block mb-1">Jam Mulai</label>
                          <input
                            type="text"
                            value={scheduleForm.startTime}
                            onChange={(e) => setScheduleForm({ ...scheduleForm, startTime: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-slate-900 rounded border border-slate-700 text-white"
                            placeholder="08:00"
                          />
                        </div>

                        <div>
                          <label className="text-slate-400 block mb-1">Jam Selesai</label>
                          <input
                            type="text"
                            value={scheduleForm.endTime}
                            onChange={(e) => setScheduleForm({ ...scheduleForm, endTime: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-slate-900 rounded border border-slate-700 text-white"
                            placeholder="11:30"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="text-slate-400 block mb-1">Mata Kuliah (Indonesia)</label>
                          <input
                            type="text"
                            value={scheduleForm.courseName}
                            onChange={(e) => setScheduleForm({ ...scheduleForm, courseName: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-slate-900 rounded border border-slate-700 text-white"
                            placeholder="Praktikum Instalasi Tenaga..."
                          />
                        </div>

                        <div>
                          <label className="text-slate-400 block mb-1">Kode MK</label>
                          <input
                            type="text"
                            value={scheduleForm.courseCode}
                            onChange={(e) => setScheduleForm({ ...scheduleForm, courseCode: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-slate-900 rounded border border-slate-700 text-white"
                            placeholder="TL-4101"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="text-slate-400 block mb-1">Dosen Pengampu</label>
                          <input
                            type="text"
                            value={scheduleForm.lecturer}
                            onChange={(e) => setScheduleForm({ ...scheduleForm, lecturer: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-slate-900 rounded border border-slate-700 text-white"
                            placeholder="Dr. Eng. Arthur Sanger, S.T., M.T."
                          />
                        </div>

                        <div>
                          <label className="text-slate-400 block mb-1">Kelas</label>
                          <input
                            type="text"
                            value={scheduleForm.className}
                            onChange={(e) => setScheduleForm({ ...scheduleForm, className: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-slate-900 rounded border border-slate-700 text-white"
                            placeholder="D4-TL-3A"
                          />
                        </div>

                        <div>
                          <label className="text-slate-400 block mb-1">Semester</label>
                          <input
                            type="number"
                            value={scheduleForm.semester}
                            onChange={(e) => setScheduleForm({ ...scheduleForm, semester: Number(e.target.value) })}
                            className="w-full px-2.5 py-1.5 bg-slate-900 rounded border border-slate-700 text-white"
                          />
                        </div>

                        <div>
                          <label className="text-slate-400 block mb-1">SKS</label>
                          <input
                            type="number"
                            value={scheduleForm.credits}
                            onChange={(e) => setScheduleForm({ ...scheduleForm, credits: Number(e.target.value) })}
                            className="w-full px-2.5 py-1.5 bg-slate-900 rounded border border-slate-700 text-white"
                          />
                        </div>

                        <div>
                          <label className="text-slate-400 block mb-1">Ruangan / Meja</label>
                          <input
                            type="text"
                            value={scheduleForm.room}
                            onChange={(e) => setScheduleForm({ ...scheduleForm, room: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-slate-900 rounded border border-slate-700 text-white"
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label className="text-slate-400 block mb-1">Materi / Modul Praktikum Saat Ini (Current Task)</label>
                          <input
                            type="text"
                            value={scheduleForm.topic || ''}
                            onChange={(e) => setScheduleForm({ ...scheduleForm, topic: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-slate-900 rounded border border-slate-700 text-white"
                            placeholder="Contoh: Job 3 - Wiring Motor 3 Phasa Forward-Reverse & Proteksi Overload TOR"
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label className="text-slate-400 block mb-1">Tugas / Modul Praktikum Mendatang (Upcoming Task)</label>
                          <input
                            type="text"
                            value={scheduleForm.upcomingTask || ''}
                            onChange={(e) => setScheduleForm({ ...scheduleForm, upcomingTask: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-slate-900 rounded border border-slate-700 text-white"
                            placeholder="Contoh: Job 4 - Pengujian Panel Distribusi & Pengukuran Tahanan Isolasi Megger"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          onClick={() => setScheduleForm(null)}
                          className="px-3 py-1.5 bg-slate-800 rounded text-xs font-bold text-slate-300"
                        >
                          Batal
                        </button>
                        <button
                          onClick={async () => {
                            if (scheduleForm.id) {
                              await updateSchedule(scheduleForm.id, scheduleForm);
                              showToast('Jadwal berhasil diperbarui!');
                            } else {
                              await addSchedule(scheduleForm);
                              showToast('Jadwal berhasil ditambahkan!');
                            }
                            setScheduleForm(null);
                          }}
                          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-xs font-bold text-white"
                        >
                          Simpan Jadwal
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Schedules Table */}
                  <div className="space-y-2">
                    {schedules.map((sch) => (
                      <div
                        key={sch.id}
                        className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-cyan-400">{sch.day}</span>
                            <span className="text-slate-400 font-mono">{sch.startTime} - {sch.endTime}</span>
                            <span className="text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-500/30">
                              {sch.className}
                            </span>
                          </div>
                          <h5 className="font-bold text-white">{sch.courseName}</h5>
                          <p className="text-[11px] text-slate-400">{sch.lecturer} • {sch.room}</p>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setScheduleForm(sch)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm('Hapus jadwal ini?')) {
                                await deleteSchedule(sch.id);
                                showToast('Jadwal dihapus.');
                              }
                            }}
                            className="p-1.5 rounded-lg bg-red-950 hover:bg-red-900 text-red-400 border border-red-500/30"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              )}

              {/* TAB 2: FACULTY & PHOTO UPLOAD (Admin) */}
              {currentTab === 'faculty' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Daftar Profil Dosen & Staf ({faculty.length})
                    </h4>

                    <button
                      onClick={() => {
                        setFacultyForm({
                          name: '',
                          title: 'Dosen Pengampu',
                          titleEn: 'Lecturer',
                          nip: '',
                          nidn: '',
                          role: 'Dosen',
                          email: '',
                          expertise: '',
                          courses: [],
                          officeHours: 'Senin - Jumat',
                          room: 'Ruang Dosen Elektro',
                          photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
                        });
                        setPhotoPreview('');
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{t('addFaculty')}</span>
                    </button>
                  </div>

                  {/* Faculty Form Modal */}
                  {facultyForm && (
                    <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/40 shadow-xl space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-bold text-white">
                          {facultyForm.id ? 'Edit Data Dosen & Foto' : 'Tambah Profil Dosen Baru'}
                        </h4>
                        <button onClick={() => setFacultyForm(null)} className="text-slate-400 hover:text-white">
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Photo Upload Box */}
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-4">
                        <div className="w-20 h-24 rounded-xl overflow-hidden bg-black border border-cyan-400 shrink-0">
                          <img
                            src={photoPreview || facultyForm.photo}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="flex-1 space-y-1.5">
                          <span className="text-xs font-bold text-white block">
                            {t('uploadPhotoTitle')}
                          </span>
                          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold cursor-pointer transition-all">
                            <Camera className="w-3.5 h-3.5" />
                            <span>{uploadingPhoto ? 'Mengunggah...' : 'Pilih Foto Baru (JPG/PNG)'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handlePhotoFileChange}
                              className="hidden"
                            />
                          </label>
                          <p className="text-[10px] text-slate-400">
                            Foto akan langsung disimpan ke server dan tampil pada Digital Signage.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="text-slate-400 block mb-1">Nama Lengkap & Gelar</label>
                          <input
                            type="text"
                            value={facultyForm.name}
                            onChange={(e) => setFacultyForm({ ...facultyForm, name: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-slate-900 rounded border border-slate-700 text-white"
                          />
                        </div>

                        <div>
                          <label className="text-slate-400 block mb-1">Jabatan / Posisi</label>
                          <input
                            type="text"
                            value={facultyForm.title}
                            onChange={(e) => setFacultyForm({ ...facultyForm, title: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-slate-900 rounded border border-slate-700 text-white"
                          />
                        </div>

                        <div>
                          <label className="text-slate-400 block mb-1">NIP</label>
                          <input
                            type="text"
                            value={facultyForm.nip}
                            onChange={(e) => setFacultyForm({ ...facultyForm, nip: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-slate-900 rounded border border-slate-700 text-white"
                          />
                        </div>

                        <div>
                          <label className="text-slate-400 block mb-1">Email Resmi</label>
                          <input
                            type="email"
                            value={facultyForm.email}
                            onChange={(e) => setFacultyForm({ ...facultyForm, email: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-slate-900 rounded border border-slate-700 text-white"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="text-slate-400 block mb-1">Bidang Keahlian / Riset</label>
                          <input
                            type="text"
                            value={facultyForm.expertise}
                            onChange={(e) => setFacultyForm({ ...facultyForm, expertise: e.target.value, expertiseId: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-slate-900 rounded border border-slate-700 text-white"
                          />
                        </div>

                        <div>
                          <label className="text-slate-400 block mb-1">Jam Konsultasi</label>
                          <input
                            type="text"
                            value={facultyForm.officeHours}
                            onChange={(e) => setFacultyForm({ ...facultyForm, officeHours: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-slate-900 rounded border border-slate-700 text-white"
                          />
                        </div>

                        <div>
                          <label className="text-slate-400 block mb-1">Ruangan Kerja</label>
                          <input
                            type="text"
                            value={facultyForm.room}
                            onChange={(e) => setFacultyForm({ ...facultyForm, room: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-slate-900 rounded border border-slate-700 text-white"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          onClick={() => setFacultyForm(null)}
                          className="px-3 py-1.5 bg-slate-800 rounded text-xs font-bold text-slate-300"
                        >
                          Batal
                        </button>
                        <button
                          onClick={async () => {
                            if (facultyForm.id) {
                              await updateFaculty(facultyForm.id, facultyForm);
                              showToast('Profil dosen berhasil diperbarui!');
                            } else {
                              await addFaculty(facultyForm);
                              showToast('Dosen baru berhasil ditambahkan!');
                            }
                            setFacultyForm(null);
                          }}
                          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-xs font-bold text-white"
                        >
                          {t('saveFaculty')}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Faculty Listing */}
                  <div className="space-y-2">
                    {faculty.map((fac) => (
                      <div
                        key={fac.id}
                        className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={fac.photo}
                            alt={fac.name}
                            className="w-10 h-12 rounded-lg object-cover bg-black border border-slate-700 shrink-0"
                          />
                          <div>
                            <h5 className="font-bold text-white">{fac.name}</h5>
                            <p className="text-[11px] text-cyan-400">{fac.title}</p>
                            <p className="text-[10px] text-slate-400 font-mono">NIP: {fac.nip}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setFacultyForm(fac);
                              setPhotoPreview(fac.photo);
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300"
                            title="Edit & Ganti Foto"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm('Hapus profil dosen ini?')) {
                                await deleteFaculty(fac.id);
                                showToast('Dosen dihapus.');
                              }
                            }}
                            className="p-1.5 rounded-lg bg-red-950 hover:bg-red-900 text-red-400 border border-red-500/30"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              )}

              {/* TAB 3: VIDEOS & PLAYLIST SCHEDULE (Admin) */}
              {currentTab === 'videos' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Daftar Video & Jadwal Tayang ({videos.length})
                    </h4>

                    <button
                      onClick={() => {
                        setVideoForm({
                          title: '',
                          titleEn: '',
                          category: 'instructional',
                          url: '',
                          thumbnail: '',
                          duration: '03:00',
                          description: '',
                          scheduleSlot: 'Rotasi Teratur',
                          isActive: true,
                          isNew: true
                        });
                        setVideoPreviewUrl('');
                        setThumbPreviewUrl('');
                        setVideoUploadInfo(null);
                        setVideoInputTab('file');
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-extrabold shadow-md shadow-cyan-950/40 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Video Baru</span>
                    </button>
                  </div>

                  {videoForm && (
                    <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/40 shadow-2xl space-y-4 text-xs">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                        <div className="flex items-center gap-2">
                          <Film className="w-4 h-4 text-cyan-400" />
                          <h4 className="text-sm font-extrabold text-white">
                            {videoForm.id ? 'Edit Video & Jadwal Tayang' : 'Tambah Video Digital Signage'}
                          </h4>
                        </div>
                        <button 
                          onClick={() => {
                            setVideoForm(null);
                            setVideoPreviewUrl('');
                            setThumbPreviewUrl('');
                          }} 
                          className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Video Source Switcher: YouTube (Multi-device) vs File Upload (Local Device) */}
                      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
                        <button
                          type="button"
                          onClick={() => setVideoInputTab('url')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                            videoInputTab === 'url'
                              ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-cyan-900/40 border border-cyan-400/40'
                              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                          }`}
                        >
                          <span>🌟 Link YouTube / Cloud (Bisa Diputar di SEMUA Device & Smart TV)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setVideoInputTab('file')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                            videoInputTab === 'file'
                              ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-cyan-900/40 border border-cyan-400/40'
                              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                          }`}
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>📁 Upload File Video dari Komputer (Khusus Layar Ini)</span>
                        </button>
                      </div>

                      {/* File Upload Mode */}
                      {videoInputTab === 'file' ? (
                        <div className="space-y-3">
                          <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-[11px] leading-relaxed flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <div>
                              <strong>Penyimpanan Lokal Aktif:</strong> File video tersimpan permanen di penyimpanan peramban (IndexedDB) perangkat ini. Video <strong>tidak akan hilang</strong> saat website ditutup atau di-refresh di laptop/PC ini.
                              <span className="block text-slate-300 mt-1">
                                💡 <em>Tips Multi-Device:</em> Jika Anda ingin video otomatis tayang di <strong>Smart TV, HP, atau Komputer lain</strong> tanpa harus upload file ulang ke masing-masing device, gunakan tab <strong>"Link YouTube / Cloud"</strong>.
                              </span>
                            </div>
                          </div>

                          <label className="block p-4 rounded-xl border-2 border-dashed border-cyan-500/50 bg-cyan-950/20 hover:bg-cyan-950/40 cursor-pointer text-center transition-all group">
                            <Upload className="w-8 h-8 text-cyan-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-black text-cyan-300 block">
                              {uploadingVideo ? 'Menyimpan Video ke Penyimpanan Permanen...' : 'Klik di Sini untuk Memilih File Video dari Folder Anda'}
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-1">
                              Mendukung format: MP4, WebM, MOV (Durasi & Thumbnail otomatis dicuplik)
                            </span>
                            <input
                              type="file"
                              accept="video/*,.mp4,.webm,.mov,.mkv,.avi"
                              onChange={handleVideoFileChange}
                              className="hidden"
                            />
                          </label>

                          {/* Video Upload Status & Live Player Preview */}
                          {(videoPreviewUrl || videoForm.url) && (
                            <div className="p-3 rounded-xl bg-slate-900 border border-cyan-500/30 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                                  {videoUploadInfo ? `${videoUploadInfo.fileName} (${videoUploadInfo.fileSizeFormatted})` : 'Video Terpilih'}
                                </span>
                                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold text-[10px] border border-emerald-500/40">
                                  {uploadingVideo ? 'Sedang Upload...' : '✓ Siap Diputar'}
                                </span>
                              </div>

                              <div className="aspect-video w-full max-h-48 rounded-lg overflow-hidden bg-black border border-slate-700">
                                <video
                                  src={videoPreviewUrl || videoForm.url}
                                  controls
                                  className="w-full h-full object-contain"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div>
                            <label className="text-slate-300 block mb-1 font-bold text-xs">
                              URL File Video (YouTube Link / Direct MP4 / Google Drive)
                            </label>
                            <input
                              type="text"
                              value={videoForm.url}
                              onChange={(e) => {
                                const val = e.target.value;
                                const ytId = extractYouTubeId(val);
                                if (ytId) {
                                  const autoThumb = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
                                  setThumbPreviewUrl(autoThumb);
                                  setVideoForm(prev => prev ? ({
                                    ...prev,
                                    url: val,
                                    thumbnail: prev.thumbnail || autoThumb,
                                    duration: prev.duration || '03:00'
                                  }) : prev);
                                } else {
                                  setVideoForm(prev => prev ? ({ ...prev, url: val }) : prev);
                                }
                              }}
                              className="w-full px-3 py-2 bg-slate-900 rounded-lg border border-slate-700 text-white focus:border-cyan-400 text-xs font-mono"
                              placeholder="https://drive.google.com/file/d/.../view atau https://youtu.be/..."
                            />

                            {extractYouTubeId(videoForm.url) && (
                              <span className="text-[10px] text-emerald-400 font-bold mt-1.5 inline-flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5" />
                                Terdeteksi Link YouTube (Thumbnail Otomatis & Pemutar Siap)
                              </span>
                            )}

                            {extractGoogleDrivePreview(videoForm.url) && (
                              <span className="text-[10px] text-emerald-400 font-bold mt-1.5 inline-flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5" />
                                Terdeteksi Link Google Drive (Mode Embed Pratinjau Siap)
                              </span>
                            )}

                            {/* Google Drive & YouTube Sharing Guide Box */}
                            <div className="mt-2 p-2.5 rounded-lg bg-blue-950/40 border border-blue-500/30 text-[11px] text-blue-200 space-y-1">
                              <span className="font-bold text-cyan-300 block">
                                📌 Cara Mengambil Link Google Drive yang Benar:
                              </span>
                              <ol className="list-decimal list-inside space-y-0.5 text-[10.5px] text-slate-300 pl-1">
                                <li>Buka <strong>Google Drive</strong> dan pilih file video Anda.</li>
                                <li>Klik kanan pada video → pilih <strong>Bagikan (Share)</strong>.</li>
                                <li>Ubah Akses Umum (*General Access*) menjadi <strong>"Siapa saja yang memiliki link" (*Anyone with the link*)</strong>.</li>
                                <li>Klik <strong>Salin Link (*Copy Link*)</strong> lalu tempelkan ke kolom URL di atas.</li>
                              </ol>
                            </div>
                          </div>

                          {/* Live Preview for URL mode */}
                          {videoForm.url && (
                            <div className="p-3 rounded-xl bg-slate-900 border border-cyan-500/30 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                                  Pratinjau Video URL
                                </span>
                                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold text-[10px] border border-emerald-500/40">
                                  ✓ Siap Diputar
                                </span>
                              </div>

                              <div className="aspect-video w-full max-h-48 rounded-lg overflow-hidden bg-black border border-slate-700">
                                {extractYouTubeId(videoForm.url) ? (
                                  <iframe
                                    src={`https://www.youtube.com/embed/${extractYouTubeId(videoForm.url)}?autoplay=0&mute=1&controls=1`}
                                    className="w-full h-full border-0"
                                    allowFullScreen
                                  />
                                ) : extractGoogleDrivePreview(videoForm.url) ? (
                                  <iframe
                                    src={extractGoogleDrivePreview(videoForm.url)}
                                    className="w-full h-full border-0"
                                    allow="autoplay"
                                    allowFullScreen
                                  />
                                ) : (
                                  <video
                                    src={videoForm.url}
                                    controls
                                    className="w-full h-full object-contain"
                                  />
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Thumbnail Selector */}
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                            <Camera className="w-3.5 h-3.5 text-cyan-400" />
                            Thumbnail Video
                          </label>
                          <label className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-[10px] cursor-pointer border border-slate-700 transition-all">
                            <span>{uploadingThumb ? 'Mengunggah...' : '📁 Pilih Gambar dari Folder'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleVideoThumbFileChange}
                              className="hidden"
                            />
                          </label>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-24 h-14 rounded-lg overflow-hidden bg-black border border-slate-700 shrink-0">
                            <img
                              src={thumbPreviewUrl || videoForm.thumbnail || "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80"}
                              alt="Thumbnail Preview"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src = "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80";
                              }}
                            />
                          </div>

                          <div className="flex-1">
                            <input
                              type="text"
                              value={videoForm.thumbnail}
                              onChange={(e) => setVideoForm({ ...videoForm, thumbnail: e.target.value })}
                              placeholder="URL thumbnail atau pilih file dari folder..."
                              className="w-full px-2.5 py-1.5 bg-slate-950 rounded border border-slate-700 text-slate-300 text-xs"
                            />
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              * Thumbnail otomatis dicuplik dari video jika tidak memilih gambar terpisah.
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Video Meta Fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="sm:col-span-2">
                          <label className="text-slate-300 block mb-1 font-bold">Judul Video *</label>
                          <input
                            type="text"
                            required
                            value={videoForm.title}
                            onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })}
                            placeholder="Contoh: Tutorial Praktikum PLC Omron & SCADA..."
                            className="w-full px-3 py-2 bg-slate-900 rounded-lg border border-slate-700 text-white focus:border-cyan-400 font-semibold"
                          />
                        </div>

                        <div>
                          <label className="text-slate-300 block mb-1 font-bold">Kategori Video</label>
                          <select
                            value={videoForm.category}
                            onChange={(e) => setVideoForm({ ...videoForm, category: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-900 rounded-lg border border-slate-700 text-white font-semibold"
                          >
                            <option value="course_promo">Promosi Mata Kuliah</option>
                            <option value="instructional">Video Pembelajaran / Praktikum</option>
                            <option value="k3_safety">K3 & Keselamatan Kerja</option>
                            <option value="campus_ad">Iklan & Info Kampus POLIMDO</option>
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-slate-300 font-bold text-xs">
                              Durasi Tayang Video (MM:SS) *
                            </label>
                            <span className="text-[10px] text-cyan-400">
                              * Waktu sebelum otomatis lanjut ke video berikutnya
                            </span>
                          </div>

                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <input
                              type="text"
                              value={videoForm.duration}
                              onChange={(e) => setVideoForm({ ...videoForm, duration: e.target.value })}
                              className="w-full sm:w-32 px-3 py-1.5 bg-slate-900 rounded-lg border border-slate-700 text-white font-mono text-center text-xs font-bold"
                              placeholder="03:00"
                            />

                            {/* Quick Duration Preset Buttons */}
                            <div className="flex flex-wrap items-center gap-1">
                              {[
                                { label: '30s', val: '00:30' },
                                { label: '1m', val: '01:00' },
                                { label: '2m', val: '02:00' },
                                { label: '3m', val: '03:00' },
                                { label: '5m', val: '05:00' },
                                { label: '10m', val: '10:00' }
                              ].map(p => (
                                <button
                                  key={p.val}
                                  type="button"
                                  onClick={() => setVideoForm(prev => ({ ...prev, duration: p.val }))}
                                  className={`px-2 py-1 rounded text-[11px] font-bold border transition-all ${
                                    videoForm.duration === p.val
                                      ? 'bg-cyan-600 text-white border-cyan-400 shadow-sm'
                                      : 'bg-slate-900 text-slate-400 hover:text-white border-slate-700 hover:border-slate-500'
                                  }`}
                                >
                                  {p.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="text-slate-300 block mb-1 font-bold">Jadwal Tayang / Slot Rotasi</label>
                          <input
                            type="text"
                            value={videoForm.scheduleSlot}
                            onChange={(e) => setVideoForm({ ...videoForm, scheduleSlot: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-900 rounded-lg border border-slate-700 text-white"
                            placeholder="Contoh: 07:45 - 08:15 WITA / Rotasi Teratur"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="text-slate-300 block mb-1 font-bold">Deskripsi Video</label>
                          <textarea
                            value={videoForm.description}
                            onChange={(e) => setVideoForm({ ...videoForm, description: e.target.value })}
                            placeholder="Penjelasan ringkas tentang materi praktikum atau informasi dalam video..."
                            className="w-full px-3 py-2 bg-slate-900 rounded-lg border border-slate-700 text-white h-16"
                          />
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() => {
                            setVideoForm(null);
                            setVideoPreviewUrl('');
                            setThumbPreviewUrl('');
                          }}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-300 transition-all"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          disabled={uploadingVideo || !videoForm.title || !videoForm.url}
                          onClick={async () => {
                            if (!videoForm.url) {
                              alert('Harap pilih file video dari folder atau masukkan link URL.');
                              return;
                            }
                            if (!videoForm.title) {
                              alert('Harap isi judul video.');
                              return;
                            }
                            const isExisting = Boolean(videoForm.id && !videoForm.isNew && videos.some(v => v.id === videoForm.id));
                            if (isExisting) {
                              await updateVideo(videoForm.id, videoForm);
                              showToast('Video berhasil diperbarui!');
                            } else {
                              await addVideo(videoForm);
                              showToast('Video berhasil ditambahkan ke jadwal tayang!');
                            }
                            setVideoForm(null);
                            setVideoPreviewUrl('');
                            setThumbPreviewUrl('');
                          }}
                          className="px-5 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 rounded-lg text-xs font-extrabold text-white shadow-lg shadow-cyan-950/50 transition-all disabled:opacity-50"
                        >
                          {uploadingVideo ? 'Sedang Upload...' : 'Simpan & Tayangkan Video'}
                        </button>
                      </div>
                    </div>
                  )}

                  {videos.length === 0 && !videoForm && (
                    <div className="p-8 rounded-xl bg-slate-950/40 border border-dashed border-slate-800 text-center space-y-2">
                      <Film className="w-10 h-10 text-slate-600 mx-auto" />
                      <p className="text-xs font-bold text-slate-300">Belum Ada Video Signage yang Ditambahkan</p>
                      <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                        Klik tombol <strong>"+ Tambah Video Baru"</strong> di atas untuk mengunggah video dari folder laptop/PC Anda atau memasukkan link YouTube.
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    {videos.map((vid) => {
                      const vidYtId = extractYouTubeId(vid.url);
                      const vidThumb = vid.thumbnail || (vidYtId ? `https://img.youtube.com/vi/${vidYtId}/hqdefault.jpg` : "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80");

                      return (
                        <div
                          key={vid.id}
                          className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={vidThumb}
                              alt={vid.title}
                              className="w-16 h-10 rounded-lg object-cover bg-black border border-slate-700 shrink-0"
                              onError={(e) => {
                                e.target.src = "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80";
                              }}
                            />
                            <div>
                              <span className="text-[10px] font-bold text-cyan-400 uppercase">
                                {vid.categoryName} • {vid.duration || '03:00'}
                              </span>
                              <h5 className="font-bold text-white line-clamp-1">{vid.title}</h5>
                              <p className="text-[10px] text-slate-400">{vid.scheduleSlot || 'Rotasi Teratur'}</p>
                            </div>
                          </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setVideoForm({ ...vid, isNew: false });
                              setVideoPreviewUrl(vid.url);
                              setThumbPreviewUrl(vid.thumbnail);
                              if (vid.url?.startsWith('indexeddb://') || vid.url?.startsWith('blob:')) {
                                setVideoInputTab('file');
                              } else {
                                setVideoInputTab('url');
                              }
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm('Hapus video ini?')) {
                                await deleteVideo(vid.id);
                                showToast('Video dihapus.');
                              }
                            }}
                            className="p-1.5 rounded-lg bg-red-950 hover:bg-red-900 text-red-400 border border-red-500/30"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  </div>

                </div>
              )}

              {/* TAB 4: INVENTORY & BOOKING APPROVALS */}
              {currentTab === 'inventory' && (
                <div className="space-y-4">
                  
                  {/* Pending Bookings Section */}
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-amber-500/40 shadow-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-amber-400" />
                        Permohonan Peminjaman Alat Mahasiswa ({bookings.length})
                      </h4>
                      <span className="text-[10px] text-slate-400">Persetujuan Teknisi / Kepala Lab</span>
                    </div>

                    <div className="space-y-2">
                      {bookings.length > 0 ? (
                        bookings.map((bk) => (
                          <div
                            key={bk.id}
                            className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                          >
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                                  bk.status === 'approved'
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                    : bk.status === 'returned'
                                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                                    : bk.status === 'rejected'
                                    ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse'
                                }`}>
                                  {bk.status.toUpperCase()}
                                </span>
                                <span className="font-bold text-white">{bk.borrowerName} ({bk.nim})</span>
                                <span className="text-cyan-400 font-semibold">{bk.className}</span>
                              </div>

                              <h5 className="font-extrabold text-cyan-300">
                                {bk.itemName} — <span className="text-amber-300">{bk.quantity} Unit</span>
                              </h5>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                Keperluan: {bk.purpose} • Tgl Pinjam: {bk.borrowDate} s/d {bk.returnDate}
                              </p>
                            </div>

                            {/* Booking Action Buttons */}
                            <div className="flex items-center gap-1.5 self-end sm:self-auto">
                              {bk.status === 'pending' && (
                                <>
                                  <button
                                    onClick={async () => {
                                      await updateBookingStatus(bk.id, 'approved');
                                      showToast('Peminjaman disetujui & stok dikurangi!');
                                    }}
                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                                  >
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    <span>Setujui</span>
                                  </button>
                                  <button
                                    onClick={async () => {
                                      await updateBookingStatus(bk.id, 'rejected');
                                      showToast('Peminjaman ditolak.');
                                    }}
                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-950 hover:bg-red-900 text-red-300 font-bold text-xs border border-red-500/30"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                    <span>Tolak</span>
                                  </button>
                                </>
                              )}

                              {bk.status === 'approved' && (
                                <button
                                  onClick={async () => {
                                    await updateBookingStatus(bk.id, 'returned');
                                    showToast('Alat telah dikembalikan & stok dipulihkan!');
                                  }}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  <span>Tandai Kembali</span>
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 text-center py-2">Belum ada riwayat peminjaman.</p>
                      )}
                    </div>
                  </div>

                  {/* Inventory Items Management */}
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Stok Alat & Inventaris Lab ({inventory.length})
                    </h4>

                    <button
                      onClick={() => setInvForm({
                        code: `TL-EQ-${Date.now().toString().slice(-4)}`,
                        name: '',
                        nameEn: '',
                        category: 'Alat Ukur / Measurement',
                        totalStock: 5,
                        availableStock: 5,
                        unit: 'Unit',
                        location: 'Lemari A - Rak 1',
                        specs: '',
                        status: 'available'
                      })}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Alat Baru</span>
                    </button>
                  </div>

                  {invForm && (
                    <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/40 shadow-xl space-y-3 text-xs">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-bold text-white">
                          {invForm.id ? 'Edit Data Alat' : 'Tambah Alat Inventaris Baru'}
                        </h4>
                        <button onClick={() => setInvForm(null)} className="text-slate-400 hover:text-white">
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-slate-400 block mb-1">Kode Alat</label>
                          <input
                            type="text"
                            value={invForm.code}
                            onChange={(e) => setInvForm({ ...invForm, code: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-slate-900 rounded border border-slate-700 text-white"
                          />
                        </div>

                        <div>
                          <label className="text-slate-400 block mb-1">Kategori</label>
                          <select
                            value={invForm.category}
                            onChange={(e) => setInvForm({ ...invForm, category: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-slate-900 rounded border border-slate-700 text-white"
                          >
                            <option value="Alat Ukur / Measurement">Alat Ukur / Measurement</option>
                            <option value="Instrumentasi / Electronic Bench">Instrumentasi</option>
                            <option value="Modul Trainer / Automation">Modul Trainer</option>
                            <option value="Catu Daya / Power Supply">Catu Daya</option>
                            <option value="K3 / Safety Equipment">K3 / APD</option>
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="text-slate-400 block mb-1">Nama Alat</label>
                          <input
                            type="text"
                            value={invForm.name}
                            onChange={(e) => setInvForm({ ...invForm, name: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-slate-900 rounded border border-slate-700 text-white"
                          />
                        </div>

                        <div>
                          <label className="text-slate-400 block mb-1">Total Stok</label>
                          <input
                            type="number"
                            value={invForm.totalStock}
                            onChange={(e) => setInvForm({ ...invForm, totalStock: Number(e.target.value) })}
                            className="w-full px-2.5 py-1.5 bg-slate-900 rounded border border-slate-700 text-white"
                          />
                        </div>

                        <div>
                          <label className="text-slate-400 block mb-1">Stok Tersedia</label>
                          <input
                            type="number"
                            value={invForm.availableStock}
                            onChange={(e) => setInvForm({ ...invForm, availableStock: Number(e.target.value) })}
                            className="w-full px-2.5 py-1.5 bg-slate-900 rounded border border-slate-700 text-white"
                          />
                        </div>

                        <div>
                          <label className="text-slate-400 block mb-1">Lokasi Penyimpanan</label>
                          <input
                            type="text"
                            value={invForm.location}
                            onChange={(e) => setInvForm({ ...invForm, location: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-slate-900 rounded border border-slate-700 text-white"
                          />
                        </div>

                        <div>
                          <label className="text-slate-400 block mb-1">Satuan</label>
                          <input
                            type="text"
                            value={invForm.unit}
                            onChange={(e) => setInvForm({ ...invForm, unit: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-slate-900 rounded border border-slate-700 text-white"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="text-slate-400 block mb-1">Spesifikasi</label>
                          <textarea
                            value={invForm.specs}
                            onChange={(e) => setInvForm({ ...invForm, specs: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-slate-900 rounded border border-slate-700 text-white h-14"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          onClick={() => setInvForm(null)}
                          className="px-3 py-1.5 bg-slate-800 rounded text-xs font-bold text-slate-300"
                        >
                          Batal
                        </button>
                        <button
                          onClick={async () => {
                            if (invForm.id) {
                              await updateInventoryItem(invForm.id, invForm);
                              showToast('Data alat diperbarui!');
                            } else {
                              await addInventoryItem(invForm);
                              showToast('Alat baru ditambahkan ke katalog!');
                            }
                            setInvForm(null);
                          }}
                          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-xs font-bold text-white"
                        >
                          Simpan Alat
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    {inventory.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <span className="font-mono font-bold text-cyan-400">{item.code}</span>
                          <h5 className="font-bold text-white">{item.name}</h5>
                          <p className="text-[11px] text-slate-400">
                            Stok: <span className="text-emerald-400 font-bold">{item.availableStock}</span> / {item.totalStock} {item.unit} • {item.location}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setInvForm(item)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm('Hapus alat ini dari inventaris?')) {
                                await deleteInventoryItem(item.id);
                                showToast('Alat dihapus.');
                              }
                            }}
                            className="p-1.5 rounded-lg bg-red-950 hover:bg-red-900 text-red-400 border border-red-500/30"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              )}

              {/* TAB 5: ANNOUNCEMENTS (Admin) */}
              {currentTab === 'announcements' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Kelola Pengumuman ({announcements.length})
                    </h4>

                    <button
                      onClick={() => setAnnForm({
                        title: '',
                        titleEn: '',
                        priority: 'normal',
                        category: 'Akademik',
                        categoryEn: 'Academic',
                        date: new Date().toISOString().split('T')[0],
                        content: '',
                        badge: 'INFO',
                        isActive: true
                      })}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Buat Pengumuman</span>
                    </button>
                  </div>

                  {annForm && (
                    <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/40 shadow-xl space-y-3 text-xs">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-bold text-white">
                          {annForm.id ? 'Edit Pengumuman' : 'Buat Pengumuman Baru'}
                        </h4>
                        <button onClick={() => setAnnForm(null)} className="text-slate-400 hover:text-white">
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="sm:col-span-2">
                          <label className="text-slate-400 block mb-1">Judul Pengumuman</label>
                          <input
                            type="text"
                            value={annForm.title}
                            onChange={(e) => setAnnForm({ ...annForm, title: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-slate-900 rounded border border-slate-700 text-white"
                          />
                        </div>

                        <div>
                          <label className="text-slate-400 block mb-1">Prioritas</label>
                          <select
                            value={annForm.priority}
                            onChange={(e) => setAnnForm({ ...annForm, priority: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-slate-900 rounded border border-slate-700 text-white"
                          >
                            <option value="high">Tinggi (PENTING/URGENT)</option>
                            <option value="medium">Sedang (K3 LAB)</option>
                            <option value="normal">Normal (INFO)</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-slate-400 block mb-1">Kategori</label>
                          <input
                            type="text"
                            value={annForm.category}
                            onChange={(e) => setAnnForm({ ...annForm, category: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-slate-900 rounded border border-slate-700 text-white"
                            placeholder="Sertifikasi / Akademik / Workshop"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="text-slate-400 block mb-1">Isi Pengumuman</label>
                          <textarea
                            value={annForm.content}
                            onChange={(e) => setAnnForm({ ...annForm, content: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-slate-900 rounded border border-slate-700 text-white h-20"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          onClick={() => setAnnForm(null)}
                          className="px-3 py-1.5 bg-slate-800 rounded text-xs font-bold text-slate-300"
                        >
                          Batal
                        </button>
                        <button
                          onClick={async () => {
                            if (annForm.id) {
                              await updateAnnouncement(annForm.id, annForm);
                              showToast('Pengumuman diperbarui!');
                            } else {
                              await addAnnouncement(annForm);
                              showToast('Pengumuman baru dipublikasikan!');
                            }
                            setAnnForm(null);
                          }}
                          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-xs font-bold text-white"
                        >
                          Publikasikan
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    {announcements.map((ann) => (
                      <div
                        key={ann.id}
                        className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <span className="font-bold text-amber-400 uppercase text-[10px]">{ann.category} • {ann.date}</span>
                          <h5 className="font-bold text-white">{ann.title}</h5>
                          <p className="text-[11px] text-slate-400 line-clamp-1">{ann.content}</p>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setAnnForm(ann)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm('Hapus pengumuman ini?')) {
                                await deleteAnnouncement(ann.id);
                                showToast('Pengumuman dihapus.');
                              }
                            }}
                            className="p-1.5 rounded-lg bg-red-950 hover:bg-red-900 text-red-400 border border-red-500/30"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              )}

              {/* TAB 6: LAB ZONES STATUS */}
              {currentTab === 'zones' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Ubah Status Ketersediaan Zona & Meja Lab ({labZones.length})
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {labZones.map((zone) => (
                      <div
                        key={zone.id}
                        className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-cyan-400">{zone.code}</span>
                          <select
                            value={zone.status}
                            onChange={async (e) => {
                              await updateLabZone(zone.id, { ...zone, status: e.target.value });
                              showToast(`Status zona ${zone.code} diubah!`);
                            }}
                            className="px-2 py-1 bg-slate-900 text-xs rounded border border-slate-700 text-white font-bold"
                          >
                            <option value="available">Tersedia (Hijau)</option>
                            <option value="occupied">Sedang Praktikum (Merah)</option>
                            <option value="active">Aktif / Siaga (Kuning/Ungu)</option>
                          </select>
                        </div>

                        <h5 className="font-bold text-white">{zone.name}</h5>

                        <div>
                          <label className="text-[10px] text-slate-400 block">Aktivitas / Sesi:</label>
                          <input
                            type="text"
                            defaultValue={zone.currentClass}
                            onBlur={async (e) => {
                              if (e.target.value !== zone.currentClass) {
                                await updateLabZone(zone.id, { ...zone, currentClass: e.target.value });
                                showToast(`Aktivitas zona ${zone.code} diperbarui!`);
                              }
                            }}
                            className="w-full px-2 py-1 bg-slate-900 rounded border border-slate-700 text-white text-[11px] mt-0.5"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
