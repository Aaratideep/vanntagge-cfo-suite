'use client';

import React, { useRef, useState } from 'react';
import { X, MessageCircle, Mail, Download, CreditCard, Plus } from 'lucide-react';
import { useDashboardStore } from '../store/dashboardStore';

function numberToWords(num: number): string {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if ((num = num.toString() as any).length > 9) return 'overflow';
  const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
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
    
    let clientPhone = client?.phone || (eng as any)?.clientContactPhone || '';
    if (clientPhone === '+91-00000-00000' || clientPhone === '+91-98765-00000') {
      clientPhone = '';
    }
    const clientEmail = client?.email || (eng as any)?.clientContactEmail || '';
    const clientName = client?.contactPerson || client?.companyName || "Valued Client";
    const serviceName = eng?.name || "CFO Advisory & Statutory Governance";
    const amountStr = (inv.amount || 0).toLocaleString("en-IN");

    try {
      if (channel === 'WHATSAPP') {
        const whatsappMsg = `*${adminSettings.companyName} - Official Invoice Notice*\n\nHello ${clientName},\nYour tax invoice *${inv.invoiceNumber}* for *₹${amountStr}* has been issued.\n\n• Service: ${serviceName}\n• Signatory: ${adminSettings.adminName} (${adminSettings.adminPhone})\n\nPlease remit via Bank/UPI transfer. Reach out for any questions.`;
        
        let sanitizedPhone = clientPhone.replace(/\D/g, '');
        if (sanitizedPhone.length === 10) {
          sanitizedPhone = '91' + sanitizedPhone;
        }

        const res = await fetch('/api/dispatch/whatsapp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            to: sanitizedPhone || '0000000000', 
            text: whatsappMsg,
            adminDetails: adminSettings
          })
        });
        if (!res.ok) throw new Error('WhatsApp Dispatch Failed');
        useDashboardStore.getState().addCommunicationLog({
          type: 'WHATSAPP',
          recipient: sanitizedPhone || '0000000000',
          body: whatsappMsg,
          status: 'SENT',
          sentBy: adminSettings.adminName || 'System',
          relatedEntityId: inv.id,
          relatedEntityType: 'INVOICE'
        });
        useDashboardStore.getState().setGlobalSuccessMsg('WhatsApp invoice dispatched successfully');
      } else {
        const subject = `Tax Invoice ${inv.invoiceNumber} - ${adminSettings.companyName}`;
        const body = `Dear ${clientName},\n\nPlease find the tax invoice details for ${serviceName} below:\n\n• Invoice No: ${inv.invoiceNumber}\n• Amount Payable: ₹${amountStr}\n\nFor clarifications, reply directly to ${adminSettings.adminEmail}.\n\nWarm regards,\n${adminSettings.adminName}\n${adminSettings.companyName}`;
        
        const res = await fetch('/api/dispatch/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: clientEmail || 'client@example.com',
            subject,
            html: `<p>${body.replace(/\n/g, '<br/>')}</p>`,
            adminDetails: adminSettings
          })
        });
        if (!res.ok) throw new Error('Email Dispatch Failed');
        useDashboardStore.getState().addCommunicationLog({
          type: 'EMAIL',
          recipient: clientEmail || 'client@example.com',
          subject: subject,
          body: body,
          status: 'SENT',
          sentBy: adminSettings.adminName || 'System',
          relatedEntityId: inv.id,
          relatedEntityType: 'INVOICE'
        });
        useDashboardStore.getState().setGlobalSuccessMsg('Email invoice dispatched successfully');
      }
    } catch (error) {
      console.error(error);
      alert('Failed to dispatch background message.');
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

  const eng = engagements.find((e) => e.id === activeInvoiceForModal.engagementId);
  const client = clients.find((c) => c.id === eng?.clientId);
  const clientName = activeInvoiceForModal.engagementName || client?.companyName || client?.contactPerson || 'Valued Client';
  const clientAddress = client?.address || 'Registered Office Address, Maharashtra';
  const clientGstin = client?.gstin || 'Unregistered';

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
        <div id="invoice-print-area" className="bg-white w-[880px] max-h-[92vh] overflow-y-auto shadow-2xl rounded-sm text-slate-800">
          <div ref={printRef} className="bg-white text-slate-800 font-sans">
            
            {/* 1. TOP NAVY CORPORATE HEADER */}
            <div className="bg-[#0B192C] px-8 py-5 text-white flex justify-between items-start">
              <div className="space-y-1">
                <h1 className="text-2xl font-black uppercase tracking-wide text-white">
                  VANNTAGGE CFO SERVICES LLP
                </h1>
                <p className="text-[#38BDF8] text-xs font-semibold tracking-wide">
                  Virtual CFO | Funding Advisory | Due Diligence | Franchise Development
                </p>
                <p className="text-slate-300 text-[11px] leading-tight max-w-lg">
                  Gala No. 28, OM Anand Industrial Premises Co-op, Wagle I.E., Thane - 400604, Maharashtra
                </p>
              </div>

              <div className="text-right space-y-0.5 shrink-0">
                <div className="text-[#F59E0B] font-extrabold text-2xl uppercase tracking-wider">
                  TAX INVOICE
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
            <div className="p-8 space-y-5">
              {/* SIDE-BY-SIDE METADATA CARDS */}
              <div className="grid grid-cols-2 gap-4 text-xs">
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
                      <span className="text-slate-800">27 - Maharashtra</span>
                    </div>
                  </div>
                </div>

                {/* INVOICE DETAILS */}
                <div className="border border-slate-300 bg-[#F8FAFC] p-3.5 rounded-sm">
                  <div className="font-bold text-slate-900 uppercase tracking-wider text-xs border-b border-slate-200 pb-1 mb-2">
                    INVOICE DETAILS
                  </div>
                  <div className="space-y-1.5 text-slate-700">
                    <div className="flex">
                      <span className="w-28 text-slate-500 shrink-0">Invoice No.</span>
                      <span className="font-mono font-bold text-slate-900">{activeInvoiceForModal.invoiceNumber}</span>
                    </div>
                    <div className="flex">
                      <span className="w-28 text-slate-500 shrink-0">Invoice Date</span>
                      <span className="font-medium text-slate-900">
                        {`${String(new Date(activeInvoiceForModal.createdAt || Date.now()).getDate()).padStart(2, '0')} / ${String(new Date(activeInvoiceForModal.createdAt || Date.now()).getMonth() + 1).padStart(2, '0')} / ${new Date(activeInvoiceForModal.createdAt || Date.now()).getFullYear()}`}
                      </span>
                    </div>
                    <div className="flex">
                      <span className="w-28 text-slate-500 shrink-0">Due Date</span>
                      <span className="font-medium text-slate-900">
                        {activeInvoiceForModal.dueDate
                          ? `${String(new Date(activeInvoiceForModal.dueDate).getDate()).padStart(2, '0')} / ${String(new Date(activeInvoiceForModal.dueDate).getMonth() + 1).padStart(2, '0')} / ${new Date(activeInvoiceForModal.dueDate).getFullYear()}`
                          : 'Within 7 Days'}
                      </span>
                    </div>
                    <div className="flex">
                      <span className="w-28 text-slate-500 shrink-0">Place of Supply</span>
                      <span className="text-slate-800">27 - Maharashtra</span>
                    </div>
                    <div className="flex">
                      <span className="w-28 text-slate-500 shrink-0">SAC Code</span>
                      <span className="font-mono text-slate-900">998311 (Mgmt. Consulting)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Editable Additional Charges (Does not print) */}
              <div className="p-4 border border-blue-200 rounded-lg bg-blue-50/50 no-print flex items-center gap-4 shadow-sm">
                <div className="flex-1">
                  <h4 className="font-bold text-xs text-blue-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Plus size={14}/> Additional Charges
                  </h4>
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
                    <tr className="bg-white">
                      <td className="py-3 px-3 text-center text-slate-500 border-r border-slate-200 font-medium">1</td>
                      <td className="py-3 px-3 border-r border-slate-200 font-semibold text-slate-900">
                        {activeInvoiceForModal.milestone || 'Virtual CFO Retainer - MIS & advisory'}
                      </td>
                      <td className="py-3 px-3 text-center text-slate-600 border-r border-slate-200">
                        {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-600 border-r border-slate-200">998311</td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900">
                        {invoiceBase.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                    {additionalCharges > 0 && (
                      <tr className="bg-slate-50/50">
                        <td className="py-3 px-3 text-center text-slate-500 border-r border-slate-200 font-medium">2</td>
                        <td className="py-3 px-3 border-r border-slate-200 font-semibold text-slate-900">{chargesDesc}</td>
                        <td className="py-3 px-3 text-center text-slate-600 border-r border-slate-200">
                          {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-slate-600 border-r border-slate-200">998311</td>
                        <td className="py-3 px-3 text-right font-bold text-slate-900">
                          {additionalCharges.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    )}
                    {/* Placeholder rows matching official template */}
                    {[...(additionalCharges > 0 ? [3, 4] : [2, 3, 4])].map((rowNum) => (
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
              <div className="grid grid-cols-12 gap-6 items-start text-xs pt-1">
                {/* Left: Words & Reverse Charge */}
                <div className="col-span-6 space-y-4 pt-1">
                  <div>
                    <span className="font-bold text-slate-900 block mb-1">Amount in words:</span>
                    <p className="text-slate-800 font-medium leading-relaxed italic border-b border-slate-200 pb-2">
                      {amountInWords}
                    </p>
                  </div>
                  <div className="text-slate-600 text-xs">
                    <span className="font-semibold text-slate-800">Whether tax payable on reverse charge:</span> No
                  </div>
                </div>

                {/* Right: Tax Breakdown and Total Block */}
                <div className="col-span-6 space-y-1.5">
                  <div className="flex justify-between py-1 border-b border-slate-200 text-slate-700">
                    <span>Taxable Value</span>
                    <span className="font-semibold text-slate-900">
                      Rs. {baseAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200 text-slate-700">
                    <span>CGST @ 9%</span>
                    <span className="text-slate-900">
                      Rs. {cgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200 text-slate-700">
                    <span>SGST @ 9%</span>
                    <span className="text-slate-900">
                      Rs. {sgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200 text-slate-700">
                    <span>IGST @ 18% (inter-state)</span>
                    <span className="text-slate-900">—</span>
                  </div>

                  {/* TOTAL INVOICE VALUE SOLID NAVY BANNER */}
                  <div className="bg-[#0B192C] text-white px-3.5 py-2.5 flex justify-between items-center rounded-sm font-bold text-sm mt-2">
                    <span className="tracking-wide uppercase">TOTAL INVOICE VALUE</span>
                    <span className="text-[#FBBF24] font-extrabold text-base">
                      Rs. {total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* 5. SIDE-BY-SIDE BANK DETAILS & TERMS */}
              <div className="grid grid-cols-2 gap-4 text-xs pt-1">
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
                    <p>1. Payment due within 7 days of invoice date.</p>
                    <p>2. Please quote invoice no. while remitting.</p>
                    <p>3. TDS u/s 194J, if deducted, kindly share Form 16A.</p>
                    <p>4. Subject to Thane jurisdiction.</p>
                  </div>
                </div>
              </div>

              {/* 6. SIGN-OFF & FOOTER */}
              <div className="pt-6 border-t border-slate-200 flex justify-between items-end gap-6 text-xs">
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
        </div>
      </div>
    </>
  );
};
