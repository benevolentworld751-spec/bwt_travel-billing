import asyncHandler from "express-async-handler";
import Invoice from "../models/Invoice.js";
import Business from "../models/Business.js";
import Customer from "../models/Customer.js";
import {
  generateInvoicePDF,
  generateInvoiceNumber,
} from "../services/pdfService.js";
import { generateInvoiceExcel, generateBulkExcel } from "../services/excelService.js";

// ==============================
// CREATE INVOICE
// ==============================
export const createInvoice = asyncHandler(async (req, res) => {
  const {
    businessId,
    customerId,
    invoiceDate,
    items,
    subTotal,
    serviceCharge,
    taxRate,
    cgst,
    sgst,
    igst,
    grandTotal,
    paymentMode,
    status = "Pending",
    tcs = 0,
    tds = 0,
  } = req.body;

  if (!businessId || !customerId || !items || items.length === 0) {
    res.status(400);
    throw new Error("Missing required fields or no items provided");
  }

  const invoiceNumber = await generateInvoiceNumber(businessId);

  const invoice = await Invoice.create({
    businessId,
    customerId,
    invoiceNumber,
    invoiceDate: invoiceDate || new Date(),
    items,
    subTotal: Number(subTotal),
    serviceCharge: Number(serviceCharge),
    taxRate: Number(taxRate),
    cgst: Number(cgst),
    sgst: Number(sgst),
    igst: Number(igst),
    tcs: Number(tcs),
    tds: Number(tds),
    grandTotal: Number(grandTotal),
    paymentMode,
    status,
  });

  res.status(201).json(invoice);
});

// ==============================
// GET INVOICES (LIST VIEW)
// ==============================
export const getInvoices = asyncHandler(async (req, res) => {
  const { businessId, customerId } = req.query;

  const query = { businessId };
  if (customerId) query.customerId = customerId;

  const invoices = await Invoice.find(query)
    .populate("customerId", "name")
    .sort({ createdAt: -1 });

  res.json(invoices);
});

// ==============================
// GET SINGLE INVOICE BY ID
// ==============================
export const getInvoiceById = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id).populate("customerId");

  if (!invoice) {
    res.status(404);
    throw new Error("Invoice not found");
  }

  res.json(invoice);
});

// ==============================
// UPDATE INVOICE (FULL EDIT)
// ==============================
export const updateInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);

  if (!invoice) {
    res.status(404);
    throw new Error("Invoice not found");
  }

  const {
    customerId,
    invoiceDate,
    items,
    subTotal,
    serviceCharge,
    taxRate,
    cgst,
    sgst,
    igst,
    grandTotal,
    paymentMode,
    status,
    tcs,
    tds,
  } = req.body;

  // Only update fields that are actually sent in the request
  if (customerId !== undefined)    invoice.customerId    = customerId;
  if (invoiceDate !== undefined)   invoice.invoiceDate   = invoiceDate;
  if (items !== undefined)         invoice.items         = items;
  if (subTotal !== undefined)      invoice.subTotal      = Number(subTotal);
  if (serviceCharge !== undefined) invoice.serviceCharge = Number(serviceCharge);
  if (taxRate !== undefined)       invoice.taxRate       = Number(taxRate);
  if (cgst !== undefined)          invoice.cgst          = Number(cgst);
  if (sgst !== undefined)          invoice.sgst          = Number(sgst);
  if (igst !== undefined)          invoice.igst          = Number(igst);
  if (grandTotal !== undefined)    invoice.grandTotal    = Number(grandTotal);
  if (paymentMode !== undefined)   invoice.paymentMode   = paymentMode;
  if (status !== undefined)        invoice.status        = status;
  if (tcs !== undefined)           invoice.tcs           = Number(tcs);
  if (tds !== undefined)           invoice.tds           = Number(tds);

  const updated = await invoice.save();
  res.json(updated);
});

// ==============================
// UPDATE STATUS ONLY (BULK-FRIENDLY)
// ==============================
export const updateInvoiceStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const allowed = ["Paid", "Unpaid", "Pending", "Cancelled"];
  if (!status || !allowed.includes(status)) {
    res.status(400);
    throw new Error(`Invalid status. Must be one of: ${allowed.join(", ")}`);
  }

  const invoice = await Invoice.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true }
  );

  if (!invoice) {
    res.status(404);
    throw new Error("Invoice not found");
  }

  res.json({ _id: invoice._id, status: invoice.status });
});

// ==============================
// EXPORT BULK INVOICES (EXCEL)
// ==============================
export const exportBulkInvoices = asyncHandler(async (req, res) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    res.status(400);
    throw new Error("No invoice IDs provided");
  }

  const invoices = await Invoice.find({ _id: { $in: ids } })
    .populate("customerId")
    .sort({ createdAt: -1 });

  if (invoices.length === 0) {
    res.status(404);
    throw new Error("No invoices found for given IDs");
  }

  // All invoices belong to same business — grab first one
  const business = await Business.findById(invoices[0].businessId);
  if (!business) {
    res.status(404);
    throw new Error("Business not found");
  }

  await generateBulkExcel(invoices, business, res);
});

// ==============================
// DOWNLOAD INVOICE PDF
// ==============================
export const getInvoicePDF = asyncHandler(async (req, res) => {
  const invoiceId = req.params.id;
  console.log(`🔍 [PDF Request] Find Invoice: ${invoiceId}`);

  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) {
    res.status(404);
    throw new Error("Invoice not found");
  }

  let business = await Business.findById(invoice.businessId);
  if (!business) {
    res.status(404);
    throw new Error(`Business (ID: ${invoice.businessId}) not found. Cannot generate Invoice.`);
  }

  let customer = await Customer.findById(invoice.customerId);
  if (!customer) {
    console.warn(`⚠️ Customer ${invoice.customerId} missing. Using placeholder.`);
    customer = {
      name: "Deleted Customer",
      email: "N/A",
      phone: "N/A",
      address: "Address not available",
      gstNumber: "N/A",
    };
  }

  console.log("✅ Data ready. Generating PDF...");
  await generateInvoicePDF(invoice, business, customer, res);
});

// ==============================
// DOWNLOAD INVOICE EXCEL (SINGLE)
// ==============================
export const getInvoiceExcel = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);
  const business = await Business.findById(invoice.businessId);
  const customer = await Customer.findById(invoice.customerId);

  if (!invoice || !business) {
    res.status(404);
    throw new Error("Data not found");
  }

  await generateInvoiceExcel(invoice, business, customer, res);
});

// Add this to your existing controller file
export const deleteInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);

  if (!invoice) {
    res.status(404);
    throw new Error("Invoice not found");
  }

  // Optional: Check if the business owner is the one deleting
  // if (invoice.businessId.toString() !== req.user.businessId) { ... }

  await Invoice.findByIdAndDelete(req.params.id);

  res.json({ message: "Invoice deleted successfully" });
});

// Also add a Bulk Delete handler if you want to use the bulk feature
export const bulkDeleteInvoices = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  
  if (!ids || ids.length === 0) {
    res.status(400);
    throw new Error("No IDs provided");
  }

  await Invoice.deleteMany({ _id: { $in: ids } });

  res.json({ message: `${ids.length} invoices deleted` });
});