import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { Employee, Attendance, LeaveRequest, Logbook, OfficeSettings } from '../types';
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
const app = !getApps().length ? initializeApp(activeFirebaseConfig) : getApp();

// Initialize Firestore with specific databaseId if provided
export const db = getFirestore(
  app,
  (activeFirebaseConfig as any).firestoreDatabaseId || '(default)'
);

// Mappers to ensure data consistency
export const mapEmployeeToDb = (emp: Employee) => ({
  id: emp.id,
  name: emp.name,
  email: emp.email,
  role: emp.role,
  password: emp.password,
  position: emp.position,
  photo_url: emp.photoUrl || null,
  join_date: emp.joinDate,
  cuti_quota: emp.cutiQuota,
  shift: emp.shift || null,
  status: emp.status || 'aktif'
});

export const mapEmployeeFromDb = (row: any): Employee => ({
  id: row.id,
  name: row.name,
  email: row.email,
  role: row.role as any,
  password: row.password,
  position: row.position,
  photoUrl: row.photo_url || undefined,
  joinDate: row.join_date,
  cutiQuota: row.cuti_quota ?? 12,
  shift: row.shift || undefined,
  status: row.status || 'aktif'
});

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

let lastFirebaseError: string | null = null;
let quotaExceededState = false;

export const isFirebaseQuotaExceeded = (): boolean => quotaExceededState;
export const setFirebaseQuotaExceeded = (val: boolean) => { quotaExceededState = val; };
export const getLastFirebaseError = (): string | null => lastFirebaseError;

const getLocalCache = <T>(key: string, fallback: T): T => {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
};

export const checkFirebaseConnection = async (): Promise<boolean> => {
  if (quotaExceededState) {
    return false;
  }
  try {
    const docRef = doc(db, 'ppnpn_settings', 'health_check');
    await setDoc(docRef, { ping: true, timestamp: Date.now() }, { merge: true });
    lastFirebaseError = null;
    return true;
  } catch (e: any) {
    if (isQuotaError(e)) {
      quotaExceededState = true;
      lastFirebaseError = "Batas kuota harian Firebase Firestore Free Tier (50.000 read/hari) telah tercapai. Sistem otomatis beroperasi dalam mode offline lokal.";
      console.warn("[Firebase] Kuota harian Firestore tercapai saat uji koneksi. Beralih ke cache lokal.");
      return false;
    }
    console.warn("Pemeriksaan koneksi Firebase gagal:", e?.message || e);
    lastFirebaseError = e?.message || "Gagal terhubung ke Firebase Firestore.";
    return false;
  }
};

export const getEmployeesFromFirebase = async (): Promise<Employee[] | null> => {
  if (quotaExceededState) {
    return getLocalCache<Employee[]>('ppnpn_employees', []);
  }
  try {
    const snap = await getDocs(collection(db, 'ppnpn_employees'));
    if (snap.empty) return [];
    return snap.docs.map(doc => mapEmployeeFromDb({ id: doc.id, ...doc.data() }));
  } catch (e: any) {
    if (isQuotaError(e)) {
      quotaExceededState = true;
      lastFirebaseError = "Batas kuota harian Firebase Firestore Free Tier tercapai. Menampilkan data tersimpan di perangkat.";
      console.warn("[Firebase] Kuota baca Firestore tercapai saat mengambil pegawai. Menggunakan data cache lokal.");
      return getLocalCache<Employee[]>('ppnpn_employees', []);
    }
    console.warn("Gagal mengambil data pegawai dari Firebase, menggunakan cache lokal:", e?.message || e);
    return getLocalCache<Employee[]>('ppnpn_employees', []);
  }
};

export const getAttendanceFromFirebase = async (): Promise<Attendance[] | null> => {
  if (quotaExceededState) {
    return getLocalCache<Attendance[]>('ppnpn_attendance', []);
  }
  try {
    const snap = await getDocs(collection(db, 'ppnpn_attendance'));
    if (snap.empty) return [];
    return snap.docs.map(doc => mapAttendanceFromDb({ id: doc.id, ...doc.data() }));
  } catch (e: any) {
    if (isQuotaError(e)) {
      quotaExceededState = true;
      lastFirebaseError = "Batas kuota harian Firebase Firestore Free Tier tercapai. Menampilkan data absensi lokal.";
      console.warn("[Firebase] Kuota baca Firestore tercapai saat mengambil absensi. Menggunakan data cache lokal.");
      return getLocalCache<Attendance[]>('ppnpn_attendance', []);
    }
    console.warn("Gagal mengambil absensi dari Firebase, menggunakan cache lokal:", e?.message || e);
    return getLocalCache<Attendance[]>('ppnpn_attendance', []);
  }
};

export const getLeavesFromFirebase = async (): Promise<LeaveRequest[] | null> => {
  if (quotaExceededState) {
    return getLocalCache<LeaveRequest[]>('ppnpn_leaves', []);
  }
  try {
    const snap = await getDocs(collection(db, 'ppnpn_leaves'));
    if (snap.empty) return [];
    return snap.docs.map(doc => mapLeaveFromDb({ id: doc.id, ...doc.data() }));
  } catch (e: any) {
    if (isQuotaError(e)) {
      quotaExceededState = true;
      lastFirebaseError = "Batas kuota harian Firebase Firestore Free Tier tercapai. Menampilkan data cuti lokal.";
      console.warn("[Firebase] Kuota baca Firestore tercapai saat mengambil data cuti/izin. Menggunakan data cache lokal.");
      return getLocalCache<LeaveRequest[]>('ppnpn_leaves', []);
    }
    console.warn("Gagal mengambil data cuti dari Firebase, menggunakan cache lokal:", e?.message || e);
    return getLocalCache<LeaveRequest[]>('ppnpn_leaves', []);
  }
};

export const getLogbooksFromFirebase = async (): Promise<Logbook[] | null> => {
  if (quotaExceededState) {
    return getLocalCache<Logbook[]>('ppnpn_logbooks', []);
  }
  try {
    const snap = await getDocs(collection(db, 'ppnpn_logbooks'));
    if (snap.empty) return [];
    return snap.docs.map(doc => mapLogbookFromDb({ id: doc.id, ...doc.data() }));
  } catch (e: any) {
    if (isQuotaError(e)) {
      quotaExceededState = true;
      lastFirebaseError = "Batas kuota harian Firebase Firestore Free Tier tercapai. Menampilkan data logbook lokal.";
      console.warn("[Firebase] Kuota baca Firestore tercapai saat mengambil logbook. Menggunakan data cache lokal.");
      return getLocalCache<Logbook[]>('ppnpn_logbooks', []);
    }
    console.warn("Gagal mengambil logbook dari Firebase, menggunakan cache lokal:", e?.message || e);
    return getLocalCache<Logbook[]>('ppnpn_logbooks', []);
  }
};

export const getSettingsFromFirebase = async (): Promise<OfficeSettings | null> => {
  if (quotaExceededState) {
    return getLocalCache<OfficeSettings | null>('ppnpn_settings', null);
  }
  try {
    const snap = await getDoc(doc(db, 'ppnpn_settings', 'current_settings'));
    if (!snap.exists()) return null;
    return mapSettingsFromDb(snap.data());
  } catch (e: any) {
    if (isQuotaError(e)) {
      quotaExceededState = true;
      lastFirebaseError = "Batas kuota harian Firebase Firestore Free Tier tercapai. Menampilkan pengaturan lokal.";
      console.warn("[Firebase] Kuota baca Firestore tercapai saat mengambil pengaturan. Menggunakan cache lokal.");
      return getLocalCache<OfficeSettings | null>('ppnpn_settings', null);
    }
    console.warn("Gagal mengambil pengaturan dari Firebase, menggunakan cache lokal:", e?.message || e);
    return getLocalCache<OfficeSettings | null>('ppnpn_settings', null);
  }
};

export const getOvertimeFromFirebase = async (): Promise<any[] | null> => {
  if (quotaExceededState) {
    return getLocalCache<any[]>('overtime_attendance_records', []);
  }
  try {
    const snap = await getDocs(collection(db, 'ppnpn_overtime_records'));
    if (snap.empty) return [];
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e: any) {
    if (isQuotaError(e)) {
      quotaExceededState = true;
      lastFirebaseError = "Batas kuota harian Firebase Firestore Free Tier tercapai. Menampilkan data lembur lokal.";
      console.warn("[Firebase] Kuota baca Firestore tercapai saat mengambil data lembur. Menggunakan cache lokal.");
      return getLocalCache<any[]>('overtime_attendance_records', []);
    }
    console.warn("Gagal mengambil data lembur dari Firebase, menggunakan cache lokal:", e?.message || e);
    return getLocalCache<any[]>('overtime_attendance_records', []);
  }
};

export const upsertEmployeeToFirebase = async (employee: Employee, throwOnError = false): Promise<boolean> => {
  if (quotaExceededState) {
    console.warn("[Firebase] Mode offline aktif karena kuota Firestore tercapai. Data pegawai tersimpan di penyimpanan lokal.");
    return true;
  }
  try {
    const payload = mapEmployeeToDb(employee);
    await setDoc(doc(db, 'ppnpn_employees', employee.id), payload, { merge: true });
    return true;
  } catch (e: any) {
    if (isQuotaError(e)) {
      quotaExceededState = true;
      lastFirebaseError = "Batas kuota Firestore tercapai. Data tersimpan di penyimpanan lokal.";
      console.warn("[Firebase] Kuota Firestore tercapai saat menyimpan data pegawai. Tersimpan di penyimpanan lokal.");
      return true;
    }
    console.warn(`Gagal memperbarui pegawai ${employee.id} ke Firebase:`, e?.message || e);
    if (throwOnError) throw new Error(e?.message || String(e));
    return false;
  }
};

export const upsertAttendanceToFirebase = async (att: Attendance, throwOnError = false): Promise<boolean> => {
  if (quotaExceededState) {
    console.warn("[Firebase] Mode offline aktif karena kuota Firestore tercapai. Data absensi tersimpan di penyimpanan lokal.");
    return true;
  }
  try {
    const payload = mapAttendanceToDb(att);
    await setDoc(doc(db, 'ppnpn_attendance', att.id), payload, { merge: true });
    return true;
  } catch (e: any) {
    if (isQuotaError(e)) {
      quotaExceededState = true;
      lastFirebaseError = "Batas kuota Firestore tercapai. Data tersimpan di penyimpanan lokal.";
      console.warn(`[Firebase] Kuota Firestore tercapai saat menyimpan absensi ${att.id}. Tersimpan di penyimpanan lokal.`);
      return true;
    }
    console.warn(`Gagal memperbarui absensi ${att.id} ke Firebase:`, e?.message || e);
    if (throwOnError) throw new Error(e?.message || String(e));
    return false;
  }
};

export const deleteAttendanceFromFirebase = async (id: string, throwOnError = false): Promise<boolean> => {
  if (quotaExceededState) {
    console.warn("[Firebase] Mode offline aktif karena kuota Firestore tercapai. Penghapusan absensi lokal.");
    return true;
  }
  try {
    await deleteDoc(doc(db, 'ppnpn_attendance', id));
    return true;
  } catch (e: any) {
    if (isQuotaError(e)) {
      quotaExceededState = true;
      console.warn(`[Firebase] Kuota Firestore tercapai saat menghapus absensi ${id}.`);
      return true;
    }
    console.warn(`Gagal menghapus absensi ${id} dari Firebase:`, e?.message || e);
    if (throwOnError) throw new Error(e?.message || String(e));
    return false;
  }
};

export const upsertLeaveToFirebase = async (leave: LeaveRequest, throwOnError = false): Promise<boolean> => {
  if (quotaExceededState) {
    console.warn("[Firebase] Mode offline aktif karena kuota Firestore tercapai. Permohonan cuti tersimpan di penyimpanan lokal.");
    return true;
  }
  try {
    const payload = mapLeaveToDb(leave);
    await setDoc(doc(db, 'ppnpn_leaves', leave.id), payload, { merge: true });
    return true;
  } catch (e: any) {
    if (isQuotaError(e)) {
      quotaExceededState = true;
      lastFirebaseError = "Batas kuota Firestore tercapai. Data cuti tersimpan di penyimpanan lokal.";
      console.warn(`[Firebase] Kuota Firestore tercapai saat menyimpan permohonan cuti ${leave.id}. Tersimpan lokal.`);
      return true;
    }
    console.warn(`Gagal memperbarui permohonan cuti ${leave.id} ke Firebase:`, e?.message || e);
    if (throwOnError) throw new Error(e?.message || String(e));
    return false;
  }
};

export const deleteLeaveFromFirebase = async (id: string): Promise<boolean> => {
  if (quotaExceededState) {
    return true;
  }
  try {
    await deleteDoc(doc(db, 'ppnpn_leaves', id));
    return true;
  } catch (e: any) {
    if (isQuotaError(e)) {
      quotaExceededState = true;
      return true;
    }
    console.warn(`Gagal menghapus cuti ${id} dari Firebase:`, e?.message || e);
    return false;
  }
};

export const upsertLogbookToFirebase = async (log: Logbook, throwOnError = false): Promise<boolean> => {
  if (quotaExceededState) {
    console.warn("[Firebase] Mode offline aktif karena kuota Firestore tercapai. Catatan logbook tersimpan lokal.");
    return true;
  }
  try {
    const payload = mapLogbookToDb(log);
    await setDoc(doc(db, 'ppnpn_logbooks', log.id), payload, { merge: true });
    return true;
  } catch (e: any) {
    if (isQuotaError(e)) {
      quotaExceededState = true;
      lastFirebaseError = "Batas kuota Firestore tercapai. Logbook tersimpan di penyimpanan lokal.";
      console.warn(`[Firebase] Kuota Firestore tercapai saat menyimpan logbook ${log.id}. Tersimpan lokal.`);
      return true;
    }
    console.warn(`Gagal memperbarui logbook ${log.id} ke Firebase:`, e?.message || e);
    if (throwOnError) throw new Error(e?.message || String(e));
    return false;
  }
};

export const upsertSettingsToFirebase = async (settings: OfficeSettings, throwOnError = false): Promise<boolean> => {
  if (quotaExceededState) {
    return true;
  }
  try {
    const payload = mapSettingsToDb(settings);
    await setDoc(doc(db, 'ppnpn_settings', 'current_settings'), payload, { merge: true });
    return true;
  } catch (e: any) {
    if (isQuotaError(e)) {
      quotaExceededState = true;
      console.warn("[Firebase] Kuota Firestore tercapai saat menyimpan pengaturan. Tersimpan lokal.");
      return true;
    }
    console.warn("Gagal memperbarui pengaturan ke Firebase:", e?.message || e);
    if (throwOnError) throw new Error(e?.message || String(e));
    return false;
  }
};

export const deleteEmployeeFromFirebase = async (id: string): Promise<boolean> => {
  if (quotaExceededState) {
    return true;
  }
  try {
    await deleteDoc(doc(db, 'ppnpn_employees', id));
    return true;
  } catch (e: any) {
    if (isQuotaError(e)) {
      quotaExceededState = true;
      return true;
    }
    console.warn(`Gagal menghapus pegawai ${id} dari Firebase:`, e?.message || e);
    return false;
  }
};

export const upsertOvertimeToFirebase = async (rec: any, throwOnError = false): Promise<boolean> => {
  if (quotaExceededState) {
    return true;
  }
  try {
    if (!rec || !rec.id) return false;
    await setDoc(doc(db, 'ppnpn_overtime_records', rec.id), rec, { merge: true });
    return true;
  } catch (e: any) {
    if (isQuotaError(e)) {
      quotaExceededState = true;
      console.warn("[Firebase] Kuota Firestore tercapai saat menyimpan lembur. Tersimpan lokal.");
      return true;
    }
    console.warn(`Gagal memperbarui rekap lembur ke Firebase:`, e?.message || e);
    if (throwOnError) throw new Error(e?.message || String(e));
    return false;
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
