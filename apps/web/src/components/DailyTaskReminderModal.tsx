'use client';

import React, { useState, useEffect } from 'react';
import { useDashboardStore } from '../store/dashboardStore';
import { Bell, Mail, X, CheckCircle2, User as UserIcon } from 'lucide-react';
import { Task, User } from '../types';

export const DailyTaskReminderModal: React.FC = () => {
  const { currentUser, engagements, users, addNotification } = useDashboardStore();
  const [show, setShow] = useState(false);
  const [employeeTasks, setEmployeeTasks] = useState<{ user: User; pendingTasks: Task[] }[]>([]);
  const [remindersSent, setRemindersSent] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Only show for Admin roles
    if (
      !currentUser ||
      currentUser.role !== 'SUPER_ADMIN'
    ) {
      return;
    }

    const todayDate = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
    const lastShown = localStorage.getItem('vantage_daily_reminder');

    if (lastShown === todayDate) {
      return; // Already shown today
    }

    // Aggregate pending tasks
    const allTasks = engagements.flatMap((e) => e.tasks || []);
    const pendingTasks = allTasks.filter((t) => t.status !== 'COMPLETED');

    if (pendingTasks.length === 0) {
      localStorage.setItem('vantage_daily_reminder', todayDate);
      return; // Nothing to remind about
    }

    // Group by employee
    const grouped = pendingTasks.reduce((acc, task) => {
      const empId = task.employeeId;
      if (empId) {
        if (!acc[empId]) acc[empId] = [];
        acc[empId].push(task);
      }
      return acc;
    }, {} as Record<string, Task[]>);

    const mappedEmployees = Object.keys(grouped)
      .map((empId) => {
        const user = users.find((u) => u.id === empId);
        if (user) {
          return { user, pendingTasks: grouped[empId] };
        }
        return null;
      })
      .filter(Boolean) as { user: User; pendingTasks: Task[] }[];

    if (mappedEmployees.length > 0) {
      setEmployeeTasks(mappedEmployees);
      setShow(true);
    } else {
      localStorage.setItem('vantage_daily_reminder', todayDate);
    }
  }, [currentUser, engagements, users]);

  const handleDismiss = () => {
    const todayDate = new Date().toLocaleDateString('en-CA');
    localStorage.setItem('vantage_daily_reminder', todayDate);
    setShow(false);
  };

  const handleSendAppReminder = (empId: string, empName: string, taskCount: number) => {
    // Note: Since this is a demo, we push a global notification, 
    // but in a real app this would go specifically to the employee's ID.
    addNotification(
      'Daily Workload Reminder',
      `Reminder sent to ${empName} to complete their ${taskCount} pending tasks.`,
      '/work'
    );
    setRemindersSent((prev) => ({ ...prev, [empId]: true }));
  };

  const handleSendEmailReminder = (user: User, tasks: Task[]) => {
    const subject = encodeURIComponent('Action Required: Pending Tasks Reminder');
    const taskList = tasks.map(t => `- ${t.title} (${t.priority})`).join('%0D%0A');
    const body = encodeURIComponent(
      `Hi ${user.name},%0D%0A%0D%0AThis is a quick reminder regarding your pending tasks on the Vantage CFO Suite.%0D%0A%0D%0AYou currently have ${tasks.length} incomplete tasks:%0D%0A${taskList}%0D%0A%0D%0APlease review and update their progress on the dashboard.%0D%0A%0D%0AThanks!`
    );
    
    // Fallback if user email is dummy or missing
    const emailToUse = user.email || 'employee@vanntagge.com';
    window.location.href = `mailto:${emailToUse}?subject=${subject}&body=${body}`;
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={handleDismiss} />
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl relative z-10 overflow-hidden animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <div className="bg-primary px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl">
              <Bell size={20} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Daily Task Summary</h2>
              <p className="text-primary-50 text-xs opacity-90">Overview of pending workloads for your team</p>
            </div>
          </div>
          <button 
            onClick={handleDismiss}
            className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <div className="space-y-4">
            {employeeTasks.map(({ user, pendingTasks }) => (
              <div key={user.id} className="premium-card p-4 border border-outline-variant/30 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-surface-container-lowest">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-on-surface text-sm">{user.name}</h3>
                    <p className="text-xs text-outline font-medium">
                      <span className="text-amber-600 font-bold">{pendingTasks.length}</span> pending tasks
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleSendAppReminder(user.id, user.name, pendingTasks.length)}
                    disabled={remindersSent[user.id]}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      remindersSent[user.id] 
                        ? 'bg-green-50 text-green-600 border border-green-200 cursor-not-allowed'
                        : 'bg-surface border border-outline-variant/50 text-on-surface hover:border-primary/40 hover:text-primary shadow-sm'
                    }`}
                  >
                    {remindersSent[user.id] ? (
                      <>
                        <CheckCircle2 size={14} /> Sent
                      </>
                    ) : (
                      <>
                        <Bell size={14} /> App Alert
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleSendEmailReminder(user, pendingTasks)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl text-xs font-bold transition-all shadow-sm"
                  >
                    <Mail size={14} />
                    Email
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-surface-container-low px-6 py-4 flex justify-end border-t border-outline-variant/20">
          <button
            onClick={handleDismiss}
            className="px-6 py-2 bg-primary text-white rounded-xl font-bold text-sm shadow-md hover:bg-primary/90 transition-all active:scale-[0.98]"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};
