import asyncHandler from 'express-async-handler';
import Invoice from '../models/Invoice.js';
import Customer from'../models/Customer.js';
import mongoose from 'mongoose';

export const getDashboardStats = asyncHandler(async (req, res) => {
  const { businessId } = req.query;
  const bId = new mongoose.Types.ObjectId(businessId);

  // 1. Total Revenue
  const revenue = await Invoice.aggregate([
    { $match: { businessId: bId, status: { $ne: 'Cancelled' } } },
    { $group: { _id: null, total: { $sum: '$grandTotal' } } }
  ]);

  // 2. Pending Payments
  const pending = await Invoice.aggregate([
    { $match: { businessId: bId, status: 'Pending' } },
    { $group: { _id: null, count: { $sum: 1 }, amount: { $sum: '$grandTotal' } } }
  ]);

  // 3. Monthly Revenue (Chart Data)
  const monthlyRevenue = await Invoice.aggregate([
    { $match: { businessId: bId, status: { $ne: 'Cancelled' } } },
    {
      $group: {
        _id: { $month: "$invoiceDate" },
        total: { $sum: "$grandTotal" }
      }
    },
    { $sort: { "_id": 1 } }
  ]);

  const totalBookings = await Invoice.countDocuments({ businessId: bId });
  const totalCustomers = await Customer.countDocuments({ businessId: bId });

  res.json({
    totalRevenue: revenue[0]?.total || 0,
    pendingPayments: pending[0]?.amount || 0,
    pendingCount: pending[0]?.count || 0,
    totalBookings,
    totalCustomers,
    chartData: monthlyRevenue.map(item => ({
      name: new Date(0, item._id - 1).toLocaleString('default', { month: 'short' }),
      amount: item.total
    }))
  });
});

export default { getDashboardStats };