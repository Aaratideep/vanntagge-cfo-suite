import { Invoice } from '../types';
import { formatINR } from './currency';

function convertToINRWords(num: number): string {
  if (!num || num <= 0) return 'Zero Rupees Only';
  const a = Math.round(num);
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n: number): string => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + inWords(n % 100) : '');
    if (n < 100000) return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + inWords(n % 1000) : '');
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + inWords(n % 100000) : '');
    return inWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + inWords(n % 10000000) : '');
  };

  return inWords(a) + ' Rupees Only';
}

export function exportInvoicePdf(invoice: Invoice, adminDetails?: any): void {
  if (typeof window === 'undefined') return;

  const companyName = invoice.billingEntity || adminDetails?.companyName || 'VANNTAGGE CFO SERVICES LLP';
  const adminName = adminDetails?.adminName || 'Finance Dept';
  const adminEmail = adminDetails?.adminEmail || 'billing@vanntaggecfo.com';
  const companyGstin = invoice.companyGstin || '27AABCU9603R1ZX';

  const clientName = invoice.clientCompanyName || (invoice as any).clientName || 'Valued Client';
  const clientGstin = invoice.clientGstin || 'Unregistered';
  const clientPan = invoice.clientPan || 'N/A';
  const placeOfSupply = invoice.placeOfSupply || '27 - Maharashtra';
  const reverseCharge = invoice.reverseCharge || 'No';

  const baseAmount = Number(invoice.subtotal || invoice.amount || 0);
  const discountAmount = Number(invoice.discount || 0);
  const taxableBase = baseAmount - discountAmount;
  const isInterstate = invoice.gstType === 'Interstate';
  
  const cgstAmount = isInterstate ? 0 : Number(invoice.cgst || (taxableBase * 0.09));
  const sgstAmount = isInterstate ? 0 : Number(invoice.sgst || (taxableBase * 0.09));
  const igstAmount = isInterstate ? Number(invoice.tax || invoice.gst || (taxableBase * 0.18)) : 0;
  const totalGst = isInterstate ? igstAmount : (cgstAmount + sgstAmount);
  const grandTotal = Number(invoice.total || invoice.finalAmount || (taxableBase + totalGst));
  const amountWords = convertToINRWords(grandTotal);

  const lineItemsHtml = (invoice.lineItems && invoice.lineItems.length > 0
    ? invoice.lineItems
    : [{ description: invoice.serviceName || invoice.milestone || 'Virtual CFO Advisory Services', amount: taxableBase }]
  )
    .map(
      (item, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 12px; font-size: 13px; color: #475569;">${(idx + 1).toString().padStart(2, '0')}</td>
        <td style="padding: 12px; font-size: 13px; color: #1e293b; font-weight: 600;">
          ${item.description}
          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Strategic Financial Governance, Tax Compliance & Board Reporting</div>
        </td>
        <td style="padding: 12px; font-size: 13px; color: #475569; text-align: center; font-family: monospace;">
          ${(item as any).sacCode || invoice.sacCode || '998311'}
        </td>
        <td style="padding: 12px; font-size: 13px; color: #1e293b; text-align: right; font-weight: 600;">
          ${formatINR(item.amount)}
        </td>
        <td style="padding: 12px; font-size: 13px; color: #475569; text-align: right;">
          18.00%
        </td>
        <td style="padding: 12px; font-size: 13px; color: #0f172a; text-align: right; font-weight: 700;">
          ${formatINR(item.amount * 1.18)}
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
        <title>GST Tax Invoice - ${invoice.invoiceNumber}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
          body {
            font-family: 'Outfit', sans-serif;
            margin: 0;
            padding: 30px;
            color: #0f172a;
            background: #ffffff;
          }
          .invoice-box {
            max-width: 850px;
            margin: auto;
            border: 1px solid #cbd5e1;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          }
          .header-table {
            width: 100%;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 20px;
            margin-bottom: 24px;
          }
          .company-title {
            font-size: 24px;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: -0.5px;
            text-transform: uppercase;
          }
          .invoice-badge {
            display: inline-block;
            padding: 4px 12px;
            background-color: #eff6ff;
            color: #1d4ed8;
            font-weight: 700;
            border: 1px solid #bfdbfe;
            border-radius: 6px;
            font-size: 12px;
            text-transform: uppercase;
          }
          .section-title {
            font-size: 11px;
            text-transform: uppercase;
            font-weight: 700;
            color: #64748b;
            letter-spacing: 0.5px;
            margin-bottom: 6px;
          }
          .details-grid {
            width: 100%;
            margin-bottom: 24px;
            background: #f8fafc;
            padding: 16px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
          }
          .table-items {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
          }
          .table-items th {
            background-color: #0f172a;
            padding: 10px 12px;
            text-align: left;
            font-size: 11px;
            font-weight: 700;
            color: #ffffff;
            text-transform: uppercase;
          }
          .summary-container {
            width: 100%;
            margin-bottom: 24px;
          }
          .words-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 12px;
          }
          .bank-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 12px;
            border-radius: 8px;
            font-size: 12px;
            color: #475569;
          }
          .summary-table {
            width: 100%;
            border-collapse: collapse;
          }
          .summary-table td {
            padding: 6px 0;
            font-size: 13px;
          }
          .total-row td {
            font-size: 18px;
            font-weight: 800;
            color: #0f172a;
            border-top: 2px solid #0f172a;
            padding-top: 10px;
          }
          .footer {
            margin-top: 30px;
            padding-top: 16px;
            border-top: 1px solid #e2e8f0;
            font-size: 11px;
            color: #64748b;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          @media print {
            body { padding: 0; }
            .invoice-box { border: none; box-shadow: none; padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="max-width: 850px; margin: 0 auto 20px auto; text-align: right;">
          <button onclick="window.print()" style="background: #2563eb; color: white; border: none; padding: 10px 20px; font-weight: 700; border-radius: 8px; cursor: pointer;">
            🖨️ Print / Save GST Invoice PDF
          </button>
        </div>
        <div class="invoice-box">
          <table class="header-table">
            <tr>
              <td>
                <div class="company-title">${companyName}</div>
                <div style="font-size: 13px; color: #475569; margin-top: 2px; font-weight: 500;">Corporate Financial Consultants & Virtual CFO Advisors</div>
                <div style="font-size: 12px; color: #64748b; margin-top: 6px;">
                  GSTIN: <strong style="color: #0f172a;">${companyGstin}</strong> &bull; PAN: <strong style="color: #0f172a;">AABCU9603R</strong> &bull; SAC: <strong style="color: #0f172a;">998311</strong>
                </div>
              </td>
              <td style="text-align: right; vertical-align: top;">
                <div class="invoice-badge">GST TAX INVOICE</div>
                <div style="font-size: 20px; font-weight: 800; margin-top: 6px;">${invoice.invoiceNumber}</div>
                <div style="font-size: 11px; color: #64748b; margin-top: 2px;">UDIN: 24096033AAAAA5267</div>
              </td>
            </tr>
          </table>

          <table class="details-grid">
            <tr>
              <td style="width: 50%; vertical-align: top;">
                <div class="section-title">Issued By (Service Provider)</div>
                <div style="font-size: 14px; font-weight: 700; color: #0f172a;">${companyName}</div>
                <div style="font-size: 12px; color: #475569; margin-top: 2px;">Level 8, Corporate Tower B, BKC Financial Hub</div>
                <div style="font-size: 12px; color: #475569;">Bandra East, Mumbai, MH - 400051</div>
                <div style="font-size: 12px; color: #475569;">Email: ${adminEmail}</div>
              </td>
              <td style="width: 50%; vertical-align: top; border-left: 1px solid #cbd5e1; padding-left: 20px;">
                <div class="section-title">Billed To (Recipient / Customer)</div>
                <div style="font-size: 14px; font-weight: 700; color: #0f172a;">${clientName}</div>
                <div style="font-size: 12px; color: #475569; margin-top: 2px;">GSTIN: <strong style="color: #0f172a;">${clientGstin}</strong> | PAN: <strong style="color: #0f172a;">${clientPan}</strong></div>
                <div style="font-size: 12px; color: #475569; margin-top: 2px;">Place of Supply: <strong>${placeOfSupply}</strong></div>
                <div style="font-size: 12px; color: #475569; margin-top: 2px;">Reverse Charge (RCM): <strong>${reverseCharge}</strong></div>
                <div style="font-size: 12px; color: #475569; margin-top: 4px; border-top: 1px solid #e2e8f0; padding-top: 4px;">
                  Issue Date: <strong>${invoice.invoiceDate || new Date(invoice.createdAt).toISOString().split('T')[0]}</strong> | Due Date: <strong style="color: #dc2626;">${invoice.dueDate}</strong>
                </div>
              </td>
            </tr>
          </table>

          <table class="table-items">
            <thead>
              <tr>
                <th style="width: 8%;">#</th>
                <th style="width: 48%;">Description of Service / Milestone</th>
                <th style="width: 14%; text-align: center;">SAC Code</th>
                <th style="width: 15%; text-align: right;">Taxable Base (₹)</th>
                <th style="width: 15%; text-align: right;">Total Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${lineItemsHtml}
            </tbody>
          </table>

          <table class="summary-container">
            <tr>
              <td style="width: 55%; vertical-align: top; padding-right: 20px;">
                <div class="words-box">
                  <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;">Amount Chargeable in Words</div>
                  <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-top: 2px;">${amountWords}</div>
                </div>

                <div class="bank-box">
                  <div style="font-size: 10px; font-weight: 700; color: #0f172a; text-transform: uppercase; margin-bottom: 4px;">Bank Remittance Details</div>
                  <div>Bank: <strong>HDFC Bank Ltd (BKC Branch, Mumbai)</strong></div>
                  <div>Account Name: <strong>VANNTAGGE CFO SERVICES LLP</strong></div>
                  <div>A/C No: <strong>50200098765432</strong> | IFSC: <strong>HDFC0000123</strong></div>
                  <div>UPI ID: <strong>vanntagge.cfo@hdfcbank</strong></div>
                </div>
              </td>

              <td style="width: 45%; vertical-align: top; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px;">
                <table class="summary-table">
                  <tr>
                    <td style="color: #64748b;">Taxable Subtotal</td>
                    <td style="text-align: right; font-weight: 600;">${formatINR(taxableBase)}</td>
                  </tr>
                  ${
                    isInterstate
                      ? `<tr>
                          <td style="color: #64748b;">IGST @ 18.00%</td>
                          <td style="text-align: right; font-weight: 600;">${formatINR(igstAmount)}</td>
                        </tr>`
                      : `<tr>
                          <td style="color: #64748b;">CGST @ 9.00%</td>
                          <td style="text-align: right; font-weight: 600;">${formatINR(cgstAmount)}</td>
                        </tr>
                        <tr>
                          <td style="color: #64748b;">SGST @ 9.00%</td>
                          <td style="text-align: right; font-weight: 600;">${formatINR(sgstAmount)}</td>
                        </tr>`
                  }
                  <tr class="total-row">
                    <td>Grand Total Payable</td>
                    <td style="text-align: right;">${formatINR(grandTotal)}</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <div class="footer">
            <div style="max-width: 400px; text-align: left;">
              <div style="font-weight: 700; color: #16a34a; font-size: 11px;">✓ Statutory GST Compliance Verified</div>
              <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Issued in accordance with Section 31 of CGST Act, 2017 & Rule 46 of CGST Rules, 2017. Valid without physical signature.</div>
            </div>
            <div style="text-align: right;">
              <div style="font-weight: 700; font-size: 12px; color: #0f172a;">For ${companyName}</div>
              <div style="font-size: 11px; color: #64748b; margin-top: 20px;">FCA Authorized Signatory</div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}

