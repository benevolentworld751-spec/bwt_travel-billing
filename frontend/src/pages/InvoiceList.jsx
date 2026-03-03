import { useEffect, useState } from 'react';
import { useBusiness } from '../context/BusinessContext';
import api from '../services/api';
import { Download } from 'lucide-react';
import { Link } from 'react-router-dom';

const InvoiceList = () => {
  const { activeBusiness } = useBusiness();
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    if (activeBusiness?._id) {
      api.get(`/invoices?businessId=${activeBusiness._id}`)
         .then(res => setInvoices(res.data))
         .catch(err => console.error(err));
    }
  }, [activeBusiness]);

  const handleDownload = async (id, invNum) => {
    try {
        console.log(`Downloading invoice: /invoices/${id}/pdf`);
        
        // 1. Make API Call with blob response type
        const response = await api.get(`/invoices/${id}/pdf`, { 
            responseType: 'blob' 
        });

        // 2. Create a Blob from the response
        const blob = new Blob([response.data], { type: 'application/pdf' });
        
        // 3. Create a link element, click it, and remove it
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Invoice-${invNum}.pdf`); // File name
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        link.remove();
        window.URL.revokeObjectURL(url);

    } catch (error) {
        console.error("Download failed:", error);
        // Show alert if the backend returns 404 (e.g., customer deleted)
        if(error.response && error.response.status === 404) {
            alert("Error: The Customer or Business associated with this invoice may have been deleted.");
        } else {
            alert("Failed to download PDF. Check console for details.");
        }
    }
  };

  return (
    <div className="p-8 ml-64">
      <div className="flex justify-between mb-6">
        <h2 className="text-2xl font-bold">Invoices</h2>
        <Link to="/invoices/create" className="btn-primary">Create New Invoice</Link>
      </div>

      <div className="bg-white shadow rounded overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="p-4">#</th>
              <th className="p-4">Date</th>
              <th className="p-4">Customer</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Status</th>
              <th className="p-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length > 0 ? invoices.map(inv => (
              <tr key={inv._id} className="border-b hover:bg-gray-50">
                <td className="p-4 font-medium">{inv.invoiceNumber}</td>
                <td className="p-4">{new Date(inv.invoiceDate).toLocaleDateString()}</td>
                <td className="p-4">{inv.customerId?.name || 'Unknown'}</td>
                <td className="p-4">₹{inv.grandTotal.toFixed(2)}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs ${inv.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {inv.status}
                  </span>
                </td>
                <td className="p-4 flex gap-2">
                   <button 
                    onClick={() => handleDownload(inv._id, inv.invoiceNumber)} 
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    title="Download PDF"
                   >
                     <Download size={18} />
                   </button>
                </td>
              </tr>
            )) : (
                <tr>
                    <td colSpan="6" className="p-4 text-center text-gray-500">No invoices found.</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InvoiceList;