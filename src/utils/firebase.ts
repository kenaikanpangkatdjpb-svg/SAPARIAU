import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
  onSnapshot,
  query,
  where,
  limit
} from 'firebase/firestore';
import { Employee, Attendance, LeaveRequest, Logbook, OfficeSettings } from '../types';
import { isNonPpnpn, NON_PPNPN_IDS } from './storage';
import rawFirebaseConfig from '../../firebase-applet-config.json';

// Resolves Firebase config: prioritizes VITE_FIREBASE_* environment variables (for Vercel/production),
// fallback to firebase-applet-config.json
export const getActiveFirebaseConfig = () => {
  const env = (import.meta as any).env;
  if (env && env.VITE_FIREBASE_PROJECT_ID) {
    return {
      projectId: env.VITE_FIREBASE_PROJECT_ID,
      appId: env.VITE_FIREBASE_APP_ID || (rawFirebaseConfig as any).appId || '',
      apiKey: env.VITE_FIREBASE_API_KEY || (rawFirebaseConfig as any).apiKey || '',
      authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || `${env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
      firestoreDatabaseId: env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || (rawFirebaseConfig as any).firestoreDatabaseId || '(default)',
      storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || `${env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
      messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || (rawFirebaseConfig as any).messagingSenderId || ''
    };
  }
  return rawFirebaseConfig;
};

export const activeFirebaseConfig = getActiveFirebaseConfig();

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(activeFirebaseConfig) : getApp();

// Initialize Firestore with specific databaseId if provided
export const db = (() => {
  try {
    return initializeFirestore(
      app,
      {
        experimentalAutoDetectLongPolling: true
      },
      (activeFirebaseConfig as any).firestoreDatabaseId || '(default)'
    );
  } catch {
    return getFirestore(
      app,
      (activeFirebaseConfig as any).firestoreDatabaseId || '(default)'
    );
  }
})();

export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

// Mappers to ensure data consistency
export const mapEmployeeToDb = (emp: Employee) => ({
  id: emp.id,
  name: emp.name || '',
  email: emp.email || `${emp.id}@ppnpn.com`,
  role: emp.role || 'pramubakti',
  password: emp.password || 'password123',
  position: emp.position || '',
  photo_url: emp.photoUrl || null,
  join_date: emp.joinDate || new Date().toISOString().split('T')[0],
  cuti_quota: typeof emp.cutiQuota === 'number' && !isNaN(emp.cutiQuota) ? emp.cutiQuota : 12,
  shift: emp.role === 'security' ? 'Fleksibel' : (emp.shift || null),
  status: emp.status || 'aktif'
});

export const mapEmployeeFromDb = (row: any): Employee => {
  let mappedRole = row.role;
  if (!mappedRole || mappedRole === 'karyawan') {
    const pos = (row.position || '').toLowerCase();
    if (pos.includes('satpam') || pos.includes('security') || pos.includes('keamanan')) {
      mappedRole = 'security';
    } else if (pos.includes('sopir') || pos.includes('pengemudi') || pos.includes('driver')) {
      mappedRole = 'sopir';
    } else if (pos.includes('admin')) {
      mappedRole = 'admin';
    } else {
      mappedRole = 'pramubakti';
    }
  }
  return {
    id: row.id || row.username || '',
    name: row.name || 'Pegawai',
    email: row.email || `${row.id || 'user'}@ppnpn.com`,
    role: (mappedRole as any) || 'pramubakti',
    password: row.password || 'password123',
    position: row.position || (mappedRole === 'security' ? 'Security' : mappedRole === 'sopir' ? 'Pengemudi / Sopir' : 'Pramubakti'),
    photoUrl: row.photo_url || row.photoUrl || undefined,
    joinDate: row.join_date || row.joinDate || new Date().toISOString().split('T')[0],
    cutiQuota: typeof row.cuti_quota === 'number' ? row.cuti_quota : (typeof row.cutiQuota === 'number' ? row.cutiQuota : 12),
    shift: mappedRole === 'security' ? 'Fleksibel' : (row.shift || undefined),
    status: row.status || 'aktif'
  };
};

export const mapAttendanceToDb = (att: Attendance) => ({
  id: att.id,
  employee_id: att.employeeId,
  employee_name: att.employeeName,
  date: att.date,
  check_in: att.checkIn || null,
  check_out: att.checkOut || null,
  check_in_photo: att.checkInPhoto || null,
  check_out_photo: att.checkOutPhoto || null,
  check_in_location: att.checkInLocation ? JSON.stringify(att.checkInLocation) : null,
  check_out_location: att.checkOutLocation ? JSON.stringify(att.checkOutLocation) : null,
  check_in_address: att.checkInAddress || null,
  check_out_address: att.checkOutAddress || null,
  check_in_status: att.checkInStatus,
  check_out_status: att.checkOutStatus || null,
  logbook_notes: att.logbookNotes || null,
  shift: att.shift || null
});

export const mapAttendanceFromDb = (row: any): Attendance => {
  const parseJson = (val: any) => {
    if (!val) return null;
    if (typeof val === 'object') return val;
    try { return JSON.parse(val); } catch (e) { return null; }
  };
  return {
    id: row.id,
    employeeId: row.employee_id,
    employeeName: row.employee_name,
    date: row.date,
    checkIn: row.check_in,
    checkOut: row.check_out,
    checkInPhoto: row.check_in_photo,
    checkOutPhoto: row.check_out_photo,
    checkInLocation: parseJson(row.check_in_location),
    checkOutLocation: parseJson(row.check_out_location),
    checkInAddress: row.check_in_address,
    checkOutAddress: row.check_out_address,
    checkInStatus: row.check_in_status || 'Tepat Waktu',
    checkOutStatus: row.check_out_status,
    logbookNotes: row.logbook_notes,
    shift: row.shift
  };
};

export const mapLeaveToDb = (leave: LeaveRequest) => ({
  id: leave.id,
  employee_id: leave.employeeId,
  employee_name: leave.employeeName,
  type: leave.type,
  start_date: leave.startDate,
  end_date: leave.endDate,
  reason: leave.reason,
  status: leave.status,
  created_at: leave.createdAt,
  approved_by: leave.approvedBy || null,
  approved_date: leave.approvedDate || null,
  work_days: leave.workDays || null,
  address: leave.address || null,
  backup1: leave.backup1 || null,
  backup2: leave.backup2 || null
});

export const mapLeaveFromDb = (row: any): LeaveRequest => ({
  id: row.id,
  employeeId: row.employee_id,
  employeeName: row.employee_name,
  type: row.type,
  startDate: row.start_date,
  endDate: row.end_date,
  reason: row.reason,
  status: row.status || 'Pending',
  createdAt: row.created_at,
  approvedBy: row.approved_by || undefined,
  approvedDate: row.approved_date || undefined,
  workDays: row.work_days || undefined,
  address: row.address || undefined,
  backup1: row.backup1 || undefined,
  backup2: row.backup2 || undefined
});

export const mapLogbookToDb = (log: Logbook) => ({
  id: log.id,
  employee_id: log.employeeId,
  employee_name: log.employeeName,
  date: log.date,
  time: log.time,
  content: log.content,
  status: log.status || 'Pending',
  approved_by: log.approvedBy || null
});

export const mapLogbookFromDb = (row: any): Logbook => ({
  id: row.id,
  employeeId: row.employee_id,
  employeeName: row.employee_name,
  date: row.date,
  time: row.time,
  content: row.content,
  status: row.status || 'Pending',
  approvedBy: row.approved_by || undefined
});

export const mapSettingsToDb = (set: OfficeSettings) => ({
  id: 'current_settings',
  check_in_start: set.checkInStart,
  check_in_end: set.checkInEnd,
  check_out_start: set.checkOutStart,
  office_lat: set.officeLat,
  office_lng: set.officeLng,
  office_radius_meters: set.officeRadiusMeters || 500,
  office_name: set.officeName || "Pekanbaru",
  sheet_id: set.sheetId || '',
  script_url: set.scriptUrl || '',
  security_shift_pagi_start: set.securityShiftPagiStart || null,
  security_shift_pagi_end: set.securityShiftPagiEnd || null,
  security_shift_pagi_out: set.securityShiftPagiOut || null,
  security_shift_malam_start: set.securityShiftMalamStart || null,
  security_shift_malam_end: set.securityShiftMalamEnd || null,
  security_shift_malam_out: set.securityShiftMalamOut || null
});

export const mapSettingsFromDb = (row: any): OfficeSettings => ({
  checkInStart: row.check_in_start || "06:00",
  checkInEnd: row.check_in_end || "08:00",
  checkOutStart: row.check_out_start || "16:00",
  officeLat: row.office_lat || 0.4735,
  officeLng: row.office_lng || 101.4478,
  officeRadiusMeters: row.office_radius_meters || row.office_radius || 500,
  officeName: row.office_name || "Kantor Wilayah DJPb Provinsi Riau (Pekanbaru)",
  sheetId: row.sheet_id || '',
  scriptUrl: row.script_url || '',
  securityShiftPagiStart: row.security_shift_pagi_start || undefined,
  securityShiftPagiEnd: row.security_shift_pagi_end || undefined,
  securityShiftPagiOut: row.security_shift_pagi_out || undefined,
  securityShiftMalamStart: row.security_shift_malam_start || undefined,
  securityShiftMalamEnd: row.security_shift_malam_end || undefined,
  securityShiftMalamOut: row.security_shift_malam_out || undefined
});

export const isQuotaError = (err: any): boolean => {
  if (!err) return false;
  const msg = (err?.message || String(err || '')).toLowerCase();
  return (
    msg.includes('quota exceeded') ||
    msg.includes('free daily read units per project') ||
    msg.includes('resource_exhausted') ||
    msg.includes('resource-exhausted') ||
    err?.code === 'resource-exhausted'
  );
};

const QUOTA_STORAGE_KEY = `firebase_quota_exceeded_${(activeFirebaseConfig as any).projectId || 'default'}`;
const getTodayStr = () => new Date().toISOString().slice(0, 10);

// Clear any old obsolete global key from previous projects
try {
  localStorage.removeItem('firebase_firestore_quota_exceeded_date');
} catch {}

const checkQuotaStateFromStorage = (): boolean => {
  try {
    const saved = localStorage.getItem(QUOTA_STORAGE_KEY);
    return saved === getTodayStr();
  } catch {
    return false;
  }
};

let lastFirebaseError: string | null = null;
let quotaExceededState = checkQuotaStateFromStorage();

export const isFirebaseQuotaExceeded = (): boolean => quotaExceededState;
export const setFirebaseQuotaExceeded = (val: boolean) => {
  quotaExceededState = val;
  try {
    if (val) {
      localStorage.setItem(QUOTA_STORAGE_KEY, getTodayStr());
    } else {
      localStorage.removeItem(QUOTA_STORAGE_KEY);
      localStorage.removeItem('firebase_firestore_quota_exceeded_date');
    }
  } catch {}
};
export const getLastFirebaseError = (): string | null => lastFirebaseError;

const getLocalCache = <T>(key: string, fallback: T): T => {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
};

// Memory cache with TTL to prevent redundant Firestore bulk reads
const readCacheTimestamps: Record<string, number> = {};
const READ_CACHE_TTL_MS = 5 * 60 * 1000; // 5 menit cache per sesi/tab

const isCacheValid = (key: string): boolean => {
  const ts = readCacheTimestamps[key];
  return !!ts && (Date.now() - ts < READ_CACHE_TTL_MS);
};

const markCacheFetched = (key: string) => {
  readCacheTimestamps[key] = Date.now();
};

export const checkFirebaseConnection = async (forceResetQuota: boolean = false): Promise<boolean> => {
  try {
    if (forceResetQuota) {
      setFirebaseQuotaExceeded(false);
      lastFirebaseError = null;
    }
    try {
      localStorage.removeItem('firebase_firestore_quota_exceeded_date');
      localStorage.removeItem(QUOTA_STORAGE_KEY);
    } catch {}

    const docRef = doc(db, 'ppnpn_settings', 'health_check');
    const pingPromise = setDoc(docRef, { ping: true, timestamp: Date.now() }, { merge: true });
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Koneksi ke Firebase Firestore timed out (4s)')), 4000)
    );
    await Promise.race([pingPromise, timeoutPromise]);

    lastFirebaseError = null;
    setFirebaseQuotaExceeded(false);
    return true;
  } catch (e: any) {
    if (isQuotaError(e)) {
      setFirebaseQuotaExceeded(true);
      lastFirebaseError = "Batas kuota harian Firebase Firestore Free Tier telah tercapai. Sistem otomatis beroperasi dalam mode offline lokal.";
      console.warn("[Firebase] Kuota harian Firestore tercapai saat uji koneksi. Beralih ke cache lokal.");
      return false;
    }
    console.warn("Pemeriksaan koneksi Firebase gagal:", e?.message || e);
    lastFirebaseError = e?.message || "Gagal terhubung ke Firebase Firestore.";
    return false;
  }
};

export const forceFirebaseOnline = async (): Promise<boolean> => {
  return checkFirebaseConnection(true);
};

export const getEmployeesFromFirebase = async (force: boolean = false): Promise<Employee[] | null> => {
  if (quotaExceededState) {
    return getLocalCache<Employee[]>('ppnpn_employees', []);
  }
  if (!force && isCacheValid('employees')) {
    return getLocalCache<Employee[]>('ppnpn_employees', []);
  }
  try {
    const snap = await getDocs(collection(db, 'ppnpn_employees'));
    markCacheFetched('employees');
    if (snap.empty) return [];
    const list = snap.docs
      .map(doc => mapEmployeeFromDb({ id: doc.id, ...doc.data() }))
      .filter(emp => !isNonPpnpn(emp.id, emp.name));
    return list;
  } catch (e: any) {
    if (isQuotaError(e)) {
      setFirebaseQuotaExceeded(true);
      lastFirebaseError = "Batas kuota harian Firebase Firestore Free Tier tercapai. Menampilkan data tersimpan di perangkat.";
      console.warn("[Firebase] Kuota baca Firestore tercapai saat mengambil pegawai. Menggunakan data cache lokal.");
      return getLocalCache<Employee[]>('ppnpn_employees', []).filter(emp => !isNonPpnpn(emp.id, emp.name));
    }
    console.warn("Gagal mengambil data pegawai dari Firebase, menggunakan cache lokal:", e?.message || e);
    return getLocalCache<Employee[]>('ppnpn_employees', []).filter(emp => !isNonPpnpn(emp.id, emp.name));
  }
};

export const getAttendanceFromFirebase = async (force: boolean = false): Promise<Attendance[] | null> => {
  if (quotaExceededState) {
    return getLocalCache<Attendance[]>('ppnpn_attendance', []);
  }
  if (!force && isCacheValid('attendance')) {
    return getLocalCache<Attendance[]>('ppnpn_attendance', []);
  }
  try {
    const snap = await getDocs(collection(db, 'ppnpn_attendance'));
    markCacheFetched('attendance');
    if (snap.empty) return [];
    return snap.docs
      .map(doc => mapAttendanceFromDb({ id: doc.id, ...doc.data() }))
      .filter(att => !isNonPpnpn(att.employeeId, att.employeeName));
  } catch (e: any) {
    if (isQuotaError(e)) {
      setFirebaseQuotaExceeded(true);
      lastFirebaseError = "Batas kuota harian Firebase Firestore Free Tier tercapai. Menampilkan data absensi lokal.";
      console.warn("[Firebase] Kuota baca Firestore tercapai saat mengambil absensi. Menggunakan data cache lokal.");
      return getLocalCache<Attendance[]>('ppnpn_attendance', []).filter(att => !isNonPpnpn(att.employeeId, att.employeeName));
    }
    console.warn("Gagal mengambil absensi dari Firebase, menggunakan cache lokal:", e?.message || e);
    return getLocalCache<Attendance[]>('ppnpn_attendance', []).filter(att => !isNonPpnpn(att.employeeId, att.employeeName));
  }
};

export const getLeavesFromFirebase = async (force: boolean = false): Promise<LeaveRequest[] | null> => {
  if (quotaExceededState) {
    return getLocalCache<LeaveRequest[]>('ppnpn_leaves', []);
  }
  if (!force && isCacheValid('leaves')) {
    return getLocalCache<LeaveRequest[]>('ppnpn_leaves', []);
  }
  try {
    const snap = await getDocs(collection(db, 'ppnpn_leaves'));
    markCacheFetched('leaves');
    if (snap.empty) return [];
    return snap.docs
      .map(doc => mapLeaveFromDb({ id: doc.id, ...doc.data() }))
      .filter(l => !isNonPpnpn(l.employeeId, l.employeeName));
  } catch (e: any) {
    if (isQuotaError(e)) {
      setFirebaseQuotaExceeded(true);
      lastFirebaseError = "Batas kuota harian Firebase Firestore Free Tier tercapai. Menampilkan data cuti lokal.";
      console.warn("[Firebase] Kuota baca Firestore tercapai saat mengambil data cuti/izin. Menggunakan data cache lokal.");
      return getLocalCache<LeaveRequest[]>('ppnpn_leaves', []).filter(l => !isNonPpnpn(l.employeeId, l.employeeName));
    }
    console.warn("Gagal mengambil data cuti dari Firebase, menggunakan cache lokal:", e?.message || e);
    return getLocalCache<LeaveRequest[]>('ppnpn_leaves', []).filter(l => !isNonPpnpn(l.employeeId, l.employeeName));
  }
};

export const getLogbooksFromFirebase = async (force: boolean = false): Promise<Logbook[] | null> => {
  if (quotaExceededState) {
    return getLocalCache<Logbook[]>('ppnpn_logbooks', []);
  }
  if (!force && isCacheValid('logbooks')) {
    return getLocalCache<Logbook[]>('ppnpn_logbooks', []);
  }
  try {
    const snap = await getDocs(collection(db, 'ppnpn_logbooks'));
    markCacheFetched('logbooks');
    if (snap.empty) return [];
    return snap.docs
      .map(doc => mapLogbookFromDb({ id: doc.id, ...doc.data() }))
      .filter(l => !isNonPpnpn(l.employeeId, l.employeeName));
  } catch (e: any) {
    if (isQuotaError(e)) {
      setFirebaseQuotaExceeded(true);
      lastFirebaseError = "Batas kuota harian Firebase Firestore Free Tier tercapai. Menampilkan data logbook lokal.";
      console.warn("[Firebase] Kuota baca Firestore tercapai saat mengambil logbook. Menggunakan data cache lokal.");
      return getLocalCache<Logbook[]>('ppnpn_logbooks', []).filter(l => !isNonPpnpn(l.employeeId, l.employeeName));
    }
    console.warn("Gagal mengambil logbook dari Firebase, menggunakan cache lokal:", e?.message || e);
    return getLocalCache<Logbook[]>('ppnpn_logbooks', []).filter(l => !isNonPpnpn(l.employeeId, l.employeeName));
  }
};

export const getSettingsFromFirebase = async (force: boolean = false): Promise<OfficeSettings | null> => {
  if (quotaExceededState) {
    return getLocalCache<OfficeSettings | null>('ppnpn_settings', null);
  }
  if (!force && isCacheValid('settings')) {
    return getLocalCache<OfficeSettings | null>('ppnpn_settings', null);
  }
  try {
    const snap = await getDoc(doc(db, 'ppnpn_settings', 'current_settings'));
    markCacheFetched('settings');
    if (!snap.exists()) return null;
    return mapSettingsFromDb(snap.data());
  } catch (e: any) {
    if (isQuotaError(e)) {
      setFirebaseQuotaExceeded(true);
      lastFirebaseError = "Batas kuota harian Firebase Firestore Free Tier tercapai. Menampilkan pengaturan lokal.";
      console.warn("[Firebase] Kuota baca Firestore tercapai saat mengambil pengaturan. Menggunakan cache lokal.");
      return getLocalCache<OfficeSettings | null>('ppnpn_settings', null);
    }
    console.warn("Gagal mengambil pengaturan dari Firebase, menggunakan cache lokal:", e?.message || e);
    return getLocalCache<OfficeSettings | null>('ppnpn_settings', null);
  }
};

export const getOvertimeFromFirebase = async (force: boolean = false): Promise<any[] | null> => {
  if (quotaExceededState) {
    return getLocalCache<any[]>('overtime_attendance_records', []);
  }
  if (!force && isCacheValid('overtime')) {
    return getLocalCache<any[]>('overtime_attendance_records', []);
  }
  try {
    const snap = await getDocs(collection(db, 'ppnpn_overtime_records'));
    markCacheFetched('overtime');
    if (snap.empty) return [];
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e: any) {
    if (isQuotaError(e)) {
      setFirebaseQuotaExceeded(true);
      lastFirebaseError = "Batas kuota harian Firebase Firestore Free Tier tercapai. Menampilkan data lembur lokal.";
      console.warn("[Firebase] Kuota baca Firestore tercapai saat mengambil data lembur. Menggunakan cache lokal.");
      return getLocalCache<any[]>('overtime_attendance_records', []);
    }
    console.warn("Gagal mengambil data lembur dari Firebase, menggunakan cache lokal:", e?.message || e);
    return getLocalCache<any[]>('overtime_attendance_records', []);
  }
};

export const upsertEmployeeToFirebase = async (employee: Employee, throwOnError = false): Promise<boolean> => {
  try {
    const cleanId = (employee?.id || '').trim().toLowerCase();
    if (!cleanId) return false;
    const cleanEmployee = { ...employee, id: cleanId };
    const payload = mapEmployeeToDb(cleanEmployee);
    delete readCacheTimestamps['employees'];
    const writePromise = setDoc(doc(db, 'ppnpn_employees', cleanId), payload, { merge: true });
    // In browser/iframe, prevent any potential promise freeze with a 2-second resolution guarantee
    const fastAckPromise = new Promise(resolve => setTimeout(resolve, 2000));
    await Promise.race([writePromise, fastAckPromise]);
    delete readCacheTimestamps['employees'];
    return true;
  } catch (e: any) {
    delete readCacheTimestamps['employees'];
    if (isQuotaError(e)) {
      setFirebaseQuotaExceeded(true);
      lastFirebaseError = "Batas kuota Firestore tercapai. Data tersimpan di penyimpanan lokal.";
      console.warn("[Firebase] Kuota Firestore tercapai saat menyimpan data pegawai. Tersimpan di penyimpanan lokal.");
      return true;
    }
    console.warn(`Gagal memperbarui pegawai ${employee.id} ke Firebase:`, e?.message || e);
    if (throwOnError) {
      handleFirestoreError(e, OperationType.WRITE, `ppnpn_employees/${employee.id}`);
      throw new Error(e?.message || String(e));
    }
    return false;
  }
};

export const upsertAttendanceToFirebase = async (att: Attendance, throwOnError = false): Promise<boolean> => {
  try {
    const payload = mapAttendanceToDb(att);
    await setDoc(doc(db, 'ppnpn_attendance', att.id), payload, { merge: true });
    return true;
  } catch (e: any) {
    if (isQuotaError(e)) {
      setFirebaseQuotaExceeded(true);
      lastFirebaseError = "Batas kuota Firestore tercapai. Data tersimpan di penyimpanan lokal.";
      console.warn(`[Firebase] Kuota Firestore tercapai saat menyimpan absensi ${att.id}. Tersimpan di penyimpanan lokal.`);
      return true;
    }
    console.warn(`Gagal memperbarui absensi ${att.id} ke Firebase:`, e?.message || e);
    if (throwOnError) {
      handleFirestoreError(e, OperationType.WRITE, `ppnpn_attendance/${att.id}`);
      throw new Error(e?.message || String(e));
    }
    return false;
  }
};

export const deleteAttendanceFromFirebase = async (id: string, throwOnError = false): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, 'ppnpn_attendance', id));
    return true;
  } catch (e: any) {
    if (isQuotaError(e)) {
      setFirebaseQuotaExceeded(true);
      console.warn(`[Firebase] Kuota Firestore tercapai saat menghapus absensi ${id}.`);
      return true;
    }
    console.warn(`Gagal menghapus absensi ${id} dari Firebase:`, e?.message || e);
    if (throwOnError) {
      handleFirestoreError(e, OperationType.DELETE, `ppnpn_attendance/${id}`);
      throw new Error(e?.message || String(e));
    }
    return false;
  }
};

export const upsertLeaveToFirebase = async (leave: LeaveRequest, throwOnError = false): Promise<boolean> => {
  try {
    const payload = mapLeaveToDb(leave);
    await setDoc(doc(db, 'ppnpn_leaves', leave.id), payload, { merge: true });
    return true;
  } catch (e: any) {
    if (isQuotaError(e)) {
      setFirebaseQuotaExceeded(true);
      lastFirebaseError = "Batas kuota Firestore tercapai. Data cuti tersimpan di penyimpanan lokal.";
      console.warn(`[Firebase] Kuota Firestore tercapai saat menyimpan permohonan cuti ${leave.id}. Tersimpan lokal.`);
      return true;
    }
    console.warn(`Gagal memperbarui permohonan cuti ${leave.id} ke Firebase:`, e?.message || e);
    if (throwOnError) {
      handleFirestoreError(e, OperationType.WRITE, `ppnpn_leaves/${leave.id}`);
      throw new Error(e?.message || String(e));
    }
    return false;
  }
};

export const deleteLeaveFromFirebase = async (id: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, 'ppnpn_leaves', id));
    return true;
  } catch (e: any) {
    if (isQuotaError(e)) {
      setFirebaseQuotaExceeded(true);
      return true;
    }
    console.warn(`Gagal menghapus cuti ${id} dari Firebase:`, e?.message || e);
    return false;
  }
};

export const upsertLogbookToFirebase = async (log: Logbook, throwOnError = false): Promise<boolean> => {
  try {
    const payload = mapLogbookToDb(log);
    await setDoc(doc(db, 'ppnpn_logbooks', log.id), payload, { merge: true });
    return true;
  } catch (e: any) {
    if (isQuotaError(e)) {
      setFirebaseQuotaExceeded(true);
      lastFirebaseError = "Batas kuota Firestore tercapai. Logbook tersimpan di penyimpanan lokal.";
      console.warn(`[Firebase] Kuota Firestore tercapai saat menyimpan logbook ${log.id}. Tersimpan lokal.`);
      return true;
    }
    console.warn(`Gagal memperbarui logbook ${log.id} ke Firebase:`, e?.message || e);
    if (throwOnError) {
      handleFirestoreError(e, OperationType.WRITE, `ppnpn_logbooks/${log.id}`);
      throw new Error(e?.message || String(e));
    }
    return false;
  }
};

export const upsertSettingsToFirebase = async (settings: OfficeSettings, throwOnError = false): Promise<boolean> => {
  try {
    const payload = mapSettingsToDb(settings);
    await setDoc(doc(db, 'ppnpn_settings', 'current_settings'), payload, { merge: true });
    return true;
  } catch (e: any) {
    if (isQuotaError(e)) {
      setFirebaseQuotaExceeded(true);
      console.warn("[Firebase] Kuota Firestore tercapai saat menyimpan pengaturan. Tersimpan lokal.");
      return true;
    }
    console.warn("Gagal memperbarui pengaturan ke Firebase:", e?.message || e);
    if (throwOnError) {
      handleFirestoreError(e, OperationType.WRITE, 'ppnpn_settings/current_settings');
      throw new Error(e?.message || String(e));
    }
    return false;
  }
};

export const deleteEmployeeFromFirebase = async (id: string): Promise<boolean> => {
  try {
    delete readCacheTimestamps['employees'];
    await deleteDoc(doc(db, 'ppnpn_employees', id));
    delete readCacheTimestamps['employees'];
    return true;
  } catch (e: any) {
    delete readCacheTimestamps['employees'];
    if (isQuotaError(e)) {
      setFirebaseQuotaExceeded(true);
      return true;
    }
    console.warn(`Gagal menghapus pegawai ${id} dari Firebase:`, e?.message || e);
    return false;
  }
};

export const upsertOvertimeToFirebase = async (rec: any, throwOnError = false): Promise<boolean> => {
  try {
    if (!rec || !rec.id) return false;
    await setDoc(doc(db, 'ppnpn_overtime_records', rec.id), rec, { merge: true });
    return true;
  } catch (e: any) {
    if (isQuotaError(e)) {
      setFirebaseQuotaExceeded(true);
      console.warn("[Firebase] Kuota Firestore tercapai saat menyimpan lembur. Tersimpan lokal.");
      return true;
    }
    console.warn(`Gagal memperbarui rekap lembur ke Firebase:`, e?.message || e);
    if (throwOnError) throw new Error(e?.message || String(e));
    return false;
  }
};

export const subscribeToAttendanceFromFirebase = (callback: (records: Attendance[]) => void) => {
  try {
    return onSnapshot(collection(db, 'ppnpn_attendance'), (snap) => {
      if (!snap.empty) {
        const list = snap.docs
          .map(doc => mapAttendanceFromDb({ id: doc.id, ...doc.data() }))
          .filter(att => !isNonPpnpn(att.employeeId, att.employeeName));
        callback(list);
      }
    }, (error) => {
      console.warn("[Firebase] onSnapshot attendance error:", error?.message || error);
    });
  } catch (err) {
    console.warn("[Firebase] subscribeToAttendanceFromFirebase caught error:", err);
    return () => {};
  }
};

export const subscribeToEmployeesFromFirebase = (callback: (emps: Employee[]) => void) => {
  try {
    return onSnapshot(collection(db, 'ppnpn_employees'), (snap) => {
      if (!snap.empty) {
        const list = snap.docs
          .map(doc => mapEmployeeFromDb({ id: doc.id, ...doc.data() }))
          .filter(emp => !isNonPpnpn(emp.id, emp.name));
        callback(list);
      }
    }, (error) => {
      console.warn("[Firebase] onSnapshot employees error:", error?.message || error);
    });
  } catch (err) {
    console.warn("[Firebase] subscribeToEmployeesFromFirebase caught error:", err);
    return () => {};
  }
};

export const clearAttendanceFromFirebase = async (): Promise<boolean> => {
  if (quotaExceededState) return true;
  try {
    const snap = await getDocs(collection(db, 'ppnpn_attendance'));
    const batch = writeBatch(db);
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    return true;
  } catch (e: any) {
    if (isQuotaError(e)) {
      quotaExceededState = true;
      return true;
    }
    console.warn("Gagal mengosongkan absensi di Firebase:", e?.message || e);
    return false;
  }
};

export const clearLogbooksFromFirebase = async (): Promise<boolean> => {
  if (quotaExceededState) return true;
  try {
    const snap = await getDocs(collection(db, 'ppnpn_logbooks'));
    const batch = writeBatch(db);
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    return true;
  } catch (e: any) {
    if (isQuotaError(e)) {
      quotaExceededState = true;
      return true;
    }
    console.warn("Gagal mengosongkan logbook di Firebase:", e?.message || e);
    return false;
  }
};

export const clearOvertimeFromFirebase = async (): Promise<boolean> => {
  if (quotaExceededState) return true;
  try {
    const snap = await getDocs(collection(db, 'ppnpn_overtime_records'));
    const batch = writeBatch(db);
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    return true;
  } catch (e: any) {
    if (isQuotaError(e)) {
      quotaExceededState = true;
      return true;
    }
    console.warn("Gagal mengosongkan rekap lembur di Firebase:", e?.message || e);
    return false;
  }
};

export const clearLeavesFromFirebase = async (): Promise<boolean> => {
  if (quotaExceededState) return true;
  try {
    const snap = await getDocs(collection(db, 'ppnpn_leaves'));
    const batch = writeBatch(db);
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    return true;
  } catch (e: any) {
    if (isQuotaError(e)) {
      quotaExceededState = true;
      return true;
    }
    console.warn("Gagal mengosongkan data cuti di Firebase:", e?.message || e);
    return false;
  }
};

export const resetEmployeeQuotasTo12InFirebase = async (quota: number = 12): Promise<boolean> => {
  if (quotaExceededState) return true;
  try {
    const snap = await getDocs(collection(db, 'ppnpn_employees'));
    const batch = writeBatch(db);
    snap.docs.forEach(d => batch.update(d.ref, { cuti_quota: quota }));
    await batch.commit();
    return true;
  } catch (e: any) {
    if (isQuotaError(e)) {
      quotaExceededState = true;
      return true;
    }
    console.warn("Gagal mereset kuota cuti pegawai di Firebase:", e?.message || e);
    return false;
  }
};

export const clearTransactionsFromFirebase = async (): Promise<boolean> => {
  try {
    await clearAttendanceFromFirebase();
    await clearLeavesFromFirebase();
    await clearLogbooksFromFirebase();
    await clearOvertimeFromFirebase();
    return true;
  } catch (e: any) {
    console.warn("Gagal mengosongkan transaksi di Firebase:", e?.message || e);
    return false;
  }
};

export const resetAllEmployeeQuotasInFirebase = async (quota: number = 12): Promise<boolean> => {
  return resetEmployeeQuotasTo12InFirebase(quota);
};

export const purgeNonPpnpnFromFirebase = async (): Promise<boolean> => {
  if (quotaExceededState) return true;
  try {
    // 1. Delete by IDs from ppnpn_employees
    for (const id of NON_PPNPN_IDS) {
      try {
        await deleteDoc(doc(db, 'ppnpn_employees', id));
      } catch (err: any) {
        if (isQuotaError(err)) {
          setFirebaseQuotaExceeded(true);
          return true;
        }
      }
    }

    // 2. Query and delete any employees with matching names
    try {
      const snap = await getDocs(collection(db, 'ppnpn_employees'));
      const batch = writeBatch(db);
      let count = 0;
      snap.docs.forEach(d => {
        const data = d.data();
        if (isNonPpnpn(d.id, data.name)) {
          batch.delete(d.ref);
          count++;
        }
      });
      if (count > 0) {
        await batch.commit();
      }
    } catch (err: any) {
      if (isQuotaError(err)) {
        setFirebaseQuotaExceeded(true);
        return true;
      }
    }

    // 3. Delete attendance for non-PPNPN
    try {
      const snap = await getDocs(collection(db, 'ppnpn_attendance'));
      const batch = writeBatch(db);
      let count = 0;
      snap.docs.forEach(d => {
        const data = d.data();
        if (isNonPpnpn(data.employee_id, data.employee_name) || isNonPpnpn(d.id, '')) {
          batch.delete(d.ref);
          count++;
        }
      });
      if (count > 0) {
        await batch.commit();
      }
    } catch (err: any) {
      if (isQuotaError(err)) {
        setFirebaseQuotaExceeded(true);
        return true;
      }
    }

    return true;
  } catch (e: any) {
    if (isQuotaError(e)) {
      setFirebaseQuotaExceeded(true);
      return true;
    }
    console.warn("Gagal membersihkan data non-PPNPN di Firebase:", e?.message || e);
    return false;
  }
};
