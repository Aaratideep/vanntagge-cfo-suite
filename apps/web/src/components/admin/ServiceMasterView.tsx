import React, { useState } from 'react';
import { Search, Plus, Settings, Layers, ChevronRight, Activity, Zap, CheckCircle2, Edit2, Trash2, X, FileText, ToggleLeft, ToggleRight } from 'lucide-react';
import { Priority } from '@prisma/client';

type Parameter = {
  id: string;
  name: string;
  dataType: string;
  isRequired: boolean;
};

type Service = {
  id: string;
  name: string;
  frequency: string;
  priority: Priority;
  parameters: Parameter[];
};

type Category = {
  id: string;
  name: string;
  services: Service[];
};

import { useDashboardStore } from '../../store/dashboardStore';

export const ServiceMasterView: React.FC = () => {
  const { currentUser, serviceCategories, addServiceCategory, addServiceToCategory, removeServiceFromCategory, toggleServiceAutomation } = useDashboardStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('');
  
  // Missing Modal & Template States
  const [targetServiceId, setTargetServiceId] = useState<string | null>(null);
  const [isParamModalOpen, setIsParamModalOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);

  const canManageTemplates = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN';

  const openEditService = (service: any) => {
    alert(`Edit service feature coming soon for ${service.name}`);
  };
  
  const openAddTemplate = (serviceId: string, paramId: string, paramName: string) => {
    alert(`Add Task Template for parameter: ${paramName}`);
  };

  const openEditTemplate = (serviceId: string, paramId: string, paramName: string, tmpl: any) => {
    alert(`Edit Task Template: ${tmpl.name}`);
  };

  const deleteTaskTemplate = (serviceId: string, paramId: string, tmplId: string) => {
    alert(`Task Template deactivated`);
  };

  // Fallback to first category if active is not set
  const currentActiveCategory = activeCategory || (serviceCategories[0]?.id ?? '');
  const selectedCat = serviceCategories.find(c => c.id === currentActiveCategory);

  const handleAddCategory = () => {
    const name = window.prompt('Enter new Category Name:');
    if (name?.trim()) {
      addServiceCategory(name.trim());
    }
  };

  const handleAddService = () => {
    if (!selectedCat) return;
    const name = window.prompt('Enter new Service Name:');
    if (name?.trim()) {
      const frequency = window.prompt('Enter Frequency (e.g., Monthly, Weekly):') || 'Monthly';
      addServiceToCategory(selectedCat.id, {
        name: name.trim(),
        frequency,
        priority: 'MEDIUM',
        parameters: []
      });
    }
  };

  const handleDeleteService = (serviceId: string) => {
    if (!selectedCat) return;
    if (window.confirm('Are you sure you want to remove this service?')) {
      removeServiceFromCategory(selectedCat.id, serviceId);
    }
  };


  const filteredServices = selectedCat?.services.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-500 relative">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-outfit flex flex-wrap items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <img src="/service_hub_icon.png" alt="Service Hub" className="w-[24px] h-[24px]" style={{ filter: 'invert(32%) sepia(97%) saturate(2250%) hue-rotate(208deg) brightness(98%) contrast(93%)' }} />
            </div>
            Service Hub
          </h1>
          <p className="text-slate-500 mt-2 text-sm max-w-2xl">
            Configure the core CFO services, assign recurring frequencies, and define the required parameters. These configurations directly drive the client engagement engine.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all w-full sm:w-64"
            />
          </div>
          <button onClick={handleAddCategory} className="shrink-0 flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-800 transition-all shadow-md shadow-slate-900/10">
            <Plus size={18} />
            New Category
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Sidebar: Categories */}
        <div className="lg:col-span-3 space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Categories</h3>
          <div className="space-y-2">
            {serviceCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`w-full text-left p-3.5 rounded-xl transition-all flex items-center justify-between group border ${
                  currentActiveCategory === cat.id 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
                    : 'bg-white text-slate-700 border-slate-200/60 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span className="font-medium text-sm">{cat.name}</span>
                <ChevronRight size={16} className={`transition-transform ${currentActiveCategory === cat.id ? 'text-blue-200' : 'text-slate-300 group-hover:text-slate-400 group-hover:translate-x-1'}`} />
              </button>
            ))}
          </div>
        </div>

        {/* Main Content: Services in Category */}
        <div className="lg:col-span-9 space-y-4">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              Services in {selectedCat?.name}
              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                {selectedCat?.services.length}
              </span>
            </h3>
            <button onClick={handleAddService} className="flex items-center gap-2 text-blue-600 bg-blue-50 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors">
              <Plus size={16} />
              Add Service
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">

                {filteredServices?.map(service => (
                  <div key={service.id} className="bg-white border border-slate-200/80 rounded-2xl p-5 hover:shadow-lg hover:shadow-slate-200/50 transition-all group">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-inner">
                          <Zap size={20} className="drop-shadow-md" />
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-slate-900 tracking-tight">{service.name}</h4>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md bg-slate-100 text-slate-600">
                              <Activity size={14} />
                              {service.frequency}
                            </span>
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${
                              service.priority === 'URGENT' ? 'bg-red-50 text-red-600' :
                              service.priority === 'HIGH' ? 'bg-orange-50 text-orange-600' :
                              'bg-blue-50 text-blue-600'
                            }`}>
                              {service.priority}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => openEditService(service)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteService(service.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="mt-6 pt-5 border-t border-slate-100">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                          <Settings size={14} />
                          Configurable Parameters
                        </h5>
                        <button 
                          onClick={() => {
                            setTargetServiceId(service.id);
                            setIsParamModalOpen(true);
                          }}
                          className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                          <Plus size={14} /> Add Parameter
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        {service.parameters.map(param => {
                          const activeTemplates = (param.taskTemplates || []).filter(t => t.active !== false);
                          const inactiveTemplates = (param.taskTemplates || []).filter(t => t.active === false);
                          return (
                          <div key={param.id} className="rounded-xl bg-slate-50 border border-slate-100 overflow-hidden">
                            {/* Param header */}
                            <div className="flex items-center justify-between p-3">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 size={16} className={param.isRequired ? "text-blue-500" : "text-slate-300"} />
                                <span className="text-sm font-medium text-slate-700">{param.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-white border border-slate-200 rounded text-slate-500">
                                  {param.dataType}
                                </span>
                                {canManageTemplates && (
                                  <button
                                    onClick={() => openAddTemplate(service.id, param.id, param.name)}
                                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded transition-colors"
                                  >
                                    <Plus size={12} /> Task Template
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Task Templates sub-section */}
                            {(activeTemplates.length > 0 || inactiveTemplates.length > 0) && (
                              <div className="border-t border-slate-100 bg-white px-3 pb-3 pt-2">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                  <FileText size={10} /> Task Templates
                                  <span className="ml-1 bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full">{activeTemplates.length} active</span>
                                  {inactiveTemplates.length > 0 && (
                                    <span className="bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded-full">{inactiveTemplates.length} inactive</span>
                                  )}
                                </div>
                                <div className="space-y-2">
                                  {(param.taskTemplates || []).map(tmpl => (
                                    <div
                                      key={tmpl.id}
                                      className={`flex items-start justify-between gap-2 rounded-lg p-2 ${
                                        tmpl.active !== false
                                          ? 'bg-indigo-50 border border-indigo-100'
                                          : 'bg-slate-50 border border-slate-100 opacity-60'
                                      }`}
                                    >
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="text-xs font-semibold text-slate-800 truncate">{tmpl.name}</span>
                                          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                            tmpl.priority === 'URGENT' ? 'bg-red-100 text-red-600' :
                                            tmpl.priority === 'HIGH'   ? 'bg-orange-100 text-orange-600' :
                                            tmpl.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-600' :
                                            'bg-green-100 text-green-600'
                                          }`}>{tmpl.priority}</span>
                                          <span className="text-[9px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{tmpl.frequency}</span>
                                          {tmpl.estimatedHours > 0 && (
                                            <span className="text-[9px] text-slate-400">{tmpl.estimatedHours}h</span>
                                          )}
                                        </div>
                                        <div className="text-[10px] text-slate-500 mt-0.5">
                                          Due: <span className="text-slate-700">{tmpl.dueDateRule}</span>
                                          {tmpl.checklist && tmpl.checklist.length > 0 && (
                                            <span className="ml-2">· {tmpl.checklist.length} checklist items</span>
                                          )}
                                        </div>
                                      </div>
                                      {canManageTemplates && (
                                        <div className="flex items-center gap-1 shrink-0">
                                          <button
                                            onClick={() => openEditTemplate(service.id, param.id, param.name, tmpl)}
                                            title="Edit template"
                                            className="p-1 rounded hover:bg-indigo-100 text-slate-400 hover:text-indigo-600 transition-colors"
                                          >
                                            <Edit2 size={12} />
                                          </button>
                                          <button
                                            onClick={() => {
                                              if (confirm(`${tmpl.active !== false ? 'Deactivate' : 'This template is already inactive.'} "${tmpl.name}"?`)) {
                                                if (tmpl.active !== false) deleteTaskTemplate(service.id, param.id, tmpl.id);
                                              }
                                            }}
                                            title={tmpl.active !== false ? 'Deactivate template' : 'Already inactive'}
                                            className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                                          >
                                            {tmpl.active !== false ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}
                                          </button>
                                        </div>
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

                    {/* Required Documents Section */}
                    <div className="mt-6 pt-5 border-t border-slate-100">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                          <Settings size={14} />
                          Required Documents
                        </h5>
                        <button 
                          onClick={() => {
                            setTargetServiceId(service.id);
                            setIsDocModalOpen(true);
                          }}
                          className="text-xs font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                        >
                          <Plus size={14} /> Add Document
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {service.requiredDocuments?.map(doc => (
                          <div key={doc.id} className="flex flex-col justify-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 size={16} className={doc.isRequired ? "text-emerald-500" : "text-slate-300"} />
                                <span className="text-sm font-medium text-slate-700">{doc.name}</span>
                              </div>
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-white border border-slate-200 rounded text-slate-500">
                                {doc.maxFileSize}MB max
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {doc.allowedFileTypes.map(t => (
                                <span key={t} className="text-[9px] font-bold uppercase bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
                                  {t}
                                </span>
                              ))}
                              {doc.processingRequired && (
                                <span className="text-[9px] font-bold uppercase bg-amber-100 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded ml-auto">
                                  Processing Required
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                ))}
                
                {filteredServices?.length === 0 && (
                  <div className="p-8 text-center text-slate-500 bg-white rounded-2xl border border-slate-200/80">
                    No services found.
                  </div>
                )}
              </div>
        </div>
      </div>


    </div>
  );
};
