'use client';

import React, { useState, useEffect } from 'react';
import { useDashboardStore } from '../../store/dashboardStore';
import {
  ReviewPoint,
  ReviewPointCategory,
  ReviewSeverity,
  ReviewPointStatus,
  TaskSubmission,
} from '../../types';
import {
  X,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Paperclip,
  Clock,
  Send,
  Building2,
  Calendar,
  User,
  Plus,
  MessageSquare,
  History,
  AlertCircle,
  CheckSquare,
  RotateCcw,
  Zap,
  Tag,
  Lock,
} from 'lucide-react';

interface TaskReviewModalProps {
  taskId: string;
  engagementId: string;
  onClose: () => void;
}

export const TaskReviewModal: React.FC<TaskReviewModalProps> = ({
  taskId,
  engagementId,
  onClose,
}) => {
  const {
    engagements,
    currentUser,
    startTaskReview,
    createReviewPoint,
    addReviewPointComment,
    markReviewPointCorrected,
    resolveReviewPoint,
    reopenReviewPoint,
    updateChecklistReviewItemState,
    updateWorkingDataReviewItemState,
    updateAttachmentReviewItemState,
    requestTaskCorrection,
    approveTask,
  } = useDashboardStore();

  const engagement = engagements.find((e) => e.id === engagementId);
  const task = engagement?.tasks?.find((t) => t.id === taskId);

  const [activeTab, setActiveTab] = useState<
    'overview' | 'checklist' | 'data' | 'attachments' | 'points' | 'history'
  >('overview');

  // Confirmation Modals
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // New Review Point Form State
  const [showPointForm, setShowPointForm] = useState(false);
  const [rpTitle, setRpTitle] = useState('');
  const [rpDesc, setRpDesc] = useState('');
  const [rpCategory, setRpCategory] = useState<ReviewPointCategory>('CALCULATION_ERROR');
  const [rpSeverity, setRpSeverity] = useState<ReviewSeverity>('HIGH');
  const [rpRelatedType, setRpRelatedType] = useState<
    'TASK' | 'CHECKLIST' | 'WORKING_DATA' | 'ATTACHMENT' | 'DOCUMENT'
  >('WORKING_DATA');
  const [rpRelatedId, setRpRelatedId] = useState('');

  // Comment Form State
  const [activePointComment, setActivePointComment] = useState<{ id: string; text: string }>({
    id: '',
    text: '',
  });

  // Reopen Reason State
  const [reopenReason, setReopenReason] = useState<{ id: string; text: string }>({
    id: '',
    text: '',
  });

  // Start review automatically on mount
  useEffect(() => {
    if (engagementId && taskId) {
      startTaskReview(engagementId, taskId);
    }
  }, [engagementId, taskId, startTaskReview]);

  if (!task || !engagement) {
    return null;
  }

  const isMaker = currentUser?.id === task.submittedBy && currentUser?.role !== 'SUPER_ADMIN';
  const openReviewPoints = (task.reviewPoints || []).filter(
    (rp) => rp.status === 'OPEN' || rp.status === 'REOPENED' || rp.status === 'IN_PROGRESS'
  );
  const criticalCount = openReviewPoints.filter((rp) => rp.severity === 'CRITICAL' || rp.severity === 'HIGH').length;

  // Handlers
  const handleCreatePoint = () => {
    if (!rpDesc.trim()) return;
    const res = createReviewPoint(engagementId, taskId, {
      taskId,
      title: rpTitle.trim() || undefined,
      description: rpDesc.trim(),
      category: rpCategory,
      severity: rpSeverity,
      status: 'OPEN',
      relatedEntityType: rpRelatedType,
      relatedEntityId: rpRelatedId || undefined,
      assignedTo: task.employeeId,
      assignedToName: task.employeeName,
    });

    if (res.success) {
      setRpTitle('');
      setRpDesc('');
      setRpRelatedId('');
      setShowPointForm(false);
    }
  };

  const handleQuickAddPointForField = (type: 'CHECKLIST' | 'WORKING_DATA' | 'ATTACHMENT', idOrKey: string) => {
    setRpRelatedType(type);
    setRpRelatedId(idOrKey);
    setRpTitle(`Issue in ${type.replace('_', ' ')}: ${idOrKey}`);
    setRpDesc(`Inconsistency or error identified in ${idOrKey}. Please verify.`);
    setActiveTab('points');
    setShowPointForm(true);
  };

  const handleAddComment = (pointId: string) => {
    if (!activePointComment.text.trim()) return;
    addReviewPointComment(engagementId, taskId, pointId, activePointComment.text.trim());
    setActivePointComment({ id: '', text: '' });
  };

  const handleRequestCorrection = () => {
    setActionError(null);
    const res = requestTaskCorrection(engagementId, taskId);
    if (!res.success) {
      setActionError(res.error || 'Failed to request correction');
    } else {
      setShowCorrectionModal(false);
      onClose();
    }
  };

  const handleApprove = () => {
    setActionError(null);
    const res = approveTask(engagementId, taskId);
    if (!res.success) {
      setActionError(res.error || 'Failed to approve task');
    } else {
      setShowApprovalModal(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 lg:p-6 overflow-y-auto custom-scrollbar">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/90 border-b border-slate-800 relative flex justify-between items-start">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="flex items-center gap-1 bg-slate-800 text-slate-300 font-semibold px-2.5 py-1 rounded-full border border-slate-700">
                <Building2 size={12} className="text-blue-400" />
                {engagement.clientCompanyName}
              </span>
              <span className="flex items-center gap-1 bg-indigo-950/80 text-indigo-300 font-semibold px-2.5 py-1 rounded-full border border-indigo-800/60">
                <Zap size={12} className="text-indigo-400" />
                {task.milestone || 'Execution'}
              </span>
              <span className="bg-purple-950/60 text-purple-300 font-bold text-[10px] uppercase px-2.5 py-1 rounded-full border border-purple-800/50">
                Submission #{task.currentSubmissionNumber || 1}
              </span>
              <span
                className={`font-black uppercase tracking-widest text-[10px] px-2.5 py-1 rounded-full ${
                  task.status === 'UNDER_REVIEW'
                    ? 'bg-amber-900/50 text-amber-300 border border-amber-500/50 animate-pulse'
                    : task.status === 'CORRECTION_REQUIRED'
                    ? 'bg-rose-900/50 text-rose-300 border border-rose-500/50'
                    : task.status === 'APPROVED' || task.status === 'COMPLETED'
                    ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-500/50'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {task.status.replace('_', ' ')}
              </span>
            </div>

            <h2 className="text-2xl font-black font-outfit text-white tracking-tight leading-snug">
              Review: {task.title}
            </h2>

            <div className="flex items-center gap-4 text-xs text-slate-400 pt-0.5">
              <span>
                Submitted By: <strong className="text-slate-200">{task.submittedByName || task.employeeName || 'Employee'}</strong>
              </span>
              <span>
                Date: <strong className="text-slate-200">{task.submittedAt ? new Date(task.submittedAt).toLocaleDateString() : 'N/A'}</strong>
              </span>
              <span>
                Reviewer: <strong className="text-indigo-300">{task.reviewerName || currentUser?.name || 'Assigned Reviewer'}</strong>
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

        {/* Maker-Checker Alert Banner */}
        {isMaker && (
          <div className="bg-rose-950/60 border-b border-rose-800/60 px-6 py-3 text-rose-200 text-xs flex items-center gap-2">
            <Lock size={16} className="text-rose-400 shrink-0" />
            <span>
              <strong>Maker-Checker Policy Enforced:</strong> You submitted this task. Only an independent reviewer or manager can approve this work.
            </span>
          </div>
        )}

        {/* Action Error Banner */}
        {actionError && (
          <div className="bg-rose-950/80 border-b border-rose-700 px-6 py-3 text-rose-200 text-xs flex items-center justify-between">
            <span className="flex items-center gap-2 font-medium">
              <AlertTriangle size={16} className="text-rose-400" />
              {actionError}
            </span>
            <button onClick={() => setActionError(null)} className="text-rose-300 hover:text-white text-xs underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Workspace Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-6 pt-3 gap-2 overflow-x-auto custom-scrollbar">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-t border-x whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-slate-900 border-slate-700 text-blue-400 shadow-sm'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <ShieldCheck size={14} /> Overview
          </button>

          <button
            onClick={() => setActiveTab('checklist')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-t border-x whitespace-nowrap ${
              activeTab === 'checklist'
                ? 'bg-slate-900 border-slate-700 text-indigo-400 shadow-sm'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <CheckSquare size={14} /> Checklist ({task.checklist?.length || 0})
          </button>

          <button
            onClick={() => setActiveTab('data')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-t border-x whitespace-nowrap ${
              activeTab === 'data'
                ? 'bg-slate-900 border-slate-700 text-purple-400 shadow-sm'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <FileText size={14} /> Working Data
          </button>

          <button
            onClick={() => setActiveTab('attachments')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-t border-x whitespace-nowrap ${
              activeTab === 'attachments'
                ? 'bg-slate-900 border-slate-700 text-teal-400 shadow-sm'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Paperclip size={14} /> Work Attachments ({task.attachments?.length || 0})
          </button>

          <button
            onClick={() => setActiveTab('points')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-t border-x whitespace-nowrap relative ${
              activeTab === 'points'
                ? 'bg-slate-900 border-slate-700 text-amber-400 shadow-sm'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <AlertCircle size={14} /> Review Points
            {openReviewPoints.length > 0 && (
              <span className="bg-rose-500 text-white font-black text-[10px] px-1.5 py-0.5 rounded-full ml-1 animate-pulse">
                {openReviewPoints.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-t border-x whitespace-nowrap ${
              activeTab === 'history'
                ? 'bg-slate-900 border-slate-700 text-emerald-400 shadow-sm'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <History size={14} /> Submission History ({task.submissionHistory?.length || 1})
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-6">

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Review Overview Metric Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-800/60 border border-slate-700 p-4 rounded-2xl">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Open Issues</p>
                  <p className={`text-2xl font-black mt-1 ${openReviewPoints.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {openReviewPoints.length}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">{criticalCount} high/critical</p>
                </div>

                <div className="bg-slate-800/60 border border-slate-700 p-4 rounded-2xl">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Checklist State</p>
                  <p className="text-2xl font-black text-indigo-400 mt-1">
                    {task.checklist?.filter((c) => c.isCompleted).length || 0} / {task.checklist?.length || 0}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">{task.progress}% employee progress</p>
                </div>

                <div className="bg-slate-800/60 border border-slate-700 p-4 rounded-2xl">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Attachments</p>
                  <p className="text-2xl font-black text-purple-400 mt-1">{task.attachments?.length || 0}</p>
                  <p className="text-[10px] text-slate-500 mt-1">Uploaded work files</p>
                </div>

                <div className="bg-slate-800/60 border border-slate-700 p-4 rounded-2xl">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Time Logged</p>
                  <p className="text-2xl font-black text-emerald-400 mt-1">{task.timeSpent || 0} hrs</p>
                  <p className="text-[10px] text-slate-500 mt-1">Estimated: {task.estimatedHours} hrs</p>
                </div>
              </div>

              {/* Task Details Card */}
              <div className="bg-slate-800/40 border border-slate-700/60 p-5 rounded-2xl space-y-4">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <FileText size={16} className="text-blue-400" /> Task Information & Scope
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Client</span>
                    <span className="font-semibold text-slate-200">{engagement.clientCompanyName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Milestone / Scope</span>
                    <span className="font-semibold text-slate-200">{task.milestone}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Due Date</span>
                    <span className="font-semibold text-slate-200">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Priority</span>
                    <span className="font-bold text-amber-400">{task.priority}</span>
                  </div>
                </div>

                {task.submissionNotes && (
                  <div className="mt-2 p-3 bg-slate-900 border border-slate-700 rounded-xl text-xs">
                    <span className="text-[10px] font-bold uppercase text-indigo-400 block">Employee Submission Notes</span>
                    <p className="text-slate-300 italic mt-0.5">"{task.submissionNotes}"</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: CHECKLIST REVIEW */}
          {activeTab === 'checklist' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <CheckSquare size={16} className="text-indigo-400" /> Checklist Verification
                </h3>
                <span className="text-xs text-slate-400">
                  Verify each item independently. Marking an issue triggers a review point.
                </span>
              </div>

              {(!task.checklist || task.checklist.length === 0) ? (
                <div className="p-8 text-center bg-slate-950/40 border border-slate-800 rounded-2xl text-slate-500 text-xs">
                  No checklist items configured for this task.
                </div>
              ) : (
                <div className="space-y-2">
                  {task.checklist.map((item, idx) => {
                    const reviewState = task.checklistReviewState?.[item.item];
                    return (
                      <div
                        key={idx}
                        className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-xl flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`p-1 rounded-md font-bold text-[10px] ${
                              item.isCompleted ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-900 text-slate-500'
                            }`}
                          >
                            {item.isCompleted ? 'DONE' : 'PENDING'}
                          </span>
                          <span className={`font-medium ${item.isCompleted ? 'text-slate-200' : 'text-slate-400'}`}>
                            {item.item}
                          </span>
                        </div>

                        {/* Reviewer Actions */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateChecklistReviewItemState(engagementId, taskId, item.item, 'PASS')}
                            className={`px-3 py-1 rounded-lg font-bold text-[10px] transition-all ${
                              reviewState === 'PASS'
                                ? 'bg-emerald-600 text-white shadow-md'
                                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            ✓ PASS
                          </button>
                          <button
                            onClick={() => {
                              updateChecklistReviewItemState(engagementId, taskId, item.item, 'ISSUE');
                              handleQuickAddPointForField('CHECKLIST', item.item);
                            }}
                            className={`px-3 py-1 rounded-lg font-bold text-[10px] transition-all ${
                              reviewState === 'ISSUE'
                                ? 'bg-rose-600 text-white shadow-md'
                                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            ⚠ ISSUE
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: WORKING DATA REVIEW */}
          {activeTab === 'data' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <FileText size={16} className="text-purple-400" /> Submitted Field Data Review
              </h3>

              {!task.workingData?.fields || Object.keys(task.workingData.fields).length === 0 ? (
                <div className="p-8 text-center bg-slate-950/40 border border-slate-800 rounded-2xl text-slate-500 text-xs">
                  No structured data metrics recorded by employee.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(task.workingData.fields).map(([key, val]) => {
                    const state = task.workingDataReviewState?.[key];
                    return (
                      <div key={key} className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{key}</p>
                          <p className="font-bold text-purple-200 text-sm mt-0.5">{String(val)}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateWorkingDataReviewItemState(engagementId, taskId, key, 'VERIFIED')}
                            className={`px-3 py-1 rounded-lg font-bold text-[10px] transition-all ${
                              state === 'VERIFIED'
                                ? 'bg-emerald-600 text-white shadow-md'
                                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            ✓ VERIFIED
                          </button>
                          <button
                            onClick={() => {
                              updateWorkingDataReviewItemState(engagementId, taskId, key, 'ISSUE');
                              handleQuickAddPointForField('WORKING_DATA', key);
                            }}
                            className={`px-3 py-1 rounded-lg font-bold text-[10px] transition-all ${
                              state === 'ISSUE'
                                ? 'bg-rose-600 text-white shadow-md'
                                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            ⚠ ISSUE
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {task.workingData?.notes && (
                <div className="p-4 bg-slate-900 border border-slate-700 rounded-2xl space-y-1">
                  <h4 className="text-xs font-bold text-slate-300">Employee Execution Notes</h4>
                  <p className="text-xs text-slate-400 italic">{task.workingData.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ATTACHMENTS REVIEW */}
          {activeTab === 'attachments' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Paperclip size={16} className="text-teal-400" /> Work Files & Attachments Review
              </h3>

              {(!task.attachments || task.attachments.length === 0) ? (
                <div className="p-8 text-center bg-slate-950/40 border border-slate-800 rounded-2xl text-slate-500 text-xs">
                  No work files uploaded for this task.
                </div>
              ) : (
                <div className="space-y-2">
                  {task.attachments.map((att) => {
                    const state = task.attachmentReviewState?.[att.id];
                    return (
                      <div key={att.id} className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-xl flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-teal-950/50 text-teal-400 rounded-lg border border-teal-800/40">
                            <FileText size={16} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-200">{att.name}</p>
                            <p className="text-[10px] text-slate-400">
                              {att.fileSize || 'File'} • Uploaded by {att.uploadedByName || 'Employee'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {att.fileData && (
                            <a
                              href={att.fileData}
                              download={att.name}
                              className="text-xs text-blue-400 hover:underline px-2 py-1 font-semibold"
                            >
                              Download
                            </a>
                          )}
                          <button
                            onClick={() => updateAttachmentReviewItemState(engagementId, taskId, att.id, 'VERIFIED')}
                            className={`px-3 py-1 rounded-lg font-bold text-[10px] transition-all ${
                              state === 'VERIFIED'
                                ? 'bg-emerald-600 text-white shadow-md'
                                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            ✓ VERIFIED
                          </button>
                          <button
                            onClick={() => {
                              updateAttachmentReviewItemState(engagementId, taskId, att.id, 'ISSUE');
                              handleQuickAddPointForField('ATTACHMENT', att.name);
                            }}
                            className={`px-3 py-1 rounded-lg font-bold text-[10px] transition-all ${
                              state === 'ISSUE'
                                ? 'bg-rose-600 text-white shadow-md'
                                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            ⚠ ISSUE
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: REVIEW POINTS */}
          {activeTab === 'points' && (
            <div className="space-y-6">
              
              {/* Header & Add Point Button */}
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <AlertCircle size={16} className="text-amber-400" /> Review Points & Discussion
                </h3>
                <button
                  onClick={() => setShowPointForm(!showPointForm)}
                  className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 transition-colors"
                >
                  <Plus size={14} /> Raise Review Point
                </button>
              </div>

              {/* Form to Create Review Point */}
              {showPointForm && (
                <div className="bg-slate-800 border border-amber-600/50 p-5 rounded-2xl space-y-4 animate-in fade-in duration-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">Raise New Review Point</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Title</label>
                      <input
                        type="text"
                        placeholder="e.g. EBITDA Mismatch"
                        value={rpTitle}
                        onChange={(e) => setRpTitle(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Category</label>
                      <select
                        value={rpCategory}
                        onChange={(e) => setRpCategory(e.target.value as any)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="CALCULATION_ERROR">Calculation Error</option>
                        <option value="DATA_ERROR">Data Error</option>
                        <option value="DOCUMENT_ERROR">Document Error</option>
                        <option value="MISSING_INFORMATION">Missing Information</option>
                        <option value="FORMAT_ERROR">Format Error</option>
                        <option value="COMPLIANCE_ISSUE">Compliance Issue</option>
                        <option value="PROCESS_ERROR">Process Error</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Severity</label>
                      <select
                        value={rpSeverity}
                        onChange={(e) => setRpSeverity(e.target.value as any)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="CRITICAL">CRITICAL (Blocking)</option>
                        <option value="HIGH">HIGH (Blocking)</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="LOW">LOW</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Related Source Item</label>
                      <input
                        type="text"
                        placeholder="e.g., Working Data -> Revenue"
                        value={rpRelatedId}
                        onChange={(e) => setRpRelatedId(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Detailed Description / Instructions</label>
                    <textarea
                      rows={2}
                      placeholder="Explain what is wrong and how the employee should correct it..."
                      value={rpDesc}
                      onChange={(e) => setRpDesc(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowPointForm(false)}
                      className="px-4 py-1.5 text-xs text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreatePoint}
                      className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs px-4 py-1.5 rounded-xl shadow"
                    >
                      Save Point
                    </button>
                  </div>
                </div>
              )}

              {/* Review Points List */}
              {(!task.reviewPoints || task.reviewPoints.length === 0) ? (
                <div className="p-8 text-center bg-slate-950/40 border border-slate-800 rounded-2xl text-slate-500 text-xs">
                  No review points raised yet. If work is satisfactory, click "Approve Task" below.
                </div>
              ) : (
                <div className="space-y-4">
                  {task.reviewPoints.map((pt) => (
                    <div
                      key={pt.id}
                      className={`p-5 rounded-2xl border transition-all ${
                        pt.status === 'RESOLVED'
                          ? 'bg-emerald-950/20 border-emerald-800/40 opacity-70'
                          : pt.status === 'IN_PROGRESS'
                          ? 'bg-blue-950/30 border-blue-800/50'
                          : 'bg-slate-800/60 border-slate-700'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              pt.severity === 'CRITICAL' || pt.severity === 'HIGH'
                                ? 'bg-rose-900/50 text-rose-300 border border-rose-600/40'
                                : 'bg-amber-900/50 text-amber-300 border border-amber-600/40'
                            }`}
                          >
                            {pt.severity}
                          </span>
                          <span className="bg-slate-900 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-md border border-slate-700">
                            {pt.category}
                          </span>
                          {pt.relatedEntityId && (
                            <span className="text-[10px] text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-800/50">
                              Source: {pt.relatedEntityId}
                            </span>
                          )}
                        </div>

                        <span
                          className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
                            pt.status === 'RESOLVED'
                              ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-600/50'
                              : pt.status === 'IN_PROGRESS'
                              ? 'bg-blue-900/60 text-blue-300 border border-blue-600/50'
                              : 'bg-rose-900/60 text-rose-300 border border-rose-600/50 animate-pulse'
                          }`}
                        >
                          {pt.status}
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-100 text-sm">{pt.title || 'Review Issue'}</h4>
                      <p className="text-xs text-slate-300 mt-1">{pt.description}</p>

                      {pt.correctionComment && (
                        <div className="mt-3 p-3 bg-blue-950/40 border border-blue-800/40 rounded-xl text-xs">
                          <span className="text-[10px] font-bold text-blue-400 uppercase block">Employee Correction Note</span>
                          <p className="text-blue-200 mt-0.5">{pt.correctionComment}</p>
                        </div>
                      )}

                      {/* Discussion Comments Thread */}
                      {pt.comments && pt.comments.length > 0 && (
                        <div className="mt-3 space-y-2 border-t border-slate-700/60 pt-3">
                          {pt.comments.map((c) => (
                            <div key={c.id} className="text-xs bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                              <span className="font-bold text-indigo-300">{c.authorName}: </span>
                              <span className="text-slate-300">{c.comment}</span>
                              <span className="text-[9px] text-slate-500 ml-2">
                                {new Date(c.createdAt).toLocaleTimeString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Controls Footer */}
                      <div className="mt-4 pt-3 border-t border-slate-700/50 flex flex-wrap justify-between items-center gap-2">
                        {/* Comment Input */}
                        <div className="flex gap-1 flex-1 max-w-md">
                          <input
                            type="text"
                            placeholder="Add comment to point..."
                            value={activePointComment.id === pt.id ? activePointComment.text : ''}
                            onChange={(e) => setActivePointComment({ id: pt.id, text: e.target.value })}
                            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white flex-1 focus:outline-none focus:border-indigo-500"
                          />
                          <button
                            onClick={() => handleAddComment(pt.id)}
                            className="bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold px-2.5 py-1 rounded-lg"
                          >
                            Send
                          </button>
                        </div>

                        {/* Reviewer Resolution Buttons */}
                        <div className="flex items-center gap-2">
                          {pt.status !== 'RESOLVED' && (
                            <button
                              onClick={() => resolveReviewPoint(engagementId, taskId, pt.id)}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-lg shadow transition-colors flex items-center gap-1"
                            >
                              <CheckCircle2 size={12} /> Resolve Point
                            </button>
                          )}

                          {pt.status === 'RESOLVED' && (
                            <button
                              onClick={() => reopenReviewPoint(engagementId, taskId, pt.id, 'Further verification required')}
                              className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-lg transition-colors flex items-center gap-1"
                            >
                              <RotateCcw size={12} /> Reopen
                            </button>
                          )}
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: SUBMISSION HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <History size={16} className="text-emerald-400" /> Immutable Submission Snapshots
              </h3>

              {(!task.submissionHistory || task.submissionHistory.length === 0) ? (
                <div className="p-8 text-center bg-slate-950/40 border border-slate-800 rounded-2xl text-slate-500 text-xs">
                  Initial submission active. No previous versions recorded.
                </div>
              ) : (
                <div className="space-y-3">
                  {task.submissionHistory.map((sub) => (
                    <div key={sub.id} className="bg-slate-800/60 border border-slate-700 p-4 rounded-2xl space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-indigo-300 text-sm">Submission #{sub.submissionNumber}</span>
                        <span className="text-slate-400">{new Date(sub.submittedAt).toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-slate-300">Submitted by: <strong>{sub.submittedByName}</strong></p>
                      {sub.submissionNotes && (
                        <p className="text-xs text-slate-400 italic bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                          "{sub.submissionNotes}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Action Footer */}
        <div className="p-5 bg-slate-950 border-t border-slate-800 flex flex-wrap justify-between items-center gap-4">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span>Status: <strong className="text-amber-400">{task.status}</strong></span>
            <span>•</span>
            <span>Open Issues: <strong className={openReviewPoints.length > 0 ? 'text-rose-400' : 'text-emerald-400'}>{openReviewPoints.length}</strong></span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Close
            </button>

            {/* Request Correction Button */}
            {task.status !== 'COMPLETED' && task.status !== 'APPROVED' && (
              <button
                onClick={() => setShowCorrectionModal(true)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-600/50 shadow-md flex items-center gap-1.5 transition-all"
              >
                <AlertTriangle size={15} /> Request Correction
              </button>
            )}

            {/* Approve Task Button */}
            {task.status !== 'COMPLETED' && task.status !== 'APPROVED' && (
              <button
                onClick={() => setShowApprovalModal(true)}
                disabled={isMaker || openReviewPoints.length > 0}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-950/60 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-all transform hover:-translate-y-0.5"
              >
                <ShieldCheck size={16} /> Approve Task
              </button>
            )}
          </div>
        </div>

      </div>

      {/* CONFIRMATION MODAL: REQUEST CORRECTION */}
      {showCorrectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-slate-900 border border-rose-800 rounded-3xl p-6 max-w-md w-full text-slate-100 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle size={24} />
              <h3 className="text-lg font-bold">Request Task Correction?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              This task will be returned to <strong>{task.employeeName || 'Employee'}</strong> with status{' '}
              <span className="font-bold text-rose-400">CORRECTION_REQUIRED</span>.
            </p>

            <div className="bg-slate-950 p-3 rounded-xl text-xs border border-slate-800 space-y-1">
              <p className="font-bold text-slate-300">Open Review Points: {openReviewPoints.length}</p>
              <p className="text-slate-400">Critical / High Issues: {criticalCount}</p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowCorrectionModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestCorrection}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow"
              >
                Confirm Correction Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: APPROVE TASK */}
      {showApprovalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-slate-900 border border-emerald-800 rounded-3xl p-6 max-w-md w-full text-slate-100 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-emerald-400">
              <ShieldCheck size={24} />
              <h3 className="text-lg font-bold">Approve Task Execution?</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              You are granting final maker-checker approval for <strong>"{task.title}"</strong>. The task will be marked{' '}
              <span className="font-bold text-emerald-400">COMPLETED</span> and locked immutably for the report engine.
            </p>

            <div className="bg-slate-950 p-3 rounded-xl text-xs border border-slate-800 space-y-1">
              <p className="text-slate-300">Submission: <strong>#{task.currentSubmissionNumber || 1}</strong></p>
              <p className="text-slate-300">Open Review Points: <strong>0</strong></p>
              <p className="text-slate-300">Reviewer: <strong>{currentUser?.name}</strong></p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowApprovalModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow"
              >
                Confirm Final Approval
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
