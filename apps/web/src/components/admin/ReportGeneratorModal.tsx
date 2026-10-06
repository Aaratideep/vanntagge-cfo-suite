import React, { useState, useEffect } from 'react';
import { useDashboardStore } from '../../store/dashboardStore';
import {
  X,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Building2,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface ReportGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReportGenerated: (reportId: string) => void;
}

export const ReportGeneratorModal: React.FC<ReportGeneratorModalProps> = ({
  isOpen,
  onClose,
  onReportGenerated,
}) => {
  const { clients, reportTemplates, validateReportGeneration, generateReportDraft } =
    useDashboardStore();

  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [periodKey, setPeriodKey] = useState<string>('2026-09');
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    blockers: string[];
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Set default client and template if available
  useEffect(() => {
    if (isOpen) {
      if (clients.length > 0 && !selectedClientId) {
        setSelectedClientId(clients[0].id);
      }
      const activeTemplates = reportTemplates.filter((t) => t.active);
      if (activeTemplates.length > 0 && !selectedTemplateId) {
        setSelectedTemplateId(activeTemplates[0].id);
      }
      setErrorMsg('');
    }
  }, [isOpen, clients, reportTemplates]);

  // Run pre-generation validation whenever selections change
  useEffect(() => {
    if (selectedClientId && selectedTemplateId && periodKey) {
      const res = validateReportGeneration(
        selectedClientId,
        selectedServiceId || 'default',
        selectedTemplateId,
        periodKey
      );
      setValidationResult(res);
    } else {
      setValidationResult(null);
    }
  }, [selectedClientId, selectedServiceId, selectedTemplateId, periodKey, validateReportGeneration]);

  if (!isOpen) return null;

  const activeTemplates = reportTemplates.filter((t) => t.active);
  const selectedClient = clients.find((c) => c.id === selectedClientId);

  const handleGenerate = () => {
    if (!selectedClientId || !selectedTemplateId || !periodKey) {
      setErrorMsg('Please complete all required fields.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    const res = generateReportDraft({
      clientId: selectedClientId,
      clientServiceId: selectedServiceId || undefined,
      templateId: selectedTemplateId,
      periodKey,
    });

    setIsSubmitting(false);

    if (res.success && res.reportId) {
      onReportGenerated(res.reportId);
      onClose();
    } else {
      setErrorMsg(res.error || 'Failed to generate report draft.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-700/60 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-slate-950 px-6 py-5 border-b border-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight font-outfit">Generate CFO Report Draft</h2>
              <p className="text-xs text-slate-400">
                TEMPLATE → APPROVED DATA → BUILDER → MAKER-CHECKER REVIEW → RELEASE
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white hover:bg-slate-800 p-2 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {errorMsg && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-xs flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Generation Blocked</p>
                <p>{errorMsg}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Target Client */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5 font-outfit">
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                Select Client <span className="text-rose-400">*</span>
              </label>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full text-xs border border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 p-2.5 bg-slate-950 text-white font-semibold"
              >
                <option value="">-- Select Target Client --</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName}
                  </option>
                ))}
              </select>
            </div>

            {/* Target Period */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5 font-outfit">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                Reporting Period <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={periodKey}
                onChange={(e) => setPeriodKey(e.target.value)}
                placeholder="e.g. 2026-09 or 2026-Q3"
                className="w-full text-xs border border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 p-2.5 bg-slate-950 text-white font-semibold"
              />
              <p className="text-[11px] text-slate-500 mt-1">Format: YYYY-MM or YYYY-Q#</p>
            </div>

            {/* Report Template */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5 font-outfit">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                Report Structure Template <span className="text-rose-400">*</span>
              </label>
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="w-full text-xs border border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 p-2.5 bg-slate-950 text-white font-semibold"
              >
                <option value="">-- Select Template --</option>
                {activeTemplates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} (v{t.version}.0) - [{t.reportType}]
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Validation Status & Pre-Generation Check */}
          {validationResult && (
            <div className="mt-4">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 font-outfit flex items-center gap-2">
                <span>Pre-Generation Data Verification</span>
                <span className="h-px flex-1 bg-slate-800" />
              </div>

              {validationResult.valid ? (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-emerald-300 font-outfit">
                      Approved Task Data Ready for Compilation
                    </h4>
                    <p className="text-xs text-emerald-400/90 mt-0.5 leading-relaxed">
                      Verified approved task submissions for {selectedClient?.companyName} ({periodKey}). Source data lineage snapshot will be compiled automatically.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-amber-300 font-outfit">
                      Generation Blocked — Missing Approved Task Data
                    </h4>
                    <p className="text-xs text-amber-400/90 leading-relaxed">
                      Reports can only be generated using verified, approved task data. Please complete and approve the required client tasks first.
                    </p>
                    <ul className="mt-2 space-y-1">
                      {validationResult.blockers.map((b, idx) => (
                        <li key={idx} className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!validationResult?.valid || isSubmitting}
            onClick={handleGenerate}
            className="px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md flex items-center gap-2 transition-all active:scale-[0.98]"
          >
            {isSubmitting ? (
              <span>Compiling Snapshot...</span>
            ) : (
              <>
                <span>Compile & Open Builder</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
