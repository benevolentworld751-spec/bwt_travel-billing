import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft, Download, FileSpreadsheet, FileText,
  Trash2, RefreshCw, CheckSquare, Square, X, Search
} from 'lucide-react';
import { customerService } from '../../services/customerService';
import api from '../../services/api';
import { useBusiness } from '../../context/BusinessContext';

const CustomerHistoryView = ({ customer, onBack }) => {
  const { activeBusiness } = useBusiness();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(""); // Search State
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, [customer._id]);

  const fetchHistory = async () => {
    setLoading(true);
    setSelectedIds(new Set());
    try {
      const { data } = await api.get(
        `/invoices?businessId=${activeBusiness._id}&customerId=${customer._id}`
      );
      setInvoices(data);
    } catch (err) {
      console.error("Fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── SEARCH LOGIC ───────────────────────────────────────────────────────────
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => 
      inv.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.items?.[0]?.Cname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.items?.[0]?.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.items?.[0]?.pnr?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, invoices]);

  // ── DELETE LOGIC ───────────────────────────────────────────────────────────
  const handleDelete = async (id, invNum) => {
    if (!window.confirm(`Are you sure you want to delete Invoice ${invNum}? This action cannot be undone.`)) return;
    
    try {
      await api.delete(`/invoices/${id}`);
      // Update local state immediately
      setInvoices(prev => prev.filter(inv => inv._id !== id));
      // Remove from selection if it was selected
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (err) {
      alert("Failed to delete invoice. Please try again.");
    }
  };

  const handleBulkDelete = async () => {
    const count = selectedIds.size;
    if (!window.confirm(`Are you sure you want to delete ${count} selected invoices?`)) return;

    try {
      // Assuming your backend supports bulk delete via POST or DELETE with body
      await api.post('/invoices/bulk-delete', { ids: [...selectedIds] });
      setInvoices(prev => prev.filter(inv => !selectedIds.has(inv._id)));
      clearSelection();
    } catch (err) {
      alert("Bulk delete failed.");
    }
  };

  // ── Selection ──────────────────────────────────────────────────────────────
  const isAllSelected =
    filteredInvoices.length > 0 && filteredInvoices.every(inv => selectedIds.has(inv._id));

  const toggleSelectAll = () =>
    setSelectedIds(isAllSelected ? new Set() : new Set(filteredInvoices.map(inv => inv._id)));

  const toggleSelectOne = (id) =>
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const clearSelection = () => setSelectedIds(new Set());

  // ── Export ─────────────────────────────────────────────────────────────────
  const handleExportSelected = async (ids) => {
    const exportIds = ids ?? [...selectedIds];
    if (exportIds.length === 0) return;
    setExportLoading(true);
    try {
      const response = await api.post(
        '/invoices/export-bulk',
        { ids: exportIds },
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${customer.name.replace(/\s+/g, '_')}-History-${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      clearSelection();
    } catch {
      alert("Export failed.");
    } finally {
      setExportLoading(false);
    }
  };

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
    } catch { alert("Download failed."); }
  };

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalBilled = invoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
  const outstanding = invoices
    .filter(inv => inv.status !== 'Paid')
    .reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
  const unpaidCount = invoices.filter(i => i.status !== 'Paid').length;

  return (
    <div className="animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold text-sm transition-colors">
          <ArrowLeft size={20} /> BACK TO CUSTOMERS
        </button>
        <div className="flex gap-4 items-center">
          {/* Search Input */}
          <div className="relative group">
            <Search className="absolute left-3 top-2.5 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Search history..."
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-4 focus:ring-blue-50 transition-all w-48 md:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => handleExportSelected(invoices.map(i => i._id))}
            disabled={exportLoading || invoices.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-500 hover:text-emerald-600 hover:border-emerald-200 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all disabled:opacity-40 shadow-sm"
          >
            <FileSpreadsheet size={15} /> Export All
          </button>
          <button onClick={fetchHistory} className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">{customer.name}</h2>
          <p className="text-slate-400 font-bold text-xs mt-1">{customer.phone}</p>
          <div className="mt-4 pt-4 border-t border-slate-50">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Billing Info</p>
            <p className="text-xs text-slate-500 leading-relaxed truncate">{customer.email || 'No email'}</p>
            <p className="text-xs text-slate-400 truncate">{customer.address || "No address"}</p>
          </div>
        </div>

        <div className="bg-[#1e293b] p-6 rounded-3xl shadow-xl shadow-slate-200 text-white flex flex-col justify-center relative overflow-hidden">
          <div className="absolute right-[-10%] top-[-10%] opacity-5 text-white"><FileText size={120} /></div>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Net Business Value</p>
          <p className="text-3xl font-black mt-1">₹{totalBilled.toLocaleString('en-IN')}</p>
          <p className="text-slate-500 text-[10px] mt-2 font-bold tracking-widest uppercase">
            {invoices.length} Total Records
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center border-l-4 border-l-red-500">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Outstanding</p>
          <p className="text-3xl font-black text-red-600 mt-1">₹{outstanding.toLocaleString('en-IN')}</p>
          <p className="text-red-400 text-[10px] mt-2 font-bold uppercase tracking-widest">
            {unpaidCount} Pending Collection
          </p>
        </div>
      </div>

      {/* Bulk Toolbar */}
      {selectedIds.size > 0 && (
        <div className="mb-4 flex items-center gap-3 bg-blue-600 text-white px-6 py-3.5 rounded-2xl shadow-lg shadow-blue-200 animate-in slide-in-from-top-4 duration-300">
          <CheckSquare size={16} />
          <span className="text-xs font-black uppercase tracking-widest">
            {selectedIds.size} Selected
          </span>
          <div className="w-px h-5 bg-blue-400 mx-1" />
          <button
            onClick={() => handleExportSelected()}
            disabled={exportLoading}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all border border-white/20"
          >
            <FileSpreadsheet size={13} /> Export Excel
          </button>
          <button
            onClick={handleBulkDelete}
            className="flex items-center gap-2 bg-red-500/80 hover:bg-red-500 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all border border-red-400/20"
          >
            <Trash2 size={13} /> Delete
          </button>
          <div className="ml-auto">
            <button onClick={clearSelection} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Main History Table */}
      <div className="bg-white shadow-2xl shadow-slate-200/50 rounded-3xl overflow-hidden border border-slate-100">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 border-b border-slate-100">
            <tr className="text-[10px] uppercase font-black text-slate-400 tracking-widest">
              <th className="p-5 w-12 text-center">
                <button onClick={toggleSelectAll} className="text-slate-300 hover:text-blue-500 transition-colors">
                  {isAllSelected ? <CheckSquare size={17} className="text-blue-500" /> : <Square size={17} />}
                </button>
              </th>
              <th className="p-5">Invoice #</th>
              <th className="p-5">Passenger Detail</th>
              <th className="p-5 text-right">Amount</th>
              <th className="p-5 text-center">Collection</th>
              <th className="p-5 text-center">Manage</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan="6" className="p-20 text-center text-slate-300 font-black uppercase text-xs">Processing...</td></tr>
            ) : filteredInvoices.length > 0 ? filteredInvoices.map(inv => {
              const isSelected = selectedIds.has(inv._id);
              return (
                <tr key={inv._id} className={`hover:bg-blue-50/10 transition-colors group ${isSelected ? 'bg-blue-50/40' : ''}`}>
                  <td className="p-5 text-center">
                    <button onClick={() => toggleSelectOne(inv._id)} className="text-slate-300 hover:text-blue-500 transition-colors">
                      {isSelected ? <CheckSquare size={17} className="text-blue-500" /> : <Square size={17} />}
                    </button>
                  </td>
                  <td className="p-5">
                    <div className="font-mono font-black text-blue-600 text-sm tracking-tighter">{inv.invoiceNumber}</div>
                    <div className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase">
                      {new Date(inv.invoiceDate).toLocaleDateString('en-GB')}
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="font-black text-slate-700 uppercase text-xs truncate max-w-[150px]">
                      {inv.items?.[0]?.Cname || 'Group Booking'}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[8px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-black uppercase">{inv.items?.[0]?.serviceType}</span>
                      <span className="text-[10px] text-slate-400 italic truncate max-w-[120px]">{inv.items?.[0]?.description}</span>
                    </div>
                  </td>
                  <td className="p-5 text-right">
                    <div className="font-black text-slate-900 text-sm">₹{inv.grandTotal?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                    <div className="text-[9px] text-slate-300 font-bold uppercase">Incl. Taxes</div>
                  </td>
                  <td className="p-5 text-center">
                    <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-tighter border ${
                      inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="p-5">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => handleDownload(inv._id, inv.invoiceNumber)}
                        className="p-2 text-slate-300 hover:text-blue-600 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-slate-100" title="PDF">
                        <Download size={16} />
                      </button>
                      <button onClick={() => handleDelete(inv._id, inv.invoiceNumber)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-red-100" title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan="6" className="p-20 text-center">
                  <div className="opacity-20 flex flex-col items-center">
                    <Search size={40} className="mb-2" />
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">No matching history</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CustomerHistoryView;