'use client';

import React, { useState } from 'react';
import { useDashboardStore } from '../store/dashboardStore';
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  FileText, 
  TrendingUp, 
  ShieldCheck, 
  HelpCircle,
  Clock
} from 'lucide-react';
import { AIResponse, AICallContext } from '../types';

interface AICfoAssistantModalProps {
  onClose: () => void;
  pageContext?: 'DASHBOARD' | 'SERVICE' | 'REPORT' | 'BILLING' | 'EMPLOYEE' | 'ADMIN';
  clientId?: string;
}

export const AICfoAssistantModal: React.FC<AICfoAssistantModalProps> = ({
  onClose,
  pageContext = 'DASHBOARD',
  clientId,
}) => {
  const { currentUser, askAICfoAssistant, aiFeatureFlags } = useDashboardStore();
  
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content?: string; response?: AIResponse }[]>([
    {
      role: 'assistant',
      content: `Hello ${currentUser?.name ? currentUser.name.split(' ')[0] : 'there'}! I am your VANNTAGGE AI CFO Assistant. I can analyze approved financial reports, billing summaries, compliance statuses, and active task items in your authorized workspace scope.`
    }
  ]);

  if (!currentUser) return null;

  const handleSend = async (textToSend?: string) => {
    const promptToUse = textToSend || query;
    if (!promptToUse.trim() || loading) return;

    const userMsg = promptToUse.trim();
    setQuery('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    const callContext: AICallContext = {
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      organizationId: 'org-1',
      clientId: clientId || (currentUser.role === 'CLIENT' ? currentUser.linkedEntity : undefined),
      pageContext,
    };

    try {
      const aiRes = await askAICfoAssistant(callContext, userMsg);
      setMessages(prev => [...prev, { role: 'assistant', response: aiRes }]);
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'AI is temporarily unavailable. Please verify system connection.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = currentUser.role === 'CLIENT' ? [
    'What reports were released this month?',
    'What invoice payments are pending?',
    'What is our revenue & billing trend?',
  ] : currentUser.role === 'EMPLOYEE' ? [
    'What tasks are due today?',
    'What is my workload this week?',
    'Are there any pending review corrections?',
  ] : [
    'What is our total revenue & collection summary?',
    'Which invoices are currently overdue?',
    'Show overall task completion status',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[650px] max-h-[90vh] font-outfit">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shadow-md">
              <Bot size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight text-white flex items-center gap-2">
                VANNTAGGE AI CFO Assistant
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] uppercase font-bold border border-blue-400/30">
                  {pageContext} Scope
                </span>
              </h3>
              <p className="text-xs text-slate-300 font-medium">Verified Database Source Analytics Engine</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Feature Flag Disabled Banner */}
        {!aiFeatureFlags?.aiCfoAssistant && (
          <div className="bg-amber-50 border-b border-amber-200 p-3 text-xs font-bold text-amber-800 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-600" />
            AI CFO Assistant is currently disabled in Admin Feature Flags.
          </div>
        )}

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50 custom-scrollbar">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-sm">
                  <Bot size={18} />
                </div>
              )}

              <div className={`max-w-[85%] rounded-2xl p-4 space-y-3 shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white font-medium text-xs rounded-br-none' 
                  : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-none'
              }`}>
                {msg.content && (
                  <p className="text-xs leading-relaxed font-medium">{msg.content}</p>
                )}

                {msg.response && (
                  <div className="space-y-3">
                    {/* Validation Status Badge */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        msg.response.validationStatus === 'VALIDATED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                        msg.response.validationStatus === 'DATA_VALIDATION_FAILED' ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-amber-100 text-amber-800'
                      }`}>
                        <ShieldCheck size={12} /> {msg.response.validationStatus.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold">Confidence: {msg.response.confidence}</span>
                    </div>

                    {/* Main Answer */}
                    <p className="text-xs text-slate-900 font-semibold leading-relaxed">
                      {msg.response.answer}
                    </p>

                    {/* Key Numbers Grid */}
                    {msg.response.keyNumbers && msg.response.keyNumbers.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                        {msg.response.keyNumbers.map((kn, kIdx) => (
                          <div key={kIdx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
                            <p className="text-[10px] font-bold text-slate-500 uppercase truncate">{kn.label}</p>
                            <p className="text-sm font-extrabold text-blue-700 mt-0.5">{kn.value}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Fact vs Inference Breakdown */}
                    {msg.response.factVsInference && (
                      <div className="space-y-1.5 pt-1 text-[11px] bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                        {msg.response.factVsInference.facts.map((fact, fIdx) => (
                          <div key={`f-${fIdx}`} className="flex items-start gap-1.5 text-slate-700">
                            <span className="font-bold text-emerald-600 shrink-0">[FACT]</span>
                            <span>{fact}</span>
                          </div>
                        ))}
                        {msg.response.factVsInference.inferences.map((inf, iIdx) => (
                          <div key={`i-${iIdx}`} className="flex items-start gap-1.5 text-slate-600 italic">
                            <span className="font-bold text-blue-600 shrink-0">[INFERENCE]</span>
                            <span>{inf}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Source Citations */}
                    {msg.response.sources && msg.response.sources.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-[10px]">
                        <span className="font-bold text-slate-500 uppercase">Sources:</span>
                        {msg.response.sources.map((src, sIdx) => (
                          <span key={sIdx} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-semibold border border-slate-200 flex items-center gap-1">
                            <FileText size={10} className="text-slate-400" />
                            {src.title}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 items-center">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                <Bot size={18} />
              </div>
              <div className="bg-white border border-slate-200 p-3 rounded-2xl text-xs text-slate-500 font-medium flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></div>
                Analyzing database source records...
              </div>
            </div>
          )}
        </div>

        {/* Quick Suggestion Pills */}
        <div className="px-5 py-2 bg-slate-100/60 border-t border-slate-200 flex items-center gap-2 overflow-x-auto custom-scrollbar">
          <span className="text-[10px] font-bold text-slate-500 uppercase shrink-0">Quick Ask:</span>
          {quickPrompts.map((qp, qIdx) => (
            <button
              key={qIdx}
              onClick={() => handleSend(qp)}
              className="text-[11px] font-semibold bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 rounded-lg px-2.5 py-1 whitespace-nowrap transition-colors shadow-sm"
            >
              {qp}
            </button>
          ))}
        </div>

        {/* Footer Input */}
        <div className="p-4 bg-white border-t border-slate-200">
          <form 
            onSubmit={e => { e.preventDefault(); handleSend(); }} 
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask a financial, billing, report, or task question..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              disabled={!aiFeatureFlags?.aiCfoAssistant || loading}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!query.trim() || !aiFeatureFlags?.aiCfoAssistant || loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-xs p-2.5 rounded-xl shadow-md transition-all flex items-center justify-center shrink-0"
            >
              <Send size={16} />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
