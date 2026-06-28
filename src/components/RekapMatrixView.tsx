import React, { useState, useMemo } from 'react';
import { Grid3X3, Printer, FileDown, CheckCircle, Clock, AlertCircle, Calendar } from 'lucide-react';
import { Employee, Attendance, LeaveRequest } from '../types';

interface RekapMatrixViewProps {
  employees: Employee[];
  attendance: Attendance[];
  leaves: LeaveRequest[];
}

export default function RekapMatrixView({ employees, attendance, leaves }: RekapMatrixViewProps) {
  const [selectedMonthNum, setSelectedMonthNum] = useState('06');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [signDate, setSignDate] = useState<string>('2026-06-02');

  React.useEffect(() => {
    setSignDate(`${selectedYear}-${selectedMonthNum}-02`);
  }, [selectedYear, selectedMonthNum]);

  const formatIndonesianDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const year = parts[0];
        const monthIndex = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const indonesianMonths = [
          'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
          'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];
        return `${day} ${indonesianMonths[monthIndex]} ${year}`;
      }
      const dateObj = new Date(dateStr);
      return dateObj.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };

  const selectedMonth = useMemo(() => {
    return `${selectedYear}-${selectedMonthNum}`;
  }, [selectedYear, selectedMonthNum]);

  const employeesList = useMemo(() => {
    return employees.filter(e => e.role === 'karyawan');
  }, [employees]);

  // Dynamic days of the month (handles leap years and different month lengths)
  const daysInMonth = useMemo(() => {
    const year = parseInt(selectedYear, 10);
    const month = parseInt(selectedMonthNum, 10);
    const totalDays = new Date(year, month, 0).getDate();
    const list = [];
    for (let d = 1; d <= totalDays; d++) {
      list.push(d);
    }
    return list;
  }, [selectedYear, selectedMonthNum]);

  // Matrix builder: [employeeId][day] -> Status / Attendance object
  const attendanceMatrix = useMemo(() => {
    const matrix: { [empId: string]: { [day: number]: Attendance | null } } = {};
    
    employeesList.forEach(emp => {
      matrix[emp.id] = {};
      daysInMonth.forEach(day => {
        matrix[emp.id][day] = null;
      });
    });

    attendance.forEach(att => {
      if (att.date.startsWith(selectedMonth)) {
        const day = parseInt(att.date.split('-')[2], 10);
        if (matrix[att.employeeId]) {
          matrix[att.employeeId][day] = att;
        }
      }
    });

    return matrix;
  }, [employeesList, attendance, selectedMonth, daysInMonth]);

  // Leaves Map: [employeeId][dateString] -> Leave type
  const leavesMap = useMemo(() => {
    const map: { [empId: string]: { [dateStr: string]: string } } = {};
    
    leaves.forEach(leave => {
      if (leave.status === 'Approved') {
        const start = new Date(leave.startDate);
        const end = new Date(leave.endDate);
        
        // Loop dates from start to end
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0];
          if (dateStr.startsWith(selectedMonth)) {
            if (!map[leave.employeeId]) {
              map[leave.employeeId] = {};
            }
            map[leave.employeeId][dateStr] = leave.type;
          }
        }
      }
    });

    return map;
  }, [leaves, selectedMonth]);

  const handlePrintPdf = () => {
    setShowPrintPreview(true);
  };

  const getDayStatusCell = (empId: string, day: number) => {
    const att = attendanceMatrix[empId]?.[day];
    const dayStr = day < 10 ? `0${day}` : `${day}`;
    const dateStr = `${selectedMonth}-${dayStr}`;
    const dateObj = new Date(dateStr);
    const dayOfWeek = dateObj.getDay();

    // Weekend Check
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return { label: 'L', class: 'bg-slate-100 text-slate-400 border border-slate-200', title: 'Libur Akhir Pekan' };
    }

    // Leave/Cuti Check
    const leaveType = leavesMap[empId]?.[dateStr];
    if (leaveType) {
      return { 
        label: leaveType[0], 
        class: leaveType === 'Cuti' ? 'bg-blue-50 text-blue-700 border border-blue-100 font-bold' : 
               leaveType === 'Sakit' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 font-bold' : 'bg-purple-50 text-purple-700 border border-purple-100 font-bold',
        title: `Izin resmi: ${leaveType}` 
      };
    }

    if (!att) {
      // Dynamic Alpa Check based on current system date
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const cellDate = new Date(parseInt(selectedYear, 10), parseInt(selectedMonthNum, 10) - 1, day);
      
      const isReset = localStorage.getItem('app_is_reset') === 'true';
      if (cellDate < todayStart && !isReset) {
        return { label: 'A', class: 'bg-rose-50 text-rose-600 border border-rose-100 font-bold', title: 'Tanpa Keterangan (Alpa)' };
      }
      return { label: '-', class: 'bg-slate-50 text-slate-300 border border-slate-100', title: 'Belum Ada Presensi' };
    }

    if (att.checkInStatus === 'Terlambat') {
      return { label: 'T', class: 'bg-amber-50 text-amber-600 border border-amber-100 font-bold', title: `Terlambat (${att.checkIn})` };
    }

    return { label: 'H', class: 'bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold', title: `Hadir Tepat Waktu (${att.checkIn})` };
  };

  const months = [
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

  const years = ['2026', '2027', '2028', '2029', '2030'];

  const selectedMonthLabel = useMemo(() => {
    return months.find(m => m.value === selectedMonthNum)?.label || 'Juni';
  }, [selectedMonthNum]);

  return (
    <div id="rekap-matrix-view" className="space-y-6">
      {/* Printable Area overrides */}
      <style>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          body * {
            visibility: hidden;
            background-color: transparent !important;
            color: black !important;
            border-color: #cbd5e1 !important;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background-color: white !important;
            color: black !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
          td, th {
            background-color: white !important;
            color: black !important;
            border-color: #94a3b8 !important;
          }
        }
      `}</style>

      {/* Normal Web Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center no-print">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Grid3X3 className="w-5 h-5 text-blue-600" />
            Rekap Absensi Bulanan PPNPN
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Lihat rekapitulasi kehadiran harian semua pegawai dalam satu layar.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Month Selector */}
          <select
            value={selectedMonthNum}
            onChange={(e) => setSelectedMonthNum(e.target.value)}
            className="text-xs px-3.5 py-2.5 border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-blue-500 rounded-lg shadow-sm font-medium"
          >
            {months.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>

          {/* Year Selector */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="text-xs px-3.5 py-2.5 border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-blue-500 rounded-lg shadow-sm font-medium"
          >
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          {/* Signature Date Picker */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Tanggal TTD:</span>
            <input
              type="date"
              value={signDate}
              onChange={(e) => setSignDate(e.target.value)}
              className="text-xs px-3 py-2 border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-blue-500 rounded-lg shadow-sm font-semibold font-mono"
            />
          </div>

          <button
            id="print-rekap-btn"
            onClick={handlePrintPdf}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg uppercase tracking-wider text-[10px] transition-colors flex items-center gap-2 shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Ekspor / Cetak Rekap PDF</span>
          </button>
        </div>
      </div>

      {/* Main Printable Card Layout */}
      <div id="web-rekap-area" className="bg-white p-6 border border-slate-200/80 rounded-xl shadow-sm space-y-6 overflow-x-auto">
        
        {/* PDF Header Section */}
        <div className="flex justify-between items-start border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <h1 className="text-lg font-bold text-slate-800 tracking-tight uppercase">REKAPITULASI PRESENSI BULANAN PPNPN</h1>
            <p className="text-xs text-blue-600 font-extrabold uppercase tracking-wider font-sans">KEMENTERIAN KEUANGAN REPUBLIK INDONESIA</p>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Kantor Wilayah Ditjen Perbendaharaan Provinsi Riau</p>
          </div>
          <div className="text-right font-mono text-xs text-slate-500 space-y-1">
            <p><strong>Periode Laporan:</strong> {selectedMonthLabel} {selectedYear}</p>
            <p><strong>Tanggal Cetak:</strong> {new Date().toLocaleDateString('id-ID')}</p>
            <p><strong>Status Pegawai:</strong> PPNPN Aktif</p>
          </div>
        </div>

        {/* Legend Panel */}
        <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-5 flex items-center justify-center rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-bold">H</span>
            Hadir Tepat Waktu (H)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-5 flex items-center justify-center rounded-md bg-amber-50 text-amber-600 border border-amber-100 text-[10px] font-bold">T</span>
            Terlambat (T)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-5 flex items-center justify-center rounded-md bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-bold">C</span>
            Cuti (C)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-5 flex items-center justify-center rounded-md bg-purple-50 text-purple-600 border border-purple-100 text-[10px] font-bold">I</span>
            Izin Penting (I)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-5 flex items-center justify-center rounded-md bg-rose-50 text-rose-600 border border-rose-100 text-[10px] font-bold">A</span>
            Alpa (A)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-5 flex items-center justify-center rounded-md bg-slate-100 text-slate-400 border border-slate-200 text-[10px] font-bold">L</span>
            Libur Sabtu/Minggu (L)
          </span>
        </div>

        {/* Dense Attendance Matrix Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-slate-200 text-xs text-slate-600">
            <thead>
              <tr className="bg-slate-50 text-slate-700">
                <th className="border border-slate-200 p-2 text-left sticky left-0 bg-slate-50 z-10 w-44 font-bold">Nama Pegawai / Username</th>
                {daysInMonth.map(day => (
                  <th key={day} className="border border-slate-200 p-1 text-center w-7 font-mono font-bold">
                    {day < 10 ? `0${day}` : day}
                  </th>
                ))}
                <th className="border border-slate-200 p-2 text-center w-10 font-bold text-emerald-600">H</th>
                <th className="border border-slate-200 p-2 text-center w-10 font-bold text-amber-600">T</th>
                <th className="border border-slate-200 p-2 text-center w-10 font-bold text-blue-600">C/I</th>
                <th className="border border-slate-200 p-2 text-center w-10 font-bold text-rose-600">A</th>
              </tr>
            </thead>
            <tbody>
              {employeesList.map(emp => {
                // Calculate summaries
                let countH = 0;
                let countT = 0;
                let countCI = 0;
                let countA = 0;

                daysInMonth.forEach(day => {
                  const info = getDayStatusCell(emp.id, day);
                  if (info.label === 'H') countH++;
                  if (info.label === 'T') countT++;
                  if (info.label === 'C' || info.label === 'I' || info.label === 'S') countCI++;
                  if (info.label === 'A') countA++;
                });

                return (
                  <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="border border-slate-200 p-2 font-bold text-slate-800 sticky left-0 bg-white z-10 shadow-sm w-44 truncate">
                      <div>{emp.name}</div>
                      <div className="text-[9px] text-slate-400 font-mono font-semibold mt-0.5">{emp.id}</div>
                    </td>
                    
                    {daysInMonth.map(day => {
                      const cellInfo = getDayStatusCell(emp.id, day);
                      return (
                        <td 
                          key={day} 
                          title={`${emp.name} - ${cellInfo.title}`}
                          className={`border border-slate-200 text-center p-1 text-[10px] font-bold cursor-pointer ${cellInfo.class}`}
                        >
                          {cellInfo.label}
                        </td>
                      );
                    })}

                    <td className="border border-slate-200 text-center p-2 font-bold text-emerald-600 bg-emerald-50">{countH}</td>
                    <td className="border border-slate-200 text-center p-2 font-bold text-amber-600 bg-amber-50">{countT}</td>
                    <td className="border border-slate-200 text-center p-2 font-bold text-blue-600 bg-blue-50">{countCI}</td>
                    <td className="border border-slate-200 text-center p-2 font-bold text-rose-600 bg-rose-50">{countA}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* PDF Signature Section */}
        <div className="grid grid-cols-2 pt-16 text-center text-xs text-slate-700">
          <div>
            <p className="text-[11px]">Mengetahui</p>
            <p className="font-bold text-[11px] mt-0.5">Kepala Bagian Umum</p>
            <div className="h-16"></div>
            <p className="text-[10px] text-slate-400 italic font-medium leading-none mb-1">Ditandatangani secara elektronik</p>
            <p className="font-bold text-slate-800 text-[11px]">Kartika Chandra</p>
            <p className="text-slate-500 text-[10px] font-mono">NIP 19710205 199603 2 001</p>
          </div>
          <div>
            <p className="text-[11px]">Pekanbaru, {formatIndonesianDate(signDate)}</p>
            <div className="h-[16px]"></div>
            <div className="h-16"></div>
            <p className="text-[10px] text-slate-400 italic font-medium leading-none mb-1">Ditandatangani secara elektronik</p>
            <p className="font-bold text-slate-800 text-[11px]">Rusdi Z</p>
            <p className="text-slate-500 text-[10px] font-mono">NIP 19781218 200501 1 002</p>
          </div>
        </div>

      </div>

      {/* Print Preview Modal */}
      {showPrintPreview && (
        <div className="fixed inset-0 bg-[#020617]/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto no-print">
          <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 flex flex-col max-h-[90vh]">
            
            {/* Modal Actions Header */}
            <div className="bg-white px-6 py-4 border-b border-slate-200 flex justify-between items-center shrink-0">
              <span className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Printer className="w-4 h-4 text-blue-600" />
                <span>Pratinjau Cetak Rekapitulasi Presensi PPNPN ({selectedMonthLabel} {selectedYear})</span>
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Kirim ke Printer</span>
                </button>
                <button
                  onClick={() => setShowPrintPreview(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-all cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>

            {/* Document Printable View Container - Satu kesatuan utuh & background putih semua */}
            <div className="flex-1 overflow-y-auto p-8 bg-slate-100 flex justify-center">
              {/* Actual paper sheet */}
              <div
                id="print-area"
                className="bg-white p-12 md:p-16 shadow-lg border border-slate-300/60 w-full text-black font-sans text-xs leading-normal relative flex flex-col gap-6"
                style={{ width: '100%', maxWidth: '29.7cm' }}
              >
                {/* PDF Header Section */}
                <div className="flex justify-between items-start border-b border-slate-200 pb-5">
                  <div className="space-y-1">
                    <h1 className="text-lg font-bold text-slate-800 tracking-tight uppercase">REKAPITULASI PRESENSI BULANAN PPNPN</h1>
                    <p className="text-xs text-blue-600 font-extrabold uppercase tracking-wider font-sans">KEMENTERIAN KEUANGAN REPUBLIK INDONESIA</p>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Kantor Wilayah Ditjen Perbendaharaan Provinsi Riau</p>
                  </div>
                  <div className="text-right font-mono text-xs text-slate-500 space-y-1">
                    <p><strong>Periode Laporan:</strong> {selectedMonthLabel} {selectedYear}</p>
                    <p><strong>Tanggal Cetak:</strong> {new Date().toLocaleDateString('id-ID')}</p>
                    <p><strong>Status Pegawai:</strong> PPNPN Aktif</p>
                  </div>
                </div>

                {/* Legend Panel */}
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <span className="w-5 h-5 flex items-center justify-center rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-bold">H</span>
                    Hadir Tepat Waktu (H)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-5 h-5 flex items-center justify-center rounded-md bg-amber-50 text-amber-600 border border-amber-100 text-[10px] font-bold">T</span>
                    Terlambat (T)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-5 h-5 flex items-center justify-center rounded-md bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-bold">C</span>
                    Cuti (C)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-5 h-5 flex items-center justify-center rounded-md bg-purple-50 text-purple-600 border border-purple-100 text-[10px] font-bold">I</span>
                    Izin Penting (I)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-5 h-5 flex items-center justify-center rounded-md bg-rose-50 text-rose-600 border border-rose-100 text-[10px] font-bold">A</span>
                    Alpa (A)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-5 h-5 flex items-center justify-center rounded-md bg-slate-100 text-slate-400 border border-slate-200 text-[10px] font-bold">L</span>
                    Libur Sabtu/Minggu (L)
                  </span>
                </div>

                {/* Dense Attendance Matrix Table */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-slate-200 text-xs text-slate-600">
                    <thead>
                      <tr className="bg-slate-50 text-slate-700">
                        <th className="border border-slate-200 p-2 text-left sticky left-0 bg-slate-50 z-10 w-44 font-bold">Nama Pegawai / Username</th>
                        {daysInMonth.map(day => (
                          <th key={day} className="border border-slate-200 p-1 text-center w-7 font-mono font-bold">
                            {day < 10 ? `0${day}` : day}
                          </th>
                        ))}
                        <th className="border border-slate-200 p-2 text-center w-10 font-bold text-emerald-600">H</th>
                        <th className="border border-slate-200 p-2 text-center w-10 font-bold text-amber-600">T</th>
                        <th className="border border-slate-200 p-2 text-center w-10 font-bold text-blue-600">C/I</th>
                        <th className="border border-slate-200 p-2 text-center w-10 font-bold text-rose-600">A</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employeesList.map(emp => {
                        // Calculate summaries
                        let countH = 0;
                        let countT = 0;
                        let countCI = 0;
                        let countA = 0;

                        daysInMonth.forEach(day => {
                          const info = getDayStatusCell(emp.id, day);
                          if (info.label === 'H') countH++;
                          if (info.label === 'T') countT++;
                          if (info.label === 'C' || info.label === 'I' || info.label === 'S') countCI++;
                          if (info.label === 'A') countA++;
                        });

                        return (
                          <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="border border-slate-200 p-2 font-bold text-slate-800 sticky left-0 bg-white z-10 shadow-sm w-44 truncate">
                              <div>{emp.name}</div>
                              <div className="text-[9px] text-slate-400 font-mono font-semibold mt-0.5">{emp.id}</div>
                            </td>
                            
                            {daysInMonth.map(day => {
                              const cellInfo = getDayStatusCell(emp.id, day);
                              return (
                                <td 
                                  key={day} 
                                  title={`${emp.name} - ${cellInfo.title}`}
                                  className={`border border-slate-200 text-center p-1 text-[10px] font-bold cursor-pointer ${cellInfo.class}`}
                                >
                                  {cellInfo.label}
                                </td>
                              );
                            })}

                            <td className="border border-slate-200 text-center p-2 font-bold text-emerald-600 bg-emerald-50">{countH}</td>
                            <td className="border border-slate-200 text-center p-2 font-bold text-amber-600 bg-amber-50">{countT}</td>
                            <td className="border border-slate-200 text-center p-2 font-bold text-blue-600 bg-blue-50">{countCI}</td>
                            <td className="border border-slate-200 text-center p-2 font-bold text-rose-600 bg-rose-50">{countA}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* PDF Signature Section */}
                <div className="grid grid-cols-2 pt-16 text-center text-xs text-slate-700">
                  <div>
                    <p className="text-[11px]">Mengetahui</p>
                    <p className="font-bold text-[11px] mt-0.5">Kepala Bagian Umum</p>
                    <div className="h-16"></div>
                    <p className="text-[10px] text-slate-400 italic font-medium leading-none mb-1">Ditandatangani secara elektronik</p>
                    <p className="font-bold text-slate-800 text-[11px]">Kartika Chandra</p>
                    <p className="text-slate-500 text-[10px] font-mono">NIP 19710205 199603 2 001</p>
                  </div>
                  <div>
                    <p className="text-[11px]">Pekanbaru, {formatIndonesianDate(signDate)}</p>
                    <div className="h-[16px]"></div>
                    <div className="h-16"></div>
                    <p className="text-[10px] text-slate-400 italic font-medium leading-none mb-1">Ditandatangani secara elektronik</p>
                    <p className="font-bold text-slate-800 text-[11px]">Rusdi Z</p>
                    <p className="text-slate-500 text-[10px] font-mono">NIP 19781218 200501 1 002</p>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
