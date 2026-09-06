import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  MapPin, 
  QrCode, 
  Smartphone, 
  ShieldAlert, 
  Info, 
  Zap, 
  Layers, 
  ExternalLink,
  CheckCircle2,
  AlertOctagon,
  Wrench,
  Sparkles,
  Eye,
  Radio,
  Image as ImageIcon,
  Compass,
  X
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useData, DEFAULT_LAB_ZONES } from '../context/DataContext.jsx';

const DEFAULT_ZONE_COORDS = {
  zone_digital: { x: 15, y: 15, w: 185, h: 310 },
  zone_otomasi: { x: 210, y: 15, w: 220, h: 310 },
  zone_bengkel: { x: 440, y: 15, w: 545, h: 425 },
  zone_instalasi: { x: 15, y: 335, w: 415, h: 105 },
  zone_pengukuran: { x: 15, y: 450, w: 215, h: 235 },
  zone_plc: { x: 240, y: 450, w: 275, h: 235 },
  zone_dosen: { x: 625, y: 495, w: 155, h: 190 },
  zone_ujicoba: { x: 790, y: 450, w: 195, h: 235 }
};

export function FloorPlanView({ onOpenMobileView }) {
  const { lang, t } = useLanguage();
  const { labZones } = useData();

  // Ensure zones always have coordinates, equipment, and metadata
  const activeZones = (labZones && labZones.length > 0 ? labZones : DEFAULT_LAB_ZONES).map(z => {
    const fallback = DEFAULT_LAB_ZONES.find(d => d.id === z.id || d.code === z.code) || {};
    return {
      ...fallback,
      ...z,
      coords: z.coords || DEFAULT_ZONE_COORDS[z.id] || fallback.coords || { x: 15, y: 15, w: 100, h: 100 },
      equipment: Array.isArray(z.equipment) && z.equipment.length > 0 ? z.equipment : (fallback.equipment || []),
      status: z.status || fallback.status || 'available',
      currentClass: z.currentClass || z.currentActivity || fallback.currentClass || 'Tersedia',
      capacity: z.capacity || (z.maxCapacity ? `${z.maxCapacity} Mahasiswa` : fallback.capacity) || '24 Mahasiswa',
      safetyLevel: z.safetyLevel || fallback.safetyLevel || 'Standar K3 Kelistrikan'
    };
  });

  const [selectedZone, setSelectedZone] = useState(activeZones[0]);
  const [viewMode, setViewMode] = useState('blueprint'); // 'blueprint' or 'image'
  const [showQrConfigModal, setShowQrConfigModal] = useState(false);
  const [customQrUrl, setCustomQrUrl] = useState('');
  const [networkUrl, setNetworkUrl] = useState('');

  // Keep selectedZone in sync when activeZones update
  React.useEffect(() => {
    if (!selectedZone && activeZones.length > 0) {
      setSelectedZone(activeZones[0]);
    } else if (selectedZone) {
      const match = activeZones.find(z => z.id === selectedZone.id);
      if (match && (match.status !== selectedZone.status || match.currentClass !== selectedZone.currentClass)) {
        setSelectedZone(match);
      }
    }
  }, [activeZones, selectedZone]);

  // Fetch local network IP for real mobile scanning
  React.useEffect(() => {
    fetch('/api/system/network-info')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.localUrl) {
          setNetworkUrl(d.localUrl);
        }
      })
      .catch(() => {
        setNetworkUrl(`${window.location.origin}/#mobile-floor-plan`);
      });
  }, []);

  // Effective URL for QR Code (custom URL, or auto-detected local IP, or fallback to window.location)
  const mobileUrl = customQrUrl.trim() || networkUrl || `${window.location.origin}/#mobile-floor-plan`;

  const getZoneTheme = (zone) => {
    const isSelected = selectedZone && selectedZone.id === zone.id;

    if (isSelected) {
      return {
        fill: 'rgba(56, 189, 248, 0.35)',
        stroke: '#38bdf8',
        glow: 'rgba(56, 189, 248, 0.9)',
        text: '#ffffff',
        accent: '#38bdf8'
      };
    }

    switch (zone.id) {
      case 'zone_digital':
        return { fill: 'rgba(239, 68, 68, 0.22)', stroke: '#ef4444', text: '#fecaca', accent: '#f87171' };
      case 'zone_otomasi':
        return { fill: 'rgba(250, 204, 21, 0.20)', stroke: '#facc15', text: '#fef08a', accent: '#fde047' };
      case 'zone_bengkel':
        return { fill: 'rgba(79, 117, 255, 0.22)', stroke: '#4f75ff', text: '#dbeafe', accent: '#93c5fd' };
      case 'zone_instalasi':
        return { fill: 'rgba(241, 245, 249, 0.15)', stroke: '#cbd5e1', text: '#ffffff', accent: '#e2e8f0' };
      case 'zone_pengukuran':
        return { fill: 'rgba(6, 182, 212, 0.22)', stroke: '#06b6d4', text: '#cffafe', accent: '#67e8f9' };
      case 'zone_plc':
        return { fill: 'rgba(249, 115, 22, 0.22)', stroke: '#f97316', text: '#ffedd5', accent: '#fdba74' };
      case 'zone_dosen':
        return { fill: 'rgba(132, 204, 22, 0.22)', stroke: '#84cc16', text: '#ecfccb', accent: '#bef264' };
      case 'zone_ujicoba':
        return { fill: 'rgba(29, 78, 216, 0.25)', stroke: '#2563eb', text: '#dbeafe', accent: '#60a5fa' };
      default:
        return { fill: 'rgba(30, 41, 59, 0.2)', stroke: '#64748b', text: '#cbd5e1', accent: '#94a3b8' };
    }
  };

  return (
    <div className="flex flex-col h-full gap-3 overflow-hidden">
      
      {/* Header & QR Code Bar */}
      <div className="p-3 bg-slate-950/80 rounded-xl border border-cyan-500/30 flex flex-col md:flex-row items-center justify-between gap-3 shrink-0 shadow-lg backdrop-blur-sm">
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-cyan-400 animate-pulse" />
            <h3 className="text-sm font-extrabold text-white">
              {t('floorPlanTitle') || 'Denah Tata Letak Laboratorium Listrik'}
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-cyan-900/60 text-cyan-300 border border-cyan-500/40">
              D4 TEKNIK LISTRIK POLIMDO
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
            {t('floorPlanSubtitle') || 'Denah tata letak 8 ruangan: Bengkel, Lab Otomasi, Lab Digital, Lab Pengukuran, Lab PLC, Ruang Dosen & Ruang Uji Coba.'}
          </p>

          <div className="mt-2 flex items-center gap-2 flex-wrap">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-xs shadow-inner">
              <button
                onClick={() => setViewMode('blueprint')}
                className={`flex items-center gap-1 px-3 py-1 rounded-md font-bold transition-all ${
                  viewMode === 'blueprint'
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3 h-3" />
                <span>Mode Blueprint Vector</span>
              </button>
              <button
                onClick={() => setViewMode('image')}
                className={`flex items-center gap-1 px-3 py-1 rounded-md font-bold transition-all ${
                  viewMode === 'image'
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Eye className="w-3 h-3" />
                <span>Gambar Sketsa</span>
              </button>
            </div>

            {/* Mobile View Shortcut */}
            <button
              onClick={onOpenMobileView}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all border border-slate-700 hover:border-cyan-500/50 shadow"
            >
              <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
              <span>{t('openMobileFloorPlan') || 'Buka di HP'}</span>
              <ExternalLink className="w-3 h-3 ml-0.5" />
            </button>
          </div>
        </div>

        {/* QR Code Card */}
        <div 
          onClick={() => setShowQrConfigModal(true)}
          className="flex items-center gap-3 bg-slate-900/90 p-2.5 rounded-xl border border-cyan-500/40 shrink-0 shadow-inner cursor-pointer hover:border-cyan-400/80 transition-all group"
          title="Klik untuk mengubah URL/IP QR Code atau gunakan Mode Offline"
        >
          <div className="bg-white p-1 rounded-lg shadow-md group-hover:scale-105 transition-transform">
            <QRCodeSVG
              value={mobileUrl}
              size={64}
              level="M"
              includeMargin={false}
              imageSettings={{
                src: "/polimdo-logo.svg",
                x: undefined,
                y: undefined,
                height: 14,
                width: 14,
                excavate: true,
              }}
            />
          </div>

          <div className="text-left flex flex-col justify-center">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] font-black text-cyan-300 uppercase flex items-center gap-1">
                <QrCode className="w-3.5 h-3.5" />
                {t('scanQRTitle') || 'Scan QR Code'}
              </span>
              <span className="text-[8px] bg-cyan-950 text-cyan-400 px-1 rounded border border-cyan-500/30">
                ⚙️ Atur IP
              </span>
            </div>
            <span className="text-[10px] text-slate-300 mt-0.5 max-w-[130px] leading-tight">
              Akses denah & booking alat dari smartphone
            </span>
            <span className="text-[9px] text-emerald-400 font-bold mt-0.5 flex items-center gap-0.5">
              <CheckCircle2 className="w-2.5 h-2.5" />
              100% Siap Offline (PWA)
            </span>
          </div>
        </div>

      </div>

      {/* Main Floor Plan Interactive Canvas */}
      <div className="flex-1 min-h-[220px] bg-slate-950/95 rounded-xl border border-slate-800 p-2 overflow-hidden flex flex-col relative shadow-2xl">
        
        <div className="w-full h-full flex-1 relative flex items-center justify-center overflow-hidden rounded-lg bg-slate-950">
          <svg
            viewBox="0 0 1000 700"
            className="w-full h-full max-h-[340px] object-contain drop-shadow-2xl select-none"
          >
            <defs>
              {/* Blueprint Grid Lines */}
              <pattern id="planGrid" width="25" height="25" patternUnits="userSpaceOnUse">
                <path d="M 25 0 L 0 0 0 25" fill="none" stroke="rgba(56, 189, 248, 0.06)" strokeWidth="1" />
              </pattern>

              {/* Glowing Filter */}
              <filter id="neonActive" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {viewMode === 'image' ? (
              // 1. Image Overlay Mode with exact hotspot clicks
              <>
                <image
                  href="/lab-floor-plan.png"
                  x="0"
                  y="0"
                  width="1000"
                  height="700"
                  preserveAspectRatio="none"
                />

                {activeZones.map((zone) => {
                  const coords = zone.coords || DEFAULT_ZONE_COORDS[zone.id] || { x: 15, y: 15, w: 100, h: 100 };
                  const isSelected = selectedZone && selectedZone.id === zone.id;

                  return (
                    <g
                      key={zone.id}
                      onClick={() => setSelectedZone(zone)}
                      className="cursor-pointer group"
                    >
                      <rect
                        x={coords.x}
                        y={coords.y}
                        width={coords.w}
                        height={coords.h}
                        fill={isSelected ? 'rgba(56, 189, 248, 0.32)' : 'rgba(0, 0, 0, 0.01)'}
                        stroke={isSelected ? '#38bdf8' : 'rgba(255, 255, 255, 0.2)'}
                        strokeWidth={isSelected ? 4 : 1}
                        strokeDasharray={isSelected ? 'none' : '4 4'}
                        className="transition-all duration-200 group-hover:fill-cyan-400/20 group-hover:stroke-cyan-300"
                        filter={isSelected ? 'url(#neonActive)' : 'none'}
                      />

                      <circle
                        cx={coords.x + 28}
                        cy={coords.y + 28}
                        r={isSelected ? 10 : 8}
                        fill={zone.status === 'occupied' ? '#ef4444' : '#10b981'}
                        stroke="#ffffff"
                        strokeWidth="2"
                      />
                      {zone.status === 'occupied' && (
                        <circle
                          cx={coords.x + 28}
                          cy={coords.y + 28}
                          r="14"
                          fill="none"
                          stroke="#ef4444"
                          strokeWidth="2"
                          className="animate-ping"
                        />
                      )}
                    </g>
                  );
                })}
              </>
            ) : (
              // 2. Pure Vector Architectural Blueprint matching the sample layout geometry
              <>
                {/* Outer Boundary & Grid */}
                <rect width="1000" height="700" fill="#030712" rx="10" />
                <rect width="1000" height="700" fill="url(#planGrid)" rx="10" />
                <rect width="992" height="692" x="4" y="4" fill="none" stroke="#0284c7" strokeWidth="2.5" rx="10" opacity="0.6" />

                {/* Central Hallway / Corridor Floor Background */}
                <path
                  d="M 15 335 L 780 335 L 780 495 L 620 495 L 620 685 L 515 685 L 515 450 L 15 450 Z"
                  fill="rgba(15, 23, 42, 0.7)"
                  stroke="#334155"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />

                {/* Central Installation Lab Banner Text */}
                <g className="select-none">
                  <rect x="30" y="360" width="380" height="50" rx="8" fill="rgba(15, 23, 42, 0.9)" stroke="#94a3b8" strokeWidth="1.5" />
                  <text x="220" y="390" fill="#ffffff" fontSize="14" fontWeight="900" textAnchor="middle" letterSpacing="2">
                    LABORATORIUM INSTALASI LISTRIK
                  </text>
                  <text x="220" y="403" fill="#38bdf8" fontSize="9" fontWeight="700" textAnchor="middle">
                    • AREA UTAMA INSTALASI & KORIDOR PENGHUBUNG •
                  </text>
                </g>

                {/* Entrance Pathway Marker at bottom of corridor */}
                <g transform="translate(567, 685)">
                  <path d="M -45 0 L 45 0" stroke="#10b981" strokeWidth="6" strokeLinecap="round" />
                  <text x="0" y="-12" fill="#10b981" fontSize="10" fontWeight="900" textAnchor="middle" letterSpacing="1">
                    ▲ PINTU MASUK UTAMA ▲
                  </text>
                </g>

                {/* Compass Indicator */}
                <g transform="translate(965, 45)">
                  <circle cx="0" cy="0" r="14" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
                  <polygon points="0,-12 4,0 0,-4 -4,0" fill="#ef4444" />
                  <polygon points="0,12 4,0 0,4 -4,0" fill="#94a3b8" />
                  <text x="0" y="-14" fill="#ef4444" fontSize="8" fontWeight="900" textAnchor="middle">U</text>
                </g>

                {/* Render All 8 Interactive Rooms */}
                {activeZones.map((zone) => {
                  const coords = zone.coords || DEFAULT_ZONE_COORDS[zone.id] || { x: 15, y: 15, w: 100, h: 100 };
                  const theme = getZoneTheme(zone);
                  const isSelected = selectedZone && selectedZone.id === zone.id;

                  // Skip duplicate instalasi drawing as it's the central corridor
                  if (zone.id === 'zone_instalasi') {
                    return (
                      <g
                        key={zone.id}
                        onClick={() => setSelectedZone(zone)}
                        className="cursor-pointer group"
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
                          filter={isSelected ? 'url(#neonActive)' : 'none'}
                        />
                      </g>
                    );
                  }

                  return (
                    <g
                      key={zone.id}
                      onClick={() => setSelectedZone(zone)}
                      className="cursor-pointer group transition-all duration-200"
                    >
                      {/* Room Main Rectangle */}
                      <rect
                        x={coords.x}
                        y={coords.y}
                        width={coords.w}
                        height={coords.h}
                        rx="8"
                        fill={theme.fill}
                        stroke={theme.stroke}
                        strokeWidth={isSelected ? 4 : 2}
                        className="transition-all duration-200 group-hover:opacity-95"
                        filter={isSelected ? 'url(#neonActive)' : 'none'}
                      />

                      {/* Room Code Badge */}
                      <rect
                        x={coords.x + 8}
                        y={coords.y + 8}
                        width={zone.code.length > 8 ? 85 : 65}
                        height="20"
                        rx="4"
                        fill="rgba(0, 0, 0, 0.8)"
                        stroke={theme.stroke}
                        strokeWidth="1"
                      />
                      <text
                        x={coords.x + (zone.code.length > 8 ? 50 : 40)}
                        y={coords.y + 22}
                        fill={theme.stroke}
                        fontSize="10"
                        fontWeight="900"
                        textAnchor="middle"
                      >
                        {zone.code}
                      </text>

                      {/* Status Beacon Circle */}
                      <circle
                        cx={coords.x + coords.w - 16}
                        cy={coords.y + 18}
                        r={isSelected ? 6 : 4.5}
                        fill={zone.status === 'occupied' ? '#ef4444' : '#10b981'}
                        stroke="#ffffff"
                        strokeWidth="1.5"
                      />
                      {zone.status === 'occupied' && (
                        <circle
                          cx={coords.x + coords.w - 16}
                          cy={coords.y + 18}
                          r="10"
                          fill="none"
                          stroke="#ef4444"
                          strokeWidth="1.5"
                          className="animate-ping"
                        />
                      )}

                      {/* Main Room Name (Multiline for readability) */}
                      {zone.id === 'zone_digital' && (
                        <g>
                          <text x={coords.x + coords.w / 2} y={coords.y + 130} fill={theme.text} fontSize="12" fontWeight="900" textAnchor="middle">
                            LABORATORIUM
                          </text>
                          <text x={coords.x + coords.w / 2} y={coords.y + 150} fill={theme.text} fontSize="12" fontWeight="900" textAnchor="middle">
                            DIGITAL &
                          </text>
                          <text x={coords.x + coords.w / 2} y={coords.y + 170} fill={theme.text} fontSize="11" fontWeight="900" textAnchor="middle">
                            MIKROPROSESSOR
                          </text>
                        </g>
                      )}

                      {zone.id === 'zone_otomasi' && (
                        <g>
                          <text x={coords.x + coords.w / 2} y={coords.y + 140} fill={theme.text} fontSize="13" fontWeight="900" textAnchor="middle">
                            LABORATORIUM
                          </text>
                          <text x={coords.x + coords.w / 2} y={coords.y + 162} fill={theme.text} fontSize="13" fontWeight="900" textAnchor="middle">
                            OTOMASI
                          </text>
                        </g>
                      )}

                      {zone.id === 'zone_bengkel' && (
                        <g>
                          <text x={coords.x + coords.w / 2} y={coords.y + 190} fill={theme.text} fontSize="22" fontWeight="900" textAnchor="middle" letterSpacing="3">
                            BENGKEL LISTRIK
                          </text>
                          <text x={coords.x + coords.w / 2} y={coords.y + 220} fill="#93c5fd" fontSize="12" fontWeight="700" textAnchor="middle">
                            • FABRIKASI PANEL MDP, KERJA PELAT & WIRING TENAGA •
                          </text>
                        </g>
                      )}

                      {zone.id === 'zone_pengukuran' && (
                        <g>
                          <text x={coords.x + coords.w / 2} y={coords.y + 100} fill={theme.text} fontSize="11" fontWeight="900" textAnchor="middle">
                            LABORATORIUM
                          </text>
                          <text x={coords.x + coords.w / 2} y={coords.y + 118} fill={theme.text} fontSize="11" fontWeight="900" textAnchor="middle">
                            PENGUKURAN &
                          </text>
                          <text x={coords.x + coords.w / 2} y={coords.y + 136} fill={theme.text} fontSize="11" fontWeight="900" textAnchor="middle">
                            ELEKTRONIKA DASAR
                          </text>
                        </g>
                      )}

                      {zone.id === 'zone_plc' && (
                        <g>
                          <text x={coords.x + coords.w / 2} y={coords.y + 105} fill={theme.text} fontSize="12" fontWeight="900" textAnchor="middle">
                            LABORATORIUM
                          </text>
                          <text x={coords.x + coords.w / 2} y={coords.y + 125} fill={theme.text} fontSize="12" fontWeight="900" textAnchor="middle">
                            OTOMASI & PLC
                          </text>
                        </g>
                      )}

                      {zone.id === 'zone_dosen' && (
                        <g>
                          <text x={coords.x + coords.w / 2} y={coords.y + 90} fill={theme.text} fontSize="12" fontWeight="900" textAnchor="middle">
                            RUANGAN
                          </text>
                          <text x={coords.x + coords.w / 2} y={coords.y + 110} fill={theme.text} fontSize="12" fontWeight="900" textAnchor="middle">
                            DOSEN
                          </text>
                        </g>
                      )}

                      {zone.id === 'zone_ujicoba' && (
                        <g>
                          <text x={coords.x + coords.w / 2} y={coords.y + 110} fill={theme.text} fontSize="13" fontWeight="900" textAnchor="middle">
                            RUANGAN
                          </text>
                          <text x={coords.x + coords.w / 2} y={coords.y + 130} fill={theme.text} fontSize="13" fontWeight="900" textAnchor="middle">
                            UJI COBA
                          </text>
                        </g>
                      )}

                      {/* Status text badge at bottom of room */}
                      <text
                        x={coords.x + coords.w / 2}
                        y={coords.y + coords.h - 14}
                        fill={zone.status === 'occupied' ? '#fca5a5' : '#86efac'}
                        fontSize="9"
                        fontWeight="800"
                        textAnchor="middle"
                      >
                        {zone.status === 'occupied' ? '• SEDANG PRAKTIKUM' : '• TERSEDIA'}
                      </text>
                    </g>
                  );
                })}
              </>
            )}
          </svg>
        </div>

        {/* Blueprint Legend Bar */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400 shrink-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500 shadow-sm shadow-emerald-500/50"></span>
              {t('statusAvailable') || 'Tersedia'}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-red-500 shadow-sm shadow-red-500/50 animate-pulse"></span>
              {t('statusOccupied') || 'Sedang Praktikum'}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-blue-500"></span>
              Bengkel Listrik
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-lime-500"></span>
              Ruangan Dosen
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-amber-500"></span>
              Lab Otomasi & PLC
            </span>
          </div>

          <span className="text-cyan-400 font-bold flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Klik ruangan pada denah untuk memeriksa detail alat & kapasitas
          </span>
        </div>

      </div>

      {/* Selected Zone Inspector Card */}
      {selectedZone && (
        <div className="p-3 bg-slate-900/95 rounded-xl border border-cyan-500/50 shrink-0 shadow-xl backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded bg-cyan-950 text-cyan-300 font-extrabold text-xs border border-cyan-500/50 tracking-wider">
                {selectedZone.code}
              </span>
              <h4 className="text-xs md:text-sm font-extrabold text-white">
                {lang === 'id' ? selectedZone.name : selectedZone.nameEn || selectedZone.name}
              </h4>
            </div>

            <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider self-start sm:self-auto flex items-center gap-1.5 shadow-sm ${
              selectedZone.status === 'occupied'
                ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${selectedZone.status === 'occupied' ? 'bg-red-400 animate-ping' : 'bg-emerald-400'}`} />
              {selectedZone.status === 'occupied' ? (t('statusOccupied') || 'Sedang Praktikum') : (t('statusAvailable') || 'Tersedia')}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2 text-xs">
            <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Aktivitas / Sesi Kelas:</span>
              <span className="text-slate-200 font-semibold mt-0.5 block">{selectedZone.currentClass}</span>
            </div>

            <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Kapasitas Mahasiswa:</span>
              <span className="text-cyan-300 font-semibold mt-0.5 block">{selectedZone.capacity}</span>
            </div>

            <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Standar Keselamatan (K3):</span>
              <span className="text-amber-300 font-semibold mt-0.5 block">{selectedZone.safetyLevel}</span>
            </div>
          </div>

          {/* Equipment Tag List */}
          {selectedZone.equipment && selectedZone.equipment.length > 0 && (
            <div className="mt-2 pt-2 border-t border-slate-800 flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">
                Peralatan & Trainer Tersedia:
              </span>
              {selectedZone.equipment.map((eq, i) => (
                <span
                  key={i}
                  className="px-2.5 py-0.5 rounded-md bg-slate-800/90 text-slate-300 text-[10px] font-medium border border-slate-700/80 shadow-sm"
                >
                  {eq}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* QR Code & Offline Configuration Modal */}
      {showQrConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-cyan-500/40 p-5 max-w-lg w-full shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-cyan-400" />
                <h4 className="text-sm font-bold text-white">
                  Pengaturan Akses HP & Mode Offline (PWA)
                </h4>
              </div>
              <button
                onClick={() => setShowQrConfigModal(false)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current QR Preview */}
            <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="bg-white p-1 rounded-lg shrink-0">
                <QRCodeSVG value={mobileUrl} size={80} level="M" />
              </div>
              <div className="text-xs space-y-1">
                <span className="font-bold text-cyan-400 block">Link QR Code Saat Ini:</span>
                <span className="font-mono text-slate-300 break-all bg-slate-900 px-2 py-1 rounded block border border-slate-700 text-[11px]">
                  {mobileUrl}
                </span>
                <p className="text-[10px] text-slate-400">
                  Scan QR ini dengan kamera HP untuk langsung membuka denah.
                </p>
              </div>
            </div>

            {/* 3 Methods to access without Wi-Fi */}
            <div className="space-y-2 text-xs">
              <span className="font-bold text-slate-200 block uppercase text-[11px]">
                📱 3 Cara Akses di HP Tanpa Wi-Fi / Offline:
              </span>

              <div className="p-2.5 rounded-lg bg-slate-950/70 border border-emerald-500/30 space-y-1">
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  1. Mode 100% Offline (PWA / Install App)
                </span>
                <p className="text-[11px] text-slate-300">
                  Buka denah di HP 1 kali via browser (Chrome/Safari), lalu ketuk <strong>"Tambahkan ke Layar Utama / Install"</strong>. Setelah itu, denah dapat dibuka kapan saja <strong>tanpa kuota internet, tanpa Wi-Fi, bahkan dalam Mode Pesawat</strong>!
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950/70 border border-cyan-500/30 space-y-1">
                <span className="font-bold text-cyan-400 flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5" />
                  2. Menggunakan Hotspot HP (Tethering)
                </span>
                <p className="text-[11px] text-slate-300">
                  Nyalakan Hotspot Portabel di HP Anda, sambungkan laptop ini ke hotspot tersebut, lalu scan QR Code di atas. (Otomatis terhubung via IP lokal).
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950/70 border border-blue-500/30 space-y-1">
                <span className="font-bold text-blue-400 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" />
                  3. Menggunakan Link Cloud / Publik (Data Seluler 4G/5G)
                </span>
                <p className="text-[11px] text-slate-300">
                  Jika aplikasi telah di-deploy ke Vercel/Netlify atau menggunakan ngrok, masukkan URL publik di bawah agar QR Code mengarah ke internet:
                </p>
                <input
                  type="text"
                  value={customQrUrl}
                  onChange={(e) => setCustomQrUrl(e.target.value)}
                  placeholder="Contoh: https://polimdo-lab.vercel.app/#mobile-floor-plan"
                  className="w-full px-2.5 py-1 bg-slate-900 rounded border border-slate-700 text-white font-mono text-[11px] mt-1"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowQrConfigModal(false)}
                className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-lg shadow"
              >
                Selesai & Tutup
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
