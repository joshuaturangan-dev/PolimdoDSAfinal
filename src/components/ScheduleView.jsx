import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  MapPin, 
  BookOpen, 
  Search, 
  Volume2, 
  CheckCircle2, 
  Timer, 
  GraduationCap,
  Sparkles,
  Layers,
  Activity,
  ListFilter,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  Download,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  Type
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useData, DEFAULT_SCHEDULES } from '../context/DataContext.jsx';
import { speakText } from '../utils/speechHelper.js';
import { useAutoScroll } from '../hooks/useAutoScroll.js';
import { AutoScrollController } from './AutoScrollController.jsx';
import { downloadSampleExcel } from '../utils/excelHelper.js';

export function ScheduleView({ isExpanded = false, onToggleExpand }) {
  const { lang, t } = useLanguage();
  const { schedules } = useData();

  const scheduleList = (schedules && schedules.length > 0) ? schedules : DEFAULT_SCHEDULES;

  // Live clock ticker
  const [currentDate, setCurrentDate] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const dayNamesId = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const dayNamesEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayIndex = currentDate.getDay();
  const todayNameId = dayNamesId[todayIndex];
  const todayNameEn = dayNamesEn[todayIndex];

  // View Mode & Filters
  const [viewMode, setViewMode] = useState('today');
  const [selectedDay, setSelectedDay] = useState(todayNameId === 'Minggu' || todayNameId === 'Sabtu' ? 'Senin' : todayNameId);
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isReadingSchedule, setIsReadingSchedule] = useState(false);
  
  // Custom Display Modes for Large Visibility
  const [showHighlights, setShowHighlights] = useState(true);
  const [isLargeText, setIsLargeText] = useState(false);

  const {
    containerRef,
    isEnabled: isAutoScrollEnabled,
    toggleAutoScroll,
    direction: scrollDirection,
    toggleDirection,
    isInteracting,
    isPausedAtEnd,
    pauseReason,
    speed: scrollSpeed,
    cycleSpeed,
    scrollToTop
  } = useAutoScroll({ initialEnabled: true, initialSpeed: 'normal' });

  const days = [
    { id: 'Semua', name: t('allDays'), nameEn: 'All Days' },
    { id: 'Senin', name: 'Senin', nameEn: 'Monday' },
    { id: 'Selasa', name: 'Selasa', nameEn: 'Tuesday' },
    { id: 'Rabu', name: 'Rabu', nameEn: 'Wednesday' },
    { id: 'Kamis', name: 'Kamis', nameEn: 'Thursday' },
    { id: 'Jumat', name: 'Jumat', nameEn: 'Friday' }
  ];

  const semesters = ['all', 1, 3, 5, 7];

  // Convert "HH:mm" to minutes from midnight
  const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const parts = timeStr.split(':').map(Number);
    return (parts[0] || 0) * 60 + (parts[1] || 0);
  };

  const currentMinutes = currentDate.getHours() * 60 + currentDate.getMinutes();

  // Today's schedules
  const todaySchedules = scheduleList.filter(s => s.day === (todayNameId === 'Minggu' || todayNameId === 'Sabtu' ? 'Senin' : todayNameId));

  // Ongoing active class
  const currentOngoing = todaySchedules.find(s => {
    const start = timeToMinutes(s.startTime);
    const end = timeToMinutes(s.endTime);
    return currentMinutes >= start && currentMinutes < end;
  }) || null;

  // Next upcoming class
  const nextUpcoming = todaySchedules
    .filter(s => timeToMinutes(s.startTime) > currentMinutes)
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))[0] || null;

  // Session progress & countdown
  let sessionProgress = 0;
  let remainingMinutes = 0;
  if (currentOngoing) {
    const start = timeToMinutes(currentOngoing.startTime);
    const end = timeToMinutes(currentOngoing.endTime);
    const totalDuration = end - start || 1;
    const elapsed = currentMinutes - start;
    sessionProgress = Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));
    remainingMinutes = Math.max(0, end - currentMinutes);
  }

  let startsInMinutes = 0;
  if (nextUpcoming) {
    const start = timeToMinutes(nextUpcoming.startTime);
    startsInMinutes = Math.max(0, start - currentMinutes);
  }

  // Filtered schedules for listing
  const filteredSchedules = scheduleList.filter((s) => {
    if (viewMode === 'today') {
      const activeDayCheck = todayNameId === 'Minggu' || todayNameId === 'Sabtu' ? 'Senin' : todayNameId;
      if (s.day !== activeDayCheck) return false;
    } else {
      if (selectedDay !== 'Semua' && s.day !== selectedDay) return false;
    }

    if (selectedSemester !== 'all' && s.semester !== Number(selectedSemester)) return false;
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCourse = (s.courseName && s.courseName.toLowerCase().includes(q)) || 
                          (s.courseNameEn && s.courseNameEn.toLowerCase().includes(q));
      const matchLecturer = s.lecturer && s.lecturer.toLowerCase().includes(q);
      const matchClass = s.className && s.className.toLowerCase().includes(q);
      const matchRoom = s.room && s.room.toLowerCase().includes(q);
      const matchTopic = (s.topic && s.topic.toLowerCase().includes(q)) ||
                         (s.upcomingTask && s.upcomingTask.toLowerCase().includes(q));
      return matchCourse || matchLecturer || matchClass || matchRoom || matchTopic;
    }
    return true;
  });

  // Speak schedule aloud
  const handleReadSchedule = () => {
    if (isReadingSchedule) return;

    let text = "";
    if (lang === 'id') {
      if (currentOngoing) {
        text = `Jadwal praktikum hari ${todayNameId}. Sedang berlangsung saat ini: ${currentOngoing.courseName} untuk kelas ${currentOngoing.className}, dosen pengampu ${currentOngoing.lecturer}, ruangan ${currentOngoing.room}. Sesi berakhir pukul ${currentOngoing.endTime}.`;
      } else if (nextUpcoming) {
        text = `Jadwal praktikum hari ${todayNameId}. Sesi berikutnya dimulai pukul ${nextUpcoming.startTime} yaitu ${nextUpcoming.courseName} untuk kelas ${nextUpcoming.className}.`;
      } else {
        text = `Jadwal praktikum laboratorium Teknik Listrik hari ${todayNameId}. Terdapat ${todaySchedules.length} sesi praktikum yang terjadwal.`;
      }
    } else {
      if (currentOngoing) {
        text = `Laboratory schedule for ${todayNameEn}. Currently in session: ${currentOngoing.courseNameEn || currentOngoing.courseName} for class ${currentOngoing.className}, instructed by ${currentOngoing.lecturer}, located in ${currentOngoing.room}. Ending at ${currentOngoing.endTime}.`;
      } else if (nextUpcoming) {
        text = `Laboratory schedule for ${todayNameEn}. The next session begins at ${nextUpcoming.startTime}: ${nextUpcoming.courseNameEn || nextUpcoming.courseName} for class ${nextUpcoming.className}.`;
      } else {
        text = `Electrical Engineering laboratory schedule for ${todayNameEn}. There are ${todaySchedules.length} practicum sessions scheduled.`;
      }
    }

    speakText(
      text,
      lang,
      () => setIsReadingSchedule(true),
      () => setIsReadingSchedule(false)
    );
  };

  const getDayBadgeColor = (day) => {
    switch (day) {
      case 'Senin': return 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40';
      case 'Selasa': return 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40';
      case 'Rabu': return 'bg-amber-950/80 text-amber-300 border-amber-500/40';
      case 'Kamis': return 'bg-purple-950/80 text-purple-300 border-purple-500/40';
      case 'Jumat': return 'bg-blue-950/80 text-blue-300 border-blue-500/40';
      default: return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getBorderColor = (color) => {
    switch (color) {
      case 'blue': return 'border-blue-500/40 bg-slate-900/90';
      case 'cyan': return 'border-cyan-500/40 bg-slate-900/90';
      case 'emerald': return 'border-emerald-500/40 bg-slate-900/90';
      case 'amber': return 'border-amber-500/40 bg-slate-900/90';
      case 'purple': return 'border-purple-500/40 bg-slate-900/90';
      case 'red': return 'border-red-500/40 bg-slate-900/90';
      default: return 'border-slate-800 bg-slate-900/80';
    }
  };

  return (
    <div className="flex flex-col h-full gap-2.5 overflow-hidden">
      
      {/* 1. TOP HIGHLIGHTS BANNER (Compact & Toggleable) */}
      {showHighlights && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 shrink-0 transition-all duration-300">
          
          {/* Card 1: Current Ongoing Session */}
          {currentOngoing ? (
            <div className="relative p-3 rounded-xl bg-gradient-to-br from-blue-950/90 via-slate-900/95 to-cyan-950/50 border-2 border-cyan-400 shadow-xl shadow-cyan-950/50 overflow-hidden flex flex-col justify-between">
              <div>
                {/* Header pill & timer */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-950 border border-emerald-400/60 px-2.5 py-0.5 rounded-full shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    {t('inProgress')}
                  </span>
                  <span className="font-mono text-xs font-black text-cyan-300 flex items-center gap-1 bg-black/60 px-2.5 py-0.5 rounded-lg border border-cyan-500/40">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    {currentOngoing.startTime} - {currentOngoing.endTime} WITA
                  </span>
                </div>

                {/* Course Title */}
                <h4 className={`${isLargeText ? 'text-base md:text-lg' : 'text-sm md:text-base'} font-black text-white leading-tight truncate`}>
                  {lang === 'id' ? currentOngoing.courseName : currentOngoing.courseNameEn || currentOngoing.courseName}
                </h4>

                {/* Practicum Task / Topic */}
                {currentOngoing.topic && (
                  <div className="mt-1 px-2 py-1 rounded bg-blue-900/30 border border-blue-400/30 text-[10.5px] text-cyan-200 truncate">
                    <span className="font-bold text-cyan-300 mr-1">{t('practicumTopic')}:</span>
                    <span>{currentOngoing.topic}</span>
                  </div>
                )}
              </div>

              {/* Lecturer, Class & Room in one clean grid */}
              <div className="mt-2 pt-1.5 border-t border-cyan-500/20">
                <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-300">
                  <span className="flex items-center gap-1 truncate font-medium">
                    <User className="w-3 h-3 text-cyan-400 shrink-0" />
                    {currentOngoing.lecturer}
                  </span>
                  <span className="flex items-center gap-1 truncate text-amber-300 font-bold justify-end">
                    <GraduationCap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    {currentOngoing.className} ({currentOngoing.credits} SKS)
                  </span>
                </div>
                
                <div className="mt-1 text-[10.5px] text-slate-400 flex items-center justify-between gap-1">
                  <span className="flex items-center gap-1 truncate">
                    <MapPin className="w-3 h-3 text-red-400 shrink-0" />
                    <span className="text-slate-200 font-semibold">{currentOngoing.room}</span>
                  </span>
                  <span className="font-mono text-cyan-300 font-bold">
                    {remainingMinutes > 0 ? `${t('remainingTime')} ${remainingMinutes} ${t('minutesLeft')}` : 'Selesai'}
                  </span>
                </div>

                {/* Realtime Progress Bar */}
                <div className="mt-1.5 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-cyan-400 to-emerald-400 h-full rounded-full transition-all duration-1000"
                    style={{ width: `${sessionProgress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative p-3 rounded-xl bg-slate-950/70 border border-slate-800 shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-900 px-2.5 py-0.5 rounded-full border border-slate-700">
                    <Activity className="w-3 h-3 text-slate-400" />
                    {t('currentLiveClass')}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    {todayNameId}, {currentDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WITA
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-300">
                  {t('noActiveSessionNow')}
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  {todaySchedules.length > 0 
                    ? (lang === 'id' ? `Terdapat ${todaySchedules.length} sesi praktikum terjadwal hari ini.` : `${todaySchedules.length} lab sessions scheduled for today.`)
                    : (lang === 'id' ? 'Tidak ada praktikum aktif di laboratorium hari ini.' : 'No active lab practicum scheduled today.')}
                </p>
              </div>
              <div className="mt-2 pt-1 border-t border-slate-800/60 text-[10px] text-cyan-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Lab siap untuk sesi praktikum berikutnya atau konsultasi dosen.</span>
              </div>
            </div>
          )}

          {/* Card 2: Next Upcoming Session */}
          {nextUpcoming ? (
            <div className="relative p-3 rounded-xl bg-slate-900/90 border border-amber-500/40 shadow-lg overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-amber-300 bg-amber-950/80 border border-amber-500/50 px-2.5 py-0.5 rounded-full">
                    <Timer className="w-3 h-3 text-amber-400 animate-spin" />
                    {t('upcoming')}
                  </span>
                  <span className="font-mono text-xs font-bold text-amber-300 flex items-center gap-1 bg-black/50 px-2.5 py-0.5 rounded-lg border border-amber-500/30">
                    <Clock className="w-3 h-3 text-amber-400" />
                    {nextUpcoming.startTime} - {nextUpcoming.endTime} WITA
                  </span>
                </div>

                <h4 className={`${isLargeText ? 'text-base md:text-lg' : 'text-sm md:text-base'} font-bold text-white leading-tight truncate`}>
                  {lang === 'id' ? nextUpcoming.courseName : nextUpcoming.courseNameEn || nextUpcoming.courseName}
                </h4>
              </div>

              <div className="mt-2 pt-1.5 border-t border-slate-800">
                <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-300">
                  <span className="flex items-center gap-1 truncate">
                    <User className="w-3 h-3 text-slate-400 shrink-0" />
                    {nextUpcoming.lecturer}
                  </span>
                  <span className="flex items-center gap-1 truncate text-amber-300 font-semibold justify-end">
                    <GraduationCap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    {nextUpcoming.className}
                  </span>
                </div>

                <div className="mt-1 text-[10.5px] text-slate-400 flex items-center justify-between gap-1">
                  <span className="flex items-center gap-1 truncate">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="text-slate-200">{nextUpcoming.room}</span>
                  </span>
                  <span className="text-amber-300 font-bold">
                    {startsInMinutes > 0 ? `${t('startsIn')} ${startsInMinutes} ${t('minutesLeft')}` : 'Segera Mulai'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative p-3 rounded-xl bg-slate-950/70 border border-slate-800 shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-900 px-2.5 py-0.5 rounded-full border border-slate-700">
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                    {t('upcomingTodayClass')}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    {todayNameId}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-300">
                  {t('allSessionsDoneToday')}
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  {lang === 'id' 
                    ? 'Tidak ada sesi praktikum lanjutan hari ini. Periksa jadwal esok hari.' 
                    : 'No further sessions scheduled today. Please check tomorrow.'}
                </p>
              </div>
              <div className="mt-2 pt-1 border-t border-slate-800/60 text-[10px] text-slate-400 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-cyan-400" />
                <span>Gunakan tab Mingguan di bawah untuk melihat jadwal lengkap.</span>
              </div>
            </div>
          )}

        </div>
      )}

      {/* 2. FILTER TOOLBAR & CONTROLS */}
      <div className="p-2 bg-slate-950/90 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
        
        {/* View Mode (Today vs Weekly) */}
        <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 shrink-0">
          <button
            onClick={() => {
              setViewMode('today');
              setSelectedDay(todayNameId === 'Minggu' || todayNameId === 'Sabtu' ? 'Senin' : todayNameId);
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-extrabold transition-all ${
              viewMode === 'today'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-cyan-950/60'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
            <span>{t('todaySchedule')} ({todayNameId})</span>
          </button>

          <button
            onClick={() => setViewMode('all')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-extrabold transition-all ${
              viewMode === 'all'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-cyan-950/60'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t('weeklySchedule')}</span>
          </button>
        </div>

        {/* Day Pills (in Weekly view) */}
        {viewMode === 'all' && (
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
            {days.map((d) => {
              const isTodayDay = d.id === todayNameId;
              const isSelected = selectedDay === d.id;
              return (
                <button
                  key={d.id}
                  onClick={() => setSelectedDay(d.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all whitespace-nowrap flex items-center gap-1 ${
                    isSelected
                      ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
                  }`}
                >
                  {isTodayDay && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
                  <span>{lang === 'id' ? d.name : d.nameEn}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Semester Filter */}
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[10px] font-bold uppercase text-slate-400 hidden sm:inline">Sem:</span>
          {semesters.map((sem) => (
            <button
              key={sem}
              onClick={() => setSelectedSemester(sem)}
              className={`px-2 py-0.5 rounded text-xs font-bold transition-all ${
                selectedSemester === sem
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {sem === 'all' ? (lang === 'id' ? 'Semua' : 'All') : `S${sem}`}
            </button>
          ))}
        </div>

        {/* Search, Auto-Scroll, Font Scale & Highlight Toggle */}
        <div className="flex items-center gap-1.5 flex-wrap ml-auto">
          {/* Search Box */}
          <div className="relative w-36 sm:w-44">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t('searchSchedulePlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-2 py-1 bg-slate-900 text-xs rounded-lg border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* AutoScroll Controller */}
          <AutoScrollController
            isEnabled={isAutoScrollEnabled}
            toggleAutoScroll={toggleAutoScroll}
            direction={scrollDirection}
            toggleDirection={toggleDirection}
            isInteracting={isInteracting}
            isPausedAtEnd={isPausedAtEnd}
            pauseReason={pauseReason}
            speed={scrollSpeed}
            cycleSpeed={cycleSpeed}
            scrollToTop={scrollToTop}
          />

          {/* Font Size Toggle Button */}
          <button
            onClick={() => setIsLargeText(!isLargeText)}
            className={`p-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1 ${
              isLargeText
                ? 'bg-cyan-600 text-white border-cyan-400'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border-slate-700'
            }`}
            title={isLargeText ? 'Ukuran Teks: Besar (Klik untuk Standar)' : 'Ukuran Teks: Standar (Klik untuk Memperbesar Teks)'}
          >
            <Type className="w-3.5 h-3.5" />
            <span className="hidden md:inline text-[10px]">{isLargeText ? 'Teks Besar' : 'Teks'}</span>
          </button>

          {/* Toggle Top Highlights Banner Button */}
          <button
            onClick={() => setShowHighlights(!showHighlights)}
            className={`p-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1 ${
              !showHighlights
                ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border-slate-700'
            }`}
            title={showHighlights ? 'Sembunyikan Banner Highlight untuk Melihat Lebih Banyak Jadwal' : 'Tampilkan Banner Highlight'}
          >
            {!showHighlights ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5" />}
            <span className="hidden lg:inline text-[10px]">{showHighlights ? 'Ringkas' : 'Highlight'}</span>
          </button>

          {/* Read Aloud TTS */}
          <button
            onClick={handleReadSchedule}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all shrink-0"
            title={t('voiceReadSchedule')}
          >
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden xl:inline">{t('voiceReadSchedule')}</span>
          </button>

          {/* Excel Sample Template */}
          <button
            onClick={downloadSampleExcel}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all shrink-0"
            title="Download Template Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden 2xl:inline">Excel</span>
          </button>
        </div>

      </div>

      {/* 3. RESPONSIVE MULTI-COLUMN SCHEDULE GRID VIEW (Shows ALL Schedules Clearly) */}
      <div 
        ref={containerRef}
        className={`flex-1 overflow-y-auto pr-1 scroll-smooth grid gap-2.5 md:gap-3 ${
          isExpanded
            ? 'grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 auto-rows-max'
            : 'grid-cols-1 xl:grid-cols-2 auto-rows-max'
        }`}
      >
        {filteredSchedules.length > 0 ? (
          filteredSchedules.map((sch) => {
            const isTodayItem = sch.day === todayNameId;
            const startM = timeToMinutes(sch.startTime);
            const endM = timeToMinutes(sch.endTime);
            const isLive = isTodayItem && currentMinutes >= startM && currentMinutes < endM;
            const isDone = isTodayItem && currentMinutes >= endM;
            const isUpcomingLater = isTodayItem && currentMinutes < startM;

            return (
              <div
                key={sch.id}
                className={`p-3 rounded-xl border transition-all flex flex-col justify-between shadow-lg ${
                  isLive
                    ? 'border-2 border-cyan-400 bg-gradient-to-br from-cyan-950/70 via-slate-900/95 to-blue-950/80 ring-2 ring-cyan-400/40 shadow-cyan-950/80'
                    : isUpcomingLater
                      ? 'border-amber-500/40 bg-slate-900/90 hover:border-amber-400/70'
                      : isDone
                        ? 'border-slate-800/80 bg-slate-950/60 opacity-80'
                        : getBorderColor(sch.color)
                }`}
              >
                <div>
                  {/* Top Badges Row */}
                  <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Day Chip */}
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase border ${getDayBadgeColor(sch.day)}`}>
                        {sch.day}
                      </span>

                      {/* Time Slot Monospace */}
                      <span className="flex items-center gap-1 text-xs font-bold text-slate-200 font-mono bg-black/50 px-2 py-0.5 rounded border border-slate-700">
                        <Clock className="w-3 h-3 text-cyan-400" />
                        {sch.startTime} - {sch.endTime} WITA
                      </span>

                      {/* Class Code & SKS */}
                      <span className="text-[10.5px] font-extrabold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/40">
                        {sch.className} • Sem {sch.semester} ({sch.credits} SKS)
                      </span>
                    </div>

                    {/* Live / Status Pill */}
                    {isLive && (
                      <span className="text-[10px] font-black text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-400 flex items-center gap-1 shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                        LIVE
                      </span>
                    )}
                    {isUpcomingLater && (
                      <span className="text-[10px] font-bold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/40">
                        {t('upcoming')}
                      </span>
                    )}
                    {isDone && (
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        Selesai
                      </span>
                    )}
                  </div>

                  {/* Course Name */}
                  <h4 className={`${isLargeText ? 'text-base md:text-lg' : 'text-sm md:text-base'} font-black text-white leading-snug`}>
                    {lang === 'id' ? sch.courseName : sch.courseNameEn || sch.courseName}
                  </h4>

                  {/* Practicum Topic / Module if provided */}
                  {sch.topic && (
                    <div className="mt-1 px-2 py-0.5 rounded bg-slate-950/60 border border-slate-800 text-[10.5px] text-cyan-300 truncate">
                      <span className="font-semibold text-slate-400 mr-1">Modul:</span>
                      <span>{sch.topic}</span>
                    </div>
                  )}
                </div>

                {/* Footer: Lecturer & Room Location */}
                <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1 text-slate-200 truncate min-w-0">
                    <User className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="font-bold truncate">{sch.lecturer}</span>
                  </div>
                  
                  <div className="flex items-center gap-1 text-slate-300 text-[11px] shrink-0">
                    <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    <span className="font-semibold">{sch.room}</span>
                  </div>
                </div>

              </div>
            );
          })
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center p-12 text-center text-slate-400">
            <Calendar className="w-12 h-12 text-slate-600 mb-2" />
            <p className="text-sm font-semibold">{t('noClassToday')}</p>
          </div>
        )}
      </div>

    </div>
  );
}
