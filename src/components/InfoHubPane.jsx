import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Megaphone, 
  Users, 
  Map, 
  Package, 
  RotateCw, 
  Sparkles,
  Layers
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.jsx';
import { ScheduleView } from './ScheduleView.jsx';
import { AnnouncementsView } from './AnnouncementsView.jsx';
import { FacultyView } from './FacultyView.jsx';
import { FloorPlanView } from './FloorPlanView.jsx';
import { InventoryBookingView } from './InventoryBookingView.jsx';

export function InfoHubPane({ onOpenMobileView }) {
  const { lang, t } = useLanguage();

  const [activeTab, setActiveTab] = useState('schedules');
  const [autoRotate, setAutoRotate] = useState(false);
  const [rotateProgress, setRotateProgress] = useState(0);

  const tabs = [
    { id: 'schedules', name: t('tabSchedules'), icon: Calendar },
    { id: 'announcements', name: t('tabAnnouncements'), icon: Megaphone },
    { id: 'faculty', name: t('tabFaculty'), icon: Users },
    { id: 'floorplan', name: t('tabFloorPlan'), icon: Map },
    { id: 'inventory', name: t('tabInventory'), icon: Package },
  ];

  // Auto rotate tabs logic for kiosk mode
  useEffect(() => {
    if (!autoRotate) {
      setRotateProgress(0);
      return;
    }

    const duration = 15000; // 15 seconds per tab
    const intervalTime = 100;
    const step = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      setRotateProgress((prev) => {
        if (prev >= 100) {
          // Switch to next tab
          const currentIndex = tabs.findIndex(t => t.id === activeTab);
          const nextIndex = (currentIndex + 1) % tabs.length;
          setActiveTab(tabs[nextIndex].id);
          return 0;
        }
        return prev + step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [autoRotate, activeTab, tabs]);

  return (
    <div className="flex flex-col h-full bg-slate-900/90 rounded-2xl border border-cyan-500/20 shadow-2xl overflow-hidden glass-panel">
      
      {/* Top Tab Navigation Bar */}
      <div className="p-2.5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-2 overflow-x-auto relative">
        
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setRotateProgress(0);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-cyan-950/60 border border-cyan-400/50'
                    : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-cyan-400'}`} />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>

        {/* Auto Rotate Kiosk Mode Toggle */}
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border shrink-0 ${
            autoRotate
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
              : 'bg-slate-800/80 text-slate-400 border-slate-700/60 hover:text-slate-200'
          }`}
          title="Auto-rotate tabs every 15s"
        >
          <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
          <span className="hidden xl:inline">{t('autoRotateTabs')}</span>
        </button>

      </div>

      {/* Auto Rotate Progress Bar */}
      {autoRotate && (
        <div className="w-full bg-slate-800 h-1 overflow-hidden">
          <div
            className="bg-gradient-to-r from-amber-400 to-cyan-400 h-full transition-all duration-100 ease-linear"
            style={{ width: `${rotateProgress}%` }}
          ></div>
        </div>
      )}

      {/* Tab Content Display Area */}
      <div className="flex-1 p-3.5 overflow-hidden">
        {activeTab === 'schedules' && <ScheduleView />}
        {activeTab === 'announcements' && <AnnouncementsView />}
        {activeTab === 'faculty' && <FacultyView />}
        {activeTab === 'floorplan' && <FloorPlanView onOpenMobileView={onOpenMobileView} />}
        {activeTab === 'inventory' && <InventoryBookingView />}
      </div>

    </div>
  );
}
