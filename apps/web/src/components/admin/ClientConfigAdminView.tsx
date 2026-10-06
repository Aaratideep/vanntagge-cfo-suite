import React from 'react';
import { useDashboardStore } from '../../store/dashboardStore';
import { ArrowLeft, LayoutDashboard, PieChart, CheckCircle2, FileText, IndianRupee, Clock, Briefcase, Settings2 } from 'lucide-react';
import { ClientDashboardConfig } from '../../types';

interface Props {
  clientId: string;
  onBack: () => void;
}

const DEFAULT_CONFIG: ClientDashboardConfig = {
  showKeyDeliverables: true,
  showWorkProgress: true,
  showBillingSummary: true,
  showActiveEngagements: true,
  showDeliverablesTimeline: true,
  showInvoicesVault: true,
};

export const ClientConfigAdminView: React.FC<Props> = ({ clientId, onBack }) => {
  const { clients, updateClient, updateClientFeaturedGraph, setGlobalSuccessMsg } = useDashboardStore();
  const client = clients.find(c => c.id === clientId);

  if (!client) {
    return (
      <div className="p-8 text-center text-slate-500">
        Client not found. <button onClick={onBack} className="text-blue-600 underline">Go back</button>
      </div>
    );
  }

  const config: ClientDashboardConfig = client.dashboardConfig || DEFAULT_CONFIG;

  const handleToggle = (key: keyof ClientDashboardConfig) => {
    updateClient(clientId, {
      dashboardConfig: {
        ...config,
        [key]: !config[key]
      }
    });
  };

  const handleGraphChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'NONE') {
      updateClientFeaturedGraph(clientId, undefined);
    } else {
      updateClientFeaturedGraph(clientId, val as any);
    }
    setGlobalSuccessMsg('Featured graph updated');
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
        <button 
          onClick={onBack}
          className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-outfit flex items-center gap-2">
            Dashboard Configuration: {client.companyName}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Customize what {client.companyName} sees on their client portal dashboard.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Client Details */}
        <div className="space-y-6">
          <div className="premium-card p-6 bg-slate-50 border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-2">
              <Briefcase size={18} className="text-blue-600" /> Client Profile
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contact Person</span>
                <span className="font-medium text-slate-800">{client.contactPerson}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</span>
                <span className="font-medium text-slate-800">{client.email}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone</span>
                <span className="font-medium text-slate-800">{client.phone}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Industry</span>
                <span className="font-medium text-slate-800">{client.industry || 'N/A'}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Business Type</span>
                <span className="font-medium text-slate-800">{client.businessType || 'N/A'}</span>
              </div>
            </div>
          </div>
          
          <div className="premium-card p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
            <h3 className="font-bold text-blue-900 flex items-center gap-2 mb-2">
              <Settings2 size={18} className="text-blue-600" /> Real-time Updates
            </h3>
            <p className="text-xs text-blue-700 leading-relaxed">
              Any changes made here are instantly reflected on the client's dashboard. You can hide specific modules if they are not relevant to this client's current engagement scope.
            </p>
          </div>
        </div>

        {/* Right Column: Toggles and Config */}
        <div className="md:col-span-2 space-y-6">
          <div className="premium-card p-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <LayoutDashboard size={18} className="text-indigo-600" /> Module Visibility
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { key: 'showKeyDeliverables', label: 'Key Deliverables & Reports', icon: <FileText size={16} className="text-blue-500"/>, desc: 'Shows pinned and standard MIS reports.' },
                { key: 'showWorkProgress', label: 'Work Progress Overview', icon: <PieChart size={16} className="text-purple-500"/>, desc: 'Pie chart showing task completion status.' },
                { key: 'showBillingSummary', label: 'Billing Summary', icon: <IndianRupee size={16} className="text-emerald-500"/>, desc: 'Bar chart showing paid vs pending invoices.' },
                { key: 'showActiveEngagements', label: 'Active Engagements', icon: <Briefcase size={16} className="text-indigo-500"/>, desc: 'List of ongoing service retainers.' },
                { key: 'showDeliverablesTimeline', label: 'Deliverables Timeline', icon: <CheckCircle2 size={16} className="text-emerald-600"/>, desc: 'Chronological list of upcoming/completed tasks.' },
                { key: 'showInvoicesVault', label: 'Invoices Vault', icon: <Clock size={16} className="text-amber-500"/>, desc: 'Historical list of all invoices with download links.' },
              ].map((module) => (
                <div key={module.key} className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="mt-1">{module.icon}</div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-slate-800">{module.label}</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">{module.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={config[module.key as keyof ClientDashboardConfig] as boolean}
                      onChange={() => handleToggle(module.key as keyof ClientDashboardConfig)}
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="premium-card p-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <PieChart size={18} className="text-indigo-600" /> Featured Analytical Graph
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Select the primary financial graph to display prominently on the client's dashboard. This should align with their key business objectives (e.g., cashflow issues vs profit tracking).
            </p>
            
            <select
              value={client.featuredGraph || 'NONE'}
              onChange={handleGraphChange}
              className="w-full max-w-md bg-white border border-slate-300 text-slate-800 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-2.5"
            >
              <option value="NONE">None (Hide Featured Graph)</option>
              <option value="REVENUE_EXPENSE">Revenue vs Expenses Analysis</option>
              <option value="CASHFLOW">Cashflow Trend</option>
              <option value="PROFIT_MARGIN">Profit Margin Breakdown</option>
              <option value="OPEX">Operating Expenses (OPEX)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
