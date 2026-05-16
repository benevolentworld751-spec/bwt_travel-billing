import { X } from 'lucide-react';

const CustomerForm = ({ formData, setFormData, onSubmit, onCancel, isEditing, loading }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
      <div className="p-6 border-b flex justify-between bg-gray-50">
        <h3 className="text-xl font-bold">{isEditing ? 'Edit' : 'Add'} Customer</h3>
        <button onClick={onCancel}><X /></button>
      </div>
      <form onSubmit={onSubmit} className="p-6 grid grid-cols-2 gap-4">
        <input className="border p-2 rounded" placeholder="Full Name *" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
        <input className="border p-2 rounded" placeholder="Phone *" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
        <select className="border p-2 rounded" value={formData.tag} onChange={e => setFormData({...formData, tag: e.target.value})}>
          <option value="Regular">Regular</option>
          <option value="VIP">VIP</option>
          <option value="One-time">One-time</option>
        </select>
        <input className="border p-2 rounded" placeholder="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
        <input className="border p-2 rounded" placeholder="GST Number" value={formData.gstNumber} onChange={e => setFormData({...formData, gstNumber: e.target.value})} />
        <textarea className="border p-2 rounded col-span-2" placeholder="Address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
        <div className="col-span-2 flex justify-end gap-3 mt-4">
          <button type="button" onClick={onCancel} className="px-6 py-2 border rounded-lg">Cancel</button>
          <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded-lg">
            {loading ? "Saving..." : "Save Customer"}
          </button>
        </div>
      </form>
    </div>
  </div>
);

export default CustomerForm;