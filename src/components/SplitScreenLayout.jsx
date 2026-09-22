import React, { useState } from 'react';
import { VideoPlayerPane } from './VideoPlayerPane.jsx';
import { InfoHubPane } from './InfoHubPane.jsx';
import { LayoutGrid, Maximize2, Minimize2, Tv, Calendar } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.jsx';

export function SplitScreenLayout({ onOpenMobileView }) {
  const { lang, t } = useLanguage();
  // 'split' (Video 4 cols : Info 8 cols) | 'schedule_full' (Info 12 cols) | 'video_full' (Video 12 cols)
  const [layoutMode, setLayoutMode] = useState('split');

  const toggleScheduleFull = () => {
    setLayoutMode(prev => prev === 'schedule_full' ? 'split' : 'schedule_full');
  };

  const toggleVideoFull = () => {
    setLayoutMode(prev => prev === 'video_full' ? 'split' : 'video_full');
  };

  return (
    <main className="flex-1 p-2.5 md:p-3.5 max-w-[1920px] mx-auto w-full overflow-hidden flex flex-col">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 md:gap-3.5 h-[calc(100vh-125px)] min-h-[580px] transition-all duration-300">
        
        {/* Left Split: Media Hub / Video Playlist (Hidden when Schedule is Full Width) */}
        {layoutMode !== 'schedule_full' && (
          <div className={`${layoutMode === 'video_full' ? 'lg:col-span-12' : 'lg:col-span-4 xl:col-span-4'} h-full overflow-hidden flex flex-col transition-all duration-300`}>
            <VideoPlayerPane 
              layoutMode={layoutMode} 
              onToggleVideoFull={toggleVideoFull}
            />
          </div>
        )}

        {/* Right Split: Information Hub / Jadwal Praktikum (Expanded to 12 cols when full, or 8 cols in split) */}
        {layoutMode !== 'video_full' && (
          <div className={`${layoutMode === 'schedule_full' ? 'lg:col-span-12' : 'lg:col-span-8 xl:col-span-8'} h-full overflow-hidden flex flex-col transition-all duration-300`}>
            <InfoHubPane 
              onOpenMobileView={onOpenMobileView} 
              layoutMode={layoutMode}
              onToggleScheduleFull={toggleScheduleFull}
            />
          </div>
        )}

      </div>
    </main>
  );
}
