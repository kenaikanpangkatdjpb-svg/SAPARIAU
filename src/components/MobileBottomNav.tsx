import React from 'react';
import { 
  LayoutDashboard, 
  Camera, 
  CalendarCheck, 
  BookOpen, 
  Menu, 
  Users, 
  ClipboardCheck, 
  Grid3X3 
} from 'lucide-react';
import { Employee } from '../types';

interface MobileBottomNavProps {
  user: Employee;
  activeView: string;
  onViewChange: (view: string) => void;
  onOpenAbsenModal?: (type: 'masuk' | 'pulang') => void;
  onOpenSidebar: () => void;
}

export default function MobileBottomNav({
  user,
  activeView,
  onViewChange,
  onOpenAbsenModal,
  onOpenSidebar
}: MobileBottomNavProps) {
  const isAdmin = user.role === 'admin';

  if (isAdmin) {
    return (
      <nav 
        id="mobile-bottom-nav-admin"
        aria-label="Navigasi Utama Ponsel"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] lg:hidden transition-all"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="grid grid-cols-5 items-center h-16 max-w-lg mx-auto px-1">
          {/* 1. Beranda */}
          <button
            onClick={() => onViewChange('dashboard')}
            className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
              activeView === 'dashboard' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LayoutDashboard className="w-5 h-5 shrink-0" />
            <span className="text-[10px] mt-1 tracking-tight truncate max-w-[64px]">Beranda</span>
          </button>

          {/* 2. Pegawai */}
          <button
            onClick={() => onViewChange('pegawai')}
            className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
              activeView === 'pegawai' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-5 h-5 shrink-0" />
            <span className="text-[10px] mt-1 tracking-tight truncate max-w-[64px]">Pegawai</span>
          </button>

          {/* 3. Verifikasi */}
          <button
            onClick={() => onViewChange('verifikasi-approval')}
            className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
              activeView === 'verifikasi-approval' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ClipboardCheck className="w-5 h-5 shrink-0" />
            <span className="text-[10px] mt-1 tracking-tight truncate max-w-[64px]">Approval</span>
          </button>

          {/* 4. Rekap */}
          <button
            onClick={() => onViewChange('rekap-matrix')}
            className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
              activeView === 'rekap-matrix' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Grid3X3 className="w-5 h-5 shrink-0" />
            <span className="text-[10px] mt-1 tracking-tight truncate max-w-[64px]">Rekap</span>
          </button>

          {/* 5. Menu Lengkap */}
          <button
            onClick={onOpenSidebar}
            className="flex flex-col items-center justify-center h-full min-h-[44px] text-slate-500 hover:text-slate-800 transition-colors"
          >
            <Menu className="w-5 h-5 shrink-0" />
            <span className="text-[10px] mt-1 tracking-tight truncate max-w-[64px]">Menu</span>
          </button>
        </div>
      </nav>
    );
  }

  // Employee (PPNPN) Navigation
  return (
    <nav 
      id="mobile-bottom-nav-employee"
      aria-label="Navigasi Utama Ponsel"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] lg:hidden transition-all"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="grid grid-cols-5 items-center h-16 max-w-lg mx-auto px-1">
        {/* 1. Beranda */}
        <button
          onClick={() => onViewChange('dashboard')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
            activeView === 'dashboard' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 shrink-0" />
          <span className="text-[10px] mt-1 tracking-tight truncate max-w-[64px]">Beranda</span>
        </button>

        {/* 2. Cuti / Izin */}
        <button
          onClick={() => onViewChange('approval-cuti')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
            activeView === 'approval-cuti' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <CalendarCheck className="w-5 h-5 shrink-0" />
          <span className="text-[10px] mt-1 tracking-tight truncate max-w-[64px]">Cuti</span>
        </button>

        {/* 3. Center Highlight: Absensi Kamera Langsung */}
        <div className="flex items-center justify-center -mt-5">
          <button
            onClick={() => {
              if (onOpenAbsenModal) {
                onOpenAbsenModal('masuk');
              } else {
                onViewChange('absen-lembur-hp');
              }
            }}
            aria-label="Buka Kamera Presensi"
            className="w-13 h-13 rounded-full bg-gradient-to-tr from-[#0B1A30] to-[#1E3A8A] text-white flex flex-col items-center justify-center shadow-lg shadow-blue-900/30 border-2 border-white active:scale-95 transition-transform"
          >
            <Camera className="w-6 h-6 shrink-0" />
            <span className="text-[8px] font-bold uppercase tracking-wider mt-0.5">Absen</span>
          </button>
        </div>

        {/* 4. Logbook */}
        <button
          onClick={() => onViewChange('logbook')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
            activeView === 'logbook' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-5 h-5 shrink-0" />
          <span className="text-[10px] mt-1 tracking-tight truncate max-w-[64px]">Logbook</span>
        </button>

        {/* 5. Menu Lengkap */}
        <button
          onClick={onOpenSidebar}
          className="flex flex-col items-center justify-center h-full min-h-[44px] text-slate-500 hover:text-slate-800 transition-colors"
        >
          <Menu className="w-5 h-5 shrink-0" />
          <span className="text-[10px] mt-1 tracking-tight truncate max-w-[64px]">Menu</span>
        </button>
      </div>
    </nav>
  );
}
