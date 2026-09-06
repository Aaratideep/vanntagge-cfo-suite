'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useDashboardStore } from '../store/dashboardStore';
import { 
  CheckCircle2, 
  Clock, 
  Briefcase, 
  AlertCircle, 
  Calendar as CalendarIcon, 
  TrendingUp,
  ShieldAlert,
  Search,
  Filter,
  Star,
  User as UserIcon,
  FileText,
  CheckCircle,
  XCircle,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Send,
  MessageSquare,
  Award,
  Activity,
  Check,
  Edit2,
  Phone,
  Mail,
  Building,
  Plus
} from 'lucide-react';
import { EmployeeOnboardingModal } from './EmployeeOnboardingModal';
import { LeaveApplicationModal } from './LeaveApplicationModal';
import { TaskExecutionModal } from './TaskExecutionModal';
import { usePageContextStore } from '../store/pageContextStore';
import { Task, ReviewPoint, LeaveRequest } from '../types';

interface EmployeeDashboardViewProps {
  initialTab?: string;
}

export const EmployeeDashboardView: React.FC<EmployeeDashboardViewProps> = ({ initialTab = 'dashboard' }) => {
  const { 
    engagements, 
    currentUser, 
    leaves, 
    updateTask, 
    getEmployeeWorkload, 
    updateUser,
    addAuditLog
  } = useDashboardStore();
  const { setPageContext } = usePageContextStore();

  const [activeTab, setActiveTab] = useState<string>(initialTab || 'dashboard');
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [taskNoteModal, setTaskNoteModal] = useState<{isOpen: boolean; taskId: string; engagementId: string; currentNote: string}>({isOpen: false, taskId: '', engagementId: '', currentNote: ''});
  const [executingTask, setExecutingTask] = useState<{ taskId: string; engagementId: string } | null>(null);

  // Task Filter States
  const [taskSearch, setTaskSearch] = useState('');
  const [taskStatusFilter, setTaskStatusFilter] = useState('ALL');
  const [taskPriorityFilter, setTaskPriorityFilter] = useState('ALL');

  // Calendar States
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<string | null>(null);

  // Profile Edit State
  const [profileForm, setProfileForm] = useState({
    designation: '',
    department: '',
    phone: '',
    skills: '',
  });
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);

  // Synchronize initialTab prop with activeTab state
  useEffect(() => {
    if (initialTab) {
      // Map sidebar tabs to employee sub-tabs
      const tabMapping: { [key: string]: string } = {
        'dashboard': 'dashboard',
        'employee_tasks': 'employee_tasks',
        'calendar': 'calendar',
        'workload': 'workload',
        'submissions': 'submissions',
        'reviews': 'reviews',
        'performance': 'performance',
        'employee_profile': 'employee_profile',
      };
      setActiveTab(tabMapping[initialTab] || 'dashboard');
    }
  }, [initialTab]);

  useEffect(() => {
    if (currentUser) {
      setProfileForm({
        designation: currentUser.designation || 'Financial Associate',
        department: currentUser.department || 'CFO Operations',
        phone: currentUser.phone || '',
        skills: currentUser.skills ? currentUser.skills.join(', ') : 'GST Filing, FP&A, Bookkeeping, MIS',
      });
    }
  }, [currentUser]);

  useEffect(() => {
    setPageContext('/employee', 'Employee Dashboard', {
      engagementsCount: engagements.length,
      leavesCount: leaves.length,
      activeTab,
    });
  }, [engagements.length, leaves.length, activeTab, setPageContext]);

  if (!currentUser) return null;

  if (currentUser.role === 'EMPLOYEE' && !currentUser.isOnboarded) {
    return <EmployeeOnboardingModal />;
  }

  const now = new Date();

  // Gather all tasks assigned to current employee across engagements
  const allMyTasks = useMemo(() => {
    const list: (Task & { clientName: string; engagementId: string })[] = [];
    engagements.forEach(e => {
      (e.tasks || []).forEach(t => {
        if (t.employeeId === currentUser.id) {
          list.push({ ...t, clientName: e.clientCompanyName, engagementId: e.id });
        }
      });
    });
    return list;
  }, [engagements, currentUser.id]);

  // Gather all compliances assigned to current employee
  const allMyCompliances = useMemo(() => {
    const list: any[] = [];
    engagements.forEach(e => {
      (e.compliances || []).forEach(c => {
        if (c.responsibleEmployeeId === currentUser.id) {
          list.push({ ...c, clientName: e.clientCompanyName, engagementId: e.id });
        }
      });
    });
    return list;
  }, [engagements, currentUser.id]);

  // Employee workload from Prompt 11 store function
  const workloadSummary = getEmployeeWorkload(currentUser.id);

  // Compute Metrics
  const openTasks = allMyTasks.filter(t => t.status !== 'COMPLETED');
  const completedTasks = allMyTasks.filter(t => t.status === 'COMPLETED');
  const overdueTasks = openTasks.filter(t => t.dueDate && new Date(t.dueDate) < now);
  const myAssignedClientsCount = new Set(allMyTasks.map(t => t.engagementId)).size;
  
  const completionRate = (allMyTasks.length > 0) 
    ? Math.round((completedTasks.length / allMyTasks.length) * 100) 
    : 0;

  // Filtered Tasks for 'employee_tasks' tab
  const filteredTasks = allMyTasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(taskSearch.toLowerCase()) || 
                          t.clientName.toLowerCase().includes(taskSearch.toLowerCase());
    const matchesStatus = taskStatusFilter === 'ALL' || t.status === taskStatusFilter;
    const matchesPriority = taskPriorityFilter === 'ALL' || t.priority === taskPriorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Gather Review Points for 'reviews' tab
  const allMyReviewPoints = useMemo(() => {
    const points: (ReviewPoint & { taskTitle: string; clientName: string; taskId: string; engagementId: string })[] = [];
    engagements.forEach(e => {
      (e.tasks || []).forEach(t => {
        if (t.employeeId === currentUser.id && t.reviewPoints && t.reviewPoints.length > 0) {
          t.reviewPoints.forEach(rp => {
            points.push({
              ...rp,
              taskTitle: t.title,
              clientName: e.clientCompanyName,
              taskId: t.id,
              engagementId: e.id
            });
          });
        }
      });
    });
    return points;
  }, [engagements, currentUser.id]);

  // Calculate Performance Metrics
  const onTimeCompleted = completedTasks.filter(t => {
    if (!t.dueDate) return true;
    const due = new Date(t.dueDate);
    const updated = new Date((t as any).updatedAt || t.createdAt || Date.now());
    return updated <= due;
  });
  const onTimeRate = completedTasks.length > 0 
    ? Math.round((onTimeCompleted.length / completedTasks.length) * 100) 
    : 100;

  const firstTimeApproved = completedTasks.filter(t => {
    const rpList = t.reviewPoints || [];
    return rpList.length === 0;
  });
  const firstTimeApprovalRate = completedTasks.length > 0 
    ? Math.round((firstTimeApproved.length / completedTasks.length) * 100) 
    : 100;

  const correctionRate = allMyTasks.length > 0 
    ? Math.round((allMyReviewPoints.length / allMyTasks.length) * 100) 
    : 0;

  const averageRating = useMemo(() => {
    const rated = allMyReviewPoints.filter(rp => (rp as any).rating && (rp as any).rating > 0);
    if (rated.length === 0) return 4.8; // Default initial score
    const sum = rated.reduce((acc, curr) => acc + ((curr as any).rating || 0), 0);
    return (sum / rated.length).toFixed(1);
  }, [allMyReviewPoints]);

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser(currentUser.id, {
      designation: profileForm.designation,
      department: profileForm.department,
      phone: profileForm.phone,
      skills: profileForm.skills.split(',').map(s => s.trim()).filter(Boolean),
    });
    addAuditLog('EMPLOYEE_PROFILE_UPDATED', `Employee ${currentUser.name} updated profile details.`);
    setProfileSaveSuccess(true);
    setTimeout(() => setProfileSaveSuccess(false), 4000);
  };

  // Calendar Helpers
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const calendarDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      
      const dayTasks = allMyTasks.filter(t => t.dueDate && t.dueDate.startsWith(dateStr));
      const dayCompliances = allMyCompliances.filter(c => c.dueDate && c.dueDate.startsWith(dateStr));
      const dayLeaves = leaves.filter(l => l.userId === currentUser.id && l.status === 'APPROVED' && l.startDate <= dateStr && l.endDate >= dateStr);
      
      days.push({
        dayNumber: d,
        dateStr,
        tasks: dayTasks,
        compliances: dayCompliances,
        leaves: dayLeaves,
      });
    }
    return days;
  }, [year, month, daysInMonth, firstDayOfWeek, allMyTasks, allMyCompliances, leaves, currentUser.id]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-6 font-outfit text-slate-800">
      
      {/* Employee Top Sub-Nav Pills */}
      <div className="bg-white border border-slate-200/80 p-2 rounded-2xl shadow-sm flex flex-wrap items-center gap-1.5 overflow-x-auto custom-scrollbar">
        {[
          { id: 'dashboard', label: 'Dashboard Overview', icon: 'dashboard' },
          { id: 'employee_tasks', label: `My Tasks (${openTasks.length})`, icon: 'assignment' },
          { id: 'calendar', label: 'My Calendar', icon: 'calendar_month' },
          { id: 'workload', label: 'My Workload', icon: 'speed' },
          { id: 'submissions', label: 'My Submissions', icon: 'send' },
          { id: 'reviews', label: `My Reviews (${allMyReviewPoints.length})`, icon: 'fact_check' },
          { id: 'performance', label: 'My Performance', icon: 'analytics' },
          { id: 'employee_profile', label: 'My Profile', icon: 'person' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-semibold'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: DASHBOARD OVERVIEW */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-3xl p-8 lg:p-10 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="relative z-10 max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-blue-200 text-xs font-bold tracking-wide border border-white/10">
                <span className="material-symbols-outlined text-[16px] text-amber-400">waving_hand</span>
                Welcome back, {currentUser.name.split(' ')[0]}
              </div>
              <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                Operations Workspace
              </h1>
              <p className="text-slate-300 text-sm leading-relaxed font-medium">
                Focus on your priority assigned tasks and upcoming statutory compliances for smooth CFO service execution.
              </p>
            </div>
          </div>

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="premium-card p-6 border border-slate-200/80 shadow-sm rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Assigned Clients</p>
                <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{myAssignedClientsCount}</h3>
                <p className="text-xs text-slate-400 font-medium mt-1">Active Engagements</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                <Briefcase size={22} />
              </div>
            </div>

            <div className="premium-card p-6 border border-slate-200/80 shadow-sm rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Open Tasks</p>
                <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{openTasks.length}</h3>
                <p className="text-xs text-amber-600 font-semibold mt-1">{overdueTasks.length} Overdue</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                <Clock size={22} />
              </div>
            </div>

            <div className="premium-card p-6 border border-slate-200/80 shadow-sm rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Completion Rate</p>
                <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{completionRate}%</h3>
                <p className="text-xs text-emerald-600 font-semibold mt-1">{completedTasks.length} Completed</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <CheckCircle2 size={22} />
              </div>
            </div>

            <div className="premium-card p-6 border border-slate-200/80 shadow-sm rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Weekly Capacity</p>
                <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{workloadSummary.utilizationPct}%</h3>
                <p className="text-xs text-slate-400 font-medium mt-1">{workloadSummary.assignedHoursThisWeek} / {workloadSummary.weeklyCapacityHours} hrs</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                <TrendingUp size={22} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Priority Tasks */}
            <div className="premium-card p-6 border border-slate-200/80 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Clock size={20} className="text-blue-600" /> My Urgent Priority Tasks
                </h3>
                <button 
                  onClick={() => setActiveTab('employee_tasks')} 
                  className="text-xs font-bold text-blue-600 hover:text-blue-700"
                >
                  View All ({allMyTasks.length}) →
                </button>
              </div>

              {openTasks.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <CheckCircle2 size={36} className="mx-auto mb-2 text-emerald-500" />
                  <p className="font-bold text-slate-700">All caught up!</p>
                  <p className="text-xs">No pending tasks assigned to you right now.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {openTasks.slice(0, 5).map(task => (
                    <div key={task.id} className="p-4 border border-slate-200/80 rounded-xl hover:border-blue-300 transition-all bg-slate-50/50 flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{task.title}</h4>
                          <p className="text-xs font-medium text-slate-500 mt-0.5">{task.clientName}</p>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          task.priority === 'URGENT' ? 'bg-rose-100 text-rose-700' :
                          task.priority === 'HIGH' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {task.priority}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/60">
                        <span className={`font-semibold flex items-center gap-1 ${task.dueDate && new Date(task.dueDate) < now ? 'text-rose-600' : 'text-slate-500'}`}>
                          <CalendarIcon size={12} />
                          Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setExecutingTask({ taskId: task.id, engagementId: task.engagementId })}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-1 rounded-lg flex items-center gap-1 shadow-sm transition-all"
                          >
                            <span className="material-symbols-outlined text-[14px]">play_arrow</span> Open Workspace
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Assigned Compliances */}
            <div className="premium-card p-6 border border-slate-200/80 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ShieldAlert size={20} className="text-amber-600" /> Assigned Statutory Compliances
                </h3>
              </div>

              {allMyCompliances.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <CheckCircle2 size={36} className="mx-auto mb-2 text-emerald-500" />
                  <p className="font-bold text-slate-700">No active compliances</p>
                  <p className="text-xs">You have no pending statutory compliance filings.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {allMyCompliances.slice(0, 5).map(c => (
                    <div key={c.id} className="p-4 border border-slate-200/80 rounded-xl bg-slate-50/50 flex items-center justify-between">
                      <div>
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-bold uppercase tracking-wider">
                          {c.type.replace('_', ' ')}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 mt-1">{c.clientName}</h4>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <CalendarIcon size={12} /> Due: {new Date(c.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                        c.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {c.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Leave Balances Section */}
          <div className="premium-card p-6 border border-slate-200/80 rounded-2xl shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <CalendarIcon size={20} className="text-purple-600" /> Time Off & Leave Balances
                </h3>
                <p className="text-xs text-slate-500">Annual leave entitlement and recent applications</p>
              </div>
              <button 
                onClick={() => setShowLeaveModal(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-2"
              >
                <Plus size={16} /> Apply for Leave
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-xl">
                <p className="text-xs font-bold text-purple-700 uppercase tracking-wider">Casual Leave (CL)</p>
                <h4 className="text-2xl font-extrabold text-purple-900 mt-1">8 <span className="text-xs font-medium text-slate-500">/ 12 days left</span></h4>
              </div>
              <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
                <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Sick Leave (SL)</p>
                <h4 className="text-2xl font-extrabold text-blue-900 mt-1">5 <span className="text-xs font-medium text-slate-500">/ 6 days left</span></h4>
              </div>
              <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Privilege Leave (PL)</p>
                <h4 className="text-2xl font-extrabold text-emerald-900 mt-1">10 <span className="text-xs font-medium text-slate-500">/ 15 days left</span></h4>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: MY ASSIGNED TASKS */}
      {activeTab === 'employee_tasks' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">My Assigned Tasks</h2>
              <p className="text-xs text-slate-500 font-medium">Execute assigned work items, record time, and submit for CFO review.</p>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search tasks by title or client name..."
                value={taskSearch}
                onChange={e => setTaskSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <select
                value={taskStatusFilter}
                onChange={e => setTaskStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="CORRECTION_REQUIRED">Correction Required</option>
                <option value="COMPLETED">Completed</option>
              </select>

              <select
                value={taskPriorityFilter}
                onChange={e => setTaskPriorityFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Priorities</option>
                <option value="URGENT">Urgent</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>

          {/* Tasks Table */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
            {filteredTasks.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <FileText size={40} className="mx-auto mb-2 text-slate-300" />
                <p className="font-bold text-slate-700">No tasks found</p>
                <p className="text-xs text-slate-500">Try adjusting your filters or search terms.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="py-3.5 px-4">Task Details</th>
                      <th className="py-3.5 px-4">Client</th>
                      <th className="py-3.5 px-4">Est. Hours</th>
                      <th className="py-3.5 px-4">Due Date</th>
                      <th className="py-3.5 px-4">Priority</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Workspace</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTasks.map(task => {
                      const isOverdue = task.dueDate && new Date(task.dueDate) < now && task.status !== 'COMPLETED';
                      return (
                        <tr key={task.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-4 px-4">
                            <div className="font-bold text-slate-900 text-sm">{task.title}</div>
                            {task.periodKey && (
                              <span className="inline-block mt-1 text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                Period: {task.periodKey}
                              </span>
                            )}
                            {task.status === 'CORRECTION_REQUIRED' && (
                              <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-rose-600">
                                <AlertCircle size={12} /> Correction Requested by Reviewer
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-4 font-semibold text-slate-700">
                            {task.clientName}
                          </td>
                          <td className="py-4 px-4 text-slate-600 font-medium">
                            {task.estimatedHours || 4} hrs
                          </td>
                          <td className="py-4 px-4 font-semibold">
                            <span className={isOverdue ? 'text-rose-600 bg-rose-50 px-2 py-1 rounded border border-rose-200' : 'text-slate-600'}>
                              {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              task.priority === 'URGENT' ? 'bg-rose-100 text-rose-700' :
                              task.priority === 'HIGH' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {task.priority}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <select
                              value={task.status}
                              onChange={e => updateTask(task.engagementId, task.id, { status: e.target.value as any })}
                              className="bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800 cursor-pointer focus:outline-none"
                            >
                              <option value="NOT_STARTED">Not Started</option>
                              <option value="PENDING">Pending</option>
                              <option value="IN_PROGRESS">In Progress</option>
                              <option value="UNDER_REVIEW">Under Review</option>
                              <option value="CORRECTION_REQUIRED">Correction Required</option>
                              <option value="COMPLETED">Completed</option>
                            </select>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <button
                              onClick={() => setExecutingTask({ taskId: task.id, engagementId: task.engagementId })}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-sm transition-all inline-flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-[16px]">play_arrow</span> Open Workspace
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: MY CALENDAR */}
      {activeTab === 'calendar' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">My Operations Calendar</h2>
              <p className="text-xs text-slate-500 font-medium">Track your deadlines, compliance due dates, and approved leaves.</p>
            </div>
            
            <div className="flex items-center gap-3 bg-white border border-slate-200/80 px-3 py-1.5 rounded-xl shadow-sm">
              <button
                onClick={() => setCalendarDate(new Date(year, month - 1, 1))}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm font-bold text-slate-900 min-w-[120px] text-center">
                {monthNames[month]} {year}
              </span>
              <button
                onClick={() => setCalendarDate(new Date(year, month + 1, 1))}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
              >
                <ChevronRight size={18} />
              </button>
              <button
                onClick={() => setCalendarDate(new Date())}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 ml-2"
              >
                Today
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden p-6">
            <div className="grid grid-cols-7 gap-2 mb-4 text-center font-bold text-xs text-slate-400 uppercase tracking-wider">
              <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, idx) => {
                if (!day) {
                  return <div key={`empty-${idx}`} className="h-28 bg-slate-50/50 rounded-xl border border-dashed border-slate-100"></div>;
                }

                const isToday = day.dateStr === new Date().toISOString().split('T')[0];
                const hasEvents = day.tasks.length > 0 || day.compliances.length > 0 || day.leaves.length > 0;

                return (
                  <div
                    key={day.dateStr}
                    onClick={() => setSelectedCalendarDay(day.dateStr)}
                    className={`h-28 p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between overflow-hidden ${
                      isToday ? 'bg-blue-50/60 border-blue-400 shadow-sm' : 
                      selectedCalendarDay === day.dateStr ? 'border-blue-500 ring-2 ring-blue-200' : 'bg-slate-50/40 border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-extrabold w-6 h-6 flex items-center justify-center rounded-full ${
                        isToday ? 'bg-blue-600 text-white' : 'text-slate-700'
                      }`}>
                        {day.dayNumber}
                      </span>
                      {hasEvents && (
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      )}
                    </div>

                    <div className="space-y-1 overflow-y-auto custom-scrollbar">
                      {day.tasks.map(t => (
                        <div key={t.id} className="text-[10px] font-bold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded truncate" title={t.title}>
                          Task: {t.title}
                        </div>
                      ))}
                      {day.compliances.map(c => (
                        <div key={c.id} className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded truncate" title={c.type}>
                          Compliance: {c.type}
                        </div>
                      ))}
                      {day.leaves.map(l => (
                        <div key={l.id} className="text-[10px] font-bold bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded truncate">
                          Leave ({l.type})
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Day Detail Popover / Section if selected */}
          {selectedCalendarDay && (
            <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold flex items-center gap-2">
                  <CalendarIcon size={18} className="text-blue-400" /> Agenda for {new Date(selectedCalendarDay).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </h3>
                <button onClick={() => setSelectedCalendarDay(null)} className="text-slate-400 hover:text-white text-xs font-bold">Close ✕</button>
              </div>

              {(() => {
                const dayData = calendarDays.find(d => d && d.dateStr === selectedCalendarDay);
                if (!dayData || (!dayData.tasks.length && !dayData.compliances.length && !dayData.leaves.length)) {
                  return <p className="text-xs text-slate-400">No scheduled tasks, compliances, or leaves on this day.</p>;
                }

                return (
                  <div className="space-y-3">
                    {dayData.tasks.map(t => (
                      <div key={t.id} className="p-3 bg-slate-800 rounded-xl flex items-center justify-between border border-slate-700">
                        <div>
                          <p className="text-xs font-bold text-white">{t.title}</p>
                          <p className="text-[11px] text-slate-400">{t.clientName}</p>
                        </div>
                        <button
                          onClick={() => setExecutingTask({ taskId: t.id, engagementId: t.engagementId })}
                          className="bg-blue-600 text-white font-bold text-[10px] px-3 py-1 rounded-lg"
                        >
                          Execute
                        </button>
                      </div>
                    ))}
                    {dayData.compliances.map(c => (
                      <div key={c.id} className="p-3 bg-slate-800 rounded-xl border border-amber-500/30">
                        <p className="text-xs font-bold text-amber-300">Statutory Filing: {c.type}</p>
                        <p className="text-[11px] text-slate-400">{c.clientName}</p>
                      </div>
                    ))}
                    {dayData.leaves.map(l => (
                      <div key={l.id} className="p-3 bg-slate-800 rounded-xl border border-purple-500/30">
                        <p className="text-xs font-bold text-purple-300">Approved Leave: {l.type}</p>
                        <p className="text-[11px] text-slate-400">Reason: {l.reason}</p>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: MY WORKLOAD */}
      {activeTab === 'workload' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">My Workload & Capacity</h2>
            <p className="text-xs text-slate-500 font-medium">Monitor your weekly assigned hours against your 40-hour operational capacity.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="premium-card p-6 border border-slate-200/80 rounded-2xl shadow-sm space-y-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Weekly Capacity</p>
              <h3 className="text-3xl font-extrabold text-slate-900">{workloadSummary.weeklyCapacityHours} hrs</h3>
              <p className="text-xs text-slate-400 font-medium">Standard baseline capacity</p>
            </div>

            <div className="premium-card p-6 border border-slate-200/80 rounded-2xl shadow-sm space-y-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assigned Hours</p>
              <h3 className="text-3xl font-extrabold text-blue-600">{workloadSummary.assignedHoursThisWeek} hrs</h3>
              <p className="text-xs text-slate-400 font-medium">Across all current open tasks</p>
            </div>

            <div className="premium-card p-6 border border-slate-200/80 rounded-2xl shadow-sm space-y-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Utilization Rate</p>
              <h3 className={`text-3xl font-extrabold ${
                workloadSummary.utilizationPct > 100 ? 'text-rose-600' :
                workloadSummary.utilizationPct > 80 ? 'text-amber-600' : 'text-emerald-600'
              }`}>
                {workloadSummary.utilizationPct}%
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                {workloadSummary.utilizationPct > 100 ? 'Over capacity alert' : 'Healthy workload balance'}
              </p>
            </div>
          </div>

          {/* Utilization Progress Bar */}
          <div className="premium-card p-6 border border-slate-200/80 rounded-2xl shadow-sm space-y-3">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-700">Capacity Meter</span>
              <span className="text-slate-900">{workloadSummary.assignedHoursThisWeek} / {workloadSummary.weeklyCapacityHours} Hours</span>
            </div>
            <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  workloadSummary.utilizationPct > 100 ? 'bg-rose-500' :
                  workloadSummary.utilizationPct > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(workloadSummary.utilizationPct, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Client Hours Breakdown */}
          <div className="premium-card p-6 border border-slate-200/80 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Assigned Hours by Client</h3>
            
            <div className="divide-y divide-slate-100">
              {Array.from(new Set(allMyTasks.map(t => t.clientName))).map(clientName => {
                const clientTasks = allMyTasks.filter(t => t.clientName === clientName && t.status !== 'COMPLETED');
                const totalHours = clientTasks.reduce((acc, curr) => acc + (curr.estimatedHours || 4), 0);
                return (
                  <div key={clientName} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{clientName}</p>
                      <p className="text-slate-500 font-medium">{clientTasks.length} active open task(s)</p>
                    </div>
                    <span className="font-extrabold text-slate-800 bg-slate-100 px-3 py-1 rounded-xl">
                      {totalHours} Hours
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: MY SUBMISSIONS */}
      {activeTab === 'submissions' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">My Submissions</h2>
            <p className="text-xs text-slate-500 font-medium">History of all tasks submitted for review and approval.</p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
            {allMyTasks.filter(t => t.status === 'UNDER_REVIEW' || t.status === 'COMPLETED' || t.status === 'CORRECTION_REQUIRED').length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <Send size={40} className="mx-auto mb-2 text-slate-300" />
                <p className="font-bold text-slate-700">No submissions recorded yet</p>
                <p className="text-xs text-slate-500">Tasks submitted for review will appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="py-3.5 px-4">Task & Client</th>
                      <th className="py-3.5 px-4">Notes / Remarks</th>
                      <th className="py-3.5 px-4">Last Updated</th>
                      <th className="py-3.5 px-4">Review Status</th>
                      <th className="py-3.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allMyTasks
                      .filter(t => t.status === 'UNDER_REVIEW' || t.status === 'COMPLETED' || t.status === 'CORRECTION_REQUIRED')
                      .map(t => (
                        <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-4 px-4">
                            <div className="font-bold text-slate-900">{t.title}</div>
                            <div className="text-slate-500 text-[11px] font-medium">{t.clientName}</div>
                          </td>
                          <td className="py-4 px-4 text-slate-600 italic max-w-xs truncate">
                            {t.notes || 'Submitted work workspace items.'}
                          </td>
                          <td className="py-4 px-4 text-slate-500 font-medium">
                            {new Date((t as any).updatedAt || t.createdAt || Date.now()).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              t.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                              t.status === 'CORRECTION_REQUIRED' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {t.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <button
                              onClick={() => setExecutingTask({ taskId: t.id, engagementId: t.engagementId })}
                              className="text-xs font-bold text-blue-600 hover:text-blue-700 underline"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: MY REVIEWS */}
      {activeTab === 'reviews' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">My Review History</h2>
            <p className="text-xs text-slate-500 font-medium">Review points and feedback logged by Virtual CFOs on your submissions.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="premium-card p-6 border border-slate-200/80 rounded-2xl shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Review Points</p>
              <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{allMyReviewPoints.length}</h3>
            </div>
            <div className="premium-card p-6 border border-slate-200/80 rounded-2xl shadow-sm">
              <p className="text-xs font-bold text-rose-600 uppercase tracking-wider">Open Review Points</p>
              <h3 className="text-3xl font-extrabold text-rose-600 mt-1">
                {allMyReviewPoints.filter(rp => rp.status !== 'RESOLVED').length}
              </h3>
            </div>
            <div className="premium-card p-6 border border-slate-200/80 rounded-2xl shadow-sm">
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Resolved Points</p>
              <h3 className="text-3xl font-extrabold text-emerald-600 mt-1">
                {allMyReviewPoints.filter(rp => rp.status === 'RESOLVED').length}
              </h3>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden p-6 space-y-4">
            {allMyReviewPoints.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <CheckCircle2 size={40} className="mx-auto mb-2 text-emerald-500" />
                <p className="font-bold text-slate-700">Clean review record!</p>
                <p className="text-xs text-slate-500">No review corrections or issues logged on your tasks.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {allMyReviewPoints.map(rp => (
                  <div key={rp.id} className="p-4 border border-slate-200/80 rounded-xl bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          rp.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-800' :
                          rp.severity === 'HIGH' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {rp.severity}
                        </span>
                        <span className="text-xs font-bold text-slate-900">{rp.taskTitle}</span>
                        <span className="text-xs text-slate-500">({rp.clientName})</span>
                      </div>
                      <p className="text-xs text-slate-700 font-medium mt-1">"{rp.description || (rp as any).comment || 'Review point feedback.'}"</p>
                      <p className="text-[11px] text-slate-400">By {rp.createdByName || rp.assignedToName || 'CFO Reviewer'} on {new Date(rp.createdAt).toLocaleDateString()}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                        rp.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {rp.status}
                      </span>
                      {rp.status !== 'RESOLVED' && (
                        <button
                          onClick={() => setExecutingTask({ taskId: rp.taskId, engagementId: rp.engagementId })}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-sm"
                        >
                          Fix Task
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

      {/* TAB 7: MY PERFORMANCE */}
      {activeTab === 'performance' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">My Performance Metrics</h2>
            <p className="text-xs text-slate-500 font-medium">Real-time operational KPIs calculated strictly from verified task completion data.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="premium-card p-6 border border-slate-200/80 rounded-2xl shadow-sm space-y-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">On-Time Rate</p>
              <h3 className="text-3xl font-extrabold text-emerald-600">{onTimeRate}%</h3>
              <p className="text-xs text-slate-400 font-medium">Tasks completed by due date</p>
            </div>

            <div className="premium-card p-6 border border-slate-200/80 rounded-2xl shadow-sm space-y-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">First-Time Pass Rate</p>
              <h3 className="text-3xl font-extrabold text-blue-600">{firstTimeApprovalRate}%</h3>
              <p className="text-xs text-slate-400 font-medium">Approved without corrections</p>
            </div>

            <div className="premium-card p-6 border border-slate-200/80 rounded-2xl shadow-sm space-y-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Correction Rate</p>
              <h3 className="text-3xl font-extrabold text-rose-600">{correctionRate}%</h3>
              <p className="text-xs text-slate-400 font-medium">Tasks requiring corrections</p>
            </div>

            <div className="premium-card p-6 border border-slate-200/80 rounded-2xl shadow-sm space-y-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Average Rating</p>
              <h3 className="text-3xl font-extrabold text-amber-500 flex items-center gap-1">
                {averageRating} <Star size={20} fill="#f59e0b" className="text-amber-500" />
              </h3>
              <p className="text-xs text-slate-400 font-medium">CFO Reviewer Rating</p>
            </div>
          </div>

          {/* Performance Summary Details */}
          <div className="premium-card p-6 border border-slate-200/80 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Task Execution Summary</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60">
                <p className="text-xs font-bold text-slate-500">Total Tasks Handled</p>
                <p className="text-xl font-extrabold text-slate-900 mt-1">{allMyTasks.length}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60">
                <p className="text-xs font-bold text-slate-500">Completed On Time</p>
                <p className="text-xl font-extrabold text-emerald-600 mt-1">{onTimeCompleted.length}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60">
                <p className="text-xs font-bold text-slate-500">Total Review Issues</p>
                <p className="text-xl font-extrabold text-rose-600 mt-1">{allMyReviewPoints.length}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60">
                <p className="text-xs font-bold text-slate-500">Resolved Review Issues</p>
                <p className="text-xl font-extrabold text-blue-600 mt-1">
                  {allMyReviewPoints.filter(rp => rp.status === 'RESOLVED').length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: MY PROFILE */}
      {activeTab === 'employee_profile' && (
        <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">My Profile & Account Details</h2>
            <p className="text-xs text-slate-500 font-medium">Manage your employee information and specializations.</p>
          </div>

          {profileSaveSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircle size={18} className="text-emerald-600" />
              Profile updated successfully!
            </div>
          )}

          <div className="premium-card p-6 border border-slate-200/80 rounded-2xl shadow-sm space-y-6">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
              <div className="w-16 h-16 rounded-full bg-blue-600 text-white font-extrabold text-xl flex items-center justify-center shadow-md">
                {currentUser.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">{currentUser.name}</h3>
                <p className="text-xs text-slate-500 font-medium">{currentUser.email}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold uppercase rounded-full">
                    {currentUser.role}
                  </span>
                  <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase rounded-full">
                    Active Employee
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={handleProfileSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    value={profileForm.designation}
                    onChange={e => setProfileForm(p => ({ ...p, designation: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={profileForm.department}
                    onChange={e => setProfileForm(p => ({ ...p, department: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={profileForm.phone}
                    onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Weekly Capacity (Hours)</label>
                  <input
                    type="text"
                    disabled
                    value={`${workloadSummary.weeklyCapacityHours} Hours`}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-500 cursor-not-allowed font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Skills & Specializations (Comma Separated)</label>
                <input
                  type="text"
                  value={profileForm.skills}
                  onChange={e => setProfileForm(p => ({ ...p, skills: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-sm transition-all"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modals */}
      {showLeaveModal && (
        <LeaveApplicationModal onClose={() => setShowLeaveModal(false)} />
      )}

      {executingTask && (
        <TaskExecutionModal
          taskId={executingTask.taskId}
          engagementId={executingTask.engagementId}
          onClose={() => setExecutingTask(null)}
        />
      )}
    </div>
  );
};
