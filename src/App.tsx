import { useState, useEffect, useMemo } from 'react';
import { getStoredData, saveEmployees, saveAttendance, saveLeaves, saveLogbooks, saveSettings } from './utils/storage';
import { Employee, Attendance, LeaveRequest, Logbook, OfficeSettings } from './types';
import { 
  checkSupabaseConnection,
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
  deleteEmployeeFromSupabase,
  deleteLeaveFromSupabase,
  deleteAttendanceFromSupabase,
  clearTransactionsFromSupabase,
  resetAllEmployeeQuotasInSupabase,
  SQL_CREATION_SCRIPT
} from './utils/supabase';
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
import { Award, Heart, ThumbsUp, TrendingUp, Sparkles, Smile, ShieldCheck, Clock, RefreshCw, AlertTriangle, Users, PlusSquare } from 'lucide-react';

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
  const [isSyncingSupabase, setIsSyncingSupabase] = useState(false);

  // Initialize data on load and keep synchronized in realtime with Supabase Cloud
  useEffect(() => {
    const loadAllData = async () => {
      // 1. Immediately load local storage to ensure instant offline-first rendering
      const data = getStoredData();
      setEmployees(data.employees);
      setAttendance(data.attendance);
      setLeaves(data.leaves);
      setLogbooks(data.logbooks);
      setSettings(data.settings);

      // 2. Validate connection to Supabase and perform data synchronization
      const isConnected = await checkSupabaseConnection();
      setSupabaseConnected(isConnected);

      if (isConnected) {
        setIsSyncingSupabase(true);
        try {
          // Sync Employees
          const dbEmps = await getEmployeesFromSupabase();
          if (dbEmps && dbEmps.length > 0) {
            setEmployees(dbEmps);
            localStorage.setItem('ppnpn_employees', JSON.stringify(dbEmps));
          } else if (dbEmps && dbEmps.length === 0 && data.employees.length > 0) {
            for (const emp of data.employees) {
              await upsertEmployeeToSupabase(emp);
            }
          }

          // Sync Regular Attendance
          const dbAtt = await getAttendanceFromSupabase();
          if (dbAtt && dbAtt.length > 0) {
            setAttendance(dbAtt);
            localStorage.setItem('ppnpn_attendance', JSON.stringify(dbAtt));
          } else if (dbAtt && dbAtt.length === 0 && data.attendance.length > 0) {
            for (const att of data.attendance) {
              await upsertAttendanceToSupabase(att);
            }
          }

          // Sync Leaves
          const dbLeaves = await getLeavesFromSupabase();
          if (dbLeaves && dbLeaves.length > 0) {
            setLeaves(dbLeaves);
            const filteredLeaves = dbLeaves.filter(l => l.type !== 'Lembur');
            localStorage.setItem('ppnpn_leaves', JSON.stringify(filteredLeaves));
          } else if (dbLeaves && dbLeaves.length === 0 && data.leaves.length > 0) {
            for (const leave of data.leaves) {
              await upsertLeaveToSupabase(leave);
            }
          }

          // Sync Logbooks
          const dbLogs = await getLogbooksFromSupabase();
          if (dbLogs && dbLogs.length > 0) {
            setLogbooks(dbLogs);
            localStorage.setItem('ppnpn_logbooks', JSON.stringify(dbLogs));
          } else if (dbLogs && dbLogs.length === 0 && data.logbooks.length > 0) {
            for (const log of data.logbooks) {
              await upsertLogbookToSupabase(log);
            }
          }

          // Sync Office Settings
          const dbSettings = await getSettingsFromSupabase();
          if (dbSettings) {
            setSettings(dbSettings);
            localStorage.setItem('ppnpn_settings', JSON.stringify(dbSettings));
          } else {
            await upsertSettingsToSupabase(data.settings);
          }

          // Sync Overtime Attendance Records
          const dbOvertime = await getOvertimeFromSupabase();
          if (dbOvertime && dbOvertime.length > 0) {
            localStorage.setItem('overtime_attendance_records', JSON.stringify(dbOvertime));
          } else {
            const localOvertime = localStorage.getItem('overtime_attendance_records');
            if (localOvertime) {
              try {
                const parsed = JSON.parse(localOvertime);
                for (const rec of parsed) {
                  await upsertOvertimeToSupabase(rec);
                }
              } catch (e) {
                console.error("Failed to parse/seed local overtime records:", e);
              }
            }
          }
        } catch (err) {
          console.error("Error during startup Supabase synchronization:", err);
        } finally {
          setIsSyncingSupabase(false);
          window.dispatchEvent(new Event('storage'));
        }
      }
    };

    loadAllData();

    // Setup periodic polling sync every 12 seconds
    const interval = setInterval(async () => {
      const isConnected = await checkSupabaseConnection();
      setSupabaseConnected(isConnected);
      if (isConnected) {
        try {
          const dbEmps = await getEmployeesFromSupabase();
          if (dbEmps && dbEmps.length > 0) {
            setEmployees(dbEmps);
            localStorage.setItem('ppnpn_employees', JSON.stringify(dbEmps));
          }

          const dbAtt = await getAttendanceFromSupabase();
          if (dbAtt && dbAtt.length > 0) {
            setAttendance(dbAtt);
            localStorage.setItem('ppnpn_attendance', JSON.stringify(dbAtt));
          }

          const dbLeaves = await getLeavesFromSupabase();
          if (dbLeaves && dbLeaves.length > 0) {
            setLeaves(dbLeaves);
            const filteredLeaves = dbLeaves.filter(l => l.type !== 'Lembur');
            localStorage.setItem('ppnpn_leaves', JSON.stringify(filteredLeaves));
          }

          const dbLogs = await getLogbooksFromSupabase();
          if (dbLogs && dbLogs.length > 0) {
            setLogbooks(dbLogs);
            localStorage.setItem('ppnpn_logbooks', JSON.stringify(dbLogs));
          }

          const dbOvertime = await getOvertimeFromSupabase();
          if (dbOvertime && dbOvertime.length > 0) {
            localStorage.setItem('overtime_attendance_records', JSON.stringify(dbOvertime));
          }

          window.dispatchEvent(new Event('storage'));
        } catch (err) {
          console.error("Error in background Supabase polling sync:", err);
        }
      }
    }, 12000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // Synchronize currentUser with the latest employee record from employees list
  useEffect(() => {
    if (currentUser) {
      const freshEmp = employees.find(e => e.id === currentUser.id);
      if (freshEmp && (freshEmp.cutiQuota !== currentUser.cutiQuota || freshEmp.name !== currentUser.name || freshEmp.position !== currentUser.position)) {
        setCurrentUser(prev => prev ? { ...prev, cutiQuota: freshEmp.cutiQuota, name: freshEmp.name, position: freshEmp.position } : null);
      }
    }
  }, [employees]);

  // One-time auto-reset of ZSA ZSA ANINDYA PUTERI tanggal 1 Juli 2026 as explicitly requested
  useEffect(() => {
    const performReset = async () => {
      const match = attendance.find(
        att => (att.employeeName?.toUpperCase().includes("ZSA ZSA") || att.employeeId === 'zaza') && 
        att.date === '2026-07-01'
      );
      if (match) {
        console.log("Found matching attendance record for ZSA ZSA on 2026-07-01. Resetting...");
        const updated = attendance.filter(att => att.id !== match.id);
        setAttendance(updated);
        saveAttendance(updated);
        
        const isConnected = await checkSupabaseConnection();
        if (isConnected) {
          try {
            await deleteAttendanceFromSupabase(match.id);
            console.log("Successfully deleted ZSA ZSA attendance record on 2026-07-01 from Supabase.");
          } catch (e) {
            console.error("Failed to delete ZSA ZSA from Supabase:", e);
          }
        }
      }
    };
    if (attendance.length > 0) {
      performReset();
    }
  }, [attendance]);

  const handleSeedSupabase = async () => {
    const isConnected = await checkSupabaseConnection();
    if (!isConnected) {
      alert("Gagal terhubung ke Supabase! Pastikan Anda sudah membuat tabel database menggunakan SQL Script di SQL Editor Supabase.");
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
        alert(`Inisialisasi & Migrasi data berhasil dilakukan!\n\nSeluruh ${successCount} data berhasil dipindahkan ke Supabase Cloud.`);
      } else {
        const errorSummary = errors.slice(0, 5).join('\n');
        const remainingCount = errors.length > 5 ? `\n...dan ${errors.length - 5} kesalahan lainnya` : '';
        alert(
          `Inisialisasi & Migrasi selesai sebagian.\n\n` +
          `Berhasil memindahkan: ${successCount} dari ${totalCount} data.\n` +
          `Gagal memindahkan: ${errors.length} data.\n\n` +
          `Daftar kesalahan:\n${errorSummary}${remainingCount}\n\n` +
          `Saran:\n1. Pastikan Anda sudah menjalankan seluruh SQL Schema Script di SQL Editor Supabase.\n` +
          `2. Periksa apakah Row Level Security (RLS) di Supabase sudah dimatikan untuk semua tabel.`
        );
      }
    } catch (err: any) {
      console.error(err);
      alert(`Terjadi kesalahan sistem saat memigrasikan data ke Supabase: ${err.message || err}`);
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
    const standard = attendance.find(att => att.employeeId === currentUser.id && att.date === todayDateStr) || null;

    const isSecurity = !!(currentUser.position?.toLowerCase()?.includes('satpam') || 
                       currentUser.position?.toLowerCase()?.includes('security') || 
                       currentUser.position?.toLowerCase()?.includes('keamanan') || 
                       currentUser.position?.toLowerCase()?.includes('penjaga'));

    if (isSecurity && !standard) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yestYear = yesterday.getFullYear();
      const yestMonth = String(yesterday.getMonth() + 1).padStart(2, '0');
      const yestDay = String(yesterday.getDate()).padStart(2, '0');
      const yestDateStr = `${yestYear}-${yestMonth}-${yestDay}`;

      const yesterdayRecord = attendance.find(att => att.employeeId === currentUser.id && att.date === yestDateStr);
      if (yesterdayRecord && yesterdayRecord.checkIn && !yesterdayRecord.checkOut) {
        return yesterdayRecord;
      }
    }
    return standard;
  }, [attendance, currentUser, todayDateStr]);

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
    upsertEmployeeToSupabase(newEmp);
  };

  const handleDeleteEmployee = (id: string) => {
    const updated = employees.filter(e => e.id !== id);
    setEmployees(updated);
    saveEmployees(updated);
    deleteEmployeeFromSupabase(id);
  };

  const handleEditEmployee = (updatedEmp: Employee, oldId?: string) => {
    const targetId = oldId || updatedEmp.id;
    const updated = employees.map(e => e.id === targetId ? updatedEmp : e);
    setEmployees(updated);
    saveEmployees(updated);
    upsertEmployeeToSupabase(updatedEmp);
    if (oldId && oldId.toLowerCase() !== updatedEmp.id.toLowerCase()) {
      deleteEmployeeFromSupabase(oldId);
      // 1. Update Attendance
      const updatedAttendance = attendance.map(att => {
        if (att.employeeId === oldId) {
          return {
            ...att,
            employeeId: updatedEmp.id,
            employeeName: updatedEmp.name,
            id: att.id === `att_${oldId}_${att.date}` ? `att_${updatedEmp.id}_${att.date}` : att.id
          };
        }
        return att;
      });
      setAttendance(updatedAttendance);
      saveAttendance(updatedAttendance);

      // 2. Update Leaves
      const updatedLeaves = leaves.map(leave => {
        if (leave.employeeId === oldId) {
          return {
            ...leave,
            employeeId: updatedEmp.id,
            employeeName: updatedEmp.name
          };
        }
        return leave;
      });
      setLeaves(updatedLeaves);
      saveLeaves(updatedLeaves);

      // 3. Update Logbooks
      const updatedLogbooks = logbooks.map(log => {
        if (log.employeeId === oldId) {
          return {
            ...log,
            employeeId: updatedEmp.id,
            employeeName: updatedEmp.name
          };
        }
        return log;
      });
      setLogbooks(updatedLogbooks);
      saveLogbooks(updatedLogbooks);

      // 4. Overtime requests key renaming in localStorage
      const oldRequestsKey = `overtime_requests_${oldId}`;
      const newRequestsKey = `overtime_requests_${updatedEmp.id}`;
      const oldRequestsData = localStorage.getItem(oldRequestsKey);
      if (oldRequestsData) {
        localStorage.setItem(newRequestsKey, oldRequestsData);
        localStorage.removeItem(oldRequestsKey);
      }

      // 5. Overtime Attendance Records in localStorage
      const storedOvertime = localStorage.getItem('overtime_attendance_records');
      if (storedOvertime) {
        try {
          const records = JSON.parse(storedOvertime);
          const updatedRecords = records.map((rec: any) => {
            if (rec.employeeId === oldId) {
              return {
                ...rec,
                employeeId: updatedEmp.id,
                employeeName: updatedEmp.name,
                id: rec.id === `ov_att_${oldId}_${rec.date}` ? `ov_att_${updatedEmp.id}_${rec.date}` : rec.id
              };
            }
            return rec;
          });
          localStorage.setItem('overtime_attendance_records', JSON.stringify(updatedRecords));
        } catch (e) {
          console.error("Error updating overtime records", e);
        }
      }

      // Dispatch storage event to keep views updated
      window.dispatchEvent(new Event('storage'));
    }

    if (currentUser && (currentUser.id === targetId || currentUser.id === updatedEmp.id)) {
      setCurrentUser(updatedEmp);
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
  const handleAttendanceSubmit = (attendanceData: Partial<Attendance>) => {
    if (!currentUser) return;

    let updatedAttendance = [...attendance];
    const isMasuk = attendanceData.checkIn !== undefined && attendanceData.checkIn !== null;
    
    if (isMasuk) {
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
      upsertAttendanceToSupabase(newRecord);

      // If logbook note is added inside Check-In modal, push to Logbook lists
      if (attendanceData.logbookNotes) {
        handleSubmitLogbook(attendanceData.logbookNotes);
      }
    } else {
      // update checkOut data
      let finalRec: Attendance | null = null;
      updatedAttendance = updatedAttendance.map(att => {
        if (att.employeeId === currentUser.id && att.date === attendanceData.date) {
          const rec = {
            ...att,
            checkOut: attendanceData.checkOut!,
            checkOutPhoto: attendanceData.checkOutPhoto!,
            checkOutLocation: attendanceData.checkOutLocation!,
            checkOutAddress: attendanceData.checkOutAddress!,
            checkOutStatus: 'Tepat Waktu' as const
          };
          finalRec = rec;
          return rec;
        }
        return att;
      });
      if (finalRec) {
        upsertAttendanceToSupabase(finalRec);
      }
    }

    setAttendance(updatedAttendance);
    saveAttendance(updatedAttendance);
    setAbsenModalType(null);
    alert(`Berhasil melakukan Absen ${isMasuk ? 'Masuk' : 'Pulang'}!`);
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
                        const updated = employees.map(emp => emp.role === 'karyawan' ? { ...emp, cutiQuota: 12 } : emp);
                        setEmployees(updated);
                        saveEmployees(updated);
                        updated.forEach(empItem => upsertEmployeeToSupabase(empItem));
                        alert("Kuota cuti semua karyawan berhasil di-reset menjadi 12 Hari!");
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
                        .filter(emp => emp.role === 'karyawan' && (searchQuotaQuery ? emp.name.toLowerCase().includes(searchQuotaQuery.toLowerCase()) : true))
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
      case 'reset-aplikasi':
        const handleResetNow = async () => {
          if (resetKeyword.trim().toUpperCase() !== 'RESET') {
            return;
          }
          try {
            // 1. Keep employees but set sisa kuota cuti to 0
            const updatedEmployees = employees.map(emp => ({
              ...emp,
              cutiQuota: 0
            }));

            // Save updated employees to localStorage
            localStorage.setItem('ppnpn_employees', JSON.stringify(updatedEmployees));

            // 2. Clear all transaction data from localStorage
            localStorage.setItem('ppnpn_attendance', JSON.stringify([]));
            localStorage.setItem('ppnpn_leaves', JSON.stringify([]));
            localStorage.setItem('ppnpn_logbooks', JSON.stringify([]));
            localStorage.setItem('overtime_attendance_records', JSON.stringify([]));

            // Remove any keys starting with overtime_requests_
            const keysToRemove: string[] = [];
            for (let i = 0; i < localStorage.length; i++) {
              const k = localStorage.key(i);
              if (k && k.startsWith('overtime_requests_')) {
                keysToRemove.push(k);
              }
            }
            keysToRemove.forEach(k => localStorage.removeItem(k));

            // Set app is reset flag
            localStorage.setItem('app_is_reset', 'true');

            // 3. Update React States
            setEmployees(updatedEmployees);
            setAttendance([]);
            setLeaves([]);
            setLogbooks([]);

            // 4. Sync with Supabase if connected
            if (supabaseConnected) {
              await clearTransactionsFromSupabase();
              await resetAllEmployeeQuotasInSupabase();
            }

            setIsResetSuccess(true);
            window.dispatchEvent(new Event('storage'));
          } catch (error) {
            console.error("Error during system reset:", error);
            alert("Terjadi kesalahan saat mengosongkan data.");
          }
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
                    Seluruh data transaksi, histori swafoto presensi, pengajuan cuti/izin, pengajuan lembur, rincian logbook kerja harian, sisa kuota cuti, serta status verifikasi & approval telah DIHAPUS secara permanen. Data Pegawai tetap utuh dan dipertahankan.
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
                    Tindakan ini tidak dapat dibatalkan. Seluruh data transaksi, histori swafoto presensi, pengajuan cuti/izin, pengajuan lembur, rincian logbook kerja harian, sisa kuota cuti, serta status verifikasi & approval akan <strong>DIKOSONGKAN/DIHAPUS secara permanen</strong>. <strong>Data Pegawai/Akun PPNPN TIDAK akan dihapus</strong> agar tetap dapat digunakan untuk masuk ke dalam sistem.
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
        onViewChange={setActiveView}
        onLogout={handleLogout}
        supabaseConnected={supabaseConnected}
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
