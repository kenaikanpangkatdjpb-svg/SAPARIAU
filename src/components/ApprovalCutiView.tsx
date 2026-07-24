import React, { useState, useEffect, useMemo } from 'react';
import { FileText, CalendarRange, CheckCircle2, XCircle, AlertCircle, Send, Printer, X, Eye } from 'lucide-react';
import { Employee, LeaveRequest } from '../types';

const ensureHtml2Pdf = (): Promise<any> => {
  return new Promise((resolve) => {
    // @ts-ignore
    if (window.html2pdf) {
      // @ts-ignore
      resolve(window.html2pdf);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    script.onload = () => {
      // @ts-ignore
      resolve(window.html2pdf);
    };
    script.onerror = () => {
      resolve(null);
    };
    document.body.appendChild(script);
  });
};

export const triggerPdfDownload = async (element: HTMLElement, filename: string) => {
  if (!element) return;
  const html2pdf = await ensureHtml2Pdf();
  if (!html2pdf) return;

  const targetId = element.id || 'printable-area';

  const opt = {
    margin: [8, 8, 8, 8], // 8mm page margins
    filename: filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
      letterRendering: true,
      scrollX: 0,
      scrollY: 0,
      onclone: (clonedDoc: Document) => {
        // 1. Sanitize all <style> tags to eliminate oklch/oklab/color-mix color parser crashes in html2canvas
        const styleEls = clonedDoc.querySelectorAll('style');
        styleEls.forEach((style) => {
          if (style.textContent) {
            style.textContent = style.textContent
              .replace(/oklch\([^)]+\)/gi, '#1e293b')
              .replace(/oklab\([^)]+\)/gi, '#1e293b')
              .replace(/color-mix\([^)]+\)/gi, '#cbd5e1')
              .replace(/lab\([^)]+\)/gi, '#334155');
          }
        });

        // 2. Sanitize inline style attributes on cloned elements
        const allElements = clonedDoc.querySelectorAll('*');
        allElements.forEach((el) => {
          const styleAttr = el.getAttribute('style');
          if (styleAttr && /oklch|oklab|color-mix|lab/i.test(styleAttr)) {
            el.setAttribute('style', styleAttr
              .replace(/oklch\([^)]+\)/gi, '#1e293b')
              .replace(/oklab\([^)]+\)/gi, '#1e293b')
              .replace(/color-mix\([^)]+\)/gi, '#cbd5e1')
              .replace(/lab\([^)]+\)/gi, '#334155')
            );
          }
        });

        // 3. Find the cloned target element and ensure its container hierarchy is fully expanded and unconstrained
        const clonedTarget = (clonedDoc.getElementById(targetId) || clonedDoc.querySelector('#' + targetId)) as HTMLElement | null;
        if (clonedTarget) {
          clonedTarget.style.boxShadow = 'none';
          clonedTarget.style.borderRadius = '0px';
          clonedTarget.style.transform = 'none';
          clonedTarget.style.maxWidth = '100%';
          clonedTarget.style.width = '100%';
          clonedTarget.style.margin = '0 auto';
          clonedTarget.style.padding = '12px 16px';

          // Unconstrain all parent containers in clonedDoc so nothing is scrolled or clipped
          let parent = clonedTarget.parentElement;
          while (parent && parent !== clonedDoc.body) {
            parent.style.overflow = 'visible';
            parent.style.maxHeight = 'none';
            parent.style.height = 'auto';
            parent.style.transform = 'none';
            parent.style.padding = '0';
            parent.style.margin = '0';
            parent = parent.parentElement;
          }
        }
      }
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  };

  try {
    await html2pdf().from(element).set(opt).save();
  } catch (err) {
    console.warn("PDF Export Error:", err);
  }
};

export const triggerPrint = async (elementId: string, documentTitle: string = 'Dokumen') => {
  const element = document.getElementById(elementId);
  
  if (!element) {
    console.warn("Print target element not found:", elementId);
    return;
  }

  // Direct PDF download using html2pdf to bypass iframe sandboxing restrictions ('allow-modals' not set)
  const pdfFilename = `${documentTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
  
  try {
    const html2pdf = await ensureHtml2Pdf();
    if (html2pdf) {
      await triggerPdfDownload(element, pdfFilename);
      return;
    }
  } catch (pdfError) {
    console.warn("html2pdf print generation error, attempting fallback iframe print:", pdfError);
  }

  // Fallback: If html2pdf fails or is unavailable, attempt iframe print
  try {
    const originalTitle = document.title;
    if (documentTitle) {
      document.title = documentTitle;
    }

    const existingFrame = document.getElementById('active-print-iframe');
    if (existingFrame) {
      existingFrame.remove();
    }

    let styleTags = '';
    document.querySelectorAll('style, link[rel="stylesheet"]').forEach((node) => {
      let cssText = node.outerHTML;
      if (cssText) {
        cssText = cssText
          .replace(/oklch\([^)]+\)/gi, '#1e293b')
          .replace(/oklab\([^)]+\)/gi, '#1e293b')
          .replace(/color-mix\([^)]+\)/gi, '#cbd5e1')
          .replace(/lab\([^)]+\)/gi, '#334155');
      }
      styleTags += cssText;
    });

    const iframe = document.createElement('iframe');
    iframe.id = 'active-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = '0px';
    iframe.style.visibility = 'hidden';

    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) {
      window.print();
      return;
    }

    const clonedElement = element.cloneNode(true) as HTMLElement;
    clonedElement.style.boxShadow = 'none';
    clonedElement.style.borderRadius = '0px';
    clonedElement.style.transform = 'none';
    clonedElement.style.maxWidth = '100%';
    clonedElement.style.width = '100%';
    clonedElement.style.margin = '0 auto';
    clonedElement.style.padding = '0';

    clonedElement.querySelectorAll('.no-print, button, svg.lucide-x, .border-t.flex.justify-end').forEach(el => el.remove());

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="id">
        <head>
          <meta charset="utf-8" />
          <title>${documentTitle}</title>
          ${styleTags}
          <style>
            @page { size: A4 portrait; margin: 10mm 12mm !important; }
            *, *::before, *::after { box-sizing: border-box !important; }
            html, body {
              background: #ffffff !important;
              color: #000000 !important;
              margin: 0 !important;
              padding: 0 !important;
              font-family: Georgia, Cambria, "Times New Roman", serif !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            #print-container { width: 100% !important; margin: 0 !important; padding: 0 !important; }
            .no-print, button, svg.lucide-x { display: none !important; }
          </style>
        </head>
        <body>
          <div id="print-container">${clonedElement.outerHTML}</div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (e) {
        console.warn("Iframe print fallback error:", e);
      } finally {
        setTimeout(() => {
          document.title = originalTitle;
          if (iframe && iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
          }
        }, 1000);
      }
    }, 300);
  } catch (err) {
    console.warn("Print fallback error:", err);
  }
};

export const calculateWorkDays = (startDateStr: string, endDateStr: string, userPosition?: string): number => {
  if (!startDateStr || !endDateStr) return 0;
  const startParts = startDateStr.split('-').map(Number);
  const endParts = endDateStr.split('-').map(Number);
  if (startParts.length !== 3 || endParts.length !== 3) return 0;

  const start = new Date(Date.UTC(startParts[0], startParts[1] - 1, startParts[2]));
  const end = new Date(Date.UTC(endParts[0], endParts[1] - 1, endParts[2]));
  if (end < start) return 0;

  const posLower = (userPosition || '').toLowerCase();
  const isSecurity = posLower.includes('satpam') || posLower.includes('security') || posLower.includes('penjaga');

  const holidays = [
    '2026-01-01', // Tahun Baru
    '2026-02-15', // Isra Mikraj
    '2026-03-19', // Nyepi
    '2026-03-20', // Idul Fitri
    '2026-03-21', // Idul Fitri
    '2026-04-03', // Wafat Yesus Kristus
    '2026-05-01', // Hari Buruh
    '2026-05-14', // Kenaikan Yesus Kristus
    '2026-05-27', // Idul Adha
    '2026-06-01', // Hari Lahir Pancasila
    '2026-06-17', // Tahun Baru Islam
    '2026-08-17', // Hari Kemerdekaan RI
    '2026-08-26', // Maulid Nabi
    '2026-12-25', // Hari Raya Natal
  ];

  let count = 0;
  let totalCalendarDays = 0;
  const current = new Date(start);
  while (current <= end) {
    totalCalendarDays++;
    const dayOfWeek = current.getUTCDay();
    const y = current.getUTCFullYear();
    const m = String(current.getUTCMonth() + 1).padStart(2, '0');
    const d = String(current.getUTCDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;

    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = holidays.includes(dateStr);

    if (isSecurity) {
      // Petugas Security / Satpam bekerja 7 hari seminggu
      count++;
    } else {
      // PPNPN diluar Security: Hari kerja Senin s.d. Jumat
      if (!isWeekend && !isHoliday) {
        count++;
      }
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }

  // Jika range yang dipilih hanya jatuh di akhir pekan untuk non-security (misal 25/07/2026 - 26/07/2026 = 2 hari),
  // gunakan totalCalendarDays agar otomatis terisi 2.
  return count || totalCalendarDays || 1;
};

interface ApprovalCutiViewProps {
  user: Employee;
  employees: Employee[];
  leaves: LeaveRequest[];
  onAddLeave: (newLeave: LeaveRequest) => void;
  onApproveLeave: (id: string, approve: boolean) => void;
  onEditLeave: (updatedLeave: LeaveRequest) => void;
  viewType: 'cuti' | 'izin';
}

export default function ApprovalCutiView({
  user,
  employees,
  leaves,
  onAddLeave,
  onApproveLeave,
  onEditLeave,
  viewType
}: ApprovalCutiViewProps) {
  const isAdmin = user.role === 'admin';

  // State values for the form
  const [formData, setFormData] = useState({
    type: (viewType === 'cuti' ? 'Cuti' : 'Izin') as 'Cuti' | 'Izin' | 'Sakit',
    startDate: '',
    endDate: '',
    workDays: 1,
    address: '',
    backup1: '',
    backup2: '',
    reason: ''
  });

  const [successMsg, setSuccessMsg] = useState('');
  const [selectedPrintLeave, setSelectedPrintLeave] = useState<LeaveRequest | null>(null);
  const [editingLeave, setEditingLeave] = useState<LeaveRequest | null>(null);

  // Pre-load html2pdf library for seamless PDF generation
  useEffect(() => {
    // @ts-ignore
    if (!window.html2pdf) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const employeeCutiQuota = user.cutiQuota;

  // Filter lists: admins see all, employees see only their own
  const listToDisplay = useMemo(() => {
    return isAdmin 
      ? leaves 
      : leaves.filter(l => l.employeeId === user.id);
  }, [leaves, isAdmin, user.id]);

  // List of other employees for backups
  const backupEmployees = useMemo(() => {
    const list = employees.filter(e => e.role === 'karyawan' && e.id !== user.id).map(e => e.name);
    // Add default fallbacks to match the high-fidelity screenshots perfectly
    const fallbacks = [
      "Bambang Oetoyo Putra",
      "Robby Andayani",
      "Aditya Pratama",
      "Ahmad Nauval",
      "Dian Ariawan"
    ];
    // Merge list and fallbacks uniquely
    return Array.from(new Set([...list, ...fallbacks]));
  }, [employees, user.id, user.name]);

  // Set default backups if they are empty
  useEffect(() => {
    if (backupEmployees.length > 0) {
      setFormData(prev => ({
        ...prev,
        backup1: prev.backup1 || backupEmployees[0],
        backup2: prev.backup2 || (backupEmployees[1] || backupEmployees[0])
      }));
    }
  }, [backupEmployees]);

  // Sync default type when viewType changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      type: viewType === 'cuti' ? 'Cuti' : 'Izin'
    }));
  }, [viewType]);

  // Calculate workDays automatically when startDate or endDate changes
  useEffect(() => {
    if (formData.startDate) {
      let targetEndDate = formData.endDate;
      if (!targetEndDate || targetEndDate < formData.startDate) {
        targetEndDate = formData.startDate;
      }
      const activeWorkDays = calculateWorkDays(formData.startDate, targetEndDate, user.position);
      setFormData(prev => {
        if (prev.endDate !== targetEndDate || prev.workDays !== activeWorkDays) {
          return { ...prev, endDate: targetEndDate, workDays: activeWorkDays };
        }
        return prev;
      });
    }
  }, [formData.startDate, formData.endDate]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.startDate || !formData.endDate || !formData.reason || !formData.address) {
      alert("Silakan lengkapi semua field termasuk Alamat Selama Cuti dan Alasan!");
      return;
    }

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    if (end < start) {
      alert("Tanggal selesai tidak boleh mendahului tanggal mulai!");
      return;
    }

    if (formData.type === 'Cuti' && formData.workDays > employeeCutiQuota) {
      alert(`Sisa kuota cuti Anda (${employeeCutiQuota} hari) tidak mencukupi untuk pengajuan ini (${formData.workDays} hari).`);
      return;
    }

    const newRequest: LeaveRequest = {
      id: `leave_${Date.now()}`,
      employeeId: user.id,
      employeeName: user.name,
      type: formData.type,
      startDate: formData.startDate,
      endDate: formData.endDate,
      reason: formData.reason,
      status: 'Pending',
      createdAt: new Date().toISOString().split('T')[0], // YYYY-MM-DD format for letter consistency
      workDays: formData.workDays,
      address: formData.address,
      backup1: formData.backup1 || backupEmployees[0] || 'Bambang Oetoyo Putra',
      backup2: formData.backup2 || backupEmployees[1] || 'Robby Andayani'
    };

    onAddLeave(newRequest);
    const typeLabel = formData.type === 'Cuti' ? 'Cuti Tahunan' : formData.type === 'Sakit' ? 'Cuti Sakit' : 'Izin';
    setSuccessMsg(`Pengajuan ${typeLabel} berhasil dikirim! Menunggu persetujuan admin.`);
    
    // Reset form fields while maintaining correct default type and backups
    setFormData(prev => ({
      ...prev,
      startDate: '',
      endDate: '',
      workDays: 1,
      address: '',
      reason: ''
    }));

    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Helper to format date into DD/MM/YYYY
  const formatDateDMY = (dateStr: string): string => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  // Helper to convert date to Indonesian Words Date (e.g. "22 Juni 2026")
  const formatIndonesianDate = (dateStr: string): string => {
    if (!dateStr) return '';
    // Handle both ISO timestamp and YYYY-MM-DD
    const simpleDate = dateStr.split('T')[0];
    const parts = simpleDate.split('-');
    if (parts.length === 3) {
      const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      const day = parseInt(parts[2], 10);
      const month = months[parseInt(parts[1], 10) - 1];
      const year = parts[0];
      return `${day} ${month} ${year}`;
    }
    return dateStr;
  };

  // Indonesian number to words converter (for workDays terbilang)
  const terbilang = (n: number): string => {
    const words = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];
    if (n < 12) return words[n];
    if (n < 20) return words[n - 10] + ' belas';
    if (n < 100) {
      const tens = Math.floor(n / 10);
      const ones = n % 10;
      return words[tens] + ' puluh' + (ones ? ' ' + words[ones] : '');
    }
    return n.toString();
  };

  return (
    <div id="approval-cuti-view" className="space-y-6">
      {/* CSS printing support embedded directly to make it incredibly robust */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm 15mm;
          }
          html, body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * {
            visibility: hidden !important;
          }
          .no-print, header, nav, aside {
            display: none !important;
          }
          div.fixed.inset-0 {
            position: static !important;
            background: transparent !important;
            backdrop-filter: none !important;
            display: block !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            width: 100% !important;
            max-width: 100% !important;
            max-height: none !important;
            height: auto !important;
          }
          div.fixed.inset-0 > div,
          div.fixed.inset-0 > div > div {
            position: static !important;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            width: 100% !important;
            max-width: 100% !important;
            max-height: none !important;
            height: auto !important;
            display: block !important;
          }
          #print-letter-target, #print-letter-target * {
            visibility: visible !important;
          }
          #print-letter-target {
            position: relative !important;
            left: auto !important;
            top: auto !important;
            width: 100% !important;
            max-width: 100% !important;
            max-height: none !important;
            height: auto !important;
            overflow: visible !important;
            padding: 0 !important;
            margin: 0 auto !important;
            background: #ffffff !important;
            color: #000000 !important;
            box-shadow: none !important;
            border: none !important;
            font-size: 11pt !important;
            transform: none !important;
            box-sizing: border-box !important;
          }
        }
      `}</style>

      <div>
        <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
          {viewType === 'cuti' ? 'Pengajuan Cuti Tahunan PPNPN' : 'Pengajuan Izin & Sakit PPNPN'}
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Formulir pengajuan resmi ketidakhadiran, sinkronisasi backup petugas penanggung jawab, dan cetak PDF persetujuan resmi.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Form (only for employees) or Info cards (for admin) */}
        {!isAdmin ? (
          <div className="lg:col-span-5 bg-white p-6 border border-slate-200 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <CalendarRange className="w-5 h-5 text-[#0B1E43]" />
              <h4 className="font-bold text-slate-800 text-sm">
                Formulir Pengajuan Cuti / Izin
              </h4>
            </div>

            {viewType === 'cuti' && (
              <div id="card-sisa-kuota-cuti-ppnpn" className="p-4 bg-gradient-to-r from-[#0B1E43] to-slate-900 text-white border border-blue-900/60 rounded-xl flex items-center justify-between text-xs shadow-sm">
                <div>
                  <p className="text-blue-200 font-bold uppercase tracking-wider text-[10px]">Sisa Kuota Cuti PPNPN</p>
                  <p className="text-2xl font-black text-white mt-0.5">{employeeCutiQuota} Hari</p>
                  <p className="text-[10px] text-blue-300 mt-0.5 font-medium">Telah tersimpan & direkam oleh Admin</p>
                </div>
                <span className="text-[10px] font-bold uppercase text-amber-300 tracking-wider bg-white/10 px-3 py-1.5 border border-white/10 rounded-lg">
                  Tahun 2026
                </span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-medium text-slate-500 uppercase tracking-wider">Jenis Pengajuan</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value as 'Cuti' | 'Izin' | 'Sakit'})}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-blue-500 font-semibold"
                >
                  <option value="Cuti">Cuti Tahunan</option>
                  <option value="Sakit">Cuti Sakit</option>
                  <option value="Izin">Izin</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-medium text-slate-500 uppercase tracking-wider">Mulai Tanggal</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-blue-500 font-semibold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-medium text-slate-500 uppercase tracking-wider">Selesai Tanggal</label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-blue-500 font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-medium text-slate-500 uppercase tracking-wider">Jumlah Cuti (Otomatis)</label>
                  {formData.startDate && (
                    <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100">
                      Otomatis: {formData.workDays} Hari
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  min={1}
                  required
                  value={formData.workDays}
                  onChange={(e) => setFormData({...formData, workDays: Math.max(1, parseInt(e.target.value) || 1)})}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-100/90 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:border-blue-500"
                />
                {formData.startDate && (
                  <div className="p-3 bg-blue-50/80 border border-blue-100 rounded-xl text-[11px] space-y-1 text-slate-700 mt-2">
                    <p className="flex items-center justify-between font-bold">
                      <span>Jumlah Cuti Diajukan:</span>
                      <span className="text-blue-900 text-xs font-black">{formData.workDays} Hari Kerja</span>
                    </p>
                    {formData.type === 'Cuti' && (
                      <p className="flex items-center justify-between text-[10px] pt-1 border-t border-blue-200/50">
                        <span>Estimasi sisa kuota setelah cuti:</span>
                        <span className={`font-bold ${employeeCutiQuota - formData.workDays < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                          {employeeCutiQuota - formData.workDays} Hari
                        </span>
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-medium text-slate-500 uppercase tracking-wider">Alamat Selama Cuti</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Jalan Kandis"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-medium text-slate-500 uppercase tracking-wider">Petugas Penanggung Jawab 1 (Backup 1)</label>
                <select
                  value={formData.backup1}
                  onChange={(e) => setFormData({...formData, backup1: e.target.value})}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-blue-500"
                >
                  {backupEmployees.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-medium text-slate-500 uppercase tracking-wider">Petugas Penanggung Jawab 2 (Backup 2)</label>
                <select
                  value={formData.backup2}
                  onChange={(e) => setFormData({...formData, backup2: e.target.value})}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-blue-500"
                >
                  {backupEmployees.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-medium text-slate-500 uppercase tracking-wider">Keterangan Tambahan / Alasan</label>
                <textarea
                  required
                  rows={3}
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  placeholder="Contoh: kepentingan keluarga / penugasan dinas"
                  className="w-full text-xs p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                id="submit-leave-btn"
                type="submit"
                className="w-full py-3 px-4 bg-[#0B1E43] hover:bg-[#07142E] text-white font-extrabold rounded-xl uppercase tracking-wider text-[10px] transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <Send className="w-4 h-4" />
                <span>Kirim Pengajuan</span>
              </button>
            </form>
          </div>
        ) : (
          <div className="lg:col-span-4 space-y-4">
            {/* Admin Stats Board */}
            <div className="bg-gradient-to-br from-[#0B1E43] to-slate-900 p-6 rounded-2xl text-white shadow-md space-y-4">
              <h4 className="text-[10px] font-extrabold tracking-wider uppercase text-blue-300">
                {viewType === 'cuti' ? 'Persetujuan Cuti Tahunan PPNPN' : 'Persetujuan Izin & Sakit'}
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Anda berada di Panel Persetujuan Administratif. Di sini Anda dapat memberikan verifikasi dan persetujuan resmi atas ketidakhadiran pegawai PPNPN.
              </p>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-white/10 rounded-xl border border-white/10">
                  <span className="text-[9px] text-slate-300 block uppercase tracking-wider">Menunggu</span>
                  <span className="text-lg font-black text-amber-400 block mt-0.5">
                    {leaves.filter(l => l.status === 'Pending').length} Request
                  </span>
                </div>
                <div className="p-3 bg-white/10 rounded-xl border border-white/10">
                  <span className="text-[9px] text-slate-300 block uppercase tracking-wider">Selesai</span>
                  <span className="text-lg font-black text-emerald-400 block mt-0.5">
                    {leaves.filter(l => l.status !== 'Pending').length} Diproses
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Right Column: List of Leaves (Table format matching the first image) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h4 className="font-extrabold text-slate-800 text-sm">
              Riwayat Pengajuan Cuti & Izin
            </h4>
            <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-bold">
              {listToDisplay.length} Total
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-5">Jenis</th>
                  <th className="py-3 px-5">Periode Tanggal</th>
                  <th className="py-3 px-5">Keterangan</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {listToDisplay.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-xs font-semibold text-slate-400">
                      Belum ada riwayat pengajuan yang terdaftar.
                    </td>
                  </tr>
                ) : (
                  listToDisplay.map((leave) => {
                    const periodStr = leave.startDate === leave.endDate 
                      ? formatDateDMY(leave.startDate) 
                      : `${formatDateDMY(leave.startDate)} - ${formatDateDMY(leave.endDate)}`;

                    const displayType = leave.type === 'Cuti' ? 'Cuti Tahunan' : leave.type === 'Sakit' ? 'Cuti Sakit' : 'Izin';

                    return (
                      <tr key={leave.id} className="hover:bg-slate-50/50 transition-colors text-xs">
                        <td className="py-4 px-5 font-bold text-slate-800">
                          {displayType}
                          {isAdmin && (
                            <span className="block text-[9px] font-medium text-slate-400 font-sans mt-0.5">
                              Oleh: {leave.employeeName}
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-5 font-medium text-slate-600">
                          {periodStr}
                        </td>
                        <td className="py-4 px-5 text-slate-500 max-w-[150px] truncate" title={leave.reason}>
                          {leave.reason}
                        </td>
                        <td className="py-4 px-5">
                          <span className={`px-2.5 py-0.5 text-[9px] font-bold rounded-full border ${
                            leave.status === 'Pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                            leave.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                          }`}>
                            {leave.status === 'Pending' ? 'Pending' : leave.status === 'Approved' ? 'Approved' : 'Rejected'}
                          </span>
                        </td>
                        <td className="py-4 px-5">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setSelectedPrintLeave(leave)}
                              className="px-3 py-1.5 bg-[#0B1E43] hover:bg-[#07142E] text-white text-[10px] font-bold uppercase tracking-wider rounded-lg flex items-center gap-1 transition-all shadow-sm cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>PDF</span>
                            </button>

                            {isAdmin && leave.status === 'Pending' && (
                              <div className="flex gap-1.5 ml-1">
                                <button
                                  onClick={() => onApproveLeave(leave.id, true)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-bold uppercase rounded-md transition-all shadow-sm cursor-pointer"
                                >
                                  Setuju
                                </button>
                                <button
                                  onClick={() => onApproveLeave(leave.id, false)}
                                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[9px] font-bold uppercase rounded-md transition-all shadow-sm cursor-pointer"
                                >
                                  Tolak
                                </button>
                              </div>
                            )}

                            {isAdmin && leave.status === 'Rejected' && (
                              <span className="text-rose-500 text-[10px] font-semibold italic">Ditolak</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* High-Fidelity Printable Leave Document Overlay Modal */}
      {selectedPrintLeave && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#0B1E43] text-white flex justify-between items-center shrink-0 no-print">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-300" />
                <span className="font-bold text-sm tracking-tight">Dokumen Permohonan Cuti Resmi (Siap Cetak / PDF)</span>
              </div>
              <button
                onClick={() => setSelectedPrintLeave(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Container for Preview inside Modal */}
            <div className="flex-1 overflow-y-auto bg-slate-100 p-4 sm:p-6 flex justify-center items-start">
              {/* Document Printable View Container - Compact height to guarantee 1-page A4 print */}
              <div
                id="print-letter-target"
                className="w-full max-w-2xl bg-white p-6 sm:p-8 text-black font-serif text-sm leading-relaxed flex flex-col gap-5 shadow-sm rounded-lg"
              >
                {/* Letter Content Block */}
                <div>
                  {/* Top Right Date */}
                  <div className="text-right font-serif text-sm mb-5 text-slate-800">
                    Pekanbaru, {formatIndonesianDate(selectedPrintLeave.createdAt || selectedPrintLeave.startDate)}
                  </div>

                  {/* Hal & Address block */}
                  <div className="space-y-2.5 mb-5">
                    <div className="flex font-serif text-sm text-slate-800">
                      <span className="w-16">Hal</span>
                      <span className="font-normal">: Permohonan {selectedPrintLeave.type === 'Cuti' ? 'Cuti Tahunan' : selectedPrintLeave.type === 'Sakit' ? 'Cuti Sakit' : 'Izin'}</span>
                    </div>

                    <div className="pt-1 font-serif text-sm text-slate-800 space-y-0.5">
                      <p>Kepada</p>
                      <p className="font-normal">Yth. Kepala Subbagian Tata Usaha dan Rumah Tangga</p>
                      <p>di tempat</p>
                    </div>
                  </div>

                  {/* Body Greeting */}
                  <div className="space-y-2.5 mb-5">
                    <p className="font-serif text-sm text-slate-800">Dengan hormat,</p>
                    <p className="font-serif text-sm text-slate-800">Yang bertanda tangan di bawah ini:</p>
                    
                    {/* Employee Profile */}
                    <div className="pl-6 space-y-1 font-serif text-sm text-slate-800">
                      <div className="flex">
                        <span className="w-24">Nama</span>
                        <span>: {selectedPrintLeave.employeeName}</span>
                      </div>
                      <div className="flex">
                        <span className="w-24">Jabatan</span>
                        <span>: PPNPN (Pegawai Pemerintah Non Pegawai Negeri)</span>
                      </div>
                    </div>

                    {/* Request sentence */}
                    <p className="font-serif text-sm text-slate-800 leading-relaxed text-justify pt-1">
                      Bermaksud mengajukan permohonan {selectedPrintLeave.type === 'Cuti' ? 'cuti tahunan' : selectedPrintLeave.type === 'Sakit' ? 'cuti sakit' : 'izin'} selama {selectedPrintLeave.workDays || 1} ({terbilang(selectedPrintLeave.workDays || 1)}) hari kerja pada tanggal {formatDateDMY(selectedPrintLeave.startDate)} {selectedPrintLeave.startDate !== selectedPrintLeave.endDate ? `s/d ${formatDateDMY(selectedPrintLeave.endDate)}` : ''} untuk keperluan {selectedPrintLeave.reason}. Adapun alamat saya selama menjalani {selectedPrintLeave.type === 'Cuti' ? 'cuti tahunan' : selectedPrintLeave.type === 'Sakit' ? 'cuti sakit' : 'izin'} berlokasi di {selectedPrintLeave.address || '-'}.
                    </p>

                    <p className="font-serif text-sm text-slate-800 leading-relaxed">
                      Demikian surat permohonan ini saya ajukan. Atas perhatian dan perkenan Bapak, saya ucapkan terima kasih.
                    </p>
                  </div>
                </div>

                {/* Signatures Area */}
                <div className="pt-2 font-serif text-sm text-slate-800">
                  <div className="grid grid-cols-2 gap-8 text-center">
                    {/* Left: Approver */}
                    <div className="space-y-1">
                      <p>Menyetujui,</p>
                      <p className="text-sm text-slate-800 font-serif">Kasubbag Tata Usaha dan Rumah Tangga,</p>
                      <div className="h-16"></div>
                      <p className="text-slate-900 font-serif font-bold uppercase">{(selectedPrintLeave.approvedBy || 'AHMAD NAUVAL').toUpperCase()}</p>
                    </div>

                    {/* Right: Requester */}
                    <div className="space-y-1">
                      <p className="text-slate-800 font-serif">Pemohon,</p>
                      <p className="text-sm text-slate-500 font-serif invisible">Spacer</p>
                      <div className="h-16"></div>
                      <p className="text-slate-900 font-serif font-bold">{selectedPrintLeave.employeeName}</p>
                    </div>
                  </div>

                  {/* Centered Backup Officers */}
                  <div className="mt-6 text-center space-y-2">
                    <p className="text-sm text-slate-800 font-serif">Petugas Penanggung Jawab,</p>
                    
                    <div className="grid grid-cols-2 gap-6 max-w-md mx-auto pt-1">
                      {/* Backup 1 */}
                      <div className="space-y-1 font-serif">
                        <div className="h-16"></div>
                        <p className="text-slate-900 text-sm font-bold font-serif uppercase">{(selectedPrintLeave.backup1 || 'ROBBY ANDAYANI').toUpperCase()}</p>
                      </div>

                      {/* Backup 2 */}
                      <div className="space-y-1 font-serif">
                        <div className="h-16"></div>
                        <p className="text-slate-900 text-sm font-bold font-serif uppercase">{(selectedPrintLeave.backup2 || 'ADITYA PRATAMA').toUpperCase()}</p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Action Bar (Print & Close) */}
            <div className="px-6 py-4 bg-white border-t border-slate-200 flex flex-wrap justify-between items-center shrink-0 no-print">
              <span className="text-xs text-slate-500 font-medium">
                * Pilih printer atau opsi <b>Simpan sebagai PDF</b> di dialog cetak browser
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedPrintLeave(null)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Tutup
                </button>

                {/* Direct Print Button */}
                <button
                  onClick={() => triggerPrint('print-letter-target', `Surat_Permohonan_Cuti_${(selectedPrintLeave.employeeName || 'Pegawai').replace(/\s+/g, '_')}`)}
                  className="px-5 py-2 bg-[#0B1E43] hover:bg-[#07142E] text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-md cursor-pointer active:scale-95"
                >
                  <Printer className="w-4 h-4 text-amber-400" />
                  <span>PRATINJAU CETAK PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingLeave && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-lg w-full shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-[#0B1E43] px-6 py-4 text-white flex justify-between items-center">
              <span className="font-bold text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <span>Ubah Perbaikan Cuti ({editingLeave.id})</span>
              </span>
              <button 
                onClick={() => setEditingLeave(null)}
                className="text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              onEditLeave(editingLeave);
              setEditingLeave(null);
            }} className="p-6 space-y-4 overflow-y-auto max-h-[80vh]">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                    Tanggal Mulai
                  </label>
                  <input
                    type="date"
                    required
                    value={editingLeave.startDate}
                    onChange={(e) => {
                      const newStart = e.target.value;
                      const newEnd = editingLeave.endDate || newStart;
                      const targetPos = employees.find(emp => emp.id === editingLeave.employeeId)?.position || user.position;
                      const wDays = calculateWorkDays(newStart, newEnd, targetPos);
                      setEditingLeave({
                        ...editingLeave,
                        startDate: newStart,
                        workDays: wDays
                      });
                    }}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs transition-all font-medium text-slate-700 bg-slate-50 hover:bg-slate-50/50"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                    Tanggal Selesai
                  </label>
                  <input
                    type="date"
                    required
                    value={editingLeave.endDate}
                    onChange={(e) => {
                      const newEnd = e.target.value;
                      const newStart = editingLeave.startDate || newEnd;
                      const targetPos = employees.find(emp => emp.id === editingLeave.employeeId)?.position || user.position;
                      const wDays = calculateWorkDays(newStart, newEnd, targetPos);
                      setEditingLeave({
                        ...editingLeave,
                        endDate: newEnd,
                        workDays: wDays
                      });
                    }}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs transition-all font-medium text-slate-700 bg-slate-50 hover:bg-slate-50/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                  Jumlah Cuti
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={editingLeave.workDays || 1}
                  onChange={(e) => setEditingLeave({ ...editingLeave, workDays: parseInt(e.target.value) || 1 })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs transition-all font-medium text-slate-700 bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                  Keperluan / Alasan
                </label>
                <textarea
                  required
                  rows={2}
                  value={editingLeave.reason}
                  onChange={(e) => setEditingLeave({ ...editingLeave, reason: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs transition-all font-medium text-slate-700 bg-slate-50"
                  placeholder="Keterangan keperluan cuti..."
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                  Alamat Selama Cuti
                </label>
                <input
                  type="text"
                  required
                  value={editingLeave.address || ''}
                  onChange={(e) => setEditingLeave({ ...editingLeave, address: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs transition-all font-medium text-slate-700 bg-slate-50"
                  placeholder="Contoh: Jl. Sudirman No. 12 Pekanbaru"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                    Pegawai Pengganti 1
                  </label>
                  <input
                    type="text"
                    value={editingLeave.backup1 || ''}
                    onChange={(e) => setEditingLeave({ ...editingLeave, backup1: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs transition-all font-medium text-slate-700 bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                    Pegawai Pengganti 2
                  </label>
                  <input
                    type="text"
                    value={editingLeave.backup2 || ''}
                    onChange={(e) => setEditingLeave({ ...editingLeave, backup2: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs transition-all font-medium text-slate-700 bg-slate-50"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingLeave(null)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0B1E43] hover:bg-[#07142E] text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Simpan Perbaikan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
