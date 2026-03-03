import { useState, useEffect, } from 'react';
import { useBusiness } from '../context/BusinessContext';
import api from '../services/api';
import { Plus, Trash2, Loader } from 'lucide-react';

const Customers = () => {
  const { activeBusiness } = useBusiness();

  const [customers, setCustomers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false); // Add loading state
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    gstNumber: '',
    passportNumber: '',
  });

 // 1. Define Fetch Function
  const fetchCustomers = async () => {
    if (!activeBusiness?._id) return;
    try {
      const { data } = await api.get(`/customers?businessId=${activeBusiness._id}`);
      setCustomers(data || []);
    } catch (err) {
      console.error('Fetch error:', err);
    }
  };

  // 2. Fetch only when the Business ID changes
  useEffect(() => {
    fetchCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBusiness?._id]); // <--- CRITICAL CHANGE: Listen to ID, not the whole object

  // 3. ADD CUSTOMER
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // FIX: Alert user if no business is selected instead of silent fail
    if (!activeBusiness?._id) {
      alert("Please select a business first.");
      setLoading(false);
      return;
    }

    try {
      console.log("Sending Data:", { ...formData, businessId: activeBusiness._id }); // Debugging

      await api.post('/customers', {
        ...formData,
        businessId: activeBusiness._id
      });

      alert("Customer Added Successfully");
      
      // Refresh list
      await fetchCustomers();

      // Close form and reset
      setShowForm(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        gstNumber: '',
        passportNumber: ''
      });

    } catch (err) {
      console.error('Add error:', err);
      // FIX: Show specific error message from backend
      alert(err.response?.data?.message || 'Failed to add customer');
    } finally {
      setLoading(false);
    }
  };

  // 4. DELETE CUSTOMER
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;

    try {
      await api.delete(`/customers/${id}`);
      await fetchCustomers(); // Refresh list
    } catch (err) {
      console.error('Delete error:', err);
      alert("Failed to delete customer");
    }
  };

  return (
    <div className="p-8 ml-64">
      <div className="flex justify-between items-center mb-6">
        <div>
           <h2 className="text-2xl font-bold">Customer Management</h2>
           {/* Show currently selected business to ensure one is active */}
           <p className="text-sm text-gray-500">
             Business: {activeBusiness ? activeBusiness.name : "None Selected"}
           </p>
        </div>
        
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center gap-2"
          disabled={!activeBusiness} // Disable if no business
        >
          <Plus size={18} /> Add Customer
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded shadow mb-6 border border-blue-100">
          <h3 className="font-bold mb-4">New Customer Details</h3>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              className="input-field border p-2 rounded"
              placeholder="Full Name *"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />

            <input
              className="input-field border p-2 rounded"
              placeholder="Phone Number *"
              required
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
            />

            <input
              className="input-field border p-2 rounded"
              placeholder="Email"
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />

            <input
              className="input-field border p-2 rounded"
              placeholder="GST Number (Optional)"
              value={formData.gstNumber}
              onChange={e => setFormData({ ...formData, gstNumber: e.target.value })}
            />

            <input
              className="input-field border p-2 rounded"
              placeholder="Passport Number (Optional)"
              value={formData.passportNumber}
              onChange={e => setFormData({ ...formData, passportNumber: e.target.value })}
            />

            <textarea
              className="input-field border p-2 rounded md:col-span-2"
              placeholder="Address"
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
            />

            <div className="md:col-span-2 flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
              >
                Cancel
              </button>

              <button 
  type="submit" 
  className={`btn-primary flex items-center gap-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
  disabled={loading} // <--- Disable button while loading
>
  {loading ? "Saving..." : "Save Customer"}
</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow rounded overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">Phone</th>
              <th className="p-4">Email</th>
              <th className="p-4">Details</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>

          <tbody>
            {customers.length > 0 ? (
              customers.map(c => (
                <tr key={c._id} className="border-b hover:bg-gray-50">
                  <td className="p-4 font-medium">{c.name}</td>
                  <td className="p-4">{c.phone}</td>
                  <td className="p-4">{c.email || "-"}</td>
                  <td className="p-4 text-sm">
                    {c.gstNumber && <div className="bg-blue-50 text-blue-700 px-2 py-1 rounded w-fit text-xs mb-1">GST: {c.gstNumber}</div>}
                    {c.passportNumber && <div className="bg-purple-50 text-purple-700 px-2 py-1 rounded w-fit text-xs">PP: {c.passportNumber}</div>}
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleDelete(c._id)}
                      className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded"
                      title="Delete Customer"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="p-8 text-center text-gray-500">
                  {activeBusiness ? "No customers found. Add one above!" : "Please select a business to view customers."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Customers;