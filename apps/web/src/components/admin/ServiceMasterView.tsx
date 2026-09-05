import React, { useState } from 'react';
import { Search, Plus, Settings, Layers, ChevronRight, Activity, Zap, CheckCircle2, Edit2, Trash2, X } from 'lucide-react';
import { Priority } from '@prisma/client';

import { useDashboardStore } from '../../store/dashboardStore';
import { ServiceCategory, ServiceMaster, ServiceParameter } from '../../types';

export const ServiceMasterView: React.FC = () => {
  const { serviceCategories: categories, setServiceCategories: setCategories } = useDashboardStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>(categories[0]?.id || '');
  
  // Modals state
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceMaster | null>(null);
  const [serviceForm, setServiceForm] = useState({ name: '', frequency: 'Monthly', priority: 'HIGH' as Priority });

  const [isParamModalOpen, setIsParamModalOpen] = useState(false);
  const [targetServiceId, setTargetServiceId] = useState<string | null>(null);
  const [paramForm, setParamForm] = useState({ name: '', dataType: 'BOOLEAN', isRequired: true });
  
  const selectedCat = categories.find(c => c.id === activeCategory);

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    const newCat: ServiceCategory = {
      id: `c_${Date.now()}`,
      name: newCatName,
      services: []
    };
    setCategories([...categories, newCat]);
    setActiveCategory(newCat.id);
    setNewCatName('');
    setIsCatModalOpen(false);
  };

  const handleSaveService = () => {
    if (!serviceForm.name.trim() || !activeCategory) return;
    
    setCategories(categories.map(c => {
      if (c.id === activeCategory) {
        if (editingService) {
          return {
            ...c,
            services: c.services.map(s => s.id === editingService.id ? { ...s, ...serviceForm } : s)
          };
        } else {
          return {
            ...c,
            services: [...c.services, { id: `s_${Date.now()}`, ...serviceForm, parameters: [] }]
          };
        }
      }
      return c;
    }));
    
    setIsServiceModalOpen(false);
    setEditingService(null);
    setServiceForm({ name: '', frequency: 'Monthly', priority: 'HIGH' });
  };

  const openEditService = (service: ServiceMaster) => {
    setEditingService(service);
    setServiceForm({ name: service.name, frequency: service.frequency, priority: service.priority });
    setIsServiceModalOpen(true);
  };

  const handleDeleteService = (serviceId: string) => {
    if (confirm('Are you sure you want to delete this service?')) {
      setCategories(categories.map(c => c.id === activeCategory ? { ...c, services: c.services.filter(s => s.id !== serviceId) } : c));
    }
  };

  const handleSaveParameter = () => {
    if (!paramForm.name.trim() || !targetServiceId || !activeCategory) return;
    
    setCategories(categories.map(c => {
      if (c.id === activeCategory) {
        return {
          ...c,
          services: c.services.map(s => {
            if (s.id === targetServiceId) {
              return {
                ...s,
                parameters: [...s.parameters, { id: `p_${Date.now()}`, ...paramForm }]
              };
            }
            return s;
          })
        };
      }
      return c;
    }));

    setIsParamModalOpen(false);
    setTargetServiceId(null);
    setParamForm({ name: '', dataType: 'BOOLEAN', isRequired: true });
  };

  const filteredServices = selectedCat?.services.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-500 relative">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-outfit flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Layers size={24} />
            </div>
            Service Master Configuration
          </h1>
          <p className="text-slate-500 mt-2 text-sm max-w-2xl">
            Configure the core CFO services, assign recurring frequencies, and define the required parameters. These configurations directly drive the client engagement engine.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all w-64"
            />
          </div>
          <button 
            onClick={() => setIsCatModalOpen(true)}
            className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-800 transition-all shadow-md shadow-slate-900/10"
          >
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
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`w-full text-left p-3.5 rounded-xl transition-all flex items-center justify-between group border ${
                  activeCategory === cat.id 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
                    : 'bg-white text-slate-700 border-slate-200/60 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span className="font-medium text-sm">{cat.name}</span>
                <ChevronRight size={16} className={`transition-transform ${activeCategory === cat.id ? 'text-blue-200' : 'text-slate-300 group-hover:text-slate-400 group-hover:translate-x-1'}`} />
              </button>
            ))}
          </div>
        </div>

        {/* Main Content: Services in Category */}
        <div className="lg:col-span-9 space-y-4">
          {selectedCat && (
            <>
              <div className="flex items-center justify-between pb-2">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  Services in {selectedCat.name}
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                    {filteredServices?.length || 0}
                  </span>
                </h3>
                <button 
                  onClick={() => {
                    setEditingService(null);
                    setServiceForm({ name: '', frequency: 'Monthly', priority: 'HIGH' });
                    setIsServiceModalOpen(true);
                  }}
                  className="flex items-center gap-2 text-blue-600 bg-blue-50 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                >
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
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {service.parameters.map(param => (
                          <div key={param.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 size={16} className={param.isRequired ? "text-blue-500" : "text-slate-300"} />
                              <span className="text-sm font-medium text-slate-700">{param.name}</span>
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-white border border-slate-200 rounded text-slate-500">
                              {param.dataType}
                            </span>
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
            </>
          )}
        </div>
      </div>

      {/* Category Modal */}
      {isCatModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">New Category</h3>
              <button onClick={() => setIsCatModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category Name</label>
                <input 
                  type="text" 
                  value={newCatName} 
                  onChange={e => setNewCatName(e.target.value)} 
                  autoFocus
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="e.g. Audit & Assurance" 
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setIsCatModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button onClick={handleAddCategory} className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                  Save Category
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Service Modal */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">{editingService ? 'Edit Service' : 'Add Service'}</h3>
              <button onClick={() => setIsServiceModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Service Name</label>
                <input 
                  type="text" 
                  value={serviceForm.name} 
                  onChange={e => setServiceForm({...serviceForm, name: e.target.value})} 
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="e.g. Financial Reporting" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Frequency</label>
                  <select 
                    value={serviceForm.frequency}
                    onChange={e => setServiceForm({...serviceForm, frequency: e.target.value})}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Yearly">Yearly</option>
                    <option value="On-demand">On-demand</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                  <select 
                    value={serviceForm.priority}
                    onChange={e => setServiceForm({...serviceForm, priority: e.target.value as Priority})}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setIsServiceModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button onClick={handleSaveService} className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                  Save Service
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Parameter Modal */}
      {isParamModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Add Parameter</h3>
              <button onClick={() => setIsParamModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Parameter Name</label>
                <input 
                  type="text" 
                  value={paramForm.name} 
                  onChange={e => setParamForm({...paramForm, name: e.target.value})} 
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="e.g. Budgeting Model" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Data Type</label>
                <select 
                  value={paramForm.dataType}
                  onChange={e => setParamForm({...paramForm, dataType: e.target.value})}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="BOOLEAN">Boolean (Yes/No)</option>
                  <option value="NUMBER">Number</option>
                  <option value="TEXT">Text</option>
                  <option value="DATE">Date</option>
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer mt-2">
                <input 
                  type="checkbox" 
                  checked={paramForm.isRequired}
                  onChange={e => setParamForm({...paramForm, isRequired: e.target.checked})}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">Required Parameter</span>
              </label>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setIsParamModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button onClick={handleSaveParameter} className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                  Save Parameter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
