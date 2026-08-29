import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  BookOpen, 
  Award, 
  Clock, 
  MapPin, 
  Search, 
  X, 
  ExternalLink,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useData } from '../context/DataContext.jsx';
import { useAutoScroll } from '../hooks/useAutoScroll.js';
import { AutoScrollController } from './AutoScrollController.jsx';

export function FacultyView() {
  const { lang, t } = useLanguage();
  const { faculty } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState(null);

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

  const filteredFaculty = faculty.filter((f) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchName = f.name && f.name.toLowerCase().includes(q);
    const matchTitle = (f.title && f.title.toLowerCase().includes(q)) || 
                       (f.titleEn && f.titleEn.toLowerCase().includes(q));
    const matchExpertise = (f.expertise && f.expertise.toLowerCase().includes(q)) || 
                           (f.expertiseId && f.expertiseId.toLowerCase().includes(q));
    const matchNip = f.nip && f.nip.toLowerCase().includes(q);
    return matchName || matchTitle || matchExpertise || matchNip;
  });

  return (
    <div className="flex flex-col h-full gap-3 overflow-hidden">
      
      {/* Search Header */}
      <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t('searchFacultyPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 text-xs rounded-lg border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
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

          <span className="text-xs font-bold text-slate-400 whitespace-nowrap hidden sm:inline">
            {filteredFaculty.length} {t('tabFaculty')}
          </span>
        </div>
      </div>

      {/* Faculty Grid Cards */}
      <div 
        ref={containerRef} 
        className="flex-1 overflow-y-auto pr-1 grid grid-cols-1 md:grid-cols-2 gap-3 scroll-smooth"
      >
        {filteredFaculty.map((fac) => (
          <div
            key={fac.id}
            onClick={() => setSelectedFaculty(fac)}
            className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-700/60 hover:border-cyan-400/60 shadow-lg hover:shadow-cyan-950/40 transition-all cursor-pointer flex gap-3.5 group"
          >
            {/* Faculty Portrait Image */}
            <div className="relative w-20 h-24 rounded-xl overflow-hidden shrink-0 bg-slate-950 border border-cyan-500/30 group-hover:scale-105 transition-transform duration-300">
              <img
                src={fac.photo || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"}
                alt={fac.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80";
                }}
              />
              <span className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 to-transparent py-0.5 text-center text-[9px] font-bold text-cyan-300 uppercase">
                {lang === 'id' ? fac.role : fac.roleEn || fac.role}
              </span>
            </div>

            {/* Faculty Summary Info */}
            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <div>
                <h4 className="text-xs md:text-sm font-extrabold text-white leading-tight group-hover:text-cyan-300 transition-colors truncate">
                  {fac.name}
                </h4>
                <p className="text-[11px] font-medium text-cyan-400 line-clamp-1 mt-0.5">
                  {lang === 'id' ? fac.title : fac.titleEn || fac.title}
                </p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  {t('nip')}: {fac.nip}
                </p>
              </div>

              <div className="mt-2 space-y-1">
                <div className="text-[10px] text-slate-300 line-clamp-1 flex items-center gap-1">
                  <Award className="w-3 h-3 text-amber-400 shrink-0" />
                  <span className="truncate">{lang === 'id' ? (fac.expertiseId || fac.expertise) : fac.expertise}</span>
                </div>
                <div className="text-[10px] text-slate-400 line-clamp-1 flex items-center gap-1">
                  <Mail className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span className="truncate">{fac.email}</span>
                </div>
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* Full Faculty Modal View */}
      {selectedFaculty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative glass-panel-glow">
            
            <button
              onClick={() => setSelectedFaculty(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
              <div className="w-32 h-40 rounded-2xl overflow-hidden shrink-0 bg-slate-950 border-2 border-cyan-400 shadow-lg">
                <img
                  src={selectedFaculty.photo}
                  alt={selectedFaculty.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 text-center sm:text-left">
                <span className="px-2.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                  {lang === 'id' ? selectedFaculty.role : selectedFaculty.roleEn || selectedFaculty.role}
                </span>

                <h3 className="text-lg font-black text-white mt-2 leading-tight">
                  {selectedFaculty.name}
                </h3>
                <p className="text-xs font-semibold text-cyan-400 mt-0.5">
                  {lang === 'id' ? selectedFaculty.title : selectedFaculty.titleEn || selectedFaculty.title}
                </p>

                <div className="mt-4 space-y-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-400 min-w-[70px]">{t('nip')}:</span>
                    <span className="font-mono text-cyan-200">{selectedFaculty.nip}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-400 min-w-[70px]">{t('nidn')}:</span>
                    <span className="font-mono text-cyan-200">{selectedFaculty.nidn || '-'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-cyan-400 shrink-0" />
                    <a href={`mailto:${selectedFaculty.email}`} className="text-cyan-300 hover:underline">
                      {selectedFaculty.email}
                    </a>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{t('officeHours')}: {selectedFaculty.officeHours}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{t('officeRoom')}: {selectedFaculty.room}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Expertise & Courses */}
            <div className="mt-5 pt-4 border-t border-slate-800 space-y-3">
              <div>
                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  {t('expertise')}
                </h5>
                <p className="text-xs text-slate-200 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  {lang === 'id' ? (selectedFaculty.expertiseId || selectedFaculty.expertise) : selectedFaculty.expertise}
                </p>
              </div>

              {selectedFaculty.courses && selectedFaculty.courses.length > 0 && (
                <div>
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    {t('coursesTaught')}
                  </h5>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedFaculty.courses.map((course, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-md bg-blue-950/70 border border-blue-500/30 text-blue-300 text-xs font-semibold"
                      >
                        {course}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
