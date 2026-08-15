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
} from 'lucide-react';
import { useDashboardStore } from '../store/dashboardStore';
import { Task, TaskStatus, Priority, ReviewSeverity, ReviewStatus } from '../types';

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
  } = useDashboardStore();

  if (!currentUser) return null;

  const [activeEngId, setActiveEngId] = useState<string>('ALL');
  const [showAllocModal, setShowAllocModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Alloc Form
  const [allocForm, setAllocForm] = useState({
    engagementId: '',
    title: '',
    milestone: 'Onboarding & Financial Process Mapping',
    estimatedHours: 10,
    priority: 'MEDIUM' as Priority,
    employeeId: '',
    reviewerId: '',
    notes: '',
    dueDate: '',
  });

  // Review Form
  const [reviewPointForm, setReviewPointForm] = useState({
    category: 'Financial Statement Accuracy',
    severity: 'MEDIUM' as ReviewSeverity,
    description: '',
  });

  const [timeSpentInput, setTimeSpentInput] = useState<string>('0');
  const [progressInput, setProgressInput] = useState<number>(0);
  const [commentsInput, setCommentsInput] = useState<string>('');
  
  // Follow-up Input
  const [followUpInput, setFollowUpInput] = useState<string>('');

  const [viewMode, setViewMode] = useState<'dashboard' | 'kanban' | 'list'>(
    currentUser.role === 'SUPER_ADMIN' ? 'dashboard' : 'kanban'
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
    if (currentUser.role === 'SUPER_ADMIN') return true;
    if (task.employeeId && (task.employeeId === currentUser.id || task.employeeId === currentUser.email)) return true;
    if (task.employeeName && currentUser.name && task.employeeName.toLowerCase().includes(currentUser.name.toLowerCase())) return true;
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

    if (currentUser.role === 'SUPER_ADMIN') return pool;
    return pool.filter(isTaskForCurrentUser);
  }, [engagements, activeEngId, currentUser]);

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
    });
  };

  const handleUpdateTaskExecution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    const targetEng = getTaskEngagement(selectedTask.id);
    if (!targetEng) return;

    const newTime = Number(selectedTask.timeSpent) + Number(timeSpentInput);
    updateTask(targetEng.id, selectedTask.id, {
      timeSpent: newTime,
      progress: progressInput,
      status: progressInput === 100 ? 'REVIEW_PENDING' : 'IN_PROGRESS',
    });

    if (progressInput === 100) {
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
    setSelectedTask(prev => prev ? {
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-outline-variant/30 pb-2 gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-on-surface font-outfit">Task Management</h1>
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
          <div className="flex gap-2 items-center text-xs">
            <span className="text-outline font-medium">Active Engagement:</span>
            <select
              value={activeEngId}
              onChange={(e) => setActiveEngId(e.target.value)}
              className="bg-surface border border-outline-variant/50 rounded-xl px-3 py-1.5 font-semibold text-on-surface outline-none"
            >
              <option value="ALL">All Engagements ({currentUser.role === 'SUPER_ADMIN' ? 'All Tasks' : 'My Assigned Tasks'})</option>
              {engagements.map((eng) => (
                <option key={eng.id} value={eng.id}>
                  {eng.clientCompanyName} &mdash; {eng.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex gap-2 items-center text-xs">
            <span className="bg-primary/10 text-primary px-3 py-1.5 rounded-xl font-bold border border-primary/20 flex items-center gap-1.5">
              <ShieldCheck size={14} />
              Global Firm-Wide Analytics
            </span>
          </div>
        )}

        {/* View Mode Toggle Toolbar matching template */}
        <div className="flex items-center bg-surface-container-high rounded-xl p-1 border border-outline-variant/20 shadow-inner">
          {currentUser.role === 'SUPER_ADMIN' && (
            <button
              onClick={() => setViewMode('dashboard')}
              className={`px-4 py-2 font-semibold rounded-lg flex items-center gap-2 transition-all text-xs ${
                viewMode === 'dashboard'
                  ? 'bg-surface-container-lowest text-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
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
                ? 'bg-surface-container-lowest text-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">view_kanban</span>
            <span>Kanban Board</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 font-semibold rounded-lg flex items-center gap-2 transition-all text-xs ${
              viewMode === 'list'
                ? 'bg-surface-container-lowest text-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">table_rows</span>
            <span>List Table</span>
          </button>
        </div>
      </div>

      {viewMode === 'dashboard' && (
        <div className="space-y-6">
          {/* Top KPI row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="premium-card bg-surface-container-lowest p-6 border border-outline-variant/30 flex items-center gap-6">
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
                  <span className="text-xl font-bold text-on-surface font-outfit">{globalCompletionRate}%</span>
                </div>
              </div>
              <div>
                <h3 className="font-bold text-on-surface text-lg">Overall Completion</h3>
                <p className="text-xs text-outline mt-1">{completedGlobalTasks} of {totalGlobalTasks} tasks completed across all active firm engagements.</p>
              </div>
            </div>

            <div className="premium-card bg-surface-container-lowest p-6 border border-outline-variant/30">
               <h3 className="text-xs font-bold text-outline uppercase tracking-wider mb-4">Total Firm Workload</h3>
               <div className="flex items-end gap-3 mb-2">
                 <span className="text-4xl font-black text-on-surface font-outfit">{totalGlobalTasks}</span>
                 <span className="text-sm font-medium text-on-surface-variant mb-1">Active Tasks</span>
               </div>
               <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden flex">
                 <div className="bg-primary h-full" style={{ width: `${globalCompletionRate}%` }}></div>
                 <div className="bg-amber-400 h-full" style={{ width: `${30}%` }}></div>
               </div>
               <div className="flex justify-between text-[10px] font-bold text-outline mt-2">
                 <span>Completed: {completedGlobalTasks}</span>
                 <span>In Progress / Pending: {totalGlobalTasks - completedGlobalTasks}</span>
               </div>
            </div>

            <div className="premium-card bg-surface-container-lowest p-6 border border-outline-variant/30 bg-gradient-to-br from-surface-container-lowest to-surface-container-high">
               <h3 className="text-xs font-bold text-outline uppercase tracking-wider mb-4">Quality & Efficiency</h3>
               <div className="flex justify-between items-center border-b border-outline-variant/30 pb-3 mb-3">
                 <span className="text-xs font-bold text-on-surface-variant">Global Logged Hours</span>
                 <span className="text-sm font-black text-primary">{employeeData.reduce((acc, curr) => acc + curr.logHours, 0)}h</span>
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-xs font-bold text-on-surface-variant">Active Review Issues</span>
                 <span className="text-sm font-black text-error animate-pulse flex items-center gap-1">
                   <AlertTriangle size={14} />
                   {employeeData.reduce((acc, curr) => acc + curr.pendingPoints, 0)}
                 </span>
               </div>
            </div>
          </div>

          {/* Graph & Assessment Table Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Custom Bar Graph */}
            <div className="premium-card bg-surface-container-lowest p-6 border border-outline-variant/30">
              <h3 className="font-bold text-on-surface text-sm mb-6">All Employees Task Graph</h3>
              <div className="space-y-5">
                {employeeData.map((emp) => {
                  const compPct = emp.total === 0 ? 0 : Math.round((emp.completed / emp.total) * 100);
                  return (
                    <div key={emp.name} className="relative">
                      <div className="flex justify-between text-xs font-bold mb-1.5">
                        <span className="text-on-surface">{emp.name}</span>
                        <span className="text-outline">{emp.completed} / {emp.total} Tasks ({compPct}%)</span>
                      </div>
                      <div className="w-full h-3 bg-surface-container-high rounded-full overflow-hidden flex relative">
                        {/* Background representing total tasks relative to max */}
                        <div className="absolute inset-0 bg-primary/10" style={{ width: `${Math.max(10, (emp.total / Math.max(...employeeData.map(e => e.total))) * 100)}%` }}></div>
                        {/* Foreground representing completed relative to assigned */}
                        <div 
                          className="h-full bg-primary relative z-10 transition-all duration-1000" 
                          style={{ width: `${Math.max(10, (emp.total / Math.max(...employeeData.map(e => e.total))) * 100) * (emp.completed / (emp.total || 1))}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
                {employeeData.length === 0 && (
                  <div className="text-center text-outline text-xs py-8">No consultants found.</div>
                )}
              </div>
            </div>

            {/* Assessment & Monitoring */}
            <div className="premium-card bg-surface-container-lowest p-6 border border-outline-variant/30">
              <h3 className="font-bold text-on-surface text-sm mb-6">Employee Wise Assessment & Monitoring</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-outline-variant/30 text-outline">
                      <th className="pb-3 font-semibold">Consultant Name</th>
                      <th className="pb-3 font-semibold text-center">Efficiency (Log/Est)</th>
                      <th className="pb-3 font-semibold text-center">Review Quality</th>
                      <th className="pb-3 font-semibold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    {employeeData.map((emp) => {
                      const effRatio = emp.estHours > 0 ? (emp.logHours / emp.estHours) : 0;
                      let effColor = 'text-green-600';
                      if (effRatio > 1.1) effColor = 'text-amber-600'; // Over budget
                      if (effRatio > 1.5) effColor = 'text-red-600'; // Highly over budget
                      
                      return (
                        <tr key={emp.name} className="hover:bg-surface-container/30 transition-colors">
                          <td className="py-3 font-bold text-on-surface flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[9px]">
                              {emp.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            {emp.name}
                          </td>
                          <td className="py-3 text-center font-bold">
                            <span className={effColor}>{emp.logHours}h</span> / {emp.estHours}h
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
                              <span className="text-primary text-[10px] font-bold">Loaded</span>
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
                        <h3 className="font-bold text-on-surface-variant uppercase tracking-wider text-[11px]">
                          {col.label}
                        </h3>
                        <span className="bg-surface-container-high text-on-surface text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {colTasks.length}
                        </span>
                      </div>
                    </div>

                    {/* Column Container */}
                    <div className="kanban-column flex flex-col gap-4 bg-surface-container-low/30 p-2 rounded-2xl border border-outline-variant/20">
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
                            className="bg-surface-container-lowest border border-outline-variant/40 p-4 rounded-xl shadow-[0px_1px_3px_rgba(0,0,0,0.05)] hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer group"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <span className="bg-surface-variant text-on-surface-variant text-[9px] font-bold px-2 py-1 rounded uppercase tracking-tighter">
                                {(task.milestone || 'General').split(' ')[0]}
                              </span>
                              <div className="flex items-center gap-1">
                                <span
                                  className={`flex items-center gap-0.5 font-bold text-[9px] uppercase ${
                                    isUrgent ? 'text-error' : 'text-on-surface-variant'
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
                              </div>
                            </div>

                            <h4 className="font-bold text-on-surface text-xs mb-1 group-hover:text-primary transition-colors leading-tight">
                              {task.title}
                            </h4>
                            <p className="text-outline text-[11px] mb-4">
                              Assignee: <span className="text-on-surface-variant font-medium">{task.employeeName || 'Unassigned'}</span>
                            </p>

                            {/* Subtask Progress indicator */}
                            <div className="mb-4 space-y-1.5">
                              <div className="flex justify-between text-[10px] font-bold">
                                <span className="text-outline">Progress</span>
                                <span className="text-on-surface">{task.progress}%</span>
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

                            <div className="flex items-center justify-between border-t border-outline-variant/20 pt-3">
                              <div className="flex items-center gap-1.5 text-outline">
                                <span className="material-symbols-outlined text-[14px]">event</span>
                                <span className="text-[10px] font-mono">
                                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Flexible'}
                                </span>
                              </div>
                              
                              {pendingPoints > 0 ? (
                                <div className="text-error flex items-center gap-0.5 font-bold text-[9px] uppercase animate-pulse">
                                  <span className="material-symbols-outlined text-[14px]">priority_high</span>
                                  {pendingPoints} Issues
                                </div>
                              ) : (
                                <div className="w-6 h-6 bg-surface-container rounded-full flex items-center justify-center font-bold text-[9px] text-outline">
                                  {task.employeeName ? task.employeeName.split(' ').map(n => n[0]).join('') : 'U'}
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
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
                <div>
                  <h3 className="font-bold text-on-surface text-sm">Milestone Delivery Board</h3>
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
                        className="p-3 border border-outline-variant/40 rounded-xl hover:border-primary/30 hover:shadow-xs transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white"
                      >
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-on-surface text-xs">{task.title}</span>
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
                            <span className="font-bold text-on-surface">
                              {task.timeSpent}h / {task.estimatedHours}h
                            </span>
                          </div>
                          <div className="space-y-1 w-24">
                            <span className="text-[10px] text-outline block">Progress</span>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div className="bg-primary h-1.5" style={{ width: `${task.progress}%` }} />
                            </div>
                            <span className="text-[9px] font-bold text-primary block">{task.progress}% Done</span>
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


      {/* Task Allocation Modal */}
      {showAllocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setShowAllocModal(false)} />
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 relative z-10 shadow-2xl">
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
              <div>
                <label className="block text-slate-500 mb-1 font-bold">Rich Instructions & Notes</label>
                <textarea
                  value={allocForm.notes}
                  onChange={(e) => setAllocForm({ ...allocForm, notes: e.target.value })}
                  rows={4}
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

              {/* Review Points Logs */}
              {selectedTask.reviewPoints.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wide">Review Log Notes ({selectedTask.reviewPoints.length})</h4>
                  <div className="space-y-2">
                    {selectedTask.reviewPoints.map((rp) => (
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
                    (selectedTask.followUpLogs || []).map((log) => (
                      <div key={log.id} className="bg-white border border-slate-100 shadow-[0_1px_2px_rgba(0,0,0,0.05)] rounded-xl p-3 flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px] shrink-0 uppercase">
                          {log.authorName.split(' ').map(n => n[0]).join('')}
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
                  
                  <div className="grid grid-cols-2 gap-4">
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
                      <label className="block text-slate-500 mb-1">Completion Progress %</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={progressInput}
                          onChange={(e) => setProgressInput(Number(e.target.value))}
                          className="flex-1"
                        />
                        <span className="font-bold text-slate-700 w-10 text-right">{progressInput}%</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-500/10 flex items-center justify-center gap-1"
                  >
                    <Send size={12} />
                    {progressInput === 100 ? 'Submit for Partner Review' : 'Save Progress Update'}
                  </button>
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

              {currentUser.role === 'SUPER_ADMIN' && (
                <div className="pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleDeleteTask(selectedTask.id)}
                    className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors text-xs"
                  >
                    <Trash2 size={14} />
                    Delete Task (Admin Only)
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
