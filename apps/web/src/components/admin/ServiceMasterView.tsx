import React, { useState } from 'react';
import { Search, Plus, Settings, Layers, ChevronRight, Activity, Zap, CheckCircle2, Edit2, Trash2 } from 'lucide-react';
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

const MOCK_CATEGORIES: Category[] = [
  {
    id: 'c1',
    name: 'Virtual CFO',
    services: [
      {
        id: 's1',
        name: 'Financial Planning & Analysis',
        frequency: 'Monthly',
        priority: 'HIGH',
        parameters: [
          { id: 'p1', name: 'Budgeting Model', dataType: 'BOOLEAN', isRequired: true },
          { id: 'p2', name: 'Variance Threshold (%)', dataType: 'NUMBER', isRequired: false },
        ]
      },
      {
        id: 's2',
        name: 'Cash Flow Management',
        frequency: 'Weekly',
        priority: 'URGENT',
        parameters: [
          { id: 'p3', name: 'Runway Calculation', dataType: 'BOOLEAN', isRequired: true }
        ]
      }
    ]
  },
  {
    id: 'c2',
    name: 'Tax & Compliance',
    services: [
      {
        id: 's3',
        name: 'GST Compliance',
        frequency: 'Monthly',
        priority: 'HIGH',
        parameters: [
          { id: 'p4', name: 'GSTR1 Enabled', dataType: 'BOOLEAN', isRequired: true },
          { id: 'p5', name: 'GSTR3B Enabled', dataType: 'BOOLEAN', isRequired: true },
        ]
      }
    ]
  }
];

export const ServiceMasterView: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>(MOCK_CATEGORIES);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>(MOCK_CATEGORIES[0].id);
  
  const selectedCat = categories.find(c => c.id === activeCategory);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-500">
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
          <button className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-800 transition-all shadow-md shadow-slate-900/10">
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
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              Services in {selectedCat?.name}
              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                {selectedCat?.services.length}
              </span>
            </h3>
            <button className="flex items-center gap-2 text-blue-600 bg-blue-50 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors">
              <Plus size={16} />
              Add Service
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {selectedCat?.services.map(service => (
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
                    <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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
                    <button className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
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
          </div>

        </div>
      </div>
    </div>
  );
};
