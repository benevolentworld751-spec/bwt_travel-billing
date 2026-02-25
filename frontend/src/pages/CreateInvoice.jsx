import { useState, useEffect } from 'react';
import { useBusiness } from '../context/BusinessContext';
import api from '../services/api';
import { Plus, Trash, Save, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CreateInvoice = () => {
  const { activeBusiness } = useBusiness();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  
  // Invoice State
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState([]);
  const [gstRates, setGstRates] = useState({ cgst: 0, sgst: 0, igst: 0 });
  const [paymentMode, setPaymentMode] = useState('Cash');

  // New Item State
  const [currentItem, setCurrentItem] = useState({
    serviceType: 'Flight', description: '', pnr: '', fare: 0, tax: 0, serviceCharge: 0
  });

  useEffect(() => {
    if (activeBusiness) {
      api.get(`/customers?businessId=${activeBusiness._id}`)
         .then(res => setCustomers(res.data));
    }
  }, [activeBusiness]);

  // Add Item to List
  const addItem = () => {
    const fare = parseFloat(currentItem.fare) || 0;
    const tax = parseFloat(currentItem.tax) || 0;
    const sc = parseFloat(currentItem.serviceCharge) || 0;
    const total = fare + tax + sc;

    if (total === 0) return alert("Amount cannot be zero");

    setItems([...items, { ...currentItem, fare, tax, serviceCharge: sc, total }]);
    setCurrentItem({ serviceType: 'Flight', description: '', pnr: '', fare: 0, tax: 0, serviceCharge: 0 });
  };

  // Remove Item
  const removeItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  // Calculations
  const subTotal = items.reduce((acc, item) => acc + item.total, 0);
  const finalTotal = subTotal + 
    (parseFloat(gstRates.cgst) || 0) + 
    (parseFloat(gstRates.sgst) || 0) + 
    (parseFloat(gstRates.igst) || 0);

  // Save to Backend
  const handleSave = async () => {
    if (!selectedCustomer) return alert("Please select a customer");
    if (items.length === 0) return alert("Add at least one item");

    const payload = {
      businessId: activeBusiness._id,
      customerId: selectedCustomer,
      invoiceDate,
      items,
      subTotal,
      cgst: parseFloat(gstRates.cgst) || 0,
      sgst: parseFloat(gstRates.sgst) || 0,
      igst: parseFloat(gstRates.igst) || 0,
      grandTotal: finalTotal,
      status: 'Pending',
      paymentMode
    };

    try {
      await api.post('/invoices', payload);
      alert('Invoice Generated Successfully!');
      navigate('/invoices');
    } catch (error) {
      console.error(error);
      alert('Failed to generate invoice');
    }
  };

  return (
    <div className="p-8 ml-64 bg-gray-50 min-h-screen">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/invoices')} className="p-2 bg-white rounded shadow hover:bg-gray-100">
            <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">Create New Invoice</h1>
      </div>
      
      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Left: Customer Selection */}
        <div className="bg-white p-6 rounded shadow col-span-2">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Select Customer</label>
                    <select 
                        className="input-field"
                        value={selectedCustomer}
                        onChange={(e) => setSelectedCustomer(e.target.value)}
                    >
                        <option value="">-- Choose Customer --</option>
                        {customers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Invoice Date</label>
                    <input 
                        type="date" 
                        className="input-field"
                        value={invoiceDate}
                        onChange={(e) => setInvoiceDate(e.target.value)}
                    />
                </div>
            </div>
        </div>

        {/* Right: Payment Mode */}
        <div className="bg-white p-6 rounded shadow">
            <label className="block text-sm font-medium mb-1">Payment Mode</label>
            <select className="input-field" value={paymentMode} onChange={e => setPaymentMode(e.target.value)}>
                <option>Cash</option>
                <option>UPI</option>
                <option>Bank Transfer</option>
                <option>Credit Card</option>
            </select>
        </div>
      </div>

      {/* Add Items Section */}
      <div className="bg-white p-6 rounded shadow mb-6 border-t-4 border-blue-600">
        <h2 className="font-semibold mb-4 text-lg">Service Details</h2>
        <div className="grid grid-cols-7 gap-2 items-end">
            <div className="col-span-1">
                <label className="text-xs text-gray-500">Type</label>
                <select 
                    className="input-field text-sm"
                    value={currentItem.serviceType}
                    onChange={e => setCurrentItem({...currentItem, serviceType: e.target.value})}
                >
                    <option>Flight</option>
                    <option>Train</option>
                    <option>Hotel</option>
                    <option>Visa</option>
                    <option>Tour</option>
                    <option>Bus</option>
                </select>
            </div>
            <div className="col-span-2">
                <label className="text-xs text-gray-500">Description / Route</label>
                <input 
                    className="input-field text-sm" 
                    placeholder="e.g. DEL to BOM"
                    value={currentItem.description}
                    onChange={e => setCurrentItem({...currentItem, description: e.target.value})}
                />
            </div>
            <div className="col-span-1">
                <label className="text-xs text-gray-500">PNR / Ref</label>
                <input 
                    className="input-field text-sm" 
                    placeholder="PNR123"
                    value={currentItem.pnr}
                    onChange={e => setCurrentItem({...currentItem, pnr: e.target.value})}
                />
            </div>
            <div className="col-span-1">
                <label className="text-xs text-gray-500">Base Fare</label>
                <input 
                    type="number" className="input-field text-sm" placeholder="0"
                    value={currentItem.fare}
                    onChange={e => setCurrentItem({...currentItem, fare: e.target.value})}
                />
            </div>
            <div className="col-span-1">
                <label className="text-xs text-gray-500">Taxes + SC</label>
                <input 
                    type="number" className="input-field text-sm" placeholder="0"
                    value={currentItem.tax}
                    onChange={e => setCurrentItem({...currentItem, tax: e.target.value})}
                />
            </div>
            <div className="col-span-1">
                <button onClick={addItem} className="bg-blue-600 text-white p-2 rounded w-full flex justify-center items-center hover:bg-blue-700">
                    <Plus size={20} />
                </button>
            </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white shadow rounded mb-6">
        <table className="w-full text-left">
          <thead className="bg-gray-100 border-b text-sm uppercase text-gray-600">
            <tr>
              <th className="p-3">Type</th>
              <th className="p-3">Description</th>
              <th className="p-3">PNR</th>
              <th className="p-3 text-right">Fare</th>
              <th className="p-3 text-right">Tax/SC</th>
              <th className="p-3 text-right">Total</th>
              <th className="p-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx} className="border-b">
                <td className="p-3">{item.serviceType}</td>
                <td className="p-3">{item.description}</td>
                <td className="p-3">{item.pnr}</td>
                <td className="p-3 text-right">{item.fare}</td>
                <td className="p-3 text-right">{item.tax + item.serviceCharge}</td>
                <td className="p-3 text-right font-medium">{item.total.toFixed(2)}</td>
                <td className="p-3 text-center">
                    <button onClick={() => removeItem(idx)} className="text-red-500 hover:text-red-700">
                        <Trash size={16} />
                    </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan="7" className="p-4 text-center text-gray-400">No items added yet</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Footer: Totals and Save */}
      <div className="flex justify-end">
        <div className="bg-white p-6 rounded shadow w-1/3">
            <div className="flex justify-between mb-2">
                <span>Subtotal:</span>
                <span className="font-bold">₹{subTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-2 items-center">
                <span>CGST:</span>
                <input type="number" className="border w-20 text-right p-1 rounded" value={gstRates.cgst} onChange={e => setGstRates({...gstRates, cgst: e.target.value})} />
            </div>
            <div className="flex justify-between mb-2 items-center">
                <span>SGST:</span>
                <input type="number" className="border w-20 text-right p-1 rounded" value={gstRates.sgst} onChange={e => setGstRates({...gstRates, sgst: e.target.value})} />
            </div>
            <div className="flex justify-between mb-4 items-center">
                <span>IGST:</span>
                <input type="number" className="border w-20 text-right p-1 rounded" value={gstRates.igst} onChange={e => setGstRates({...gstRates, igst: e.target.value})} />
            </div>
            <div className="border-t pt-4 flex justify-between text-xl font-bold text-blue-800">
                <span>Grand Total:</span>
                <span>₹{finalTotal.toFixed(2)}</span>
            </div>
            <button onClick={handleSave} className="w-full mt-6 bg-green-600 text-white py-3 rounded font-bold hover:bg-green-700 flex justify-center gap-2">
                <Save size={20} /> Generate Invoice
            </button>
        </div>
      </div>
    </div>
  );
};

export default CreateInvoice;