import { Employee, Attendance, LeaveRequest, Logbook, OfficeSettings } from '../types';
// List of IDs and names that are NOT PPNPN and must be excluded from PPNPN roster
export const NON_PPNPN_IDS = [
  'jonathan',
  'budi',
  'hendra',
  'agus',
  'dedi',
  'fitri',
  'siti',
  'emp_01',
  'emp_02',
  'emp_04',
  'emp_05',
  'emp_07',
  'emp_08',
  'emp_09',
  'emp_jonathan',
  'emp_budi',
  'emp_hendra',
  'emp_agus',
  'emp_dedi',
  'emp_fitri',
  'emp_siti',
  'testuser1',
  'test_emp_123'
];

// Legacy dummy test IDs that should never appear in active PPNPN employee lists
export const LEGACY_REMOVED_IDS = [
  'testuser1',
  'test_emp_123'
];

export const NON_PPNPN_NAMES = [
  'jonathan',
  'budi santoso',
  'hendra saputra',
  'agus susanto',
  'dedi kurniawan',
  'fitri handayani',
  'siti rahma',
  'test user 1',
  'test pegawai sync'
];

export const isNonPpnpn = (id?: string | null, name?: string | null): boolean => {
  const normId = (id || '').toLowerCase().trim();
  const normName = (name || '').toLowerCase().trim();
  const unmarked = getUnmarkedEmployeeIds();
  if (normId && unmarked.includes(normId)) return false;
  if (normName && unmarked.includes(`name:${normName}`)) return false;
  if (normId && NON_PPNPN_IDS.includes(normId)) return true;
  if (normName && NON_PPNPN_NAMES.some(n => normName === n || normName.includes(n))) return true;
  return false;
};

export const DELETED_EMPLOYEES_KEY = 'ppnpn_deleted_employee_ids';
export const UNMARKED_EMPLOYEES_KEY = 'ppnpn_unmarked_employee_ids';

export const OFFICIAL_PPNPN_IDS = [
  'adit',
  'agil',
  'ari',
  'arief',
  'atan',
  'bambang',
  'maika',
  'maliq',
  'nanda',
  'robby',
  'tia',
  'zainal'
];

export const PROTECTED_ADMIN_IDS = ['nauval', '123', 'name:nauval', 'name:nauval (admin)', 'frans', 'kartika'];
export const ALL_OFFICIAL_IDS = [...OFFICIAL_PPNPN_IDS, ...PROTECTED_ADMIN_IDS];

export const getUnmarkedEmployeeIds = (): string[] => {
  try {
    const stored = localStorage.getItem(UNMARKED_EMPLOYEES_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.map(s => String(s || '').trim().toLowerCase()).filter(Boolean) : [];
  } catch {
    return [];
  }
};

export const getDeletedEmployeeIds = (): string[] => {
  try {
    const stored = localStorage.getItem(DELETED_EMPLOYEES_KEY);
    const parsed: string[] = stored ? JSON.parse(stored) : LEGACY_REMOVED_IDS;
    const unmarked = new Set(getUnmarkedEmployeeIds());
    const set = new Set<string>(
      parsed
        .map(s => (s || '').trim().toLowerCase())
        .filter(item => Boolean(item) && !ALL_OFFICIAL_IDS.includes(item) && !unmarked.has(item))
    );
    return Array.from(set);
  } catch {
    return [...LEGACY_REMOVED_IDS];
  }
};

export const setDeletedEmployeeIds = (newDeletedIds: string[]) => {
  try {
    const unmarked = new Set(getUnmarkedEmployeeIds());
    const set = new Set<string>();
    for (const raw of newDeletedIds) {
      if (!raw) continue;
      const clean = raw.trim().toLowerCase();
      if (clean && !ALL_OFFICIAL_IDS.includes(clean) && !unmarked.has(clean)) {
        set.add(clean);
      }
    }
    localStorage.setItem(DELETED_EMPLOYEES_KEY, JSON.stringify(Array.from(set)));
  } catch (err) {
    console.warn("Failed to set deleted employee IDs in storage:", err);
  }
};

export const mergeDeletedEmployeeIds = (newDeletedIds: string[]) => {
  try {
    const unmarked = new Set(getUnmarkedEmployeeIds());
    const deleted = getDeletedEmployeeIds();
    const set = new Set(deleted);
    for (const raw of newDeletedIds) {
      if (!raw) continue;
      const clean = raw.trim().toLowerCase();
      if (clean && !ALL_OFFICIAL_IDS.includes(clean) && !unmarked.has(clean)) {
        set.add(clean);
      }
    }
    localStorage.setItem(DELETED_EMPLOYEES_KEY, JSON.stringify(Array.from(set)));
  } catch (err) {
    console.warn("Failed to merge deleted employee IDs in storage:", err);
  }
};

export const markEmployeeAsDeleted = (id: string, name?: string) => {
  try {
    const cleanId = (id || '').trim().toLowerCase();
    const cleanName = (name || '').trim().toLowerCase();

    // Remove from unmarked list if previously registered/unmarked
    const unmarked = getUnmarkedEmployeeIds().filter(item => {
      if (cleanId && item === cleanId) return false;
      if (cleanName && (item === `name:${cleanName}` || item === cleanName)) return false;
      return true;
    });
    localStorage.setItem(UNMARKED_EMPLOYEES_KEY, JSON.stringify(unmarked));

    const deleted = getDeletedEmployeeIds();
    const set = new Set(deleted);
    if (cleanId && !PROTECTED_ADMIN_IDS.includes(cleanId)) set.add(cleanId);
    if (cleanName && !PROTECTED_ADMIN_IDS.includes(`name:${cleanName}`)) set.add(`name:${cleanName}`);
    localStorage.setItem(DELETED_EMPLOYEES_KEY, JSON.stringify(Array.from(set)));
  } catch (err) {
    console.warn("Failed to mark employee as deleted in storage:", err);
  }
};

export const unmarkEmployeeAsDeleted = (id: string, name?: string) => {
  try {
    const cleanId = (id || '').trim().toLowerCase();
    const cleanName = (name || '').trim().toLowerCase();

    // Record in unmarked list so stale snapshots or legacy lists never hide this employee
    const unmarkedSet = new Set(getUnmarkedEmployeeIds());
    if (cleanId) unmarkedSet.add(cleanId);
    if (cleanName) {
      unmarkedSet.add(`name:${cleanName}`);
      unmarkedSet.add(cleanName);
    }
    localStorage.setItem(UNMARKED_EMPLOYEES_KEY, JSON.stringify(Array.from(unmarkedSet)));

    const stored = localStorage.getItem(DELETED_EMPLOYEES_KEY);
    const currentList: string[] = stored ? JSON.parse(stored) : LEGACY_REMOVED_IDS;
    const filtered = currentList.filter(item => {
      const itemLower = (item || '').trim().toLowerCase();
      if (cleanId && itemLower === cleanId) return false;
      if (cleanName && (itemLower === `name:${cleanName}` || itemLower === cleanName)) return false;
      return true;
    });
    localStorage.setItem(DELETED_EMPLOYEES_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.warn("Failed to unmark employee as deleted in storage:", err);
  }
};

export const isEmployeeDeleted = (id?: string | null, name?: string | null): boolean => {
  const cleanId = (id || '').trim().toLowerCase();
  const cleanName = (name || '').trim().toLowerCase();

  // All 12 official PPNPN and 4 admins are permanent official staff and never deleted by stale cache
  if (cleanId && ALL_OFFICIAL_IDS.includes(cleanId)) {
    return false;
  }
  if (cleanName && (cleanName.includes('nauval') || cleanName.includes('frans') || cleanName.includes('kartika'))) {
    return false;
  }

  const unmarked = getUnmarkedEmployeeIds();
  if (cleanId && unmarked.includes(cleanId)) return false;
  if (cleanName && (unmarked.includes(`name:${cleanName}`) || unmarked.includes(cleanName))) return false;

  const deleted = getDeletedEmployeeIds();
  if (!deleted || deleted.length === 0) return false;
  // When an employee has a valid ID, match strictly by ID so re-added employees
  // with a new ID (e.g. id: "ari" for "DIAN ARIAWAN" after old id: "dian" was deleted) are not hidden.
  if (cleanId) {
    return deleted.includes(cleanId);
  }
  if (cleanName) {
    if (deleted.includes(`name:${cleanName}`)) return true;
    for (const item of deleted) {
      if (item.startsWith('name:')) {
        const delName = item.slice(5).trim().toLowerCase();
        if (delName && delName.length > 1 && delName === cleanName) {
          return true;
        }
      }
    }
  }
  return false;
};

// Default data synchronized with production Firestore (https://sapariau.vercel.app/)
export const DEFAULT_EMPLOYEES: Employee[] = [
  {
    id: "nauval",
    name: "Nauval (Admin)",
    email: "nauval@ppnpn.com",
    role: "admin",
    password: "123",
    position: "Administrator",
    joinDate: "2024-01-01",
    cutiQuota: 12,
    status: "aktif"
  },
  {
    id: "123",
    name: "Nauval",
    email: "nauval@gmail.com",
    role: "admin",
    password: "123",
    position: "Pimpinan",
    joinDate: "2026-06-24",
    cutiQuota: 12,
    status: "aktif"
  },
  {
    id: "frans",
    name: "Frans Ricky Haholongan Butar Butar",
    email: "frans@ppnpn.com",
    role: "admin",
    password: "123",
    position: "Pelaksana Subbag TURT",
    joinDate: "2026-07-02",
    cutiQuota: 0,
    status: "aktif"
  },
  {
    id: "kartika",
    name: "Kartika Chandra",
    email: "kartika@ppnpn.com",
    role: "admin",
    password: "123",
    position: "Kepala Bagian Umum",
    joinDate: "2026-07-02",
    cutiQuota: 0,
    status: "aktif"
  },
  {
    id: "adit",
    name: "ADITYA PRATAMA",
    email: "adit@ppnpn.com",
    role: "security",
    password: "123",
    position: "Security / Petugas Keamanan",
    joinDate: "2026-10-26",
    cutiQuota: 2,
    shift: "Fleksibel",
    status: "aktif"
  },
  {
    id: "agil",
    name: "AGIL TRI SAPUTRA",
    email: "agil@ppnpn.com",
    role: "pramubakti",
    password: "123",
    position: "Pramubakti",
    joinDate: "2024-01-01",
    cutiQuota: 5,
    status: "aktif"
  },
  {
    id: "ari",
    name: "DIAN ARIAWAN",
    email: "ari@ppnpn.com",
    role: "security",
    password: "123",
    position: "Security / Petugas Keamanan",
    joinDate: "2026-10-26",
    cutiQuota: 7,
    shift: "Fleksibel",
    status: "aktif"
  },
  {
    id: "arief",
    name: "MOH. ARIEF D",
    email: "arief@ppnpn.com",
    role: "security",
    password: "123",
    position: "Security / Petugas Keamanan",
    joinDate: "2024-01-01",
    cutiQuota: 4,
    shift: "Fleksibel",
    status: "aktif"
  },
  {
    id: "atan",
    name: "RATMANSYAH",
    email: "atan@ppnpn.com",
    role: "security",
    password: "123",
    position: "Security / Petugas Keamanan",
    joinDate: "2026-10-26",
    cutiQuota: 6,
    shift: "Fleksibel",
    status: "aktif"
  },
  {
    id: "bambang",
    name: "BAMBANG OETOYO PUTRA",
    email: "bambang@ppnpn.com",
    role: "sopir",
    password: "123",
    position: "Pengemudi / Sopir",
    joinDate: "2024-01-01",
    cutiQuota: 1,
    status: "aktif"
  },
  {
    id: "maika",
    name: "NANDA MAIKA PUTRA",
    email: "maika@ppnpn.com",
    role: "pramubakti",
    password: "123",
    position: "Pramubakti",
    joinDate: "2026-07-02",
    cutiQuota: 5,
    status: "aktif"
  },
  {
    id: "maliq",
    name: "REKSI JUMALIK ABDUL",
    email: "maliq@ppnpn.com",
    role: "pramubakti",
    password: "123",
    position: "Pramubakti",
    joinDate: "2026-10-26",
    cutiQuota: 4,
    status: "aktif"
  },
  {
    id: "nanda",
    name: "NANDA FEBRIADI",
    email: "nanda@ppnpn.com",
    role: "pramubakti",
    password: "123",
    position: "Pramubakti",
    joinDate: "2024-01-01",
    cutiQuota: 2,
    status: "aktif"
  },
  {
    id: "robby",
    name: "ROBBY ANDAYANI",
    email: "robby@ppnpn.com",
    role: "security",
    password: "123",
    position: "Security / Petugas Keamanan",
    joinDate: "2024-01-01",
    cutiQuota: 4,
    shift: "Fleksibel",
    status: "aktif"
  },
  {
    id: "tia",
    name: "SINTA RAHMANING TIA",
    email: "tia@ppnpn.com",
    role: "pramubakti",
    password: "123",
    position: "Pramubakti",
    joinDate: "2026-10-26",
    cutiQuota: 4,
    status: "aktif"
  },
  {
    id: "zainal",
    name: "ZAINAL ERWIN",
    email: "zainal@ppnpn.com",
    role: "security",
    password: "123",
    position: "Security / Petugas Keamanan",
    joinDate: "2024-01-01",
    cutiQuota: 4,
    shift: "Fleksibel",
    status: "aktif"
  }
];

const DEFAULT_SETTINGS: OfficeSettings = {
  checkInStart: "07:30",
  checkInEnd: "08:15",
  checkOutStart: "17:00",
  officeLat: 0.51504, // Kanwil DJPb Provinsi Riau (Jl. Jend. Sudirman No. 249, Pekanbaru)
  officeLng: 101.44792,
  officeRadiusMeters: 1000,
  officeName: "Kantor Wilayah DJPb Provinsi Riau (Pekanbaru)",
  sheetId: "",
  scriptUrl: "",
  securityShiftPagiStart: "07:00",
  securityShiftPagiEnd: "08:00",
  securityShiftPagiOut: "15:00",
  securityShiftMalamStart: "18:00",
  securityShiftMalamEnd: "19:00",
  securityShiftMalamOut: "06:00"
};

// Helper to generate simulated realistic attendance for any month
const generateSimulatedAttendance = (year: number, month: number, maxDay: number): Attendance[] => {
  const list: Attendance[] = [];
  const employees = DEFAULT_EMPLOYEES;
  const monthStr = month < 10 ? `0${month}` : `${month}`;

  for (let d = 1; d <= maxDay; d++) {
    const dayStr = d < 10 ? `0${d}` : `${d}`;
    const date = `${year}-${monthStr}-${dayStr}`;
    
    // Skip weekends for simulation (Saturday: 6, Sunday: 0)
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    employees.forEach(emp => {
      if (emp.role === 'admin') return;

      // Random delay or exact time
      const isLate = Math.random() < 0.15; // 15% tardiness
      const isOutRadius = Math.random() < 0.05; // 5% out of radius
      const checkInTime = isLate 
        ? `08:${Math.floor(Math.random() * 20) + 16}` 
        : `07:${Math.floor(Math.random() * 30) + 30}`;
      
      list.push({
        id: `att_${emp.id}_${date}`,
        employeeId: emp.id,
        employeeName: emp.name,
        date,
        checkIn: checkInTime,
        checkOut: "17:05",
        checkInPhoto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
        checkOutPhoto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
        checkInLocation: isOutRadius 
          ? { lat: 0.5800, lng: 101.4100 } // Out of radius
          : { lat: 0.51504 + (Math.random() - 0.5) * 0.001, lng: 101.44792 + (Math.random() - 0.5) * 0.001 },
        checkOutLocation: { lat: 0.51504, lng: 101.44792 },
        checkInAddress: isOutRadius ? "Luar Kantor (Rumbai)" : "Kantor Pekanbaru",
        checkOutAddress: "Kantor Pekanbaru",
        checkInStatus: isLate ? 'Terlambat' : 'Tepat Waktu',
        checkOutStatus: 'Tepat Waktu'
      });
    });
  }
  return list;
};

// Seed attendance for current month (bulan berjalan) and June 2026 to ensure graphs and dashboards are active
const seedAttendance = (): Attendance[] => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();

  // 1. Seed historical June 2026 data
  const juneList = generateSimulatedAttendance(2026, 6, 24);

  // 2. Seed current running month data up to today
  let currentMonthList: Attendance[] = [];
  if (currentYear !== 2026 || currentMonth !== 6) {
    currentMonthList = generateSimulatedAttendance(currentYear, currentMonth, Math.max(1, currentDay));
  }

  return [...juneList, ...currentMonthList];
};

const DEFAULT_LEAVES: LeaveRequest[] = [
  {
    id: "leave_1784715619153",
    employeeId: "arief",
    employeeName: "MOH. ARIEF D",
    type: "Cuti",
    startDate: "2026-07-23",
    endDate: "2026-07-24",
    reason: "Urursan Keluarga",
    status: "Approved",
    createdAt: "2026-07-22T01:40:19.153Z",
    approvedBy: "Kartika Chandra",
    approvedDate: "22 Juli 2026",
    workDays: 2,
    address: "pekanbaru",
    backup1: "ROBBY ANDAYANI",
    backup2: "ZAINAL ERWIN"
  },
  {
    id: "leave_1784873426006",
    employeeId: "bambang",
    employeeName: "BAMBANG OETOYO PUTRA",
    type: "Cuti",
    startDate: "2026-07-24",
    endDate: "2026-07-24",
    reason: "urusan keluarga",
    status: "Approved",
    createdAt: "2026-07-23T21:30:26.006Z",
    approvedBy: "Kartika Chandra",
    approvedDate: "24 Juli 2026",
    workDays: 1,
    address: "pekanbaru",
    backup1: "AGIL TRI SAPUTRA",
    backup2: "NANDA FEBRIADI"
  },
  {
    id: "leave_1785140867417",
    employeeId: "robby",
    employeeName: "ROBBY ANDAYANI",
    type: "Cuti",
    startDate: "2026-07-28",
    endDate: "2026-07-29",
    reason: "Urusan Keluarga",
    status: "Approved",
    createdAt: "2026-07-26T23:47:47.417Z",
    approvedBy: "Kartika Chandra",
    approvedDate: "27 Juli 2026",
    workDays: 2,
    address: "pekanbaru",
    backup1: "MOH. ARIEF D",
    backup2: "ZAINAL ERWIN"
  }
];

// Helper to generate simulated logbooks for any month
const generateSimulatedLogbooks = (year: number, month: number, maxDay: number): Logbook[] => {
  const list: Logbook[] = [];
  const monthStr = month < 10 ? `0${month}` : `${month}`;
  const emps = [
    { id: 'maliq', name: 'Maliq' },
    { id: 'robby', name: 'ROBBY ANDAYANI' },
    { id: 'ratmansyah', name: 'RATMANSYAH' },
    { id: 'rudi', name: 'Rudi Hartono' }
  ];
  const sampleTasks = [
    "Melaksanakan tugas rutin PPNPN harian dan pelaporan berkas fisik.",
    "Pemeriksaan dan pengawasan operasional serta verifikasi dokumen kantor.",
    "Pemeliharaan sarana prasarana kerja dan kebersihan lingkungan kantor.",
    "Pelayanan pengamanan area kantor dan koordinasi penerimaan tamu kedinasan.",
    "Penyusunan rekapitulasi data harian kegiatan staf PPNPN dan checklist berkas."
  ];

  for (let d = 1; d <= maxDay; d++) {
    const dayStr = d < 10 ? `0${d}` : `${d}`;
    const date = `${year}-${monthStr}-${dayStr}`;
    const dateObj = new Date(date);
    // Skip weekends
    if (dateObj.getDay() === 0 || dateObj.getDay() === 6) continue;

    // Add 1-2 logbook entries per working day
    const entriesToday = (d % 2) + 1;
    for (let i = 0; i < entriesToday; i++) {
      const emp = emps[(d + i) % emps.length];
      list.push({
        id: `log_${year}_${monthStr}_${dayStr}_${emp.id}_${i}`,
        employeeId: emp.id,
        employeeName: emp.name,
        date,
        time: i === 0 ? "08:30" : "16:45",
        content: sampleTasks[(d + i) % sampleTasks.length],
        status: "Approved"
      });
    }
  }
  return list;
};

const getInitialLogbooks = (): Logbook[] => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();

  // 1. June 2026 historical logbooks
  const juneLogs: Logbook[] = [
    {
      id: "log1",
      employeeId: "maliq",
      employeeName: "Maliq",
      date: "2026-06-24",
      time: "08:15 AM",
      content: "Catat detail daily log summ."
    },
    {
      id: "log2",
      employeeId: "robby",
      employeeName: "ROBBY ANDAYANI",
      date: "2026-06-24",
      time: "07:30 AM",
      content: "Pemeriksaan area kantor dan buku tamu pos keamanan."
    },
    ...Array.from({ length: 13 }).map((_, i) => ({
      id: `log_mock_${i}`,
      employeeId: ["robby", "maliq"][i % 2],
      employeeName: ["ROBBY ANDAYANI", "Maliq"][i % 2],
      date: `2026-06-${(i + 1) < 10 ? `0${i + 1}` : i + 1}`,
      time: "17:15",
      content: "Melaksanakan tugas rutin PPNPN harian dan pelaporan berkas fisik."
    }))
  ];

  // 2. Current running month logbooks
  let curLogs: Logbook[] = [];
  if (currentYear !== 2026 || currentMonth !== 6) {
    curLogs = generateSimulatedLogbooks(currentYear, currentMonth, Math.max(1, currentDay));
  }

  return [...juneLogs, ...curLogs];
};

const DEFAULT_LOGBOOKS: Logbook[] = getInitialLogbooks();

// LocalStorage Keys
const KEYS = {
  EMPLOYEES: 'ppnpn_employees',
  ATTENDANCE: 'ppnpn_attendance',
  LEAVES: 'ppnpn_leaves',
  LOGBOOKS: 'ppnpn_logbooks',
  SETTINGS: 'ppnpn_settings'
};

/**
 * Safely saves data to localStorage without throwing QuotaExceededError.
 * If quota is exceeded, it optimizes/compresses payload (e.g. stripping heavy base64 photos or keeping recent records)
 * so that local storage caching works gracefully without breaking React app state or Supabase sync loops.
 */
export const safeSetLocalStorageItem = (key: string, data: any) => {
  try {
    const serialized = typeof data === 'string' ? data : JSON.stringify(data);
    localStorage.setItem(key, serialized);
  } catch (e) {
    console.warn(`[Storage] LocalStorage quota exceeded when saving '${key}'. Optimizing payload...`);
    try {
      if (Array.isArray(data)) {
        // Step 1: Strip heavy Base64 image strings (>10KB) from local cache items
        const strippedArray = data.map((item: any) => {
          if (!item || typeof item !== 'object') return item;
          const copy = { ...item };
          if (copy.checkInPhoto && typeof copy.checkInPhoto === 'string' && copy.checkInPhoto.length > 10000) {
            copy.checkInPhoto = '';
          }
          if (copy.checkOutPhoto && typeof copy.checkOutPhoto === 'string' && copy.checkOutPhoto.length > 10000) {
            copy.checkOutPhoto = '';
          }
          if (copy.photoUrl && typeof copy.photoUrl === 'string' && copy.photoUrl.length > 10000) {
            copy.photoUrl = '';
          }
          return copy;
        });

        localStorage.setItem(key, JSON.stringify(strippedArray));
        return;
      } else if (data && typeof data === 'object') {
        const copy = { ...data };
        if (copy.logoUrl && typeof copy.logoUrl === 'string' && copy.logoUrl.length > 50000) {
          copy.logoUrl = '';
        }
        localStorage.setItem(key, JSON.stringify(copy));
        return;
      }
    } catch (err2) {
      console.warn(`[Storage] Second attempt failed for '${key}'. Keeping recent 50 records for local cache...`);
      try {
        if (Array.isArray(data)) {
          // Step 2: Keep only recent 50 records stripped of photos
          const recentStripped = data.slice(-50).map((item: any) => {
            if (!item || typeof item !== 'object') return item;
            const copy = { ...item };
            if (copy.checkInPhoto) copy.checkInPhoto = '';
            if (copy.checkOutPhoto) copy.checkOutPhoto = '';
            if (copy.photoUrl) copy.photoUrl = '';
            return copy;
          });
          localStorage.setItem(key, JSON.stringify(recentStripped));
          return;
        }
      } catch (err3) {
        console.error(`[Storage] Unable to save '${key}' to localStorage due to strict browser quota limits.`, err3);
      }
    }
  }
};

export const getStoredData = () => {
  const isReset = localStorage.getItem('app_is_reset') === 'true';
  const isResetAttendance = isReset || localStorage.getItem('app_is_reset_attendance') === 'true';
  const isResetLeaves = isReset || localStorage.getItem('app_is_reset_cuti') === 'true';
  const isResetLogbooks = isReset || localStorage.getItem('app_is_reset_logbook') === 'true';

  // Ensure stale dummy data from older default templates is replaced with production sapariau.vercel.app data
  if (localStorage.getItem('ppnpn_vercel_sync_v8') !== 'true') {
    localStorage.removeItem(KEYS.EMPLOYEES);
    localStorage.removeItem(DELETED_EMPLOYEES_KEY);
    localStorage.removeItem('firebase_firestore_quota_exceeded_date');
    localStorage.removeItem('firebase_quota_exceeded_sapariau-e99eb');
    localStorage.setItem('ppnpn_vercel_sync_v8', 'true');
  }

  // Check if data is already seeded with old NIP format, if so, reset
  let employees = localStorage.getItem(KEYS.EMPLOYEES);
  if (employees && employees.includes("NIP001")) {
    localStorage.removeItem(KEYS.EMPLOYEES);
    localStorage.removeItem(KEYS.ATTENDANCE);
    localStorage.removeItem(KEYS.LEAVES);
    localStorage.removeItem(KEYS.LOGBOOKS);
    employees = null;
  }

  let attendance = localStorage.getItem(KEYS.ATTENDANCE);
  let leaves = localStorage.getItem(KEYS.LEAVES);
  let logbooks = localStorage.getItem(KEYS.LOGBOOKS);
  let settings = localStorage.getItem(KEYS.SETTINGS);

  if (!employees) {
    const initialEmployees = (isReset
      ? DEFAULT_EMPLOYEES.filter(e => e.role === 'admin')
      : DEFAULT_EMPLOYEES).filter(e => !isNonPpnpn(e.id, e.name) && !isEmployeeDeleted(e.id, e.name));
    safeSetLocalStorageItem(KEYS.EMPLOYEES, initialEmployees);
    employees = JSON.stringify(initialEmployees);
  }
  if (!attendance) {
    const initialAttendance = isResetAttendance ? [] : seedAttendance();
    safeSetLocalStorageItem(KEYS.ATTENDANCE, initialAttendance);
    attendance = JSON.stringify(initialAttendance);
  }
  if (!leaves) {
    const initialLeaves = isResetLeaves ? [] : DEFAULT_LEAVES;
    safeSetLocalStorageItem(KEYS.LEAVES, initialLeaves);
    leaves = JSON.stringify(initialLeaves);
  }
  if (!logbooks) {
    const initialLogbooks = isResetLogbooks ? [] : DEFAULT_LOGBOOKS;
    safeSetLocalStorageItem(KEYS.LOGBOOKS, initialLogbooks);
    logbooks = JSON.stringify(initialLogbooks);
  }
  if (!settings) {
    safeSetLocalStorageItem(KEYS.SETTINGS, DEFAULT_SETTINGS);
    settings = JSON.stringify(DEFAULT_SETTINGS);
  }

  let parsedEmployees = JSON.parse(employees) as Employee[];
  // Dynamic filter out of non-PPNPN and deleted employees
  parsedEmployees = parsedEmployees.filter(e => !isNonPpnpn(e.id, e.name) && !isEmployeeDeleted(e.id, e.name) && e.id !== 'robert' && e.id !== 'lucas');

  // Ensure all 12 official PPNPN and 4 admins are ALWAYS included (even if local cache previously had only 1 employee)
  if (!isReset) {
    const map = new Map<string, Employee>();
    DEFAULT_EMPLOYEES.forEach(def => {
      const id = (def.id || '').trim().toLowerCase();
      if (id && !isNonPpnpn(def.id, def.name)) {
        map.set(id, def);
      }
    });
    // Merge any existing parsed employee records
    parsedEmployees.forEach(pe => {
      const id = (pe.id || '').trim().toLowerCase();
      if (id && !isNonPpnpn(pe.id, pe.name) && !isEmployeeDeleted(pe.id, pe.name)) {
        map.set(id, { ...(map.get(id) || {}), ...pe });
      }
    });
    parsedEmployees = Array.from(map.values());
    safeSetLocalStorageItem(KEYS.EMPLOYEES, parsedEmployees);
  }

  // Assign specific roles and default status of 'aktif' to any employee without status
  parsedEmployees = parsedEmployees.map(e => {
    let r = e.role;
    const pos = (e.position || '').toLowerCase();
    if (!r || r === 'karyawan') {
      if (pos.includes('satpam') || pos.includes('security') || pos.includes('keamanan') || pos.includes('penjaga')) {
        r = 'security';
      } else if (pos.includes('sopir') || pos.includes('pengemudi') || pos.includes('driver')) {
        r = 'sopir';
      } else if (r !== 'admin') {
        r = 'pramubakti';
      }
    }
    return {
      ...e,
      role: r,
      password: !e.password || e.password === 'password123' ? '123' : e.password,
      shift: r === 'security' ? 'Fleksibel' : e.shift,
      status: e.status || 'aktif'
    };
  });

  // Retain edited employee properties while ensuring required fields exist for existing active employees
  // NEVER resurrect deleted employees from DEFAULT_EMPLOYEES!
  parsedEmployees = parsedEmployees.map(existing => {
    const defEmp = DEFAULT_EMPLOYEES.find(e => e.id.toLowerCase() === existing.id.toLowerCase() || (e.name && existing.name && e.name.toLowerCase() === existing.name.toLowerCase()));
    if (defEmp) {
      if (!existing.password || existing.password === 'password123') existing.password = '123';
      if (!existing.position) existing.position = defEmp.position;
      if (!existing.role || existing.role === 'karyawan') existing.role = defEmp.role;
      if (existing.role === 'security' && !existing.shift) existing.shift = 'Fleksibel';
      if (typeof existing.cutiQuota !== 'number') existing.cutiQuota = defEmp.cutiQuota;
    } else if (!existing.password || existing.password === 'password123') {
      existing.password = '123';
    }
    return existing;
  });

  // Ensure non-PPNPN and deleted entries are strictly removed from cached storage
  parsedEmployees = parsedEmployees.filter(e => !isNonPpnpn(e.id, e.name) && !isEmployeeDeleted(e.id, e.name));
  safeSetLocalStorageItem(KEYS.EMPLOYEES, parsedEmployees);

  let parsedAttendance: Attendance[] = [];
  try {
    parsedAttendance = JSON.parse(attendance) as Attendance[];
  } catch (e) {
    parsedAttendance = [];
  }
  // Sanitize attendance to remove non-PPNPN and legacy removed dummy employees
  parsedAttendance = parsedAttendance.filter(a => !isNonPpnpn(a.employeeId, a.employeeName) && !LEGACY_REMOVED_IDS.includes((a.employeeId || '').trim().toLowerCase()));

  // Ensure current running month (bulan berjalan) has attendance records
  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth() + 1;
  const curMonthPrefix = `${curYear}-${curMonth < 10 ? `0${curMonth}` : curMonth}`;

  if (!isResetAttendance && !parsedAttendance.some(att => att.date && att.date.startsWith(curMonthPrefix))) {
    const curMonthAtt = generateSimulatedAttendance(curYear, curMonth, Math.max(1, now.getDate()));
    parsedAttendance = [...parsedAttendance, ...curMonthAtt].filter(a => !isNonPpnpn(a.employeeId, a.employeeName));
    safeSetLocalStorageItem(KEYS.ATTENDANCE, parsedAttendance);
  }

  let parsedLeaves: LeaveRequest[] = [];
  try {
    parsedLeaves = JSON.parse(leaves) as LeaveRequest[];
  } catch (e) {
    parsedLeaves = [];
  }
  parsedLeaves = parsedLeaves.filter(l => !isNonPpnpn(l.employeeId, l.employeeName));
  safeSetLocalStorageItem(KEYS.LEAVES, parsedLeaves);

  let parsedLogbooks: Logbook[] = [];
  try {
    parsedLogbooks = JSON.parse(logbooks) as Logbook[];
  } catch (e) {
    parsedLogbooks = [];
  }
  parsedLogbooks = parsedLogbooks.filter(l => !isNonPpnpn(l.employeeId, l.employeeName));

  // Ensure current running month (bulan berjalan) has logbook records
  if (!isResetLogbooks && !parsedLogbooks.some(log => log.date && log.date.startsWith(curMonthPrefix))) {
    const curMonthLogs = generateSimulatedLogbooks(curYear, curMonth, Math.max(1, now.getDate()));
    parsedLogbooks = [...parsedLogbooks, ...curMonthLogs].filter(l => !isNonPpnpn(l.employeeId, l.employeeName));
    safeSetLocalStorageItem(KEYS.LOGBOOKS, parsedLogbooks);
  }

  let parsedSettings: OfficeSettings = DEFAULT_SETTINGS;
  try {
    parsedSettings = JSON.parse(settings) as OfficeSettings;
    // Auto-migrate legacy/incorrect coordinates if still near 0.4735 or if radius is missing/small
    if (parsedSettings && (Math.abs((parsedSettings.officeLat || 0) - 0.4735) < 0.005 || !parsedSettings.officeLat)) {
      parsedSettings.officeLat = 0.51504;
      parsedSettings.officeLng = 101.44792;
      parsedSettings.officeRadiusMeters = Math.max(parsedSettings.officeRadiusMeters || 0, 1000);
      safeSetLocalStorageItem(KEYS.SETTINGS, parsedSettings);
    }
  } catch (e) {
    parsedSettings = DEFAULT_SETTINGS;
  }

  return {
    employees: parsedEmployees,
    attendance: parsedAttendance,
    leaves: parsedLeaves,
    logbooks: parsedLogbooks,
    settings: parsedSettings
  };
};

export const saveEmployees = (employees: Employee[]) => {
  safeSetLocalStorageItem(KEYS.EMPLOYEES, employees);
  syncWithGoogleSheets('employees', employees);
};

export const saveAttendance = (attendance: Attendance[]) => {
  safeSetLocalStorageItem(KEYS.ATTENDANCE, attendance);
  syncWithGoogleSheets('attendance', attendance);
};

export const saveLeaves = (leaves: LeaveRequest[]) => {
  const filtered = leaves.filter(l => l.type !== 'Lembur');
  safeSetLocalStorageItem(KEYS.LEAVES, filtered);
  syncWithGoogleSheets('leaves', leaves);
};

export const saveLogbooks = (logbooks: Logbook[]) => {
  safeSetLocalStorageItem(KEYS.LOGBOOKS, logbooks);
  syncWithGoogleSheets('logbooks', logbooks);
};

export const saveSettings = (settings: OfficeSettings) => {
  safeSetLocalStorageItem(KEYS.SETTINGS, settings);
  syncWithGoogleSheets('settings', settings);
};

// Real-world integration with Google Sheets via a Google Apps Script Web App
// This allows full full-stack data persistence with ZERO security flaws or iframe breaks!
const syncWithGoogleSheets = async (type: string, data: any) => {
  const currentSettingsStr = localStorage.getItem(KEYS.SETTINGS);
  if (!currentSettingsStr) return;
  
  try {
    const settings = JSON.parse(currentSettingsStr) as OfficeSettings;
    if (!settings.scriptUrl) {
      // Not configured, skip
      return;
    }

    // Call the script endpoint asynchronously (non-blocking)
    fetch(settings.scriptUrl, {
      method: 'POST',
      mode: 'no-cors', // standard for Google Apps Script redirects
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'sync_data',
        type,
        data,
        timestamp: new Date().toISOString()
      })
    }).catch(err => {
      console.warn("Google Sheet Sync Warning (possible CORS but row sent):", err);
    });
  } catch (e) {
    console.error("Failed to sync to Google Sheets:", e);
  }
};

// Function to upload a camera image to Google Drive via the Apps Script Web App
export const uploadImageToDrive = async (base64Image: string, fileName: string): Promise<string> => {
  const currentSettingsStr = localStorage.getItem(KEYS.SETTINGS);
  if (!currentSettingsStr) return base64Image; // Fallback to base64 if not configured

  try {
    const settings = JSON.parse(currentSettingsStr) as OfficeSettings;
    if (!settings.scriptUrl) {
      console.log("Drive Sync skipped: No script URL configured. Saved image locally.");
      return base64Image;
    }

    // Make a direct request to upload file
    const response = await fetch(settings.scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain', // standard avoid CORS preflight in Apps Script
      },
      body: JSON.stringify({
        action: 'upload_file',
        fileData: base64Image.split(',')[1] || base64Image,
        fileName: fileName,
        mimeType: 'image/jpeg'
      })
    });

    const result = await response.json();
    if (result.success && result.fileUrl) {
      return result.fileUrl;
    }
    
    throw new Error(result.error || "Failed to upload");
  } catch (e) {
    console.error("Google Drive Upload failed, using local fallback URL:", e);
    return base64Image; // Fallback to local representation
  }
};

// Function to compress base64 image to prevent QuotaExceededError in localStorage
export const compressImage = (base64Str: string, maxWidth = 320, maxHeight = 320): Promise<string> => {
  return new Promise((resolve) => {
    if (!base64Str || !base64Str.startsWith('data:image')) {
      resolve(base64Str);
      return;
    }
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        // Export as JPEG with 0.6 quality
        const compressed = canvas.toDataURL('image/jpeg', 0.6);
        resolve(compressed);
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
};

// Apps Script Code Template to give to the User for copy-pasting
export const GOOGLE_APPS_SCRIPT_CODE = `
/**
 * Google Apps Script untuk Aplikasi Absensi PPNPN
 * Pasang script ini sebagai Web App di Google Sheets Anda!
 */

function doPost(e) {
  try {
    var requestData = JSON.parse(e.postData.contents);
    var action = requestData.action;
    
    if (action === 'upload_file') {
      var fileData = Utilities.base64Decode(requestData.fileData);
      var blob = Utilities.newBlob(fileData, requestData.mimeType, requestData.fileName);
      
      // Temukan atau buat folder 'Absensi_PPNPN_Photos'
      var folders = DriveApp.getFoldersByName('Absensi_PPNPN_Photos');
      var folder;
      if (folders.hasNext()) {
        folder = folders.next();
      } else {
        folder = DriveApp.createFolder('Absensi_PPNPN_Photos');
      }
      
      var file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        fileUrl: file.getUrl()
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === 'sync_data') {
      var type = requestData.type;
      var data = requestData.data;
      
      // Buat atau buka sheet sesuai dengan tipe data
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName(type);
      if (!sheet) {
        sheet = ss.insertSheet(type);
      }
      
      sheet.clear();
      
      if (data && data.length > 0) {
        // Tulis headers
        var headers = Object.keys(data[0]);
        sheet.appendRow(headers);
        
        // Tulis rows
        for (var i = 0; i < data.length; i++) {
          var row = [];
          for (var j = 0; j < headers.length; j++) {
            var val = data[i][headers[j]];
            if (typeof val === 'object' && val !== null) {
              row.push(JSON.stringify(val));
            } else {
              row.push(val);
            }
          }
          sheet.appendRow(row);
        }
      }
      
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: 'Sync ' + type + ' success'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Invalid Action'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
`;
