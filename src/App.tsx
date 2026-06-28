import { useState, useEffect, useMemo } from 'react';
import { getStoredData, saveEmployees, saveAttendance, saveLeaves, saveLogbooks, saveSettings } from './utils/storage';
import { Employee, Attendance, LeaveRequest, Logbook, OfficeSettings } from './types';

// Components
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './components/DashboardView';
import PegawaiView from './components/PegawaiView';
import ApprovalCutiView from './components/ApprovalCutiView';
import RekapMatrixView from './components/RekapMatrixView';
import RekapLemburView from './components/RekapLemburView';
import DetailAbsensiView from './components/DetailAbsensiView';
import LogbookView from './components/LogbookView';
import SystemSettingsView from './components/SystemSettingsView';
import AbsenModal from './components/AbsenModal';
import LoginScreen from './components/LoginScreen';
import PengajuanLemburView from './components/PengajuanLemburView';
import AbsenLemburHPView from './components/AbsenLemburHPView';
import VerifikasiApprovalView from './components/VerifikasiApprovalView';
import MonitoringHasilApprovalView from './components/MonitoringHasilApprovalView';
import RekapitulasiSpklView from './components/RekapitulasiSpklView';
import KopLogoSettingsView from './components/KopLogoSettingsView';
import RekomendasiKIView from './components/RekomendasiKIView';

// Extra Evaluation Views to match the requested image perfectly
import { Award, Heart, ThumbsUp, TrendingUp, Sparkles, Smile, ShieldCheck, Clock, RefreshCw, AlertTriangle } from 'lucide-react';

const MONTHS_LIST = [
  { value: '01', label: 'Januari' },
  { value: '02', label: 'Februari' },
  { value: '03', label: 'Maret' },
  { value: '04', label: 'April' },
  { value: '05', label: 'Mei' },
  { value: '06', label: 'Juni' },
  { value: '07', label: 'Juli' },
  { value: '08', label: 'Agustus' },
  { value: '09', label: 'September' },
  { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' },
  { value: '12', label: 'Desember' }
];

const YEARS_LIST = ['2026', '2027', '2028', '2029', '2030'];

export default function App() {
  // State variables loaded from storage
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [logbooks, setLogbooks] = useState<Logbook[]>([]);
  const [settings, setSettings] = useState<OfficeSettings>({} as OfficeSettings);

  // Auth & View state
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [absenModalType, setAbsenModalType] = useState<'masuk' | 'pulang' | null>(null);
  const [selectedLemburMonthNum, setSelectedLemburMonthNum] = useState('06');
  const [selectedLemburYear, setSelectedLemburYear] = useState('2026');
  const [resetKeyword, setResetKeyword] = useState('');
  const [isResetSuccess, setIsResetSuccess] = useState(false);

  // Initialize data on load
  useEffect(() => {
    const data = getStoredData();
    setEmployees(data.employees);
    setAttendance(data.attendance);
    setLeaves(data.leaves);
    setLogbooks(data.logbooks);
    setSettings(data.settings);
  }, []);

  // Sync today's attendance for the logged-in user
  const todayDateStr = "2026-06-24"; // System static mock date

  const todayAttendance = useMemo(() => {
    if (!currentUser) return null;
    return attendance.find(att => att.employeeId === currentUser.id && att.date === todayDateStr) || null;
  }, [attendance, currentUser]);

  // Auth actions
  const handleLoginSuccess = (user: Employee) => {
    setCurrentUser(user);
    setActiveView('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  // Employee actions
  const handleAddEmployee = (newEmp: Employee) => {
    const updated = [...employees, newEmp];
    setEmployees(updated);
    saveEmployees(updated);
  };

  const handleDeleteEmployee = (id: string) => {
    const updated = employees.filter(e => e.id !== id);
    setEmployees(updated);
    saveEmployees(updated);
  };

  const handleEditEmployee = (updatedEmp: Employee) => {
    const updated = employees.map(e => e.id === updatedEmp.id ? updatedEmp : e);
    setEmployees(updated);
    saveEmployees(updated);
    if (currentUser && currentUser.id === updatedEmp.id) {
      setCurrentUser(updatedEmp);
    }
  };

  // Leave / Cuti actions
  const handleAddLeave = (newLeave: LeaveRequest) => {
    const updated = [...leaves, newLeave];
    setLeaves(updated);
    saveLeaves(updated);
  };

  const handleApproveLeave = (id: string, approve: boolean) => {
    const updated = leaves.map(leave => {
      if (leave.id === id) {
        const status = approve ? 'Approved' : 'Rejected';
        
        // Deduct employee cuti quota if approved
        if (approve && leave.type === 'Cuti') {
          const start = new Date(leave.startDate);
          const end = new Date(leave.endDate);
          const diffTime = Math.abs(end.getTime() - start.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

          setEmployees(prevEmps => {
            const updatedEmps = prevEmps.map(emp => {
              if (emp.id === leave.employeeId) {
                return { ...emp, cutiQuota: Math.max(0, emp.cutiQuota - diffDays) };
              }
              return emp;
            });
            saveEmployees(updatedEmps);
            return updatedEmps;
          });
        }

        return { ...leave, status, approvedBy: currentUser?.name };
      }
      return leave;
    });

    setLeaves(updated);
    saveLeaves(updated);
  };

  // Logbook actions
  const handleSubmitLogbook = (content: string) => {
    if (!currentUser) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    
    const newLog: Logbook = {
      id: `log_${Date.now()}`,
      employeeId: currentUser.id,
      employeeName: currentUser.name,
      date: todayDateStr,
      time: timeStr,
      content,
      status: 'Pending'
    };

    const updated = [newLog, ...logbooks];
    setLogbooks(updated);
    saveLogbooks(updated);
  };

  const handleApproveLogbook = (id: string, approve: boolean) => {
    const updated = logbooks.map(log => {
      if (log.id === id) {
        const status = approve ? 'Approved' : 'Rejected';
        return { ...log, status, approvedBy: currentUser?.name };
      }
      return log;
    });
    setLogbooks(updated);
    saveLogbooks(updated);
  };

  // Attendance actions
  const handleAttendanceSubmit = (attendanceData: Partial<Attendance>) => {
    if (!currentUser) return;

    let updatedAttendance = [...attendance];
    
    if (absenModalType === 'masuk') {
      const newRecord: Attendance = {
        id: `att_${currentUser.id}_${attendanceData.date}`,
        employeeId: currentUser.id,
        employeeName: currentUser.name,
        date: attendanceData.date!,
        checkIn: attendanceData.checkIn!,
        checkOut: null,
        checkInPhoto: attendanceData.checkInPhoto!,
        checkOutPhoto: null,
        checkInLocation: attendanceData.checkInLocation!,
        checkOutLocation: null,
        checkInAddress: attendanceData.checkInAddress!,
        checkOutAddress: null,
        checkInStatus: attendanceData.checkInStatus!,
        checkOutStatus: null,
        logbookNotes: attendanceData.logbookNotes,
        shift: attendanceData.shift
      };
      updatedAttendance.push(newRecord);

      // If logbook note is added inside Check-In modal, push to Logbook lists
      if (attendanceData.logbookNotes) {
        handleSubmitLogbook(attendanceData.logbookNotes);
      }
    } else {
      // update checkOut data
      updatedAttendance = updatedAttendance.map(att => {
        if (att.employeeId === currentUser.id && att.date === attendanceData.date) {
          return {
            ...att,
            checkOut: attendanceData.checkOut!,
            checkOutPhoto: attendanceData.checkOutPhoto!,
            checkOutLocation: attendanceData.checkOutLocation!,
            checkOutAddress: attendanceData.checkOutAddress!,
            checkOutStatus: 'Tepat Waktu'
          };
        }
        return att;
      });
    }

    setAttendance(updatedAttendance);
    saveAttendance(updatedAttendance);
    setAbsenModalType(null);
    alert(`Berhasil melakukan Absen ${absenModalType === 'masuk' ? 'Masuk' : 'Pulang'}!`);
  };

  // Save Settings
  const handleSaveSettings = (updatedSettings: OfficeSettings) => {
    setSettings(updatedSettings);
    saveSettings(updatedSettings);
  };

  // Change Password
  const handleChangePassword = (old: string, updated: string): boolean => {
    if (!currentUser) return false;
    if (currentUser.password !== old) return false;

    const updatedEmployees = employees.map(emp => {
      if (emp.id === currentUser.id) {
        return { ...emp, password: updated };
      }
      return emp;
    });

    setEmployees(updatedEmployees);
    saveEmployees(updatedEmployees);
    setCurrentUser({ ...currentUser, password: updated });
    return true;
  };

  // Render evaluation & extra setting pages (Rapor, Perilaku, etc.)
  const renderEvaluationView = (title: string, icon: any, desc: string, points: string[]) => {
    const Icon = icon;
    return (
      <div className="bg-[#161618] p-6 sm:p-8 rounded-none border border-white/10 max-w-2xl mx-auto text-center space-y-5">
        <div className="w-16 h-16 bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 rounded-none flex items-center justify-center mx-auto">
          <Icon className="w-8 h-8" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-xl font-serif italic text-[#F4F4F5] tracking-wide">{title}</h3>
          <p className="text-xs text-[#71717A] font-sans uppercase tracking-[0.15em]">— Kementerian Keuangan Republik Indonesia —</p>
        </div>
        <p className="text-xs text-[#A1A1AA] max-w-md mx-auto leading-relaxed">
          {desc}
        </p>
        <div className="bg-[#0F0F11] border border-white/5 rounded-none p-5 text-left text-xs text-[#E4E4E7] space-y-2.5 max-w-md mx-auto">
          <p className="font-bold text-[#F4F4F5] flex items-center gap-1.5 uppercase tracking-wide text-[10px]">
            <Sparkles className="w-4 h-4 text-[#D4AF37] shrink-0" />
            Metrik Evaluasi Tim PPNPN:
          </p>
          {points.map((p, i) => (
            <li key={i} className="list-none flex items-start gap-2">
              <span className="w-4 h-4 rounded-none bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] font-bold flex items-center justify-center text-[9px] shrink-0 mt-0.5">{i+1}</span>
              <span className="text-[#A1A1AA]">{p}</span>
            </li>
          ))}
        </div>
      </div>
    );
  };

  // Main Switch View Router
  const renderMainContent = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <DashboardView
            user={currentUser!}
            employees={employees}
            attendance={attendance}
            leaves={leaves}
            logbooks={logbooks}
            settings={settings}
            onNavigateToView={setActiveView}
            onApproveLeave={handleApproveLeave}
            onSubmitLogbook={handleSubmitLogbook}
            onOpenAbsenModal={setAbsenModalType}
          />
        );
      case 'pegawai':
        return (
          <PegawaiView
            currentUser={currentUser!}
            employees={employees}
            onAddEmployee={handleAddEmployee}
            onDeleteEmployee={handleDeleteEmployee}
            onEditEmployee={handleEditEmployee}
          />
        );
      case 'approval-cuti':
        return (
          <ApprovalCutiView
            user={currentUser!}
            employees={employees}
            leaves={currentUser!.role === 'admin' ? leaves.filter(l => l.type === 'Cuti') : leaves}
            onAddLeave={handleAddLeave}
            onApproveLeave={handleApproveLeave}
            viewType="cuti"
          />
        );
      case 'verifikasi-approval':
        return (
          <VerifikasiApprovalView
            user={currentUser!}
            employees={employees}
            leaves={leaves}
            logbooks={logbooks}
            settings={settings}
            onApproveLeave={handleApproveLeave}
            onApproveLogbook={handleApproveLogbook}
          />
        );
      case 'monitoring-approval':
        return (
          <MonitoringHasilApprovalView
            employees={employees}
            leaves={leaves}
            logbooks={logbooks}
          />
        );
      case 'rekap-spkl':
        return (
          <RekapitulasiSpklView
            employees={employees}
            attendance={attendance}
            settings={settings}
          />
        );
      case 'kop-logo':
        return (
          <KopLogoSettingsView />
        );
      case 'approval-izin':
        return (
          <ApprovalCutiView
            user={currentUser!}
            employees={employees}
            leaves={currentUser!.role === 'admin' ? leaves.filter(l => l.type !== 'Cuti') : leaves}
            onAddLeave={handleAddLeave}
            onApproveLeave={handleApproveLeave}
            viewType="izin"
          />
        );
      case 'rekap-matrix':
        return (
          <RekapMatrixView
            employees={employees}
            attendance={attendance}
            leaves={leaves}
          />
        );
      case 'rekap-lembur':
        return (
          <RekapLemburView
            employees={employees}
            attendance={attendance}
            settings={settings}
          />
        );
      case 'pengajuan-lembur':
        return (
          <PengajuanLemburView
            user={currentUser!}
            settings={settings}
          />
        );
      case 'absen-lembur-hp':
        return (
          <AbsenLemburHPView
            user={currentUser!}
            settings={settings}
            attendance={attendance}
            onSaveAttendance={(updated) => {
              setAttendance(updated);
              saveAttendance(updated);
            }}
          />
        );
      case 'detail-absensi':
        return (
          <DetailAbsensiView
            user={currentUser!}
            employees={employees}
            attendance={attendance}
          />
        );
      case 'logbook':
        return (
          <LogbookView
            user={currentUser!}
            employees={employees}
            logbooks={logbooks}
            onSubmitLogbook={handleSubmitLogbook}
            onApproveLogbook={handleApproveLogbook}
          />
        );
      case 'settings':
        return (
          <SystemSettingsView
            user={currentUser!}
            settings={settings}
            onSaveSettings={handleSaveSettings}
            onChangePassword={handleChangePassword}
          />
        );
      case 'ganti-password':
        return (
          <SystemSettingsView
            user={currentUser!}
            settings={settings}
            onSaveSettings={handleSaveSettings}
            onChangePassword={handleChangePassword}
          />
        );
      case 'generate-cuti':
        return (
          <div className="bg-[#161618] p-8 rounded-none border border-white/10 max-w-md mx-auto text-center space-y-5">
            <ShieldCheck className="w-12 h-12 text-[#D4AF37] mx-auto" />
            <h3 className="text-base font-serif italic text-[#F4F4F5]">Generate Kuota Cuti Tahunan PPNPN</h3>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              Menghasilkan ulang/menambahkan kuota cuti tahunan default secara masif bagi seluruh PPNPN yang aktif di instansi untuk periode tahun 2026.
            </p>
            <button
              onClick={() => {
                const updated = employees.map(emp => emp.role === 'karyawan' ? { ...emp, cutiQuota: 12 } : emp);
                setEmployees(updated);
                saveEmployees(updated);
                alert("Kuota cuti semua karyawan berhasil di-reset menjadi 12 Hari!");
              }}
              className="w-full py-3 px-4 bg-[#D4AF37] hover:bg-[#c29e2f] text-[#0A0A0B] text-xs font-bold uppercase tracking-widest transition-colors rounded-sm"
            >
              Generate Kuota Cuti (12 Hari)
            </button>
          </div>
        );
      case 'reset-aplikasi':
        const handleResetNow = () => {
          if (resetKeyword.trim().toUpperCase() !== 'RESET') {
            return;
          }
          localStorage.clear();
          localStorage.setItem('app_is_reset', 'true');
          setIsResetSuccess(true);
        };

        return (
          <div className="max-w-xl mx-auto">
            {isResetSuccess ? (
              <div className="bg-white p-8 border border-emerald-200 rounded-2xl text-center space-y-6 shadow-md">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
                  <RefreshCw className="w-8 h-8 animate-spin" style={{ animationDuration: '3s' }} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-slate-800">Sistem Berhasil Direset!</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    Seluruh basis data, presensi kehadiran, logbook kegiatan, pengajuan cuti, dan konfigurasi instansi telah dikembalikan ke kondisi awal bawaan sistem.
                  </p>
                </div>
                <button
                  onClick={() => {
                    window.location.reload();
                  }}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all shadow-sm"
                >
                  Selesai & Muat Ulang Aplikasi
                </button>
              </div>
            ) : (
              <div className="bg-white p-8 border border-slate-200 rounded-2xl space-y-6 shadow-sm">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                  <div className="p-2 bg-rose-50 text-rose-500 rounded-xl border border-rose-100">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">Reset Data & Sistem Aplikasi</h3>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">Kembalikan seluruh data aplikasi PPNPN ke kondisi awal</p>
                  </div>
                </div>

                <div className="bg-rose-50/50 border border-rose-100 p-4 rounded-xl text-xs text-rose-700 space-y-2 font-medium">
                  <p className="font-bold">PERINGATAN KRITIKAL:</p>
                  <p className="leading-relaxed text-[11px]">
                    Tindakan ini tidak dapat dibatalkan. Seluruh data transaksi, histori swafoto presensi, pengajuan cuti/izin, rincian logbook kerja harian, sisa kuota cuti, serta daftar pegawai PPNPN tambahan yang telah Anda buat akan <strong>DIPOSONGKAN/DIHAPUS secara permanen</strong> dan dikembalikan ke data simulasi default bawaan instansi.
                  </p>
                </div>

                <div className="space-y-4 pt-2 text-xs">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Konfirmasi Keamanan</label>
                    <p className="text-[11px] text-slate-500 font-medium">Untuk menghindari ketidaksengajaan, silakan ketik kata kunci <strong className="text-rose-600">RESET</strong> di bawah ini:</p>
                    <input
                      type="text"
                      value={resetKeyword}
                      onChange={(e) => setResetKeyword(e.target.value)}
                      placeholder="Ketik RESET"
                      className="w-full text-xs px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 font-bold tracking-widest placeholder:font-normal placeholder:tracking-normal"
                    />
                  </div>

                  <button
                    onClick={handleResetNow}
                    disabled={resetKeyword.trim().toUpperCase() !== 'RESET'}
                    className={`w-full py-3.5 px-4 font-bold rounded-lg uppercase tracking-wider text-[11px] transition-all flex items-center justify-center gap-2 shadow-sm ${
                      resetKeyword.trim().toUpperCase() === 'RESET'
                        ? 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <RefreshCw className="w-4 h-4 text-white" />
                    <span>Lakukan Reset Data Pabrik</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      case 'perilaku':
        return renderEvaluationView(
          "Evaluasi Perilaku Pegawai PPNPN",
          TrendingUp,
          "Melacak kedisiplinan, keramahan, inisiatif, kerja sama tim, integritas, dan profesionalitas dari semua staf PPNPN selama jam pelayanan kantor.",
          ["Kedisiplinan Kehadiran & Apel Pagi", "Keramahan & Sikap Pelayanan di Meja Depan", "Inisiatif Kerja & Kecepatan Respons", "Kerja Sama Antar Unit Staf"]
        );
      case 'survei':
        return renderEvaluationView(
          "Survei Kepuasan Pelayanan PPNPN",
          ThumbsUp,
          "Penilaian kepuasan masyarakat dan para pegawai internal kantor atas performa serta kualitas bantuan teknis dari tim PPNPN.",
          ["Keramahan & Sopan Santun", "Ketepatan Waktu Penyelesaian Tugas", "Kualitas Hasil Pekerjaan Fisik/Digital"]
        );
      case 'rekomendasi':
        return (
          <RekomendasiKIView
            user={currentUser!}
            employees={employees}
          />
        );
      case 'rapor':
        return renderEvaluationView(
          "Rapor Kinerja Komulatif PPNPN",
          Heart,
          "Skor evaluasi performa kerja PPNPN gabungan yang digunakan sebagai berkas rujukan untuk perpanjangan kontrak kerja tahun berikutnya.",
          ["Nilai Rata-Rata Rapor Kinerja: 72.42", "Status Kinerja Tim: Sangat Memuaskan", "Aspek Utama Evaluasi: Absensi + Logbook + Sikap"]
        );
      default:
        return <div className="p-6 text-[#71717A]">View under development</div>;
    }
  };

  // If user is not logged in, show the login screen
  if (!currentUser) {
    return (
      <LoginScreen
        onLoginSuccess={handleLoginSuccess}
        employees={employees}
        onAddEmployee={handleAddEmployee}
      />
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 overflow-hidden font-sans">
      
      {/* 1. SIDEBAR NAVIGATION */}
      <Sidebar
        user={currentUser}
        activeView={activeView}
        onViewChange={setActiveView}
        onLogout={handleLogout}
      />

      {/* 2. MAIN APP CONTENT CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50">
        
        {/* TOP BAR / HEADER */}
        <Header
          user={currentUser}
          todayAttendance={todayAttendance}
          settings={settings}
          onOpenAbsenModal={setAbsenModalType}
        />

        {/* COMPONENT ROUTER PANEL */}
        <main className="flex-1 overflow-y-auto p-8 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            {renderMainContent()}
          </div>
        </main>
      </div>

      {/* 3. CAPTURE PRESENCE MODAL */}
      {absenModalType && (
        <AbsenModal
          user={currentUser}
          type={absenModalType}
          settings={settings}
          onClose={() => setAbsenModalType(null)}
          onSubmit={handleAttendanceSubmit}
          todayAttendance={todayAttendance}
        />
      )}
    </div>
  );
}
