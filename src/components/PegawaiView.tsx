import React, { useState, useEffect } from 'react';
import { UserPlus, Search, Key, Mail, UserCheck, Trash2, Edit2, X, AlertTriangle, Shield, Car, Briefcase, Clock } from 'lucide-react';
import { Employee, Role } from '../types';
import { isEmployeeDeleted, isNonPpnpn } from '../utils/storage';

interface PegawaiViewProps {
  currentUser: Employee;
  employees: Employee[];
  onAddEmployee: (newEmp: Employee) => void | Promise<void>;
  onDeleteEmployee: (id: string, name?: string) => void | Promise<void>;
  onEditEmployee: (updatedEmp: Employee, oldId?: string) => void | Promise<void>;
}

const mapRole = (role?: string, position?: string): Role => {
  if (role === 'admin' || role === 'security' || role === 'sopir' || role === 'pramubakti') {
    return role;
  }
  const pos = (position || '').toLowerCase();
  if (pos.includes('satpam') || pos.includes('security') || pos.includes('keamanan')) return 'security';
  if (pos.includes('sopir') || pos.includes('pengemudi') || pos.includes('driver')) return 'sopir';
  if (pos.includes('admin')) return 'admin';
  return 'pramubakti';
};

export default function PegawaiView({ currentUser, employees, onAddEmployee, onDeleteEmployee, onEditEmployee }: PegawaiViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [justUpdatedId, setJustUpdatedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'semua' | 'aktif' | 'pindah' | 'tidak aktif'>('semua');
  const [roleFilter, setRoleFilter] = useState<'semua' | 'pramubakti' | 'sopir' | 'security' | 'admin'>('semua');
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    position: 'Pramubakti',
    password: '123',
    role: 'pramubakti' as Role,
    cutiQuota: 12,
    shift: '' as 'pagi' | 'malam' | 'Fleksibel' | '',
    status: 'aktif' as 'aktif' | 'pindah' | 'tidak aktif'
  });
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [employeeToDelete, setEmployeeToDelete] = useState<{ id: string; name: string } | null>(null);

  const filteredEmployees = employees.filter(emp => {
    if (!emp) return false;
    if (isEmployeeDeleted(emp.id, emp.name) || isNonPpnpn(emp.id, emp.name)) return false;
    const nameStr = (emp.name || '').toLowerCase();
    const idStr = (emp.id || '').toLowerCase();
    const posStr = (emp.position || '').toLowerCase();
    const searchLower = (searchTerm || '').toLowerCase();

    const matchesSearch = nameStr.includes(searchLower) ||
      idStr.includes(searchLower) ||
      posStr.includes(searchLower);
    
    const empStatus = emp.status || 'aktif';
    const matchesStatus = statusFilter === 'semua' || empStatus === statusFilter;

    const matchesRole = roleFilter === 'semua'
      ? true
      : roleFilter === 'pramubakti'
        ? (emp.role === 'pramubakti' || emp.role === 'karyawan')
        : emp.role === roleFilter;
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  const handleRoleChange = (newRole: Role) => {
    const currentPos = formData.position.trim().toLowerCase();
    let defaultPos = formData.position;
    let newShift = formData.shift;

    if (newRole === 'security') {
      if (!defaultPos || currentPos === 'pramubakti' || currentPos === 'pengemudi / sopir' || currentPos === 'sopir' || currentPos === 'cleaning service') {
        defaultPos = 'Security / Petugas Keamanan';
      }
      newShift = 'Fleksibel';
    } else if (newRole === 'sopir') {
      if (!defaultPos || currentPos === 'pramubakti' || currentPos.includes('security') || currentPos.includes('satpam') || currentPos === 'cleaning service') {
        defaultPos = 'Pengemudi / Sopir';
      }
      newShift = '';
    } else if (newRole === 'pramubakti') {
      if (!defaultPos || currentPos === 'pengemudi / sopir' || currentPos.includes('security') || currentPos.includes('satpam')) {
        defaultPos = 'Pramubakti';
      }
      newShift = '';
    } else if (newRole === 'admin') {
      if (!defaultPos) defaultPos = 'Administrator';
      newShift = '';
    }

    setFormData({
      ...formData,
      role: newRole,
      position: defaultPos,
      shift: newShift
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const cleanUsername = (formData.username || '').trim().toLowerCase();
    const cleanName = (formData.name || '').trim();
    const cleanPosition = (formData.position || (formData.role === 'security' ? 'Security / Petugas Keamanan' : formData.role === 'sopir' ? 'Pengemudi / Sopir' : formData.role === 'admin' ? 'Administrator' : 'Pramubakti')).trim();
    const cleanPassword = (formData.password || '123').trim();

    if (!cleanUsername || !cleanName) {
      setErrorMsg("Username dan Nama Lengkap wajib diisi!");
      return;
    }

    setIsSaving(true);
    const safetyTimeout = setTimeout(() => {
      setIsSaving(false);
    }, 4500);

    try {
      if (editingEmployee) {
        // Edit Flow
        const oldId = (editingEmployee.id || '').trim().toLowerCase();
        if (cleanUsername !== oldId && employees.some(emp => {
          const empId = (emp.id || '').trim().toLowerCase();
          return empId === cleanUsername && empId !== oldId;
        })) {
          setErrorMsg(`Username "${cleanUsername}" sudah digunakan oleh pegawai lain! Gunakan username lain.`);
          setIsSaving(false);
          clearTimeout(safetyTimeout);
          return;
        }

        const updatedEmp: Employee = {
          ...editingEmployee,
          id: cleanUsername,
          email: `${cleanUsername}@ppnpn.com`,
          name: cleanName,
          position: cleanPosition,
          password: cleanPassword,
          role: formData.role,
          cutiQuota: formData.role === 'admin' ? 12 : (Number(formData.cutiQuota) >= 0 ? Number(formData.cutiQuota) : 12),
          shift: formData.role === 'security' ? 'Fleksibel' : undefined,
          status: formData.status
        };

        await Promise.race([
          onEditEmployee(updatedEmp, editingEmployee.id),
          new Promise<void>((resolve) => setTimeout(resolve, 4000))
        ]);

        setJustUpdatedId(cleanUsername);
        setTimeout(() => setJustUpdatedId(null), 4000);
        setSuccessMsg(`Perubahan data pegawai "${cleanName}" berhasil disimpan ke database!`);
        setEditingEmployee(null);
        
        // Reset form
        setFormData({
          username: '',
          name: '',
          position: 'Pramubakti',
          password: '123',
          role: 'pramubakti',
          cutiQuota: 12,
          shift: '',
          status: 'aktif'
        });

        // Scroll smoothly to the updated row in the employee list
        setTimeout(() => {
          document.getElementById(`emp-row-${cleanUsername}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 150);
      } else {
        // Register Flow (automatically saves/upserts to Firestore)
        const newEmp: Employee = {
          id: cleanUsername,
          name: cleanName,
          email: `${cleanUsername}@ppnpn.com`,
          position: cleanPosition,
          password: cleanPassword,
          role: formData.role,
          joinDate: new Date().toISOString().split('T')[0],
          cutiQuota: formData.role === 'admin' ? 12 : (Number(formData.cutiQuota) >= 0 ? Number(formData.cutiQuota) : 12),
          shift: formData.role === 'security' ? 'Fleksibel' : undefined,
          status: formData.status
        };

        await Promise.race([
          onAddEmployee(newEmp),
          new Promise<void>((resolve) => setTimeout(resolve, 4000))
        ]);

        setJustUpdatedId(cleanUsername);
        setTimeout(() => setJustUpdatedId(null), 4000);
        setSuccessMsg(`Pegawai baru "${cleanName}" berhasil ditambahkan dan tersimpan otomatis ke database!`);
        
        // Reset form & filters so all employees and the new employee are immediately visible
        setSearchTerm('');
        setStatusFilter('semua');
        setRoleFilter('semua');
        setFormData({
          username: '',
          name: '',
          position: 'Pramubakti',
          password: '123',
          role: 'pramubakti',
          cutiQuota: 12,
          shift: '',
          status: 'aktif'
        });

        setTimeout(() => {
          document.getElementById(`emp-row-${cleanUsername}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 150);
      }
    } catch (err: any) {
      console.error("Gagal memproses data pegawai:", err);
      setErrorMsg(`Terjadi kendala saat menyimpan data: ${err?.message || err}`);
    } finally {
      clearTimeout(safetyTimeout);
      setIsSaving(false);
      setTimeout(() => setSuccessMsg(''), 5000);
    }
  };

  const handleCancelEdit = () => {
    setEditingEmployee(null);
    setErrorMsg('');
    setFormData({
      username: '',
      name: '',
      position: 'Pramubakti',
      password: '123',
      role: 'pramubakti',
      cutiQuota: 12,
      shift: '',
      status: 'aktif'
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (id === currentUser.id) {
      setErrorMsg("Anda tidak bisa menghapus akun Anda sendiri!");
      return;
    }
    setEmployeeToDelete({ id, name });
  };

  const executeDelete = () => {
    if (employeeToDelete) {
      onDeleteEmployee(employeeToDelete.id, employeeToDelete.name);
      if (editingEmployee && editingEmployee.id === employeeToDelete.id) {
        handleCancelEdit();
      }
      setEmployeeToDelete(null);
    }
  };

  return (
    <div id="pegawai-view" className="space-y-6">
      {/* Delete Confirmation Modal */}
      {employeeToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-md w-full p-6 shadow-xl space-y-5">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 bg-rose-50 text-rose-500 rounded-xl border border-rose-100 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-800 text-sm">Konfirmasi Hapus Pegawai</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Apakah Anda benar-benar yakin ingin menghapus data pegawai <strong className="text-slate-800 font-semibold">{employeeToDelete.name}</strong> dari sistem?
                </p>
              </div>
            </div>
            
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-[10px] text-slate-400 font-medium">
              Tindakan ini tidak dapat dibatalkan. Seluruh rekam presensi, sisa kuota cuti, dan logbook bersangkutan tidak akan ditampilkan di laporan.
            </div>

            <div className="flex items-center gap-2.5 justify-end">
              <button
                type="button"
                onClick={() => setEmployeeToDelete(null)}
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
                <span>Ya, Hapus Data</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Authorization Banner */}
      <div className="bg-blue-50/80 border border-blue-100 p-4 rounded-xl flex items-start gap-3 shadow-sm">
        <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg shrink-0 mt-0.5">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <div className="space-y-1">
          <h5 className="font-bold text-slate-800 text-xs">Kewenangan Pengelolaan PPNPN Aktif</h5>
          <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
            Sebagai Administrator (<span className="font-semibold text-blue-700">{currentUser.name}</span>), Anda diberikan hak penuh untuk melakukan pendaftaran pegawai baru, melakukan perubahan data (Edit/Ubah), serta melakukan penghapusan (Hapus) data pegawai PPNPN secara langsung di sistem.
          </p>
        </div>
      </div>

      {/* Search & Filters Row */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari username, nama, atau jabatan pegawai..."
              className="w-full text-xs pl-10 pr-4 py-2.5 border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg shadow-sm"
            />
          </div>

          {/* Status filter tabs */}
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">Status:</span>
            {(['semua', 'aktif', 'pindah', 'tidak aktif'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all shrink-0 ${
                  statusFilter === filter
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {filter === 'semua' ? 'Semua Status' : filter === 'aktif' ? 'Aktif' : filter === 'pindah' ? 'Pindah' : 'Tidak Aktif'}
              </button>
            ))}
          </div>
        </div>

        {/* Role Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1 border-t border-slate-100">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">Filter Peran:</span>
          {[
            { id: 'semua', label: 'Semua Peran' },
            { id: 'pramubakti', label: 'Pramubakti' },
            { id: 'sopir', label: 'Sopir / Pengemudi' },
            { id: 'security', label: 'Security (Fleksibel)' },
            { id: 'admin', label: 'Admin' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setRoleFilter(item.id as any)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all shrink-0 ${
                roleFilter === item.id
                  ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left column: Employees List (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
              <h4 className="font-bold text-slate-700 text-sm">Daftar Pegawai PPNPN</h4>
              <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-bold">
                {filteredEmployees.length} Pegawai
              </span>
            </div>

            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
              {filteredEmployees.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Tidak ada data pegawai yang cocok dengan filter atau pencarian Anda.
                </div>
              ) : (
                filteredEmployees.map((emp) => (
                  <div
                    key={emp.id}
                    id={`emp-row-${emp.id}`}
                    className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300 ${
                      justUpdatedId === emp.id
                        ? 'bg-emerald-50/90 border-2 border-emerald-500 rounded-xl shadow-md ring-2 ring-emerald-200'
                        : 'hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={`w-12 h-12 rounded-full border flex items-center justify-center font-bold text-sm shrink-0 ${
                        justUpdatedId === emp.id
                          ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm'
                          : 'bg-slate-100 border-slate-200 text-slate-700'
                      }`}>
                        {emp.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h5 className="font-bold text-slate-800 text-sm">{emp.name}</h5>

                          {justUpdatedId === emp.id && (
                            <span className="px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider rounded-full bg-emerald-600 text-white shadow-sm animate-pulse">
                              Baru Diperbarui ✓
                            </span>
                          )}

                          {/* Distinctive Role Badges */}
                          {emp.role === 'admin' ? (
                            <span className="px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider rounded-full border bg-indigo-50 text-indigo-700 border-indigo-200">
                              Admin
                            </span>
                          ) : emp.role === 'security' ? (
                            <span className="px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider rounded-full border bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1">
                              <Shield className="w-2.5 h-2.5 text-amber-600" />
                              Security
                            </span>
                          ) : emp.role === 'sopir' ? (
                            <span className="px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider rounded-full border bg-purple-50 text-purple-700 border-purple-200 flex items-center gap-1">
                              <Car className="w-2.5 h-2.5 text-purple-600" />
                              Sopir
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider rounded-full border bg-sky-50 text-sky-700 border-sky-200 flex items-center gap-1">
                              <Briefcase className="w-2.5 h-2.5 text-sky-600" />
                              Pramubakti
                            </span>
                          )}

                          {/* Special Security Shift badge */}
                          {emp.role === 'security' && (
                            <span className="px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider rounded-full border bg-amber-100/70 text-amber-800 border-amber-300 font-mono">
                              Fleksibel 24 Jam (Tanpa Batasan Shift)
                            </span>
                          )}

                          {/* Status Badge */}
                          <span className={`px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider rounded-full border ${
                            (emp.status || 'aktif') === 'aktif'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : (emp.status === 'pindah')
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {(emp.status || 'aktif') === 'aktif' ? 'Aktif' : (emp.status === 'pindah' ? 'Sudah Pindah' : 'Tidak Aktif')}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">{emp.position}</p>
                        
                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-[10px] text-slate-400 font-bold font-mono">
                          <span className="flex items-center gap-1">
                            <UserCheck className="w-3.5 h-3.5" />
                            Username: {emp.id}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                      {emp.role !== 'admin' && (
                        <div className="text-left sm:text-right font-mono mr-2">
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Kuota Cuti Sisa</p>
                          <p className="text-xs font-bold text-slate-700">{emp.cutiQuota} Hari</p>
                        </div>
                      )}
                      
                      {/* Edit Button */}
                      <button
                        onClick={() => {
                          const normalizedRole = mapRole(emp.role, emp.position);
                          setEditingEmployee(emp);
                          setFormData({
                            username: emp.id || '',
                            name: emp.name || '',
                            position: emp.position || '',
                            password: emp.password || '123',
                            role: normalizedRole,
                            cutiQuota: typeof emp.cutiQuota === 'number' ? emp.cutiQuota : 12,
                            shift: normalizedRole === 'security' ? 'Fleksibel' : '',
                            status: (emp.status as any) || 'aktif'
                          });
                          document.getElementById('form-pegawai-container')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className={`p-2 rounded-lg border transition-all shadow-sm ${
                          editingEmployee?.id === emp.id
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-blue-600 hover:bg-blue-50 border-slate-200'
                        }`}
                        title="Ubah Data Pegawai"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {/* Delete Button */}
                      <button
                        id={`delete-btn-${emp.id}`}
                        onClick={() => handleDelete(emp.id, emp.name)}
                        className="p-2 text-rose-500 hover:bg-rose-50 hover:text-white rounded-lg border border-slate-200 bg-white transition-all shadow-sm"
                        title="Hapus Pegawai"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right column: Register / Edit Form (4 cols) */}
        <div id="form-pegawai-container" className="lg:col-span-4 bg-white p-5 border border-slate-200/80 rounded-xl shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <UserPlus className={`w-5 h-5 ${editingEmployee ? 'text-amber-500' : 'text-blue-600'}`} />
              <div>
                <h4 className="font-bold text-slate-700 text-sm">
                  {editingEmployee ? 'Ubah Data Pegawai' : 'Daftar Pegawai Baru'}
                </h4>
                {editingEmployee && (
                  <p className="text-[10px] text-amber-600 font-semibold truncate max-w-[190px]">
                    Mengedit: {editingEmployee.name}
                  </p>
                )}
              </div>
            </div>
            {editingEmployee && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold rounded flex items-center gap-1 transition-colors"
              >
                <X className="w-3 h-3" />
                <span>Batal</span>
              </button>
            )}
          </div>

          {errorMsg && (
            <div className="p-3 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{errorMsg}</span>
              </div>
              <button type="button" onClick={() => setErrorMsg('')} className="text-rose-400 hover:text-rose-600">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {successMsg && (
            <div className="p-3 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                <span>{successMsg}</span>
              </div>
              <button type="button" onClick={() => setSuccessMsg('')} className="text-emerald-400 hover:text-emerald-600">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Username</label>
              <input
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                placeholder="Contoh: lucas, rudi"
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              {editingEmployee && (
                <p className="text-[10px] text-slate-400 font-medium">Jika username diubah, seluruh riwayat presensi dan cuti akan otomatis diperbarui.</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama Lengkap</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Masukkan nama lengkap"
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jabatan / Posisi</label>
              <input
                type="text"
                value={formData.position}
                onChange={(e) => setFormData({...formData, position: e.target.value})}
                placeholder="Pramubakti / Security / Pengemudi"
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kata Sandi (Password)</label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text" // Made readable so admins can check/set password easily
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="Password untuk login"
                  className="w-full text-xs pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className={formData.role === 'admin' ? 'space-y-1.5' : 'grid grid-cols-2 gap-4'}>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Peran / Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => handleRoleChange(e.target.value as Role)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="pramubakti">PPNPN Pramubakti</option>
                  <option value="sopir">PPNPN Sopir / Pengemudi</option>
                  <option value="security">PPNPN Security (Petugas Keamanan)</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              {formData.role !== 'admin' && (
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kuota Cuti</label>
                  <input
                    type="number"
                    required
                    value={formData.cutiQuota}
                    onChange={(e) => setFormData({...formData, cutiQuota: Number(e.target.value)})}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>

            {/* Khusus Security: Jam Kerja Fleksibel 24 Jam (Tanpa Batasan Shift) */}
            {formData.role === 'security' ? (
              <div className="p-3.5 bg-amber-50/90 border border-amber-200 rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 text-amber-900 font-bold text-[11px]">
                  <Shield className="w-4 h-4 text-amber-600" />
                  <span>Khusus Security: Jam Kerja Fleksibel 24 Jam</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                  Petugas Keamanan (Security) bertugas dengan sistem kerja fleksibel 24 jam dan <strong>tidak dibatasi shift kaku</strong>.
                </p>
                <div className="p-2.5 bg-white/90 rounded-lg border border-amber-200 text-[10px] text-amber-950 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-amber-900">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Fleksibilitas Absensi Penuh:</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    Petugas security dapat melakukan absensi masuk dan pulang kapan saja sesuai penugasan piket atau pengamanan di lapangan tanpa dikenakan batasan shift.
                  </p>
                </div>
              </div>
            ) : formData.role !== 'admin' ? (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[10px] text-slate-600 space-y-1">
                <p className="font-bold text-slate-700 flex items-center gap-1.5">
                  {formData.role === 'sopir' ? <Car className="w-3.5 h-3.5 text-purple-600" /> : <Briefcase className="w-3.5 h-3.5 text-sky-600" />}
                  <span>Jam Kerja Kantor Standar (Non-Shift)</span>
                </p>
                <p className="text-slate-500 leading-relaxed font-medium">
                  PPNPN {formData.role === 'sopir' ? 'Pengemudi / Sopir' : 'Pramubakti'} bertugas sesuai jam operasional kantor reguler (Masuk 07:30 s.d. toleransi 08:15 WIB, Pulang 17:00 WIB).
                </p>
              </div>
            ) : null}

            {/* Status Keaktifan selection */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status Keaktifan Pegawai</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value as 'aktif' | 'pindah' | 'tidak aktif'})}
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="aktif">Aktif (Bertugas)</option>
                <option value="pindah">Pindah Tugas / Mutasi / Transfer</option>
                <option value="tidak aktif">Tidak Aktif / Non-Aktif (Berhenti)</option>
              </select>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Ubah status ini jika pegawai telah dimutasi atau tidak bekerja lagi di instansi.</p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                id="submit-pegawai-btn"
                type="submit"
                disabled={isSaving}
                className={`w-full py-3 px-4 text-white font-bold rounded-lg uppercase tracking-wider text-[10px] transition-all flex items-center justify-center gap-2 shadow-sm ${
                  isSaving ? 'opacity-70 cursor-not-allowed' : ''
                } ${
                  editingEmployee 
                    ? 'bg-amber-500 hover:bg-amber-600' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isSaving ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Menyimpan ke Database...</span>
                  </>
                ) : (
                  <>
                    {editingEmployee ? <Edit2 className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                    <span>{editingEmployee ? 'Simpan Perubahan' : 'Daftarkan Pegawai'}</span>
                  </>
                )}
              </button>

              {editingEmployee && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-lg uppercase tracking-wider text-[10px] transition-all flex items-center justify-center gap-1.5"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Batal Ubah</span>
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
