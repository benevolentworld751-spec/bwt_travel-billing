import { useState, useEffect, useMemo } from 'react';
import { useBusiness } from '../context/BusinessContext';
import { customerService } from '../services/customerService';
import { exportToExcel } from '../utils/exportUtils';
import { Plus, Download } from 'lucide-react';

import CustomerFilters from '../components/customers/CustomerFilters';
import CustomerForm from '../components/customers/CustomerForm';
import CustomerTable from '../components/customers/CustomerTable';
import CustomerHistoryView from '../components/customers/CustomerHistoryView';

const Customers = () => {
  const { activeBusiness } = useBusiness();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('Active');
  const [filterTag, setFilterTag] = useState('All');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', address: '',
    gstNumber: '', passportNumber: '', tag: 'Regular'
  });

  const loadData = async () => {
    if (!activeBusiness?._id) return;
    try {
      const { data } = await customerService.getCustomers(activeBusiness._id);
      setCustomers(data || []);
    } catch (err) {
      console.error("Load error:", err);
    }
  };

  useEffect(() => { loadData(); }, [activeBusiness?._id]);

  const filteredData = useMemo(() => {
    return customers.filter(c => {
      const matchSearch =
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm);
      const matchStatus =
        filterType === 'All' ||
        (filterType === 'Active' ? !c.isArchived : c.isArchived);
      const matchTag = filterTag === 'All' || c.tag === filterTag;
      return matchSearch && matchStatus && matchTag;
    }).sort((a, b) => (a.isFavorite === b.isFavorite ? 0 : a.isFavorite ? -1 : 1));
  }, [customers, searchTerm, filterType, filterTag]);

  // ── Action Handlers ────────────────────────────────────────────────────────
  const handleArchive = async (id, currentStatus) => {
    try {
      await customerService.toggleArchive(id, activeBusiness._id, currentStatus);
      await loadData();
    } catch (err) { alert("Failed to archive"); }
  };

  const handleFavorite = async (id, currentFav) => {
    try {
      await customerService.toggleFavorite(id, activeBusiness._id, currentFav);
      await loadData();
    } catch (err) { alert("Failed to favorite"); }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', email: '', phone: '', address: '', gstNumber: '', passportNumber: '', tag: 'Regular' });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = { ...formData, businessId: activeBusiness._id };
      if (editingId) {
        await customerService.updateCustomer(editingId, data);
      } else {
        await customerService.createCustomer(data);
      }
      resetForm();
      await loadData();
    } catch (err) {
      console.error(err);
      alert("Failed to save customer");
    }
    setLoading(false);
  };

  // ── KEY FIX: Handler with safety check + console for debugging ────────────
  const handleViewHistory = (customer) => {
    if (!customer || !customer._id) {
      console.error("handleViewHistory: invalid customer object", customer);
      return;
    }
    console.log("Opening history for:", customer.name, customer._id);
    setSelectedCustomer(customer);
  };

  // ── History View ───────────────────────────────────────────────────────────
  // Rendered inside the SAME layout wrapper so sidebar stays visible
  if (selectedCustomer) {
    return (
      <div className="p-8 ml-64 bg-gray-50 min-h-screen">
        <CustomerHistoryView
          customer={selectedCustomer}
          onBack={() => {
            setSelectedCustomer(null);
            loadData(); // refresh customer list when coming back
          }}
        />
      </div>
    );
  }

  // ── Default List View ──────────────────────────────────────────────────────
  return (
    <div className="p-8 ml-64 bg-gray-50 min-h-screen">
      <div className="flex justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Customer Management</h1>
          <p className="text-gray-500 font-medium">Business: {activeBusiness?.name}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => exportToExcel(filteredData, "Customer_List")}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg bg-white hover:bg-gray-50 shadow-sm transition-all"
          >
            <Download size={18} /> Export
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md transition-all"
          >
            <Plus size={18} /> Add Customer
          </button>
        </div>
      </div>

      <CustomerFilters
        searchTerm={searchTerm} setSearchTerm={setSearchTerm}
        filterType={filterType} setFilterType={setFilterType}
        filterTag={filterTag} setFilterTag={setFilterTag}
      />

      <CustomerTable
        customers={filteredData}
        onFavorite={handleFavorite}
        onArchive={handleArchive}
        onEdit={(c) => {
          setEditingId(c._id);
          setFormData({
            name: c.name, email: c.email || '', phone: c.phone,
            address: c.address || '', gstNumber: c.gstNumber || '',
            passportNumber: c.passportNumber || '', tag: c.tag || 'Regular'
          });
          setShowForm(true);
        }}
        onHistory={handleViewHistory}   // ← uses the safe handler
      />

      {showForm && (
        <CustomerForm
          formData={formData} setFormData={setFormData}
          isEditing={!!editingId} loading={loading}
          onSubmit={handleFormSubmit} onCancel={resetForm}
        />
      )}
    </div>
  );
};

export default Customers;