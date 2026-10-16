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

function formatDateDisplay(dateStr?: string): string {
  if (!dateStr || dateStr === 'N/A') {
    const d = new Date();
    return `${String(d.getDate()).padStart(2, '0')} / ${String(d.getMonth() + 1).padStart(2, '0')} / ${d.getFullYear()}`;
  }
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return `${String(d.getDate()).padStart(2, '0')} / ${String(d.getMonth() + 1).padStart(2, '0')} / ${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

function formatPeriodDisplay(dateStr?: string, customPeriod?: string): string {
  if (customPeriod) return customPeriod;
  try {
    const d = dateStr ? new Date(dateStr) : new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return 'Oct 2026';
  }
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
  const isUnregistered = data.billingEntity && (
    data.billingEntity.includes('HUF') ||
    data.billingEntity.includes('LLP') ||
    data.billingEntity.includes('Ajit Shinde')
  );
  const gstAmount = data.gst !== undefined 
    ? Number(data.gst) 
    : isUnregistered 
    ? 0 
    : Number(taxableAmount * 0.18);
  const finalTotal = data.finalAmount !== undefined 
    ? Number(data.finalAmount) 
    : Number(taxableAmount + gstAmount);

  const billingEntityName = data.billingEntity || 'CA TEJJASHRI S PAAWAR';
  const upperBillingEntityName = billingEntityName.toUpperCase();

  const isTejjashriEntity = upperBillingEntityName.includes('TEJJASHRI') || upperBillingEntityName.includes('TEJASHRI');
  const isHufEntity = upperBillingEntityName.includes('HUF');

  const defaultSignatoryName = isTejjashriEntity
    ? 'CA TEJJASHRI S PAAWAR'
    : isHufEntity
    ? 'TEJJASHRI S PAAWAR'
    : 'CA TEJJASHRI S PAAWAR';

  const defaultSignatoryRole = isTejjashriEntity
    ? 'Partner & Authorized Signatory'
    : isHufEntity
    ? 'Authorized Signatory & Representative'
    : 'Partner & Authorized Signatory';

  const getDraftedMessage = () => {
    if (isInvoice) {
      return `Hello ${clientName},\n\nPlease find attached the invoice ${docRefNo} from ${upperBillingEntityName} for the amount of ${formatINR(finalTotal)}. The due date for this invoice is ${dueDate}.\n\nThank you for your business!`;
    } else if (isQuotation) {
      return `Hello ${clientName},\n\nPlease find attached our commercial quotation ${docRefNo} for CFO advisory services. The total proposed amount is ${formatINR(finalTotal)}, valid until ${dueDate}.\n\nLooking forward to working with you!`;
    } else if (isReceipt) {
      return `Hello ${clientName},\n\nWe have received your payment. Please find attached your official payment receipt ${docRefNo} for the amount of ${formatINR(finalTotal)}.\n\nThank you!`;
    } else {
      return `Hello ${clientName},\n\nPlease find the attached document ${docRefNo} from ${upperBillingEntityName}.\n\nThank you!`;
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
      
      const subject = `${docTitle} - ${docRefNo} - ${upperBillingEntityName}`;
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
          body: JSON.stringify({ to: toPhone, text: body, adminDetails: adminSettings })
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
        className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden my-auto border border-slate-200 print:shadow-none print:border-none print:w-full print:max-w-none text-slate-800 font-sans"
      >
        {isAgreement ? (
          <div>
            <div className="h-2 bg-slate-800 w-full" />
            <div className="p-6 sm:p-10 space-y-6">
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
                    <p className="font-bold text-base uppercase">{upperBillingEntityName}</p>
                    <p className="text-slate-600">A registered entity having its principal place of business at Gala No. 28, OM Anand Industrial Premises Co-op, Wagle I.E., Thane - 400604, Maharashtra (hereinafter referred to as the <strong>"Service Provider"</strong> or <strong>"First Party"</strong>).</p>
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
                  <p className="font-bold uppercase tracking-wider text-sm">For {upperBillingEntityName}</p>
                  <div className="relative">
                    <div className="flex flex-col items-end border-b border-slate-400 pb-2 w-48 text-center">
                      <img 
                        src="/signature-tejjashri.png" 
                        alt="Signature" 
                        className="h-12 w-auto object-contain mb-1 drop-shadow-xs" 
                        onError={(e) => { (e.target as HTMLImageElement).src = '/signature.png'; }} 
                      />
                      <span className="italic text-emerald-700 font-medium text-[10px] mt-1 block">Digitally Signed / E-Verified</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">{defaultSignatoryName}</p>
                    <p className="text-xs text-slate-500">{defaultSignatoryRole}</p>
                    <p className="text-xs text-slate-500">Date: {new Date().toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ── OFFICIAL VANNTAGGE CORPORATE TEMPLATE (INVOICE / QUOTATION / RECEIPT) ── */
          (() => {
            const storeClients = useDashboardStore.getState().clients;
            const matchedClient = storeClients.find(
              (c) => c.companyName?.toLowerCase() === clientName.toLowerCase() || c.id === data.clientId
            );
            const clientAddress = data.clientAddress || data.address || matchedClient?.address || 'Registered Office Address, Maharashtra';
            const clientGstin = data.clientGstin || data.gstin || matchedClient?.gstin || 'Unregistered';
            const placeOfSupply = data.placeOfSupply || '27 - Maharashtra';
            const isInterstate = data.gstType === 'Interstate' || (!placeOfSupply.includes('27') && !placeOfSupply.toLowerCase().includes('maharashtra'));

            const itemsList: Array<{ description: string; period: string; sac: string; amount: number }> = [];

            if (data.lineItems && Array.isArray(data.lineItems) && data.lineItems.length > 0) {
              data.lineItems.forEach((li: any) => {
                itemsList.push({
                  description: li.description || li.name || 'Virtual CFO Advisory Services',
                  period: li.period || data.billingPeriod || formatPeriodDisplay(issueDate),
                  sac: li.sac || li.sacCode || data.sacCode || '998311',
                  amount: Number(li.amount || li.price || 0)
                });
              });
            } else if (data.services && Array.isArray(data.services) && data.services.length > 0) {
              data.services.forEach((svc: any) => {
                itemsList.push({
                  description: svc.name || svc.description || 'Virtual CFO Advisory Services',
                  period: svc.period || data.billingPeriod || formatPeriodDisplay(issueDate),
                  sac: svc.sac || svc.sacCode || data.sacCode || '998311',
                  amount: Number(svc.price || svc.amount || 0)
                });
              });
            } else {
              itemsList.push({
                description: data.serviceName || data.milestone || data.serviceScope || 'Virtual CFO Retainer - MIS & advisory',
                period: data.billingPeriod || formatPeriodDisplay(issueDate),
                sac: data.sacCode || '998311',
                amount: taxableAmount > 0 ? taxableAmount : baseAmount
              });
            }

            const emptyRows: number[] = [];
            for (let i = itemsList.length + 1; i <= 4; i++) {
              emptyRows.push(i);
            }

            return (
              <div className="bg-white text-slate-800 font-sans">
                {/* 1. TOP NAVY CORPORATE HEADER */}
                <div className="bg-[#0B192C] px-6 sm:px-8 py-5 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wide text-white">
                      VANNTAGGE CFO SERVICES LLP
                    </h1>
                    <p className="text-[#38BDF8] text-xs font-semibold tracking-wide">
                      Virtual CFO | Funding Advisory | Due Diligence | Franchise Development
                    </p>
                    <p className="text-slate-300 text-[11px] leading-tight max-w-lg">
                      Gala No. 28, OM Anand Industrial Premises Co-op, Wagle I.E., Thane - 400604, Maharashtra
                    </p>
                  </div>

                  <div className="text-left sm:text-right space-y-0.5 sm:shrink-0">
                    <div className="text-[#F59E0B] font-extrabold text-xl sm:text-2xl uppercase tracking-wider">
                      {docTitle}
                    </div>
                    <div className="text-slate-200 text-xs font-medium space-y-0.5">
                      <p>GSTIN: <span className="font-mono text-white">27AABCU9603R1ZX</span></p>
                      <p>PAN: <span className="font-mono text-white">AABCU9603R</span> &nbsp;&bull;&nbsp; LLPIN: <span className="font-mono text-white">AAT-1234</span></p>
                      <p className="text-slate-300 text-[11px]">www.vcfoedge.net &nbsp;|&nbsp; info@vcfoedge.net</p>
                    </div>
                  </div>
                </div>

                {/* GOLD ACCENT STRIPE */}
                <div className="h-1 bg-[#D97706] w-full" />

                {/* 2. DOCUMENT BODY */}
                <div className="p-6 sm:p-8 space-y-5">
                  {/* SIDE-BY-SIDE METADATA CARDS */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    {/* BILL TO */}
                    <div className="border border-slate-300 bg-[#F8FAFC] p-3.5 rounded-sm">
                      <div className="font-bold text-slate-900 uppercase tracking-wider text-xs border-b border-slate-200 pb-1 mb-2">
                        BILL TO
                      </div>
                      <div className="space-y-1.5 text-slate-700">
                        <div className="flex">
                          <span className="w-24 text-slate-500 shrink-0">Client Name</span>
                          <span className="font-bold text-slate-900">{clientName}</span>
                        </div>
                        <div className="flex">
                          <span className="w-24 text-slate-500 shrink-0">Address</span>
                          <span className="text-slate-800 leading-snug">{clientAddress}</span>
                        </div>
                        <div className="flex">
                          <span className="w-24 text-slate-500 shrink-0">GSTIN</span>
                          <span className="font-mono font-medium text-slate-900">{clientGstin}</span>
                        </div>
                        <div className="flex">
                          <span className="w-24 text-slate-500 shrink-0">State / Code</span>
                          <span className="text-slate-800">{placeOfSupply}</span>
                        </div>
                      </div>
                    </div>

                    {/* INVOICE / QUOTATION DETAILS */}
                    <div className="border border-slate-300 bg-[#F8FAFC] p-3.5 rounded-sm">
                      <div className="font-bold text-slate-900 uppercase tracking-wider text-xs border-b border-slate-200 pb-1 mb-2">
                        {isInvoice ? 'INVOICE DETAILS' : isQuotation ? 'QUOTATION DETAILS' : 'RECEIPT DETAILS'}
                      </div>
                      <div className="space-y-1.5 text-slate-700">
                        <div className="flex">
                          <span className="w-28 text-slate-500 shrink-0">
                            {isInvoice ? 'Invoice No.' : isQuotation ? 'Quotation No.' : 'Receipt No.'}
                          </span>
                          <span className="font-mono font-bold text-slate-900">{docRefNo}</span>
                        </div>
                        <div className="flex">
                          <span className="w-28 text-slate-500 shrink-0">
                            {isInvoice ? 'Invoice Date' : isQuotation ? 'Quotation Date' : 'Receipt Date'}
                          </span>
                          <span className="font-medium text-slate-900">{formatDateDisplay(issueDate)}</span>
                        </div>
                        <div className="flex">
                          <span className="w-28 text-slate-500 shrink-0">
                            {isInvoice ? 'Due Date' : isQuotation ? 'Validity' : 'Payment Status'}
                          </span>
                          <span className="font-medium text-slate-900">
                            {isReceipt
                              ? 'PAID IN FULL'
                              : isQuotation && (dueDate === 'N/A' || !dueDate)
                              ? '30 Days from issue'
                              : formatDateDisplay(dueDate)}
                          </span>
                        </div>
                        <div className="flex">
                          <span className="w-28 text-slate-500 shrink-0">Place of Supply</span>
                          <span className="text-slate-800">{placeOfSupply}</span>
                        </div>
                        <div className="flex">
                          <span className="w-28 text-slate-500 shrink-0">SAC Code</span>
                          <span className="font-mono text-slate-900">{data.sacCode || '998311 (Mgmt. Consulting)'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3. ITEMIZED SERVICES TABLE */}
                  <div className="border border-slate-300 rounded-sm overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-[#0B192C] text-white font-bold text-[11px] uppercase tracking-wider">
                        <tr>
                          <th className="py-2.5 px-3 text-center border-r border-slate-700 w-12">#</th>
                          <th className="py-2.5 px-3 border-r border-slate-700">Description of Services</th>
                          <th className="py-2.5 px-3 text-center border-r border-slate-700 w-28">Period</th>
                          <th className="py-2.5 px-3 text-center border-r border-slate-700 w-24">SAC</th>
                          <th className="py-2.5 px-3 text-right w-36">Amount (Rs.)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white text-slate-800">
                        {itemsList.map((item, idx) => (
                          <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}>
                            <td className="py-3 px-3 text-center text-slate-500 border-r border-slate-200 font-medium">
                              {idx + 1}
                            </td>
                            <td className="py-3 px-3 border-r border-slate-200">
                              <span className="font-semibold text-slate-900">{item.description}</span>
                            </td>
                            <td className="py-3 px-3 text-center text-slate-600 border-r border-slate-200">
                              {item.period}
                            </td>
                            <td className="py-3 px-3 text-center font-mono text-slate-600 border-r border-slate-200">
                              {item.sac}
                            </td>
                            <td className="py-3 px-3 text-right font-bold text-slate-900">
                              {item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                        {emptyRows.map((rowNum) => (
                          <tr key={`empty-${rowNum}`} className="h-8">
                            <td className="py-2.5 px-3 text-center text-slate-400 border-r border-slate-200 font-medium">
                              {rowNum}
                            </td>
                            <td className="py-2.5 px-3 border-r border-slate-200"></td>
                            <td className="py-2.5 px-3 border-r border-slate-200"></td>
                            <td className="py-2.5 px-3 border-r border-slate-200"></td>
                            <td className="py-2.5 px-3 text-right"></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* 4. SUMMARY & TAX BREAKDOWN */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-start text-xs pt-1">
                    {/* Left: Words & Reverse Charge */}
                    <div className="sm:col-span-6 space-y-4 pt-1">
                      <div>
                        <span className="font-bold text-slate-900 block mb-1">Amount in words:</span>
                        <p className="text-slate-800 font-medium leading-relaxed italic border-b border-slate-200 pb-2">
                          {convertToINRWords(finalTotal)}
                        </p>
                      </div>
                      <div className="text-slate-600 text-xs">
                        <span className="font-semibold text-slate-800">Whether tax payable on reverse charge:</span> No
                      </div>
                    </div>

                    {/* Right: Tax Breakdown and Total Block */}
                    <div className="sm:col-span-6 space-y-1.5">
                      <div className="flex justify-between py-1 border-b border-slate-200 text-slate-700">
                        <span>Taxable Value</span>
                        <span className="font-semibold text-slate-900">
                          Rs. {taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200 text-slate-700">
                        <span>CGST @ 9%</span>
                        <span className="text-slate-900">
                          {isInterstate ? '—' : `Rs. ${(gstAmount / 2).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200 text-slate-700">
                        <span>SGST @ 9%</span>
                        <span className="text-slate-900">
                          {isInterstate ? '—' : `Rs. ${(gstAmount / 2).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200 text-slate-700">
                        <span>IGST @ 18% (inter-state)</span>
                        <span className="text-slate-900">
                          {isInterstate ? `Rs. ${gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                        </span>
                      </div>

                      {/* TOTAL INVOICE VALUE SOLID NAVY BANNER */}
                      <div className="bg-[#0B192C] text-white px-3.5 py-2.5 flex justify-between items-center rounded-sm font-bold text-sm mt-2">
                        <span className="tracking-wide uppercase">
                          {isReceipt ? 'TOTAL AMOUNT RECEIVED' : isQuotation ? 'TOTAL PROPOSED VALUE' : 'TOTAL INVOICE VALUE'}
                        </span>
                        <span className="text-[#FBBF24] font-extrabold text-base">
                          Rs. {finalTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 5. SIDE-BY-SIDE BANK DETAILS & TERMS */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
                    {/* BANK DETAILS */}
                    <div className="border border-slate-300 bg-[#F8FAFC] p-3.5 rounded-sm">
                      <div className="font-bold text-slate-900 uppercase tracking-wider text-xs border-b border-slate-200 pb-1 mb-2">
                        BANK DETAILS (for NEFT / RTGS / UPI)
                      </div>
                      <div className="space-y-1 text-slate-700 text-[11px] leading-relaxed">
                        <p><span className="font-semibold text-slate-900">Account Name :</span> VANNTAGGE CFO Services LLP</p>
                        <p><span className="font-semibold text-slate-900">Bank &amp; Branch :</span> HDFC Bank, Wagle Industrial Estate, Thane - 400604</p>
                        <p><span className="font-semibold text-slate-900">A/c No. :</span> 50200088991122</p>
                        <p><span className="font-semibold text-slate-900">IFSC :</span> HDFC0000123 &nbsp;&nbsp;&nbsp;&nbsp; <span className="font-semibold text-slate-900">UPI :</span> vanntagge.cfo@hdfcbank</p>
                      </div>
                    </div>

                    {/* TERMS */}
                    <div className="border border-slate-300 bg-[#F8FAFC] p-3.5 rounded-sm">
                      <div className="font-bold text-slate-900 uppercase tracking-wider text-xs border-b border-slate-200 pb-1 mb-2">
                        TERMS
                      </div>
                      <div className="space-y-1 text-slate-700 text-[11px] leading-relaxed">
                        {isInvoice ? (
                          <>
                            <p>1. Payment due within 7 days of invoice date.</p>
                            <p>2. Please quote invoice no. while remitting.</p>
                            <p>3. TDS u/s 194J, if deducted, kindly share Form 16A.</p>
                            <p>4. Subject to Thane jurisdiction.</p>
                          </>
                        ) : isQuotation ? (
                          <>
                            <p>1. Quotation valid for 30 days from date of issue.</p>
                            <p>2. 50% mobilization advance payable upon confirmation.</p>
                            <p>3. TDS u/s 194J applicable on management consulting services.</p>
                            <p>4. Subject to Thane jurisdiction.</p>
                          </>
                        ) : (
                          <>
                            <p>1. Payment received with thanks and subject to realization.</p>
                            <p>2. Please retain this receipt for GST input tax credit (ITC) reconciliation.</p>
                            <p>3. TDS u/s 194J credit will reflect in Form 26AS.</p>
                            <p>4. Subject to Thane jurisdiction.</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 6. SIGN-OFF & FOOTER */}
                  <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-end gap-6 text-xs">
                    {/* Slogan and Thanks */}
                    <div className="space-y-1 text-left">
                      <p className="font-semibold text-slate-800 text-sm">Thank you for your business.</p>
                      <p className="italic font-semibold text-[#D97706] text-xs">Insight. Strategy. Growth.</p>
                    </div>

                    {/* Designated Partner Sign-off */}
                    <div className="text-right space-y-1 flex flex-col items-end">
                      <p className="font-bold text-slate-900 text-xs uppercase">
                        For VANNTAGGE CFO Services LLP
                      </p>
                      <div className="h-12 w-44 flex items-center justify-end">
                        <img
                          src="/signature-tejjashri.png"
                          alt="Signature"
                          className="h-12 w-auto object-contain select-none"
                          onError={(e) => { (e.target as HTMLImageElement).src = '/signature.png'; }}
                        />
                      </div>
                      <p className="text-xs text-slate-700 font-medium">Designated Partner</p>
                    </div>
                  </div>

                  {/* BOTTOM CENTER COMPUTER GENERATED NOTE & VASHI OFFICE */}
                  <div className="text-center pt-4 border-t border-slate-100 text-[10px] text-slate-400 space-y-0.5">
                    <p className="italic">This is a computer-generated invoice.</p>
                    <p className="text-slate-500 font-medium">
                      Vashi Office: Office No. 318 &amp; 319, Commodity Exchange Bldg., Sector 19A, Opp. Dana Bunder, Vashi, Navi Mumbai - 400705
                    </p>
                  </div>
                </div>
              </div>
            );
          })()
        )}
      </div>

    </div>
  );
};
