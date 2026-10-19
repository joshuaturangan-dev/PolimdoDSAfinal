import React, { useState, useEffect, Component } from 'react';
import { AuthProvider } from './context/AuthContext.jsx';
import { LanguageProvider } from './context/LanguageContext.jsx';
import { DataProvider } from './context/DataContext.jsx';
import { Header } from './components/Header.jsx';
import { SplitScreenLayout } from './components/SplitScreenLayout.jsx';
import { MarqueeTicker } from './components/MarqueeTicker.jsx';
import { AdminModal } from './components/AdminModal.jsx';
import { MobileFloorPlan } from './components/MobileFloorPlan.jsx';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("App ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#070f1e] text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-cyan-500/40 rounded-2xl p-6 text-center shadow-2xl space-y-4">
            <div className="w-14 h-14 rounded-full bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center mx-auto text-cyan-400">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Memuat Ulang Tampilan...</h3>
              <p className="text-xs text-slate-400 mt-1">
                Terjadi pembaruan data sistem. Klik tombol di bawah untuk menyegarkan tampilan.
              </p>
            </div>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Muat Ulang Halaman</span>
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

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
    <ErrorBoundary>
      <AuthProvider>
        <LanguageProvider>
          <DataProvider>
            <MainSignageApp />
          </DataProvider>
        </LanguageProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
