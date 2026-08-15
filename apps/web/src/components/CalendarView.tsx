'use client';

import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, XCircle, Briefcase, UserCircle, Send, CheckCircle2 } from 'lucide-react';
import { useDashboardStore } from '../store/dashboardStore';
import { Task, Compliance } from '../types';

export const CalendarView: React.FC = () => {
  const { engagements, updateTask, addNotification, addAuditLog, currentUser } = useDashboardStore();
  const [currentDate, setCurrentDate] = useState(new Date()); 
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  // Drag and drop state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // Helper to find engagement by taskId
  const getTaskEngagement = (taskId: string) => engagements.find(e => (e.tasks || []).some(t => t.id === taskId));

  const isTaskForCurrentUser = (task: Task, engagementClientId?: string) => {
    if (!currentUser || currentUser.role === 'SUPER_ADMIN') return true;
    if (currentUser.role === 'CLIENT') return engagementClientId === currentUser.id;
    if (task.employeeId && (task.employeeId === currentUser.id || task.employeeId === currentUser.email)) return true;
    if (task.employeeName && currentUser.name && task.employeeName.toLowerCase().includes(currentUser.name.toLowerCase())) return true;
    return false;
  };

  const events: any[] = [];
  engagements.forEach((e) => {
    (e.compliances || []).forEach((c) => {
      // Show compliances to admins or if they belong to the client
      if (c.dueDate && (currentUser?.role === 'SUPER_ADMIN' || (currentUser?.role === 'CLIENT' && e.clientId === currentUser.id))) {
        events.push({
          id: c.id,
          engagementId: e.id,
          title: `${e.clientCompanyName} - ${c.type}`,
          date: c.dueDate.split('T')[0],
          type: 'compliance',
          status: c.status,
          raw: c
        });
      }
    });

    (e.tasks || []).forEach((t) => {
      if (t.dueDate && isTaskForCurrentUser(t, e.clientId)) {
        events.push({
          id: t.id,
          engagementId: e.id,
          title: `${e.clientCompanyName} - ${t.title}`,
          date: t.dueDate.split('T')[0],
          type: 'task',
          status: t.status,
          raw: t
        });
      }
    });
  });

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetDateStr: string) => {
    e.preventDefault();
    if (!draggedTaskId) return;

    const eng = getTaskEngagement(draggedTaskId);
    if (eng) {
      const task = eng.tasks.find(t => t.id === draggedTaskId);
      if (task && task.dueDate?.split('T')[0] !== targetDateStr) {
        const newDueDate = `${targetDateStr}T00:00:00.000Z`;
        updateTask(eng.id, task.id, { dueDate: newDueDate });
        addNotification('Task Rescheduled', `Task "${task.title}" rescheduled to ${targetDateStr}.`);
        addAuditLog('TASK_RESCHEDULED', `Rescheduled task "${task.title}" to ${targetDateStr}`);
      }
    }
    setDraggedTaskId(null);
  };

  // Day Cells
  const dayCells = [];
  for (let i = 0; i < firstDay; i++) {
    dayCells.push(<div key={`blank-${i}`} className="min-h-32 border border-slate-100 bg-slate-50/50" />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayEvents = events.filter((e) => e.date === dayStr);

    // Limit to density display
    const maxVisible = 4;
    const visibleEvents = dayEvents.slice(0, maxVisible);
    const hiddenCount = dayEvents.length - maxVisible;

    dayCells.push(
      <div 
        key={`day-${day}`} 
        className="min-h-32 border border-slate-200 bg-white p-1.5 flex flex-col hover:bg-slate-50 transition-colors"
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, dayStr)}
      >
        <span className="font-bold text-slate-700 text-[10px] mb-1">{day}</span>
        <div className="flex-1 space-y-1">
          {visibleEvents.map((ev, idx) => {
            const isTask = ev.type === 'task';
            const isCompleted = ev.status === 'COMPLETED';
            const isOverdue = new Date(dayStr) < new Date(new Date().setHours(0,0,0,0)) && !isCompleted;
            
            let statusColor = 'bg-blue-500';
            let bgColor = 'bg-blue-50/50 hover:bg-blue-100/50 text-blue-700 border-blue-100';
            
            if (isCompleted) {
              statusColor = 'bg-emerald-500';
              bgColor = 'bg-emerald-50/50 hover:bg-emerald-100/50 text-emerald-700 border-emerald-100';
            } else if (isOverdue) {
              statusColor = 'bg-rose-500';
              bgColor = 'bg-rose-50/50 hover:bg-rose-100/50 text-rose-700 border-rose-100';
            }

            if (!isTask) {
              bgColor = 'bg-amber-50/50 hover:bg-amber-100/50 text-amber-700 border-amber-100';
              statusColor = 'bg-amber-500';
            }

            return (
              <div
                key={idx}
                draggable={isTask && currentUser?.role !== 'CLIENT'}
                onDragStart={(e) => isTask && currentUser?.role !== 'CLIENT' && handleDragStart(e, ev.id)}
                onClick={() => isTask && setSelectedTask(ev.raw)}
                className={`flex items-center gap-1.5 px-1.5 py-1 rounded border ${bgColor} ${(isTask && currentUser?.role !== 'CLIENT') ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'} transition-colors group`}
                title={ev.title}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${statusColor} shrink-0`} />
                <span className="text-[9px] font-semibold leading-none truncate lowercase flex-1">
                  {ev.title}
                </span>
              </div>
            );
          })}
          {hiddenCount > 0 && (
            <div className="text-[8px] font-bold text-slate-400 pl-1 py-0.5">
              +{hiddenCount} more
            </div>
          )}
        </div>
      </div>
    );
  }

  const markTaskComplete = () => {
    if (!selectedTask) return;
    const eng = getTaskEngagement(selectedTask.id);
    if (!eng) return;
    updateTask(eng.id, selectedTask.id, { status: 'COMPLETED', progress: 100 });
    setSelectedTask(null);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200 shrink-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
            <CalendarIcon size={20} className="text-blue-600" />
            Operations Calendar
          </h1>
          <p className="text-[11px] text-slate-500 font-medium">Drag and drop tasks to reschedule them instantly.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-slate-50 p-1 rounded-lg border border-slate-200">
          <button onClick={handlePrevMonth} className="p-1.5 rounded bg-white hover:bg-slate-100 text-slate-600 shadow-sm transition-colors">
            <ChevronLeft size={14} />
          </button>
          <span className="text-sm font-bold text-slate-800 w-32 text-center">
            {monthNames[month]} {year}
          </span>
          <button onClick={handleNextMonth} className="p-1.5 rounded bg-white hover:bg-slate-100 text-slate-600 shadow-sm transition-colors">
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 premium-card bg-white flex flex-col overflow-hidden">
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80 text-center font-bold text-slate-500 text-[10px] uppercase tracking-wider py-2 shrink-0">
          <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-7 min-h-full">
            {dayCells}
          </div>
        </div>
      </div>

      {/* Side Drawer for Task Details */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-[2px]" onClick={() => setSelectedTask(null)} />
          <div className="absolute inset-y-0 right-0 max-w-sm w-full bg-white shadow-2xl flex flex-col z-50 border-l border-slate-200">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2 text-blue-600">
                <Briefcase size={16} />
                <h3 className="font-bold text-slate-800 text-sm">Task Details</h3>
              </div>
              <button onClick={() => setSelectedTask(null)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
                <XCircle size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              <div>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200 mb-2 inline-block">
                  {selectedTask.status}
                </span>
                <h2 className="text-lg font-bold text-slate-800 leading-tight">{selectedTask.title}</h2>
                <p className="text-xs text-slate-500 mt-1 font-medium flex items-center gap-1.5">
                  <CalendarIcon size={12} /> Due: {selectedTask.dueDate?.split('T')[0] || 'Unscheduled'}
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                    <UserCircle size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Assigned To</span>
                    <span className="text-sm font-bold text-slate-700">{selectedTask.employeeName || 'Unassigned'}</span>
                  </div>
                </div>
              </div>

              {selectedTask.notes && (
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider mb-2">Rich Instructions</span>
                  <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-slate-600 text-xs leading-relaxed">
                    {selectedTask.notes}
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50">
              {currentUser?.role !== 'CLIENT' && (
                selectedTask.status !== 'COMPLETED' ? (
                  <button
                    onClick={markTaskComplete}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    <CheckCircle2 size={16} /> Mark as Completed
                  </button>
                ) : (
                  <button disabled className="w-full py-2.5 bg-slate-200 text-slate-400 rounded-xl font-bold flex items-center justify-center gap-2 cursor-not-allowed">
                    <CheckCircle2 size={16} /> Completed
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
