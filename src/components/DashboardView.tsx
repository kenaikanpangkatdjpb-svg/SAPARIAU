import React, { useState, useMemo } from 'react';
import { 
  Users, 
  CalendarCheck, 
  Clock, 
  FileCheck2, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  ChevronRight, 
  ArrowUpRight,
  BookOpen,
  MapPin,
  Map,
  Briefcase,
  Camera,
  Award
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { Employee, Attendance, LeaveRequest, Logbook, OfficeSettings } from '../types';

interface DashboardViewProps {
  user: Employee;
  employees: Employee[];
  attendance: Attendance[];
  leaves: LeaveRequest[];
  logbooks: Logbook[];
  settings: OfficeSettings;
  onNavigateToView: (view: string) => void;
  onApproveLeave: (id: string, approve: boolean) => void;
  onSubmitLogbook: (text: string) => void;
  onOpenAbsenModal?: (type: 'masuk' | 'pulang') => void;
  todayAttendance?: Attendance | null;
}

export default function DashboardView({
  user,
  employees,
  attendance,
  leaves,
  logbooks,
  settings,
  onNavigateToView,
  onApproveLeave,
  onSubmitLogbook,
  onOpenAbsenModal,
  todayAttendance: propTodayAttendance
}: DashboardViewProps) {
  const [quickLogText, setQuickLogText] = useState('');
  const isAdmin = user.role === 'admin';

  const todayDateStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  if (!isAdmin) {
    const todayAttendance = propTodayAttendance !== undefined 
      ? propTodayAttendance 
      : (attendance.find(att => att.employeeId === user.id && att.date === todayDateStr) || null);
    
    return (
      <div id="employee-dashboard-view" className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* CARD 1: Status Kehadiran Hari Ini */}
          <div className="lg:col-span-8 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Clock className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-800 text-sm">Status Kehadiran Hari Ini</h3>
            </div>

            <div className="space-y-4 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">STATUS ABSENSI HARI INI</span>
                <div className="flex gap-1.5">
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                    todayAttendance?.checkIn 
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                      : 'bg-red-50 text-red-500 border border-red-100'
                  }`}>
                    Clock In: {todayAttendance?.checkIn ? `Sudah (${todayAttendance.checkIn})` : 'Belum'}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                    todayAttendance?.checkOut 
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                      : 'bg-red-50 text-red-500 border border-red-100'
                  }`}>
                    Clock Out: {todayAttendance?.checkOut ? `Sudah (${todayAttendance.checkOut})` : 'Belum'}
                  </span>
                </div>
              </div>

              {/* Box list for My Location, Jam Masuk, Jam Pulang */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#F8FAFC] border border-slate-200/50 p-4 rounded-xl text-center space-y-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Lokasi Kantor</p>
                  <p className="text-sm font-black text-slate-800">{settings.officeName || 'Pekanbaru'}</p>
                </div>
                <div className="bg-[#F8FAFC] border border-slate-200/50 p-4 rounded-xl text-center space-y-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Waktu Clock In</p>
                  <p className="text-sm font-black text-slate-800 font-mono">{todayAttendance?.checkIn || '--:--'}</p>
                </div>
                <div className="bg-[#F8FAFC] border border-slate-200/50 p-4 rounded-xl text-center space-y-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Waktu Clock Out</p>
                  <p className="text-sm font-black text-slate-800 font-mono">{todayAttendance?.checkOut || '--:--'}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  disabled={false}
                  onClick={() => {
                    if (onOpenAbsenModal) {
                      onOpenAbsenModal('masuk');
                    } else {
                      const triggerBtn = document.getElementById('btn-absen-masuk');
                      if (triggerBtn) triggerBtn.click();
                    }
                  }}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs font-extrabold tracking-wider uppercase transition-all text-center ${
                    todayAttendance?.checkIn
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md active:scale-95'
                      : 'bg-[#1E3A8A] hover:bg-[#1D4ED8] text-white shadow-md active:scale-95'
                  }`}
                >
                  {todayAttendance?.checkIn ? `Clock In (${todayAttendance.checkIn})` : 'Clock In'}
                </button>
                <button
                  disabled={false}
                  onClick={() => {
                    if (onOpenAbsenModal) {
                      onOpenAbsenModal('pulang');
                    } else {
                      const triggerBtn = document.getElementById('btn-absen-pulang');
                      if (triggerBtn) triggerBtn.click();
                    }
                  }}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs font-extrabold tracking-wider uppercase transition-all text-center ${
                    todayAttendance?.checkOut
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md active:scale-95'
                      : 'bg-[#1E3A8A] hover:bg-[#1D4ED8] text-white shadow-md active:scale-95'
                  }`}
                >
                  {todayAttendance?.checkOut ? `Clock Out (${todayAttendance.checkOut})` : 'Clock Out'}
                </button>
              </div>
            </div>
          </div>

          {/* CARD 2: Informasi Penugasan */}
          <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-5">
            <h3 className="font-bold text-slate-800 text-sm">Informasi Penugasan</h3>
            
            <div className="space-y-4">
              {/* Jabatan PPNPN */}
              <div className="flex items-center gap-3.5 p-1">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Jabatan PPNPN</p>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">{user.position || "CS"}</p>
                </div>
              </div>

              {/* Grade Kinerja */}
              <div className="flex items-center gap-3.5 p-1">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Grade Kinerja</p>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">Sangat Baik (A)</p>
                </div>
              </div>

              {/* Divider */}
              <hr className="border-slate-100" />

              {/* Target Logbook Mingguan */}
              <div className="flex justify-between items-center text-xs px-1">
                <span className="text-slate-500 font-medium">Target Logbook Mingguan:</span>
                <span className="text-slate-800 font-bold font-mono">100%</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // Stats Calculations
  const activeEmployeesCount = employees.filter(e => e.role === 'karyawan' && (e.status || 'aktif') === 'aktif').length;
  
  const pendingLeavesCount = useMemo(() => {
    return leaves.filter(l => l.status === 'Pending').length;
  }, [leaves]);

  const todayAttendanceList = useMemo(() => {
    return attendance.filter(a => a.date === todayDateStr);
  }, [attendance]);

  const onTimePercentage = useMemo(() => {
    const checkedInToday = todayAttendanceList.filter(a => a.checkIn);
    if (checkedInToday.length === 0) return 100;
    const onTimeCount = checkedInToday.filter(a => a.checkInStatus === 'Tepat Waktu').length;
    return Math.round((onTimeCount / checkedInToday.length) * 100);
  }, [todayAttendanceList]);

  const totalLogbooksThisMonth = useMemo(() => {
    // filter logbooks in June 2026
    return logbooks.filter(l => l.date.includes('2026-06')).length;
  }, [logbooks]);

  // Chart Data: Discipline Trend (June 2026)
  const lineChartData = useMemo(() => {
    const days: { [key: string]: { date: string; 'Tepat Waktu': number; 'Terlambat': number; 'Luar Radius': number } } = {};
    
    // Seed days 1 to 24 of June
    for (let d = 1; d <= 24; d++) {
      const dateStr = `2026-06-${d < 10 ? `0${d}` : d}`;
      days[dateStr] = {
        date: `${d < 10 ? `0${d}` : d}`,
        'Tepat Waktu': 0,
        'Terlambat': 0,
        'Luar Radius': 0
      };
    }

    attendance.forEach(att => {
      if (att.date.startsWith('2026-06')) {
        if (!days[att.date]) return;
        if (att.checkInStatus === 'Tepat Waktu') {
          days[att.date]['Tepat Waktu'] += 1;
        } else if (att.checkInStatus === 'Terlambat') {
          days[att.date]['Terlambat'] += 1;
        }

        const isOutRadius = att.checkInLocation && (
          Math.abs(att.checkInLocation.lat - settings.officeLat) > 0.002 ||
          Math.abs(att.checkInLocation.lng - settings.officeLng) > 0.002
        );
        if (isOutRadius) {
          days[att.date]['Luar Radius'] += 1;
        }
      }
    });

    return Object.values(days).sort((a, b) => Number(a.date) - Number(b.date));
  }, [attendance, settings]);

  // Chart Data: Employee Logbooks submitted per day (June 2026)
  const barChartData = useMemo(() => {
    const days: { [key: string]: { date: string; Logbooks: number } } = {};
    for (let d = 1; d <= 13; d++) {
      const dateStr = `2026-06-${d < 10 ? `0${d}` : d}`;
      days[dateStr] = {
        date: `${d < 10 ? `0${d}` : d}`,
        Logbooks: 0
      };
    }

    logbooks.forEach(log => {
      if (log.date.startsWith('2026-06')) {
        if (!days[log.date]) return;
        days[log.date].Logbooks += 1;
      }
    });

    return Object.values(days).sort((a, b) => Number(a.date) - Number(b.date));
  }, [logbooks]);

  const handleQuickLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickLogText.trim()) return;
    onSubmitLogbook(quickLogText);
    setQuickLogText('');
    alert("Logbook harian Anda berhasil disubmit!");
  };

  return (
    <div id="dashboard-view" className="space-y-6">
      {/* 1. TOP STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Pegawai Aktif */}
        <div id="stat-card-pegawai" className="bg-white rounded-xl p-5 border border-slate-200/80 flex items-center gap-4 hover:border-blue-200 transition-all shadow-sm hover:shadow-md">
          <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pegawai Aktif</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{activeEmployeesCount}</h3>
            <p className="text-[10px] text-emerald-600 font-bold mt-0.5 flex items-center gap-1">
              <span>↑ 10%</span> <span className="text-slate-400 font-normal">dari bln lalu</span>
            </p>
          </div>
        </div>

        {/* Card 2: Pengajuan Izin/Cuti */}
        <div id="stat-card-cuti" className="bg-white rounded-xl p-5 border border-slate-200/80 flex items-center gap-4 hover:border-blue-200 transition-all shadow-sm hover:shadow-md">
          <div className="w-12 h-12 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cuti / Izin Tertunda</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{pendingLeavesCount}</h3>
            <p className="text-[10px] text-amber-600 font-bold mt-0.5">Menunggu Approval Admin</p>
          </div>
        </div>

        {/* Card 3: Absensi Tepat Waktu */}
        <div id="stat-card-ontime" className="bg-white rounded-xl p-5 border border-slate-200/80 flex items-center gap-4 hover:border-blue-200 transition-all shadow-sm hover:shadow-md">
          <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Absensi Tepat Waktu</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{onTimePercentage}%</h3>
            <p className="text-[10px] text-emerald-600 font-bold mt-0.5">Sangat Disiplin Hari Ini</p>
          </div>
        </div>

        {/* Card 4: Logbook Submit */}
        <div id="stat-card-logbook" className="bg-white rounded-xl p-5 border border-slate-200/80 flex items-center gap-4 hover:border-blue-200 transition-all shadow-sm hover:shadow-md">
          <div className="w-12 h-12 rounded-lg bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Logbook Terkirim</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{totalLogbooksThisMonth}</h3>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Laporan Bulan Juni 2026</p>
          </div>
        </div>
      </div>

      {/* 2. CHARTS BENTO GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Trend Line Chart (6 cols) */}
        <div id="chart-tren-kedisiplinan" className="bg-white p-5 border border-slate-200/80 rounded-xl lg:col-span-6 flex flex-col shadow-sm">
          <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Grafik Tren Kedisiplinan (Juni 2026)</h4>
            <span className="text-[10px] font-mono text-slate-400 font-bold">HARI 01-24</span>
          </div>
          <div className="h-64 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="date" stroke="#94A3B8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b', borderRadius: '8px', fontSize: '11px' }} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
                <Line type="monotone" dataKey="Tepat Waktu" stroke="#3B82F6" strokeWidth={2.5} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="Terlambat" stroke="#F59E0B" strokeWidth={1.5} />
                <Line type="monotone" dataKey="Luar Radius" stroke="#EF4444" strokeWidth={1.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Logbooks Bar Chart (3 cols) */}
        <div id="chart-logbook-pegawai" className="bg-white p-5 border border-slate-200/80 rounded-xl lg:col-span-3 flex flex-col shadow-sm">
          <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Logbook Pegawai (Juni 2026)</h4>
            <span className="text-[10px] font-mono text-slate-400 font-bold">HARI 01-13</span>
          </div>
          <div className="h-64 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="date" stroke="#94A3B8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b', borderRadius: '8px', fontSize: '11px' }} />
                <Bar dataKey="Logbooks" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gauge Chart (3 cols) */}
        <div id="chart-rapor-kinerja" className="bg-white p-5 border border-slate-200/80 rounded-xl lg:col-span-3 flex flex-col justify-between shadow-sm">
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Rapor Kinerja Komulatif</h4>
            <p className="text-[10px] text-slate-400 font-bold">TIM PPNPN AKTIF</p>
          </div>
          
          <div className="relative flex items-center justify-center py-6">
            <svg className="w-40 h-24" viewBox="0 0 100 50">
              <defs>
                <linearGradient id="gauge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10B981" />
                  <stop offset="60%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#EF4444" />
                </linearGradient>
              </defs>
              {/* Background Arc */}
              <path 
                d="M 10 50 A 40 40 0 0 1 90 50" 
                fill="none" 
                stroke="#F1F5F9" 
                strokeWidth="8" 
                strokeLinecap="round" 
              />
              {/* Filled Arc (percentage based, e.g. 72.42%) */}
              <path 
                d="M 10 50 A 40 40 0 0 1 90 50" 
                fill="none" 
                stroke="url(#gauge-gradient)" 
                strokeWidth="8" 
                strokeLinecap="round" 
                strokeDasharray="125.6" 
                strokeDashoffset={125.6 * (1 - 72.42 / 100)} 
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-3">
              <span className="text-2xl font-bold text-slate-800 leading-none">72.42</span>
              <span className="text-[9px] font-bold text-slate-400 tracking-widest uppercase mt-1">Skor Kinerja Tim</span>
            </div>
          </div>

          <div className="text-center pt-2.5 border-t border-slate-100">
            <span className="text-[10px] text-slate-400 font-bold tracking-wider">— Rata-rata Rapor Tim —</span>
          </div>
        </div>
      </div>

      {/* 3. WIDGETS BENTO GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5">
        {/* Widget Left: Things To Do (Admin sees Approval list, Employees see summary) (4 cols) */}
        <div id="widget-things-to-do" className="bg-white p-5 border border-slate-200/80 rounded-xl lg:col-span-4 flex flex-col shadow-sm">
          <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-100">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Things To Do</h4>
            <span className="text-[9px] px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-bold border border-blue-100">
              {pendingLeavesCount} PENDING
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-64 pr-1">
            {leaves.filter(l => l.status === 'Pending').length === 0 ? (
              <div className="text-center py-10">
                <CheckCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-medium">Tidak ada pengajuan cuti tertunda.</p>
              </div>
            ) : (
              leaves.filter(l => l.status === 'Pending').map((leave) => (
                <div key={leave.id} className="p-3.5 bg-slate-50 rounded-lg border border-slate-100 space-y-2.5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="text-xs font-bold text-slate-700">{leave.employeeName}</h5>
                      <p className="text-[10px] text-slate-400 font-semibold font-mono mt-0.5">{leave.startDate} s/d {leave.endDate}</p>
                    </div>
                    <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                      {leave.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 italic">"{leave.reason}"</p>
                  
                  {isAdmin ? (
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => onApproveLeave(leave.id, true)}
                        className="flex-1 py-1.5 px-2.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold uppercase tracking-wider transition-all rounded-lg shadow-sm"
                      >
                        Setujui
                      </button>
                      <button
                        onClick={() => onApproveLeave(leave.id, false)}
                        className="flex-1 py-1.5 px-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-[10px] font-bold uppercase tracking-wider transition-all rounded-lg"
                      >
                        Tolak
                      </button>
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400 font-bold text-right italic">Menunggu Persetujuan Admin</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Widget Middle: Logbook Mingguan (4 cols) */}
        <div id="widget-logbook-mingguan" className="bg-white p-5 border border-slate-200/80 rounded-xl lg:col-span-4 flex flex-col shadow-sm">
          <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-100">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Logbook Terbaru</h4>
            <button 
              onClick={() => onNavigateToView('logbook')} 
              className="text-[10px] text-blue-600 font-bold uppercase tracking-wider hover:underline"
            >
              Lihat Semua
            </button>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-64 pr-1">
            {logbooks.slice(0, 5).map((log) => (
              <div key={log.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-slate-700">{log.employeeName}</span>
                  <span className="text-[10px] text-slate-400 font-bold font-mono">{log.time}</span>
                </div>
                <p className="text-[10px] text-slate-400 font-bold font-mono mb-1">{log.date}</p>
                <p className="text-xs text-slate-600 leading-relaxed font-sans">{log.content}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Widget Right: Status Aktivitas Hari Ini (4 cols) */}
        <div id="widget-status-aktivitas" className="bg-white p-5 border border-slate-200/80 rounded-xl lg:col-span-4 flex flex-col shadow-sm">
          <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-100">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Kehadiran Hari Ini</h4>
            <span className="text-[10px] text-slate-400 font-bold uppercase font-mono">{todayDateStr}</span>
          </div>

          <div className="space-y-2.5 flex-1 overflow-y-auto max-h-64 pr-1">
            {todayAttendanceList.length === 0 ? (
              <div className="text-center py-10">
                <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-medium">Belum ada aktivitas absensi hari ini.</p>
              </div>
            ) : (
              todayAttendanceList.map((att) => (
                <div key={att.id} className="flex items-start gap-3 p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0 mt-0.5">
                    {att.employeeName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-700 truncate">{att.employeeName}</span>
                      <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                        {att.checkIn}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${att.checkInStatus === 'Tepat Waktu' ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                      <span className="text-[10px] font-bold text-slate-500">{att.checkInStatus}</span>
                    </div>
                    
                    {att.checkInLocation && (
                      <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400 font-semibold">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span className="truncate">{att.checkInAddress || "GPS Lokasi"}</span>
                        <a 
                          href={`https://www.google.com/maps?q=${att.checkInLocation.lat},${att.checkInLocation.lng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-500 hover:underline inline-flex items-center ml-1"
                        >
                          <Map className="w-2.5 h-2.5 inline" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* Bottom quick employee actions */}
          {!isAdmin && (
            <form onSubmit={handleQuickLogSubmit} className="mt-3 pt-3 border-t border-slate-100 flex gap-2">
              <input
                type="text"
                value={quickLogText}
                onChange={(e) => setQuickLogText(e.target.value)}
                placeholder="Tulis logbook cepat harian Anda..."
                className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <button 
                type="submit"
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider transition-all rounded-lg shrink-0 shadow-sm"
              >
                Kirim
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
