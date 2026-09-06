import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  Tv,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useData, DEFAULT_VIDEOS } from '../context/DataContext.jsx';

/**
 * Extracts YouTube Video ID from any standard URL format:
 * - https://youtu.be/ID?si=...
 * - https://www.youtube.com/watch?v=ID
 * - https://www.youtube.com/embed/ID
 * - https://www.youtube.com/shorts/ID
 * - https://www.youtube.com/live/ID
 */
function extractYouTubeId(url) {
  if (!url || typeof url !== 'string') return null;
  const cleanUrl = url.trim();
  const match = cleanUrl.match(
    /(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

/**
 * Extracts Google Drive preview URL from sharing links
 */
export function extractGoogleDrivePreview(url) {
  if (!url || typeof url !== 'string') return null;
  const clean = url.trim();
  const matchFile = clean.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (matchFile) return `https://drive.google.com/file/d/${matchFile[1]}/preview`;
  const matchId = clean.match(/drive\.google\.com\/(?:open|uc|file)\?(?:.*&)?id=([a-zA-Z0-9_-]+)/);
  if (matchId) return `https://drive.google.com/file/d/${matchId[1]}/preview`;
  return null;
}

/**
 * Converts duration string (MM:SS or HH:MM:SS) to total seconds
 */
function parseDurationSeconds(durationStr) {
  if (!durationStr) return 180;
  if (typeof durationStr === 'number') return durationStr > 0 ? durationStr : 180;
  const parts = String(durationStr).trim().split(':').map(Number);
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return Math.max(1, parts[0] * 60 + parts[1]);
  }
  if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return Math.max(1, parts[0] * 3600 + parts[1] * 60 + parts[2]);
  }
  const parsed = parseInt(durationStr, 10);
  return isNaN(parsed) || parsed <= 0 ? 180 : parsed;
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
  const iframeRef = useRef(null);
  const containerWrapperRef = useRef(null);
  const toastTimeoutRef = useRef(null);
  const isTransitioningRef = useRef(false);
  const hideControlsTimerRef = useRef(null);

  const sourceVideos = (videos && videos.length > 0) ? videos : DEFAULT_VIDEOS;

  // Flexible category filtering
  const activeVideos = sourceVideos.filter(v => {
    const isAct = v.active !== false && v.isActive !== false && v.is_active !== false;
    if (!isAct) return false;
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'k3_safety' && (v.category === 'k3_safety' || v.category === 'safety')) return true;
    if (selectedCategory === 'instructional' && (v.category === 'instructional' || v.category === 'tutorial')) return true;
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

  // Determine media type
  const ytVideoId = currentVideo ? extractYouTubeId(currentVideo.url) : null;
  const gdriveUrl = currentVideo && !ytVideoId ? extractGoogleDrivePreview(currentVideo.url) : null;
  
  // Build YouTube Embed URL with autoplay, mute, enablejsapi
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const ytEmbedUrl = ytVideoId 
    ? `https://www.youtube.com/embed/${ytVideoId}?autoplay=1&mute=${isMuted ? 1 : 0}&loop=${playbackMode === 'single_loop' ? 1 : 0}&playlist=${ytVideoId}&enablejsapi=1&origin=${origin}&rel=0&playsinline=1&controls=1`
    : null;
  const isEmbed = Boolean(ytEmbedUrl || gdriveUrl);
  const embedUrl = ytEmbedUrl || gdriveUrl;

  // Sync index if active list shrinks
  useEffect(() => {
    if (currentVideoIndex >= activeVideos.length && activeVideos.length > 0) {
      setCurrentVideoIndex(0);
    }
  }, [activeVideos.length, currentVideoIndex]);

  // Show quick toast notification
  const showToast = useCallback((msg) => {
    setTransitionNotification(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setTransitionNotification('');
    }, 2800);
  }, []);

  // Auto-hide controls after 3 seconds of mouse inactivity over video
  const handleMouseMove = () => {
    setIsControlsVisible(true);
    if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
    hideControlsTimerRef.current = setTimeout(() => {
      if (isPlaying) {
        setIsControlsVisible(false);
      }
    }, 3000);
  };

  const handleMouseLeave = () => {
    if (isPlaying) {
      setIsControlsVisible(false);
    }
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
        ? (lang === 'id' ? '📺 Mode Fokus Aktif (Layar Video Maksimal)' : '📺 Focus Mode Active (Full Video View)') 
        : (lang === 'id' ? '📺 Mode Normal (Playlist Ditampilkan)' : '📺 Normal Mode (Playlist Shown)')
      );
      return next;
    });
  };

  // Toggle Clean View (hide/show overlays on video)
  const toggleCleanView = () => {
    setIsCleanView(prev => {
      const next = !prev;
      showToast(next 
        ? (lang === 'id' ? '👁️ Tampilan Bersih Aktif' : '👁️ Clean View Active') 
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
  const triggerNextVideo = useCallback((isAuto = false) => {
    const list = activeVideosRef.current;
    const mode = playbackModeRef.current;
    const curIdx = currentVideoIndexRef.current;

    if (!list || list.length === 0) return;

    setHasVideoError(false);

    if (mode === 'single_loop' || list.length === 1) {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(e => console.warn(e));
      }
      if (iframeRef.current && iframeRef.current.contentWindow) {
        try {
          iframeRef.current.contentWindow.postMessage('{"event":"command","func":"seekTo","args":[0, true]}', '*');
          iframeRef.current.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
        } catch {}
      }
      if (isAuto) {
        showToast(lang === 'id' ? '🔂 Mengulang video ini...' : '🔂 Replaying current video...');
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
      setCurrentTime(0);
      const nextVid = list[nextIdx];
      if (nextVid) {
        showToast((lang === 'id' ? '🔀 Putar Acak: ' : '🔀 Shuffled to: ') + (lang === 'id' ? nextVid.title : (nextVid.titleEn || nextVid.title)));
      }
      return;
    }

    // Default: 'playlist_loop' -> advance to next video in queue
    const nextIdx = (curIdx + 1) % list.length;
    setCurrentVideoIndex(nextIdx);
    setIsPlaying(true);
    setCurrentTime(0);
    const nextVid = list[nextIdx];
    if (nextVid) {
      showToast((lang === 'id' ? '▶ Memutar Berikutnya: ' : '▶ Playing Next: ') + (lang === 'id' ? nextVid.title : (nextVid.titleEn || nextVid.title)));
    }
  }, [lang, showToast]);

  // Video time update listener for HTML5 <video>
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const cur = videoRef.current.currentTime;
      const dur = videoRef.current.duration;
      setCurrentTime(cur);
      setDuration(dur || 0);

      // End check
      if (dur > 1 && cur >= dur - 0.3 && !isTransitioningRef.current) {
        isTransitioningRef.current = true;
        triggerNextVideo(true);
        setTimeout(() => {
          isTransitioningRef.current = false;
        }, 1500);
      }
    }
  };

  // Handler when HTML5 video ends natively
  const handleVideoEnded = () => {
    if (!isTransitioningRef.current) {
      isTransitioningRef.current = true;
      triggerNextVideo(true);
      setTimeout(() => {
        isTransitioningRef.current = false;
      }, 1500);
    }
  };

  // Listen for YouTube iframe postMessage events (onStateChange === 0 -> ENDED)
  useEffect(() => {
    const handleMessage = (event) => {
      try {
        if (!event.data) return;
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        
        // YouTube API events
        if (data && data.event === 'onStateChange') {
          // info: 0 = ENDED, 1 = PLAYING, 2 = PAUSED
          if (data.info === 0) {
            if (!isTransitioningRef.current) {
              isTransitioningRef.current = true;
              triggerNextVideo(true);
              setTimeout(() => {
                isTransitioningRef.current = false;
              }, 1500);
            }
          } else if (data.info === 1) {
            setIsPlaying(true);
          } else if (data.info === 2) {
            setIsPlaying(false);
          }
        }
      } catch (err) {
        // Ignore non-JSON postMessages
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [triggerNextVideo]);

  // Fallback timer for YouTube / Embed iframe duration tracking & auto-advance
  useEffect(() => {
    if (!isEmbed || !isPlaying || !currentVideo) return;

    const targetSec = currentVideo.durationSec || parseDurationSeconds(currentVideo.duration);
    setDuration(targetSec);
    setCurrentTime(0);

    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        const next = prev + 1;
        if (next >= targetSec) {
          if (!isTransitioningRef.current) {
            isTransitioningRef.current = true;
            triggerNextVideo(true);
            setTimeout(() => {
              isTransitioningRef.current = false;
            }, 1500);
          }
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isEmbed, currentVideoIndex, currentVideo?.id, isPlaying, triggerNextVideo]);

  // When currentVideo changes, reset error and play
  useEffect(() => {
    setHasVideoError(false);
    setCurrentTime(0);
    if (videoRef.current && currentVideo && !isEmbed) {
      videoRef.current.currentTime = 0;
      videoRef.current.load();
      if (isPlaying) {
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn("Autoplay policy notice:", err);
          });
        }
      }
    }
  }, [currentVideoIndex, currentVideo?.url, isEmbed]);

  const handleVideoError = useCallback(() => {
    console.warn("Media playback error on URL:", currentVideo?.url);
    setHasVideoError(true);
    const list = activeVideosRef.current;
    if (list && list.length > 1 && !isTransitioningRef.current) {
      setTimeout(() => {
        if (!isTransitioningRef.current) {
          isTransitioningRef.current = true;
          triggerNextVideo(true);
          setTimeout(() => {
            isTransitioningRef.current = false;
          }, 1500);
        }
      }, 2200);
    }
  }, [currentVideo?.url, triggerNextVideo]);

  const handleNextVideo = () => {
    triggerNextVideo(false);
  };

  const handlePrevVideo = () => {
    const list = activeVideosRef.current;
    if (list && list.length > 0) {
      setHasVideoError(false);
      setCurrentTime(0);
      const prevIdx = (currentVideoIndex - 1 + list.length) % list.length;
      setCurrentVideoIndex(prevIdx);
      setIsPlaying(true);
      const prevVid = list[prevIdx];
      if (prevVid) {
        showToast((lang === 'id' ? '◀ Memutar Sebelumnya: ' : '◀ Playing Previous: ') + (lang === 'id' ? prevVid.title : (prevVid.titleEn || prevVid.title)));
      }
    }
  };

  const togglePlay = () => {
    if (isEmbed) {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        try {
          if (isPlaying) {
            iframeRef.current.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
            setIsPlaying(false);
            setIsControlsVisible(true);
          } else {
            iframeRef.current.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
            setIsPlaying(true);
          }
        } catch {
          setIsPlaying(!isPlaying);
        }
      } else {
        setIsPlaying(!isPlaying);
      }
      return;
    }

    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
        setIsControlsVisible(true);
      } else {
        videoRef.current.play().catch(e => console.warn(e));
        setIsPlaying(true);
      }
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    if (isEmbed && iframeRef.current && iframeRef.current.contentWindow) {
      try {
        if (nextMuted) {
          iframeRef.current.contentWindow.postMessage('{"event":"command","func":"mute","args":""}', '*');
        } else {
          iframeRef.current.contentWindow.postMessage('{"event":"command","func":"unMute","args":""}', '*');
        }
      } catch {}
    }

    if (videoRef.current) {
      videoRef.current.muted = nextMuted;
    }
  };

  const handleSelectVideo = (idx) => {
    setHasVideoError(false);
    setCurrentVideoIndex(idx);
    setIsPlaying(true);
    setCurrentTime(0);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(e => console.warn(e));
    }
    const selectedVid = activeVideos[idx];
    if (selectedVid) {
      showToast((lang === 'id' ? '▶ Memutar: ' : '▶ Playing: ') + (lang === 'id' ? selectedVid.title : (selectedVid.titleEn || selectedVid.title)));
    }
  };

  const formatSec = (seconds) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
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

          {/* Quick Focus Mode Action Button */}
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
          <>
            {/* 1. MEDIA PLAYER (YouTube Embed OR Direct HTML5 Video) */}
            {isEmbed ? (
              <iframe
                key={`yt-frame-${currentVideo.id || currentVideoIndex}-${ytVideoId || 'embed'}`}
                ref={iframeRef}
                src={embedUrl}
                title={currentVideo.title}
                className="w-full h-full border-0 absolute inset-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : hasVideoError ? (
              <div className="flex flex-col items-center justify-center p-6 text-center text-slate-400 space-y-2 z-10">
                <AlertCircle className="w-10 h-10 text-amber-400 animate-pulse" />
                <p className="text-xs font-bold text-white">Video tidak dapat diputar atau format tidak didukung browser.</p>
                <button
                  onClick={() => handleNextVideo()}
                  className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg shadow-md"
                >
                  Putar Video Berikutnya
                </button>
              </div>
            ) : (
              <video
                ref={videoRef}
                key={`html5-${currentVideo.id || currentVideo.url || currentVideoIndex}`}
                src={currentVideo.url}
                poster={currentVideo.thumbnail}
                autoPlay
                muted={isMuted}
                playsInline
                loop={playbackMode === 'single_loop'}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleVideoEnded}
                onError={handleVideoError}
                className="w-full h-full object-contain bg-black absolute inset-0"
              />
            )}

            {/* 2. TOP OVERLAY BADGES (Now Playing, Category & Quick Controls) */}
            <div 
              className={`absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-20 transition-opacity duration-300 ${
                showOverlayControls ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <div className="flex items-center gap-2 pointer-events-auto">
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/75 backdrop-blur-md border border-cyan-500/40 text-white text-xs font-bold uppercase tracking-wide shadow-lg">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                  {t('nowPlaying')}
                </span>

                <span className="px-2.5 py-1 rounded-md bg-blue-950/85 backdrop-blur-md border border-blue-500/40 text-blue-300 text-xs font-bold shadow-lg truncate max-w-[180px]">
                  {lang === 'id' ? currentVideo.categoryName : currentVideo.categoryNameEn || currentVideo.categoryName}
                </span>

                {ytVideoId && (
                  <span className="px-2 py-0.5 rounded-md bg-red-950/80 border border-red-500/50 text-red-300 text-[10px] font-bold hidden sm:inline-flex items-center gap-1">
                    YouTube
                  </span>
                )}
              </div>

              {/* Floating Quick Action Buttons at Top Right */}
              <div className="flex items-center gap-1.5 pointer-events-auto">
                {/* Toggle Clean View */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCleanView();
                  }}
                  className={`p-1.5 rounded-lg backdrop-blur-md border text-xs font-bold transition-all shadow-lg ${
                    isCleanView 
                      ? 'bg-amber-950/90 text-amber-300 border-amber-400' 
                      : 'bg-black/75 text-slate-300 hover:text-white border-white/20'
                  }`}
                  title={isCleanView ? t('showOverlays') : t('hideOverlays')}
                >
                  {isCleanView ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5" />}
                </button>

                {/* Toggle Focus Mode */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFocusMode();
                  }}
                  className={`p-1.5 rounded-lg backdrop-blur-md border text-xs font-bold transition-all shadow-lg ${
                    isFocusMode 
                      ? 'bg-cyan-600 text-white border-cyan-300 shadow-cyan-950' 
                      : 'bg-black/75 text-slate-300 hover:text-white border-white/20'
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
            </div>

            {/* 3. CENTER TOAST NOTIFICATION OVERLAY */}
            {transitionNotification && !isCleanView && (
              <div className="absolute top-12 inset-x-4 z-30 flex justify-center pointer-events-none animate-fadeIn">
                <div className="px-4 py-1.5 rounded-full bg-cyan-950/95 backdrop-blur-md border border-cyan-400/60 text-cyan-200 text-xs font-extrabold shadow-2xl shadow-cyan-950/90 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                  <span className="truncate max-w-sm">{transitionNotification}</span>
                </div>
              </div>
            )}

            {/* 4. BOTTOM VIDEO CONTROLS OVERLAY BAR */}
            <div 
              className={`absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/95 via-black/75 to-transparent flex flex-col gap-2 z-20 transition-opacity duration-300 ${
                showOverlayControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Progress Bar */}
              <div 
                className="w-full bg-slate-700/60 h-1.5 rounded-full overflow-hidden relative cursor-pointer group/bar"
                onClick={(e) => {
                  if (videoRef.current && duration > 0) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const pos = (e.clientX - rect.left) / rect.width;
                    videoRef.current.currentTime = pos * duration;
                  }
                }}
              >
                <div 
                  className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full rounded-full transition-all"
                  style={{ width: `${duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0}%` }}
                ></div>
              </div>

              {/* Action Buttons & Time */}
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
                    {currentVideo.scheduleSlot || 'Rotasi Teratur'}
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
              const vidYtId = extractYouTubeId(vid.url);
              const thumbUrl = vid.thumbnail || (vidYtId ? `https://img.youtube.com/vi/${vidYtId}/hqdefault.jpg` : "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80");

              return (
                <div
                  key={vid.id || idx}
                  onClick={() => handleSelectVideo(idx)}
                  className={`flex items-center gap-2.5 p-2 rounded-xl cursor-pointer transition-all border ${
                    isCurrent
                      ? 'bg-cyan-950/80 border-cyan-400 shadow-lg shadow-cyan-950/60 ring-2 ring-cyan-400/40'
                      : 'bg-slate-800/50 hover:bg-slate-800 border-slate-700/50 hover:border-slate-600'
                  }`}
                >
                  <div className="relative w-16 h-12 rounded-lg overflow-hidden shrink-0 bg-slate-900 border border-slate-700/50">
                    <img
                      src={thumbUrl}
                      alt={vid.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80";
                      }}
                    />
                    {isCurrent && (
                      <div className="absolute inset-0 bg-cyan-600/50 flex items-center justify-center">
                        <Play className="w-4 h-4 text-white fill-current animate-pulse" />
                      </div>
                    )}
                    <span className="absolute bottom-0.5 right-0.5 bg-black/80 text-[9px] font-mono text-slate-200 px-1 rounded">
                      {vid.duration || '03:00'}
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
                      {vid.scheduleSlot || 'Rotasi Teratur'}
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
