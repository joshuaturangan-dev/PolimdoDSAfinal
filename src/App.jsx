import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext.jsx';
import { LanguageProvider } from './context/LanguageContext.jsx';
import { DataProvider } from './context/DataContext.jsx';
import { Header } from './components/Header.jsx';
import { SplitScreenLayout } from './components/SplitScreenLayout.jsx';
import { MarqueeTicker } from './components/MarqueeTicker.jsx';
import { AdminModal } from './components/AdminModal.jsx';
import { MobileFloorPlan } from './components/MobileFloorPlan.jsx';

function MainSignageApp() {
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);

  // Check URL hash on load for smartphone QR code scan
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash.includes('mobile')) {
        setIsMobileView(true);
      } else {
        setIsMobileView(false);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (isMobileView) {
    return (
      <MobileFloorPlan 
        onBackToSignage={() => {
          window.location.hash = '';
          setIsMobileView(false);
        }} 
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#070f1e] text-slate-100 selection:bg-cyan-500 selection:text-black">
      {/* Top Header */}
      <Header onOpenAdminModal={() => setIsAdminOpen(true)} />

      {/* Center Split Screen Digital Signage */}
      <SplitScreenLayout onOpenMobileView={() => setIsMobileView(true)} />

      {/* Bottom Live News & K3 Ticker */}
      <MarqueeTicker />

      {/* Admin Management Modal */}
      {isAdminOpen && (
        <AdminModal onClose={() => setIsAdminOpen(false)} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <DataProvider>
          <MainSignageApp />
        </DataProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}
