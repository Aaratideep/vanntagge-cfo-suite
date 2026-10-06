'use client';

import React, { useState, useMemo } from 'react';
import { useDashboardStore } from '../../store/dashboardStore';
import { Task, TaskStatus, Priority } from '../../types';
import { TaskReviewModal } from './TaskReviewModal';
import {
  ShieldCheck,
  Clock,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Filter,
  Building2,
  User,
  Calendar,
  Search,
  Eye,
  Zap,
} from 'lucide-react';

export const TaskReviewQueueView: React.FC = () => {
  const { engagements, users, currentUser } = useDashboardStore();

  // Filters state
  const [selectedClient, setSelectedClient] = useState<string>('ALL');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Task for Review Modal
  const [reviewingTask, setReviewingTask] = useState<{ taskId: string; engagementId: string } | null>(null);

  // Flatten all reviewable tasks from engagements
  const allTasksWithContext = useMemo(() => {
    const list: (Task & { clientName: string; serviceName?: string })[] = [];
    engagements.forEach((e) => {
      (e.tasks || []).forEach((t) => {
        list.push({
          ...t,
          clientName: e.clientCompanyName || 'Unknown Client',
          serviceName: e.title || 'FP&A Service',
        });
      });
    });
    return list;
  }, [engagements]);

  // Review Queue Tasks: REVIEW_PENDING, UNDER_REVIEW, CORRECTION_REQUIRED, RESUBMITTED, COMPLETED
  const reviewQueueTasks = useMemo(() => {
    return allTasksWithContext.filter((t) => {
      return (
        t.status === 'REVIEW_PENDING' ||
        t.status === 'UNDER_REVIEW' ||
        t.status === 'CORRECTION_REQUIRED' ||
        t.status === 'RESUBMITTED' ||
        (t.status === 'COMPLETED' && t.approvedAt)
      );
    });
  }, [allTasksWithContext]);

  // Dynamic Dashboard Metrics
  const metrics = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    let pendingReview = 0;
    let correctionRequired = 0;
    let resubmitted = 0;
    let approvedToday = 0;
    let overdueReview = 0;

    reviewQueueTasks.forEach((t) => {
      if (t.status === 'REVIEW_PENDING' || t.status === 'UNDER_REVIEW') {
        pendingReview++;
        if (t.submittedAt && new Date(t.submittedAt) < twoDaysAgo) {
          overdueReview++;
        }
      } else if (t.status === 'CORRECTION_REQUIRED') {
        correctionRequired++;
      } else if (t.status === 'RESUBMITTED') {
        resubmitted++;
      }

      if (t.approvedAt && t.approvedAt.split('T')[0] === todayStr) {
        approvedToday++;
      }
    });

    return { pendingReview, correctionRequired, resubmitted, approvedToday, overdueReview };
  }, [reviewQueueTasks]);

  // Filtered Queue List
  const filteredTasks = useMemo(() => {
    return reviewQueueTasks.filter((t) => {
      if (selectedClient !== 'ALL' && t.clientId !== selectedClient && t.clientName !== selectedClient) return false;
      if (selectedEmployee !== 'ALL' && t.employeeId !== selectedEmployee) return false;
      if (selectedPriority !== 'ALL' && t.priority !== selectedPriority) return false;
      if (selectedStatus !== 'ALL' && t.status !== selectedStatus) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesClient = t.clientName.toLowerCase().includes(q);
        const matchesEmp = (t.employeeName || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesClient && !matchesEmp) return false;
      }
      return true;
    });
  }, [reviewQueueTasks, selectedClient, selectedEmployee, selectedPriority, selectedStatus, searchQuery]);

  // Extract unique filter dropdown values
  const uniqueClients = useMemo(() => {
    const set = new Set<string>();
    reviewQueueTasks.forEach((t) => set.add(t.clientName));
    return Array.from(set);
  }, [reviewQueueTasks]);

  const uniqueEmployees = useMemo(() => {
    return users.filter((u) => u.role === 'EMPLOYEE' || u.role === 'ADMIN');
  }, [users]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        <div className="premium-card p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-outfit">Pending Review</span>
            <span className="text-2xl font-black text-blue-600 mt-1 block font-outfit">{metrics.pendingReview}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-150 flex items-center justify-center text-blue-600">
            <Clock size={18} />
          </div>
        </div>

        <div className="premium-card p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-outfit">Correction Required</span>
            <span className="text-2xl font-black text-rose-600 mt-1 block font-outfit">{metrics.correctionRequired}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-150 flex items-center justify-center text-rose-600">
            <AlertTriangle size={18} />
          </div>
        </div>

        <div className="premium-card p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-outfit">Resubmitted</span>
            <span className="text-2xl font-black text-purple-600 mt-1 block font-outfit">{metrics.resubmitted}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-150 flex items-center justify-center text-purple-600">
            <RotateCcw size={18} />
          </div>
        </div>

        <div className="premium-card p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-outfit">Approved Today</span>
            <span className="text-2xl font-black text-emerald-600 mt-1 block font-outfit">{metrics.approvedToday}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-150 flex items-center justify-center text-emerald-600">
            <CheckCircle2 size={18} />
          </div>
        </div>

        <div className="premium-card p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-outfit">Overdue Review</span>
            <span className="text-2xl font-black text-rose-600 mt-1 block font-outfit">{metrics.overdueReview}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-150 flex items-center justify-center text-rose-600">
            <ShieldCheck size={18} />
          </div>
        </div>

      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-blue-600" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 font-outfit">Filter Review Queue</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs w-full md:w-auto">
          {/* Search Box */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search task or client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
            />
          </div>

          {/* Client Filter */}
          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-semibold outline-none"
          >
            <option value="ALL">All Clients</option>
            {uniqueClients.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Employee Filter */}
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-semibold outline-none"
          >
            <option value="ALL">All Employees</option>
            {uniqueEmployees.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.department || 'Staff'})
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-semibold outline-none"
          >
            <option value="ALL">All Review Statuses</option>
            <option value="REVIEW_PENDING">Pending Review</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="RESUBMITTED">Resubmitted</option>
            <option value="CORRECTION_REQUIRED">Correction Required</option>
            <option value="COMPLETED">Approved & Completed</option>
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-semibold outline-none"
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Review Queue Grid Cards */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200/80 shadow-sm text-center space-y-3">
            <ShieldCheck size={48} className="text-slate-300 mx-auto" />
            <h4 className="text-base font-bold text-slate-700 font-outfit">No Tasks Found in Review Queue</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Tasks submitted for review by employees will appear here for partner maker-checker verification.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className="premium-card p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-bold text-slate-900 font-outfit leading-snug">{task.title}</h4>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 font-outfit shrink-0">
                      {task.priority}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Building2 size={14} className="text-slate-400" />
                      <span className="font-semibold text-slate-700">{task.clientName}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <User size={14} className="text-slate-400" />
                      <span>Employee: <strong className="text-slate-700">{task.employeeName || 'Assigned Staff'}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 font-bold rounded-full text-[10px] font-outfit">
                    {task.status}
                  </span>

                  <button
                    onClick={() => setReviewingTask({ taskId: task.id, engagementId: task.engagementId })}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
                  >
                    <Eye size={14} />
                    <span>Review Task</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewingTask && (
        <TaskReviewModal
          taskId={reviewingTask.taskId}
          engagementId={reviewingTask.engagementId}
          isOpen={!!reviewingTask}
          onClose={() => setReviewingTask(null)}
        />
      )}

    </div>
  );
};
