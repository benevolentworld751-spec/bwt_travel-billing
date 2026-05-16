import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import Counter from "../models/Counter.js";

// --- 1. EXPORT THIS FUNCTION ---
export const generateInvoiceNumber = async (businessId) => {
  const now = new Date();
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const counter = await Counter.findOneAndUpdate(
    { businessId, name: "invoice", date: datePart },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `INV/${datePart}/${String(counter.seq).padStart(3, '0')}`;
};


// 1. HELPER: Number to Words
function numberToWords(num) {
  const a = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const format = (n) => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
    if (n < 1000) return a[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " " + format(n % 100) : "");
    if (n < 100000) return format(Math.floor(n / 1000)) + " Thousand" + (n % 1000 !== 0 ? " " + format(n % 1000) : "");
    if (n < 10000000) return format(Math.floor(n / 100000)) + " Lakh" + (n % 100000 !== 0 ? " " + format(n % 100000) : "");
    return format(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 !== 0 ? " " + format(n % 10000000) : "");
  };
  return format(Math.floor(num));
}

export const generateInvoicePDF = async (invoice, business, customer, res) => {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });

  // Styles (Matching the provided Image)
  const DARK_NAVY = "#0f172a"; 
  const ACCENT_BLUE = "#3498db";
  const BORDER_COLOR = "#e2e8f0";
  const TEXT_MAIN = "#1e293b";

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=Invoice-${invoice.invoiceNumber}.pdf`);
  doc.pipe(res);

  // --- HEADER ---
  const headerY = 40;
  if (business.logoUrl) {
    const logoPath = path.join(process.cwd(), business.logoUrl);
    if (fs.existsSync(logoPath)) doc.image(logoPath, 40, headerY, { width: 55 });
  }

  doc.fillColor(DARK_NAVY).fontSize(16).font("Helvetica-Bold")
     .text(business.name.toUpperCase(), 110, headerY + 12);
  
  doc.fillColor(ACCENT_BLUE).fontSize(26).font("Helvetica-Bold")
     .text("TAX INVOICE", 0, headerY, { align: "right" });

  doc.fillColor(TEXT_MAIN).fontSize(9).font("Helvetica-Bold");
  doc.text(`Invoice Number: `, 380, headerY + 38, { continued: true }).font("Helvetica").text(invoice.invoiceNumber);
  doc.font("Helvetica-Bold").text(`Date: `, 380, headerY + 52, { continued: true }).font("Helvetica").text(new Date(invoice.invoiceDate).toDateString());

  doc.moveTo(40, 115).lineTo(555, 115).strokeColor(BORDER_COLOR).stroke();

  // --- ADDRESS SECTION ---
  const addressY = 135;
  doc.fontSize(7).font("Helvetica-Bold").fillColor("#64748b").text("FROM:", 40, addressY);
  doc.fontSize(9).font("Helvetica-Bold").fillColor(DARK_NAVY).text(business.name, 40, addressY + 12);
  doc.fontSize(8).font("Helvetica").fillColor(TEXT_MAIN).text(business.address || "", 40, addressY + 24, { width: 230 });
  doc.text(`GSTIN: ${business.gstNumber || "N/A"}`, 40, doc.y + 3);
  doc.text(`Contact: ${business.phone || "N/A"}`, 40, doc.y + 2);

  doc.fontSize(7).font("Helvetica-Bold").fillColor("#64748b").text("BILL TO:", 320, addressY);
  doc.fontSize(9).font("Helvetica-Bold").fillColor(DARK_NAVY).text(customer.name, 320, addressY + 12);
  doc.fontSize(8).font("Helvetica").fillColor(TEXT_MAIN).text(customer.address || "N/A", 320, addressY + 24, { width: 230 });
  doc.text(`GSTIN: ${customer.gstNumber || "N/A"}`, 320, doc.y + 3);
  doc.text(`Contact: ${customer.phone || "N/A"}`, 320, doc.y + 2);

  // --- TABLE SECTION ---
  const tableTop = 230;
  doc.rect(40, tableTop, 515, 22).fill(DARK_NAVY);
  doc.fillColor("#ffffff").fontSize(8).font("Helvetica-Bold");
  
  doc.text("SERVICE", 45, tableTop + 7);
  doc.text("NAME", 95, tableTop + 7);
  doc.text("DATE", 195, tableTop + 7);
  doc.text("DESC", 265, tableTop + 7);
  doc.text("PNR/REF", 345, tableTop + 7);
  doc.text("FARE", 420, tableTop + 7, { width: 40, align: "right" });
  doc.text("TAX", 470, tableTop + 7, { width: 30, align: "right" });
  doc.text("TOTAL", 510, tableTop + 7, { width: 40, align: "right" });

  let pos = tableTop + 22;
  invoice.items.forEach((item, i) => {
    if (i % 2 === 0) doc.rect(40, pos, 515, 22).fill("#f8fafc");
    doc.fillColor(TEXT_MAIN).font("Helvetica").fontSize(8);
    doc.text(item.serviceType, 45, pos + 7);
    doc.text(item.Cname, 95, pos + 7, { width: 95, ellipsis: true });
    doc.text(new Date(item.date).toLocaleDateString('en-GB'), 195, pos + 7);
    doc.text(item.description, 265, pos + 7, { width: 75 });
    doc.text(item.pnr || "-", 345, pos + 7);
    doc.text(item.fare.toFixed(2), 420, pos + 7, { width: 40, align: "right" });
    doc.text(Number(item.tax || 0) === 0 ? "00" : item.tax.toFixed(2), 470, pos + 7, { width: 30, align: "right" });
    doc.text(item.total.toFixed(2), 510, pos + 7, { width: 40, align: "right" });
    pos += 22;
  });

  // --- SUMMARY SECTION (SC + GST Logic) ---
  const summaryY = pos + 30;
  doc.fontSize(7).font("Helvetica-Bold").fillColor("#64748b").text("AMOUNT IN WORDS:", 40, summaryY);
  doc.fontSize(8).font("Helvetica-Bold").fillColor(DARK_NAVY).text(`${numberToWords(invoice.grandTotal)} RUPEES ONLY`.toUpperCase(), 40, summaryY + 12, { width: 250 });

  let rightY = summaryY;
  const drawRow = (label, value) => {
    doc.fontSize(9).font("Helvetica").fillColor(TEXT_MAIN).text(label, 380, rightY);
    doc.text(`INR ${value.toFixed(2)}`, 480, rightY, { width: 75, align: "right" });
    rightY += 18;
  };

  drawRow("Subtotal", invoice.subTotal);
  drawRow("SC", invoice.serviceCharge || 0);

  const rate = (invoice.taxRate / 2).toFixed(1);
  if (invoice.igst > 0) {
    drawRow(`IGST(${invoice.taxRate}%)`, invoice.igst);
  } else {
    drawRow(`CGST(${rate}%)`, invoice.cgst || 0);
    drawRow(`SGST(${rate}%)`, invoice.sgst || 0);
  }

  // NET PAYABLE Block
  doc.rect(340, rightY + 5, 215, 26).fill(DARK_NAVY);
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(11).text("NET PAYABLE", 350, rightY + 13);
  doc.text(`INR ${invoice.grandTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}`, 450, rightY + 13, { width: 100, align: "right" });

  // --- FOOTER ---
  const footerY = 700;
  doc.rect(40, footerY, 220, 70).strokeColor(BORDER_COLOR).stroke();
  doc.fillColor("#64748b").fontSize(7).font("Helvetica-Bold").text("BANK ACCOUNT DETAILS", 50, footerY + 10);
  doc.fillColor(TEXT_MAIN).font("Helvetica").fontSize(8);
  doc.text(`Bank: ${business.bankDetails?.bankName || "N/A"}`, 50, footerY + 24);
  doc.text(`A/c No: ${business.bankDetails?.accountNumber || "N/A"}`, 50, footerY + 36);
  doc.text(`IFSC: ${business.bankDetails?.ifsc || "N/A"}`, 50, footerY + 48);

  doc
  .fillColor(DARK_NAVY)
  .fontSize(9)
  .font("Helvetica-Bold")
  .text(`FOR ${business.name.toUpperCase()}`, 380, footerY + 10, {
    align: "center",
    width: 175,
  });

// Signature Name in Italic
doc
  .fontSize(16)
  .font("Helvetica-Oblique")
  .text("Muddasir Khan", 380, footerY + 45, {
    align: "center",
    width: 175,
  });

// Authorized Signatory Text
doc
  .fontSize(9)
  .font("Helvetica")
  .text("Authorized Signatory", 380, footerY + 70, {
    align: "center",
    width: 175,
  });
  doc.end();
};