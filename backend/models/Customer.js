import mongoose from 'mongoose';

const customerSchema = mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String, required: true },
  address: { type: String },
  gstNumber: { type: String },
  passportNumber: { type: String },
  // History is derived via queries, not stored array for scalability
}, { timestamps: true });



 const Customer = mongoose.model('Customer', customerSchema);
 export default Customer;