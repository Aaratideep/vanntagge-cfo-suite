/**
 * Excel / CSV Export Utility for Vantage CFO Suite
 * Exports tabular datasets directly to downloadable CSV files formatted for Microsoft Excel.
 * Includes UTF-8 BOM so Excel natively handles special symbols (like ₹ INR) and punctuation.
 */

export function exportToExcel(
  filename: string,
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][]
) {
  if (typeof window === 'undefined') return;

  const escapeCSV = (val: string | number | boolean | null | undefined): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val);
    if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return `"${str}"`;
  };

  const csvContent = [
    headers.map(escapeCSV).join(','),
    ...rows.map(row => row.map(escapeCSV).join(','))
  ].join('\r\n');

  // Prefix with UTF-8 BOM (\uFEFF) for Excel compatibility
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  const cleanFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  link.setAttribute('href', url);
  link.setAttribute('download', cleanFilename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToCSV(
  rows: Record<string, any>[],
  filename: string
) {
  if (typeof window === 'undefined' || !rows || rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const dataRows = rows.map(row => headers.map(header => row[header]));
  exportToExcel(filename, headers, dataRows);
}
