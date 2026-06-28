import React, { useState, useEffect, useRef } from 'react';
import { Camera, MapPin, Upload, RefreshCw, X, CheckCircle, Navigation, ChevronLeft, History, Eye, Info, Clock, User } from 'lucide-react';
import { Attendance, OfficeSettings, Employee } from '../types';
import { uploadImageToDrive } from '../utils/storage';

interface AbsenModalProps {
  user: Employee;
  type: 'masuk' | 'pulang';
  settings: OfficeSettings;
  onClose: () => void;
  onSubmit: (attendanceData: Partial<Attendance>) => void;
  todayAttendance?: Attendance | null;
}

export default function AbsenModal({ user, type, settings, onClose, onSubmit, todayAttendance }: AbsenModalProps) {
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [loadingGPS, setLoadingGPS] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [logbookText, setLogbookText] = useState('');
  const [showInfoPresensi, setShowInfoPresensi] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSecurity = user.position?.toLowerCase().includes('satpam') || 
                     user.position?.toLowerCase().includes('security') || 
                     user.position?.toLowerCase().includes('keamanan') || 
                     user.position?.toLowerCase().includes('penjaga');

  const getDetectedShift = (): 'pagi' | 'malam' | null => {
    if (!isSecurity) return null;
    const now = new Date();
    const hour = now.getHours();
    if (hour >= 4 && hour < 13) {
      return 'pagi';
    }
    return 'malam';
  };

  const detectedShift = getDetectedShift();

  // Run dynamic clocks
  const [currentTime, setCurrentTime] = useState('09.59.13');
  const [statusBarTime, setStatusBarTime] = useState('09:59');

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

  // Get GPS on open
  useEffect(() => {
    fetchGPS();
  }, []);

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

    const d = R * c; // in metres
    return Math.round(d);
  };

  const fetchGPS = () => {
    setLoadingGPS(true);
    setGpsError(null);
    
    if (!navigator.geolocation) {
      setGpsError("Browser Anda tidak mendukung Geolocation.");
      setLoadingGPS(false);
      simulateGPS();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLocation({ lat, lng });
        
        // Calculate distance from office
        const dist = calculateDistance(lat, lng, settings.officeLat, settings.officeLng);
        setDistance(dist);
        setAddress("Jl. Padang No.5, Tengkerang Utara, Bukit Raya, Kota Pekanbaru, Riau 28126, Indonesia");
        setLoadingGPS(false);
      },
      (error) => {
        console.warn("Geolocation failed, using simulation:", error.message);
        setGpsError("Gagal mendeteksi GPS secara akurat. Menggunakan GPS simulasi kantor.");
        setLoadingGPS(false);
        simulateGPS();
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  const simulateGPS = () => {
    // Proximity simulation: offset to trigger outer radius easily, matching the screenshot (+250m)
    const isAtOffice = false; // Force outer radius to look like the mockup screenshot
    let lat = settings.officeLat;
    let lng = settings.officeLng;
    
    if (!isAtOffice) {
      lat += 0.0028; // approximately 250 - 300 meters away
      lng -= 0.0022;
    }

    setLocation({ lat, lng });
    const dist = calculateDistance(lat, lng, settings.officeLat, settings.officeLng);
    setDistance(dist);
    setAddress("Jl. Padang No.5, Tengkerang Utara, Bukit Raya, Kota Pekanbaru, Riau 28126, Indonesia");
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

  const triggerCameraInput = () => {
    alert("Setiap PPNPN wajib melakukan swafoto menggunakan kamera HP.");
    fileInputRef.current?.click();
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoBase64) {
      triggerCameraInput();
      return;
    }

    setIsUploading(true);
    
    try {
      const fileName = `absen_${type}_${user.id}_${new Date().toISOString().slice(0, 10)}.jpg`;
      const photoUrl = await uploadImageToDrive(photoBase64, fileName);
      
      const checkInStatus = (): 'Tepat Waktu' | 'Terlambat' => {
        if (type === 'pulang') return 'Tepat Waktu';
        const now = new Date();
        
        let endHour = 8;
        let endMinute = 15;
        
        const activeShift = isSecurity ? detectedShift : user.shift;
        if (activeShift === 'pagi') {
          const shiftEndStr = settings.securityShiftPagiEnd || "08:00";
          const [h, m] = shiftEndStr.split(':').map(Number);
          endHour = h;
          endMinute = m;
        } else if (activeShift === 'malam') {
          const shiftEndStr = settings.securityShiftMalamEnd || "16:00";
          const [h, m] = shiftEndStr.split(':').map(Number);
          endHour = h;
          endMinute = m;
        } else {
          const [h, m] = settings.checkInEnd.split(':').map(Number);
          endHour = h;
          endMinute = m;
        }
        
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        
        if (currentHour > endHour || (currentHour === endHour && currentMinute > endMinute)) {
          return 'Terlambat';
        }
        return 'Tepat Waktu';
      };

      const nowTime = new Date().toTimeString().split(' ')[0].slice(0, 5);

      const attendanceRecord: Partial<Attendance> = {
        date: new Date().toISOString().split('T')[0],
        ...(type === 'masuk' ? {
          checkIn: nowTime,
          checkInPhoto: photoUrl,
          checkInLocation: location,
          checkInAddress: address,
          checkInStatus: checkInStatus(),
          logbookNotes: logbookText || undefined,
          shift: detectedShift || undefined
        } : {
          checkOut: nowTime,
          checkOutPhoto: photoUrl,
          checkOutLocation: location,
          checkOutAddress: address,
          checkOutStatus: 'Tepat Waktu'
        })
      };

      onSubmit(attendanceRecord);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat memproses absen.");
    } finally {
      setIsUploading(false);
    }
  };

  const inRadius = distance !== null && distance <= settings.officeRadiusMeters;

  const getIndonesianDate = () => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const now = new Date();
    const dayName = days[now.getDay()];
    const dateNum = now.getDate();
    const monthName = months[now.getMonth()];
    const yearNum = now.getFullYear();
    return `${dayName}, ${dateNum} ${monthName} ${yearNum}`;
  };

  return (
    <div 
      id="absen-modal-backdrop"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4"
    >
      {/* High Fidelity Phone Simulator Container */}
      <div 
        id="absen-modal"
        className="bg-[#F4F6F9] text-slate-800 w-full max-w-[390px] h-full sm:h-[800px] sm:max-h-[92vh] sm:rounded-[40px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)] flex flex-col overflow-hidden relative border border-slate-200"
      >
        {/* Hidden native input file for camera */}
        <input 
          type="file"
          accept="image/*"
          capture="environment"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          id="native-camera-file"
        />

        {/* 1. Phone Top Status Bar */}
        <div className="px-6 pt-3 pb-2 flex justify-between items-center text-[12px] font-bold text-slate-700 bg-white select-none">
          <span>{statusBarTime}</span>
          <div className="flex items-center gap-1.5">
            {/* Battery, Wifi & Signal Strength Mock Icons */}
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L12 21l7.03-3.39C20.26 16.07 21 14.12 21 12c0-4.97-4.03-9-9-9zm0 15c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z" />
            </svg>
            <span className="text-[10px]">74%</span>
            <div className="w-5 h-2.5 border border-slate-500 rounded-sm p-0.5 flex items-center">
              <div className="bg-slate-700 h-full w-3 rounded-2xs"></div>
            </div>
          </div>
        </div>

        {/* 2. App Header inside simulator */}
        <div className="bg-white px-4 py-3 flex justify-between items-center border-b border-slate-100 select-none">
          <button 
            type="button" 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 active:scale-95 rounded-full text-slate-700 transition-all"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">Presensi</h2>
          <button 
            type="button"
            className="p-1.5 hover:bg-slate-100 active:scale-95 rounded-full text-slate-700 transition-all"
          >
            <History className="w-5 h-5" />
          </button>
        </div>

        {/* 3. Smartphone Viewport Body */}
        <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col pb-6">
          
          {/* Card 1: Live clock, dynamic date, map pin address & geofence */}
          <div className="bg-white rounded-[24px] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.02)] border border-slate-100/80 relative">
            {/* Refresh icon */}
            <button 
              type="button" 
              onClick={fetchGPS}
              className="absolute top-4 right-4 text-[#0088FF] hover:text-[#0077EE] active:scale-90 transition-all p-1"
            >
              <RefreshCw className={`w-5 h-5 ${loadingGPS ? 'animate-spin' : ''}`} />
            </button>

            <div className="text-center space-y-0.5 mt-1 select-none">
              <p className="text-xs font-semibold text-slate-500">{getIndonesianDate()}</p>
              <p className="text-4xl font-extrabold text-slate-800 tracking-tight font-mono">{currentTime}</p>
            </div>

            {/* Address with MapPin */}
            <div className="mt-5 flex gap-2.5 items-start text-xs text-slate-600">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="leading-relaxed text-[11.5px] font-medium text-slate-700">
                  {address || "Jl. Padang No.5, Tengkerang Utara, Bukit Raya, Kota Pekanbaru, Riau 28126, Indonesia"}
                </p>
                
                {/* Geofence status label */}
                <div className="flex items-center gap-1.5 pt-0.5">
                  <span className={`text-[11px] font-bold ${inRadius ? 'text-emerald-600' : 'text-red-500'}`}>
                    {inRadius 
                      ? 'Di dalam area presensi' 
                      : `Di luar area presensi ( +${distance !== null ? Math.max(0, distance - settings.officeRadiusMeters) : '250'} m )`
                    }
                  </span>
                  <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 cursor-pointer" />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Assignment Info & Timeline & Action Button */}
          <div className="bg-white rounded-[24px] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.02)] border border-slate-100/80 space-y-4 flex-1 flex flex-col">
            
            {/* WFO Badge & Eye Icon */}
            <div className="flex justify-between items-center select-none">
              <span className="text-xs font-black tracking-widest text-slate-800 bg-slate-100 px-2.5 py-1 rounded-full uppercase">
                WFO
              </span>
              <Eye onClick={() => setShowInfoPresensi(true)} className="w-5 h-5 text-sky-500 cursor-pointer hover:text-sky-600 transition-all active:scale-90" />
            </div>

            {/* Lokasi Penugasan Text */}
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none">
                Lokasi Penugasan:
              </p>
              <p className="text-[11.5px] text-slate-600 leading-relaxed font-medium">
                Jalan Jenderal Sudirman No. 249, Pekanbaru 28116; TELEPON (0761) 22686; FAKSIMILE (0761) 22647; SUREL : kanwildjpbnriau@kemenkeu.go.id;
              </p>
            </div>

            {/* Horisontal timeline stepper connecting In & Out */}
            <div className="py-2 flex items-center justify-between px-6 relative select-none">
              <div className="absolute left-[44px] right-[44px] top-[26px] h-0.5 bg-slate-100"></div>
              {/* If type is 'pulang' (user has checked in), show blue connecting bar */}
              {type === 'pulang' && (
                <div className="absolute left-[44px] right-[44px] top-[26px] h-0.5 bg-[#0088FF]"></div>
              )}

              {/* Step: In */}
              <div className="flex flex-col items-center z-10">
                <span className="text-[10px] font-bold text-slate-400 mb-1">In</span>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                  type === 'pulang' || photoBase64
                    ? 'bg-[#0088FF] text-white shadow-md' 
                    : 'bg-white border-2 border-slate-200 text-slate-300'
                }`}>
                  <span className="text-[13px] font-bold">✓</span>
                </div>
                <span className="text-[11px] font-bold text-slate-700 mt-1 font-mono">
                  {type === 'pulang' ? (todayAttendance?.checkIn || '09.31') : (photoBase64 ? 'Ready' : '--')}
                </span>
              </div>

              {/* Step: Out */}
              <div className="flex flex-col items-center z-10">
                <span className="text-[10px] font-bold text-slate-400 mb-1">Out</span>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                  type === 'pulang' && photoBase64
                    ? 'bg-[#0088FF] text-white shadow-md' 
                    : 'bg-white border-2 border-slate-200 text-slate-300 animate-pulse'
                }`}>
                  {type === 'pulang' && photoBase64 ? (
                    <span className="text-[13px] font-bold">✓</span>
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                  )}
                </div>
                <span className="text-[11px] font-bold text-slate-700 mt-1 font-mono">
                  {type === 'pulang' && photoBase64 ? currentTime.slice(0, 5) : '--'}
                </span>
              </div>
            </div>

            {/* Info label */}
            <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-3 text-center space-y-1 select-none">
              <p className="text-[10.5px] font-black text-amber-800 uppercase tracking-wider flex items-center justify-center gap-1">
                <Camera className="w-3.5 h-3.5 text-amber-600" />
                Wajib Menggunakan Kamera HP
              </p>
              <p className="text-[10px] text-amber-700 font-medium leading-relaxed">
                Anda wajib melakukan foto langsung menggunakan kamera HP saat Clock In maupun Clock Out.
              </p>
            </div>

            {/* Embedded captured photo indicator */}
            {photoBase64 && (
              <div className="flex items-center gap-3 p-2 bg-emerald-50/50 rounded-xl border border-emerald-100/60 mt-auto">
                <img 
                  src={photoBase64} 
                  alt="Review" 
                  className="w-12 h-12 rounded-lg object-cover border border-emerald-200 shadow-sm" 
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Foto Terpindai</p>
                  <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                    <span>✓ Siap dikirim sekarang</span>
                  </p>
                </div>
                <button 
                  type="button" 
                  onClick={triggerCameraInput}
                  className="text-[10.5px] font-black text-sky-600 hover:underline uppercase tracking-wide px-2 py-1"
                >
                  Ubah
                </button>
              </div>
            )}

            {/* Optional Activity log input for clock-in */}
            {type === 'masuk' && (
              <div className="space-y-1.5 pt-1">
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider select-none">
                  Aktivitas Hari Ini (Opsional):
                </label>
                <input 
                  type="text"
                  value={logbookText}
                  onChange={(e) => setLogbookText(e.target.value)}
                  placeholder="Rencana kegiatan / pekerjaan Anda hari ini..."
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0088FF] focus:bg-white transition-all font-medium"
                />
              </div>
            )}

            {/* MAIN CLOCK PILL BUTTON: Matches color & rounded shape exactly */}
            <div className="pt-2 mt-auto">
              <button
                type="button"
                onClick={photoBase64 ? handleFormSubmit : triggerCameraInput}
                disabled={isUploading}
                className={`w-full py-4 px-6 rounded-full font-bold text-xs uppercase tracking-widest text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
                  isUploading
                    ? 'bg-slate-400 cursor-not-allowed shadow-none'
                    : type === 'masuk'
                      ? 'bg-sky-500 hover:bg-sky-600 shadow-sky-500/20'
                      : 'bg-[#FF5C5C] hover:bg-[#e04f4f] shadow-red-500/20'
                }`}
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Mengirim...</span>
                  </>
                ) : photoBase64 ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Kirim Presensi Sekarang</span>
                  </>
                ) : type === 'masuk' ? (
                  'Clock In'
                ) : (
                  'Clock Out'
                )}
              </button>
            </div>
          </div>

          {/* 4. Footer info link */}
          <div className="mt-auto pt-4 text-center text-xs text-slate-500 select-none">
            <span>Kendala presensi? </span>
            <button 
              type="button" 
              onClick={triggerCameraInput}
              className="text-[#0088FF] hover:underline font-bold"
            >
              Ambil foto
            </button>
          </div>
        </form>

        {/* 5. Bottom Sheet Drawer: Informasi Presensi */}
        {showInfoPresensi && (
          <>
            {/* Dark overlay backdrop inside phone view */}
            <div 
              className="absolute inset-0 bg-black/45 z-30 transition-opacity duration-300 animate-in fade-in"
              onClick={() => setShowInfoPresensi(false)}
            />
            
            {/* Bottom Sheet Drawer */}
            <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[32px] p-5 pt-3 border-t border-slate-200/60 z-40 animate-in slide-in-from-bottom duration-300 flex flex-col space-y-4 shadow-[0_-10px_30px_rgba(0,0,0,0.15)] text-left">
              {/* Pill Drag Handle */}
              <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-1"></div>

              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="w-8"></div> {/* spacer */}
                <h3 className="text-sm font-bold text-slate-800 text-center tracking-wide uppercase">WFO</h3>
                <button 
                  type="button"
                  onClick={() => setShowInfoPresensi(false)} 
                  className="bg-slate-200/60 p-1.5 rounded-full hover:bg-slate-200 text-slate-500 transition-colors active:scale-95"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-slate-100 text-[11px] font-extrabold select-none text-center">
                <button type="button" className="flex-1 pb-2.5 border-b-2 border-sky-500 text-sky-600 uppercase tracking-wider">Presensi</button>
                <button type="button" className="flex-1 pb-2.5 text-slate-400 uppercase tracking-wider">Penugasan</button>
              </div>

              {/* Presensi Details Card */}
              <div className="bg-[#EDF2F7]/55 rounded-2xl p-4 border border-slate-100 flex flex-col space-y-3.5 text-left">
                <h4 className="text-[12px] font-black text-slate-800">Clock In</h4>
                
                {/* List items */}
                <div className="space-y-3">
                  {/* Item 1: Time */}
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 bg-[#1E293B] text-white rounded-lg flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 font-mono">
                      {type === 'pulang' ? (todayAttendance?.checkIn || '09.31') : '09.31'}
                    </span>
                  </div>

                  {/* Item 2: Address */}
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 bg-[#1E293B] text-white rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] leading-relaxed text-slate-600 font-medium">
                      {address || "Jl. Padang No.5, Tengkerang Utara, Bukit Raya, Kota Pekanbaru, Riau 28126, Indonesia"}
                    </span>
                  </div>

                  {/* Item 3: Distance */}
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 bg-[#1E293B] text-white rounded-lg flex items-center justify-center shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-600">
                      {distance !== null ? `${Math.round(distance)} meter dari lokasi` : '2032 meter dari lokasi'}
                    </span>
                  </div>

                  {/* Item 4: Photo attachment */}
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 bg-[#1E293B] text-white rounded-lg flex items-center justify-center shrink-0">
                      <Camera className="w-4 h-4" />
                    </div>
                    {/* Cropped thumbnail to match exactly */}
                    <div className="w-10 h-10 rounded overflow-hidden border border-slate-200 bg-slate-100 shadow-sm shrink-0">
                      {photoBase64 ? (
                        <img 
                          src={photoBase64} 
                          alt="Face" 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover" 
                        />
                      ) : todayAttendance?.checkInPhoto ? (
                        <img 
                          src={todayAttendance.checkInPhoto} 
                          alt="Face" 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <img 
                          src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150" 
                          alt="Mock Face" 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover" 
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

