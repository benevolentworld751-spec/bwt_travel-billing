import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import Counter from "../models/Counter.js"; // Ensure this path is correct for your project

// ==============================
// 1. HELPER: Number to Words
// ==============================
function numberToWords(num) {
  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six",
    "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve",
    "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen"
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  if (num < 20) return a[num];
  if (num < 100) return b[Math.floor(num / 10)] + " " + a[num % 10];
  if (num < 1000)
    return a[Math.floor(num / 100)] + " Hundred " + numberToWords(num % 100);
  if (num < 100000)
    return numberToWords(Math.floor(num / 1000)) + " Thousand " + numberToWords(num % 1000);
  if (num < 10000000)
    return numberToWords(Math.floor(num / 100000)) + " Lakh " + numberToWords(num % 100000);
  return numberToWords(Math.floor(num / 10000000)) + " Crore " + numberToWords(num % 10000000);
}

// ==============================
// 2. HELPER: Generate Invoice Number
// ==============================
export const generateInvoiceNumber = async (businessId) => {
  const now = new Date();
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;

  // Find and increment the counter for this business and date
  const counter = await Counter.findOneAndUpdate(
    { businessId, name: "invoice", date: datePart },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const serial = String(counter.seq).padStart(4, '0');
  // Format: INV202602250001
  return `INV${datePart}${serial}`;
};

// ==============================
// 3. MAIN PDF GENERATOR
// ==============================
export const generateInvoicePDF = async (invoice, business, customer, res) => {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });

  // --- Colors ---
  const PRIMARY_COLOR = "#2c3e50"; // Dark Header Background
  const VIOLET_COLOR = "#000080";  // Company Name (Deep Violet/Blue)
  const ROW_COLOR_ODD = "#ecf0f1"; // Light Grey Row
  const TEXT_WHITE = "#ffffff";
  const TEXT_BLACK = "#000000";
  const TEXT_GREY = "#444444";

  // --- Generate Invoice Number if not present ---
  if (!invoice.invoiceNumber) {
    invoice.invoiceNumber = await generateInvoiceNumber(business._id);
  }

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`
  );

  doc.pipe(res);

  // ==============================
  // A. HEADER SECTION
  // ==============================
  
  // 1. Logo (Left)
  if (business.logoUrl) {
    const logoPath = path.join(process.cwd(), business.logoUrl);
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 40, 40, { width: 70 });
    }
  }

  // 2. Company Name (Parallel to Logo, Violet)
  doc.fillColor(VIOLET_COLOR).fontSize(20).font("Helvetica-Bold");
  doc.text(business.name, 120, 50, { width: 300, align: 'left' });

  // 3. Invoice Details (Top Right)
  doc.fillColor(PRIMARY_COLOR).fontSize(20).font("Helvetica-Bold");
  doc.text("TAX INVOICE", 0, 45, { align: "right" });

  doc.fillColor(TEXT_BLACK).fontSize(10).font("Helvetica");
  doc.text(`Invoice #: ${invoice.invoiceNumber}`, { align: "right" });
  doc.text(`Date: ${new Date(invoice.createdAt).toDateString()}`, { align: "right" });

  // ==============================
  // B. ADDRESS SECTION (Parallel Columns)
  // ==============================
  const addressY = 140; 

  // --- Left Side: FROM ---
  doc.fontSize(10).font("Helvetica-Bold").fillColor(TEXT_BLACK);
  doc.text("From:", 40, addressY);
  
  doc.font("Helvetica").fontSize(10).fillColor(TEXT_GREY);
  doc.text(business.address, 40, addressY + 15, { width: 250, align: 'left' });
  
  let leftY = doc.y + 5; 
  doc.text(`GST: ${business.gstNumber || "-"}`, 40, leftY);
  doc.text(`Phone: ${business.phone || "-"}`, 40, leftY + 15);

  // --- Right Side: BILL TO ---
  doc.fontSize(10).font("Helvetica-Bold").fillColor(TEXT_BLACK);
  doc.text("Bill To:", 350, addressY); 
  
  doc.font("Helvetica").fontSize(10).fillColor(TEXT_GREY);
  doc.text(customer.name, 350, addressY + 15);
  doc.text(customer.address || "", 350, doc.y, { width: 200, align: 'left' });
  doc.text(`Phone: ${customer.phone || "-"}`, 350, doc.y + 5);

  // ==============================
  // C. TABLE SECTION
  // ==============================
  const tableTop = 270;
  const rowHeight = 30;
  const pageMargin = 40;
  const tableWidth = 515;

  // 1. Header Background
  doc.rect(pageMargin, tableTop, tableWidth, rowHeight).fill(PRIMARY_COLOR);

  // 2. Header Text
  doc.fillColor(TEXT_WHITE).font("Helvetica-Bold");
  const headerTextY = tableTop + 10;
  
  doc.text("Service", 50, headerTextY);
  doc.text("Description", 150, headerTextY);
  doc.text("Ref/PNR", 350, headerTextY);
  doc.text("Amount", 510, headerTextY, { align: "right" });

  // 3. Rows & Calculations
  let position = tableTop + rowHeight;
  doc.font("Helvetica");

  let subTotal = 0;
  
  invoice.items.forEach((item, index) => {
    const textY = position + 8;
    const itemTotal = Number(item.total || 0);
    subTotal += itemTotal;

    if (index % 2 === 0) {
      doc.rect(pageMargin, position, tableWidth, rowHeight).fill(ROW_COLOR_ODD);
    }
    
    doc.fillColor(TEXT_BLACK);
    doc.text(item.serviceType, 50, textY);
    doc.text(item.description, 150, textY);
    doc.text(item.pnr || "-", 350, textY);
    doc.text(itemTotal.toFixed(2), 510, textY, { align: "right" });

    position += rowHeight;
  });

  doc.strokeColor(PRIMARY_COLOR).lineWidth(1);
  doc.moveTo(pageMargin, position).lineTo(pageMargin + tableWidth, position).stroke();

  // ==============================
  // D. TOTALS & TAX CALCULATION
  // ==============================
  const totalStart = position + 20;

  // Horizontal separator
  doc.strokeColor(PRIMARY_COLOR).lineWidth(1);
  doc.moveTo(300, totalStart).lineTo(555, totalStart).stroke();
  doc.fillColor(TEXT_BLACK);

  // Helper for totals
  const printTotal = (label, value, y, isBold = false) => {
    if(isBold) doc.font("Helvetica-Bold");
    else doc.font("Helvetica");
    doc.text(label, 350, y);
    // Explicit width prevents wrapping, align right ensures numbers align
    doc.text(Number(value).toFixed(2), 405, y, { width: 150, align: "right" });
  };

  printTotal("Subtotal:", subTotal, totalStart + 15);
  printTotal("CGST:", invoice.cgst || 0, totalStart + 30);
  printTotal("SGST:", invoice.sgst || 0, totalStart + 45);
  printTotal("IGST:", invoice.igst || 0, totalStart + 60);

  // --- GRAND TOTAL FIX ---
  const grandTotal = invoice.grandTotal || (subTotal + (invoice.cgst||0) + (invoice.sgst||0) + (invoice.igst||0));
  
  // Background Box
  doc.rect(340, totalStart + 80, 215, 28).fill(ROW_COLOR_ODD);
  doc.fillColor(PRIMARY_COLOR).font("Helvetica-Bold").fontSize(14);
  
  // Label
  doc.text("Grand Total:", 350, totalStart + 87);
  
  // Value (Fixed Alignment)
  // We use x=405 and width=150 to create a "box" ending at 555. 
  // This prevents the number from hitting the margin and splitting vertically.
  doc.text(grandTotal.toFixed(2), 405, totalStart + 87, { width: 150, align: "right" });

  // ==============================
  // E. FOOTER DETAILS
  // ==============================
  doc.fillColor(TEXT_BLACK);
  
  // 1. Amount in Words
  doc.fontSize(10).font("Helvetica-Bold");
  doc.text("Amount in Words:", 40, totalStart + 120);
  doc.font("Helvetica-Oblique");
  doc.text(`${numberToWords(Math.floor(grandTotal))} Only`, 135, totalStart + 120);

  // 2. Bank Details
  const bankY = totalStart + 150;
  doc.font("Helvetica-Bold").text("Bank Details:", 40, bankY);
  doc.font("Helvetica");
  doc.text(`Bank: ${business.bankDetails?.bankName || "-"}`, 40, bankY + 15);
  doc.text(`A/C No: ${business.bankDetails?.accountNumber || "-"}`, 40, bankY + 30);
  doc.text(`IFSC: ${business.bankDetails?.ifsc || "-"}`, 40, bankY + 45);

  // 3. Signature
  if (business.signatureUrl && fs.existsSync(path.join(process.cwd(), business.signatureUrl))) {
      doc.image(path.join(process.cwd(), business.signatureUrl), 380, totalStart + 200, { width: 120 });
  } else {
      doc.moveTo(380, totalStart + 200).lineTo(550, totalStart + 200).stroke();
      doc.text("Authorized Signatory", 420, totalStart + 205);
  }

  // 4. Watermark
  doc.save();
  doc.fontSize(50);
  doc.fillColor("#f2f2f2");
  doc.opacity(0.15);
  doc.text(business.name, 0, 400, { align: "center" });
  doc.restore();

  doc.end();
};