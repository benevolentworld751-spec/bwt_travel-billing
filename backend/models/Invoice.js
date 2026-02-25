import mongoose from 'mongoose';

const invoiceSchema = mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  invoiceNumber: { 
  type: String, 
  required: true 
}, // Auto-increment logic in controller
  invoiceDate: { type: Date, default: Date.now },
  items: [{
    serviceType: { 
      type: String, 
      enum: ['Flight', 'Train', 'Hotel', 'Visa', 'Tour', 'Bus', 'Other'],
      required: true 
    },
    description: String,
    travelDate: Date,
    pnr: String, // Booking Ref
    from: String,
    to: String,
    airlineTrainHotel: String, // Provider Name
    passengerName: String,
    fare: Number,
    tax: Number,
    serviceCharge: Number,
    total: Number // calculated
  }],
  subTotal: { type: Number, required: true },
  cgst: { type: Number, default: 0 },
  sgst: { type: Number, default: 0 },
  igst: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true },
  status: { type: String, enum: ['Paid', 'Pending', 'Cancelled'], default: 'Pending' },
  paymentMode: { type: String, enum: ['Cash', 'UPI', 'Bank', 'Card'], default: 'Cash' }
}, { timestamps: true });

// Compound index to ensure invoice numbers are unique per business
invoiceSchema.index(
  { businessId: 1, invoiceNumber: 1 },
  { unique: true }
);

 const Invoice = mongoose.model('Invoice', invoiceSchema);
 export default Invoice;