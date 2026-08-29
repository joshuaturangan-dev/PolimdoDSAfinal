import React from 'react';
import { RotateCcw, ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.jsx';

export function AutoScrollController({
  isEnabled,
  toggleAutoScroll,
  direction = 'down',
  toggleDirection,
  isInteracting,
  isPausedAtEnd,
  pauseReason,
  speed,
  cycleSpeed,
  scrollToTop
}) {
  const { lang, t } = useLanguage();

  return (
    <div className="flex items-center gap-1.5 bg-slate-900/90 px-2 py-1 rounded-lg border border-slate-800 text-xs shrink-0">
      {/* On/Off & Status Toggle */}
      <button
        onClick={toggleAutoScroll}
        className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
          isEnabled
            ? isInteracting || isPausedAtEnd
              ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
              : 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-950/50'
            : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
        }`}
        title={isEnabled ? (lang === 'id' ? "Klik untuk mematikan Auto-Scroll" : "Click to disable Auto-Scroll") : (lang === 'id' ? "Klik untuk mengaktifkan Auto-Scroll" : "Click to enable Auto-Scroll")}
      >
        {isEnabled ? (
          <>
            <span className={`w-2 h-2 rounded-full ${isInteracting || isPausedAtEnd ? 'bg-amber-400' : 'bg-emerald-400 animate-ping'}`}></span>
            <span className="flex items-center gap-1">
              {isInteracting ? (
                lang === 'id' ? 'Jeda (Interaksi)' : 'Paused (Hover)'
              ) : isPausedAtEnd ? (
                pauseReason === 'bottom'
                  ? (lang === 'id' ? 'Jeda Bawah...' : 'Bottom Pause...')
                  : (lang === 'id' ? 'Jeda Atas...' : 'Top Pause...')
              ) : (
                <>
                  <span>Auto-Scroll</span>
                  <span className="font-mono text-cyan-300">
                    {direction === 'down' ? '↓' : '↑'}
                  </span>
                </>
              )}
            </span>
          </>
        ) : (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
            <span>{lang === 'id' ? 'Auto-Scroll OFF' : 'Auto-Scroll OFF'}</span>
          </>
        )}
      </button>

      {isEnabled && (
        <>
          {/* Direction Toggle Button (Up / Down) */}
          {toggleDirection && (
            <button
              onClick={toggleDirection}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 border border-slate-700 transition-all flex items-center gap-0.5 text-[10px] font-bold"
              title={lang === 'id' ? `Arah gulir saat ini: ${direction === 'down' ? 'Turun' : 'Naik'}. Klik untuk balik arah.` : `Current direction: ${direction}. Click to invert.`}
            >
              {direction === 'down' ? (
                <ArrowDown className="w-3 h-3 text-cyan-400 animate-bounce" />
              ) : (
                <ArrowUp className="w-3 h-3 text-amber-400 animate-bounce" />
              )}
            </button>
          )}

          {/* Speed Preset Button */}
          <button
            onClick={cycleSpeed}
            className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-cyan-300 rounded border border-slate-700 uppercase transition-all"
            title={t('autoScrollSpeed')}
          >
            {speed === 'slow' 
              ? (lang === 'id' ? '1x Lambat' : '1x Slow') 
              : speed === 'normal' 
                ? (lang === 'id' ? '2x Sedang' : '2x Normal') 
                : (lang === 'id' ? '3x Cepat' : '3x Fast')}
          </button>

          {/* Reset to top Button */}
          <button
            onClick={scrollToTop}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-cyan-300 transition-colors"
            title={lang === 'id' ? 'Kembali ke atas' : 'Scroll to top'}
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </>
      )}
    </div>
  );
}
