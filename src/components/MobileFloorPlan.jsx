import React, { useState } from 'react';
import { 
  ArrowLeft, 
  MapPin, 
  ShieldCheck, 
  Zap, 
  Send, 
  Smartphone, 
  Package, 
  CheckCircle2, 
  AlertTriangle,
  FileText,
  Volume2,
  Image as ImageIcon,
  Sparkles,
  Eye,
  Layers
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useData } from '../context/DataContext.jsx';
import { BorrowModal } from './BorrowModal.jsx';

export function MobileFloorPlan({ onBackToSignage }) {
  const { lang, t } = useLanguage();
  const { labZones, inventory } = useData();

  const [selectedZone, setSelectedZone] = useState(labZones[0] || null);
  const [borrowingItem, setBorrowingItem] = useState(null);
  const [viewMode, setViewMode] = useState('blueprint'); // 'blueprint' or 'image'
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallPwa = async () => {
    if (!installPrompt) {
      alert('Untuk menyimpan ke HP secara offline:\n1. Buka menu browser (titik tiga ⋮ di Chrome atau tombol Bagikan 📤 di Safari).\n2. Pilih "Tambahkan ke Layar Utama / Add to Home Screen".');
      return;
    }
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setInstallPrompt(null);
    }
  };

  const getZoneTheme = (zone) => {
    const isSelected = selectedZone && selectedZone.id === zone.id;

    if (isSelected) {
      return { fill: 'rgba(56, 189, 248, 0.35)', stroke: '#38bdf8', text: '#ffffff' };
    }

    switch (zone.id) {
      case 'zone_digital':
        return { fill: 'rgba(239, 68, 68, 0.22)', stroke: '#ef4444', text: '#fecaca' };
      case 'zone_otomasi':
        return { fill: 'rgba(250, 204, 21, 0.20)', stroke: '#facc15', text: '#fef08a' };
      case 'zone_bengkel':
        return { fill: 'rgba(79, 117, 255, 0.22)', stroke: '#4f75ff', text: '#dbeafe' };
      case 'zone_instalasi':
        return { fill: 'rgba(241, 245, 249, 0.15)', stroke: '#cbd5e1', text: '#ffffff' };
      case 'zone_pengukuran':
        return { fill: 'rgba(6, 182, 212, 0.22)', stroke: '#06b6d4', text: '#cffafe' };
      case 'zone_plc':
        return { fill: 'rgba(249, 115, 22, 0.22)', stroke: '#f97316', text: '#ffedd5' };
      case 'zone_dosen':
        return { fill: 'rgba(132, 204, 22, 0.22)', stroke: '#84cc16', text: '#ecfccb' };
      case 'zone_ujicoba':
        return { fill: 'rgba(29, 78, 216, 0.25)', stroke: '#2563eb', text: '#dbeafe' };
      default:
        return { fill: 'rgba(30, 41, 59, 0.2)', stroke: '#64748b', text: '#cbd5e1' };
    }
  };

  return (
    <div className="min-h-screen bg-[#070f1e] text-slate-100 p-3 sm:p-4 max-w-lg mx-auto flex flex-col gap-3">
      
      {/* Mobile Top Header */}
      <header className="p-3 bg-slate-900/90 rounded-2xl border border-cyan-500/30 flex items-center justify-between shadow-xl">
        <button
          onClick={onBackToSignage}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-xs font-bold text-slate-300 hover:text-white border border-slate-700"
        >
          <ArrowLeft className="w-4 h-4 text-cyan-400" />
          <span>Layar Utama</span>
        </button>

        <div className="flex items-center gap-2">
          <img src="/polimdo-logo.svg" alt="POLIMDO" className="w-8 h-8 object-contain" />
          <div className="text-right">
            <span className="text-[9px] font-bold text-cyan-400 block uppercase">POLIMDO</span>
            <span className="text-xs font-black text-white block">Lab D4 Listrik</span>
          </div>
        </div>
      </header>

      {/* Offline Status & PWA Install Bar */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-900/95 border border-slate-800 text-[11px]">
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'}`} />
          <span className="font-semibold text-slate-200">
            {isOnline ? 'Mode Online / Caching Aktif' : 'Mode Offline (Tanpa Internet)'}
          </span>
        </div>

        {!isInstalled && (
          <button
            onClick={handleInstallPwa}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[10px] shadow"
          >
            <span>📥 Pasang Offline</span>
          </button>
        )}
      </div>

      {/* Banner Intro */}
      <div className="p-3.5 bg-gradient-to-r from-blue-950/80 to-cyan-950/80 rounded-2xl border border-cyan-500/30 shadow-lg">
        <div className="flex items-center justify-between">
          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-cyan-900/80 text-cyan-300 border border-cyan-500/40">
            Mobile Blueprint Map
          </span>

          <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-[10px]">
            <button
              onClick={() => setViewMode('blueprint')}
              className={`px-2 py-0.5 rounded font-bold transition-all ${
                viewMode === 'blueprint' ? 'bg-cyan-600 text-white' : 'text-slate-400'
              }`}
            >
              Blueprint
            </button>
            <button
              onClick={() => setViewMode('image')}
              className={`px-2 py-0.5 rounded font-bold transition-all ${
                viewMode === 'image' ? 'bg-cyan-600 text-white' : 'text-slate-400'
              }`}
            >
              Sketsa
            </button>
          </div>
        </div>

        <h2 className="text-base font-black text-white mt-1.5 leading-tight">
          Denah Tata Letak Laboratorium
        </h2>
        <p className="text-xs text-slate-300 mt-1">
          Ketuk salah satu ruangan pada denah untuk memeriksa status, kapasitas, dan meminjam peralatan.
        </p>
      </div>

      {/* Interactive Mobile Blueprint SVG */}
      <div className="p-2 bg-slate-950/90 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
        <div className="w-full aspect-[1000/700] relative flex items-center justify-center bg-slate-950 rounded-xl overflow-hidden">
          <svg viewBox="0 0 1000 700" className="w-full h-full object-contain">
            <defs>
              <pattern id="gridMobileCustom" width="25" height="25" patternUnits="userSpaceOnUse">
                <path d="M 25 0 L 0 0 0 25" fill="none" stroke="rgba(56, 189, 248, 0.07)" strokeWidth="1" />
              </pattern>
            </defs>

            {viewMode === 'image' ? (
              <>
                <image
                  href="/lab-floor-plan.png"
                  x="0"
                  y="0"
                  width="1000"
                  height="700"
                  preserveAspectRatio="none"
                />

                {labZones.map((zone) => {
                  const { coords } = zone;
                  const isSelected = selectedZone && selectedZone.id === zone.id;

                  return (
                    <g
                      key={zone.id}
                      onClick={() => setSelectedZone(zone)}
                      className="cursor-pointer"
                    >
                      <rect
                        x={coords.x}
                        y={coords.y}
                        width={coords.w}
                        height={coords.h}
                        fill={isSelected ? 'rgba(56, 189, 248, 0.35)' : 'transparent'}
                        stroke={isSelected ? '#38bdf8' : 'rgba(255, 255, 255, 0.2)'}
                        strokeWidth={isSelected ? 4 : 1}
                        strokeDasharray={isSelected ? 'none' : '4 4'}
                      />

                      <circle
                        cx={coords.x + 28}
                        cy={coords.y + 28}
                        r={isSelected ? 10 : 7}
                        fill={zone.status === 'occupied' ? '#ef4444' : '#10b981'}
                        stroke="#ffffff"
                        strokeWidth="2"
                      />
                    </g>
                  );
                })}
              </>
            ) : (
              <>
                <rect width="1000" height="700" fill="#030712" rx="10" />
                <rect width="1000" height="700" fill="url(#gridMobileCustom)" rx="10" />
                <rect width="992" height="692" x="4" y="4" fill="none" stroke="#0284c7" strokeWidth="2.5" rx="10" opacity="0.6" />

                {/* Central Hallway / Corridor */}
                <path
                  d="M 15 335 L 780 335 L 780 495 L 620 495 L 620 685 L 515 685 L 515 450 L 15 450 Z"
                  fill="rgba(15, 23, 42, 0.7)"
                  stroke="#334155"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />

                {/* Central Installation Title */}
                <g className="select-none">
                  <rect x="30" y="360" width="380" height="50" rx="8" fill="rgba(15, 23, 42, 0.9)" stroke="#94a3b8" strokeWidth="1.5" />
                  <text x="220" y="390" fill="#ffffff" fontSize="13" fontWeight="900" textAnchor="middle" letterSpacing="1">
                    LABORATORIUM INSTALASI LISTRIK
                  </text>
                  <text x="220" y="403" fill="#38bdf8" fontSize="8.5" fontWeight="700" textAnchor="middle">
                    • AREA UTAMA INSTALASI & KORIDOR •
                  </text>
                </g>

                {/* Entrance Marker */}
                <g transform="translate(567, 685)">
                  <path d="M -45 0 L 45 0" stroke="#10b981" strokeWidth="6" strokeLinecap="round" />
                  <text x="0" y="-10" fill="#10b981" fontSize="9" fontWeight="900" textAnchor="middle">
                    ▲ PINTU MASUK UTAMA ▲
                  </text>
                </g>

                {/* Render Rooms */}
                {labZones.map((zone) => {
                  const { coords } = zone;
                  const theme = getZoneTheme(zone);
                  const isSelected = selectedZone && selectedZone.id === zone.id;

                  if (zone.id === 'zone_instalasi') {
                    return (
                      <g
                        key={zone.id}
                        onClick={() => setSelectedZone(zone)}
                        className="cursor-pointer"
                      >
                        <rect
                          x={coords.x}
                          y={coords.y}
                          width={coords.w}
                          height={coords.h}
                          fill={isSelected ? 'rgba(56, 189, 248, 0.25)' : 'transparent'}
                          stroke={isSelected ? '#38bdf8' : 'transparent'}
                          strokeWidth={isSelected ? 3 : 0}
                          rx="8"
                        />
                      </g>
                    );
                  }

                  return (
                    <g
                      key={zone.id}
                      onClick={() => setSelectedZone(zone)}
                      className="cursor-pointer"
                    >
                      <rect
                        x={coords.x}
                        y={coords.y}
                        width={coords.w}
                        height={coords.h}
                        rx="8"
                        fill={theme.fill}
                        stroke={theme.stroke}
                        strokeWidth={isSelected ? 3.5 : 1.5}
                      />

                      {/* Header Badge */}
                      <rect
                        x={coords.x + 6}
                        y={coords.y + 6}
                        width={zone.code.length > 8 ? 80 : 60}
                        height="18"
                        rx="4"
                        fill="rgba(0, 0, 0, 0.75)"
                        stroke={theme.stroke}
                        strokeWidth="1"
                      />
                      <text
                        x={coords.x + (zone.code.length > 8 ? 46 : 36)}
                        y={coords.y + 18}
                        fill={theme.stroke}
                        fontSize="9"
                        fontWeight="900"
                        textAnchor="middle"
                      >
                        {zone.code}
                      </text>

                      {/* Status Circle */}
                      <circle
                        cx={coords.x + coords.w - 14}
                        cy={coords.y + 15}
                        r={isSelected ? 5.5 : 4}
                        fill={zone.status === 'occupied' ? '#ef4444' : '#10b981'}
                        stroke="#ffffff"
                        strokeWidth="1.5"
                      />

                      {/* Room Labels */}
                      {zone.id === 'zone_digital' && (
                        <g>
                          <text x={coords.x + coords.w / 2} y={coords.y + 130} fill={theme.text} fontSize="11" fontWeight="900" textAnchor="middle">
                            LABORATORIUM
                          </text>
                          <text x={coords.x + coords.w / 2} y={coords.y + 148} fill={theme.text} fontSize="11" fontWeight="900" textAnchor="middle">
                            DIGITAL & MIKRO
                          </text>
                        </g>
                      )}

                      {zone.id === 'zone_otomasi' && (
                        <g>
                          <text x={coords.x + coords.w / 2} y={coords.y + 140} fill={theme.text} fontSize="12" fontWeight="900" textAnchor="middle">
                            LABORATORIUM
                          </text>
                          <text x={coords.x + coords.w / 2} y={coords.y + 160} fill={theme.text} fontSize="12" fontWeight="900" textAnchor="middle">
                            OTOMASI
                          </text>
                        </g>
                      )}

                      {zone.id === 'zone_bengkel' && (
                        <g>
                          <text x={coords.x + coords.w / 2} y={coords.y + 200} fill={theme.text} fontSize="20" fontWeight="900" textAnchor="middle">
                            BENGKEL LISTRIK
                          </text>
                        </g>
                      )}

                      {zone.id === 'zone_pengukuran' && (
                        <g>
                          <text x={coords.x + coords.w / 2} y={coords.y + 105} fill={theme.text} fontSize="10.5" fontWeight="900" textAnchor="middle">
                            LAB PENGUKURAN &
                          </text>
                          <text x={coords.x + coords.w / 2} y={coords.y + 123} fill={theme.text} fontSize="10.5" fontWeight="900" textAnchor="middle">
                            ELEKTRONIKA
                          </text>
                        </g>
                      )}

                      {zone.id === 'zone_plc' && (
                        <g>
                          <text x={coords.x + coords.w / 2} y={coords.y + 110} fill={theme.text} fontSize="11" fontWeight="900" textAnchor="middle">
                            LABORATORIUM
                          </text>
                          <text x={coords.x + coords.w / 2} y={coords.y + 130} fill={theme.text} fontSize="11" fontWeight="900" textAnchor="middle">
                            OTOMASI & PLC
                          </text>
                        </g>
                      )}

                      {zone.id === 'zone_dosen' && (
                        <g>
                          <text x={coords.x + coords.w / 2} y={coords.y + 90} fill={theme.text} fontSize="11" fontWeight="900" textAnchor="middle">
                            RUANGAN
                          </text>
                          <text x={coords.x + coords.w / 2} y={coords.y + 110} fill={theme.text} fontSize="11" fontWeight="900" textAnchor="middle">
                            DOSEN
                          </text>
                        </g>
                      )}

                      {zone.id === 'zone_ujicoba' && (
                        <g>
                          <text x={coords.x + coords.w / 2} y={coords.y + 110} fill={theme.text} fontSize="12" fontWeight="900" textAnchor="middle">
                            RUANGAN
                          </text>
                          <text x={coords.x + coords.w / 2} y={coords.y + 130} fill={theme.text} fontSize="12" fontWeight="900" textAnchor="middle">
                            UJI COBA
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </>
            )}
          </svg>
        </div>

        <div className="pt-2 text-center text-[11px] text-cyan-400 font-semibold border-t border-slate-800">
          * Ketuk salah satu ruangan pada denah untuk melihat detail peralatan
        </div>
      </div>

      {/* Selected Station Details Card */}
      {selectedZone && (
        <div className="p-4 bg-slate-900/90 rounded-2xl border border-cyan-500/40 shadow-xl space-y-3">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800">
            <div>
              <span className="text-[10px] font-mono font-bold text-cyan-400 block uppercase">
                {selectedZone.code}
              </span>
              <h3 className="text-sm font-black text-white">
                {lang === 'id' ? selectedZone.name : selectedZone.nameEn || selectedZone.name}
              </h3>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
              selectedZone.status === 'occupied'
                ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
            }`}>
              {selectedZone.status === 'occupied' ? 'Sedang Digunakan' : 'Tersedia'}
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Aktivitas / Sesi:</span>
              <span className="font-semibold text-right max-w-[200px]">{selectedZone.currentClass}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Kapasitas Mahasiswa:</span>
              <span className="font-semibold text-cyan-300">{selectedZone.capacity}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Standar K3:</span>
              <span className="font-semibold text-amber-300">{selectedZone.safetyLevel}</span>
            </div>
          </div>

          {selectedZone.equipment && selectedZone.equipment.length > 0 && (
            <div className="pt-2 border-t border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">
                Peralatan & Trainer Tersedia:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedZone.equipment.map((eq, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 text-[11px] font-medium border border-slate-700"
                  >
                    {eq}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Tool Booking Shortcut */}
      <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Package className="w-4 h-4 text-cyan-400" />
            Alat Lab Siap Dipinjam
          </h3>
          <span className="text-[10px] text-cyan-400 font-semibold">Real-time Stock</span>
        </div>

        <div className="space-y-2">
          {inventory.slice(0, 4).map((item) => (
            <div
              key={item.id}
              className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-2"
            >
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-white truncate">{item.name}</h4>
                <span className="text-[10px] text-emerald-400 font-mono">
                  Tersedia: {item.availableStock} {item.unit}
                </span>
              </div>

              <button
                onClick={() => setBorrowingItem(item)}
                disabled={item.availableStock <= 0}
                className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-xs font-bold shrink-0 transition-all"
              >
                Pinjam
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* K3 Safety Rules Card */}
      <div className="p-4 bg-amber-950/30 rounded-2xl border border-amber-500/40 text-amber-200 text-xs space-y-1.5">
        <h4 className="font-bold uppercase flex items-center gap-1.5 text-amber-400 text-[11px]">
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          K3 Listrik Wajib D4 POLIMDO
        </h4>
        <p className="text-[11px] leading-relaxed text-amber-300/90">
          1. Wajib memakai Sepatu Safety & Jas Lab.<br/>
          2. Periksa grounding sebelum menghidupkan catu daya 3-Phase.<br/>
          3. Laporkan bila ada kabel terkelupas atau isolasi rusak kepada Teknisi Lab.
        </p>
      </div>

      {/* Borrow Modal on Mobile */}
      {borrowingItem && (
        <BorrowModal
          item={borrowingItem}
          onClose={() => setBorrowingItem(null)}
          onSuccess={() => setBorrowingItem(null)}
        />
      )}

    </div>
  );
}
