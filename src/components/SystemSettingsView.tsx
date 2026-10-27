import React, { useState } from 'react';
import { Settings, Save, Clock, MapPin, Key, Database, ShieldAlert, Code2, Copy, Check, Shield, RefreshCw, ExternalLink, HelpCircle, ChevronDown, ChevronUp, FileJson } from 'lucide-react';
import { Employee, OfficeSettings } from '../types';
import { GOOGLE_APPS_SCRIPT_CODE } from '../utils/storage';
import { SQL_CREATION_SCRIPT, getLastSupabaseError, isSupabaseQuotaExceeded, activeFirebaseConfig } from '../utils/supabase';

const OFFICE_PRESETS = [
  { name: "Kantor Wilayah DJPb Provinsi Riau (Pekanbaru)", lat: 0.51504, lng: 101.44792, radius: 1000 },
  { name: "KPPN Pekanbaru", lat: 0.4852, lng: 101.4512, radius: 1000 },
  { name: "KPPN Dumai", lat: 1.6712, lng: 101.4447, radius: 1000 },
  { name: "KPPN Rengat", lat: -0.3758, lng: 102.5489, radius: 1000 }
];

interface SystemSettingsViewProps {
  user: Employee;
  settings: OfficeSettings;
  onSaveSettings: (settings: OfficeSettings) => void;
  onChangePassword: (old: string, updated: string) => boolean;
  supabaseConnected?: boolean;
  onSeedSupabase?: () => Promise<void>;
  isSyncingSupabase?: boolean;
}

export default function SystemSettingsView({ 
  user, 
  settings, 
  onSaveSettings, 
  onChangePassword,
  supabaseConnected = false,
  onSeedSupabase,
  isSyncingSupabase = false
}: SystemSettingsViewProps) {
  const isAdmin = user.role === 'admin';
  const [copied, setCopied] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showFirebaseGuide, setShowFirebaseGuide] = useState(false);
  const [copiedFirebaseJson, setCopiedFirebaseJson] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);
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

  const [securityShiftMalamStart, setSecurityShiftMalamStart] = useState(settings.securityShiftMalamStart || "18:00");
  const [securityShiftMalamEnd, setSecurityShiftMalamEnd] = useState(settings.securityShiftMalamEnd || "19:00");
  const [securityShiftMalamOut, setSecurityShiftMalamOut] = useState(settings.securityShiftMalamOut || "06:00");

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

          {/* Card: Firebase Integration Panel */}
          <div className="bg-[#161618] p-5 border border-white/10 rounded-none space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-[#D4AF37]" />
                <h4 className="font-serif text-[#F4F4F5] text-sm">Firebase Cloud Database (Firestore)</h4>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isSupabaseQuotaExceeded() ? 'bg-amber-400' : (supabaseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500')}`} />
                <span className={`text-[10px] font-mono uppercase tracking-wider ${isSupabaseQuotaExceeded() ? 'text-amber-400 font-bold' : 'text-[#A1A1AA]'}`}>
                  {isSupabaseQuotaExceeded() ? 'Quota Limit (Offline)' : (supabaseConnected ? 'Connected' : 'Offline')}
                </span>
              </div>
            </div>

            <p className="text-xs text-[#71717A] leading-relaxed font-sans">
              Aplikasi telah terhubung ke Firebase Firestore secara otomatis dan real-time. Tidak memerlukan pembuatan tabel manual. Anda dapat menyinkronkan atau memigrasikan akun & data presensi lokal ke Cloud kapan saja.
            </p>

            {isSupabaseQuotaExceeded() ? (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded text-xs text-amber-300 space-y-2">
                <div className="font-bold flex items-center gap-1.5 text-amber-400">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>Batas Kuota Harian Firebase Tercapai (Free Tier)</span>
                </div>
                <p className="text-[11px] text-amber-200/90 leading-snug">
                  Kuota baca harian gratis Firestore (50.000 read/hari) telah habis untuk hari ini. Aplikasi secara otomatis beroperasi dalam mode penyimpanan lokal (offline cache). Semua data Anda tetap aman dan dapat digunakan normal. Kuota gratis akan direset otomatis esok hari.
                </p>
                <a
                  href="https://console.firebase.google.com/project/sapariau-e99eb/firestore/databases/ai-studio-aplikasiabsensip-8568cdb0-c19d-48d6-bd52-75ab38d147d5/data?openUpgradeDialog=true"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-[10px] rounded border border-amber-500/30 uppercase tracking-wider transition-colors"
                >
                  Buka Dialog Upgrade Billing di Firebase Console
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ) : !supabaseConnected && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded text-xs text-rose-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-rose-400">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>Detail Status Firebase: Offline</span>
                </div>
                <p className="text-[11px] text-rose-200/90 leading-snug">
                  {getLastSupabaseError() || "Koneksi ke Firebase gagal."}
                </p>
              </div>
            )}

            {/* Active Connection Details */}
            <div className="p-3 bg-black/40 border border-white/5 space-y-1.5 font-mono text-[11px]">
              <div className="text-[10px] uppercase tracking-wider text-[#A1A1AA] font-sans font-bold flex items-center justify-between">
                <span>Informasi Sambungan Aktif</span>
                <span className="text-emerald-400 font-mono">Firestore</span>
              </div>
              <div className="flex items-center justify-between text-[#E4E4E7]">
                <span className="text-[#71717A]">Project ID:</span>
                <span className="text-[#D4AF37] font-semibold">{(activeFirebaseConfig as any)?.projectId || 'spry-petal-5dpgw'}</span>
              </div>
              <div className="flex items-center justify-between text-[#E4E4E7]">
                <span className="text-[#71717A]">Database ID:</span>
                <span className="text-slate-300 truncate max-w-[200px]" title={(activeFirebaseConfig as any)?.firestoreDatabaseId || '(default)'}>
                  {(activeFirebaseConfig as any)?.firestoreDatabaseId || '(default)'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[#E4E4E7]">
                <span className="text-[#71717A]">Auth Domain:</span>
                <span className="text-slate-400">{(activeFirebaseConfig as any)?.authDomain || '-'}</span>
              </div>
            </div>

            {/* Toggleable Guide: Cara Mengubah Sambungan Firebase */}
            <div className="border border-white/10 bg-[#0F0F11]">
              <button
                type="button"
                onClick={() => setShowFirebaseGuide(!showFirebaseGuide)}
                className="w-full flex items-center justify-between p-3 text-left hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-[#D4AF37]" />
                  <span className="text-xs font-bold text-[#F4F4F5]">Cara Mengubah Sambungan Database Firebase</span>
                </div>
                {showFirebaseGuide ? (
                  <ChevronUp className="w-4 h-4 text-[#A1A1AA]" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#A1A1AA]" />
                )}
              </button>

              {showFirebaseGuide && (
                <div className="p-4 border-t border-white/10 space-y-4 text-xs font-sans text-[#D4D4D8]">
                  <div className="space-y-1.5">
                    <p className="font-bold text-[#F4F4F5]">Terdapat 3 cara praktis untuk mengubah sambungan Firebase:</p>
                    <ol className="list-decimal list-inside space-y-1 text-[#A1A1AA] leading-relaxed">
                      <li>
                        <strong className="text-white">Melalui Chat AI ini:</strong> Anda cukup kirimkan konfigurasi Firebase atau nama Project ID baru Anda di percakapan ini, dan asisten AI akan memperbarui konfigurasinya secara otomatis.
                      </li>
                      <li>
                        <strong className="text-white">Mengedit File Konfigurasi:</strong> Buka file <code className="text-[#D4AF37] bg-white/5 px-1 py-0.5 rounded">firebase-applet-config.json</code> di root proyek dan ganti isinya dengan konfigurasi Firebase project baru Anda.
                      </li>
                      <li>
                        <strong className="text-white">Menggunakan Environment Variable (Vercel / GitHub):</strong> Tambahkan variabel <code className="text-[#D4AF37] bg-white/5 px-1 py-0.5 rounded">VITE_FIREBASE_*</code> pada pengaturan project di dashboard Vercel Anda.
                      </li>
                    </ol>
                  </div>

                  <div className="p-3 bg-white/5 border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#A1A1AA] font-bold flex items-center gap-1.5">
                        <FileJson className="w-3.5 h-3.5 text-[#D4AF37]" />
                        Format firebase-applet-config.json
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const sample = JSON.stringify({
                            projectId: "project-id-baru-anda",
                            appId: "1:1234567890:web:abcdef123456",
                            apiKey: "AIzaSyContohKeyFirebaseBaru...",
                            authDomain: "project-id-baru-anda.firebaseapp.com",
                            firestoreDatabaseId: "(default)",
                            storageBucket: "project-id-baru-anda.firebasestorage.app",
                            messagingSenderId: "1234567890"
                          }, null, 2);
                          navigator.clipboard.writeText(sample);
                          setCopiedFirebaseJson(true);
                          setTimeout(() => setCopiedFirebaseJson(false), 2000);
                        }}
                        className="text-[10px] text-[#D4AF37] hover:underline flex items-center gap-1 font-bold"
                      >
                        {copiedFirebaseJson ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        {copiedFirebaseJson ? 'Disalin!' : 'Salin JSON'}
                      </button>
                    </div>
                    <pre className="text-[10px] font-mono text-[#A1A1AA] bg-black/60 p-2 overflow-x-auto rounded">
{`{
  "projectId": "project-id-baru-anda",
  "appId": "1:1234567890:web:abcdef123456",
  "apiKey": "AIzaSy...",
  "authDomain": "project-id-baru-anda.firebaseapp.com",
  "firestoreDatabaseId": "(default)",
  "storageBucket": "project-id-baru-anda.firebasestorage.app",
  "messagingSenderId": "1234567890"
}`}
                    </pre>
                  </div>

                  <div className="p-3 bg-white/5 border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#A1A1AA] font-bold flex items-center gap-1.5">
                        <Code2 className="w-3.5 h-3.5 text-blue-400" />
                        Format Environment Variables (.env / Vercel)
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const envSample = `VITE_FIREBASE_PROJECT_ID=project-id-baru-anda\nVITE_FIREBASE_API_KEY=AIzaSy...\nVITE_FIREBASE_AUTH_DOMAIN=project-id-baru-anda.firebaseapp.com\nVITE_FIREBASE_FIRESTORE_DATABASE_ID=(default)\nVITE_FIREBASE_STORAGE_BUCKET=project-id-baru-anda.firebasestorage.app\nVITE_FIREBASE_MESSAGING_SENDER_ID=1234567890\nVITE_FIREBASE_APP_ID=1:1234567890:web:abcdef123456`;
                          navigator.clipboard.writeText(envSample);
                          setCopiedEnv(true);
                          setTimeout(() => setCopiedEnv(false), 2000);
                        }}
                        className="text-[10px] text-[#D4AF37] hover:underline flex items-center gap-1 font-bold"
                      >
                        {copiedEnv ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        {copiedEnv ? 'Disalin!' : 'Salin .env'}
                      </button>
                    </div>
                    <pre className="text-[10px] font-mono text-[#A1A1AA] bg-black/60 p-2 overflow-x-auto rounded">
{`VITE_FIREBASE_PROJECT_ID=project-id-baru-anda
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=project-id-baru-anda.firebaseapp.com
VITE_FIREBASE_FIRESTORE_DATABASE_ID=(default)`}
                    </pre>
                  </div>

                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200/90 space-y-1">
                    <p className="font-bold text-amber-300">Catatan Firestore Security Rules:</p>
                    <p>
                      Pastikan pada Firebase Console baru Anda (menu <strong>Firestore Database &gt; Rules</strong>), atur rules agar mengizinkan baca/tulis:
                    </p>
                    <code className="block bg-black/60 p-1.5 rounded font-mono text-[10px] text-amber-200">
                      allow read, write: if true;
                    </code>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <button
                id="copy-supabase-sql-btn"
                onClick={() => {
                  navigator.clipboard.writeText(SQL_CREATION_SCRIPT);
                  setCopiedSql(true);
                  setTimeout(() => setCopiedSql(false), 2000);
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-[#0F0F11] hover:bg-white/5 text-[#E4E4E7] border border-white/10 rounded-none text-[10px] uppercase tracking-wider transition-all font-bold"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">SQL Script Berhasil Disalin!</span>
                  </>
                ) : (
                  <>
                    <Code2 className="w-4 h-4 text-[#D4AF37]" />
                    <span>Salin SQL Schema Script</span>
                  </>
                )}
              </button>

              <button
                id="seed-supabase-btn"
                disabled={isSyncingSupabase || !supabaseConnected || !onSeedSupabase}
                onClick={onSeedSupabase}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-[#D4AF37] hover:bg-[#c29e2f] disabled:bg-[#1e1e24] disabled:text-[#52525b] text-[#0A0A0B] rounded-none text-[10px] uppercase tracking-wider transition-all font-bold"
              >
                {isSyncingSupabase ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Mensinkronkan Data...</span>
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4" />
                    <span>Inisialisasi & Migrasi Data</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
