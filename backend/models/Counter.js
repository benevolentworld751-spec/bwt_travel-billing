// models/Counter.js
import mongoose from "mongoose";

const counterSchema = new mongoose.Schema({
  businessId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Business",
    required: true
  },
  name: { 
    type: String, 
    required: true 
  },
  date: { 
    type: String,   // YYYYMMDD
    required: true 
  },
  seq: { 
    type: Number, 
    default: 0 
  }
});

// Prevent duplicate counter per business per day
counterSchema.index(
  { businessId: 1, name: 1, date: 1 },
  { unique: true }
);


const Counter = mongoose.model("Counter", counterSchema);
export default Counter;