import React, { useState, useEffect, useMemo } from 'react';
import { Check, X, Printer, Search, Calendar, User, Clock, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { Employee, LeaveRequest, Logbook, OfficeSettings } from '../types';

interface OvertimeRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
}

interface VerifikasiApprovalViewProps {
  user: Employee;
  employees: Employee[];
  leaves: LeaveRequest[];
  logbooks: Logbook[];
  settings: OfficeSettings;
  onApproveLeave: (id: string, approve: boolean) => void;
  onApproveLogbook: (id: string, approve: boolean) => void;
}

export default function VerifikasiApprovalView({
  user,
  employees,
  leaves,
  logbooks,
  settings,
  onApproveLeave,
  onApproveLogbook
}: VerifikasiApprovalViewProps) {
  const [activeTab, setActiveTab] = useState<'cuti-izin-lembur' | 'absen-lembur' | 'logbook'>('cuti-izin-lembur');
  const [overtimes, setOvertimes] = useState<OvertimeRequest[]>([]);
  const [overtimeAttendanceRecords, setOvertimeAttendanceRecords] = useState<any[]>([]);
  const [selectedRequestForPrint, setSelectedRequestForPrint] = useState<any>(null);
  const [selectedPhotoModal, setSelectedPhotoModal] = useState<{ url: string; label: string } | null>(null);

  const [kopSettings, setKopSettings] = useState({
    headerLine1: 'KEMENTERIAN KEUANGAN REPUBLIK INDONESIA',
    headerLine2: 'DIREKTORAT JENDERAL PERBENDAHARAAN',
    headerLine3: 'KANTOR WILAYAH DITJEN PERBENDAHARAAN',
    headerLine4: 'PROVINSI RIAU',
    addressLine: 'JALAN JENDERAL SUDIRMAN NO. 249 PEKANBARU 28116',
    phoneFaxLine: 'TELEPON 0761-22686, FAKSIMILE 0761-22647',
    websiteLine: 'http://www.djpbn.kemenkeu.go.id/kanwil/riau',
    kopLogoUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/df/Logo_Kementerian_Keuangan_Republik_Indonesia.png'
  });

  useEffect(() => {
    const loadKop = () => {
      const saved = localStorage.getItem('kop_settings');
      if (saved) {
        try {
          const data = JSON.parse(saved);
          if (data.kopLogoUrl === 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=60') {
            data.kopLogoUrl = 'https://upload.wikimedia.org/wikipedia/commons/d/df/Logo_Kementerian_Keuangan_Republik_Indonesia.png';
          }
          setKopSettings(prev => ({
            ...prev,
            ...data
          }));
        } catch (e) {
          console.error('Failed to parse kop_settings', e);
        }
      }
    };
    loadKop();
    window.addEventListener('kop_settings_changed', loadKop);
    return () => window.removeEventListener('kop_settings_changed', loadKop);
  }, []);

  // Helper to load all overtime requests from localStorage and leaves prop
  const loadOvertimes = () => {
    const allReqs: OvertimeRequest[] = [];

    // 1. Load from Supabase via leaves prop
    if (leaves) {
      leaves.forEach(l => {
        if (l.type === 'Lembur') {
          const [startTime, endTime] = (l.address || '17:00-19:00').split('-');
          allReqs.push({
            id: l.id,
            employeeId: l.employeeId,
            employeeName: l.employeeName,
            date: l.startDate,
            startTime: startTime || '17:00',
            endTime: endTime || '19:00',
            reason: l.reason,
            status: l.status,
            createdAt: l.createdAt
          });
        }
      });
    }

    // 2. Load from localStorage as fallback
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('overtime_requests_')) {
        try {
          const items = JSON.parse(localStorage.getItem(key) || '[]');
          if (Array.isArray(items)) {
            items.forEach((item: any) => {
              if (!allReqs.some(r => r.id === item.id)) {
                allReqs.push(item);
              }
            });
          }
        } catch (e) {
          console.error('Failed to load overtimes from key:', key, e);
        }
      }
    }
    // Sort by createdAt descending
    allReqs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setOvertimes(allReqs);
  };

  const loadOvertimeAttendanceRecords = () => {
    try {
      const stored = localStorage.getItem('overtime_attendance_records');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Sort by date descending
          const sorted = [...parsed].sort((a, b) => b.date.localeCompare(a.date));
          setOvertimeAttendanceRecords(sorted);
        }
      }
    } catch (e) {
      console.error('Failed to load overtime attendance records:', e);
    }
  };

  useEffect(() => {
    loadOvertimes();
    loadOvertimeAttendanceRecords();
    const handleStorageChange = () => {
      loadOvertimes();
      loadOvertimeAttendanceRecords();
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [leaves]); // Reload when leaves change to capture updates

  // Handle Overtime approval
  const handleApproveOvertime = (id: string, approve: boolean) => {
    // Check if it's stored in Supabase (leaves prop)
    const isLeaveOvertime = leaves.some(l => l.id === id && l.type === 'Lembur');
    if (isLeaveOvertime) {
      onApproveLeave(id, approve);
    } else {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('overtime_requests_')) {
          try {
            const items = JSON.parse(localStorage.getItem(key) || '[]');
            if (Array.isArray(items)) {
              const index = items.findIndex(item => item.id === id);
              if (index !== -1) {
                items[index].status = approve ? 'Approved' : 'Rejected';
                localStorage.setItem(key, JSON.stringify(items));
                window.dispatchEvent(new Event('storage'));
                break;
              }
            }
          } catch (e) {
            console.error(e);
          }
        }
      }
    }
    loadOvertimes();
    alert(`Pengajuan lembur telah ${approve ? 'DISETUJUI' : 'DITOLAK'} secara sukses.`);
  };

  const handleApproveOvertimeAttendance = (id: string, approve: boolean) => {
    try {
      const stored = localStorage.getItem('overtime_attendance_records');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const index = parsed.findIndex((item: any) => item.id === id);
          if (index !== -1) {
            parsed[index].status = approve ? 'Approved' : 'Rejected';
            localStorage.setItem('overtime_attendance_records', JSON.stringify(parsed));
            
            // Sync to Supabase
            const updatedRec = parsed[index];
            import('../utils/supabase')
              .then(m => m.upsertOvertimeToSupabase(updatedRec))
              .catch(e => console.error('Failed to sync approved overtime to Supabase:', e));
            
            loadOvertimeAttendanceRecords();
            window.dispatchEvent(new Event('storage'));
            alert(`Presensi lembur HP telah ${approve ? 'DISETUJUI' : 'DITOLAK'} secara sukses.`);
          }
        }
      }
    } catch (e) {
      console.error('Failed to update overtime attendance record status:', e);
    }
  };

  // Format date helper: YYYY-MM-DD -> DD/MM/YYYY
  const formatDateStr = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  // Helper to convert date to Indonesian Words Date (e.g. "22 Juni 2026")
  const formatIndonesianDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const simpleDate = dateStr.split('T')[0];
    const parts = simpleDate.split('-');
    if (parts.length === 3) {
      const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      const day = parseInt(parts[2], 10);
      const month = months[parseInt(parts[1], 10) - 1];
      const year = parts[0];
      return `${day} ${month} ${year}`;
    }
    return dateStr;
  };

  // Standardize leaves and overtimes into a single list of requests
  const unifiedRequests = useMemo(() => {
    const list: any[] = [];

    // Add leaves
    leaves.forEach(l => {
      if (l.type === 'Lembur') return;
      let typeLabel = 'Cuti Tahunan';
      if (l.type === 'Sakit') typeLabel = 'Cuti Sakit';
      if (l.type === 'Izin') typeLabel = 'Izin';

      list.push({
        id: l.id,
        rawId: l.id,
        displayId: `REQ-${l.id.replace(/\D/g, '').slice(0, 12) || l.id}`,
        employeeId: l.employeeId,
        employeeName: l.employeeName,
        type: typeLabel,
        rawType: l.type,
        period: l.startDate === l.endDate ? formatDateStr(l.startDate) : `${formatDateStr(l.startDate)} - ${formatDateStr(l.endDate)}`,
        reason: l.reason,
        status: l.status,
        createdAt: l.createdAt,
        category: 'leave',
        approvedDate: l.approvedDate
      });
    });

    // Add overtimes
    overtimes.forEach(o => {
      list.push({
        id: o.id,
        rawId: o.id,
        displayId: `REQ-${o.id.replace(/\D/g, '').slice(0, 12) || o.id}`,
        employeeId: o.employeeId,
        employeeName: o.employeeName,
        type: 'Surat Perintah Kerja Lembur',
        rawType: 'Lembur',
        period: `${formatDateStr(o.date)} (${o.startTime} - ${o.endTime})`,
        reason: o.reason,
        status: o.status,
        createdAt: o.createdAt,
        category: 'overtime'
      });
    });

    // Sort by createdAt descending
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [leaves, overtimes]);

  const pendingCutiCount = useMemo(() => {
    return unifiedRequests.filter(r => r.status === 'Pending').length;
  }, [unifiedRequests]);

  const pendingAbsenLemburCount = useMemo(() => {
    return overtimeAttendanceRecords.filter(r => (r.status || 'Pending') === 'Pending').length;
  }, [overtimeAttendanceRecords]);

  const pendingLogbookCount = useMemo(() => {
    return logbooks.filter(r => r.status === 'Pending').length;
  }, [logbooks]);

  const handlePrintAction = (req: any) => {
    setSelectedRequestForPrint(req);
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Verifikasi & Approval Pengajuan</h2>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          id="tab-cuti-izin-lembur"
          onClick={() => setActiveTab('cuti-izin-lembur')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'cuti-izin-lembur'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <span>Cuti / Izin / SPKL (Lembur)</span>
          {pendingCutiCount > 0 && (
            <span className="px-1.5 py-0.5 text-[9px] bg-amber-500 text-white rounded-full font-mono font-bold leading-none animate-pulse">
              {pendingCutiCount}
            </span>
          )}
        </button>
        <button
          id="tab-absen-lembur"
          onClick={() => setActiveTab('absen-lembur')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'absen-lembur'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <span>Presensi Lembur (HP)</span>
          {pendingAbsenLemburCount > 0 && (
            <span className="px-1.5 py-0.5 text-[9px] bg-rose-500 text-white rounded-full font-mono font-bold leading-none animate-pulse">
              {pendingAbsenLemburCount}
            </span>
          )}
        </button>
        <button
          id="tab-logbook"
          onClick={() => setActiveTab('logbook')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'logbook'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <span>Logbook Aktivitas</span>
          {pendingLogbookCount > 0 && (
            <span className="px-1.5 py-0.5 text-[9px] bg-blue-500 text-white rounded-full font-mono font-bold leading-none animate-pulse">
              {pendingLogbookCount}
            </span>
          )}
        </button>
      </div>

      {/* Main Table Panel */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {activeTab === 'cuti-izin-lembur' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75">
                  <th className="py-4 px-6 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">ID</th>
                  <th className="py-4 px-6 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Nama</th>
                  <th className="py-4 px-6 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Tipe</th>
                  <th className="py-4 px-6 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Mulai</th>
                  <th className="py-4 px-6 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Keterangan</th>
                  <th className="py-4 px-6 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider text-center">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {unifiedRequests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs font-semibold text-slate-400">
                      Tidak ada pengajuan aktif yang perlu diverifikasi.
                    </td>
                  </tr>
                ) : (
                  unifiedRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* ID */}
                      <td className="py-4 px-6 text-xs font-mono font-bold text-slate-800">
                        {req.displayId}
                      </td>
                      {/* Nama */}
                      <td className="py-4 px-6 text-xs font-bold text-slate-800">
                        {req.employeeName}
                      </td>
                      {/* Tipe */}
                      <td className="py-4 px-6 text-xs font-bold text-blue-700">
                        {req.type}
                      </td>
                      {/* Mulai */}
                      <td className="py-4 px-6 text-xs font-medium text-slate-500">
                        {req.period}
                      </td>
                      {/* Keterangan */}
                      <td className="py-4 px-6 text-xs text-slate-600 max-w-xs truncate" title={req.reason}>
                        {req.reason}
                      </td>
                      {/* Tindakan */}
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center gap-2">
                          {req.status === 'Pending' ? (
                            <>
                              <button
                                onClick={() => {
                                  if (req.category === 'leave') {
                                    onApproveLeave(req.rawId, true);
                                  } else {
                                    handleApproveOvertime(req.rawId, true);
                                  }
                                }}
                                className="px-3 py-1.5 bg-[#10B981] hover:bg-[#059669] text-white text-[10px] font-bold rounded-md shadow-sm transition-colors"
                              >
                                Setuju
                              </button>
                              <button
                                onClick={() => {
                                  if (req.category === 'leave') {
                                    onApproveLeave(req.rawId, false);
                                  } else {
                                    handleApproveOvertime(req.rawId, false);
                                  }
                                }}
                                className="px-3 py-1.5 bg-[#EF4444] hover:bg-[#DC2626] text-white text-[10px] font-bold rounded-md shadow-sm transition-colors"
                              >
                                Tolak
                              </button>
                            </>
                          ) : (
                            <span className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded ${
                              req.status === 'Approved' 
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                : 'bg-red-50 text-red-500 border border-red-100'
                            }`}>
                              {req.status === 'Approved' ? 'Disetujui' : 'Ditolak'}
                            </span>
                          )}
                          <button
                            onClick={() => handlePrintAction(req)}
                            className="px-3 py-1.5 bg-[#0B1E43] hover:bg-[#07142E] text-white text-[10px] font-bold rounded-md shadow-sm transition-colors flex items-center gap-1"
                          >
                            <Printer className="w-3 h-3" />
                            <span>Cetak</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'absen-lembur' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75">
                  <th className="py-4 px-6 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">ID Presensi</th>
                  <th className="py-4 px-6 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Nama Pegawai</th>
                  <th className="py-4 px-6 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Tanggal</th>
                  <th className="py-4 px-6 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Clock In</th>
                  <th className="py-4 px-6 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Clock Out</th>
                  <th className="py-4 px-6 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider text-center">Durasi</th>
                  <th className="py-4 px-6 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider text-center">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {overtimeAttendanceRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-xs font-semibold text-slate-400">
                      Tidak ada rekaman absen lembur HP dari PPNPN yang perlu diverifikasi.
                    </td>
                  </tr>
                ) : (
                  overtimeAttendanceRecords.map((rec) => {
                    const status = rec.status || 'Pending';
                    const displayId = `HP-${rec.id.replace(/\D/g, '').slice(0, 10) || rec.id}`;

                    return (
                      <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors">
                        {/* ID */}
                        <td className="py-4 px-6 text-xs font-mono font-bold text-slate-800">
                          {displayId}
                        </td>
                        {/* Nama */}
                        <td className="py-4 px-6 text-xs font-bold text-slate-800">
                          {rec.employeeName}
                        </td>
                        {/* Tanggal */}
                        <td className="py-4 px-6 text-xs font-medium text-slate-500">
                          {formatDateStr(rec.date)}
                        </td>
                        {/* Clock In */}
                        <td className="py-4 px-6 text-xs text-slate-600">
                          {rec.clockIn ? (
                            <div className="flex items-center gap-2">
                              <div>
                                <span className="font-bold text-slate-800 font-mono">{rec.clockIn}</span>
                                {rec.clockInAddress && (
                                  <p className="text-[9px] text-slate-400 truncate max-w-[150px]" title={rec.clockInAddress}>
                                    {rec.clockInAddress}
                                  </p>
                                )}
                              </div>
                              {rec.clockInPhoto && (
                                <img
                                  src={rec.clockInPhoto}
                                  alt="In Selfie"
                                  className="w-8 h-8 rounded-md object-cover border border-slate-200 cursor-pointer hover:scale-105 transition-all"
                                  onClick={() => setSelectedPhotoModal({ url: rec.clockInPhoto, label: `Swafoto Clock In - ${rec.employeeName}` })}
                                />
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-300 italic">Belum In</span>
                          )}
                        </td>
                        {/* Clock Out */}
                        <td className="py-4 px-6 text-xs text-slate-600">
                          {rec.clockOut ? (
                            <div className="flex items-center gap-2">
                              <div>
                                <span className="font-bold text-slate-800 font-mono">{rec.clockOut}</span>
                                {rec.clockOutAddress && (
                                  <p className="text-[9px] text-slate-400 truncate max-w-[150px]" title={rec.clockOutAddress}>
                                    {rec.clockOutAddress}
                                  </p>
                                )}
                              </div>
                              {rec.clockOutPhoto && (
                                <img
                                  src={rec.clockOutPhoto}
                                  alt="Out Selfie"
                                  className="w-8 h-8 rounded-md object-cover border border-slate-200 cursor-pointer hover:scale-105 transition-all"
                                  onClick={() => setSelectedPhotoModal({ url: rec.clockOutPhoto, label: `Swafoto Clock Out - ${rec.employeeName}` })}
                                />
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-300 italic">Belum Out</span>
                          )}
                        </td>
                        {/* Durasi */}
                        <td className="py-4 px-6 text-xs text-center font-bold text-blue-700">
                          {rec.hours ? `${rec.hours} Jam` : '0 Jam'}
                        </td>
                        {/* Tindakan */}
                        <td className="py-4 px-6">
                          <div className="flex items-center justify-center gap-2">
                            {status === 'Pending' ? (
                              <>
                                <button
                                  onClick={() => handleApproveOvertimeAttendance(rec.id, true)}
                                  className="px-3 py-1.5 bg-[#10B981] hover:bg-[#059669] text-white text-[10px] font-bold rounded-md shadow-sm transition-colors"
                                >
                                  Setuju
                                </button>
                                <button
                                  onClick={() => handleApproveOvertimeAttendance(rec.id, false)}
                                  className="px-3 py-1.5 bg-[#EF4444] hover:bg-[#DC2626] text-white text-[10px] font-bold rounded-md shadow-sm transition-colors"
                                >
                                  Tolak
                                </button>
                              </>
                            ) : (
                              <span className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded ${
                                status === 'Approved'
                                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                  : 'bg-red-50 text-red-500 border border-red-100'
                              }`}>
                                {status === 'Approved' ? 'Disetujui' : 'Ditolak'}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75">
                  <th className="py-4 px-6 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">ID Log</th>
                  <th className="py-4 px-6 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Nama Pegawai</th>
                  <th className="py-4 px-6 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Tanggal & Waktu</th>
                  <th className="py-4 px-6 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Aktivitas</th>
                  <th className="py-4 px-6 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider text-center">Status & Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logbooks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-xs font-semibold text-slate-400">
                      Tidak ada laporan logbook aktivitas harian pegawai.
                    </td>
                  </tr>
                ) : (
                  logbooks.map((log) => {
                    const status = log.status || 'Approved';
                    const displayId = `LOG-${log.id.replace(/\D/g, '').slice(0, 10) || log.id}`;

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6 text-xs font-mono font-bold text-slate-800">
                          {displayId}
                        </td>
                        <td className="py-4 px-6 text-xs font-bold text-slate-800">
                          {log.employeeName}
                        </td>
                        <td className="py-4 px-6 text-xs font-medium text-slate-500">
                          {formatDateStr(log.date)} ({log.time})
                        </td>
                        <td className="py-4 px-6 text-xs text-slate-600 max-w-sm truncate" title={log.content}>
                          {log.content}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center justify-center gap-2">
                            {status === 'Pending' ? (
                              <>
                                <button
                                  onClick={() => onApproveLogbook(log.id, true)}
                                  className="px-2.5 py-1.5 bg-[#10B981] hover:bg-[#059669] text-white text-[10px] font-bold rounded-md shadow-sm transition-colors"
                                >
                                  Setuju
                                </button>
                                <button
                                  onClick={() => onApproveLogbook(log.id, false)}
                                  className="px-2.5 py-1.5 bg-[#EF4444] hover:bg-[#DC2626] text-white text-[10px] font-bold rounded-md shadow-sm transition-colors"
                                >
                                  Tolak
                                </button>
                              </>
                            ) : (
                              <span className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded ${
                                status === 'Approved' 
                                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                  : 'bg-red-50 text-red-500 border border-red-100'
                              }`}>
                                {status === 'Approved' ? 'Disetujui' : 'Ditolak'}
                              </span>
                            )}
                            <button
                              onClick={() => handlePrintAction({
                                ...log,
                                type: 'Laporan Logbook Harian',
                                period: formatDateStr(log.date),
                                reason: log.content,
                                displayId
                              })}
                              className="px-2.5 py-1.5 bg-[#0B1E43] hover:bg-[#07142E] text-white text-[10px] font-bold rounded-md shadow-sm transition-colors flex items-center gap-1"
                            >
                              <Printer className="w-3 h-3" />
                              <span>Cetak</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* High Fidelity Official Print Letter Modal */}
      {selectedRequestForPrint && (
        <div className="fixed inset-0 bg-[#020617]/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            
            {/* Modal Actions Header */}
            <div className="bg-white px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <span className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Printer className="w-4 h-4 text-blue-600" />
                <span>Cetak {selectedRequestForPrint.type === 'Surat Perintah Kerja Lembur' ? 'Surat Perintah Kerja Lembur' : 'Surat Keterangan Persetujuan Cuti'} ({selectedRequestForPrint.displayId})</span>
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Kirim ke Printer</span>
                </button>
                <button
                  onClick={() => setSelectedRequestForPrint(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg transition-all"
                >
                  Tutup
                </button>
              </div>
            </div>

            {/* Printable Letter Container */}
            <div id="printable-area" className="p-12 text-black bg-white font-serif text-sm leading-relaxed max-h-[70vh] overflow-y-auto print:p-0">
              
               {/* KEMENTERIAN KEUANGAN KOP SURAT */}
              <div className="flex items-center justify-between gap-4 pb-4 border-b-4 border-black">
                {/* Logo Instansi on the left */}
                <div className="shrink-0 w-16 h-16 flex items-center justify-center overflow-hidden">
                  <img 
                    src={kopSettings.kopLogoUrl} 
                    alt="Logo" 
                    className="max-w-full max-h-full object-contain" 
                    referrerPolicy="no-referrer"
                  />
                </div>
                {/* Text centered in the remaining space */}
                <div className="text-center flex-1 font-serif space-y-0.5">
                  <h3 className="font-bold text-[13px] tracking-wide text-black uppercase leading-tight">{kopSettings.headerLine1}</h3>
                  <h4 className="font-bold text-[12px] tracking-wide text-black uppercase leading-tight">{kopSettings.headerLine2}</h4>
                  <h4 className="font-bold text-[11px] tracking-wide text-black uppercase leading-tight">{kopSettings.headerLine3}</h4>
                  <p className="font-bold text-[11px] tracking-wide text-black uppercase leading-tight">{kopSettings.headerLine4 || ''}</p>
                  <div className="pt-1.5 space-y-0.5">
                    <p className="text-[8px] font-sans text-slate-800 leading-tight uppercase">{kopSettings.addressLine}</p>
                    <p className="text-[8px] font-sans text-slate-800 leading-tight uppercase">{kopSettings.phoneFaxLine || ''}</p>
                    <p className="text-[8px] font-sans text-slate-800 leading-tight">
                      {(kopSettings.websiteLine || '').toUpperCase().startsWith('WEBSITE') ? '' : 'WEBSITE '}<span className="underline">{kopSettings.websiteLine || ''}</span>
                    </p>
                  </div>
                </div>
                {/* Balanced spacer on the right so text is mathematically centered */}
                <div className="w-16 h-16 shrink-0 invisible"></div>
              </div>

              {/* Document Title */}
              <div className="text-center mt-8 space-y-1">
                <h2 className="font-extrabold text-base uppercase tracking-wider underline">
                  {selectedRequestForPrint.type === 'Surat Perintah Kerja Lembur' ? 'SURAT PERINTAH KERJA LEMBUR' : 'SURAT KETERANGAN PERSETUJUAN CUTI'}
                </h2>
                <p className="text-xs font-bold font-sans">
                  Nomor: ND-{selectedRequestForPrint.id.replace(/\D/g, '').slice(0, 5) || '1782'}/WPB.08/KP.02/2026
                </p>
              </div>

              {/* Main Contents */}
              <div className="mt-8 space-y-6 text-xs sm:text-sm">
                <p>
                  Yang bertanda tangan di bawah ini Kepala Subbagian Tata Usaha dan Rumah Tangga, memberikan perintah/persetujuan dinas kepada pegawai PPNPN berikut:
                </p>

                {/* Grid info of Pegawai */}
                <div className="pl-6 space-y-2">
                  <div className="grid grid-cols-12">
                    <span className="col-span-3 font-bold">Nama Pegawai</span>
                    <span className="col-span-1">:</span>
                    <span className="col-span-8 font-semibold">{selectedRequestForPrint.employeeName}</span>
                  </div>
                  <div className="grid grid-cols-12">
                    <span className="col-span-3 font-bold">NIP / ID Pegawai</span>
                    <span className="col-span-1">:</span>
                    <span className="col-span-8 font-mono">{selectedRequestForPrint.employeeId || 'KRY-02'}</span>
                  </div>
                  <div className="grid grid-cols-12">
                    <span className="col-span-3 font-bold">Jenis Dokumen</span>
                    <span className="col-span-1">:</span>
                    <span className="col-span-8 font-semibold text-blue-700 uppercase">{selectedRequestForPrint.type}</span>
                  </div>
                  <div className="grid grid-cols-12">
                    <span className="col-span-3 font-bold">Waktu Pelaksanaan</span>
                    <span className="col-span-1">:</span>
                    <span className="col-span-8 font-semibold">{selectedRequestForPrint.period}</span>
                  </div>
                </div>

                {/* Uraian Pekerjaan / Alasan */}
                <div className="space-y-2">
                  <p className="font-bold">Uraian Alasan / Penugasan Kerja:</p>
                  <div className="p-4 bg-white border border-slate-200 rounded-lg italic">
                    "{selectedRequestForPrint.reason || selectedRequestForPrint.content}"
                  </div>
                </div>

                <p className="leading-relaxed">
                  Demikian surat perintah / keterangan ini diterbitkan secara sah dan elektronik untuk dilaksanakan dengan penuh rasa tanggung jawab serta dipergunakan sebagaimana mestinya untuk kelengkapan administrasi tunjangan kinerja bulanan.
                </p>
              </div>

              {/* Signature section */}
              <div className="mt-14 flex justify-end">
                <div className="text-center space-y-16 w-64">
                  <div>
                    <p className="text-xs">Pekanbaru, {formatIndonesianDate(selectedRequestForPrint.approvedDate || selectedRequestForPrint.createdAt || new Date().toISOString().split('T')[0])}</p>
                    <p className="font-bold text-xs uppercase">Kepala Subbagian Tata Usaha dan Rumah Tangga,</p>
                  </div>
                  <div>
                    <p className="font-bold text-xs underline uppercase">Ahmad Nauval</p>
                    <p className="text-[10px] font-sans text-slate-500 font-medium">NIP 198210042002121003</p>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Swafoto Selfie Expansion Modal */}
      {selectedPhotoModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative max-w-lg w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
              <span className="text-sm font-bold text-slate-100">{selectedPhotoModal.label}</span>
              <button
                onClick={() => setSelectedPhotoModal(null)}
                className="text-slate-400 hover:text-slate-200 text-xs font-bold transition-colors px-3 py-1 bg-slate-800 rounded-md"
              >
                Tutup
              </button>
            </div>
            <div className="p-6 flex items-center justify-center bg-slate-950/50">
              <img
                src={selectedPhotoModal.url}
                alt="Expanded Selfie"
                className="max-h-[60vh] max-w-full rounded-lg object-contain border border-slate-800 shadow-lg"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
