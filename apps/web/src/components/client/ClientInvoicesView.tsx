'use client';

import React, { useMemo, useState } from 'react';
import { useDashboardStore } from '../../store/dashboardStore';
import { Invoice } from '../../types';
import { formatINR } from '../../lib/currency';
import { exportInvoicePdf } from '../../lib/invoicePdfExporter';
import {
  FileText,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
  Filter,
  CreditCard,
} from 'lucide-react';

export const ClientInvoicesView: React.FC = () => {
  const { currentUser, standaloneInvoices, engagements, paymentRecords, adminSettings } =
    useDashboardStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoiceDetail, setSelectedInvoiceDetail] = useState<Invoice | null>(null);

  // Client visibility security: resolve client ID linked to current client user
  const clientId = currentUser?.linkedEntity || currentUser?.id;

  // Filter client's OWN issued / paid / overdue invoices only (Hide DRAFT invoices from client!)
  const clientInvoices = useMemo(() => {
    const list: Invoice[] = [];
    const seenIds = new Set<string>();

    // 1. Standalone invoices for client
    standaloneInvoices.forEach((inv) => {
      if (
        (inv.clientId === clientId || (currentUser?.email && inv.clientCompanyName?.toLowerCase().includes(currentUser.name.toLowerCase()))) &&
        inv.status !== 'DRAFT' &&
        !seenIds.has(inv.id)
      ) {
        list.push(inv);
        seenIds.add(inv.id);
      }
    });

    // 2. Engagement invoices for client
    engagements.forEach((eng) => {
      if (eng.clientId === clientId) {
        (eng.invoices || []).forEach((inv) => {
          if (inv.status !== 'DRAFT' && !seenIds.has(inv.id)) {
            list.push({
              ...inv,
              clientCompanyName: inv.clientCompanyName || eng.clientCompanyName,
              serviceName: inv.serviceName || inv.milestone || eng.name,
              total: inv.total || inv.finalAmount || 0,
              amountPaid: inv.amountPaid || (inv.status === 'PAID' ? inv.finalAmount : 0),
              amountDue:
                inv.amountDue !== undefined
                  ? inv.amountDue
                  : inv.status === 'PAID'
                  ? 0
                  : inv.finalAmount,
            });
            seenIds.add(inv.id);
          }
        });
      }
    });

    return list;
  }, [standaloneInvoices, engagements, clientId, currentUser]);

  // Client's own payment records
  const clientPayments = useMemo(() => {
    return paymentRecords.filter(
      (p) => p.clientId === clientId || clientInvoices.some((inv) => inv.id === p.invoiceId)
    );
  }, [paymentRecords, clientId, clientInvoices]);

  const filteredInvoices = useMemo(() => {
    return clientInvoices.filter(
      (inv) =>
        inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.serviceName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.billingPeriod || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [clientInvoices, searchTerm]);

  // Summary Metrics
  const summary = useMemo(() => {
    let totalInvoiced = 0;
    let totalPaid = 0;
    let totalOutstanding = 0;

    clientInvoices.forEach((inv) => {
      if (inv.status === 'CANCELLED') return;
      const total = inv.total || inv.finalAmount || 0;
      const paid = inv.amountPaid || (inv.status === 'PAID' ? total : 0);
      const due = inv.amountDue !== undefined ? inv.amountDue : Math.max(0, total - paid);

      totalInvoiced += total;
      totalPaid += paid;
      totalOutstanding += due;
    });

    return { totalInvoiced, totalPaid, totalOutstanding };
  }, [clientInvoices]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-outfit text-slate-800">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-blue-600" />
            My Invoices & Payment Receipts
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            View tax invoices, check payment status, and download PDF receipts for your active services
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm space-y-1">
          <div className="text-xs font-bold uppercase text-slate-400 tracking-wider">Total Invoiced</div>
          <div className="text-2xl font-extrabold text-slate-900">{formatINR(summary.totalInvoiced)}</div>
          <div className="text-xs text-slate-500">Service billing & milestone invoices</div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm space-y-1">
          <div className="text-xs font-bold uppercase text-slate-400 tracking-wider">Total Amount Paid</div>
          <div className="text-2xl font-extrabold text-emerald-600">{formatINR(summary.totalPaid)}</div>
          <div className="text-xs text-emerald-600 font-medium flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" /> Payments Processed
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm space-y-1">
          <div className="text-xs font-bold uppercase text-slate-400 tracking-wider">Outstanding Balance</div>
          <div className="text-2xl font-extrabold text-amber-600">{formatINR(summary.totalOutstanding)}</div>
          <div className="text-xs text-amber-600 font-medium">Pending Remittance</div>
        </div>
      </div>

      {/* Invoice List */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-3 border-b border-slate-200 pb-4">
          <h2 className="text-lg font-bold text-slate-900">Tax Invoices</h2>

          <div className="relative w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search invoice number or service..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="p-3">Invoice No</th>
                <th className="p-3">Service & Period</th>
                <th className="p-3 text-right">Total Amount</th>
                <th className="p-3 text-right">Paid</th>
                <th className="p-3 text-right">Balance Due</th>
                <th className="p-3">Due Date</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Invoice PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 italic">
                    No issued invoices found.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const total = inv.total || inv.finalAmount || 0;
                  const paid = inv.amountPaid || (inv.status === 'PAID' ? total : 0);
                  const due = inv.amountDue !== undefined ? inv.amountDue : Math.max(0, total - paid);
                  const today = new Date().toISOString().split('T')[0];
                  const isOverdue = inv.dueDate < today && due > 0 && inv.status !== 'PAID';

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/80">
                      <td className="p-3">
                        <span
                          onClick={() => setSelectedInvoiceDetail(inv)}
                          className="font-bold text-blue-600 hover:underline cursor-pointer"
                        >
                          {inv.invoiceNumber}
                        </span>
                      </td>
                      <td className="p-3 text-slate-800">
                        <div className="font-semibold">{inv.serviceName || inv.milestone}</div>
                        {inv.billingPeriod && <div className="text-xs text-slate-500">{inv.billingPeriod}</div>}
                      </td>
                      <td className="p-3 text-right font-bold text-slate-900">{formatINR(total)}</td>
                      <td className="p-3 text-right text-emerald-600 font-semibold">{formatINR(paid)}</td>
                      <td className="p-3 text-right text-slate-900 font-bold">{formatINR(due)}</td>
                      <td className="p-3">
                        <span className={isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                          {inv.dueDate}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
                            inv.status === 'PAID'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : inv.status === 'PARTIALLY_PAID'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : isOverdue
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {isOverdue && inv.status !== 'CANCELLED' ? 'OVERDUE' : inv.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => exportInvoicePdf(inv, adminSettings)}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs rounded border border-blue-200 transition flex items-center gap-1 ml-auto"
                        >
                          <Download className="w-3.5 h-3.5" /> Download PDF
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment History & Receipts */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Payment Remittance History</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="p-3">Invoice No</th>
                <th className="p-3">Payment Method</th>
                <th className="p-3 text-right">Amount Paid</th>
                <th className="p-3">Reference / UTR</th>
                <th className="p-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clientPayments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-400 italic">
                    No payment history recorded yet.
                  </td>
                </tr>
              ) : (
                clientPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80">
                    <td className="p-3 font-bold text-blue-600">{p.invoiceNumber}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-semibold text-xs rounded">
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="p-3 text-right font-bold text-emerald-600">{formatINR(p.amount)}</td>
                    <td className="p-3 font-mono text-xs text-slate-600">{p.referenceNumber}</td>
                    <td className="p-3 text-slate-600">{p.paymentDate}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Detail Modal */}
      {selectedInvoiceDetail && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{selectedInvoiceDetail.invoiceNumber}</h3>
                <p className="text-xs text-slate-500">{selectedInvoiceDetail.clientCompanyName}</p>
              </div>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs rounded-full">
                {selectedInvoiceDetail.status}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Service:</span>
                <span className="font-semibold">{selectedInvoiceDetail.serviceName || selectedInvoiceDetail.milestone}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Billing Period:</span>
                <span className="font-semibold">{selectedInvoiceDetail.billingPeriod || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Subtotal:</span>
                <span className="font-semibold">{formatINR(selectedInvoiceDetail.subtotal || selectedInvoiceDetail.amount || 0)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">GST / Tax (18%):</span>
                <span className="font-semibold">{formatINR(selectedInvoiceDetail.tax || selectedInvoiceDetail.gst || 0)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 text-base font-bold">
                <span>Total Amount:</span>
                <span className="text-blue-600">{formatINR(selectedInvoiceDetail.total || selectedInvoiceDetail.finalAmount || 0)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 font-bold">
                <span className="text-slate-700">Balance Due:</span>
                <span className="text-rose-600">{formatINR(selectedInvoiceDetail.amountDue || 0)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Due Date:</span>
                <span className="font-semibold">{selectedInvoiceDetail.dueDate}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button
                onClick={() => exportInvoicePdf(selectedInvoiceDetail, adminSettings)}
                className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg text-sm flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" /> Download PDF
              </button>
              <button
                onClick={() => setSelectedInvoiceDetail(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
