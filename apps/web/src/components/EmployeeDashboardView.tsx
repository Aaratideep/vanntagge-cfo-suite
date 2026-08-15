'use client';

import React from 'react';
import { useDashboardStore } from '../store/dashboardStore';
import { 
  CheckCircle2, 
  Clock, 
  Briefcase, 
  AlertCircle, 
  Calendar as CalendarIcon, 
  TrendingUp,
  ShieldAlert
} from 'lucide-react';
import { formatINR } from '../lib/currency';
import { EmployeeOnboardingModal } from './EmployeeOnboardingModal';
import { LeaveApplicationModal } from './LeaveApplicationModal';
import { usePageContextStore } from '../store/pageContextStore';

export const EmployeeDashboardView: React.FC = () => {
  const { engagements, currentUser, followUps, leaves, updateTask } = useDashboardStore();
  const { setPageContext } = usePageContextStore();
  const [showLeaveModal, setShowLeaveModal] = React.useState(false);
  const [taskNoteModal, setTaskNoteModal] = React.useState<{isOpen: boolean; taskId: string; engagementId: string; currentNote: string}>({isOpen: false, taskId: '', engagementId: '', currentNote: ''});

  React.useEffect(() => {
    setPageContext('/employee', 'Employee Dashboard', {
      engagementsCount: engagements.length,
      followUpsCount: followUps.length,
      leavesCount: leaves.length,
    });
  }, [engagements.length, followUps.length, leaves.length, setPageContext]);

  if (!currentUser) return null;

  if (currentUser.role === 'EMPLOYEE' && !currentUser.isOnboarded) {
    return <EmployeeOnboardingModal />;
  }

  // Calculate Employee Metrics
  let myOpenTasks = 0;
  let myCompletedTasks = 0;
  let myOverdueTasks = 0;
  let myAssignedClients = new Set<string>();
  
  const myTasks: any[] = [];
  const myCompliances: any[] = [];

  const now = new Date();

  engagements.forEach((e) => {
    // Tasks
    (e.tasks || []).forEach((t) => {
      if (t.employeeId === currentUser.id) {
        myAssignedClients.add(e.id);
        if (t.status === 'COMPLETED') {
          myCompletedTasks++;
        } else {
          myOpenTasks++;
          myTasks.push({ ...t, clientName: e.clientCompanyName, engagementId: e.id });
          if (t.dueDate && new Date(t.dueDate) < now) {
            myOverdueTasks++;
          }
        }
      }
    });

    // Compliances
    (e.compliances || []).forEach((c) => {
      if (c.responsibleEmployeeId === currentUser.id && c.status !== 'COMPLETED') {
        myAssignedClients.add(e.id);
        myCompliances.push({ ...c, clientName: e.clientCompanyName });
      }
    });
  });

  // Sort tasks by due date
  myTasks.sort((a, b) => {
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  const completionRate = myOpenTasks + myCompletedTasks > 0 
    ? Math.round((myCompletedTasks / (myOpenTasks + myCompletedTasks)) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-slate-800 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none">
          <TrendingUp size={200} className="-mt-10 -mr-10" />
        </div>
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="flex items-center gap-2 text-blue-200 text-sm font-bold uppercase tracking-wider mb-2">
            <span className="material-symbols-outlined text-[16px]">waving_hand</span>
            Welcome back, {currentUser.name.split(' ')[0]}
          </div>
          <h1 className="text-3xl font-extrabold font-outfit">Your Operations Workspace</h1>
          <p className="text-blue-100 text-sm leading-relaxed">
            Here is your daily operational summary. Focus on your overdue tasks and upcoming compliance deadlines to ensure smooth service delivery for your assigned clients.
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="premium-card p-5 bg-white border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <Briefcase size={20} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Clients</span>
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-slate-800">{myAssignedClients.size}</h3>
            <p className="text-xs text-slate-500 font-medium">Assigned Engagements</p>
          </div>
        </div>

        <div className="premium-card p-5 bg-white border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock size={20} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tasks</span>
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-slate-800">{myOpenTasks}</h3>
            <p className="text-xs text-slate-500 font-medium">Open Assigned Tasks</p>
          </div>
        </div>

        <div className="premium-card p-5 bg-white border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 size={20} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Progress</span>
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-slate-800">{completionRate}%</h3>
            <p className="text-xs text-slate-500 font-medium">Task Completion Rate</p>
          </div>
        </div>

        <div className="premium-card p-5 bg-white border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
              <AlertCircle size={20} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Attention</span>
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-slate-800">{myOverdueTasks}</h3>
            <p className="text-xs text-slate-500 font-medium">Overdue Deadlines</p>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Urgent Tasks Panel */}
        <div className="premium-card bg-white flex flex-col h-[400px]">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Clock size={16} className="text-blue-600" /> My Priority Tasks
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Tasks needing your immediate attention</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {myTasks.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <CheckCircle2 size={40} className="mb-2 text-slate-200" />
                <p className="text-sm font-medium">You have no open tasks.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {myTasks.slice(0, 10).map(t => (
                  <div key={t.id} className="p-4 rounded-xl border border-slate-100 hover:border-slate-300 hover:shadow-sm transition-all group bg-white">
                    <div className="flex flex-col sm:flex-row justify-between items-start mb-2 gap-2">
                      <h4 className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors flex-1">{t.title}</h4>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          t.priority === 'URGENT' ? 'bg-rose-100 text-rose-700' :
                          t.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {t.priority}
                        </span>
                        <select 
                          className="text-[10px] font-bold bg-slate-50 border border-slate-200 rounded px-1 py-0.5 text-slate-700 cursor-pointer"
                          value={t.status}
                          onChange={(e) => updateTask(t.engagementId, t.id, { status: e.target.value as any })}
                        >
                          <option value="PENDING">Pending</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="UNDER_REVIEW">Under Review</option>
                          <option value="COMPLETED">Completed</option>
                        </select>
                        <button 
                          onClick={() => setTaskNoteModal({ isOpen: true, taskId: t.id, engagementId: t.engagementId, currentNote: t.notes || '' })}
                          className="text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-200 rounded px-2 py-0.5 hover:bg-blue-100 transition-colors"
                        >
                          Note
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1 font-medium text-slate-700">
                        <Briefcase size={12} /> {t.clientName}
                      </span>
                      {t.dueDate && (
                        <span className={`flex items-center gap-1 ${new Date(t.dueDate) < now ? 'text-rose-600 font-bold' : ''}`}>
                          <CalendarIcon size={12} /> 
                          {new Date(t.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                    {t.notes && (
                      <p className="mt-2 text-xs text-slate-600 bg-slate-50 p-2 rounded italic border border-slate-100">
                        "{t.notes}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pending Compliances Panel */}
        <div className="premium-card bg-white flex flex-col h-[400px]">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <ShieldAlert size={16} className="text-amber-600" /> Assigned Compliances
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Statutory filings and audits assigned to you</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {myCompliances.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <CheckCircle2 size={40} className="mb-2 text-slate-200" />
                <p className="text-sm font-medium">No pending compliances assigned.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {myCompliances.map(c => (
                  <div key={c.id} className="p-4 rounded-xl border border-slate-100 hover:border-slate-300 hover:shadow-sm transition-all bg-white flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-bold border border-blue-100">
                          {c.type.replace('_', ' ')}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          new Date(c.dueDate) < now ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {c.status}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm mt-2">{c.clientName}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Due: {new Date(c.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Leaves Panel */}
      <div className="premium-card bg-white flex flex-col mt-6">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <CalendarIcon size={16} className="text-purple-600" /> My Leave Management
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Track your balances, past and upcoming time off</p>
          </div>
          <button 
            onClick={() => setShowLeaveModal(true)}
            className="btn-primary py-2 text-sm flex items-center gap-2"
          >
            Apply for Leave
          </button>
        </div>
        
        {/* Leave Balances */}
        <div className="p-5 grid grid-cols-3 gap-4 border-b border-slate-100">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Casual Leave</h4>
            <div className="text-2xl font-black text-slate-800">8 <span className="text-sm font-medium text-slate-500">days</span></div>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Sick Leave</h4>
            <div className="text-2xl font-black text-slate-800">5 <span className="text-sm font-medium text-slate-500">days</span></div>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Privilege Leave</h4>
            <div className="text-2xl font-black text-slate-800">10 <span className="text-sm font-medium text-slate-500">days</span></div>
          </div>
        </div>

        <div className="p-5">
          {leaves.filter(l => l.userId === currentUser.id).length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <CalendarIcon size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">You haven't applied for any leaves yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="pb-3 font-bold text-xs uppercase">Type</th>
                    <th className="pb-3 font-bold text-xs uppercase">Duration</th>
                    <th className="pb-3 font-bold text-xs uppercase">Days</th>
                    <th className="pb-3 font-bold text-xs uppercase">Reason</th>
                    <th className="pb-3 font-bold text-xs uppercase text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leaves.filter(l => l.userId === currentUser.id).map(leave => (
                    <tr key={leave.id} className="hover:bg-slate-50/50">
                      <td className="py-3">
                        <span className="font-bold text-slate-800 text-xs bg-slate-100 px-2 py-1 rounded">
                          {leave.type}
                        </span>
                      </td>
                      <td className="py-3 text-slate-600 text-xs">
                        {new Date(leave.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(leave.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="py-3 text-slate-600 text-xs font-medium">{leave.days} Day(s)</td>
                      <td className="py-3 text-slate-500 text-xs truncate max-w-[200px]" title={leave.reason}>
                        {leave.reason}
                      </td>
                      <td className="py-3 text-right">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-wider uppercase ${
                          leave.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                          leave.status === 'REJECTED' ? 'bg-rose-100 text-rose-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {leave.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showLeaveModal && <LeaveApplicationModal onClose={() => setShowLeaveModal(false)} />}
      
      {taskNoteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <h3 className="text-xl font-bold font-outfit text-slate-800 mb-4">Task Note</h3>
            <textarea
              className="w-full h-32 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Add your progress note or findings here..."
              value={taskNoteModal.currentNote}
              onChange={(e) => setTaskNoteModal(prev => ({ ...prev, currentNote: e.target.value }))}
            />
            <div className="mt-4 flex justify-end gap-3">
              <button 
                className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
                onClick={() => setTaskNoteModal({ isOpen: false, taskId: '', engagementId: '', currentNote: '' })}
              >
                Cancel
              </button>
              <button 
                className="btn-primary py-2 px-6"
                onClick={() => {
                  updateTask(taskNoteModal.engagementId, taskNoteModal.taskId, { notes: taskNoteModal.currentNote });
                  setTaskNoteModal({ isOpen: false, taskId: '', engagementId: '', currentNote: '' });
                }}
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
