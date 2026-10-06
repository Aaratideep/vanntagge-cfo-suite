'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useDashboardStore } from '../../store/dashboardStore';
import { Task, EmployeeWorkloadSummary } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  engagementId: string;
}

type Screen = 'form' | 'overload' | 'success';

function UtilBar({ pct }: { pct: number }) {
  const color = pct >= 100 ? '#ef4444' : pct >= 80 ? '#f59e0b' : '#22c55e';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color, minWidth: 36 }}>{pct}%</span>
    </div>
  );
}

export default function TaskAssignModal({ isOpen, onClose, task, engagementId }: Props) {
  const { users, serviceCategories, assignTask, reassignTask, getEmployeeWorkload, currentUser } = useDashboardStore();

  const isReassign = !!task.employeeId;

  const [screen, setScreen] = useState<Screen>('form');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [reason, setReason] = useState('');
  const [pendingWarning, setPendingWarning] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successDetails, setSuccessDetails] = useState<{ employeeName: string; dueDate?: string } | null>(null);

  // Service template's required role (if any)
  const requiredRole: string | undefined = useMemo(() => {
    const svc = serviceCategories.flatMap(c => c.services).find(s => s.id === task.serviceId);
    if (!svc) return undefined;
    for (const param of svc.parameters) {
      const tmpl = (param.taskTemplates || []).find(t => t.id === (task as any).taskTemplateId);
      if (tmpl?.defaultRole) return tmpl.defaultRole;
    }
    return undefined;
  }, [serviceCategories, task]);

  // Eligible employees — sorted: role match → team match → workload ascending
  const eligibleEmployees = useMemo(() => {
    const candidates = users.filter(u => u.role !== 'CLIENT' && u.role !== 'PENDING' && u.status !== 'RESIGNED');
    return candidates
      .map(u => ({
        user: u,
        workload: getEmployeeWorkload(u.id),
        roleMatch: !requiredRole || u.role === requiredRole || u.designation?.toLowerCase().includes(requiredRole.toLowerCase()),
        teamMatch: !selectedTeam || u.department === selectedTeam,
      }))
      .sort((a, b) => {
        // Role match first
        if (a.roleMatch && !b.roleMatch) return -1;
        if (!a.roleMatch && b.roleMatch) return 1;
        // Team match second
        if (a.teamMatch && !b.teamMatch) return -1;
        if (!a.teamMatch && b.teamMatch) return 1;
        // Lowest utilization last
        return a.workload.utilizationPct - b.workload.utilizationPct;
      });
  }, [users, requiredRole, selectedTeam, getEmployeeWorkload]);

  // Departments
  const departments = useMemo(() => {
    const seen = new Set<string>();
    return users.filter(u => u.department).map(u => u.department!).filter(d => { if (seen.has(d)) return false; seen.add(d); return true; });
  }, [users]);

  // Selected employee workload preview
  const selectedWorkload: EmployeeWorkloadSummary | null = useMemo(() => {
    if (!selectedEmployeeId) return null;
    return getEmployeeWorkload(selectedEmployeeId);
  }, [selectedEmployeeId, getEmployeeWorkload]);

  const projectedHours = selectedWorkload
    ? selectedWorkload.assignedHoursThisWeek + (Number(task.estimatedHours) || 0)
    : 0;
  const isOverload = selectedWorkload ? projectedHours > selectedWorkload.weeklyCapacityHours : false;

  const serviceName = useMemo(() =>
    serviceCategories.flatMap(c => c.services).find(s => s.id === task.serviceId)?.name,
    [serviceCategories, task.serviceId]
  );

  useEffect(() => {
    if (!isOpen) return;
    setScreen('form');
    setSelectedEmployeeId(isReassign ? '' : '');
    setSelectedTeam('');
    setReason('');
    setError('');
    setPendingWarning('');
    setSuccessDetails(null);
  }, [isOpen]);

  if (!isOpen || !currentUser) return null;

  function handleSubmit() {
    setError('');
    if (!selectedEmployeeId) { setError('Please select an employee.'); return; }
    if (isReassign && !reason.trim()) { setError('A reason is required for reassignment.'); return; }
    setLoading(true);

    const params = {
      engagementId,
      taskId: task.id,
      newEmployeeId: selectedEmployeeId,
      employeeId: selectedEmployeeId,
      teamId: selectedTeam || undefined,
      assignedBy: currentUser!.id,
      reason: reason.trim() || undefined,
    };

    const result = isReassign
      ? reassignTask({ ...params, reason: reason.trim() })
      : assignTask(params);

    setLoading(false);

    if (!result.success && !result.warning) {
      setError(result.error || 'Assignment failed.');
      return;
    }

    if (result.warning && !result.success) {
      // This shouldn't happen with our logic, but guard anyway
      setError(result.error || 'Assignment failed.');
      return;
    }

    if (result.warning) {
      setPendingWarning(result.warning);
      setScreen('overload');
      return;
    }

    const emp = users.find(u => u.id === selectedEmployeeId);
    setSuccessDetails({ employeeName: emp?.name || selectedEmployeeId, dueDate: task.dueDate });
    setScreen('success');
  }

  function handleOverrideAssign() {
    setLoading(true);
    const params = {
      engagementId,
      taskId: task.id,
      newEmployeeId: selectedEmployeeId,
      employeeId: selectedEmployeeId,
      teamId: selectedTeam || undefined,
      assignedBy: currentUser!.id,
      reason: reason.trim() || 'Overload override',
      overrideWarning: true,
    };
    const result = isReassign
      ? reassignTask({ ...params, reason: reason.trim() || 'Overload override' })
      : assignTask({ ...params });
    setLoading(false);
    if (!result.success) { setError(result.error || 'Assignment failed.'); setScreen('form'); return; }
    const emp = users.find(u => u.id === selectedEmployeeId);
    setSuccessDetails({ employeeName: emp?.name || selectedEmployeeId, dueDate: task.dueDate });
    setScreen('success');
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1300, background: 'rgba(0,0,0,0.8)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
    }}>
      <div style={{
        background: '#0f172a', borderRadius: 18, width: '100%', maxWidth: 580,
        maxHeight: '90vh', overflowY: 'auto',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 40px 120px rgba(0,0,0,0.8)',
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: 'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(168,85,247,0.12))',
          borderRadius: '18px 18px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#e2e8f0' }}>
              {screen === 'success' ? '✅ Task Assigned' : screen === 'overload' ? '⚠️ Workload Warning' : isReassign ? '🔄 Reassign Task' : '⚡ Assign Task'}
            </div>
            {screen === 'form' && <div style={{ fontSize: 12, color: '#a78bfa', marginTop: 2 }}>{task.title}</div>}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 20 }}>✕</button>
        </div>

        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
          {/* ── FORM SCREEN ─────────────────────────────────────────────────── */}
          {screen === 'form' && (
            <>
              {/* Task summary */}
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '0.875rem 1rem', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', fontSize: 12 }}>
                  {[
                    ['Task', task.title],
                    ['Priority', task.priority],
                    ['Est. Hours', task.estimatedHours ? `${task.estimatedHours} hrs` : '—'],
                    ['Due Date', task.dueDate || '—'],
                    ['Period', (task as any).periodKey || task.milestone || '—'],
                    ...(serviceName ? [['Service', serviceName]] : []),
                    ...(requiredRole ? [['Required Role', requiredRole]] : []),
                    ...(isReassign ? [['Current Assignee', task.employeeName || '—']] : []),
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ color: '#64748b', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k}</span>
                      <span style={{ color: '#e2e8f0', fontWeight: 600, marginTop: 1 }}>{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Team filter */}
              <div>
                <label style={labelStyle}>Filter by Team (Department)</label>
                <select value={selectedTeam} onChange={e => setSelectedTeam(e.target.value)} style={inputStyle}>
                  <option value="">All Teams</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              {/* Employee select */}
              <div>
                <label style={labelStyle}>
                  Select Employee
                  {requiredRole && <span style={{ color: '#f59e0b', marginLeft: 6, fontSize: 11 }}>(Role: {requiredRole})</span>}
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 240, overflowY: 'auto' }}>
                  {eligibleEmployees.map(({ user, workload, roleMatch, teamMatch }) => {
                    const isSelected = selectedEmployeeId === user.id;
                    const wouldOverload = (workload.assignedHoursThisWeek + (Number(task.estimatedHours) || 0)) > workload.weeklyCapacityHours;
                    return (
                      <button
                        key={user.id}
                        onClick={() => setSelectedEmployeeId(user.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          background: isSelected ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${isSelected ? '#6366f1' : 'rgba(255,255,255,0.07)'}`,
                          borderRadius: 10, padding: '10px 12px', cursor: 'pointer', textAlign: 'left',
                          width: '100%', transition: 'all 0.15s',
                          opacity: workload.isOnLeave ? 0.5 : 1,
                        }}
                      >
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: isSelected ? '#6366f1' : 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                          {user.name.charAt(0)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{user.name}</span>
                            {roleMatch && <span style={{ fontSize: 9, fontWeight: 700, background: 'rgba(34,197,94,0.2)', color: '#4ade80', padding: '1px 6px', borderRadius: 999 }}>✓ Role</span>}
                            {teamMatch && selectedTeam && <span style={{ fontSize: 9, fontWeight: 700, background: 'rgba(99,102,241,0.2)', color: '#818cf8', padding: '1px 6px', borderRadius: 999 }}>✓ Team</span>}
                            {workload.isOnLeave && <span style={{ fontSize: 9, fontWeight: 700, background: 'rgba(245,158,11,0.2)', color: '#f59e0b', padding: '1px 6px', borderRadius: 999 }}>ON LEAVE</span>}
                            {wouldOverload && <span style={{ fontSize: 9, fontWeight: 700, background: 'rgba(239,68,68,0.2)', color: '#ef4444', padding: '1px 6px', borderRadius: 999 }}>⚠ OVERLOAD</span>}
                          </div>
                          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                            {user.designation || user.role} · {user.department || 'No Team'}
                          </div>
                          <div style={{ marginTop: 5 }}>
                            <UtilBar pct={workload.utilizationPct} />
                            <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{workload.assignedHoursThisWeek}/{workload.weeklyCapacityHours} hrs · {workload.totalOpenTasks} open tasks</div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Workload preview */}
              {selectedWorkload && (
                <div style={{
                  background: isOverload ? 'rgba(239,68,68,0.08)' : 'rgba(99,102,241,0.08)',
                  border: `1px solid ${isOverload ? 'rgba(239,68,68,0.3)' : 'rgba(99,102,241,0.3)'}`,
                  borderRadius: 10, padding: '0.875rem 1rem',
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>Workload Preview — {selectedWorkload.userName}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {[
                      { label: 'Current', value: `${selectedWorkload.assignedHoursThisWeek}h`, color: '#94a3b8' },
                      { label: 'This task', value: `+${task.estimatedHours || 0}h`, color: '#6366f1' },
                      { label: 'After', value: `${projectedHours}h / ${selectedWorkload.weeklyCapacityHours}h`, color: isOverload ? '#ef4444' : '#22c55e' },
                    ].map(s => (
                      <div key={s.label} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: 10, color: '#64748b' }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reason (required for reassign) */}
              {isReassign && (
                <div>
                  <label style={labelStyle}>Reason for Reassignment *</label>
                  <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Why is this task being reassigned?" rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
                </div>
              )}

              {error && <ErrorBox msg={error} />}
            </>
          )}

          {/* ── OVERLOAD SCREEN ──────────────────────────────────────────────── */}
          {screen === 'overload' && (
            <>
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#f97316', marginBottom: 8 }}>Workload Overload</div>
                <div style={{ fontSize: 13, color: '#94a3b8', maxWidth: 400, margin: '0 auto' }}>{pendingWarning}</div>
              </div>
              <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: '0.875rem 1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, textAlign: 'center' }}>
                  {selectedWorkload && [
                    { label: 'Current', value: `${selectedWorkload.assignedHoursThisWeek}h`, color: '#94a3b8' },
                    { label: 'This task', value: `${task.estimatedHours || 0}h`, color: '#f97316' },
                    { label: 'After', value: `${projectedHours}h / ${selectedWorkload.weeklyCapacityHours}h`, color: '#ef4444' },
                  ].map(s => (
                    <div key={s.label}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>
                Only proceed if you are authorized to override capacity limits.
              </div>
            </>
          )}

          {/* ── SUCCESS SCREEN ───────────────────────────────────────────────── */}
          {screen === 'success' && successDetails && (
            <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#22c55e', marginBottom: 8 }}>Task Assigned!</div>
              <div style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 12, padding: '1rem', textAlign: 'left', display: 'inline-block', minWidth: 300 }}>
                {[
                  ['Task', task.title],
                  ['Assigned To', successDetails.employeeName],
                  ...(successDetails.dueDate ? [['Due', successDetails.dueDate]] : []),
                  ['Status', 'ASSIGNED'],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 24, padding: '4px 0' }}>
                    <span style={{ fontSize: 12, color: '#64748b' }}>{k}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          {screen === 'form' && (
            <>
              <button onClick={onClose} style={ghostBtn}>Cancel</button>
              <button onClick={handleSubmit} disabled={loading || !selectedEmployeeId} style={{ ...primaryBtn, opacity: loading || !selectedEmployeeId ? 0.6 : 1 }}>
                {loading ? 'Assigning…' : isReassign ? 'Reassign Task' : 'Assign Task'}
              </button>
            </>
          )}
          {screen === 'overload' && (
            <>
              <button onClick={() => setScreen('form')} style={ghostBtn}>← Back</button>
              <button onClick={() => { setPendingWarning(''); onClose(); }} style={{ ...ghostBtn, color: '#94a3b8' }}>Cancel</button>
              <button onClick={handleOverrideAssign} disabled={loading} style={{ ...primaryBtn, background: 'linear-gradient(135deg,#ef4444,#f97316)', opacity: loading ? 0.6 : 1 }}>
                {loading ? 'Assigning…' : 'Assign Anyway'}
              </button>
            </>
          )}
          {screen === 'success' && (
            <button onClick={onClose} style={primaryBtn}>Done</button>
          )}
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: '#94a3b8',
  textTransform: 'uppercase', letterSpacing: '0.06em',
  display: 'block', marginBottom: 6,
};
const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 8, padding: '8px 12px', color: '#e2e8f0', fontSize: 13,
  outline: 'none', width: '100%', boxSizing: 'border-box',
};
const ghostBtn: React.CSSProperties = {
  padding: '8px 20px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
  cursor: 'pointer', fontSize: 13, fontWeight: 600, background: 'rgba(255,255,255,0.05)', color: '#94a3b8',
};
const primaryBtn: React.CSSProperties = {
  padding: '8px 22px', borderRadius: 8, border: 'none', cursor: 'pointer',
  fontSize: 13, fontWeight: 700, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff',
};
function ErrorBox({ msg }: { msg: string }) {
  return (
    <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: 8, padding: '8px 12px', color: '#fca5a5', fontSize: 13 }}>
      {msg}
    </div>
  );
}
