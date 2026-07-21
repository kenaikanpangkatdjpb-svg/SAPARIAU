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

  const showAbsenButtons = user.role === 'karyawan';

  return (
    <header 
      id="app-header"
      className="bg-white border-b border-slate-200 py-4 px-5 lg:px-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shrink-0 shadow-sm"
    >
      {/* Left side: Toggle Button and Greeting & Status */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 -ml-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all flex items-center justify-center shrink-0"
          title="Sembunyikan/Tampilkan Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col gap-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-base sm:text-xl font-bold text-slate-800 tracking-tight truncate max-w-xs sm:max-w-md md:max-w-lg">
              Selamat Datang Kembali, <span className="font-bold">{user.name}</span>
            </h1>
            {user.role === 'karyawan' && (
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${badgeBg}`}>
                {statusText}
              </span>
            )}
            {user.role === 'karyawan' && todayAttendance?.checkInStatus === 'Terlambat' && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wider border border-amber-200">
                Terlambat
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            Status Keaktifan: <span className="text-slate-800 font-bold">{settings.officeName || 'Pekanbaru'} (Default Satelit)</span>
          </p>
        </div>
      </div>

      {/* Right side: Realtime Clock, Date, and Absen Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:gap-6">
        {/* Date & Time display */}
        <div className="flex items-center gap-3 text-slate-600 text-xs font-medium">
          <span>{dateStr || "Loading..."}</span>
          {timeStr && (
            <span className="bg-[#F1F5F9] border border-slate-200 text-slate-700 px-3 py-1 text-xs font-bold rounded-full shadow-sm font-mono">
              {timeStr}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
