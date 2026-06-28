import React, { useState, useEffect, useMemo } from 'react';
import { Printer, Search, Calendar, User, Clock, FileText, Check, X, Info } from 'lucide-react';
import { Employee, Attendance, OfficeSettings } from '../types';

interface OvertimeRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  hours: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
  startTime?: string;
  endTime?: string;
  approvedBy?: string;
}

interface RekapitulasiSpklViewProps {
  employees: Employee[];
  attendance: Attendance[];
  settings: OfficeSettings;
}

export default function RekapitulasiSpklView({
  employees,
  attendance,
  settings
}: RekapitulasiSpklViewProps) {
  const [requests, setRequests] = useState<OvertimeRequest[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [kopSettings, setKopSettings] = useState({
    headerLine1: 'KEMENTERIAN KEUANGAN REPUBLIK INDONESIA',
    headerLine2: 'DIREKTORAT JENDERAL PERBENDAHARAAN',
    headerLine3: 'KANTOR WILAYAH DITJEN PERBENDAHARAAN',
    headerLine4: 'PROVINSI RIAU',
    addressLine: 'JALAN JENDERAL SUDIRMAN NO. 249 PEKANBARU 28116',
    phoneFaxLine: 'TELEPON 0761-22686, FAKSIMILE 0761-22647',
    websiteLine: 'http://www.djpbn.kemenkeu.go.id/kanwil/riau',
    kopLogoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=60'
  });

  useEffect(() => {
    const loadKop = () => {
      const saved = localStorage.getItem('kop_settings');
      if (saved) {
        try {
          const data = JSON.parse(saved);
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

  // Load and seed initial overtime requests matching the screenshot
  const loadRequests = () => {
    const allReqs: OvertimeRequest[] = [];
    
    // Read from all localStorage keys starting with 'overtime_requests_'
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('overtime_requests_')) {
        try {
          const items = JSON.parse(localStorage.getItem(key) || '[]');
          if (Array.isArray(items)) {
            allReqs.push(...items);
          }
        } catch (e) {
          console.error('Failed to load overtimes from key:', key, e);
        }
      }
    }

    // Seed defaults if no requests are found anywhere
    if (allReqs.length === 0) {
      const isReset = localStorage.getItem('app_is_reset') === 'true';
      if (isReset) {
        setRequests([]);
        setSelectedIds([]);
        return;
      }
      const initial: OvertimeRequest[] = [
        {
          id: 'ov_1782447842128',
          employeeId: 'maliq',
          employeeName: 'maliq',
          date: '2026-06-26',
          hours: 2,
          startTime: '17:00',
          endTime: '19:00',
          reason: 'Bersihkan kantor',
          status: 'Pending',
          createdAt: '2026-06-26T17:00:00'
        },
        {
          id: 'ov_1782447840911',
          employeeId: 'maliq',
          employeeName: 'maliq',
          date: '2026-06-26',
          hours: 2,
          startTime: '17:00',
          endTime: '19:00',
          reason: 'Bersihkan kantor',
          status: 'Pending',
          createdAt: '2026-06-26T17:01:00'
        },
        {
          id: 'ov_1782447803487',
          employeeId: 'maliq',
          employeeName: 'maliq',
          date: '2026-06-27',
          hours: 2,
          startTime: '17:00',
          endTime: '19:00',
          reason: 'Bersihkan kantor',
          status: 'Approved',
          createdAt: '2026-06-27T17:00:00',
          approvedBy: 'Ahmad Nauval'
        }
      ];
      setRequests(initial);
      localStorage.setItem('overtime_requests_maliq', JSON.stringify(initial));
      
      // Check the approved item by default to match the screenshot
      setSelectedIds(['ov_1782447803487']);
    } else {
      // Sort by date descending
      allReqs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRequests(allReqs);

      // Pre-check any approved items if selected list is empty
      if (selectedIds.length === 0) {
        const approvedIds = allReqs.filter(r => r.status === 'Approved').map(r => r.id);
        if (approvedIds.length > 0) {
          setSelectedIds([approvedIds[0]]);
        }
      }
    }
  };

  useEffect(() => {
    loadRequests();
  }, [employees]);

  // Handle mass/individual checkbox change
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const visibleIds = filteredRequests.map(r => r.id);
      setSelectedIds(visibleIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(item => item !== id));
    }
  };

  // Helper to resolve department/position of employee
  const getEmployeePosition = (empId: string): string => {
    const emp = employees.find(e => e.id === empId);
    return emp?.position || 'PPNPN';
  };

  // Helper to convert date to DD/MM/YYYY
  const formatDateDMY = (dateStr: string): string => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  // Helper to convert date to Indonesian Words Date (e.g. "27 Juni 2026")
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

  // Helper to convert date to Day, DD Month YYYY (e.g., "Minggu, 3 Mei 2026")
  const formatDayAndDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const simpleDate = dateStr.split('T')[0];
    const parts = simpleDate.split('-');
    if (parts.length === 3) {
      // Calculate day name
      const dateObj = new Date(simpleDate);
      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const dayName = days[dateObj.getDay()];

      const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      const day = parseInt(parts[2], 10);
      const month = months[parseInt(parts[1], 10) - 1];
      const year = parts[0];
      return `${dayName}, ${day} ${month} ${year}`;
    }
    return dateStr;
  };

  // Filter requests based on search term
  const filteredRequests = useMemo(() => {
    return requests.filter(req => 
      req.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `REQ-${req.id.replace('ov_', '')}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [requests, searchTerm]);

  // Selected requests data for the print preview
  const selectedRequestsData = useMemo(() => {
    return requests.filter(r => selectedIds.includes(r.id));
  }, [requests, selectedIds]);

  return (
    <div className="space-y-6">
      {/* CSS Printing Styles */}
      <style>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          /* Hide app elements entirely */
          #app-sidebar, #app-header, .no-print, .modal-actions-header {
            display: none !important;
          }
          #print-spkl-collective, #print-spkl-collective * {
            visibility: visible;
          }
          #print-spkl-collective {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background-color: white !important;
            color: black !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
          }
          table {
            border-collapse: collapse !important;
            width: 100% !important;
          }
          th, td {
            border: 1px solid #1e293b !important;
            padding: 6px 8px !important;
            color: black !important;
          }
        }
      `}</style>

      {/* Header Section mimicking the user's high-fidelity layout */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
        <div>
          <h2 className="text-xl font-extrabold text-[#0F172A] tracking-tight">
            Rekapitulasi SPKL Kolektif PPNPN
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manajemen dan pencetakan Surat Perintah Kerja Lembur (SPKL) kolektif terintegrasi.
          </p>
        </div>

        <button
          onClick={() => {
            if (selectedIds.length === 0) {
              alert("Silakan pilih minimal 1 SPKL untuk dicetak kolektif!");
              return;
            }
            setShowPrintPreview(true);
          }}
          className="px-5 py-2.5 bg-[#0B1E43] hover:bg-[#07142E] text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-2 cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Cetak SPKL Kolektif ({selectedIds.length} SPKL)</span>
        </button>
      </div>

      {/* Quick Search & Filter Info (No-print) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 no-print">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Cari ID, Nama atau Uraian Tugas..."
            className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-blue-500 font-medium"
          />
        </div>
        <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
          <Info className="w-3.5 h-3.5 text-blue-500" />
          <span>Centang baris tabel di bawah untuk memilih SPKL yang akan dicetak secara kolektif.</span>
        </div>
      </div>

      {/* Main Printable Table Card Layout */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden no-print">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-slate-200/60 text-xs font-extrabold text-slate-500">
                <th className="py-4 px-6 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={filteredRequests.length > 0 && selectedIds.length === filteredRequests.length}
                    onChange={e => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="py-4 px-5 font-bold">ID Pengajuan</th>
                <th className="py-4 px-5 font-bold">Nama Pegawai</th>
                <th className="py-4 px-5 font-bold">Jabatan</th>
                <th className="py-4 px-5 font-bold">Tanggal Lembur</th>
                <th className="py-4 px-5 font-bold">Jumlah Jam</th>
                <th className="py-4 px-5 font-bold">Uraian Tugas</th>
                <th className="py-4 px-5 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs font-semibold text-slate-400">
                    Tidak ada data rekapitulasi SPKL yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredRequests.map(req => {
                  const displayId = `REQ-${req.id.replace('ov_', '')}`;
                  const isChecked = selectedIds.includes(req.id);
                  const position = getEmployeePosition(req.employeeId);

                  return (
                    <tr 
                      key={req.id} 
                      className={`hover:bg-slate-50/50 transition-colors text-xs ${
                        isChecked ? 'bg-blue-50/10' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-4 px-6 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={e => handleSelectRow(req.id, e.target.checked)}
                          className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>

                      {/* ID Pengajuan */}
                      <td className="py-4 px-5 font-mono font-semibold text-slate-800">
                        {displayId}
                      </td>

                      {/* Nama Pegawai */}
                      <td className="py-4 px-5 font-bold text-slate-800">
                        {req.employeeName}
                      </td>

                      {/* Jabatan */}
                      <td className="py-4 px-5 font-semibold text-slate-400 uppercase tracking-wide">
                        {position}
                      </td>

                      {/* Tanggal Lembur */}
                      <td className="py-4 px-5 font-semibold text-slate-600">
                        {formatDateDMY(req.date)}
                      </td>

                      {/* Jumlah Jam */}
                      <td className="py-4 px-5 font-bold text-slate-700">
                        {req.hours} Jam
                      </td>

                      {/* Uraian Tugas */}
                      <td className="py-4 px-5 font-medium text-slate-500 max-w-xs truncate" title={req.reason}>
                        {req.reason}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-5">
                        <span className={`px-3 py-1 text-[11px] font-bold rounded-lg border ${
                          req.status === 'Approved'
                            ? 'bg-[#EBFDF5] text-[#10B981] border-[#D1FAE5]'
                            : req.status === 'Pending'
                            ? 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]'
                            : 'bg-rose-50 text-rose-600 border-rose-100'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* High-Fidelity Printable Collective SPKL Document Overlay Modal */}
      {showPrintPreview && (
        <div className="fixed inset-0 bg-[#020617]/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto no-print">
          <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 flex flex-col max-h-[90vh]">
            
            {/* Modal Actions Header */}
            <div className="bg-white px-6 py-4 border-b border-slate-200 flex justify-between items-center shrink-0">
              <span className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Printer className="w-4 h-4 text-blue-600" />
                <span>Pratinjau Cetak Surat Perintah Kerja Lembur Kolektif ({selectedIds.length} Pengajuan)</span>
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
                id="print-spkl-collective"
                className="bg-white p-12 md:p-16 shadow-lg border border-slate-300/60 w-full text-black font-sans text-xs leading-normal relative flex flex-col gap-6"
                style={{ width: '100%', maxWidth: '29.7cm' }}
              >
                {/* KOP SURAT (LETTERHEAD) WITH LOGO AND STYLIZED RULES */}
                <div className="flex items-center justify-between gap-4 pb-3">
                  {/* Logo Instansi */}
                  <div className="shrink-0 w-16 h-16 flex items-center justify-center overflow-hidden">
                    <img 
                      src={kopSettings.kopLogoUrl} 
                      alt="Logo Instansi" 
                      className="max-w-full max-h-full object-contain" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  {/* Text Kop Surat */}
                  <div className="text-center space-y-0.5 flex-1 font-serif">
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

                {/* Double underline border for kop */}
                <div className="space-y-[2px] -mt-2">
                  <div className="border-b-[3px] border-black w-full"></div>
                  <div className="border-b border-black w-full"></div>
                </div>

                {/* Document Title */}
                <div className="text-center space-y-0.5 my-2">
                  <h2 className="font-bold text-sm uppercase tracking-wider underline">
                    SURAT PERINTAH KERJA LEMBUR KOLEKTIF
                  </h2>
                  <p className="text-xs font-semibold text-slate-800">
                    Nomor : SPKL-KOL/{new Date().getFullYear()}/WPB.04/BG.01
                  </p>
                </div>

                {/* Introductory Paragraph */}
                <div className="text-xs text-black text-justify leading-relaxed">
                  <p>
                    Sehubungan dengan adanya kegiatan Lembur yang akan diadakan di lingkungan Kantor Wilayah Ditjen Perbendaharaan Provinsi Riau, dengan ini kami memerintahkan pegawai-pegawai sebagai berikut :
                  </p>
                </div>

                {/* The 5-Column Grid Table for Collective SPKL */}
                <div className="pt-1">
                  <table className="w-full border-collapse border border-black text-xs text-black">
                    <thead>
                      <tr className="bg-white">
                        <th className="border border-black p-2.5 text-center w-12 font-bold text-xs">No</th>
                        <th className="border border-black p-2.5 text-center w-48 font-bold text-xs">Nama / NIK</th>
                        <th className="border border-black p-2.5 text-center w-40 font-bold text-xs">Waktu Penugasan</th>
                        <th className="border border-black p-2.5 text-center w-24 font-bold text-xs">Jumlah Jam Lembur</th>
                        <th className="border border-black p-2.5 text-center font-bold text-xs">Uraian Kegiatan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRequestsData.map((req, index) => {
                        return (
                          <tr key={req.id}>
                            <td className="border border-black p-2.5 text-center align-middle font-medium text-xs">{index + 1}</td>
                            <td className="border border-black p-2.5 align-middle text-xs">
                              <div className="font-bold text-slate-900">{req.employeeName}</div>
                              <div className="text-[9px] text-slate-500 font-mono font-normal mt-0.5 uppercase">PPNPN - {req.employeeId}</div>
                            </td>
                            <td className="border border-black p-2.5 align-middle text-xs font-semibold text-slate-800 text-left whitespace-pre-line">
                              {formatDayAndDate(req.date)}
                            </td>
                            <td className="border border-black p-2.5 text-center align-middle font-bold text-xs">
                              {req.hours}
                            </td>
                            <td className="border border-black p-2.5 align-middle text-xs text-slate-800 leading-normal text-left">
                              {req.reason}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Concluding Paragraphs */}
                <div className="text-xs text-black text-justify space-y-3 leading-relaxed pt-1">
                  <p>
                    Untuk menyelesaikan pekerjaan dimaksud pada hari yang telah ditetapkan.
                  </p>
                  <p>
                    Demikian Surat Perintah ini dibuat dengan sebenarnya, apabila dikemudian hari Surat Perintah ini tidak benar, saya bersedia dikenakan sanksi sesuai peraturan perundang – undangan.
                  </p>
                </div>

                {/* Signature Section */}
                <div className="flex justify-end pt-4 font-sans text-xs text-black">
                  <div className="text-center w-64 space-y-1">
                    <p className="text-left pl-6">
                      Pekanbaru, {formatIndonesianDate(new Date().toISOString().split('T')[0])}
                    </p>
                    <p className="font-semibold text-slate-800 uppercase tracking-wide text-left pl-6">
                      Kepala Bagian Umum,
                    </p>
                    
                    {/* High-fidelity Digital Certificate Seal Area (Ditandatangani secara elektronik) */}
                    <div className="py-4 flex justify-center">
                      <div className="flex flex-col items-center justify-center border border-dashed border-slate-300 p-2 rounded bg-slate-50/50 max-w-[190px] shadow-sm">
                        <span className="text-[7px] font-bold uppercase tracking-wider text-slate-400">Balai Sertifikasi Elektronik</span>
                        <div className="flex items-center gap-1 my-1">
                          <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          <span className="text-[8px] font-bold text-slate-700 tracking-tight">TTE PAS CA</span>
                        </div>
                        <span className="text-[8px] text-slate-400 font-semibold italic">Ditandatangani secara elektronik</span>
                      </div>
                    </div>

                    <p className="font-bold underline text-slate-900 text-left pl-6">Kartika Chandra</p>
                    <p className="font-mono text-[10px] text-slate-500 text-left pl-6">NIP 19710205 199603 2 001</p>
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
