import asyncHandler from "express-async-handler";
import Invoice from "../models/Invoice.js";
import Business from "../models/Business.js";
import Customer from "../models/Customer.js";
import { generateInvoicePDF, generateInvoiceNumber } from "../services/pdfService.js";

// ==============================
// CREATE INVOICE
// ==============================
export const createInvoice = asyncHandler(async (req, res) => {
  const {
    businessId,
    customerId,
    items,
    paymentMode,
    status = "Pending",
    isInterState = false,
    tcs = 0,
    tds = 0,
  } = req.body;

  // Validate required fields
  if (!businessId || !customerId || !items || items.length === 0) {
    res.status(400);
    throw new Error("Missing required fields or no items provided");
  }

  // Generate invoice number safely
  const invoiceNumber = await generateInvoiceNumber(businessId);

  // GST calculation
  let subTotal = 0, cgst = 0, sgst = 0, igst = 0;

  const taxRate = 0.18; // default 18%
  const processedItems = items.map(item => {
    const itemTotal = Number(item.total || 0);
    subTotal += itemTotal;

    let itemCgst = 0, itemSgst = 0, itemIgst = 0;
    if (isInterState) {
      itemIgst = itemTotal * taxRate;
    } else {
      itemCgst = itemTotal * (taxRate / 2);
      itemSgst = itemTotal * (taxRate / 2);
    }

    cgst += itemCgst;
    sgst += itemSgst;
    igst += itemIgst;

    return {
      ...item,
      cgst: itemCgst,
      sgst: itemSgst,
      igst: itemIgst,
    };
  });

  const grandTotal = subTotal + cgst + sgst + igst + Number(tcs) - Number(tds);

  // Create invoice in DB
  const invoice = await Invoice.create({
    businessId,
    customerId,
    invoiceNumber,
    items: processedItems,
    subTotal,
    cgst,
    sgst,
    igst,
    tcs,
    tds,
    grandTotal,
    paymentMode,
    status,
    isInterState,
  });

  res.status(201).json(invoice);
});

// ==============================
// DOWNLOAD INVOICE PDF
// ==============================
export const getInvoicePDF = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);

  if (!invoice) {
    res.status(404);
    throw new Error("Invoice not found");
  }

  const business = await Business.findById(invoice.businessId);
  const customer = await Customer.findById(invoice.customerId);

  if (!business || !customer) {
    res.status(404);
    throw new Error("Business or Customer not found");
  }

  // Generate PDF on-the-fly
  await generateInvoicePDF(invoice, business, customer, res);
});