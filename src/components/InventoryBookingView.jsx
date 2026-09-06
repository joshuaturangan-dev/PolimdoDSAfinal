import React, { useState } from 'react';
import { 
  Package, 
  Search, 
  Plus, 
  CheckCircle, 
  AlertTriangle, 
  Wrench, 
  MapPin, 
  Send, 
  Filter,
  Sparkles
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useData, DEFAULT_INVENTORY } from '../context/DataContext.jsx';
import { BorrowModal } from './BorrowModal.jsx';
import { useAutoScroll } from '../hooks/useAutoScroll.js';
import { AutoScrollController } from './AutoScrollController.jsx';

export function InventoryBookingView() {
  const { lang, t } = useLanguage();
  const { inventory } = useData();

  const inventoryList = (inventory && inventory.length > 0) ? inventory : DEFAULT_INVENTORY;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [borrowingItem, setBorrowingItem] = useState(null);

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

  const categories = [
    { id: 'all', name: 'Semua Alat' },
    { id: 'Alat Ukur / Measurement', name: 'Alat Ukur' },
    { id: 'Instrumentasi / Electronic Bench', name: 'Instrumentasi' },
    { id: 'Modul Trainer / Automation', name: 'Modul Trainer' },
    { id: 'Catu Daya / Power Supply', name: 'Power Supply' },
    { id: 'K3 / Safety Equipment', name: 'APD & K3' }
  ];

  const filteredItems = inventoryList.filter((item) => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (item.name && item.name.toLowerCase().includes(q)) || 
                        (item.nameEn && item.nameEn.toLowerCase().includes(q));
      const matchCode = item.code && item.code.toLowerCase().includes(q);
      const matchSpecs = item.specs && item.specs.toLowerCase().includes(q);
      const matchLocation = item.location && item.location.toLowerCase().includes(q);
      return matchName || matchCode || matchSpecs || matchLocation;
    }
    return true;
  });

  const getStatusBadge = (item) => {
    const avail = item.availableStock ?? item.availableQty ?? 0;
    if (item.status === 'maintenance' || item.condition === 'Rusak') {
      return {
        label: t('itemStatusMaintenance'),
        class: 'bg-amber-500/20 text-amber-400 border-amber-500/40'
      };
    }
    if (avail <= 0) {
      return {
        label: 'Kosong / Dipinjam',
        class: 'bg-red-500/20 text-red-400 border-red-500/40'
      };
    }
    if (avail <= 2) {
      return {
        label: t('itemStatusLow'),
        class: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40'
      };
    }
    return {
      label: t('itemStatusAvailable'),
      class: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
    };
  };

  return (
    <div className="flex flex-col h-full gap-3 overflow-hidden">
      
      {/* Header Bar & Search */}
      <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
        <div className="relative flex-1 w-full">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t('searchInventoryPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 text-xs rounded-lg border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {/* Category Pills */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${
                  selectedCategory === cat.id
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-cyan-400/50'
                    : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border-slate-800'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

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
        </div>
      </div>

      {/* Grid of Equipment */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 auto-rows-max scroll-smooth"
      >
        {filteredItems.map((item) => {
          const availStock = item.availableStock ?? item.availableQty ?? 0;
          const totStock = item.totalStock ?? item.totalQty ?? 1;
          const isAvailable = availStock > 0 && item.status !== 'maintenance';
          const status = getStatusBadge(item);

          return (
            <div
              key={item.id}
              className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-700/60 hover:border-cyan-400/50 shadow-lg transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="font-mono text-[10px] font-bold text-cyan-300 bg-slate-950 px-2 py-0.5 rounded border border-cyan-500/30">
                    {item.code}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider border ${status.class}`}>
                    {status.label}
                  </span>
                </div>

                <h4 className="text-xs md:text-sm font-extrabold text-white leading-tight">
                  {lang === 'id' ? item.name : item.nameEn || item.name}
                </h4>

                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                  {item.specs}
                </p>

                <div className="mt-2.5 text-[10px] text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-red-400 shrink-0" />
                  <span className="truncate">{item.location}</span>
                </div>
              </div>

              {/* Stock Bar & Borrow Action */}
              <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <span className="text-slate-400">Stok:</span>
                  <span className="text-emerald-400 font-mono font-black">{availStock}</span>
                  <span className="text-slate-500 font-normal">/ {totStock} {item.unit || 'Unit'}</span>
                </div>

                <button
                  onClick={() => setBorrowingItem(item)}
                  disabled={!isAvailable}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    isAvailable
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-md shadow-cyan-950/40'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-3 h-3" />
                  <span>{t('borrowItem')}</span>
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* Borrow Modal Form */}
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
