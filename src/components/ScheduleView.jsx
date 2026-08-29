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
  AlertCircle
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useData } from '../context/DataContext.jsx';
import { speakText } from '../utils/speechHelper.js';
import { useAutoScroll } from '../hooks/useAutoScroll.js';
import { AutoScrollController } from './AutoScrollController.jsx';

export function ScheduleView() {
  const { lang, t } = useLanguage();
  const { schedules } = useData();

  // Live timer ticking every 15 seconds
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

  // View Mode: 'today' | 'all'
  const [viewMode, setViewMode] = useState('today');
  const [selectedDay, setSelectedDay] = useState(todayNameId === 'Minggu' || todayNameId === 'Sabtu' ? 'Senin' : todayNameId);
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isReadingSchedule, setIsReadingSchedule] = useState(false);

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

  // Helper: Convert "HH:mm" to minutes from midnight
  const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const parts = timeStr.split(':').map(Number);
    return (parts[0] || 0) * 60 + (parts[1] || 0);
  };

  const currentMinutes = currentDate.getHours() * 60 + currentDate.getMinutes();

  // Find all schedules for today
  const todaySchedules = schedules.filter(s => s.day === (todayNameId === 'Minggu' || todayNameId === 'Sabtu' ? 'Senin' : todayNameId));

  // Determine current active ongoing class for today
  const currentOngoing = todaySchedules.find(s => {
    const start = timeToMinutes(s.startTime);
    const end = timeToMinutes(s.endTime);
    return currentMinutes >= start && currentMinutes < end;
  }) || null;

  // Determine next upcoming class for today
  const nextUpcoming = todaySchedules
    .filter(s => timeToMinutes(s.startTime) > currentMinutes)
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))[0] || null;

  // Calculate ongoing progress percentage & remaining minutes
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

  // Calculate start countdown for upcoming class
  let startsInMinutes = 0;
  if (nextUpcoming) {
    const start = timeToMinutes(nextUpcoming.startTime);
    startsInMinutes = Math.max(0, start - currentMinutes);
  }

  // Filtered schedules for listing
  const filteredSchedules = schedules.filter((s) => {
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

  // Speak Schedule Aloud
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

  const getBorderColor = (color) => {
    switch (color) {
      case 'blue': return 'border-blue-500/40 bg-blue-950/20';
      case 'cyan': return 'border-cyan-500/40 bg-cyan-950/20';
      case 'emerald': return 'border-emerald-500/40 bg-emerald-950/20';
      case 'amber': return 'border-amber-500/40 bg-amber-950/20';
      case 'purple': return 'border-purple-500/40 bg-purple-950/20';
      case 'red': return 'border-red-500/40 bg-red-950/20';
      case 'yellow': return 'border-yellow-500/40 bg-yellow-950/20';
      default: return 'border-slate-700/50 bg-slate-800/30';
    }
  };

  return (
    <div className="flex flex-col h-full gap-3 overflow-hidden">
      
      {/* Top Banner: Current Ongoing & Next Upcoming Live Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 shrink-0">
        
        {/* Card 1: Current Ongoing Session */}
        {currentOngoing ? (
          <div className="relative p-3.5 rounded-xl bg-gradient-to-br from-blue-950/90 via-slate-900/90 to-blue-900/40 border-2 border-cyan-400 shadow-xl shadow-cyan-950/60 overflow-hidden">
            {/* Header pill & timer */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-950/90 border border-emerald-400/60 px-2.5 py-0.5 rounded-full shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                {t('inProgress')}
              </span>
              <span className="font-mono text-xs font-black text-cyan-300 flex items-center gap-1 bg-black/50 px-2 py-0.5 rounded border border-cyan-500/30">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                {currentOngoing.startTime} - {currentOngoing.endTime} WITA
              </span>
            </div>

            {/* Course Title */}
            <h4 className="text-sm md:text-base font-black text-white leading-tight truncate">
              {lang === 'id' ? currentOngoing.courseName : currentOngoing.courseNameEn || currentOngoing.courseName}
            </h4>

            {/* Current Practicum Task / Topic */}
            <div className="mt-1.5 p-1.5 rounded-lg bg-blue-900/40 border border-blue-400/30 text-[11px] text-cyan-200">
              <span className="font-bold text-cyan-300 uppercase text-[9px] block">
                {t('practicumTopic')}:
              </span>
              <span className="line-clamp-1 font-semibold">
                {currentOngoing.topic || (lang === 'id' ? 'Job Praktikum: Wiring & Pengujian Modul Instalasi Listrik' : 'Lab Job: Wiring & Electrical Installation Module Testing')}
              </span>
            </div>

            {/* Lecturer, Class & Room */}
            <div className="grid grid-cols-2 gap-1.5 mt-2 text-[11px] text-slate-300">
              <span className="flex items-center gap-1 truncate text-slate-200">
                <User className="w-3 h-3 text-cyan-400 shrink-0" />
                {currentOngoing.lecturer}
              </span>
              <span className="flex items-center gap-1 truncate text-amber-300 font-bold">
                <GraduationCap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                {currentOngoing.className} ({currentOngoing.credits} SKS)
              </span>
            </div>
            
            <div className="mt-1.5 text-[10px] text-slate-300 flex items-center justify-between gap-1">
              <span className="flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3 text-red-400 shrink-0" />
                {currentOngoing.room}
              </span>
              <span className="font-mono text-cyan-300 font-bold">
                {remainingMinutes > 0 ? `${t('remainingTime')} ${remainingMinutes} ${t('minutesLeft')}` : 'Selesai'}
              </span>
            </div>

            {/* Realtime Progress Bar */}
            <div className="mt-2 w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-cyan-400 to-emerald-400 h-full rounded-full transition-all duration-1000"
                style={{ width: `${sessionProgress}%` }}
              ></div>
            </div>
          </div>
        ) : (
          <div className="relative p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-700">
                  <Activity className="w-3 h-3 text-slate-400" />
                  {t('currentLiveClass')}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {todayNameId}, {currentDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WITA
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-300">
                {t('noActiveSessionNow')}
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                {todaySchedules.length > 0 
                  ? (lang === 'id' ? `Terdapat ${todaySchedules.length} sesi praktikum terjadwal pada hari ${todayNameId}.` : `${todaySchedules.length} lab sessions scheduled for ${todayNameEn}.`)
                  : (lang === 'id' ? 'Tidak ada praktikum aktif di laboratorium pada hari ini.' : 'No active laboratory practicum scheduled today.')}
              </p>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-800/60 text-[10px] text-cyan-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>Lab siap untuk sesi praktikum berikutnya atau konsultasi dosen.</span>
            </div>
          </div>
        )}

        {/* Card 2: Next Upcoming Session */}
        {nextUpcoming ? (
          <div className="relative p-3.5 rounded-xl bg-slate-900/90 border border-amber-500/40 shadow-lg overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-amber-300 bg-amber-950/80 border border-amber-500/50 px-2.5 py-0.5 rounded-full">
                  <Timer className="w-3 h-3 text-amber-400 animate-spin" />
                  {t('upcoming')}
                </span>
                <span className="font-mono text-xs font-bold text-amber-300 flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded border border-amber-500/30">
                  <Clock className="w-3 h-3 text-amber-400" />
                  {nextUpcoming.startTime} - {nextUpcoming.endTime} WITA
                </span>
              </div>

              <h4 className="text-sm md:text-base font-bold text-white leading-tight truncate">
                {lang === 'id' ? nextUpcoming.courseName : nextUpcoming.courseNameEn || nextUpcoming.courseName}
              </h4>

              {/* Upcoming Task / Module Description */}
              <div className="mt-1.5 p-1.5 rounded-lg bg-amber-950/30 border border-amber-500/20 text-[11px] text-amber-200">
                <span className="font-bold text-amber-400 uppercase text-[9px] block">
                  {t('upcomingTaskLabel')}:
                </span>
                <span className="line-clamp-1">
                  {nextUpcoming.upcomingTask || nextUpcoming.topic || (lang === 'id' ? 'Materi: Persiapan Job Sheet & Safety Induction' : 'Topic: Job Sheet Preparation & Safety Induction')}
                </span>
              </div>
            </div>

            <div className="mt-2">
              <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-300">
                <span className="flex items-center gap-1 truncate">
                  <User className="w-3 h-3 text-slate-400 shrink-0" />
                  {nextUpcoming.lecturer}
                </span>
                <span className="flex items-center gap-1 truncate text-amber-300 font-semibold">
                  <GraduationCap className="w-3 h-3 text-amber-400 shrink-0" />
                  {nextUpcoming.className}
                </span>
              </div>

              <div className="mt-1.5 text-[10px] text-slate-400 flex items-center justify-between gap-1">
                <span className="flex items-center gap-1 truncate">
                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                  {nextUpcoming.room}
                </span>
                <span className="text-amber-300 font-bold">
                  {startsInMinutes > 0 ? `${t('startsIn')} ${startsInMinutes} ${t('minutesLeft')}` : 'Segera Mulai'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-700">
                  <CheckCircle className="w-3 h-3 text-emerald-400" />
                  {t('upcomingTodayClass')}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {todayNameId}
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-300">
                {t('allSessionsDoneToday')}
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                {lang === 'id' 
                  ? 'Tidak ada sesi praktikum lanjutan hari ini. Silakan periksa jadwal esok hari.' 
                  : 'No further sessions scheduled for today. Please check tomorrow\'s schedule.'}
              </p>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-800/60 text-[10px] text-slate-400 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-cyan-400" />
              <span>Gunakan tab di bawah untuk melihat jadwal hari berikutnya.</span>
            </div>
          </div>
        )}

      </div>

      {/* Filter Toolbar: Today View vs Weekly View, Days, Semester, Search */}
      <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
        
        {/* Main View Mode Selector (Today's Live vs Weekly) */}
        <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
          <button
            onClick={() => {
              setViewMode('today');
              setSelectedDay(todayNameId === 'Minggu' || todayNameId === 'Sabtu' ? 'Senin' : todayNameId);
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all ${
              viewMode === 'today'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
            <span>{t('todaySchedule')} ({todayNameId})</span>
          </button>

          <button
            onClick={() => setViewMode('all')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all ${
              viewMode === 'all'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t('weeklySchedule')}</span>
          </button>
        </div>

        {/* Day Pills (when in Weekly mode or to inspect specific days) */}
        {viewMode === 'all' && (
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
            {days.map((d) => {
              const isTodayDay = d.id === todayNameId;
              const isSelected = selectedDay === d.id;
              return (
                <button
                  key={d.id}
                  onClick={() => setSelectedDay(d.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
                    isSelected
                      ? 'bg-cyan-500 text-slate-950 shadow-md font-extrabold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
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
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-bold uppercase text-slate-400 hidden sm:inline">Sem:</span>
          {semesters.map((sem) => (
            <button
              key={sem}
              onClick={() => setSelectedSemester(sem)}
              className={`px-2 py-0.5 rounded text-xs font-bold transition-all ${
                selectedSemester === sem
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {sem === 'all' ? (lang === 'id' ? 'Semua' : 'All') : `S${sem}`}
            </button>
          ))}
        </div>

        {/* Search, Auto-Scroll Controller & Read Aloud */}
        <div className="flex items-center gap-2 w-full lg:w-auto mt-1 lg:mt-0">
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t('searchSchedulePlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1 bg-slate-900 text-xs rounded-lg border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

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

          <button
            onClick={handleReadSchedule}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all shrink-0"
            title={t('voiceReadSchedule')}
          >
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">{t('voiceReadSchedule')}</span>
          </button>
        </div>

      </div>

      {/* Schedule Items List View */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto pr-1 space-y-2.5 scroll-smooth"
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
                className={`p-3.5 rounded-xl border transition-all ${
                  isLive
                    ? 'border-cyan-400 bg-cyan-950/40 shadow-lg ring-1 ring-cyan-400/40'
                    : getBorderColor(sch.color)
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  
                  {/* Left info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      {/* Day badge */}
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-slate-800 text-cyan-300 border border-slate-700">
                        {sch.day}
                      </span>

                      {/* Time slot */}
                      <span className="flex items-center gap-1 text-xs font-bold text-slate-300 font-mono">
                        <Clock className="w-3 h-3 text-cyan-400" />
                        {sch.startTime} - {sch.endTime} WITA
                      </span>

                      {/* Class code & semester */}
                      <span className="text-[11px] font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                        {sch.className} • Sem {sch.semester} ({sch.credits} SKS)
                      </span>

                      {/* Live / Status Badge */}
                      {isLive && (
                        <span className="text-[10px] font-black text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-400 flex items-center gap-1">
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

                    <h4 className="text-sm font-extrabold text-white leading-snug">
                      {lang === 'id' ? sch.courseName : sch.courseNameEn || sch.courseName}
                      <span className="text-xs font-mono font-normal text-slate-400 ml-2">
                        [{sch.courseCode}]
                      </span>
                    </h4>

                    {/* Practicum Job / Task Description */}
                    {(sch.topic || sch.upcomingTask) && (
                      <div className="mt-1.5 text-xs text-slate-300 bg-slate-900/70 p-2 rounded-lg border border-slate-800">
                        {sch.topic && (
                          <div className="flex items-start gap-1.5">
                            <span className="text-cyan-400 font-bold shrink-0 text-[11px]">Tugas/Materi:</span>
                            <span className="text-slate-200 font-medium">{sch.topic}</span>
                          </div>
                        )}
                        {sch.upcomingTask && (
                          <div className="flex items-start gap-1.5 mt-0.5 text-slate-400 text-[11px]">
                            <span className="text-amber-400 font-bold shrink-0">Tugas Berikutnya:</span>
                            <span>{sch.upcomingTask}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right metadata (Lecturer & Room) */}
                  <div className="sm:text-right shrink-0 flex sm:flex-col justify-between items-end gap-1 text-xs border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
                    <div className="flex items-center sm:justify-end gap-1 text-slate-300">
                      <User className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="font-semibold">{sch.lecturer}</span>
                    </div>
                    <div className="flex items-center sm:justify-end gap-1 text-slate-400 text-[11px]">
                      <MapPin className="w-3.5 h-3.5 text-red-400" />
                      <span>{sch.room}</span>
                    </div>
                  </div>

                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400">
            <Calendar className="w-12 h-12 text-slate-600 mb-2" />
            <p className="text-sm font-semibold">{t('noClassToday')}</p>
          </div>
        )}
      </div>

    </div>
  );
}
