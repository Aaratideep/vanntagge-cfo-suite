'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Calendar,
  AlertCircle,
  FileCheck,
  Send,
  MessageSquare,
  Phone,
  Mail,
  Plus,
  Check,
  Upload,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { useDashboardStore } from '../../store/dashboardStore';
import { ComplianceStatus, ComplianceType } from '../../types';

export const ComplianceView: React.FC = () => {
  const {
    engagements,
    updateCompliance,
    updateChecklistDocStatus,
    currentUser,
    users,
  } = useDashboardStore();

  if (!currentUser) return null;

  const [activeEngId, setActiveEngId] = useState<string>(engagements[0]?.id || '');
  const [complianceSubTab, setComplianceSubTab] = useState<'tracker' | 'audit' | 'reminders'>('tracker');

  // Audit Program State
  const [selectedAuditTemplate, setSelectedAuditTemplate] = useState<string>('tax-audit');
  
  // Reusable Audit Step lists
  const [auditSteps, setAuditSteps] = useState([
    { id: 'as-1', step: 'Verify Opening Balances with previous year final audited statements', evidence: 'Audited Trial Balance FY25', assigned: 'Priya Sharma', status: 'COMPLETED' },
    { id: 'as-2', step: 'Select bank statements samples and perform vouching reconciliation', evidence: 'Bank Statements & Ledger Logs', assigned: 'Amit Patel', status: 'IN_PROGRESS' },
    { id: 'as-3', step: 'Inspect fixed asset physically and review depreciation journals', evidence: 'Fixed Asset Register', assigned: 'Priya Sharma', status: 'NOT_STARTED' },
    { id: 'as-4', step: 'Perform TDS/GST input tax credit cross reconciliation check', evidence: 'GST Portal ITC ledger summary', assigned: 'Amit Patel', status: 'NOT_STARTED' },
  ]);

  const selectedEngagement = engagements.find((e) => e.id === activeEngId);

  const handleUpdateComplianceStatus = (compId: string, status: ComplianceStatus) => {
    if (!selectedEngagement) return;
    updateCompliance(selectedEngagement.id, compId, {
      status,
      completionDate: status === 'COMPLETED' ? new Date().toISOString() : undefined,
    });
  };

  const handleTriggerSimulatedReminder = (channel: 'whatsapp' | 'email', docName: string) => {
    if (!selectedEngagement) return;
    
    const message = channel === 'whatsapp' 
      ? `Dear client, this is an automated reminder from VANNTAGGE CFO Services. Please upload the pending document: "${docName}" at your earliest convenience.`
      : `Subject: Pending Onboarding Documentation - VANNTAGGE CFO\n\nDear Client,\n\nOur compliance audit team is currently setting up your virtual ledger framework. We require: "${docName}" to complete verification.\n\nPlease upload this document via your client portal dashboard.`;

    alert(`Simulated ${channel.toUpperCase()} Sent:\n\n${message}`);

    // Update checklist item to show reminder logged
    useDashboardStore.getState().addAuditLog(
      'SEND_REMINDER',
      `Sent automated ${channel} reminder to BlueOcean CEO Thomas Wayne regarding document: "${docName}"`
    );
  };

  const handleStepStatusChange = (stepId: string, status: string) => {
    setAuditSteps(
      auditSteps.map((s) => (s.id === stepId ? { ...s, status } : s))
    );
    useDashboardStore.getState().addAuditLog(
      'AUDIT_STEP_UPDATE',
      `Audit checklist step ${stepId} status updated to ${status}`
    );
  };

  return (
    <div className="space-y-6">
      
      {/* View Header with Sub-tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-2 gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 font-outfit">Compliance & Audit Control</h1>
          <p className="text-xs text-slate-500">Track corporate tax filings, execute step-by-step audit programs, and trigger client data reminders.</p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setComplianceSubTab('tracker')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              complianceSubTab === 'tracker' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Filings Tracker
          </button>
          <button
            onClick={() => setComplianceSubTab('audit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              complianceSubTab === 'audit' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Audit Programs
          </button>
          <button
            onClick={() => setComplianceSubTab('reminders')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              complianceSubTab === 'reminders' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Data Reminders
          </button>
        </div>
      </div>

      {/* Select active Engagement */}
      <div className="flex gap-2 items-center text-xs">
        <span className="text-slate-400 font-medium">Active Engagement:</span>
        <select
          value={activeEngId}
          onChange={(e) => setActiveEngId(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-semibold text-slate-700 outline-none"
        >
          {engagements.map((eng) => (
            <option key={eng.id} value={eng.id}>
              {eng.clientCompanyName} &mdash; {eng.name}
            </option>
          ))}
        </select>
      </div>

      {selectedEngagement && (
        <div className="space-y-6">
          
          {/* Sub view 1: Compliance Filings Tracker */}
          {complianceSubTab === 'tracker' && (
            <div className="premium-card p-5 space-y-4">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Regulatory Filing Pipeline</h3>
                <p className="text-[10px] text-slate-400">GST, TDS, Corporate Tax, and ROC filing schedules</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                      <th className="p-3">Filing Type</th>
                      <th className="p-3">DueDate</th>
                      <th className="p-3">Responsible Consultant</th>
                      <th className="p-3">Filing Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedEngagement.compliances.map((c) => {
                      const isOverdue = new Date(c.dueDate) < new Date() && c.status !== 'COMPLETED';
                      return (
                        <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-3 font-bold text-slate-700">{c.type} filing verification</td>
                          <td className={`p-3 font-semibold ${isOverdue ? 'text-red-500' : 'text-slate-600'}`}>
                            {new Date(c.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td className="p-3 text-slate-500 font-medium">{c.responsibleEmployeeName || 'Unassigned'}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-bold border inline-block ${
                                c.status === 'COMPLETED'
                                  ? 'bg-green-50 text-green-700 border-green-100'
                                  : isOverdue || c.status === 'OVERDUE'
                                  ? 'bg-red-50 text-red-700 border-red-100 animate-pulse'
                                  : 'bg-amber-50 text-amber-700 border-amber-100'
                              }`}
                            >
                              {isOverdue ? 'OVERDUE' : c.status}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            {c.status !== 'COMPLETED' ? (
                              <button
                                onClick={() => handleUpdateComplianceStatus(c.id, 'COMPLETED')}
                                className="px-2 py-1 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg text-[10px] font-bold text-green-700"
                              >
                                Mark Filed
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">
                                Filed on {c.completionDate ? c.completionDate.split('T')[0] : 'N/A'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sub view 2: Reusable Audit Checklist Programs */}
          {complianceSubTab === 'audit' && (
            <div className="premium-card p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Step-by-Step Audit Program</h3>
                  <p className="text-[10px] text-slate-400">Structured verify checklists from reusable templates</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 font-semibold">Audit Template:</span>
                  <select
                    value={selectedAuditTemplate}
                    onChange={(e) => setSelectedAuditTemplate(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 font-semibold outline-none"
                  >
                    <option value="tax-audit">Standard Tax Audit Template</option>
                    <option value="statutory">Statutory Audit Program</option>
                    <option value="due-diligence">Financial Due Diligence Checklist</option>
                  </select>
                </div>
              </div>

              {/* Progress summary bar */}
              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 flex items-center justify-between text-xs">
                <span className="font-bold text-blue-800">Overall Audit Checklist Completion:</span>
                <div className="flex items-center gap-2 font-bold text-blue-700">
                  <div className="w-32 bg-blue-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-600 h-2"
                      style={{
                        width: `${
                          (auditSteps.filter((s) => s.status === 'COMPLETED').length / auditSteps.length) * 100
                        }%`,
                      }}
                    />
                  </div>
                  <span>
                    {(
                      (auditSteps.filter((s) => s.status === 'COMPLETED').length / auditSteps.length) * 100
                    ).toFixed(0)}
                    %
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {auditSteps.map((step) => (
                  <div
                    key={step.id}
                    className="p-3 border border-slate-150 rounded-xl bg-white hover:border-blue-150 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1.5 flex-1">
                      <span className="font-bold text-slate-800 block">{step.step}</span>
                      <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400">
                        <span>Required Evidence: {step.evidence}</span>
                        <span>&bull;</span>
                        <span>Auditor: {step.assigned}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <select
                        value={step.status}
                        onChange={(e) => handleStepStatusChange(step.id, e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-[10px] font-semibold text-slate-700 outline-none"
                      >
                        <option value="NOT_STARTED">Not Started</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="EVIDENCE_SUBMITTED">Evidence Submitted</option>
                        <option value="COMPLETED">Completed</option>
                      </select>

                      {step.status === 'EVIDENCE_SUBMITTED' && (
                        <button
                          onClick={() => handleStepStatusChange(step.id, 'COMPLETED')}
                          className="p-1 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg"
                          title="Verify Evidence & Approve"
                        >
                          <Check size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sub view 3: Document Collection Follow-up Reminders */}
          {complianceSubTab === 'reminders' && (
            <div className="premium-card p-5 space-y-4">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Data Collection Reminders queue</h3>
                <p className="text-[10px] text-slate-400">Alert client regarding missing documentation uploads</p>
              </div>

              <div className="divide-y divide-slate-100">
                {selectedEngagement.documents
                  .filter((d) => d.status === 'PENDING' || d.status === 'MISSING')
                  .map((doc) => (
                    <div key={doc.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="space-y-1">
                        <span className="font-bold text-slate-800 block">{doc.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 bg-red-50 text-red-600 rounded-[4px] font-bold text-[9px]">
                            {doc.status}
                          </span>
                          {doc.remarks && (
                            <span className="text-[10px] text-slate-500">Remarks: {doc.remarks}</span>
                          )}
                        </div>
                      </div>

                      {/* Reminder Channel Triggers */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleTriggerSimulatedReminder('whatsapp', doc.name)}
                          className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl font-bold text-[10px] flex items-center gap-1.5 transition-colors"
                        >
                          <MessageSquare size={12} />
                          WhatsApp Alert
                        </button>
                        <button
                          onClick={() => handleTriggerSimulatedReminder('email', doc.name)}
                          className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl font-bold text-[10px] flex items-center gap-1.5 transition-colors"
                        >
                          <Mail size={12} />
                          Email Request
                        </button>
                      </div>
                    </div>
                  ))}
                {selectedEngagement.documents.filter((d) => d.status === 'PENDING' || d.status === 'MISSING').length === 0 && (
                  <div className="py-8 text-center text-slate-400">
                    Excellent! No pending documents for this client.
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
