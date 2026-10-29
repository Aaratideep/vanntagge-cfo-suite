'use client';

import React, { useState, useMemo } from 'react';
import { useDashboardStore } from '../store/dashboardStore';
import { Clock, Send, Calendar, CheckCircle2, Building2, Briefcase, ChevronRight, Activity, Users } from 'lucide-react';
import { Task, User } from '../types';

const TimesheetContent: React.FC<{ currentUser: User }> = ({ currentUser }) => {
  const { engagements, updateTask, addTaskFollowUp, timesheets, submitTimesheet, users } = useDashboardStore();

  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [hoursToLog, setHoursToLog] = useState<number | ''>('');
  const [workDescription, setWorkDescription] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'my_timesheet' | 'firm_overview'>('my_timesheet');

  const isAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN';

  // Gather tasks for the current user
  const userTasks: { task: Task; engagementId: string; clientId: string; clientName: string }[] = [];
  
  engagements.forEach((eng) => {
    (eng.tasks || []).forEach((task) => {
      const isAssigned = 
        (task.employeeId && (task.employeeId === currentUser.id || task.employeeId === currentUser.email)) ||
        (task.employeeName && currentUser.name && task.employeeName.toLowerCase().includes(currentUser.name.toLowerCase()));
      
      if (isAssigned || isAdmin) {
        if (task.status !== 'COMPLETED') {
          userTasks.push({ task, engagementId: eng.id, clientId: eng.clientId, clientName: eng.clientCompanyName });
        }
      }
    });
  });

  // Unique clients from userTasks for the dropdown
  const uniqueClients = Array.from(new Set(userTasks.map(t => t.clientId))).map(id => {
    const item = userTasks.find(t => t.clientId === id);
    return { id, name: item?.clientName || 'Unknown Client' };
  });

  const availableTasks = userTasks.filter(t => t.clientId === selectedClientId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskId || !selectedClientId || !hoursToLog || !workDescription.trim()) return;

    const targetItem = userTasks.find(t => t.task.id === selectedTaskId);
    if (!targetItem) return;

    const { task, engagementId, clientName, clientId } = targetItem;
    
    // Update task time spent
    const newTimeSpent = (Number(task.timeSpent) || 0) + Number(hoursToLog);
    updateTask(engagementId, task.id, {
      timeSpent: newTimeSpent,
      status: task.status === 'NOT_STARTED' ? 'IN_PROGRESS' : task.status
    });

    const timesheetLog = `Timesheet Entry [${hoursToLog}h]: ${workDescription}`;
    addTaskFollowUp(engagementId, task.id, timesheetLog);

    // Save structured timesheet entry
    submitTimesheet({
      employeeId: currentUser.id,
      employeeName: currentUser.name,
      clientId: clientId,
      clientName: clientName,
      taskId: task.id,
      taskTitle: task.title,
      date: new Date().toISOString().split('T')[0],
      hours: Number(hoursToLog),
      description: workDescription,
    });

    useDashboardStore.getState().addNotification(
      'Timesheet Logged',
      `${currentUser.name} logged ${hoursToLog}h on task "${task.title}".`,
      '/work'
    );

    setSuccessMessage(`Successfully logged ${hoursToLog} hours for "${task.title}"`);
    setTimeout(() => setSuccessMessage(null), 4000);

    setSelectedTaskId('');
    setHoursToLog('');
    setWorkDescription('');
  };

  const getWeekBounds = () => {
    const curr = new Date();
    const first = curr.getDate() - curr.getDay() + 1; // Monday
    const firstDay = new Date(curr.setDate(first));
    const lastDay = new Date(curr.setDate(first + 6));
    return { start: firstDay.toISOString().split('T')[0], end: lastDay.toISOString().split('T')[0] };
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const { start: weekStart, end: weekEnd } = getWeekBounds();

  // Metrics: My Timesheet
  const myTimesheets = timesheets.filter(t => t.employeeId === currentUser.id);
  const myHoursToday = myTimesheets.filter(t => t.date === todayStr).reduce((acc, t) => acc + t.hours, 0);
  const myHoursWeek = myTimesheets.filter(t => t.date >= weekStart && t.date <= weekEnd).reduce((acc, t) => acc + t.hours, 0);

  // Metrics: Firm Overview
  const firmHoursToday = timesheets.filter(t => t.date === todayStr).reduce((acc, t) => acc + t.hours, 0);
  const firmHoursWeek = timesheets.filter(t => t.date >= weekStart && t.date <= weekEnd).reduce((acc, t) => acc + t.hours, 0);

  // Group firm hours by employee for current week
  const employeeWeekHours = useMemo(() => {
    const map = new Map<string, { name: string; hours: number }>();
    timesheets.filter(t => t.date >= weekStart && t.date <= weekEnd).forEach(t => {
      const current = map.get(t.employeeId) || { name: t.employeeName, hours: 0 };
      map.set(t.employeeId, { ...current, hours: current.hours + t.hours });
    });
    return Array.from(map.values()).sort((a, b) => b.hours - a.hours);
  }, [timesheets, weekStart, weekEnd]);

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/30 pb-2 gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 font-outfit">Time Hub</h1>
          <p className="text-xs text-outline">Log your daily working hours against active client engagement tasks.</p>
        </div>
        <div className="flex items-center gap-4">
          {isAdmin && (
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button 
                onClick={() => setViewMode('my_timesheet')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${viewMode === 'my_timesheet' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
              >
                My Timesheet
              </button>
              <button 
                onClick={() => setViewMode('firm_overview')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${viewMode === 'firm_overview' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
              >
                Firm Overview
              </button>
            </div>
          )}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-xl font-bold text-xs border border-blue-100 shadow-sm">
            <Calendar size={14} />
            {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </div>

      {viewMode === 'my_timesheet' ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Hours Logged Today</p>
                <p className="text-3xl font-bold text-slate-800">{myHoursToday}<span className="text-sm text-slate-400 font-medium ml-1">hrs</span></p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <Clock size={24} />
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Hours Logged This Week</p>
                <p className="text-3xl font-bold text-slate-800">{myHoursWeek}<span className="text-sm text-slate-400 font-medium ml-1">hrs</span></p>
              </div>
              <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Calendar size={24} />
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Active Tasks</p>
                <p className="text-3xl font-bold text-slate-800">{userTasks.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                <Briefcase size={24} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Entry Form */}
            <div className="lg:col-span-1">
              <div className="premium-card bg-white p-6 border border-slate-200 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                
                <h3 className="font-bold text-slate-800 text-sm mb-6 flex items-center gap-2">
                  <Clock size={16} className="text-blue-600" /> Log New Hours
                </h3>

                {successMessage && (
                  <div className="mb-6 p-3 bg-green-50 text-green-700 border border-green-200 rounded-xl text-xs font-bold flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
                    <CheckCircle2 size={16} className="shrink-0 text-green-500 mt-0.5" />
                    <span>{successMessage}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5 text-xs">
                  <div>
                    <label className="block text-slate-600 mb-1.5 font-bold uppercase tracking-wider text-[10px]">Select Client</label>
                    <select
                      required
                      value={selectedClientId}
                      onChange={(e) => {
                        setSelectedClientId(e.target.value);
                        setSelectedTaskId(''); // reset task when client changes
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:bg-white focus:border-blue-400 font-semibold text-slate-800 transition-colors"
                    >
                      <option value="">-- Choose a Client --</option>
                      {uniqueClients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedClientId && (
                    <div>
                      <label className="block text-slate-600 mb-1.5 font-bold uppercase tracking-wider text-[10px]">Select Active Task</label>
                      <select
                        required
                        value={selectedTaskId}
                        onChange={(e) => setSelectedTaskId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:bg-white focus:border-blue-400 font-semibold text-slate-800 transition-colors"
                      >
                        <option value="">-- Choose a Task --</option>
                        {availableTasks.map((t) => (
                          <option key={t.task.id} value={t.task.id}>
                            {t.task.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-slate-600 mb-1.5 font-bold uppercase tracking-wider text-[10px]">Hours Worked</label>
                    <div className="relative">
                      <input
                        type="number"
                        required
                        min="0.5"
                        step="0.5"
                        max="24"
                        value={hoursToLog}
                        onChange={(e) => setHoursToLog(Number(e.target.value))}
                        placeholder="e.g. 2.5"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 pl-9 outline-none focus:bg-white focus:border-blue-400 font-bold text-slate-800 transition-colors"
                      />
                      <Clock size={14} className="absolute left-3 top-3.5 text-slate-400" />
                      <span className="absolute right-4 top-3.5 text-slate-400 font-medium">hrs</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1.5 font-bold uppercase tracking-wider text-[10px]">Description of Work Done</label>
                    <textarea
                      required
                      rows={3}
                      value={workDescription}
                      onChange={(e) => setWorkDescription(e.target.value)}
                      placeholder="Detail the specific steps completed during this time..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:bg-white focus:border-blue-400 text-slate-700 transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!selectedTaskId || !selectedClientId}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  >
                    <Send size={16} /> Submit Timesheet
                  </button>
                </form>
              </div>
            </div>

            {/* Recent Time Logs */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="font-bold text-slate-800 text-sm">Your Recent Time Logs</h3>
              
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                {myTimesheets.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 text-sm font-medium">
                    You haven't logged any time yet.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                    {[...myTimesheets].reverse().slice(0, 20).map((log) => (
                      <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wider">
                              {log.clientName}
                            </span>
                            <span className="text-xs text-slate-500 font-medium">{log.date}</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-700 font-bold bg-slate-100 px-2.5 py-1 rounded-lg text-xs">
                            <Clock size={12} className="text-slate-500" />
                            {log.hours} hrs
                          </div>
                        </div>
                        <h4 className="text-sm font-bold text-slate-800 mb-1">{log.taskTitle || 'General Task'}</h4>
                        <p className="text-xs text-slate-500">{log.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Firm Overview Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Firm Hours Logged Today</p>
                <p className="text-3xl font-bold text-slate-800">{firmHoursToday}<span className="text-sm text-slate-400 font-medium ml-1">hrs</span></p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <Clock size={24} />
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Firm Hours This Week</p>
                <p className="text-3xl font-bold text-slate-800">{firmHoursWeek}<span className="text-sm text-slate-400 font-medium ml-1">hrs</span></p>
              </div>
              <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Activity size={24} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Employee Rankings */}
            <div className="xl:col-span-1">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Users size={16} className="text-blue-600" /> Employee Weekly Hours
                  </h3>
                </div>
                <div className="divide-y divide-slate-100 p-2">
                  {employeeWeekHours.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-xs">No hours logged this week.</div>
                  ) : (
                    employeeWeekHours.map((emp, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs">
                            {emp.name.charAt(0)}
                          </div>
                          <span className="text-sm font-semibold text-slate-700">{emp.name}</span>
                        </div>
                        <div className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                          {emp.hours}h
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Firm Recent Logs */}
            <div className="xl:col-span-2">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[500px]">
                <div className="p-4 border-b border-slate-100 bg-slate-50">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Activity size={16} className="text-blue-600" /> Firm-Wide Activity Feed
                  </h3>
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2">
                  {timesheets.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 text-sm font-medium">
                      No timesheets have been submitted yet.
                    </div>
                  ) : (
                    [...timesheets].reverse().slice(0, 50).map((log) => (
                      <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors rounded-xl">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs shrink-0">
                              {log.employeeName?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800">{log.employeeName}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                  {log.clientName}
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium">{log.date}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-slate-700 font-bold bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg text-xs">
                            <Clock size={12} className="text-slate-500" />
                            {log.hours} hrs
                          </div>
                        </div>
                        <h4 className="text-sm font-bold text-slate-700 mt-2 ml-11">{log.taskTitle || 'General Task'}</h4>
                        <p className="text-xs text-slate-500 mt-1 ml-11">{log.description}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  );
};

export const TimesheetView: React.FC = () => {
  const { currentUser } = useDashboardStore();
  if (!currentUser) return null;
  return <TimesheetContent currentUser={currentUser} />;
};
