'use client';

import React from 'react';
import { useDashboardStore } from '../../store/dashboardStore';
import { 
  Bot, 
  Sparkles, 
  ShieldCheck, 
  FileText, 
  ToggleLeft, 
  ToggleRight, 
  Activity, 
  Clock, 
  Search, 
  AlertCircle,
  Database
} from 'lucide-react';
import { currentAIProvider } from '../../lib/aiProvider';

export const AiDashboardView: React.FC = () => {
  const { aiFeatureFlags, updateAIFeatureFlags, aiAuditLogs = [] } = useDashboardStore();

  const totalRequests = aiAuditLogs.length;
  const cfoAssistantRequests = aiAuditLogs.filter(l => l.feature === 'CFO_ASSISTANT').length;
  const reportDraftRequests = aiAuditLogs.filter(l => l.feature === 'REPORT_DRAFT').length;
  const financialAnalysisRequests = aiAuditLogs.filter(l => l.feature === 'FINANCIAL_ANALYSIS').length;

  return (
    <div className="space-y-6 font-outfit text-slate-800 animate-in fade-in duration-300">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Sparkles className="text-blue-600 fill-blue-600" size={26} /> AI Engine & Feature Flags
          </h2>
          <p className="text-xs text-slate-500 font-medium">Provider abstraction, feature flag controls, RBAC security filters, and audit logs.</p>
        </div>

        <div className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border border-slate-700 shadow-sm">
          <Database size={16} className="text-emerald-400" /> Provider: {currentAIProvider.name}
        </div>
      </div>

      {/* Feature Flags Cards */}
      <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck size={20} className="text-blue-600" /> AI Feature Flag Controls
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-900">AI CFO Assistant</p>
              <p className="text-[11px] text-slate-500">Natural language CFO queries</p>
            </div>
            <button
              onClick={() => updateAIFeatureFlags({ aiCfoAssistant: !aiFeatureFlags?.aiCfoAssistant })}
              className={`flex items-center gap-1 font-bold text-xs px-2.5 py-1 rounded-full border ${
                aiFeatureFlags?.aiCfoAssistant ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-200 text-slate-500 border-slate-300'
              }`}
            >
              {aiFeatureFlags?.aiCfoAssistant ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
              {aiFeatureFlags?.aiCfoAssistant ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-900">AI Report Drafting</p>
              <p className="text-[11px] text-slate-500">Auto-draft MIS narratives</p>
            </div>
            <button
              onClick={() => updateAIFeatureFlags({ aiReportDrafting: !aiFeatureFlags?.aiReportDrafting })}
              className={`flex items-center gap-1 font-bold text-xs px-2.5 py-1 rounded-full border ${
                aiFeatureFlags?.aiReportDrafting ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-200 text-slate-500 border-slate-300'
              }`}
            >
              {aiFeatureFlags?.aiReportDrafting ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
              {aiFeatureFlags?.aiReportDrafting ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-900">Financial Analysis</p>
              <p className="text-[11px] text-slate-500">Revenue & cash flow insights</p>
            </div>
            <button
              onClick={() => updateAIFeatureFlags({ financialAnalysis: !aiFeatureFlags?.financialAnalysis })}
              className={`flex items-center gap-1 font-bold text-xs px-2.5 py-1 rounded-full border ${
                aiFeatureFlags?.financialAnalysis ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-200 text-slate-500 border-slate-300'
              }`}
            >
              {aiFeatureFlags?.financialAnalysis ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
              {aiFeatureFlags?.financialAnalysis ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-900">Automation Engine</p>
              <p className="text-[11px] text-slate-500">Task & reminder rules</p>
            </div>
            <button
              onClick={() => updateAIFeatureFlags({ automationEngine: !aiFeatureFlags?.automationEngine })}
              className={`flex items-center gap-1 font-bold text-xs px-2.5 py-1 rounded-full border ${
                aiFeatureFlags?.automationEngine ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-200 text-slate-500 border-slate-300'
              }`}
            >
              {aiFeatureFlags?.automationEngine ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
              {aiFeatureFlags?.automationEngine ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="premium-card p-6 border border-slate-200/80 rounded-2xl shadow-sm space-y-1">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total AI Requests</p>
          <h3 className="text-3xl font-extrabold text-blue-600 mt-1">{totalRequests}</h3>
          <p className="text-xs text-slate-400 font-medium">Across all authorized features</p>
        </div>

        <div className="premium-card p-6 border border-slate-200/80 rounded-2xl shadow-sm space-y-1">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">CFO Assistant Queries</p>
          <h3 className="text-3xl font-extrabold text-indigo-600 mt-1">{cfoAssistantRequests}</h3>
          <p className="text-xs text-slate-400 font-medium">Natural language inquiries</p>
        </div>

        <div className="premium-card p-6 border border-slate-200/80 rounded-2xl shadow-sm space-y-1">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Report Drafts</p>
          <h3 className="text-3xl font-extrabold text-purple-600 mt-1">{reportDraftRequests}</h3>
          <p className="text-xs text-slate-400 font-medium">Draft MIS narratives</p>
        </div>

        <div className="premium-card p-6 border border-slate-200/80 rounded-2xl shadow-sm space-y-1">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Financial Analyses</p>
          <h3 className="text-3xl font-extrabold text-emerald-600 mt-1">{financialAnalysisRequests}</h3>
          <p className="text-xs text-slate-400 font-medium">Analytics executions</p>
        </div>
      </div>

      {/* AI Audit Log Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden p-6 space-y-4">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Activity size={20} className="text-blue-600" /> AI Usage Audit Log
        </h3>

        {aiAuditLogs.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <Bot size={40} className="mx-auto mb-2 text-slate-300" />
            <p className="font-bold text-slate-700">No AI requests logged yet</p>
            <p className="text-xs text-slate-500">Queries run through the AI CFO Assistant or report drafting will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">User ID</th>
                  <th className="py-3.5 px-4">Feature</th>
                  <th className="py-3.5 px-4">Query / Event</th>
                  <th className="py-3.5 px-4">Response Summary</th>
                  <th className="py-3.5 px-4">Sources</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {aiAuditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-4 text-slate-500 font-medium whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-4 px-4 font-bold text-slate-800">{log.userId}</td>
                    <td className="py-4 px-4">
                      <span className="bg-blue-50 border border-blue-200 px-2 py-0.5 rounded text-[10px] uppercase font-bold text-blue-700">
                        {log.feature}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-semibold text-slate-900 max-w-xs truncate">
                      {log.query || 'Automated feature execution'}
                    </td>
                    <td className="py-4 px-4 text-slate-600 italic max-w-md truncate">
                      {log.responseSummary || 'N/A'}
                    </td>
                    <td className="py-4 px-4">
                      {log.sources && log.sources.length > 0 ? (
                        <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-semibold text-slate-700 border border-slate-200">
                          {log.sources.length} Source(s)
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">None</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
