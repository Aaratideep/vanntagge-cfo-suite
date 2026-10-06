import React, { useState } from 'react';
import { useDashboardStore } from '../../store/dashboardStore';
import { Report, ReportSectionConfig, ReportDataLineageItem } from '../../types';
import { exportReportToPDF, exportReportToExcel } from '../../lib/reportExporter';
import {
  ArrowLeft,
  FileText,
  Send,
  CheckCircle2,
  AlertTriangle,
  Download,
  Layers,
  ChevronUp,
  ChevronDown,
  Eye,
  Lock,
  ShieldCheck,
  Building,
  Calendar,
  UserCheck,
  FileSpreadsheet,
  Plus,
} from 'lucide-react';

interface ReportBuilderViewProps {
  reportId: string;
  onBack: () => void;
  onOpenReviewModal?: (reportId: string) => void;
}

export const ReportBuilderView: React.FC<ReportBuilderViewProps> = ({
  reportId,
  onBack,
  onOpenReviewModal,
}) => {
  const { engagements, updateReportDraft, submitReportForReview, releaseReport, createNewReportVersion } =
    useDashboardStore();

  // Find the target report across engagements
  let report: Report | undefined;
  for (const eng of engagements) {
    const found = (eng.reports || []).find((r) => r.id === reportId);
    if (found) {
      report = found;
      break;
    }
  }

  const [selectedLineageItem, setSelectedLineageItem] = useState<ReportDataLineageItem | null>(null);
  const [isSavedNotice, setIsSavedNotice] = useState<boolean>(false);

  if (!report) {
    return (
      <div className="p-8 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-lg font-bold text-white font-outfit">Report Not Found</h3>
        <p className="text-xs text-slate-400">The requested report ID "{reportId}" does not exist.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold text-xs hover:bg-blue-500 shadow-md"
        >
          Return to Reports
        </button>
      </div>
    );
  }

  const isEditable = report.status === 'DRAFT' || report.status === 'CORRECTION_REQUIRED';

  const handleNarrativeChange = (sectionId: string, text: string) => {
    if (!isEditable) return;
    const updatedSections = report!.sections.map((sec) =>
      sec.id === sectionId ? { ...sec, narrative: text } : sec
    );
    updateReportDraft(report!.id, { sections: updatedSections });
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 2000);
  };

  const handleMoveSection = (index: number, direction: 'UP' | 'DOWN') => {
    if (!isEditable) return;
    const newSections = [...report!.sections];
    const targetIdx = direction === 'UP' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newSections.length) return;

    const temp = newSections[index];
    newSections[index] = newSections[targetIdx];
    newSections[targetIdx] = temp;

    // Re-index order
    const reordered = newSections.map((sec, idx) => ({ ...sec, order: idx + 1 }));
    updateReportDraft(report!.id, { sections: reordered });
  };

  const handleSubmitReview = () => {
    submitReportForReview(report!.id);
  };

  const handleRelease = () => {
    releaseReport(report!.id);
  };

  const handleNewVersion = () => {
    const res = createNewReportVersion(report!.id);
    if (res.success && res.newReportId) {
      alert(`Created New Report Version V${report!.version + 1}!`);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <span className="px-2.5 py-1 bg-slate-800 text-slate-300 font-bold text-xs rounded-full border border-slate-700">DRAFT</span>;
      case 'UNDER_REVIEW':
        return <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 font-bold text-xs rounded-full border border-amber-500/30">UNDER REVIEW</span>;
      case 'CORRECTION_REQUIRED':
        return <span className="px-2.5 py-1 bg-rose-500/10 text-rose-400 font-bold text-xs rounded-full border border-rose-500/30 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> CORRECTION REQUIRED</span>;
      case 'APPROVED':
        return <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 font-bold text-xs rounded-full border border-emerald-500/30 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> APPROVED</span>;
      case 'RELEASED':
        return <span className="px-2.5 py-1 bg-blue-500/10 text-blue-400 font-bold text-xs rounded-full border border-blue-500/30 flex items-center gap-1"><ShieldCheck className="w-3 h-3"/> RELEASED (IMMUTABLE)</span>;
      default:
        return <span className="px-2.5 py-1 bg-slate-800 text-slate-300 font-bold text-xs rounded-full">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* Top Header / Actions Bar - Dark Glass Theme */}
      <div className="bg-slate-900/80 backdrop-blur-md p-5 rounded-3xl shadow-sm border border-slate-700/60 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-white tracking-tight font-outfit">
                {report.clientCompanyName} — {report.type} Report
              </h2>
              <span className="px-2.5 py-0.5 bg-blue-500/10 text-blue-300 border border-blue-500/20 font-bold text-xs rounded-md font-mono">
                V{report.version}.0
              </span>
              {getStatusBadge(report.status)}
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-400 mt-1 flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Period: <strong className="text-slate-200 font-semibold">{report.periodKey}</strong>
              </span>
              <span className="flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-slate-500" />
                Template: {report.type} (v{report.reportTemplateVersion}.0)
              </span>
              <span className="flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                Author: {report.createdByName}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {isSavedNotice && (
            <span className="text-xs text-emerald-400 font-semibold animate-pulse flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Auto-Saved
            </span>
          )}

          {isEditable && (
            <button
              onClick={handleSubmitReview}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md flex items-center gap-1.5 transition-all active:scale-[0.98]"
            >
              <Send className="w-3.5 h-3.5" />
              Submit for Partner Review
            </button>
          )}

          {onOpenReviewModal && (report.status === 'UNDER_REVIEW' || report.status === 'APPROVED') && (
            <button
              onClick={() => onOpenReviewModal(report!.id)}
              className="px-4 py-2 text-xs font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
            >
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              Maker-Checker Review
            </button>
          )}

          {report.status === 'APPROVED' && (
            <button
              onClick={handleRelease}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md flex items-center gap-1.5 transition-all active:scale-[0.98]"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Release Report
            </button>
          )}

          {report.status === 'RELEASED' && (
            <>
              <button
                onClick={() => exportReportToPDF(report!)}
                className="px-3 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl flex items-center gap-1.5 transition-all"
              >
                <Download className="w-3.5 h-3.5 text-rose-400" />
                Export PDF
              </button>

              <button
                onClick={() => exportReportToExcel(report!)}
                className="px-3 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl flex items-center gap-1.5 transition-all"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                Export Excel
              </button>

              <button
                onClick={handleNewVersion}
                className="px-3 py-2 text-xs font-semibold text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-xl flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-3.5 h-3.5 text-blue-400" />
                Generate V{report.version + 1}.0
              </button>
            </>
          )}
        </div>
      </div>

      {/* Read-Only Source Data Enforcement Banner */}
      <div className="bg-slate-950 text-white p-4 rounded-3xl shadow-md border border-slate-800 flex flex-col md:flex-row items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white font-outfit flex items-center gap-2">
              Source Data Lineage Enforcement Active
            </h4>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              Financial numbers are compiled directly from approved task submissions. Source figures cannot be manually overwritten in the builder. If numbers require correction, send source tasks back for re-execution in the Task Review workspace.
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="text-[11px] font-mono text-slate-500 block">Snapshot Compiled:</span>
          <span className="text-xs font-mono font-semibold text-blue-400">
            {new Date(report.dataSnapshot.snapshotAt).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Corrections Required Alert */}
      {report.status === 'CORRECTION_REQUIRED' && report.notes && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-3xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-rose-300 font-outfit">Partner Review Feedback</h4>
            <p className="text-xs text-rose-300 mt-1 bg-slate-950 p-3 rounded-2xl border border-rose-500/20 font-mono">
              "{report.notes}"
            </p>
          </div>
        </div>
      )}

      {/* Compiled Financial Metrics Cards - Dark Glass Theme */}
      <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-3xl border border-slate-700/50 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-outfit flex items-center gap-2">
            <span>Compiled Financial Metrics</span>
            <span className="text-xs font-normal text-slate-500 font-sans">({report.periodKey})</span>
          </h3>
          <span className="text-xs font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-full">
            Lineage Verified
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {report.dataSnapshot?.kpiResults &&
            Object.entries(report.dataSnapshot.kpiResults).map(([key, item]) => {
              const lineage = report!.dataLineage[key];
              return (
                <div
                  key={key}
                  className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col justify-between space-y-3 hover:border-blue-500/40 transition-all"
                >
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-outfit">
                      {key.replace(/_/g, ' ')}
                    </span>
                    <div className="text-xl font-black text-white mt-1 font-outfit">
                      {item.formatted}
                    </div>
                    {item.changePct !== undefined && (
                      <span className="text-xs font-bold text-emerald-400 inline-block mt-0.5">
                        +{item.changePct}% MoM
                      </span>
                    )}
                  </div>

                  {lineage ? (
                    <button
                      onClick={() => setSelectedLineageItem(lineage)}
                      className="w-full text-xs font-semibold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 py-1.5 px-2 rounded-xl flex items-center justify-center gap-1 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Source Lineage</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-500 italic">Derived metric</span>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* Report Section Builder - Dark Glass Theme */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-outfit flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <span>Report Sections Builder</span>
          </h3>
          <span className="text-xs text-slate-400 font-semibold">
            {report.sections.length} Configured Sections
          </span>
        </div>

        {report.sections.map((section, index) => (
          <div
            key={section.id}
            className="bg-slate-900/60 backdrop-blur-md rounded-3xl border border-slate-700/50 shadow-sm overflow-hidden transition-all"
          >
            {/* Section Header */}
            <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center font-outfit">
                  {index + 1}
                </span>
                <div>
                  <h4 className="text-sm font-bold text-white font-outfit">{section.title}</h4>
                  <p className="text-[11px] text-slate-500 font-mono">Section ID: {section.id}</p>
                </div>
              </div>

              {/* Order Controls */}
              {isEditable && (
                <div className="flex items-center gap-1">
                  <button
                    disabled={index === 0}
                    onClick={() => handleMoveSection(index, 'UP')}
                    className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 rounded-lg hover:bg-slate-800"
                    title="Move Up"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    disabled={index === report!.sections.length - 1}
                    onClick={() => handleMoveSection(index, 'DOWN')}
                    className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 rounded-lg hover:bg-slate-800"
                    title="Move Down"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Section Content */}
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  Executive Commentary / Narrative Analysis
                </label>
                {isEditable ? (
                  <textarea
                    rows={4}
                    value={section.narrative || ''}
                    onChange={(e) => handleNarrativeChange(section.id, e.target.value)}
                    placeholder={`Enter financial narrative commentary for ${section.title}...`}
                    className="w-full text-xs bg-slate-950 border border-slate-700 rounded-2xl focus:outline-none focus:border-blue-500 p-3 text-white font-sans leading-relaxed"
                  />
                ) : (
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {section.narrative || <span className="italic text-slate-500">No commentary entered.</span>}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Data Lineage Drawer Modal - Dark Glass Theme */}
      {selectedLineageItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-700/60 animate-in fade-in zoom-in duration-150">
            <div className="bg-slate-950 text-white px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm font-outfit">Source Data Lineage Trace</h3>
              </div>
              <button
                onClick={() => setSelectedLineageItem(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-blue-400 font-bold block font-outfit">{selectedLineageItem.metricName}</span>
                  <span className="text-xl font-black text-white font-outfit">{selectedLineageItem.formattedValue}</span>
                </div>
                <span className="px-2.5 py-1 bg-blue-600 text-white font-mono text-[10px] rounded-md font-bold">
                  VERIFIED SNAPSHOT
                </span>
              </div>

              <div className="space-y-2 border-t border-slate-800 pt-3">
                <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400">Source Task Title:</span>
                  <span className="font-bold text-white">{selectedLineageItem.sourceTaskTitle}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400">Source Task ID:</span>
                  <span className="font-mono text-slate-300">{selectedLineageItem.sourceTaskId}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400">Submission Iteration:</span>
                  <span className="font-bold text-blue-400 font-mono">Submission #{selectedLineageItem.submissionNumber}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400">Approved By:</span>
                  <span className="font-semibold text-slate-200">{selectedLineageItem.approvedByName}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">Approved Timestamp:</span>
                  <span className="font-mono text-slate-300">{new Date(selectedLineageItem.approvedAt || '').toLocaleString()}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl text-slate-400 leading-relaxed italic">
                This metric is tied directly to Task Submission #{selectedLineageItem.submissionNumber}. Any changes to this figure must be processed by returning the source task for correction.
              </div>
            </div>

            <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedLineageItem(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl font-semibold text-xs hover:bg-slate-700 transition-colors"
              >
                Close Lineage Trace
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
