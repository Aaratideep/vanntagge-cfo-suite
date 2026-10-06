'use client';

import React, { useState } from 'react';
import { useDashboardStore } from '../../store/dashboardStore';
import { 
  Zap, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Plus, 
  Play, 
  AlertCircle, 
  RefreshCcw, 
  ShieldAlert, 
  FileCheck, 
  Sliders, 
  Filter,
  Check,
  ToggleLeft,
  ToggleRight,
  ChevronRight
} from 'lucide-react';
import { AutomationRule, AutomationTrigger, AutomationAction } from '../../types';

export const AutomationDashboardView: React.FC = () => {
  const { 
    automationRules, 
    automationLogs, 
    reminderRecords, 
    addAutomationRule, 
    updateAutomationRule, 
    deleteAutomationRule,
    checkAndDispatchReminders,
    addAuditLog
  } = useDashboardStore();

  const [activeSubTab, setActiveSubTab] = useState<'rules' | 'logs' | 'reminders'>('rules');
  const [showRuleModal, setShowRuleModal] = useState(false);

  // New Rule Form State
  const [ruleForm, setRuleForm] = useState<{
    name: string;
    description: string;
    trigger: AutomationTrigger;
    actionType: AutomationAction;
    messageTemplate: string;
  }>({
    name: '',
    description: '',
    trigger: 'SERVICE_ACTIVATED',
    actionType: 'CREATE_TASK',
    messageTemplate: '',
  });

  const activeRulesCount = (automationRules || []).filter(r => r.active).length;
  const totalExecutions = (automationLogs || []).length;
  const successfulExecutions = (automationLogs || []).filter(l => l.status === 'SUCCESS').length;
  const failedExecutions = (automationLogs || []).filter(l => l.status === 'FAILED').length;
  const tasksAutoCreated = (automationLogs || []).reduce((acc, l) => acc + (l.createdTasksCount || 0), 0);
  const totalRemindersDispatched = (reminderRecords || []).length;

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleForm.name.trim()) return;

    addAutomationRule({
      organizationId: 'org-1',
      name: ruleForm.name,
      description: ruleForm.description || 'Custom user-configured automation rule.',
      trigger: ruleForm.trigger,
      actions: [{ actionType: ruleForm.actionType, messageTemplate: ruleForm.messageTemplate }],
      active: true,
      createdBy: 'Admin User',
    });

    setShowRuleModal(false);
    setRuleForm({
      name: '',
      description: '',
      trigger: 'SERVICE_ACTIVATED',
      actionType: 'CREATE_TASK',
      messageTemplate: '',
    });
  };

  return (
    <div className="space-y-6 font-outfit text-slate-800 animate-in fade-in duration-300">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Zap className="text-amber-500 fill-amber-500" size={26} /> Automation Engine & Workflows
          </h2>
          <p className="text-xs text-slate-500 font-medium">Event-driven workflow triggers, automated task generation, duplicate guards, and reminder controls.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              checkAndDispatchReminders();
              addAuditLog('AUTOMATION_REMINDERS_MANUAL_SCAN', 'Manual trigger of automated reminders scanner.');
            }}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-200 transition-all flex items-center gap-2"
          >
            <RefreshCcw size={15} /> Run Reminder Scanner
          </button>
          <button
            onClick={() => setShowRuleModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2"
          >
            <Plus size={16} /> Create Automation Rule
          </button>
        </div>
      </div>

      {/* Metrics Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="premium-card p-5 border border-slate-200/80 rounded-2xl shadow-sm">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Rules</p>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{activeRulesCount} <span className="text-xs font-semibold text-slate-400">/ {(automationRules || []).length}</span></h3>
        </div>

        <div className="premium-card p-5 border border-slate-200/80 rounded-2xl shadow-sm">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Executions</p>
          <h3 className="text-2xl font-extrabold text-blue-600 mt-1">{totalExecutions}</h3>
        </div>

        <div className="premium-card p-5 border border-slate-200/80 rounded-2xl shadow-sm">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Successful</p>
          <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">{successfulExecutions}</h3>
        </div>

        <div className="premium-card p-5 border border-slate-200/80 rounded-2xl shadow-sm">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Failed Executions</p>
          <h3 className="text-2xl font-extrabold text-rose-600 mt-1">{failedExecutions}</h3>
        </div>

        <div className="premium-card p-5 border border-slate-200/80 rounded-2xl shadow-sm">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tasks Auto-Created</p>
          <h3 className="text-2xl font-extrabold text-purple-600 mt-1">{tasksAutoCreated}</h3>
        </div>

        <div className="premium-card p-5 border border-slate-200/80 rounded-2xl shadow-sm">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Reminders Sent</p>
          <h3 className="text-2xl font-extrabold text-amber-600 mt-1">{totalRemindersDispatched}</h3>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="bg-white border border-slate-200/80 p-2 rounded-2xl shadow-sm flex items-center gap-2">
        <button
          onClick={() => setActiveSubTab('rules')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'rules' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Automation Rules ({(automationRules || []).length})
        </button>
        <button
          onClick={() => setActiveSubTab('logs')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'logs' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Execution History & Log ({(automationLogs || []).length})
        </button>
        <button
          onClick={() => setActiveSubTab('reminders')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'reminders' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Reminder Tracker ({(reminderRecords || []).length})
        </button>
      </div>

      {/* SUB TAB 1: RULES */}
      {activeSubTab === 'rules' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
          {(automationRules || []).length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <Zap size={40} className="mx-auto mb-2 text-slate-300" />
              <p className="font-bold text-slate-700">No automation rules configured</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Rule Name</th>
                    <th className="py-3.5 px-4">Trigger Event</th>
                    <th className="py-3.5 px-4">Action</th>
                    <th className="py-3.5 px-4">Created By</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {automationRules.map(rule => (
                    <tr key={rule.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900 text-sm">{rule.name}</div>
                        <div className="text-slate-500 text-[11px] font-medium">{rule.description}</div>
                      </td>
                      <td className="py-4 px-4 font-bold text-amber-700">
                        <span className="bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[10px] uppercase font-bold">
                          {rule.trigger}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-bold text-blue-700">
                        {rule.actions.map((a, idx) => (
                          <span key={idx} className="bg-blue-50 border border-blue-200 px-2 py-0.5 rounded text-[10px] uppercase font-bold mr-1">
                            {a.actionType}
                          </span>
                        ))}
                      </td>
                      <td className="py-4 px-4 text-slate-600 font-medium">{rule.createdBy}</td>
                      <td className="py-4 px-4">
                        <button
                          onClick={() => updateAutomationRule(rule.id, { active: !rule.active })}
                          className={`flex items-center gap-1 font-bold text-xs px-2.5 py-1 rounded-full border ${
                            rule.active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}
                        >
                          {rule.active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                          {rule.active ? 'ACTIVE' : 'INACTIVE'}
                        </button>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => deleteAutomationRule(rule.id)}
                          className="text-xs font-bold text-rose-600 hover:text-rose-700 underline"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SUB TAB 2: EXECUTION LOGS */}
      {activeSubTab === 'logs' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
          {(automationLogs || []).length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <Clock size={40} className="mx-auto mb-2 text-slate-300" />
              <p className="font-bold text-slate-700">No execution logs recorded</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Timestamp</th>
                    <th className="py-3.5 px-4">Trigger</th>
                    <th className="py-3.5 px-4">Rule Name</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Created Tasks</th>
                    <th className="py-3.5 px-4">Skipped Duplicates</th>
                    <th className="py-3.5 px-4">Error / Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {automationLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-4 text-slate-500 font-medium whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-4 px-4 font-bold text-amber-700">{log.trigger}</td>
                      <td className="py-4 px-4 font-bold text-slate-900">{log.ruleName || 'System Default'}</td>
                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          log.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' :
                          log.status === 'FAILED' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-extrabold text-purple-700">{log.createdTasksCount}</td>
                      <td className="py-4 px-4 font-bold text-slate-600">{log.skippedDuplicatesCount}</td>
                      <td className="py-4 px-4 text-slate-500 italic max-w-xs truncate">
                        {log.error || 'Execution completed without error.'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SUB TAB 3: REMINDERS */}
      {activeSubTab === 'reminders' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
          {(reminderRecords || []).length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <Clock size={40} className="mx-auto mb-2 text-slate-300" />
              <p className="font-bold text-slate-700">No reminder records log found</p>
              <p className="text-xs text-slate-500">Run the reminder scanner above to generate automated reminders.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Sent At</th>
                    <th className="py-3.5 px-4">Resource Type</th>
                    <th className="py-3.5 px-4">Reminder Type</th>
                    <th className="py-3.5 px-4">Resource ID</th>
                    <th className="py-3.5 px-4">Recipient ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reminderRecords.map(rem => (
                    <tr key={rem.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-4 text-slate-500 font-medium">{new Date(rem.sentAt).toLocaleString()}</td>
                      <td className="py-4 px-4 font-bold text-slate-800">{rem.resourceType}</td>
                      <td className="py-4 px-4 font-bold text-amber-700">
                        <span className="bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[10px] uppercase font-bold">
                          {rem.reminderType.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-600 font-mono">{rem.resourceId}</td>
                      <td className="py-4 px-4 text-slate-600 font-medium">{rem.recipientId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CREATE RULE MODAL */}
      {showRuleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-xl font-bold font-outfit text-slate-900">Create Automation Rule</h3>

            <form onSubmit={handleCreateRule} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Rule Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Auto Task on Service Activation"
                  value={ruleForm.name}
                  onChange={e => setRuleForm(r => ({ ...r, name: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Trigger Event</label>
                <select
                  value={ruleForm.trigger}
                  onChange={e => setRuleForm(r => ({ ...r, trigger: e.target.value as any }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="SERVICE_ACTIVATED">SERVICE_ACTIVATED</option>
                  <option value="ENGAGEMENT_CREATED">ENGAGEMENT_CREATED</option>
                  <option value="TASK_COMPLETED">TASK_COMPLETED</option>
                  <option value="TASK_APPROVED">TASK_APPROVED</option>
                  <option value="TASK_OVERDUE">TASK_OVERDUE</option>
                  <option value="DOCUMENT_UPLOADED">DOCUMENT_UPLOADED</option>
                  <option value="DOCUMENT_APPROVED">DOCUMENT_APPROVED</option>
                  <option value="REPORT_RELEASED">REPORT_RELEASED</option>
                  <option value="INVOICE_DUE">INVOICE_DUE</option>
                  <option value="COMPLIANCE_DUE">COMPLIANCE_DUE</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Automated Action</label>
                <select
                  value={ruleForm.actionType}
                  onChange={e => setRuleForm(r => ({ ...r, actionType: e.target.value as any }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="CREATE_TASK">CREATE_TASK</option>
                  <option value="CREATE_NOTIFICATION">CREATE_NOTIFICATION</option>
                  <option value="UPDATE_TASK_STATUS">UPDATE_TASK_STATUS</option>
                  <option value="GENERATE_REPORT_DRAFT">GENERATE_REPORT_DRAFT</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  value={ruleForm.description}
                  onChange={e => setRuleForm(r => ({ ...r, description: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Explain rule purpose..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRuleModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2 rounded-xl shadow-md"
                >
                  Save Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
