'use client';
import React, { useState, useMemo } from 'react';
import { useDashboardStore } from '../../store/dashboardStore';
import { Task, TaskStatus, Priority } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  clientServiceId: string;
  clientServiceName?: string;
  clientId: string;
}

const STATUS_COLORS: Record<TaskStatus, { bg: string; text: string; label: string }> = {
  NOT_STARTED:      { bg: 'rgba(148,163,184,0.15)', text: '#94a3b8', label: 'Not Started' },
  IN_PROGRESS:      { bg: 'rgba(59,130,246,0.15)', text: '#60a5fa', label: 'In Progress' },
  WAITING_FOR_CLIENT: { bg: 'rgba(245,158,11,0.15)', text: '#fbbf24', label: 'Waiting Client' },
  REVIEW_PENDING:   { bg: 'rgba(168,85,247,0.15)', text: '#c084fc', label: 'Review Pending' },
  COMPLETED:        { bg: 'rgba(34,197,94,0.15)', text: '#4ade80', label: 'Completed' },
};

const PRIORITY_COLORS: Record<Priority, string> = {
  LOW: '#22c55e', MEDIUM: '#f59e0b', HIGH: '#f97316', URGENT: '#ef4444',
};

const ALL_STATUSES: TaskStatus[] = ['NOT_STARTED', 'IN_PROGRESS', 'WAITING_FOR_CLIENT', 'REVIEW_PENDING', 'COMPLETED'];
const ALL_PRIORITIES: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

export default function ClientTaskListModal({ isOpen, onClose, clientServiceId, clientServiceName, clientId }: Props) {
  const { engagements } = useDashboardStore();

  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'ALL'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'ALL'>('ALL');
  const [periodFilter, setPeriodFilter] = useState('');

  const allTasks: Task[] = useMemo(() => {
    return engagements
      .filter(e => e.clientId === clientId)
      .flatMap(e => e.tasks || [])
      .filter(t => (t as any).clientServiceId === clientServiceId);
  }, [engagements, clientId, clientServiceId]);

  const filteredTasks = useMemo(() => {
    return allTasks.filter(t => {
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
      if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;
      if (periodFilter) {
        const period = (t as any).periodKey || t.milestone || '';
        if (!period.includes(periodFilter)) return false;
      }
      return true;
    });
  }, [allTasks, statusFilter, priorityFilter, periodFilter]);

  if (!isOpen) return null;

  const statCounts = ALL_STATUSES.map(s => ({ status: s, count: allTasks.filter(t => t.status === s).length }));

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
    }}>
      <div style={{
        background: '#0f172a', borderRadius: 18, width: '100%', maxWidth: 820,
        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 32px 100px rgba(0,0,0,0.7)',
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(168,85,247,0.12))',
          borderRadius: '18px 18px 0 0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#e2e8f0' }}>📋 Task List</div>
            {clientServiceName && (
              <div style={{ fontSize: 12, color: '#a78bfa', marginTop: 2 }}>{clientServiceName}</div>
            )}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 20 }}>✕</button>
        </div>

        {/* Status overview */}
        <div style={{ padding: '1rem 1.5rem 0', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {statCounts.map(s => (
            <button
              key={s.status}
              onClick={() => setStatusFilter(statusFilter === s.status ? 'ALL' : s.status)}
              style={{
                padding: '4px 12px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600,
                background: statusFilter === s.status ? STATUS_COLORS[s.status].bg : 'rgba(255,255,255,0.04)',
                color: statusFilter === s.status ? STATUS_COLORS[s.status].text : '#64748b',
                transition: 'all 0.15s',
                opacity: s.count === 0 ? 0.4 : 1,
              }}
            >
              {STATUS_COLORS[s.status].label} ({s.count})
            </button>
          ))}
        </div>

        {/* Filters */}
        <div style={{ padding: '0.75rem 1.5rem', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value as Priority | 'ALL')}
            style={filterSelect}
          >
            <option value="ALL">All Priorities</option>
            {ALL_PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <input
            value={periodFilter}
            onChange={e => setPeriodFilter(e.target.value)}
            placeholder="Filter by period (e.g. 2026-09)"
            style={{ ...filterSelect, minWidth: 220 }}
          />
          <span style={{ fontSize: 12, color: '#64748b', marginLeft: 'auto' }}>
            {filteredTasks.length} / {allTasks.length} tasks
          </span>
        </div>

        {/* Table */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '0 1.5rem 1.5rem' }}>
          {filteredTasks.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '3rem 1rem', color: '#64748b',
              background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px dashed rgba(255,255,255,0.07)',
            }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
              <div style={{ fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>
                {allTasks.length === 0 ? 'No tasks generated yet' : 'No tasks match the current filters'}
              </div>
              {allTasks.length === 0 && (
                <div style={{ fontSize: 13 }}>
                  Use the <strong style={{ color: '#818cf8' }}>Generate Tasks</strong> button to create tasks from the configured templates.
                </div>
              )}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 6px' }}>
              <thead>
                <tr>
                  {['Task', 'Period', 'Due Date', 'Priority', 'Status', 'Checklist'].map(h => (
                    <th key={h} style={{ textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', padding: '4px 10px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map(task => {
                  const periodKey = (task as any).periodKey || task.milestone || '—';
                  const dueDate = (task as any).dueDate || '—';
                  const checklist = (task as any).checklist || [];
                  const completedChecks = checklist.filter((c: any) => c.completed).length;
                  const sc = STATUS_COLORS[task.status] || STATUS_COLORS['NOT_STARTED'];
                  return (
                    <tr key={task.id} style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '10px 10px', borderRadius: '8px 0 0 8px', color: '#e2e8f0', fontSize: 13, fontWeight: 500, maxWidth: 220 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</div>
                        {task.estimatedHours > 0 && (
                          <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>{task.estimatedHours}h est.</div>
                        )}
                      </td>
                      <td style={{ padding: '10px', color: '#818cf8', fontSize: 12, fontWeight: 500 }}>
                        {periodKey}
                      </td>
                      <td style={{ padding: '10px', color: '#94a3b8', fontSize: 12 }}>
                        {dueDate}
                      </td>
                      <td style={{ padding: '10px' }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 999,
                          color: PRIORITY_COLORS[task.priority] || '#94a3b8',
                          background: `${PRIORITY_COLORS[task.priority] || '#94a3b8'}20`,
                        }}>{task.priority}</span>
                      </td>
                      <td style={{ padding: '10px' }}>
                        <span style={{
                          fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 999,
                          background: sc.bg, color: sc.text,
                        }}>{sc.label}</span>
                      </td>
                      <td style={{ padding: '10px', borderRadius: '0 8px 8px 0' }}>
                        {checklist.length > 0 ? (
                          <div style={{ fontSize: 12, color: '#64748b' }}>
                            <span style={{ color: completedChecks === checklist.length ? '#4ade80' : '#94a3b8', fontWeight: 600 }}>
                              {completedChecks}/{checklist.length}
                            </span>
                            <div style={{ marginTop: 2, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, width: 60 }}>
                              <div style={{
                                height: '100%', borderRadius: 2,
                                width: `${checklist.length > 0 ? (completedChecks / checklist.length) * 100 : 0}%`,
                                background: '#6366f1',
                              }} />
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: 11, color: '#334155' }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '0.875rem 1.5rem',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', justifyContent: 'flex-end',
        }}>
          <button onClick={onClose} style={{
            padding: '8px 20px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
            cursor: 'pointer', fontSize: 13, fontWeight: 600, background: 'rgba(255,255,255,0.05)', color: '#94a3b8',
          }}>Close</button>
        </div>
      </div>
    </div>
  );
}

const filterSelect: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  padding: '6px 12px',
  color: '#e2e8f0',
  fontSize: 12,
  outline: 'none',
};
