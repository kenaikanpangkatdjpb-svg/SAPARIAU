import React, { useState, useMemo, useEffect } from 'react';
import { UserSquare2, Search, MapPin, Image as ImageIcon, Calendar, CheckCircle, Clock } from 'lucide-react';
import { Employee, Attendance } from '../types';

interface DetailAbsensiViewProps {
  user: Employee;
  employees: Employee[];
  attendance: Attendance[];
}

export default function DetailAbsensiView({ user, employees, attendance }: DetailAbsensiViewProps) {
  const isAdmin = user.role === 'admin';
  
  const karyawanEmployees = useMemo(() => {
    return employees.filter(e => e.role === 'karyawan');
  }, [employees]);

  const [selectedEmpId, setSelectedEmpId] = useState(
    isAdmin ? (karyawanEmployees[0]?.id || '') : user.id
  );

  // Synchronize and set a valid karyawan ID if the selected one is invalid or not a karyawan
  useEffect(() => {
    if (isAdmin) {
      const exists = karyawanEmployees.some(e => e.id === selectedEmpId);
      if (!exists && karyawanEmployees.length > 0) {
        setSelectedEmpId(karyawanEmployees[0].id);
      }
    }
  }, [isAdmin, karyawanEmployees, selectedEmpId]);

  const selectedEmployee = useMemo(() => {
    return employees.find(e => e.id === selectedEmpId) || user;
  }, [employees, selectedEmpId, user]);

  const employeeAttendance = useMemo(() => {
    return attendance
      .filter(att => att.employeeId === selectedEmployee.id)
      .sort((a, b) => b.date.localeCompare(a.date)); // Sort latest first
  }, [attendance, selectedEmployee]);

  return (
    <div id="detail-absensi-view" className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <UserSquare2 className="w-5 h-5 text-[#0B1E43]" />
            Detail Absensi Individu Pegawai
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Telusuri riwayat jam presensi, lokasi GPS, dan bukti foto selfie pegawai secara mendetail.
          </p>
        </div>

        {/* Employee selector for Admin */}
        {isAdmin && (
          <div className="flex items-center gap-2.5 w-full md:w-auto bg-white p-1.5 border border-slate-200 rounded-xl">
            <span className="text-xs font-extrabold text-slate-500 pl-2 uppercase tracking-wider text-[10px]">Pilih Pegawai:</span>
            <select
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              className="text-xs font-bold px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
            >
              {employees.filter(e => e.role === 'karyawan').map(emp => (
                <option className="bg-white" key={emp.id} value={emp.id}>
                  {emp.name} ({emp.id})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Grid Layout: Profile Card & History Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Profile Card (4 cols) */}
        <div className="lg:col-span-4 bg-white p-5 border border-slate-200 rounded-2xl shadow-sm space-y-4">
          <div className="text-center py-4 space-y-3">
            <div className="w-20 h-20 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-extrabold text-[#0B1E43] text-2xl mx-auto shadow-sm">
              {selectedEmployee.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h4 className="font-extrabold text-slate-800 text-lg leading-tight">{selectedEmployee.name}</h4>
              <p className="text-xs text-slate-400 mt-1 font-mono">{selectedEmployee.id}</p>
            </div>
            <span className="inline-block px-3 py-1 text-[10px] font-extrabold bg-blue-50 text-blue-600 border border-blue-100 rounded-lg uppercase tracking-wider">
              {selectedEmployee.position}
            </span>
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-3 text-xs text-slate-600 font-medium">
            {selectedEmployee.role !== 'admin' && (
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Kuota Cuti</span>
                <span className="text-[#0B1E43] font-extrabold">{selectedEmployee.cutiQuota} Hari</span>
              </div>
            )}
          </div>
        </div>

        {/* History Feed (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
            <h4 className="font-extrabold text-slate-800 text-sm">Riwayat Presensi Harian</h4>
            <span className="px-2.5 py-0.5 text-[10px] font-extrabold rounded-full bg-blue-50 text-blue-600 border border-blue-100 uppercase tracking-wider">
              {employeeAttendance.length} Hari Kerja
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            {employeeAttendance.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs font-semibold">
                Belum ada catatan kehadiran untuk pegawai ini.
              </div>
            ) : (
              employeeAttendance.map((att) => (
                <div key={att.id} className="p-5 space-y-4 hover:bg-slate-50/50 transition-colors">
                  
                  {/* Date and Status Badge Row */}
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-bold text-slate-800 font-mono">{att.date}</span>
                    </div>
                    
                    <span className={`px-2.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border ${
                      att.checkInStatus === 'Tepat Waktu' 
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                        : 'bg-amber-50 text-amber-600 border-amber-100'
                    }`}>
                      {att.checkInStatus}
                    </span>
                  </div>

                  {/* Attendance Log Row: checkIn and checkOut details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Clock In info */}
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                      <div className="flex items-center gap-2 text-slate-400 font-extrabold text-[9px] uppercase tracking-wider">
                        <Clock className="w-3.5 h-3.5 text-[#0B1E43]" />
                        <span>Presensi Masuk</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {att.checkInPhoto ? (
                          <img 
                            src={att.checkInPhoto} 
                            alt="Selfie Masuk" 
                            className="w-12 h-12 object-cover rounded-lg border border-slate-200"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-slate-200 rounded-lg border border-slate-300 flex items-center justify-center text-slate-400">
                            <ImageIcon className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-bold text-slate-800 font-mono">{att.checkIn || '—'}</p>
                          <p className="text-[10px] text-slate-500 font-medium mt-0.5 truncate max-w-[150px]">
                            {att.checkInAddress || 'GPS Belum Direkam'}
                          </p>
                        </div>
                      </div>

                      {att.checkInLocation && (
                        <a
                          href={`https://www.google.com/maps?q=${att.checkInLocation.lat},${att.checkInLocation.lng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          <MapPin className="w-3 h-3" />
                          Lihat Peta Google Maps
                        </a>
                      )}
                    </div>

                    {/* Clock Out info */}
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                      <div className="flex items-center gap-2 text-slate-400 font-extrabold text-[9px] uppercase tracking-wider">
                        <Clock className="w-3.5 h-3.5 text-[#0B1E43]" />
                        <span>Presensi Pulang</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {att.checkOutPhoto ? (
                          <img 
                            src={att.checkOutPhoto} 
                            alt="Selfie Pulang" 
                            className="w-12 h-12 object-cover rounded-lg border border-slate-200"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-slate-200 rounded-lg border border-slate-300 flex items-center justify-center text-slate-400">
                            <ImageIcon className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-bold text-slate-800 font-mono">{att.checkOut || '—'}</p>
                          <p className="text-[10px] text-slate-500 font-medium mt-0.5 truncate max-w-[150px]">
                            {att.checkOutAddress || 'GPS Belum Direkam'}
                          </p>
                        </div>
                      </div>

                      {att.checkOutLocation && (
                        <a
                          href={`https://www.google.com/maps?q=${att.checkOutLocation.lat},${att.checkOutLocation.lng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          <MapPin className="w-3 h-3" />
                          Lihat Peta Google Maps
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Logbook activity notes attached to this attendance log */}
                  {att.logbookNotes && (
                    <div className="p-3 bg-blue-50/40 rounded-xl border border-blue-100/50 text-xs text-slate-600">
                      <strong className="text-[#0B1E43] block mb-1 font-bold text-xs">Catatan Logbook Aktivitas Hari Ini:</strong>
                      <p className="italic">" {att.logbookNotes} "</p>
                    </div>
                  )}

                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
