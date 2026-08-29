import React from 'react';
import { VideoPlayerPane } from './VideoPlayerPane.jsx';
import { InfoHubPane } from './InfoHubPane.jsx';

export function SplitScreenLayout({ onOpenMobileView }) {
  return (
    <main className="flex-1 p-3 md:p-4 max-w-[1920px] mx-auto w-full overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-4 h-[calc(100vh-125px)] min-h-[580px]">
        
        {/* Left Split: Media Hub / Video Playlist & Scheduler (5 of 12 cols / ~42%) */}
        <div className="lg:col-span-5 h-full overflow-hidden flex flex-col">
          <VideoPlayerPane />
        </div>

        {/* Right Split: Information Hub (7 of 12 cols / ~58%) */}
        <div className="lg:col-span-7 h-full overflow-hidden flex flex-col">
          <InfoHubPane onOpenMobileView={onOpenMobileView} />
        </div>

      </div>
    </main>
  );
}
