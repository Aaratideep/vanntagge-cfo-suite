import React, { useState } from 'react';
import { useDashboardStore } from '../../store/dashboardStore';
import { ClientService } from '../../types';
import {
  Handshake,
  CheckCircle2,
  Clock,
  Calendar,
  Layers,
  FileText,
  Folder,
  BarChart,
  X,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export const ClientServicesView: React.FC = () => {
  const { engagements, currentUser, clientDocuments, serviceCategories } = useDashboardStore();

  const [selectedService, setSelectedService] = useState<{
    service: ClientService;
    engagementName: string;
    startDate: string;
  } | null>(null);

  if (!currentUser) return null;

  // Get active client engagements & client services
  const myEngagements = engagements.filter((e) => e.clientId === currentUser.id);

  const activeClientServices: {
    service: ClientService;
    engagementName: string;
    startDate: string;
    tasksCount: number;
    docsCount: number;
    reportsCount: number;
  }[] = [];

  myEngagements.forEach((eng) => {
    (eng.clientServices || []).forEach((cs) => {
      if (cs.isActive) {
        const tasksCount = (eng.tasks || []).filter(
          (t) => t.clientServiceId === cs.id || t.serviceId === cs.serviceMasterId
        ).length;

        const docsCount = clientDocuments.filter(
          (d) => d.clientServiceId === cs.id || d.clientId === currentUser.id
        ).length;

        const reportsCount = (eng.reports || []).filter(
          (r) => r.status === 'RELEASED'
        ).length;

        activeClientServices.push({
          service: cs,
          engagementName: eng.name || `${eng.clientCompanyName} Services`,
          startDate: eng.startDate,
          tasksCount,
          docsCount,
          reportsCount,
        });
      }
    });
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="border-b border-slate-200/80 pb-4">
        <h1 className="text-xl font-bold tracking-tight text-slate-800 font-outfit flex items-center gap-2">
          <Handshake className="w-6 h-6 text-blue-600" />
          My Subscribed Services
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Active Virtual CFO and financial consulting packages configured for your organization.
        </p>
      </div>

      {/* Services Grid */}
      {activeClientServices.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200/80 shadow-sm text-center space-y-3">
          <Layers className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700 font-outfit">No Active Services Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Your organization currently has no active subscribed services. Please contact your Virtual CFO manager for assistance.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {activeClientServices.map((item) => (
            <div
              key={item.service.id}
              className="premium-card p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-full uppercase tracking-wider font-outfit flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> ACTIVE
                  </span>
                  <span className="text-xs font-semibold text-slate-500 font-mono">
                    {item.service.frequency || 'Monthly'}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 font-outfit">
                    {item.service.serviceName}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Engagement: <strong className="text-slate-700">{item.engagementName}</strong>
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <span className="text-base font-black text-blue-600 font-outfit block">
                      {item.tasksCount}
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold uppercase">Tasks</span>
                  </div>
                  <div>
                    <span className="text-base font-black text-emerald-600 font-outfit block">
                      {item.docsCount}
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold uppercase">Docs</span>
                  </div>
                  <div>
                    <span className="text-base font-black text-purple-600 font-outfit block">
                      {item.reportsCount}
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold uppercase">Reports</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() =>
                  setSelectedService({
                    service: item.service,
                    engagementName: item.engagementName,
                    startDate: item.startDate,
                  })
                }
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>View Service Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Service Detail Modal */}
      {selectedService && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 px-6 py-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
                  <Handshake className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white font-outfit">
                    {selectedService.service.serviceName}
                  </h3>
                  <p className="text-xs text-blue-200">Service Specifications & Scope</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedService(null)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500">Service Status:</span>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    ACTIVE
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500">Service Category:</span>
                  <span className="font-semibold text-slate-800">Virtual CFO & FP&A</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500">Billing Frequency:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedService.service.frequency || 'Monthly'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500">Engagement Contract:</span>
                  <span className="font-bold text-slate-900">{selectedService.engagementName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Start Date:</span>
                  <span className="font-mono text-slate-700">
                    {new Date(selectedService.startDate).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-150 rounded-xl text-blue-800 leading-relaxed">
                <p className="font-bold flex items-center gap-1.5 mb-1">
                  <ShieldCheck className="w-4 h-4 text-blue-600" /> Dedicated Service Delivery
                </p>
                All deliverables for this service are compiled using verified data and subject to partner review prior to release.
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedService(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-900"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
