import { createClient } from '@supabase/supabase-js';
import { Employee, Attendance, LeaveRequest, Logbook, OfficeSettings } from '../types';

const SUPABASE_URL = (import.meta as any).env.VITE_SUPABASE_URL || "https://dmsceaqpkmcezcleqbtn.supabase.co";
const SUPABASE_ANON_KEY = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtc2NlYXFwa21jZXpjbGVxYnRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3OTk2MDksImV4cCI6MjA5ODM3NTYwOX0.4S3_TS2d6obdMdMaSPqgi5Er4uBBqlSca_AdYUPPgFc";

// Strip trailing /rest/v1/ if present
const cleanUrl = SUPABASE_URL.replace(/\/rest\/v1\/?$/, "");

export const supabase = createClient(cleanUrl, SUPABASE_ANON_KEY);

// Data structure mapping to lowercase snake_case
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
    try { return JSON.parse(val); } catch(e) { return null; }
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
  office_radius_meters: set.officeRadiusMeters,
  office_name: set.officeName,
  sheet_id: set.sheetId || null,
  script_url: set.scriptUrl || null,
  security_shift_pagi_start: set.securityShiftPagiStart || null,
  security_shift_pagi_end: set.securityShiftPagiEnd || null,
  security_shift_pagi_out: set.securityShiftPagiOut || null,
  security_shift_malam_start: set.securityShiftMalamStart || null,
  security_shift_malam_end: set.securityShiftMalamEnd || null,
  security_shift_malam_out: set.securityShiftMalamOut || null
});

export const mapSettingsFromDb = (row: any): OfficeSettings => ({
  checkInStart: row.check_in_start || "07:30",
  checkInEnd: row.check_in_end || "08:15",
  checkOutStart: row.check_out_start || "17:00",
  officeLat: row.office_lat || 0.4735,
  officeLng: row.office_lng || 101.4478,
  officeRadiusMeters: row.office_radius_meters || 500,
  officeName: row.office_name || "Pekanbaru",
  sheetId: row.sheet_id || '',
  scriptUrl: row.script_url || '',
  securityShiftPagiStart: row.security_shift_pagi_start || undefined,
  securityShiftPagiEnd: row.security_shift_pagi_end || undefined,
  securityShiftPagiOut: row.security_shift_pagi_out || undefined,
  securityShiftMalamStart: row.security_shift_malam_start || undefined,
  securityShiftMalamEnd: row.security_shift_malam_end || undefined,
  securityShiftMalamOut: row.security_shift_malam_out || undefined
});

// Database checking and utilities
export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.from('ppnpn_settings').select('id').limit(1);
    if (error) {
      console.warn("Supabase connection warning (tables might not exist):", error);
      return false;
    }
    return true;
  } catch (e) {
    console.error("Supabase connection failed:", e);
    return false;
  }
};

// --- DATA ACCESS METHODS ---

export const getEmployeesFromSupabase = async (): Promise<Employee[] | null> => {
  try {
    const { data, error } = await supabase.from('ppnpn_employees').select('*');
    if (error) throw error;
    return data.map(mapEmployeeFromDb);
  } catch (e) {
    console.error("Failed to fetch employees from Supabase:", e);
    return null;
  }
};

export const getAttendanceFromSupabase = async (): Promise<Attendance[] | null> => {
  try {
    const { data, error } = await supabase.from('ppnpn_attendance').select('*');
    if (error) throw error;
    return data.map(mapAttendanceFromDb);
  } catch (e) {
    console.error("Failed to fetch attendance from Supabase:", e);
    return null;
  }
};

export const getLeavesFromSupabase = async (): Promise<LeaveRequest[] | null> => {
  try {
    const { data, error } = await supabase.from('ppnpn_leaves').select('*');
    if (error) throw error;
    return data.map(mapLeaveFromDb);
  } catch (e) {
    console.error("Failed to fetch leaves from Supabase:", e);
    return null;
  }
};

export const getLogbooksFromSupabase = async (): Promise<Logbook[] | null> => {
  try {
    const { data, error } = await supabase.from('ppnpn_logbooks').select('*');
    if (error) throw error;
    return data.map(mapLogbookFromDb);
  } catch (e) {
    console.error("Failed to fetch logbooks from Supabase:", e);
    return null;
  }
};

export const getSettingsFromSupabase = async (): Promise<OfficeSettings | null> => {
  try {
    const { data, error } = await supabase.from('ppnpn_settings').select('*').eq('id', 'current_settings').single();
    if (error) throw error;
    return mapSettingsFromDb(data);
  } catch (e) {
    console.error("Failed to fetch settings from Supabase:", e);
    return null;
  }
};

// --- WRITE OPERATIONS ---

export const upsertEmployeeToSupabase = async (employee: Employee, throwOnError = false): Promise<boolean> => {
  try {
    const payload = mapEmployeeToDb(employee);
    const { error } = await supabase.from('ppnpn_employees').upsert(payload);
    if (error) throw error;
    return true;
  } catch (e: any) {
    const errMsg = e?.message || e?.details || JSON.stringify(e) || String(e);
    console.error(`Failed to upsert employee ${employee.id} to Supabase: ${errMsg}`, e);
    if (throwOnError) throw new Error(errMsg);
    return false;
  }
};

export const upsertAttendanceToSupabase = async (att: Attendance, throwOnError = false): Promise<boolean> => {
  try {
    const payload = mapAttendanceToDb(att);
    const { error } = await supabase.from('ppnpn_attendance').upsert(payload);
    if (error) throw error;
    return true;
  } catch (e: any) {
    const errMsg = e?.message || e?.details || JSON.stringify(e) || String(e);
    console.error(`Failed to upsert attendance ${att.id} to Supabase: ${errMsg}`, e);
    if (throwOnError) throw new Error(errMsg);
    return false;
  }
};

export const deleteAttendanceFromSupabase = async (id: string, throwOnError = false): Promise<boolean> => {
  try {
    const { error } = await supabase.from('ppnpn_attendance').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (e: any) {
    const errMsg = e?.message || e?.details || JSON.stringify(e) || String(e);
    console.error(`Failed to delete attendance record ${id} from Supabase: ${errMsg}`, e);
    if (throwOnError) throw new Error(errMsg);
    return false;
  }
};

export const upsertLeaveToSupabase = async (leave: LeaveRequest, throwOnError = false): Promise<boolean> => {
  try {
    const payload = mapLeaveToDb(leave);
    const { error } = await supabase.from('ppnpn_leaves').upsert(payload);
    if (error) throw error;
    return true;
  } catch (e: any) {
    const errMsg = e?.message || e?.details || JSON.stringify(e) || String(e);
    console.error(`Failed to upsert leave request ${leave.id} to Supabase: ${errMsg}`, e);
    if (throwOnError) throw new Error(errMsg);
    return false;
  }
};

export const upsertLogbookToSupabase = async (log: Logbook, throwOnError = false): Promise<boolean> => {
  try {
    const payload = mapLogbookToDb(log);
    const { error } = await supabase.from('ppnpn_logbooks').upsert(payload);
    if (error) throw error;
    return true;
  } catch (e: any) {
    const errMsg = e?.message || e?.details || JSON.stringify(e) || String(e);
    console.error(`Failed to upsert logbook ${log.id} to Supabase: ${errMsg}`, e);
    if (throwOnError) throw new Error(errMsg);
    return false;
  }
};

export const upsertSettingsToSupabase = async (settings: OfficeSettings, throwOnError = false): Promise<boolean> => {
  try {
    const payload = mapSettingsToDb(settings);
    const { error } = await supabase.from('ppnpn_settings').upsert(payload);
    if (error) throw error;
    return true;
  } catch (e: any) {
    const errMsg = e?.message || e?.details || JSON.stringify(e) || String(e);
    console.error(`Failed to upsert settings to Supabase: ${errMsg}`, e);
    if (throwOnError) throw new Error(errMsg);
    return false;
  }
};

export const deleteEmployeeFromSupabase = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from('ppnpn_employees').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (e) {
    console.error(`Failed to delete employee ${id} from Supabase:`, e);
    return false;
  }
};

export const deleteLeaveFromSupabase = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from('ppnpn_leaves').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (e) {
    console.error(`Failed to delete leave ${id} from Supabase:`, e);
    return false;
  }
};

// --- OVERTIME RECORDS ---
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
}

export const mapOvertimeToDb = (rec: OvertimeAttendanceRecord) => ({
  id: rec.id,
  employee_id: rec.employeeId,
  employee_name: rec.employeeName,
  date: rec.date,
  clock_in: rec.clockIn || null,
  clock_out: rec.clockOut || null,
  clock_in_photo: rec.clockInPhoto || null,
  clock_out_photo: rec.clockOutPhoto || null,
  clock_in_location: rec.clockInLocation ? JSON.stringify(rec.clockInLocation) : null,
  clock_out_location: rec.clockOutLocation ? JSON.stringify(rec.clockOutLocation) : null,
  clock_in_address: rec.clockInAddress || null,
  clock_out_address: rec.clockOutAddress || null,
  hours: rec.hours || 0
});

export const mapOvertimeFromDb = (row: any): OvertimeAttendanceRecord => {
  const parseJson = (val: any) => {
    if (!val) return null;
    if (typeof val === 'object') return val;
    try { return JSON.parse(val); } catch(e) { return null; }
  };
  return {
    id: row.id,
    employeeId: row.employee_id,
    employeeName: row.employee_name,
    date: row.date,
    clockIn: row.clock_in,
    clockOut: row.clock_out,
    clockInPhoto: row.clock_in_photo,
    clockOutPhoto: row.clock_out_photo,
    clockInLocation: parseJson(row.clock_in_location),
    clockOutLocation: parseJson(row.clock_out_location),
    clockInAddress: row.clock_in_address,
    clockOutAddress: row.clock_out_address,
    hours: row.hours || 0
  };
};

export const getOvertimeFromSupabase = async (): Promise<OvertimeAttendanceRecord[] | null> => {
  try {
    const { data, error } = await supabase.from('ppnpn_overtime_records').select('*');
    if (error) throw error;
    return data.map(mapOvertimeFromDb);
  } catch (e) {
    console.error("Failed to fetch overtime records from Supabase:", e);
    return null;
  }
};

export const upsertOvertimeToSupabase = async (rec: OvertimeAttendanceRecord, throwOnError = false): Promise<boolean> => {
  try {
    const payload = mapOvertimeToDb(rec);
    const { error } = await supabase.from('ppnpn_overtime_records').upsert(payload);
    if (error) throw error;
    return true;
  } catch (e: any) {
    const errMsg = e?.message || e?.details || JSON.stringify(e) || String(e);
    console.error(`Failed to upsert overtime record ${rec.id} to Supabase: ${errMsg}`, e);
    if (throwOnError) throw new Error(errMsg);
    return false;
  }
};

export const clearTransactionsFromSupabase = async (): Promise<boolean> => {
  try {
    await supabase.from('ppnpn_attendance').delete().neq('id', '_none_');
    await supabase.from('ppnpn_leaves').delete().neq('id', '_none_');
    await supabase.from('ppnpn_logbooks').delete().neq('id', '_none_');
    await supabase.from('ppnpn_overtime_records').delete().neq('id', '_none_');
    return true;
  } catch (e) {
    console.error("Failed to clear transactions from Supabase:", e);
    return false;
  }
};

export const resetAllEmployeeQuotasInSupabase = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.from('ppnpn_employees').update({ cuti_quota: 0 }).neq('id', '_none_');
    if (error) throw error;
    return true;
  } catch (e) {
    console.error("Failed to reset employee quotas in Supabase:", e);
    return false;
  }
};

// SQL creation script for easy execution in Supabase SQL Editor
export const SQL_CREATION_SCRIPT = `-- SQL Script untuk Inisialisasi Database Supabase (sapariau)
-- Salin dan jalankan script ini di SQL Editor Supabase Anda!

-- 1. Tabel Karyawan / PPNPN
CREATE TABLE IF NOT EXISTS ppnpn_employees (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL,
  password TEXT NOT NULL,
  position TEXT,
  photo_url TEXT,
  join_date TEXT,
  cuti_quota INTEGER DEFAULT 12,
  shift TEXT,
  status TEXT DEFAULT 'aktif'
);

-- 2. Tabel Presensi / Absensi
CREATE TABLE IF NOT EXISTS ppnpn_attendance (
  id TEXT PRIMARY KEY,
  employee_id TEXT,
  employee_name TEXT,
  date TEXT NOT NULL,
  check_in TEXT,
  check_out TEXT,
  check_in_photo TEXT,
  check_out_photo TEXT,
  check_in_location JSONB,
  check_out_location JSONB,
  check_in_address TEXT,
  check_out_address TEXT,
  check_in_status TEXT,
  check_out_status TEXT,
  logbook_notes TEXT,
  shift TEXT
);

-- 3. Tabel Pengajuan Cuti / Izin / Sakit
CREATE TABLE IF NOT EXISTS ppnpn_leaves (
  id TEXT PRIMARY KEY,
  employee_id TEXT,
  employee_name TEXT,
  type TEXT,
  start_date TEXT,
  end_date TEXT,
  reason TEXT,
  status TEXT DEFAULT 'Pending',
  created_at TEXT,
  approved_by TEXT,
  approved_date TEXT,
  work_days INTEGER,
  address TEXT,
  backup1 TEXT,
  backup2 TEXT
);

-- 4. Tabel Logbook Harian
CREATE TABLE IF NOT EXISTS ppnpn_logbooks (
  id TEXT PRIMARY KEY,
  employee_id TEXT,
  employee_name TEXT,
  date TEXT,
  time TEXT,
  content TEXT,
  status TEXT DEFAULT 'Pending',
  approved_by TEXT
);

-- 5. Tabel Pengaturan Kantor
CREATE TABLE IF NOT EXISTS ppnpn_settings (
  id TEXT PRIMARY KEY,
  check_in_start TEXT,
  check_in_end TEXT,
  check_out_start TEXT,
  office_lat DOUBLE PRECISION,
  office_lng DOUBLE PRECISION,
  office_radius_meters INTEGER,
  office_name TEXT,
  sheet_id TEXT,
  script_url TEXT,
  security_shift_pagi_start TEXT,
  security_shift_pagi_end TEXT,
  security_shift_pagi_out TEXT,
  security_shift_malam_start TEXT,
  security_shift_malam_end TEXT,
  security_shift_malam_out TEXT
);

-- 6. Tabel Absen Lembur PPNPN
CREATE TABLE IF NOT EXISTS ppnpn_overtime_records (
  id TEXT PRIMARY KEY,
  employee_id TEXT,
  employee_name TEXT,
  date TEXT NOT NULL,
  clock_in TEXT,
  clock_out TEXT,
  clock_in_photo TEXT,
  clock_out_photo TEXT,
  clock_in_location JSONB,
  clock_out_location JSONB,
  clock_in_address TEXT,
  clock_out_address TEXT,
  hours DOUBLE PRECISION DEFAULT 0
);

-- Nonaktifkan Row Level Security (RLS) agar sinkronisasi client berjalan dengan lancar
ALTER TABLE ppnpn_employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE ppnpn_attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE ppnpn_leaves DISABLE ROW LEVEL SECURITY;
ALTER TABLE ppnpn_logbooks DISABLE ROW LEVEL SECURITY;
ALTER TABLE ppnpn_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE ppnpn_overtime_records DISABLE ROW LEVEL SECURITY;

-- Backup: Jika RLS diaktifkan kembali, buat policy ALL (SELECT, INSERT, UPDATE, DELETE) untuk public/anon
DROP POLICY IF EXISTS "Allow public write employees" ON ppnpn_employees;
CREATE POLICY "Allow public write employees" ON ppnpn_employees FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public write attendance" ON ppnpn_attendance;
CREATE POLICY "Allow public write attendance" ON ppnpn_attendance FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public write leaves" ON ppnpn_leaves;
CREATE POLICY "Allow public write leaves" ON ppnpn_leaves FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public write logbooks" ON ppnpn_logbooks;
CREATE POLICY "Allow public write logbooks" ON ppnpn_logbooks FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public write settings" ON ppnpn_settings;
CREATE POLICY "Allow public write settings" ON ppnpn_settings FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public write overtime" ON ppnpn_overtime_records;
CREATE POLICY "Allow public write overtime" ON ppnpn_overtime_records FOR ALL TO public USING (true) WITH CHECK (true);

-- Aktifkan Realtime untuk kemudahan sinkronisasi instan
ALTER PUBLICATION supabase_realtime ADD TABLE ppnpn_employees;
ALTER PUBLICATION supabase_realtime ADD TABLE ppnpn_attendance;
ALTER PUBLICATION supabase_realtime ADD TABLE ppnpn_leaves;
ALTER PUBLICATION supabase_realtime ADD TABLE ppnpn_logbooks;
ALTER PUBLICATION supabase_realtime ADD TABLE ppnpn_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE ppnpn_overtime_records;
`;
