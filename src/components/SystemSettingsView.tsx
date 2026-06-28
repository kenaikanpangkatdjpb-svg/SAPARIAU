import React, { useState } from 'react';
import { Settings, Save, Clock, MapPin, Key, Database, ShieldAlert, Code2, Copy, Check, Shield } from 'lucide-react';
import { Employee, OfficeSettings } from '../types';
import { GOOGLE_APPS_SCRIPT_CODE } from '../utils/storage';

const OFFICE_PRESETS = [
  { name: "Kantor Wilayah DJPb Provinsi Riau (Pekanbaru)", lat: 0.4735, lng: 101.4478, radius: 500 },
  { name: "KPPN Pekanbaru", lat: 0.4852, lng: 101.4512, radius: 400 },
  { name: "KPPN Dumai", lat: 1.6712, lng: 101.4447, radius: 400 },
  { name: "KPPN Rengat", lat: -0.3758, lng: 102.5489, radius: 400 }
];

interface SystemSettingsViewProps {
  user: Employee;
  settings: OfficeSettings;
  onSaveSettings: (settings: OfficeSettings) => void;
  onChangePassword: (old: string, updated: string) => boolean;
}

export default function SystemSettingsView({ user, settings, onSaveSettings, onChangePassword }: SystemSettingsViewProps) {
  const isAdmin = user.role === 'admin';
  const [copied, setCopied] = useState(false);
  const [successSettings, setSuccessSettings] = useState(false);
  const [successPassword, setSuccessPassword] = useState(false);

  // Office hours state
  const [checkInStart, setCheckInStart] = useState(settings.checkInStart);
  const [checkInEnd, setCheckInEnd] = useState(settings.checkInEnd);
  const [checkOutStart, setCheckOutStart] = useState(settings.checkOutStart);
  
  // Radius state
  const [officeLat, setOfficeLat] = useState(settings.officeLat);
  const [officeLng, setOfficeLng] = useState(settings.officeLng);
  const [officeRadiusMeters, setOfficeRadiusMeters] = useState(settings.officeRadiusMeters);
  const [officeName, setOfficeName] = useState(settings.officeName);

  // Sheet sync state
  const [sheetId, setSheetId] = useState(settings.sheetId);
  const [scriptUrl, setScriptUrl] = useState(settings.scriptUrl);

  // Security shift states
  const [securityShiftPagiStart, setSecurityShiftPagiStart] = useState(settings.securityShiftPagiStart || "07:00");
  const [securityShiftPagiEnd, setSecurityShiftPagiEnd] = useState(settings.securityShiftPagiEnd || "08:00");
  const [securityShiftPagiOut, setSecurityShiftPagiOut] = useState(settings.securityShiftPagiOut || "15:00");

  const [securityShiftMalamStart, setSecurityShiftMalamStart] = useState(settings.securityShiftMalamStart || "15:00");
  const [securityShiftMalamEnd, setSecurityShiftMalamEnd] = useState(settings.securityShiftMalamEnd || "16:00");
  const [securityShiftMalamOut, setSecurityShiftMalamOut] = useState(settings.securityShiftMalamOut || "23:00");

  // Change password state
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      checkInStart,
      checkInEnd,
      checkOutStart,
      officeLat: Number(officeLat),
      officeLng: Number(officeLng),
      officeRadiusMeters: Number(officeRadiusMeters),
      officeName,
      sheetId,
      scriptUrl,
      securityShiftPagiStart,
      securityShiftPagiEnd,
      securityShiftPagiOut,
      securityShiftMalamStart,
      securityShiftMalamEnd,
      securityShiftMalamOut
    });

    setSuccessSettings(true);
    setTimeout(() => setSuccessSettings(false), 4000);
  };

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("Konfirmasi password baru tidak cocok!");
      return;
    }

    const success = onChangePassword(passwordForm.oldPassword, passwordForm.newPassword);
    if (success) {
      setSuccessPassword(true);
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSuccessPassword(false), 4000);
    } else {
      alert("Password lama yang Anda masukkan salah!");
    }
  };

  const copyScriptToClipboard = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="system-settings-view" className="space-y-6">
      
      {/* Tab Header */}
      <div>
        <h2 className="text-xl font-serif text-[#F4F4F5] tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#D4AF37]" />
          Pengaturan Sistem & Keamanan
        </h2>
        <p className="text-xs text-[#71717A] mt-1">
          Atur jam operasional presensi, geofencing lokasi kantor, sinkronisasi Google Sheets, dan ganti kata sandi.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: OFFICE SETTINGS & SHEETS (8 cols) - ADMIN ONLY */}
        {isAdmin ? (
          <div className="lg:col-span-8 space-y-6">
            <form onSubmit={handleSaveSettings} className="space-y-6">
              
              {/* Card 1: Office Hours (Jam Masuk & Pulang) */}
              <div className="bg-[#161618] p-5 border border-white/10 rounded-none space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-white/5">
                  <Clock className="w-5 h-5 text-[#D4AF37]" />
                  <h4 className="font-serif text-[#F4F4F5] text-sm">Jam Operasional Kantor (Masuk & Pulang)</h4>
                </div>

                {successSettings && (
                  <div className="p-3 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-none">
                    Semua pengaturan sistem berhasil disimpan!
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-[#71717A] uppercase tracking-wider">Jam Masuk (Mulai)</label>
                    <input
                      type="time"
                      value={checkInStart}
                      onChange={(e) => setCheckInStart(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 bg-[#0F0F11] border border-white/10 rounded-none font-mono text-[#E4E4E7] focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-[#71717A] uppercase tracking-wider">Jam Masuk (Batas Toleransi)</label>
                    <input
                      type="time"
                      value={checkInEnd}
                      onChange={(e) => setCheckInEnd(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 bg-[#0F0F11] border border-white/10 rounded-none font-mono text-[#E4E4E7] focus:outline-none focus:border-[#D4AF37]"
                      title="Karyawan check-in setelah jam ini terhitung Terlambat"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-[#71717A] uppercase tracking-wider">Jam Pulang Kantor</label>
                    <input
                      type="time"
                      value={checkOutStart}
                      onChange={(e) => setCheckOutStart(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 bg-[#0F0F11] border border-white/10 rounded-none font-mono text-[#E4E4E7] focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>
              </div>

              {/* Card 1.5: Security Shifts (Pagi & Malam) */}
              <div className="bg-[#161618] p-5 border border-white/10 rounded-none space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-white/5">
                  <Shield className="w-5 h-5 text-[#D4AF37]" />
                  <h4 className="font-serif text-[#F4F4F5] text-sm">Pengaturan Shift Security PPNPN (Petugas Keamanan)</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                  {/* Shift Pagi */}
                  <div className="p-4 bg-[#0F0F11] border border-white/5 space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-white/5">
                      <span className="font-bold text-[#D4AF37] text-[11px] uppercase tracking-wider">Shift Pagi (Security)</span>
                      <span className="px-2 py-0.5 text-[8px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase font-bold">Pagi - Sore</span>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="block text-[9px] font-bold text-[#71717A] uppercase tracking-wider">Jam Masuk (Mulai)</label>
                        <input
                          type="time"
                          value={securityShiftPagiStart}
                          onChange={(e) => setSecurityShiftPagiStart(e.target.value)}
                          className="w-full text-xs px-3 py-2 bg-[#161618] border border-white/10 rounded-none font-mono text-[#E4E4E7] focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[9px] font-bold text-[#71717A] uppercase tracking-wider">Batas Toleransi Masuk</label>
                        <input
                          type="time"
                          value={securityShiftPagiEnd}
                          onChange={(e) => setSecurityShiftPagiEnd(e.target.value)}
                          className="w-full text-xs px-3 py-2 bg-[#161618] border border-white/10 rounded-none font-mono text-[#E4E4E7] focus:outline-none focus:border-[#D4AF37]"
                          title="Melewati jam ini dianggap terlambat"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[9px] font-bold text-[#71717A] uppercase tracking-wider">Jam Pulang Shift</label>
                        <input
                          type="time"
                          value={securityShiftPagiOut}
                          onChange={(e) => setSecurityShiftPagiOut(e.target.value)}
                          className="w-full text-xs px-3 py-2 bg-[#161618] border border-white/10 rounded-none font-mono text-[#E4E4E7] focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Shift Malam */}
                  <div className="p-4 bg-[#0F0F11] border border-white/5 space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-white/5">
                      <span className="font-bold text-[#D4AF37] text-[11px] uppercase tracking-wider">Shift Malam (Security)</span>
                      <span className="px-2 py-0.5 text-[8px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase font-bold">Malam - Pagi</span>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="block text-[9px] font-bold text-[#71717A] uppercase tracking-wider">Jam Masuk (Mulai)</label>
                        <input
                          type="time"
                          value={securityShiftMalamStart}
                          onChange={(e) => setSecurityShiftMalamStart(e.target.value)}
                          className="w-full text-xs px-3 py-2 bg-[#161618] border border-white/10 rounded-none font-mono text-[#E4E4E7] focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[9px] font-bold text-[#71717A] uppercase tracking-wider">Batas Toleransi Masuk</label>
                        <input
                          type="time"
                          value={securityShiftMalamEnd}
                          onChange={(e) => setSecurityShiftMalamEnd(e.target.value)}
                          className="w-full text-xs px-3 py-2 bg-[#161618] border border-white/10 rounded-none font-mono text-[#E4E4E7] focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[9px] font-bold text-[#71717A] uppercase tracking-wider">Jam Pulang Shift</label>
                        <input
                          type="time"
                          value={securityShiftMalamOut}
                          onChange={(e) => setSecurityShiftMalamOut(e.target.value)}
                          className="w-full text-xs px-3 py-2 bg-[#161618] border border-white/10 rounded-none font-mono text-[#E4E4E7] focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Geofencing Location Coordinates */}
              <div className="bg-[#161618] p-5 border border-white/10 rounded-none space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-white/5">
                  <MapPin className="w-5 h-5 text-[#D4AF37]" />
                  <h4 className="font-serif text-[#F4F4F5] text-sm">Geofencing & Penentuan Lokasi Kantor</h4>
                </div>

                {/* Quick Presets Dropdown/Buttons */}
                <div className="p-3.5 bg-[#0F0F11] border border-white/5 space-y-2.5">
                  <label className="block text-[10px] font-bold text-[#71717A] uppercase tracking-wider">Pilih Preset Lokasi Kantor Cabang/Wilayah</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                    {OFFICE_PRESETS.map((p) => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => {
                          setOfficeName(p.name);
                          setOfficeLat(p.lat);
                          setOfficeLng(p.lng);
                          setOfficeRadiusMeters(p.radius);
                        }}
                        className={`text-[10px] py-2 px-1.5 border font-mono font-medium transition-all duration-150 rounded-none flex flex-col items-center justify-center text-center gap-1 leading-tight ${
                          officeName === p.name
                            ? 'bg-[#D4AF37]/10 border-[#D4AF37] text-[#D4AF37]'
                            : 'bg-[#161618] border-white/10 hover:border-[#D4AF37]/50 hover:bg-white/5 text-[#E4E4E7]'
                        }`}
                      >
                        <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span className="truncate w-full text-[9px]">{p.name.replace("Kantor Wilayah ", "").replace("Provinsi Riau ", "")}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="block text-[10px] font-bold text-[#71717A] uppercase tracking-wider">Nama Kantor / Area</label>
                    <input
                      type="text"
                      value={officeName}
                      onChange={(e) => setOfficeName(e.target.value)}
                      placeholder="Kantor Wilayah Ditjen Perbendaharaan Prov Riau"
                      className="w-full text-xs px-3.5 py-2.5 bg-[#0F0F11] border border-white/10 rounded-none text-[#E4E4E7] placeholder:text-[#52525B] focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-[#71717A] uppercase tracking-wider">Garis Lintang (Latitude)</label>
                    <input
                      type="number"
                      step="any"
                      value={officeLat}
                      onChange={(e) => setOfficeLat(Number(e.target.value))}
                      className="w-full text-xs px-3.5 py-2.5 bg-[#0F0F11] border border-white/10 rounded-none font-mono text-[#E4E4E7] focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-[#71717A] uppercase tracking-wider">Garis Bujur (Longitude)</label>
                    <input
                      type="number"
                      step="any"
                      value={officeLng}
                      onChange={(e) => setOfficeLng(Number(e.target.value))}
                      className="w-full text-xs px-3.5 py-2.5 bg-[#0F0F11] border border-white/10 rounded-none font-mono text-[#E4E4E7] focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="block text-[10px] font-bold text-[#71717A] uppercase tracking-wider">Radius Kehadiran Maksimum (Meter)</label>
                    <input
                      type="number"
                      value={officeRadiusMeters}
                      onChange={(e) => setOfficeRadiusMeters(Number(e.target.value))}
                      className="w-full text-xs px-3.5 py-2.5 bg-[#0F0F11] border border-white/10 rounded-none font-mono text-[#E4E4E7] focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>
              </div>

              {/* Card 3: Google Sheets & Drive Sync (Requirement 1 & 2) */}
              <div className="bg-[#161618] p-5 border border-white/10 rounded-none space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-white/5">
                  <Database className="w-5 h-5 text-[#D4AF37]" />
                  <h4 className="font-serif text-[#F4F4F5] text-sm">Integrasi Penyimpanan Google Sheets & Google Drive</h4>
                </div>

                <div className="p-3.5 bg-[#0F0F11] rounded-none border border-amber-500/20 flex items-start gap-3 text-xs text-[#A1A1AA]">
                  <ShieldAlert className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
                  <div className="leading-relaxed font-medium text-[11px]">
                    <p className="font-bold text-[#D4AF37]">Cara Integrasi Database Tanpa Error Browser:</p>
                    <p className="mt-1">
                      Aplikasi ini mendukung sinkronisasi real-time penuh dengan Google Sheets (Data Akun & Absen) dan Google Drive (Foto Kamera HP Selfie). 
                      Salin kode script Google Apps Script di panel samping kanan, tempel ke Spreadsheet Anda, lalu letakkan link web app yang dideploy di kolom berikut:
                    </p>
                  </div>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-[#71717A] uppercase tracking-wider">Google Sheet ID (Opsional)</label>
                    <input
                      type="text"
                      value={sheetId}
                      onChange={(e) => setSheetId(e.target.value)}
                      placeholder="Masukkan id unik spreadsheet Anda dari URL"
                      className="w-full text-xs px-3.5 py-2.5 bg-[#0F0F11] border border-white/10 rounded-none font-mono text-[#E4E4E7] placeholder:text-[#52525B] focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-[#71717A] uppercase tracking-wider">Google Apps Script Web App URL</label>
                    <input
                      type="url"
                      value={scriptUrl}
                      onChange={(e) => setScriptUrl(e.target.value)}
                      placeholder="https://script.google.com/macros/s/.../exec"
                      className="w-full text-xs px-3.5 py-2.5 bg-[#0F0F11] border border-white/10 rounded-none font-mono text-[#E4E4E7] placeholder:text-[#52525B] focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>
              </div>

              {/* Save Settings Footer Button */}
              <button
                id="save-office-settings-btn"
                type="submit"
                className="w-full py-3 bg-[#D4AF37] hover:bg-[#c29e2f] text-[#0A0A0B] font-bold rounded-none uppercase tracking-widest text-[10px] transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Seluruh Pengaturan Sistem</span>
              </button>

            </form>
          </div>
        ) : (
          <div className="lg:col-span-8 bg-[#161618] p-5 border border-white/10 rounded-none flex flex-col justify-center items-center py-12 text-center text-[#71717A]">
            <ShieldAlert className="w-12 h-12 text-[#D4AF37]/50 mb-2" />
            <p className="text-sm font-bold text-[#E4E4E7]">Akses Terbatas</p>
            <p className="text-xs max-w-sm mt-1 leading-relaxed">
              Pengaturan operasional jam kantor, geofencing radius, dan integrasi Google Workspace hanya dapat dikelola oleh Admin Utama.
            </p>
          </div>
        )}

        {/* RIGHT COLUMN: REUSABLE MODULES (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Card: Change Password */}
          <div className="bg-[#161618] p-5 border border-white/10 rounded-none space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-white/5">
              <Key className="w-5 h-5 text-[#D4AF37]" />
              <h4 className="font-serif text-[#F4F4F5] text-sm">Ganti Kata Sandi Akun</h4>
            </div>

            {successPassword && (
              <div className="p-3 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-none">
                Kata sandi Anda berhasil diperbarui!
              </div>
            )}

            <form onSubmit={handleChangePasswordSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-[#71717A] uppercase tracking-wider">Kata Sandi Lama</label>
                <input
                  type="password"
                  required
                  value={passwordForm.oldPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, oldPassword: e.target.value})}
                  className="w-full px-3 py-2.5 bg-[#0F0F11] border border-white/10 rounded-none text-[#E4E4E7] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-[#71717A] uppercase tracking-wider">Kata Sandi Baru</label>
                <input
                  type="password"
                  required
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                  className="w-full px-3 py-2.5 bg-[#0F0F11] border border-white/10 rounded-none text-[#E4E4E7] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-[#71717A] uppercase tracking-wider">Konfirmasi Kata Sandi Baru</label>
                <input
                  type="password"
                  required
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                  className="w-full px-3 py-2.5 bg-[#0F0F11] border border-white/10 rounded-none text-[#E4E4E7] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <button
                id="change-password-btn"
                type="submit"
                className="w-full py-2.5 bg-[#D4AF37] hover:bg-[#c29e2f] text-[#0A0A0B] font-bold rounded-none uppercase tracking-widest text-[10px] transition-colors"
              >
                Ganti Password
              </button>
            </form>
          </div>

          {/* Card: Google Sheets Code Deploy Copy Area (Only for admins) */}
          {isAdmin && (
            <div className="bg-[#161618] p-5 border border-white/10 rounded-none space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-white/5">
                <Code2 className="w-5 h-5 text-[#D4AF37]" />
                <h4 className="font-serif text-[#F4F4F5] text-sm">Google Apps Script Web App</h4>
              </div>

              <p className="text-xs text-[#71717A] leading-relaxed font-sans">
                Gunakan kode Apps Script berikut untuk melakukan sinkronisasi otomatis penuh dengan akun Google Drive & Spreadsheet Anda:
              </p>

              <button
                id="copy-apps-script-btn"
                onClick={copyScriptToClipboard}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-[#0F0F11] hover:bg-white/5 text-[#E4E4E7] border border-white/10 rounded-none text-[10px] uppercase tracking-wider transition-all font-bold"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">Copied / Berhasil Disalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-[#D4AF37]" />
                    <span>Salin Kode Google Script</span>
                  </>
                )}
              </button>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
