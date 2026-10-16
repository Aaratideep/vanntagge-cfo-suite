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

  const companyName = 'VANNTAGGE CFO SERVICES LLP';
  const companyGstin = invoice.companyGstin || '27AABCU9603R1ZX';
  const companyPan = 'AABCU9603R';
  const companyLlpin = 'AAT-1234';
  const companyEmail = adminDetails?.adminEmail || 'info@vcfoedge.net';
  const companyWebsite = 'www.vcfoedge.net';

  const clientName = invoice.clientCompanyName || (invoice as any).clientName || 'Valued Client';
  const clientGstin = invoice.clientGstin || 'Unregistered';
  const clientAddress = (invoice as any).clientAddress || (invoice as any).address || 'Registered Office Address, Maharashtra';
  const placeOfSupply = invoice.placeOfSupply || '27 - Maharashtra';

  const baseAmount = Number(invoice.subtotal || invoice.amount || 0);
  const discountAmount = Number(invoice.discount || 0);
  const taxableBase = baseAmount - discountAmount;
  const isInterstate = invoice.gstType === 'Interstate' || (!placeOfSupply.includes('27') && !placeOfSupply.toLowerCase().includes('maharashtra'));
  
  const cgstAmount = isInterstate ? 0 : Number(invoice.cgst || (taxableBase * 0.09));
  const sgstAmount = isInterstate ? 0 : Number(invoice.sgst || (taxableBase * 0.09));
  const igstAmount = isInterstate ? Number(invoice.tax || invoice.gst || (taxableBase * 0.18)) : 0;
  const totalGst = isInterstate ? igstAmount : (cgstAmount + sgstAmount);
  const grandTotal = Number(invoice.total || invoice.finalAmount || (taxableBase + totalGst));
  const amountWords = convertToINRWords(grandTotal);

  const rawDate = invoice.invoiceDate || invoice.createdAt || new Date().toISOString();
  const d = new Date(rawDate);
  const formattedInvoiceDate = isNaN(d.getTime()) ? rawDate : `${String(d.getDate()).padStart(2, '0')} / ${String(d.getMonth() + 1).padStart(2, '0')} / ${d.getFullYear()}`;
  
  const dueD = invoice.dueDate ? new Date(invoice.dueDate) : null;
  const formattedDueDate = dueD && !isNaN(dueD.getTime()) ? `${String(dueD.getDate()).padStart(2, '0')} / ${String(dueD.getMonth() + 1).padStart(2, '0')} / ${dueD.getFullYear()}` : (invoice.dueDate || 'Within 7 Days');

  const periodStr = invoice.billingPeriod || (!isNaN(d.getTime()) ? d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Oct 2026');

  const items = (invoice.lineItems && invoice.lineItems.length > 0)
    ? invoice.lineItems.map(item => ({
        description: item.description,
        period: (item as any).period || periodStr,
        sac: (item as any).sacCode || invoice.sacCode || '998311',
        amount: Number(item.amount)
      }))
    : [{
        description: invoice.serviceName || invoice.milestone || 'Virtual CFO Retainer - MIS & advisory',
        period: periodStr,
        sac: invoice.sacCode || '998311',
        amount: taxableBase
      }];

  // Fill up to 4 rows to match official scan
  const rowsCount = items.length;
  const emptyRowsNeeded = Math.max(0, 4 - rowsCount);

  let tableRowsHtml = items.map((item, idx) => `
    <tr style="border-bottom: 1px solid #e2e8f0; ${idx % 2 === 1 ? 'background-color: #f8fafc;' : 'background-color: #ffffff;'}">
      <td style="padding: 10px 12px; font-size: 12px; text-align: center; color: #64748b; font-weight: 600; border-right: 1px solid #e2e8f0;">${idx + 1}</td>
      <td style="padding: 10px 12px; font-size: 12px; color: #0f172a; font-weight: 600; border-right: 1px solid #e2e8f0;">${item.description}</td>
      <td style="padding: 10px 12px; font-size: 12px; color: #475569; text-align: center; border-right: 1px solid #e2e8f0;">${item.period}</td>
      <td style="padding: 10px 12px; font-size: 12px; color: #475569; text-align: center; font-family: monospace; border-right: 1px solid #e2e8f0;">${item.sac}</td>
      <td style="padding: 10px 12px; font-size: 12px; color: #0f172a; text-align: right; font-weight: 700;">${item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
    </tr>
  `).join('');

  for (let i = 1; i <= emptyRowsNeeded; i++) {
    const rowNum = rowsCount + i;
    tableRowsHtml += `
      <tr style="border-bottom: 1px solid #e2e8f0; height: 32px;">
        <td style="padding: 8px 12px; font-size: 12px; text-align: center; color: #94a3b8; font-weight: 500; border-right: 1px solid #e2e8f0;">${rowNum}</td>
        <td style="padding: 8px 12px; border-right: 1px solid #e2e8f0;"></td>
        <td style="padding: 8px 12px; border-right: 1px solid #e2e8f0;"></td>
        <td style="padding: 8px 12px; border-right: 1px solid #e2e8f0;"></td>
        <td style="padding: 8px 12px;"></td>
      </tr>
    `;
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Tax Invoice - ${invoice.invoiceNumber}</title>
        <meta charset="utf-8" />
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
          * { box-sizing: border-box; }
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            margin: 0;
            padding: 24px;
            color: #0f172a;
            background: #f1f5f9;
          }
          .invoice-sheet {
            max-width: 860px;
            margin: 0 auto;
            background: #ffffff;
            border: 1px solid #cbd5e1;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
          }
          .top-header {
            background-color: #0B192C;
            color: #ffffff;
            padding: 24px 32px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          .company-name {
            font-size: 22px;
            font-weight: 900;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            color: #ffffff;
          }
          .company-subtitle {
            font-size: 11px;
            font-weight: 600;
            color: #38BDF8;
            margin-top: 4px;
            letter-spacing: 0.3px;
          }
          .company-address {
            font-size: 11px;
            color: #cbd5e1;
            margin-top: 4px;
            max-width: 440px;
            line-height: 1.4;
          }
          .doc-type-title {
            font-size: 22px;
            font-weight: 900;
            color: #F59E0B;
            text-transform: uppercase;
            letter-spacing: 1px;
            text-align: right;
          }
          .statutory-details {
            font-size: 11px;
            color: #e2e8f0;
            margin-top: 4px;
            text-align: right;
            line-height: 1.5;
          }
          .gold-stripe {
            height: 4px;
            background-color: #D97706;
            width: 100%;
          }
          .content-body {
            padding: 28px 32px;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-bottom: 20px;
          }
          .meta-box {
            border: 1px solid #cbd5e1;
            background-color: #f8fafc;
            padding: 14px;
            border-radius: 2px;
            font-size: 12px;
          }
          .meta-box-title {
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #0f172a;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 4px;
            margin-bottom: 8px;
          }
          .meta-row {
            display: flex;
            margin-bottom: 5px;
            line-height: 1.4;
          }
          .meta-label {
            width: 110px;
            color: #64748b;
            flex-shrink: 0;
          }
          .meta-value {
            color: #0f172a;
            font-weight: 600;
          }
          .services-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #cbd5e1;
            margin-bottom: 20px;
          }
          .services-table th {
            background-color: #0B192C;
            color: #ffffff;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 10px 12px;
            border-right: 1px solid #334155;
          }
          .services-table th:last-child {
            border-right: none;
          }
          .calc-container {
            display: grid;
            grid-template-columns: 1.1fr 1fr;
            gap: 24px;
            margin-bottom: 24px;
            font-size: 12px;
          }
          .words-block {
            padding-top: 4px;
          }
          .words-title {
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 4px;
          }
          .words-text {
            color: #1e293b;
            font-style: italic;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 8px;
            margin-bottom: 14px;
            line-height: 1.4;
          }
          .reverse-charge {
            color: #475569;
          }
          .calc-table {
            width: 100%;
            border-collapse: collapse;
          }
          .calc-table td {
            padding: 5px 0;
            border-bottom: 1px solid #e2e8f0;
            color: #475569;
          }
          .calc-table td:last-child {
            text-align: right;
            font-weight: 600;
            color: #0f172a;
          }
          .total-navy-box {
            background-color: #0B192C;
            color: #ffffff;
            padding: 10px 14px;
            margin-top: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-weight: 700;
            font-size: 13px;
          }
          .total-amount-highlight {
            color: #FBBF24;
            font-size: 16px;
            font-weight: 900;
          }
          .bottom-info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-bottom: 28px;
            font-size: 11px;
          }
          .info-box {
            border: 1px solid #cbd5e1;
            background-color: #f8fafc;
            padding: 12px;
            border-radius: 2px;
            color: #334155;
            line-height: 1.5;
          }
          .info-box-title {
            font-weight: 700;
            color: #0f172a;
            text-transform: uppercase;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 4px;
            margin-bottom: 6px;
            font-size: 11px;
          }
          .signoff-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            font-size: 12px;
          }
          .slogan {
            font-weight: 600;
            font-style: italic;
            color: #D97706;
            margin-top: 3px;
            font-size: 11px;
          }
          .signature-box {
            text-align: right;
          }
          .company-sign {
            font-weight: 700;
            text-transform: uppercase;
            color: #0f172a;
            margin-bottom: 4px;
          }
          .sign-img {
            height: 48px;
            object-fit: contain;
            display: inline-block;
          }
          .partner-title {
            color: #475569;
            font-size: 11px;
            margin-top: 2px;
          }
          .bottom-footer {
            text-align: center;
            padding-top: 20px;
            margin-top: 20px;
            border-top: 1px solid #f1f5f9;
            font-size: 10px;
            color: #94a3b8;
            line-height: 1.4;
          }
          .vashi-office {
            color: #64748b;
            font-weight: 500;
            margin-top: 2px;
          }
          .no-print-bar {
            max-width: 860px;
            margin: 0 auto 16px auto;
            text-align: right;
          }
          .print-btn {
            background-color: #0B192C;
            color: #ffffff;
            border: 2px solid #D97706;
            padding: 10px 24px;
            font-weight: 700;
            font-size: 13px;
            border-radius: 6px;
            cursor: pointer;
          }
          @media print {
            body { padding: 0; background: #ffffff; }
            .invoice-sheet { border: none; box-shadow: none; max-width: 100%; }
            .no-print-bar { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print-bar">
          <button class="print-btn" onclick="window.print()">
            🖨️ Print / Save Official PDF
          </button>
        </div>

        <div class="invoice-sheet">
          <!-- 1. Header -->
          <div class="top-header">
            <div>
              <div class="company-name">${companyName}</div>
              <div class="company-subtitle">Virtual CFO | Funding Advisory | Due Diligence | Franchise Development</div>
              <div class="company-address">Gala No. 28, OM Anand Industrial Premises Co-op, Wagle I.E., Thane - 400604, Maharashtra</div>
            </div>
            <div>
              <div class="doc-type-title">TAX INVOICE</div>
              <div class="statutory-details">
                <div>GSTIN: <strong>${companyGstin}</strong></div>
                <div>PAN: <strong>${companyPan}</strong> &nbsp;|&nbsp; LLPIN: <strong>${companyLlpin}</strong></div>
                <div>${companyWebsite} | ${companyEmail}</div>
              </div>
            </div>
          </div>

          <!-- Gold Stripe -->
          <div class="gold-stripe"></div>

          <!-- 2. Body -->
          <div class="content-body">
            <!-- Metadata Grid -->
            <div class="meta-grid">
              <!-- BILL TO -->
              <div class="meta-box">
                <div class="meta-box-title">BILL TO</div>
                <div class="meta-row">
                  <span class="meta-label">Client Name</span>
                  <span class="meta-value">${clientName}</span>
                </div>
                <div class="meta-row">
                  <span class="meta-label">Address</span>
                  <span class="meta-value" style="font-weight: 400;">${clientAddress}</span>
                </div>
                <div class="meta-row">
                  <span class="meta-label">GSTIN</span>
                  <span class="meta-value" style="font-family: monospace;">${clientGstin}</span>
                </div>
                <div class="meta-row">
                  <span class="meta-label">State / Code</span>
                  <span class="meta-value">${placeOfSupply}</span>
                </div>
              </div>

              <!-- INVOICE DETAILS -->
              <div class="meta-box">
                <div class="meta-box-title">INVOICE DETAILS</div>
                <div class="meta-row">
                  <span class="meta-label">Invoice No.</span>
                  <span class="meta-value" style="font-family: monospace;">${invoice.invoiceNumber}</span>
                </div>
                <div class="meta-row">
                  <span class="meta-label">Invoice Date</span>
                  <span class="meta-value">${formattedInvoiceDate}</span>
                </div>
                <div class="meta-row">
                  <span class="meta-label">Due Date</span>
                  <span class="meta-value">${formattedDueDate}</span>
                </div>
                <div class="meta-row">
                  <span class="meta-label">Place of Supply</span>
                  <span class="meta-value">${placeOfSupply}</span>
                </div>
                <div class="meta-row">
                  <span class="meta-label">SAC Code</span>
                  <span class="meta-value">998311 (Mgmt. Consulting)</span>
                </div>
              </div>
            </div>

            <!-- Services Table -->
            <table class="services-table">
              <thead>
                <tr>
                  <th style="width: 6%; text-align: center;">#</th>
                  <th style="width: 52%; text-align: left;">Description of Services</th>
                  <th style="width: 16%; text-align: center;">Period</th>
                  <th style="width: 11%; text-align: center;">SAC</th>
                  <th style="width: 15%; text-align: right;">Amount (Rs.)</th>
                </tr>
              </thead>
              <tbody>
                ${tableRowsHtml}
              </tbody>
            </table>

            <!-- Summary & Breakdown -->
            <div class="calc-container">
              <div class="words-block">
                <div class="words-title">Amount in words:</div>
                <div class="words-text">${amountWords}</div>
                <div class="reverse-charge">Whether tax payable on reverse charge: <strong>No</strong></div>
              </div>

              <div>
                <table class="calc-table">
                  <tr>
                    <td>Taxable Value</td>
                    <td>Rs. ${taxableBase.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                  <tr>
                    <td>CGST @ 9%</td>
                    <td>${isInterstate ? '—' : 'Rs. ' + cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                  <tr>
                    <td>SGST @ 9%</td>
                    <td>${isInterstate ? '—' : 'Rs. ' + sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                  <tr>
                    <td>IGST @ 18% (inter-state)</td>
                    <td>${isInterstate ? 'Rs. ' + igstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}</td>
                  </tr>
                </table>

                <div class="total-navy-box">
                  <span>TOTAL INVOICE VALUE</span>
                  <span class="total-amount-highlight">Rs. ${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            <!-- Bank & Terms Grid -->
            <div class="bottom-info-grid">
              <div class="info-box">
                <div class="info-box-title">BANK DETAILS (for NEFT / RTGS / UPI)</div>
                <div>Account Name : <strong>VANNTAGGE CFO Services LLP</strong></div>
                <div>Bank &amp; Branch : <strong>HDFC Bank, Wagle Industrial Estate, Thane - 400604</strong></div>
                <div>A/c No. : <strong>50200088991122</strong></div>
                <div>IFSC : <strong>HDFC0000123</strong> &nbsp;|&nbsp; UPI : <strong>vanntagge.cfo@hdfcbank</strong></div>
              </div>

              <div class="info-box">
                <div class="info-box-title">TERMS</div>
                <div>1. Payment due within 7 days of invoice date.</div>
                <div>2. Please quote invoice no. while remitting.</div>
                <div>3. TDS u/s 194J, if deducted, kindly share Form 16A.</div>
                <div>4. Subject to Thane jurisdiction.</div>
              </div>
            </div>

            <!-- Sign-off -->
            <div class="signoff-row">
              <div>
                <div style="font-weight: 600; color: #1e293b;">Thank you for your business.</div>
                <div class="slogan">Insight. Strategy. Growth.</div>
              </div>
              <div class="signature-box">
                <div class="company-sign">For VANNTAGGE CFO Services LLP</div>
                <img src="/signature-tejjashri.png" alt="Signature" class="sign-img" onerror="this.src='/signature.png'" />
                <div class="partner-title">Designated Partner</div>
              </div>
            </div>

            <!-- Footer note -->
            <div class="bottom-footer">
              <div><em>This is a computer-generated invoice.</em></div>
              <div class="vashi-office">Vashi Office: Office No. 318 &amp; 319, Commodity Exchange Bldg., Sector 19A, Opp. Dana Bunder, Vashi, Navi Mumbai - 400705</div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}


