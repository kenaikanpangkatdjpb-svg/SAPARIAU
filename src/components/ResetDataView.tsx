import React, { useState } from 'react';
import { 
  RefreshCw, 
  CalendarCheck, 
  BookOpen, 
  Clock, 
  UserCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Trash2,
  Database,
  Info,
  ShieldAlert
} from 'lucide-react';
import { Employee, Attendance, LeaveRequest, Logbook } from '../types';
import { safeSetLocalStorageItem } from '../utils/storage';
import { 
  clearAttendanceFromSupabase, 
  clearLogbooksFromSupabase, 
  clearOvertimeFromSupabase, 
  clearLeavesFromSupabase, 
  resetEmployeeQuotasTo12InSupabase,
  clearTransactionsFromSupabase,
  resetAllEmployeeQuotasInSupabase
} from '../utils/supabase';

interface ResetDataViewProps {
  employees: Employee[];
  attendance: Attendance[];
  leaves: LeaveRequest[];
  logbooks: Logbook[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  setAttendance: React.Dispatch<React.SetStateAction<Attendance[]>>;
  setLeaves: React.Dispatch<React.SetStateAction<LeaveRequest[]>>;
  setLogbooks: React.Dispatch<React.SetStateAction<Logbook[]>>;
  supabaseConnected: boolean;
}

export default function ResetDataView({
  employees,
  attendance,
  leaves,
  logbooks,
  setEmployees,
  setAttendance,
  setLeaves,
  setLogbooks,
  supabaseConnected
}: ResetDataViewProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'absensi' | 'logbook' | 'lembur' | 'cuti'>('all');
  const [resetKeyword, setResetKeyword] = useState('');
  const [loadingType, setLoadingType] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Count active overtime records in localStorage
  const getOvertimeCount = () => {
    let count = 0;
    try {
      const otRecs = localStorage.getItem('overtime_attendance_records');
      if (otRecs) {
        const parsed = JSON.parse(otRecs);
        count += Array.isArray(parsed) ? parsed.length : 0;
      }
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('overtime_requests_')) {
          const item = localStorage.getItem(k);
          if (item) {
            const parsed = JSON.parse(item);
            count += Array.isArray(parsed) ? parsed.length : 0;
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
    return count;
  };

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'absensi' | 'logbook' | 'lembur' | 'cuti' | 'all' | null;
    title: string;
    message: string;
    detail: string;
    confirmText: string;
  }>({
    isOpen: false,
    type: null,
    title: '',
    message: '',
    detail: '',
    confirmText: ''
  });

  const overtimeCount = getOvertimeCount();

  const handleNotifySuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 5000);
  };

  // Triggers for confirmation modal
  const requestConfirmAbsensi = () => {
    setConfirmModal({
      isOpen: true,
      type: 'absensi',
      title: 'Konfirmasi Reset Data Absensi',
      message: 'Apakah Anda yakin ingin MENGHAPUS SELURUH DATA ABSENSI & SWAFOTO PRESENSI?',
      detail: 'Tindakan ini akan menghapus seluruh histori jam masuk, jam pulang, swafoto, dan koordinat GPS presensi harian secara permanen. Data akun pegawai tetap utuh.',
      confirmText: 'Ya, Hapus Data Absensi'
    });
  };

  const requestConfirmLogbook = () => {
    setConfirmModal({
      isOpen: true,
      type: 'logbook',
      title: 'Konfirmasi Reset Data Logbook',
      message: 'Apakah Anda yakin ingin MENGHAPUS SELURUH DATA LOGBOOK AKTIVITAS HARIAN?',
      detail: 'Tindakan ini akan mengosongkan seluruh entri catatan kegiatan harian PPNPN beserta lampiran foto pekerjaan.',
      confirmText: 'Ya, Hapus Data Logbook'
    });
  };

  const requestConfirmLembur = () => {
    setConfirmModal({
      isOpen: true,
      type: 'lembur',
      title: 'Konfirmasi Reset Data Lembur',
      message: 'Apakah Anda yakin ingin MENGHAPUS SELURUH DATA RIWAYAT PENGAJUAN & ABSEN LEMBUR?',
      detail: 'Tindakan ini akan menghapus seluruh SPKL, verifikasi lembur, dan histori clock-in/out lembur HP.',
      confirmText: 'Ya, Hapus Data Lembur'
    });
  };

  const requestConfirmCuti = () => {
    setConfirmModal({
      isOpen: true,
      type: 'cuti',
      title: 'Konfirmasi Reset Data Cuti & Izin',
      message: 'Apakah Anda yakin ingin MENGHAPUS RIWAYAT CUTI/IZIN & MERESET KUOTA CUTI PEGAWAI MENJADI 12 HARI?',
      detail: 'Tindakan ini akan menghapus seluruh riwayat permohonan cuti/sakit/izin dan mengembalikan sisa kuota cuti tahunan setiap pegawai ke 12 hari.',
      confirmText: 'Ya, Reset Cuti & Kuota 12 Hari'
    });
  };

  const requestConfirmTotal = () => {
    if (resetKeyword.trim().toUpperCase() !== 'RESET') return;
    setConfirmModal({
      isOpen: true,
      type: 'all',
      title: 'Konfirmasi KRITIKAL: Reset Total Seluruh Aplikasi',
      message: 'Apakah Anda yakin ingin MENGHAPUS SELURUH DATA TRANSAKSI APLIKASI PPNPN?',
      detail: 'Tindakan ini akan MENGOSONGKAN SELURUH DATA Absensi, Logbook, Lembur, dan Cuti/Izin secara permanen baik di penyimpanan lokal maupun Cloud Database.',
      confirmText: 'YA, SAYA YAKIN RESET TOTAL APLIKASI'
    });
  };

  // Execution when user confirms inside modal
  const executeConfirmedReset = async () => {
    const targetType = confirmModal.type;
    setConfirmModal(prev => ({ ...prev, isOpen: false }));

    if (targetType === 'absensi') {
      setLoadingType('absensi');
      try {
        localStorage.setItem('app_is_reset_attendance', 'true');
        safeSetLocalStorageItem('ppnpn_attendance', []);
        setAttendance([]);

        if (supabaseConnected) {
          await clearAttendanceFromSupabase();
        }

        window.dispatchEvent(new Event('storage'));
        handleNotifySuccess("Berhasil menghapus seluruh Data Presensi & Swafoto Absensi!");
      } catch (err) {
        console.error(err);
        handleNotifySuccess("Gagal mereset data absensi di Supabase, data lokal berhasil dikosongkan.");
      } fontFinally: {
        setLoadingType(null);
      }
    } else if (targetType === 'logbook') {
      setLoadingType('logbook');
      try {
        localStorage.setItem('app_is_reset_logbook', 'true');
        safeSetLocalStorageItem('ppnpn_logbooks', []);
        setLogbooks([]);

        if (supabaseConnected) {
          await clearLogbooksFromSupabase();
        }

        window.dispatchEvent(new Event('storage'));
        handleNotifySuccess("Berhasil menghapus seluruh Data Logbook Laporan Kegiatan Harian!");
      } catch (err) {
        console.error(err);
        handleNotifySuccess("Gagal mereset logbook di Supabase, data lokal berhasil dikosongkan.");
      } finally {
        setLoadingType(null);
      }
    } else if (targetType === 'lembur') {
      setLoadingType('lembur');
      try {
        localStorage.setItem('app_is_reset_lembur', 'true');
        localStorage.setItem('overtime_attendance_records', JSON.stringify([]));

        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('overtime_requests_')) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));

        if (supabaseConnected) {
          await clearOvertimeFromSupabase();
        }

        window.dispatchEvent(new Event('storage'));
        handleNotifySuccess("Berhasil menghapus seluruh Data Lembur, SPKL, dan Absen Lembur HP!");
      } catch (err) {
        console.error(err);
        handleNotifySuccess("Gagal mereset lembur di Supabase, data lokal berhasil dikosongkan.");
      } finally {
        setLoadingType(null);
      }
    } else if (targetType === 'cuti') {
      setLoadingType('cuti');
      try {
        localStorage.setItem('app_is_reset_cuti', 'true');
        safeSetLocalStorageItem('ppnpn_leaves', []);
        setLeaves([]);

        const updatedEmps = employees.map(emp => ({
          ...emp,
          cutiQuota: 12
        }));
        safeSetLocalStorageItem('ppnpn_employees', updatedEmps);
        setEmployees(updatedEmps);

        if (supabaseConnected) {
          await clearLeavesFromSupabase();
          await resetEmployeeQuotasTo12InSupabase(12);
        }

        window.dispatchEvent(new Event('storage'));
        handleNotifySuccess("Berhasil mereset Data Pengajuan Cuti/Izin dan mengembalikan Kuota Cuti Pegawai ke 12 Hari!");
      } catch (err) {
        console.error(err);
        handleNotifySuccess("Gagal mereset cuti di Supabase, data lokal berhasil dikosongkan.");
      } finally {
        setLoadingType(null);
      }
    } else if (targetType === 'all') {
      setLoadingType('all');
      try {
        const updatedEmployees = employees.map(emp => ({
          ...emp,
          cutiQuota: 12
        }));

        safeSetLocalStorageItem('ppnpn_employees', updatedEmployees);
        safeSetLocalStorageItem('ppnpn_attendance', []);
        safeSetLocalStorageItem('ppnpn_leaves', []);
        safeSetLocalStorageItem('ppnpn_logbooks', []);
        localStorage.setItem('overtime_attendance_records', JSON.stringify([]));

        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('overtime_requests_')) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));

        localStorage.setItem('app_is_reset', 'true');
        localStorage.setItem('app_is_reset_attendance', 'true');
        localStorage.setItem('app_is_reset_logbook', 'true');
        localStorage.setItem('app_is_reset_lembur', 'true');
        localStorage.setItem('app_is_reset_cuti', 'true');

        setEmployees(updatedEmployees);
        setAttendance([]);
        setLeaves([]);
        setLogbooks([]);

        if (supabaseConnected) {
          await clearTransactionsFromSupabase();
          await resetAllEmployeeQuotasInSupabase(12);
        }

        window.dispatchEvent(new Event('storage'));
        handleNotifySuccess("SISTEM BERHASIL DIRESET TOTAL! Seluruh data transaksi aplikasi PPNPN telah dikosongkan.");
        setResetKeyword('');
      } catch (err) {
        console.error(err);
        handleNotifySuccess("Terjadi kesalahan saat mereset di Supabase, data lokal berhasil dikosongkan.");
      } finally {
        setLoadingType(null);
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0B1A30] to-[#1e293b] p-6 rounded-2xl text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-700">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30">
            <RefreshCw className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Menu Reset Data Administrator</h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Pilih kategori data yang ingin dikosongkan (Absensi, Logbook, Lembur, Cuti/Izin) atau Reset Total Aplikasi.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[11px] bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300">
          <Database className="w-3.5 h-3.5 text-blue-400" />
          <span>Status Database: <strong className={supabaseConnected ? "text-emerald-400" : "text-amber-400"}>{supabaseConnected ? "Terhubung Cloud" : "Lokal (Offline)"}</strong></span>
        </div>
      </div>

      {/* Success Alert Banner */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-emerald-800 flex items-center justify-between text-xs font-semibold shadow-sm animate-fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button 
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-600 hover:text-emerald-800 text-[10px] uppercase font-bold"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'all'
              ? 'bg-[#0B1A30] text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <span>Semua Opsi Reset</span>
        </button>

        <button
          onClick={() => setActiveTab('absensi')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'absensi'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <UserCheck className="w-4 h-4 text-blue-400" />
          <span>Reset Absensi ({attendance.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('logbook')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'logbook'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4 text-emerald-400" />
          <span>Reset Logbook ({logbooks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('lembur')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'lembur'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-400" />
          <span>Reset Lembur ({overtimeCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('cuti')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'cuti'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <CalendarCheck className="w-4 h-4 text-indigo-400" />
          <span>Reset Cuti & Izin ({leaves.length})</span>
        </button>
      </div>

      {/* Grid Cards for Specific Reset Options */}
      {(activeTab === 'all' || activeTab === 'absensi' || activeTab === 'logbook' || activeTab === 'lembur' || activeTab === 'cuti') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* 1. RESET ABSENSI */}
          {(activeTab === 'all' || activeTab === 'absensi') && (
            <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-sm space-y-4 flex flex-col justify-between hover:border-blue-300 transition-all">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">1. Reset Data Absensi</h3>
                      <p className="text-[11px] text-slate-400 font-medium">Hapus seluruh riwayat presensi harian</p>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold px-2.5 py-1 bg-blue-100 text-blue-700 rounded-lg">
                    {attendance.length} Records
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Menghapus seluruh histori jam masuk, jam pulang, swafoto presensi, dan koordinat GPS presensi harian untuk semua pegawai. Data profil pegawai tidak terpengaruh.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={requestConfirmAbsensi}
                  disabled={loadingType === 'absensi'}
                  className="w-full py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span>{loadingType === 'absensi' ? 'Mereset Data Absensi...' : 'Reset Data Absensi Sekarang'}</span>
                </button>
              </div>
            </div>
          )}

          {/* 2. RESET LOGBOOK */}
          {(activeTab === 'all' || activeTab === 'logbook') && (
            <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-sm space-y-4 flex flex-col justify-between hover:border-emerald-300 transition-all">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">2. Reset Data Logbook</h3>
                      <p className="text-[11px] text-slate-400 font-medium">Hapus seluruh laporan aktivitas harian</p>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-lg">
                    {logbooks.length} Entries
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Mengosongkan seluruh entri catatan aktivitas logbook harian PPNPN beserta dokumen/lampiran foto laporan aktivitas kerja.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={requestConfirmLogbook}
                  disabled={loadingType === 'logbook'}
                  className="w-full py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span>{loadingType === 'logbook' ? 'Mereset Data Logbook...' : 'Reset Data Logbook Sekarang'}</span>
                </button>
              </div>
            </div>
          )}

          {/* 3. RESET LEMBUR */}
          {(activeTab === 'all' || activeTab === 'lembur') && (
            <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-sm space-y-4 flex flex-col justify-between hover:border-amber-300 transition-all">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">3. Reset Data Lembur</h3>
                      <p className="text-[11px] text-slate-400 font-medium">Hapus SPKL, pengajuan, & absen lembur</p>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold px-2.5 py-1 bg-amber-100 text-amber-700 rounded-lg">
                    {overtimeCount} Data
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Menghapus seluruh riwayat pengajuan Surat Perintah Kerja Lembur (SPKL), verifikasi lembur, dan histori clock-in/out lembur HP.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={requestConfirmLembur}
                  disabled={loadingType === 'lembur'}
                  className="w-full py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span>{loadingType === 'lembur' ? 'Mereset Data Lembur...' : 'Reset Data Lembur Sekarang'}</span>
                </button>
              </div>
            </div>
          )}

          {/* 4. RESET CUTI & IZIN */}
          {(activeTab === 'all' || activeTab === 'cuti') && (
            <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-sm space-y-4 flex flex-col justify-between hover:border-indigo-300 transition-all">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                      <CalendarCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">4. Reset Data Cuti & Izin</h3>
                      <p className="text-[11px] text-slate-400 font-medium">Hapus pengajuan & kembalikan kuota ke 12 hari</p>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-lg">
                    {leaves.length} Pengajuan
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Menghapus seluruh riwayat permohonan cuti, surat sakit, izin keluar, dan mengembalikan sisa kuota cuti tahunan setiap pegawai menjadi 12 hari.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={requestConfirmCuti}
                  disabled={loadingType === 'cuti'}
                  className="w-full py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span>{loadingType === 'cuti' ? 'Mereset Data Cuti...' : 'Reset Data Cuti & Izin Sekarang'}</span>
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* 5. RESET TOTAL / RESET PABRIK SECTION */}
      {activeTab === 'all' && (
        <div className="bg-white p-8 border-2 border-rose-200 rounded-2xl space-y-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-rose-100">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl border border-rose-200">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">5. Reset Total / Pabrik (Semua Data Aplikasi)</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Kosongkan seluruh data transaksi (Absensi, Logbook, Lembur, Cuti/Izin) secara bersamaan
                </p>
              </div>
            </div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
              Peringatan Tingkat Tinggi
            </span>
          </div>

          <div className="bg-rose-50/70 border border-rose-200 p-4 rounded-xl text-xs text-rose-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-rose-900">
              <Info className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Cakupan Reset Total Aplikasi:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-rose-700 font-medium pl-1">
              <li>Seluruh <strong>Histori Presensi & Swafoto Absensi</strong> ({attendance.length} record)</li>
              <li>Seluruh <strong>Logbook Aktivitas Kerja Harian</strong> ({logbooks.length} record)</li>
              <li>Seluruh <strong>Pengajuan Lembur, SPKL, & Clock-In Lembur HP</strong> ({overtimeCount} record)</li>
              <li>Seluruh <strong>Pengajuan Cuti/Izin & Status Approval</strong> ({leaves.length} record)</li>
              <li><strong>Data Pegawai PPNPN TIDAK DIHAPUS</strong>, akun tetap aktif untuk login kembali.</li>
            </ul>
          </div>

          <div className="space-y-4 pt-2 text-xs max-w-lg">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Konfirmasi Keamanan Reset Total
              </label>
              <p className="text-[11px] text-slate-600 font-medium">
                Untuk mengonfirmasi reset seluruh data aplikasi, silakan ketik kata kunci <strong className="text-rose-600 font-bold">RESET</strong> di bawah ini:
              </p>
              <input
                type="text"
                value={resetKeyword}
                onChange={(e) => setResetKeyword(e.target.value)}
                placeholder="Ketik RESET"
                className="w-full text-xs px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 font-bold tracking-widest placeholder:font-normal placeholder:tracking-normal"
              />
            </div>

            <button
              onClick={requestConfirmTotal}
              disabled={resetKeyword.trim().toUpperCase() !== 'RESET' || loadingType === 'all'}
              className={`w-full py-3.5 px-4 font-bold rounded-xl uppercase tracking-wider text-xs transition-all flex items-center justify-center gap-2 shadow-sm ${
                resetKeyword.trim().toUpperCase() === 'RESET' && loadingType !== 'all'
                  ? 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${loadingType === 'all' ? 'animate-spin' : 'text-white'}`} />
              <span>{loadingType === 'all' ? 'Sedang Mereset Seluruh Data...' : 'Reset Seluruh Data Aplikasi Sekarang'}</span>
            </button>
          </div>
        </div>
      )}

      {/* CUSTOM REACT CONFIRMATION MODAL */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-200 space-y-5 animate-scale-up">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl shrink-0 border border-rose-200">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">{confirmModal.title}</h3>
                <p className="text-xs font-semibold text-rose-600 leading-snug">
                  {confirmModal.message}
                </p>
              </div>
            </div>

            <div className="bg-rose-50/80 border border-rose-100 p-3.5 rounded-xl text-[11px] text-slate-600 leading-relaxed">
              {confirmModal.detail}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executeConfirmedReset}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>{confirmModal.confirmText}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
