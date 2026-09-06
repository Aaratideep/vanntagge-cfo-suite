'use client';
import React, { useState, useEffect } from 'react';
import { useDashboardStore } from '../../store/dashboardStore';
import { ClientTaskPreview, TaskGenerationResult } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  clientServiceId: string;
  clientServiceName?: string;
}

type Screen = 'preview' | 'result';

const priorityColors: Record<string, string> = {
  LOW: '#22c55e', MEDIUM: '#f59e0b', HIGH: '#f97316', URGENT: '#ef4444',
};

export default function ClientTaskGenerationModal({ isOpen, onClose, clientServiceId, clientServiceName }: Props) {
  const { previewClientTaskGeneration, generateClientTasks, currentUser } = useDashboardStore();

  const [screen, setScreen] = useState<Screen>('preview');
  const [previews, setPreviews] = useState<ClientTaskPreview[]>([]);
  const [result, setResult] = useState<TaskGenerationResult | null>(null);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setScreen('preview');
    setResult(null);
    setLoading(true);
    // Slight delay to allow store state to settle
    setTimeout(() => {
      const pv = previewClientTaskGeneration(clientServiceId);
      setPreviews(pv);
      setLoading(false);
    }, 100);
  }, [isOpen, clientServiceId]);

  if (!isOpen) return null;

  const canGenerate = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN';
  const newCount = previews.filter(p => !p.isDuplicate).length;
  const skipCount = previews.filter(p => p.isDuplicate).length;

  function handleGenerate() {
    if (!currentUser) return;
    setGenerating(true);
    setTimeout(() => {
      const r = generateClientTasks(clientServiceId, currentUser.id);
      setResult(r);
      setScreen('result');
      setGenerating(false);
    }, 300);
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
    }}>
      <div style={{
        background: '#0f172a', borderRadius: 18, width: '100%', maxWidth: 680,
        maxHeight: '88vh', display: 'flex', flexDirection: 'column',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 32px 100px rgba(0,0,0,0.7)',
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(168,85,247,0.15))',
          borderRadius: '18px 18px 0 0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#e2e8f0' }}>
              {screen === 'preview' ? '⚡ Generate Tasks' : '✅ Generation Complete'}
            </div>
            {clientServiceName && (
              <div style={{ fontSize: 12, color: '#a78bfa', marginTop: 2 }}>{clientServiceName}</div>
            )}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 20 }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '1.25rem 1.5rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: '#64748b', padding: '3rem 0' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
              <div>Loading preview…</div>
            </div>
          ) : screen === 'preview' ? (
            <>
              {/* Summary bar */}
              <div style={{ display: 'flex', gap: 12, marginBottom: '1.25rem' }}>
                {[
                  { label: 'Total tasks', value: previews.length, color: '#6366f1' },
                  { label: 'Will be created', value: newCount, color: '#22c55e' },
                  { label: 'Already exists (skip)', value: skipCount, color: '#f59e0b' },
                ].map(s => (
                  <div key={s.label} style={{
                    flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: 12,
                    padding: '0.75rem', textAlign: 'center', border: `1px solid ${s.color}30`,
                  }}>
                    <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {previews.length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: '3rem 1rem',
                  background: 'rgba(255,255,255,0.03)', borderRadius: 12,
                  border: '1px dashed rgba(255,255,255,0.1)', color: '#64748b',
                }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
                  <div style={{ fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>No tasks to generate</div>
                  <div style={{ fontSize: 13 }}>
                    This may be because no active Task Templates are configured for the enabled parameters of this service.
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {previews.map((p, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      background: p.isDuplicate ? 'rgba(251,191,36,0.05)' : 'rgba(99,102,241,0.06)',
                      border: `1px solid ${p.isDuplicate ? 'rgba(251,191,36,0.2)' : 'rgba(99,102,241,0.2)'}`,
                      borderRadius: 10, padding: '10px 14px',
                    }}>
                      {/* Status indicator */}
                      <div style={{ fontSize: 16, flexShrink: 0 }}>{p.isDuplicate ? '⏭️' : '➕'}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginBottom: 2 }}>{p.templateName}</div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                          <span style={{ fontSize: 11, color: '#94a3b8' }}>{p.parameterName}</span>
                          <span style={{ fontSize: 11, color: '#6366f1', background: 'rgba(99,102,241,0.15)', padding: '1px 8px', borderRadius: 999 }}>{p.periodKey}</span>
                          <span style={{ fontSize: 11, color: '#64748b' }}>Due: {p.dueDate}</span>
                          {p.estimatedHours > 0 && <span style={{ fontSize: 11, color: '#64748b' }}>{p.estimatedHours}h</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700, color: priorityColors[p.priority] || '#94a3b8',
                          background: `${priorityColors[p.priority] || '#94a3b8'}20`, padding: '2px 8px', borderRadius: 999,
                        }}>{p.priority}</span>
                        {p.isDuplicate && (
                          <span style={{ fontSize: 10, color: '#f59e0b', fontStyle: 'italic' }}>skip</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : result ? (
            <>
              {/* Result summary */}
              <div style={{ display: 'flex', gap: 12, marginBottom: '1.25rem' }}>
                {[
                  { label: 'Created', value: result.created, color: '#22c55e', icon: '✅' },
                  { label: 'Skipped', value: result.skipped, color: '#f59e0b', icon: '⏭️' },
                  { label: 'Failed', value: result.failed, color: '#ef4444', icon: '❌' },
                ].map(s => (
                  <div key={s.label} style={{
                    flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: 12,
                    padding: '0.75rem', textAlign: 'center', border: `1px solid ${s.color}30`,
                  }}>
                    <div style={{ fontSize: 24 }}>{s.icon}</div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: s.color, marginTop: 4 }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {result.details.map((d, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: d.status === 'created' ? 'rgba(34,197,94,0.07)' : d.status === 'skipped' ? 'rgba(245,158,11,0.07)' : 'rgba(239,68,68,0.07)',
                    border: `1px solid ${d.status === 'created' ? 'rgba(34,197,94,0.2)' : d.status === 'skipped' ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)'}`,
                    borderRadius: 8, padding: '8px 12px',
                  }}>
                    <span style={{ fontSize: 14 }}>
                      {d.status === 'created' ? '✅' : d.status === 'skipped' ? '⏭️' : '❌'}
                    </span>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 13, color: '#e2e8f0' }}>{d.title}</span>
                      {d.reason && <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 8 }}>— {d.reason}</span>}
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                      color: d.status === 'created' ? '#22c55e' : d.status === 'skipped' ? '#f59e0b' : '#ef4444',
                    }}>{d.status}</span>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', justifyContent: 'flex-end', gap: '0.75rem',
          borderRadius: '0 0 18px 18px',
        }}>
          <button onClick={onClose} style={ghostBtn}>
            {screen === 'result' ? 'Close' : 'Cancel'}
          </button>
          {screen === 'preview' && previews.length > 0 && canGenerate && newCount > 0 && (
            <button
              onClick={handleGenerate}
              disabled={generating}
              style={{
                padding: '8px 22px', borderRadius: 8, border: 'none', cursor: generating ? 'wait' : 'pointer',
                fontSize: 13, fontWeight: 700, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: '#fff', opacity: generating ? 0.7 : 1, transition: 'opacity 0.15s',
              }}
            >
              {generating ? 'Generating…' : `Generate ${newCount} Task${newCount !== 1 ? 's' : ''}`}
            </button>
          )}
          {screen === 'result' && (
            <button
              onClick={() => { setScreen('preview'); const pv = previewClientTaskGeneration(clientServiceId); setPreviews(pv); }}
              style={{ ...ghostBtn, color: '#818cf8' }}
            >
              Refresh Preview
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const ghostBtn: React.CSSProperties = {
  padding: '8px 20px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
  cursor: 'pointer', fontSize: 13, fontWeight: 600, background: 'rgba(255,255,255,0.05)',
  color: '#94a3b8', transition: 'opacity 0.15s',
};
