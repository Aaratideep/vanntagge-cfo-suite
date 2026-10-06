import React, { useState } from 'react';
import { useDashboardStore, STANDARD_DELIVERABLE_REPORTS } from '../../store/dashboardStore';
import { Client, DeliverableReportDef } from '../../types';
import { GripVertical, X, Plus, Save } from 'lucide-react';

interface ClientDeliverablesAdminProps {
  clientId: string;
  onClose: () => void;
}

export const ClientDeliverablesAdmin: React.FC<ClientDeliverablesAdminProps> = ({ clientId, onClose }) => {
  const { clients, updateClientDeliverables, updateClientFeaturedGraph } = useDashboardStore();
  const client = clients.find(c => c.id === clientId);

  const [reports, setReports] = useState<DeliverableReportDef[]>(
    client?.deliverableReports || []
  );
  const [featuredGraph, setFeaturedGraph] = useState<Client['featuredGraph']>(
    client?.featuredGraph
  );

  const handleAddReport = (reportTitle: string) => {
    if (reports.find(r => r.title === reportTitle)) return;
    setReports([...reports, {
      id: `report-${Date.now()}`,
      title: reportTitle,
      order: reports.length,
      isPinned: false
    }]);
  };

  const handleRemoveReport = (id: string) => {
    setReports(reports.filter(r => r.id !== id));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newReports = [...reports];
    const temp = newReports[index - 1];
    newReports[index - 1] = newReports[index];
    newReports[index] = temp;
    // Update order values
    newReports.forEach((r, i) => r.order = i);
    setReports(newReports);
  };

  const handleMoveDown = (index: number) => {
    if (index === reports.length - 1) return;
    const newReports = [...reports];
    const temp = newReports[index + 1];
    newReports[index + 1] = newReports[index];
    newReports[index] = temp;
    // Update order values
    newReports.forEach((r, i) => r.order = i);
    setReports(newReports);
  };

  const handleSave = () => {
    updateClientDeliverables(clientId, reports);
    if (featuredGraph !== client?.featuredGraph) {
      updateClientFeaturedGraph(clientId, featuredGraph);
    }
    onClose();
  };

  if (!client) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Key Deliverables: {client.companyName}</h2>
          <p className="text-xs text-slate-500 mt-1">Configure and order the standard deliverable reports for this client.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleSave} className="btn-primary py-2 px-4 flex items-center gap-2 text-sm">
            <Save size={16} /> Save Changes
          </button>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Selected Reports & Featured Graph */}
        <div className="space-y-6">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h3 className="font-bold text-slate-700 mb-2">Featured Dashboard Graph</h3>
            <p className="text-xs text-slate-500 mb-3">Select a financial graph to prominently display on this client's dashboard.</p>
            <select
              value={featuredGraph || ''}
              onChange={(e) => setFeaturedGraph(e.target.value ? e.target.value as Client['featuredGraph'] : undefined)}
              className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- No Featured Graph --</option>
              <option value="REVENUE_EXPENSE">Revenue vs Expenses Analysis</option>
              <option value="CASHFLOW">Cashflow Trend</option>
              <option value="PROFIT_MARGIN">Profit Margin Breakdown</option>
              <option value="OPEX">Operating Expenses (OPEX)</option>
            </select>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-slate-700 pb-2 border-b border-slate-100">Assigned Deliverables</h3>
          {reports.length === 0 ? (
            <div className="text-center p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-sm">
              No deliverables assigned yet. Select from the standard list.
            </div>
          ) : (
            <div className="space-y-2">
              {reports.map((report, idx) => (
                <div key={report.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl shadow-sm group hover:border-blue-300 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="text-slate-400 flex flex-col gap-1 cursor-ns-resize">
                      <button onClick={() => handleMoveUp(idx)} disabled={idx === 0} className="hover:text-blue-600 disabled:opacity-30">▲</button>
                      <button onClick={() => handleMoveDown(idx)} disabled={idx === reports.length - 1} className="hover:text-blue-600 disabled:opacity-30">▼</button>
                    </div>
                    <span className="font-bold text-sm text-slate-700">{report.title}</span>
                  </div>
                  <button onClick={() => handleRemoveReport(report.id)} className="text-rose-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors">
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        </div>

        {/* Standard Reports List */}
        <div className="space-y-4">
          <h3 className="font-bold text-slate-700 pb-2 border-b border-slate-100">Standard Reports Library</h3>
          <div className="grid grid-cols-1 gap-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {STANDARD_DELIVERABLE_REPORTS.map(title => {
              const isAdded = reports.some(r => r.title === title);
              return (
                <div key={title} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-slate-50">
                  <span className="text-sm font-medium text-slate-600">{title}</span>
                  <button 
                    onClick={() => handleAddReport(title)}
                    disabled={isAdded}
                    className={`p-1.5 rounded-lg border text-xs font-bold flex items-center gap-1 transition-colors ${
                      isAdded ? 'bg-slate-200 text-slate-400 border-transparent cursor-not-allowed' : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'
                    }`}
                  >
                    {isAdded ? 'Added' : <><Plus size={14} /> Add</>}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
