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
  Award,
  Filter
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useData, DEFAULT_ANNOUNCEMENTS } from '../context/DataContext.jsx';
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

  // Use announcements from context, or fallback to DEFAULT_ANNOUNCEMENTS if empty
  const rawList = (announcements && announcements.length > 0) ? announcements : DEFAULT_ANNOUNCEMENTS;

  const activeList = rawList.filter(a => {
    const isAct = a.isActive !== undefined ? Boolean(a.isActive) : (a.active !== undefined ? Boolean(a.active) : (a.is_active !== undefined ? Boolean(a.is_active) : true));
    if (!isAct) return false;
    if (!selectedCategory || selectedCategory === 'all') return true;
    const cat = (a.category || '').toLowerCase();
    const sel = selectedCategory.toLowerCase();
    return cat.includes(sel) || sel.includes(cat);
  });

  const categories = [
    { id: 'all', label: lang === 'id' ? 'Semua' : 'All' },
    { id: 'akademik', label: 'Akademik' },
    { id: 'k3', label: 'K3 Lab' },
    { id: 'sertifikasi', label: 'Sertifikasi' },
    { id: 'workshop', label: 'Workshop' }
  ];

  // Speak Announcements
  const handleReadAnnouncements = () => {
    if (isReading || activeList.length === 0) return;

    let text = "";
    const first = activeList[0];
    if (lang === 'id') {
      text = `Pengumuman penting laboratorium: ${first.title}. ${first.content}`;
    } else {
      text = `Important laboratory announcement: ${first.titleEn || first.title}. ${first.contentEn || first.content}`;
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
    <div className="flex flex-col h-full gap-2.5 overflow-hidden">
      
      {/* Header Bar */}
      <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-cyan-400 animate-pulse" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            {t('announcementBoardTitle')}
          </h3>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            {activeList.length}
          </span>
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
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 border ${
              isReading
                ? 'bg-emerald-600 text-white border-emerald-400 animate-pulse'
                : 'bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border-cyan-500/40'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">{t('voiceReadAnnouncements')}</span>
          </button>
        </div>
      </div>

      {/* Filter Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 px-0.5">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${
                isSelected
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/60 shadow-md shadow-cyan-950/50'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Announcements List */}
      <div 
        ref={containerRef} 
        className="flex-1 overflow-y-auto pr-1 space-y-3 scroll-smooth"
      >
        {activeList.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center p-6 bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
            <Megaphone className="w-8 h-8 text-slate-600 mb-2" />
            <p className="text-xs font-semibold text-slate-400">
              {lang === 'id' ? 'Belum ada pengumuman untuk kategori ini' : 'No announcements found for this category'}
            </p>
          </div>
        ) : (
          activeList.map((ann) => {
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
          })
        )}
      </div>

    </div>
  );
}
