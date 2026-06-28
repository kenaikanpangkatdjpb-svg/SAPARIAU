import React, { useState, useMemo, useEffect } from 'react';
import { BookOpen, Calendar, Clock, Plus, Search, Send, User, CheckCircle, XCircle } from 'lucide-react';
import { Employee, Logbook } from '../types';

interface LogbookViewProps {
  user: Employee;
  employees: Employee[];
  logbooks: Logbook[];
  onSubmitLogbook: (content: string) => void;
  onApproveLogbook?: (id: string, approve: boolean) => void;
}

export default function LogbookView({
  user,
  employees,
  logbooks,
  onSubmitLogbook,
  onApproveLogbook
}: LogbookViewProps) {
  const isAdmin = user.role === 'admin';
  const [searchTerm, setSearchTerm] = useState('');
  const [newLogContent, setNewLogContent] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Filter logs based on user or search query
  const filteredLogbooks = useMemo(() => {
    let list = logbooks;
    if (!isAdmin) {
      list = logbooks.filter(log => log.employeeId === user.id);
    }
    
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(log => 
        log.content.toLowerCase().includes(q) || 
        log.employeeName.toLowerCase().includes(q) ||
        log.date.includes(q)
      );
    }

    // Sort by date/time (latest first)
    return [...list].sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return (b.time || '').localeCompare(a.time || '');
    });
  }, [logbooks, user, isAdmin, searchTerm]);

  // Reset pagination when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredLogbooks.length / itemsPerPage));
  
  const paginatedLogbooks = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLogbooks.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLogbooks, currentPage, itemsPerPage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogContent.trim()) {
      alert("Isi rincian aktivitas kerja tidak boleh kosong!");
      return;
    }

    onSubmitLogbook(newLogContent);
    setNewLogContent('');
    setSuccessMsg("Catatan harian logbook berhasil disimpan!");
    
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Helper to format date into DD/MM/YYYY
  const formatDateDMY = (dateStr: string): string => {
    if (!dateStr) return '';
    if (dateStr.includes('/')) return dateStr;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  return (
    <div id="logbook-view" className="space-y-6">
      {/* Header section with light theme */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
          Catatan Logbook Aktivitas Harian PPNPN
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Laporan aktivitas harian, penugasan dinas, dan status verifikasi persetujuan logbook oleh atasan.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Input Aktivitas Kerja (only for employees) (5 cols) */}
        {!isAdmin ? (
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-800 text-sm">Input Aktivitas Kerja</h3>

            {successMsg && (
              <div className="p-3 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                  Rincian Aktivitas Kerja
                </label>
                <textarea
                  required
                  rows={6}
                  value={newLogContent}
                  onChange={(e) => setNewLogContent(e.target.value)}
                  placeholder="Tuliskan rincian detail pekerjaan harian Anda..."
                  className="w-full text-xs p-3.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 font-medium leading-relaxed"
                />
              </div>

              <button
                id="submit-logbook-view-btn"
                type="submit"
                className="w-full py-3 px-4 bg-[#0B1E43] hover:bg-[#07142E] text-white font-extrabold rounded-xl uppercase tracking-wider text-[10px] transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Simpan Aktivitas</span>
              </button>
            </form>
          </div>
        ) : (
          <div className="lg:col-span-4 space-y-4">
            {/* Admin Informational Card */}
            <div className="bg-gradient-to-br from-[#0B1E43] to-slate-900 p-6 rounded-2xl text-white shadow-md space-y-3">
              <h4 className="text-[10px] font-extrabold tracking-wider uppercase text-blue-300">
                Verifikasi Logbook Pegawai
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Anda berada di Panel Verifikasi Logbook. Sebagai Admin, Anda dapat menyetujui atau menolak catatan aktivitas harian yang dikirim oleh pegawai PPNPN.
              </p>
              <div className="pt-2 flex justify-between items-center text-xs">
                <span className="text-slate-400 font-semibold">Total Logbook:</span>
                <span className="font-bold text-white bg-white/10 px-2.5 py-1 rounded-lg border border-white/10">
                  {filteredLogbooks.length} Laporan
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Right Column: Riwayat Logbook Kerja (8 cols or full width if admin) */}
        <div className={`${isAdmin ? 'lg:col-span-8' : 'lg:col-span-8'} bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col`}>
          {/* Card Header matching image style */}
          <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
            <h4 className="font-extrabold text-slate-800 text-sm">
              Riwayat Logbook Kerja
            </h4>
            
            {/* Pill-shaped search input exactly matching the screenshot */}
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari aktivitas..."
              className="w-48 text-xs border border-slate-200 px-4 py-1.5 rounded-full placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Table view matching the screenshot */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-5">Tanggal</th>
                  {isAdmin && <th className="py-3 px-5">Pegawai</th>}
                  <th className="py-3 px-5">Aktivitas Pekerjaan</th>
                  <th className="py-3 px-5 text-right pr-8">Status</th>
                  {isAdmin && <th className="py-3 px-5 text-center">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedLogbooks.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 5 : 3} className="py-10 text-center text-xs font-semibold text-slate-400">
                      Tidak ada riwayat aktivitas kerja harian yang terdaftar.
                    </td>
                  </tr>
                ) : (
                  paginatedLogbooks.map((log) => {
                    const status = log.status || 'Approved';

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition-colors text-xs text-slate-800">
                        {/* Tanggal column */}
                        <td className="py-4 px-5 font-medium text-slate-500 whitespace-nowrap">
                          {formatDateDMY(log.date)}
                        </td>
                        
                        {/* Pegawai column (Admin only) */}
                        {isAdmin && (
                          <td className="py-4 px-5 font-bold text-slate-800">
                            {log.employeeName}
                          </td>
                        )}

                        {/* Aktivitas Pekerjaan column */}
                        <td className="py-4 px-5 font-medium text-slate-700 leading-relaxed max-w-[280px] break-words">
                          {log.content}
                        </td>

                        {/* Status column - Align right matching screenshot */}
                        <td className="py-4 px-5 text-right pr-8 whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 text-[9px] font-bold rounded-md border inline-block ${
                            status === 'Pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                            status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                          }`}>
                            {status}
                          </span>
                        </td>

                        {/* Actions (Admin only) */}
                        {isAdmin && (
                          <td className="py-4 px-5 text-center">
                            {status === 'Pending' && onApproveLogbook ? (
                              <div className="flex gap-1.5 justify-center">
                                <button
                                  onClick={() => onApproveLogbook(log.id, true)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-bold uppercase rounded-md transition-all shadow-sm"
                                >
                                  Setuju
                                </button>
                                <button
                                  onClick={() => onApproveLogbook(log.id, false)}
                                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[9px] font-bold uppercase rounded-md transition-all shadow-sm"
                                >
                                  Tolak
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-300 text-[10px] font-semibold italic">Selesai</span>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination bar matching exactly the screenshot */}
          <div className="px-5 py-4 border-t border-slate-100 flex justify-between items-center bg-white text-xs">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Sebelumnya
            </button>
            
            <span className="font-bold text-slate-500">
              Halaman {currentPage} dari {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
