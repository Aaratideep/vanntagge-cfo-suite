'use client';

import React, { useRef, useState } from 'react';
import { X, MessageCircle, Mail, Download, CreditCard, Plus } from 'lucide-react';
import { useDashboardStore } from '../store/dashboardStore';

function numberToWords(num: number): string {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if ((num = num.toString() as any).length > 9) return 'overflow';
  let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';
  let str = '';
  str += (n[1] != '00') ? (a[Number(n[1])] || b[n[1][0] as any] + ' ' + a[n[1][1] as any]) + 'Crore ' : '';
  str += (n[2] != '00') ? (a[Number(n[2])] || b[n[2][0] as any] + ' ' + a[n[2][1] as any]) + 'Lakh ' : '';
  str += (n[3] != '00') ? (a[Number(n[3])] || b[n[3][0] as any] + ' ' + a[n[3][1] as any]) + 'Thousand ' : '';
  str += (n[4] != '0') ? (a[Number(n[4])] || b[n[4][0] as any] + ' ' + a[n[4][1] as any]) + 'Hundred ' : '';
  str += (n[5] != '00') ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0] as any] + ' ' + a[n[5][1] as any]) + 'Only' : 'Only';
  return str.trim() + ' Rupees Only';
}

export const TaxInvoiceModal: React.FC = () => {
  const { 
    activeInvoiceForModal, 
    setActiveInvoiceForModal, 
    addStandaloneReceipt,
    clients,
    engagements,
    adminSettings
  } = useDashboardStore();
  const printRef = useRef<HTMLDivElement>(null);
  const [additionalCharges, setAdditionalCharges] = useState<number>(0);
  const [chargesDesc, setChargesDesc] = useState<string>('Additional Service Charges');

  if (!activeInvoiceForModal) return null;

  const handlePrint = () => {
    window.print();
  };

  const dispatchAction = async (channel: 'WHATSAPP' | 'EMAIL') => {
    const inv = activeInvoiceForModal;
    const eng = engagements.find(e => e.id === inv.engagementId);
    const client = clients.find(c => c.id === eng?.clientId);
    
    const clientPhone = client?.phone || (eng as any)?.clientContactPhone || '';
    const clientEmail = client?.email || (eng as any)?.clientContactEmail || '';
    const clientName = client?.contactPerson || client?.companyName || "Valued Client";
    const serviceName = eng?.name || "CFO Advisory & Statutory Governance";
    const amountStr = (inv.amount || 0).toLocaleString("en-IN");

    const dispatchUrl = (url: string) => {
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    if (channel === 'WHATSAPP') {
      const whatsappMsg = `*${adminSettings.companyName} - Official Invoice Notice*\n\nHello ${clientName},\nYour tax invoice *${inv.invoiceNumber}* for *₹${amountStr}* has been issued.\n\n• Service: ${serviceName}\n• Signatory: ${adminSettings.adminName} (${adminSettings.adminPhone})\n\nPlease remit via Bank/UPI transfer. Reach out for any questions.`;
      
      let sanitizedPhone = clientPhone.replace(/\D/g, '');
      if (sanitizedPhone.length === 10) {
        sanitizedPhone = '91' + sanitizedPhone;
      }

      const url = sanitizedPhone 
        ? `https://api.whatsapp.com/send?phone=${sanitizedPhone}&text=${encodeURIComponent(whatsappMsg)}`
        : `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappMsg)}`;
      dispatchUrl(url);
    } else {
      const subject = `Tax Invoice ${inv.invoiceNumber} - ${adminSettings.companyName}`;
      const body = `Dear ${clientName},\n\nPlease find the tax invoice details for ${serviceName} below:\n\n• Invoice No: ${inv.invoiceNumber}\n• Amount Payable: ₹${amountStr}\n\nFor clarifications, reply directly to ${adminSettings.adminEmail}.\n\nWarm regards,\n${adminSettings.adminName}\n${adminSettings.companyName}`;
      
      const url = clientEmail 
        ? `mailto:${clientEmail}?cc=${adminSettings.adminEmail}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
        : `mailto:?cc=${adminSettings.adminEmail}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      dispatchUrl(url);
    }
  };

  const handleLogPayment = () => {
    addStandaloneReceipt({
      invoiceId: activeInvoiceForModal.id,
      date: new Date().toISOString(),
      amountReceived: activeInvoiceForModal.amount,
      mode: 'NEFT',
      transactionId: 'TRX-' + Math.floor(Math.random() * 10000)
    } as any);
    alert("Payment logged successfully! Billing vs Collections chart updated.");
    setActiveInvoiceForModal(null);
  };

  const invoiceBase = activeInvoiceForModal.amount || 0;
  const baseAmount = invoiceBase + (additionalCharges || 0);
  const cgst = baseAmount * 0.09;
  const sgst = baseAmount * 0.09;
  const total = baseAmount + cgst + sgst;
  const amountInWords = numberToWords(Math.round(total));

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          #invoice-print-area, #invoice-print-area * { visibility: visible; }
          #invoice-print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}} />
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        
        {/* Top Controls Bar */}
        <div className="fixed top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white p-2 rounded-xl shadow-2xl no-print z-[60]">
          <button onClick={() => dispatchAction('WHATSAPP')} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] text-white rounded-lg text-sm font-bold hover:bg-[#1EBE5D] transition-colors">
            <MessageCircle size={16} /> WhatsApp
          </button>
          <button onClick={() => dispatchAction('EMAIL')} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0047FF] text-white rounded-lg text-sm font-bold hover:bg-[#0038D1] transition-colors">
            <Mail size={16} /> Email
          </button>
          <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1E293B] text-white rounded-lg text-sm font-bold hover:bg-[#0F172A] transition-colors">
            <Download size={16} /> Download PDF
          </button>
          <button onClick={handleLogPayment} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#10B981] text-white rounded-lg text-sm font-bold hover:bg-[#059669] transition-colors">
            <CreditCard size={16} /> Log Payment
          </button>
          <div className="w-px h-6 bg-slate-200 mx-2"></div>
          <button onClick={() => setActiveInvoiceForModal(null)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Invoice Canvas */}
        <div id="invoice-print-area" className="bg-white w-[850px] max-h-[90vh] overflow-y-auto shadow-2xl rounded-sm text-slate-800">
          <div className="p-10" ref={printRef}>
            
            {/* Header */}
            <div className="flex justify-between items-start mb-10 border-b-2 border-slate-900 pb-6">
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">VANNTAGGE CFO SERVICES LLP</h1>
                <p className="text-slate-500 font-medium text-sm mt-1">Corporate Financial Consultants & Virtual CFO Advisors</p>
                <div className="flex gap-4 mt-3 text-[10px] font-bold text-slate-500 tracking-wider">
                  <span>GSTIN: 27AABCU9603R1ZX</span>
                  <span>•</span>
                  <span>PAN: AABCU9603R</span>
                  <span>•</span>
                  <span>UDIN: 24096033AAAAA5267</span>
                </div>
              </div>
              <div className="text-right">
                <div className="flex gap-2 justify-end mb-2">
                  <span className="px-2 py-1 text-[10px] font-bold text-[#0047FF] border border-[#0047FF] rounded uppercase">TAX INVOICE</span>
                  <span className="px-2 py-1 text-[10px] font-bold bg-slate-200 text-slate-700 rounded uppercase">MILESTONE</span>
                </div>
                <div className="text-2xl font-black text-slate-900">{activeInvoiceForModal.invoiceNumber}</div>
              </div>
            </div>

            {/* Entity Breakdown */}
            <div className="grid grid-cols-2 gap-12 mb-10 text-sm">
              <div>
                <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-2">Issued By</h3>
                <div className="font-bold text-slate-900 mb-1">VANNTAGGE CFO SERVICES LLP</div>
                <div className="text-slate-600 leading-relaxed">
                  Level 8, Corporate Tower B, BKC Financial Hub<br/>
                  Bandra East, Mumbai, MH - 400051<br/>
                  billing@vanntaggecfo.com | +91 22 6789 0000<br/>
                  SAC: 998311 (Financial Consulting)
                </div>
              </div>
              <div>
                <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-2">Billed To</h3>
                <div className="font-bold text-slate-900 mb-1">{activeInvoiceForModal.engagementName || 'Client Name'}</div>
                <div className="text-slate-600 leading-relaxed mb-3">
                  Place of Supply: 27 - Maharashtra
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Issue Date</div>
                    <div className="font-medium text-slate-900">{new Date(activeInvoiceForModal.createdAt).toISOString().split('T')[0]}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Due Date</div>
                    <div className="font-medium text-slate-900">2026-08-28</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Editable Additional Charges (Does not print) */}
            <div className="mb-6 p-4 border border-blue-200 rounded-lg bg-blue-50/50 no-print flex items-center gap-4 shadow-sm">
               <div className="flex-1">
                 <h4 className="font-bold text-xs text-blue-800 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Plus size={14}/> Additional Charges</h4>
                 <div className="flex gap-3">
                   <input 
                     type="text" 
                     placeholder="Description (e.g. Out of pocket expenses)" 
                     className="flex-1 px-3 py-1.5 border border-blue-200 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                     value={chargesDesc}
                     onChange={(e) => setChargesDesc(e.target.value)}
                   />
                   <div className="relative">
                     <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">₹</span>
                     <input 
                       type="number" 
                       placeholder="Amount" 
                       className="w-32 pl-7 pr-3 py-1.5 border border-blue-200 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                       value={additionalCharges || ''}
                       onChange={(e) => setAdditionalCharges(Number(e.target.value))}
                     />
                   </div>
                 </div>
               </div>
               <div className="text-[10px] text-blue-600 font-medium bg-blue-100/50 p-2 rounded max-w-[200px]">
                 Modify this section to instantly recalculate the total invoice amount and GST before dispatching.
               </div>
            </div>

            {/* Fee Table */}
            <table className="w-full mb-10 text-sm border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-xs text-left">
                  <th className="py-2 px-3 font-bold">#</th>
                  <th className="py-2 px-3 font-bold">DESCRIPTION OF SERVICE</th>
                  <th className="py-2 px-3 font-bold text-center">SAC CODE</th>
                  <th className="py-2 px-3 font-bold text-right">TAXABLE BASE (₹)</th>
                  <th className="py-2 px-3 font-bold text-right">GST RATE</th>
                  <th className="py-2 px-3 font-bold text-right">TOTAL AMOUNT (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr className={additionalCharges > 0 ? "border-b border-slate-100" : "border-b border-slate-200"}>
                  <td className="py-4 px-3 font-medium text-slate-500">01</td>
                  <td className="py-4 px-3 font-medium">{activeInvoiceForModal.milestone || 'Strategic Financial Governance & Tax Compliance'}</td>
                  <td className="py-4 px-3 text-center text-slate-500">998311</td>
                  <td className="py-4 px-3 text-right font-medium">₹{invoiceBase.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                  <td className="py-4 px-3 text-right text-slate-500">18.00%</td>
                  <td className="py-4 px-3 text-right font-bold text-slate-900">₹{(invoiceBase * 1.18).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                </tr>
                {additionalCharges > 0 && (
                  <tr className="border-b border-slate-200 bg-blue-50/20">
                    <td className="py-4 px-3 font-medium text-slate-500">02</td>
                    <td className="py-4 px-3 font-medium">{chargesDesc || 'Additional Charges'}</td>
                    <td className="py-4 px-3 text-center text-slate-500">998311</td>
                    <td className="py-4 px-3 text-right font-medium">₹{additionalCharges.toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                    <td className="py-4 px-3 text-right text-slate-500">18.00%</td>
                    <td className="py-4 px-3 text-right font-bold text-slate-900">₹{(additionalCharges * 1.18).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Footer Breakdown */}
            <div className="grid grid-cols-12 gap-8">
              <div className="col-span-7">
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg mb-6">
                  <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Amount Chargeable in Words</div>
                  <div className="font-bold text-sm text-slate-800">{amountInWords}</div>
                </div>
                
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">Bank Remittance Details</div>
                  <div className="text-xs text-slate-600 leading-relaxed font-medium">
                    Bank: <span className="text-slate-900">HDFC Bank Ltd (BKC Branch, Mumbai)</span><br/>
                    Account Name: <span className="text-slate-900">VANNTAGGE CFO SERVICES LLP</span><br/>
                    A/C No: <span className="text-slate-900">50200098765432</span> | IFSC: <span className="text-slate-900">HDFC0000123</span><br/>
                    UPI ID: <span className="text-slate-900">vanntagge.cfo@hdfcbank</span>
                  </div>
                </div>
              </div>
              <div className="col-span-5 bg-slate-50 p-6 rounded-lg border border-slate-200">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Total Services Amount:</span>
                    <span className="font-medium">₹{baseAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 font-bold border-b border-slate-200 pb-3">
                    <span>Taxable Base Subtotal:</span>
                    <span>₹{baseAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-xs">
                    <span>CGST @ 9.00%:</span>
                    <span>₹{cgst.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-xs pb-3 border-b border-slate-200">
                    <span>SGST @ 9.00%:</span>
                    <span>₹{sgst.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between text-lg font-black text-slate-900 pt-2">
                    <span>GRAND TOTAL:</span>
                    <span>₹{total.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Compliance Sign-off */}
            <div className="mt-16 flex justify-end text-center">
              <div>
                <div className="w-48 h-16 border-2 border-dashed border-slate-300 rounded mb-2 flex items-center justify-center text-slate-400 font-bold text-xs uppercase transform -rotate-2">
                  e-Signed / Authorized
                </div>
                <div className="font-bold text-slate-900 text-sm">FCA Authorized Signatory</div>
                <div className="text-[9px] text-slate-400 mt-1 max-w-[200px] leading-tight">Statutory Compliance Verified under Section 31 of CGST Act, 2017</div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};
