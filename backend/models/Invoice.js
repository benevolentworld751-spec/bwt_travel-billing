import mongoose from 'mongoose';
const invoiceSchema =mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  invoiceNumber: { type: String, required: true },
  invoiceDate: { type: Date, default: Date.now },
  items: [Object],
  subTotal: { type: Number, default: 0 },
  
  // --- ADD THESE MISSING FIELDS ---
  serviceCharge: { type: Number, default: 0 }, 
  taxRate: { type: Number, default: 0 },
  // --------------------------------
  
  cgst: { type: Number, default: 0 },
  sgst: { type: Number, default: 0 },
  igst: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 },
  status: { type: String, default: 'Pending' },
  paymentMode: { type: String, default: 'Bank Transfer' }
}, { timestamps: true });

const Invoice = mongoose.model('Invoice', invoiceSchema);
export default Invoice;