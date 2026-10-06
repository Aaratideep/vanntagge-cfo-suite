'use client';
import React, { useState, useEffect } from 'react';
import { useDashboardStore } from '../../store/dashboardStore';
import { TaskTemplate, Priority } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  serviceId: string;
  parameterId: string;
  parameterName: string;
  /** Pass existing template to edit; undefined = add new */
  existingTemplate?: TaskTemplate;
}

const FREQUENCIES = ['ONE_TIME', 'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY'];
const PRIORITIES: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const ROLES = ['EMPLOYEE', 'ADMIN', 'SUPER_ADMIN'];

const DUE_DATE_RULE_PRESETS = [
  { label: 'Last day of period', value: 'last_day' },
  { label: '5th of following month', value: '5th_following_month' },
  { label: '7th of following month', value: '7th_following_month' },
  { label: '15th of following month', value: '15th_following_month' },
  { label: '20th of following month', value: '20th_following_month' },
  { label: '7th of current month', value: '7th_current_month' },
  { label: '15th of current month', value: '15th_current_month' },
  { label: '10 days after period end', value: '10d_after_period_end' },
  { label: '15 days after period end', value: '15d_after_period_end' },
  { label: '30 days after period end', value: '30d_after_period_end' },
  { label: 'Manual date', value: '__manual__' },
];

function uid() {
  return `ci-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
}

export default function TaskTemplateModal({
  isOpen,
  onClose,
  serviceId,
  parameterId,
  parameterName,
  existingTemplate,
}: Props) {
  const { addTaskTemplate, updateTaskTemplate, currentUser } = useDashboardStore();

  const isEdit = !!existingTemplate;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState('MONTHLY');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [dueDateRulePreset, setDueDateRulePreset] = useState('last_day');
  const [manualDate, setManualDate] = useState('');
  const [estimatedHours, setEstimatedHours] = useState(2);
  const [defaultRole, setDefaultRole] = useState('EMPLOYEE');
  const [reviewerRole, setReviewerRole] = useState('ADMIN');
  const [checklist, setChecklist] = useState<{ id: string; text: string }[]>([]);
  const [newCheckItem, setNewCheckItem] = useState('');
  const [active, setActive] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (existingTemplate) {
      setName(existingTemplate.name);
      setDescription(existingTemplate.description || '');
      setFrequency(existingTemplate.frequency);
      setPriority(existingTemplate.priority);
      const isManual = existingTemplate.dueDateRule.startsWith('manual:');
      setDueDateRulePreset(isManual ? '__manual__' : existingTemplate.dueDateRule);
      setManualDate(isManual ? existingTemplate.dueDateRule.replace('manual:', '') : '');
      setEstimatedHours(existingTemplate.estimatedHours);
      setDefaultRole(existingTemplate.defaultRole || 'EMPLOYEE');
      setReviewerRole(existingTemplate.reviewerRole || 'ADMIN');
      setChecklist(existingTemplate.checklist || []);
      setActive(existingTemplate.active);
    } else {
      setName(''); setDescription(''); setFrequency('MONTHLY'); setPriority('MEDIUM');
      setDueDateRulePreset('last_day'); setManualDate(''); setEstimatedHours(2);
      setDefaultRole('EMPLOYEE'); setReviewerRole('ADMIN'); setChecklist([]); setActive(true);
    }
    setError('');
  }, [isOpen, existingTemplate]);

  if (!isOpen) return null;

  const effectiveDueDateRule =
    dueDateRulePreset === '__manual__'
      ? manualDate ? `manual:${manualDate}` : ''
      : dueDateRulePreset;

  function addCheckItem() {
    if (!newCheckItem.trim()) return;
    setChecklist(prev => [...prev, { id: uid(), text: newCheckItem.trim() }]);
    setNewCheckItem('');
  }

  function removeCheckItem(id: string) {
    setChecklist(prev => prev.filter(c => c.id !== id));
  }

  function handleSave() {
    setError('');
    if (!name.trim()) { setError('Task name is required.'); return; }
    if (dueDateRulePreset === '__manual__' && !manualDate) { setError('Please select a manual due date.'); return; }

    setSaving(true);
    const payload = {
      serviceParameterId: parameterId,
      serviceId,
      name: name.trim(),
      description: description.trim() || undefined,
      frequency,
      priority,
      dueDateRule: effectiveDueDateRule,
      estimatedHours,
      defaultRole,
      reviewerRole,
      checklist: checklist.length > 0 ? checklist : undefined,
      active,
    };

    try {
      if (isEdit && existingTemplate) {
        updateTaskTemplate(serviceId, parameterId, existingTemplate.id, payload);
      } else {
        addTaskTemplate(serviceId, parameterId, payload);
      }
      onClose();
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  }

  const priorityColors: Record<Priority, string> = {
    LOW: '#22c55e', MEDIUM: '#f59e0b', HIGH: '#f97316', URGENT: '#ef4444',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
    }}>
      <div style={{
        background: '#1a1a2e', borderRadius: 16, width: '100%', maxWidth: 640,
        maxHeight: '90vh', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.1))',
          borderRadius: '16px 16px 0 0',
        }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0' }}>
              {isEdit ? 'Edit Task Template' : 'Add Task Template'}
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
              Parameter: <span style={{ color: '#a78bfa' }}>{parameterName}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: 4 }}>✕</button>
        </div>

        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {error && (
            <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 8, padding: '0.6rem 1rem', color: '#fca5a5', fontSize: 13 }}>
              {error}
            </div>
          )}

          {/* Task Name */}
          <Field label="Task Name *">
            <input
              value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. Prepare Monthly P&L Statement"
              style={inputStyle}
            />
          </Field>

          {/* Description */}
          <Field label="Description">
            <textarea
              value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Optional: describe what this task involves..."
              rows={2}
              style={{ ...inputStyle, resize: 'vertical', minHeight: 60 }}
            />
          </Field>

          {/* Frequency + Priority row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Field label="Frequency">
              <select value={frequency} onChange={e => setFrequency(e.target.value)} style={inputStyle}>
                {FREQUENCIES.map(f => <option key={f} value={f}>{f.replace('_', ' ')}</option>)}
              </select>
            </Field>
            <Field label="Priority">
              <select value={priority} onChange={e => setPriority(e.target.value as Priority)} style={{ ...inputStyle, color: priorityColors[priority] }}>
                {PRIORITIES.map(p => <option key={p} value={p} style={{ color: priorityColors[p] }}>{p}</option>)}
              </select>
            </Field>
          </div>

          {/* Due Date Rule */}
          <Field label="Due Date Rule">
            <select value={dueDateRulePreset} onChange={e => setDueDateRulePreset(e.target.value)} style={inputStyle}>
              {DUE_DATE_RULE_PRESETS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </Field>
          {dueDateRulePreset === '__manual__' && (
            <Field label="Manual Due Date">
              <input type="date" value={manualDate} onChange={e => setManualDate(e.target.value)} style={inputStyle} />
            </Field>
          )}

          {/* Estimated Hours + Roles */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <Field label="Est. Hours">
              <input type="number" min={0} step={0.5} value={estimatedHours}
                onChange={e => setEstimatedHours(parseFloat(e.target.value) || 0)}
                style={inputStyle} />
            </Field>
            <Field label="Default Role">
              <select value={defaultRole} onChange={e => setDefaultRole(e.target.value)} style={inputStyle}>
                {ROLES.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
              </select>
            </Field>
            <Field label="Reviewer Role">
              <select value={reviewerRole} onChange={e => setReviewerRole(e.target.value)} style={inputStyle}>
                {ROLES.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
              </select>
            </Field>
          </div>

          {/* Checklist */}
          <Field label="Checklist Items">
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                value={newCheckItem} onChange={e => setNewCheckItem(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCheckItem())}
                placeholder="Add checklist item (Enter to add)"
                style={{ ...inputStyle, flex: 1 }}
              />
              <button onClick={addCheckItem} style={{ ...btnStyle, background: 'rgba(99,102,241,0.3)', padding: '0 14px' }}>+</button>
            </div>
            {checklist.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {checklist.map((item, idx) => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '6px 10px' }}>
                    <span style={{ color: '#6366f1', fontWeight: 700, fontSize: 12, minWidth: 20 }}>{idx + 1}.</span>
                    <span style={{ flex: 1, color: '#cbd5e1', fontSize: 13 }}>{item.text}</span>
                    <button onClick={() => removeCheckItem(item.id)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 14 }}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </Field>

          {/* Active toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <label style={{ color: '#94a3b8', fontSize: 13 }}>Active</label>
            <button
              onClick={() => setActive(prev => !prev)}
              style={{
                width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                background: active ? '#6366f1' : '#374151', position: 'relative', transition: 'background 0.2s',
              }}
            >
              <span style={{
                position: 'absolute', top: 3, left: active ? 22 : 3,
                width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s',
              }} />
            </button>
            <span style={{ fontSize: 12, color: active ? '#818cf8' : '#64748b' }}>{active ? 'Yes' : 'No'}</span>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '1rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', justifyContent: 'flex-end', gap: '0.75rem',
          borderRadius: '0 0 16px 16px',
        }}>
          <button onClick={onClose} style={{ ...btnStyle, background: 'rgba(255,255,255,0.06)', color: '#94a3b8' }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} style={{ ...btnStyle, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : isEdit ? 'Update Template' : 'Add Template'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 8,
  padding: '8px 12px',
  color: '#e2e8f0',
  fontSize: 14,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};

const btnStyle: React.CSSProperties = {
  padding: '8px 20px',
  borderRadius: 8,
  border: 'none',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
  transition: 'opacity 0.15s',
};
