'use client';

import React, { useState } from 'react';
import { useDashboardStore } from '../../store/dashboardStore';
import { Report, ReportStatus } from '../../types';
import { ReportGeneratorModal } from './ReportGeneratorModal';
import { ReportBuilderView } from './ReportBuilderView';
import { ReportReviewModal } from './ReportReviewModal';
import { ReportTemplatesView } from './ReportTemplatesView';
import { ClientReportDeliveryCycleView } from './ClientReportDeliveryCycleView';
import { exportReportToPDF, exportReportToExcel } from '../../lib/reportExporter';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Download,
  FileSpreadsheet,
  Edit,
  Eye,
  Calendar,
  Sparkles,
  Mail,
  Target,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { engagements, currentUser, clients } = useDashboardStore();

  const [activeTab, setActiveTab] = useState<'REPORTS' | 'DELIVERY_ENGINE' | 'TEMPLATES' | 'BUILDER'>('REPORTS');
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState<boolean>(false);
  const [reviewReportId, setReviewReportId] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [clientFilter, setClientFilter] = useState<string>('ALL');

  if (!currentUser) return null;

  // Flatten all reports from engagements
  const allReports: Report[] = engagements.flatMap((eng) => eng.reports || []);

  // Calculate metrics
  const totalReports = allReports.length;
  const pendingReview = allReports.filter((r) => r.status === 'UNDER_REVIEW').length;
  const correctionsNeeded = allReports.filter((r) => r.status === 'CORRECTION_REQUIRED').length;
  const releasedReports = allReports.filter((r) => r.status === 'RELEASED').length;

  // Apply filters
  const filteredReports = allReports.filter((rep) => {
    const matchesSearch =
      (rep.clientCompanyName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      rep.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rep.periodKey || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || rep.status === statusFilter;
    const matchesClient = clientFilter === 'ALL' || rep.clientId === clientFilter;

    return matchesSearch && matchesStatus && matchesClient;
  });

  const handleReportGenerated = (reportId: string) => {
    setActiveReportId(reportId);
    setActiveTab('BUILDER');
  };

  const handleOpenBuilder = (reportId: string) => {
    setActiveReportId(reportId);
    setActiveTab('BUILDER');
  };

  const handleOpenReview = (reportId: string) => {
    setReviewReportId(reportId);
  };

  const handleSendThankYouMail = (rep: Report) => {
    const client = clients.find(c => c.id === rep.clientId || c.companyName?.toLowerCase() === rep.clientCompanyName?.toLowerCase());
    const email = client?.email || 'client@corporate.in';
    
    useDashboardStore.getState().addAuditLog(
      'SEND_THANK_YOU_MAIL',
      `Sent formal thank-you & deliverable release mail to ${rep.clientCompanyName} for ${rep.type} Report (${rep.periodKey})`
    );
    useDashboardStore.getState().setGlobalSuccessMsg(`Thank You Mail sent to ${rep.clientCompanyName} (${email})!`);
  };

  const getStatusBadge = (status: ReportStatus) => {
    switch (status) {
      case 'DRAFT':
        return (
          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs rounded-full font-outfit">
            DRAFT
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 font-bold text-xs rounded-full flex items-center gap-1 font-outfit">
            <Clock className="w-3 h-3 text-amber-600" /> UNDER REVIEW
          </span>
        );
      case 'CORRECTION_REQUIRED':
        return (
          <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs rounded-full flex items-center gap-1 font-outfit">
            <AlertTriangle className="w-3 h-3 text-rose-600" /> CORRECTION REQUIRED
          </span>
        );
      case 'APPROVED':
        return (
          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs rounded-full flex items-center gap-1 font-outfit">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> APPROVED
          </span>
        );
      case 'RELEASED':
        return (
          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 font-bold text-xs rounded-full flex items-center gap-1 font-outfit">
            <ShieldCheck className="w-3 h-3 text-blue-600" /> RELEASED
          </span>
        );
      default:
        return <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-bold text-xs rounded-full">{status}</span>;
    }
  };

  if (activeTab === 'BUILDER' && activeReportId) {
    return (
      <ReportBuilderView
        reportId={activeReportId}
        onBack={() => setActiveTab('REPORTS')}
        onOpenReviewModal={(repId) => setReviewReportId(repId)}
      />
    );
  }

  if (activeTab === 'DELIVERY_ENGINE') {
    return (
      <ClientReportDeliveryCycleView onBack={() => setActiveTab('REPORTS')} />
    );
  }

  if (activeTab === 'TEMPLATES') {
    return (
      <div className="space-y-6">
        <ReportTemplatesView onBack={() => setActiveTab('REPORTS')} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header & Primary Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 font-outfit">
            CFO Report Engine
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Approved Tasks &rarr; Data Snapshot &rarr; Builder &rarr; Maker-Checker Review &rarr; Client Release
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('DELIVERY_ENGINE')}
            className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-emerald-600" />
            4-Step Delivery Engine (SOP)
          </button>

          <button
            onClick={() => setActiveTab('TEMPLATES')}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Layers className="w-4 h-4 text-blue-600" />
            Manage Templates
          </button>

          <button
            onClick={() => setIsGeneratorOpen(true)}
            className="btn-primary px-4 py-2 text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer font-bold"
          >
            <Plus className="w-4 h-4" />
            Generate Report Draft
          </button>
        </div>
      </div>

      {/* Overview Stat Cards - Clean Light Theme */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-outfit">
              Total Compiled Reports
            </span>
            <span className="text-3xl font-extrabold text-slate-900 mt-1 block font-outfit">
              {totalReports}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-outfit">
              Partner Review Queue
            </span>
            <span className="text-3xl font-extrabold text-amber-600 mt-1 block font-outfit">
              {pendingReview}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-outfit">
              Corrections Requested
            </span>
            <span className="text-3xl font-extrabold text-rose-600 mt-1 block font-outfit">
              {correctionsNeeded}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-outfit">
              Released Packages
            </span>
            <span className="text-3xl font-extrabold text-emerald-600 mt-1 block font-outfit">
              {releasedReports}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Filter Bar - Clean Light Theme */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search client, report type, or period..."
            className="w-full text-xs pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Filter:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-semibold"
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="CORRECTION_REQUIRED">Correction Required</option>
            <option value="APPROVED">Approved</option>
            <option value="RELEASED">Released</option>
          </select>

          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-semibold"
          >
            <option value="ALL">All Clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.companyName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Generated Reports Table - Clean Light Theme */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-outfit">
            Compiled Report Packages ({filteredReports.length})
          </h3>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            Immutable Lineage Verified
          </span>
        </div>

        {filteredReports.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileText className="w-12 h-12 text-slate-300 mx-auto" />
            <h4 className="text-base font-bold text-slate-800 font-outfit">No Reports Found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No generated reports match your search filter. Click &ldquo;Generate Report Draft&rdquo; above to compile a report snapshot from approved task data.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50/90 text-slate-500 font-bold border-b border-slate-200 font-outfit">
                <tr>
                  <th className="p-4">Client & Report Title</th>
                  <th className="p-4">Period</th>
                  <th className="p-4">Version</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Lineage Check</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReports.map((rep) => (
                  <tr key={rep.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Client & Title */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center font-bold text-blue-600 text-xs shrink-0 font-outfit">
                          {(rep.clientCompanyName || 'CL').substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block text-sm font-outfit">
                            {rep.clientCompanyName}
                          </span>
                          <span className="text-slate-500 font-medium text-xs">
                            {rep.type} Performance Report
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Period */}
                    <td className="p-4 font-semibold text-slate-700">
                      <span className="inline-flex items-center gap-1.5 bg-slate-100 border border-slate-200 px-3 py-1 rounded-lg text-slate-700 font-mono text-[11px]">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {rep.periodKey}
                      </span>
                    </td>

                    {/* Version */}
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-700 font-bold rounded-lg text-[11px] font-mono">
                        V{rep.version}.0
                      </span>
                    </td>

                    {/* Status */}
                    <td className="p-4">{getStatusBadge(rep.status)}</td>

                    {/* Lineage */}
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        Lineage Active
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenBuilder(rep.id)}
                          className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-lg flex items-center gap-1.5 transition-colors border border-slate-200 cursor-pointer"
                          title="Open Interactive Builder"
                        >
                          <Edit className="w-3.5 h-3.5 text-blue-600" />
                          <span>Builder</span>
                        </button>

                        {(rep.status === 'UNDER_REVIEW' || rep.status === 'APPROVED' || rep.status === 'RELEASED') && (
                          <button
                            onClick={() => handleOpenReview(rep.id)}
                            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="Review / Approve"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Review</span>
                          </button>
                        )}

                        {rep.status === 'RELEASED' && (
                          <>
                            <button
                              onClick={() => exportReportToPDF(rep)}
                              className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 cursor-pointer"
                              title="Export PDF"
                            >
                              <Download className="w-3.5 h-3.5 text-rose-600" />
                            </button>

                            <button
                              onClick={() => exportReportToExcel(rep)}
                              className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 cursor-pointer"
                              title="Export Excel"
                            >
                              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                            </button>

                            <button
                              onClick={() => handleSendThankYouMail(rep)}
                              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold rounded-lg flex items-center gap-1.5 text-xs transition-colors cursor-pointer"
                              title="Send Thank You Mail to Client"
                            >
                              <Mail className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Thank You</span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Generator Modal */}
      <ReportGeneratorModal
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        onReportGenerated={handleReportGenerated}
      />

      {/* Maker-Checker Review Modal */}
      {reviewReportId && (
        <ReportReviewModal
          reportId={reviewReportId}
          isOpen={!!reviewReportId}
          onClose={() => setReviewReportId(null)}
        />
      )}
    </div>
  );
};
