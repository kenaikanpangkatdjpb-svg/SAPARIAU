import { useState, useEffect } from 'react';
import { 
  Clock, 
  PenLine, 
  Briefcase, 
  FileText, 
  LayoutGrid, 
  UserCheck, 
  HeartHandshake, 
  Car, 
  Coins, 
  Receipt, 
  Search, 
  Bell, 
  ChevronDown, 
  LogIn, 
  LogOut, 
  X, 
  Calendar, 
  MapPin, 
  Shield, 
  CheckCircle2, 
  ExternalLink,
  ChevronRight,
  Info,
  Sparkles,
  Award,
  Users,
  ClipboardCheck,
  TrendingUp,
  Grid3X3,
  FileSpreadsheet,
  UserSquare2,
  BookOpen,
  Heart,
  ThumbsUp,
  Key,
  CalendarCheck,
  Settings,
  Camera,
  Image,
  HardDrive,
  RefreshCw,
  History,
  Menu
} from 'lucide-react';
import { Employee, Attendance, OfficeSettings } from '../types';

interface MobileHomeViewProps {
  user: Employee;
  settings: OfficeSettings;
  todayAttendance: Attendance | null;
  employees: Employee[];
  onOpenAbsenModal: (type: 'masuk' | 'pulang') => void;
  onNavigateToView: (view: string) => void;
  onOpenSidebar?: () => void;
  onLogout?: () => void;
}

export default function MobileHomeView({
  user,
  settings,
  todayAttendance,
  employees,
  onOpenAbsenModal,
  onNavigateToView,
  onOpenSidebar,
  onLogout
}: MobileHomeViewProps) {
  // Live date & time in Indonesian WIB format
  const [dateStr, setDateStr] = useState('');
  const [timeStr, setTimeStr] = useState('');

  // Modals state
  const [selectedSatker, setSelectedSatker] = useState(settings.officeName || 'PT. Classik Creactive');
  const [showSatkerDropdown, setShowSatkerDropdown] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [showPengumumanModal, setShowPengumumanModal] = useState(false);
  const [activePengumumanIndex, setActivePengumumanIndex] = useState(0);
  const [showFacilityModal, setShowFacilityModal] = useState(false);
  const [showFinancialModal, setShowFinancialModal] = useState<'pinjaman' | 'kasbon' | null>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 
        'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
      ];
      
      const dayName = days[now.getDay()];
      const dateNum = now.getDate();
      const monthName = months[now.getMonth()];
      const year = now.getFullYear();
      
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');

      setDateStr(`${dayName}, ${dateNum} ${monthName} ${year}`);
      setTimeStr(`${hours}:${minutes}:${seconds} WIB`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Format attendance display times
  const checkInDisplay = todayAttendance?.checkIn ? `${todayAttendance.checkIn}:00` : '--:--:--';
  const checkOutDisplay = todayAttendance?.checkOut ? `${todayAttendance.checkOut}:00` : '--:--:--';

  // Announcements list
  const ANNOUNCEMENTS = [
    {
      id: 1,
      title: 'Semarak Lomba Panjat Pinang HUT Kemerdekaan RI & Hari Bakti Perbendaharaan',
      date: 'Sabtu, 24 Oktober 2026',
      category: 'Kegiatan Satker',
      description: 'Seluruh pegawai dan tenaga PPNPN diundang untuk memeriahkan perlombaan tradisional Panjat Pinang dan kebersamaan di lapangan utama kantor. Disediakan aneka doorprize dan apresiasi kebersamaan!',
      image: '/assets/aistudio/image_0eb03409.png'
    },
    {
      id: 2,
      title: 'Ketentuan Jam Pelayanan & Presensi Fleksibel Tenaga Keamanan PPNPN',
      date: 'Jumat, 23 Oktober 2026',
      category: 'Tata Tertib',
      description: 'Tenaga Keamanan (Security) tetap menjalankan sistem presensi Fleksibel 24 Jam dengan pencatatan geotagging lokasi presensi kantor Pekanbaru.',
      image: ''
    },
    {
      id: 3,
      title: 'Sosialisasi Standar Kinerja & Pengisian Logbook Harian PPNPN',
      date: 'Kamis, 22 Oktober 2026',
      category: 'Info Kinerja',
      description: 'Diharapkan seluruh personil PPNPN rutin mencatatkan logbook aktivitas harian pada menu Tugas guna pemutakhiran rapor kinerja akhir tahun.',
      image: ''
    }
  ];

  // State for menu category filter on HP
  const isAdmin = user.role === 'admin';
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Complete menus matching wide mode (desktop sidebar) exactly
  const allAdminMenus = [
    // 1. Menu Utama
    { id: 'pegawai', name: 'Data Pegawai', category: 'utama', categoryLabel: 'Menu Utama', desc: 'Kelola data & status personil PPNPN', icon: Users, color: 'bg-blue-50 text-blue-600 border-blue-200' },
    { id: 'verifikasi-approval', name: 'Verifikasi & Approval', category: 'utama', categoryLabel: 'Menu Utama', desc: 'Verifikasi & approval permohonan cuti / lembur', icon: ClipboardCheck, color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
    { id: 'monitoring-approval', name: 'Monitoring Approval', category: 'utama', categoryLabel: 'Menu Utama', desc: 'Pantau seluruh hasil persetujuan', icon: TrendingUp, color: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
    { id: 'rekap-matrix', name: 'Rekap Absensi', category: 'utama', categoryLabel: 'Menu Utama', desc: 'Laporan matrix kehadiran bulanan', icon: Grid3X3, color: 'bg-purple-50 text-purple-600 border-purple-200' },
    { id: 'rekap-lembur', name: 'Rekap Lembur', category: 'utama', categoryLabel: 'Menu Utama', desc: 'Rekapitulasi jam lembur PPNPN', icon: Clock, color: 'bg-amber-50 text-amber-600 border-amber-200' },
    { id: 'rekap-spkl', name: 'Rekapitulasi SPKL', category: 'utama', categoryLabel: 'Menu Utama', desc: 'Rekap Surat Perintah Kerja Lembur PPNPN', icon: FileSpreadsheet, color: 'bg-teal-50 text-teal-600 border-teal-200' },
    { id: 'detail-absensi', name: 'Detail Absensi', category: 'utama', categoryLabel: 'Menu Utama', desc: 'Riwayat presensi individu lengkap', icon: UserSquare2, color: 'bg-sky-50 text-sky-600 border-sky-200' },
    { id: 'generate-cuti', name: 'Setting Cuti', category: 'utama', categoryLabel: 'Menu Utama', desc: 'Setting sisa kuota hak cuti PPNPN', icon: CalendarCheck, color: 'bg-rose-50 text-rose-600 border-rose-200' },

    // 2. Evaluasi & Kinerja
    { id: 'rapor', name: 'Rapor Kinerja', category: 'kinerja', categoryLabel: 'Evaluasi & Kinerja', desc: 'Rapor capaian kinerja tahunan PPNPN', icon: Heart, color: 'bg-rose-50 text-rose-600 border-rose-200' },
    { id: 'perilaku', name: 'Perilaku', category: 'kinerja', categoryLabel: 'Evaluasi & Kinerja', desc: 'Penilaian aspek perilaku kerja', icon: TrendingUp, color: 'bg-violet-50 text-violet-600 border-violet-200' },
    { id: 'survei', name: 'Survei Kepuasan', category: 'kinerja', categoryLabel: 'Evaluasi & Kinerja', desc: 'Survei kepuasan layanan internal', icon: ThumbsUp, color: 'bg-blue-50 text-blue-600 border-blue-200' },
    { id: 'rekomendasi', name: 'Rekomendasi KI', category: 'kinerja', categoryLabel: 'Evaluasi & Kinerja', desc: 'Kepatuhan internal & evaluasi', icon: Award, color: 'bg-amber-50 text-amber-600 border-amber-200' },

    // 3. Pengaturan & Sistem
    { id: 'settings', name: 'Jam Operasional', category: 'pengaturan', categoryLabel: 'Pengaturan & Sistem', desc: 'Atur jam kerja & radius GPS kantor', icon: Settings, color: 'bg-slate-100 text-slate-700 border-slate-300' },
    { id: 'kop-logo', name: 'KOP & Logo', category: 'pengaturan', categoryLabel: 'Pengaturan & Sistem', desc: 'Kustomisasi KOP surat & logo instansi', icon: Image, color: 'bg-pink-50 text-pink-600 border-pink-200' },
    { id: 'ganti-password', name: 'Ganti Password', category: 'pengaturan', categoryLabel: 'Pengaturan & Sistem', desc: 'Perbarui kata sandi akun', icon: Key, color: 'bg-orange-50 text-orange-600 border-orange-200' },
    { id: 'backup-restore', name: 'Backup & Restore', category: 'pengaturan', categoryLabel: 'Pengaturan & Sistem', desc: 'Cadangkan & pulihkan database sistem', icon: HardDrive, color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
    { id: 'reset-aplikasi', name: 'Reset Data', category: 'pengaturan', categoryLabel: 'Pengaturan & Sistem', desc: 'Reset data transaksi aplikasi', icon: RefreshCw, color: 'bg-red-50 text-red-600 border-red-200' },
  ];

  const allEmployeeMenus = [
    // 1. Presensi & Aktivitas
    { id: 'absen-masuk', name: 'Absen Masuk', category: 'presensi', categoryLabel: 'Presensi & Tugas', desc: 'Presensi kehadiran masuk dengan swafoto & GPS', icon: Clock, color: 'bg-blue-50 text-blue-600 border-blue-200', action: () => onOpenAbsenModal('masuk') },
    { id: 'absen-pulang', name: 'Absen Pulang', category: 'presensi', categoryLabel: 'Presensi & Tugas', desc: 'Presensi kepulangan kantor', icon: Clock, color: 'bg-indigo-50 text-indigo-600 border-indigo-200', action: () => onOpenAbsenModal('pulang') },
    { id: 'detail-absensi', name: 'Riwayat Absensi', category: 'presensi', categoryLabel: 'Presensi & Tugas', desc: 'Lihat riwayat jam presensi Anda', icon: History, color: 'bg-teal-50 text-teal-600 border-teal-200' },
    { id: 'logbook', name: 'Logbook Tugas', category: 'presensi', categoryLabel: 'Presensi & Tugas', desc: 'Catat tugas & pekerjaan harian', icon: BookOpen, color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
    { id: 'approval-cuti', name: 'Pengajuan Cuti', category: 'presensi', categoryLabel: 'Presensi & Tugas', desc: 'Ajukan cuti tahunan, izin & sakit', icon: CalendarCheck, color: 'bg-rose-50 text-rose-600 border-rose-200' },
    { id: 'pengajuan-lembur', name: 'Pengajuan Lembur', category: 'presensi', categoryLabel: 'Presensi & Tugas', desc: 'Pengajuan SPKL lembur tugas', icon: Clock, color: 'bg-amber-50 text-amber-600 border-amber-200' },
    { id: 'absen-lembur-hp', name: 'Absen Lembur (HP)', category: 'presensi', categoryLabel: 'Presensi & Tugas', desc: 'Presensi lembur mandiri via ponsel', icon: Camera, color: 'bg-sky-50 text-sky-600 border-sky-200' },

    // 2. Kinerja & Akun
    { id: 'rapor', name: 'Rapor Kinerja', category: 'kinerja', categoryLabel: 'Kinerja & Akun', desc: 'Hasil evaluasi kinerja pegawai', icon: Award, color: 'bg-purple-50 text-purple-600 border-purple-200' },
    { id: 'rekomendasi', name: 'Rekomendasi KI', category: 'kinerja', categoryLabel: 'Kinerja & Akun', desc: 'Kepatuhan internal & standar', icon: Shield, color: 'bg-pink-50 text-pink-600 border-pink-200' },
    { id: 'ganti-password', name: 'Ganti Password', category: 'kinerja', categoryLabel: 'Kinerja & Akun', desc: 'Ubah kata sandi akun PPNPN', icon: Key, color: 'bg-orange-50 text-orange-600 border-orange-200' },
  ];

  const currentMenus = isAdmin ? allAdminMenus : allEmployeeMenus;
  const displayedMenus = selectedCategory === 'all' 
    ? currentMenus 
    : currentMenus.filter(m => m.category === selectedCategory);

  // Quick feature list for search indexing all menus
  const searchableFeatures = [
    { name: 'Absensi Masuk (Clock In)', desc: 'Presensi kehadiran swafoto & GPS', action: () => onOpenAbsenModal('masuk') },
    { name: 'Absensi Pulang (Clock Out)', desc: 'Presensi kepulangan kantor', action: () => onOpenAbsenModal('pulang') },
    ...currentMenus.map(m => ({
      name: m.name,
      desc: m.desc,
      action: () => {
        if ('action' in m && typeof (m as any).action === 'function') {
          (m as any).action();
        } else {
          onNavigateToView(m.id);
        }
      }
    }))
  ];

  const filteredFeatures = searchQuery.trim() === '' 
    ? searchableFeatures 
    : searchableFeatures.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()) || f.desc.toLowerCase().includes(searchQuery.toLowerCase()));

  const filteredEmployees = searchQuery.trim() === ''
    ? []
    : employees.filter(e => e.role !== 'admin' && (e.name.toLowerCase().includes(searchQuery.toLowerCase()) || e.position.toLowerCase().includes(searchQuery.toLowerCase())));

  return (
    <div className="w-full max-w-md mx-auto bg-white min-h-[92vh] pb-28 text-slate-800 select-none shadow-sm sm:border sm:border-slate-200/80 sm:rounded-3xl overflow-hidden font-sans">
      
      {/* 1. TOP HEADER BAR: Company / Satker Name & Icons */}
      <div className="px-5 pt-3 pb-2 flex items-center justify-between">
        {/* Satker Dropdown Button */}
        <div className="relative">
          <button 
            onClick={() => setShowSatkerDropdown(prev => !prev)}
            className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-bold text-sm tracking-tight active:scale-98 transition-transform"
          >
            <span className="truncate max-w-[210px]">{selectedSatker}</span>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showSatkerDropdown ? 'rotate-180' : ''}`} />
          </button>

          {/* Satker Dropdown Menu */}
          {showSatkerDropdown && (
            <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-1">
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Pilih Satuan Kerja / Kantor
              </div>
              <button
                onClick={() => { setSelectedSatker('PT. Classik Creactive'); setShowSatkerDropdown(false); }}
                className={`w-full text-left px-3.5 py-2 text-xs font-semibold hover:bg-slate-50 flex items-center justify-between ${
                  selectedSatker === 'PT. Classik Creactive' ? 'text-blue-600 bg-blue-50/50' : 'text-slate-700'
                }`}
              >
                <span>PT. Classik Creactive</span>
                {selectedSatker === 'PT. Classik Creactive' && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
              </button>
              <button
                onClick={() => { setSelectedSatker(settings.officeName || 'Kanwil DJPb Riau'); setShowSatkerDropdown(false); }}
                className={`w-full text-left px-3.5 py-2 text-xs font-semibold hover:bg-slate-50 flex items-center justify-between ${
                  selectedSatker !== 'PT. Classik Creactive' ? 'text-blue-600 bg-blue-50/50' : 'text-slate-700'
                }`}
              >
                <span>{settings.officeName || 'Kanwil DJPb Riau'}</span>
                {selectedSatker !== 'PT. Classik Creactive' && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
              </button>
            </div>
          )}
        </div>

        {/* Right Action Icons: Search & Bell */}
        <div className="flex items-center gap-1.5">
          <button 
            onClick={() => setShowSearchModal(true)}
            aria-label="Pencarian Cepat"
            className="w-9 h-9 rounded-full flex items-center justify-center text-blue-600 hover:bg-blue-50 active:scale-95 transition-all"
            title="Cari Menu atau Pegawai"
          >
            <Search className="w-5 h-5 stroke-[2.2]" />
          </button>
          
          <button 
            onClick={() => setShowNotifModal(true)}
            aria-label="Pemberitahuan"
            className="w-9 h-9 rounded-full flex items-center justify-center text-blue-600 hover:bg-blue-50 active:scale-95 transition-all relative"
            title="Pemberitahuan Sistem"
          >
            <Bell className="w-5 h-5 stroke-[2.2]" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-pink-500 border border-white" />
          </button>
        </div>
      </div>

      {/* 2. USER PROFILE BANNER & LIVE WIB CLOCK */}
      <div className="px-5 py-3 flex items-center justify-between gap-3">
        {/* Left: Avatar + Name + Position */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-slate-100 shadow-xs shrink-0 bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-lg">
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
          <div className="min-w-0">
            <h2 className="font-bold text-slate-900 text-base leading-tight truncate">
              {user.name}
            </h2>
            <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
              {user.position || (user.role === 'admin' ? 'Administrator' : 'PPNPN')}
            </p>
          </div>
        </div>

        {/* Right: Date & Time in WIB */}
        <div className="text-right shrink-0">
          <div className="text-xs font-semibold text-slate-800">
            {dateStr || 'Memuat tanggal...'}
          </div>
          <div className="text-xs text-slate-500 font-mono mt-0.5">
            {timeStr || '08:28:23 WIB'}
          </div>
        </div>
      </div>

      {/* 3. ATTENDANCE CLOCK IN / OUT CARD */}
      <div className="px-5 mt-2">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
          <div className="grid grid-cols-2 gap-4">
            
            {/* Absen Masuk Column */}
            <div className="flex flex-col items-center text-center">
              <span className="text-xs text-slate-500 font-medium">Absen Masuk</span>
              <span className="font-bold text-lg text-slate-900 tracking-tight font-mono my-1.5">
                {checkInDisplay}
              </span>
              <button
                onClick={() => onOpenAbsenModal('masuk')}
                className="w-full py-2.5 px-3 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Clock In</span>
              </button>
            </div>

            {/* Absen Keluar Column */}
            <div className="flex flex-col items-center text-center">
              <span className="text-xs text-slate-500 font-medium">Absen Keluar</span>
              <span className="font-bold text-lg text-slate-900 tracking-tight font-mono my-1.5">
                {checkOutDisplay}
              </span>
              <button
                onClick={() => onOpenAbsenModal('pulang')}
                className="w-full py-2.5 px-3 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Clock Out</span>
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* 4. MENU APLIKASI (Sama Persis dengan Mode Lebar / Desktop Sidebar) */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-2.5 px-1">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>Menu Aplikasi</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                {displayedMenus.length} Menu
              </span>
            </h3>
            <p className="text-[11px] text-slate-500">Fitur lengkap sama persis dengan mode lebar</p>
          </div>
          {onOpenSidebar && (
            <button
              onClick={onOpenSidebar}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 active:scale-95 transition-transform cursor-pointer bg-blue-50/80 px-2.5 py-1.5 rounded-xl border border-blue-100"
              title="Buka Menu Samping Lengkap"
            >
              <Menu className="w-3.5 h-3.5" />
              <span>Sidebar</span>
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none mb-3 px-1">
          {isAdmin ? (
            <>
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                  selectedCategory === 'all' 
                    ? 'bg-blue-600 text-white shadow-xs' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua ({allAdminMenus.length})
              </button>
              <button
                onClick={() => setSelectedCategory('utama')}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                  selectedCategory === 'utama' 
                    ? 'bg-blue-600 text-white shadow-xs' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Menu Utama (8)
              </button>
              <button
                onClick={() => setSelectedCategory('kinerja')}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                  selectedCategory === 'kinerja' 
                    ? 'bg-blue-600 text-white shadow-xs' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Evaluasi & Kinerja (4)
              </button>
              <button
                onClick={() => setSelectedCategory('pengaturan')}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                  selectedCategory === 'pengaturan' 
                    ? 'bg-blue-600 text-white shadow-xs' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Pengaturan (5)
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                  selectedCategory === 'all' 
                    ? 'bg-blue-600 text-white shadow-xs' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua Menu ({allEmployeeMenus.length})
              </button>
              <button
                onClick={() => setSelectedCategory('presensi')}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                  selectedCategory === 'presensi' 
                    ? 'bg-blue-600 text-white shadow-xs' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Presensi & Tugas (7)
              </button>
              <button
                onClick={() => setSelectedCategory('kinerja')}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                  selectedCategory === 'kinerja' 
                    ? 'bg-blue-600 text-white shadow-xs' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Kinerja & Akun (3)
              </button>
            </>
          )}
        </div>

        {/* Dynamic 4-Column Responsive Menu Grid */}
        <div className="grid grid-cols-4 gap-y-4 gap-x-2">
          {displayedMenus.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if ('action' in item && typeof (item as any).action === 'function') {
                    (item as any).action();
                  } else {
                    onNavigateToView(item.id);
                  }
                }}
                className="flex flex-col items-center group cursor-pointer active:scale-95 transition-all text-center"
                title={item.name}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-2xs transition-all group-hover:scale-105 group-hover:shadow-md ${item.color}`}>
                  <Icon className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-[11px] font-semibold text-slate-700 group-hover:text-blue-600 mt-1.5 leading-tight line-clamp-2 px-0.5">
                  {item.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. PENGUMUMAN SECTION */}
      <div className="px-5 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-base text-slate-900 tracking-tight">
            Pengumuman
          </h3>
          <button
            onClick={() => setShowPengumumanModal(true)}
            className="text-pink-600 hover:text-pink-700 font-semibold text-xs active:scale-95 transition-transform cursor-pointer"
          >
            Lihat Semua
          </button>
        </div>

        {/* Big Announcement Card with Panjat Pinang celebration */}
        <div 
          onClick={() => { setActivePengumumanIndex(0); setShowPengumumanModal(true); }}
          className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm cursor-pointer group active:scale-[0.99] transition-all bg-white"
        >
          {/* Photo Container */}
          <div className="relative h-44 w-full bg-slate-900 overflow-hidden">
            {/* Real Screenshot Attachment as Announcement Banner */}
            <img 
              src="/assets/aistudio/image_0eb03409.png" 
              alt="Perlombaan Tradisional Panjat Pinang" 
              className="w-full h-full object-cover object-bottom scale-105 group-hover:scale-110 transition-transform duration-500 filter brightness-105"
              referrerPolicy="no-referrer"
            />
            {/* Scrim Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20" />
            
            {/* Badge on Photo */}
            <div className="absolute top-3 left-3">
              <span className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-pink-600 font-bold text-[10px] tracking-wide shadow-sm flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-pink-500" />
                HUT Kemerdekaan RI
              </span>
            </div>

            {/* Bottom Caption on Photo */}
            <div className="absolute bottom-3 left-3 right-3 text-white">
              <p className="text-[10px] font-medium text-slate-200">Sabtu, 24 Oktober 2026</p>
              <h4 className="font-bold text-xs sm:text-sm text-white line-clamp-1 leading-snug drop-shadow-sm">
                Semarak Lomba Panjat Pinang & Kebersamaan PPNPN
              </h4>
            </div>
          </div>
          
          <div className="p-3.5 bg-white flex items-center justify-between">
            <p className="text-xs text-slate-600 line-clamp-1 font-normal">
              Perlombaan tradisional di lapangan kantor & pembagian apresiasi.
            </p>
            <span className="text-pink-600 text-xs font-bold shrink-0 ml-2 flex items-center">
              Detail <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>

      {/* MODAL 1: SEARCH MODAL */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end sm:justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-h-[85vh] flex flex-col overflow-hidden max-w-md w-full mx-auto shadow-2xl">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari fitur, menu, atau nama pegawai..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full pl-9 pr-3 py-2 bg-slate-100 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button 
                onClick={() => { setShowSearchModal(false); setSearchQuery(''); }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4 flex-1">
              {/* Feature search results */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Menu & Fitur</p>
                <div className="space-y-1">
                  {filteredFeatures.map((f, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setShowSearchModal(false);
                        f.action();
                      }}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 flex items-center justify-between group active:scale-98 transition-all"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-800 group-hover:text-blue-600">{f.name}</p>
                        <p className="text-[10px] text-slate-500">{f.desc}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Employee search results */}
              {filteredEmployees.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Pegawai PPNPN</p>
                  <div className="space-y-1.5">
                    {filteredEmployees.map(emp => (
                      <div 
                        key={emp.id}
                        onClick={() => {
                          setShowSearchModal(false);
                          onNavigateToView('pegawai');
                        }}
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between cursor-pointer"
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-800">{emp.name}</p>
                          <p className="text-[10px] text-slate-500">{emp.position} • ID: {emp.id}</p>
                        </div>
                        <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                          {emp.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: NOTIFICATIONS MODAL */}
      {showNotifModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end sm:justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-h-[80vh] flex flex-col overflow-hidden max-w-md w-full mx-auto shadow-2xl">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-800">Pemberitahuan Sistem</h3>
              </div>
              <button 
                onClick={() => setShowNotifModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto space-y-3">
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-900">Pengingat Presensi Pulang</span>
                  <span className="text-[9px] text-blue-600 font-mono">16:30 WIB</span>
                </div>
                <p className="text-blue-800 text-[11px]">
                  Jangan lupa melakukan Clock Out sebelum meninggalkan area kantor.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Jadwal Penugasan Security</span>
                  <span className="text-[9px] text-slate-500">Hari ini</span>
                </div>
                <p className="text-slate-600 text-[11px]">
                  Sistem Fleksibel 24 Jam aktif. Bebas jam bertugas dengan validasi geotagging presensi.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-900">Database Firebase Terhubung</span>
                  <span className="text-[9px] text-emerald-600">Online</span>
                </div>
                <p className="text-emerald-800 text-[11px]">
                  Semua transaksi absensi dan logbook tersinkronisasi otomatis secara realtime.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: PENGUMUMAN MODAL */}
      {showPengumumanModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end sm:justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-h-[85vh] flex flex-col overflow-hidden max-w-md w-full mx-auto shadow-2xl">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-800">Papan Pengumuman Kantor</h3>
              <button 
                onClick={() => setShowPengumumanModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4">
              {ANNOUNCEMENTS.map((item, idx) => (
                <div 
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    idx === activePengumumanIndex 
                      ? 'border-pink-300 bg-pink-50/20 shadow-xs' 
                      : 'border-slate-100 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-pink-600 font-bold mb-1">
                    <span>{item.category}</span>
                    <span className="text-slate-400 font-normal">{item.date}</span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 mb-2 leading-snug">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                  {item.image && (
                    <div className="mt-3 rounded-xl overflow-hidden h-36 border border-slate-200">
                      <img 
                        src={item.image} 
                        alt={item.title} 
                        className="w-full h-full object-cover object-bottom"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: FASILITAS KANTOR */}
      {showFacilityModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end sm:justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-h-[80vh] flex flex-col overflow-hidden max-w-md w-full mx-auto shadow-2xl">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Car className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-800">Fasilitas & Sarana Operasional</h3>
              </div>
              <button 
                onClick={() => setShowFacilityModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto space-y-3">
              <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900">Kendaraan Dinas Operasional</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Toyota Innova Zenix / Avanza (Standar Sopir Kanwil). Pemeriksaan log kendaraan tercatat di Logbook.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900">Pos Pengamanan & CCTV</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Pos Jaga Utama 24 Jam dengan monitor pengawasan wilayah gerbang utama dan lobi.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900">Zona Geofencing Presensi</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Lokasi: {settings.officeName || 'Pekanbaru'} (Radius {settings.officeRadiusMeters || 100} meter terverifikasi GPS).</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: PINJAMAN & KASBON */}
      {showFinancialModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end sm:justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-h-[80vh] flex flex-col overflow-hidden max-w-md w-full mx-auto shadow-2xl">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-sm text-slate-800">
                  {showFinancialModal === 'pinjaman' ? 'Informasi Koperasi & Pinjaman' : 'Pengajuan Kasbon & Uang Muka'}
                </h3>
              </div>
              <button 
                onClick={() => setShowFinancialModal(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto space-y-3">
              <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/80 space-y-2">
                <p className="text-xs font-bold text-amber-950">
                  {showFinancialModal === 'pinjaman' ? 'Layanan Koperasi Pegawai PPNPN' : 'Fasilitas Kasbon Karyawan'}
                </p>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Layanan pengajuan pinjaman darurat dan kasbon PPNPN dapat dikoordinasikan langsung melalui Pengurus Koperasi Kantor atau Bagian Keuangan dengan persetujuan Pejabat Pembuat Komitmen (PPK).
                </p>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  onClick={() => {
                    setShowFinancialModal(null);
                    onNavigateToView('pengajuan-lembur');
                  }}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  Buka Rekapitulasi SPKL / Lembur
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
