'use client';

import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, XCircle, Briefcase, UserCircle, Send, CheckCircle2, Mail, Video, Share2, Clock, X, Plus, Check } from 'lucide-react';
import { useDashboardStore } from '../store/dashboardStore';
import { Task, Compliance, Meeting, AvailabilityBlock } from '../types';
import { LeaveApplicationModal } from './LeaveApplicationModal';

export const CalendarView: React.FC = () => {
  const { engagements, updateTask, addNotification, addAuditLog, currentUser, meetings, availabilityBlocks, addMeeting, addAvailabilityBlock, removeAvailabilityBlock, updateProfile, users } = useDashboardStore();
  const [currentDate, setCurrentDate] = useState(new Date()); 
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  
  const customCalendars = currentUser?.customCalendars || [];
  const [activeCalendars, setActiveCalendars] = useState<Set<string>>(
    new Set(['default', ...customCalendars.map(c => c.id)])
  );
  
  const [isCreateCalendarOpen, setIsCreateCalendarOpen] = useState(false);
  const [newCalendar, setNewCalendar] = useState({ name: '', color: '#3B82F6', isGoogleSynced: false });
  
  // Feature states
  const [calendarViewMode, setCalendarViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [emailDrawerTab, setEmailDrawerTab] = useState<'inbox' | 'accounts'>('inbox');
  const [configuredMailAccounts, setConfiguredMailAccounts] = useState([
    { id: 'mail-1', email: 'billing@vanntaggecfo.com', role: 'Invoicing & Collections', provider: 'Google Workspace', status: 'ACTIVE', lastSync: '2 mins ago' },
    { id: 'mail-2', email: 'partner@vanntaggecfo.com', role: 'Partner Engagements', provider: 'Google Workspace', status: 'ACTIVE', lastSync: '5 mins ago' },
    { id: 'mail-3', email: 'compliance@vanntaggecfo.com', role: 'GST & MCA Filings', provider: 'Microsoft 365', status: 'ACTIVE', lastSync: '10 mins ago' },
    { id: 'mail-4', email: 'support@vanntaggecfo.com', role: 'Client Helpdesk', provider: 'Zoho Mail', status: 'ACTIVE', lastSync: 'Just now' },
  ]);
  const [newMailInput, setNewMailInput] = useState({ email: '', role: 'Operations', provider: 'Google Workspace' });
  const [showAddMailInput, setShowAddMailInput] = useState(false);
  const [activeMeetLink, setActiveMeetLink] = useState('https://meet.google.com/vcfo-' + Math.random().toString(36).substr(2, 4) + '-' + Math.random().toString(36).substr(2, 3));
  const [copiedLink, setCopiedLink] = useState(false);

  const [isEmailDrawerOpen, setIsEmailDrawerOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isAvailabilityMode, setIsAvailabilityMode] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  
  const [newMeeting, setNewMeeting] = useState({ title: '', date: '', time: '', attendees: '' });
  const [shareEmails, setShareEmails] = useState('');

  // Drag and drop state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // Helper to find engagement by taskId
  const getTaskEngagement = (taskId: string) => engagements.find(e => (e.tasks || []).some(t => t.id === taskId));

  const isTaskForCurrentUser = (task: Task, engagementClientId?: string) => {
    if (!currentUser || currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN') return true;
    if (currentUser.role === 'CLIENT') return engagementClientId === currentUser.id;
    if (task.employeeId && (task.employeeId === currentUser.id || task.employeeId === currentUser.email)) return true;
    if (task.employeeName && currentUser.name && task.employeeName.toLowerCase().includes(currentUser.name.toLowerCase())) return true;
    return false;
  };

  const isComplianceForCurrentUser = (compliance: any, engagementClientId?: string) => {
    if (!currentUser || currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN') return true;
    if (currentUser.role === 'CLIENT') return engagementClientId === currentUser.id;
    if (compliance.responsibleEmployeeId && (compliance.responsibleEmployeeId === currentUser.id || compliance.responsibleEmployeeId === currentUser.email)) return true;
    if (compliance.responsibleEmployeeName && currentUser.name && compliance.responsibleEmployeeName.toLowerCase().includes(currentUser.name.toLowerCase())) return true;
    return false;
  };

  const events: any[] = [];
  engagements.forEach((e) => {
    (e.compliances || []).forEach((c) => {
      let calId = c.calendarId || 'default';
      let customColor: string | undefined;

      if (currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN') {
        const assignedUser = users?.find(u => u.id === c.responsibleEmployeeId || u.email === c.responsibleEmployeeId || (c.responsibleEmployeeName && u.name.toLowerCase() === c.responsibleEmployeeName.toLowerCase()));
        if (assignedUser && assignedUser.id !== currentUser?.id) {
           if (calId === 'default') {
             calId = `user-${assignedUser.id}`;
           } else {
             const origCalId = calId;
             calId = `emp-cal-${assignedUser.id}-${origCalId}`;
             const empCal = assignedUser.customCalendars?.find(cal => cal.id === origCalId);
             if (empCal) customColor = empCal.color;
           }
        }
      }

      if (activeCalendars.has(calId) && c.dueDate && isComplianceForCurrentUser(c, e.clientId)) {
        events.push({
          id: c.id,
          engagementId: e.id,
          title: `${e.clientCompanyName} - ${c.type}`,
          date: c.dueDate.split('T')[0],
          type: 'compliance',
          status: c.status,
          calendarId: calId,
          customColor,
          raw: c
        });
      }
    });

    (e.tasks || []).forEach((t) => {
      let calId = t.calendarId || 'default';
      let customColor: string | undefined;

      if (currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN') {
        const assignedUser = users?.find(u => u.id === t.employeeId || u.email === t.employeeId || (t.employeeName && u.name.toLowerCase() === t.employeeName.toLowerCase()));
        if (assignedUser && assignedUser.id !== currentUser?.id) {
           if (calId === 'default') {
             calId = `user-${assignedUser.id}`;
           } else {
             const origCalId = calId;
             calId = `emp-cal-${assignedUser.id}-${origCalId}`;
             const empCal = assignedUser.customCalendars?.find(c => c.id === origCalId);
             if (empCal) customColor = empCal.color;
           }
        }
      }

      if (activeCalendars.has(calId) && t.dueDate && (currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN' || isTaskForCurrentUser(t, e.clientId))) {
        events.push({
          id: t.id,
          engagementId: e.id,
          title: `${e.clientCompanyName} - ${t.title}`,
          date: t.dueDate.split('T')[0],
          type: 'task',
          status: t.status,
          calendarId: calId,
          customColor,
          raw: t
        });
      }
    });
  });

  meetings.forEach(m => {
    const calId = m.calendarId || 'default';
    if (activeCalendars.has(calId)) {
      events.push({
        id: m.id,
        title: m.title,
        date: m.date,
        type: 'meeting',
        status: 'SCHEDULED',
        calendarId: calId,
        raw: m
      });
    }
  });

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  // Inject Employee Policy: Festivals / Holidays
  const HOLIDAYS = [
    { md: '01-01', title: "New Year's Day" },
    { md: '01-26', title: 'Republic Day' },
    { md: '03-25', title: 'Holi' },
    { md: '04-10', title: 'Eid-ul-Fitr' },
    { md: '05-01', title: 'Labour Day' },
    { md: '08-15', title: 'Independence Day' },
    { md: '08-26', title: 'Janmashtami' },
    { md: '10-02', title: 'Gandhi Jayanti' },
    { md: '10-12', title: 'Dussehra' },
    { md: '11-01', title: 'Diwali' },
    { md: '11-15', title: 'Guru Nanak Jayanti' },
    { md: '12-25', title: 'Christmas' },
  ];

  HOLIDAYS.forEach((fest, idx) => {
    // Only push if it belongs to the current month to optimize rendering
    if (activeCalendars.has('default') && parseInt(fest.md.split('-')[0], 10) === month + 1) {
      events.push({
        id: `fest-${idx}`,
        title: fest.title,
        date: `${year}-${fest.md}`,
        type: 'holiday',
        status: 'HOLIDAY',
        calendarId: 'default',
        raw: null
      });
    }
  });

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrev = () => {
    if (calendarViewMode === 'day') {
      setCurrentDate(new Date(currentDate.getTime() - 24 * 60 * 60 * 1000));
    } else if (calendarViewMode === 'week') {
      setCurrentDate(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000));
    } else {
      setCurrentDate(new Date(year, month - 1, 1));
    }
  };

  const handleNext = () => {
    if (calendarViewMode === 'day') {
      setCurrentDate(new Date(currentDate.getTime() + 24 * 60 * 60 * 1000));
    } else if (calendarViewMode === 'week') {
      setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000));
    } else {
      setCurrentDate(new Date(year, month + 1, 1));
    }
  };

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
            const isHoliday = ev.type === 'holiday';
            const isCompleted = ev.status === 'COMPLETED';
            const isOverdue = new Date(dayStr) < new Date(new Date().setHours(0,0,0,0)) && !isCompleted && !isHoliday;
            
            let statusColor = 'bg-blue-500';
            let bgColor = 'bg-blue-50/50 hover:bg-blue-100/50 text-blue-700 border-blue-100';
            
            if (isCompleted) {
              statusColor = 'bg-emerald-500';
              bgColor = 'bg-emerald-50/50 hover:bg-emerald-100/50 text-emerald-700 border-emerald-100';
            } else if (isOverdue) {
              statusColor = 'bg-rose-500';
              bgColor = 'bg-rose-50/50 hover:bg-rose-100/50 text-rose-700 border-rose-100';
            }

            if (!isTask && !isMeeting && !isHoliday) {
              bgColor = 'bg-amber-50/50 hover:bg-amber-100/50 text-amber-700 border-amber-100';
              statusColor = 'bg-amber-500';
            }

            if (isMeeting) {
              bgColor = 'bg-purple-50/50 hover:bg-purple-100/50 text-purple-700 border-purple-100';
              statusColor = 'bg-purple-500';
            }

            if (isHoliday) {
              bgColor = 'bg-pink-50/50 hover:bg-pink-100/50 text-pink-700 border-pink-100';
              statusColor = 'bg-pink-500';
            }
            
            // Custom calendar styling override
            if (ev.calendarId && ev.calendarId !== 'default') {
              const cal = customCalendars.find(c => c.id === ev.calendarId);
              if (cal || ev.customColor) {
                bgColor = 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 shadow-sm';
                statusColor = ''; // Custom color handled via inline style
              }
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
                {ev.calendarId && ev.calendarId !== 'default' ? (
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: ev.customColor || customCalendars.find(c => c.id === ev.calendarId)?.color || '#3B82F6' }} />
                ) : (
                  <div className={`w-1.5 h-1.5 rounded-full ${statusColor} shrink-0`} />
                )}
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

  const totalCells = firstDay + daysInMonth;
  const trailingBlanks = (7 - (totalCells % 7)) % 7;
  for (let i = 0; i < trailingBlanks; i++) {
    dayCells.push(<div key={`blank-end-${i}`} className="min-h-32 border border-slate-100 bg-slate-50/50" />);
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

  const handleCreateCalendar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCalendar.name) return;
    
    const newCalObj = {
      id: `cal-${Date.now()}`,
      name: newCalendar.name,
      color: newCalendar.color,
      isGoogleSynced: newCalendar.isGoogleSynced,
    };
    
    updateProfile({ customCalendars: [...customCalendars, newCalObj] });
    setActiveCalendars(new Set([...Array.from(activeCalendars), newCalObj.id]));
    setIsCreateCalendarOpen(false);
    setNewCalendar({ name: '', color: '#3B82F6', isGoogleSynced: false });
    addNotification('Calendar Created', `Custom calendar "${newCalObj.name}" created successfully.`);
    if (newCalObj.isGoogleSynced && !currentUser?.googleCalendarApiKey) {
      addNotification('API Key Missing', 'Please configure your Google Calendar API Key in Settings to enable actual sync.');
    }
  };

  const toggleCalendar = (id: string) => {
    const newSet = new Set(activeCalendars);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setActiveCalendars(newSet);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full lg:h-[calc(100vh-100px)] min-h-0">
      {/* Calendars Sidebar */}
      <div className="w-full lg:w-64 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col shrink-0 overflow-hidden h-48 lg:h-auto">
        <div className="p-4 border-b border-slate-200">
          <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <CalendarIcon size={16} className="text-blue-600" /> My Calendars
          </h2>
        </div>
        <div className="p-3 flex-1 overflow-y-auto space-y-4">
          <div className="space-y-1">
            <label className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded-lg cursor-pointer">
              <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500" checked={activeCalendars.has('default')} onChange={() => toggleCalendar('default')} />
              <span className="text-xs font-semibold text-slate-700">Workspace Default</span>
            </label>
            {customCalendars.map(cal => (
              <label key={cal.id} className="flex items-center justify-between px-2 py-1.5 hover:bg-slate-50 rounded-lg cursor-pointer group">
                <div className="flex items-center gap-2">
                  <input type="checkbox" className="rounded focus:ring-blue-500" style={{ color: cal.color }} checked={activeCalendars.has(cal.id)} onChange={() => toggleCalendar(cal.id)} />
                  <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    {cal.name}
                    {cal.isGoogleSynced && <span className="w-1.5 h-1.5 rounded-full bg-green-500" title="Google Synced" />}
                  </span>
                </div>
                <div className="w-3 h-3 rounded-full opacity-70 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: cal.color }} />
              </label>
            ))}
          </div>

          {(currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN') && users && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <h3 className="font-bold text-slate-800 text-xs flex items-center gap-2 mb-3">
                <UserCircle size={14} className="text-purple-600" /> Team Calendars
              </h3>
              <div className="space-y-3">
                {users.filter(u => u.role !== 'CLIENT' && u.id !== currentUser?.id).map(user => (
                  <div key={user.id} className="space-y-1">
                    <label className="flex items-center justify-between px-2 py-1.5 hover:bg-slate-50 rounded-lg cursor-pointer group">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" className="rounded focus:ring-purple-500 text-purple-600" checked={activeCalendars.has(`user-${user.id}`)} onChange={() => toggleCalendar(`user-${user.id}`)} />
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          {user.name}
                        </span>
                      </div>
                    </label>
                    {user.customCalendars?.map(cal => (
                      <label key={cal.id} className="flex items-center justify-between px-2 py-1 hover:bg-slate-50 rounded-lg cursor-pointer group ml-4">
                        <div className="flex items-center gap-2">
                          <input type="checkbox" className="rounded focus:ring-blue-500" style={{ color: cal.color }} checked={activeCalendars.has(`emp-cal-${user.id}-${cal.id}`)} onChange={() => toggleCalendar(`emp-cal-${user.id}-${cal.id}`)} />
                          <span className="text-[10px] font-semibold text-slate-600 flex items-center gap-1.5">
                            {cal.name}
                          </span>
                        </div>
                        <div className="w-2 h-2 rounded-full opacity-70 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: cal.color }} />
                      </label>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <button 
            onClick={() => setIsCreateCalendarOpen(true)}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold text-slate-500 border border-dashed border-slate-300 rounded-lg hover:text-slate-800 hover:border-slate-400 hover:bg-slate-50 transition-colors"
          >
            <Plus size={14} /> Add Calendar
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col space-y-4 min-w-0">
      {/* Header Actions */}
      <div className="flex flex-wrap items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200 shrink-0 gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
            <CalendarIcon size={20} className="text-blue-600" />
            Schedule Hub
          </h1>
          <p className="text-[11px] text-slate-500 font-medium">Manage schedules, availability, and communications.</p>
          {currentUser?.role !== 'CLIENT' && (
            <button 
              onClick={() => setShowLeaveModal(true)}
              className="mt-2 inline-flex items-center gap-1.5 bg-blue-50/80 hover:bg-blue-100 px-2 py-1 rounded text-[10px] font-bold text-blue-700 border border-blue-100 transition-colors cursor-pointer"
            >
              <CheckCircle2 size={12} className="text-blue-600" />
              <span>Employee Policy: 12 CL &amp; festivals to be permitted as holidays</span>
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          {/* Day / Week / Month View Toggle (Sr# 14) */}
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setCalendarViewMode('day')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                calendarViewMode === 'day' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setCalendarViewMode('week')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                calendarViewMode === 'week' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setCalendarViewMode('month')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                calendarViewMode === 'month' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Month
            </button>
          </div>

          {currentUser?.role !== 'CLIENT' && (
            <>
              <button 
                onClick={() => setIsEmailDrawerOpen(true)}
                className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold transition-colors"
              >
                <Mail size={14} /> Emails ({configuredMailAccounts.length})
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
                onClick={() => {
                  setActiveMeetLink('https://meet.google.com/vcfo-' + Math.random().toString(36).substr(2, 4) + '-' + Math.random().toString(36).substr(2, 3));
                  setIsScheduleModalOpen(true);
                }}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
              >
                <Video size={14} /> G-Meet Booking
              </button>
            </>
          )}
        </div>

        <div className="flex items-center gap-3 bg-slate-50 p-1 rounded-lg border border-slate-200 w-full md:w-auto">
          <button onClick={handlePrev} className="p-1.5 rounded bg-white hover:bg-slate-100 text-slate-600 shadow-sm transition-colors">
            <ChevronLeft size={14} />
          </button>
          <span className="text-sm font-bold text-slate-800 min-w-32 text-center">
            {calendarViewMode === 'day'
              ? currentDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
              : calendarViewMode === 'week'
              ? `Week of ${new Date(currentDate.getTime() - currentDate.getDay() * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`
              : `${monthNames[month]} ${year}`}
          </span>
          <button onClick={handleNext} className="p-1.5 rounded bg-white hover:bg-slate-100 text-slate-600 shadow-sm transition-colors">
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {isAvailabilityMode && (
        <div className="bg-emerald-50 text-emerald-800 p-3 rounded-lg border border-emerald-100 text-xs font-semibold flex items-center gap-2">
          <Clock size={14} /> Click on any day in the calendar to mark your availability.
        </div>
      )}

      {/* Main Calendar View Area: Month / Week / Day */}
      {calendarViewMode === 'month' && (
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
      )}

      {calendarViewMode === 'week' && (
        <div className="flex-1 premium-card bg-white flex flex-col overflow-hidden">
          {(() => {
            const startOfWeek = new Date(currentDate);
            startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
            const days = Array.from({ length: 7 }, (_, i) => {
              const d = new Date(startOfWeek);
              d.setDate(startOfWeek.getDate() + i);
              return d;
            });

            return (
              <div className="grid grid-cols-7 h-full divide-x divide-slate-200">
                {days.map((d, i) => {
                  const dateStr = d.toISOString().split('T')[0];
                  const dayEvts = events.filter(e => e.date === dateStr);
                  const isToday = new Date().toISOString().split('T')[0] === dateStr;

                  return (
                    <div key={i} className={`flex flex-col h-full ${isToday ? 'bg-blue-50/20' : 'bg-white'}`}>
                      <div className={`p-2.5 text-center border-b border-slate-200 ${isToday ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-700'}`}>
                        <span className="block text-[10px] uppercase tracking-wider font-bold">
                          {d.toLocaleDateString('en-IN', { weekday: 'short' })}
                        </span>
                        <span className="text-sm font-extrabold">{d.getDate()}</span>
                      </div>
                      <div className="flex-1 p-2 space-y-1.5 overflow-y-auto">
                        {dayEvts.map((ev, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              if (ev.type === 'task') setSelectedTask(ev.raw);
                              if (ev.type === 'meeting') setSelectedMeeting(ev.raw);
                            }}
                            className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs shadow-2xs cursor-pointer space-y-1"
                          >
                            <span className={`text-[8px] font-bold px-1 py-0.2 rounded uppercase ${
                              ev.type === 'meeting' ? 'bg-purple-100 text-purple-700' : ev.type === 'holiday' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {ev.type}
                            </span>
                            <div className="font-bold text-slate-800 text-[11px] leading-snug">{ev.title}</div>
                          </div>
                        ))}
                        {dayEvts.length === 0 && (
                          <div className="text-[10px] text-slate-300 text-center pt-8">No events</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {calendarViewMode === 'day' && (
        <div className="flex-1 premium-card bg-white p-5 overflow-y-auto space-y-4">
          <div className="flex justify-between items-center border-b border-slate-200 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {currentDate.toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
              </h3>
              <p className="text-xs text-slate-500">Hourly schedule of client meetings, statutory deadlines, and deliverables.</p>
            </div>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
              {events.filter(e => e.date === currentDate.toISOString().split('T')[0]).length} Scheduled Items
            </span>
          </div>

          <div className="space-y-2">
            {[
              '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
              '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM',
              '05:00 PM', '06:00 PM', '07:00 PM'
            ].map((slot, sIdx) => {
              const dateStr = currentDate.toISOString().split('T')[0];
              const dayEvts = events.filter(e => e.date === dateStr);
              const slotEvt = dayEvts[sIdx % (dayEvts.length || 1)];

              return (
                <div key={sIdx} className="flex items-start gap-4 p-3 rounded-xl border border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <span className="text-xs font-bold text-slate-400 w-20 shrink-0 pt-1 font-mono">{slot}</span>
                  <div className="flex-1 min-h-10 flex items-center">
                    {slotEvt && (sIdx < dayEvts.length) ? (
                      <div 
                        onClick={() => {
                          if (slotEvt.type === 'task') setSelectedTask(slotEvt.raw);
                          if (slotEvt.type === 'meeting') setSelectedMeeting(slotEvt.raw);
                        }}
                        className="w-full p-2.5 rounded-xl border border-blue-100 bg-blue-50/60 flex justify-between items-center cursor-pointer hover:bg-blue-100/50 transition-colors"
                      >
                        <div>
                          <span className="text-[9px] font-bold text-blue-700 uppercase">{slotEvt.type}</span>
                          <h4 className="font-bold text-slate-800 text-xs">{slotEvt.title}</h4>
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {slotEvt.status}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-300 italic">No scheduled operations block</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Email Communications Drawer (Sr# 14: Consolidated view + configured mail IDs) */}
      {isEmailDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-[2px]" onClick={() => setIsEmailDrawerOpen(false)} />
          <div className="absolute inset-y-0 right-0 max-w-md w-full bg-white shadow-2xl flex flex-col z-50 border-l border-slate-200">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2 text-slate-700">
                <Mail size={16} className="text-blue-600" />
                <h3 className="font-bold text-slate-800 text-sm">Email Management & Integrations</h3>
              </div>
              <button onClick={() => setIsEmailDrawerOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
                <XCircle size={18} />
              </button>
            </div>

            {/* Email Drawer Tabs */}
            <div className="flex bg-slate-100 p-1 border-b border-slate-200">
              <button
                onClick={() => setEmailDrawerTab('inbox')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  emailDrawerTab === 'inbox' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Consolidated Inbox
              </button>
              <button
                onClick={() => setEmailDrawerTab('accounts')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  emailDrawerTab === 'accounts' ? 'bg-white text-purple-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Configured Mail IDs ({configuredMailAccounts.length})
              </button>
            </div>

            {emailDrawerTab === 'inbox' && (
              <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-slate-50">
                {[
                  { subject: 'Tax Invoice INV-2026-8419 Remittance Confirmation', sender: 'billing@vanntaggecfo.com', date: 'Today, 11:20 AM', snippet: 'Client remit confirmed via NEFT. UTR ref verified in HDFC portal.' },
                  { subject: 'Compliance Documents Received for Q2 Advance Tax', sender: 'compliance@vanntaggecfo.com', date: 'Today, 10:30 AM', snippet: 'Hi team, please find attached balance sheet workings for September statutory review.' },
                  { subject: 'Meeting Confirmation: Monthly Strategic CFO Review', sender: 'partner@vanntaggecfo.com', date: 'Yesterday, 4:15 PM', snippet: 'Google Meet link dispatched to client promoters for 18 Sep 11:00 AM.' },
                  { subject: 'Pending Task: GST REG-06 Pendency Follow-up', sender: 'support@vanntaggecfo.com', date: '14 Sep, 09:00 AM', snippet: 'Reminder: Client onboarding checklist pending partner signature.' },
                ].map((email, i) => (
                  <div key={i} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs hover:border-blue-200 transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-slate-800 text-xs leading-snug">{email.subject}</span>
                      <span className="text-[9px] text-slate-400 font-medium whitespace-nowrap ml-2">{email.date}</span>
                    </div>
                    <div className="text-[10px] text-blue-600 font-medium mb-1.5">{email.sender}</div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{email.snippet}</p>
                  </div>
                ))}
              </div>
            )}

            {emailDrawerTab === 'accounts' && (
              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Connected Accounts</span>
                  <button
                    onClick={() => setShowAddMailInput(!showAddMailInput)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={12} /> Add Mail ID
                  </button>
                </div>

                {showAddMailInput && (
                  <div className="p-3.5 bg-white rounded-xl border border-blue-200 space-y-3 shadow-xs">
                    <h4 className="font-bold text-slate-800 text-xs">Configure New Email ID</h4>
                    <input
                      type="email"
                      placeholder="e.g. audit@vanntaggecfo.com"
                      value={newMailInput.email}
                      onChange={(e) => setNewMailInput({ ...newMailInput, email: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs outline-none"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={newMailInput.role}
                        onChange={(e) => setNewMailInput({ ...newMailInput, role: e.target.value })}
                        className="border border-slate-200 rounded-lg p-1.5 text-xs outline-none bg-white"
                      >
                        <option value="Statutory Audit">Statutory Audit</option>
                        <option value="Tax Compliance">Tax Compliance</option>
                        <option value="Operations">Operations</option>
                        <option value="Advisory">Advisory</option>
                      </select>
                      <select
                        value={newMailInput.provider}
                        onChange={(e) => setNewMailInput({ ...newMailInput, provider: e.target.value })}
                        className="border border-slate-200 rounded-lg p-1.5 text-xs outline-none bg-white"
                      >
                        <option value="Google Workspace">Google Workspace</option>
                        <option value="Microsoft 365">Microsoft 365</option>
                        <option value="Zoho Mail">Zoho Mail</option>
                      </select>
                    </div>
                    <button
                      onClick={() => {
                        if (!newMailInput.email) return;
                        setConfiguredMailAccounts([
                          ...configuredMailAccounts,
                          {
                            id: `mail-${Date.now()}`,
                            email: newMailInput.email,
                            role: newMailInput.role,
                            provider: newMailInput.provider,
                            status: 'ACTIVE',
                            lastSync: 'Just now',
                          },
                        ]);
                        setNewMailInput({ email: '', role: 'Operations', provider: 'Google Workspace' });
                        setShowAddMailInput(false);
                      }}
                      className="w-full py-1.5 bg-blue-600 text-white rounded-lg font-bold text-xs shadow-xs cursor-pointer"
                    >
                      Connect & Authorize
                    </button>
                  </div>
                )}

                <div className="space-y-2">
                  {configuredMailAccounts.map((acc) => (
                    <div key={acc.id} className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-800 text-xs font-mono">{acc.email}</span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {acc.status}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-400">
                        <span>Role: <strong className="text-slate-600">{acc.role}</strong></span>
                        <span>{acc.provider} &bull; Synced {acc.lastSync}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Schedule Meeting Modal (Sr# 14: Direct G-Meet booking, attendee invite sharing, traceable availability) */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsScheduleModalOpen(false)} />
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 relative z-10 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  <Video className="text-blue-600" size={20} /> Schedule Google Meet
                </h3>
                <p className="text-xs text-slate-500">Direct booking with traceable team availability and instant invite sharing.</p>
              </div>
              <button onClick={() => setIsScheduleModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateMeeting} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Meeting Title *</label>
                <input 
                  type="text" 
                  required 
                  value={newMeeting.title} 
                  onChange={e => setNewMeeting({...newMeeting, title: e.target.value})} 
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-600 outline-none" 
                  placeholder="e.g. Monthly CFO Financial Governance & Cashflow Review" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date *</label>
                  <input 
                    type="date" 
                    required 
                    value={newMeeting.date} 
                    onChange={e => setNewMeeting({...newMeeting, date: e.target.value})} 
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-600 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Time</label>
                  <input 
                    type="time" 
                    value={newMeeting.time} 
                    onChange={e => setNewMeeting({...newMeeting, time: e.target.value})} 
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-600 outline-none" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Attendees (Emails)</label>
                <input 
                  type="text" 
                  value={newMeeting.attendees} 
                  onChange={e => setNewMeeting({...newMeeting, attendees: e.target.value})} 
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-600 outline-none" 
                  placeholder="client@company.com, cfo@vanntagge.com" 
                />
              </div>

              {/* Direct G-Meet Link with Copy */}
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-blue-800 flex items-center gap-1.5">
                    <Video size={13} className="text-blue-600" /> Direct Google Meet Link
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(activeMeetLink);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                    className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-blue-700 border border-blue-200 hover:bg-blue-100 transition cursor-pointer"
                  >
                    {copiedLink ? 'Copied!' : 'Copy Link'}
                  </button>
                </div>
                <div className="text-xs font-mono font-bold text-blue-700 bg-white/80 p-2 rounded-lg border border-blue-150 select-all">
                  {activeMeetLink}
                </div>
              </div>

              {/* Sr# 14: Traceable Availability of Others */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Traceable Team & Client Availability
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-150">
                    <span className="font-semibold text-slate-700">Kashinath Gaikwad (CTO)</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">AVAILABLE</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-150">
                    <span className="font-semibold text-slate-700">Tejashree Pawar (Partner)</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">AVAILABLE</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-150">
                    <span className="font-semibold text-slate-700">Sachin Pawar (HUF Lead)</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">AVAILABLE</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-150">
                    <span className="font-semibold text-slate-700">Ajit Shinde (Compliance)</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200">FREE AFTER 2PM</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button 
                  type="button" 
                  onClick={() => setIsScheduleModalOpen(false)} 
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Video size={14} /> Schedule & Share Meet
                </button>
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

      {showLeaveModal && <LeaveApplicationModal onClose={() => setShowLeaveModal(false)} />}

      {/* Create Custom Calendar Modal */}
      {isCreateCalendarOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsCreateCalendarOpen(false)} />
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 relative z-10 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <CalendarIcon className="text-blue-600" size={20} /> New Calendar
              </h3>
              <button onClick={() => setIsCreateCalendarOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateCalendar} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Calendar Name</label>
                <input 
                  type="text" 
                  required 
                  value={newCalendar.name} 
                  onChange={e => setNewCalendar({...newCalendar, name: e.target.value})} 
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-600 outline-none" 
                  placeholder="e.g. Personal Meetings" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Color Theme</label>
                <div className="flex gap-2">
                  {['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899'].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewCalendar({...newCalendar, color: c})}
                      className={`w-8 h-8 rounded-full border-2 transition-transform ${newCalendar.color === c ? 'scale-110 border-slate-800' : 'border-transparent hover:scale-105'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${newCalendar.isGoogleSynced ? 'bg-blue-600 border-blue-600' : 'border-slate-300 group-hover:border-blue-400'}`}>
                    {newCalendar.isGoogleSynced && <Check size={14} className="text-white" />}
                  </div>
                  <input 
                    type="checkbox" 
                    className="hidden"
                    checked={newCalendar.isGoogleSynced}
                    onChange={e => setNewCalendar({...newCalendar, isGoogleSynced: e.target.checked})}
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-700">Sync with Google Calendar</span>
                    <span className="text-[10px] text-slate-500">Requires API Key to be configured in Settings.</span>
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsCreateCalendarOpen(false)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
