import React, { useState, useEffect } from 'react';
import { UserPlus, Search, Key, Mail, UserCheck, Trash2, Edit2, X, AlertTriangle } from 'lucide-react';
import { Employee } from '../types';

interface PegawaiViewProps {
  currentUser: Employee;
  employees: Employee[];
  onAddEmployee: (newEmp: Employee) => void;
  onDeleteEmployee: (id: string) => void;
  onEditEmployee: (updatedEmp: Employee) => void;
}

export default function PegawaiView({ currentUser, employees, onAddEmployee, onDeleteEmployee, onEditEmployee }: PegawaiViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [statusFilter, setStatusFilter] = useState<'semua' | 'aktif' | 'pindah' | 'tidak aktif'>('semua');
  
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    position: '',
    password: '',
    role: 'karyawan' as 'admin' | 'karyawan',
    cutiQuota: 12,
    shift: '' as 'pagi' | 'malam' | '',
    status: 'aktif' as 'aktif' | 'pindah' | 'tidak aktif'
  });
  const [successMsg, setSuccessMsg] = useState('');
  const [employeeToDelete, setEmployeeToDelete] = useState<{ id: string; name: string } | null>(null);

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.position.toLowerCase().includes(searchTerm.toLowerCase());
    
    const empStatus = emp.status || 'aktif';
    const matchesStatus = statusFilter === 'semua' || empStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = formData.username.trim().toLowerCase();
    if (!cleanUsername || !formData.name || !formData.password || !formData.position) {
      alert("Semua field wajib diisi!");
      return;
    }

    if (editingEmployee) {
      // Edit Flow
      const updatedEmp: Employee = {
        ...editingEmployee,
        name: formData.name,
        position: formData.position,
        password: formData.password,
        role: formData.role,
        cutiQuota: Number(formData.cutiQuota),
        shift: formData.shift ? (formData.shift as 'pagi' | 'malam') : undefined,
        status: formData.status
      };

      onEditEmployee(updatedEmp);
      setSuccessMsg(`Pegawai ${formData.name} berhasil diperbarui!`);
      setEditingEmployee(null);
      
      // Reset form
      setFormData({
        username: '',
        name: '',
        position: '',
        password: '',
        role: 'karyawan',
        cutiQuota: 12,
        shift: '',
        status: 'aktif'
      });
    } else {
      // Register Flow
      // Check duplicate using username as ID
      if (employees.some(emp => emp.id.toLowerCase() === cleanUsername)) {
        alert("Username sudah terdaftar!");
        return;
      }

      const newEmp: Employee = {
        id: cleanUsername,
        name: formData.name,
        email: `${cleanUsername}@ppnpn.com`, // Sync with username based on user request
        position: formData.position,
        password: formData.password,
        role: formData.role,
        joinDate: new Date().toISOString().split('T')[0],
        cutiQuota: Number(formData.cutiQuota),
        shift: formData.shift ? (formData.shift as 'pagi' | 'malam') : undefined,
        status: formData.status
      };

      onAddEmployee(newEmp);
      setSuccessMsg(`Pegawai ${formData.name} (PPNPN) berhasil ditambahkan!`);
      
      // Reset form
      setFormData({
        username: '',
        name: '',
        position: '',
        password: '',
        role: 'karyawan',
        cutiQuota: 12,
        shift: '',
        status: 'aktif'
      });
    }

    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleCancelEdit = () => {
    setEditingEmployee(null);
    setFormData({
      username: '',
      name: '',
      position: '',
      password: '',
      role: 'karyawan',
      cutiQuota: 12,
      shift: '',
      status: 'aktif'
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (id === currentUser.id) {
      alert("Anda tidak bisa menghapus akun Anda sendiri!");
      return;
    }
    setEmployeeToDelete({ id, name });
  };

  const executeDelete = () => {
    if (employeeToDelete) {
      onDeleteEmployee(employeeToDelete.id);
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

      {/* Search Row */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
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
        <div className="flex flex-wrap items-center gap-1.5 self-start md:self-auto overflow-x-auto max-w-full pb-1 md:pb-0 scrollbar-none">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">Filter Status:</span>
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
              {filter === 'semua' ? 'Semua' : filter === 'aktif' ? 'Aktif' : filter === 'pindah' ? 'Pindah' : 'Tidak Aktif'}
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
                  Tidak ada data pegawai yang cocok dengan pencarian Anda.
                </div>
              ) : (
                filteredEmployees.map((emp) => (
                  <div key={emp.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-sm shrink-0">
                        {emp.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h5 className="font-bold text-slate-800 text-sm">{emp.name}</h5>
                          <span className={`px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider rounded-full border ${
                            emp.role === 'admin' 
                              ? 'bg-indigo-50 text-indigo-600 border-indigo-100' 
                              : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                          }`}>
                            {emp.role === 'karyawan' ? 'PPNPN' : emp.role}
                          </span>
                          {emp.shift && (
                            <span className={`px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider rounded-full border ${
                              emp.shift === 'pagi'
                                ? 'bg-amber-50 text-amber-600 border-amber-200'
                                : 'bg-violet-50 text-violet-600 border-violet-200'
                            }`}>
                              {emp.shift === 'pagi' ? 'Shift Pagi' : 'Shift Malam'}
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
                      <div className="text-left sm:text-right font-mono mr-2">
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Kuota Cuti Sisa</p>
                        <p className="text-xs font-bold text-slate-700">{emp.cutiQuota} Hari</p>
                      </div>
                      
                      {/* Edit Button */}
                      <button
                        onClick={() => {
                          setEditingEmployee(emp);
                          setFormData({
                            username: emp.id,
                            name: emp.name,
                            position: emp.position,
                            password: emp.password,
                            role: emp.role,
                            cutiQuota: emp.cutiQuota,
                            shift: emp.shift || '',
                            status: emp.status || 'aktif'
                          });
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
        <div className="lg:col-span-4 bg-white p-5 border border-slate-200/80 rounded-xl shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <UserPlus className={`w-5 h-5 ${editingEmployee ? 'text-amber-500' : 'text-blue-600'}`} />
            <h4 className="font-bold text-slate-700 text-sm">
              {editingEmployee ? 'Ubah Data Pegawai' : 'Daftar Pegawai Baru'}
            </h4>
          </div>

          {successMsg && (
            <div className="p-3 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Username</label>
              <input
                type="text"
                required
                disabled={!!editingEmployee}
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                placeholder="Contoh: lucas, rudi"
                className={`w-full text-xs px-3.5 py-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  editingEmployee 
                    ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' 
                    : 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-blue-500'
                }`}
              />
              {editingEmployee && (
                <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Username (ID) tidak dapat diubah.</p>
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
                required
                value={formData.position}
                onChange={(e) => setFormData({...formData, position: e.target.value})}
                placeholder="Staf IT / Satpam / Administrasi"
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Peran / Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value as 'admin' | 'karyawan'})}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="karyawan">PPNPN</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

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
            </div>



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
                className={`w-full py-3 px-4 text-white font-bold rounded-lg uppercase tracking-wider text-[10px] transition-all flex items-center justify-center gap-2 shadow-sm ${
                  editingEmployee 
                    ? 'bg-amber-500 hover:bg-amber-600' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {editingEmployee ? <Edit2 className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                <span>{editingEmployee ? 'Simpan Perubahan' : 'Daftarkan Pegawai'}</span>
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
