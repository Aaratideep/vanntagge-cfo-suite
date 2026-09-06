'use client';

import React, { useState } from 'react';
import { useDashboardStore } from '../../store/dashboardStore';
import { Report, ReportStatus } from '../../types';
import { ReportGeneratorModal } from './ReportGeneratorModal';
import { ReportBuilderView } from './ReportBuilderView';
import { ReportReviewModal } from './ReportReviewModal';
import { ReportTemplatesView } from './ReportTemplatesView';
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
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { engagements, currentUser, clients } = useDashboardStore();

  const [activeTab, setActiveTab] = useState<'REPORTS' | 'TEMPLATES' | 'BUILDER'>('REPORTS');
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
      rep.clientCompanyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rep.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rep.periodKey.toLowerCase().includes(searchQuery.toLowerCase());

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

  const getStatusBadge = (status: ReportStatus) => {
    switch (status) {
      case 'DRAFT':
        return (
          <span className="px-2.5 py-1 bg-slate-800 text-slate-300 border border-slate-700 font-bold text-xs rounded-full font-outfit">
            DRAFT
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold text-xs rounded-full flex items-center gap-1 font-outfit">
            <Clock className="w-3 h-3 text-amber-400" /> UNDER REVIEW
          </span>
        );
      case 'CORRECTION_REQUIRED':
        return (
          <span className="px-2.5 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/30 font-bold text-xs rounded-full flex items-center gap-1 font-outfit">
            <AlertTriangle className="w-3 h-3 text-rose-400" /> CORRECTION REQUIRED
          </span>
        );
      case 'APPROVED':
        return (
          <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold text-xs rounded-full flex items-center gap-1 font-outfit">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> APPROVED
          </span>
        );
      case 'RELEASED':
        return (
          <span className="px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/30 font-bold text-xs rounded-full flex items-center gap-1 font-outfit">
            <ShieldCheck className="w-3 h-3 text-blue-400" /> RELEASED
          </span>
        );
      default:
        return <span className="px-2.5 py-1 bg-slate-800 text-slate-300 font-bold text-xs rounded-full">{status}</span>;
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-outfit">
            CFO Report Engine
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            APPROVED TASKS → REPORT DATA SNAPSHOT → BUILDER → MAKER-CHECKER REVIEW → CLIENT RELEASE
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('TEMPLATES')}
            className="px-4 py-2.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all"
          >
            <Layers className="w-4 h-4 text-blue-400" />
            Manage Templates
          </button>

          <button
            onClick={() => setIsGeneratorOpen(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-md hover:shadow-lg flex items-center gap-2 transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Generate Report Draft
          </button>
        </div>
      </div>

      {/* Overview Stat Cards - Dark Navy Theme */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-700/50 p-5 rounded-3xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-outfit">
              Total Compiled Reports
            </span>
            <span className="text-3xl font-black text-white mt-1 block font-outfit">
              {totalReports}
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-700/50 p-5 rounded-3xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-outfit">
              Partner Review Queue
            </span>
            <span className="text-3xl font-black text-amber-400 mt-1 block font-outfit">
              {pendingReview}
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-700/50 p-5 rounded-3xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-outfit">
              Corrections Requested
            </span>
            <span className="text-3xl font-black text-rose-400 mt-1 block font-outfit">
              {correctionsNeeded}
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-700/50 p-5 rounded-3xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-outfit">
              Released Packages
            </span>
            <span className="text-3xl font-black text-emerald-400 mt-1 block font-outfit">
              {releasedReports}
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Filter Bar - Dark Navy Theme */}
      <div className="bg-slate-900/80 backdrop-blur-md p-4 rounded-3xl border border-slate-700/60 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search client, report type, or period..."
            className="w-full text-xs pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
            <Filter className="w-3.5 h-3.5 text-blue-400" />
            <span>Filter:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 font-semibold"
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
            className="text-xs bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 font-semibold"
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

      {/* Generated Reports Table - Dark Navy Glass Theme */}
      <div className="bg-slate-900/80 backdrop-blur-md rounded-3xl border border-slate-700/60 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-outfit">
            Compiled Report Packages ({filteredReports.length})
          </h3>
          <span className="text-[11px] font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 rounded-full">
            Immutable Lineage Verified
          </span>
        </div>

        {filteredReports.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileText className="w-12 h-12 text-slate-600 mx-auto" />
            <h4 className="text-base font-bold text-slate-300 font-outfit">No Reports Found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No generated reports match your search filter. Click "Generate Report Draft" above to compile a report snapshot from approved task data.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-950/90 text-slate-400 font-bold border-b border-slate-800 font-outfit">
                <tr>
                  <th className="p-4">Client & Report Title</th>
                  <th className="p-4">Period</th>
                  <th className="p-4">Version</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Lineage Check</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredReports.map((rep) => (
                  <tr key={rep.id} className="hover:bg-slate-800/50 transition-colors">
                    {/* Client & Title */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center font-bold text-blue-400 text-xs shrink-0 font-outfit">
                          {rep.clientCompanyName.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bold text-white block text-sm font-outfit">
                            {rep.clientCompanyName}
                          </span>
                          <span className="text-slate-400 font-medium">
                            {rep.type} Performance Report
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Period */}
                    <td className="p-4 font-semibold text-slate-300">
                      <span className="inline-flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-3 py-1 rounded-xl text-slate-300 font-mono text-[11px]">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        {rep.periodKey}
                      </span>
                    </td>

                    {/* Version */}
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-300 font-bold rounded-lg text-[11px] font-mono">
                        V{rep.version}.0
                      </span>
                    </td>

                    {/* Status */}
                    <td className="p-4">{getStatusBadge(rep.status)}</td>

                    {/* Lineage */}
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        Lineage Active
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenBuilder(rep.id)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl flex items-center gap-1.5 transition-colors border border-slate-700/50"
                          title="Open Interactive Builder"
                        >
                          <Edit className="w-3.5 h-3.5 text-blue-400" />
                          <span>Builder</span>
                        </button>

                        {(rep.status === 'UNDER_REVIEW' || rep.status === 'APPROVED' || rep.status === 'RELEASED') && (
                          <button
                            onClick={() => handleOpenReview(rep.id)}
                            className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
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
                              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700"
                              title="Export PDF"
                            >
                              <Download className="w-3.5 h-3.5 text-rose-400" />
                            </button>

                            <button
                              onClick={() => exportReportToExcel(rep)}
                              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700"
                              title="Export Excel"
                            >
                              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
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
