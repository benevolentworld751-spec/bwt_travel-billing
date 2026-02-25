import { useState } from 'react';
import api from '../services/api';
import { useBusiness } from '../context/BusinessContext';

const Businesses = () => {
  const { businesses, fetchBusinesses } = useBusiness();
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
  const [logo, setLogo] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();

      data.append("name", formData.name);
      data.append("gstNumber", formData.gstNumber);
      data.append("address", formData.address);
      data.append("phone", formData.phone);
      data.append("email", formData.email);

      // Bank details as JSON
      data.append(
        "bankDetails",
        JSON.stringify({
          bankName: formData.bankName,
          accountNumber: formData.accountNumber,
          ifsc: formData.ifsc,
        })
      );

      if (logo) data.append("logo", logo);

      await api.post("/businesses", data, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      await fetchBusinesses();
      alert("Business Added Successfully");

      // Reset form
      setFormData({
        name: '',
        gstNumber: '',
        address: '',
        phone: '',
        email: '',
        bankName: '',
        accountNumber: '',
        ifsc: ''
      });
      setLogo(null);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Error adding business");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 ml-64">
      <h2 className="text-2xl font-bold mb-6">Manage Businesses</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Form */}
        <div className="bg-white p-6 rounded shadow">
          <h3 className="font-semibold mb-4">Add New Business</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              className="input-field"
              placeholder="Business Name"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                className="input-field"
                placeholder="GST Number"
                value={formData.gstNumber}
                onChange={e => setFormData({ ...formData, gstNumber: e.target.value })}
              />
              <input
                className="input-field"
                placeholder="Phone"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>
            <input
              className="input-field"
              placeholder="Email"
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <textarea
              className="input-field"
              placeholder="Address"
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              required
            />

            <h4 className="font-medium text-gray-600 mt-2">Bank Details</h4>
            <div className="grid grid-cols-3 gap-2">
              <input
                className="input-field"
                placeholder="Bank Name"
                value={formData.bankName}
                onChange={e => setFormData({ ...formData, bankName: e.target.value })}
              />
              <input
                className="input-field"
                placeholder="Acc No"
                value={formData.accountNumber}
                onChange={e => setFormData({ ...formData, accountNumber: e.target.value })}
              />
              <input
                className="input-field"
                placeholder="IFSC"
                value={formData.ifsc}
                onChange={e => setFormData({ ...formData, ifsc: e.target.value })}
              />
            </div>

            <div className="mt-2">
              <label className="block text-sm text-gray-600">Logo</label>
              <input type="file" onChange={e => setLogo(e.target.files[0])} />
            </div>

            <button className="btn-primary w-full mt-4" disabled={loading}>
              {loading ? "Creating..." : "Create Business"}
            </button>
          </form>
        </div>

        {/* List */}
        <div className="bg-white p-6 rounded shadow">
          <h3 className="font-semibold mb-4">Your Businesses</h3>
          <div className="space-y-4">
            {businesses.map(b => (
              <div key={b._id} className="border p-4 rounded flex justify-between items-center hover:bg-gray-50">
                <div>
                  <p className="font-bold">{b.name}</p>
                  <p className="text-sm text-gray-500">{b.gstNumber}</p>
                </div>
                {b.logoUrl && (
                  <img
                    src={`http://localhost:5000${b.logoUrl}`}
                    alt="logo"
                    className="h-10 w-10 object-contain"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Businesses;