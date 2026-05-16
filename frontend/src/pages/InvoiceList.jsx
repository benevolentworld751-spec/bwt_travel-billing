import { useEffect, useState, useCallback } from 'react';
import { useBusiness } from '../context/BusinessContext';
import api from '../services/api';
import {
  Download, FileSpreadsheet, RefreshCw, Plus, Search,
  IndianRupee, Layers, CheckSquare, Square, Edit3,
  PackageCheck, X, ChevronDown
} from 'lucide-react';
import { Link } from 'react-router-dom';

const InvoiceList = () => {
  const { activeBusiness } = useBusiness();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // --- NEW STATE ---
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  const fetchInvoices = useCallback(async () => {
    if (!activeBusiness?._id) return;
    setLoading(true);
    try {
      const res = await api.get(`/invoices?businessId=${activeBusiness._id}&t=${Date.now()}`);
      setInvoices(res.data);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [activeBusiness]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const filteredInvoices = invoices.filter(inv =>
    inv.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.customerId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.items?.[0]?.Cname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.items?.[0]?.pnr?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ─── Selection Handlers ───────────────────────────────────────────────────
  const isAllSelected =
    filteredInvoices.length > 0 &&
    filteredInvoices.every(inv => selectedIds.has(inv._id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredInvoices.map(inv => inv._id)));
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  // ─── Update Status (Bulk) ─────────────────────────────────────────────────
  const handleBulkStatusUpdate = async (newStatus) => {
    if (selectedIds.size === 0) return;
    setBulkActionLoading(true);
    setStatusDropdownOpen(false);
    try {
      await Promise.all(
        [...selectedIds].map(id =>
          api.patch(`/invoices/${id}/status`, { status: newStatus })
        )
      );
      // Optimistically update local state
      setInvoices(prev =>
        prev.map(inv =>
          selectedIds.has(inv._id) ? { ...inv, status: newStatus } : inv
        )
      );
      clearSelection();
    } catch (err) {
      console.error("Status update error:", err);
      alert("Failed to update status for some invoices.");
    } finally {
      setBulkActionLoading(false);
    }
  };

  // ─── Export Selected (Bulk Excel) ─────────────────────────────────────────
  const handleExportSelected = async () => {
    if (selectedIds.size === 0) return;
    setBulkActionLoading(true);
    try {
      const response = await api.post(
        `/invoices/export-bulk`,
        { ids: [...selectedIds] },
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoices-Export-${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      clearSelection();
    } catch (err) {
      alert("Bulk export failed.");
    } finally {
      setBulkActionLoading(false);
    }
  };

  // ─── Single Invoice Download ───────────────────────────────────────────────
  const handleDownload = async (id, invNum) => {
    try {
      const response = await api.get(`/invoices/${id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice-${invNum}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) { alert("PDF Download failed."); }
  };

  const handleExcelDownload = async (id, invNum) => {
    try {
      const response = await api.get(`/invoices/${id}/excel`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice-${invNum}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) { alert("Excel Download failed."); }
  };

  return (
    <div className="p-8 ml-64 bg-slate-50 min-h-screen font-sans">

      {/* Header Section */}
      <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-3xl shadow-sm border border-slate-200/60">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Layers className="text-blue-600" size={24} /> Tax Invoice Ledger
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1 ml-1">
            Company: {activeBusiness?.name}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-300" size={16} />
            <input
              type="text"
              placeholder="Search PNR, Client or Invoice..."
              className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:ring-4 focus:ring-blue-50 outline-none w-72 transition-all font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button
            onClick={fetchInvoices}
            className={`p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm ${loading ? 'animate-spin' : ''}`}
          >
            <RefreshCw size={18} />
          </button>

          <Link
            to="/invoices/create"
            className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 flex items-center gap-2 transition-all active:scale-95"
          >
            <Plus size={16} /> New Invoice
          </Link>
        </div>
      </div>

      {/* ── Bulk Action Toolbar (visible when items are selected) ── */}
      {selectedIds.size > 0 && (
        <div className="mb-4 flex items-center gap-3 bg-blue-600 text-white px-6 py-3.5 rounded-2xl shadow-lg shadow-blue-200 animate-in fade-in slide-in-from-top-2">
          <span className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
            <CheckSquare size={16} />
            {selectedIds.size} Invoice{selectedIds.size > 1 ? 's' : ''} Selected
          </span>

          <div className="w-px h-5 bg-blue-400 mx-1" />

          {/* Update Status Dropdown */}
          <div className="relative">
            <button
              onClick={() => setStatusDropdownOpen(o => !o)}
              disabled={bulkActionLoading}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all border border-white/20"
            >
              <Edit3 size={13} />
              Update Status
              <ChevronDown size={13} className={`transition-transform ${statusDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {statusDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 min-w-[160px]">
                <button
                  onClick={() => handleBulkStatusUpdate('Paid')}
                  className="w-full flex items-center gap-2 px-4 py-3 text-[11px] font-black uppercase tracking-wider text-emerald-600 hover:bg-emerald-50 transition-colors"
                >
                  <PackageCheck size={14} /> Mark as Paid
                </button>
                <button
                  onClick={() => handleBulkStatusUpdate('Unpaid')}
                  className="w-full flex items-center gap-2 px-4 py-3 text-[11px] font-black uppercase tracking-wider text-amber-600 hover:bg-amber-50 transition-colors border-t border-slate-100"
                >
                  <IndianRupee size={14} /> Mark as Unpaid
                </button>
              </div>
            )}
          </div>

          {/* Export Selected */}
          <button
            onClick={handleExportSelected}
            disabled={bulkActionLoading}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all border border-white/20 disabled:opacity-50"
          >
            <FileSpreadsheet size={13} />
            {bulkActionLoading ? 'Exporting…' : 'Export Selected'}
          </button>

          <div className="ml-auto">
            <button
              onClick={clearSelection}
              className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
              title="Clear selection"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Main Table Content */}
      <div className="bg-white shadow-2xl shadow-slate-200/40 rounded-[32px] overflow-hidden border border-slate-200/50">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50/80 border-b border-slate-100">
            <tr className="text-[10px] uppercase font-black text-slate-400 tracking-widest">
              {/* ── Select All Checkbox ── */}
              <th className="p-6 w-12">
                <button onClick={toggleSelectAll} className="text-slate-300 hover:text-blue-500 transition-colors">
                  {isAllSelected
                    ? <CheckSquare size={18} className="text-blue-500" />
                    : <Square size={18} />
                  }
                </button>
              </th>
              <th className="p-6">Invoice & Client</th>
              <th className="p-6">Travel Particulars</th>
              <th className="p-6 text-right">Base / SC Breakdown</th>
              <th className="p-6 text-right">Net Payable</th>
              <th className="p-6 text-center">Status</th>
              <th className="p-6 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredInvoices.length > 0 ? filteredInvoices.map(inv => {
              const isSelected = selectedIds.has(inv._id);
              const cgst = Number(inv.cgst || 0);
              const sgst = Number(inv.sgst || 0);
              const igst = Number(inv.igst || 0);
              const totalGst = cgst + sgst + igst;
              const sc = Number(inv.serviceCharge || 0);
              const sub = Number(inv.subTotal || 0);
              const grand = Number(inv.grandTotal || 0);

              return (
                <tr
                  key={inv._id}
                  className={`hover:bg-blue-50/30 transition-all group ${isSelected ? 'bg-blue-50/60' : ''}`}
                >
                  {/* ── Row Checkbox ── */}
                  <td className="p-6 w-12">
                    <button
                      onClick={() => toggleSelectOne(inv._id)}
                      className="text-slate-300 hover:text-blue-500 transition-colors"
                    >
                      {isSelected
                        ? <CheckSquare size={18} className="text-blue-500" />
                        : <Square size={18} />
                      }
                    </button>
                  </td>

                  <td className="p-6">
                    <div className="font-mono font-black text-blue-600 text-sm tracking-tighter">{inv.invoiceNumber}</div>
                    <div className="text-[11px] font-bold text-slate-800 uppercase mt-1">{inv.customerId?.name}</div>
                    <div className="text-[9px] font-bold text-slate-400 mt-0.5">{new Date(inv.invoiceDate).toLocaleDateString('en-GB')}</div>
                  </td>

                  <td className="p-6">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">
                        {inv.items?.[0]?.serviceType || 'Service'}
                      </span>
                      <span className="text-xs font-bold text-slate-700 uppercase">
                        {inv.items?.[0]?.Cname || 'Group/Self'}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium italic mt-1.5 flex items-center gap-1">
                      <span className="text-slate-300 font-bold font-mono text-[9px]">{inv.items?.[0]?.pnr || '---'}</span>
                      • {inv.items?.[0]?.description}
                    </div>
                  </td>

                  <td className="p-6 text-right">
                    <div className="text-[10px] text-slate-400 font-bold mb-1">
                      TKT FARE: ₹{sub.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[11px] font-black text-emerald-600 flex items-center justify-end gap-1">
                      SC: ₹{sc.toLocaleString('en-IN')}
                      <span className="text-[9px] text-slate-400 font-normal bg-slate-100 px-1 rounded">
                        + GST: ₹{totalGst.toFixed(2)}
                      </span>
                    </div>
                  </td>

                  <td className="p-6 text-right">
                    <div className="flex flex-col items-end">
                      <span className="text-lg font-black text-slate-900 tracking-tighter">
                        ₹{grand.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                      <div className="flex items-center gap-1 text-[9px] text-slate-400 font-bold uppercase">
                        <IndianRupee size={10} /> Total Including Taxes
                      </div>
                    </div>
                  </td>

                  <td className="p-6 text-center">
                    <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm border ${inv.status === 'Paid'
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                      : 'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                      {inv.status}
                    </span>
                  </td>

                  <td className="p-6">
                    <div className="flex justify-center gap-2">
                      {/* Edit / Update Invoice */}
                      <Link
                        to={`/invoices/${inv._id}/edit`}
                        className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all rounded-2xl border border-slate-100 hover:border-blue-200"
                        title="Edit Invoice"
                      >
                        <Edit3 size={18} />
                      </Link>

                      <button
                        onClick={() => handleDownload(inv._id, inv.invoiceNumber)}
                        className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all rounded-2xl border border-slate-100 hover:border-red-200"
                        title="Download Tax Invoice (PDF)"
                      >
                        <Download size={18} />
                      </button>

                      <button
                        onClick={() => handleExcelDownload(inv._id, inv.invoiceNumber)}
                        className="p-3 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all rounded-2xl border border-slate-100 hover:border-emerald-200"
                        title="Export to Excel"
                      >
                        <FileSpreadsheet size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan="7" className="p-32 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-6 bg-slate-50 rounded-full text-slate-200">
                      <Search size={48} />
                    </div>
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-300">No records found matching criteria</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Click-outside handler for status dropdown */}
      {statusDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setStatusDropdownOpen(false)}
        />
      )}
    </div>
  );
};

export default InvoiceList;