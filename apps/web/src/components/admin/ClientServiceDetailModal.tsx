'use client';

import React, { useState } from 'react';
import { X, CheckCircle2, FileText, Zap, ListChecks } from 'lucide-react';
import { useDashboardStore } from '../../store/dashboardStore';
import { ClientService } from '../../types';
import ClientTaskGenerationModal from './ClientTaskGenerationModal';
import ClientTaskListModal from './ClientTaskListModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  clientService: ClientService;
  clientName: string;
}

const formatDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export const ClientServiceDetailModal: React.FC<Props> = ({ isOpen, onClose, clientService, clientName }) => {
  const { serviceCategories, clientDocuments, engagements, users, currentUser } = useDashboardStore();

  const [genModalOpen, setGenModalOpen] = useState(false);
  const [taskListOpen, setTaskListOpen] = useState(false);

  if (!isOpen) return null;

  const cs = clientService;
  const snapshot = cs.configurationSnapshot;
  const liveDef = serviceCategories.flatMap(c => c.services).find(s => s.id === cs.serviceMasterId);
  const serviceName = snapshot?.serviceName || liveDef?.name || 'Unknown Service';
  const frequency = cs.frequency || snapshot?.frequency || liveDef?.frequency || 'Monthly';
  const categoryName = snapshot?.categoryName || serviceCategories.find(c => c.services.some(s => s.id === cs.serviceMasterId))?.name || 'Unknown';

  const approvedDocs = clientDocuments.filter((d: any) => cs.documentIds?.includes(d.id));
  const requiredDocDefs = liveDef?.requiredDocuments || [];
  const docDetails = approvedDocs.map((d: any) => {
    const req = requiredDocDefs.find(r => r.id === d.documentRequirementId);
    return { ...d, requirementName: req?.name || d.fileName };
  });

  const activatorUser = users.find(u => u.id === cs.activatedBy);
  const activatedByName = activatorUser?.name || cs.activatedBy || '—';

  const taskCount = engagements
    .filter(e => e.clientId === cs.clientId)
    .flatMap(e => e.tasks || [])
    .filter((t: any) => t.clientServiceId === cs.id).length;

  const reportCount = engagements
    .filter(e => e.clientId === cs.clientId)
    .flatMap(e => e.reports || []).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col relative z-10 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Service Details</h2>
            <p className="text-xs text-slate-500 mt-0.5">{clientName} · {serviceName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          <div className={`rounded-xl px-4 py-3 flex items-center justify-between ${cs.status === 'ACTIVE' ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-50 border border-slate-200'}`}>
            <span className="text-sm font-bold text-slate-700">Status</span>
            <span className={`text-sm font-bold px-3 py-1 rounded-full ${cs.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
              {cs.status}
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Service Information</h4>
            </div>
            <div className="divide-y divide-slate-100 text-sm">
              {[
                { label: 'Client', value: clientName, mono: false },
                { label: 'Service', value: serviceName, mono: false },
                { label: 'Category', value: categoryName, mono: false },
                { label: 'Frequency', value: frequency, mono: false },
                { label: 'Start Date', value: formatDate(cs.startDate), mono: false },
                { label: 'Activated At', value: formatDate(cs.activatedAt), mono: false },
                { label: 'Activated By', value: activatedByName, mono: false },
                { label: 'Service Master ID', value: cs.serviceMasterId, mono: true },
                { label: 'Client Service ID', value: cs.id, mono: true },
              ].map(({ label, value, mono }) => (
                <div key={label} className="flex justify-between items-center px-4 py-2.5">
                  <span className="text-slate-500">{label}</span>
                  <span className={`font-semibold text-slate-800 text-right ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {snapshot && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Configuration Snapshot</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Locked at {formatDate(snapshot.snapshotAt)} — immune to Service Master changes</p>
              </div>
              <div className="p-4">
                {snapshot.parameters && snapshot.parameters.length > 0 ? (
                  <div className="space-y-2">
                    {snapshot.parameters.map(p => (
                      <div key={p.id} className="flex justify-between text-xs">
                        <span className="text-slate-500">{p.serviceParameterId}</span>
                        <span className="font-semibold text-slate-800">{p.value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No parameters configured.</p>
                )}
              </div>
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Approved Documents</h4>
              <span className="text-xs font-bold text-emerald-600">{docDetails.length} / {requiredDocDefs.filter(r => r.isRequired).length} Required</span>
            </div>
            {docDetails.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {docDetails.map((doc: any) => (
                  <div key={doc.id} className="flex items-center gap-3 px-4 py-3">
                    <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700 truncate">{doc.requirementName}</p>
                      <p className="text-xs text-slate-400">{doc.fileName} · v{doc.version}</p>
                    </div>
                    <a href={doc.downloadUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-blue-600 hover:underline flex-shrink-0">
                      View
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <p className="px-4 py-3 text-xs text-slate-400 italic">No approved documents recorded at activation.</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Tasks', value: taskCount, note: 'Work Management' },
              { label: 'Reports', value: reportCount, note: 'Generated' },
              { label: 'Documents', value: docDetails.length, note: 'Approved' },
            ].map(({ label, value, note }) => (
              <div key={label} className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-slate-800">{value}</p>
                <p className="text-xs font-bold text-slate-500 mt-1">{label}</p>
                <p className="text-[10px] text-slate-400">{note}</p>
              </div>
            ))}
          </div>

          {/* Task Generation Section */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-indigo-600" />
                <p className="text-xs font-bold text-indigo-700">Task Generation</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-600">{taskCount} task{taskCount !== 1 ? 's' : ''} generated</span>
              </div>
            </div>
            <p className="text-xs text-indigo-600 mb-3">
              Generate recurring tasks for <strong>{serviceName}</strong> from configured task templates per enabled service parameter.
            </p>
            <div className="flex gap-2">
              {(currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN') && (
                <button
                  onClick={() => setGenModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors"
                >
                  <Zap size={12} /> Generate Tasks
                </button>
              )}
              {taskCount > 0 && (
                <button
                  onClick={() => setTaskListOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white border border-indigo-300 hover:bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg transition-colors"
                >
                  <ListChecks size={12} /> View Tasks ({taskCount})
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-slate-100 flex justify-end bg-white rounded-b-2xl">
          <button onClick={onClose} className="px-6 py-2 text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
            Close
          </button>
        </div>
      </div>

      {/* Generate Tasks Modal */}
      <ClientTaskGenerationModal
        isOpen={genModalOpen}
        onClose={() => setGenModalOpen(false)}
        clientServiceId={cs.id}
        clientServiceName={`${clientName} — ${serviceName}`}
      />

      {/* Task List Modal */}
      <ClientTaskListModal
        isOpen={taskListOpen}
        onClose={() => setTaskListOpen(false)}
        clientServiceId={cs.id}
        clientServiceName={`${clientName} — ${serviceName}`}
        clientId={cs.clientId}
      />
    </div>
  );
};
