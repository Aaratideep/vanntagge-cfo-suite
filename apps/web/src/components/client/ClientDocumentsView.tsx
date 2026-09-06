import React, { useState } from 'react';
import { useDashboardStore } from '../../store/dashboardStore';
import { ClientDocument } from '../../types';
import {
  Folder,
  Upload,
  FileCheck,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  Plus,
  X,
  History,
  FileSpreadsheet,
} from 'lucide-react';

export const ClientDocumentsView: React.FC = () => {
  const { clientDocuments, currentUser, addClientDocument, addAuditLog } = useDashboardStore();

  const [activeTab, setActiveTab] = useState<'REQUIRED' | 'UPLOADED' | 'APPROVED' | 'REJECTED'>('UPLOADED');
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [selectedDocRequirement, setSelectedDocRequirement] = useState<string>('Bank Statement PDF');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  if (!currentUser) return null;

  // Filter docs for logged-in client strictly by clientId
  const myDocs = clientDocuments.filter((d) => d.clientId === currentUser.id);

  // Status lists
  const uploadedDocs = myDocs.filter((d) => d.status === 'UPLOADED' || !d.reviewStatus || d.reviewStatus === 'PENDING');
  const approvedDocs = myDocs.filter((d) => d.reviewStatus === 'APPROVED');
  const rejectedDocs = myDocs.filter((d) => d.reviewStatus === 'REJECTED' || d.reviewStatus === 'REUPLOAD_REQUIRED');

  const getFilteredDocs = () => {
    switch (activeTab) {
      case 'UPLOADED':
        return uploadedDocs;
      case 'APPROVED':
        return approvedDocs;
      case 'REJECTED':
        return rejectedDocs;
      default:
        return uploadedDocs;
    }
  };

  const handleUploadNewVersion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    // Check existing document version count
    const existingCount = myDocs.filter((d) => d.originalFileName === selectedFile.name).length;
    const newVersion = existingCount + 1;

    const newDoc: ClientDocument = {
      id: `doc-${Date.now()}`,
      organizationId: currentUser.organizationId || 'org-1',
      clientId: currentUser.id,
      clientServiceId: 'cs-fpa-1',
      serviceId: 'srv-fpa-1',
      documentRequirementId: `req-${selectedDocRequirement.toLowerCase().replace(/\s+/g, '-')}`,
      fileName: selectedFile.name,
      originalFileName: selectedFile.name,
      storagePath: `/documents/${currentUser.id}/${selectedFile.name}`,
      downloadUrl: `/documents/${selectedFile.name}`,
      mimeType: selectedFile.type || 'application/pdf',
      fileExtension: selectedFile.name.split('.').pop() || 'pdf',
      fileSizeBytes: selectedFile.size,
      status: 'UPLOADED',
      processingStatus: 'PROCESSING',
      reviewStatus: 'PENDING',
      uploadedBy: currentUser.id,
      uploadedAt: new Date().toISOString(),
      version: newVersion,
    };

    addClientDocument(newDoc);
    addAuditLog('CLIENT_DOCUMENT_UPLOADED', `Uploaded ${selectedFile.name} (V${newVersion})`);

    setShowUploadModal(false);
    setSelectedFile(null);
  };

  const getProcessingBadge = (status?: string) => {
    switch (status) {
      case 'PROCESSING':
        return (
          <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold rounded-full flex items-center gap-1">
            <Clock className="w-3 h-3 animate-spin text-amber-500" /> PROCESSING
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> PROCESSED
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold rounded-full">
            UPLOADED
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="border-b border-slate-200/80 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 font-outfit flex items-center gap-2">
            <Folder className="w-6 h-6 text-blue-600" />
            Client Document Vault
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Securely upload, store, and track version history for financial statements and compliance files.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Categorized Tabs Navigation */}
      <div className="bg-slate-100 p-1.5 rounded-xl border border-slate-200 flex flex-wrap gap-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('UPLOADED')}
          className={`px-4 py-2 rounded-lg transition-all ${
            activeTab === 'UPLOADED'
              ? 'bg-blue-600 text-white shadow-xs font-outfit font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Uploaded ({uploadedDocs.length})
        </button>
        <button
          onClick={() => setActiveTab('APPROVED')}
          className={`px-4 py-2 rounded-lg transition-all ${
            activeTab === 'APPROVED'
              ? 'bg-blue-600 text-white shadow-xs font-outfit font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Approved ({approvedDocs.length})
        </button>
        <button
          onClick={() => setActiveTab('REJECTED')}
          className={`px-4 py-2 rounded-lg transition-all ${
            activeTab === 'REJECTED'
              ? 'bg-blue-600 text-white shadow-xs font-outfit font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Re-upload Required ({rejectedDocs.length})
        </button>
      </div>

      {/* Documents Grid / Table */}
      {getFilteredDocs().length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200/80 shadow-sm text-center space-y-3">
          <Folder className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700 font-outfit">No Documents Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No document uploads found under tab "{activeTab}". Click "Upload Document" above to submit a file.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 font-outfit">
                <tr>
                  <th className="p-3.5">File Name & Requirement</th>
                  <th className="p-3.5">Version</th>
                  <th className="p-3.5">Processing Status</th>
                  <th className="p-3.5">Review Status</th>
                  <th className="p-3.5">Uploaded Date</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {getFilteredDocs().map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                        <div>
                          <span className="block text-slate-900">{doc.fileName}</span>
                          <span className="text-[11px] text-slate-400 font-normal">
                            {(doc.fileSizeBytes / 1024).toFixed(1)} KB • {doc.fileExtension.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono font-bold rounded text-[11px]">
                        V{doc.version}.0
                      </span>
                    </td>

                    <td className="p-3.5">{getProcessingBadge(doc.processingStatus)}</td>

                    <td className="p-3.5">
                      <span className="px-2.5 py-1 bg-slate-100 font-semibold text-slate-700 rounded-full text-[11px]">
                        {doc.reviewStatus || 'PENDING'}
                      </span>
                    </td>

                    <td className="p-3.5 text-slate-600 font-mono">
                      {new Date(doc.uploadedAt).toLocaleDateString()}
                    </td>

                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => alert(`Downloading document ${doc.fileName}...`)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg inline-flex items-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5 text-blue-600" />
                        <span>Download</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 px-6 py-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-outfit">Upload Document Version</h3>
                  <p className="text-xs text-blue-200">Secure File Vault Submission</p>
                </div>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadNewVersion} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Document Category / Requirement <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedDocRequirement}
                  onChange={(e) => setSelectedDocRequirement(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 font-semibold"
                >
                  <option value="Bank Statement PDF">Bank Statement PDF</option>
                  <option value="GST Return Filing CSV">GST Return Filing CSV</option>
                  <option value="Trial Balance Excel">Trial Balance Excel</option>
                  <option value="TDS Certificate">TDS Certificate</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Select File <span className="text-rose-500">*</span>
                </label>
                <input
                  type="file"
                  required
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50"
                />
              </div>

              <div className="p-3 bg-blue-50 border border-blue-150 rounded-xl text-blue-800 leading-relaxed">
                <span className="font-bold block mb-0.5">Automated Document Versioning:</span>
                Submitting a file with an existing requirement name automatically creates a new version (V2, V3) in history without overwriting historical uploads.
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedFile}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-xs disabled:opacity-50"
                >
                  Upload File Version
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
