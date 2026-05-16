// src/utils/exportUtils.js
import * as XLSX from 'xlsx';

export const exportToExcel = (data, fileName = "CustomerList") => {
  if (!data || data.length === 0) {
    alert("No data to export");
    return;
  }

  // Map data to clean columns for Excel
  const cleanData = data.map(c => ({
    "Customer Name": c.name,
    "Phone": c.phone,
    "Email": c.email || 'N/A',
    "Tag": c.tag,
    "Outstanding": c.outstanding || 0,
    "Total Business": c.totalValue || 0,
    "Status": c.isArchived ? 'Archived' : 'Active'
  }));

  const ws = XLSX.utils.json_to_sheet(cleanData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Customers");
  XLSX.writeFile(wb, `${fileName}.xlsx`);
};