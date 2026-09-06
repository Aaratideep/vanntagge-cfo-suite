'use client';
import React from 'react';
import { useDashboardStore } from '../../store/dashboardStore';
import { Task } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  engagementId: string;
  onReassign?: (task: Task, engagementId: string) => void;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  NOT_STARTED:        { bg: 'rgba(148,163,184,0.15)', text: '#94a3b8' },
  ASSIGNED:           { bg: 'rgba(99,102,241,0.15)',  text: '#818cf8' },
  IN_PROGRESS:        { bg: 'rgba(59,130,246,0.15)',  text: '#60a5fa' },
  WAITING_FOR_CLIENT: { bg: 'rgba(245,158,11,0.15)', text: '#fbbf24' },
  REVIEW_PENDING:     { bg: 'rgba(168,85,247,0.15)', text: '#c084fc' },
  COMPLETED:          { bg: 'rgba(34,197,94,0.15)',  text: '#4ade80' },
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: '#22c55e', MEDIUM: '#f59e0b', HIGH: '#f97316', URGENT: '#ef4444',
};

function dueDateLabel(dueDate?: string): { label: string; color: string } | null {
  if (!dueDate) return null;
  const due = new Date(dueDate);
  const now = new Date(); now.setHours(0,0,0,0);
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / 86400000);
  if (diffDays < 0) return { label: `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays)!==1?'s':''}`, color: '#ef4444' };
  if (diffDays === 0) return { label: 'Due today', color: '#f97316' };
  if (diffDays <= 3) return { label: `Due in ${diffDays} day${diffDays!==1?'s':''}`, color: '#f59e0b' };
  return { label: new Date(dueDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}), color: '#94a3b8' };
}

export default function TaskDetailModal({ isOpen, onClose, task, engagementId, onReassign }: Props) {
  const { serviceCategories, users, engagements, currentUser } = useDashboardStore();

  if (!isOpen) return null;

  const sc = STATUS_COLORS[task.status] || STATUS_COLORS['NOT_STARTED'];
  const due = dueDateLabel(task.dueDate);
  const canReassign = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN';

  const serviceName = serviceCategories.flatMap(c => c.services).find(s => s.id === task.serviceId)?.name;
  const eng = engagements.find(e => e.id === engagementId);
  const clientName = eng?.clientCompanyName || eng?.name;

  const checklist = (task as any).checklist || [];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1300, background: 'rgba(0,0,0,0.78)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
    }}>
      <div style={{
        background: '#0f172a', borderRadius: 18, width: '100%', maxWidth: 620,
        maxHeight: '90vh', overflowY: 'auto',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 40px 120px rgba(0,0,0,0.8)',
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: 'linear-gradient(135deg,rgba(99,102,241,0.18),rgba(168,85,247,0.1))',
          borderRadius: '18px 18px 0 0',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#e2e8f0', lineHeight: 1.3, marginBottom: 6 }}>{task.title}</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 999, background: sc.bg, color: sc.text }}>{task.status.replace('_',' ')}</span>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 999, background: `${PRIORITY_COLORS[task.priority]}22`, color: PRIORITY_COLORS[task.priority] }}>{task.priority}</span>
              {due && <span style={{ fontSize: 10, fontWeight: 600, color: due.color }}>⏰ {due.label}</span>}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 20, flexShrink: 0 }}>✕</button>
        </div>

        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Details grid */}
          <section>
            <SectionTitle>Task Details</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px' }}>
              {[
                ['Client', clientName || '—'],
                ['Service', serviceName || '—'],
                ['Period', (task as any).periodKey || task.milestone || '—'],
                ['Due Date', task.dueDate || '—'],
                ['Est. Hours', task.estimatedHours ? `${task.estimatedHours} hrs` : '—'],
                ['Time Spent', task.timeSpent ? `${task.timeSpent} hrs` : '—'],
                ['Progress', task.progress ? `${task.progress}%` : '0%'],
                ['Task ID', task.id],
                ...(task.clientServiceId ? [['Service ID', task.clientServiceId]] : []),
                ...(task.taskTemplateId ? [['Template ID', task.taskTemplateId]] : []),
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0', marginTop: 1, wordBreak: 'break-all' }}>{String(v)}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Assignment info */}
          <section>
            <SectionTitle>Assignment</SectionTitle>
            {task.employeeId ? (
              <div style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, padding: '0.875rem 1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#fff' }}>
                    {(task.employeeName || 'E').charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#818cf8' }}>{task.employeeName}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{task.teamName || task.teamId || 'No team'}</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', fontSize: 11 }}>
                  {[
                    ['Assigned By', task.assignedByName || task.assignedBy || '—'],
                    ['Assigned At', task.assignedAt ? new Date(task.assignedAt).toLocaleString('en-IN') : '—'],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <span style={{ color: '#64748b' }}>{k}: </span>
                      <span style={{ color: '#94a3b8', fontWeight: 600 }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ color: '#64748b', fontSize: 13, fontStyle: 'italic', padding: '0.5rem 0' }}>Not yet assigned</div>
            )}
          </section>

          {/* Checklist */}
          {checklist.length > 0 && (
            <section>
              <SectionTitle>Checklist ({checklist.filter((c: any) => c.completed || c.isCompleted).length}/{checklist.length})</SectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {checklist.map((item: any, i: number) => {
                  const done = item.completed || item.isCompleted;
                  return (
                    <div key={item.id || i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                        background: done ? '#6366f1' : 'rgba(255,255,255,0.06)',
                        border: `1px solid ${done ? '#6366f1' : 'rgba(255,255,255,0.15)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff',
                      }}>{done ? '✓' : ''}</div>
                      <span style={{ fontSize: 13, color: done ? '#64748b' : '#e2e8f0', textDecoration: done ? 'line-through' : 'none' }}>
                        {item.text || item.item}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Assignment History */}
          {task.assignmentHistory && task.assignmentHistory.length > 0 && (
            <section>
              <SectionTitle>Assignment History</SectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {task.assignmentHistory.map((rec, i) => (
                  <div key={rec.id} style={{
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 10, padding: '0.75rem 1rem',
                    borderLeft: `3px solid ${i === task.assignmentHistory!.length - 1 ? '#6366f1' : 'rgba(255,255,255,0.1)'}`,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>
                          {rec.previousAssigneeId ? '🔄 Reassigned to' : '➕ Assigned to'} {rec.assignedToName}
                        </div>
                        {rec.previousAssigneeName && (
                          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>From: {rec.previousAssigneeName}</div>
                        )}
                        {rec.teamName && <div style={{ fontSize: 11, color: '#64748b' }}>Team: {rec.teamName}</div>}
                        {rec.reason && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3, fontStyle: 'italic' }}>"{rec.reason}"</div>}
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 11, color: '#64748b' }}>{new Date(rec.assignedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                        <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>by {rec.assignedByName}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Notes */}
          {task.notes && (
            <section>
              <SectionTitle>Notes</SectionTitle>
              <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6, background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '0.75rem 1rem' }}>{task.notes}</div>
            </section>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            {canReassign && task.status !== 'COMPLETED' && onReassign && (
              <button
                onClick={() => onReassign(task, engagementId)}
                style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid rgba(99,102,241,0.4)', background: 'rgba(99,102,241,0.1)', color: '#818cf8', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                🔄 {task.employeeId ? 'Reassign' : 'Assign'}
              </button>
            )}
          </div>
          <button onClick={onClose} style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.625rem', display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
      {children}
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
    </div>
  );
}
