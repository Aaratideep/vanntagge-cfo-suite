import React, { useState } from 'react';
import { useDashboardStore } from '../../store/dashboardStore';
import { Task } from '../../types';
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  Calendar,
  AlertCircle,
  Upload,
  FileText,
  X,
  ArrowRight,
  Send,
  Building,
} from 'lucide-react';

export const ClientTasksView: React.FC = () => {
  const { engagements, currentUser, addAuditLog } = useDashboardStore();

  const [activeTask, setActiveTask] = useState<{ task: Task; engagementName: string } | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [submissionNotes, setSubmissionNotes] = useState<string>('');
  const [isSubmittedNotice, setIsSubmittedNotice] = useState<boolean>(false);

  if (!currentUser) return null;

  // Flatten tasks belonging to client engagements
  const myEngagements = engagements.filter((e) => e.clientId === currentUser.id);

  // Client Action Tasks (e.g. document requirements, client confirmation, upload requests)
  const clientActionTasks: { task: Task; engagementName: string }[] = [];

  myEngagements.forEach((eng) => {
    (eng.tasks || []).forEach((t) => {
      // Exclude purely internal staff tasks unless client-actionable or marked for client input
      const isClientActionable =
        t.title.toLowerCase().includes('upload') ||
        t.title.toLowerCase().includes('bank statement') ||
        t.title.toLowerCase().includes('gst') ||
        t.title.toLowerCase().includes('provide') ||
        t.title.toLowerCase().includes('confirm') ||
        t.title.toLowerCase().includes('trial balance') ||
        t.title.toLowerCase().includes('client');

      if (isClientActionable) {
        clientActionTasks.push({ task: t, engagementName: eng.name });
      }
    });
  });

  const handleSubmitClientTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTask) return;

    addAuditLog(
      'CLIENT_TASK_SUBMITTED',
      `Client ${currentUser.name} submitted task "${activeTask.task.title}" with notes: ${submissionNotes}`
    );

    setIsSubmittedNotice(true);
    setTimeout(() => {
      setIsSubmittedNotice(false);
      setActiveTask(null);
      setUploadedFile(null);
      setSubmissionNotes('');
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="border-b border-slate-200/80 pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 font-outfit flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-blue-600" />
            Client Pending Actions & Tasks
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Required document uploads, data confirmations, and client inputs requested by your Virtual CFO team.
          </p>
        </div>
        <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-150 px-3 py-1 rounded-full font-outfit">
          {clientActionTasks.length} Pending Action(s)
        </span>
      </div>

      {/* Client Tasks List */}
      {clientActionTasks.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200/80 shadow-sm text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-700 font-outfit">All Actions Completed!</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You currently have no pending tasks or document upload requests required from your end.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {clientActionTasks.map(({ task, engagementName }) => (
            <div
              key={task.id}
              className="premium-card p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-bold text-slate-900 font-outfit leading-snug">
                    {task.title}
                  </h4>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 font-outfit shrink-0">
                    ACTION REQUIRED
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-700">{engagementName}</span>
                  </div>
                  {task.periodKey && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Period: {task.periodKey}</span>
                    </div>
                  )}
                  {task.dueDate && (
                    <div className="flex items-center gap-1.5 text-amber-600 font-semibold">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => setActiveTask({ task, engagementName })}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <span>Open Task & Upload</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Task Execution / Upload Modal */}
      {activeTask && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 px-6 py-5 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white font-outfit">{activeTask.task.title}</h3>
                <p className="text-xs text-blue-200">{activeTask.engagementName}</p>
              </div>
              <button
                onClick={() => setActiveTask(null)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitClientTask} className="p-6 space-y-5 text-xs">
              {isSubmittedNotice ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <h4 className="text-sm font-bold text-emerald-900 font-outfit">Task Response Submitted!</h4>
                  <p className="text-xs text-emerald-700">Your uploaded files have been logged into the Document Vault.</p>
                </div>
              ) : (
                <>
                  <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
                    <div className="flex justify-between border-b border-slate-200/60 pb-2">
                      <span className="text-slate-500">Period:</span>
                      <span className="font-bold text-slate-800">{activeTask.task.periodKey || 'Current Period'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Due Date:</span>
                      <span className="font-bold text-amber-600">
                        {activeTask.task.dueDate
                          ? new Date(activeTask.task.dueDate).toLocaleDateString()
                          : 'As soon as possible'}
                      </span>
                    </div>
                  </div>

                  {/* File Upload Trigger */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                      <Upload className="w-3.5 h-3.5 text-blue-600" /> Upload Requested File
                    </label>
                    <input
                      type="file"
                      onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-700"
                    />
                    {uploadedFile && (
                      <span className="text-[11px] font-semibold text-emerald-600 mt-1 block">
                        ✓ Selected: {uploadedFile.name} ({(uploadedFile.size / 1024).toFixed(1)} KB)
                      </span>
                    )}
                  </div>

                  {/* Remarks Notes */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Client Remarks / Notes
                    </label>
                    <textarea
                      rows={3}
                      value={submissionNotes}
                      onChange={(e) => setSubmissionNotes(e.target.value)}
                      placeholder="Add any commentary for your Virtual CFO team..."
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTask(null)}
                      className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-xs flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Action</span>
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
