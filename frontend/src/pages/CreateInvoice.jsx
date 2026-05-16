import React, { useState, useEffect, useMemo } from "react";
import { useBusiness } from "../context/BusinessContext";
import api from "../services/api";
import { 
  Plus, Trash, Save, ArrowLeft, ReceiptText, 
  Info, Globe, IndianRupee, Calculator 
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const CreateInvoice = () => {
  const { activeBusiness } = useBusiness();
  const navigate = useNavigate();
  
  // -- State Management --
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [status, setStatus] = useState("Pending");
  const [paymentMode, setPaymentMode] = useState("Bank Transfer");
  
  // Tax & Fees Logic
  const [taxRate, setTaxRate] = useState(5); // Total GST % (e.g., 5% = 2.5% CGST + 2.5% SGST)
  const [serviceCharge, setServiceCharge] = useState("");
  const [isInterState, setIsInterState] = useState(false);

  // Line Items
  const [items, setItems] = useState([]);
  const [currentItem, setCurrentItem] = useState({
    serviceType: "Flight",
    Cname: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
    pnr: "",
    fare: "",
    tax: "0", // Tax collected by airline/provider
  });

  useEffect(() => {
    if (activeBusiness) {
      api.get(`/customers?businessId=${activeBusiness._id}`)
         .then((res) => setCustomers(res.data))
         .catch(err => console.error("Error fetching customers", err));
    }
  }, [activeBusiness]);

  // -- Handlers --
  const addItem = () => {
    if (!currentItem.description || !currentItem.fare) {
      return alert("Service description and Fare are required.");
    }

    const fare = parseFloat(currentItem.fare) || 0;
    const itemTax = parseFloat(currentItem.tax) || 0;
    const total = fare + itemTax;

    setItems([...items, { ...currentItem, fare, tax: itemTax, total }]);

    setCurrentItem({
      serviceType: "Flight",
      Cname: "",
      date: new Date().toISOString().split("T")[0],
      description: "",
      pnr: "",
      fare: "",
      tax: "0",
    });
  };

  const removeItem = (index) => setItems(items.filter((_, i) => i !== index));

  // -- Financial Calculations (Mirroring your Image Logic) --
  
  // 1. Subtotal of all service items
  const subTotal = useMemo(() => items.reduce((acc, item) => acc + item.total, 0), [items]);
  
  // 2. GST calculated ONLY on the Service Charge (SC)
  const scAmount = parseFloat(serviceCharge) || 0;
  const taxes = useMemo(() => {
    const totalGstOnSc = (scAmount * (taxRate / 100));
    if (isInterState) {
        return { cgst: 0, sgst: 0, igst: totalGstOnSc };
    }
    return { cgst: totalGstOnSc / 2, sgst: totalGstOnSc / 2, igst: 0 };
  }, [scAmount, taxRate, isInterState]);

  // 3. Final Total
  const grandTotal = subTotal + scAmount + taxes.cgst + taxes.sgst + taxes.igst;

   const handleSave = async () => {
  if (!selectedCustomer) return alert("Please select a client");
  if (items.length === 0) return alert("Add at least one service item");

  setLoading(true);

  // Parse values correctly before sending to backend
  const payload = {
    businessId: activeBusiness._id,
    customerId: selectedCustomer,
    invoiceDate,
    items,
    subTotal: Number(subTotal),
    serviceCharge: Number(serviceCharge || 0), // <-- Ensure this is sent as a number
    taxRate: Number(taxRate),
    cgst: Number(taxes.cgst),
    sgst: Number(taxes.sgst),
    igst: Number(taxes.igst),
    grandTotal: Number(grandTotal), // This should be 27120.00
    status,
    paymentMode,
  };

  try {
    const res = await api.post("/invoices", payload);
    console.log("Saved Data:", res.data); // Verify this in your console!
    alert("Invoice Generated Successfully!");
    navigate("/invoices");
  } catch (error) {
    console.error(error);
    alert("Error generating invoice.");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="p-8 ml-64 bg-[#f8fafc] min-h-screen font-sans text-slate-900">
      
      {/* --- TOP STICKY BAR --- */}
      <div className="sticky top-0 z-20 flex justify-between items-center mb-8 bg-white/80 backdrop-blur-md p-5 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/invoices")} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft size={20} className="text-slate-500" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <ReceiptText className="text-blue-600" size={24} /> Generate Tax Invoice
            </h1>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Drafting for {activeBusiness?.name}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <select
            className={`rounded-lg px-4 py-2 text-xs font-bold uppercase border-none ring-1 ring-slate-200 shadow-sm outline-none cursor-pointer ${
              status === "Paid" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
            }`}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="Pending">Pending</option>
            <option value="Paid">Paid</option>
          </select>
          <button 
            onClick={handleSave} 
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:opacity-50"
          >
            <Save size={18} /> {loading ? "Saving..." : "Create Invoice"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* --- CUSTOMER INFO --- */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="flex items-center gap-2 text-slate-400 uppercase text-[10px] font-black mb-6 tracking-widest">
            <Info size={14} /> Client & Billing Details
          </h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-2 uppercase">Select Customer</label>
              <select
                className="w-full border-slate-200 p-3 rounded-xl bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all text-sm outline-none border"
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
              >
                <option value="">-- Choose Client --</option>
                {customers.map((c) => (<option key={c._id} value={c._id}>{c.name}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-2 uppercase">Invoice Date</label>
              <input
                type="date"
                className="w-full border-slate-200 p-3 rounded-xl bg-slate-50 text-sm outline-none border"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* --- TAX SETTINGS --- */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="flex items-center gap-2 text-slate-400 uppercase text-[10px] font-black mb-6 tracking-widest">
            <Globe size={14} /> Tax Config
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-2 uppercase">Payment Mode</label>
              <select className="w-full border-slate-200 p-3 rounded-xl bg-slate-50 text-sm outline-none border" value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
                <option>Bank Transfer</option><option>UPI / GPay</option><option>Cash</option>
              </select>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-dashed border-slate-300">
              <input 
                  type="checkbox" 
                  id="interstate" 
                  checked={isInterState} 
                  onChange={(e) => setIsInterState(e.target.checked)} 
                  className="w-4 h-4 accent-blue-600"
              />
              <label htmlFor="interstate" className="text-[11px] font-bold text-slate-600 cursor-pointer uppercase">Inter-state (IGST)</label>
            </div>
          </div>
        </div>
      </div>

      {/* --- LINE ITEM INPUT --- */}
      <div className="bg-white p-8 rounded-3xl shadow-sm mb-8 border border-slate-200">
        <h3 className="text-slate-400 uppercase text-[10px] font-black mb-6 tracking-widest">Add Service Particulars</h3>
        <div className="grid grid-cols-12 gap-4 items-end">
          <div className="col-span-2">
            <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Type</label>
            <select className="w-full border p-2.5 rounded-lg text-xs bg-slate-50 outline-none" value={currentItem.serviceType} onChange={(e) => setCurrentItem({ ...currentItem, serviceType: e.target.value })}>
              <option>Flight</option><option>Package</option><option>Train</option><option>Reissue</option><option>Other</option> <option>Hotel</option><option>Hotel Expense</option> <option>Visa</option><option>Insurance</option><option>Cancellation</option><option>Seat Allocation</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Pax Name</label>
            <input type="text" className="w-full border p-2.5 rounded-lg text-xs outline-none" placeholder="Name" value={currentItem.Cname} onChange={(e) => setCurrentItem({ ...currentItem, Cname: e.target.value })}/>
          </div>
          <div className="col-span-2">
            <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Date</label>
            <input type="date" className="w-full border p-2.5 rounded-lg text-xs outline-none" value={currentItem.date} onChange={(e) => setCurrentItem({ ...currentItem, date: e.target.value })}/>
          </div>
          <div className="col-span-2">
            <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Route / Desc</label>
            <input className="w-full border p-2.5 rounded-lg text-xs outline-none" placeholder="e.g. BOM to DEL" value={currentItem.description} onChange={(e) => setCurrentItem({ ...currentItem, description: e.target.value })}/>
          </div>
          <div className="col-span-1">
            <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">PNR</label>
            <input className="w-full border p-2.5 rounded-lg text-xs outline-none" placeholder="PNR" value={currentItem.pnr} onChange={(e) => setCurrentItem({ ...currentItem, pnr: e.target.value })}/>
          </div>
          <div className="col-span-1">
            <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Fare</label>
            <input type="number" className="w-full border p-2.5 rounded-lg text-xs text-right outline-none" value={currentItem.fare} onChange={(e) => setCurrentItem({ ...currentItem, fare: e.target.value })}/>
          </div>
          <div className="col-span-1">
            <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Item Tax</label>
            <input type="number" className="w-full border p-2.5 rounded-lg text-xs text-right outline-none text-slate-400" value={currentItem.tax} onChange={(e) => setCurrentItem({ ...currentItem, tax: e.target.value })}/>
          </div>
          <div className="col-span-1">
            <button onClick={addItem} className="bg-slate-900 text-white p-2.5 rounded-xl w-full h-[38px] flex justify-center items-center hover:bg-black transition-all">
              <Plus size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* --- ITEMS TABLE --- */}
      <div className="bg-white shadow-sm rounded-3xl border border-slate-100 overflow-hidden mb-12">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <th className="p-5">Service</th>
              <th className="p-5">Name</th>
              <th className="p-5">Description</th>
              <th className="p-5 text-right">PNR</th>
              <th className="p-5 text-right">Fare</th>
              <th className="p-5 text-right">Tax</th>
              <th className="p-5 text-right bg-blue-50 text-blue-600">Total</th>
              <th className="p-5 text-center"></th>
            </tr>
          </thead>
          <tbody className="text-xs">
            {items.map((item, idx) => (
              <tr key={idx} className="border-b last:border-0 hover:bg-slate-50 transition-colors">
                <td className="p-5 font-bold text-slate-700">{item.serviceType}</td>
                <td className="p-5 text-slate-800">{item.Cname || '-'}</td>
                <td className="p-5 text-slate-500 italic">{item.description}</td>
                <td className="p-5 text-right font-mono">{item.pnr || '-'}</td>
                <td className="p-5 text-right">{item.fare.toFixed(2)}</td>
                <td className="p-5 text-right text-slate-400">{item.tax.toFixed(2)}</td>
                <td className="p-5 text-right font-black bg-blue-50/20 text-slate-900">{item.total.toFixed(2)}</td>
                <td className="p-5 text-center">
                  <button onClick={() => removeItem(idx)} className="text-slate-300 hover:text-red-500"><Trash size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- CALCULATION SUMMARY (IMAGE REPLICA) --- */}
      <div className="flex justify-end pb-24">
        <div className="bg-[#1e293b] p-8 rounded-[32px] shadow-2xl w-full max-w-md text-white border border-slate-700">
          <div className="flex justify-between items-center mb-8 border-b border-slate-700 pb-4">
            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Invoice Summary</h4>
            <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
                <span className="text-[9px] font-black text-slate-500 uppercase">GST Rate:</span>
                <input 
                    type="number" 
                    className="w-8 bg-transparent text-[11px] font-black text-blue-400 outline-none text-center" 
                    value={taxRate} 
                    onChange={e => setTaxRate(parseFloat(e.target.value) || 0)} 
                />
                <span className="text-[9px] font-black text-slate-500">%</span>
            </div>
          </div>
          
          <div className="space-y-5">
            {/* 1. Subtotal */}
            <div className="flex justify-between text-sm">
              <span className="text-slate-400 font-medium">Subtotal (Items)</span>
              <span className="font-bold text-slate-200">INR {subTotal.toFixed(2)}</span>
            </div>

            {/* 2. Service Charge Input (Highlighted) */}
            <div className="flex justify-between items-center py-3 px-4 bg-slate-800/50 rounded-2xl border border-slate-700">
              <div className="flex flex-col">
                <span className="text-blue-400 font-bold text-xs">Service Charge</span>
                <span className="text-[9px] text-slate-500 uppercase font-black">Commission Fee</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-xs font-bold font-mono">INR</span>
                <input 
                  type="number"
                  className="w-24 bg-transparent text-lg font-black text-white text-right outline-none focus:ring-1 focus:ring-blue-500 rounded"
                  value={serviceCharge}
                  onChange={(e) => setServiceCharge(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* 3. GST Calculations based on SC */}
            <div className="pt-2 space-y-3">
              {isInterState ? (
                 <div className="flex justify-between text-xs font-medium">
                   <span className="text-slate-400">IGST ({taxRate}%) on SC</span>
                   <span className="text-slate-300">INR {taxes.igst.toFixed(2)}</span>
                 </div>
              ) : (
                  <>
                      <div className="flex justify-between text-xs font-medium">
                          <span className="text-slate-400">CGST ({taxRate/2}%) on SC</span>
                          <span className="text-slate-300">INR {taxes.cgst.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs font-medium">
                          <span className="text-slate-400">SGST ({taxRate/2}%) on SC</span>
                          <span className="text-slate-300">INR {taxes.sgst.toFixed(2)}</span>
                      </div>
                  </>
              )}
            </div>

            {/* 4. Grand Total */}
            <div className="pt-6 border-t border-slate-700">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-tighter mb-1">Total Payable</p>
                  <span className="text-xs text-slate-500 uppercase font-bold tracking-widest">Net Amount</span>
                </div>
                <span className="text-4xl font-black text-white tracking-tighter">
                  <span className="text-sm font-bold text-slate-500 mr-2">INR</span>
                  {grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateInvoice;