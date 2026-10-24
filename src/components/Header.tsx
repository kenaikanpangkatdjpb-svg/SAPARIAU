import { useState, useEffect } from 'react';
import { LogIn, LogOut, Info, Menu } from 'lucide-react';
import { Employee, Attendance, OfficeSettings } from '../types';

interface HeaderProps {
  user: Employee;
  todayAttendance: Attendance | null;
  settings: OfficeSettings;
  onOpenAbsenModal: (type: 'masuk' | 'pulang') => void;
  onToggleSidebar: () => void;
}

export default function Header({ user, todayAttendance, settings, onOpenAbsenModal, onToggleSidebar }: HeaderProps) {
  const [dateStr, setDateStr] = useState('');
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      
      const dayName = days[now.getDay()];
      const dateNum = now.getDate();
      const monthName = months[now.getMonth()];
      const year = now.getFullYear();
      
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');

      setDateStr(`${dayName}, ${dateNum} ${monthName} ${year}`);
      setTimeStr(`${hours}.${minutes}.${seconds} WIB`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Determine status badge colors and labels
  let badgeBg = 'bg-[#FEE2E2] text-[#EF4444] border border-[#FCA5A5]/30';
  let statusText = 'Belum Absen';

  if (todayAttendance) {
    if (todayAttendance.checkIn && todayAttendance.checkOut) {
      badgeBg = 'bg-[#D1FAE5] text-[#059669] border border-[#10B981]/30';
      statusText = 'Selesai Absensi';
    } else if (todayAttendance.checkIn) {
      badgeBg = 'bg-[#DBEAFE] text-[#2563EB] border border-[#3B82F6]/30 animate-pulse';
      statusText = 'Sudah Absen Masuk';
    }
  }

  const showAbsenButtons = user.role !== 'admin';

  return (
    <header 
      id="app-header"
      className="bg-white border-b border-slate-200 py-2.5 sm:py-3.5 px-3 sm:px-5 lg:px-8 flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-4 shrink-0 shadow-sm"
    >
      {/* Left side: Toggle Button and Greeting & Status */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          aria-label="Sembunyikan atau Tampilkan Menu"
          className="min-h-[44px] min-w-[44px] -ml-1 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:scale-95 transition-all flex items-center justify-center shrink-0 cursor-pointer"
          title="Sembunyikan/Tampilkan Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <h1 className="text-sm sm:text-base lg:text-lg font-bold text-slate-800 tracking-tight truncate max-w-[200px] xs:max-w-xs sm:max-w-md">
              Hai, <span className="font-extrabold text-slate-900">{user.name}</span>
            </h1>
            {user.role !== 'admin' && (
              <span className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider shrink-0 ${badgeBg}`}>
                {statusText}
              </span>
            )}
            {user.role !== 'admin' && todayAttendance?.checkInStatus === 'Terlambat' && (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider border border-amber-200 shrink-0">
                Terlambat
              </span>
            )}
            {user.role === 'admin' ? (
              <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider border border-indigo-200 shrink-0">
                Administrator
              </span>
            ) : user.role === 'security' ? (
              <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider border border-amber-300 shrink-0">
                Security (Fleksibel)
              </span>
            ) : user.role === 'sopir' ? (
              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider border border-blue-300 shrink-0">
                PPNPN Sopir
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider border border-emerald-300 shrink-0">
                PPNPN Pramubakti
              </span>
            )}
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate mt-0.5">
            Unit: <span className="text-slate-700 font-semibold">{settings.officeName || 'Pekanbaru'}</span>
          </p>
        </div>
      </div>

      {/* Right side: Realtime Clock and Date */}
      <div className="flex items-center justify-between md:justify-end gap-2 sm:gap-4 pl-10 md:pl-0">
        <div className="flex items-center gap-2 text-slate-600 text-[11px] sm:text-xs font-medium">
          <span className="hidden xs:inline text-slate-500">{dateStr || "Loading..."}</span>
          {timeStr && (
            <span className="bg-[#F1F5F9] border border-slate-200 text-slate-800 px-2.5 py-1 text-[11px] sm:text-xs font-bold rounded-lg shadow-2xs font-mono">
              {timeStr}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
