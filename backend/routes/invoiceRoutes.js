import express from "express";
import asyncHandler from "express-async-handler";

import { protect } from "../middleware/authMiddleware.js";
import {
  createInvoice,
  getInvoicePDF,
} from "../controllers/invoiceController.js";

import Invoice from "../models/Invoice.js";

const router = express.Router();

// Get Invoices for a Business
const getInvoices = asyncHandler(async (req, res) => {
  const { businessId } = req.query;

  if (!businessId) {
    res.status(400);
    throw new Error("Business ID is required");
  }

  const invoices = await Invoice.find({ businessId })
    .populate("customerId", "name email")
    .sort({ createdAt: -1 });

  res.json(invoices);
});

router
  .route("/")
  .post(protect, createInvoice)
  .get(protect, getInvoices);

router.route("/:id/pdf").get(protect, getInvoicePDF);

export default router;