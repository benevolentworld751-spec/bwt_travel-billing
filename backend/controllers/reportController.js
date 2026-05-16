import asyncHandler from "express-async-handler";
import Invoice from "../models/Invoice.js";
import Customer from "../models/Customer.js";
import ExcelJS from "exceljs";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getPeriodRange = (period, customFrom, customTo) => {
  const now = new Date();
  let from, to;
  switch (period) {
    case "this_month":
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      to   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      break;
    case "last_month":
      from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      to   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      break;
    case "3_months":
      from = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      to   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      break;
    case "6_months":
      from = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      to   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      break;
    case "this_year":
      from = new Date(now.getFullYear(), 0, 1);
      to   = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
      break;
    case "last_year":
      from = new Date(now.getFullYear() - 1, 0, 1);
      to   = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
      break;
    case "custom":
      from = new Date(customFrom);
      to   = new Date(customTo);
      to.setHours(23, 59, 59);
      break;
    default:
      from = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      to   = new Date();
  }
  return { from, to };
};

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export const getDashboardStats = asyncHandler(async (req, res) => {
  const { businessId } = req.query;
  if (!businessId) { res.status(400); throw new Error("businessId required"); }

  const now             = new Date();
  const thisMonthStart  = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart  = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd    = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const [allInvoices, totalCustomers] = await Promise.all([
    Invoice.find({ businessId }).populate("customerId", "name"),
    Customer.countDocuments({ businessId }),
  ]);

  const totalRevenue    = allInvoices.filter(i => i.status === "Paid").reduce((s, i) => s + (i.grandTotal || 0), 0);
  const pendingPayments = allInvoices.filter(i => i.status !== "Paid").reduce((s, i) => s + (i.grandTotal || 0), 0);
  const totalBookings   = allInvoices.length;

  const thisMonthRev = allInvoices
    .filter(i => i.status === "Paid" && new Date(i.invoiceDate) >= thisMonthStart)
    .reduce((s, i) => s + (i.grandTotal || 0), 0);

  const lastMonthRev = allInvoices
    .filter(i => i.status === "Paid" && new Date(i.invoiceDate) >= lastMonthStart && new Date(i.invoiceDate) <= lastMonthEnd)
    .reduce((s, i) => s + (i.grandTotal || 0), 0);

  const revTrendNum = lastMonthRev === 0 ? 100 : ((thisMonthRev - lastMonthRev) / lastMonthRev * 100);
  const revTrend    = (revTrendNum >= 0 ? "+" : "") + revTrendNum.toFixed(1) + "%";

  // Last 6 months chart
  const chartData = [];
  for (let i = 5; i >= 0; i--) {
    const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mEnd   = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    const amt    = allInvoices
      .filter(inv => { const d = new Date(inv.invoiceDate); return d >= mStart && d <= mEnd; })
      .reduce((s, inv) => s + (inv.grandTotal || 0), 0);
    chartData.push({ name: MONTH_NAMES[mStart.getMonth()], amount: Math.round(amt) });
  }

  const recentInvoices = allInvoices
    .sort((a, b) => new Date(b.invoiceDate) - new Date(a.invoiceDate))
    .slice(0, 5)
    .map(inv => ({
      _id:           inv._id,
      invoiceNumber: inv.invoiceNumber,
      customerName:  inv.customerId?.name || "N/A",
      grandTotal:    inv.grandTotal,
      status:        inv.status,
      invoiceDate:   inv.invoiceDate,
    }));

  const pendingCount = allInvoices.filter(i => i.status !== "Paid").length;

  res.json({ totalRevenue, pendingPayments, totalBookings, totalCustomers, revTrend, pendingCount, chartData, recentInvoices });
});

// ─── Export Report (Excel) ────────────────────────────────────────────────────

export const exportReport = asyncHandler(async (req, res) => {
  const { businessId, period, customFrom, customTo } = req.query;
  if (!businessId) { res.status(400); throw new Error("businessId required"); }

  const { from, to } = getPeriodRange(period, customFrom, customTo);

  const invoices = await Invoice.find({
    businessId,
    invoiceDate: { $gte: from, $lte: to },
  })
    .populate("customerId", "name phone email")
    .sort({ invoiceDate: 1 });

  // ── Styles ────────────────────────────────────────────────────────────────
  const DARK  = "FF0F172A";
  const BLUE  = "FF2563EB";
  const LIGHT = "FFF8FAFC";
  const WHITE = "FFFFFFFF";
  const GREEN = "FF059669";
  const AMBER = "FFD97706";
  const SLATE = "FF64748B";
  const INDIGO = "FF4F46E5";

  const bold  = (size = 10, color = DARK) => ({ name: "Arial", bold: true,  size, color: { argb: color } });
  const reg   = (size = 9,  color = DARK) => ({ name: "Arial", bold: false, size, color: { argb: color } });
  const mono  = (size = 9,  color = BLUE) => ({ name: "Courier New", bold: true, size, color: { argb: color } });
  const fill  = (argb)                    => ({ type: "pattern", pattern: "solid", fgColor: { argb } });
  const money = '"₹"#,##0.00';
  const center = { horizontal: "center", vertical: "middle" };
  const right  = { horizontal: "right",  vertical: "middle" };
  const left   = { horizontal: "left",   vertical: "middle" };
  const thin   = (c = "FFE2E8F0") => ({
    top:    { style: "thin", color: { argb: c } },
    bottom: { style: "thin", color: { argb: c } },
    left:   { style: "thin", color: { argb: c } },
    right:  { style: "thin", color: { argb: c } },
  });

  const periodLabel = {
    this_month: "This Month",
    last_month: "Last Month",
    "3_months": "Last 3 Months",
    "6_months": "Last 6 Months",
    this_year:  "This Year",
    last_year:  "Last Year",
    custom:     `${new Date(customFrom).toLocaleDateString("en-GB")} – ${new Date(customTo).toLocaleDateString("en-GB")}`,
  }[period] || "Custom Period";

  // ── Pre-calculate all totals ──────────────────────────────────────────────
  // KEY FIX: We pass { formula, result } to ExcelJS so the value shows
  // immediately when opened, AND the formula remains for recalculation.
  const totalBaseFare = invoices.reduce((s, i) => s + Number(i.subTotal      || 0), 0);
  const totalSC       = invoices.reduce((s, i) => s + Number(i.serviceCharge || 0), 0);
  const totalCGST     = invoices.reduce((s, i) => s + Number(i.cgst          || 0), 0);
  const totalSGST     = invoices.reduce((s, i) => s + Number(i.sgst          || 0), 0);
  const totalIGST     = invoices.reduce((s, i) => s + Number(i.igst          || 0), 0);
  const totalGrand    = invoices.reduce((s, i) => s + Number(i.grandTotal    || 0), 0);
  const totalPaid     = invoices.filter(i => i.status === "Paid").reduce((s, i) => s + (i.grandTotal || 0), 0);
  const totalUnpaid   = invoices.filter(i => i.status !== "Paid").reduce((s, i) => s + (i.grandTotal || 0), 0);
  const totalGST      = totalCGST + totalSGST + totalIGST;

  const wb = new ExcelJS.Workbook();
  wb.creator = "TravelBill";
  wb.created = new Date();

  // ══════════════════════════════════════════════════════════════════════════
  // SHEET 1 — Invoice Ledger
  // ══════════════════════════════════════════════════════════════════════════
  const ledger = wb.addWorksheet("Invoice Ledger");
  ledger.views = [{ state: "frozen", ySplit: 6 }];

  ledger.columns = [
    { key: "no",          width: 5  },
    { key: "invoice",     width: 20 },
    { key: "date",        width: 13 },
    { key: "customer",    width: 28 },
    { key: "service",     width: 10 },
    { key: "pax",         width: 22 },
    { key: "pnr",         width: 14 },
    { key: "description", width: 20 },
    { key: "baseFare",    width: 14 },
    { key: "sc",          width: 13 },
    { key: "cgst",        width: 10 },
    { key: "sgst",        width: 10 },
    { key: "igst",        width: 10 },
    { key: "grand",       width: 16 },
    { key: "status",      width: 11 },
    { key: "payment",     width: 14 },
  ];

  // Row 1 — Title
  ledger.mergeCells("A1:P1");
  Object.assign(ledger.getCell("A1"), {
    value: "TAX INVOICE LEDGER REPORT",
    font: bold(14, WHITE), fill: fill(DARK), alignment: center,
  });
  ledger.getRow(1).height = 30;

  // Row 2 — Period / count info
  ledger.mergeCells("A2:I2");
  Object.assign(ledger.getCell("A2"), {
    value: `Period: ${periodLabel}   |   Generated: ${new Date().toLocaleDateString("en-GB")}`,
    font: reg(9, WHITE), fill: fill("FF1E293B"), alignment: left,
  });
  ledger.mergeCells("J2:P2");
  Object.assign(ledger.getCell("J2"), {
    value: `${invoices.length} Invoice(s)   |   From ${from.toLocaleDateString("en-GB")} to ${to.toLocaleDateString("en-GB")}`,
    font: reg(9, WHITE), fill: fill("FF1E293B"), alignment: right,
  });
  ledger.getRow(2).height = 18;

  // Rows 3–4 — KPI summary boxes
  const kpis = [
    { label: "TOTAL REVENUE", value: totalGrand,  color: DARK  },
    { label: "PAID",          value: totalPaid,   color: GREEN },
    { label: "OUTSTANDING",   value: totalUnpaid, color: AMBER },
    { label: "SERVICE CHG",   value: totalSC,     color: SLATE },
    { label: "TOTAL GST",     value: totalGST,    color: SLATE },
  ];
  // Map 5 KPIs across 16 columns (cols A-C, D-F, G-I, J-L, M-P)
  const kpiRanges = [["A","C"],["D","F"],["G","I"],["J","L"],["M","P"]];
  kpis.forEach(({ label, value, color }, i) => {
    const [s, e] = kpiRanges[i];
    ledger.mergeCells(`${s}3:${e}3`);
    ledger.mergeCells(`${s}4:${e}4`);
    Object.assign(ledger.getCell(`${s}3`), {
      value: label, font: bold(8, SLATE), fill: fill(LIGHT), alignment: center,
    });
    Object.assign(ledger.getCell(`${s}4`), {
      value, numFmt: money, font: bold(11, color), fill: fill(WHITE), alignment: center,
    });
  });
  ledger.getRow(3).height = 16;
  ledger.getRow(4).height = 24;

  // Row 5 — spacer
  ledger.getRow(5).height = 6;

  // Row 6 — Column headers
  const hdrRow = ledger.getRow(6);
  hdrRow.values = ["#","INVOICE NO","DATE","CLIENT","SERVICE","PAX NAME","PNR/REF","DESCRIPTION",
                   "BASE FARE","SERVICE CH","CGST","SGST","IGST","GRAND TOTAL","STATUS","PAYMENT"];
  hdrRow.eachCell(cell => {
    cell.font = bold(8, WHITE); cell.fill = fill(DARK);
    cell.alignment = center; cell.border = thin(DARK);
  });
  hdrRow.height = 22;

  // Data rows (start row 7)
  const DATA_START = 7;
  invoices.forEach((inv, idx) => {
    const bg  = idx % 2 === 0 ? LIGHT : WHITE;
    const row = ledger.addRow([
      idx + 1,
      inv.invoiceNumber,
      new Date(inv.invoiceDate).toLocaleDateString("en-GB"),
      (inv.customerId?.name || "N/A").toUpperCase(),
      inv.items?.[0]?.serviceType || "-",
      inv.items?.[0]?.Cname       || "-",
      inv.items?.[0]?.pnr         || "-",
      inv.items?.[0]?.description || "-",
      Number(inv.subTotal      || 0),
      Number(inv.serviceCharge || 0),
      Number(inv.cgst          || 0),
      Number(inv.sgst          || 0),
      Number(inv.igst          || 0),
      Number(inv.grandTotal    || 0),
      inv.status      || "-",
      inv.paymentMode || "-",
    ]);

    row.eachCell((cell, c) => {
      cell.fill = fill(bg); cell.border = thin();
      cell.alignment = { vertical: "middle", horizontal: c <= 4 ? "left" : "center" };
      cell.font = reg(9);
    });
    row.getCell(2).font = mono(9, BLUE);    // Invoice number in blue mono
    [9, 10, 11, 12, 13, 14].forEach(c => {
      row.getCell(c).numFmt    = money;
      row.getCell(c).alignment = right;
    });
    // Status colour
    const sc = row.getCell(15);
    sc.font = bold(8, inv.status === "Paid" ? GREEN : AMBER);
    sc.alignment = center;
    row.height = 18;
  });

  // Totals row — KEY FIX: use { formula, result } so value shows immediately
  const DATA_END = DATA_START + invoices.length - 1;
  const fml = (col) => ({
    formula: `SUM(${col}${DATA_START}:${col}${DATA_END})`,
    result:  invoices.reduce((s, i) => {
      const map = { I: "subTotal", J: "serviceCharge", K: "cgst", L: "sgst", M: "igst", N: "grandTotal" };
      return s + Number(i[map[col]] || 0);
    }, 0),
  });

  const totRow = ledger.addRow([
    "", "TOTAL", "", "", "", "", "", "",
    fml("I"), fml("J"), fml("K"), fml("L"), fml("M"), fml("N"), "", "",
  ]);
  totRow.eachCell(cell => {
    cell.fill = fill(DARK); cell.font = bold(9, WHITE); cell.alignment = center;
  });
  [9, 10, 11, 12, 13, 14].forEach(c => {
    totRow.getCell(c).numFmt    = money;
    totRow.getCell(c).alignment = right;
  });
  totRow.height = 22;

  ledger.autoFilter = { from: { row: 6, column: 1 }, to: { row: 6, column: 16 } };

  // ══════════════════════════════════════════════════════════════════════════
  // SHEET 2 — Monthly Summary
  // ══════════════════════════════════════════════════════════════════════════
  const summary = wb.addWorksheet("Monthly Summary");
  summary.columns = [
    { key: "month",    width: 16 },
    { key: "invoices", width: 12 },
    { key: "paid",     width: 18 },
    { key: "unpaid",   width: 18 },
    { key: "revenue",  width: 20 },
    { key: "sc",       width: 16 },
    { key: "gst",      width: 16 },
  ];

  summary.mergeCells("A1:G1");
  Object.assign(summary.getCell("A1"), {
    value: "MONTHLY REVENUE SUMMARY", font: bold(13, WHITE),
    fill: fill(BLUE), alignment: center,
  });
  summary.getRow(1).height = 28;

  summary.mergeCells("A2:G2");
  Object.assign(summary.getCell("A2"), {
    value: `Period: ${periodLabel}`, font: reg(9, SLATE),
    fill: fill(LIGHT), alignment: center,
  });
  summary.getRow(2).height = 16;

  // Blank row 3
  summary.getRow(3).height = 8;

  const sHdr = summary.getRow(4);
  sHdr.values = ["MONTH","INVOICES","PAID AMT (₹)","OUTSTANDING (₹)","GROSS REVENUE (₹)","SERVICE CHG (₹)","GST (₹)"];
  sHdr.eachCell(cell => {
    cell.font = bold(9, WHITE); cell.fill = fill(DARK);
    cell.alignment = center; cell.border = thin(DARK);
  });
  sHdr.height = 22;

  // Group by month
  const monthlyMap = {};
  invoices.forEach(inv => {
    const d   = new Date(inv.invoiceDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!monthlyMap[key]) monthlyMap[key] = [];
    monthlyMap[key].push(inv);
  });

  const sortedMonths = Object.keys(monthlyMap).sort();
  const S_DATA_START = 5;

  sortedMonths.forEach((key, idx) => {
    const [year, month] = key.split("-");
    const mis   = monthlyMap[key];
    const paid  = mis.filter(i => i.status === "Paid").reduce((s, i) => s + (i.grandTotal || 0), 0);
    const unp   = mis.filter(i => i.status !== "Paid").reduce((s, i) => s + (i.grandTotal || 0), 0);
    const gross = mis.reduce((s, i) => s + (i.grandTotal || 0), 0);
    const sc    = mis.reduce((s, i) => s + (i.serviceCharge || 0), 0);
    const gst   = mis.reduce((s, i) => s + (i.cgst || 0) + (i.sgst || 0) + (i.igst || 0), 0);

    const row = summary.addRow([
      `${MONTH_NAMES[parseInt(month) - 1]} ${year}`,
      mis.length, paid, unp, gross, sc, gst,
    ]);
    const bg = idx % 2 === 0 ? LIGHT : WHITE;
    row.eachCell(cell => {
      cell.fill = fill(bg); cell.border = thin(); cell.alignment = center; cell.font = reg(9);
    });
    [3, 4, 5, 6, 7].forEach(c => { row.getCell(c).numFmt = money; });
    row.height = 18;
  });

  // Totals — use { formula, result }
  const S_DATA_END = S_DATA_START + sortedMonths.length - 1;
  const sFml = (col, vals) => ({
    formula: `SUM(${col}${S_DATA_START}:${col}${S_DATA_END})`,
    result:  vals,
  });

  const sTotRow = summary.addRow([
    "TOTAL",
    { formula: `SUM(B${S_DATA_START}:B${S_DATA_END})`, result: invoices.length },
    sFml("C", totalPaid),
    sFml("D", totalUnpaid),
    sFml("E", totalGrand),
    sFml("F", totalSC),
    sFml("G", totalGST),
  ]);
  sTotRow.eachCell(cell => {
    cell.fill = fill(DARK); cell.font = bold(9, WHITE); cell.alignment = center;
  });
  [3, 4, 5, 6, 7].forEach(c => { sTotRow.getCell(c).numFmt = money; });
  sTotRow.height = 22;

  // ══════════════════════════════════════════════════════════════════════════
  // SHEET 3 — Client Summary
  // ══════════════════════════════════════════════════════════════════════════
  const clients = wb.addWorksheet("Client Summary");
  clients.columns = [
    { key: "rank",        width: 5  },
    { key: "client",      width: 32 },
    { key: "invoices",    width: 12 },
    { key: "paid",        width: 18 },
    { key: "outstanding", width: 18 },
    { key: "total",       width: 20 },
  ];

  clients.mergeCells("A1:F1");
  Object.assign(clients.getCell("A1"), {
    value: "CLIENT-WISE REVENUE SUMMARY", font: bold(13, WHITE),
    fill: fill(INDIGO), alignment: center,
  });
  clients.getRow(1).height = 28;

  clients.mergeCells("A2:F2");
  Object.assign(clients.getCell("A2"), {
    value: `Period: ${periodLabel}`, font: reg(9, SLATE),
    fill: fill(LIGHT), alignment: center,
  });
  clients.getRow(2).height = 16;

  clients.getRow(3).height = 8;

  const cHdr = clients.getRow(4);
  cHdr.values = ["#","CLIENT NAME","INVOICES","PAID (₹)","OUTSTANDING (₹)","TOTAL REVENUE (₹)"];
  cHdr.eachCell(cell => {
    cell.font = bold(9, WHITE); cell.fill = fill(DARK);
    cell.alignment = center; cell.border = thin(DARK);
  });
  cHdr.height = 22;

  // Group by customer
  const clientMap = {};
  invoices.forEach(inv => {
    const name = inv.customerId?.name || "Unknown";
    if (!clientMap[name]) clientMap[name] = [];
    clientMap[name].push(inv);
  });

  const sortedClients = Object.entries(clientMap)
    .map(([name, invs]) => ({
      name,
      count: invs.length,
      paid:  invs.filter(i => i.status === "Paid").reduce((s, i) => s + (i.grandTotal || 0), 0),
      outstd:invs.filter(i => i.status !== "Paid").reduce((s, i) => s + (i.grandTotal || 0), 0),
      total: invs.reduce((s, i) => s + (i.grandTotal || 0), 0),
    }))
    .sort((a, b) => b.total - a.total);

  sortedClients.forEach((c, idx) => {
    const row = clients.addRow([idx + 1, c.name.toUpperCase(), c.count, c.paid, c.outstd, c.total]);
    const bg  = idx % 2 === 0 ? LIGHT : WHITE;
    row.eachCell(cell => {
      cell.fill = fill(bg); cell.border = thin(); cell.alignment = center; cell.font = reg(9);
    });
    row.getCell(2).alignment = left;
    [4, 5, 6].forEach(ci => { row.getCell(ci).numFmt = money; });
    row.height = 18;
  });

  // Client totals — use { formula, result }
  const C_START = 5;
  const C_END   = 4 + sortedClients.length;
  const cTotRow = clients.addRow([
    "", "TOTAL",
    { formula: `SUM(C${C_START}:C${C_END})`, result: invoices.length },
    { formula: `SUM(D${C_START}:D${C_END})`, result: totalPaid   },
    { formula: `SUM(E${C_START}:E${C_END})`, result: totalUnpaid },
    { formula: `SUM(F${C_START}:F${C_END})`, result: totalGrand  },
  ]);
  cTotRow.eachCell(cell => {
    cell.fill = fill(DARK); cell.font = bold(9, WHITE); cell.alignment = center;
  });
  [4, 5, 6].forEach(c => { cTotRow.getCell(c).numFmt = money; });
  cTotRow.height = 22;

  // ── Send ──────────────────────────────────────────────────────────────────
  const filename = `TravelBill-Report-${period || "custom"}-${Date.now()}.xlsx`;
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  await wb.xlsx.write(res);
  res.end();
});