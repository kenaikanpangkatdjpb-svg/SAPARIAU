import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  CalendarCheck, 
  FileText, 
  Grid3X3, 
  Clock, 
  UserSquare2, 
  BookOpen, 
  Heart, 
  TrendingUp, 
  Award, 
  ThumbsUp, 
  Key, 
  PlusSquare, 
  LogOut,
  ChevronRight,
  Settings,
  Camera,
  History,
  ClipboardCheck,
  FileSpreadsheet,
  Image,
  RefreshCw
} from 'lucide-react';
import { Employee } from '../types';

interface SidebarProps {
  user: Employee;
  activeView: string;
  onViewChange: (view: string) => void;
  onLogout: () => void;
}

export default function Sidebar({ user, activeView, onViewChange, onLogout }: SidebarProps) {
  const isAdmin = user.role === 'admin';

  // Specific menu items for PPNPN Employee to match the screenshot
  const employeeMenuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'detail-absensi', name: 'Riwayat Absensi', icon: History },
    { id: 'logbook', name: 'Logbook Aktivitas', icon: BookOpen },
    { id: 'approval-cuti', name: 'Pengajuan Cuti/Izin', icon: CalendarCheck },
    { id: 'pengajuan-lembur', name: 'Pengajuan Lembur', icon: Clock },
    { id: 'absen-lembur-hp', name: 'Absen Lembur (HP)', icon: Camera },
    { id: 'rapor', name: 'Rapor Kinerja', icon: Award },
  ];

  // Specific menu items for Admin exactly matching the screenshot
  const adminMenuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'pegawai', name: 'Data Pegawai', icon: Users },
    { id: 'verifikasi-approval', name: 'Verifikasi & Approval', icon: ClipboardCheck },
    { id: 'monitoring-approval', name: 'Monitoring Hasil Approval', icon: TrendingUp },
    { id: 'rekap-matrix', name: 'Rekap Absensi', icon: Grid3X3 },
    { id: 'rekap-lembur', name: 'Rekap Lembur', icon: Clock },
    { id: 'rekap-spkl', name: 'Rekapitulasi SPKL PPNPN', icon: FileSpreadsheet },
    { id: 'detail-absensi', name: 'Detail Absensi Individu', icon: UserSquare2 },
  ];

  const adminRatingItems = [
    { id: 'perilaku', name: 'Perilaku', icon: TrendingUp },
    { id: 'survei', name: 'Survei Kepuasan', icon: ThumbsUp },
    { id: 'rekomendasi', name: 'Rekomendasi KI', icon: Award },
    { id: 'rapor', name: 'Rapor Kinerja', icon: Heart },
  ];

  const adminSettingsItems = [
    { id: 'settings', name: 'Jam Operasional', icon: Settings },
    { id: 'kop-logo', name: 'KOP & Logo', icon: Image },
    { id: 'ganti-password', name: 'Ganti Password', icon: Key },
    { id: 'generate-cuti', name: 'Generate Kuota Cuti', icon: PlusSquare },
    { id: 'reset-aplikasi', name: 'Reset Data Aplikasi', icon: RefreshCw },
  ];

  const renderMenuItem = (item: { id: string; name: string; icon: React.ComponentType<any> }) => {
    const Icon = item.icon;
    const isActive = activeView === item.id;
    return (
      <button
        key={item.id}
        id={`sidebar-item-${item.id}`}
        onClick={() => onViewChange(item.id)}
        className={`w-full flex items-center justify-between px-4 py-2.5 my-1 text-[11px] font-semibold tracking-wide rounded-lg transition-all ${
          isActive 
            ? 'text-white bg-[#1e293b] shadow-sm' 
            : 'text-slate-300 hover:text-white hover:bg-white/5'
        }`}
      >
        <div className="flex items-center gap-3">
          <Icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
          <span>{item.name}</span>
        </div>
      </button>
    );
  };

  return (
    <aside 
      id="app-sidebar"
      className="w-64 bg-[#0B1A30] text-white flex flex-col select-none h-screen overflow-y-auto shrink-0 border-r border-slate-800"
    >
      {/* Profile Header Block at the TOP (as requested & per screenshot) */}
      <div className="p-5 border-b border-slate-800 bg-[#081324] flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-full bg-[#1e293b] border border-blue-500/50 flex items-center justify-center font-bold text-white text-base shrink-0 shadow-inner">
          {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
        </div>
        <div className="overflow-hidden">
          <h3 className="text-xs font-bold text-slate-100 truncate" title={user.name}>
            {user.name}
          </h3>
          <p className="text-[10px] text-blue-400 truncate mt-0.5 font-bold uppercase tracking-wider">
            {user.role === 'admin' ? 'Administrator' : 'PPNPN'}
          </p>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 px-4 py-5 space-y-7">
        {isAdmin ? (
          <>
            <div>
              <p className="px-4 text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.2em] mb-2.5">MENU UTAMA</p>
              <div className="space-y-0.5">
                {adminMenuItems.map(renderMenuItem)}
              </div>
            </div>

            <div>
              <p className="px-4 text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.2em] mb-2.5">DATA PENILAIAN</p>
              <div className="space-y-0.5">
                {adminRatingItems.map(renderMenuItem)}
              </div>
            </div>

            <div>
              <p className="px-4 text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.2em] mb-2.5">PENGATURAN SISTEM</p>
              <div className="space-y-0.5">
                {adminSettingsItems.map(renderMenuItem)}
              </div>
            </div>
          </>
        ) : (
          <>
            <div>
              <div className="space-y-0.5">
                {employeeMenuItems.map(renderMenuItem)}
              </div>
            </div>

            <div className="pt-2">
              <p className="px-4 text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.15em] mb-2.5">PENGATURAN SISTEM</p>
              <div className="space-y-0.5">
                {renderMenuItem({ id: 'ganti-password', name: 'Ganti Password', icon: Key })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer block: Active Session & Keluar with specific layout matching the screenshot */}
      <div className="p-4 border-t border-slate-800 bg-[#081324] flex items-center justify-between text-[11px]">
        <span className="text-slate-400 font-medium">Active Session</span>
        <button
          id="btn-logout"
          onClick={onLogout}
          className="flex items-center gap-1 text-red-400 hover:text-red-300 font-bold uppercase tracking-wider transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  );
}
