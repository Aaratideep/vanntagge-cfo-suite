import React, { useState } from 'react';
import { Engagement } from '../../types';
import { Layers, Settings, X, Power, CheckCircle2, Save } from 'lucide-react';

import { useDashboardStore } from '../../store/dashboardStore';
import { ClientService } from '../../types';

interface EngagementServicesModalProps {
  engagement: Engagement;
  onClose: () => void;
}

export const EngagementServicesModal: React.FC<EngagementServicesModalProps> = ({ engagement, onClose }) => {
  const { serviceCategories, updateEngagementClientServices } = useDashboardStore();

  const availableServices = serviceCategories.flatMap(cat => 
    cat.services.map(s => ({
      ...s,
      categoryId: cat.id,
      categoryName: cat.name
    }))
  );

  const initialActiveServices = engagement.clientServices?.filter(cs => cs.isActive).map(cs => cs.serviceMasterId) || [];
  
  const initialParamValues: Record<string, string> = {};
  engagement.clientServices?.forEach(cs => {
    cs.clientParameters.forEach(cp => {
      initialParamValues[cp.serviceParameterId] = cp.value;
    });
  });

  const [activeServices, setActiveServices] = useState<string[]>(initialActiveServices);
  const [paramValues, setParamValues] = useState<Record<string, string>>(initialParamValues);

  const toggleService = (serviceId: string) => {
    setActiveServices(prev => 
      prev.includes(serviceId) ? prev.filter(id => id !== serviceId) : [...prev, serviceId]
    );
  };

  const updateParam = (paramId: string, value: string) => {
    setParamValues(prev => ({ ...prev, [paramId]: value }));
  };

  const handleSave = () => {
    const newClientServices: ClientService[] = activeServices.map(serviceId => {
      const service = availableServices.find(s => s.id === serviceId);
      const clientParameters = service?.parameters.map(p => ({
        id: `cp-${Date.now()}-${p.id}`,
        serviceParameterId: p.id,
        value: paramValues[p.id] || (p.dataType === 'BOOLEAN' ? 'false' : '')
      })) || [];

      return {
        id: `cs-${Date.now()}-${serviceId}`,
        organizationId: 'org-1',
        clientId: engagement.clientId,
        engagementId: engagement.id,
        serviceMasterId: serviceId,
        isActive: true,
        status: 'ACTIVE',
        clientParameters,
        createdAt: new Date().toISOString()
      };
    });

    updateEngagementClientServices(engagement.id, newClientServices);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col relative z-10 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <Layers size={20} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 font-outfit">Configure Services</h2>
            </div>
            <p className="text-slate-500 mt-1 text-sm ml-14">{engagement.clientCompanyName} - {engagement.name}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {availableServices.map((service) => {
              const isActive = activeServices.includes(service.id);
              return (
                <div key={service.id} className={`bg-white border rounded-2xl p-5 transition-all ${
                  isActive ? 'border-blue-500 shadow-md shadow-blue-500/10' : 'border-slate-200 hover:border-slate-300'
                }`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{service.categoryName}</span>
                      <h3 className="font-bold text-slate-900 text-base mt-0.5">{service.name}</h3>
                    </div>
                    <button 
                      onClick={() => toggleService(service.id)}
                      className={`w-12 h-6 rounded-full flex items-center transition-colors px-1 ${
                        isActive ? 'bg-blue-600 justify-end' : 'bg-slate-200 justify-start'
                      }`}
                    >
                      <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                    </button>
                  </div>

                  {isActive && service.parameters.length > 0 && (
                    <div className="mt-5 pt-4 border-t border-slate-100 space-y-3 animate-in fade-in slide-in-from-top-2">
                      <h4 className="text-xs font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
                        <Settings size={14} /> Service Parameters
                      </h4>
                      <div className="space-y-2">
                        {service.parameters.map(param => (
                          <div key={param.id} className="flex items-center justify-between gap-4 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                            <span className="text-sm font-medium text-slate-700">{param.name}</span>
                            {param.dataType === 'BOOLEAN' ? (
                              <button 
                                onClick={() => updateParam(param.id, paramValues[param.id] === 'true' ? 'false' : 'true')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                  paramValues[param.id] === 'true' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'
                                }`}
                              >
                                {paramValues[param.id] === 'true' ? <CheckCircle2 size={14} /> : <Power size={14} />}
                                {paramValues[param.id] === 'true' ? 'ENABLED' : 'DISABLED'}
                              </button>
                            ) : (
                              <input 
                                type="text"
                                value={paramValues[param.id] || ''}
                                onChange={(e) => updateParam(param.id, e.target.value)}
                                placeholder="Enter value..."
                                className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 w-32 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex justify-end gap-3 shrink-0 bg-white rounded-b-3xl">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-colors flex items-center gap-2">
            <Save size={16} /> Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};
