'use client';

import React, { useState, useMemo } from 'react';
import { useDashboardStore } from '../../store/dashboardStore';
import { Task, Priority, EmployeeWorkloadSummary } from '../../types';
import TaskAssignModal from './TaskAssignModal';
import TaskDetailModal from './TaskDetailModal';
import {
  ClipboardList,
  CheckCircle2,
  Users,
  BarChart2,
  Calendar,
  Building,
  Clock,
  Zap,
  Filter,
  User,
  ArrowRight,
  AlertCircle,
  Briefcase,
} from 'lucide-react';

const PRIORITY_ORDER: Record<Priority, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
const PRIORITY_BADGES: Record<Priority, { bg: string; text: string; border: string }> = {
  URGENT: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  HIGH: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  MEDIUM: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  LOW: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
};

function dueDateLabel(dueDate?: string): { label: string; color: string } | null {
  if (!dueDate) return null;
  const due = new Date(dueDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`, color: 'text-rose-600' };
  if (diffDays === 0) return { label: 'Due today', color: 'text-amber-600' };
  if (diffDays <= 3) return { label: `Due in ${diffDays} day${diffDays !== 1 ? 's' : ''}`, color: 'text-amber-600' };
  return { label: `Due ${due.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`, color: 'text-slate-500' };
}

function UtilBar({ pct }: { pct: number }) {
  const colorClass = pct >= 100 ? 'bg-rose-500' : pct >= 80 ? 'bg-amber-500' : 'bg-blue-600';
  const textClass = pct >= 100 ? 'text-rose-600' : pct >= 80 ? 'text-amber-600' : 'text-blue-600';

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <span className={`text-xs font-bold font-outfit min-w-[36px] text-right ${textClass}`}>
        {pct}%
      </span>
    </div>
  );
}

export default function WorkAllocationView() {
  const { engagements, users, serviceCategories, currentUser, getEmployeeWorkload } =
    useDashboardStore();

  const [assignModal, setAssignModal] = useState<{ task: Task; engagementId: string } | null>(null);
  const [detailModal, setDetailModal] = useState<{ task: Task; engagementId: string } | null>(null);

  // Filters
  const [filterClient, setFilterClient] = useState('ALL');
  const [filterPriority, setFilterPriority] = useState<Priority | 'ALL'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'UNASSIGNED' | 'ASSIGNED' | 'ALL'>('ALL');
  const [filterPeriod, setFilterPeriod] = useState('');
  const [filterService, setFilterService] = useState('ALL');
  const [filterEmployee, setFilterEmployee] = useState('ALL');
  const [activePanel, setActivePanel] = useState<'tasks' | 'workload'>('tasks');

  // All task pool
  const allTasksWithContext = useMemo(() => {
    return engagements
      .flatMap((eng) =>
        (eng.tasks || []).map((t) => ({
          ...t,
          _clientName: eng.clientCompanyName || eng.name,
          _engagementId: eng.id,
        }))
      )
      .filter((t) => t.status !== 'COMPLETED');
  }, [engagements]);

  // Dynamic filter options
  const clientOptions = useMemo(() => {
    const seen = new Set<string>();
    return allTasksWithContext
      .filter((t) => {
        const k = t._clientName;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      })
      .map((t) => ({ id: t._clientName, name: t._clientName }));
  }, [allTasksWithContext]);

  const serviceOptions = useMemo(() => {
    return serviceCategories.flatMap((c) => c.services).map((s) => ({ id: s.id, name: s.name }));
  }, [serviceCategories]);

  const employeeOptions = useMemo(
    () => users.filter((u) => u.role !== 'CLIENT' && u.role !== 'PENDING'),
    [users]
  );

  const employeeWorkloads: EmployeeWorkloadSummary[] = useMemo(() => {
    return employeeOptions.map((emp) => getEmployeeWorkload(emp.id));
  }, [employeeOptions, getEmployeeWorkload]);

  const teamWorkloads = useMemo(() => {
    const teams: Record<
      string,
      { name: string; members: number; totalHours: number; capacity: number }
    > = {};
    employeeWorkloads.forEach((w) => {
      const dept = w.department || 'General Accounting';
      if (!teams[dept]) {
        teams[dept] = { name: dept, members: 0, totalHours: 0, capacity: 0 };
      }
      teams[dept].members += 1;
      teams[dept].totalHours += w.assignedHoursThisWeek;
      teams[dept].capacity += w.weeklyCapacityHours;
    });
    return Object.values(teams);
  }, [employeeWorkloads]);

  const canAssign = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN';

  const unassignedCount = allTasksWithContext.filter((t) => !t.employeeId).length;
  const assignedCount = allTasksWithContext.filter((t) => !!t.employeeId).length;

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return allTasksWithContext
      .filter((t) => {
        if (filterClient !== 'ALL' && t._clientName !== filterClient) return false;
        if (filterPriority !== 'ALL' && t.priority !== filterPriority) return false;
        if (filterStatus === 'UNASSIGNED' && t.employeeId) return false;
        if (filterStatus === 'ASSIGNED' && !t.employeeId) return false;
        if (filterPeriod && !(t.periodKey || t.milestone || '').includes(filterPeriod)) return false;
        if (filterService !== 'ALL' && t.serviceId !== filterService) return false;
        if (filterEmployee !== 'ALL' && t.employeeId !== filterEmployee) return false;
        return true;
      })
      .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
  }, [
    allTasksWithContext,
    filterClient,
    filterPriority,
    filterStatus,
    filterPeriod,
    filterService,
    filterEmployee,
  ]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-3 gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 font-outfit">Work Allocation</h1>
          <p className="text-xs text-slate-500">Assign generated tasks to team members and monitor staff workload.</p>
        </div>

        {/* Panel Toggle */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActivePanel('tasks')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activePanel === 'tasks'
                ? 'bg-blue-600 text-white shadow-xs font-outfit'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📋 Task Queue ({allTasksWithContext.length})
          </button>
          <button
            onClick={() => setActivePanel('workload')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activePanel === 'workload'
                ? 'bg-blue-600 text-white shadow-xs font-outfit'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📊 Workload Dashboard
          </button>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="premium-card p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-outfit">
              Unassigned Tasks
            </span>
            <span className="text-2xl font-black text-amber-600 mt-1 block font-outfit">
              {unassignedCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-150 flex items-center justify-center text-amber-600">
            <ClipboardList className="w-5 h-5" />
          </div>
        </div>

        <div className="premium-card p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-outfit">
              Assigned Tasks
            </span>
            <span className="text-2xl font-black text-blue-600 mt-1 block font-outfit">
              {assignedCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-150 flex items-center justify-center text-blue-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="premium-card p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-outfit">
              Active Team Members
            </span>
            <span className="text-2xl font-black text-emerald-600 mt-1 block font-outfit">
              {employeeWorkloads.length}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-150 flex items-center justify-center text-emerald-600">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="premium-card p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-outfit">
              Avg Capacity Utilization
            </span>
            <span className="text-2xl font-black text-indigo-600 mt-1 block font-outfit">
              {employeeWorkloads.length
                ? Math.round(
                    employeeWorkloads.reduce((s, w) => s + w.utilizationPct, 0) /
                      employeeWorkloads.length
                  )
                : 0}
              %
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-150 flex items-center justify-center text-indigo-600">
            <BarChart2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {activePanel === 'tasks' ? (
        <>
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2.5">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Tasks ({allTasksWithContext.length})</option>
                <option value="UNASSIGNED">Unassigned ({unassignedCount})</option>
                <option value="ASSIGNED">Assigned ({assignedCount})</option>
              </select>

              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-700 outline-none"
              >
                <option value="ALL">All Priorities</option>
                <option value="URGENT">Urgent</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>

              <select
                value={filterClient}
                onChange={(e) => setFilterClient(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-700 outline-none"
              >
                <option value="ALL">All Clients</option>
                {clientOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                value={filterService}
                onChange={(e) => setFilterService(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-700 outline-none"
              >
                <option value="ALL">All Services</option>
                {serviceOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>

              <select
                value={filterEmployee}
                onChange={(e) => setFilterEmployee(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-700 outline-none"
              >
                <option value="ALL">All Employees</option>
                {employeeOptions.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value)}
                placeholder="Period (e.g. 2026-09)"
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-700 outline-none w-40"
              />
            </div>

            <span className="text-slate-500 font-semibold font-outfit">
              {filteredTasks.length} task(s) found
            </span>
          </div>

          {/* Task Grid Cards */}
          {filteredTasks.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200/80 shadow-sm text-center space-y-3">
              <ClipboardList className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-700 font-outfit">
                No Tasks Match Selected Filters
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Generate tasks from active client services or adjust the filter parameters above.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTasks.map((task) => {
                const badge = PRIORITY_BADGES[task.priority];
                const due = dueDateLabel(task.dueDate);
                const isAssigned = !!task.employeeId;

                return (
                  <div
                    key={task.id}
                    onClick={() => setDetailModal({ task, engagementId: task._engagementId })}
                    className="premium-card p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-bold text-slate-900 font-outfit leading-snug">
                          {task.title}
                        </h4>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border} font-outfit shrink-0`}
                        >
                          {task.priority}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-semibold text-slate-700">{task._clientName}</span>
                        </div>
                        {task.periodKey && (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>Period: {task.periodKey}</span>
                          </div>
                        )}
                        {task.estimatedHours > 0 && (
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{task.estimatedHours} hrs estimated</span>
                          </div>
                        )}
                        {due && (
                          <div className={`flex items-center gap-1.5 font-semibold ${due.color}`}>
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>{due.label}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Assignment Action Bar */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                      <div>
                        {isAssigned ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-[11px] flex items-center justify-center font-outfit">
                              {task.employeeName?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <span className="font-semibold text-slate-800">{task.employeeName}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </div>

                      {canAssign && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setAssignModal({ task, engagementId: task._engagementId });
                          }}
                          className={`px-3 py-1.5 rounded-xl font-semibold text-xs transition-all ${
                            isAssigned
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                          }`}
                        >
                          {isAssigned ? 'Reassign' : '⚡ Assign'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* Workload Dashboard View */
        <div className="space-y-6">
          {/* Team Capacity Summary */}
          <div className="premium-card p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-outfit">
              Departmental Capacity Summary
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {teamWorkloads.map((team) => {
                const utilPct =
                  team.capacity > 0 ? Math.round((team.totalHours / team.capacity) * 100) : 0;
                return (
                  <div key={team.name} className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3">
                    <h4 className="text-sm font-bold text-slate-900 font-outfit">{team.name}</h4>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div>
                        <span className="text-lg font-black text-blue-600 font-outfit block">{team.members}</span>
                        <span className="text-[10px] text-slate-500 font-medium uppercase">Staff</span>
                      </div>
                      <div>
                        <span className="text-lg font-black text-amber-600 font-outfit block">{team.totalHours}</span>
                        <span className="text-[10px] text-slate-500 font-medium uppercase">Hrs Work</span>
                      </div>
                      <div>
                        <span className="text-lg font-black text-emerald-600 font-outfit block">{team.capacity}</span>
                        <span className="text-[10px] text-slate-500 font-medium uppercase">Capacity</span>
                      </div>
                    </div>
                    <UtilBar pct={utilPct} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Employee Workload Table */}
          <div className="premium-card bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200/80 bg-slate-50 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-outfit">
                Staff Workload & Capacity Tracker
              </h3>
              <span className="text-xs text-slate-500">Weekly Hours Allocation</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-100/70 text-slate-700 font-semibold border-b border-slate-200 font-outfit">
                  <tr>
                    <th className="p-3.5">Employee</th>
                    <th className="p-3.5">Department</th>
                    <th className="p-3.5">Weekly Hours</th>
                    <th className="p-3.5">Utilization</th>
                    <th className="p-3.5">Open Tasks</th>
                    <th className="p-3.5">Overdue</th>
                    <th className="p-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80">
                  {employeeWorkloads.map((w) => (
                    <tr key={w.userId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center font-outfit">
                            {w.userName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block font-outfit">{w.userName}</span>
                            {w.designation && <span className="text-[11px] text-slate-500">{w.designation}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-600 font-medium">{w.department || 'General'}</td>
                      <td className="p-3.5">
                        <span className="font-semibold text-slate-800">
                          {w.assignedHoursThisWeek} / {w.weeklyCapacityHours} hrs
                        </span>
                        <div className="mt-1 w-32">
                          <UtilBar pct={w.utilizationPct} />
                        </div>
                      </td>
                      <td className="p-3.5 font-bold font-outfit text-sm">
                        <span
                          className={
                            w.utilizationPct >= 100
                              ? 'text-rose-600'
                              : w.utilizationPct >= 80
                              ? 'text-amber-600'
                              : 'text-emerald-600'
                          }
                        >
                          {w.utilizationPct}%
                        </span>
                      </td>
                      <td className="p-3.5 font-semibold text-slate-800">{w.totalOpenTasks}</td>
                      <td className="p-3.5 font-semibold">
                        {w.overdueTasks > 0 ? (
                          <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-full font-bold">
                            {w.overdueTasks} Overdue
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        {w.isOnLeave ? (
                          <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 font-bold rounded-full text-[10px]">
                            ON LEAVE
                          </span>
                        ) : w.utilizationPct >= 100 ? (
                          <span className="px-2.5 py-1 bg-rose-50 text-rose-800 border border-rose-200 font-bold rounded-full text-[10px]">
                            OVER CAPACITY
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold rounded-full text-[10px]">
                            AVAILABLE
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {assignModal && (
        <TaskAssignModal
          isOpen
          onClose={() => setAssignModal(null)}
          task={assignModal.task}
          engagementId={assignModal.engagementId}
        />
      )}
      {detailModal && (
        <TaskDetailModal
          isOpen
          onClose={() => setDetailModal(null)}
          task={detailModal.task}
          engagementId={detailModal.engagementId}
          onReassign={(task, engId) => {
            setDetailModal(null);
            setAssignModal({ task, engagementId: engId });
          }}
        />
      )}
    </div>
  );
}
