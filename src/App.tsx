import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  getStoredData, 
  saveEmployees, 
  saveAttendance, 
  saveLeaves, 
  saveLogbooks, 
  saveSettings, 
  safeSetLocalStorageItem, 
  isNonPpnpn, 
  NON_PPNPN_IDS,
  markEmployeeAsDeleted,
  isEmployeeDeleted,
  unmarkEmployeeAsDeleted,
  mergeDeletedEmployeeIds,
  DEFAULT_EMPLOYEES
} from './utils/storage';
import { Employee, Attendance, LeaveRequest, Logbook, OfficeSettings } from './types';
import { 
  checkSupabaseConnection,
  forceSupabaseOnline,
  getEmployeesFromSupabase,
  getAttendanceFromSupabase,
  getLeavesFromSupabase,
  getLogbooksFromSupabase,
  getSettingsFromSupabase,
  getOvertimeFromSupabase,
  upsertEmployeeToSupabase,
  upsertAttendanceToSupabase,
  upsertLeaveToSupabase,
  upsertLogbookToSupabase,
  upsertSettingsToSupabase,
  upsertOvertimeToSupabase,
  subscribeToAttendanceFromSupabase,
  subscribeToEmployeesFromSupabase,
  getDeletedEmployeesFromSupabase,
  unmarkEmployeeAsDeletedFromSupabase,
  subscribeToDeletedEmployeesFromSupabase,
  deleteEmployeeFromSupabase,
  deleteLeaveFromSupabase,
  deleteAttendanceFromSupabase,
  clearTransactionsFromSupabase,
  resetAllEmployeeQuotasInSupabase,
  purgeNonPpnpnFromSupabase,
  isSupabaseQuotaExceeded,
  getLastSupabaseError,
  isQuotaError,
  SQL_CREATION_SCRIPT
} from './utils/supabase';
// Components
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import MobileBottomNav from './components/MobileBottomNav';
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
import BackupRestoreView from './components/BackupRestoreView';
import ResetDataView from './components/ResetDataView';

// Extra Evaluation Views to match the requested image perfectly
import { Award, Heart, ThumbsUp, TrendingUp, Sparkles, Smile, ShieldCheck, Clock, RefreshCw, AlertTriangle, Users, PlusSquare, X, ExternalLink, CheckCircle } from 'lucide-react';

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
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return true;
  });
  const [absenModalType, setAbsenModalType] = useState<'masuk' | 'pulang' | null>(null);
  const [selectedLemburMonthNum, setSelectedLemburMonthNum] = useState('06');
  const [selectedLemburYear, setSelectedLemburYear] = useState('2026');
  const [resetKeyword, setResetKeyword] = useState('');
  const [isResetSuccess, setIsResetSuccess] = useState(false);
  const [searchQuotaQuery, setSearchQuotaQuery] = useState('');
  const [employeeQuotas, setEmployeeQuotas] = useState<{ [empId: string]: number }>({});
  const [quotaSuccessMap, setQuotaSuccessMap] = useState<{ [empId: string]: boolean }>({});

  const [supabaseConnected, setSupabaseConnected] = useState(false);
  const [isSyncingSupabase, setIsSyncingSupabase] = useState(true);
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(isSupabaseQuotaExceeded());
  const [isDataFromCache, setIsDataFromCache] = useState(false);
  const [listenerKey, setListenerKey] = useState(0);
  const [dismissQuotaBanner, setDismissQuotaBanner] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; title?: string } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info', title?: string) => {
    setToast({ message, type, title });
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Initialize data on load and keep synchronized in realtime with Cloud Firestore
  const loadAllData = useCallback(async () => {
    // 1. Immediately load local storage to ensure instant offline-first rendering
    const data = getStoredData();
    setEmployees(data.employees);
    setAttendance(data.attendance);
    setLeaves(data.leaves);
    setLogbooks(data.logbooks);
    setSettings(data.settings);

    // Clean up legacy global quota key
    try {
      localStorage.removeItem('firebase_firestore_quota_exceeded_date');
    } catch {}

    // If quota is already marked exceeded, avoid immediate outbound network reads
    if (isSupabaseQuotaExceeded()) {
      setIsQuotaExceeded(true);
      setSupabaseConnected(false);
      setIsSyncingSupabase(false);
      return;
    }

    setIsSyncingSupabase(true);
    try {
      // Background purge for known invalid IDs only (no bulk collection scans)
      purgeNonPpnpnFromSupabase().catch(() => {});

      // Sync non-subscribed modules: Leaves, Logbooks, Settings, Overtime
      // Note: Employees, Deleted Records, and Attendance are handled entirely by live onSnapshot listeners
      const rawDbLeaves = await getLeavesFromSupabase();
      if (rawDbLeaves && rawDbLeaves.length > 0) {
        const dbLeaves = rawDbLeaves.filter(l => !isNonPpnpn(l.employeeId, l.employeeName));
        setLeaves(dbLeaves);
        safeSetLocalStorageItem('ppnpn_leaves', dbLeaves.filter(l => l.type !== 'Lembur'));
      }

      const rawDbLogs = await getLogbooksFromSupabase();
      if (rawDbLogs && rawDbLogs.length > 0) {
        const dbLogs = rawDbLogs.filter(l => !isNonPpnpn(l.employeeId, l.employeeName));
        setLogbooks(dbLogs);
        safeSetLocalStorageItem('ppnpn_logbooks', dbLogs);
      }

      const dbSettings = await getSettingsFromSupabase();
      if (dbSettings) {
        setSettings(dbSettings);
        safeSetLocalStorageItem('ppnpn_settings', dbSettings);
      }

      const dbOvertime = await getOvertimeFromSupabase();
      if (dbOvertime && dbOvertime.length > 0) {
        safeSetLocalStorageItem('overtime_attendance_records', dbOvertime);
      }
    } catch (err) {
      console.warn("Notice during background data load:", err);
      if (isQuotaError(err)) {
        setIsQuotaExceeded(true);
        setSupabaseConnected(false);
      }
    } finally {
      setIsSyncingSupabase(false);
      if (isSupabaseQuotaExceeded()) {
        setIsQuotaExceeded(true);
        setSupabaseConnected(false);
      }
      window.dispatchEvent(new Event('storage'));
    }
  }, []);

  const handleManualReconnect = useCallback(async () => {
    setIsSyncingSupabase(true);
    showToast("Sedang mencoba menghubungkan kembali ke Firebase Firestore...", "info", "Koneksi Database");
    try {
      const isConnected = await forceSupabaseOnline();
      setSupabaseConnected(isConnected);
      setIsQuotaExceeded(!isConnected);

      if (isConnected) {
        showToast("Berhasil terhubung ke database cloud Firebase Firestore! Status kini ONLINE.", "success", "Database Online");
        setListenerKey(k => k + 1); // Triggers clean re-subscription
        loadAllData().catch(err => console.warn("Background loadAllData notice:", err));
      } else {
        const err = getLastSupabaseError();
        showToast(`Status Database: Offline. ${err || 'Batas kuota masih tercapai'}. Tetap berjalan dengan data lokal.`, "error", "Database Offline");
      }
    } catch (e: any) {
      showToast(`Gagal menghubungkan ke database: ${e?.message || e}`, "error", "Koneksi Gagal");
    } finally {
      setIsSyncingSupabase(false);
    }
  }, [loadAllData, showToast]);

  useEffect(() => {
    loadAllData();

    // 1. Subscribe to deleted records (single source of truth for deleted employee IDs)
    const unsubDel = subscribeToDeletedEmployeesFromSupabase((deletedIds, isFromCache) => {
      if (isFromCache !== undefined) setIsDataFromCache(isFromCache);
      setSupabaseConnected(!isSupabaseQuotaExceeded());
      if (deletedIds && deletedIds.length > 0) {
        mergeDeletedEmployeeIds(deletedIds);
      }
      // Immediately filter current employees state without re-fetching any collection
      setEmployees(prev => {
        const filtered = prev.filter(e => !isNonPpnpn(e.id, e.name) && !isEmployeeDeleted(e.id, e.name));
        safeSetLocalStorageItem('ppnpn_employees', filtered);
        return filtered;
      });
    }, (err) => {
      if (isQuotaError(err)) {
        setIsQuotaExceeded(true);
        setSupabaseConnected(false);
      }
    });

    // 2. Subscribe to employees (single source of truth for employee data)
    const unsubEmp = subscribeToEmployeesFromSupabase((dbEmps, isFromCache) => {
      if (isFromCache !== undefined) setIsDataFromCache(isFromCache);
      setSupabaseConnected(!isSupabaseQuotaExceeded());
      setIsQuotaExceeded(false);

      if (dbEmps) {
        const cleanDbEmps = dbEmps.filter(e => !isNonPpnpn(e.id, e.name) && !isEmployeeDeleted(e.id, e.name));
        setEmployees(prev => {
          const empMap = new Map<string, Employee>();
          
          // Preserve current in-memory / local employees
          prev.forEach(emp => {
            const id = (emp.id || '').trim().toLowerCase();
            if (id && !isNonPpnpn(emp.id, emp.name) && !isEmployeeDeleted(emp.id, emp.name)) {
              empMap.set(id, emp);
            }
          });

          // Overlay with Firestore records intelligently
          cleanDbEmps.forEach(emp => {
            const id = (emp.id || '').trim().toLowerCase();
            if (id && !isNonPpnpn(emp.id, emp.name) && !isEmployeeDeleted(emp.id, emp.name)) {
              const existing = empMap.get(id);
              if (!existing) {
                empMap.set(id, emp);
              } else {
                const existingTime = existing.updatedAt ? new Date(existing.updatedAt).getTime() : 0;
                const remoteTime = emp.updatedAt ? new Date(emp.updatedAt).getTime() : 0;
                if (remoteTime >= existingTime) {
                  empMap.set(id, { ...existing, ...emp });
                } else {
                  empMap.set(id, { ...emp, ...existing });
                }
              }
            }
          });

          // Default fallback only if completely empty on fresh install
          const isReset = typeof localStorage !== 'undefined' && localStorage.getItem('app_is_reset') === 'true';
          if (!isReset && empMap.size === 0) {
            DEFAULT_EMPLOYEES.forEach(def => {
              const id = (def.id || '').trim().toLowerCase();
              if (id && !isNonPpnpn(def.id, def.name) && !isEmployeeDeleted(def.id, def.name) && !empMap.has(id)) {
                empMap.set(id, def);
              }
            });
          }

          const merged = Array.from(empMap.values());
          safeSetLocalStorageItem('ppnpn_employees', merged);
          return merged;
        });
      }
    }, (err) => {
      if (isQuotaError(err)) {
        setIsQuotaExceeded(true);
        setSupabaseConnected(false);
      }
    });

    // 3. Subscribe to attendance (single source of truth for live attendance records)
    const unsubAtt = subscribeToAttendanceFromSupabase((dbAtt, isFromCache) => {
      if (isFromCache !== undefined) setIsDataFromCache(isFromCache);
      setSupabaseConnected(!isSupabaseQuotaExceeded());
      if (dbAtt && dbAtt.length > 0) {
        setAttendance(prev => {
          const map = new Map<string, Attendance>();
          const getKey = (att: Attendance) => `${(att.employeeId || att.employeeName || 'emp').toLowerCase()}_${att.date}`;
          prev.filter(a => !isNonPpnpn(a.employeeId, a.employeeName)).forEach(a => map.set(getKey(a), a));
          dbAtt.filter(a => !isNonPpnpn(a.employeeId, a.employeeName)).forEach(a => {
            const k = getKey(a);
            const ex = map.get(k);
            map.set(k, ex ? { ...ex, ...a } : a);
          });
          const merged = Array.from(map.values()).filter(a => !isNonPpnpn(a.employeeId, a.employeeName));
          safeSetLocalStorageItem('ppnpn_attendance', merged);
          return merged;
        });
      }
    }, (err) => {
      if (isQuotaError(err)) {
        setIsQuotaExceeded(true);
        setSupabaseConnected(false);
      }
    });

    return () => {
      try {
        if (typeof unsubAtt === 'function') unsubAtt();
        if (typeof unsubEmp === 'function') unsubEmp();
        if (typeof unsubDel === 'function') unsubDel();
      } catch {}
    };
  }, [loadAllData, listenerKey]);

  // Synchronize currentUser with the latest employee record from employees list
  useEffect(() => {
    if (currentUser) {
      const freshEmp = employees.find(e => e.id === currentUser.id);
      if (freshEmp && (freshEmp.cutiQuota !== currentUser.cutiQuota || freshEmp.name !== currentUser.name || freshEmp.position !== currentUser.position)) {
        setCurrentUser(prev => prev ? { ...prev, cutiQuota: freshEmp.cutiQuota, name: freshEmp.name, position: freshEmp.position } : null);
      }
    }
  }, [employees]);

  const handleSeedSupabase = async () => {
    const isConnected = await checkSupabaseConnection();
    if (!isConnected) {
      showToast("Gagal terhubung ke Firebase! Pastikan konfigurasi Firestore sudah tepat.", "error", "Koneksi Gagal");
      return;
    }

    setIsSyncingSupabase(true);
    const errors: string[] = [];
    let successCount = 0;
    let totalCount = 0;

    try {
      // 1. Settings
      totalCount++;
      try {
        await upsertSettingsToSupabase(settings, true);
        successCount++;
      } catch (err: any) {
        errors.push(`Settings: ${err.message || JSON.stringify(err)}`);
      }

      // 2. Employees
      for (const emp of employees) {
        totalCount++;
        try {
          await upsertEmployeeToSupabase(emp, true);
          successCount++;
        } catch (err: any) {
          errors.push(`Karyawan (${emp.name}): ${err.message || JSON.stringify(err)}`);
        }
      }

      // 3. Attendance
      for (const att of attendance) {
        totalCount++;
        try {
          await upsertAttendanceToSupabase(att, true);
          successCount++;
        } catch (err: any) {
          errors.push(`Presensi (${att.employeeName} - ${att.date}): ${err.message || JSON.stringify(err)}`);
        }
      }

      // 4. Leaves
      for (const leave of leaves) {
        totalCount++;
        try {
          await upsertLeaveToSupabase(leave, true);
          successCount++;
        } catch (err: any) {
          errors.push(`Cuti (${leave.employeeName} - ${leave.startDate}): ${err.message || JSON.stringify(err)}`);
        }
      }

      // 5. Logbooks
      for (const log of logbooks) {
        totalCount++;
        try {
          await upsertLogbookToSupabase(log, true);
          successCount++;
        } catch (err: any) {
          errors.push(`Logbook (${log.employeeName} - ${log.date}): ${err.message || JSON.stringify(err)}`);
        }
      }

      // 6. Overtime records
      const localOvertime = localStorage.getItem('overtime_attendance_records');
      if (localOvertime) {
        try {
          const parsed = JSON.parse(localOvertime);
          for (const rec of parsed) {
            totalCount++;
            try {
              await upsertOvertimeToSupabase(rec, true);
              successCount++;
            } catch (err: any) {
              errors.push(`Lembur (${rec.employeeName} - ${rec.date}): ${err.message || JSON.stringify(err)}`);
            }
          }
        } catch (e: any) {
          console.error("Failed to parse local overtime records:", e);
        }
      }

      if (errors.length === 0) {
        showToast(`Inisialisasi & Migrasi data berhasil! Seluruh ${successCount} data berhasil dipindahkan ke Firebase Firestore.`, "success", "Migrasi Sukses");
      } else {
        showToast(`Inisialisasi & Migrasi selesai: ${successCount} berhasil, ${errors.length} gagal.`, "error", "Migrasi Selesai Sebagian");
      }
    } catch (err: any) {
      console.error(err);
      showToast(`Terjadi kesalahan sistem saat memigrasikan data: ${err.message || err}`, "error", "Kesalahan Sistem");
    } finally {
      setIsSyncingSupabase(false);
    }
  };

  const handleResetAttendance = async (id: string) => {
    // 1. Remove from state
    const updated = attendance.filter(att => att.id !== id);
    setAttendance(updated);
    saveAttendance(updated);

    // 2. Delete from Supabase
    if (supabaseConnected) {
      try {
        await deleteAttendanceFromSupabase(id, true);
      } catch (err: any) {
        console.error("Failed to delete attendance from Supabase:", err);
      }
    }
  };

  // Sync today's attendance for the logged-in user
  const todayDateStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const todayAttendance = useMemo(() => {
    if (!currentUser) return null;

    const isMatch = (att: Attendance) => 
      att.employeeId?.toLowerCase() === currentUser.id.toLowerCase() ||
      (att.employeeName && currentUser.name && att.employeeName.toLowerCase().includes(currentUser.name.toLowerCase()));

    const standard = attendance.find(att => isMatch(att) && att.date === todayDateStr) || null;
    if (standard) return standard;

    // Check if user has an open check-in record (checkIn exists, checkOut is null) from yesterday / recent shift
    const openRecord = attendance.find(att => isMatch(att) && att.checkIn && !att.checkOut);
    if (openRecord) {
      return openRecord;
    }

    // Check if user has any record today
    const anyToday = attendance.find(att => isMatch(att) && att.date === todayDateStr);
    if (anyToday) {
      return anyToday;
    }

    // Check if user has any recent record overall
    const latest = attendance.filter(isMatch).sort((a, b) => b.date.localeCompare(a.date))[0];
    if (latest && (latest.date === todayDateStr || !latest.checkOut)) {
      return latest;
    }

    return null;
  }, [attendance, currentUser, todayDateStr]);

  // Auth & View actions
  const handleViewChange = (view: string) => {
    setActiveView(view);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const handleLoginSuccess = (user: Employee) => {
    setCurrentUser(user);
    setActiveView('dashboard');
    if (typeof window !== 'undefined') {
      setSidebarOpen(window.innerWidth >= 1024);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  // Employee actions
  const handleAddEmployee = async (newEmp: Employee) => {
    const cleanId = (newEmp.id || '').trim().toLowerCase();
    const nowIso = new Date().toISOString();
    // Unmark in case ID was previously in deleted list
    unmarkEmployeeAsDeleted(cleanId, newEmp.name);
    unmarkEmployeeAsDeletedFromSupabase(cleanId, newEmp.name).catch(() => {});

    const normalizedEmp: Employee = {
      ...newEmp,
      id: cleanId,
      name: newEmp.name.trim(),
      email: `${cleanId}@ppnpn.com`,
      role: newEmp.role,
      position: newEmp.position.trim(),
      password: newEmp.password,
      cutiQuota: typeof newEmp.cutiQuota === 'number' && !isNaN(newEmp.cutiQuota) ? newEmp.cutiQuota : 12,
      shift: newEmp.role === 'security' ? 'Fleksibel' : undefined,
      status: newEmp.status || 'aktif',
      updatedAt: nowIso
    };

    setEmployees(prev => {
      const empMap = new Map<string, Employee>();
      prev.forEach(e => {
        const id = (e.id || '').trim().toLowerCase();
        if (id && !isNonPpnpn(e.id, e.name) && !isEmployeeDeleted(e.id, e.name)) {
          empMap.set(id, e);
        }
      });
      empMap.set(cleanId, normalizedEmp);
      const updated = Array.from(empMap.values());
      saveEmployees(updated);
      safeSetLocalStorageItem('ppnpn_employees', updated);
      return updated;
    });

    window.dispatchEvent(new Event('storage'));

    // Persist to Firebase Firestore with fast non-blocking race so UI never hangs
    const dbPromise = upsertEmployeeToSupabase(normalizedEmp, false).catch(err => {
      console.warn("Gagal menyimpan pegawai baru ke Firebase:", err);
      return false;
    });

    await Promise.race([
      dbPromise,
      new Promise<boolean>(resolve => setTimeout(() => resolve(true), 800))
    ]);

    showToast(`Data pegawai "${normalizedEmp.name}" berhasil disimpan ke database!`, "success", "Tersimpan");
  };

  const handleDeleteEmployee = async (id: string, name?: string) => {
    const cleanId = (id || '').trim();
    const cleanIdLower = cleanId.toLowerCase();
    
    // Find target employee to get name
    const targetEmp = employees.find(e => 
      (e.id || '').trim().toLowerCase() === cleanIdLower ||
      (cleanId && (e.id || '').trim() === cleanId) ||
      (name && e.name && e.name.trim().toLowerCase() === name.trim().toLowerCase())
    );
    const empName = name || targetEmp?.name || '';

    // 1. Mark as permanently deleted in storage
    markEmployeeAsDeleted(cleanId, empName);
    if (cleanIdLower !== cleanId) {
      markEmployeeAsDeleted(cleanIdLower, empName);
    }
    if (targetEmp?.id) {
      markEmployeeAsDeleted(targetEmp.id, targetEmp.name);
    }

    // 2. Remove immediately from React state and localStorage
    setEmployees(prev => {
      const updated = prev.filter(e => {
        const matchId = (e.id || '').trim().toLowerCase() === cleanIdLower || (cleanId && (e.id || '').trim() === cleanId);
        const matchName = empName && e.name && e.name.trim().toLowerCase() === empName.trim().toLowerCase();
        return !matchId && !matchName && !isEmployeeDeleted(e.id, e.name);
      });
      saveEmployees(updated);
      safeSetLocalStorageItem('ppnpn_employees', updated);
      return updated;
    });

    window.dispatchEvent(new Event('storage'));

    // 3. Delete from Firebase Firestore completely
    deleteEmployeeFromSupabase(cleanId, empName).catch(err => {
      console.warn("Gagal menghapus pegawai dari Firebase:", err);
    });

    showToast(`Data pegawai ${empName || id} berhasil dihapus permanen.`, "success", "Pegawai Dihapus");
  };

  const handleEditEmployee = async (updatedEmp: Employee, oldId?: string) => {
    const cleanOldId = (oldId || updatedEmp.id || '').trim().toLowerCase();
    const cleanNewId = (updatedEmp.id || '').trim().toLowerCase();
    const nowIso = new Date().toISOString();

    // Unmark cleanNewId in case it was in deleted list
    unmarkEmployeeAsDeleted(cleanNewId, updatedEmp.name);
    unmarkEmployeeAsDeletedFromSupabase(cleanNewId, updatedEmp.name).catch(() => {});

    const normalizedEmp: Employee = {
      ...updatedEmp,
      id: cleanNewId,
      name: updatedEmp.name.trim(),
      email: `${cleanNewId}@ppnpn.com`,
      position: updatedEmp.position.trim(),
      password: updatedEmp.password,
      role: updatedEmp.role,
      cutiQuota: typeof updatedEmp.cutiQuota === 'number' && !isNaN(updatedEmp.cutiQuota) ? updatedEmp.cutiQuota : 12,
      shift: updatedEmp.role === 'security' ? 'Fleksibel' : undefined,
      status: updatedEmp.status || 'aktif',
      updatedAt: nowIso
    };

    // 1. Update state and local storage immediately in-place
    setEmployees(prev => {
      const exists = prev.some(e => (e.id || '').trim().toLowerCase() === cleanOldId);
      let updated: Employee[];
      if (exists) {
        updated = prev
          .filter(e => {
            const id = (e.id || '').trim().toLowerCase();
            return cleanOldId === cleanNewId || id !== cleanNewId;
          })
          .map(e => (e.id || '').trim().toLowerCase() === cleanOldId ? normalizedEmp : e);
      } else {
        updated = [...prev.filter(e => (e.id || '').trim().toLowerCase() !== cleanNewId), normalizedEmp];
      }
      saveEmployees(updated);
      safeSetLocalStorageItem('ppnpn_employees', updated);
      return updated;
    });

    // Update currentUser if the current logged-in employee was edited
    if (currentUser && (currentUser.id?.toLowerCase() === cleanOldId || currentUser.id?.toLowerCase() === cleanNewId)) {
      const updatedUser = { ...currentUser, ...normalizedEmp };
      setCurrentUser(updatedUser);
      safeSetLocalStorageItem('ppnpn_user', updatedUser);
    }

    window.dispatchEvent(new Event('storage'));

    // 2. Persist to Firebase Firestore with fast non-blocking race so UI responds immediately
    const dbPromise = upsertEmployeeToSupabase(normalizedEmp, false).catch(err => {
      console.warn("Notice: background employee sync to Firestore:", err);
      return false;
    });

    await Promise.race([
      dbPromise,
      new Promise<boolean>(resolve => setTimeout(() => resolve(true), 800))
    ]);

    showToast(`Perubahan data pegawai "${normalizedEmp.name}" berhasil disimpan ke database.`, "success", "Database Diperbarui");

    // 3. If ID changed (username renamed)
    if (cleanOldId && cleanOldId !== cleanNewId) {
      deleteEmployeeFromSupabase(cleanOldId).catch(err => {
        console.warn("Notice: background delete old ID from Firebase:", err);
      });

      // Update Attendance records with oldId
      const updatedAttendance = attendance.map(att => {
        if (att.employeeId?.toLowerCase() === cleanOldId) {
          const newAtt = {
            ...att,
            employeeId: normalizedEmp.id,
            employeeName: normalizedEmp.name,
            id: att.id.startsWith(`att_${cleanOldId}_`) ? `att_${normalizedEmp.id}_${att.date}` : att.id
          };
          upsertAttendanceToSupabase(newAtt).catch(() => {});
          return newAtt;
        }
        return att;
      });
      setAttendance(updatedAttendance);
      saveAttendance(updatedAttendance);

      // Update Leaves records with oldId
      const updatedLeaves = leaves.map(leave => {
        if (leave.employeeId?.toLowerCase() === cleanOldId) {
          const newLeave = {
            ...leave,
            employeeId: normalizedEmp.id,
            employeeName: normalizedEmp.name
          };
          upsertLeaveToSupabase(newLeave).catch(() => {});
          return newLeave;
        }
        return leave;
      });
      setLeaves(updatedLeaves);
      saveLeaves(updatedLeaves);

      // Update Logbooks records with oldId
      const updatedLogbooks = logbooks.map(log => {
        if (log.employeeId?.toLowerCase() === cleanOldId) {
          const newLog = {
            ...log,
            employeeId: normalizedEmp.id,
            employeeName: normalizedEmp.name
          };
          upsertLogbookToSupabase(newLog).catch(() => {});
          return newLog;
        }
        return log;
      });
      setLogbooks(updatedLogbooks);
      saveLogbooks(updatedLogbooks);

      // Overtime requests key renaming in localStorage
      const oldRequestsKey = `overtime_requests_${cleanOldId}`;
      const newRequestsKey = `overtime_requests_${normalizedEmp.id}`;
      const oldRequestsData = localStorage.getItem(oldRequestsKey);
      if (oldRequestsData) {
        safeSetLocalStorageItem(newRequestsKey, oldRequestsData);
        localStorage.removeItem(oldRequestsKey);
      }

      // Overtime Attendance Records in localStorage
      const storedOvertime = localStorage.getItem('overtime_attendance_records');
      if (storedOvertime) {
        try {
          const records = JSON.parse(storedOvertime);
          const updatedRecords = records.map((rec: any) => {
            if (rec.employeeId?.toLowerCase() === cleanOldId) {
              return {
                ...rec,
                employeeId: normalizedEmp.id,
                employeeName: normalizedEmp.name,
                id: rec.id === `ov_att_${cleanOldId}_${rec.date}` ? `ov_att_${normalizedEmp.id}_${rec.date}` : rec.id
              };
            }
            return rec;
          });
          safeSetLocalStorageItem('overtime_attendance_records', updatedRecords);
        } catch (e) {
          console.error("Error updating overtime records", e);
        }
      }
    }

    // Always dispatch storage event so views re-render smoothly
    window.dispatchEvent(new Event('storage'));

    // 4. Update currentUser if logged in user was modified
    if (currentUser && (currentUser.id.toLowerCase() === cleanOldId || currentUser.id.toLowerCase() === cleanNewId)) {
      setCurrentUser(normalizedEmp);
    }
  };

  // Leave / Cuti actions
  const handleAddLeave = (newLeave: LeaveRequest) => {
    const updated = [...leaves, newLeave];
    setLeaves(updated);
    saveLeaves(updated);
    upsertLeaveToSupabase(newLeave);
  };

  const handleApproveLeave = (id: string, approve: boolean) => {
    const updated = leaves.map(leave => {
      if (leave.id === id) {
        const status = approve ? 'Approved' : 'Rejected';
        
        // Deduct employee cuti quota if approved
        if (approve && leave.type === 'Cuti') {
          const diffDays = leave.workDays || 1;

          setEmployees(prevEmps => {
            const updatedEmps = prevEmps.map(emp => {
              if (emp.id === leave.employeeId) {
                const newQuota = Math.max(0, emp.cutiQuota - diffDays);
                if (currentUser && currentUser.id === emp.id) {
                  setCurrentUser(prevUser => prevUser ? { ...prevUser, cutiQuota: newQuota } : null);
                }
                return { ...emp, cutiQuota: newQuota };
              }
              return emp;
            });
            saveEmployees(updatedEmps);
            return updatedEmps;
          });
        }

        return { 
          ...leave, 
          status, 
          approvedBy: currentUser?.name || 'Ahmad Nauval', 
          approvedDate: new Date().toISOString().split('T')[0] 
        };
      }
      return leave;
    });

    setLeaves(updated);
    saveLeaves(updated);
    const approvedItem = updated.find(l => l.id === id);
    if (approvedItem) {
      upsertLeaveToSupabase(approvedItem);
    }
  };

  const handleEditLeave = (updatedLeave: LeaveRequest) => {
    const originalLeave = leaves.find(l => l.id === updatedLeave.id);
    let finalLeave = { ...updatedLeave };

    if (originalLeave) {
      // Revert status to Pending for any edits
      finalLeave.status = 'Pending';
      delete finalLeave.approvedBy;
      delete finalLeave.approvedDate;

      // Refund quota if it was previously Approved
      if (originalLeave.status === 'Approved' && originalLeave.type === 'Cuti') {
        const diffDaysOrig = originalLeave.workDays || 1;

        setEmployees(prevEmps => {
          const updatedEmps = prevEmps.map(emp => {
            if (emp.id === originalLeave.employeeId) {
              const newQuota = emp.cutiQuota + diffDaysOrig;
              if (currentUser && currentUser.id === emp.id) {
                setCurrentUser(prevUser => prevUser ? { ...prevUser, cutiQuota: newQuota } : null);
              }
              return { ...emp, cutiQuota: newQuota };
            }
            return emp;
          });
          saveEmployees(updatedEmps);
          return updatedEmps;
        });
      }
    }

    const updated = leaves.map(leave => leave.id === finalLeave.id ? finalLeave : leave);
    setLeaves(updated);
    saveLeaves(updated);
    upsertLeaveToSupabase(finalLeave);
  };

  const handleDeleteLeave = async (id: string) => {
    const originalLeave = leaves.find(l => l.id === id);
    if (!originalLeave) return;

    // Refund quota if it was previously Approved and was a Cuti
    if (originalLeave.status === 'Approved' && originalLeave.type === 'Cuti') {
      const diffDaysOrig = originalLeave.workDays || 1;
      setEmployees(prevEmps => {
        const updatedEmps = prevEmps.map(emp => {
          if (emp.id === originalLeave.employeeId) {
            const newQuota = emp.cutiQuota + diffDaysOrig;
            if (currentUser && currentUser.id === emp.id) {
              setCurrentUser(prevUser => prevUser ? { ...prevUser, cutiQuota: newQuota } : null);
            }
            return { ...emp, cutiQuota: newQuota };
          }
          return emp;
        });
        saveEmployees(updatedEmps);
        return updatedEmps;
      });
    }

    const updated = leaves.filter(l => l.id !== id);
    setLeaves(updated);
    saveLeaves(updated);
    
    const isConnected = await checkSupabaseConnection();
    if (isConnected) {
      await deleteLeaveFromSupabase(id);
    }
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
    upsertLogbookToSupabase(newLog);
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
    const approvedLog = updated.find(l => l.id === id);
    if (approvedLog) {
      upsertLogbookToSupabase(approvedLog);
    }
  };

  // Attendance actions
  const handleAttendanceSubmit = async (attendanceData: Partial<Attendance>) => {
    if (!currentUser) return;

    let updatedAttendance = [...attendance];
    const isMasuk = attendanceData.checkIn !== undefined && attendanceData.checkIn !== null;
    const targetDate = attendanceData.date || todayDateStr;

    const isUserMatch = (att: Attendance) => 
      att.employeeId?.toLowerCase() === currentUser.id.toLowerCase() ||
      (att.employeeName && currentUser.name && att.employeeName.toLowerCase().includes(currentUser.name.toLowerCase()));

    let recordToSave: Attendance | null = null;

    if (isMasuk) {
      const existingIdx = updatedAttendance.findIndex(att => isUserMatch(att) && att.date === targetDate);

      if (existingIdx !== -1) {
        recordToSave = {
          ...updatedAttendance[existingIdx],
          checkIn: attendanceData.checkIn!,
          checkInPhoto: attendanceData.checkInPhoto!,
          checkInLocation: attendanceData.checkInLocation!,
          checkInAddress: attendanceData.checkInAddress!,
          checkInStatus: attendanceData.checkInStatus!,
          logbookNotes: attendanceData.logbookNotes || updatedAttendance[existingIdx].logbookNotes,
          shift: attendanceData.shift || updatedAttendance[existingIdx].shift
        };
        updatedAttendance[existingIdx] = recordToSave;
      } else {
        recordToSave = {
          id: `att_${currentUser.id}_${targetDate}`,
          employeeId: currentUser.id,
          employeeName: currentUser.name,
          date: targetDate,
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
        updatedAttendance.push(recordToSave);
      }

      // If logbook note is added inside Check-In modal, push to Logbook lists
      if (attendanceData.logbookNotes) {
        handleSubmitLogbook(attendanceData.logbookNotes);
      }
    } else {
      // update checkOut data
      // 1. Try to match by date specified in attendanceData.date
      let matchedIdx = updatedAttendance.findIndex(att => isUserMatch(att) && att.date === targetDate);

      // 2. If not matched, try to match an OPEN checkIn for currentUser (e.g. overnight/security shift or previous day)
      if (matchedIdx === -1) {
        matchedIdx = updatedAttendance.findIndex(att => isUserMatch(att) && att.checkIn && !att.checkOut);
      }

      // 3. If still not matched, try to match any record for currentUser on today's date
      if (matchedIdx === -1) {
        matchedIdx = updatedAttendance.findIndex(att => isUserMatch(att) && att.date === todayDateStr);
      }

      if (matchedIdx !== -1) {
        recordToSave = {
          ...updatedAttendance[matchedIdx],
          checkOut: attendanceData.checkOut!,
          checkOutPhoto: attendanceData.checkOutPhoto!,
          checkOutLocation: attendanceData.checkOutLocation!,
          checkOutAddress: attendanceData.checkOutAddress!,
          checkOutStatus: 'Tepat Waktu' as const
        };
        updatedAttendance[matchedIdx] = recordToSave;
      } else {
        // 4. NO EXISTING RECORD FOUND at all! Create a new record for today so the clock-out is GUARANTEED to be recorded!
        recordToSave = {
          id: `att_${currentUser.id}_${targetDate}`,
          employeeId: currentUser.id,
          employeeName: currentUser.name,
          date: targetDate,
          checkIn: null,
          checkOut: attendanceData.checkOut!,
          checkInPhoto: null,
          checkOutPhoto: attendanceData.checkOutPhoto!,
          checkInLocation: null,
          checkOutLocation: attendanceData.checkOutLocation!,
          checkInAddress: null,
          checkOutAddress: attendanceData.checkOutAddress!,
          checkInStatus: null,
          checkOutStatus: 'Tepat Waktu' as const,
          shift: attendanceData.shift
        };
        updatedAttendance.push(recordToSave);
      }
    }

    setAttendance(updatedAttendance);
    saveAttendance(updatedAttendance);

    if (recordToSave) {
      await upsertAttendanceToSupabase(recordToSave);
    }

    setAbsenModalType(null);
    showToast(`Berhasil melakukan Absen ${isMasuk ? 'Masuk' : 'Pulang'}!`, "success", "Absensi Berhasil");
  };

  // Save Settings
  const handleSaveSettings = (updatedSettings: OfficeSettings) => {
    setSettings(updatedSettings);
    saveSettings(updatedSettings);
    upsertSettingsToSupabase(updatedSettings);
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

  // Handle Full System Restore
  const handleRestoreData = async (backupPackage: any, mode: 'overwrite' | 'merge') => {
    if (!backupPackage) return;

    let targetEmployees: Employee[] = [];
    let targetAttendance: Attendance[] = [];
    let targetLeaves: LeaveRequest[] = [];
    let targetLogbooks: Logbook[] = [];
    let targetSettings: OfficeSettings = settings;

    if (mode === 'overwrite') {
      targetEmployees = Array.isArray(backupPackage.employees) ? backupPackage.employees : employees;
      targetAttendance = Array.isArray(backupPackage.attendance) ? backupPackage.attendance : attendance;
      targetLeaves = Array.isArray(backupPackage.leaves) ? backupPackage.leaves : leaves;
      targetLogbooks = Array.isArray(backupPackage.logbooks) ? backupPackage.logbooks : logbooks;
      if (backupPackage.settings && typeof backupPackage.settings === 'object') {
        targetSettings = backupPackage.settings;
      }
    } else {
      // MERGE MODE
      const empMap = new Map<string, Employee>();
      employees.forEach(e => empMap.set(e.id, e));
      if (Array.isArray(backupPackage.employees)) {
        backupPackage.employees.forEach((e: Employee) => empMap.set(e.id, e));
      }
      targetEmployees = Array.from(empMap.values());

      const attMap = new Map<string, Attendance>();
      attendance.forEach(a => attMap.set(a.id, a));
      if (Array.isArray(backupPackage.attendance)) {
        backupPackage.attendance.forEach((a: Attendance) => attMap.set(a.id, a));
      }
      targetAttendance = Array.from(attMap.values());

      const leaveMap = new Map<string, LeaveRequest>();
      leaves.forEach(l => leaveMap.set(l.id, l));
      if (Array.isArray(backupPackage.leaves)) {
        backupPackage.leaves.forEach((l: LeaveRequest) => leaveMap.set(l.id, l));
      }
      targetLeaves = Array.from(leaveMap.values());

      const logMap = new Map<string, Logbook>();
      logbooks.forEach(l => logMap.set(l.id, l));
      if (Array.isArray(backupPackage.logbooks)) {
        backupPackage.logbooks.forEach((l: Logbook) => logMap.set(l.id, l));
      }
      targetLogbooks = Array.from(logMap.values());

      if (backupPackage.settings && typeof backupPackage.settings === 'object') {
        targetSettings = { ...settings, ...backupPackage.settings };
      }
    }

    // 1. Update React state
    setEmployees(targetEmployees);
    setAttendance(targetAttendance);
    setLeaves(targetLeaves);
    setLogbooks(targetLogbooks);
    setSettings(targetSettings);

    // 2. Save to localStorage
    saveEmployees(targetEmployees);
    saveAttendance(targetAttendance);
    saveLeaves(targetLeaves);
    saveLogbooks(targetLogbooks);
    saveSettings(targetSettings);

    if (backupPackage.kopSettings) {
      safeSetLocalStorageItem('kop_settings', backupPackage.kopSettings);
      window.dispatchEvent(new Event('kop_settings_changed'));
    }

    if (Array.isArray(backupPackage.overtimeAttendanceRecords)) {
      if (mode === 'overwrite') {
        safeSetLocalStorageItem('overtime_attendance_records', backupPackage.overtimeAttendanceRecords);
      } else {
        let existingOt: any[] = [];
        try {
          const stored = localStorage.getItem('overtime_attendance_records');
          if (stored) existingOt = JSON.parse(stored);
        } catch (e) {}
        const otMap = new Map<string, any>();
        existingOt.forEach(o => otMap.set(o.id, o));
        backupPackage.overtimeAttendanceRecords.forEach((o: any) => otMap.set(o.id, o));
        safeSetLocalStorageItem('overtime_attendance_records', Array.from(otMap.values()));
      }
    }

    if (backupPackage.overtimeRequests && typeof backupPackage.overtimeRequests === 'object') {
      Object.keys(backupPackage.overtimeRequests).forEach(key => {
        safeSetLocalStorageItem(key, backupPackage.overtimeRequests[key]);
      });
    }

    if (Array.isArray(backupPackage.kepatuhanInternalFindings)) {
      safeSetLocalStorageItem('kepatuhan_internal_findings', backupPackage.kepatuhanInternalFindings);
    }

    localStorage.removeItem('app_is_reset');

    // 3. Sync with Firebase Cloud in parallel batches if connected
    if (supabaseConnected) {
      showToast("Sedang menyelaraskan data hasil restore ke cloud Firebase...", "info", "Sinkronisasi Cloud");
      try {
        async function runInBatches<T>(items: T[], fn: (item: T) => Promise<any>, batchSize = 6) {
          for (let i = 0; i < items.length; i += batchSize) {
            const batch = items.slice(i, i + batchSize);
            await Promise.allSettled(batch.map(fn));
          }
        }

        await runInBatches(targetEmployees, upsertEmployeeToSupabase);
        await runInBatches(targetAttendance, upsertAttendanceToSupabase);
        await runInBatches(targetLeaves, upsertLeaveToSupabase);
        await runInBatches(targetLogbooks, upsertLogbookToSupabase);
        if (targetSettings) {
          await upsertSettingsToSupabase(targetSettings);
        }
        showToast("Restorasi data aplikasi & sinkronisasi cloud Firebase selesai!", "success", "Restorasi Berhasil");
      } catch (err) {
        console.warn("Firebase restore sync warning", err);
      }
    } else {
      showToast("Restorasi data lokal berhasil diterapkan!", "success", "Restorasi Berhasil");
    }

    window.dispatchEvent(new Event('storage'));
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
            todayAttendance={todayAttendance}
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
            leaves={currentUser!.role === 'admin' ? leaves.filter(l => l.type === 'Cuti') : leaves.filter(l => l.type === 'Cuti')}
            onAddLeave={handleAddLeave}
            onApproveLeave={handleApproveLeave}
            onEditLeave={handleEditLeave}
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
            leaves={leaves}
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
            leaves={currentUser!.role === 'admin' ? leaves.filter(l => l.type === 'Izin' || l.type === 'Sakit') : leaves.filter(l => l.type === 'Izin' || l.type === 'Sakit')}
            onAddLeave={handleAddLeave}
            onApproveLeave={handleApproveLeave}
            onEditLeave={handleEditLeave}
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
            leaves={leaves}
          />
        );
      case 'pengajuan-lembur':
        return (
          <PengajuanLemburView
            user={currentUser!}
            settings={settings}
            leaves={leaves}
            onAddLeave={handleAddLeave}
            onDeleteLeave={handleDeleteLeave}
          />
        );
      case 'absen-lembur-hp':
        return (
          <AbsenLemburHPView
            user={currentUser!}
            settings={settings}
            attendance={attendance}
            onSaveAttendance={async (updated) => {
              setAttendance(updated);
              saveAttendance(updated);
              for (const att of updated) {
                await upsertAttendanceToSupabase(att);
              }
            }}
          />
        );
      case 'detail-absensi':
        return (
          <DetailAbsensiView
            user={currentUser!}
            employees={employees}
            attendance={attendance}
            onResetAttendance={handleResetAttendance}
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
            supabaseConnected={supabaseConnected}
            onSeedSupabase={handleSeedSupabase}
            isSyncingSupabase={isSyncingSupabase}
          />
        );
      case 'ganti-password':
        return (
          <SystemSettingsView
            user={currentUser!}
            settings={settings}
            onSaveSettings={handleSaveSettings}
            onChangePassword={handleChangePassword}
            supabaseConnected={supabaseConnected}
            onSeedSupabase={handleSeedSupabase}
            isSyncingSupabase={isSyncingSupabase}
          />
        );
      case 'generate-cuti':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h1 className="text-xl font-bold text-slate-800 tracking-tight">SETTING KUOTA CUTI PPNPN</h1>
                <p className="text-xs text-slate-500">Kelola sisa kuota cuti masing-masing PPNPN dan generate kuota secara massal.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Massive Generate */}
              <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm space-y-4 h-fit">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm">Generate Kuota Massal</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Menghasilkan ulang/menambahkan kuota cuti tahunan default secara masif bagi seluruh PPNPN yang aktif untuk periode tahun berjalan.
                </p>
                <div className="space-y-2.5 pt-2">
                  <button
                    onClick={() => {
                      if (window.confirm("Apakah Anda yakin ingin mengatur ulang kuota cuti SEMUA pegawai menjadi 12 hari?")) {
                        const updated = employees.map(emp => emp.role !== 'admin' ? { ...emp, cutiQuota: 12 } : emp);
                        setEmployees(updated);
                        saveEmployees(updated);
                        updated.forEach(empItem => upsertEmployeeToSupabase(empItem));
                        showToast("Kuota cuti semua karyawan berhasil di-reset menjadi 12 Hari!", "success", "Reset Kuota Selesai");
                      }
                    }}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider transition-colors rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <PlusSquare className="w-4 h-4" />
                    <span>Generate Kuota (12 Hari)</span>
                  </button>
                </div>
              </div>

              {/* Right/Middle Column: Individual Employee Settings */}
              <div className="lg:col-span-2 bg-white p-5 border border-slate-200 rounded-xl shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                      <Users className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-slate-800 text-sm">Kuota Cuti Masing-masing PPNPN</h3>
                  </div>
                  
                  {/* Search input */}
                  <input
                    type="text"
                    placeholder="Cari PPNPN..."
                    value={searchQuotaQuery}
                    onChange={(e) => setSearchQuotaQuery(e.target.value)}
                    className="text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 w-full sm:w-48 bg-slate-50"
                  />
                </div>

                <div className="overflow-x-auto border border-slate-100 rounded-lg">
                  <table className="w-full text-xs text-left text-slate-600 border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 text-slate-700 border-b border-slate-100">
                        <th className="p-3 font-bold">Nama Pegawai / ID</th>
                        <th className="p-3 font-bold">Jabatan</th>
                        <th className="p-3 font-bold text-center w-36">Sisa Kuota Cuti</th>
                        <th className="p-3 font-bold text-center w-28">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {employees
                        .filter(emp => emp.role !== 'admin' && (searchQuotaQuery ? emp.name.toLowerCase().includes(searchQuotaQuery.toLowerCase()) : true))
                        .map(emp => (
                          <tr key={emp.id} className="hover:bg-slate-50/40 transition-colors">
                            <td className="p-3 font-bold text-slate-800">
                              <div>{emp.name}</div>
                              <div className="text-[9px] text-slate-400 font-mono mt-0.5">{emp.id}</div>
                            </td>
                            <td className="p-3 text-slate-500 font-medium">{emp.position || '-'}</td>
                            <td className="p-3">
                              <div className="flex items-center justify-center gap-1.5">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={employeeQuotas[emp.id] !== undefined ? employeeQuotas[emp.id] : emp.cutiQuota}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value, 10);
                                    setEmployeeQuotas({
                                      ...employeeQuotas,
                                      [emp.id]: isNaN(val) ? 0 : val
                                    });
                                  }}
                                  className="w-14 text-center text-xs py-1 px-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-bold bg-slate-50"
                                />
                                <span className="text-slate-400 text-[10px] font-semibold">Hari</span>
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => {
                                  const targetQuota = employeeQuotas[emp.id] !== undefined ? employeeQuotas[emp.id] : emp.cutiQuota;
                                  const updated = employees.map(e => e.id === emp.id ? { ...e, cutiQuota: targetQuota } : e);
                                  setEmployees(updated);
                                  saveEmployees(updated);
                                  const targetEmp = updated.find(e => e.id === emp.id);
                                  if (targetEmp) upsertEmployeeToSupabase(targetEmp);
                                  
                                  // Show temporary success feedback
                                  setQuotaSuccessMap(prev => ({
                                    ...prev,
                                    [emp.id]: true
                                  }));
                                  setTimeout(() => {
                                    setQuotaSuccessMap(prev => ({ ...prev, [emp.id]: false }));
                                  }, 2000);
                                }}
                                className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider rounded-lg transition-all shadow-sm cursor-pointer ${
                                  quotaSuccessMap[emp.id]
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white scale-95'
                                    : 'bg-amber-500 hover:bg-amber-600 text-white'
                                }`}
                              >
                                {quotaSuccessMap[emp.id] ? 'Berhasil' : 'Simpan'}
                              </button>
                            </td>
                          </tr>
                        ))
                      }
                      {employees.filter(emp => emp.role === 'karyawan' && (searchQuotaQuery ? emp.name.toLowerCase().includes(searchQuotaQuery.toLowerCase()) : true)).length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-5 text-center text-slate-400 font-semibold italic">Tidak ada pegawai PPNPN ditemukan</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );
      case 'backup-restore':
        return (
          <BackupRestoreView
            user={currentUser!}
            employees={employees}
            attendance={attendance}
            leaves={leaves}
            logbooks={logbooks}
            settings={settings}
            supabaseConnected={supabaseConnected}
            isSyncingSupabase={isSyncingSupabase}
            onRestoreData={handleRestoreData}
          />
        );
      case 'reset-aplikasi':
        return (
          <ResetDataView
            employees={employees}
            attendance={attendance}
            leaves={leaves}
            logbooks={logbooks}
            setEmployees={setEmployees}
            setAttendance={setAttendance}
            setLeaves={setLeaves}
            setLogbooks={setLogbooks}
            supabaseConnected={supabaseConnected}
          />
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
    <div className="flex h-screen bg-slate-50 text-slate-800 overflow-hidden font-sans relative">
      
      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/55 z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 1. SIDEBAR NAVIGATION */}
      <Sidebar
        user={currentUser}
        activeView={activeView}
        onViewChange={handleViewChange}
        onLogout={handleLogout}
        supabaseConnected={supabaseConnected}
        isSyncing={isSyncingSupabase}
        onReconnect={handleManualReconnect}
        isOpen={sidebarOpen}
        onCloseMobile={() => setSidebarOpen(false)}
      />

      {/* 2. MAIN APP CONTENT CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50">
        
        {/* TOP BAR / HEADER */}
        <Header
          user={currentUser}
          todayAttendance={todayAttendance}
          settings={settings}
          onOpenAbsenModal={setAbsenModalType}
          onToggleSidebar={() => setSidebarOpen(prev => !prev)}
        />

        {/* Quota Exceeded Notification Banner */}
        {isQuotaExceeded && !dismissQuotaBanner && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-3 sm:px-5 py-2.5 flex items-center justify-between text-xs text-amber-900 gap-3 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <div className="flex flex-wrap items-center gap-x-1.5 text-[11px] sm:text-xs">
                <span className="font-bold text-amber-900">Mode Offline / Cache Aktif:</span>
                <span className="text-amber-800">
                  Batas kuota harian Firebase Firestore Free Tier (50.000 read/hari) telah tercapai. Data disajikan dari cache lokal ({isDataFromCache ? 'Cache Lokal' : 'Tersimpan'}). Seluruh data tetap aman.
                </span>
                <button
                  onClick={handleManualReconnect}
                  disabled={isSyncingSupabase}
                  className="inline-flex items-center gap-1 font-semibold text-amber-950 bg-amber-200 hover:bg-amber-300 px-2.5 py-0.5 rounded text-[11px] ml-1 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncingSupabase ? 'animate-spin' : ''}`} />
                  Coba Hubungkan Ulang
                </button>
                <a
                  href="https://console.firebase.google.com/project/sapariau-e99eb/firestore/databases/ai-studio-aplikasiabsensip-8568cdb0-c19d-48d6-bd52-75ab38d147d5/data?openUpgradeDialog=true"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-bold text-amber-900 underline hover:text-amber-700 ml-1"
                >
                  Upgrade Billing <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
            <button
              onClick={() => setDismissQuotaBanner(true)}
              className="p-1 hover:bg-amber-200/50 rounded text-amber-800 shrink-0 cursor-pointer"
              title="Tutup pemberitahuan"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* COMPONENT ROUTER PANEL */}
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-5 md:p-6 lg:p-8 pb-24 lg:pb-8 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            {renderMainContent()}
          </div>
        </main>
      </div>

      {/* 3. MOBILE BOTTOM NAVIGATION (Handphone / Touch viewports only) */}
      <MobileBottomNav
        user={currentUser}
        activeView={activeView}
        onViewChange={handleViewChange}
        onOpenAbsenModal={setAbsenModalType}
        onOpenSidebar={() => setSidebarOpen(true)}
      />

      {/* 4. CAPTURE PRESENCE MODAL */}
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

      {/* 5. FLOATING SYSTEM NOTIFICATION TOAST */}
      {toast && (
        <div className="fixed top-5 right-5 z-[9999] max-w-sm w-full bg-slate-900/95 backdrop-blur border border-slate-700 text-white rounded-xl shadow-2xl p-4 flex items-start gap-3 transition-all animate-in fade-in slide-in-from-top-2">
          {toast.type === 'success' && (
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle className="w-5 h-5" />
            </div>
          )}
          {toast.type === 'error' && (
            <div className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
          )}
          {toast.type === 'info' && (
            <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <RefreshCw className="w-5 h-5 animate-spin" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            {toast.title && <h4 className="text-xs font-bold text-slate-100">{toast.title}</h4>}
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{toast.message}</p>
          </div>
          <button 
            type="button"
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            title="Tutup pemberitahuan"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
