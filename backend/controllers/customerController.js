import asyncHandler from 'express-async-handler';
import Customer from '../models/Customer.js';

export const getCustomers = asyncHandler(async (req, res) => {
  const { businessId } = req.query;
  if(!businessId) {
      res.status(400);
      throw new Error('Business ID required');
  }
  const customers = await Customer.find({ businessId });
  res.json(customers);
});

export const createCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.create(req.body);
  res.status(201).json(customer);
});

export const deleteCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (customer) {
    await customer.deleteOne();
    res.json({ message: 'Customer removed' });
  } else {
    res.status(404);
    throw new Error('Customer not found');
  }
});

export default { getCustomers, createCustomer, deleteCustomer };