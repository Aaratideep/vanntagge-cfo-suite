'use client';

import React, { useState, useEffect } from 'react';
import { useDashboardStore } from '../store/dashboardStore';
import { Task, TaskWorkingData, TaskAttachment } from '../types';
import {
  X,
  CheckSquare,
  Square,
  FileText,
  Paperclip,
  Clock,
  Send,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Building2,
  UserCheck,
  Plus,
  Trash2,
  Save,
  MessageSquare,
  ShieldCheck,
  Zap,
  Upload
} from 'lucide-react';

interface TaskExecutionModalProps {
  taskId: string;
  engagementId: string;
  onClose: () => void;
}

export const TaskExecutionModal: React.FC<TaskExecutionModalProps> = ({
  taskId,
  engagementId,
  onClose,
}) => {
  const {
    engagements,
    currentUser,
    startTaskExecution,
    updateTaskChecklist,
    updateTaskWorkingData,
    addTaskAttachment,
    removeTaskAttachment,
    submitTaskForReview,
    updateTask,
    addTaskFollowUp,
  } = useDashboardStore();

  const engagement = engagements.find((e) => e.id === engagementId);
  const task = engagement?.tasks?.find((t) => t.id === taskId);

  const [activeTab, setActiveTab] = useState<'checklist' | 'data' | 'log'>('checklist');
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [newLogText, setNewLogText] = useState('');
  const [timeSpentHours, setTimeSpentHours] = useState<number>(task?.timeSpent || 0);

  // Working data local state
  const [fieldKey, setFieldKey] = useState('');
  const [fieldVal, setFieldVal] = useState('');
  const [workingFields, setWorkingFields] = useState<Record<string, string | number | boolean>>(
    task?.workingData?.fields || {}
  );
  const [workingNotes, setWorkingNotes] = useState(task?.workingData?.notes || '');

  // Start task automatically when opened
  useEffect(() => {
    if (engagementId && taskId) {
      startTaskExecution(engagementId, taskId);
    }
  }, [engagementId, taskId, startTaskExecution]);

  // Sync state if task updates
  useEffect(() => {
    if (task) {
      setTimeSpentHours(task.timeSpent || 0);
      setWorkingFields(task.workingData?.fields || {});
      setWorkingNotes(task.workingData?.notes || '');
    }
  }, [task]);

  if (!task || !engagement) {
    return null;
  }

  const isReadOnly = task.status === 'REVIEW_PENDING' || task.status === 'COMPLETED';

  // Toggle checklist item
  const handleToggleChecklist = (index: number) => {
    if (isReadOnly || !task.checklist) return;
    const updated = task.checklist.map((item, i) =>
      i === index ? { ...item, isCompleted: !item.isCompleted } : item
    );
    updateTaskChecklist(engagementId, taskId, updated);
  };

  // Add key-value working data
  const handleAddWorkingField = () => {
    if (!fieldKey.trim() || isReadOnly) return;
    const updated = { ...workingFields, [fieldKey.trim()]: fieldVal.trim() };
    setWorkingFields(updated);
    setFieldKey('');
    setFieldVal('');
    updateTaskWorkingData(engagementId, taskId, {
      fields: updated,
      notes: workingNotes,
    });
  };

  // Delete key-value working data
  const handleDeleteWorkingField = (key: string) => {
    if (isReadOnly) return;
    const updated = { ...workingFields };
    delete updated[key];
    setWorkingFields(updated);
    updateTaskWorkingData(engagementId, taskId, {
      fields: updated,
      notes: workingNotes,
    });
  };

  // Save working notes
  const handleSaveWorkingNotes = () => {
    if (isReadOnly) return;
    updateTaskWorkingData(engagementId, taskId, {
      fields: workingFields,
      notes: workingNotes,
    });
  };

  // Handle File Upload (Simulated base64 or file select)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      addTaskAttachment(engagementId, taskId, {
        name: file.name,
        fileSize: `${(file.size / 1024).toFixed(1)} KB`,
        fileType: file.type || 'document',
        fileData: base64,
        uploadedBy: currentUser?.id || 'unknown',
        uploadedByName: currentUser?.name || 'Employee',
      });
    };
    reader.readAsDataURL(file);
  };

  // Add work log
  const handleAddLog = () => {
    if (!newLogText.trim()) return;
    addTaskFollowUp(engagementId, taskId, newLogText.trim());
    setNewLogText('');
  };

  // Update time spent
  const handleSaveTimeSpent = () => {
    updateTask(engagementId, taskId, { timeSpent: Number(timeSpentHours) || 0 });
  };

  // Submit task for review
  const handleSubmitReview = () => {
    const res = submitTaskForReview(engagementId, taskId, submissionNotes);
    if (res.success) {
      onClose();
    }
  };

  const completedChecklistCount = task.checklist?.filter((c) => c.isCompleted).length || 0;
  const totalChecklistCount = task.checklist?.length || 0;
  const checklistPct =
    totalChecklistCount > 0 ? Math.round((completedChecklistCount / totalChecklistCount) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-2 sm:p-4 lg:p-6 overflow-y-auto custom-scrollbar font-outfit">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/80 border-b border-slate-800 relative flex justify-between items-start">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="flex items-center gap-1 bg-slate-800 text-slate-300 font-semibold px-2.5 py-1 rounded-full border border-slate-700">
                <Building2 size={12} className="text-blue-400" />
                {engagement.clientCompanyName}
              </span>
              <span className="flex items-center gap-1 bg-indigo-950/60 text-indigo-300 font-semibold px-2.5 py-1 rounded-full border border-indigo-800/50">
                <Zap size={12} className="text-indigo-400" />
                {task.milestone || 'Execution'}
              </span>
              <span
                className={`font-black uppercase tracking-widest text-[10px] px-2.5 py-1 rounded-full ${
                  task.priority === 'URGENT'
                    ? 'bg-rose-900/40 text-rose-400 border border-rose-600/40'
                    : task.priority === 'HIGH'
                    ? 'bg-amber-900/40 text-amber-400 border border-amber-600/40'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {task.priority} Priority
              </span>
              <span
                className={`font-black uppercase tracking-widest text-[10px] px-2.5 py-1 rounded-full ${
                  task.status === 'REVIEW_PENDING'
                    ? 'bg-amber-900/50 text-amber-300 border border-amber-500/50 animate-pulse'
                    : task.status === 'COMPLETED'
                    ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-500/50'
                    : task.status === 'IN_PROGRESS'
                    ? 'bg-blue-900/50 text-blue-300 border border-blue-500/50'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {task.status.replace('_', ' ')}
              </span>
            </div>

            <h2 className="text-2xl font-black font-outfit text-white tracking-tight leading-snug">
              {task.title}
            </h2>

            <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
              <span className="flex items-center gap-1">
                <Calendar size={13} className="text-slate-500" />
                Due: <strong className="text-slate-200">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}</strong>
              </span>
              <span className="flex items-center gap-1">
                <Clock size={13} className="text-slate-500" />
                Est: <strong className="text-slate-200">{task.estimatedHours} hrs</strong>
              </span>
              <span className="flex items-center gap-1">
                <UserCheck size={13} className="text-slate-500" />
                Assignee: <strong className="text-slate-200">{task.employeeName || 'Unassigned'}</strong>
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-xl transition-colors border border-slate-700/60"
          >
            <X size={20} />
          </button>
        </div>

        {/* Status Notification Banner */}
        {task.status === 'REVIEW_PENDING' && (
          <div className="bg-amber-950/40 border-b border-amber-800/40 px-6 py-3 text-amber-200 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="text-amber-400 shrink-0" />
            <span>
              This task was submitted for review by <strong>{task.submittedByName || 'Employee'}</strong> on{' '}
              {task.submittedAt ? new Date(task.submittedAt).toLocaleString() : 'N/A'}. Further edits are locked while review is pending.
            </span>
          </div>
        )}

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('checklist')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-t border-x ${
              activeTab === 'checklist'
                ? 'bg-slate-900 border-slate-700 text-blue-400 shadow-sm'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <CheckSquare size={15} />
            Checklist & Progress ({completedChecklistCount}/{totalChecklistCount})
          </button>

          <button
            onClick={() => setActiveTab('data')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-t border-x ${
              activeTab === 'data'
                ? 'bg-slate-900 border-slate-700 text-indigo-400 shadow-sm'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <FileText size={15} />
            Working Data & Attachments ({task.attachments?.length || 0})
          </button>

          <button
            onClick={() => setActiveTab('log')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-t border-x ${
              activeTab === 'log'
                ? 'bg-slate-900 border-slate-700 text-emerald-400 shadow-sm'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Send size={15} />
            Work Log & Review Submission
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-6">

          {/* TAB 1: CHECKLIST */}
          {activeTab === 'checklist' && (
            <div className="space-y-6">
              {/* Progress Summary Card */}
              <div className="bg-slate-800/60 border border-slate-700/60 p-5 rounded-2xl space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-300 flex items-center gap-2">
                    <ShieldCheck size={16} className="text-blue-400" />
                    Overall Completion Progress
                  </span>
                  <span className="font-black text-blue-400 text-sm">{checklistPct}%</span>
                </div>
                <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden border border-slate-700/60 p-0.5">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${checklistPct}%` }}
                  ></div>
                </div>
              </div>

              {/* Checklist Items List */}
              <div>
                <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
                  <CheckSquare size={16} className="text-indigo-400" />
                  Execution Checklist Items
                </h3>

                {(!task.checklist || task.checklist.length === 0) ? (
                  <div className="p-8 text-center bg-slate-950/40 border border-slate-800 rounded-2xl text-slate-500 text-xs">
                    No checklist items configured for this task. You can add working notes and files in the next tab.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {task.checklist.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleToggleChecklist(idx)}
                        className={`p-4 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                          item.isCompleted
                            ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200'
                            : 'bg-slate-800/40 border-slate-700/60 text-slate-200 hover:border-blue-500/50 hover:bg-slate-800'
                        } ${isReadOnly ? 'cursor-not-allowed opacity-80' : ''}`}
                      >
                        {item.isCompleted ? (
                          <CheckSquare size={18} className="text-emerald-400 shrink-0" />
                        ) : (
                          <Square size={18} className="text-slate-500 shrink-0" />
                        )}
                        <span className={`text-xs font-medium flex-1 ${item.isCompleted ? 'line-through text-emerald-300/80' : ''}`}>
                          {item.item}
                        </span>
                        {item.isCompleted && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-900/40 px-2 py-0.5 rounded-md border border-emerald-700/40">
                            Completed
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: WORKING DATA & ATTACHMENTS */}
          {activeTab === 'data' && (
            <div className="space-y-6">
              
              {/* Working Data Key-Values */}
              <div className="bg-slate-800/50 border border-slate-700/60 p-5 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <FileText size={16} className="text-indigo-400" />
                    Structured Working Data & Field Metrics
                  </h3>
                  {task.workingData?.lastSavedAt && (
                    <span className="text-[10px] text-slate-400">
                      Last saved: {new Date(task.workingData.lastSavedAt).toLocaleTimeString()}
                    </span>
                  )}
                </div>

                {/* Add Field Inputs */}
                {!isReadOnly && (
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Metric Key (e.g., Total Revenue)"
                      value={fieldKey}
                      onChange={(e) => setFieldKey(e.target.value)}
                      className="sm:col-span-2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                    <input
                      type="text"
                      placeholder="Value (e.g., ₹12,50,000)"
                      value={fieldVal}
                      onChange={(e) => setFieldVal(e.target.value)}
                      className="sm:col-span-2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      onClick={handleAddWorkingField}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold px-3 py-2 flex items-center justify-center gap-1 transition-colors"
                    >
                      <Plus size={14} /> Add
                    </button>
                  </div>
                )}

                {/* Existing Fields Display */}
                {Object.keys(workingFields).length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No structured data fields recorded yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {Object.entries(workingFields).map(([k, v]) => (
                      <div key={k} className="bg-slate-900/80 border border-slate-700/60 p-3 rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{k}</p>
                          <p className="font-semibold text-indigo-200 mt-0.5">{String(v)}</p>
                        </div>
                        {!isReadOnly && (
                          <button
                            onClick={() => handleDeleteWorkingField(k)}
                            className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Working Notes Textarea */}
                <div className="pt-3 border-t border-slate-700/50 space-y-2">
                  <label className="text-xs font-bold text-slate-300">Execution Work Notes & Observations</label>
                  <textarea
                    rows={3}
                    disabled={isReadOnly}
                    placeholder="Enter analytical notes, calculations, or findings..."
                    value={workingNotes}
                    onChange={(e) => setWorkingNotes(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                  />
                  {!isReadOnly && (
                    <button
                      onClick={handleSaveWorkingNotes}
                      className="bg-slate-700 hover:bg-slate-600 text-xs text-white font-semibold px-4 py-1.5 rounded-xl flex items-center gap-1 transition-colors"
                    >
                      <Save size={13} /> Save Notes
                    </button>
                  )}
                </div>
              </div>

              {/* Working Attachments Section */}
              <div className="bg-slate-800/50 border border-slate-700/60 p-5 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <Paperclip size={16} className="text-blue-400" />
                    Work Files & Attachments
                  </h3>
                  {!isReadOnly && (
                    <label className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold px-3 py-1.5 flex items-center gap-1.5 cursor-pointer transition-colors">
                      <Upload size={13} /> Upload File
                      <input type="file" onChange={handleFileUpload} className="hidden" />
                    </label>
                  )}
                </div>

                {(!task.attachments || task.attachments.length === 0) ? (
                  <div className="p-6 text-center border border-dashed border-slate-700 rounded-xl text-slate-500 text-xs">
                    No work files attached yet. Attach Excel working sheets, PDFs, or calculation notes.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {task.attachments.map((att) => (
                      <div key={att.id} className="bg-slate-900 border border-slate-700 p-3 rounded-xl flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-950/50 text-blue-400 rounded-lg border border-blue-800/40">
                            <FileText size={16} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-200">{att.name}</p>
                            <p className="text-[10px] text-slate-400">
                              {att.fileSize || 'File'} • Uploaded by {att.uploadedByName || 'User'} on {new Date(att.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {att.fileData && (
                            <a
                              href={att.fileData}
                              download={att.name}
                              className="text-xs font-semibold text-blue-400 hover:underline px-2 py-1"
                            >
                              Download
                            </a>
                          )}
                          {!isReadOnly && (
                            <button
                              onClick={() => removeTaskAttachment(engagementId, taskId, att.id)}
                              className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 3: WORK LOG & SUBMISSION */}
          {activeTab === 'log' && (
            <div className="space-y-6">
              
              {/* Time Tracking & Log Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-800/50 border border-slate-700/60 p-5 rounded-2xl space-y-3">
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <Clock size={16} className="text-amber-400" />
                    Time Spent Tracking
                  </h3>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      disabled={isReadOnly}
                      min="0"
                      step="0.5"
                      value={timeSpentHours}
                      onChange={(e) => setTimeSpentHours(parseFloat(e.target.value) || 0)}
                      className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white w-28 text-center focus:outline-none focus:border-amber-500"
                    />
                    <span className="text-xs text-slate-400 font-medium">Hours Spent (Est: {task.estimatedHours}h)</span>
                  </div>
                  {!isReadOnly && (
                    <button
                      onClick={handleSaveTimeSpent}
                      className="bg-slate-700 hover:bg-slate-600 text-xs text-white font-semibold px-3 py-1 rounded-lg transition-colors"
                    >
                      Update Hours
                    </button>
                  )}
                </div>

                <div className="bg-slate-800/50 border border-slate-700/60 p-5 rounded-2xl space-y-3">
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <MessageSquare size={16} className="text-emerald-400" />
                    Add Log Note
                  </h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      disabled={isReadOnly}
                      placeholder="Add follow-up / activity note..."
                      value={newLogText}
                      onChange={(e) => setNewLogText(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white flex-1 focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      onClick={handleAddLog}
                      disabled={isReadOnly || !newLogText.trim()}
                      className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold px-3 py-2 transition-colors"
                    >
                      Log
                    </button>
                  </div>
                </div>
              </div>

              {/* Activity Follow-up Log History */}
              <div className="bg-slate-800/50 border border-slate-700/60 p-5 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Activity & Follow-Up Log</h4>
                {(!task.followUpLogs || task.followUpLogs.length === 0) ? (
                  <p className="text-xs text-slate-500 italic">No log entries recorded yet.</p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                    {task.followUpLogs.map((log) => (
                      <div key={log.id} className="bg-slate-900/70 p-3 rounded-xl text-xs border border-slate-800 flex justify-between items-start">
                        <div>
                          <p className="text-slate-200">{log.text}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">— {log.authorName}</span>
                        </div>
                        <span className="text-[10px] text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit for Review Section */}
              <div className="bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-800/50 p-6 rounded-2xl space-y-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={20} className="text-indigo-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white">Review Submission Engine</h3>
                    <p className="text-xs text-slate-400">
                      Submit task work for manager/admin verification once execution is ready.
                    </p>
                  </div>
                </div>

                {isReadOnly ? (
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 space-y-1">
                    <p className="font-bold text-amber-300">Submitted for Review</p>
                    <p>Submission Notes: "{task.submissionNotes || 'No notes provided'}"</p>
                    <p className="text-[10px] text-slate-400">Submitted at {task.submittedAt ? new Date(task.submittedAt).toLocaleString() : ''}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <textarea
                      rows={2}
                      placeholder="Add final submission notes or summary for the reviewer..."
                      value={submissionNotes}
                      onChange={(e) => setSubmissionNotes(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />

                    <div className="flex justify-between items-center pt-2">
                      <div className="text-xs text-slate-400">
                        Checklist progress: <strong className="text-slate-200">{completedChecklistCount}/{totalChecklistCount}</strong> items completed
                      </div>

                      <button
                        onClick={handleSubmitReview}
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-lg shadow-emerald-950/50 flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
                      >
                        <Send size={15} /> Submit for Review
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
