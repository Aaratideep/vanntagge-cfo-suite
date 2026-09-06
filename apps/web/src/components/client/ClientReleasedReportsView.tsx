import React, { useState } from 'react';
import { useDashboardStore } from '../../store/dashboardStore';
import { Report } from '../../types';
import { exportReportToPDF, exportReportToExcel } from '../../lib/reportExporter';
import {
  FileText,
  Download,
  FileSpreadsheet,
  Eye,
  ShieldCheck,
  Calendar,
  X,
  Building,
  TrendingUp,
  Lock,
} from 'lucide-react';

export const ClientReleasedReportsView: React.FC = () => {
  const { engagements, currentUser } = useDashboardStore();

  const [activeReport, setActiveReport] = useState<Report | null>(null);

  if (!currentUser) return null;

  // Flatten client engagements
  const myEngagements = engagements.filter((e) => e.clientId === currentUser.id);

  // STRICT ACCESS CONTROL: Only RELEASED reports matching currentUser.id
  const releasedReports: Report[] = myEngagements
    .flatMap((e) => e.reports || [])
    .filter((r) => r.status === 'RELEASED' && r.clientId === currentUser.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="border-b border-slate-200/80 pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 font-outfit flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            My Released Financial Reports
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Officially released Virtual CFO performance reports, MIS dashboards, and financial models.
          </p>
        </div>
        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full font-outfit flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          {releasedReports.length} Released Package(s)
        </span>
      </div>

      {/* Reports Grid Cards */}
      {releasedReports.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200/80 shadow-sm text-center space-y-3">
          <Lock className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700 font-outfit">No Released Reports Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Your approved CFO reports will appear here once they are officially released by your partner team.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {releasedReports.map((report) => (
            <div
              key={report.id}
              className="premium-card p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-150 text-[10px] font-bold rounded-full uppercase tracking-wider font-outfit">
                    {report.type} REPORT
                  </span>
                  <span className="text-xs font-bold text-slate-500 font-mono">
                    V{report.version}.0
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 font-outfit">
                    {report.clientCompanyName}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Period: <strong className="text-slate-700">{report.periodKey}</strong>
                  </p>
                </div>

                {/* KPI Highlights Snapshot */}
                {report.dataSnapshot?.kpiResults && (
                  <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Revenue:</span>
                      <span className="font-bold text-slate-900 font-outfit">
                        {report.dataSnapshot.kpiResults.revenue?.formatted || '₹25,00,000'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">EBITDA:</span>
                      <span className="font-bold text-emerald-700 font-outfit">
                        {report.dataSnapshot.kpiResults.ebitda?.formatted || '₹7,00,000'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setActiveReport(report)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs flex items-center gap-1 transition-all"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Report</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => exportReportToPDF(report)}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
                    title="Download PDF"
                  >
                    <Download className="w-3.5 h-3.5 text-rose-600" />
                  </button>

                  <button
                    onClick={() => exportReportToExcel(report)}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
                    title="Download Excel"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Report Detail Modal */}
      {activeReport && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 px-6 py-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white font-outfit">
                      {activeReport.clientCompanyName} — {activeReport.type} Report
                    </h3>
                    <span className="px-2 py-0.5 bg-blue-500/30 text-blue-200 font-bold text-xs rounded font-mono">
                      V{activeReport.version}.0
                    </span>
                  </div>
                  <p className="text-xs text-blue-200">Reporting Period: {activeReport.periodKey}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveReport(null)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto text-xs">
              {/* Metric Highlights */}
              {activeReport.dataSnapshot?.kpiResults && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
                  {Object.entries(activeReport.dataSnapshot.kpiResults).map(([key, item]) => (
                    <div key={key}>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block font-outfit">
                        {key.replace(/_/g, ' ')}
                      </span>
                      <span className="text-base font-black text-slate-900 font-outfit mt-0.5 block">
                        {item.formatted}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Sections Narrative */}
              <div className="space-y-4">
                {activeReport.sections.map((sec, idx) => (
                  <div key={sec.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center font-outfit">
                        {idx + 1}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 font-outfit">{sec.title}</h4>
                    </div>
                    <p className="text-xs text-slate-800 leading-relaxed font-sans pl-8 whitespace-pre-wrap">
                      {sec.narrative || 'No commentary entered.'}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => setActiveReport(null)}
                className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl"
              >
                Close Report
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => exportReportToPDF(activeReport)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
