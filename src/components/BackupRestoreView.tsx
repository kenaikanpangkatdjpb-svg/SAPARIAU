import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Download, 
  Upload, 
  Database, 
  CheckCircle2, 
  AlertTriangle, 
  FileJson, 
  RefreshCw, 
  FileSpreadsheet, 
  HardDrive, 
  ShieldCheck, 
  Info, 
  Users, 
  CalendarCheck, 
  Clock, 
  BookOpen, 
  Check, 
  X, 
  Server,
  Cloud,
  CloudUpload,
  CloudDownload,
  Trash2,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { Employee, Attendance, LeaveRequest, Logbook, OfficeSettings } from '../types';
import { 
  saveBackupSnapshotToSupabase, 
  getBackupSnapshotsFromSupabase, 
  deleteBackupSnapshotFromSupabase 
} from '../utils/supabase';

export interface BackupDataPackage {
  backupVersion: string;
  appName: string;
  exportedAt: string;
  exportedBy: string;
  employees: Employee[];
  attendance: Attendance[];
  leaves: LeaveRequest[];
  logbooks: Logbook[];
  settings: OfficeSettings;
  kopSettings?: any;
  overtimeAttendanceRecords?: any[];
  overtimeRequests?: { [key: string]: any };
  kepatuhanInternalFindings?: any[];
}

interface BackupRestoreViewProps {
  user: Employee;
  employees: Employee[];
  attendance: Attendance[];
  leaves: LeaveRequest[];
  logbooks: Logbook[];
  settings: OfficeSettings;
  supabaseConnected: boolean;
  isSyncingSupabase: boolean;
  onRestoreData: (backupPackage: BackupDataPackage, mode: 'overwrite' | 'merge') => Promise<void>;
}

export default function BackupRestoreView({
  user,
  employees,
  attendance,
  leaves,
  logbooks,
  settings,
  supabaseConnected,
  isSyncingSupabase,
  onRestoreData
}: BackupRestoreViewProps) {
  const [activeTab, setActiveTab] = useState<'file' | 'cloud'>('file');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedBackup, setParsedBackup] = useState<BackupDataPackage | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [restoreMode, setRestoreMode] = useState<'overwrite' | 'merge'>('overwrite');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Cloud Snapshot States
  const [cloudSnapshots, setCloudSnapshots] = useState<any[]>([]);
  const [isLoadingSnapshots, setIsLoadingSnapshots] = useState(false);
  const [snapshotNote, setSnapshotNote] = useState('');
  const [isCreatingSnapshot, setIsCreatingSnapshot] = useState(false);
  const [selectedSnapshotForRestore, setSelectedSnapshotForRestore] = useState<any | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Helper to gather full system backup package
  const createBackupPackage = useCallback((): BackupDataPackage => {
    let kopSettings = null;
    try {
      const savedKop = localStorage.getItem('kop_settings');
      if (savedKop) kopSettings = JSON.parse(savedKop);
    } catch (e) {
      console.warn("Could not read kop_settings", e);
    }

    let overtimeAttendanceRecords: any[] = [];
    try {
      const savedOt = localStorage.getItem('overtime_attendance_records');
      if (savedOt) overtimeAttendanceRecords = JSON.parse(savedOt);
    } catch (e) {
      console.warn("Could not read overtime_attendance_records", e);
    }

    const overtimeRequests: { [key: string]: any } = {};
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('overtime_requests_')) {
          const val = localStorage.getItem(key);
          if (val) overtimeRequests[key] = JSON.parse(val);
        }
      }
    } catch (e) {
      console.warn("Could not read overtime_requests", e);
    }

    let kepatuhanInternalFindings: any[] = [];
    try {
      const savedKi = localStorage.getItem('kepatuhan_internal_findings');
      if (savedKi) kepatuhanInternalFindings = JSON.parse(savedKi);
    } catch (e) {
      console.warn("Could not read kepatuhan_internal_findings", e);
    }

    return {
      backupVersion: "2.0",
      appName: "Sistem Absensi & Administrasi PPNPN",
      exportedAt: new Date().toISOString(),
      exportedBy: user.name || 'Administrator',
      employees,
      attendance,
      leaves,
      logbooks,
      settings,
      kopSettings,
      overtimeAttendanceRecords,
      overtimeRequests,
      kepatuhanInternalFindings
    };
  }, [employees, attendance, leaves, logbooks, settings, user.name]);

  // Load cloud snapshots
  const loadCloudSnapshots = useCallback(async () => {
    if (!supabaseConnected) return;
    setIsLoadingSnapshots(true);
    try {
      const list = await getBackupSnapshotsFromSupabase();
      setCloudSnapshots(list);
    } catch (err: any) {
      console.warn("Could not load snapshots", err);
    } finally {
      setIsLoadingSnapshots(false);
    }
  }, [supabaseConnected]);

  useEffect(() => {
    if (activeTab === 'cloud') {
      loadCloudSnapshots();
    }
  }, [activeTab, loadCloudSnapshots]);

  // Handler: Create Cloud Snapshot
  const handleCreateCloudSnapshot = async () => {
    if (!supabaseConnected) {
      setErrorMessage("Koneksi Firebase Firestore sedang offline. Pastikan database cloud terhubung.");
      return;
    }

    setIsCreatingSnapshot(true);
    setErrorMessage(null);
    try {
      const pkg = createBackupPackage();
      const res = await saveBackupSnapshotToSupabase(pkg, snapshotNote || `Snapshot Rutin ${new Date().toLocaleDateString('id-ID')}`);
      if (res.success) {
        setSuccessMessage("Snapshot cadangan berhasil disimpan langsung ke cloud Firebase Firestore!");
        setSnapshotNote('');
        loadCloudSnapshots();
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        setErrorMessage(res.error || "Gagal menyimpan snapshot ke cloud.");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Terjadi kesalahan saat membuat snapshot.");
    } finally {
      setIsCreatingSnapshot(false);
    }
  };

  // Handler: Delete Cloud Snapshot
  const handleDeleteCloudSnapshot = async (id: string) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus arsip snapshot cloud ini?")) return;
    try {
      await deleteBackupSnapshotFromSupabase(id);
      setSuccessMessage("Snapshot cadangan cloud berhasil dihapus.");
      loadCloudSnapshots();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage("Gagal menghapus snapshot: " + (err?.message || String(err)));
    }
  };

  // Handler: Download JSON Backup
  const handleDownloadBackup = () => {
    try {
      const dataPkg = createBackupPackage();
      const jsonStr = JSON.stringify(dataPkg, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      
      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
      const fileName = `backup_ppnpn_${dateStr}_${timeStr}.json`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSuccessMessage(`Berkas backup berhasil diunduh: ${fileName}`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (e: any) {
      console.error("Error generating backup JSON", e);
      setErrorMessage("Gagal mengunduh berkas backup. Silakan coba lagi.");
    }
  };

  // Handler: Export module data to CSV
  const handleExportCSV = (moduleName: 'pegawai' | 'absensi' | 'cuti' | 'logbook') => {
    let csvContent = '';
    let fileName = '';

    if (moduleName === 'pegawai') {
      fileName = `data_pegawai_${new Date().toISOString().slice(0, 10)}.csv`;
      csvContent = 'ID,Nama,Email,Jabatan,Role,Sisa Kuota Cuti,Tanggal Bergabung,Status\n';
      employees.forEach(emp => {
        csvContent += `"${emp.id}","${emp.name}","${emp.email}","${emp.position || ''}","${emp.role}","${emp.cutiQuota}","${emp.joinDate || ''}","${emp.status || ''}"\n`;
      });
    } else if (moduleName === 'absensi') {
      fileName = `data_absensi_${new Date().toISOString().slice(0, 10)}.csv`;
      csvContent = 'ID,Tanggal,ID Pegawai,Nama Pegawai,Jam Masuk,Status Masuk,Jam Pulang,Status Pulang,Alamat Masuk\n';
      attendance.forEach(att => {
        csvContent += `"${att.id}","${att.date}","${att.employeeId}","${att.employeeName}","${att.checkIn || ''}","${att.checkInStatus || ''}","${att.checkOut || ''}","${att.checkOutStatus || ''}","${att.checkInAddress || ''}"\n`;
      });
    } else if (moduleName === 'cuti') {
      fileName = `data_cuti_izin_${new Date().toISOString().slice(0, 10)}.csv`;
      csvContent = 'ID,ID Pegawai,Nama Pegawai,Tipe,Mulai,Selesai,Alasan,Status,Disetujui Oleh\n';
      leaves.forEach(l => {
        csvContent += `"${l.id}","${l.employeeId}","${l.employeeName}","${l.type}","${l.startDate}","${l.endDate}","${l.reason || ''}","${l.status}","${l.approvedBy || ''}"\n`;
      });
    } else if (moduleName === 'logbook') {
      fileName = `data_logbook_${new Date().toISOString().slice(0, 10)}.csv`;
      csvContent = 'ID,Tanggal,Jam,ID Pegawai,Nama Pegawai,Uraian Kegiatan\n';
      logbooks.forEach(lb => {
        const cleanContent = (lb.content || '').replace(/"/g, '""');
        csvContent += `"${lb.id}","${lb.date}","${lb.time || ''}","${lb.employeeId}","${lb.employeeName}","${cleanContent}"\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle file reading and parsing JSON
  const handleFile = (file: File) => {
    if (!file.name.endsWith('.json')) {
      setParseError('Format berkas harus berupa .json backup aplikasi.');
      setSelectedFile(null);
      setParsedBackup(null);
      return;
    }

    setSelectedFile(file);
    setParseError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);

        if (!parsed || (typeof parsed !== 'object')) {
          throw new Error('Format JSON tidak valid.');
        }

        if (!Array.isArray(parsed.employees) && !Array.isArray(parsed.attendance) && !parsed.settings) {
          throw new Error('Berkas JSON ini tidak mengandung struktur data aplikasi PPNPN yang valid.');
        }

        setParsedBackup(parsed as BackupDataPackage);
        setParseError(null);
      } catch (err: any) {
        console.error("Failed to parse backup JSON", err);
        setParseError(`Gagal membaca berkas JSON: ${err.message || 'Format tidak valid'}`);
        setParsedBackup(null);
      }
    };
    reader.readAsText(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Execute Restore from JSON file or Cloud Snapshot
  const handleExecuteRestore = async () => {
    const pkgToRestore = parsedBackup || (selectedSnapshotForRestore?.dataJson ? JSON.parse(selectedSnapshotForRestore.dataJson) : null);
    if (!pkgToRestore) return;
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      await onRestoreData(pkgToRestore, restoreMode);
      
      setShowConfirmModal(false);
      setConfirmInput('');
      setSelectedFile(null);
      setParsedBackup(null);
      setSelectedSnapshotForRestore(null);
      setSuccessMessage('Restorasi data aplikasi berhasil! Seluruh data pegawai, presensi, cuti, dan logbook telah diperbarui.');
      setTimeout(() => setSuccessMessage(null), 6000);
    } catch (e: any) {
      console.error("Error executing restore", e);
      setErrorMessage(`Gagal memulihkan data: ${e.message || 'Terjadi kesalahan sistem'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Page Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-sm">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">BACKUP & RESTORE DATA SISTEM</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Cadangkan seluruh basis data aplikasi atau pulihkan data dari file cadangan dan snapshot cloud Firebase.
              </p>
            </div>
          </div>
        </div>

        {/* Cloud Status Badge */}
        <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg text-xs self-start sm:self-auto shadow-xs">
          <Server className={`w-4 h-4 ${supabaseConnected ? 'text-emerald-500' : 'text-slate-400'}`} />
          <span className="text-slate-600 font-semibold">Database Cloud:</span>
          <span className={`font-bold ${supabaseConnected ? 'text-emerald-600' : 'text-amber-600'}`}>
            {supabaseConnected ? 'Online (Firebase Firestore)' : 'Offline (Lokal Saja)'}
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('file')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'file'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileJson className="w-4 h-4" />
          <span>Backup & Restore File (.JSON / CSV)</span>
        </button>

        <button
          onClick={() => setActiveTab('cloud')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'cloud'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Cloud className="w-4 h-4" />
          <span>Snapshot Cloud Firebase</span>
          {cloudSnapshots.length > 0 && (
            <span className="px-1.5 py-0.2 bg-blue-100 text-blue-700 rounded-full text-[10px] font-mono">
              {cloudSnapshots.length}
            </span>
          )}
        </button>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-3 animate-in fade-in shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="flex-1">{successMessage}</p>
          <button 
            onClick={() => setSuccessMessage(null)}
            className="p-1 hover:bg-emerald-100 rounded-md text-emerald-600 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-3 animate-in fade-in shadow-sm">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <p className="flex-1">{errorMessage}</p>
          <button 
            onClick={() => setErrorMessage(null)}
            className="p-1 hover:bg-rose-100 rounded-md text-rose-600 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Current Database Summary Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Pegawai</p>
            <p className="text-lg font-bold text-slate-800">{employees.length} <span className="text-xs font-normal text-slate-500">orang</span></p>
          </div>
        </div>

        <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Catatan Absensi</p>
            <p className="text-lg font-bold text-slate-800">{attendance.length} <span className="text-xs font-normal text-slate-500">catatan</span></p>
          </div>
        </div>

        <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Cuti & Izin</p>
            <p className="text-lg font-bold text-slate-800">{leaves.length} <span className="text-xs font-normal text-slate-500">berkas</span></p>
          </div>
        </div>

        <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Logbook Harian</p>
            <p className="text-lg font-bold text-slate-800">{logbooks.length} <span className="text-xs font-normal text-slate-500">entri</span></p>
          </div>
        </div>
      </div>

      {/* TAB 1: FILE BACKUP & RESTORE */}
      {activeTab === 'file' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Backup / Export Section */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-6 space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-slate-800 text-base">1. Cadangkan Data (Backup ke File)</h2>
                <p className="text-xs text-slate-500">Unduh seluruh database sistem ke berkas JSON untuk arsip mandiri.</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="font-semibold text-slate-700 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Cakupan data dalam berkas backup:</span>
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1 text-[11px]">
                <li>Master Pegawai, Akun & Kuota Cuti (32 Pegawai)</li>
                <li>Riwayat Absensi Masuk/Pulang Lengkap dengan Titik Koordinat</li>
                <li>Pengajuan Cuti, Izin, dan Rekap Lembur (SPKL)</li>
                <li>Catatan Logbook Aktivitas Seluruh PPNPN</li>
                <li>Pengaturan Jam Operasional, Radius Kantor, KOP Surat & Logo</li>
              </ul>
            </div>

            <button
              onClick={handleDownloadBackup}
              className="w-full py-3 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <FileJson className="w-4 h-4" />
              <span>Unduh Full Backup Database (.JSON)</span>
            </button>

            {/* Individual Export CSV Utilities */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Ekspor Data Per Modul Ke Format CSV / Excel:</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => handleExportCSV('pegawai')}
                  className="p-2.5 border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 rounded-lg text-slate-700 font-semibold transition-all flex items-center gap-2 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="truncate">Data Pegawai (.csv)</span>
                </button>

                <button
                  onClick={() => handleExportCSV('absensi')}
                  className="p-2.5 border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 rounded-lg text-slate-700 font-semibold transition-all flex items-center gap-2 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="truncate">Data Absensi (.csv)</span>
                </button>

                <button
                  onClick={() => handleExportCSV('cuti')}
                  className="p-2.5 border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 rounded-lg text-slate-700 font-semibold transition-all flex items-center gap-2 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="truncate">Data Cuti/Izin (.csv)</span>
                </button>

                <button
                  onClick={() => handleExportCSV('logbook')}
                  className="p-2.5 border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 rounded-lg text-slate-700 font-semibold transition-all flex items-center gap-2 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="truncate">Data Logbook (.csv)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Restore Section */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-6 space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-slate-800 text-base">2. Pulihkan Data (Restore dari File)</h2>
                <p className="text-xs text-slate-500">Unggah berkas .json cadangan untuk mengembalikan kondisi data sistem.</p>
              </div>
            </div>

            {/* File Upload Drop Area */}
            {!parsedBackup ? (
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-7 text-center cursor-pointer transition-all ${
                  dragActive 
                    ? 'border-blue-500 bg-blue-50/50 scale-[0.99]' 
                    : 'border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFile(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
                <div className="flex flex-col items-center justify-center space-y-2.5">
                  <div className="p-3 bg-white rounded-full shadow-sm text-blue-600 border border-slate-200">
                    <FileJson className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-700">
                      Klik di sini atau tarik & lepas file <span className="text-blue-600 font-mono">.json</span>
                    </p>
                    <p className="text-[11px] text-slate-400">Mendukung berkas ekspor cadangan resmi sistem PPNPN</p>
                  </div>
                </div>
              </div>
            ) : (
              /* Backup Preview & Configuration Card */
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2.5">
                    <FileJson className="w-5 h-5 text-blue-600" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 truncate max-w-[220px]" title={selectedFile?.name}>
                        {selectedFile?.name}
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        Waktu Ekspor: {parsedBackup.exportedAt ? new Date(parsedBackup.exportedAt).toLocaleString('id-ID') : 'Tidak tercatat'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setParsedBackup(null);
                      setParseError(null);
                    }}
                    className="p-1 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors cursor-pointer"
                    title="Ganti Berkas"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Data Content Breakdown Grid */}
                <div className="space-y-2 text-xs">
                  <p className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">Isi Data Dalam Berkas:</p>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 bg-white rounded-lg border border-slate-200 flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Pegawai:</span>
                      <span className="font-bold text-slate-800">{Array.isArray(parsedBackup.employees) ? parsedBackup.employees.length : 0} orang</span>
                    </div>

                    <div className="p-2 bg-white rounded-lg border border-slate-200 flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Absensi:</span>
                      <span className="font-bold text-slate-800">{Array.isArray(parsedBackup.attendance) ? parsedBackup.attendance.length : 0} catatan</span>
                    </div>

                    <div className="p-2 bg-white rounded-lg border border-slate-200 flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Cuti / Izin:</span>
                      <span className="font-bold text-slate-800">{Array.isArray(parsedBackup.leaves) ? parsedBackup.leaves.length : 0} berkas</span>
                    </div>

                    <div className="p-2 bg-white rounded-lg border border-slate-200 flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Logbook:</span>
                      <span className="font-bold text-slate-800">{Array.isArray(parsedBackup.logbooks) ? parsedBackup.logbooks.length : 0} entri</span>
                    </div>
                  </div>
                </div>

                {/* Restore Strategy Selection */}
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <label className="text-xs font-bold text-slate-700 block">Metode Pemulihan Data:</label>
                  <div className="space-y-2 text-xs">
                    <label className="flex items-start gap-2.5 p-2.5 bg-white rounded-lg border border-slate-200 cursor-pointer hover:border-blue-400 transition-all">
                      <input
                        type="radio"
                        name="restoreMode"
                        value="overwrite"
                        checked={restoreMode === 'overwrite'}
                        onChange={() => setRestoreMode('overwrite')}
                        className="mt-0.5 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="font-bold text-slate-800 block">Timpa Data Lama (Overwrite)</span>
                        <span className="text-[11px] text-slate-500 block leading-tight">
                          Mengganti seluruh data saat ini secara penuh dengan data dari berkas backup.
                        </span>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 p-2.5 bg-white rounded-lg border border-slate-200 cursor-pointer hover:border-blue-400 transition-all">
                      <input
                        type="radio"
                        name="restoreMode"
                        value="merge"
                        checked={restoreMode === 'merge'}
                        onChange={() => setRestoreMode('merge')}
                        className="mt-0.5 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="font-bold text-slate-800 block">Gabungkan Data (Merge)</span>
                        <span className="text-[11px] text-slate-500 block leading-tight">
                          Menambahkan item baru tanpa menghapus data lokal yang sudah ada sebelumnya.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                <button
                  onClick={() => setShowConfirmModal(true)}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Lanjutkan Konfirmasi Restore</span>
                </button>
              </div>
            )}

            {/* Parse Error Box */}
            {parseError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{parseError}</span>
              </div>
            )}

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px] space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Petunjuk Keamanan Restore:</span>
              </p>
              <p className="text-amber-700 leading-relaxed">
                Pastikan berkas berasal dari backup resmi. Jika Firebase Firestore terhubung, proses restore akan memperbarui cloud database secara otomatis.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CLOUD SNAPSHOT FIREBASE */}
      {activeTab === 'cloud' && (
        <div className="space-y-6">
          {/* Create Snapshot Section */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <CloudUpload className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-800 text-base">Buat Snapshot Cadangan Baru di Cloud Firebase</h2>
                  <p className="text-xs text-slate-500">
                    Menyimpan titik pemulihan langsung ke koleksi Firebase Firestore tanpa perlu mengunduh file fisik.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={loadCloudSnapshots}
                disabled={isLoadingSnapshots}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSnapshots ? 'animate-spin' : ''}`} />
                <span>Segarkan Riwayat</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Label / Catatan Snapshot (Opsional):
                </label>
                <input
                  type="text"
                  value={snapshotNote}
                  onChange={(e) => setSnapshotNote(e.target.value)}
                  placeholder="Contoh: Snapshot Rutin Akhir Bulan Juni 2026"
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleCreateCloudSnapshot}
                  disabled={isCreatingSnapshot || !supabaseConnected}
                  className={`w-full py-2.5 px-4 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 ${
                    supabaseConnected && !isCreatingSnapshot
                      ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                      : 'bg-slate-300 cursor-not-allowed'
                  }`}
                >
                  {isCreatingSnapshot ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Menyimpan Snapshot...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Simpan Snapshot Cloud</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Cloud Snapshots History Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Daftar Titik Pemulihan (Cloud Snapshots)</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Riwayat titik pemulihan yang tersimpan di Firebase Firestore. Anda dapat memulihkan sistem ke titik mana pun.
                </p>
              </div>
            </div>

            {isLoadingSnapshots ? (
              <div className="p-8 text-center space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
                <p className="text-xs font-semibold text-slate-500">Memuat riwayat snapshot dari Firebase...</p>
              </div>
            ) : cloudSnapshots.length === 0 ? (
              <div className="p-8 text-center space-y-2 text-slate-400">
                <Cloud className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-semibold">Belum ada snapshot cadangan tersimpan di Firebase Firestore.</p>
                <p className="text-[11px]">Gunakan tombol di atas untuk membuat snapshot cadangan cloud pertama Anda.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3.5">Waktu Pembuatan</th>
                      <th className="p-3.5">Label / Catatan</th>
                      <th className="p-3.5">Pembuat</th>
                      <th className="p-3.5 text-center">Ringkasan Data</th>
                      <th className="p-3.5 text-right">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cloudSnapshots.map((snap) => (
                      <tr key={snap.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3.5 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                          {snap.createdAt ? new Date(snap.createdAt).toLocaleString('id-ID') : '-'}
                        </td>
                        <td className="p-3.5 font-bold text-slate-800 max-w-[200px] truncate" title={snap.note}>
                          {snap.note}
                        </td>
                        <td className="p-3.5 text-slate-600">
                          {snap.createdBy}
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="inline-flex items-center gap-1.5 text-[10px] bg-slate-100 px-2.5 py-1 rounded-md font-mono">
                            <span title="Pegawai">{snap.counts?.employees || 0} Peg</span> • 
                            <span title="Absensi">{snap.counts?.attendance || 0} Abs</span> • 
                            <span title="Cuti">{snap.counts?.leaves || 0} Cuti</span> • 
                            <span title="Logbook">{snap.counts?.logbooks || 0} Log</span>
                          </div>
                        </td>
                        <td className="p-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedSnapshotForRestore(snap);
                                setShowConfirmModal(true);
                              }}
                              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                              title="Pulihkan data aplikasi ke titik ini"
                            >
                              <CloudDownload className="w-3.5 h-3.5" />
                              <span>Restore</span>
                            </button>

                            <button
                              onClick={() => handleDeleteCloudSnapshot(snap.id)}
                              className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Snapshot"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (parsedBackup || selectedSnapshotForRestore) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="p-2.5 bg-amber-100 rounded-full">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">Konfirmasi Restore Data</h3>
                <p className="text-xs text-slate-500">Tindakan ini akan memperbarui database sistem.</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <p>
                Anda akan memulihkan data menggunakan mode:{' '}
                <span className="font-bold text-slate-800 uppercase">
                  {restoreMode === 'overwrite' ? 'TIMPA DATA (OVERWRITE)' : 'GABUNGKAN DATA (MERGE)'}
                </span>.
              </p>
              {selectedSnapshotForRestore ? (
                <div className="p-2.5 bg-blue-50 border border-blue-100 rounded-lg text-blue-900 text-[11px] space-y-1">
                  <p className="font-bold">Sumber: Snapshot Cloud Firebase</p>
                  <p>Label: {selectedSnapshotForRestore.note}</p>
                  <p>Waktu: {new Date(selectedSnapshotForRestore.createdAt).toLocaleString('id-ID')}</p>
                </div>
              ) : (
                <div className="p-2.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 text-[11px]">
                  <p className="font-bold">Sumber Berkas: {selectedFile?.name}</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">
                Ketik <span className="font-mono font-bold text-rose-600">RESTORE</span> untuk konfirmasi:
              </label>
              <input
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder="RESTORE"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 font-mono text-center uppercase tracking-widest font-bold"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false);
                  setConfirmInput('');
                  setSelectedSnapshotForRestore(null);
                }}
                disabled={isProcessing}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleExecuteRestore}
                disabled={confirmInput.trim().toUpperCase() !== 'RESTORE' || isProcessing}
                className={`px-5 py-2 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2 ${
                  confirmInput.trim().toUpperCase() === 'RESTORE' && !isProcessing
                    ? 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer'
                    : 'bg-slate-300 cursor-not-allowed'
                }`}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Memulihkan Data...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Ya, Restore Sekarang</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
