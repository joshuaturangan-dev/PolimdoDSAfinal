import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  SkipForward, 
  SkipBack, 
  Film, 
  Layers, 
  ShieldCheck, 
  GraduationCap, 
  Megaphone, 
  BookOpen, 
  Clock, 
  AlertCircle,
  Sparkles,
  Repeat,
  Repeat1,
  Shuffle,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Tv
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useData } from '../context/DataContext.jsx';

function getYouTubeEmbedUrl(url, loopMode) {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (!match) return null;
  const videoId = match[1];
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}`;
}

export function VideoPlayerPane() {
  const { lang, t } = useLanguage();
  const { videos } = useData();

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasVideoError, setHasVideoError] = useState(false);
  
  // Playback Mode: 'playlist_loop' (Auto Next & Loop All), 'single_loop' (Repeat Current), 'shuffle' (Random)
  const [playbackMode, setPlaybackMode] = useState('playlist_loop');
  const [transitionNotification, setTransitionNotification] = useState('');

  // Clean / Focus Mode States for Clear Video View
  const [isFocusMode, setIsFocusMode] = useState(false); // Hides playlist & categories, expands video
  const [isCleanView, setIsCleanView] = useState(false); // Hides on-screen badges and controls completely
  const [isControlsVisible, setIsControlsVisible] = useState(true);

  const videoRef = useRef(null);
  const containerWrapperRef = useRef(null);
  const toastTimeoutRef = useRef(null);
  const isTransitioningRef = useRef(false);
  const hideControlsTimerRef = useRef(null);

  // Filter videos by category
  const activeVideos = videos.filter(v => {
    const isAct = v.active !== false && v.isActive !== false && v.is_active !== false;
    if (!isAct) return false;
    if (selectedCategory === 'all') return true;
    return v.category === selectedCategory;
  });

  const currentVideoIndexRef = useRef(currentVideoIndex);
  const activeVideosRef = useRef(activeVideos);
  const playbackModeRef = useRef(playbackMode);

  useEffect(() => {
    currentVideoIndexRef.current = currentVideoIndex;
  }, [currentVideoIndex]);

  useEffect(() => {
    activeVideosRef.current = activeVideos;
  }, [activeVideos]);

  useEffect(() => {
    playbackModeRef.current = playbackMode;
  }, [playbackMode]);

  const currentVideo = activeVideos[currentVideoIndex] || activeVideos[0] || null;
  const ytEmbedUrl = currentVideo ? getYouTubeEmbedUrl(currentVideo.url, playbackMode) : null;

  // Sync index if active list shrinks
  useEffect(() => {
    if (currentVideoIndex >= activeVideos.length && activeVideos.length > 0) {
      setCurrentVideoIndex(0);
    }
  }, [activeVideos.length, currentVideoIndex]);

  // Auto-hide controls after 2.8 seconds of mouse inactivity over video
  const handleMouseMove = () => {
    setIsControlsVisible(true);
    if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
    hideControlsTimerRef.current = setTimeout(() => {
      if (isPlaying) {
        setIsControlsVisible(false);
      }
    }, 2800);
  };

  const handleMouseLeave = () => {
    if (isPlaying) {
      setIsControlsVisible(false);
    }
  };

  // Show quick toast notification
  const showToast = (msg) => {
    setTransitionNotification(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setTransitionNotification('');
    }, 2800);
  };

  // Cycle playback mode
  const cyclePlaybackMode = () => {
    setPlaybackMode((prev) => {
      if (prev === 'playlist_loop') {
        showToast(lang === 'id' ? '🔂 Mode: Ulangi 1 Video Ini (Single Loop)' : '🔂 Mode: Repeat Current Video (Single Loop)');
        return 'single_loop';
      }
      if (prev === 'single_loop') {
        showToast(lang === 'id' ? '🔀 Mode: Putar Acak Playlist (Shuffle)' : '🔀 Mode: Shuffle Playlist');
        return 'shuffle';
      }
      showToast(lang === 'id' ? '🔁 Mode: Putar Otomatis & Ulangi Playlist' : '🔁 Mode: Auto-Next & Loop Playlist');
      return 'playlist_loop';
    });
  };

  // Toggle Focus Mode (hide/show playlist & headers)
  const toggleFocusMode = () => {
    setIsFocusMode(prev => {
      const next = !prev;
      showToast(next 
        ? (lang === 'id' ? '📺 Mode Fokus Aktif (Fitur & Playlist Disembunyikan)' : '📺 Focus Mode Active (Features & Playlist Hidden)') 
        : (lang === 'id' ? '📺 Mode Normal (Fitur & Playlist Ditampilkan)' : '📺 Normal Mode (Features & Playlist Shown)')
      );
      return next;
    });
  };

  // Toggle Clean View (hide/show overlays on video)
  const toggleCleanView = () => {
    setIsCleanView(prev => {
      const next = !prev;
      showToast(next 
        ? (lang === 'id' ? '👁️ Tampilan Bersih Aktif (Kontrol Disembunyikan)' : '👁️ Clean View Active (Overlays Hidden)') 
        : (lang === 'id' ? '👁️ Kontrol Ditampilkan' : '👁️ Controls Shown')
      );
      return next;
    });
  };

  // Toggle Fullscreen on wrapper
  const toggleFullScreen = () => {
    const el = containerWrapperRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      if (el.requestFullscreen) {
        el.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // Trigger next video or loop
  const triggerNextVideo = (isAuto = false) => {
    const list = activeVideosRef.current;
    const mode = playbackModeRef.current;
    const curIdx = currentVideoIndexRef.current;

    if (!list || list.length === 0) return;

    if (mode === 'single_loop' || list.length === 1) {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(e => console.warn(e));
        if (isAuto) {
          showToast(lang === 'id' ? '🔂 Mengulang video ini...' : '🔂 Replaying current video...');
        }
      }
      return;
    }

    if (mode === 'shuffle') {
      let nextIdx = Math.floor(Math.random() * list.length);
      if (nextIdx === curIdx && list.length > 1) {
        nextIdx = (nextIdx + 1) % list.length;
      }
      setCurrentVideoIndex(nextIdx);
      setIsPlaying(true);
      const nextVid = list[nextIdx];
      if (isAuto && nextVid) {
        showToast((lang === 'id' ? '🔀 Putar Acak: ' : '🔀 Shuffled to: ') + nextVid.title);
      }
      return;
    }

    // Default: 'playlist_loop' -> advance to next video in queue
    const nextIdx = (curIdx + 1) % list.length;
    setCurrentVideoIndex(nextIdx);
    setIsPlaying(true);
    const nextVid = list[nextIdx];
    if (isAuto && nextVid) {
      showToast((lang === 'id' ? '▶ Memutar Berikutnya: ' : '▶ Playing Next: ') + nextVid.title);
    }
  };

  // Video time update listener
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const cur = videoRef.current.currentTime;
      const dur = videoRef.current.duration;
      setCurrentTime(cur);
      setDuration(dur || 0);

      // Robust check: if video is at the very end and onEnded somehow didn't fire
      if (dur > 1 && cur >= dur - 0.25 && !isTransitioningRef.current) {
        isTransitioningRef.current = true;
        triggerNextVideo(true);
        setTimeout(() => {
          isTransitioningRef.current = false;
        }, 1500);
      }
    }
  };

  // Handler when video ends natively
  const handleVideoEnded = () => {
    if (!isTransitioningRef.current) {
      isTransitioningRef.current = true;
      triggerNextVideo(true);
      setTimeout(() => {
        isTransitioningRef.current = false;
      }, 1500);
    }
  };

  // When currentVideoIndex changes, reload and play
  useEffect(() => {
    setHasVideoError(false);
    if (videoRef.current && currentVideo && !ytEmbedUrl) {
      videoRef.current.currentTime = 0;
      videoRef.current.load();
      if (isPlaying) {
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn("Autoplay notice:", err);
          });
        }
      }
    }
  }, [currentVideoIndex, currentVideo?.url, ytEmbedUrl]);

  const handleNextVideo = () => {
    triggerNextVideo(false);
  };

  const handlePrevVideo = () => {
    const list = activeVideosRef.current;
    if (list && list.length > 0) {
      setCurrentVideoIndex((prev) => (prev - 1 + list.length) % list.length);
      setIsPlaying(true);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
      setIsControlsVisible(true);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const formatSec = (seconds) => {
    if (isNaN(seconds)) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const categories = [
    { id: 'all', name: t('catAll'), icon: Layers },
    { id: 'course_promo', name: t('catCoursePromo'), icon: GraduationCap },
    { id: 'instructional', name: t('catInstructional'), icon: BookOpen },
    { id: 'k3_safety', name: t('catK3Safety'), icon: ShieldCheck },
    { id: 'campus_ad', name: t('catCampusAd'), icon: Megaphone }
  ];

  const showOverlayControls = !isCleanView && (isControlsVisible || !isPlaying);

  return (
    <div 
      ref={containerWrapperRef}
      className={`flex flex-col h-full bg-slate-900/90 rounded-2xl border border-cyan-500/20 shadow-2xl overflow-hidden glass-panel transition-all duration-300 ${
        isFocusMode ? 'p-0' : ''
      }`}
    >
      
      {/* Category Pills & Mode Switcher Header (Hidden in Focus Mode) */}
      {!isFocusMode && (
        <div className="p-2.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between gap-2 overflow-x-auto shrink-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <Film className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200 hidden sm:inline">
              {t('mediaHubTitle')}
            </span>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setCurrentVideoIndex(0);
                  }}
                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-cyan-900/40 border border-cyan-400/40'
                      : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-700/80 border border-slate-700/50'
                  }`}
                >
                  <Icon className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-cyan-400'}`} />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Clear View / Focus Mode Action Buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={toggleFocusMode}
              className={`p-1.5 rounded-lg border text-xs font-bold transition-all ${
                isFocusMode 
                  ? 'bg-cyan-600 text-white border-cyan-400' 
                  : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
              }`}
              title={isFocusMode ? t('showFeatures') : t('hideFeatures')}
            >
              <Tv className="w-3.5 h-3.5 text-cyan-300" />
            </button>
          </div>
        </div>
      )}

      {/* Main Video Display Area */}
      <div 
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={() => {
          if (isCleanView) {
            setIsCleanView(false);
          }
        }}
        className={`relative bg-black flex items-center justify-center overflow-hidden group transition-all duration-300 ${
          isFocusMode ? 'flex-1 h-full' : 'aspect-video'
        }`}
      >
        {currentVideo ? (
          ytEmbedUrl ? (
            <iframe
              src={ytEmbedUrl}
              title={currentVideo.title}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <>
              {hasVideoError ? (
                <div className="flex flex-col items-center justify-center p-6 text-center text-slate-400 space-y-2">
                  <AlertCircle className="w-10 h-10 text-amber-400 animate-pulse" />
                  <p className="text-xs font-bold text-white">Video tidak dapat diputar atau format tidak didukung browser.</p>
                  <button
                    onClick={() => handleNextVideo(false)}
                    className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg"
                  >
                    Putar Video Berikutnya
                  </button>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  key={currentVideo.id || currentVideo.url || currentVideoIndex}
                  src={currentVideo.url}
                  poster={currentVideo.thumbnail}
                  autoPlay
                  muted={isMuted}
                  playsInline
                  loop={playbackMode === 'single_loop'}
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={handleVideoEnded}
                  onError={() => setHasVideoError(true)}
                  className="w-full h-full object-contain bg-black"
                />
              )}

              {/* Video Overlay Top Badge (Now Playing & Category) */}
              <div 
                className={`absolute top-3 left-3 flex items-center gap-2 z-10 transition-opacity duration-300 ${
                  showOverlayControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              >
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md border border-cyan-500/30 text-white text-xs font-bold uppercase tracking-wide">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                  {t('nowPlaying')}
                </span>

                <span className="px-2.5 py-1 rounded-md bg-blue-950/80 backdrop-blur-md border border-blue-500/40 text-blue-300 text-xs font-bold">
                  {lang === 'id' ? currentVideo.categoryName : currentVideo.categoryNameEn || currentVideo.categoryName}
                </span>
              </div>

              {/* Floating Quick Action Buttons at Top Right of Video */}
              <div 
                className={`absolute top-3 right-3 flex items-center gap-1.5 z-20 transition-opacity duration-300 ${
                  showOverlayControls || isFocusMode || isCleanView ? 'opacity-100' : 'opacity-0 hover:opacity-100'
                }`}
              >
                {/* Toggle Clean View (Hide/Show Overlays) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCleanView();
                  }}
                  className={`p-1.5 rounded-lg backdrop-blur-md border text-xs font-bold transition-all ${
                    isCleanView 
                      ? 'bg-amber-950/90 text-amber-300 border-amber-400 shadow-lg' 
                      : 'bg-black/70 text-slate-300 hover:text-white border-white/20'
                  }`}
                  title={isCleanView ? t('showOverlays') : t('hideOverlays')}
                >
                  {isCleanView ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5" />}
                </button>

                {/* Toggle Focus Mode (Expand Video & Hide Playlist) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFocusMode();
                  }}
                  className={`p-1.5 rounded-lg backdrop-blur-md border text-xs font-bold transition-all ${
                    isFocusMode 
                      ? 'bg-cyan-600 text-white border-cyan-300 shadow-lg shadow-cyan-950' 
                      : 'bg-black/70 text-slate-300 hover:text-white border-white/20'
                  }`}
                  title={isFocusMode ? t('showFeatures') : t('hideFeatures')}
                >
                  {isFocusMode ? (
                    <div className="flex items-center gap-1 px-1">
                      <Minimize2 className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold hidden sm:inline">{t('showFeatures')}</span>
                    </div>
                  ) : (
                    <Maximize2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {/* Transition Banner Overlay Toast */}
              {transitionNotification && !isCleanView && (
                <div className="absolute top-12 inset-x-4 z-20 flex justify-center pointer-events-none animate-fadeIn">
                  <div className="px-3.5 py-1.5 rounded-full bg-cyan-950/90 backdrop-blur-md border border-cyan-400/50 text-cyan-200 text-xs font-extrabold shadow-xl shadow-cyan-950/80 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                    <span className="truncate max-w-xs">{transitionNotification}</span>
                  </div>
                </div>
              )}

              {/* Video Controls Bar Overlay */}
              <div 
                className={`absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/95 via-black/70 to-transparent flex flex-col gap-2 transition-opacity duration-300 ${
                  showOverlayControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Progress Bar */}
                <div 
                  className="w-full bg-slate-700/60 h-1.5 rounded-full overflow-hidden relative cursor-pointer group/bar"
                  onClick={(e) => {
                    if (videoRef.current && duration) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const pos = (e.clientX - rect.left) / rect.width;
                      videoRef.current.currentTime = pos * duration;
                    }
                  }}
                >
                  <div 
                    className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full rounded-full transition-all"
                    style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                  ></div>
                </div>

                {/* Controls & Times */}
                <div className="flex items-center justify-between gap-2 text-white">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handlePrevVideo}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all text-slate-200"
                      title="Previous Video"
                    >
                      <SkipBack className="w-4 h-4" />
                    </button>

                    <button
                      onClick={togglePlay}
                      className="p-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all shadow-md"
                      title={isPlaying ? "Pause" : "Play"}
                    >
                      {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                    </button>

                    <button
                      onClick={handleNextVideo}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all text-slate-200"
                      title="Next Video"
                    >
                      <SkipForward className="w-4 h-4" />
                    </button>

                    {/* Playback Mode Switcher Button */}
                    <button
                      onClick={cyclePlaybackMode}
                      className={`p-1.5 rounded-lg flex items-center gap-1 text-xs font-bold transition-all ${
                        playbackMode === 'single_loop'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : playbackMode === 'shuffle'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                            : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      }`}
                      title={
                        playbackMode === 'single_loop'
                          ? t('modeLoopOne')
                          : playbackMode === 'shuffle'
                            ? t('modeShuffle')
                            : t('modeLoopAll')
                      }
                    >
                      {playbackMode === 'single_loop' ? (
                        <>
                          <Repeat1 className="w-4 h-4 text-amber-400" />
                          <span className="text-[10px] hidden md:inline font-mono">1-Loop</span>
                        </>
                      ) : playbackMode === 'shuffle' ? (
                        <>
                          <Shuffle className="w-4 h-4 text-purple-400" />
                          <span className="text-[10px] hidden md:inline font-mono">Shuffle</span>
                        </>
                      ) : (
                        <>
                          <Repeat className="w-4 h-4 text-cyan-400" />
                          <span className="text-[10px] hidden md:inline font-mono">Auto-Next</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={toggleMute}
                      className={`p-1.5 rounded-lg transition-all ${
                        isMuted ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}
                      title={isMuted ? t('unmuteAudio') : t('muteAudio')}
                    >
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>

                    <span className="font-mono text-xs text-slate-300 ml-1">
                      {formatSec(currentTime)} / {formatSec(duration || 0)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-slate-300 hidden sm:inline-flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                      <Clock className="w-3 h-3 text-cyan-400" />
                      {currentVideo.scheduleSlot}
                    </span>

                    {/* Clean view toggle button inside controls */}
                    <button
                      onClick={toggleCleanView}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all"
                      title={t('cleanView')}
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            </>
          )
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
            <Film className="w-12 h-12 text-slate-600 mb-2" />
            <p className="text-sm font-semibold">Tidak ada video dalam kategori ini.</p>
          </div>
        )}
      </div>

      {/* Current Video Info Card (Hidden in Focus Mode) */}
      {!isFocusMode && currentVideo && (
        <div className="p-3.5 bg-slate-950/60 border-b border-slate-800/80 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm md:text-base font-extrabold text-white leading-snug line-clamp-1">
              {lang === 'id' ? currentVideo.title : currentVideo.titleEn || currentVideo.title}
            </h3>
            <button
              onClick={toggleFocusMode}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 font-bold shrink-0 flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30"
              title="Perbesar video & sembunyikan playlist"
            >
              <Tv className="w-3 h-3" />
              <span>{t('focusMode')}</span>
            </button>
          </div>
          <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
            {lang === 'id' ? currentVideo.description : currentVideo.descriptionEn || currentVideo.description}
          </p>
        </div>
      )}

      {/* Playlist Drawer Queue (Hidden in Focus Mode) */}
      {!isFocusMode && (
        <div className="flex-1 p-3 overflow-y-auto min-h-[140px]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                {t('playlist')} ({activeVideos.length})
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Quick Playback Mode Badge Toggle in Playlist Header */}
              <button
                onClick={cyclePlaybackMode}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${
                  playbackMode === 'single_loop'
                    ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                    : playbackMode === 'shuffle'
                      ? 'bg-purple-950/80 text-purple-300 border-purple-500/40'
                      : 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40'
                }`}
                title="Klik untuk ganti mode pemutaran video"
              >
                {playbackMode === 'single_loop' ? (
                  <>
                    <Repeat1 className="w-3 h-3 text-amber-400" />
                    <span>{lang === 'id' ? 'Ulangi 1 Video' : '1-Video Loop'}</span>
                  </>
                ) : playbackMode === 'shuffle' ? (
                  <>
                    <Shuffle className="w-3 h-3 text-purple-400" />
                    <span>{lang === 'id' ? 'Putar Acak' : 'Shuffle'}</span>
                  </>
                ) : (
                  <>
                    <Repeat className="w-3 h-3 text-cyan-400" />
                    <span>{lang === 'id' ? 'Auto-Next Playlist' : 'Auto-Next Loop'}</span>
                  </>
                )}
              </button>

              <span className="text-[11px] text-cyan-400 font-semibold hidden sm:inline">
                {selectedCategory === 'all' ? t('catAll') : activeVideos[0]?.categoryName}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {activeVideos.map((vid, idx) => {
              const isCurrent = idx === currentVideoIndex;
              return (
                <div
                  key={vid.id || idx}
                  onClick={() => {
                    setCurrentVideoIndex(idx);
                    setIsPlaying(true);
                    if (videoRef.current) {
                      videoRef.current.currentTime = 0;
                      videoRef.current.play();
                    }
                  }}
                  className={`flex items-center gap-2.5 p-2 rounded-xl cursor-pointer transition-all border ${
                    isCurrent
                      ? 'bg-cyan-950/70 border-cyan-400 shadow-md shadow-cyan-950/50 ring-1 ring-cyan-400/40'
                      : 'bg-slate-800/50 hover:bg-slate-800 border-slate-700/50 hover:border-slate-600'
                  }`}
                >
                  <div className="relative w-16 h-12 rounded-lg overflow-hidden shrink-0 bg-slate-900 border border-slate-700/50">
                    <img
                      src={vid.thumbnail || "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80"}
                      alt={vid.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80";
                      }}
                    />
                    {isCurrent && (
                      <div className="absolute inset-0 bg-cyan-600/40 flex items-center justify-center">
                        <Play className="w-4 h-4 text-white fill-current animate-pulse" />
                      </div>
                    )}
                    <span className="absolute bottom-0.5 right-0.5 bg-black/80 text-[9px] font-mono text-slate-200 px-1 rounded">
                      {vid.duration}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-cyan-400 block truncate">
                      {lang === 'id' ? vid.categoryName : vid.categoryNameEn || vid.categoryName}
                    </span>
                    <h4 className={`text-xs font-bold leading-tight truncate ${isCurrent ? 'text-cyan-200' : 'text-slate-200'}`}>
                      {lang === 'id' ? vid.title : vid.titleEn || vid.title}
                    </h4>
                    <span className="text-[10px] text-slate-400 block truncate mt-0.5">
                      {vid.scheduleSlot}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
