// Redirect layer forwarding all database calls to Firebase Firestore
import {
  checkFirebaseConnection,
  getEmployeesFromFirebase,
  getAttendanceFromFirebase,
  getLeavesFromFirebase,
  getLogbooksFromFirebase,
  getSettingsFromFirebase,
  getOvertimeFromFirebase,
  upsertEmployeeToFirebase,
  upsertAttendanceToFirebase,
  deleteAttendanceFromFirebase,
  upsertLeaveToFirebase,
  deleteLeaveFromFirebase,
  upsertLogbookToFirebase,
  upsertSettingsToFirebase,
  deleteEmployeeFromFirebase,
  upsertOvertimeToFirebase,
  clearAttendanceFromFirebase,
  clearLogbooksFromFirebase,
  clearOvertimeFromFirebase,
  clearLeavesFromFirebase,
  resetEmployeeQuotasTo12InFirebase,
  clearTransactionsFromFirebase,
  resetAllEmployeeQuotasInFirebase,
  getLastFirebaseError,
  isFirebaseQuotaExceeded,
  isQuotaError,
  mapEmployeeToDb,
  mapEmployeeFromDb,
  mapAttendanceToDb,
  mapAttendanceFromDb,
  mapLeaveToDb,
  mapLeaveFromDb,
  mapLogbookToDb,
  mapLogbookFromDb,
  mapSettingsToDb,
  mapSettingsFromDb,
  activeFirebaseConfig,
  db
} from './firebase';

export {
  db,
  activeFirebaseConfig,
  isFirebaseQuotaExceeded,
  isQuotaError,
  mapEmployeeToDb,
  mapEmployeeFromDb,
  mapAttendanceToDb,
  mapAttendanceFromDb,
  mapLeaveToDb,
  mapLeaveFromDb,
  mapLogbookToDb,
  mapLogbookFromDb,
  mapSettingsToDb,
  mapSettingsFromDb
};

export interface OvertimeAttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  clockInPhoto: string | null;
  clockOutPhoto: string | null;
  clockInLocation: { lat: number; lng: number } | null;
  clockOutLocation: { lat: number; lng: number } | null;
  clockInAddress: string | null;
  clockOutAddress: string | null;
  hours: number;
  status?: 'Pending' | 'Approved' | 'Rejected';
}

export const getLastSupabaseError = getLastFirebaseError;
export const isSupabaseQuotaExceeded = isFirebaseQuotaExceeded;

export const checkSupabaseConnection = checkFirebaseConnection;
export const getEmployeesFromSupabase = getEmployeesFromFirebase;
export const getAttendanceFromSupabase = getAttendanceFromFirebase;
export const getLeavesFromSupabase = getLeavesFromFirebase;
export const getLogbooksFromSupabase = getLogbooksFromFirebase;
export const getSettingsFromSupabase = getSettingsFromFirebase;
export const getOvertimeFromSupabase = getOvertimeFromFirebase;

export const upsertEmployeeToSupabase = upsertEmployeeToFirebase;
export const upsertAttendanceToSupabase = upsertAttendanceToFirebase;
export const deleteAttendanceFromSupabase = deleteAttendanceFromFirebase;
export const upsertLeaveToSupabase = upsertLeaveToFirebase;
export const deleteLeaveFromSupabase = deleteLeaveFromFirebase;
export const upsertLogbookToSupabase = upsertLogbookToFirebase;
export const upsertSettingsToSupabase = upsertSettingsToFirebase;
export const deleteEmployeeFromSupabase = deleteEmployeeFromFirebase;
export const upsertOvertimeToSupabase = upsertOvertimeToFirebase;

export const clearAttendanceFromSupabase = clearAttendanceFromFirebase;
export const clearLogbooksFromSupabase = clearLogbooksFromFirebase;
export const clearOvertimeFromSupabase = clearOvertimeFromFirebase;
export const clearLeavesFromSupabase = clearLeavesFromFirebase;
export const resetEmployeeQuotasTo12InSupabase = resetEmployeeQuotasTo12InFirebase;
export const clearTransactionsFromSupabase = clearTransactionsFromFirebase;
export const resetAllEmployeeQuotasInSupabase = resetAllEmployeeQuotasInFirebase;

export const SQL_CREATION_SCRIPT = `-- Firebase Firestore Database Inisialisasi
-- Aplikasi PPNPN telah bermigrasi penuh ke Firebase Firestore!
-- Tidak memerlukan manual SQL script, seluruh koleksi & aturan telah aktif di Firebase.`;
