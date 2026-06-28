import React, { useState, useEffect, useRef } from 'react';
import { Image, Save, Award, FileText, CheckCircle, Upload, RotateCcw } from 'lucide-react';

interface KopLogoSettingsViewProps {
  onSave?: (data: any) => void;
}

const DEFAULT_LOGO = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=60';

export default function KopLogoSettingsView({ onSave }: KopLogoSettingsViewProps) {
  const [headerLine1, setHeaderLine1] = useState('KEMENTERIAN KEUANGAN REPUBLIK INDONESIA');
  const [headerLine2, setHeaderLine2] = useState('DIREKTORAT JENDERAL PERBENDAHARAAN');
  const [headerLine3, setHeaderLine3] = useState('KANTOR WILAYAH DITJEN PERBENDAHARAAN');
  const [headerLine4, setHeaderLine4] = useState('PROVINSI RIAU');
  const [addressLine, setAddressLine] = useState('JALAN JENDERAL SUDIRMAN NO. 249 PEKANBARU 28116');
  const [phoneFaxLine, setPhoneFaxLine] = useState('TELEPON 0761-22686, FAKSIMILE 0761-22647');
  const [websiteLine, setWebsiteLine] = useState('http://www.djpbn.kemenkeu.go.id/kanwil/riau');
  const [kopLogoUrl, setKopLogoUrl] = useState(DEFAULT_LOGO);
  const [success, setSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load Kop settings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('kop_settings');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.headerLine1) setHeaderLine1(data.headerLine1);
        if (data.headerLine2) setHeaderLine2(data.headerLine2);
        if (data.headerLine3) setHeaderLine3(data.headerLine3);
        if (data.headerLine4 !== undefined) setHeaderLine4(data.headerLine4);
        if (data.addressLine) setAddressLine(data.addressLine);
        if (data.phoneFaxLine) setPhoneFaxLine(data.phoneFaxLine);
        if (data.websiteLine) setWebsiteLine(data.websiteLine);
        if (data.kopLogoUrl) setKopLogoUrl(data.kopLogoUrl);
      } catch (e) {
        console.error('Failed to parse kop_settings', e);
      }
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const settingsPayload = { 
      headerLine1, 
      headerLine2, 
      headerLine3, 
      headerLine4, 
      addressLine, 
      phoneFaxLine, 
      websiteLine, 
      kopLogoUrl 
    };
    
    // Save to localStorage
    localStorage.setItem('kop_settings', JSON.stringify(settingsPayload));
    
    // Trigger custom window event to notify other components instantly
    window.dispatchEvent(new Event('kop_settings_changed'));

    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
    if (onSave) {
      onSave(settingsPayload);
    }
  };

  const handleFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setKopLogoUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    } else {
      alert('Silakan pilih file gambar yang valid (PNG, JPG, SVG, dll.)');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleResetLogo = () => {
    setKopLogoUrl(DEFAULT_LOGO);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Pengaturan KOP Surat & Logo Instansi</h2>
        <p className="text-xs text-slate-500 mt-1">Konfigurasi identitas resmi instansi untuk kop surat dinas dan dokumen SPKL bulanan PPNPN.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings Form */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Award className="w-5 h-5 text-blue-600" />
            <h4 className="font-bold text-slate-700 text-sm">Form Identitas Instansi</h4>
          </div>

          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Baris Pertama (Kementerian)</label>
              <input
                type="text"
                required
                value={headerLine1}
                onChange={(e) => setHeaderLine1(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Baris Kedua (Eselon I / Direktorat Jenderal)</label>
              <input
                type="text"
                required
                value={headerLine2}
                onChange={(e) => setHeaderLine2(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Baris Ketiga (Nama Kantor Wilayah / Unit Kerja)</label>
              <input
                type="text"
                required
                value={headerLine3}
                onChange={(e) => setHeaderLine3(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Baris Keempat (Provinsi/Kota)</label>
              <input
                type="text"
                required
                value={headerLine4}
                onChange={(e) => setHeaderLine4(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Alamat Instansi</label>
              <input
                type="text"
                required
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Telepon & Faksimile</label>
              <input
                type="text"
                required
                value={phoneFaxLine}
                onChange={(e) => setPhoneFaxLine(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Website Kantor</label>
              <input
                type="text"
                required
                value={websiteLine}
                onChange={(e) => setWebsiteLine(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Logo Upload Section */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Logo Instansi</label>
              
              {/* Drag and Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={triggerFileSelect}
                className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                  isDragging 
                    ? 'border-blue-500 bg-blue-50 text-blue-600' 
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 bg-slate-50 text-slate-500'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
                <Upload className={`w-6 h-6 ${isDragging ? 'text-blue-500 animate-bounce' : 'text-slate-400'}`} />
                <div className="space-y-1">
                  <p className="font-semibold text-[11px] text-slate-700">Tarik gambar logo di sini, atau <span className="text-blue-600 hover:underline">cari file</span></p>
                  <p className="text-[10px] text-slate-400 font-medium">Mendukung format PNG, JPG, JPEG, SVG up to 5MB</p>
                </div>
              </div>

              {/* Logo URL Input & Control Buttons */}
              <div className="flex gap-2 items-center">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={kopLogoUrl}
                    onChange={(e) => setKopLogoUrl(e.target.value)}
                    placeholder="Masukkan URL Logo alternatif"
                    className="w-full text-[11px] pl-3 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  <div className="absolute right-2.5 top-2.5 text-slate-400">
                    <Image className="w-4 h-4" />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleResetLogo}
                  title="Kembalikan Logo Bawaan"
                  className="p-2.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-500 transition-colors shrink-0"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {success && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-lg flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>Pengaturan KOP Surat berhasil diperbarui!</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-[#0B1E43] hover:bg-[#07142E] text-white text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Perubahan</span>
            </button>
          </form>
        </div>

        {/* Live Preview Container */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <FileText className="w-5 h-5 text-blue-600" />
            <h4 className="font-bold text-slate-700 text-sm">Preview KOP Surat Resmi</h4>
          </div>

          <div className="border border-slate-300 p-8 rounded-xl bg-white font-serif text-black space-y-4">
            <div className="flex items-center justify-between gap-4 pb-3 border-b-4 border-black">
              {/* Logo Instansi on the left */}
              <div className="shrink-0 w-16 h-16 flex items-center justify-center overflow-hidden">
                <img 
                  src={kopLogoUrl} 
                  alt="Logo Preview" 
                  className="max-w-full max-h-full object-contain" 
                  referrerPolicy="no-referrer" 
                />
              </div>
              
              {/* Text centered in the remaining space */}
              <div className="text-center flex-1 font-serif space-y-0.5">
                <h3 className="font-bold text-[13px] tracking-wide text-black uppercase leading-tight">{headerLine1}</h3>
                <h4 className="font-bold text-[12px] tracking-wide text-black uppercase leading-tight">{headerLine2}</h4>
                <h4 className="font-bold text-[11px] tracking-wide text-black uppercase leading-tight">{headerLine3}</h4>
                <p className="font-bold text-[11px] tracking-wide text-black uppercase leading-tight">{headerLine4}</p>
                <div className="pt-1.5 space-y-0.5">
                  <p className="text-[8px] font-sans text-slate-800 leading-tight uppercase">{addressLine}</p>
                  <p className="text-[8px] font-sans text-slate-800 leading-tight uppercase">{phoneFaxLine}</p>
                  <p className="text-[8px] font-sans text-slate-800 leading-tight">
                    {websiteLine.toUpperCase().startsWith('WEBSITE') ? '' : 'WEBSITE '}<span className="underline">{websiteLine}</span>
                  </p>
                </div>
              </div>

              {/* Balanced spacer on the right so text is mathematically centered */}
              <div className="w-16 h-16 shrink-0 invisible"></div>
            </div>

            <div className="text-center mt-6">
              <span className="text-[10px] font-bold tracking-wide uppercase underline">SURAT PERINTAH KERJA LEMBUR</span>
              <p className="text-[8px] text-slate-400 mt-0.5">Nomor: SPKL-0001/WPB.08/2026</p>
            </div>

            <div className="py-4 space-y-2 text-[9px]">
              <p>Menerangkan bahwa pegawai PPNPN di bawah ini telah melakukan lembur dinas resmi:</p>
              <div className="pl-4 font-sans font-bold space-y-1">
                <p>• Nama: John Doe, S.Kom</p>
                <p>• Jabatan: Teknisi Jaringan Kantor</p>
                <p>• Waktu: 24 Juni 2026</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
