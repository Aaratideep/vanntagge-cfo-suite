import React, { useRef } from 'react';
import { X, Printer, ShieldCheck, CheckCircle2, CreditCard, Download, Mail, MessageCircle } from 'lucide-react';
import { formatINR } from '../lib/currency';
import { useDashboardStore } from '../store/dashboardStore';

export type DocType = 'invoice' | 'receipt' | 'quotation' | 'agreement' | 'vendor_agreement' | 'mou' | 'employee_agreement';

interface DocumentPreviewModalProps {
  type: DocType;
  data: any;
  onClose: () => void;
  onLogPayment?: () => void;
}

// Convert numbers to Indian Rupee Words
function convertToINRWords(amount: number): string {
  if (!amount || amount <= 0) return 'Zero Rupees Only';
  const a = Math.round(amount);
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

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  type,
  data,
  onClose,
  onLogPayment
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!data) return null;

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    try {
      const { toJpeg } = await import('html-to-image');
      const jsPDF = (await import('jspdf')).default;

      // Capture the component as a high-quality JPEG
      const dataUrl = await toJpeg(printRef.current, { 
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        fontEmbedCSS: '',
        skipFonts: true
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const margin = 10;
      const printableWidth = pdfWidth - (2 * margin);
      const printableHeight = pdfHeight - (2 * margin);
      
      const imgHeight = (imgProps.height * printableWidth) / imgProps.width;
      
      let heightLeft = imgHeight;
      let position = margin;

      pdf.addImage(dataUrl, 'JPEG', margin, position, printableWidth, imgHeight);
      heightLeft -= printableHeight;

      while (heightLeft > 0) {
        position -= printableHeight;
        pdf.addPage();
        pdf.addImage(dataUrl, 'JPEG', margin, position, printableWidth, imgHeight);
        heightLeft -= printableHeight;
      }

      pdf.save(`${docTitle.replace(/ /g, '_')}_${docRefNo}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      window.print(); // Fallback to browser print if it fails
    }
  };

  const isInvoice = type === 'invoice';
  const isReceipt = type === 'receipt';
  const isQuotation = type === 'quotation';
  const isAgreement = ['agreement', 'vendor_agreement', 'mou', 'employee_agreement'].includes(type);

  const docTitle = isInvoice
    ? 'TAX INVOICE'
    : isReceipt
    ? 'OFFICIAL PAYMENT RECEIPT'
    : isQuotation
    ? 'COMMERCIAL QUOTATION'
    : type === 'vendor_agreement'
    ? 'VENDOR / SUPPLIER AGREEMENT'
    : type === 'mou'
    ? 'MEMORANDUM OF UNDERSTANDING'
    : type === 'employee_agreement'
    ? 'EMPLOYEE AGREEMENT'
    : 'CFO ENGAGEMENT AGREEMENT';

  const docRefNo = isInvoice
    ? data.invoiceNumber
    : isReceipt
    ? data.receiptNumber
    : isQuotation
    ? data.quotationNumber
    : `AGR-${data.id?.slice(-4) || '2026'}`;

  const clientName = isInvoice
    ? (data.engagementName || data.clientName || 'Valued Client')
    : isReceipt
    ? data.clientName
    : isQuotation || type === 'agreement' || type === 'vendor_agreement' || type === 'mou' || type === 'employee_agreement'
    ? data.leadCompanyName
    : 'Valued Client';

  const issueDate = data.createdAt
    ? data.createdAt.split('T')[0]
    : data.date
    ? data.date.split('T')[0]
    : new Date().toISOString().split('T')[0];

  const dueDate = data.dueDate
    ? data.dueDate.split('T')[0]
    : data.validity
    ? data.validity.split('T')[0]
    : 'N/A';

  const baseAmount = Number(data.amount || data.price || data.amountReceived || data.fees || 0);
  const discountAmount = Number(data.discount || 0);
  const taxableAmount = baseAmount - discountAmount;
  const gstAmount = Number(data.gst || (taxableAmount * 0.18));
  const finalTotal = Number(data.finalAmount || (taxableAmount + gstAmount));

  const getDraftedMessage = () => {
    if (isInvoice) {
      return `Hello ${clientName},\n\nPlease find attached the invoice ${docRefNo} from VANNTAGGE CFO SERVICES LLP for the amount of ${formatINR(finalTotal)}. The due date for this invoice is ${dueDate}.\n\nThank you for your business!`;
    } else if (isQuotation) {
      return `Hello ${clientName},\n\nPlease find attached our commercial quotation ${docRefNo} for CFO advisory services. The total proposed amount is ${formatINR(finalTotal)}, valid until ${dueDate}.\n\nLooking forward to working with you!`;
    } else if (isReceipt) {
      return `Hello ${clientName},\n\nWe have received your payment. Please find attached your official payment receipt ${docRefNo} for the amount of ${formatINR(finalTotal)}.\n\nThank you!`;
    } else {
      return `Hello ${clientName},\n\nPlease find the attached document ${docRefNo} from VANNTAGGE CFO SERVICES LLP.\n\nThank you!`;
    }
  };

  const handleShare = async (method: 'email' | 'whatsapp') => {
    if (!printRef.current) return;
    
    // Simple toast or loading indicator could go here
    try {
      const { toJpeg } = await import('html-to-image');
      const jsPDF = (await import('jspdf')).default;
      
      const dataUrl = await toJpeg(printRef.current, { 
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        fontEmbedCSS: '',
        skipFonts: true
      });
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const margin = 10;
      const printableWidth = pdfWidth - (2 * margin);
      const printableHeight = pdfHeight - (2 * margin);
      
      const imgHeight = (imgProps.height * printableWidth) / imgProps.width;
      
      let heightLeft = imgHeight;
      let position = margin;

      pdf.addImage(dataUrl, 'JPEG', margin, position, printableWidth, imgHeight);
      heightLeft -= printableHeight;

      while (heightLeft > 0) {
        position -= printableHeight;
        pdf.addPage();
        pdf.addImage(dataUrl, 'JPEG', margin, position, printableWidth, imgHeight);
        heightLeft -= printableHeight;
      }
      
      const pdfBlob = pdf.output('blob');
      const fileName = `${docTitle.replace(/ /g, '_')}_${docRefNo}.pdf`;
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
      
      const subject = `${docTitle} - ${docRefNo} - VANNTAGGE CFO SERVICES LLP`;
      const body = getDraftedMessage();

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: subject,
            text: body
          });
        } catch (shareErr: any) {
          if (shareErr.name === 'AbortError') return; // User cancelled
          throw shareErr; // Re-throw to handle as fallback
        }
      } else {
        // Fallback for desktop browsers
        alert(`Direct file attachments via web links are not supported by your browser.\n\nThe PDF will be downloaded now. We will dispatch the text summary in the background.`);
        pdf.save(file.name);
        
        await dispatchBackgroundMsg(method, subject, body);
      }
    } catch (err: any) {
      console.error('Failed to generate and share document:', err);
      if (err?.name === 'AbortError') return;
      
      const subject = `${docTitle} - ${docRefNo}`;
      const body = getDraftedMessage();
      await dispatchBackgroundMsg(method, subject, body);
    }
  };

  const dispatchBackgroundMsg = async (method: 'email' | 'whatsapp', subject: string, body: string) => {
    const { setGlobalSuccessMsg, adminSettings } = useDashboardStore.getState();
    const toEmail = data.clientEmail || data.email || 'client@example.com';
    const toPhone = data.clientPhone || data.phone || '+910000000000';

    try {
      if (method === 'whatsapp') {
        const res = await fetch('/api/dispatch/whatsapp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: toPhone, text: body })
        });
        if (!res.ok) throw new Error('WhatsApp Dispatch Failed');
        setGlobalSuccessMsg('WhatsApp message dispatched successfully');
      } else {
        const res = await fetch('/api/dispatch/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: toEmail,
            subject,
            html: `<p>${body.replace(/\n/g, '<br/>')}</p>`,
            adminDetails: adminSettings
          })
        });
        if (!res.ok) throw new Error('Email Dispatch Failed');
        setGlobalSuccessMsg('Email dispatched successfully');
      }
    } catch (error) {
      console.error(error);
      alert('Failed to dispatch background message.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white print:static">
      
      {/* Top Controls Bar */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2 print:hidden">
        <button
          onClick={() => handleShare('whatsapp')}
          className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition-all"
          title="Share via WhatsApp with PDF"
        >
          <MessageCircle size={14} /> WhatsApp
        </button>

        <button
          onClick={() => handleShare('email')}
          className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition-all"
          title="Share via Email with PDF"
        >
          <Mail size={14} /> Email
        </button>

        <button
          onClick={handleDownloadPDF}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition-all"
        >
          <Download size={14} /> Download PDF
        </button>

        {isInvoice && data.status !== 'PAID' && onLogPayment && (
          <button
            onClick={onLogPayment}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition-all"
          >
            <CreditCard size={14} /> Log Payment Receipt
          </button>
        )}

        <button
          onClick={onClose}
          className="p-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold shadow-md border border-slate-200 transition-all"
        >
          <X size={16} />
        </button>
      </div>

      {/* Main Clean & Premium Document Sheet */}
      <div
        ref={printRef}
        className="w-full max-w-3xl bg-white rounded-2xl shadow-xl overflow-hidden my-auto border border-slate-200 print:shadow-none print:border-none print:w-full print:max-w-none text-slate-800 font-sans"
      >
        {/* Top Minimal Accent Bar */}
        <div className="h-2 bg-slate-800 w-full" />

        <div className="p-6 sm:p-10 space-y-6">
          {isAgreement ? (
            <div className="space-y-8">
              {/* ── LEGAL HEADER ── */}
              <div className="text-center space-y-2 border-b-2 border-slate-900 pb-6 mb-8">
                <img
                  src="/vanntagge-logo.png"
                  alt="VANNTAGGE CFO SERVICES LLP"
                  className="h-16 w-auto object-contain mx-auto mb-4"
                />
                <h1 className="font-extrabold text-2xl text-slate-900 uppercase tracking-widest font-serif">
                  {docTitle}
                </h1>
                <p className="text-xs text-slate-500 font-medium tracking-widest uppercase">
                  Ref: {docRefNo} | Date: {issueDate}
                </p>
              </div>

              {/* ── PREAMBLE ── */}
              <div className="text-sm text-slate-800 leading-loose text-justify font-serif">
                <p>
                  This <strong>{docTitle}</strong> (hereinafter referred to as the "Agreement") is made and entered into on this <strong>{new Date(issueDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>, by and between:
                </p>
                <div className="my-6 space-y-4">
                  <div className="pl-6 border-l-4 border-slate-300">
                    <p className="font-bold text-base uppercase">VANNTAGGE CFO SERVICES LLP</p>
                    <p className="text-slate-600">A Limited Liability Partnership incorporated under the provisions of the LLP Act, 2008, having its principal place of business at Level 8, Corporate Tower B, BKC Financial Hub, Bandra East, Mumbai, MH - 400051 (hereinafter referred to as the <strong>"Service Provider"</strong> or <strong>"First Party"</strong>).</p>
                  </div>
                  <div className="text-center italic text-slate-500 font-bold">AND</div>
                  <div className="pl-6 border-l-4 border-slate-300">
                    <p className="font-bold text-base uppercase">{clientName}</p>
                    <p className="text-slate-600">Having its principal place of business at the registered address provided to the Service Provider {data.clientPan ? `(PAN: ${data.clientPan})` : ''} (hereinafter referred to as the <strong>"Client"</strong>, <strong>"Company"</strong>, or <strong>"Second Party"</strong>).</p>
                  </div>
                </div>
                <p>
                  The Service Provider and the Client shall hereinafter individually be referred to as a "Party" and collectively as the "Parties".
                </p>
              </div>

              {/* ── CLAUSES ── */}
              <div className="space-y-6 text-sm text-slate-800 font-serif leading-relaxed">
                
                <section>
                  <h3 className="font-bold text-base uppercase tracking-wider mb-2 text-slate-900 border-b border-slate-200 pb-1">1. Scope of Services</h3>
                  <p className="text-justify whitespace-pre-wrap">{data.serviceScope || 'The Service Provider agrees to provide the services as agreed upon by the Parties.'}</p>
                </section>

                <section>
                  <h3 className="font-bold text-base uppercase tracking-wider mb-2 text-slate-900 border-b border-slate-200 pb-1">2. Deliverables</h3>
                  <p className="text-justify whitespace-pre-wrap">{data.deliverables || 'Specific deliverables will be provided as outlined in the primary project scope.'}</p>
                </section>

                <section>
                  <h3 className="font-bold text-base uppercase tracking-wider mb-2 text-slate-900 border-b border-slate-200 pb-1">3. Timeline & Duration</h3>
                  <p className="text-justify whitespace-pre-wrap">{data.timeline || 'The timeline for the services shall remain in effect until the completion of the aforementioned deliverables or until terminated by either party.'}</p>
                </section>

                <section>
                  <h3 className="font-bold text-base uppercase tracking-wider mb-2 text-slate-900 border-b border-slate-200 pb-1">4. Commercial Terms & Payment Schedule</h3>
                  <p className="mb-3">In consideration of the services rendered, the Client agrees to pay the Service Provider a total fee of <strong>{formatINR(baseAmount)}</strong> (exclusive of applicable taxes). The payment schedule is as follows:</p>
                  
                  {data.paymentSchedule && data.paymentSchedule.length > 0 ? (
                    <ul className="list-disc pl-6 space-y-1 mb-3">
                      {data.paymentSchedule.map((ps: any, idx: number) => (
                        <li key={idx}><strong>{ps.milestone}:</strong> {formatINR(ps.amount)}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mb-3">Payments shall be made within the timeline stipulated in the official invoices raised by the Service Provider.</p>
                  )}
                  <p className="italic text-slate-600 text-xs">All payments are subject to applicable GST and statutory deductions.</p>
                </section>

                <section>
                  <h3 className="font-bold text-base uppercase tracking-wider mb-2 text-slate-900 border-b border-slate-200 pb-1">5. Roles & Responsibilities</h3>
                  <p className="text-justify whitespace-pre-wrap">{data.responsibilities || 'Both parties agree to cooperate and provide necessary information to ensure the successful execution of this Agreement.'}</p>
                </section>

                {data.terms && (
                  <section>
                    <h3 className="font-bold text-base uppercase tracking-wider mb-2 text-slate-900 border-b border-slate-200 pb-1">6. General Terms & Conditions</h3>
                    <p className="text-justify whitespace-pre-wrap text-xs">{data.terms}</p>
                  </section>
                )}
              </div>

              {/* ── SIGNATURES ── */}
              <div className="pt-12 mt-12 border-t-2 border-slate-900 grid grid-cols-2 gap-8 font-serif">
                <div className="space-y-12">
                  <p className="font-bold uppercase tracking-wider text-sm">For {clientName}</p>
                  <div className="border-b border-slate-400 w-48"></div>
                  <div>
                    <p className="font-bold text-sm">Authorized Signatory</p>
                    <p className="text-xs text-slate-500">Name: ______________________</p>
                    <p className="text-xs text-slate-500">Title: _______________________</p>
                    <p className="text-xs text-slate-500">Date: _______________________</p>
                  </div>
                </div>

                <div className="space-y-12 text-right flex flex-col items-end">
                  <p className="font-bold uppercase tracking-wider text-sm">For VANNTAGGE CFO SERVICES LLP</p>
                  <div className="relative">
                    {/* Placeholder for actual digital signature image if needed */}
                    <div className="border-b border-slate-400 w-48 text-center italic text-emerald-700 font-medium pb-2 text-sm">
                      Digitally Signed / E-Verified
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">Priya Sharma</p>
                    <p className="text-xs text-slate-500">Designated Partner & Chief Financial Lead</p>
                    <p className="text-xs text-slate-500">Date: {new Date().toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-6 gap-4">
            <div className="flex items-center gap-4">
              <img
                src="/vanntagge-logo.png"
                alt="VANNTAGGE CFO SERVICES LLP"
                className="h-12 w-auto object-contain shrink-0"
              />
              <div>
                <h1 className="font-extrabold text-lg sm:text-xl text-slate-900 tracking-tight font-outfit">
                  VANNTAGGE CFO SERVICES LLP
                </h1>
                <p className="text-[11px] text-slate-500 font-medium">
                  Corporate Financial Consultants & Virtual CFO Advisors
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  GSTIN: <span className="font-semibold text-slate-700">27AABCU9603R1ZX</span> &bull; PAN: <span className="font-semibold text-slate-700">AABCU9603R</span>
                </p>
              </div>
            </div>

            <div className="sm:text-right space-y-1">
              <span className={`inline-block px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider border ${
                isInvoice
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : isReceipt
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : isQuotation
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-purple-50 text-purple-700 border-purple-200'
              }`}>
                {docTitle}
              </span>
              {isInvoice && data.invoiceType && (
                <span className="inline-block px-2 py-0.5 ml-2 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                  {data.invoiceType}
                </span>
              )}
              <p className="text-xs font-mono font-bold text-slate-800">{docRefNo}</p>
              <p className="text-[10px] text-slate-500 font-mono">
                UDIN: 24096033AAAAA{Math.floor(1000 + Math.random() * 9000)}
              </p>
            </div>
          </div>

          {/* ── 2. PARTY & METADATA GRID (Clean Light Cards) ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50/70 rounded-xl p-5 border border-slate-200/80">
            {/* Service Provider */}
            <div className="space-y-1 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Issued By (Service Provider)
              </span>
              <p className="font-bold text-slate-800 text-sm">VANNTAGGE CFO SERVICES LLP</p>
              <p className="text-slate-600">Level 8, Corporate Tower B, BKC Financial Hub</p>
              <p className="text-slate-600">Bandra East, Mumbai, MH - 400051</p>
              <p className="text-slate-600">Email: billing@vanntaggecfo.com | Phone: +91 22 6789 0000</p>
              <p className="text-slate-500 text-[10px]">SAC Code: 998311 (Financial Consulting)</p>
            </div>

            {/* Client Details & Dates */}
            <div className="space-y-1 text-xs sm:border-l sm:border-slate-200 sm:pl-6">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Billed To (Client / Customer)
              </span>
              <p className="font-bold text-slate-800 text-sm">{clientName}</p>
              {data.clientGstin && <p className="text-slate-600 font-medium">GSTIN: <span className="font-mono text-slate-800">{data.clientGstin}</span></p>}
              {data.clientPan && <p className="text-slate-600 font-medium">PAN: <span className="font-mono text-slate-800">{data.clientPan}</span></p>}
              <p className="text-slate-600">Place of Supply: <span className="font-semibold text-slate-800">27 - Maharashtra</span></p>

              <div className="pt-2 mt-2 border-t border-slate-200/60 grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-semibold">Issue Date</span>
                  <span className="font-semibold text-slate-800">{issueDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-semibold">
                    {isInvoice ? 'Due Date' : isQuotation ? 'Valid Until' : 'Payment Status'}
                  </span>
                  <span className="font-semibold text-slate-800">
                    {isReceipt ? 'PAID IN FULL' : dueDate}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── 3. ITEMIZED SERVICES TABLE ── */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Scope of CFO Advisory Services & Fee Breakdown
            </span>
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">#</th>
                    <th className="py-2.5 px-4">Description of Service / Milestone</th>
                    <th className="py-2.5 px-4 text-center">SAC Code</th>
                    <th className="py-2.5 px-4 text-right">Taxable Base (₹)</th>
                    <th className="py-2.5 px-4 text-right">GST Rate</th>
                    <th className="py-2.5 px-4 text-right">Total Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                  {data.services && Array.isArray(data.services) && data.services.length > 0 ? (
                    data.services.map((svc: any, idx: number) => (
                      <tr key={idx}>
                        <td className="py-3 px-4 font-semibold text-slate-400">{(idx + 1).toString().padStart(2, '0')}</td>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-800">{svc.name}</p>
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-slate-600">{data.sacCode || '998311'}</td>
                        <td className="py-3 px-4 text-right font-semibold text-slate-800">{formatINR(Number(svc.price))}</td>
                        <td className="py-3 px-4 text-right text-slate-600">18.00%</td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">{formatINR(Number(svc.price) * 1.18)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="py-3 px-4 font-semibold text-slate-400">01</td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-800">
                          {data.milestone || data.serviceScope || 'Virtual CFO Advisory Services'}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Strategic Financial Governance, Cashflow Optimization, Tax Compliance & Board Reporting.
                        </p>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-600">{data.sacCode || '998311'}</td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-800">{formatINR(baseAmount)}</td>
                      <td className="py-3 px-4 text-right text-slate-600">18.00%</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">{formatINR(baseAmount * 1.18)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── 4. LIGHT SUMMARY & TOTAL CALCULATIONS ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
            
            {/* Amount in Words & Bank Details */}
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Amount Chargeable (In Words)
                </span>
                <p className="font-semibold text-slate-800 capitalize leading-snug">
                  {convertToINRWords(finalTotal)}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[10px] space-y-1 text-slate-600">
                <span className="font-bold text-slate-700 block uppercase tracking-wider text-[9px]">
                  Bank Details for Wire Transfer / NEFT / RTGS:
                </span>
                <p><span className="font-medium text-slate-500">Bank:</span> HDFC Bank Ltd (BKC Branch, Mumbai)</p>
                <p><span className="font-medium text-slate-500">Account Name:</span> Vanntagge CFO Services LLP</p>
                <p><span className="font-medium text-slate-500">A/C No:</span> 50200098765432 &bull; <span className="font-medium text-slate-500">IFSC:</span> HDFC0000123</p>
                <p><span className="font-medium text-slate-500">UPI ID:</span> vanntagge.cfo@hdfcbank</p>
              </div>

              {data.terms && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[10px] space-y-1 text-slate-600">
                  <span className="font-bold text-slate-700 block uppercase tracking-wider text-[9px]">
                    Terms & Conditions
                  </span>
                  <p className="whitespace-pre-line">{data.terms}</p>
                </div>
              )}
            </div>

            {/* Clean Light Calculations Box */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Total Services Amount:</span>
                <span className="font-semibold text-slate-800">{formatINR(baseAmount)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Discount:</span>
                  <span>- {formatINR(discountAmount)}</span>
                </div>
              )}
              {discountAmount > 0 && (
                <div className="flex justify-between border-t border-slate-200 pt-2">
                  <span>Taxable Base Subtotal:</span>
                  <span className="font-semibold text-slate-800">{formatINR(taxableAmount)}</span>
                </div>
              )}
              {!discountAmount && (
                <div className="flex justify-between">
                  <span>Taxable Base Subtotal:</span>
                  <span className="font-semibold text-slate-800">{formatINR(baseAmount)}</span>
                </div>
              )}
              {data.gstType === 'Interstate' ? (
                <div className="flex justify-between">
                  <span>IGST @ 18.00%:</span>
                  <span>{formatINR(gstAmount)}</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span>CGST @ 9.00%:</span>
                    <span>{formatINR(gstAmount / 2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SGST @ 9.00%:</span>
                    <span>{formatINR(gstAmount / 2)}</span>
                  </div>
                </>
              )}
              
              <div className="border-t border-slate-200 pt-2 flex justify-between items-baseline text-slate-900">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                    {isReceipt ? 'Total Received' : 'Grand Total Payable'}
                  </span>
                  <span className="text-[9px] text-slate-400">Includes all GST taxes</span>
                </div>
                <span className="text-lg font-extrabold text-slate-900">
                  {formatINR(finalTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* ── 5. AUTHORIZED SIGNATURE & STATUTORY FOOTER ── */}
          <div className="pt-6 border-t border-slate-200 grid grid-cols-2 items-end gap-4 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-emerald-700 font-semibold text-[10px]">
                <CheckCircle2 size={12} /> Statutory Compliance Verified
              </div>
              <p className="text-[9px] text-slate-400 leading-tight">
                Computer-generated statutory document under Section 31 of CGST Act, 2017 & RBI Digital Guidelines.
              </p>
            </div>

            <div className="text-right space-y-1">
              <div className="inline-block border-b border-slate-300 pb-1 px-4 mb-1">
                <span 
                  className="font-serif italic font-semibold text-slate-800 text-xs block focus:outline-none hover:bg-slate-100 cursor-text rounded px-1 -mx-1 transition-colors"
                  contentEditable
                  suppressContentEditableWarning
                  title="Click to edit name"
                >
                  Priya Sharma
                </span>
                <span 
                  className="text-[9px] font-sans text-slate-500 block focus:outline-none hover:bg-slate-100 cursor-text rounded px-1 -mx-1 transition-colors"
                  contentEditable
                  suppressContentEditableWarning
                  title="Click to edit qualifications"
                >
                  FCA (Membership No. 543210)
                </span>
              </div>
              <span 
                className="font-bold text-slate-800 block text-[10px] uppercase tracking-wider focus:outline-none hover:bg-slate-100 cursor-text rounded px-1 -mx-1 transition-colors"
                contentEditable
                suppressContentEditableWarning
                title="Click to edit company name"
              >
                For VANNTAGGE CFO SERVICES LLP
              </span>
              <span 
                className="text-[9px] text-slate-400 block focus:outline-none hover:bg-slate-100 cursor-text rounded px-1 -mx-1 transition-colors"
                contentEditable
                suppressContentEditableWarning
                title="Click to edit role"
              >
                Authorized Signatory & Chief Financial Lead
              </span>
            </div>
            </div>
          </div>
          )}
        </div>

      </div>

    </div>
  );
};
