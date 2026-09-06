import { Report } from '../types';
import { formatINR } from './currency';

/**
 * Simulates / generates PDF document Data URL or triggers download for a released Report.
 */
export function exportReportToPDF(report: Report): string {
  const title = `${report.clientCompanyName} - ${report.type} Report (${report.periodKey})`;
  
  // Construct formatted text representation for client download
  let textContent = `=======================================================\n`;
  textContent += `                ${report.clientCompanyName.toUpperCase()}\n`;
  textContent += `             ${report.type} FINANCIAL PERFORMANCE REPORT\n`;
  textContent += `=======================================================\n`;
  textContent += `Report Period : ${report.periodKey}\n`;
  textContent += `Status        : ${report.status} (Version ${report.version})\n`;
  textContent += `Generated At  : ${new Date(report.createdAt).toLocaleString()}\n`;
  textContent += `Approved By   : ${report.approvedByName || 'System'}\n`;
  textContent += `Released At   : ${report.releasedAt ? new Date(report.releasedAt).toLocaleString() : 'N/A'}\n`;
  textContent += `=======================================================\n\n`;

  textContent += `--- KEY PERFORMANCE METRICS ---\n`;
  if (report.dataSnapshot?.kpiResults) {
    Object.entries(report.dataSnapshot.kpiResults).forEach(([key, kpi]) => {
      textContent += `• ${key.toUpperCase()}: ${kpi.formatted}\n`;
    });
  }
  textContent += `\n`;

  textContent += `--- REPORT SECTIONS ---\n`;
  (report.sections || []).forEach((sec, idx) => {
    textContent += `${idx + 1}. ${sec.title.toUpperCase()}\n`;
    if (sec.narrative) {
      textContent += `   "${sec.narrative}"\n`;
    }
    textContent += `\n`;
  });

  textContent += `=======================================================\n`;
  textContent += `CONFIDENTIAL - PREPARED BY VANTAGE CFO SUITE ENGINE\n`;
  textContent += `=======================================================\n`;

  const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  // Trigger file download
  const link = document.createElement('a');
  link.href = url;
  link.download = `${report.clientCompanyName.toLowerCase().replace(/\s+/g, '-')}-${report.type.toLowerCase()}-${report.periodKey}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  return url;
}

/**
 * Simulates / generates Excel CSV document Data URL or triggers download for a released Report.
 */
export function exportReportToExcel(report: Report): string {
  let csv = `Client,${report.clientCompanyName}\n`;
  csv += `Report Type,${report.type}\n`;
  csv += `Period,${report.periodKey}\n`;
  csv += `Status,${report.status}\n`;
  csv += `Version,V${report.version}\n`;
  csv += `Approved By,${report.approvedByName || 'N/A'}\n\n`;

  csv += `KPI Key,Metric Name,Value\n`;
  if (report.dataSnapshot?.kpiResults) {
    Object.entries(report.dataSnapshot.kpiResults).forEach(([key, kpi]) => {
      csv += `"${key}","${key}","${kpi.formatted}"\n`;
    });
  }
  csv += `\n`;

  csv += `Section Order,Section Title,Narrative\n`;
  (report.sections || []).forEach((sec) => {
    csv += `"${sec.order}","${sec.title}","${(sec.narrative || '').replace(/"/g, '""')}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${report.clientCompanyName.toLowerCase().replace(/\s+/g, '-')}-${report.type.toLowerCase()}-${report.periodKey}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  return url;
}
