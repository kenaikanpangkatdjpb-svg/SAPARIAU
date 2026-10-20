import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Calendar, Trash2, X, AlertTriangle, Save, HelpCircle, CheckCircle } from 'lucide-react';
import { Employee } from '../types';

export interface KIFinding {
  id: string;
  employeeId: string;
  employeeName: string;
  period: string; // e.g. "Juni 2026"
  sidakDate: string; // YYYY-MM-DD
  findingType: string; // e.g. "Keterlambatan", "Logbook Kosong / Belum Diisi", "Atribut / Seragam Tidak Sesuai", "Meninggalkan Kantor Tanpa Izin", "Lainnya"
  severity: 'Rendah' | 'Sedang' | 'Tinggi';
  notes: string;
  createdAt: string;
}

interface RekomendasiKIViewProps {
  user: Employee;
  employees: Employee[];
}

export default function RekomendasiKIView({ user, employees }: RekomendasiKIViewProps) {
  const isAdmin = user.role === 'admin';
  const [findings, setFindings] = useState<KIFinding[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedPeriod, setSelectedPeriod] = useState('Semua Periode');

  // New Finding Form States
  const [newEmployeeId, setNewEmployeeId] = useState('');
  const [newPeriod, setNewPeriod] = useState('Juni 2026');
  const [newSidakDate, setNewSidakDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [newFindingType, setNewFindingType] = useState('');
  const [newSeverity, setNewSeverity] = useState<'Rendah' | 'Sedang' | 'Tinggi' | ''>('');
  const [newNotes, setNewNotes] = useState('');

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Periods list
  const periods = [
    'Semua Periode',
    'Januari 2026', 'Februari 2026', 'Maret 2026', 'April 2026', 'Mei 2026', 'Juni 2026',
    'Juli 2026', 'Agustus 2026', 'September 2026', 'Oktober 2026', 'November 2026', 'Desember 2026'
  ];

  // Load findings from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('kepatuhan_internal_findings');
    if (stored) {
      try {
        setFindings(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse findings", e);
      }
    } else {
      // Seed initial data if app isn't reset
      const isReset = localStorage.getItem('app_is_reset') === 'true';
      const initial: KIFinding[] = isReset ? [] : [
        {
          id: 'ki_1',
          employeeId: 'emp_maliq',
          employeeName: 'maliq',
          period: 'Juni 2026',
          sidakDate: '2026-06-25',
          findingType: 'Atribut / Seragam Tidak Sesuai',
          severity: 'Rendah',
          notes: 'Tidak menggunakan tanda pengenal ID Card dinas saat jam kerja utama.',
          createdAt: new Date().toISOString()
        },
        {
          id: 'ki_2',
          employeeId: 'emp_joko',
          employeeName: 'Joko Widodo',
          period: 'Juni 2026',
          sidakDate: '2026-06-24',
          findingType: 'Keterlambatan',
          severity: 'Sedang',
          notes: 'Terlambat masuk tanpa keterangan logis sebanyak 3 kali berturut-turut.',
          createdAt: new Date().toISOString()
        }
      ];
      setFindings(initial);
      localStorage.setItem('kepatuhan_internal_findings', JSON.stringify(initial));
    }
  }, []);

  const saveFindings = (updated: KIFinding[]) => {
    setFindings(updated);
    localStorage.setItem('kepatuhan_internal_findings', JSON.stringify(updated));
  };

  // Filter Karyawan List for the Dropdown (role === 'karyawan')
  const karyawanList = useMemo(() => {
    return employees.filter(e => e.role === 'karyawan');
  }, [employees]);

  // Filtered Findings
  const filteredFindings = useMemo(() => {
    return findings.filter(f => {
      // If not admin, regular pegawai can only see their own findings
      if (!isAdmin && f.employeeId !== user.id) {
        return false;
      }

      const matchSearch = f.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          f.findingType.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchYear = f.sidakDate.startsWith(selectedYear);
      const matchPeriod = selectedPeriod === 'Semua Periode' || f.period === selectedPeriod;

      return matchSearch && matchYear && matchPeriod;
    });
  }, [findings, searchQuery, selectedYear, selectedPeriod, user, isAdmin]);

  // Paginated findings
  const paginatedFindings = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredFindings.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredFindings, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredFindings.length / itemsPerPage));

  // Reset pagination on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedYear, selectedPeriod]);

  // Handle Form Submit
  const handleSaveData = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmployeeId) {
      alert("Silakan pilih Pegawai.");
      return;
    }
    if (!newFindingType) {
      alert("Silakan pilih Jenis Temuan.");
      return;
    }
    if (!newSeverity) {
      alert("Silakan pilih Tingkat Temuan.");
      return;
    }

    const selectedEmp = employees.find(emp => emp.id === newEmployeeId);
    if (!selectedEmp) return;

    const newRec: KIFinding = {
      id: `ki_${Date.now()}`,
      employeeId: selectedEmp.id,
      employeeName: selectedEmp.name,
      period: newPeriod,
      sidakDate: newSidakDate,
      findingType: newFindingType,
      severity: newSeverity as 'Rendah' | 'Sedang' | 'Tinggi',
      notes: newNotes,
      createdAt: new Date().toISOString()
    };

    const updated = [newRec, ...findings];
    saveFindings(updated);

    // Reset Form
    setNewEmployeeId('');
    setNewPeriod('Juni 2026');
    setNewSidakDate(new Date().toISOString().split('T')[0]);
    setNewFindingType('');
    setNewSeverity('');
    setNewNotes('');
    setShowAddModal(false);

    alert("Data Temuan Kepatuhan Internal Berhasil Disimpan!");
  };

  const handleDeleteFinding = (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus temuan kepatuhan ini?")) {
      const updated = findings.filter(f => f.id !== id);
      saveFindings(updated);
    }
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case 'Tinggi':
        return 'bg-rose-50 text-rose-600 border border-rose-200/60';
      case 'Sedang':
        return 'bg-amber-50 text-amber-600 border border-amber-200/60';
      default:
        return 'bg-blue-50 text-blue-600 border border-blue-200/60';
    }
  };

  const formatDateString = (dateStr: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  return (
    <div id="temuan-ki-dashboard" className="space-y-6 text-left">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2 select-none">
            Temuan Kepatuhan Internal
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Monitoring hasil sidak kepatuhan internal
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-[#1E3A8A] hover:bg-blue-800 text-white font-extrabold tracking-wider text-xs uppercase px-5 py-3 rounded-xl flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Temuan</span>
          </button>
        )}
      </div>

      {/* Filter Row Cards */}
      <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-sm grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Search */}
        <div className="md:col-span-6 relative">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama pegawai..."
            className="w-full pl-10 pr-4 py-3 bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 transition-all text-slate-800 placeholder:text-slate-400 placeholder:font-medium"
          />
        </div>

        {/* Year Selector */}
        <div className="md:col-span-3">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
          >
            <option value="2026">2026</option>
            <option value="2025">2025</option>
          </select>
        </div>

        {/* Period Selector */}
        <div className="md:col-span-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
          >
            {periods.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/60 text-slate-400 font-extrabold uppercase text-[9.5px] tracking-wider select-none">
                <th className="py-4 px-6">Nama Pegawai</th>
                <th className="py-4 px-4">Periode</th>
                <th className="py-4 px-4">Tanggal Sidak</th>
                <th className="py-4 px-4">Jenis Temuan</th>
                <th className="py-4 px-4">Tingkat</th>
                {isAdmin && <th className="py-4 px-6 text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {paginatedFindings.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="space-y-1">
                      <p className="font-extrabold text-slate-800 text-[13px]">{rec.employeeName}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">PPNPN INSTANSI</p>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-slate-600 font-bold">
                    {rec.period}
                  </td>
                  <td className="py-4 px-4 font-mono font-bold text-slate-600">
                    {formatDateString(rec.sidakDate)}
                  </td>
                  <td className="py-4 px-4">
                    <div className="space-y-1 max-w-xs sm:max-w-md">
                      <p className="font-extrabold text-slate-800">{rec.findingType}</p>
                      {rec.notes && (
                        <p className="text-[10.5px] text-slate-500 leading-relaxed font-medium">
                          {rec.notes}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4 select-none">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${getSeverityBadgeColor(rec.severity)}`}>
                      {rec.severity}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="py-4 px-6">
                      <div className="flex justify-center select-none">
                        <button
                          onClick={() => handleDeleteFinding(rec.id)}
                          className="p-2 text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-xl transition-all active:scale-95"
                          title="Hapus Temuan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}

              {paginatedFindings.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="py-12 text-center text-slate-400 font-bold italic select-none">
                    Tidak ada data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination Footer */}
        <div className="bg-white border-t border-slate-100 p-4 flex items-center justify-between text-xs font-bold text-slate-500 select-none">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className={`px-4 py-2 border rounded-xl font-extrabold text-[11px] uppercase tracking-wide transition-all ${
              currentPage === 1
                ? 'border-slate-100 text-slate-300 bg-slate-50 cursor-not-allowed'
                : 'border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-95'
            }`}
          >
            Prev
          </button>

          <span className="text-slate-600 font-bold font-mono">
            Halaman {currentPage} / {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className={`px-4 py-2 border rounded-xl font-extrabold text-[11px] uppercase tracking-wide transition-all ${
              currentPage === totalPages
                ? 'border-slate-100 text-slate-300 bg-slate-50 cursor-not-allowed'
                : 'border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-95'
            }`}
          >
            Next
          </button>
        </div>
      </div>

      {/* Info Card banner for non-admin Pegawai */}
      {!isAdmin && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3 items-start select-none">
          <AlertTriangle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-extrabold text-blue-800 uppercase tracking-wider">Informasi Kepatuhan Internal</h4>
            <p className="text-[11px] text-blue-600 leading-relaxed font-semibold">
              Halaman ini menampilkan catatan temuan sidak kepatuhan internal yang diterbitkan oleh Unit Kepatuhan Internal instansi untuk Anda. Silakan hubungi admin Unit KI jika terdapat ketidaksesuaian laporan.
            </p>
          </div>
        </div>
      )}

      {/* Add Finding Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] border border-slate-100 shadow-2xl w-full max-w-[500px] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 text-left">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between select-none">
              <h3 className="font-extrabold text-slate-800 text-sm">Tambah Temuan</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveData} className="p-6 space-y-4">
              {/* Pegawai Dropdown */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Pegawai</label>
                <select
                  required
                  value={newEmployeeId}
                  onChange={(e) => setNewEmployeeId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
                >
                  <option value="">Pilih Pegawai</option>
                  {karyawanList.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>

              {/* Periode Dropdown */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Periode</label>
                <select
                  required
                  value={newPeriod}
                  onChange={(e) => setNewPeriod(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
                >
                  {periods.filter(p => p !== 'Semua Periode').map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {/* Tanggal Sidak Date Picker */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Tanggal Sidak</label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    required
                    type="date"
                    value={newSidakDate}
                    onChange={(e) => setNewSidakDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition-all cursor-pointer font-mono"
                  />
                </div>
              </div>

              {/* Jenis Temuan Dropdown */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Jenis Temuan</label>
                <select
                  required
                  value={newFindingType}
                  onChange={(e) => setNewFindingType(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
                >
                  <option value="">Pilih Temuan</option>
                  <option value="Keterlambatan">Keterlambatan</option>
                  <option value="Logbook Kosong / Belum Diisi">Logbook Kosong / Belum Diisi</option>
                  <option value="Atribut / Seragam Tidak Sesuai">Atribut / Seragam Tidak Sesuai</option>
                  <option value="Meninggalkan Kantor Tanpa Izin">Meninggalkan Kantor Tanpa Izin</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              {/* Tingkat Temuan Dropdown */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Tingkat Temuan</label>
                <select
                  required
                  value={newSeverity}
                  onChange={(e) => setNewSeverity(e.target.value as any)}
                  className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
                >
                  <option value="">Pilih Tingkat</option>
                  <option value="Rendah">Rendah</option>
                  <option value="Sedang">Sedang</option>
                  <option value="Tinggi">Tinggi</option>
                </select>
              </div>

              {/* Catatan Textarea */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">catatan</label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="catatan temuan..."
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 transition-all text-slate-800 placeholder:text-slate-400"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 bg-[#1E3A8A] hover:bg-blue-800 text-white font-extrabold tracking-wider text-xs uppercase rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Data</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
