import React, { useState, useEffect } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  Lock, 
  UserCheck, 
  LogOut, 
  Sparkles, 
  Languages, 
  Clock, 
  CloudSun, 
  ShieldAlert,
  Radio
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { speakText, stopSpeaking } from '../utils/speechHelper.js';

export function Header({ onOpenAdminModal }) {
  const { lang, toggleLanguage, t } = useLanguage();
  const { user, isAuthenticated, logout } = useAuth();
  
  const [time, setTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Live Clock Updater (WITA / UTC+8)
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Format date and time according to active language
  const formattedTime = time.toLocaleTimeString(lang === 'id' ? 'id-ID' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const formattedDate = time.toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Toggle Fullscreen / Kiosk Mode
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(console.error);
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(console.error);
    }
  };

  // Trigger Welcoming Voice Announcement (TTS)
  const handleSpeakWelcome = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
      return;
    }

    const textToSpeak = lang === 'id'
      ? "Selamat datang di Layanan Digital Signage Laboratorium Instalasi dan Sistem Tenaga Listrik, Program Studi D4 Teknik Listrik, Jurusan Teknik Elektro, Politeknik Negeri Manado. Utamakan selalu Keselamatan dan Kesehatan Kerja K3."
      : "Welcome to the Digital Signage Service of Electrical Installation and Power Systems Laboratory, D4 Electrical Engineering Study Program, Department of Electrical Engineering, Manado State Polytechnic. Always prioritize Occupational Safety and Health.";

    speakText(
      textToSpeak,
      lang,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false)
    );
  };

  return (
    <header className="w-full bg-[#0b192c]/95 border-b border-cyan-500/20 backdrop-blur-md sticky top-0 z-40 px-4 py-2.5 shadow-xl">
      <div className="max-w-[1920px] mx-auto flex items-center justify-between gap-4">
        
        {/* Left: POLIMDO Logo & Lab Identity */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="relative group cursor-pointer">
            <img 
              src="/polimdo-logo.svg" 
              alt="POLIMDO Logo" 
              className="w-12 h-12 md:w-14 md:h-14 object-contain drop-shadow-[0_0_12px_rgba(2,132,199,0.5)] transition-transform duration-300 group-hover:scale-105" 
            />
            <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] md:text-xs font-bold tracking-widest uppercase text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
                {t('institution')}
              </span>
              <span className="text-[10px] md:text-xs font-medium text-slate-400 hidden sm:inline">
                {t('deptName')}
              </span>
            </div>
            
            <h1 className="text-sm md:text-lg lg:text-xl font-extrabold text-white tracking-tight leading-tight truncate">
              {t('prodiName')}
            </h1>
            
            <p className="text-[11px] md:text-xs font-semibold text-amber-400 tracking-wide flex items-center gap-1.5 truncate">
              <Radio className="w-3 h-3 animate-pulse text-amber-400" />
              {t('labName')}
            </p>
          </div>
        </div>

        {/* Center: Live Clock & Weather Widget */}
        <div className="hidden lg:flex items-center gap-6 px-4 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700/50 shadow-inner">
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-cyan-400 animate-pulse" />
            <div className="flex flex-col text-left">
              <span className="font-mono text-lg font-black tracking-wider text-cyan-300 leading-none">
                {formattedTime} <span className="text-[10px] text-cyan-500 font-sans">WITA</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium capitalize">
                {formattedDate}
              </span>
            </div>
          </div>

          <div className="h-7 w-[1px] bg-slate-700"></div>

          <div className="flex items-center gap-2">
            <CloudSun className="w-5 h-5 text-amber-400" />
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-slate-200 leading-none">
                {t('weatherCity')}
              </span>
              <span className="text-[10px] text-amber-300 font-medium">
                {t('weatherCondition')}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Controls (Bilingual, TTS Voice, Fullscreen, Admin Login) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* Language Switcher */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/90 text-xs font-bold text-slate-200 border border-slate-600/50 transition-all hover:border-cyan-400 hover:text-cyan-300 shadow-sm"
            title="Toggle Indonesian / English"
          >
            <Languages className="w-3.5 h-3.5 text-cyan-400" />
            <span className="uppercase">{lang === 'id' ? 'ID 🇮🇩' : 'EN 🇬🇧'}</span>
          </button>

          {/* Voice Speech Trigger */}
          <button
            onClick={handleSpeakWelcome}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md ${
              isSpeaking
                ? 'bg-amber-500 text-slate-950 border border-amber-300 animate-pulse'
                : 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-900 hover:text-white'
            }`}
            title={lang === 'id' ? 'Putar Suara Pengumuman' : 'Play Voice Announcement'}
          >
            {isSpeaking ? (
              <>
                <VolumeX className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('voiceSpeaking')}</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">{t('voiceAnnounce')}</span>
              </>
            )}
          </button>

          {/* Fullscreen Kiosk Mode */}
          <button
            onClick={handleToggleFullscreen}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/90 text-xs font-semibold text-slate-300 border border-slate-600/50 transition-all hover:border-cyan-400"
            title={t('kioskMode')}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 text-cyan-400" /> : <Maximize2 className="w-4 h-4 text-cyan-400" />}
          </button>

          {/* Admin / Faculty Login / Portal */}
          {isAuthenticated ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={onOpenAdminModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-xs font-bold text-white shadow-lg shadow-emerald-900/40 transition-all border border-emerald-400/40"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{user?.name?.split(' ')[0]} ({user?.role})</span>
                <span className="md:hidden">Admin</span>
              </button>
              <button
                onClick={logout}
                className="p-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-500/30 transition-all"
                title={t('logout')}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAdminModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-xs font-bold text-white shadow-lg shadow-blue-900/40 transition-all border border-cyan-400/30"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('adminLogin')}</span>
              <span className="sm:hidden">Login</span>
            </button>
          )}

        </div>

      </div>
    </header>
  );
}
