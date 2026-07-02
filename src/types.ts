export type Role = 'admin' | 'karyawan';

export interface Employee {
  id: string; // NIP or ID
  name: string;
  email: string;
  role: Role;
  password: string;
  position: string;
  photoUrl?: string;
  joinDate: string;
  cutiQuota: number;
  shift?: 'pagi' | 'malam'; // Security Shift Pagi atau Malam
  status?: 'aktif' | 'pindah' | 'tidak aktif';
}

export interface Attendance {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string; // YYYY-MM-DD
  checkIn: string | null; // HH:MM
  checkOut: string | null; // HH:MM
  checkInPhoto: string | null; // Google Drive link or data URL
  checkOutPhoto: string | null; // Google Drive link or data URL
  checkInLocation: { lat: number; lng: number } | null;
  checkOutLocation: { lat: number; lng: number } | null;
  checkInAddress: string | null;
  checkOutAddress: string | null;
  checkInStatus: 'Tepat Waktu' | 'Terlambat' | 'Alpa' | 'Izin' | 'Cuti';
  checkOutStatus: 'Pulang Cepat' | 'Tepat Waktu' | 'Lembur' | null;
  logbookNotes?: string;
  shift?: 'pagi' | 'malam';
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'Cuti' | 'Izin' | 'Sakit';
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
  approvedBy?: string;
  approvedDate?: string;
  workDays?: number;
  address?: string;
  backup1?: string;
  backup2?: string;
}

export interface Logbook {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  time: string;
  content: string;
  status?: 'Pending' | 'Approved' | 'Rejected';
  approvedBy?: string;
}

export interface OfficeSettings {
  checkInStart: string; // e.g. "07:30"
  checkInEnd: string; // e.g. "08:15"
  checkOutStart: string; // e.g. "17:00"
  officeLat: number; // For geofencing
  officeLng: number;
  officeRadiusMeters: number;
  officeName: string;
  sheetId: string;
  scriptUrl: string; // Google Apps Script URL for full syncing
  securityShiftPagiStart?: string;
  securityShiftPagiEnd?: string;
  securityShiftPagiOut?: string;
  securityShiftMalamStart?: string;
  securityShiftMalamEnd?: string;
  securityShiftMalamOut?: string;
}
