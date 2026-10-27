import { useState } from 'react';
import { 
  Home, 
  CalendarCheck, 
  MessageSquareText, 
  BookOpen, 
  User,
  LogOut,
  Menu,
  Shield,
  Briefcase,
  X,
  MapPin,
  Clock,
  Sparkles
} from 'lucide-react';
import { Employee } from '../types';

interface MobileBottomNavProps {
  user: Employee;
  activeView: string;
  onViewChange: (view: string) => void;
  onOpenAbsenModal?: (type: 'masuk' | 'pulang') => void;
  onOpenSidebar: () => void;
  onLogout?: () => void;
  isForceMobile?: boolean;
}

export default function MobileBottomNav({
  user,
  activeView,
  onViewChange,
  onOpenSidebar,
  onLogout,
  isForceMobile = false
}: MobileBottomNavProps) {
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);

  // Determine active states matching the 5 tabs
  const isBeranda = activeView === 'dashboard' || activeView === 'home';
  const isAktivitas = activeView === 'detail-absensi' || activeView === 'approval-cuti' || activeView === 'rekap-matrix';
  const isTugas = activeView === 'logbook' || activeView === 'pengajuan-lembur';
  const isPelatihan = activeView === 'rekomendasi' || activeView === 'pelatihan' || activeView === 'survei';

  return (
    <>
      <nav 
        id="mobile-bottom-nav"
        aria-label="Navigasi Utama Ponsel"
        className={`fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] ${
          isForceMobile ? 'block' : 'block lg:hidden'
        } transition-all`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="grid grid-cols-5 items-center h-16 max-w-md mx-auto px-1">
          
          {/* 1. Beranda */}
          <button
            onClick={() => {
              setShowProfileDrawer(false);
              onViewChange('dashboard');
            }}
            className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
              isBeranda ? 'text-blue-600 font-bold' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <Home className="w-5 h-5 shrink-0" strokeWidth={isBeranda ? 2.5 : 2} fill={isBeranda ? 'currentColor' : 'none'} />
            <span className="text-[10px] mt-1 tracking-tight truncate">Beranda</span>
          </button>

          {/* 2. Aktivitas */}
          <button
            onClick={() => {
              setShowProfileDrawer(false);
              onViewChange('detail-absensi');
            }}
            className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
              isAktivitas ? 'text-blue-600 font-bold' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <CalendarCheck className="w-5 h-5 shrink-0" strokeWidth={isAktivitas ? 2.5 : 2} />
            <span className="text-[10px] mt-1 tracking-tight truncate">Aktivitas</span>
          </button>

          {/* 3. Tugas */}
          <button
            onClick={() => {
              setShowProfileDrawer(false);
              onViewChange('logbook');
            }}
            className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
              isTugas ? 'text-blue-600 font-bold' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <MessageSquareText className="w-5 h-5 shrink-0" strokeWidth={isTugas ? 2.5 : 2} />
            <span className="text-[10px] mt-1 tracking-tight truncate">Tugas</span>
          </button>

          {/* 4. Pelatihan */}
          <button
            onClick={() => {
              setShowProfileDrawer(false);
              onViewChange('rekomendasi');
            }}
            className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
              isPelatihan ? 'text-blue-600 font-bold' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <BookOpen className="w-5 h-5 shrink-0" strokeWidth={isPelatihan ? 2.5 : 2} />
            <span className="text-[10px] mt-1 tracking-tight truncate">Pelatihan</span>
          </button>

          {/* 5. Profil (Avatar in circle as shown in screenshot) */}
          <button
            onClick={() => setShowProfileDrawer(prev => !prev)}
            className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
              showProfileDrawer ? 'text-blue-600 font-bold' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <div className={`w-6 h-6 rounded-full overflow-hidden border ${
              showProfileDrawer ? 'border-blue-600 ring-2 ring-blue-500/20' : 'border-slate-300'
            } shrink-0 bg-slate-200 flex items-center justify-center`}>
              {user.photoUrl ? (
                <img 
                  src={user.photoUrl} 
                  alt={user.name} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <User className="w-3.5 h-3.5 text-slate-600" />
              )}
            </div>
            <span className="text-[10px] mt-1 tracking-tight truncate">Profil</span>
          </button>

        </div>
      </nav>

      {/* Profile Drawer / Action Sheet */}
      {showProfileDrawer && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end p-0 animate-in fade-in"
          onClick={() => setShowProfileDrawer(false)}
        >
          <div 
            className="bg-white rounded-t-3xl max-h-[85vh] flex flex-col overflow-hidden max-w-md w-full mx-auto shadow-2xl p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Grab handle */}
            <div className="w-10 h-1.5 bg-slate-200 rounded-full mx-auto -mt-1 mb-1" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-blue-600 bg-blue-50 text-blue-700 font-bold flex items-center justify-center text-lg">
                  {user.photoUrl ? (
                    <img 
                      src={user.photoUrl} 
                      alt={user.name} 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span>{user.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{user.name}</h3>
                  <p className="text-xs text-slate-500">{user.position} • {user.role.toUpperCase()}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowProfileDrawer(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Account Details Box */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">ID / NIP Pegawai:</span>
                <span className="font-mono font-bold text-slate-800">{user.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Kategori Jabatan:</span>
                <span className="font-semibold text-slate-800">{user.position || user.role}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Status Jam Kerja:</span>
                <span className="font-semibold text-blue-600">
                  {user.role === 'security' ? 'Fleksibel 24 Jam' : 'Standar Kantor (07:30 - 17:00)'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Sisa Hak Cuti:</span>
                <span className="font-bold text-emerald-600">{user.cutiQuota ?? 12} Hari</span>
              </div>
            </div>

            {/* Quick Actions in Drawer */}
            <div className="space-y-2 pt-1">
              <button
                onClick={() => {
                  setShowProfileDrawer(false);
                  onOpenSidebar();
                }}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center justify-center gap-2"
              >
                <Menu className="w-4 h-4 text-slate-600" />
                <span>Buka Menu Navigasi Lengkap</span>
              </button>

              {onLogout && (
                <button
                  onClick={() => {
                    setShowProfileDrawer(false);
                    onLogout();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold text-xs flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4 text-rose-600" />
                  <span>Keluar Akun (Logout)</span>
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
}
