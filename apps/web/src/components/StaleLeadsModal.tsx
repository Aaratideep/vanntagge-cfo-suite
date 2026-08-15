import React, { useEffect, useState } from 'react';
import { useDashboardStore } from '../store/dashboardStore';
import { AlertTriangle, X, ArrowRight } from 'lucide-react';
import { Lead } from '../types';

interface StaleLeadsModalProps {
  setCurrentTab: (tab: string) => void;
}

export const StaleLeadsModal: React.FC<StaleLeadsModalProps> = ({ setCurrentTab }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [staleLeads, setStaleLeads] = useState<Lead[]>([]);
  const { leads, currentUser } = useDashboardStore();

  useEffect(() => {
    if (!currentUser) return;

    // Only show once per session to avoid annoying the user on every render
    const hasSeen = sessionStorage.getItem('hasSeenStaleLeadsWarning');
    if (hasSeen) return;

    // Calculate stale leads (status === 'NEW' and > 3 days old)
    const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;
    const now = Date.now();

    const stale = leads.filter((lead) => {
      if (lead.status !== 'NEW') return false;
      const createdTime = new Date(lead.createdAt).getTime();
      return (now - createdTime) > threeDaysInMs;
    });

    if (stale.length === 0) return;

    // Filter by role/assignment
    let relevantStaleLeads = [];
    const isAdmin = currentUser.role === 'SUPER_ADMIN';

    if (isAdmin) {
      relevantStaleLeads = stale;
    } else {
      relevantStaleLeads = stale.filter(
        (l) => l.assignedExecutiveId === currentUser.id
      );
    }

    if (relevantStaleLeads.length > 0) {
      setStaleLeads(relevantStaleLeads);
      setIsOpen(true);
      sessionStorage.setItem('hasSeenStaleLeadsWarning', 'true');
    }
  }, [leads, currentUser]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-red-50 border-b border-red-100 p-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 text-red-600 rounded-xl">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-red-900 font-outfit">Action Required: Uncontacted Leads</h2>
              <p className="text-xs text-red-600 mt-0.5">
                The following leads have been in the 'New' stage for more than 3 days.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 text-red-400 hover:text-red-700 hover:bg-red-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 max-h-[60vh] overflow-y-auto space-y-3">
          {staleLeads.map((lead) => (
            <div key={lead.id} className="p-3 border border-slate-100 rounded-xl flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div>
                <span className="block font-bold text-slate-800 text-sm">{lead.companyName}</span>
                <span className="block text-[11px] text-slate-500 mt-0.5">
                  Added on {new Date(lead.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block mb-1">
                  {lead.assignedExecutive ? lead.assignedExecutive.name : 'Unassigned'}
                </span>
                <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-[10px] font-bold">
                  Stale &gt; 3 days
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-200 bg-slate-150 rounded-lg text-sm transition-colors"
          >
            Remind Me Later
          </button>
          <button
            onClick={() => {
              setIsOpen(false);
              setCurrentTab('crm');
            }}
            className="px-4 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] rounded-lg text-sm transition-all flex items-center gap-2"
          >
            Go to CRM
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
