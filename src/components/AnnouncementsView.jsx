import React, { useState } from 'react';
import { 
  Megaphone, 
  AlertTriangle, 
  Calendar, 
  ShieldAlert, 
  Sparkles, 
  CheckCircle, 
  FileText, 
  Volume2, 
  ChevronRight,
  Award
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useData } from '../context/DataContext.jsx';
import { speakText } from '../utils/speechHelper.js';
import { useAutoScroll } from '../hooks/useAutoScroll.js';
import { AutoScrollController } from './AutoScrollController.jsx';

export function AnnouncementsView() {
  const { lang, t } = useLanguage();
  const { announcements } = useData();

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isReading, setIsReading] = useState(false);

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

  const activeList = announcements.filter(a => {
    if (!a.isActive) return false;
    if (selectedCategory === 'all') return true;
    return a.category.toLowerCase() === selectedCategory.toLowerCase();
  });

  // Speak Announcements
  const handleReadAnnouncements = () => {
    if (isReading || activeList.length === 0) return;

    let text = "";
    if (lang === 'id') {
      text = `Pengumuman penting laboratorium: ${activeList[0].title}. ${activeList[0].content}`;
    } else {
      text = `Important laboratory announcement: ${activeList[0].titleEn || activeList[0].title}. ${activeList[0].contentEn || activeList[0].content}`;
    }

    speakText(
      text,
      lang,
      () => setIsReading(true),
      () => setIsReading(false)
    );
  };

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'high':
        return {
          badge: 'bg-red-500/20 text-red-400 border-red-500/40',
          border: 'border-red-500/30 bg-red-950/20',
          dot: 'bg-red-500'
        };
      case 'medium':
        return {
          badge: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
          border: 'border-amber-500/30 bg-amber-950/20',
          dot: 'bg-amber-500'
        };
      default:
        return {
          badge: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
          border: 'border-cyan-500/30 bg-slate-800/40',
          dot: 'bg-cyan-500'
        };
    }
  };

  return (
    <div className="flex flex-col h-full gap-3 overflow-hidden">
      
      {/* Header Bar */}
      <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            {t('announcementBoardTitle')}
          </h3>
        </div>

        <div className="flex items-center gap-2">
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
            onClick={handleReadAnnouncements}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all shrink-0"
          >
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">{t('voiceReadAnnouncements')}</span>
          </button>
        </div>
      </div>

      {/* Announcements List */}
      <div 
        ref={containerRef} 
        className="flex-1 overflow-y-auto pr-1 space-y-3 scroll-smooth"
      >
        {activeList.map((ann) => {
          const style = getPriorityStyle(ann.priority);
          return (
            <div
              key={ann.id}
              className={`p-4 rounded-xl border transition-all hover:border-cyan-400/50 ${style.border}`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider border flex items-center gap-1 ${style.badge}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${style.dot} animate-ping`}></span>
                    {ann.badge || ann.category}
                  </span>
                  <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    {ann.date}
                  </span>
                </div>
              </div>

              <h4 className="text-sm md:text-base font-extrabold text-white leading-snug mb-1.5">
                {lang === 'id' ? ann.title : ann.titleEn || ann.title}
              </h4>

              <p className="text-xs text-slate-300 leading-relaxed">
                {lang === 'id' ? ann.content : ann.contentEn || ann.content}
              </p>

              <div className="mt-3 pt-2.5 border-t border-slate-700/40 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1 text-cyan-400 font-semibold">
                  <Award className="w-3 h-3" />
                  Jurusan Teknik Elektro POLIMDO
                </span>
                <span className="text-slate-400">
                  {lang === 'id' ? `Kategori: ${ann.category}` : `Category: ${ann.categoryEn || ann.category}`}
                </span>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
