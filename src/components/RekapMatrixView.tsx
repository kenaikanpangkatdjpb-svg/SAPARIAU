import React, { useState, useMemo } from 'react';
import { Grid3X3, Printer, FileDown, FileSpreadsheet, CheckCircle, Clock, AlertCircle, Calendar } from 'lucide-react';
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
  const [zoomLevel, setZoomLevel] = useState(1.15);
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

  const getFormattedPrintDate = () => {
    const today = new Date();
    return `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
  };

  const selectedMonth = useMemo(() => {
    return `${selectedYear}-${selectedMonthNum}`;
  }, [selectedYear, selectedMonthNum]);

  const employeesList = useMemo(() => {
    return employees.filter(e => e.role === 'karyawan');
  }, [employees]);

  // Helper to check for Indonesian National Holidays in 2026
  const isNationalHoliday = (dateStr: string): boolean => {
    const holidays = [
      '2026-01-01', // Tahun Baru
      '2026-02-15', // Isra Mikraj
      '2026-03-19', // Nyepi
      '2026-03-20', // Idul Fitri
      '2026-03-21', // Idul Fitri
      '2026-04-03', // Wafat Yesus Kristus
      '2026-05-01', // Hari Buruh
      '2026-05-14', // Kenaikan Yesus Kristus
      '2026-05-27', // Idul Adha
      '2026-06-01', // Hari Lahir Pancasila
      '2026-06-17', // Tahun Baru Islam
      '2026-08-17', // Hari Kemerdekaan RI
      '2026-08-26', // Maulid Nabi
      '2026-12-25', // Hari Raya Natal
    ];
    return holidays.includes(dateStr);
  };

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
      // Include any submitted leaves that are Approved or Pending (i.e. not Rejected)
      if (leave.status !== 'Rejected') {
        const startParts = leave.startDate.split('-').map(Number);
        const endParts = leave.endDate.split('-').map(Number);
        
        if (startParts.length === 3 && endParts.length === 3) {
          // Parse as UTC to prevent any timezone shifts or local-time DST boundaries
          const start = new Date(Date.UTC(startParts[0], startParts[1] - 1, startParts[2]));
          const end = new Date(Date.UTC(endParts[0], endParts[1] - 1, endParts[2]));
          
          const current = new Date(start);
          while (current <= end) {
            const y = current.getUTCFullYear();
            const m = String(current.getUTCMonth() + 1).padStart(2, '0');
            const dayStr = String(current.getUTCDate()).padStart(2, '0');
            const dateStr = `${y}-${m}-${dayStr}`;
            
            const empIdKey = leave.employeeId.toLowerCase();
            if (!map[empIdKey]) {
              map[empIdKey] = {};
            }
            map[empIdKey][dateStr] = leave.type;
            
            current.setUTCDate(current.getUTCDate() + 1);
          }
        }
      }
    });

    return map;
  }, [leaves]);

  const handlePrintPdf = () => {
    setShowPrintPreview(true);
  };

  const handleExportExcel = () => {
    // 1. Prepare BOM to support Excel UTF-8 correctly
    let csvContent = "\uFEFF";
    
    // 2. Titles
    csvContent += `"REKAPITULASI PRESENSI BULANAN PPNPN"\n`;
    csvContent += `"KANTOR WILAYAH DITJEN PERBENDAHARAAN PROVINSI RIAU"\n`;
    csvContent += `"Periode:","${selectedMonthLabel} ${selectedYear}"\n\n`;
    
    // 3. Headers
    const headers = ["No", "Nama Pegawai", "Jabatan"];
    daysInMonth.forEach(d => {
      headers.push(String(d));
    });
    headers.push("Hadir (H)", "Terlambat (TL)", "Sakit (S)", "Izin (I)", "Cuti (CT)", "Alpa (A)", "Persentase Kehadiran");
    
    csvContent += headers.map(h => `"${h}"`).join(",") + "\n";
    
    // 4. Data rows
    employeesList.forEach((emp, index) => {
      const row = [String(index + 1), emp.name, emp.position || "-"];
      
      let countH = 0;
      let countTL = 0;
      let countS = 0;
      let countI = 0;
      let countCT = 0;
      let countA = 0;
      let countHariKerja = 0;
      
      daysInMonth.forEach(day => {
        const status = getDayStatusCell(emp.id, day);
        row.push(status.label);
        
        if (status.label === 'H') countH++;
        if (status.label === 'TL') countTL++;
        if (status.label === 'S') countS++;
        if (status.label === 'I') countI++;
        if (status.label === 'CT') countCT++;
        if (status.label === 'A') countA++;
        
        if (status.label !== 'L' && status.label !== '-') {
          countHariKerja++;
        }
      });
      
      const persentase = countHariKerja > 0 
        ? Math.round(((countH + countTL) / countHariKerja) * 100) 
        : 100;
        
      row.push(
        String(countH),
        String(countTL),
        String(countS),
        String(countI),
        String(countCT),
        String(countA),
        `${persentase}%`
      );
      
      csvContent += row.map(r => `"${r}"`).join(",") + "\n";
    });
    
    // 5. Trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Rekap_Absensi_PPNPN_${selectedMonthLabel}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getDayStatusCell = (empId: string, day: number) => {
    const att = attendanceMatrix[empId]?.[day];
    const dayStr = day < 10 ? `0${day}` : `${day}`;
    const dateStr = `${selectedMonth}-${dayStr}`;
    
    // Parse using UTC components to prevent any local browser timezone shifts
    const parts = dateStr.split('-').map(Number);
    const dateObj = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    const dayOfWeek = dateObj.getUTCDay();

    // National Holiday Check
    if (isNationalHoliday(dateStr)) {
      return { 
        label: 'L', 
        class: 'bg-rose-100 text-rose-600 border border-rose-200 font-bold', 
        title: 'Libur Tanggal Merah' 
      };
    }

    // Weekend Check
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return { 
        label: 'L', 
        class: 'bg-slate-100 text-slate-400 border border-slate-200', 
        title: 'Libur Akhir Pekan' 
      };
    }

    // Leave/Cuti Check
    const leaveType = leavesMap[empId.toLowerCase()]?.[dateStr];
    if (leaveType) {
      return { 
        label: leaveType === 'Cuti' ? 'CT' : (leaveType === 'Sakit' ? 'S' : 'I'), 
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
        return { 
          label: 'A', 
          class: 'bg-rose-50 text-rose-600 border border-rose-100 font-bold', 
          title: 'Tanpa Keterangan (Alpa)' 
        };
      }
      return { 
        label: '-', 
        class: 'bg-slate-50 text-slate-300 border border-slate-100', 
        title: 'Belum Ada Presensi' 
      };
    }

    if (att.checkInStatus === 'Terlambat') {
      return { 
        label: 'TL', 
        class: 'bg-amber-50 text-amber-600 border border-amber-100 font-bold', 
        title: `Terlambat (${att.checkIn})` 
      };
    }

    return { 
      label: 'H', 
      class: 'bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold', 
      title: `Hadir Tepat Waktu (${att.checkIn})` 
    };
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
          @page {
            size: A4 landscape;
            margin: 4mm 6mm !important;
          }
          html, body {
            background-color: white !important;
            color: #1e293b !important;
            margin: 0 !important;
            padding: 0 !important;
            font-size: 8px !important;
          }
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            background-color: white !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 12px !important;
            zoom: 1 !important;
            transform: none !important;
          }
          .no-print {
            display: none !important;
          }
          /* Override parent wrappers of the print preview modal to prevent print clipping and hide backgrounds */
          div.fixed.inset-0 {
            background: transparent !important;
            backdrop-filter: none !important;
            position: static !important;
            overflow: visible !important;
            display: block !important;
          }
          div.fixed.inset-0 > div {
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            max-height: none !important;
            display: block !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
          }
          div.fixed.inset-0 > div > div.flex-1 {
            background: transparent !important;
            padding: 0 !important;
            overflow: visible !important;
            display: block !important;
          }
          /* Prevent clipping or scrollbars inside print-area layout */
          .overflow-x-auto {
            overflow: visible !important;
            overflow-x: visible !important;
            max-width: 100% !important;
            width: 100% !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            border: 1px solid #cbd5e1 !important;
          }
          /* Adjust header and body cells padding to ensure the entire wide grid fits landscape A4 perfectly with high-contrast borders */
          th, td {
            font-size: 8px !important;
            padding: 4px 3px !important;
            border: 1px solid #cbd5e1 !important;
            word-wrap: break-word !important;
          }
          th {
            font-weight: bold !important;
            background-color: #f1f5f9 !important;
            color: #1e293b !important;
          }
          /* Specific column styling to ensure they look exactly like Excel-PDF Lemurs */
          .col-nama {
            text-align: left !important;
            white-space: normal !important;
            font-weight: bold !important;
            width: 15% !important;
            min-width: 120px !important;
          }
          .col-day {
            text-align: center !important;
            font-family: monospace !important;
          }
          .col-sum {
            text-align: center !important;
            font-weight: bold !important;
          }
          /* Preserve all background colors, text colors, and borders on printed PDF */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Specific color palette definitions for printer fallback with strong color fills */
          .bg-emerald-50 { background-color: #ecfdf5 !important; color: #059669 !important; border-color: #a7f3d0 !important; }
          .bg-amber-50 { background-color: #fffbeb !important; color: #d97706 !important; border-color: #fde68a !important; }
          .bg-blue-50 { background-color: #eff6ff !important; color: #1d4ed8 !important; border-color: #bfdbfe !important; }
          .bg-indigo-50 { background-color: #e0e7ff !important; color: #4338ca !important; border-color: #c7d2fe !important; }
          .bg-purple-50 { background-color: #faf5ff !important; color: #7c3aed !important; border-color: #e9d5ff !important; }
          .bg-rose-50 { background-color: #fff1f2 !important; color: #e11d48 !important; border-color: #fecdd3 !important; }
          .bg-slate-50 { background-color: #f8fafc !important; color: #64748b !important; border-color: #e2e8f0 !important; }
          .bg-slate-100 { background-color: #f1f5f9 !important; color: #475569 !important; border-color: #cbd5e1 !important; }
          .bg-rose-100 { background-color: #ffe4e6 !important; color: #e11d48 !important; border-color: #fecdd3 !important; }
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
            <span>Ekspor / Cetak PDF</span>
          </button>

          <button
            id="export-excel-btn"
            onClick={handleExportExcel}
            className="px-4 py-2.5 bg-[#107c41] hover:bg-[#0b592e] text-white font-bold rounded-lg uppercase tracking-wider text-[10px] transition-colors flex items-center gap-2 shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Ekspor Excel</span>
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
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">KANTOR WILAYAH DITJEN PERBENDAHARAAN PROVINSI RIAU</p>
          </div>
          <div className="text-right font-mono text-xs text-slate-500 space-y-1">
            <p><strong>Periode Laporan:</strong> {selectedMonthLabel} {selectedYear}</p>
            <p><strong>Tanggal Cetak:</strong> {getFormattedPrintDate()}</p>
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
            <span className="w-5 h-5 flex items-center justify-center rounded-md bg-amber-50 text-amber-600 border border-amber-100 text-[10px] font-bold">TL</span>
            Terlambat (TL)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-5 flex items-center justify-center rounded-md bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-bold">CT</span>
            Cuti (CT)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-5 flex items-center justify-center rounded-md bg-indigo-50 text-indigo-600 border border-indigo-100 text-[10px] font-bold">S</span>
            Sakit (S)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-5 flex items-center justify-center rounded-md bg-purple-50 text-purple-600 border border-purple-100 text-[10px] font-bold">I</span>
            Izin (I)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-5 flex items-center justify-center rounded-md bg-rose-50 text-rose-600 border border-rose-100 text-[10px] font-bold">A</span>
            Alpa (A)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-5 flex items-center justify-center rounded-md bg-slate-100 text-slate-400 border border-slate-200 text-[10px] font-bold">L</span>
            Libur Sabtu/Minggu (L)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-5 flex items-center justify-center rounded-md bg-rose-100 text-rose-500 border border-rose-200 text-[10px] font-bold">L</span>
            Libur Tanggal Merah
          </span>
        </div>

        {/* Dense Attendance Matrix Table */}
        <div className="overflow-x-auto w-full">
          <table className="w-full border-collapse border border-slate-300 text-xs text-slate-700 min-w-[1100px] leading-tight font-sans">
            <thead>
              <tr className="bg-slate-100 text-slate-800">
                <th className="border border-slate-300 p-2.5 text-left sticky left-0 bg-slate-100 z-10 w-48 font-bold">Nama Pegawai</th>
                {daysInMonth.map(day => (
                  <th key={day} className="border border-slate-300 p-1 text-center w-7 font-mono font-bold">
                    {day < 10 ? `0${day}` : day}
                  </th>
                ))}
                <th className="border border-slate-300 p-2 text-center w-10 font-bold text-emerald-600">H</th>
                <th className="border border-slate-300 p-2 text-center w-10 font-bold text-amber-600">TL</th>
                <th className="border border-slate-300 p-2 text-center w-10 font-bold text-blue-600">CT</th>
                <th className="border border-slate-300 p-2 text-center w-10 font-bold text-indigo-600">S</th>
                <th className="border border-slate-300 p-2 text-center w-10 font-bold text-purple-600">I</th>
                <th className="border border-slate-300 p-2 text-center w-10 font-bold text-rose-600">A</th>
              </tr>
            </thead>
            <tbody>
              {employeesList.map(emp => {
                // Calculate summaries
                let countH = 0;
                let countTL = 0;
                let countCT = 0;
                let countS = 0;
                let countI = 0;
                let countA = 0;

                daysInMonth.forEach(day => {
                  const info = getDayStatusCell(emp.id, day);
                  if (info.label === 'H') countH++;
                  if (info.label === 'TL') countTL++;
                  if (info.label === 'CT') countCT++;
                  if (info.label === 'S') countS++;
                  if (info.label === 'I') countI++;
                  if (info.label === 'A') countA++;
                });

                return (
                  <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="border border-slate-300 p-2.5 font-bold text-slate-800 sticky left-0 bg-white z-10 shadow-sm w-48 truncate">
                      <div>{emp.name}</div>
                    </td>
                    
                    {daysInMonth.map(day => {
                      const cellInfo = getDayStatusCell(emp.id, day);
                      return (
                        <td 
                          key={day} 
                          title={`${emp.name} - ${cellInfo.title}`}
                          className={`border border-slate-300 text-center p-1 text-[10px] font-bold cursor-pointer ${cellInfo.class}`}
                        >
                          {cellInfo.label}
                        </td>
                      );
                    })}

                    <td className="border border-slate-300 text-center p-2 font-bold text-emerald-600 bg-emerald-50">{countH}</td>
                    <td className="border border-slate-300 text-center p-2 font-bold text-amber-600 bg-amber-50">{countTL}</td>
                    <td className="border border-slate-300 text-center p-2 font-bold text-blue-600 bg-blue-50">{countCT}</td>
                    <td className="border border-slate-300 text-center p-2 font-bold text-indigo-600 bg-indigo-50">{countS}</td>
                    <td className="border border-slate-300 text-center p-2 font-bold text-purple-600 bg-purple-50">{countI}</td>
                    <td className="border border-slate-300 text-center p-2 font-bold text-rose-600 bg-rose-50">{countA}</td>
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
            <p className="text-[11px] mt-0.5 opacity-0">&nbsp;</p>
            <div className="h-16"></div>
            <p className="text-[10px] text-slate-400 italic font-medium leading-none mb-1">Ditandatangani secara elektronik</p>
            <p className="font-bold text-slate-800 text-[11px]">Rusdi Z</p>
            <p className="text-slate-500 text-[10px] font-mono">NIP 19781218 200501 1 002</p>
          </div>
        </div>

      </div>

      {/* Print Preview Modal */}
      {showPrintPreview && (
        <div className="fixed inset-0 bg-[#020617]/70 backdrop-blur-sm z-50 flex items-center justify-center p-2 md:p-4 overflow-y-auto">
          <div className="bg-white w-[96vw] h-[95vh] max-w-[96vw] max-h-[95vh] rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            
            {/* Modal Actions Header */}
            <div className="bg-white px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-center shrink-0 no-print">
              <span className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Printer className="w-4 h-4 text-blue-600" />
                <span>Pratinjau Cetak Rekapitulasi Presensi PPNPN ({selectedMonthLabel} {selectedYear})</span>
              </span>
              <div className="flex items-center gap-4">
                {/* Zoom Controls */}
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg p-1">
                  <button
                    onClick={() => setZoomLevel(prev => Math.max(0.75, prev - 0.05))}
                    className="w-6 h-6 flex items-center justify-center bg-white hover:bg-slate-100 text-slate-700 rounded border border-slate-200 text-xs font-bold transition-all shadow-sm cursor-pointer"
                    title="Zoom Out"
                  >
                    -
                  </button>
                  <span className="text-xs font-mono font-bold text-slate-700 w-12 text-center select-none">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button
                    onClick={() => setZoomLevel(prev => Math.min(1.5, prev + 0.05))}
                    className="w-6 h-6 flex items-center justify-center bg-white hover:bg-slate-100 text-slate-700 rounded border border-slate-200 text-xs font-bold transition-all shadow-sm cursor-pointer"
                    title="Zoom In"
                  >
                    +
                  </button>
                </div>
                
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
            </div>

            {/* Document Printable View Container - Satu kesatuan utuh & background putih semua */}
            <div className="flex-1 overflow-y-auto p-8 bg-slate-100 flex justify-center items-start">
              {/* Actual paper sheet */}
              <div
                id="print-area"
                className="bg-white p-12 md:p-16 shadow-lg border border-slate-300/60 w-full text-black font-sans text-xs leading-normal relative flex flex-col gap-6 origin-top"
                style={{ width: '100%', maxWidth: '29.7cm', zoom: zoomLevel }}
              >
                {/* PDF Header Section */}
                <div className="flex justify-between items-start border-b border-slate-200 pb-5">
                  <div className="space-y-1">
                    <h1 className="text-lg font-bold text-slate-800 tracking-tight uppercase">REKAPITULASI PRESENSI BULANAN PPNPN</h1>
                    <p className="text-xs text-blue-600 font-extrabold uppercase tracking-wider font-sans">KEMENTERIAN KEUANGAN REPUBLIK INDONESIA</p>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">KANTOR WILAYAH DITJEN PERBENDAHARAAN PROVINSI RIAU</p>
                  </div>
                  <div className="text-right font-mono text-xs text-slate-500 space-y-1">
                    <p><strong>Periode Laporan:</strong> {selectedMonthLabel} {selectedYear}</p>
                    <p><strong>Tanggal Cetak:</strong> {getFormattedPrintDate()}</p>
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
                    <span className="w-5 h-5 flex items-center justify-center rounded-md bg-amber-50 text-amber-600 border border-amber-100 text-[10px] font-bold">TL</span>
                    Terlambat (TL)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-5 h-5 flex items-center justify-center rounded-md bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-bold">CT</span>
                    Cuti (CT)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-5 h-5 flex items-center justify-center rounded-md bg-indigo-50 text-indigo-600 border border-indigo-100 text-[10px] font-bold">S</span>
                    Sakit (S)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-5 h-5 flex items-center justify-center rounded-md bg-purple-50 text-purple-600 border border-purple-100 text-[10px] font-bold">I</span>
                    Izin (I)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-5 h-5 flex items-center justify-center rounded-md bg-rose-50 text-rose-600 border border-rose-100 text-[10px] font-bold">A</span>
                    Alpa (A)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-5 h-5 flex items-center justify-center rounded-md bg-slate-100 text-slate-400 border border-slate-200 text-[10px] font-bold">L</span>
                    Libur Sabtu/Minggu (L)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-5 h-5 flex items-center justify-center rounded-md bg-rose-100 text-rose-500 border border-rose-200 text-[10px] font-bold">L</span>
                    Libur Tanggal Merah
                  </span>
                </div>

                {/* Dense Attendance Matrix Table */}
                <div className="overflow-x-auto w-full">
                  <table className="w-full border-collapse border border-slate-200 text-[10px] min-w-[1100px] leading-tight font-sans">
                    <thead>
                      <tr className="bg-slate-50 text-slate-800">
                        <th className="col-nama border border-slate-200 p-2 text-left sticky left-0 bg-slate-50 z-10 w-48 font-bold text-slate-700">Nama Pegawai</th>
                        {daysInMonth.map(day => (
                          <th key={day} className="col-day border border-slate-200 p-1 text-center w-7 font-mono font-semibold text-slate-600">
                            {day < 10 ? `0${day}` : day}
                          </th>
                        ))}
                        <th className="col-sum border border-slate-200 p-2 text-center w-10 font-bold text-emerald-600 bg-emerald-50/30">H</th>
                        <th className="col-sum border border-slate-200 p-2 text-center w-10 font-bold text-amber-600 bg-amber-50/30">TL</th>
                        <th className="col-sum border border-slate-200 p-2 text-center w-10 font-bold text-blue-600 bg-blue-50/30">CT</th>
                        <th className="col-sum border border-slate-200 p-2 text-center w-10 font-bold text-indigo-600 bg-indigo-50/30">S</th>
                        <th className="col-sum border border-slate-200 p-2 text-center w-10 font-bold text-purple-600 bg-purple-50/30">I</th>
                        <th className="col-sum border border-slate-200 p-2 text-center w-10 font-bold text-rose-600 bg-rose-50/30">A</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employeesList.map(emp => {
                        // Calculate summaries
                        let countH = 0;
                        let countTL = 0;
                        let countCT = 0;
                        let countS = 0;
                        let countI = 0;
                        let countA = 0;

                        daysInMonth.forEach(day => {
                          const info = getDayStatusCell(emp.id, day);
                          if (info.label === 'H') countH++;
                          if (info.label === 'TL') countTL++;
                          if (info.label === 'CT') countCT++;
                          if (info.label === 'S') countS++;
                          if (info.label === 'I') countI++;
                          if (info.label === 'A') countA++;
                        });

                        return (
                          <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="col-nama border border-slate-200 p-2 font-bold text-slate-800 sticky left-0 bg-white z-10 shadow-sm w-48 truncate">
                              <div>{emp.name}</div>
                            </td>
                            
                            {daysInMonth.map(day => {
                              const cellInfo = getDayStatusCell(emp.id, day);
                              return (
                                <td 
                                  key={day} 
                                  title={`${emp.name} - ${cellInfo.title}`}
                                  className={`col-day border border-slate-200 text-center p-1 text-[10px] font-bold cursor-pointer ${cellInfo.class}`}
                                >
                                  {cellInfo.label}
                                </td>
                              );
                            })}

                            <td className="col-sum border border-slate-200 text-center p-2 font-bold text-emerald-600 bg-emerald-50">{countH}</td>
                            <td className="col-sum border border-slate-200 text-center p-2 font-bold text-amber-600 bg-amber-50">{countTL}</td>
                            <td className="col-sum border border-slate-200 text-center p-2 font-bold text-blue-600 bg-blue-50">{countCT}</td>
                            <td className="col-sum border border-slate-200 text-center p-2 font-bold text-indigo-600 bg-indigo-50">{countS}</td>
                            <td className="col-sum border border-slate-200 text-center p-2 font-bold text-purple-600 bg-purple-50">{countI}</td>
                            <td className="col-sum border border-slate-200 text-center p-2 font-bold text-rose-600 bg-rose-50">{countA}</td>
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
                    <p className="text-[11px] mt-0.5 opacity-0">&nbsp;</p>
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
