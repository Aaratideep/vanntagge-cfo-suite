'use client';

import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, XCircle, Briefcase, UserCircle, Send, CheckCircle2, Mail, Video, Share2, Clock, X } from 'lucide-react';
import { useDashboardStore } from '../store/dashboardStore';
import { Task, Compliance, Meeting, AvailabilityBlock } from '../types';

export const CalendarView: React.FC = () => {
  const { engagements, updateTask, addNotification, addAuditLog, currentUser, meetings, availabilityBlocks, addMeeting, addAvailabilityBlock, removeAvailabilityBlock } = useDashboardStore();
  const [currentDate, setCurrentDate] = useState(new Date()); 
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  
  // Feature states
  const [isEmailDrawerOpen, setIsEmailDrawerOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isAvailabilityMode, setIsAvailabilityMode] = useState(false);
  
  const [newMeeting, setNewMeeting] = useState({ title: '', date: '', time: '', attendees: '' });
  const [shareEmails, setShareEmails] = useState('');

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

  meetings.forEach(m => {
    events.push({
      id: m.id,
      title: m.title,
      date: m.date,
      type: 'meeting',
      status: 'SCHEDULED',
      raw: m
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

  const handleDayClick = (dayStr: string) => {
    if (!isAvailabilityMode) return;
    
    const existingBlock = availabilityBlocks.find(b => b.date === dayStr);
    if (existingBlock) {
      removeAvailabilityBlock(existingBlock.id);
      addNotification('Availability Cleared', `Cleared availability for ${dayStr}`);
    } else {
      addAvailabilityBlock({
        date: dayStr,
        type: 'AVAILABLE',
        notes: 'Office Hours'
      });
      addNotification('Availability Marked', `Marked ${dayStr} as Available`);
    }
  };

  // Day Cells
  const dayCells = [];
  for (let i = 0; i < firstDay; i++) {
    dayCells.push(<div key={`blank-${i}`} className="min-h-32 border border-slate-100 bg-slate-50/50" />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayEvents = events.filter((e) => e.date === dayStr);
    const dayAvailability = availabilityBlocks.find(b => b.date === dayStr);

    const maxVisible = 4;
    const visibleEvents = dayEvents.slice(0, maxVisible);
    const hiddenCount = dayEvents.length - maxVisible;

    let cellBg = 'bg-white';
    if (dayAvailability) {
      cellBg = dayAvailability.type === 'AVAILABLE' ? 'bg-emerald-50/50' : 'bg-rose-50/50';
    }

    dayCells.push(
      <div 
        key={`day-${day}`} 
        className={`min-h-32 border border-slate-200 p-1.5 flex flex-col hover:bg-slate-50 transition-colors ${cellBg} ${isAvailabilityMode ? 'cursor-pointer hover:ring-2 hover:ring-blue-400 inset-0' : ''}`}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, dayStr)}
        onClick={() => handleDayClick(dayStr)}
      >
        <div className="flex justify-between items-start mb-1">
          <span className="font-bold text-slate-700 text-[10px]">{day}</span>
          {dayAvailability && (
            <span className={`text-[8px] px-1 py-0.5 rounded-sm font-bold ${dayAvailability.type === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
              {dayAvailability.type}
            </span>
          )}
        </div>
        
        <div className="flex-1 space-y-1">
          {visibleEvents.map((ev, idx) => {
            const isTask = ev.type === 'task';
            const isMeeting = ev.type === 'meeting';
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

            if (!isTask && !isMeeting) {
              bgColor = 'bg-amber-50/50 hover:bg-amber-100/50 text-amber-700 border-amber-100';
              statusColor = 'bg-amber-500';
            }

            if (isMeeting) {
              bgColor = 'bg-purple-50/50 hover:bg-purple-100/50 text-purple-700 border-purple-100';
              statusColor = 'bg-purple-500';
            }

            return (
              <div
                key={idx}
                draggable={isTask && currentUser?.role !== 'CLIENT' && !isAvailabilityMode}
                onDragStart={(e) => isTask && currentUser?.role !== 'CLIENT' && handleDragStart(e, ev.id)}
                onClick={(e) => {
                  e.stopPropagation(); // prevent day click
                  if (isTask) setSelectedTask(ev.raw);
                  if (isMeeting) setSelectedMeeting(ev.raw);
                }}
                className={`flex items-center gap-1.5 px-1.5 py-1 rounded border ${bgColor} ${(isTask && currentUser?.role !== 'CLIENT' && !isAvailabilityMode) ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'} transition-colors group`}
                title={ev.title}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${statusColor} shrink-0`} />
                {isMeeting && <Video size={10} className="shrink-0" />}
                <span className="text-[9px] font-semibold leading-none truncate flex-1">
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

  const handleCreateMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMeeting.title || !newMeeting.date) return;
    addMeeting({
      title: newMeeting.title,
      date: newMeeting.date,
      time: newMeeting.time || '10:00 AM',
      attendees: newMeeting.attendees,
      meetLink: `https://meet.google.com/${Math.random().toString(36).substr(2, 3)}-${Math.random().toString(36).substr(2, 4)}-${Math.random().toString(36).substr(2, 3)}`
    });
    addNotification('Meeting Scheduled', `Meeting "${newMeeting.title}" has been scheduled with Google Meet.`);
    addAuditLog('SCHEDULE_MEETING', `Scheduled a meeting: ${newMeeting.title}`);
    setIsScheduleModalOpen(false);
    setNewMeeting({ title: '', date: '', time: '', attendees: '' });
  };

  const handleShareCalendar = (e: React.FormEvent) => {
    e.preventDefault();
    addNotification('Calendar Shared', `Availability link sent to ${shareEmails}`);
    addAuditLog('SHARE_CALENDAR', `Shared availability with ${shareEmails}`);
    setIsShareModalOpen(false);
    setShareEmails('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] space-y-4">
      {/* Header Actions */}
      <div className="flex flex-wrap items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200 shrink-0 gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
            <CalendarIcon size={20} className="text-blue-600" />
            Operations Calendar
          </h1>
          <p className="text-[11px] text-slate-500 font-medium">Manage schedules, availability, and communications.</p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <button 
            onClick={() => setIsEmailDrawerOpen(true)}
            className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold transition-colors"
          >
            <Mail size={14} /> Emails
          </button>
          <button 
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold transition-colors"
          >
            <Share2 size={14} /> Share
          </button>
          <button 
            onClick={() => setIsAvailabilityMode(!isAvailabilityMode)}
            className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-xs font-bold transition-colors ${
              isAvailabilityMode ? 'bg-emerald-100 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <Clock size={14} /> {isAvailabilityMode ? 'Done Marking' : 'Mark Availability'}
          </button>
          <button 
            onClick={() => setIsScheduleModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
          >
            <Video size={14} /> G-Meet Booking
          </button>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 p-1 rounded-lg border border-slate-200 w-full md:w-auto">
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

      {isAvailabilityMode && (
        <div className="bg-emerald-50 text-emerald-800 p-3 rounded-lg border border-emerald-100 text-xs font-semibold flex items-center gap-2">
          <Clock size={14} /> Click on any day in the calendar to mark your availability.
        </div>
      )}

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

      {/* Email Communications Drawer */}
      {isEmailDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-[2px]" onClick={() => setIsEmailDrawerOpen(false)} />
          <div className="absolute inset-y-0 right-0 max-w-sm w-full bg-white shadow-2xl flex flex-col z-50 border-l border-slate-200">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2 text-slate-700">
                <Mail size={16} />
                <h3 className="font-bold text-slate-800 text-sm">Consolidated Emails</h3>
              </div>
              <button onClick={() => setIsEmailDrawerOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
                <XCircle size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50">
              {/* Mock Emails */}
              {[
                { subject: 'Compliance Documents Received', sender: 'client@company.com', date: 'Today, 10:30 AM', snippet: 'Hi, please find the attached documents for this months compliance filing...' },
                { subject: 'Meeting Confirmation: Q3 Review', sender: 'admin@vanntagge.com', date: 'Yesterday, 4:15 PM', snippet: 'Your meeting is scheduled for tomorrow at 2 PM via Google Meet...' },
                { subject: 'Pending Task: GST Filing', sender: 'system@vanntagge.com', date: 'Oct 12, 09:00 AM', snippet: 'Reminder: The GST filing task for Client XYZ is due in 2 days.' },
              ].map((email, i) => (
                <div key={i} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-slate-800 text-xs">{email.subject}</span>
                    <span className="text-[9px] text-slate-400 font-medium whitespace-nowrap ml-2">{email.date}</span>
                  </div>
                  <div className="text-[10px] text-blue-600 mb-2">{email.sender}</div>
                  <p className="text-[10px] text-slate-500 leading-relaxed">{email.snippet}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Schedule Meeting Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsScheduleModalOpen(false)} />
          <div className="bg-white rounded-2xl w-full max-w-md p-6 relative z-10 shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <Video className="text-blue-600" size={20} /> Schedule G-Meet
              </h3>
              <button onClick={() => setIsScheduleModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateMeeting} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Meeting Title</label>
                <input type="text" required value={newMeeting.title} onChange={e => setNewMeeting({...newMeeting, title: e.target.value})} className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-600 outline-none" placeholder="e.g. Q3 Financial Review" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date</label>
                  <input type="date" required value={newMeeting.date} onChange={e => setNewMeeting({...newMeeting, date: e.target.value})} className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-600 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Time</label>
                  <input type="time" value={newMeeting.time} onChange={e => setNewMeeting({...newMeeting, time: e.target.value})} className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-600 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Attendees (Emails)</label>
                <input type="text" value={newMeeting.attendees} onChange={e => setNewMeeting({...newMeeting, attendees: e.target.value})} className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-600 outline-none" placeholder="client@company.com" />
              </div>
              
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex items-start gap-2 mt-2">
                <Video className="text-blue-600 shrink-0 mt-0.5" size={14} />
                <p className="text-[10px] text-blue-800 leading-relaxed">
                  A Google Meet link will be automatically generated and embedded into the meeting details.
                </p>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsScheduleModalOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md">Generate & Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Share Calendar Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsShareModalOpen(false)} />
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 relative z-10 shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <Share2 className="text-emerald-600" size={20} /> Share Availability
              </h3>
              <button onClick={() => setIsShareModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleShareCalendar} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Addresses</label>
                <textarea required rows={3} value={shareEmails} onChange={e => setShareEmails(e.target.value)} className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-emerald-600 outline-none resize-none" placeholder="Enter emails separated by commas..." />
              </div>
              <p className="text-[10px] text-slate-500">Recipients will receive a tracking link to view your marked availability blocks.</p>
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setIsShareModalOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md">Send Link</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Side Drawer for Task/Meeting Details */}
      {(selectedTask || selectedMeeting) && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-[2px]" onClick={() => { setSelectedTask(null); setSelectedMeeting(null); }} />
          <div className="absolute inset-y-0 right-0 max-w-sm w-full bg-white shadow-2xl flex flex-col z-50 border-l border-slate-200">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
              <div className={`flex items-center gap-2 ${selectedMeeting ? 'text-purple-600' : 'text-blue-600'}`}>
                {selectedMeeting ? <Video size={16} /> : <Briefcase size={16} />}
                <h3 className="font-bold text-slate-800 text-sm">{selectedMeeting ? 'Meeting Details' : 'Task Details'}</h3>
              </div>
              <button onClick={() => { setSelectedTask(null); setSelectedMeeting(null); }} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
                <XCircle size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {selectedTask && (
                <>
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
                </>
              )}

              {selectedMeeting && (
                <>
                  <div>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700 border border-purple-200 mb-2 inline-block">
                      SCHEDULED
                    </span>
                    <h2 className="text-lg font-bold text-slate-800 leading-tight">{selectedMeeting.title}</h2>
                    <p className="text-xs text-slate-500 mt-1 font-medium flex items-center gap-1.5">
                      <CalendarIcon size={12} /> Date: {selectedMeeting.date} at {selectedMeeting.time}
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                        <UserCircle size={18} />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Attendees</span>
                        <span className="text-sm font-bold text-slate-700">{selectedMeeting.attendees || 'None'}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider mb-2">Google Meet Link</span>
                    <a href={selectedMeeting.meetLink} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-3 bg-blue-50/50 hover:bg-blue-100/50 rounded-xl border border-blue-200 text-blue-700 text-sm font-bold transition-colors">
                      <Video size={16} /> Join Meeting
                    </a>
                  </div>
                </>
              )}
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50">
              {selectedTask && currentUser?.role !== 'CLIENT' && (
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
