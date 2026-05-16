import asyncHandler from 'express-async-handler';
import Customer from '../models/Customer.js';

// @desc    Get all customers for a business
export const getCustomers = asyncHandler(async (req, res) => {
  const { businessId } = req.query;
  if (!businessId) {
    res.status(400);
    throw new Error("Business ID required");
  }

  const customers = await Customer.find({
    businessId,
    user: req.user._id
  }).sort({ isFavorite: -1, createdAt: -1 }); // Favorites always at top, then newest

  res.json(customers);
});

// @desc    Create new customer
export const createCustomer = asyncHandler(async (req, res) => {
  const { name, email, phone, address, gstNumber, passportNumber, businessId, tag } = req.body;

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
    tag: tag || 'Regular',
    businessId,
    user: req.user._id
  });

  res.status(201).json(customer);
});

// @desc    Update customer (Handles Profile, Archive, Favorite, and Tags)
export const updateCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findOne({
    _id: req.params.id,
    user: req.user._id 
  });

  if (!customer) {
    res.status(404);
    throw new Error("Customer not found");
  }

  // List of fields allowed to be updated
  const fieldsToUpdate = [
    'name', 'email', 'phone', 'address', 
    'gstNumber', 'passportNumber', 'tag', 
    'isArchived', 'isFavorite'
  ];

  // Update only the fields provided in the request body
  fieldsToUpdate.forEach((field) => {
    if (req.body[field] !== undefined) {
      customer[field] = req.body[field];
    }
  });

  const updatedCustomer = await customer.save();
  res.json(updatedCustomer);
});

// @desc    Delete customer
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
  res.json({ message: "Customer permanently removed" });
});