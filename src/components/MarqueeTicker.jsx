import React from 'react';
import { AlertCircle, ShieldAlert, Sparkles, Megaphone, Bell } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useData } from '../context/DataContext.jsx';

export function MarqueeTicker() {
  const { lang, t } = useLanguage();
  const { announcements } = useData();

  const urgentList = announcements.filter(a => a.isActive);

  return (
    <footer className="w-full bg-[#060e1b] border-t border-cyan-500/20 py-2 px-4 shadow-2xl relative overflow-hidden z-30">
      <div className="flex items-center gap-3">
        
        {/* Ticker Header Badge */}
        <div className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-700 text-white font-extrabold text-xs px-3 py-1 rounded-md shadow-md uppercase tracking-wider shrink-0">
          <Megaphone className="w-3.5 h-3.5 animate-bounce" />
          <span className="hidden sm:inline">LIVE TICKER</span>
        </div>

        {/* Scrolling Content */}
        <div className="overflow-hidden whitespace-nowrap w-full relative flex items-center">
          <div className="animate-marquee-smooth flex items-center gap-8 text-xs font-semibold text-slate-200">
            
            {/* K3 Safety Motto */}
            <span className="flex items-center gap-2 text-amber-400 bg-amber-950/40 border border-amber-500/30 px-3 py-0.5 rounded-full">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              {t('safetySlogan')}
            </span>

            {/* Urgent Announcements */}
            {urgentList.map((ann, idx) => (
              <span key={ann.id || idx} className="flex items-center gap-2 text-cyan-300">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                <span className="font-bold text-white uppercase bg-slate-800/80 px-2 py-0.5 rounded text-[10px] border border-cyan-500/30">
                  {lang === 'id' ? ann.category : ann.categoryEn || ann.category}
                </span>
                <span>{lang === 'id' ? ann.title : ann.titleEn || ann.title}</span>
                <span className="text-slate-400 font-normal hidden md:inline">
                  — {lang === 'id' ? ann.content : ann.contentEn || ann.content}
                </span>
              </span>
            ))}

            {/* POLIMDO Institutional Motto */}
            <span className="flex items-center gap-2 text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 px-3 py-0.5 rounded-full">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              {t('mottoPolimdo')}
            </span>

          </div>
        </div>

      </div>
    </footer>
  );
}
