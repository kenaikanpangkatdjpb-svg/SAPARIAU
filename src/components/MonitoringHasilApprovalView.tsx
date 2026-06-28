import React, { useState, useMemo } from 'react';
import { Eye, CheckCircle2, XCircle, Search, Calendar, User, Clock, FileText, Printer, ArrowUpRight } from 'lucide-react';
import { Employee, LeaveRequest, Logbook } from '../types';

interface MonitoringHasilApprovalViewProps {
  employees: Employee[];
  leaves: LeaveRequest[];
  logbooks: Logbook[];
}

export default function MonitoringHasilApprovalView({
  employees,
  leaves,
  logbooks
}: MonitoringHasilApprovalViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'cuti' | 'izin' | 'sakit' | 'logbook'>('all');

  // Unified finalized requests list
  const historyList = useMemo(() => {
    const list: any[] = [];

    // Add leaves that are either Approved or Rejected
    leaves.filter(l => l.status !== 'Pending').forEach(l => {
      list.push({
        id: l.id,
        employeeName: l.employeeName,
        employeeId: l.employeeId,
        type: l.type === 'Cuti' ? 'Cuti Tahunan' : l.type === 'Sakit' ? 'Cuti Sakit' : 'Izin',
        period: l.startDate === l.endDate ? l.startDate : `${l.startDate} - ${l.endDate}`,
        reason: l.reason,
        status: l.status,
        date: l.createdAt,
        processedBy: l.approvedBy || 'Administrator'
      });
    });

    // Add logbooks that are Approved or Rejected
    logbooks.filter(log => log.status && log.status !== 'Pending').forEach(log => {
      list.push({
        id: log.id,
        employeeName: log.employeeName,
        employeeId: log.employeeId,
        type: 'Logbook Aktivitas',
        period: log.date,
        reason: log.content,
        status: log.status,
        date: `${log.date} ${log.time}`,
        processedBy: log.approvedBy || 'Administrator'
      });
    });

    // Filter by search & type
    return list.filter(item => {
      const matchSearch = item.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (filterType === 'all') return matchSearch;
      if (filterType === 'cuti' && item.type === 'Cuti Tahunan') return matchSearch;
      if (filterType === 'izin' && item.type === 'Izin') return matchSearch;
      if (filterType === 'sakit' && item.type === 'Cuti Sakit') return matchSearch;
      if (filterType === 'logbook' && item.type === 'Logbook Aktivitas') return matchSearch;
      return false;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [leaves, logbooks, searchTerm, filterType]);

  const approvedCount = historyList.filter(h => h.status === 'Approved').length;
  const rejectedCount = historyList.filter(h => h.status === 'Rejected').length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Monitoring Hasil Approval</h2>
        <p className="text-xs text-slate-500 mt-1">Histori dan pemantauan menyeluruh dari pengajuan yang telah diproses oleh Admin.</p>
      </div>

      {/* Mini Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Total Terproses</span>
            <span className="text-2xl font-black text-slate-800 mt-1 block">{historyList.length}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Eye className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Disetujui</span>
            <span className="text-2xl font-black text-emerald-600 mt-1 block">{approvedCount}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Ditolak</span>
            <span className="text-2xl font-black text-rose-600 mt-1 block">{rejectedCount}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Control Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-2.5 w-4.5 h-4.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari pegawai, alasan, atau ID..."
              className="w-full text-xs pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Type Buttons */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { value: 'all', label: 'Semua Kategori' },
              { value: 'cuti', label: 'Cuti Tahunan' },
              { value: 'sakit', label: 'Cuti Sakit' },
              { value: 'izin', label: 'Izin' },
              { value: 'logbook', label: 'Logbook' }
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilterType(tab.value as any)}
                className={`py-1.5 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${
                  filterType === tab.value
                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                    : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* History Table */}
        <div className="border border-slate-100 rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-5">ID Pengajuan</th>
                <th className="py-3 px-5">Pegawai</th>
                <th className="py-3 px-5">Jenis</th>
                <th className="py-3 px-5">Tanggal Penugasan</th>
                <th className="py-3 px-5">Uraian / Alasan</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5">Verifikator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {historyList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-xs font-semibold text-slate-400">
                    Tidak ada riwayat persetujuan yang ditemukan.
                  </td>
                </tr>
              ) : (
                historyList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors text-xs">
                    <td className="py-3.5 px-5 font-mono font-bold text-slate-800">
                      REQ-{item.id.replace(/\D/g, '').slice(0, 10) || item.id}
                    </td>
                    <td className="py-3.5 px-5 font-bold text-slate-800">
                      {item.employeeName}
                    </td>
                    <td className="py-3.5 px-5 font-semibold text-blue-700">
                      {item.type}
                    </td>
                    <td className="py-3.5 px-5 text-slate-500 font-medium">
                      {item.period}
                    </td>
                    <td className="py-3.5 px-5 text-slate-500 max-w-xs truncate" title={item.reason}>
                      {item.reason}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className={`px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wider rounded border ${
                        item.status === 'Approved'
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                          : 'bg-rose-50 text-rose-500 border-rose-100'
                      }`}>
                        {item.status === 'Approved' ? 'Disetujui' : 'Ditolak'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-slate-400 font-medium font-mono text-[10px]">
                      {item.processedBy}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
