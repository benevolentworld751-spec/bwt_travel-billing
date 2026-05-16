import express from "express";
import {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  updateInvoiceStatus,
  exportBulkInvoices,
  getInvoicePDF,
  getInvoiceExcel,
  deleteInvoice,
  bulkDeleteInvoices
} from "../controllers/invoiceController.js";

const router = express.Router();

// ── List & Create ──────────────────────────────
router.get("/",          getInvoices);
router.post("/",         createInvoice);

// ── Bulk Export (must be before /:id routes) ──
router.post("/export-bulk", exportBulkInvoices);

// ── Single Invoice CRUD ────────────────────────
router.get("/:id",       getInvoiceById);
router.put("/:id",       updateInvoice);
router.patch("/:id/status", updateInvoiceStatus);

// ── Downloads ─────────────────────────────────
router.get("/:id/pdf",   getInvoicePDF);
router.get("/:id/excel", getInvoiceExcel);

router.delete('/:id', deleteInvoice);

// Route for bulk delete
router.post('/bulk-delete', bulkDeleteInvoices);

export default router;