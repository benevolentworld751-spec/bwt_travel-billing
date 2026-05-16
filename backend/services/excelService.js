import ExcelJS from 'exceljs';

export const generateInvoiceExcel = async (invoice, business, customer, res) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Tax Invoice');

    // 1. Column Definitions & Standard Widths
    worksheet.columns = [
        { header: 'SERVICE', key: 'service', width: 12 },
        { header: 'NAME', key: 'pax', width: 25 },
        { header: 'DATE', key: 'date', width: 14 },
        { header: 'DESC', key: 'desc', width: 20 },
        { header: 'PNR/REF', key: 'pnr', width: 15 },
        { header: 'FARE', key: 'fare', width: 12 },
        { header: 'TAX', key: 'itemTax', width: 10 },
        { header: 'TOTAL', key: 'total', width: 15 }
    ];

    // 2. Branding Header (Rows 1-5)
    worksheet.mergeCells('A1:D1');
    const bName = worksheet.getCell('A1');
    bName.value = business.name.toUpperCase();
    bName.font = { bold: true, size: 16, color: { argb: 'FF0F172A' } };

    worksheet.getCell('A2').value = business.address;
    worksheet.getCell('A3').value = `GSTIN: ${business.gstNumber || "N/A"}`;
    worksheet.getCell('A4').value = `Contact: ${business.phone || "N/A"}`;

    // 3. Invoice Metadata (Top Right)
    worksheet.mergeCells('F1:H1');
    const title = worksheet.getCell('F1');
    title.value = "TAX INVOICE";
    title.font = { bold: true, size: 22, color: { argb: 'FF3498DB' } };
    title.alignment = { horizontal: 'right' };

    worksheet.getCell('H2').value = `Invoice Number: ${invoice.invoiceNumber}`;
    worksheet.getCell('H3').value = `Date: ${new Date(invoice.invoiceDate).toLocaleDateString('en-GB')}`;
    worksheet.getCell('H2').alignment = { horizontal: 'right' };
    worksheet.getCell('H3').alignment = { horizontal: 'right' };

    // 4. Billing Info (Row 7-10)
    worksheet.getCell('A7').value = "BILL TO:";
    worksheet.getCell('A7').font = { bold: true, color: { argb: 'FF64748B' }, size: 9 };
    worksheet.getCell('A8').value = customer.name.toUpperCase();
    worksheet.getCell('A8').font = { bold: true, size: 11 };
    worksheet.getCell('A9').value = customer.address || "N/A";
    worksheet.getCell('A10').value = `Contact: ${customer.phone || "N/A"}`;

    // 5. Styled Table Header (Row 12)
    const headerRow = worksheet.getRow(12);
    headerRow.values = ['SERVICE', 'NAME', 'DATE', 'DESC', 'PNR/REF', 'FARE', 'TAX', 'TOTAL'];
    headerRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // 6. Data Rows
    invoice.items.forEach((item) => {
        const row = worksheet.addRow([
            item.serviceType,
            item.Cname || "-",
            item.date ? new Date(item.date).toLocaleDateString('en-GB') : "-",
            item.description,
            item.pnr || "-",
            item.fare,
            item.tax || 0,
            item.total
        ]);
        
        row.eachCell((cell) => {
            cell.border = { 
                top: { style: 'thin', color: { argb: 'FFE2E8F0' } }, 
                left: { style: 'thin', color: { argb: 'FFE2E8F0' } }, 
                bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } }, 
                right: { style: 'thin', color: { argb: 'FFE2E8F0' } } 
            };
            cell.font = { size: 9 };
            cell.alignment = { vertical: 'middle' };
        });
        
        row.getCell(6).numFmt = '0.00';
        row.getCell(7).numFmt = '0.00';
        row.getCell(8).numFmt = '0.00';
    });

    // 7. Financial Summary Block
    const startSummary = worksheet.lastRow.number + 2;

    const addSummaryRow = (rowNum, label, value, isBold = false) => {
        worksheet.getCell(`G${rowNum}`).value = label;
        worksheet.getCell(`H${rowNum}`).value = Number(value);
        worksheet.getCell(`G${rowNum}`).alignment = { horizontal: 'right' };
        worksheet.getCell(`H${rowNum}`).alignment = { horizontal: 'right' };
        worksheet.getCell(`H${rowNum}`).numFmt = '"INR " #,##0.00';
        if (isBold) {
            worksheet.getCell(`G${rowNum}`).font = { bold: true };
            worksheet.getCell(`H${rowNum}`).font = { bold: true };
        }
    };

    addSummaryRow(startSummary, 'Subtotal', invoice.subTotal);
    addSummaryRow(startSummary + 1, 'SC', invoice.serviceCharge || 0);

    let currentSummaryRow = startSummary + 2;
    const rate = (invoice.taxRate / 2).toFixed(1);

    if (invoice.igst > 0) {
        addSummaryRow(currentSummaryRow, `IGST(${invoice.taxRate}%)`, invoice.igst);
        currentSummaryRow++;
    } else {
        addSummaryRow(currentSummaryRow, `CGST(${rate}%)`, invoice.cgst || 0);
        addSummaryRow(currentSummaryRow + 1, `SGST(${rate}%)`, invoice.sgst || 0);
        currentSummaryRow += 2;
    }

    // NET PAYABLE HIGHLIGHT
    const netLabel = worksheet.getCell(`G${currentSummaryRow}`);
    const netValue = worksheet.getCell(`H${currentSummaryRow}`);
    
    netLabel.value = "NET PAYABLE";
    netValue.value = Number(invoice.grandTotal);
    
    [netLabel, netValue].forEach(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
    });
    netValue.numFmt = '"INR " #,##0.00';

    // 8. Footer: Bank Details & Signature
    const footerY = currentSummaryRow + 3;
    
    worksheet.getCell(`A${footerY}`).value = "BANK ACCOUNT DETAILS";
    worksheet.getCell(`A${footerY}`).font = { bold: true, size: 8, color: { argb: 'FF64748B' } };
    worksheet.getCell(`A${footerY+1}`).value = `Bank: ${business.bankDetails?.bankName}`;
    worksheet.getCell(`A${footerY+2}`).value = `A/c No: ${business.bankDetails?.accountNumber}`;
    worksheet.getCell(`A${footerY+3}`).value = `IFSC: ${business.bankDetails?.ifsc}`;

    worksheet.mergeCells(`G${footerY}:H${footerY}`);
    const sigHeader = worksheet.getCell(`G${footerY}`);
    sigHeader.value = `FOR ${business.name.toUpperCase()}`;
    sigHeader.font = { bold: true, size: 10 };
    sigHeader.alignment = { horizontal: 'center' };
    
    worksheet.mergeCells(`G${footerY+5}:H${footerY+5}`);
    const sigTitle = worksheet.getCell(`G${footerY+5}`);
    sigTitle.value = "Authorized Signatory";
    sigTitle.font = { bold: true, size: 10 };
    sigTitle.alignment = { horizontal: 'center' };

    // 9. Finalize and Send Response
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Invoice-${invoice.invoiceNumber}.xlsx`);
    
    await workbook.xlsx.write(res);
    res.end();
};


// ==============================
// BULK EXPORT — Multiple Invoices
// ==============================
export const generateBulkExcel = async (invoices, business, res) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Invoices Export');

    // ── Column Definitions ──────────────────────────────────────────────────
    worksheet.columns = [
        { header: 'INVOICE NO',   key: 'invoiceNumber',  width: 16 },
        { header: 'DATE',         key: 'invoiceDate',    width: 14 },
        { header: 'CLIENT',       key: 'customer',       width: 25 },
        { header: 'SERVICE',      key: 'serviceType',    width: 14 },
        { header: 'PAX NAME',     key: 'paxName',        width: 22 },
        { header: 'PNR/REF',      key: 'pnr',            width: 16 },
        { header: 'DESCRIPTION',  key: 'description',    width: 24 },
        { header: 'BASE FARE',    key: 'subTotal',       width: 14 },
        { header: 'SERVICE CHG',  key: 'serviceCharge',  width: 14 },
        { header: 'CGST',         key: 'cgst',           width: 10 },
        { header: 'SGST',         key: 'sgst',           width: 10 },
        { header: 'IGST',         key: 'igst',           width: 10 },
        { header: 'GRAND TOTAL',  key: 'grandTotal',     width: 16 },
        { header: 'STATUS',       key: 'status',         width: 12 },
        { header: 'PAYMENT MODE', key: 'paymentMode',    width: 16 },
    ];

    // ── Business Header (Rows 1–4) ──────────────────────────────────────────
    worksheet.mergeCells('A1:G1');
    const bName = worksheet.getCell('A1');
    bName.value = `${business.name.toUpperCase()} — INVOICE EXPORT`;
    bName.font = { bold: true, size: 14, color: { argb: 'FF0F172A' } };

    worksheet.mergeCells('A2:G2');
    worksheet.getCell('A2').value = `GSTIN: ${business.gstNumber || 'N/A'}   |   ${business.address || ''}   |   ${business.phone || ''}`;
    worksheet.getCell('A2').font = { size: 9, color: { argb: 'FF64748B' } };

    worksheet.mergeCells('A3:G3');
    worksheet.getCell('A3').value = `Exported on: ${new Date().toLocaleDateString('en-GB')}   |   Total Invoices: ${invoices.length}`;
    worksheet.getCell('A3').font = { size: 9, italic: true, color: { argb: 'FF94A3B8' } };

    // ── Blank spacer row ────────────────────────────────────────────────────
    worksheet.addRow([]);

    // ── Table Header (Row 5) ────────────────────────────────────────────────
    const headerRow = worksheet.addRow([
        'INVOICE NO', 'DATE', 'CLIENT', 'SERVICE', 'PAX NAME',
        'PNR/REF', 'DESCRIPTION', 'BASE FARE', 'SERVICE CHG',
        'CGST', 'SGST', 'IGST', 'GRAND TOTAL', 'STATUS', 'PAYMENT MODE'
    ]);

    headerRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
            top:    { style: 'thin', color: { argb: 'FF1E293B' } },
            bottom: { style: 'thin', color: { argb: 'FF1E293B' } },
            left:   { style: 'thin', color: { argb: 'FF1E293B' } },
            right:  { style: 'thin', color: { argb: 'FF1E293B' } },
        };
    });
    headerRow.height = 20;

    // ── Data Rows ───────────────────────────────────────────────────────────
    let totalGrand = 0;

    invoices.forEach((inv, index) => {
        const customerName = inv.customerId?.name || 'N/A';
        const firstItem    = inv.items?.[0] || {};
        const isEven       = index % 2 === 0;

        const row = worksheet.addRow([
            inv.invoiceNumber,
            new Date(inv.invoiceDate).toLocaleDateString('en-GB'),
            customerName.toUpperCase(),
            firstItem.serviceType || '-',
            firstItem.Cname       || '-',
            firstItem.pnr         || '-',
            firstItem.description || '-',
            Number(inv.subTotal      || 0),
            Number(inv.serviceCharge || 0),
            Number(inv.cgst          || 0),
            Number(inv.sgst          || 0),
            Number(inv.igst          || 0),
            Number(inv.grandTotal    || 0),
            inv.status       || '-',
            inv.paymentMode  || '-',
        ]);

        // Alternate row background for readability
        const rowBg = isEven ? 'FFF8FAFC' : 'FFFFFFFF';
        row.eachCell((cell) => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
            cell.font = { size: 9 };
            cell.alignment = { vertical: 'middle' };
            cell.border = {
                top:    { style: 'thin', color: { argb: 'FFE2E8F0' } },
                bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                left:   { style: 'thin', color: { argb: 'FFE2E8F0' } },
                right:  { style: 'thin', color: { argb: 'FFE2E8F0' } },
            };
        });

        // Number formats for money columns (H=8, I=9, J=10, K=11, L=12, M=13)
        [8, 9, 10, 11, 12, 13].forEach(col => {
            row.getCell(col).numFmt = '"₹"#,##0.00';
        });

        // Status badge colour
        const statusCell = row.getCell(14);
        if (inv.status === 'Paid') {
            statusCell.font = { bold: true, size: 9, color: { argb: 'FF059669' } };
        } else if (inv.status === 'Unpaid' || inv.status === 'Pending') {
            statusCell.font = { bold: true, size: 9, color: { argb: 'FFD97706' } };
        } else if (inv.status === 'Cancelled') {
            statusCell.font = { bold: true, size: 9, color: { argb: 'FFDC2626' } };
        }

        totalGrand += Number(inv.grandTotal || 0);
    });

    // ── Totals Row ──────────────────────────────────────────────────────────
    const totalsRow = worksheet.addRow([
        '', '', '', '', '', '', 'TOTAL',
        invoices.reduce((s, i) => s + Number(i.subTotal      || 0), 0),
        invoices.reduce((s, i) => s + Number(i.serviceCharge || 0), 0),
        invoices.reduce((s, i) => s + Number(i.cgst          || 0), 0),
        invoices.reduce((s, i) => s + Number(i.sgst          || 0), 0),
        invoices.reduce((s, i) => s + Number(i.igst          || 0), 0),
        totalGrand,
        '', '',
    ]);

    totalsRow.eachCell((cell, colNumber) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 };
        cell.alignment = { horizontal: colNumber >= 8 ? 'right' : 'left', vertical: 'middle' };
    });

    [8, 9, 10, 11, 12, 13].forEach(col => {
        totalsRow.getCell(col).numFmt = '"₹"#,##0.00';
    });

    totalsRow.height = 20;

    // ── Freeze header rows so columns stay visible while scrolling ──────────
    worksheet.views = [{ state: 'frozen', ySplit: 5 }];

    // ── Auto-filter on header row ───────────────────────────────────────────
    worksheet.autoFilter = {
        from: { row: 5, column: 1 },
        to:   { row: 5, column: 15 },
    };

    // ── Send Response ───────────────────────────────────────────────────────
    const filename = `Invoices-Export-${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

    await workbook.xlsx.write(res);
    res.end();
};