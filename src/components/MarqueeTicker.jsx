import React, { useState } from 'react';
import { 
  AlertCircle, 
  ShieldAlert, 
  Sparkles, 
  Megaphone, 
  Bell, 
  QrCode, 
  Smartphone, 
  X, 
  Copy, 
  Check, 
  ExternalLink,
  Globe
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useData, DEFAULT_ANNOUNCEMENTS } from '../context/DataContext.jsx';

export function MarqueeTicker() {
  const { lang, t } = useLanguage();
  const { announcements } = useData();

  const [showQrModal, setShowQrModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const sourceList = (announcements && announcements.length > 0) ? announcements : DEFAULT_ANNOUNCEMENTS;
  const urgentList = sourceList.filter(a => a.isActive !== false && a.active !== false && a.is_active !== false);

  // Dynamic website URL to be encoded into the QR Code
  const webUrl = typeof window !== 'undefined' 
    ? (window.location.origin && window.location.origin !== 'null' ? window.location.origin : 'https://polimdo-ds-afinal-82thpfz7t-joshuaturangan-dev.vercel.app')
    : 'https://polimdo-ds-afinal-82thpfz7t-joshuaturangan-dev.vercel.app';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(webUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  return (
    <>
      <footer className="w-full bg-[#060e1b] border-t border-cyan-500/20 py-2 px-3 sm:px-4 shadow-2xl relative overflow-hidden z-30">
        <div className="flex items-center justify-between gap-3">
          
          {/* Left: Ticker Header Badge */}
          <div className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-700 text-white font-extrabold text-xs px-3 py-1 rounded-md shadow-md uppercase tracking-wider shrink-0">
            <Megaphone className="w-3.5 h-3.5 animate-bounce" />
            <span className="hidden sm:inline">LIVE TICKER</span>
          </div>

          {/* Center: Scrolling Content */}
          <div className="overflow-hidden whitespace-nowrap flex-1 relative flex items-center min-w-0">
            <div className="animate-marquee-smooth flex items-center gap-8 text-xs font-semibold text-slate-200">
              
              {/* K3 Safety Motto */}
              <span className="flex items-center gap-2 text-amber-400 bg-amber-950/40 border border-amber-500/30 px-3 py-0.5 rounded-full shrink-0">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                {t('safetySlogan')}
              </span>

              {/* Urgent Announcements */}
              {urgentList.map((ann, idx) => (
                <span key={ann.id || idx} className="flex items-center gap-2 text-cyan-300 shrink-0">
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
              <span className="flex items-center gap-2 text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 px-3 py-0.5 rounded-full shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                {t('mottoPolimdo')}
              </span>

            </div>
          </div>

          {/* Right: QR Code Access Badge */}
          <button
            onClick={() => setShowQrModal(true)}
            className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-cyan-300 hover:text-white font-extrabold text-xs shadow-lg border border-cyan-500/40 hover:border-cyan-300 shrink-0 transition-all cursor-pointer group hover:scale-[1.03] active:scale-95"
            title={t('scanWebTitle') || 'Scan QR Code Akses Website'}
          >
            <div className="p-0.5 bg-white rounded shadow-sm group-hover:scale-105 transition-transform">
              <QRCodeSVG value={webUrl} size={18} level="L" />
            </div>
            <div className="flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5 text-cyan-400 group-hover:animate-bounce" />
              <span className="hidden md:inline whitespace-nowrap text-[11px] font-bold">
                {t('scanWebAccess') || 'SCAN AKSES WEB'}
              </span>
              <span className="md:hidden text-[10px]">QR</span>
            </div>
          </button>

        </div>
      </footer>

      {/* Interactive Modal: Large QR Code Scan & Share */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-cyan-500/40 rounded-2xl shadow-2xl p-6 overflow-hidden">
            
            {/* Background Glow */}
            <div className="absolute -top-20 -right-20 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

            {/* Modal Header */}
            <div className="flex items-center justify-between gap-3 mb-4 relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-md shadow-cyan-900/40">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    {t('scanWebTitle') || 'Akses Portal dari Smartphone'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Politeknik Negeri Manado • D4 Teknik Listrik
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowQrModal(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* QR Code Container */}
            <div className="flex flex-col items-center justify-center my-4 relative z-10">
              <div className="p-4 bg-white rounded-2xl shadow-xl shadow-cyan-950/50 border-2 border-cyan-400/40 transform transition-transform hover:scale-105">
                <QRCodeSVG 
                  value={webUrl} 
                  size={190} 
                  level="H" 
                  includeMargin={false}
                />
              </div>

              <span className="mt-3 text-xs font-semibold text-cyan-300 text-center flex items-center gap-1.5 bg-cyan-950/60 px-3 py-1 rounded-full border border-cyan-500/30">
                <QrCode className="w-3.5 h-3.5" />
                {lang === 'id' ? 'Arahkan Kamera HP ke QR Code' : 'Point Phone Camera to QR Code'}
              </span>
            </div>

            {/* Instruction Description */}
            <p className="text-xs text-slate-300 text-center mb-4 leading-relaxed relative z-10">
              {t('scanWebSubtitle') || 'Buka jadwal praktikum, profil dosen, katalog peminjaman alat, dan denah interaktif laboratorium secara langsung dari smartphone Anda.'}
            </p>

            {/* URL Display & Action Buttons */}
            <div className="space-y-2.5 relative z-10">
              <div className="flex items-center gap-2 p-2 bg-slate-950/80 rounded-xl border border-slate-800 text-xs">
                <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-slate-300 font-mono truncate flex-1 select-all text-[11px]">
                  {webUrl}
                </span>
                <button
                  onClick={handleCopyLink}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 border ${
                    copied
                      ? 'bg-emerald-600 text-white border-emerald-400'
                      : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border-slate-700'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{t('linkCopied') || 'Tersalin!'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>{t('copyLink') || 'Salin Link'}</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex gap-2">
                <a
                  href={webUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-950/50 transition-all border border-cyan-400/40"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{t('openInBrowser') || 'Buka di Tab Baru'}</span>
                </a>
                <button
                  onClick={() => setShowQrModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all border border-slate-700"
                >
                  {lang === 'id' ? 'Tutup' : 'Close'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}

