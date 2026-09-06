'use client';

import React, { useState } from 'react';
import { useDashboardStore } from '../../store/dashboardStore';
import { ReportTemplate, ReportSectionConfig, KPIDefinition, ChartDefinition, ReportType } from '../../types';
import {
  FileText,
  Plus,
  Copy,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  Layers,
  BarChart,
  TrendingUp,
  Settings,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';

interface ReportTemplatesViewProps {
  onBack?: () => void;
}

export const ReportTemplatesView: React.FC<ReportTemplatesViewProps> = ({ onBack }) => {
  const { reportTemplates, addReportTemplate, updateReportTemplate, duplicateReportTemplate } =
    useDashboardStore();

  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ReportTemplate | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [reportType, setReportType] = useState<ReportType>('MIS');
  const [frequency, setFrequency] = useState('Monthly');
  const [sections, setSections] = useState<ReportSectionConfig[]>([
    { id: 'sec-1', title: 'Executive Summary', order: 1, visible: true, narrative: 'Monthly summary' },
    { id: 'sec-2', title: 'Revenue & Profitability', order: 2, visible: true, kpiKeys: ['revenue', 'ebitda'] },
  ]);

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setName('');
    setDescription('');
    setReportType('MIS');
    setFrequency('Monthly');
    setSections([
      { id: 'sec-1', title: 'Executive Summary', order: 1, visible: true, narrative: 'Executive commentary' },
      { id: 'sec-2', title: 'Financial Metrics & Profitability', order: 2, visible: true, kpiKeys: ['revenue', 'ebitda'] },
    ]);
    setShowModal(true);
  };

  const handleOpenEdit = (tpl: ReportTemplate) => {
    setEditingTemplate(tpl);
    setName(tpl.name);
    setDescription(tpl.description || '');
    setReportType(tpl.reportType);
    setFrequency(tpl.frequency);
    setSections(tpl.sections || []);
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingTemplate) {
      updateReportTemplate(editingTemplate.id, {
        name,
        description,
        reportType,
        frequency,
        sections,
      });
    } else {
      addReportTemplate({
        name,
        description,
        reportType,
        frequency,
        active: true,
        version: 1,
        sections,
        kpiDefinitions: [
          { key: 'revenue', name: 'Total Revenue', formula: 'revenue', format: 'CURRENCY', sourceFieldKey: 'revenue' },
          { key: 'ebitda', name: 'EBITDA', formula: 'ebitda', format: 'CURRENCY', sourceFieldKey: 'ebitda' },
        ],
        chartDefinitions: [],
      });
    }

    setShowModal(false);
  };

  const handleAddSection = () => {
    const nextOrder = sections.length + 1;
    setSections([
      ...sections,
      {
        id: `sec-${Date.now()}`,
        title: `New Section ${nextOrder}`,
        order: nextOrder,
        visible: true,
        narrative: '',
      },
    ]);
  };

  const handleRemoveSection = (id: string) => {
    setSections(sections.filter((s) => s.id !== id));
  };

  const handleSectionTitleChange = (id: string, newTitle: string) => {
    setSections(sections.map((s) => (s.id === id ? { ...s, title: newTitle } : s)));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight font-outfit flex items-center gap-2">
              <Layers className="w-6 h-6 text-blue-400" />
              Report Template Library
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Design, configure, and standardize financial report templates across Virtual CFO engagements.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Create Report Template</span>
        </button>
      </div>

      {/* Templates Grid - Dark Navy Glass Theme */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {reportTemplates.map((tpl) => (
          <div
            key={tpl.id}
            className="bg-slate-900/60 backdrop-blur-md border border-slate-700/50 p-6 rounded-3xl shadow-sm hover:border-blue-500/50 transition-all duration-200 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <span className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold text-[11px] rounded-lg font-outfit uppercase tracking-wider">
                  {tpl.reportType}
                </span>
                <span className="text-xs font-semibold text-slate-400 font-mono">v{tpl.version}.0</span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white font-outfit">{tpl.name}</h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {tpl.description || 'Standardized financial report template.'}
                </p>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Frequency:</span>
                  <span className="font-semibold text-slate-200">{tpl.frequency}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Configured Sections:</span>
                  <span className="font-semibold text-blue-400">{tpl.sections.length} Sections</span>
                </div>
              </div>
            </div>

            {/* Template Card Actions */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <button
                onClick={() => duplicateReportTemplate(tpl.id)}
                className="text-slate-400 hover:text-blue-400 font-semibold flex items-center gap-1 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Duplicate</span>
              </button>

              <button
                onClick={() => handleOpenEdit(tpl)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl flex items-center gap-1 transition-colors border border-slate-700/50"
              >
                <Edit2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Configure</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create / Edit Template Modal - Dark Navy Glass Theme */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700/60 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="bg-slate-950 px-6 py-5 border-b border-slate-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white font-outfit tracking-tight">
                    {editingTemplate ? `Edit Template: ${editingTemplate.name}` : 'Build New Report Template'}
                  </h2>
                  <p className="text-xs text-slate-400">Configure default sections, narrative prompts, and metrics.</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Template Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Monthly CFO Performance MIS"
                    className="w-full text-xs p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Report Category</label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value as ReportType)}
                    className="w-full text-xs p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 font-semibold"
                  >
                    <option value="MIS">MIS Report</option>
                    <option value="CASH_FLOW">Cash Flow Forecast</option>
                    <option value="FINANCIAL_ANALYSIS">Financial Analysis</option>
                    <option value="BUSINESS_VALUATION">Valuation Model</option>
                    <option value="BUDGET">Budget Framework</option>
                    <option value="DUE_DILIGENCE">Due Diligence Audit</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief objective of this report template..."
                    className="w-full text-xs p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Sections Builder */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-outfit">
                    Section Structure Configuration
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddSection}
                    className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Section</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {sections.map((sec, idx) => (
                    <div
                      key={sec.id}
                      className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between gap-3 text-xs"
                    >
                      <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 font-outfit">
                        {idx + 1}
                      </span>

                      <input
                        type="text"
                        value={sec.title}
                        onChange={(e) => handleSectionTitleChange(sec.id, e.target.value)}
                        className="flex-1 text-xs p-2 bg-slate-900 border border-slate-700 rounded-xl font-semibold text-white focus:outline-none focus:border-blue-500"
                      />

                      <button
                        type="button"
                        onClick={() => handleRemoveSection(sec.id)}
                        className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-md transition-all active:scale-[0.98]"
                >
                  {editingTemplate ? 'Update Template' : 'Save Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
