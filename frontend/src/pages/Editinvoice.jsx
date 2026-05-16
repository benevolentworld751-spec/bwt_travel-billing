import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBusiness } from '../context/BusinessContext';
import api from '../services/api';
import {
  ArrowLeft, Save, RefreshCw, Layers,
  Plus, Trash2, IndianRupee
} from 'lucide-react';

const EditInvoice = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { activeBusiness } = useBusiness();

  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [customers, setCustomers] = useState([]);

  const [form, setForm] = useState({
    customerId:    '',
    invoiceDate:   '',
    paymentMode:   'Cash',
    status:        'Pending',
    items:         [],
    subTotal:      0,
    serviceCharge: 0,
    taxRate:       5,
    cgst:          0,
    sgst:          0,
    igst:          0,
    grandTotal:    0,
    tcs:           0,
    tds:           0,
  });

  // ── Fetch invoice + customers on mount ──────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [invRes, custRes] = await Promise.all([
          api.get(`/invoices/${id}`),
          api.get(`/customers?businessId=${activeBusiness._id}`),
        ]);

        const inv = invRes.data;
        setCustomers(custRes.data || []);

        setForm({
          customerId:    inv.customerId?._id || inv.customerId || '',
          invoiceDate:   inv.invoiceDate
            ? new Date(inv.invoiceDate).toISOString().split('T')[0]
            : '',
          paymentMode:   inv.paymentMode   || 'Cash',
          status:        inv.status        || 'Pending',
          items:         inv.items         || [],
          subTotal:      inv.subTotal      || 0,
          serviceCharge: inv.serviceCharge || 0,
          taxRate:       inv.taxRate       || 5,
          cgst:          inv.cgst          || 0,
          sgst:          inv.sgst          || 0,
          igst:          inv.igst          || 0,
          grandTotal:    inv.grandTotal    || 0,
          tcs:           inv.tcs           || 0,
          tds:           inv.tds           || 0,
        });
      } catch (err) {
        console.error("Failed to load invoice:", err);
        alert("Could not load invoice. Returning to list.");
        navigate('/invoices');
      } finally {
        setLoading(false);
      }
    };
    if (activeBusiness?._id) load();
  }, [id, activeBusiness]);

  // ── Item helpers ──────────────────────────────────────────────────────────
  const updateItem = (index, field, value) => {
    setForm(prev => {
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, items };
    });
  };

  const addItem = () => {
    setForm(prev => ({
      ...prev,
      items: [...prev.items, {
        serviceType: 'Flight', Cname: '', pnr: '',
        description: '', fare: 0, tax: 0, total: 0,
      }],
    }));
  };

  const removeItem = (index) => {
    setForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  // ── Recalculate totals whenever items / serviceCharge / taxRate change ──
  const recalculate = () => {
    const subTotal      = form.items.reduce((s, item) => s + Number(item.fare || 0), 0);
    const sc            = Number(form.serviceCharge || 0);
    const taxable       = sc;                          // GST applies on service charge
    const totalTax      = (taxable * Number(form.taxRate)) / 100;
    const half          = totalTax / 2;

    // Use IGST when customer is from another state (keep existing logic)
    const useIgst       = Number(form.igst) > 0;
    const cgst          = useIgst ? 0 : half;
    const sgst          = useIgst ? 0 : half;
    const igst          = useIgst ? totalTax : 0;
    const grandTotal    = subTotal + sc + totalTax;

    setForm(prev => ({ ...prev, subTotal, cgst, sgst, igst, grandTotal }));
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.customerId) return alert("Please select a customer.");
    if (form.items.length === 0) return alert("Please add at least one item.");

    setSaving(true);
    try {
      await api.put(`/invoices/${id}`, form);
      alert("Invoice updated successfully!");
      navigate('/invoices');
    } catch (err) {
      console.error("Save error:", err);
      alert("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-8 ml-64 bg-slate-50 min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw size={32} className="animate-spin text-blue-400" />
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading Invoice...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 ml-64 bg-slate-50 min-h-screen font-sans">

      {/* ── Header ── */}
      <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-3xl shadow-sm border border-slate-200/60">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Layers className="text-blue-600" size={24} /> Edit Invoice
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1 ml-1">
            Company: {activeBusiness?.name}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/invoices')}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:text-slate-700 font-black text-[11px] uppercase tracking-wider transition-all shadow-sm"
          >
            <ArrowLeft size={15} /> Back
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-95 disabled:opacity-60"
          >
            {saving ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />}
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── LEFT: Main Form ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Basic Info */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 p-6">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-5">Invoice Details</h3>
            <div className="grid grid-cols-2 gap-4">

              <div className="col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Customer</label>
                <select
                  value={form.customerId}
                  onChange={e => setForm(p => ({ ...p, customerId: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-blue-50 outline-none"
                >
                  <option value="">— Select Customer —</option>
                  {customers.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Invoice Date</label>
                <input
                  type="date"
                  value={form.invoiceDate}
                  onChange={e => setForm(p => ({ ...p, invoiceDate: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-blue-50 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Payment Mode</label>
                <select
                  value={form.paymentMode}
                  onChange={e => setForm(p => ({ ...p, paymentMode: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-blue-50 outline-none"
                >
                  {['Cash', 'Bank Transfer', 'Cheque', 'UPI', 'Card', 'Online'].map(m => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Status</label>
                <select
                  value={form.status}
                  onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-blue-50 outline-none"
                >
                  {['Pending', 'Paid', 'Unpaid', 'Cancelled'].map(s => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">GST Rate (%)</label>
                <input
                  type="number"
                  value={form.taxRate}
                  onChange={e => setForm(p => ({ ...p, taxRate: Number(e.target.value) }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-blue-50 outline-none"
                />
              </div>

            </div>
          </div>

          {/* Items */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Travel Items</h3>
              <button
                onClick={addItem}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-[11px] font-black uppercase tracking-wider hover:bg-blue-100 transition-colors"
              >
                <Plus size={13} /> Add Item
              </button>
            </div>

            <div className="space-y-4">
              {form.items.map((item, i) => (
                <div key={i} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Item {i + 1}</span>
                    <button
                      onClick={() => removeItem(i)}
                      className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Service Type</label>
                      <select
                        value={item.serviceType}
                        onChange={e => updateItem(i, 'serviceType', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
                      >
                        {['Flight', 'Hotel', 'Train', 'Bus', 'Cab', 'Tour', 'Visa', 'Other'].map(t => (
                          <option key={t}>{t}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Pax Name</label>
                      <input
                        type="text"
                        value={item.Cname || ''}
                        onChange={e => updateItem(i, 'Cname', e.target.value)}
                        placeholder="Passenger name"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">PNR / Ref</label>
                      <input
                        type="text"
                        value={item.pnr || ''}
                        onChange={e => updateItem(i, 'pnr', e.target.value)}
                        placeholder="PNR number"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Description</label>
                      <input
                        type="text"
                        value={item.description || ''}
                        onChange={e => updateItem(i, 'description', e.target.value)}
                        placeholder="Route / details"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Base Fare (₹)</label>
                      <input
                        type="number"
                        value={item.fare || ''}
                        onChange={e => updateItem(i, 'fare', Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Item Tax (₹)</label>
                      <input
                        type="number"
                        value={item.tax || ''}
                        onChange={e => updateItem(i, 'tax', Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {form.items.length === 0 && (
                <div className="text-center py-10 text-slate-300">
                  <p className="text-xs font-black uppercase tracking-widest">No items yet — click Add Item</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Summary ── */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 p-6 sticky top-8">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-5">Financial Summary</h3>

            <div className="space-y-3">
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Service Charge (₹)</label>
                <input
                  type="number"
                  value={form.serviceCharge}
                  onChange={e => setForm(p => ({ ...p, serviceCharge: Number(e.target.value) }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-blue-50 outline-none"
                />
              </div>

              <button
                onClick={recalculate}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-colors"
              >
                <RefreshCw size={13} /> Recalculate Totals
              </button>
            </div>

            {/* Summary Lines */}
            <div className="mt-6 space-y-2 border-t border-slate-100 pt-4">
              {[
                { label: 'Base Fare',      value: form.subTotal },
                { label: 'Service Charge', value: form.serviceCharge },
                { label: 'CGST',           value: form.cgst },
                { label: 'SGST',           value: form.sgst },
                { label: 'IGST',           value: form.igst },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">{label}</span>
                  <span className="font-bold text-slate-600">₹{Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              ))}
            </div>

            {/* Grand Total */}
            <div className="mt-4 bg-slate-900 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Net Payable</p>
                <p className="text-white font-black text-xl tracking-tighter mt-1 flex items-center gap-1">
                  <IndianRupee size={16} />
                  {Number(form.grandTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                form.status === 'Paid'
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
              }`}>
                {form.status}
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full mt-4 flex items-center justify-center gap-2 py-3.5 bg-blue-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-95 disabled:opacity-60"
            >
              {saving ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />}
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditInvoice;