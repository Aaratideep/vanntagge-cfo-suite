import { Invoice } from '../types';
import { formatINR } from './currency';

export function exportInvoicePdf(invoice: Invoice, adminDetails?: any): void {
  if (typeof window === 'undefined') return;

  const companyName = invoice.billingEntity || adminDetails?.companyName || 'Vanntagge CFO Services LLP';
  const adminName = adminDetails?.adminName || 'Finance Dept';
  const adminEmail = adminDetails?.adminEmail || 'finance@vanntagge.com';
  const companyGstin = invoice.companyGstin || '27AAAAA0000A1Z5';

  const clientName = invoice.clientCompanyName || 'Valued Client';
  const clientGstin = invoice.clientGstin || 'Unregistered';
  const clientPan = invoice.clientPan || 'N/A';

  const lineItemsHtml = (invoice.lineItems && invoice.lineItems.length > 0
    ? invoice.lineItems
    : [{ description: invoice.serviceName || invoice.milestone || 'CFO Advisory Services', amount: invoice.subtotal || invoice.amount || 0 }]
  )
    .map(
      (item, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 12px; font-size: 14px; color: #1e293b;">${idx + 1}</td>
        <td style="padding: 12px; font-size: 14px; color: #1e293b; font-weight: 500;">
          ${item.description}
          ${item.sacCode ? `<div style="font-size: 12px; color: #64748b;">SAC: ${item.sacCode}</div>` : ''}
        </td>
        <td style="padding: 12px; font-size: 14px; color: #1e293b; text-align: right; font-weight: 600;">
          ${formatINR(item.amount)}
        </td>
      </tr>
    `
    )
    .join('');

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Tax Invoice - ${invoice.invoiceNumber}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');
          body {
            font-family: 'Outfit', sans-serif;
            margin: 0;
            padding: 40px;
            color: #0f172a;
            background: #ffffff;
          }
          .invoice-box {
            max-width: 800px;
            margin: auto;
            border: 1px solid #cbd5e1;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          }
          .header-table {
            width: 100%;
            margin-bottom: 30px;
          }
          .company-title {
            font-size: 24px;
            font-weight: 700;
            color: #2563eb;
            letter-spacing: -0.5px;
          }
          .invoice-badge {
            display: inline-block;
            padding: 6px 14px;
            background-color: #eff6ff;
            color: #1d4ed8;
            font-weight: 700;
            border-radius: 20px;
            font-size: 13px;
          }
          .section-title {
            font-size: 12px;
            text-transform: uppercase;
            font-weight: 700;
            color: #64748b;
            letter-spacing: 0.5px;
            margin-bottom: 6px;
          }
          .details-grid {
            width: 100%;
            margin-bottom: 30px;
          }
          .table-items {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          .table-items th {
            background-color: #f8fafc;
            padding: 12px;
            text-align: left;
            font-size: 12px;
            font-weight: 700;
            color: #475569;
            text-transform: uppercase;
            border-bottom: 2px solid #cbd5e1;
          }
          .summary-table {
            width: 300px;
            margin-left: auto;
            margin-bottom: 30px;
          }
          .summary-table td {
            padding: 6px 0;
            font-size: 14px;
          }
          .total-row td {
            font-size: 18px;
            font-weight: 700;
            color: #0f172a;
            border-top: 2px solid #0f172a;
            padding-top: 10px;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            font-size: 12px;
            color: #64748b;
            text-align: center;
          }
          @media print {
            body { padding: 0; }
            .invoice-box { border: none; box-shadow: none; padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="max-width: 800px; margin: 0 auto 20px auto; text-align: right;">
          <button onclick="window.print()" style="background: #2563eb; color: white; border: none; padding: 10px 20px; font-weight: 600; border-radius: 8px; cursor: pointer;">
            Print / Save as PDF
          </button>
        </div>
        <div class="invoice-box">
          <table class="header-table">
            <tr>
              <td>
                <div class="company-title">${companyName}</div>
                <div style="font-size: 13px; color: #475569; margin-top: 4px;">Premium Virtual CFO & Advisory Services</div>
                <div style="font-size: 12px; color: #64748b; margin-top: 4px;">GSTIN: ${companyGstin}</div>
              </td>
              <td style="text-align: right;">
                <div class="invoice-badge">TAX INVOICE</div>
                <div style="font-size: 18px; font-weight: 700; margin-top: 8px;">${invoice.invoiceNumber}</div>
                <div style="font-size: 13px; color: #64748b;">Status: ${invoice.status}</div>
              </td>
            </tr>
          </table>

          <table class="details-grid">
            <tr>
              <td style="width: 50%; vertical-align: top;">
                <div class="section-title">Billed To</div>
                <div style="font-size: 16px; font-weight: 700; color: #0f172a;">${clientName}</div>
                <div style="font-size: 13px; color: #475569; margin-top: 4px;">GSTIN: ${clientGstin}</div>
                <div style="font-size: 13px; color: #475569;">PAN: ${clientPan}</div>
              </td>
              <td style="width: 50%; vertical-align: top; text-align: right;">
                <div class="section-title">Invoice Details</div>
                <div style="font-size: 13px; color: #475569;">Date: <strong>${invoice.invoiceDate || new Date(invoice.createdAt).toISOString().split('T')[0]}</strong></div>
                <div style="font-size: 13px; color: #475569; margin-top: 4px;">Due Date: <strong style="color: #dc2626;">${invoice.dueDate}</strong></div>
                ${invoice.billingPeriod ? `<div style="font-size: 13px; color: #475569; margin-top: 4px;">Period: <strong>${invoice.billingPeriod}</strong></div>` : ''}
              </td>
            </tr>
          </table>

          <table class="table-items">
            <thead>
              <tr>
                <th style="width: 10%;">#</th>
                <th style="width: 65%;">Service / Line Item</th>
                <th style="width: 25%; text-align: right;">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${lineItemsHtml}
            </tbody>
          </table>

          <table class="summary-table">
            <tr>
              <td style="color: #64748b;">Subtotal</td>
              <td style="text-align: right; font-weight: 600;">${formatINR(invoice.subtotal || invoice.amount || 0)}</td>
            </tr>
            ${
              invoice.discount && invoice.discount > 0
                ? `<tr>
                    <td style="color: #dc2626;">Discount</td>
                    <td style="text-align: right; font-weight: 600; color: #dc2626;">-${formatINR(invoice.discount)}</td>
                  </tr>`
                : ''
            }
            ${
              invoice.cgst && invoice.cgst > 0
                ? `<tr>
                    <td style="color: #64748b;">CGST (${((invoice.taxRate || 18) / 2).toFixed(1)}%)</td>
                    <td style="text-align: right;">${formatINR(invoice.cgst)}</td>
                  </tr>
                  <tr>
                    <td style="color: #64748b;">SGST (${((invoice.taxRate || 18) / 2).toFixed(1)}%)</td>
                    <td style="text-align: right;">${formatINR(invoice.sgst)}</td>
                  </tr>`
                : `<tr>
                    <td style="color: #64748b;">GST / Tax (${invoice.taxRate || 18}%)</td>
                    <td style="text-align: right;">${formatINR(invoice.tax || invoice.gst || 0)}</td>
                  </tr>`
            }
            <tr class="total-row">
              <td>Total Payable</td>
              <td style="text-align: right;">${formatINR(invoice.total || invoice.finalAmount || 0)}</td>
            </tr>
            ${
              (invoice.amountPaid || 0) > 0
                ? `<tr>
                    <td style="color: #16a34a; font-weight: 600;">Amount Paid</td>
                    <td style="text-align: right; font-weight: 600; color: #16a34a;">${formatINR(invoice.amountPaid || 0)}</td>
                  </tr>
                  <tr>
                    <td style="color: #dc2626; font-weight: 700;">Balance Due</td>
                    <td style="text-align: right; font-weight: 700; color: #dc2626;">${formatINR(invoice.amountDue || 0)}</td>
                  </tr>`
                : ''
            }
          </table>

          <div style="background: #f8fafc; border-radius: 8px; padding: 16px; font-size: 13px; color: #475569; margin-top: 30px;">
            <div style="font-weight: 700; color: #0f172a; margin-bottom: 6px;">Payment Remittance Instructions</div>
            <div>Bank: HDFC Bank Ltd | A/C: 50200012345678 | IFSC: HDFC0000123</div>
            <div>UPI ID: vanntagge@hdfcbank</div>
            <div style="margin-top: 6px; font-size: 12px; color: #64748b;">Please specify Invoice Number <strong>${invoice.invoiceNumber}</strong> in payment remarks.</div>
          </div>

          <div class="footer">
            Computer generated Tax Invoice. Valid without physical signature. Contact ${adminName} (${adminEmail}) for billing queries.
          </div>
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
