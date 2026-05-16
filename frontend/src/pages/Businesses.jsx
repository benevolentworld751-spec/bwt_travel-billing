import { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { useBusiness } from '../context/BusinessContext';

const Businesses = () => {
  const { businesses, fetchBusinesses } = useBusiness();
  
  // State for form
  const [formData, setFormData] = useState({
    name: '',
    gstNumber: '',
    address: '',
    phone: '',
    email: '',
    bankName: '',
    accountNumber: '',
    ifsc: ''
  });
  
  // New States
  const [editingId, setEditingId] = useState(null); // Track if we are editing
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null); // Logo Preview
  const [searchTerm, setSearchTerm] = useState(""); // Search Feature
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  // Handle Logo Preview
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogo(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  // Filter businesses based on search
  const filteredBusinesses = useMemo(() => {
    return businesses?.filter(b => 
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.gstNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [businesses, searchTerm]);

  // Handle Edit Click
  const handleEdit = (business) => {
    setEditingId(business._id);
    setFormData({
      name: business.name,
      gstNumber: business.gstNumber || '',
      address: business.address,
      phone: business.phone,
      email: business.email,
      bankName: business.bankDetails?.bankName || '',
      accountNumber: business.bankDetails?.accountNumber || '',
      ifsc: business.bankDetails?.ifsc || ''
    });
    setLogoPreview(business.logoUrl ? `http://localhost:5000/${business.logoUrl}` : null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Delete
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this business?")) return;
    try {
      await api.delete(`/businesses/${id}`);
      fetchBusinesses();
    } catch (err) {
      alert("Error deleting business");
    }
  };

  // Handle Set Default
  const handleSetDefault = async (id) => {
    try {
      await api.patch(`/businesses/${id}/default`);
      fetchBusinesses();
    } catch (err) {
      alert("Error setting default business");
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ name: '', gstNumber: '', address: '', phone: '', email: '', bankName: '', accountNumber: '', ifsc: '' });
    setLogo(null);
    setLogoPreview(null);
    if(document.getElementById('fileInput')) document.getElementById('fileInput').value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (['bankName', 'accountNumber', 'ifsc'].includes(key)) return;
        data.append(key, formData[key]);
      });

      data.append("bankDetails", JSON.stringify({
        bankName: formData.bankName,
        accountNumber: formData.accountNumber,
        ifsc: formData.ifsc,
      }));

      if (logo) data.append("logo", logo);

      if (editingId) {
        await api.put(`/businesses/${editingId}`, data);
        alert("Business Updated Successfully");
      } else {
        await api.post("/businesses", data);
        alert("Business Added Successfully");
      }

      await fetchBusinesses();
      resetForm();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Error saving business");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 ml-64 min-h-screen bg-gray-50">
      <h2 className="text-3xl font-bold mb-8 text-center text-gray-800">Manage Businesses</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
        
        {/* Form Section */}
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
          <div className="flex justify-between items-center mb-6 border-b pb-2">
            <h3 className="text-xl font-semibold text-blue-600">
              {editingId ? "✏️ Edit Business" : "➕ Add New Business"}
            </h3>
            {editingId && (
              <button onClick={resetForm} className="text-sm text-red-500 hover:underline">Cancel Edit</button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Business Name"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="GST Number"
                value={formData.gstNumber}
                onChange={e => setFormData({ ...formData, gstNumber: e.target.value })}
              />
              <input
                className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Phone"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>
            <input
              className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Email"
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <textarea
              className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Address"
              rows="3"
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              required
            />

            <h4 className="font-medium text-gray-700 mt-4 border-l-4 border-blue-500 pl-2">Bank Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input className="border p-2 rounded text-sm" placeholder="Bank Name" value={formData.bankName} onChange={e => setFormData({ ...formData, bankName: e.target.value })} />
              <input className="border p-2 rounded text-sm" placeholder="Acc No" value={formData.accountNumber} onChange={e => setFormData({ ...formData, accountNumber: e.target.value })} />
              <input className="border p-2 rounded text-sm" placeholder="IFSC" value={formData.ifsc} onChange={e => setFormData({ ...formData, ifsc: e.target.value })} />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Logo 🖼️</label>
              <div className="flex items-center gap-4">
                <input id="fileInput" type="file" className="text-sm text-gray-500" onChange={handleLogoChange} />
                {logoPreview && (
                  <img src={logoPreview} alt="Preview" className="h-12 w-12 object-contain border rounded bg-gray-50" />
                )}
              </div>
            </div>

            <button 
              className={`w-full py-3 rounded-lg font-bold transition-all ${editingId ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'} text-white shadow-md`}
              disabled={loading}
            >
              {loading ? "Processing..." : editingId ? "Update Business" : "Create Business"}
            </button>
          </form>
        </div>

        {/* List Section */}
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 h-fit">
          <div className="flex flex-col gap-4 mb-6">
            <h3 className="text-xl font-semibold border-b pb-2">
              Your Businesses ({businesses?.length || 0})
            </h3>
            {/* Search Input */}
            <div className="relative">
               <input 
                type="text" 
                placeholder="🔍 Search by name or GST..." 
                className="w-full border p-2 rounded-lg pl-10 text-sm focus:ring-2 focus:ring-blue-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {filteredBusinesses?.length > 0 ? (
              filteredBusinesses.map(b => (
                <div key={b._id} className={`border p-4 rounded-xl flex flex-col gap-3 hover:shadow-md transition-all ${b.isDefault ? 'border-blue-400 bg-blue-50/30' : 'border-gray-100 bg-white'}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-lg text-gray-800 uppercase">{b.name}</p>
                        {b.isDefault && <span className="bg-blue-100 text-blue-600 text-[10px] px-2 py-0.5 rounded-full font-bold">DEFAULT</span>}
                      </div>
                      <p className="text-xs font-mono text-gray-400">GST: {b.gstNumber || 'N/A'}</p>
                    </div>
                    {b.logoUrl && (
                      <img src={`http://localhost:5000/${b.logoUrl}`} alt="logo" className="h-12 w-12 object-contain border rounded p-1 bg-white" />
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between border-t pt-3 mt-1">
                    <div className="flex gap-3">
                      <button onClick={() => handleEdit(b)} className="text-gray-600 hover:text-blue-600 transition-colors" title="Edit">✏️</button>
                      <button onClick={() => handleDelete(b._id)} className="text-gray-600 hover:text-red-600 transition-colors" title="Delete">🗑️</button>
                    </div>
                    <button 
                      onClick={() => handleSetDefault(b._id)}
                      className={`text-sm px-3 py-1 rounded-md transition-colors ${b.isDefault ? 'text-yellow-600 font-bold cursor-default' : 'text-gray-400 hover:text-yellow-500'}`}
                    >
                      {b.isDefault ? '⭐ Default' : '☆ Set Default'}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-gray-400">No matching businesses found.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Businesses;