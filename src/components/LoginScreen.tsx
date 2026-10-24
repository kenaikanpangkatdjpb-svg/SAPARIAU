import React, { useState } from 'react';
import { Key, User, LogIn, CheckCircle, ShieldCheck, AlertCircle } from 'lucide-react';
import { Employee } from '../types';
import { isEmployeeDeleted } from '../utils/storage';

interface LoginScreenProps {
  onLoginSuccess: (user: Employee) => void;
  employees: Employee[];
  onAddEmployee?: (newEmp: Employee) => void;
}

export default function LoginScreen({ onLoginSuccess, employees }: LoginScreenProps) {
  const [loginForm, setLoginForm] = useState({
    id: '', // can use NIP or Email or Username
    password: ''
  });

  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!loginForm.id || !loginForm.password) return;

    // Search by ID/Username, Email, or Full Name (excluding any deleted employee)
    const query = loginForm.id.trim().toLowerCase();
    const foundUser = employees.find(
      emp => !isEmployeeDeleted(emp.id, emp.name) && (
        emp.id.toLowerCase() === query || 
        emp.email.toLowerCase() === query ||
        emp.name.toLowerCase() === query ||
        emp.name.toLowerCase().includes(query)
      ) && emp.password === loginForm.password
    );

    if (foundUser) {
      onLoginSuccess(foundUser);
    } else {
      setErrorMessage("Username atau Kata Sandi Anda salah!");
    }
  };

  return (
    <div id="login-container" className="min-h-screen bg-slate-50 flex items-center justify-center p-3 sm:p-6 selection:bg-blue-100 selection:text-blue-900">
      <div className="max-w-md w-full bg-white rounded-2xl overflow-hidden shadow-xl border border-slate-200/80 flex flex-col transition-all">
        
        {/* Decorative Top header with brand primary blue */}
        <div className="bg-[#0B1A30] p-5 sm:p-8 text-center text-white space-y-2 relative border-b border-slate-800">
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 text-[9px] uppercase font-mono font-bold tracking-widest text-slate-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded">
            v1.0.0 STABLE
          </div>
          <div className="mx-auto w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-xl tracking-tighter shadow-lg">
            P
          </div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white mt-2">Aplikasi Absensi PPNPN</h2>
          <p className="text-[11px] sm:text-xs text-slate-300">
            Sistem Kehadiran Mandiri Pegawai Non-PNS Kantor Wilayah DJPb Riau
          </p>
        </div>

        {/* Dynamic Panel Content */}
        <div className="p-5 sm:p-8 flex-1 bg-white">
          {message && (
            <div className="mb-5 p-3.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-xs font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {errorMessage && (
            <div className="mb-5 p-3.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* LOGIN MODULE */}
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

            <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-slate-400 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
              <span>Akun PPNPN didaftarkan & dikelola oleh Administrator</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

