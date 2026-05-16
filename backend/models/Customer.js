import mongoose from 'mongoose';

const customerSchema = mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String, required: true },
  address: { type: String },
  gstNumber: { type: String },
  passportNumber: { type: String },
  user: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
  required: true,
},
 tag: { 
    type: String, 
    enum: ['Regular', 'VIP', 'One-time'], 
    default: 'Regular' 
  },
  isArchived: { 
    type: Boolean, 
    default: false 
  },
  isFavorite: { 
    type: Boolean, 
    default: false 
  },
isArchived: { type: Boolean, default: false },
isFavorite: { type: Boolean, default: false },
// These are usually calculated from invoices, but can be stored for speed
outstanding: { type: Number, default: 0 },
  totalValue: { type: Number, default: 0 }
  // History is derived via queries, not stored array for scalability
}, { timestamps: true });


 const Customer = mongoose.model('Customer', customerSchema);
 export default Customer;