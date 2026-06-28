import React, { useState } from 'react';
import { Key, User, UserPlus, LogIn, CheckCircle } from 'lucide-react';
import { Employee } from '../types';

interface LoginScreenProps {
  onLoginSuccess: (user: Employee) => void;
  employees: Employee[];
  onAddEmployee: (newEmp: Employee) => void;
}

export default function LoginScreen({ onLoginSuccess, employees, onAddEmployee }: LoginScreenProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [loginForm, setLoginForm] = useState({
    id: '', // can use NIP or Email or Username
    password: ''
  });

  const [registerForm, setRegisterForm] = useState({
    id: '', // Username
    name: '',
    email: '',
    position: 'Staf PPNPN',
    password: '',
    confirmPassword: '',
    role: 'karyawan' as 'admin' | 'karyawan'
  });

  const [message, setMessage] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.id || !loginForm.password) return;

    // Search by ID/Username or Email
    const foundUser = employees.find(
      emp => (emp.id.toLowerCase() === loginForm.id.toLowerCase() || emp.email.toLowerCase() === loginForm.id.toLowerCase()) && 
      emp.password === loginForm.password
    );

    if (foundUser) {
      onLoginSuccess(foundUser);
    } else {
      alert("User atau Kata Sandi Anda salah!");
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = registerForm.id.trim().toLowerCase();
    if (!cleanUsername || !registerForm.name || !registerForm.password) {
      alert("Silakan isi semua kolom pendaftaran!");
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      alert("Konfirmasi kata sandi tidak cocok!");
      return;
    }

    // Check duplicate
    if (employees.some(emp => emp.id.toLowerCase() === cleanUsername)) {
      alert("Username ini sudah terdaftar!");
      return;
    }

    const newEmp: Employee = {
      id: cleanUsername,
      name: registerForm.name,
      email: `${cleanUsername}@ppnpn.com`, // Auto sync
      position: registerForm.position,
      password: registerForm.password,
      role: registerForm.role,
      joinDate: new Date().toISOString().split('T')[0],
      cutiQuota: 12
    };

    onAddEmployee(newEmp);
    setMessage(`Registrasi akun ${registerForm.name} berhasil! Silakan login.`);
    setIsRegistering(false);
    
    // Autofill login
    setLoginForm({
      id: cleanUsername,
      password: registerForm.password
    });

    // Reset register
    setRegisterForm({
      id: '',
      name: '',
      email: '',
      position: 'Staf PPNPN',
      password: '',
      confirmPassword: '',
      role: 'karyawan'
    });

    setTimeout(() => setMessage(''), 5000);
  };

  return (
    <div id="login-container" className="min-h-screen bg-slate-50 flex items-center justify-center p-4 selection:bg-blue-100 selection:text-blue-900">
      <div className="max-w-md w-full bg-white rounded-2xl overflow-hidden shadow-xl border border-slate-200/80 flex flex-col transition-all">
        
        {/* Decorative Top header with brand primary blue */}
        <div className="bg-[#0B1A30] p-8 text-center text-white space-y-2 relative border-b border-slate-800">
          <div className="absolute top-4 right-4 text-[9px] uppercase font-mono font-bold tracking-widest text-slate-400 bg-white/5 border border-white/10 px-2.5 py-0.5 rounded">
            v1.0.0 STABLE
          </div>
          <div className="mx-auto w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-xl tracking-tighter shadow-lg">
            P
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white mt-2">Aplikasi Absensi PPNPN</h2>
          <p className="text-xs text-slate-300">
            Sistem Kehadiran Mandiri Pegawai Non-PNS Kantor Wilayah DJPb Riau
          </p>
        </div>

        {/* Dynamic Panel Content */}
        <div className="p-8 flex-1 bg-white">
          {message && (
            <div className="mb-5 p-3.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-xs font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {!isRegistering ? (
            /* LOGIN MODULE */
            <form onSubmit={handleLoginSubmit} className="space-y-5 text-sm">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Username</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={loginForm.id}
                    onChange={(e) => setLoginForm({...loginForm, id: e.target.value})}
                    placeholder="Masukkan Username Anda"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium text-slate-800 placeholder:text-slate-400 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kata Sandi (Password)</label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono text-slate-800 placeholder:text-slate-400 text-xs"
                  />
                </div>
              </div>

              <button
                id="btn-login-submit"
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 text-xs rounded-xl shadow-md hover:scale-[1.01] active:scale-[0.99]"
              >
                <LogIn className="w-4 h-4" />
                <span>Masuk Dashboard</span>
              </button>

              <div className="text-center pt-3">
                <p className="text-xs text-slate-400 font-bold">
                  Belum memiliki akun PPNPN?{' '}
                  <button
                    type="button"
                    onClick={() => setIsRegistering(true)}
                    className="text-blue-600 font-bold hover:underline"
                  >
                    Daftar Akun Baru
                  </button>
                </p>
              </div>
            </form>
          ) : (
            /* REGISTER MODULE */
            <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={registerForm.name}
                  onChange={(e) => setRegisterForm({...registerForm, name: e.target.value})}
                  placeholder="Masukkan nama lengkap Anda"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Username</label>
                <input
                  type="text"
                  required
                  value={registerForm.id}
                  onChange={(e) => setRegisterForm({...registerForm, id: e.target.value, email: `${e.target.value}@ppnpn.com`})}
                  placeholder="Masukkan username Anda (misal: lucas)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jabatan / Posisi</label>
                  <input
                    type="text"
                    required
                    value={registerForm.position}
                    onChange={(e) => setRegisterForm({...registerForm, position: e.target.value})}
                    placeholder="Staf IT / Satpam"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Peran (Role)</label>
                  <select
                    value={registerForm.role}
                    onChange={(e) => setRegisterForm({...registerForm, role: e.target.value as 'admin' | 'karyawan'})}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-semibold"
                  >
                    <option value="karyawan">PPNPN</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kata Sandi (Password)</label>
                <input
                  type="password"
                  required
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Konfirmasi Kata Sandi</label>
                <input
                  type="password"
                  required
                  value={registerForm.confirmPassword}
                  onChange={(e) => setRegisterForm({...registerForm, confirmPassword: e.target.value})}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-semibold"
                />
              </div>

              <button
                id="btn-register-submit"
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 rounded-xl text-xs mt-2 shadow-md hover:scale-[1.01] active:scale-[0.99]"
              >
                <UserPlus className="w-4 h-4" />
                <span>Buat Akun Sekarang</span>
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setIsRegistering(false)}
                  className="text-xs text-slate-400 hover:text-blue-600 font-bold underline"
                >
                  Sudah memiliki akun? Kembali login
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
