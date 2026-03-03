import asyncHandler from 'express-async-handler';
import Customer from '../models/Customer.js';

export const getCustomers = asyncHandler(async (req, res) => {
  const { businessId } = req.query;

  if (!businessId) {
    res.status(400);
    throw new Error("Business ID required");
  }

  // 🔐 Ensure business belongs to logged-in user
  const customers = await Customer.find({
    businessId,
    user: req.user._id
  });

  res.json(customers);
});

export const createCustomer = asyncHandler(async (req, res) => {
  const { name, email, phone, address, gstNumber, passportNumber, businessId } = req.body;

  if (!businessId) {
    res.status(400);
    throw new Error("Business ID required");
  }

  const customer = await Customer.create({
    name,
    email,
    phone,
    address,
    gstNumber,
    passportNumber,
    businessId,
    user: req.user._id  // 🔐 attach logged in user
  });

  res.status(201).json(customer);
});

export const deleteCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findOne({
    _id: req.params.id,
    user: req.user._id
  });

  if (!customer) {
    res.status(404);
    throw new Error("Customer not found");
  }

  await customer.deleteOne();
  res.json({ message: "Customer removed" });
});

export default { getCustomers, createCustomer, deleteCustomer };