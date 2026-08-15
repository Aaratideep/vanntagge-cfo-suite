'use client';

import React, { useState } from 'react';
import {
  BarChart3,
  FileSpreadsheet,
  Plus,
  ArrowRight,
  TrendingUp,
  Download,
  Calendar,
  Clock,
  CheckCircle,
  FileDown,
  ChevronRight,
  User,
} from 'lucide-react';
import { useDashboardStore } from '../../store/dashboardStore';
import { Report, ReportStatus, ReportType } from '../../types';

export const ReportsView: React.FC = () => {
  const { engagements, addReport, updateReportStatus, currentUser } = useDashboardStore();

  if (!currentUser) return null;

  const isClient = currentUser.role === 'CLIENT';
  const displayEngagements = isClient ? engagements.filter(e => e.clientId === currentUser.id) : engagements;

  const [activeEngId, setActiveEngId] = useState<string>(displayEngagements[0]?.id || '');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form input
  const [reportType, setReportType] = useState<ReportType>('MIS');
  const [reportNotes, setReportNotes] = useState('');

  const selectedEngagement = displayEngagements.find((e) => e.id === activeEngId);

  const displayReports = selectedEngagement 
    ? (isClient ? selectedEngagement.reports.filter(r => r.status === 'RELEASED') : selectedEngagement.reports)
    : [];

  const getReportStatusColor = (status: ReportStatus) => {
    switch (status) {
      case 'RELEASED':
        return 'bg-green-50 text-green-700 border-green-150';
      case 'APPROVED':
        return 'bg-blue-50 text-blue-700 border-blue-150';
      case 'FINAL_DRAFT':
        return 'bg-indigo-50 text-indigo-700 border-indigo-150';
      case 'INTERNAL_REVIEW':
        return 'bg-amber-50 text-amber-700 border-amber-150';
      default:
        return 'bg-slate-50 text-slate-500 border-slate-200';
    }
  };

  const handleCreateReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEngagement) return;

    addReport(selectedEngagement.id, {
      engagementId: selectedEngagement.id,
      engagementName: selectedEngagement.clientCompanyName + ' CFO Services',
      type: reportType,
      status: 'DRAFT',
      notes: reportNotes,
      filePath: `/reports/${selectedEngagement.clientCompanyName.toLowerCase().replace(/\s+/g, '-')}-${reportType.toLowerCase()}.pdf`,
    });

    setShowAddModal(false);
    setReportNotes('');
  };

  const handleTransitionStatus = (reportId: string, currentStatus: ReportStatus) => {
    if (!selectedEngagement) return;
    let nextStatus: ReportStatus = 'DRAFT';
    
    if (currentStatus === 'DRAFT') {
      nextStatus = 'INTERNAL_REVIEW';
    } else if (currentStatus === 'INTERNAL_REVIEW') {
      nextStatus = 'FINAL_DRAFT';
    } else if (currentStatus === 'FINAL_DRAFT') {
      nextStatus = 'APPROVED';
    } else if (currentStatus === 'APPROVED') {
      nextStatus = 'RELEASED';
    }

    updateReportStatus(selectedEngagement.id, reportId, nextStatus);
  };

  const isPartner = true;

  return (
    <div className="space-y-6">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-2 gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 font-outfit">Consulting Report Drafting</h1>
          <p className="text-xs text-slate-500">Review drafted MIS statements, financial analysis, valuations, and due diligence packages.</p>
        </div>

        {selectedEngagement && !isClient && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md transition-all"
          >
            <Plus size={14} />
            Draft New Report
          </button>
        )}
      </div>

      {/* Select active Engagement */}
      <div className="flex gap-2 items-center text-xs">
        <span className="text-slate-400 font-medium">Select Engagement:</span>
        <select
          value={activeEngId}
          onChange={(e) => setActiveEngId(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-semibold text-slate-700 outline-none"
        >
          {displayEngagements.map((eng) => (
            <option key={eng.id} value={eng.id}>
              {eng.clientCompanyName} &mdash; {eng.name}
            </option>
          ))}
        </select>
      </div>

      {selectedEngagement && (
        <div className="premium-card p-5 bg-white space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Report Drafting Pipeline</h3>
              <p className="text-[10px] text-slate-400">Review checkpoints: Draft &rarr; Internal Review &rarr; Final Draft &rarr; Released</p>
            </div>
          </div>

          <div className="space-y-3">
            {displayReports.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                {isClient ? 'No published reports available for this engagement yet.' : 'No reports drafted for this engagement yet.'}
              </div>
            ) : (
              displayReports.map((report) => (
                <div
                  key={report.id}
                  className="p-3 border border-slate-150 rounded-xl bg-slate-50/30 hover:border-blue-150 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-800 text-xs">{report.type} Performance Report</span>
                      <span className="text-[10px] text-slate-400 font-medium">Ver. {report.version}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold border ${getReportStatusColor(report.status)}`}>
                        {report.status}
                      </span>
                    </div>
                    {report.notes && (
                      <p className="text-slate-500 text-[10px] leading-relaxed italic">Notes: {report.notes}</p>
                    )}
                    <span className="text-[9px] text-slate-400 block">
                      Drafted: {new Date(report.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      onClick={() => alert(`Exporting ${report.type} report to simulated PDF/Excel format...`)}
                      className="px-2 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-xs"
                    >
                      <Download size={10} />
                      Export
                    </button>

                    {report.status !== 'RELEASED' && isPartner && !isClient && (
                      <button
                        onClick={() => handleTransitionStatus(report.id, report.status)}
                        className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-0.5 shadow-xs"
                      >
                        Advance Status
                        <ChevronRight size={10} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Draft New Report Modal */}
      {showAddModal && selectedEngagement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setShowAddModal(false)} />
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm p-6 relative z-10 shadow-2xl">
            <h3 className="font-bold text-slate-800 text-sm mb-4">Draft New CFO Report</h3>
            <form onSubmit={handleCreateReport} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-500 mb-1">Report Category Type</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value as ReportType)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none"
                >
                  <option value="MIS">MIS Report Dashboard</option>
                  <option value="FINANCIAL_ANALYSIS">Financial Trend Analysis</option>
                  <option value="BUSINESS_VALUATION">Business Valuation model</option>
                  <option value="DUE_DILIGENCE">Due Diligence Audit pack</option>
                  <option value="CASH_FLOW">Cash Flow Forecast</option>
                  <option value="BUDGET">Annual Budget Framework</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Drafting Notes / Comments</label>
                <textarea
                  required
                  placeholder="Notes regarding data coverage and limitations..."
                  value={reportNotes}
                  onChange={(e) => setReportNotes(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md"
                >
                  Save Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
