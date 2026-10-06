import React, { useState } from 'react';
import { Mail, MessageSquare, Clock, CheckCircle2, XCircle, Search, Filter } from 'lucide-react';
import { useDashboardStore } from '../../store/dashboardStore';

export const CommunicationHistoryView: React.FC = () => {
  const { communicationLogs } = useDashboardStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'EMAIL' | 'WHATSAPP'>('ALL');

  const filteredLogs = (communicationLogs || []).filter(log => {
    const matchesSearch = log.recipient.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (log.subject && log.subject.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = filterType === 'ALL' || log.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-500">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-outfit flex flex-wrap items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <Mail size={24} />
            </div>
            Outbox & History
          </h1>
          <p className="text-slate-500 mt-2 text-sm max-w-2xl">
            Track all outgoing emails and WhatsApp messages sent to clients through the system.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Search recipient or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-full sm:w-64"
            />
          </div>
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filterType === 'ALL' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('EMAIL')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${filterType === 'EMAIL' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Mail size={14} /> Email
            </button>
            <button
              onClick={() => setFilterType('WHATSAPP')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${filterType === 'WHATSAPP' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <MessageSquare size={14} /> WhatsApp
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Recipient</th>
                <th className="px-6 py-4">Details</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                        <Mail className="text-slate-300" size={24} />
                      </div>
                      <p className="font-medium text-slate-600">No communication logs found</p>
                      <p className="text-xs text-slate-400 mt-1">Emails and messages sent will appear here</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${log.type === 'EMAIL' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        {log.type === 'EMAIL' ? <Mail size={16} /> : <MessageSquare size={16} />}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{log.recipient}</div>
                      <div className="text-xs text-slate-500">Sent by: {log.sentBy}</div>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      {log.subject && <div className="font-semibold text-slate-700 truncate">{log.subject}</div>}
                      <div className="text-xs text-slate-500 truncate">{log.body}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                        log.status === 'SENT' ? 'bg-emerald-50 text-emerald-700' :
                        log.status === 'FAILED' ? 'bg-red-50 text-red-700' :
                        'bg-amber-50 text-amber-700'
                      }`}>
                        {log.status === 'SENT' ? <CheckCircle2 size={14} /> :
                         log.status === 'FAILED' ? <XCircle size={14} /> :
                         <Clock size={14} />}
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-slate-500 text-xs">
                      {new Date(log.timestamp).toLocaleString(undefined, {
                        year: 'numeric', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
