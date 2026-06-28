import React, { useState, useEffect, useMemo } from 'react';
import { FileText, CalendarRange, CheckCircle2, XCircle, AlertCircle, Send, Printer, X, Eye } from 'lucide-react';
import { Employee, LeaveRequest } from '../types';

interface ApprovalCutiViewProps {
  user: Employee;
  employees: Employee[];
  leaves: LeaveRequest[];
  onAddLeave: (newLeave: LeaveRequest) => void;
  onApproveLeave: (id: string, approve: boolean) => void;
  viewType: 'cuti' | 'izin';
}

export default function ApprovalCutiView({
  user,
  employees,
  leaves,
  onAddLeave,
  onApproveLeave,
  viewType
}: ApprovalCutiViewProps) {
  const isAdmin = user.role === 'admin';

  // State values for the form
  const [formData, setFormData] = useState({
    type: (viewType === 'cuti' ? 'Cuti' : 'Izin') as 'Cuti' | 'Izin' | 'Sakit',
    startDate: '',
    endDate: '',
    workDays: 1,
    address: '',
    backup1: '',
    backup2: '',
    reason: ''
  });

  const [successMsg, setSuccessMsg] = useState('');
  const [selectedPrintLeave, setSelectedPrintLeave] = useState<LeaveRequest | null>(null);

  const employeeCutiQuota = user.cutiQuota;

  // Filter lists: admins see all, employees see only their own
  const listToDisplay = useMemo(() => {
    return isAdmin 
      ? leaves 
      : leaves.filter(l => l.employeeId === user.id);
  }, [leaves, isAdmin, user.id]);

  // List of other employees for backups
  const backupEmployees = useMemo(() => {
    const list = employees.filter(e => e.role === 'karyawan' && e.id !== user.id).map(e => e.name);
    // Add default fallbacks to match the high-fidelity screenshots perfectly
    const fallbacks = [
      "Bambang Oetoyo Putra",
      "Robby Andayani",
      "Aditya Pratama",
      "Ahmad Nauval",
      "Dian Ariawan"
    ];
    // Merge list and fallbacks uniquely
    return Array.from(new Set([...list, ...fallbacks]));
  }, [employees, user.id, user.name]);

  // Set default backups if they are empty
  useEffect(() => {
    if (backupEmployees.length > 0) {
      setFormData(prev => ({
        ...prev,
        backup1: prev.backup1 || backupEmployees[0],
        backup2: prev.backup2 || (backupEmployees[1] || backupEmployees[0])
      }));
    }
  }, [backupEmployees]);

  // Sync default type when viewType changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      type: viewType === 'cuti' ? 'Cuti' : 'Izin'
    }));
  }, [viewType]);

  // Calculate workDays automatically when startDate or endDate changes
  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end >= start) {
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        setFormData(prev => ({ ...prev, workDays: diffDays }));
      }
    }
  }, [formData.startDate, formData.endDate]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.startDate || !formData.endDate || !formData.reason || !formData.address) {
      alert("Silakan lengkapi semua field termasuk Alamat Selama Cuti dan Alasan!");
      return;
    }

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    if (end < start) {
      alert("Tanggal selesai tidak boleh mendahului tanggal mulai!");
      return;
    }

    if (formData.type === 'Cuti' && formData.workDays > employeeCutiQuota) {
      alert(`Sisa kuota cuti Anda (${employeeCutiQuota} hari) tidak mencukupi untuk pengajuan ini (${formData.workDays} hari).`);
      return;
    }

    const newRequest: LeaveRequest = {
      id: `leave_${Date.now()}`,
      employeeId: user.id,
      employeeName: user.name,
      type: formData.type,
      startDate: formData.startDate,
      endDate: formData.endDate,
      reason: formData.reason,
      status: 'Pending',
      createdAt: new Date().toISOString().split('T')[0], // YYYY-MM-DD format for letter consistency
      workDays: formData.workDays,
      address: formData.address,
      backup1: formData.backup1 || backupEmployees[0] || 'Bambang Oetoyo Putra',
      backup2: formData.backup2 || backupEmployees[1] || 'Robby Andayani'
    };

    onAddLeave(newRequest);
    const typeLabel = formData.type === 'Cuti' ? 'Cuti Tahunan' : formData.type === 'Sakit' ? 'Cuti Sakit' : 'Izin';
    setSuccessMsg(`Pengajuan ${typeLabel} berhasil dikirim! Menunggu persetujuan admin.`);
    
    // Reset form fields while maintaining correct default type and backups
    setFormData(prev => ({
      ...prev,
      startDate: '',
      endDate: '',
      workDays: 1,
      address: '',
      reason: ''
    }));

    setTimeout(() => setSuccessMsg(''), 4000);
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

  // Helper to convert date to Indonesian Words Date (e.g. "22 Juni 2026")
  const formatIndonesianDate = (dateStr: string): string => {
    if (!dateStr) return '';
    // Handle both ISO timestamp and YYYY-MM-DD
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
    <div id="approval-cuti-view" className="space-y-6">
      {/* CSS printing support embedded directly to make it incredibly robust and robust */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-letter-target, #print-letter-target * {
            visibility: visible;
          }
          #print-letter-target {
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
        <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
          {viewType === 'cuti' ? 'Pengajuan Cuti Tahunan PPNPN' : 'Pengajuan Izin & Sakit PPNPN'}
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Formulir pengajuan resmi ketidakhadiran, sinkronisasi backup petugas penanggung jawab, dan cetak PDF persetujuan resmi.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Form (only for employees) or Info cards (for admin) */}
        {!isAdmin ? (
          <div className="lg:col-span-5 bg-white p-6 border border-slate-200 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <CalendarRange className="w-5 h-5 text-[#0B1E43]" />
              <h4 className="font-bold text-slate-800 text-sm">
                Formulir Pengajuan Cuti / Izin
              </h4>
            </div>

            {viewType === 'cuti' && (
              <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <p className="text-slate-500 font-semibold">Sisa Kuota Cuti Anda</p>
                  <p className="text-2xl font-black text-[#0B1E43] mt-0.5">{employeeCutiQuota} Hari</p>
                </div>
                <span className="text-[10px] font-bold uppercase text-blue-700 tracking-wider bg-blue-50 px-2.5 py-1 border border-blue-100 rounded-lg">
                  Tahun 2026
                </span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Jenis Pengajuan</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value as 'Cuti' | 'Izin' | 'Sakit'})}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:border-blue-500"
                >
                  <option value="Cuti">Cuti Tahunan</option>
                  <option value="Sakit">Cuti Sakit</option>
                  <option value="Izin">Izin</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Mulai</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-blue-500 font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Selesai</label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-blue-500 font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Jumlah Hari Kerja</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={formData.workDays}
                  onChange={(e) => setFormData({...formData, workDays: parseInt(e.target.value) || 1})}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Alamat Selama Cuti</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Jalan Kandis"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Petugas Penanggung Jawab 1 (Backup 1)</label>
                <select
                  value={formData.backup1}
                  onChange={(e) => setFormData({...formData, backup1: e.target.value})}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:border-blue-500"
                >
                  {backupEmployees.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Petugas Penanggung Jawab 2 (Backup 2)</label>
                <select
                  value={formData.backup2}
                  onChange={(e) => setFormData({...formData, backup2: e.target.value})}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:border-blue-500"
                >
                  {backupEmployees.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Keterangan Tambahan / Alasan</label>
                <textarea
                  required
                  rows={3}
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  placeholder="Contoh: kepentingan keluarga / penugasan dinas"
                  className="w-full text-xs p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                id="submit-leave-btn"
                type="submit"
                className="w-full py-3 px-4 bg-[#0B1E43] hover:bg-[#07142E] text-white font-extrabold rounded-xl uppercase tracking-wider text-[10px] transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <Send className="w-4 h-4" />
                <span>Kirim Pengajuan</span>
              </button>
            </form>
          </div>
        ) : (
          <div className="lg:col-span-4 space-y-4">
            {/* Admin Stats Board */}
            <div className="bg-gradient-to-br from-[#0B1E43] to-slate-900 p-6 rounded-2xl text-white shadow-md space-y-4">
              <h4 className="text-[10px] font-extrabold tracking-wider uppercase text-blue-300">
                {viewType === 'cuti' ? 'Persetujuan Cuti Tahunan PPNPN' : 'Persetujuan Izin & Sakit'}
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Anda berada di Panel Persetujuan Administratif. Di sini Anda dapat memberikan verifikasi dan persetujuan resmi atas ketidakhadiran pegawai PPNPN.
              </p>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-white/10 rounded-xl border border-white/10">
                  <span className="text-[9px] text-slate-300 block uppercase tracking-wider">Menunggu</span>
                  <span className="text-lg font-black text-amber-400 block mt-0.5">
                    {leaves.filter(l => l.status === 'Pending').length} Request
                  </span>
                </div>
                <div className="p-3 bg-white/10 rounded-xl border border-white/10">
                  <span className="text-[9px] text-slate-300 block uppercase tracking-wider">Selesai</span>
                  <span className="text-lg font-black text-emerald-400 block mt-0.5">
                    {leaves.filter(l => l.status !== 'Pending').length} Diproses
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Right Column: List of Leaves (Table format matching the first image) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h4 className="font-extrabold text-slate-800 text-sm">
              Riwayat Pengajuan Cuti & Izin
            </h4>
            <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-bold">
              {listToDisplay.length} Total
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
                {listToDisplay.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-xs font-semibold text-slate-400">
                      Belum ada riwayat pengajuan yang terdaftar.
                    </td>
                  </tr>
                ) : (
                  listToDisplay.map((leave) => {
                    const periodStr = leave.startDate === leave.endDate 
                      ? formatDateDMY(leave.startDate) 
                      : `${formatDateDMY(leave.startDate)} - ${formatDateDMY(leave.endDate)}`;

                    const displayType = leave.type === 'Cuti' ? 'Cuti Tahunan' : leave.type === 'Sakit' ? 'Cuti Sakit' : 'Izin';

                    return (
                      <tr key={leave.id} className="hover:bg-slate-50/50 transition-colors text-xs">
                        <td className="py-4 px-5 font-bold text-slate-800">
                          {displayType}
                          {isAdmin && (
                            <span className="block text-[9px] font-medium text-slate-400 font-sans mt-0.5">
                              Oleh: {leave.employeeName}
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-5 font-medium text-slate-600">
                          {periodStr}
                        </td>
                        <td className="py-4 px-5 text-slate-500 max-w-[150px] truncate" title={leave.reason}>
                          {leave.reason}
                        </td>
                        <td className="py-4 px-5">
                          <span className={`px-2.5 py-0.5 text-[9px] font-bold rounded-full border ${
                            leave.status === 'Pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                            leave.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                          }`}>
                            {leave.status === 'Pending' ? 'Pending' : leave.status === 'Approved' ? 'Approved' : 'Rejected'}
                          </span>
                        </td>
                        <td className="py-4 px-5">
                          <div className="flex items-center justify-center gap-1.5">
                            {leave.status === 'Approved' ? (
                              <button
                                onClick={() => setSelectedPrintLeave(leave)}
                                className="px-3 py-1.5 bg-[#0B1E43] hover:bg-[#07142E] text-white text-[10px] font-bold uppercase tracking-wider rounded-lg flex items-center gap-1 transition-all shadow-sm cursor-pointer"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>PDF</span>
                              </button>
                            ) : (
                              isAdmin && leave.status === 'Pending' ? (
                                <div className="flex gap-1.5">
                                  <button
                                    onClick={() => onApproveLeave(leave.id, true)}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-bold uppercase rounded-md transition-all shadow-sm"
                                  >
                                    Setuju
                                  </button>
                                  <button
                                    onClick={() => onApproveLeave(leave.id, false)}
                                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[9px] font-bold uppercase rounded-md transition-all shadow-sm"
                                  >
                                    Tolak
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

      {/* High-Fidelity Printable Leave Document Overlay Modal */}
      {selectedPrintLeave && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#0B1E43] text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-300" />
                <span className="font-bold text-sm tracking-tight">Dokumen Permohonan Cuti Resmi (Siap Cetak / PDF)</span>
              </div>
              <button
                onClick={() => setSelectedPrintLeave(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Document Printable View Container - Satu kesatuan utuh & background putih semua */}
            <div
              id="print-letter-target"
              className="flex-1 overflow-y-auto p-8 md:p-12 text-black bg-white font-serif text-sm leading-relaxed flex flex-col gap-8 max-h-[70vh] w-full"
            >
                {/* Letter Content Block */}
                <div>
                  {/* Top Right Date */}
                  <div className="text-right font-sans text-xs mb-8 text-slate-800">
                    Pekanbaru, {formatIndonesianDate(selectedPrintLeave.createdAt || selectedPrintLeave.startDate)}
                  </div>

                  {/* Hal & Address block */}
                  <div className="space-y-4 mb-8">
                    <div className="flex">
                      <span className="w-16 font-sans text-xs text-slate-500">Hal</span>
                      <span className="font-bold">: Permohonan {selectedPrintLeave.type === 'Cuti' ? 'Cuti Tahunan' : selectedPrintLeave.type === 'Sakit' ? 'Cuti Sakit' : 'Izin'}</span>
                    </div>

                    <div className="pt-2 font-sans text-xs text-slate-800 space-y-0.5">
                      <p>Kepada</p>
                      <p className="font-bold">Yth. Kepala Subbagian TURT</p>
                      <p>di tempat</p>
                    </div>
                  </div>

                  {/* Body Greeting */}
                  <div className="space-y-4 mb-6">
                    <p className="font-sans text-xs text-slate-800">Dengan hormat,</p>
                    <p className="font-sans text-xs text-slate-800">Yang bertanda tangan di bawah ini:</p>
                    
                    {/* Employee Profile */}
                    <div className="pl-6 space-y-1 font-sans text-xs text-slate-800">
                      <div className="flex">
                        <span className="w-24 font-bold">Nama</span>
                        <span>: {selectedPrintLeave.employeeName}</span>
                      </div>
                      <div className="flex">
                        <span className="w-24 font-bold">Jabatan</span>
                        <span>: PPNPN (Pegawai Pemerintah Non Pegawai Negeri)</span>
                      </div>
                    </div>

                    {/* Request sentence */}
                    <p className="font-sans text-xs text-slate-800 leading-relaxed text-justify">
                      Bermaksud mengajukan permohonan {selectedPrintLeave.type === 'Cuti' ? 'cuti tahunan' : selectedPrintLeave.type === 'Sakit' ? 'cuti sakit' : 'izin'} selama {selectedPrintLeave.workDays || 1} ({terbilang(selectedPrintLeave.workDays || 1)}) hari kerja pada tanggal {formatDateDMY(selectedPrintLeave.startDate)} {selectedPrintLeave.startDate !== selectedPrintLeave.endDate ? `s/d ${formatDateDMY(selectedPrintLeave.endDate)}` : ''} untuk keperluan {selectedPrintLeave.reason}. Adapun alamat saya selama menjalani {selectedPrintLeave.type === 'Cuti' ? 'cuti tahunan' : selectedPrintLeave.type === 'Sakit' ? 'cuti sakit' : 'izin'} berlokasi di {selectedPrintLeave.address || '-'}.
                    </p>

                    <p className="font-sans text-xs text-slate-800 leading-relaxed">
                      Demikian surat permohonan ini saya ajukan. Atas perhatian dan perkenan Bapak, saya ucapkan terima kasih.
                    </p>
                  </div>
                </div>

                {/* Signatures Area matching second image perfectly */}
                <div className="pt-8 border-t border-slate-100 font-sans text-xs text-slate-800">
                  <div className="grid grid-cols-2 gap-8 text-center">
                    {/* Left: Approver */}
                    <div className="space-y-1">
                      <p>Menyetujui,</p>
                      <p className="font-bold text-[11px] text-slate-500 uppercase tracking-wide">Kasubbag TURT,</p>
                      <div className="h-16 flex items-center justify-center relative">
                        {/* Real hand-written vector ink style drawing */}
                        {selectedPrintLeave.type !== 'Cuti' && (
                          <svg width="110" height="40" viewBox="0 0 120 45" fill="none" className="text-blue-800/85">
                            <path d="M15 22 C35 8, 55 35, 75 12 C90 3, 100 28, 115 18 M35 8 L45 32 M70 10 L65 28" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      <p className="font-bold underline text-slate-900">{selectedPrintLeave.approvedBy || 'Ahmad Nauval'}</p>
                    </div>

                    {/* Right: Requester */}
                    <div className="space-y-1">
                      <p className="text-slate-400 font-medium">Pemohon,</p>
                      <p className="font-bold text-[11px] text-slate-500 uppercase tracking-wide invisible">Spacer</p>
                      <div className="h-16 flex items-center justify-center relative">
                        {/* Real hand-written vector ink style drawing */}
                        {selectedPrintLeave.type !== 'Cuti' && (
                          <svg width="110" height="40" viewBox="0 0 120 45" fill="none" className="text-slate-800/85">
                            <path d="M12 28 C32 23, 42 3, 62 18 C82 28, 92 8, 108 13 M28 32 L78 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      <p className="font-bold underline text-slate-900">{selectedPrintLeave.employeeName}</p>
                    </div>
                  </div>

                  {/* Centered Backup Officers */}
                  <div className="mt-8 text-center space-y-3">
                    <p className="font-bold text-[10px] uppercase tracking-wider text-slate-500">Petugas Penanggung Jawab,</p>
                    
                    <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                      {/* Backup 1 */}
                      <div className="space-y-1">
                        <div className="h-12 flex items-center justify-center">
                          {selectedPrintLeave.type !== 'Cuti' && (
                            <svg width="90" height="30" viewBox="0 0 120 45" fill="none" className="text-blue-900/80">
                              <path d="M10 20 Q30 5 45 35 T85 15 T110 25 M35 15 C45 15, 40 30, 50 30" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                        <p className="font-semibold text-slate-700 text-xs border-t border-slate-200 pt-1">{selectedPrintLeave.backup1 || 'Robby Andayani'}</p>
                      </div>

                      {/* Backup 2 */}
                      <div className="space-y-1">
                        <div className="h-12 flex items-center justify-center">
                          {selectedPrintLeave.type !== 'Cuti' && (
                            <svg width="90" height="30" viewBox="0 0 120 45" fill="none" className="text-slate-800/80">
                              <path d="M15 15 C30 35, 55 5, 75 35 C90 10, 100 25, 115 15 M45 25 H85" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                        <p className="font-semibold text-slate-700 text-xs border-t border-slate-200 pt-1">{selectedPrintLeave.backup2 || 'Aditya Pratama'}</p>
                      </div>
                    </div>
                  </div>
                </div>

            </div>

            {/* Action Bar (Print & Close) */}
            <div className="px-6 py-4 bg-white border-t border-slate-200 flex justify-end gap-3 shrink-0">
              <button
                onClick={() => setSelectedPrintLeave(null)}
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
