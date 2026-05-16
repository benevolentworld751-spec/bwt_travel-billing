import api from './api';

export const customerService = {
  getCustomers: (businessId) => api.get(`/customers?businessId=${businessId}`),
  
  createCustomer: (data) => api.post('/customers', data),
  
  updateCustomer: (id, data) => api.put(`/customers/${id}`, data),
  
   toggleArchive: (id, businessId, currentStatus) => 
    api.put(`/customers/${id}`, { 
      isArchived: !currentStatus, 
      businessId: businessId  // <--- Ensure this is here
    }),

  toggleFavorite: (id, businessId, currentFav) => 
    api.put(`/customers/${id}`, { 
      isFavorite: !currentFav, 
      businessId: businessId  // <--- Ensure this is here
    }),
    
  // New: Get specific history
  getCustomerHistory: (id) => api.get(`/customers/${id}/history`) ,
   getCustomerInvoices: (businessId, customerId) => 
    api.get(`/invoices?businessId=${businessId}&customerId=${customerId}`),
  deleteInvoice: (invoiceId) => api.delete(`/invoices/${invoiceId}`),
};