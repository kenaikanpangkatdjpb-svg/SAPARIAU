import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Plus, CheckCircle, AlertCircle, Trash2, Printer, X, FileText, Send } from 'lucide-react';
import { Employee, LeaveRequest, OfficeSettings } from '../types';

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

interface PengajuanLemburViewProps {
  user: Employee;
  settings: OfficeSettings;
  leaves?: LeaveRequest[];
  onAddLeave?: (newLeave: LeaveRequest) => void;
  onDeleteLeave?: (id: string) => void;
}

export default function PengajuanLemburView({ 
  user, 
  settings,
  leaves,
  onAddLeave,
  onDeleteLeave
}: PengajuanLemburViewProps) {
  const [requests, setRequests] = useState<OvertimeRequest[]>([]);
  const [formData, setFormData] = useState({
    date: '',
    hours: '',
    reason: '',
  });

  const [successMsg, setSuccessMsg] = useState('');
  const [selectedPrintOvertime, setSelectedPrintOvertime] = useState<OvertimeRequest | null>(null);
  const [requestToDelete, setRequestToDelete] = useState<string | null>(null);

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

  // Load and seed initial overtime requests matching the high-fidelity screenshot
  useEffect(() => {
    let loadedRequests: OvertimeRequest[] = [];

    // For demo/initial seeding when leaves has no 'Lembur' requests and app is not reset:
    const hasLemburInLeaves = leaves && leaves.some(l => l.type === 'Lembur' && l.employeeId === user.id);
    if (!hasLemburInLeaves) {
      const isReset = localStorage.getItem('app_is_reset') === 'true';
      const initial: OvertimeRequest[] = isReset ? [] : [
        {
          id: 'ov_3',
          employeeId: user.id,
          employeeName: user.name,
          date: '2026-06-27',
          hours: 2,
          startTime: '17:00',
          endTime: '19:00',
          reason: 'Bersihkan kantor',
          status: 'Approved',
          createdAt: '2026-06-27T17:00:00',
          approvedBy: 'Ahmad Nauval'
        },
        {
          id: 'ov_2',
          employeeId: user.id,
          employeeName: user.name,
          date: '2026-06-26',
          hours: 2,
          startTime: '17:00',
          endTime: '19:00',
          reason: 'Bersihkan kantor',
          status: 'Pending',
          createdAt: '2026-06-26T17:01:00'
        },
        {
          id: 'ov_1',
          employeeId: user.id,
          employeeName: user.name,
          date: '2026-06-26',
          hours: 2,
          startTime: '17:00',
          endTime: '19:00',
          reason: 'Bersihkan kantor',
          status: 'Pending',
          createdAt: '2026-06-26T17:00:00'
        }
      ];
      loadedRequests = initial;
    }

    // Merge with synced leaves of type 'Lembur' for this employee
    if (leaves) {
      leaves.forEach(l => {
        if (l.type === 'Lembur' && l.employeeId === user.id) {
          const [startTime, endTime] = (l.address || '17:00-19:00').split('-');
          const existingIndex = loadedRequests.findIndex(r => r.id === l.id);
          const mapped: OvertimeRequest = {
            id: l.id,
            employeeId: l.employeeId,
            employeeName: l.employeeName,
            date: l.startDate,
            hours: l.workDays || 2,
            startTime: startTime || '17:00',
            endTime: endTime || '19:00',
            reason: l.reason,
            status: l.status,
            createdAt: l.createdAt,
            approvedBy: l.approvedBy
          };
          if (existingIndex !== -1) {
            loadedRequests[existingIndex] = mapped;
          } else {
            loadedRequests.push(mapped);
          }
        }
      });
    }

    // Sort by createdAt descending
    loadedRequests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setRequests(loadedRequests);
  }, [user, leaves]);

  const saveRequests = (updated: OvertimeRequest[]) => {
    setRequests(updated);
    window.dispatchEvent(new Event('storage'));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.date) {
      alert("Silakan pilih Tanggal Lembur!");
      return;
    }
    const parsedHours = parseFloat(formData.hours);
    if (isNaN(parsedHours) || parsedHours <= 0) {
      alert("Silakan isi Jumlah Jam Lembur yang valid!");
      return;
    }
    if (!formData.reason.trim()) {
      alert("Silakan isi Rencana Deskripsi Kegiatan Lembur!");
      return;
    }

    // Default start time: 17:00
    const startHour = 17;
    const endHour = (startHour + Math.floor(parsedHours)) % 24;
    const startStr = `${startHour}:00`;
    const endStr = `${String(endHour).padStart(2, '0')}:00`;

    const newReq: OvertimeRequest = {
      id: `ov_${Date.now()}`,
      employeeId: user.id,
      employeeName: user.name,
      date: formData.date,
      hours: parsedHours,
      startTime: startStr,
      endTime: endStr,
      reason: formData.reason,
      status: 'Pending',
      createdAt: new Date().toISOString()
    };

    const updated = [newReq, ...requests];
    saveRequests(updated);

    if (onAddLeave) {
      const leaveReq: LeaveRequest = {
        id: newReq.id,
        employeeId: newReq.employeeId,
        employeeName: newReq.employeeName,
        type: 'Lembur',
        startDate: newReq.date,
        endDate: newReq.date,
        reason: newReq.reason,
        status: 'Pending',
        createdAt: newReq.createdAt,
        workDays: newReq.hours,
        address: `${newReq.startTime}-${newReq.endTime}`
      };
      onAddLeave(leaveReq);
    }

    setFormData({ date: '', hours: '', reason: '' });
    
    setSuccessMsg("Surat Perintah Kerja Lembur berhasil dikirim! Menunggu persetujuan admin.");
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleDelete = (id: string) => {
    setRequestToDelete(id);
  };

  const executeDelete = () => {
    if (requestToDelete) {
      const updated = requests.filter(r => r.id !== requestToDelete);
      saveRequests(updated);

      if (onDeleteLeave) {
        onDeleteLeave(requestToDelete);
      }

      setRequestToDelete(null);
    }
  };

  // Helper to format date into DD/MM/YYYY
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

  // Indonesian number to words converter (for workDays terbilang)
  const terbilang = (n: number): string => {
    const words = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];
    if (n < 12) return words[n];
    if (n < 20) return words[n - 10] + ' belas';
    if (n < 100) {
      const tens = Math.floor(n / 10);
      const ones = n % 10;
      return words[tens] + ' puluh' + (ones ? ' ' + words[ones] : '');
    }
    return n.toString();
  };

  return (
    <div className="space-y-6">
      {/* Cancel Overtime Confirmation Modal */}
      {requestToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-md w-full p-6 shadow-xl space-y-5">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 bg-rose-50 text-rose-500 rounded-xl border border-rose-100 shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-800 text-sm">Batalkan Pengajuan Lembur</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Apakah Anda benar-benar yakin ingin membatalkan dan menghapus pengajuan lembur ini dari daftar Anda?
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 justify-end">
              <button
                type="button"
                onClick={() => setRequestToDelete(null)}
                className="px-4 py-2.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors uppercase tracking-wider text-[10px]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executeDelete}
                className="px-4 py-2.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors uppercase tracking-wider text-[10px] flex items-center gap-1.5 shadow-sm shadow-rose-100"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Batalkan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS printing support embedded directly */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-spkl-target, #print-spkl-target * {
            visibility: visible;
          }
          #print-spkl-target {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 2.5cm !important;
            margin: 0 !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
            font-size: 11pt !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div>
        <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Surat Perintah Kerja Lembur PPNPN</h2>
        <p className="text-xs text-slate-500 mt-1">
          Formulir pengajuan Surat Perintah Kerja Lembur (SPKL) mandiri dan cetak dokumen resmi yang telah disetujui.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form Container (5 cols) matching the first image */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-extrabold text-slate-800 text-sm">Formulir Pengajuan Lembur Kerja</h3>

          {successMsg && (
            <div className="p-3 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Jenis Pengajuan Dokumen */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Jenis Pengajuan Dokumen</label>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  value="Surat Perintah Kerja Lembur"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-700 font-bold focus:outline-none cursor-not-allowed"
                />
              </div>
            </div>

            {/* Date & Hours Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Tanggal Lembur</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  placeholder="dd/mm/yyyy"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-bold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Jumlah Jam Lembur</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 2"
                  value={formData.hours}
                  onChange={e => setFormData({ ...formData, hours: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 font-bold focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Rencana Deskripsi Kegiatan Lembur */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Rencana Deskripsi Kegiatan Lembur</label>
              <textarea
                required
                rows={4}
                placeholder="Contoh: Membersihkan rumah dinas kakanwil..."
                value={formData.reason}
                onChange={e => setFormData({ ...formData, reason: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl p-3.5 text-slate-800 font-medium placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 px-4 bg-[#0B1E43] hover:bg-[#07142E] text-white font-extrabold rounded-xl uppercase tracking-wider text-[10px] transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <span>Kirim Surat Perintah Kerja Lembur</span>
            </button>
          </form>
        </div>

        {/* Right Column: Riwayat Surat Perintah Kerja Lembur (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h4 className="font-extrabold text-slate-800 text-sm">
              Riwayat Surat Perintah Kerja Lembur
            </h4>
            <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-bold">
              {requests.length} Total
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-5">Jenis</th>
                  <th className="py-3 px-5">Periode Tanggal</th>
                  <th className="py-3 px-5">Keterangan</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-xs font-semibold text-slate-400">
                      Belum ada riwayat surat perintah kerja lembur.
                    </td>
                  </tr>
                ) : (
                  requests.map((req) => {
                    const formattedDate = formatDateDMY(req.date);
                    const periodStr = `${formattedDate} - ${formattedDate}`;

                    return (
                      <tr key={req.id} className="hover:bg-slate-50/50 transition-colors text-xs">
                        <td className="py-4 px-5 font-bold text-slate-800">
                          Surat Perintah Kerja Lembur
                        </td>
                        <td className="py-4 px-5 font-medium text-slate-600">
                          {periodStr}
                        </td>
                        <td className="py-4 px-5 text-slate-500 max-w-[180px] truncate" title={req.reason}>
                          {req.reason}
                        </td>
                        <td className="py-4 px-5">
                          <span className={`px-2.5 py-0.5 text-[9px] font-bold rounded-full border ${
                            req.status === 'Pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                            req.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                          }`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="py-4 px-5">
                          <div className="flex items-center justify-center">
                            {req.status === 'Approved' ? (
                              <button
                                onClick={() => setSelectedPrintOvertime(req)}
                                className="px-3 py-1.5 bg-[#0B1E43] hover:bg-[#07142E] text-white text-[10px] font-bold uppercase tracking-wider rounded-lg flex items-center gap-1 transition-all shadow-sm cursor-pointer"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>PDF</span>
                              </button>
                            ) : (
                              req.status === 'Pending' ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-slate-400 font-semibold text-xs">-</span>
                                  <button
                                    onClick={() => handleDelete(req.id)}
                                    className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded transition-colors"
                                    title="Batalkan Pengajuan"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-slate-300 text-[10px] font-semibold italic">No Action</span>
                              )
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
        </div>
      </div>

      {/* High-Fidelity Printable SPKL Document Overlay Modal */}
      {selectedPrintOvertime && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#0B1E43] text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-300" />
                <span className="font-bold text-sm tracking-tight">Dokumen SPKL Resmi (Siap Cetak / PDF)</span>
              </div>
              <button
                onClick={() => setSelectedPrintOvertime(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Document Printable View Container - Satu kesatuan utuh & background putih semua */}
            <div
              id="print-spkl-target"
              className="flex-1 overflow-y-auto p-8 md:p-12 text-black bg-white font-sans text-xs leading-relaxed flex flex-col gap-6 max-h-[70vh] w-full border border-slate-200 shadow-inner"
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
                  SURAT PERINTAH KERJA LEMBUR
                </h2>
                <p className="text-xs font-semibold text-slate-800">
                  Nomor : SPKL-{selectedPrintOvertime.id.replace(/\D/g, '').slice(-2) || '83'}/WPB.04/BG.01/2026
                </p>
              </div>

              {/* Introductory Paragraph */}
              <div className="text-xs text-black text-justify leading-relaxed">
                <p>
                  Sehubungan dengan adanya kegiatan Lembur yang akan diadakan di lingkungan Kantor Wilayah Ditjen Perbendaharaan Provinsi Riau, dengan ini kami memerintahkan pegawai sebagai berikut :
                </p>
              </div>

              {/* The 5-Column Grid Table */}
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
                    <tr>
                      <td className="border border-black p-3 text-center align-middle font-medium text-xs">1</td>
                      <td className="border border-black p-3 align-middle text-xs">
                        <div className="font-bold text-slate-900">{selectedPrintOvertime.employeeName}</div>
                        <div className="text-[9px] text-slate-500 font-mono font-normal mt-0.5 uppercase">PPNPN - {selectedPrintOvertime.employeeId}</div>
                      </td>
                      <td className="border border-black p-3 align-middle text-xs font-semibold text-slate-800 text-left whitespace-pre-line">
                        {formatDayAndDate(selectedPrintOvertime.date)}
                      </td>
                      <td className="border border-black p-3 text-center align-middle font-bold text-xs">
                        {selectedPrintOvertime.hours}
                      </td>
                      <td className="border border-black p-3 align-middle text-xs text-slate-800 leading-normal text-left">
                        {selectedPrintOvertime.reason}
                      </td>
                    </tr>
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
                    Pekanbaru, {formatIndonesianDate(selectedPrintOvertime.date)}
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

            {/* Action Bar (Print & Close) */}
            <div className="px-6 py-4 bg-white border-t border-slate-200 flex justify-end gap-3 shrink-0">
              <button
                onClick={() => setSelectedPrintOvertime(null)}
                className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Kembali
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-5 py-2 bg-[#0B1E43] hover:bg-[#07142E] text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-md cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Dokumen Resmi (PDF)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
