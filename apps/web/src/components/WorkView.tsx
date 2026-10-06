'use client';

import React, { useState } from 'react';
import {
  CheckSquare,
  Clock,
  Plus,
  Play,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  FileCheck2,
  Trash2,
  ChevronDown,
  User,
  ArrowRight,
  ShieldCheck,
  Send,
  Lock,
  XCircle,
  Activity,
  Pin,
} from 'lucide-react';
import { useDashboardStore, STANDARD_TASKS_BY_CATEGORY } from '../store/dashboardStore';
import { Task, TaskStatus, Priority, ReviewSeverity, ReviewStatus } from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

export const WorkView: React.FC = () => {
  const {
    engagements,
    addTask,
    updateTask,
    deleteTask,
    addReviewPoint,
    updateReviewPoint,
    addTaskFollowUp,
    users,
    currentUser,
    serviceCategories,
  } = useDashboardStore();

  const [activeEngId, setActiveEngId] = useState<string>('ALL');
  const [activeEmployeeId, setActiveEmployeeId] = useState<string>('ALL');
  const [showAllocModal, setShowAllocModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null); // any to avoid TSTask missing errors
  const [executingTask, setExecutingTask] = useState<{ taskId: string; engagementId: string } | null>(null);

  // Alloc Form
  const [allocForm, setAllocForm] = useState({
    engagementId: '',
    title: '',
    milestone: 'Onboarding & Financial Process Mapping',
    estimatedHours: 10,
    priority: 'MEDIUM' as any,
    employeeId: '',
    reviewerId: '',
    notes: '',
    dueDate: '',
    standardTaskCategory: '',
    standardTask: '',
    verificationSteps: '',
    analysisSteps: '',
  });

  // Review Form
  const [reviewPointForm, setReviewPointForm] = useState({
    category: 'Financial Statement Accuracy',
    severity: 'MEDIUM' as any,
    description: '',
  });

  const [timeSpentInput, setTimeSpentInput] = useState<string>('0');
  const [progressInput, setProgressInput] = useState<number>(0);
  const [commentsInput, setCommentsInput] = useState<string>('');
  const [taskNoteModal, setTaskNoteModal] = useState<{isOpen: boolean; taskId: string; engagementId: string; currentNote: string}>({isOpen: false, taskId: '', engagementId: '', currentNote: ''});
  
  // Follow-up Input
  const [followUpInput, setFollowUpInput] = useState<string>('');

  const [viewMode, setViewMode] = useState<'dashboard' | 'kanban' | 'list' | 'allocation' | 'review'>(
    currentUser?.role === 'SUPER_ADMIN' ? 'dashboard' : 'kanban'
  );

  // --- Dashboard Data Aggregation ---
  const allTasks = engagements.flatMap((e) => e.tasks || []);
  const totalGlobalTasks = allTasks.length;
  const completedGlobalTasks = allTasks.filter((t) => t.status === 'COMPLETED').length;
  const globalCompletionRate = totalGlobalTasks === 0 ? 0 : Math.round((completedGlobalTasks / totalGlobalTasks) * 100);

  // Group by employee
  const employeeStats: Record<string, { name: string; total: number; completed: number; estHours: number; logHours: number; pendingPoints: number }> = {};
  
  users.filter(u => u.role === 'EMPLOYEE').forEach(u => {
    employeeStats[u.id] = { name: u.name, total: 0, completed: 0, estHours: 0, logHours: 0, pendingPoints: 0 };
  });

  allTasks.forEach(task => {
    if (task.employeeId && employeeStats[task.employeeId]) {
      const stats = employeeStats[task.employeeId];
      stats.total += 1;
      if (task.status === 'COMPLETED') stats.completed += 1;
      stats.estHours += Number(task.estimatedHours) || 0;
      stats.logHours += Number(task.timeSpent) || 0;
      stats.pendingPoints += task.reviewPoints?.filter(rp => rp.status === 'PENDING').length || 0;
    }
  });

  const employeeData = Object.values(employeeStats).sort((a, b) => b.total - a.total);
  // ----------------------------------

  const isTaskForCurrentUser = (task: Task) => {
    if (currentUser?.role === 'SUPER_ADMIN') return true;
    if (task.employeeId && (task.employeeId === currentUser?.id || task.employeeId === currentUser?.email)) return true;
    if (task.employeeName && currentUser?.name && task.employeeName.toLowerCase().includes(currentUser.name.toLowerCase())) return true;
    if (!task.employeeId && !task.employeeName) return true;
    return false;
  };

  const visibleTasks = React.useMemo(() => {
    let pool: (Task & { clientName?: string })[] = [];
    if (activeEngId === 'ALL' || !activeEngId) {
      engagements.forEach((e) => {
        (e.tasks || []).forEach((t) => {
          pool.push({ ...t, clientName: e.clientCompanyName });
        });
      });
    } else {
      const eng = engagements.find((e) => e.id === activeEngId);
      if (eng) {
        pool = (eng.tasks || []).map((t) => ({ ...t, clientName: eng.clientCompanyName }));
      }
    }

    if (activeEmployeeId !== 'ALL') {
      pool = pool.filter(t => t.employeeId === activeEmployeeId || (!t.employeeId && activeEmployeeId === 'UNASSIGNED'));
    }

    if (currentUser?.role === 'SUPER_ADMIN') return pool;
    return pool.filter(isTaskForCurrentUser);
  }, [engagements, activeEngId, activeEmployeeId, currentUser]);

  if (!currentUser) return null;

  const getPriorityColor = (p: Priority) => {
    switch (p) {
      case 'URGENT':
        return 'bg-red-50 text-red-700 border-red-100';
      case 'HIGH':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-100';
    }
  };

  const getStatusColor = (s: TaskStatus) => {
    switch (s) {
      case 'COMPLETED':
        return 'bg-green-50 text-green-700 border-green-150';
      case 'REVIEW_PENDING':
        return 'bg-amber-50 text-amber-700 border-amber-150 animate-pulse';
      case 'IN_PROGRESS':
        return 'bg-blue-50 text-blue-700 border-blue-150';
      case 'WAITING_FOR_CLIENT':
        return 'bg-purple-50 text-purple-700 border-purple-150';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const getTaskEngagement = (taskId?: string) => {
    if (!taskId) return engagements.find((e) => e.id === activeEngId) || engagements[0];
    return engagements.find((e) => (e.tasks || []).some((t) => t.id === taskId)) || engagements.find((e) => e.id === activeEngId) || engagements[0];
  };

  const handleDeleteTask = (taskId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this task? It will be removed for the assigned employee as well.')) return;

    const targetEng = getTaskEngagement(taskId);
    if (targetEng) {
      deleteTask(targetEng.id, taskId);
      if (selectedTask?.id === taskId) {
        setSelectedTask(null);
      }
    }
  };

  const handleAllocateTask = (e: React.FormEvent) => {
    e.preventDefault();
    const targetEngId = allocForm.engagementId || (activeEngId !== 'ALL' ? activeEngId : engagements[0]?.id);
    if (!targetEngId) return;

    const emp = users.find((u) => u.id === allocForm.employeeId);
    const rev = users.find((u) => u.id === allocForm.reviewerId);

    addTask(targetEngId, {
      engagementId: targetEngId,
      title: allocForm.title,
      milestone: allocForm.milestone,
      estimatedHours: Number(allocForm.estimatedHours),
      timeSpent: 0,
      progress: 0,
      priority: allocForm.priority,
      status: 'NOT_STARTED',
      dependencies: '',
      notes: allocForm.notes,
      verificationSteps: allocForm.verificationSteps,
      analysisSteps: allocForm.analysisSteps,
      dueDate: allocForm.dueDate || undefined,
      employeeId: allocForm.employeeId || undefined,
      employeeName: emp ? emp.name : undefined,
      reviewerId: allocForm.reviewerId || undefined,
      reviewerName: rev ? rev.name : undefined,
    });

    setShowAllocModal(false);
    setAllocForm({
      engagementId: '',
      title: '',
      milestone: 'Onboarding & Financial Process Mapping',
      estimatedHours: 10,
      priority: 'MEDIUM',
      employeeId: '',
      reviewerId: '',
      notes: '',
      dueDate: '',
      standardTaskCategory: '',
      standardTask: '',
      verificationSteps: '',
      analysisSteps: '',
    });
  };

  const handleUpdateTaskExecution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    const targetEng = getTaskEngagement(selectedTask.id);
    if (!targetEng) return;

    const newTime = Number(selectedTask.timeSpent) + Number(timeSpentInput);
    const autoProgress = selectedTask.estimatedHours > 0 
      ? Math.min(100, Math.round((newTime / selectedTask.estimatedHours) * 100))
      : 0;

    updateTask(targetEng.id, selectedTask.id, {
      timeSpent: newTime,
      progress: autoProgress,
      status: autoProgress === 100 ? 'REVIEW_PENDING' : 'IN_PROGRESS',
    });

    if (autoProgress === 100) {
      useDashboardStore.getState().addNotification(
        'Task Review Requested',
        `Task "${selectedTask.title}" has been submitted for partner audit approval.`,
        `/work/tasks`
      );
    }

    setSelectedTask(null);
  };

  const handleAddReviewPoint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    const targetEng = getTaskEngagement(selectedTask.id);
    if (!targetEng) return;

    addReviewPoint(targetEng.id, selectedTask.id, {
      taskId: selectedTask.id,
      category: reviewPointForm.category,
      severity: reviewPointForm.severity,
      description: reviewPointForm.description,
      status: 'PENDING',
    });

    updateTask(targetEng.id, selectedTask.id, {
      status: 'IN_PROGRESS',
      progress: 85,
    });

    setReviewPointForm({
      category: 'Financial Statement Accuracy',
      severity: 'MEDIUM',
      description: '',
    });
    setSelectedTask(null);
  };

  const handleAddFollowUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !followUpInput.trim()) return;
    
    const targetEng = getTaskEngagement(selectedTask.id);
    if (!targetEng) return;

    addTaskFollowUp(targetEng.id, selectedTask.id, followUpInput);
    
    // update local state selected task to show immediately
    const authorName = currentUser.name;
    setSelectedTask((prev: any) => prev ? {
      ...prev,
      followUpLogs: [...(prev.followUpLogs || []), {
        id: `temp-${Date.now()}`,
        text: followUpInput,
        timestamp: new Date().toISOString(),
        authorName,
      }]
    } : null);
    
    setFollowUpInput('');
  };

  const handleApproveTaskComplete = (taskId: string) => {
    const targetEng = getTaskEngagement(taskId);
    if (!targetEng) return;

    updateTask(targetEng.id, taskId, {
      status: 'COMPLETED',
      progress: 100,
    });

    const task = targetEng.tasks.find((t) => t.id === taskId);
    if (task) {
      (task.reviewPoints || []).forEach((rp) => {
        updateReviewPoint(targetEng.id, taskId, rp.id, { status: 'APPROVED' });
      });
    }

    useDashboardStore.getState().addAuditLog(
      'APPROVE_TASK',
      `Partner approved task "${task?.title}" as successfully resolved and locked.`
    );
    setSelectedTask(null);
  };

  const isPartnerOrReviewer = true; // Super Admin has all permissions

  // Kanban lanes definition matching the style guide
  const kanbanColumns: { label: string; statuses: TaskStatus[]; bulletColor: string }[] = [
    { label: 'Pending', statuses: ['NOT_STARTED', 'WAITING_FOR_CLIENT'], bulletColor: 'bg-outline' },
    { label: 'In Progress', statuses: ['IN_PROGRESS'], bulletColor: 'bg-secondary' },
    { label: 'Review', statuses: ['REVIEW_PENDING'], bulletColor: 'bg-primary' },
    { label: 'Completed', statuses: ['COMPLETED'], bulletColor: 'bg-green-500' },
  ];

  return (
    <div className="space-y-6">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/30 pb-2 gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 font-outfit flex items-center gap-2">
            <Pin size={20} className="text-blue-600" />
            Task Hub
          </h1>
          <p className="text-xs text-outline">Manage active client engagement checklists, track progress metrics, and complete reviews.</p>
        </div>
        
        {currentUser.role === 'SUPER_ADMIN' && (
          <button
            onClick={() => setShowAllocModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-primary hover:opacity-90 text-on-primary rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-[0.98]"
          >
            <Plus size={14} />
            Allocate Task
          </button>
        )}
      </div>

      {/* Toolbar & Selectors */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {viewMode !== 'dashboard' ? (
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex gap-2 items-center text-xs">
              <span className="text-outline font-medium">Active Engagement:</span>
              <select
                value={activeEngId}
                onChange={(e) => setActiveEngId(e.target.value)}
                className="bg-surface border border-slate-200/50 rounded-xl px-3 py-1.5 font-semibold text-slate-800 outline-none max-w-[300px] text-ellipsis"
              >
                <option value="ALL">All Engagements ({currentUser.role === 'SUPER_ADMIN' ? 'All Tasks' : 'My Assigned Tasks'})</option>
                {engagements.map((eng) => (
                  <option key={eng.id} value={eng.id}>
                    {eng.clientCompanyName} &mdash; {eng.name}
                  </option>
                ))}
              </select>
            </div>

            {currentUser.role === 'SUPER_ADMIN' && (
              <div className="flex gap-2 items-center text-xs">
                <span className="text-outline font-medium">Assignee:</span>
                <select
                  value={activeEmployeeId}
                  onChange={(e) => setActiveEmployeeId(e.target.value)}
                  className="bg-surface border border-slate-200/50 rounded-xl px-3 py-1.5 font-semibold text-slate-800 outline-none"
                >
                  <option value="ALL">All Assignees</option>
                  <option value="UNASSIGNED">Unassigned</option>
                  {users.filter(u => u.role === 'EMPLOYEE').map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        ) : (
          <div className="flex gap-2 items-center text-xs">
            <span className="bg-primary/10 text-blue-600 px-3 py-1.5 rounded-xl font-bold border border-primary/20 flex items-center gap-1.5">
              <ShieldCheck size={14} />
              Global Firm-Wide Analytics
            </span>
          </div>
        )}

        {/* View Mode Toggle Toolbar matching template */}
        <div className="flex items-center bg-slate-200 rounded-xl p-1 border border-slate-100 shadow-inner">
          {currentUser.role === 'SUPER_ADMIN' && (
            <button
              onClick={() => setViewMode('dashboard')}
              className={`px-4 py-2 font-semibold rounded-lg flex items-center gap-2 transition-all text-xs ${
                viewMode === 'dashboard'
                  ? 'bg-slate-50est text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">monitoring</span>
              <span>Dashboard</span>
            </button>
          )}
          <button
            onClick={() => setViewMode('kanban')}
            className={`px-4 py-2 font-semibold rounded-lg flex items-center gap-2 transition-all text-xs ${
              viewMode === 'kanban'
                ? 'bg-slate-50est text-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">view_kanban</span>
            <span>Kanban Board</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 font-semibold rounded-lg flex items-center gap-2 transition-all text-xs ${
              viewMode === 'list'
                ? 'bg-slate-50est text-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">table_rows</span>
            <span>List Table</span>
          </button>
          {(currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN') && (
            <>
              <button
                onClick={() => setViewMode('allocation')}
                className={`px-4 py-2 font-semibold rounded-lg flex items-center gap-2 transition-all text-xs ${
                  viewMode === 'allocation'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">assignment_ind</span>
                <span>Work Allocation</span>
              </button>
              <button
                onClick={() => setViewMode('review')}
                className={`px-4 py-2 font-semibold rounded-lg flex items-center gap-2 transition-all text-xs ${
                  viewMode === 'review'
                    ? 'bg-gradient-to-r from-amber-500 to-indigo-600 text-white shadow-sm font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">verified_user</span>
                <span>Review Queue</span>
              </button>
            </>
          )}
        </div>
      </div>

      {viewMode === 'dashboard' && (
        <div className="space-y-6">
          {/* Top KPI row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="premium-card bg-slate-50est p-6 border border-slate-200/30 flex items-center gap-6">
              <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" className="stroke-surface-container-highest fill-none" strokeWidth="12" />
                  <circle 
                    cx="50" cy="50" r="40" 
                    className="stroke-primary fill-none transition-all duration-1000 ease-out" 
                    strokeWidth="12" 
                    strokeDasharray={`${251.2}`}
                    strokeDashoffset={`${251.2 - (251.2 * globalCompletionRate) / 100}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold text-slate-800 font-outfit">{globalCompletionRate}%</span>
                </div>
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Overall Completion</h3>
                <p className="text-xs text-outline mt-1">{completedGlobalTasks} of {totalGlobalTasks} tasks completed across all active firm engagements.</p>
              </div>
            </div>

            <div className="premium-card bg-slate-50est p-6 border border-slate-200/30">
               <h3 className="text-xs font-bold text-outline uppercase tracking-wider mb-4">Total Firm Workload</h3>
               <div className="flex items-end gap-3 mb-2">
                 <span className="text-4xl font-black text-slate-800 font-outfit">{totalGlobalTasks}</span>
                 <span className="text-sm font-medium text-slate-500 mb-1">Active Tasks</span>
               </div>
               <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden flex">
                 <div className="bg-primary h-full" style={{ width: `${globalCompletionRate}%` }} title={`Completed: ${globalCompletionRate}%`}></div>
                 <div className="bg-amber-400 h-full" style={{ width: `${100 - globalCompletionRate}%` }} title={`In Progress / Pending: ${100 - globalCompletionRate}%`}></div>
               </div>
               <div className="flex w-full text-[10px] font-bold text-outline mt-2">
                 <span style={{ width: `${globalCompletionRate}%` }} className="text-left">Completed: {completedGlobalTasks}</span>
                 <span style={{ width: `${100 - globalCompletionRate}%` }} className="text-right">In Progress: {totalGlobalTasks - completedGlobalTasks}</span>
               </div>
            </div>

            <div className="premium-card bg-slate-50est p-6 border border-slate-200/30 bg-gradient-to-br from-surface-container-lowest to-surface-container-high">
               <h3 className="text-xs font-bold text-outline uppercase tracking-wider mb-4">Quality & Efficiency</h3>
               <div className="flex justify-between items-center border-b border-slate-200/30 pb-3 mb-3">
                 <span className="text-xs font-bold text-slate-500">Global Logged Hours</span>
                 <span className="text-sm font-black text-blue-600">{employeeData.reduce((acc, curr) => acc + curr.logHours, 0)}h</span>
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-xs font-bold text-slate-500">Active Review Issues</span>
                 <span className="text-sm font-black text-red-600 animate-pulse flex items-center gap-1">
                   <AlertTriangle size={14} />
                   {employeeData.reduce((acc, curr) => acc + curr.pendingPoints, 0)}
                 </span>
               </div>
            </div>
          </div>

          {/* Graph & Assessment Table Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Standard Bar Chart for Employees */}
            <div className="premium-card bg-slate-50est p-6 border border-slate-200/30 flex flex-col h-[360px]">
              <h3 className="font-bold text-slate-800 text-sm mb-4">All Employees Task Graph</h3>
              <div className="flex-1 w-full relative">
                {employeeData.length === 0 ? (
                  <div className="text-center text-outline text-xs py-8">No consultants found.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={employeeData.map(emp => ({
                        name: emp.name,
                        Completed: emp.completed,
                        Pending: emp.total - emp.completed,
                      }))}
                      margin={{ top: 10, right: 30, left: 30, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={true} vertical={false} />
                      <XAxis type="number" stroke="#94a3b8" fontSize={10} allowDecimals={false} />
                      <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} width={80} />
                      <Tooltip contentStyle={{ fontSize: 10, borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} cursor={{fill: '#f8fafc'}} />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Bar dataKey="Completed" stackId="a" fill="#10b981" barSize={24} />
                      <Bar dataKey="Pending" stackId="a" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Assessment & Monitoring */}
            <div className="premium-card bg-slate-50est p-6 border border-slate-200/30 flex flex-col">
              <h3 className="font-bold text-slate-800 text-sm mb-3">Employee Wise Assessment & Monitoring</h3>
              
              <div className="mb-4 bg-slate-50 p-3 rounded-xl border border-slate-200 text-[10px] text-slate-600">
                <div className="font-bold text-xs text-slate-800 mb-1.5 flex items-center gap-1.5">
                  <Activity size={14} className="text-primary" />
                  Efficiency Criteria (Logged / Estimated Hours)
                </div>
                <div className="flex flex-wrap gap-4">
                  <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500"></div> <b>&ge; 100%</b> (Highly Efficient)</span>
                  <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500"></div> <b>80% - 99%</b> (Slightly Inefficient)</span>
                  <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500"></div> <b>&lt; 80%</b> (Highly Inefficient)</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="whitespace-nowrap">
                    <tr className="border-b border-slate-200/30 text-outline">
                      <th className="pb-3 font-semibold">Consultant Name</th>
                      <th className="pb-3 font-semibold text-center">Efficiency (Log/Est)</th>
                      <th className="pb-3 font-semibold text-center">Review Quality</th>
                      <th className="pb-3 font-semibold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    {employeeData.map((emp) => {
                      let effPercentage = 0;
                      if (emp.logHours > 0) {
                        effPercentage = Math.round((emp.estHours / emp.logHours) * 100);
                      }
                      
                      let effColor = 'text-red-600';
                      if (effPercentage >= 100) effColor = 'text-green-600';
                      else if (effPercentage >= 80) effColor = 'text-amber-600';
                      
                      if (emp.logHours === 0) effColor = 'text-slate-400';
                      
                      return (
                        <tr key={emp.name} className="hover:bg-surface-container/30 transition-colors whitespace-nowrap">
                          <td className="py-3 font-bold text-slate-800 flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary/10 text-blue-600 flex items-center justify-center text-[9px]">
                              {emp.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            {emp.name}
                          </td>
                          <td className="py-3 text-center font-bold">
                            {emp.logHours > 0 ? (
                              <span className={effColor}>{effPercentage}%</span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                            <span className="text-slate-400 text-[10px] ml-1 font-medium">({emp.logHours}h / {emp.estHours}h)</span>
                          </td>
                          <td className="py-3 text-center">
                            {emp.pendingPoints > 0 ? (
                              <span className="inline-flex px-2 py-0.5 rounded-full bg-red-50 text-red-600 font-bold text-[9px] border border-red-200">
                                {emp.pendingPoints} Issues
                              </span>
                            ) : (
                              <span className="inline-flex px-2 py-0.5 rounded-full bg-green-50 text-green-600 font-bold text-[9px] border border-green-200">
                                Perfect
                              </span>
                            )}
                          </td>
                          <td className="py-3 text-right">
                            {emp.total === 0 ? (
                              <span className="text-outline text-[10px]">Idle</span>
                            ) : emp.completed === emp.total ? (
                              <span className="text-green-600 text-[10px] font-bold">Available</span>
                            ) : (
                              <span className="text-blue-600 text-[10px] font-bold">Loaded</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      )}

      {viewMode !== 'dashboard' && (
        <div className="space-y-6">
          
          {/* View mode 1: Kanban Board */}
          {viewMode === 'kanban' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {kanbanColumns.map((col) => {
                const colTasks = visibleTasks.filter((t) => col.statuses.includes(t.status));
                return (
                  <div key={col.label} className="flex flex-col gap-4">
                    
                    {/* Column Header */}
                    <div className="flex items-center justify-between px-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${col.bulletColor}`}></span>
                        <h3 className="font-bold text-slate-500 uppercase tracking-wider text-[11px]">
                          {col.label}
                        </h3>
                        <span className="bg-slate-200 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {colTasks.length}
                        </span>
                      </div>
                    </div>

                    {/* Column Container */}
                    <div className="kanban-column flex flex-col gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                      {colTasks.map((task) => {
                        const pendingPoints = task.reviewPoints.filter((rp) => rp.status === 'PENDING').length;
                        const isUrgent = task.priority === 'URGENT';
                        
                        return (
                          <div
                            key={task.id}
                            onClick={() => {
                              setSelectedTask(task);
                              setProgressInput(task.progress);
                              setTimeSpentInput('0');
                            }}
                            className="bg-white border border-slate-200 p-4 rounded-xl shadow-[0px_1px_3px_rgba(0,0,0,0.05)] hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer group"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <span className="bg-slate-100 text-slate-500 text-[9px] font-bold px-2 py-1 rounded uppercase tracking-tighter">
                                {(task.milestone || 'General').split(' ')[0]}
                              </span>
                              <div className="flex items-center gap-1">
                                <span
                                  className={`flex items-center gap-0.5 font-bold text-[9px] uppercase ${
                                    isUrgent ? 'text-red-600' : 'text-slate-500'
                                  }`}
                                >
                                  {isUrgent && <span className="material-symbols-outlined text-[12px]">priority_high</span>}
                                  {task.priority}
                                </span>
                                {currentUser.role === 'SUPER_ADMIN' && (
                                  <button
                                    type="button"
                                    onClick={(e) => handleDeleteTask(task.id, e)}
                                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors ml-1"
                                    title="Delete Task (Admin Only)"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                )}
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setTaskNoteModal({ isOpen: true, taskId: task.id, engagementId: getTaskEngagement(task.id)?.id || '', currentNote: task.notes || '' }); }}
                                  className="text-[9px] font-bold bg-blue-50 text-blue-600 border border-blue-200 rounded px-1.5 py-0.5 hover:bg-blue-100 transition-colors ml-1"
                                  title="Add/Edit Note"
                                >
                                  Note
                                </button>
                              </div>
                            </div>

                            <h4 className="font-bold text-slate-800 text-xs mb-1 group-hover:text-blue-600 transition-colors leading-tight">
                              {task.title}
                            </h4>
                            <p className="text-outline text-[11px] mb-4">
                              Assignee: <span className="text-slate-500 font-medium">{task.employeeName || 'Unassigned'}</span>
                            </p>

                            {/* Subtask Progress indicator */}
                            <div className="mb-4 space-y-1.5">
                              <div className="flex justify-between text-[10px] font-bold">
                                <span className="text-outline">Progress</span>
                                <span className="text-slate-800">{task.progress}%</span>
                              </div>
                              <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    task.status === 'COMPLETED' ? 'bg-green-500' : 'bg-primary'
                                  }`}
                                  style={{ width: `${task.progress}%` }}
                                ></div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                              <div className="flex items-center gap-1.5 text-outline">
                                <span className="material-symbols-outlined text-[14px]">event</span>
                                <span className="text-[10px] font-mono">
                                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Flexible'}
                                </span>
                              </div>
                              
                              {pendingPoints > 0 ? (
                                <div className="text-red-600 flex items-center gap-0.5 font-bold text-[9px] uppercase animate-pulse">
                                  <span className="material-symbols-outlined text-[14px]">priority_high</span>
                                  {pendingPoints} Issues
                                </div>
                              ) : (
                                <div className="bg-surface-container px-2 py-1 rounded-md flex items-center justify-center font-bold text-[9px] text-outline max-w-[120px] truncate" title={task.employeeName || 'Unassigned'}>
                                  {task.employeeName ? task.employeeName : 'Unassigned'}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      
                      {colTasks.length === 0 && (
                        <div className="py-12 text-center text-outline text-[11px] italic">
                          No tasks in {col.label}
                        </div>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}

          {/* View mode 2: List Board */}
          {viewMode === 'list' && (
            <div className="premium-card p-5 space-y-4 bg-white">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Milestone Delivery Board</h3>
                  <p className="text-[10px] text-outline">Allocated workloads and progress ratios</p>
                </div>
              </div>

              <div className="space-y-3">
                {visibleTasks.length === 0 ? (
                  <div className="py-8 text-center text-outline text-xs">
                    {currentUser.role === 'SUPER_ADMIN' 
                      ? 'No tasks allocated to this engagement. Allocate one above.' 
                      : 'You have no assigned tasks for this engagement.'}
                  </div>
                ) : (
                  visibleTasks.map((task) => {
                    const pendingPointsCount = task.reviewPoints.filter((rp) => rp.status === 'PENDING').length;
                    return (
                      <div
                        key={task.id}
                        onClick={() => {
                          setSelectedTask(task);
                          setProgressInput(task.progress);
                          setTimeSpentInput('0');
                        }}
                        className="p-3 border border-slate-200 rounded-xl hover:border-primary/30 hover:shadow-xs transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white"
                      >
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-800 text-xs">{task.title}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold border ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold border ${getStatusColor(task.status)}`}>
                              {task.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[10px] text-outline">
                            <span>Milestone: {task.milestone}</span>
                            <span>&bull;</span>
                            <span className="flex items-center gap-0.5"><User size={10} /> Exec: {task.employeeName || 'Unassigned'}</span>
                          </div>
                        </div>

                        {/* Work hours & review counts */}
                        <div className="flex items-center gap-6 text-xs text-right shrink-0">
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-outline block">Hours (Log/Est)</span>
                            <span className="font-bold text-slate-800">
                              {task.timeSpent}h / {task.estimatedHours}h
                            </span>
                          </div>
                          <div className="space-y-1 w-24">
                            <span className="text-[10px] text-outline block">Progress</span>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div className="bg-primary h-1.5" style={{ width: `${task.progress}%` }} />
                            </div>
                            <span className="text-[9px] font-bold text-blue-600 block">{task.progress}% Done</span>
                          </div>
                          
                          {pendingPointsCount > 0 && (
                            <div className="bg-red-50 text-red-600 border border-red-155 rounded-xl px-2 py-1 flex items-center gap-1 font-bold text-[9px] animate-pulse">
                              <AlertTriangle size={10} />
                              {pendingPointsCount} Review Issues
                            </div>
                          )}

                          {currentUser.role === 'SUPER_ADMIN' && (
                            <button
                              type="button"
                              onClick={(e) => handleDeleteTask(task.id, e)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100 shrink-0 ml-2"
                              title="Delete Task (Admin Only)"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                          <button 
                            onClick={(e) => { e.stopPropagation(); setTaskNoteModal({ isOpen: true, taskId: task.id, engagementId: getTaskEngagement(task.id)?.id || '', currentNote: task.notes || '' }); }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 bg-blue-50 border border-blue-200 rounded-lg transition-all shrink-0 ml-1 text-[10px] font-bold"
                            title="Add/Edit Note"
                          >
                            Note
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

        </div>
      )}


      {/* Work Allocation Panel (Prompt 11) */}
      {viewMode === 'allocation' && (
        <WorkAllocationView />
      )}

      {/* Review Queue Dashboard (Prompt 13) */}
      {viewMode === 'review' && (
        <TaskReviewQueueView />
      )}

      {/* Task Allocation Modal */}
      {showAllocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setShowAllocModal(false)} />
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl p-6 relative z-10 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-slate-800 text-sm mb-4">Allocate Engagement Task</h3>
            <form onSubmit={handleAllocateTask} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-500 mb-1">Target Client Engagement</label>
                {engagements.length === 0 ? (
                  <div className="w-full bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-xs font-medium">
                    No active client engagements available. You must create an engagement before allocating tasks.
                  </div>
                ) : (
                  <select
                    required
                    value={allocForm.engagementId || (activeEngId !== 'ALL' ? activeEngId : engagements[0]?.id || '')}
                    onChange={(e) => setAllocForm({ ...allocForm, engagementId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:bg-white font-semibold"
                  >
                    {engagements.map((eng) => (
                      <option key={eng.id} value={eng.id}>
                        {eng.clientCompanyName} &mdash; {eng.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              {/* Standard Task Selector */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold text-[10px] uppercase tracking-wider">Service Category</label>
                  <select
                    value={allocForm.standardTaskCategory}
                    onChange={(e) => {
                      setAllocForm({ ...allocForm, standardTaskCategory: e.target.value, standardTask: '' });
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 outline-none text-xs font-semibold"
                  >
                    <option value="">-- Custom Task --</option>
                    {serviceCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-bold text-[10px] uppercase tracking-wider">Select Service Plan</label>
                  <select
                    disabled={!allocForm.standardTaskCategory}
                    value={allocForm.standardTask}
                    onChange={(e) => {
                      const serviceId = e.target.value;
                      const selectedCat = serviceCategories.find(c => c.id === allocForm.standardTaskCategory);
                      const selectedService = selectedCat?.services.find(s => s.id === serviceId);
                      
                      setAllocForm({ 
                        ...allocForm, 
                        standardTask: serviceId, 
                        title: selectedService ? selectedService.name : allocForm.title,
                        priority: selectedService ? selectedService.priority : allocForm.priority,
                      });
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 outline-none text-xs font-semibold disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    <option value="">-- Select Service --</option>
                    {allocForm.standardTaskCategory && serviceCategories.find(c => c.id === allocForm.standardTaskCategory)?.services.map(svc => (
                      <option key={svc.id} value={svc.id}>{svc.name} ({svc.frequency})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Task Title / Action item</label>
                <input
                  type="text"
                  required
                  value={allocForm.title}
                  onChange={(e) => setAllocForm({ ...allocForm, title: e.target.value })}
                  placeholder="e.g. Map Trial Balance items to GST logs"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1">Milestone Category</label>
                  <select
                    value={allocForm.milestone}
                    onChange={(e) => setAllocForm({ ...allocForm, milestone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none"
                  >
                    <option value="Onboarding & Financial Process Mapping">Onboarding & Mapping</option>
                    <option value="MIS Board Dashboard Implementation">MIS Board Setup</option>
                    <option value="Audit Trail Setup & Verification">Audit Setup</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Estimated Hours</label>
                  <input
                    type="number"
                    value={allocForm.estimatedHours}
                    onChange={(e) => setAllocForm({ ...allocForm, estimatedHours: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Priority</label>
                  <select
                    value={allocForm.priority}
                    onChange={(e) => setAllocForm({ ...allocForm, priority: e.target.value as Priority })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={allocForm.dueDate}
                    onChange={(e) => setAllocForm({ ...allocForm, dueDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Assign Consultant</label>
                  <select
                    value={allocForm.employeeId}
                    onChange={(e) => setAllocForm({ ...allocForm, employeeId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none"
                  >
                    <option value="">Select Employee</option>
                    {users.filter(u => u.role === 'EMPLOYEE').map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Partner Reviewer</label>
                  <select
                    value={allocForm.reviewerId}
                    onChange={(e) => setAllocForm({ ...allocForm, reviewerId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none"
                  >
                    <option value="">Select Reviewer</option>
                    {users.filter(u => u.role === 'SUPER_ADMIN' || u.role === 'EMPLOYEE').map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Verification & Analysis Steps Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1">
                    <CheckSquare size={12} className="text-blue-600" /> Verification Steps
                  </label>
                  <textarea
                    value={allocForm.verificationSteps}
                    onChange={(e) => setAllocForm({ ...allocForm, verificationSteps: e.target.value })}
                    placeholder="Enter verification steps..."
                    rows={3}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 outline-none focus:border-blue-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1">
                    <Activity size={12} className="text-purple-600" /> Analysis Steps
                  </label>
                  <textarea
                    value={allocForm.analysisSteps}
                    onChange={(e) => setAllocForm({ ...allocForm, analysisSteps: e.target.value })}
                    placeholder="Enter analysis steps..."
                    rows={3}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 outline-none focus:border-purple-500 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1 font-bold">Rich Instructions & Notes</label>
                <textarea
                  value={allocForm.notes}
                  onChange={(e) => setAllocForm({ ...allocForm, notes: e.target.value })}
                  rows={3}
                  placeholder="Provide detailed briefs, context links, and follow-up directives..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:bg-white focus:border-primary transition-colors text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAllocModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={engagements.length === 0}
                  className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-sm transition-all ${
                    engagements.length === 0 ? 'bg-blue-400 cursor-not-allowed opacity-50' : 'bg-blue-600 hover:bg-blue-700 hover:shadow'
                  }`}
                >
                  Allocate Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Details Drawer & Review Loop management */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setSelectedTask(null)} />
          <div className="absolute inset-y-0 right-0 max-w-lg w-full bg-white shadow-2xl flex flex-col z-50">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">{selectedTask.title}</h3>
                <span className="text-[10px] text-slate-400">Milestone Action Drawer</span>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="p-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500"
              >
                <XCircle size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs">
              
              {/* Task Details Info */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 block text-[10px]">CFO Consultant</span>
                    <span className="font-bold text-slate-700">{selectedTask.employeeName || 'Unassigned'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Partner Reviewer</span>
                    <span className="font-bold text-slate-700">{selectedTask.reviewerName || 'Unassigned'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Task Due Date</span>
                    <span className="font-bold text-slate-700">{selectedTask.dueDate?.split('T')[0] || 'Flexible'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Time Spent to Date</span>
                    <span className="font-bold text-blue-600">{selectedTask.timeSpent} Hours</span>
                  </div>
                </div>
                {selectedTask.notes && (
                  <div className="border-t border-slate-200 pt-3">
                    <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider mb-2">Rich Instructions & Brief</span>
                    <div className="bg-white border border-slate-100 p-3 rounded-lg text-slate-600 leading-relaxed text-[11px] whitespace-pre-wrap shadow-inner font-medium">
                      {selectedTask.notes}
                    </div>
                  </div>
                )}
              </div>

              {/* Execution Guidelines */}
              {(selectedTask.verificationSteps || selectedTask.analysisSteps) && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-slate-200 bg-white">
                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Execution Guidelines</h4>
                  </div>
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedTask.verificationSteps && (
                      <div className="space-y-1.5">
                        <h5 className="text-[10px] font-bold text-blue-700 flex items-center gap-1 uppercase tracking-wider">
                          <CheckSquare size={12} /> Verification Steps
                        </h5>
                        <div className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs">
                          {selectedTask.verificationSteps}
                        </div>
                      </div>
                    )}
                    {selectedTask.analysisSteps && (
                      <div className="space-y-1.5">
                        <h5 className="text-[10px] font-bold text-purple-700 flex items-center gap-1 uppercase tracking-wider">
                          <Activity size={12} /> Analysis Steps
                        </h5>
                        <div className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs">
                          {selectedTask.analysisSteps}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Review Points Logs */}
              {selectedTask.reviewPoints.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wide">Review Log Notes ({selectedTask.reviewPoints.length})</h4>
                  <div className="space-y-2">
                    {selectedTask.reviewPoints.map((rp: any) => (
                      <div key={rp.id} className="p-3 border border-red-100 bg-red-50/20 rounded-xl space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-red-700 block">{rp.category}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold border ${
                            rp.severity === 'HIGH'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {rp.severity} Severity
                          </span>
                        </div>
                        <p className="text-slate-600">{rp.description}</p>
                        <span className="text-[9px] text-slate-400 block">Status: {rp.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Follow-up Tracker */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <MessageSquare size={14} className="text-blue-500" /> Follow-up Tracker
                </h4>
                
                <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                  {(selectedTask.followUpLogs || []).length === 0 ? (
                    <div className="text-center p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400">
                      No follow-up logs yet.
                    </div>
                  ) : (
                    (selectedTask.followUpLogs || []).map((log: any) => (
                      <div key={log.id} className="bg-white border border-slate-100 shadow-[0_1px_2px_rgba(0,0,0,0.05)] rounded-xl p-3 flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px] shrink-0 uppercase">
                          {log.authorName.split(' ').map((n: any) => n[0]).join('')}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-slate-700">{log.authorName}</span>
                            <span className="text-[9px] text-slate-400">
                              {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-slate-600 leading-snug font-medium">{log.text}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleAddFollowUp} className="flex gap-2">
                  <input
                    type="text"
                    value={followUpInput}
                    onChange={(e) => setFollowUpInput(e.target.value)}
                    placeholder="Log a follow-up reminder or update..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:bg-white focus:border-blue-300 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!followUpInput.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Send size={14} /> Send
                  </button>
                </form>
              </div>

              {/* Action Form 1: Execution (Consultant Update) */}
              {selectedTask.status !== 'COMPLETED' && (
                <form onSubmit={handleUpdateTaskExecution} className="space-y-4 border-t border-slate-100 pt-4">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wide">Update Task Progress</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-500 mb-1">Add Time Spent (Hours)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={timeSpentInput}
                        onChange={(e) => setTimeSpentInput(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Automatic Progress %</label>
                      <div className="h-[38px] bg-slate-100 rounded-xl flex items-center px-4 overflow-hidden relative">
                         {(() => {
                           const newTime = Number(selectedTask.timeSpent) + Number(timeSpentInput || 0);
                           const autoProgress = selectedTask.estimatedHours > 0 ? Math.min(100, Math.round((newTime / selectedTask.estimatedHours) * 100)) : 0;
                           return (
                             <>
                               <div className="absolute left-0 top-0 bottom-0 bg-blue-100" style={{ width: `${autoProgress}%` }}></div>
                               <span className="relative z-10 font-bold text-blue-700 text-sm">{autoProgress}%</span>
                               <span className="relative z-10 text-slate-400 text-[10px] ml-auto">
                                 {newTime}h / {selectedTask.estimatedHours}h
                               </span>
                             </>
                           );
                         })()}
                      </div>
                    </div>
                  </div>

                  {(() => {
                    const newTime = Number(selectedTask.timeSpent) + Number(timeSpentInput || 0);
                    const autoProgress = selectedTask.estimatedHours > 0 ? Math.min(100, Math.round((newTime / selectedTask.estimatedHours) * 100)) : 0;
                    return (
                      <button
                        type="submit"
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-500/10 flex items-center justify-center gap-1"
                      >
                        <Send size={12} />
                        {autoProgress === 100 ? 'Submit for Partner Review' : 'Save Progress Update'}
                      </button>
                    );
                  })()}
                </form>
              )}

              {/* Action Form 2: Partner Review (Raise Points / Approve Complete) */}
              {selectedTask.status === 'REVIEW_PENDING' && (
                <div className="space-y-4 border-t border-slate-100 pt-4">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wide">Audit Review Control</h4>
                  
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleApproveTaskComplete(selectedTask.id)}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md flex items-center justify-center gap-1.5"
                    >
                      <ShieldCheck size={14} />
                      Approve & Lock Task
                    </button>
                  </div>

                  <div className="border-t border-slate-200 pt-3">
                    <h5 className="font-bold text-slate-700 mb-2">Raise Correction Review Points</h5>
                    <form onSubmit={handleAddReviewPoint} className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-400 mb-1">Category</label>
                          <select
                            value={reviewPointForm.category}
                            onChange={(e) => setReviewPointForm({ ...reviewPointForm, category: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none"
                          >
                            <option value="Financial Analysis Accuracy">Financial Accuracy</option>
                            <option value="KYC Compliance matching">KYC Compliance</option>
                            <option value="Formula Check">Formula error</option>
                            <option value="Formatting & Structure">Formatting</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-slate-400 mb-1">Severity</label>
                          <select
                            value={reviewPointForm.severity}
                            onChange={(e) => setReviewPointForm({ ...reviewPointForm, severity: e.target.value as ReviewSeverity })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none"
                          >
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">Issue Description & Action required</label>
                        <textarea
                          required
                          value={reviewPointForm.description}
                          onChange={(e) => setReviewPointForm({ ...reviewPointForm, description: e.target.value })}
                          rows={2.5}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 outline-none"
                          placeholder="Specify exactly what ledger mapping needs to be resolved."
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl font-bold"
                      >
                        Submit Correction Points
                      </button>
                    </form>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setExecutingTask({ taskId: selectedTask.id, engagementId: selectedTask.engagementId });
                    setSelectedTask(null);
                  }}
                  className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all shadow-md text-xs"
                >
                  <Play size={14} />
                  Open Work Execution Portal
                </button>

                {currentUser.role === 'SUPER_ADMIN' && (
                  <button
                    type="button"
                    onClick={() => handleDeleteTask(selectedTask.id)}
                    className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors text-xs"
                  >
                    <Trash2 size={14} />
                    Delete Task (Admin Only)
                  </button>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {executingTask && (
        <TaskExecutionModal
          taskId={executingTask.taskId}
          engagementId={executingTask.engagementId}
          onClose={() => setExecutingTask(null)}
        />
      )}

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
                className="px-6 py-2 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition-colors"
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
