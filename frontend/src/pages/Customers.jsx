import { useState, useEffect } from 'react';
import { useBusiness } from '../context/BusinessContext';
import api from '../services/api';
import { Plus, Trash2, Search } from 'lucide-react';

const Customers = () => {
  const { activeBusiness } = useBusiness();
  const [customers, setCustomers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', address: '', gstNumber: '', passportNumber: ''
  });

  useEffect(() => {
    if (activeBusiness) fetchCustomers();
  }, [activeBusiness]);

  const fetchCustomers = async () => {
    try {
      const { data } = await api.get(`/customers?businessId=${activeBusiness._id}`);
      setCustomers(data);
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/customers', { ...formData, businessId: activeBusiness._id });
      fetchCustomers();
      setShowForm(false);
      setFormData({ name: '', email: '', phone: '', address: '', gstNumber: '', passportNumber: '' });
    } catch (err) { alert('Failed to add customer'); }
  };

  const handleDelete = async (id) => {
    if(!window.confirm('Are you sure?')) return;
    await api.delete(`/customers/${id}`);
    fetchCustomers();
  };

  return (
    <div className="p-8 ml-64">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Customer Management</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Add Customer
        </button>
      </div>

      {/* Add Customer Form */}
      {showForm && (
        <div className="bg-white p-6 rounded shadow mb-6 border border-blue-100">
          <h3 className="font-bold mb-4">New Customer Details</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <input className="input-field" placeholder="Full Name" required onChange={e => setFormData({...formData, name: e.target.value})} />
            <input className="input-field" placeholder="Phone Number" required onChange={e => setFormData({...formData, phone: e.target.value})} />
            <input className="input-field" placeholder="Email" type="email" onChange={e => setFormData({...formData, email: e.target.value})} />
            <input className="input-field" placeholder="GST Number (Optional)" onChange={e => setFormData({...formData, gstNumber: e.target.value})} />
            <input className="input-field" placeholder="Passport Number (Optional)" onChange={e => setFormData({...formData, passportNumber: e.target.value})} />
            <textarea className="input-field col-span-2" placeholder="Address" onChange={e => setFormData({...formData, address: e.target.value})} />
            <div className="col-span-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                <button type="submit" className="btn-primary">Save Customer</button>
            </div>
          </form>
        </div>
      )}

      {/* Customer List */}
      <div className="bg-white shadow rounded overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">Phone</th>
              <th className="p-4">Email</th>
              <th className="p-4">GST / Passport</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map(c => (
              <tr key={c._id} className="border-b hover:bg-gray-50">
                <td className="p-4 font-medium">{c.name}</td>
                <td className="p-4">{c.phone}</td>
                <td className="p-4">{c.email}</td>
                <td className="p-4 text-sm">
                  {c.gstNumber && <div>GST: {c.gstNumber}</div>}
                  {c.passportNumber && <div>PP: {c.passportNumber}</div>}
                </td>
                <td className="p-4">
                  <button onClick={() => handleDelete(c._id)} className="text-red-500 hover:text-red-700">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
                <tr><td colSpan="5" className="p-4 text-center text-gray-500">No customers found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Customers;