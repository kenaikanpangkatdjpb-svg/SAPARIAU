import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Camera, MapPin, RefreshCw, CheckCircle, RotateCcw, AlertTriangle, ChevronLeft, History, Eye, Info, X, Clock, User } from 'lucide-react';
import { Employee, OfficeSettings, Attendance } from '../types';

interface OvertimeAttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string; // YYYY-MM-DD
  clockIn: string | null; // HH:MM
  clockOut: string | null; // HH:MM
  clockInPhoto: string | null;
  clockOutPhoto: string | null;
  clockInLocation: { lat: number; lng: number } | null;
  clockOutLocation: { lat: number; lng: number } | null;
  clockInAddress: string | null;
  clockOutAddress: string | null;
  hours: number; // calculated when clocked out
}

interface AbsenLemburHPViewProps {
  user: Employee;
  settings: OfficeSettings;
  attendance: Attendance[];
  onSaveAttendance: (updated: Attendance[]) => void;
}

export default function AbsenLemburHPView({ user, settings, attendance, onSaveAttendance }: AbsenLemburHPViewProps) {
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [absenType, setAbsenType] = useState<'masuk' | 'pulang'>('masuk');
  
  // High fidelity states
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [loadingGPS, setLoadingGPS] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number }>({ 
    lat: settings.officeLat || -6.2000, 
    lng: settings.officeLng || 106.8166 
  });
  const [address, setAddress] = useState<string>("Jl. Padang No.5, Tengkerang Utara, Bukit Raya, Kota Pekanbaru, Riau 28126, Indonesia");
  const [distance, setDistance] = useState<number>(2032); // Mock typical distance matching the phone screen
  const [logbookText, setLogbookText] = useState('');
  const [showInfoPresensi, setShowInfoPresensi] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load Overtime Attendance Records from localStorage
  const [overtimeRecords, setOvertimeRecords] = useState<OvertimeAttendanceRecord[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('overtime_attendance_records');
    if (stored) {
      try {
        setOvertimeRecords(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse overtime records", e);
      }
    } else {
      // Pre-seed realistic records for Maliq or the current user
      const isReset = localStorage.getItem('app_is_reset') === 'true';
      const initial: OvertimeAttendanceRecord[] = isReset ? [] : [
        {
          id: `ov_att_${user.id}_2026-06-25`,
          employeeId: user.id,
          employeeName: user.name,
          date: '2026-06-25',
          clockIn: '17:05',
          clockOut: '19:35',
          clockInPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
          clockOutPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
          clockInLocation: { lat: settings.officeLat + 0.0028, lng: settings.officeLng - 0.0022 },
          clockOutLocation: { lat: settings.officeLat + 0.0028, lng: settings.officeLng - 0.0022 },
          clockInAddress: "Jl. Padang No.5, Tengkerang Utara, Bukit Raya, Kota Pekanbaru, Riau 28126, Indonesia",
          clockOutAddress: "Jl. Padang No.5, Tengkerang Utara, Bukit Raya, Kota Pekanbaru, Riau 28126, Indonesia",
          hours: 2.5
        },
        {
          id: `ov_att_${user.id}_2026-06-26`,
          employeeId: user.id,
          employeeName: user.name,
          date: '2026-06-26',
          clockIn: '17:00',
          clockOut: '20:00',
          clockInPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
          clockOutPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
          clockInLocation: { lat: settings.officeLat + 0.0028, lng: settings.officeLng - 0.0022 },
          clockOutLocation: { lat: settings.officeLat + 0.0028, lng: settings.officeLng - 0.0022 },
          clockInAddress: "Jl. Padang No.5, Tengkerang Utara, Bukit Raya, Kota Pekanbaru, Riau 28126, Indonesia",
          clockOutAddress: "Jl. Padang No.5, Tengkerang Utara, Bukit Raya, Kota Pekanbaru, Riau 28126, Indonesia",
          hours: 3.0
        }
      ];
      setOvertimeRecords(initial);
      localStorage.setItem('overtime_attendance_records', JSON.stringify(initial));
    }
  }, [user, settings]);

  const saveOvertimeRecords = (updated: OvertimeAttendanceRecord[]) => {
    setOvertimeRecords(updated);
    localStorage.setItem('overtime_attendance_records', JSON.stringify(updated));
    // Trigger storage event so that components recalculate if needed
    window.dispatchEvent(new Event('storage'));
  };

  // Run dynamic clocks
  const [currentTime, setCurrentTime] = useState('17.00.00');
  const [statusBarTime, setStatusBarTime] = useState('17:00');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const pad = (num: number) => String(num).padStart(2, '0');
      setCurrentTime(`${pad(now.getHours())}.${pad(now.getMinutes())}.${pad(now.getSeconds())}`);
      setStatusBarTime(`${pad(now.getHours())}:${pad(now.getMinutes())}`);
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Calculate distance
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // metres
    const phi1 = lat1 * Math.PI/180;
    const phi2 = lat2 * Math.PI/180;
    const deltaPhi = (lat2-lat1) * Math.PI/180;
    const deltaLambda = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(deltaPhi/2) * Math.sin(deltaPhi/2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda/2) * Math.sin(deltaLambda/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return Math.round(R * c);
  };

  // Geolocation fetcher
  const fetchGPS = () => {
    setLoadingGPS(true);
    if (!navigator.geolocation) {
      setLoadingGPS(false);
      simulateGPS();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLocation({ lat, lng });
        const dist = calculateDistance(lat, lng, settings.officeLat, settings.officeLng);
        setDistance(dist);
        setAddress("Jl. Padang No.5, Tengkerang Utara, Bukit Raya, Kota Pekanbaru, Riau 28126, Indonesia");
        setLoadingGPS(false);
      },
      (error) => {
        console.warn("Geolocation failed, using simulation:", error.message);
        setLoadingGPS(false);
        simulateGPS();
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  const simulateGPS = () => {
    let lat = settings.officeLat;
    let lng = settings.officeLng;
    // Add offset for simulation (outside direct office to match the high fidelity look)
    lat += 0.0028;
    lng -= 0.0022;
    setLocation({ lat, lng });
    const dist = calculateDistance(lat, lng, settings.officeLat, settings.officeLng);
    setDistance(dist);
  };

  useEffect(() => {
    fetchGPS();
  }, [settings]);

  // Handle camera triggers
  const triggerCameraInput = () => {
    alert("Silakan ambil swafoto langsung menggunakan kamera HP Anda.");
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSimulatedSelfie = () => {
    const mockSelfies = [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80"
    ];
    const idx = user.name.length % mockSelfies.length;
    setPhotoBase64(mockSelfies[idx]);
  };

  // Find the record for the current selected date
  const selectedRecord = useMemo(() => {
    return overtimeRecords.find(r => r.employeeId === user.id && r.date === selectedDate);
  }, [overtimeRecords, user.id, selectedDate]);

  const inRadius = distance <= settings.officeRadiusMeters;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoBase64) {
      triggerCameraInput();
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      try {
        const nowTime = new Date().toTimeString().split(' ')[0].slice(0, 5);
        let updatedRecords = [...overtimeRecords];
        const existingIdx = updatedRecords.findIndex(r => r.employeeId === user.id && r.date === selectedDate);

        if (existingIdx !== -1) {
          const current = updatedRecords[existingIdx];
          if (absenType === 'masuk') {
            updatedRecords[existingIdx] = {
              ...current,
              clockIn: nowTime,
              clockInPhoto: photoBase64,
              clockInLocation: location,
              clockInAddress: address
            };
          } else {
            // Calculate hours when clocking out
            let hrs = 0;
            if (current.clockIn) {
              const [inH, inM] = current.clockIn.split(':').map(Number);
              const [outH, outM] = nowTime.split(':').map(Number);
              const diffMin = (outH * 60 + outM) - (inH * 60 + inM);
              if (diffMin > 0) {
                hrs = Math.round((diffMin / 60) * 10) / 10;
              }
            }
            updatedRecords[existingIdx] = {
              ...current,
              clockOut: nowTime,
              clockOutPhoto: photoBase64,
              clockOutLocation: location,
              clockOutAddress: address,
              hours: hrs > 0 ? hrs : 2 // default to 2 hours if clock in wasn't set or calculation is negative
            };
          }
        } else {
          // Create new record
          const newRec: OvertimeAttendanceRecord = {
            id: `ov_att_${user.id}_${selectedDate}`,
            employeeId: user.id,
            employeeName: user.name,
            date: selectedDate,
            clockIn: absenType === 'masuk' ? nowTime : null,
            clockOut: absenType === 'pulang' ? nowTime : null,
            clockInPhoto: absenType === 'masuk' ? photoBase64 : null,
            clockOutPhoto: absenType === 'pulang' ? photoBase64 : null,
            clockInLocation: absenType === 'masuk' ? location : null,
            clockOutLocation: absenType === 'pulang' ? location : null,
            clockInAddress: absenType === 'masuk' ? address : null,
            clockOutAddress: absenType === 'pulang' ? address : null,
            hours: 0 // not fully clocked out yet
          };
          updatedRecords.push(newRec);
        }

        saveOvertimeRecords(updatedRecords);
        setPhotoBase64(null);
        alert(`Absen Lembur ${absenType === 'masuk' ? 'Clock In' : 'Clock Out'} Berhasil Terkirim!\nData otomatis terekam di riwayat absen lembur Anda dan Rekap Lembur admin.`);
      } catch (err) {
        console.error(err);
        alert("Terjadi kesalahan saat memproses absen lembur.");
      } finally {
        setIsSubmitting(false);
      }
    }, 1200);
  };

  const getIndonesianDate = () => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const now = new Date();
    return `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
  };

  return (
    <div className="space-y-6">
      {/* View Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <Camera className="w-5 h-5 text-[#1E3A8A]" />
          <div>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">Kamera Absen Lembur PPNPN</h2>
            <p className="text-xs text-slate-500 font-medium">Lakukan Clock In & Clock Out lembur menggunakan kamera HP/Perangkat seluler.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: High Fidelity Phone Viewport Simulator (6 cols) */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="bg-[#F4F6F9] text-slate-800 w-full max-w-[390px] h-[780px] rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.25)] flex flex-col overflow-hidden relative border border-slate-200/80">
            {/* Hidden native input file for camera */}
            <input 
              type="file"
              accept="image/*"
              capture="user"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              id="native-camera-file"
            />

            {/* 1. Phone Top Status Bar */}
            <div className="px-6 pt-3 pb-2 flex justify-between items-center text-[12px] font-bold text-slate-700 bg-white select-none">
              <span>{statusBarTime}</span>
              <div className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L12 21l7.03-3.39C20.26 16.07 21 14.12 21 12c0-4.97-4.03-9-9-9zm0 15c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z" />
                </svg>
                <span className="text-[10px]">98%</span>
                <div className="w-5 h-2.5 border border-slate-500 rounded-sm p-0.5 flex items-center">
                  <div className="bg-slate-700 h-full w-4 rounded-2xs"></div>
                </div>
              </div>
            </div>

            {/* 2. App Header inside simulator */}
            <div className="bg-[#1E3A8A] text-white px-4 py-3 flex justify-between items-center select-none">
              <div className="w-8"></div>
              <h2 className="text-sm font-black tracking-wider uppercase">Absen Lembur PPNPN</h2>
              <button 
                type="button"
                className="p-1 hover:bg-white/10 rounded-full transition-all"
              >
                <Info className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* 3. Smartphone Viewport Body */}
            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col pb-6 text-left">
              
              {/* Type Switch Selector */}
              <div className="grid grid-cols-2 gap-2 bg-slate-200/60 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setAbsenType('masuk')}
                  className={`py-2 text-[11px] font-extrabold uppercase tracking-wider rounded-lg text-center transition-all ${
                    absenType === 'masuk'
                      ? 'bg-[#1E3A8A] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  Clock In Lembur
                </button>
                <button
                  type="button"
                  onClick={() => setAbsenType('pulang')}
                  className={`py-2 text-[11px] font-extrabold uppercase tracking-wider rounded-lg text-center transition-all ${
                    absenType === 'pulang'
                      ? 'bg-[#1E3A8A] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  Clock Out Lembur
                </button>
              </div>

              {/* Card 1: Live clock, dynamic date, map pin address & geofence */}
              <div className="bg-white rounded-[24px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-100/80 relative">
                {/* Refresh GPS icon */}
                <button 
                  type="button" 
                  onClick={fetchGPS}
                  className="absolute top-4 right-4 text-blue-600 hover:text-blue-700 active:scale-90 transition-all p-1"
                >
                  <RefreshCw className={`w-5 h-5 ${loadingGPS ? 'animate-spin' : ''}`} />
                </button>

                <div className="text-center space-y-0.5 mt-1 select-none">
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">WAKTU AKTUAL</p>
                  <p className="text-[11px] font-bold text-slate-500">{getIndonesianDate()}</p>
                  <p className="text-3xl font-black text-[#1E3A8A] tracking-tight font-mono">{currentTime}</p>
                </div>

                {/* Address with MapPin */}
                <div className="mt-4 flex gap-2.5 items-start text-xs text-slate-600">
                  <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="leading-relaxed text-[11px] font-semibold text-slate-700">
                      {address}
                    </p>
                    
                    {/* Geofence status label */}
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider ${inRadius ? 'text-emerald-600' : 'text-blue-600'}`}>
                        {inRadius 
                          ? 'Di dalam area kantor' 
                          : `DI LUAR RADIUS KANTOR ( +${distance} M )`
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Assignment Info & Timeline & Action Button */}
              <div className="bg-white rounded-[24px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-100/80 space-y-4 flex-1 flex flex-col justify-between">
                
                {/* Overtime Info Row */}
                <div className="flex justify-between items-center select-none">
                  <span className="text-[9px] font-black tracking-widest text-white bg-[#1E3A8A] px-2.5 py-1 rounded-full uppercase">
                    LEMBUR PPNPN
                  </span>
                  <Eye onClick={() => setShowInfoPresensi(true)} className="w-4.5 h-4.5 text-blue-500 cursor-pointer hover:text-blue-600 transition-all active:scale-90" />
                </div>

                {/* Horisontal timeline stepper connecting In & Out */}
                <div className="py-2 flex items-center justify-between px-6 relative select-none">
                  <div className="absolute left-[44px] right-[44px] top-[26px] h-0.5 bg-slate-100"></div>
                  {/* Connecting line */}
                  {selectedRecord?.clockIn && (
                    <div className="absolute left-[44px] right-[44px] top-[26px] h-0.5 bg-blue-500"></div>
                  )}

                  {/* Step: Clock In */}
                  <div className="flex flex-col items-center z-10">
                    <span className="text-[9px] font-black uppercase text-slate-400 mb-1">In Lembur</span>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                      selectedRecord?.clockIn
                        ? 'bg-emerald-600 text-white shadow-md' 
                        : 'bg-white border-2 border-slate-200 text-slate-300'
                    }`}>
                      <span className="text-[12px] font-bold">✓</span>
                    </div>
                    <span className="text-[10px] font-extrabold text-slate-700 mt-1 font-mono">
                      {selectedRecord?.clockIn || '--:--'}
                    </span>
                  </div>

                  {/* Step: Clock Out */}
                  <div className="flex flex-col items-center z-10">
                    <span className="text-[9px] font-black uppercase text-slate-400 mb-1">Out Lembur</span>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                      selectedRecord?.clockOut
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'bg-white border-2 border-slate-200 text-slate-300'
                    }`}>
                      {selectedRecord?.clockOut ? (
                        <span className="text-[12px] font-bold">✓</span>
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                      )}
                    </div>
                    <span className="text-[10px] font-extrabold text-slate-700 mt-1 font-mono">
                      {selectedRecord?.clockOut || '--:--'}
                    </span>
                  </div>
                </div>

                {/* Prominent Warning Banner: No Web Camera Allowed! */}
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center space-y-1 select-none">
                  <p className="text-[10px] font-black text-red-700 uppercase tracking-wider flex items-center justify-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                    Wajib Gunakan Kamera HP
                  </p>
                  <p className="text-[9.5px] text-red-600 leading-relaxed font-semibold">
                    Absensi menggunakan kamera web PC/Laptop akan DITOLAK oleh sistem. Wajib mengambil swafoto langsung!
                  </p>
                </div>

                {/* Embedded captured photo indicator */}
                {photoBase64 && (
                  <div className="flex items-center gap-3 p-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
                    <img 
                      src={photoBase64} 
                      alt="Review" 
                      className="w-12 h-12 rounded-lg object-cover border border-emerald-200 shadow-sm" 
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider">Swafoto Terpindai</p>
                      <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                        <span>✓ Siap divalidasi</span>
                      </p>
                    </div>
                    <button 
                      type="button" 
                      onClick={triggerCameraInput}
                      className="text-[10px] font-extrabold text-[#1E3A8A] hover:underline uppercase tracking-wide px-2 py-1"
                    >
                      Ubah
                    </button>
                  </div>
                )}

                {/* Selection helper block */}
                {!photoBase64 && (
                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      type="button"
                      onClick={triggerCameraInput}
                      className="w-full py-2.5 bg-[#1E3A8A] text-white hover:bg-blue-900 rounded-xl text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Gunakan Kamera HP</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSimulatedSelfie}
                      className="w-full py-2 bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 rounded-xl text-[10.5px] font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Simulasi Kamera HP</span>
                    </button>
                  </div>
                )}

                {/* Submit Action Button */}
                {photoBase64 && (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Mengirim Absen Lembur...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4.5 h-4.5" />
                        <span>Kirim Absen {absenType === 'masuk' ? 'Clock In' : 'Clock Out'}</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>

            {/* Bottom Sheet Drawer inside phone viewport */}
            {showInfoPresensi && (
              <>
                <div 
                  className="absolute inset-0 bg-black/45 z-30 transition-opacity duration-300 animate-in fade-in"
                  onClick={() => setShowInfoPresensi(false)}
                />
                
                <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[32px] p-5 pt-3 border-t border-slate-200 z-40 animate-in slide-in-from-bottom duration-300 flex flex-col space-y-4 text-left">
                  <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-1"></div>

                  <div className="flex items-center justify-between">
                    <div className="w-8"></div>
                    <h3 className="text-xs font-bold text-slate-800 text-center tracking-wider uppercase">Info Absen Lembur</h3>
                    <button 
                      type="button"
                      onClick={() => setShowInfoPresensi(false)} 
                      className="bg-slate-200/60 p-1.5 rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="bg-[#EDF2F7]/50 rounded-2xl p-4 border border-slate-100 flex flex-col space-y-3.5">
                    <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-wider">Log Detail Hari Ini</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 bg-blue-900 text-white rounded-lg flex items-center justify-center shrink-0">
                          <Clock className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-slate-800 font-mono">
                          In: {selectedRecord?.clockIn || '--:--'} | Out: {selectedRecord?.clockOut || '--:--'}
                        </span>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-7 h-7 bg-blue-900 text-white rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] leading-relaxed text-slate-600 font-semibold">
                          {address}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 bg-blue-900 text-white rounded-lg flex items-center justify-center shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-600">
                          Jarak: {distance} meter dari titik kantor
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Column: History of Absen Lembur Saya (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-800 text-sm">Riwayat Absen Lembur Saya</h3>
              </div>
              <span className="text-[10px] font-extrabold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full uppercase">
                {overtimeRecords.length} Hari Kerja
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/60 text-slate-400 font-extrabold uppercase text-[9.5px] tracking-wider">
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-3">In Lembur</th>
                    <th className="py-3 px-3">Out Lembur</th>
                    <th className="py-3 px-3 text-center">Durasi</th>
                    <th className="py-3 px-3 text-center">Foto Bukti</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {overtimeRecords.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {rec.date}
                      </td>
                      <td className="py-3.5 px-3">
                        {rec.clockIn ? (
                          <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 font-mono font-bold">
                            {rec.clockIn}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Belum Absen</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3">
                        {rec.clockOut ? (
                          <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 font-mono font-bold">
                            {rec.clockOut}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Belum Absen</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-center font-black text-slate-700">
                        {rec.hours > 0 ? `${rec.hours} Jam` : (rec.clockIn ? 'Berjalan' : '-')}
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex justify-center gap-1.5">
                          {rec.clockInPhoto && (
                            <div className="w-7 h-7 rounded border border-slate-200 overflow-hidden shadow-2xs" title="Foto Clock In">
                              <img 
                                src={rec.clockInPhoto} 
                                alt="In" 
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover" 
                              />
                            </div>
                          )}
                          {rec.clockOutPhoto && (
                            <div className="w-7 h-7 rounded border border-slate-200 overflow-hidden shadow-2xs" title="Foto Clock Out">
                              <img 
                                src={rec.clockOutPhoto} 
                                alt="Out" 
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover" 
                              />
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {overtimeRecords.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 font-bold italic">
                        Belum ada riwayat absen lembur.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
