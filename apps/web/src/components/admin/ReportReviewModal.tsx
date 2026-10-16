import React, { useState } from 'react';
import { useDashboardStore } from '../../store/dashboardStore';
import { Report } from '../../types';
import { exportReportToPDF, exportReportToExcel } from '../../lib/reportExporter';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Building2,
  Calendar,
  UserCheck,
  Download,
  FileSpreadsheet,
  Send,
  Lock,
} from 'lucide-react';

interface ReportReviewModalProps {
  reportId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ReportReviewModal: React.FC<ReportReviewModalProps> = ({
  reportId,
  isOpen,
  onClose,
}) => {
  const { engagements, approveReport, requestReportCorrection, releaseReport } = useDashboardStore();

  let report: Report | undefined;
  for (const eng of engagements) {
    const found = (eng.reports || []).find((r) => r.id === reportId);
    if (found) {
      report = found;
      break;
    }
  }

  const [notes, setNotes] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'LINEAGE' | 'SECTIONS'>('OVERVIEW');
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen || !report) return null;

  const handleApprove = () => {
    approveReport(report!.id);
    onClose();
  };

  const handleRequestCorrection = () => {
    if (!notes.trim()) {
      setErrorMsg('Please enter feedback explaining the required corrections.');
      return;
    }
    requestReportCorrection(report!.id, notes);
    onClose();
  };

  const handleRelease = () => {
    const res = releaseReport(report!.id);
    if (res.success) {
      exportReportToPDF(report!);
      onClose();
    } else {
      setErrorMsg(res.error || 'Failed to release report.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Modal Header */}
        <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-800 tracking-tight font-outfit">
                  Maker-Checker Report Review
                </h2>
                <span className="px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 font-bold text-xs rounded-md font-mono">
                  V{report.version}.0
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {report.clientCompanyName} • {report.type} Report ({report.periodKey})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-2 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-50/50 px-6 border-b border-slate-200 flex gap-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`py-3 border-b-2 transition-all font-outfit cursor-pointer ${
              activeTab === 'OVERVIEW'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Report Summary
          </button>
          <button
            onClick={() => setActiveTab('SECTIONS')}
            className={`py-3 border-b-2 transition-all font-outfit cursor-pointer ${
              activeTab === 'SECTIONS'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Draft Sections & Commentary ({(report.sections || []).length})
          </button>
          <button
            onClick={() => setActiveTab('LINEAGE')}
            className={`py-3 border-b-2 transition-all font-outfit cursor-pointer ${
              activeTab === 'LINEAGE'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Source Data Lineage Audit
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
              {errorMsg}
            </div>
          )}

          {activeTab === 'OVERVIEW' && (
            <div className="space-y-6">
              {/* Key Metadata Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-200/80 rounded-xl text-xs">
                <div>
                  <span className="text-slate-500 block">Status:</span>
                  <span className="font-bold text-slate-800 uppercase">{report.status}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Author:</span>
                  <span className="font-bold text-slate-800">{report.createdByName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Template Version:</span>
                  <span className="font-mono text-slate-700 font-semibold">v{report.reportTemplateVersion}.0</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Snapshot Date:</span>
                  <span className="font-mono text-slate-700 font-semibold">
                    {report.dataSnapshot ? new Date(report.dataSnapshot.snapshotAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>

              {/* KPI Snapshot Summary */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 font-outfit">
                  Compiled Financial Metrics Snapshot
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {report.dataSnapshot?.kpiResults &&
                    Object.entries(report?.dataSnapshot?.kpiResults || {}).map(([key, item]) => (
                      <div key={key} className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                        <span className="text-[10px] text-slate-500 uppercase block font-semibold font-outfit">
                          {key.replace(/_/g, ' ')}
                        </span>
                        <span className="text-base font-black text-slate-800 block mt-0.5 font-outfit">
                          {item.formatted}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Review Points / Correction Text Area */}
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <label className="block text-xs font-bold text-slate-700 font-outfit">
                  Reviewer Notes / Correction Request Instructions:
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="If requesting corrections, detail specific narrative adjustments or required task re-executions..."
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary p-3 text-slate-800 font-sans"
                />
              </div>
            </div>
          )}

          {activeTab === 'SECTIONS' && (
            <div className="space-y-4">
              {(report?.sections || []).map((sec, idx) => (
                <div key={sec.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center font-outfit">
                      {idx + 1}
                    </span>
                    <h4 className="text-sm font-bold text-slate-800 font-outfit">{sec.title}</h4>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 leading-relaxed font-sans">
                    {sec.narrative || <span className="italic text-slate-400">No commentary entered.</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'LINEAGE' && (
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 text-slate-800 border border-slate-200 rounded-xl flex items-center justify-between font-outfit">
                <span className="text-slate-500 font-semibold">Verified Source Tasks Count:</span>
                <span className="font-mono font-bold text-emerald-600">
                  {report.dataSnapshot?.sourceTasks?.length || 0} Approved Tasks
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 font-outfit">
                    <tr>
                      <th className="p-3">Metric Name</th>
                      <th className="p-3">Compiled Value</th>
                      <th className="p-3">Source Task</th>
                      <th className="p-3">Submission #</th>
                      <th className="p-3">Approved By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {Object.values(report.dataLineage || {}).map((lin, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-bold text-slate-800">{lin.metricName}</td>
                        <td className="p-3 font-mono text-emerald-600 font-semibold">
                          {lin.formattedValue}
                        </td>
                        <td className="p-3 text-slate-600">{lin.sourceTaskTitle}</td>
                        <td className="p-3 font-mono font-bold text-blue-600">#{lin.submissionNumber}</td>
                        <td className="p-3 text-slate-600">{lin.approvedByName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            {report.status !== 'RELEASED' && (
              <button
                type="button"
                onClick={handleRequestCorrection}
                className="px-4 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                Request Correction
              </button>
            )}

            {report.status === 'UNDER_REVIEW' && (
              <button
                type="button"
                onClick={handleApprove}
                className="btn-primary px-4 py-2 text-xs font-semibold rounded-xl shadow-md flex items-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Approve Report
              </button>
            )}

            {(report.status === 'APPROVED' || report.status === 'RELEASED') && (
              <button
                type="button"
                onClick={handleRelease}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md flex items-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                {report.status === 'RELEASED' ? 'Re-export Package' : 'Release & Download PDF'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
