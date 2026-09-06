import React, { useState, useMemo, useRef, useCallback } from 'react';
import { X, Search, CheckCircle2, Upload, File as FileIcon, Trash2, Eye, RefreshCw, MessageSquare } from 'lucide-react';
import { useDashboardStore } from '../../store/dashboardStore';
import { ServiceMaster, ClientDocument, ClientServiceParameter } from '../../types';
import { storage } from '../../lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  client?: any;
  engagementId?: string;
}

export const ClientServiceOnboardingModal: React.FC<Props> = ({ isOpen, onClose, client, engagementId }) => {
  const { serviceCategories, engagements, clientDocuments, addClientDocument, updateClientDocument, removeClientDocument, updateClientDocumentProcessingStatus, startDocumentReview, approveDocument, rejectDocument, requestReuploadDocument, activateClientService, currentUser, addDocumentReviewComment } = useDashboardStore();
  
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('ALL');
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

  // Upload States
  const [uploadingDocs, setUploadingDocs] = useState<Record<string, { progress: number, file: File, error?: string }>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeReqIdForUpload, setActiveReqIdForUpload] = useState<string | null>(null);

  // Review States
  const [rejectingDocId, setRejectingDocId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [reuploadingDocId, setReuploadingDocId] = useState<string | null>(null);
  const [reuploadReason, setReuploadReason] = useState('');
  const [viewingDataForDocId, setViewingDataForDocId] = useState<string | null>(null);
  const [commentingDocId, setCommentingDocId] = useState<string | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  
  const hasReviewPermission = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'EMPLOYEE';

  const [activationError, setActivationError] = useState<string | null>(null);
  const [activatedServiceId, setActivatedServiceId] = useState<string | null>(null);
  const [activationStartDate, setActivationStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [showActivationConfirm, setShowActivationConfirm] = useState(false);
  const [isActivated, setIsActivated] = useState(false);
  const [serviceParameters, setServiceParameters] = useState<ClientServiceParameter[]>([]);


  // Derive already active services for this client to prevent duplicates
  const activeServiceIds = useMemo(() => {
    if (!client) return new Set<string>();
    const clientEngs = engagements.filter(e => e.clientId === client.id || e.clientCompanyName === client.companyName);
    const ids = new Set<string>();
    clientEngs.forEach(eng => {
      eng.clientServices?.forEach(cs => {
        if (cs.isActive) ids.add(cs.serviceMasterId);
      });
    });
    return ids;
  }, [client, engagements]);

  // Flatten and filter services based on search and category
  const availableServices = useMemo(() => {
    const list: (ServiceMaster & { categoryName: string })[] = [];
    serviceCategories.forEach(cat => {
      if (selectedCategoryId === 'ALL' || selectedCategoryId === cat.id) {
        cat.services.forEach(svc => {
          if (svc.name.toLowerCase().includes(searchQuery.toLowerCase()) || cat.name.toLowerCase().includes(searchQuery.toLowerCase())) {
            list.push({ ...svc, categoryName: cat.name });
          }
        });
      }
    });
    return list;
  }, [serviceCategories, searchQuery, selectedCategoryId]);

  const selectedService = availableServices.find(s => s.id === selectedServiceId);

  const currentClientDocs = useMemo(() => {
    if (!client || !selectedServiceId) return [];
    return clientDocuments.filter((d: ClientDocument) => 
      d.clientId === client.id && 
      d.serviceId === selectedServiceId &&
      d.status !== 'REMOVED'
    );
  }, [clientDocuments, client, selectedServiceId]);

  const getDocumentForRequirement = useCallback((reqId: string) => {
    const docs = currentClientDocs.filter((d: ClientDocument) => d.documentRequirementId === reqId);
    // Return latest version
    return docs.sort((a: ClientDocument, b: ClientDocument) => b.version - a.version)[0];
  }, [currentClientDocs]);

  const triggerUpload = (reqId: string) => {
    setActiveReqIdForUpload(reqId);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const triggerDocumentProcessing = async (doc: ClientDocument) => {
    updateClientDocumentProcessingStatus(doc.id, 'QUEUED');
    
    try {
      updateClientDocumentProcessingStatus(doc.id, 'PROCESSING');
      const response = await fetch('/api/process-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: doc.id,
          downloadUrl: doc.downloadUrl,
          fileName: doc.fileName,
          fileExtension: doc.fileExtension,
          documentType: selectedService?.requiredDocuments?.find(r => r.id === doc.documentRequirementId)?.name || 'Unknown',
          fileSizeBytes: doc.fileSizeBytes
        })
      });

      if (!response.ok) {
        throw new Error(`Processing failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.status === 'COMPLETED') {
        updateClientDocumentProcessingStatus(doc.id, 'COMPLETED', result);
      } else {
        updateClientDocumentProcessingStatus(doc.id, 'FAILED', result);
      }
    } catch (err: any) {
      console.error(err);
      updateClientDocumentProcessingStatus(doc.id, 'FAILED', { errorMessage: err.message });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const reqId = activeReqIdForUpload;
    e.target.value = ''; // reset
    if (!file || !reqId || !client || !selectedService) return;

    const req = selectedService.requiredDocuments?.find(r => r.id === reqId);
    if (!req) return;

    // Validation
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!req.allowedFileTypes.includes(ext) && !req.allowedFileTypes.includes('*')) {
      alert(`Invalid file type. Allowed: ${req.allowedFileTypes.join(', ')}`);
      return;
    }
    
    // File Size Validation
    const maxBytes = req.maxFileSize * 1024 * 1024;
    if (file.size > maxBytes) {
      alert(`File exceeds the maximum allowed size of ${req.maxFileSize} MB.`);
      return;
    }
    if (file.size === 0) {
      alert(`File is empty.`);
      return;
    }

    // Previous Document Check for Versioning
    const prevDoc = getDocumentForRequirement(reqId);
    const newVersion = prevDoc ? prevDoc.version + 1 : 1;

    // Setup Document ID
    const docId = `doc-${Date.now()}`;
    const orgId = 'org-1';
    const clientServiceId = `cs-temp-${selectedService.id}`; 
    const storagePath = `organizations/${orgId}/clients/${client.id}/services/${clientServiceId}/documents/${docId}/original/${file.name}`;
    
    // Set initial Upload State
    setUploadingDocs(prev => ({
      ...prev,
      [reqId]: { progress: 0, file }
    }));

    try {
      const storageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadingDocs(prev => ({
            ...prev,
            [reqId]: { ...prev[reqId], progress }
          }));
        }, 
        (error) => {
          console.error("Firebase upload error:", error);
          setUploadingDocs(prev => ({
            ...prev,
            [reqId]: { ...prev[reqId], error: "Upload failed. Please try again." }
          }));
        }, 
        async () => {
          // Success
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          
          const clientDoc: ClientDocument = {
            id: docId,
            organizationId: orgId,
            clientId: client.id,
            clientServiceId,
            serviceId: selectedService.id,
            documentRequirementId: reqId,
            fileName: file.name,
            originalFileName: file.name,
            storagePath,
            downloadUrl,
            mimeType: file.type || 'application/octet-stream',
            fileExtension: ext,
            fileSizeBytes: file.size,
            status: 'UPLOADED',
            uploadedBy: currentUser?.id || 'unknown',
            uploadedAt: new Date().toISOString(),
            version: newVersion
          };
          
          addClientDocument(clientDoc);
          
          setUploadingDocs(prev => {
            const next = { ...prev };
            delete next[reqId];
            return next;
          });

          // Trigger Document Processing
          triggerDocumentProcessing(clientDoc);
        }
      );
    } catch (err) {
      console.error(err);
      setUploadingDocs(prev => ({
        ...prev,
        [reqId]: { ...prev[reqId], error: "Upload failed. Please try again." }
      }));
    }
  };

  const handleRemoveDoc = (docId: string) => {
    if (confirm("Are you sure you want to remove this document?")) {
      removeClientDocument(docId);
    }
  };

  const handleNext = () => {
    if (step < 6) {
      setStep(prev => prev + 1);
    }
  };

  const handleActivateService = () => {
    if (!client || !selectedService || !currentUser) return;
    setActivationError(null);
    const result = activateClientService(
      client.id,
      engagementId,
      selectedService.id,
      serviceParameters,
      currentClientDocs.filter(d => d.reviewStatus === 'APPROVED').map(d => d.id),
      activationStartDate,
      selectedService.frequency,
      currentUser.id
    );
    if (result.success) {
      setActivatedServiceId(result.clientServiceId || null);
      setIsActivated(true);
      setShowActivationConfirm(false);
    } else {
      setActivationError(result.error || 'Activation failed. Please try again.');
      setShowActivationConfirm(false);
    }
  };

  const serviceReviewStatus = useMemo(() => {
    if (!selectedService || !currentClientDocs) return 'NOT_STARTED';
    
    const requiredDocs = selectedService.requiredDocuments?.filter(d => d.isRequired) || [];
    if (requiredDocs.length === 0) return 'READY_FOR_ACTIVATION';

    let allApproved = true;
    let anyInReview = false;
    let anyUploaded = false;

    for (const req of requiredDocs) {
      const doc = getDocumentForRequirement(req.id);
      if (!doc) {
        allApproved = false;
        continue;
      }
      
      anyUploaded = true;
      if (doc.reviewStatus === 'APPROVED') {
        // ok
      } else if (doc.reviewStatus === 'UNDER_REVIEW' || doc.reviewStatus === 'REJECTED' || doc.reviewStatus === 'REUPLOAD_REQUIRED' || doc.processingStatus === 'COMPLETED') {
        allApproved = false;
        anyInReview = true;
      } else {
        allApproved = false;
      }
    }

    if (allApproved) return 'READY_FOR_ACTIVATION';
    if (anyInReview || anyUploaded) return 'IN_REVIEW';
    return 'NOT_STARTED';
  }, [selectedService, currentClientDocs, getDocumentForRequirement]);

  const activationChecklist = useMemo(() => {
    if (!selectedService || !client) return [];

    const requiredDocs = selectedService.requiredDocuments?.filter(d => d.isRequired) || [];
    const approvedCount = requiredDocs.filter(req => {
      const doc = getDocumentForRequirement(req.id);
      return doc?.reviewStatus === 'APPROVED';
    }).length;
    const allDocsApproved = requiredDocs.length === 0 || approvedCount === requiredDocs.length;
    const hasPermission = hasReviewPermission;
    const clientValid = client.status === 'ACTIVE';
    const configComplete = serviceParameters.length > 0 || (selectedService.parameters?.length || 0) === 0;

    return [
      { label: 'Client', detail: client.companyName, ok: clientValid, fail: !clientValid ? `Client is not active (status: ${client.status})` : undefined },
      { label: 'Service Active in Master', detail: selectedService.name, ok: true, fail: undefined },
      { label: 'Configuration', detail: `${serviceParameters.length} param(s) configured`, ok: configComplete, fail: !configComplete ? 'Service parameters are incomplete.' : undefined },
      { label: 'Required Documents', detail: `${approvedCount} / ${requiredDocs.length} Approved`, ok: allDocsApproved, fail: !allDocsApproved ? `${requiredDocs.length - approvedCount} required document(s) still pending approval.` : undefined },
      { label: 'Duplicate Check', detail: 'No active duplicate', ok: true, fail: undefined },
      { label: 'Permission', detail: currentUser?.role || 'Unknown', ok: hasPermission, fail: !hasPermission ? 'You do not have permission to activate services.' : undefined },
    ];
  }, [selectedService, client, currentClientDocs, serviceParameters, hasReviewPermission, currentUser, getDocumentForRequirement]);

  const canActivate = activationChecklist.length > 0 && activationChecklist.every(c => c.ok);
  const firstFailReason = activationChecklist.find(c => !c.ok)?.fail;



  const renderExtractedData = (result: any) => {
    if (result.tables && result.tables.length > 0) {
      return (
        <div className="space-y-4">
          {result.tables.map((table: any, idx: number) => (
            <div key={idx} className="bg-white rounded border border-slate-200 overflow-x-auto">
              {table.sheetName && <h5 className="font-bold text-xs p-2 bg-slate-50 border-b border-slate-200">{table.sheetName}</h5>}
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {table.headers?.map((h: string, i: number) => (
                      <th key={i} className="p-2 font-bold text-slate-600 whitespace-nowrap">{h}</th>
                    ))}
                    {!table.headers && table.sample?.[0] && table.sample[0].map((_: any, i: number) => (
                       <th key={i} className="p-2 font-bold text-slate-600 whitespace-nowrap">Col {i+1}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.sample?.slice(0, 50).map((row: any[], rIdx: number) => (
                    <tr key={rIdx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      {row.map((val: any, cIdx: number) => (
                        <td key={cIdx} className="p-2 text-slate-700 whitespace-nowrap">{String(val)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {table.rows && table.rows > (table.sample?.length || 0) && (
                 <div className="p-2 text-center text-[10px] text-slate-500 bg-slate-50 border-t border-slate-200">
                   Showing first {table.sample.length} of {table.rows} rows
                 </div>
              )}
            </div>
          ))}
        </div>
      );
    }
    
    if (result.extractedText) {
      return (
        <div className="bg-white border border-slate-200 rounded p-4">
          <h5 className="text-xs font-bold text-slate-700 mb-2">Extracted Text</h5>
          <pre className="text-xs text-slate-600 whitespace-pre-wrap font-sans">
            {result.extractedText}
          </pre>
          {result.confidence !== undefined && (
            <div className="mt-4 pt-2 border-t border-slate-100 text-xs">
              <span className="font-bold text-slate-600">OCR Confidence:</span> 
              <span className={`ml-2 font-bold ${result.confidence > 90 ? 'text-emerald-600' : result.confidence > 70 ? 'text-amber-600' : 'text-rose-600'}`}>
                {result.confidence.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      );
    }
    
    return <p className="text-xs text-slate-500 italic">No tabular data or text available in extraction result.</p>;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-full max-h-[90vh] flex flex-col relative z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 font-outfit">Add Service</h2>
            <div className="flex items-center gap-2 mt-1">
              {client ? (
                <>
                  <p className="text-sm text-slate-500 font-medium">Client:</p>
                  <p className="text-sm font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">{client.companyName}</p>
                  <p className="text-sm text-slate-500 font-medium ml-2">Client ID:</p>
                  <p className="text-sm font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">{client.id}</p>
                </>
              ) : engagementId ? (
                <>
                  <p className="text-sm text-slate-500 font-medium">Engagement ID:</p>
                  <p className="text-sm font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">{engagementId}</p>
                </>
              ) : null}
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Wizard Steps */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between overflow-x-auto shrink-0 hidden md:flex">
          {[
            { num: 1, label: 'Service' },
            { num: 2, label: 'Configuration' },
            { num: 3, label: 'Documents' },
            { num: 4, label: 'Processing' },
            { num: 5, label: 'Review' },
            { num: 6, label: 'Activate' }
          ].map((s) => (
            <div key={s.num} className="flex items-center flex-1 last:flex-none min-w-[120px]">
              <div className={`flex items-center gap-2 ${step >= s.num ? 'text-emerald-600' : 'text-slate-400'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  step === s.num ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 
                  step > s.num ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                }`}>
                  {step > s.num ? '✓' : (step === s.num ? '●' : '○')}
                </div>
                <span className="text-xs font-bold whitespace-nowrap">{s.num} {s.label}</span>
              </div>
              {s.num < 6 && <div className={`flex-1 h-px mx-4 ${step > s.num ? 'bg-emerald-200' : 'bg-slate-200'}`} />}
            </div>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-y-auto bg-slate-50/30">
          
          {step === 1 && (
            <div className="space-y-6">
              {/* Selected Service State */}
              {selectedService && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Selected Service</span>
                      <h3 className="font-bold text-slate-800 text-lg mt-0.5 flex items-center gap-2">
                        {selectedService.name}
                        <CheckCircle2 size={18} className="text-emerald-500" />
                      </h3>
                    </div>
                    <button 
                      onClick={() => setSelectedServiceId(null)}
                      className="text-xs font-bold text-slate-500 hover:text-slate-800 underline"
                    >
                      Change Service
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-4 mt-4 text-xs">
                    <div>
                      <p className="text-slate-500 mb-1">Category:</p>
                      <p className="font-bold text-slate-800">{selectedService.categoryName}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 mb-1">Frequency:</p>
                      <p className="font-bold text-slate-800">{selectedService.frequency}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 mb-1">Priority:</p>
                      <p className="font-bold text-slate-800">{selectedService.priority}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 mb-1">Parameters:</p>
                      <p className="font-bold text-slate-800">{selectedService.parameters?.length || 0}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Service Selection / Search */}
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search services..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div className="w-64">
                  <select 
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="ALL">All Categories</option>
                    {serviceCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Service Grid */}
              {availableServices.length === 0 ? (
                <div className="text-center py-12 bg-white border border-dashed border-slate-200 rounded-2xl">
                  <p className="text-slate-500 font-medium">No active services available.</p>
                  <button 
                    onClick={() => { setSearchQuery(''); setSelectedCategoryId('ALL'); }}
                    className="mt-3 text-xs font-bold text-emerald-600 hover:underline"
                  >
                    Clear Search
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableServices.map(svc => {
                    const isAlreadyActive = activeServiceIds.has(svc.id);
                    const isSelected = selectedServiceId === svc.id;

                    return (
                      <div 
                        key={svc.id} 
                        className={`border rounded-xl p-5 transition-all ${
                          isAlreadyActive ? 'bg-slate-50 border-slate-200 opacity-70' :
                          isSelected ? 'border-emerald-500 bg-emerald-50 shadow-sm' :
                          'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">{svc.categoryName}</span>
                            <h3 className="font-bold text-slate-800 text-base">{svc.name}</h3>
                          </div>
                          {isSelected && <CheckCircle2 size={20} className="text-emerald-500" />}
                        </div>
                        
                        <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500 mb-5">
                          <span className="bg-slate-100 px-2 py-0.5 rounded-full">Freq: {svc.frequency}</span>
                          <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-100">Pri: {svc.priority}</span>
                          <span className="bg-slate-100 px-2 py-0.5 rounded-full">Params: {svc.parameters?.length || 0}</span>
                        </div>

                        {isAlreadyActive ? (
                          <div className="w-full py-2 bg-slate-200 text-slate-500 text-xs font-bold rounded-lg text-center">
                            Already active for this client
                          </div>
                        ) : (
                          <button
                            onClick={() => setSelectedServiceId(svc.id)}
                            className={`w-full py-2 text-xs font-bold rounded-lg transition-colors ${
                              isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {isSelected ? 'Selected' : 'Select'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {step === 2 && selectedService && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Step 2: Configure Service</h3>
              
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <div className="mb-6 pb-6 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Service</p>
                  <p className="font-bold text-slate-800 text-base">{selectedService.name}</p>
                </div>
                
                {(!selectedService.parameters || selectedService.parameters.length === 0) ? (
                  <p className="text-sm text-slate-500 italic">No parameters required for this service.</p>
                ) : (
                  <div className="space-y-5">
                    {selectedService.parameters.map(param => (
                      <div key={param.id} className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700">
                          {param.name} {param.isRequired && <span className="text-rose-500">*</span>}
                        </label>
                        {param.dataType === 'BOOLEAN' ? (
                          <select
                            disabled
                            className="w-full text-sm border-slate-200 bg-slate-50 rounded-lg text-slate-500"
                            defaultValue="true"
                          >
                            <option value="true">Enabled</option>
                            <option value="false">Disabled</option>
                          </select>
                        ) : (
                          <input
                            type={param.dataType === 'NUMBER' ? 'number' : 'text'}
                            disabled
                            className="w-full text-sm border-slate-200 bg-slate-50 rounded-lg text-slate-500"
                            placeholder={`Example: ${param.name}`}
                          />
                        )}
                      </div>
                    ))}
                    <p className="text-xs text-slate-400 mt-4 italic">* Configuration editing is disabled in this step per requirements.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 3 && selectedService && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Step 3: Required Documents</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Service: <span className="font-bold text-slate-700">{selectedService.name}</span>
                  </p>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl text-right">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-0.5">DOCUMENT CHECKLIST</p>
                  <p className="text-sm font-bold text-slate-800">
                    Required: {selectedService.requiredDocuments?.filter(d => d.isRequired).length || 0}
                  </p>
                  <p className="text-xs text-slate-500">
                    Optional: {selectedService.requiredDocuments?.filter(d => !d.isRequired).length || 0}
                  </p>
                </div>
              </div>
              
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                {(!selectedService.requiredDocuments || selectedService.requiredDocuments.length === 0) ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-slate-500 italic">No required documents have been configured for this service.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Hidden File Input */}
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      onChange={handleFileChange} 
                    />

                    {(() => {
                      const renderDocRow = (doc: any, isReq: boolean) => {
                        const existingDoc = getDocumentForRequirement(doc.id);
                        const uploadState = uploadingDocs[doc.id];
                        const isUploaded = !!existingDoc;

                        return (
                          <div key={doc.id} className={`flex items-center justify-between p-4 rounded-xl border ${isReq ? 'border-slate-200 bg-slate-50' : 'border-dashed border-slate-200 bg-white'}`}>
                            <div className="flex-1 mr-4">
                              <h5 className="font-bold text-slate-800 text-sm">{doc.name}</h5>
                              
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${isReq ? 'text-emerald-600 bg-emerald-100' : 'text-slate-500 bg-slate-100'}`}>
                                  {isReq ? 'Required' : 'Optional'}
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  Accepted: {doc.allowedFileTypes.join(', ').toUpperCase()}
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  | Max: {doc.maxFileSize}MB
                                </span>
                                
                                {isUploaded ? (
                                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                                    <CheckCircle2 size={12} />
                                    Uploaded v{existingDoc.version}
                                  </span>
                                ) : uploadState ? (
                                  <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded flex items-center gap-1">
                                    <RefreshCw size={12} className="animate-spin" />
                                    Uploading...
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-amber-500 font-bold bg-amber-50 px-2 py-0.5 rounded">
                                    Pending
                                  </span>
                                )}

                                {existingDoc && existingDoc.processingStatus === 'PROCESSING' && (
                                  <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded flex items-center gap-1">
                                    <RefreshCw size={12} className="animate-spin" />
                                    Processing...
                                  </span>
                                )}
                                {existingDoc && existingDoc.processingStatus === 'COMPLETED' && (
                                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                                    <CheckCircle2 size={12} />
                                    Processed
                                  </span>
                                )}
                                {existingDoc && existingDoc.processingStatus === 'FAILED' && (
                                  <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded">
                                    ✕ Processing Failed
                                  </span>
                                )}
                              </div>

                              {uploadState && !uploadState.error && (
                                <div className="mt-3 w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                  <div className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" style={{ width: `${uploadState.progress}%` }}></div>
                                </div>
                              )}
                              {uploadState?.error && (
                                <p className="text-xs text-rose-500 font-medium mt-1">{uploadState.error}</p>
                              )}
                              
                              {isUploaded && existingDoc && (
                                <div className="mt-2 flex flex-col gap-1">
                                  <div className="text-[10px] text-slate-500 flex items-center gap-2">
                                    <FileIcon size={12} />
                                    <span className="font-medium">{existingDoc.fileName}</span>
                                    <span>({formatFileSize(existingDoc.fileSizeBytes)})</span>
                                    <span>•</span>
                                    <span>{new Date(existingDoc.uploadedAt).toLocaleDateString()}</span>
                                  </div>
                                  
                                  {existingDoc.processingStatus === 'FAILED' && existingDoc.processingResult?.errorMessage && (
                                    <p className="text-xs text-rose-500 font-medium">{existingDoc.processingResult.errorMessage}</p>
                                  )}
                                  
                                  {existingDoc.processingStatus === 'COMPLETED' && existingDoc.processingResult?.metadata && (
                                    <div className="flex gap-3 text-[10px] text-slate-600 bg-slate-100 p-2 rounded-lg mt-1 w-max">
                                      {existingDoc.processingResult.metadata.pageCount !== undefined && (
                                        <span>Pages: <span className="font-bold">{existingDoc.processingResult.metadata.pageCount}</span></span>
                                      )}
                                      {existingDoc.processingResult.metadata.sheetCount !== undefined && (
                                        <span>Sheets: <span className="font-bold">{existingDoc.processingResult.metadata.sheetCount}</span></span>
                                      )}
                                      {existingDoc.processingResult.metadata.rowCount !== undefined && (
                                        <span>Rows: <span className="font-bold">{existingDoc.processingResult.metadata.rowCount}</span></span>
                                      )}
                                      <span>Extracted: <span className="font-bold">Yes</span></span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {isUploaded && existingDoc ? (
                                <>
                                  {existingDoc.processingStatus === 'FAILED' && (
                                    <button onClick={() => triggerDocumentProcessing(existingDoc)} className="px-3 py-1.5 bg-rose-100 text-rose-700 hover:bg-rose-200 text-xs font-bold rounded-lg transition-colors">
                                      Retry
                                    </button>
                                  )}
                                  <a href={existingDoc.downloadUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View Document">
                                    <Eye size={18} />
                                  </a>
                                  <button onClick={() => handleRemoveDoc(existingDoc.id)} className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Remove Document">
                                    <Trash2 size={18} />
                                  </button>
                                  <button onClick={() => triggerUpload(doc.id)} className="px-4 py-2 bg-slate-200 text-slate-700 hover:bg-slate-300 text-xs font-bold rounded-lg transition-colors">
                                    Replace
                                  </button>
                                </>
                              ) : (
                                <button 
                                  onClick={() => triggerUpload(doc.id)} 
                                  disabled={!!uploadState && !uploadState.error}
                                  className="px-4 py-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 disabled:opacity-50 text-xs font-bold rounded-lg transition-colors flex items-center gap-2"
                                >
                                  <Upload size={14} />
                                  {uploadState && !uploadState.error ? 'Uploading...' : 'Upload'}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      };

                      return (
                        <>
                          {/* Required Documents */}
                          {selectedService.requiredDocuments.some(d => d.isRequired) && (
                            <div>
                              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 pb-2 border-b border-slate-100">Required Documents</h4>
                              <div className="space-y-3">
                                {selectedService.requiredDocuments.filter(d => d.isRequired).map(doc => renderDocRow(doc, true))}
                              </div>
                            </div>
                          )}
                          
                          {/* Optional Documents */}
                          {selectedService.requiredDocuments.some(d => !d.isRequired) && (
                            <div>
                              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 pb-2 border-b border-slate-100">Optional Documents</h4>
                              <div className="space-y-3">
                                {selectedService.requiredDocuments.filter(d => !d.isRequired).map(doc => renderDocRow(doc, false))}
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Storage Summary */}
              {currentClientDocs.length > 0 && (
                <div className="bg-slate-800 text-white rounded-xl p-4 flex items-center justify-between shadow-sm">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">DOCUMENT STORAGE</p>
                    <p className="text-sm font-medium">
                      Files Uploaded: <span className="font-bold text-emerald-400">{currentClientDocs.length}</span> / {selectedService.requiredDocuments?.length || 0}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">TOTAL FILE SIZE</p>
                    <p className="text-lg font-bold">
                      {formatFileSize(currentClientDocs.reduce((acc: number, curr: ClientDocument) => acc + curr.fileSizeBytes, 0))}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 4 && (
             <div className="text-center py-12">
               <h3 className="text-lg font-bold text-slate-800 mb-2">Step 4: Processing</h3>
               <div className="flex flex-col items-center gap-4 mt-6">
                 <RefreshCw size={32} className="text-blue-500 animate-spin" />
                 <p className="text-sm text-slate-500 max-w-md">
                   Document processing happens asynchronously when you upload in Step 3. All uploaded documents are automatically routed to our Python processing engine. Please proceed to the Review step to verify the extracted data.
                 </p>
               </div>
             </div>
          )}

          {step === 5 && selectedService && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Step 5: Document Review</h3>
                  <p className="text-sm text-slate-500 mt-1">Review and approve extracted data before service activation.</p>
                </div>
              </div>

              {/* Review Summary */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-6 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Service Review Status</h4>
                  <p className="text-xs text-slate-500 mt-1">Aggregate status of all required documents.</p>
                </div>
                <div>
                  {serviceReviewStatus === 'READY_FOR_ACTIVATION' && <span className="bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2"><CheckCircle2 size={16} /> READY FOR ACTIVATION</span>}
                  {serviceReviewStatus === 'IN_REVIEW' && <span className="bg-blue-100 text-blue-800 px-3 py-1.5 rounded-lg text-sm font-bold">ACTION REQUIRED</span>}
                  {serviceReviewStatus === 'NOT_STARTED' && <span className="bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-bold">WAITING FOR UPLOADS</span>}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Required</p>
                  <p className="text-2xl font-bold text-slate-700">{selectedService.requiredDocuments?.filter(d => d.isRequired).length || 0}</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                  <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1">Processed</p>
                  <p className="text-2xl font-bold text-blue-700">{currentClientDocs.filter(d => d.processingStatus === 'COMPLETED').length}</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                  <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-1">Approved</p>
                  <p className="text-2xl font-bold text-emerald-700">{currentClientDocs.filter(d => d.reviewStatus === 'APPROVED').length}</p>
                </div>
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-center">
                  <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider mb-1">Rejected</p>
                  <p className="text-2xl font-bold text-rose-700">{currentClientDocs.filter(d => d.reviewStatus === 'REJECTED').length}</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                  <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-1">Re-upload Req</p>
                  <p className="text-2xl font-bold text-amber-700">{currentClientDocs.filter(d => d.reviewStatus === 'REUPLOAD_REQUIRED').length}</p>
                </div>
              </div>

              {/* Documents for Review */}
              <div className="space-y-4 mt-6">
                {currentClientDocs.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <p className="text-sm text-slate-500">No documents available for review.</p>
                  </div>
                ) : (
                  currentClientDocs.map(doc => {
                    const reqDoc = selectedService.requiredDocuments?.find(r => r.id === doc.documentRequirementId);
                    
                    return (
                      <div key={doc.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          {/* Left: Info */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-bold text-slate-800">{reqDoc?.name || 'Unknown Document'}</h4>
                              <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">v{doc.version}</span>
                              
                              {/* Status Badges */}
                              {doc.reviewStatus === 'APPROVED' && <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle2 size={12}/> APPROVED</span>}
                              {doc.reviewStatus === 'REJECTED' && <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full flex items-center gap-1"><X size={12}/> REJECTED</span>}
                              {doc.reviewStatus === 'REUPLOAD_REQUIRED' && <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">RE-UPLOAD REQ</span>}
                              {doc.reviewStatus === 'UNDER_REVIEW' && <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">UNDER REVIEW</span>}
                            </div>
                            
                            <div className="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-2 mb-4">
                              <span>File: <strong>{doc.fileName}</strong></span>
                              <span>Size: <strong>{formatFileSize(doc.fileSizeBytes)}</strong></span>
                              {doc.processingResult?.metadata && (
                                <>
                                  {doc.processingResult.metadata.pageCount && <span>Pages: <strong>{doc.processingResult.metadata.pageCount}</strong></span>}
                                  {doc.processingResult.metadata.rowCount && <span>Rows: <strong>{doc.processingResult.metadata.rowCount}</strong></span>}
                                  {doc.processingResult.metadata.sheetCount && <span>Sheets: <strong>{doc.processingResult.metadata.sheetCount}</strong></span>}
                                </>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <a href={doc.downloadUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1">
                                <Eye size={14} /> View Document
                              </a>
                              <button 
                                onClick={() => setViewingDataForDocId(viewingDataForDocId === doc.id ? null : doc.id)}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors"
                              >
                                {viewingDataForDocId === doc.id ? 'Hide Extracted Data' : 'View Extracted Data'}
                              </button>
                            </div>
                          </div>

                          {/* Right: Actions */}
                          <div className="flex flex-col gap-2 min-w-[140px]">
                            {(!doc.processingStatus || doc.processingStatus !== 'COMPLETED') ? (
                              <p className="text-xs text-slate-400 font-medium italic text-right">Processing incomplete...</p>
                            ) : (
                              <>
                                <button 
                                  onClick={() => {
                                    if(confirm(`Approve Document: ${doc.fileName}?`)) {
                                      approveDocument(doc.id, currentUser?.id || 'unknown');
                                    }
                                  }}
                                  disabled={!hasReviewPermission || doc.reviewStatus === 'APPROVED'}
                                  className="w-full px-3 py-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 disabled:opacity-50 text-xs font-bold rounded-lg transition-colors"
                                  title={!hasReviewPermission ? "You do not have review permissions" : ""}
                                >
                                  Approve
                                </button>
                                <button 
                                  onClick={() => setRejectingDocId(doc.id)}
                                  disabled={!hasReviewPermission || doc.reviewStatus === 'APPROVED'}
                                  className="w-full px-3 py-2 bg-rose-100 text-rose-700 hover:bg-rose-200 disabled:opacity-50 text-xs font-bold rounded-lg transition-colors"
                                  title={!hasReviewPermission ? "You do not have review permissions" : ""}
                                >
                                  Reject
                                </button>
                                <button 
                                  onClick={() => setReuploadingDocId(doc.id)}
                                  disabled={!hasReviewPermission || doc.reviewStatus === 'APPROVED'}
                                  className="w-full px-3 py-2 bg-amber-100 text-amber-700 hover:bg-amber-200 disabled:opacity-50 text-xs font-bold rounded-lg transition-colors"
                                  title={!hasReviewPermission ? "You do not have review permissions" : ""}
                                >
                                  Request Re-upload
                                </button>
                                <button 
                                  onClick={() => setCommentingDocId(commentingDocId === doc.id ? null : doc.id)}
                                  disabled={!hasReviewPermission}
                                  className="w-full px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-50 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
                                >
                                  <MessageSquare size={14} /> Comment
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Inline Reject Form */}
                        {rejectingDocId === doc.id && (
                          <div className="mt-4 p-4 bg-rose-50 border border-rose-200 rounded-xl">
                            <p className="text-xs font-bold text-rose-700 mb-2">Reject Document</p>
                            <input 
                              type="text" 
                              value={rejectReason}
                              onChange={e => setRejectReason(e.target.value)}
                              placeholder="Reason for rejection (required)..."
                              className="w-full text-sm border-rose-200 rounded-lg mb-2"
                            />
                            <div className="flex justify-end gap-2">
                              <button onClick={() => { setRejectingDocId(null); setRejectReason(''); }} className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-200 rounded-lg">Cancel</button>
                              <button 
                                onClick={() => {
                                  if(rejectReason.trim()){
                                    rejectDocument(doc.id, currentUser?.id || 'unknown', rejectReason);
                                    setRejectingDocId(null);
                                    setRejectReason('');
                                  }
                                }} 
                                disabled={!rejectReason.trim()}
                                className="px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-lg"
                              >
                                Confirm Rejection
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Inline Reupload Form */}
                        {reuploadingDocId === doc.id && (
                          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                            <p className="text-xs font-bold text-amber-700 mb-2">Request Re-upload</p>
                            <input 
                              type="text" 
                              value={reuploadReason}
                              onChange={e => setReuploadReason(e.target.value)}
                              placeholder="Reason for re-upload (required)..."
                              className="w-full text-sm border-amber-200 rounded-lg mb-2"
                            />
                            <div className="flex justify-end gap-2">
                              <button onClick={() => { setReuploadingDocId(null); setReuploadReason(''); }} className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-200 rounded-lg">Cancel</button>
                              <button 
                                onClick={() => {
                                  if(reuploadReason.trim()){
                                    requestReuploadDocument(doc.id, currentUser?.id || 'unknown', reuploadReason);
                                    setReuploadingDocId(null);
                                    setReuploadReason('');
                                  }
                                }} 
                                disabled={!reuploadReason.trim()}
                                className="px-3 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-lg"
                              >
                                Request Re-upload
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Extracted Data Viewer */}
                        {viewingDataForDocId === doc.id && doc.processingResult && (
                          <div className="mt-4 bg-slate-50 rounded-xl overflow-hidden border border-slate-200 p-4">
                            {renderExtractedData(doc.processingResult)}
                          </div>
                        )}

                        {/* Inline Comment Form */}
                        {commentingDocId === doc.id && (
                          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                            <p className="text-xs font-bold text-blue-700 mb-2">Add Review Comment</p>
                            <input 
                              type="text" 
                              value={reviewComment}
                              onChange={e => setReviewComment(e.target.value)}
                              placeholder="Write a comment..."
                              className="w-full text-sm border-blue-200 rounded-lg mb-2"
                            />
                            <div className="flex justify-end gap-2">
                              <button onClick={() => { setCommentingDocId(null); setReviewComment(''); }} className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-200 rounded-lg">Cancel</button>
                              <button 
                                onClick={() => {
                                  if(reviewComment.trim()){
                                    addDocumentReviewComment(doc.id, currentUser?.id || 'unknown', reviewComment.trim());
                                    setCommentingDocId(null);
                                    setReviewComment('');
                                  }
                                }} 
                                disabled={!reviewComment.trim()}
                                className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg"
                              >
                                Add Comment
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Document History */}
                        {doc.reviewHistory && doc.reviewHistory.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Document History</p>
                            <div className="space-y-2">
                              {doc.reviewHistory.map(history => (
                                <div key={history.id} className="text-xs flex gap-2 items-start">
                                  <span className="text-slate-400 whitespace-nowrap">{new Date(history.timestamp).toLocaleString()}</span>
                                  <div className="flex-1">
                                    <span className="font-bold text-slate-700">{history.action}</span>
                                    {history.reason && <span className="text-slate-500 ml-1">- {history.reason}</span>}
                                    {history.comment && <span className="text-slate-600 ml-1 italic block mt-0.5 px-2 py-1 bg-slate-50 border border-slate-100 rounded">"{history.comment}"</span>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="py-4">
              {isActivated ? (
                /* ── Post-Activation Success Screen ── */
                <div className="text-center max-w-md mx-auto">
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-100">
                    <CheckCircle2 size={40} className="text-emerald-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-1">✓ SERVICE ACTIVATED</h3>
                  <p className="text-sm text-slate-500 mb-8">The service has been successfully activated and is now live for this client.</p>

                  <div className="bg-white border border-slate-200 rounded-xl shadow-sm text-left space-y-0 mb-6 overflow-hidden">
                    {[
                      { label: 'Client', value: client?.companyName },
                      { label: 'Service', value: selectedService?.name },
                      { label: 'Status', value: 'ACTIVE', highlight: true },
                      { label: 'Frequency', value: selectedService?.frequency || 'Monthly' },
                      { label: 'Start Date', value: new Date(activationStartDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) },
                      { label: 'Activated', value: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) },
                      { label: 'Activated By', value: currentUser?.name || currentUser?.id },
                      { label: 'Client Service ID', value: activatedServiceId || '—', mono: true },
                    ].map(({ label, value, highlight, mono }) => (
                      <div key={label} className="flex justify-between items-center text-sm px-5 py-3 border-b border-slate-100 last:border-0">
                        <span className="text-slate-500 font-medium">{label}</span>
                        <span className={`font-bold ${highlight ? 'text-emerald-600' : 'text-slate-800'} ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-left mb-6">
                    <p className="text-xs font-bold text-blue-700 mb-1">Task Generation Ready</p>
                    <p className="text-xs text-blue-600">This service is now linked to the Service Master. Task templates can be generated from the Work Management module when ready.</p>
                  </div>

                  <button
                    onClick={onClose}
                    className="px-8 py-2.5 text-sm font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-xl transition-colors"
                  >
                    Close &amp; View Client Services
                  </button>
                </div>
              ) : (
                /* ── Pre-Activation Checklist ── */
                <div className="max-w-2xl mx-auto">
                  <h3 className="text-xl font-bold text-slate-800 mb-1 text-center">Activate Service</h3>
                  <p className="text-sm text-slate-500 text-center mb-6">All conditions below must be satisfied before activation.</p>

                  {/* Activation Checklist */}
                  <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden mb-5">
                    <div className="p-4 bg-slate-50 border-b border-slate-200">
                      <h4 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Activation Checklist</h4>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {activationChecklist.map((item) => (
                        <div key={item.label} className="flex items-center justify-between px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${item.ok ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                              {item.ok
                                ? <CheckCircle2 size={14} className="text-emerald-600" />
                                : <X size={14} className="text-rose-600" />
                              }
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-700">{item.label}</p>
                              {!item.ok && item.fail && <p className="text-xs text-rose-600 mt-0.5">{item.fail}</p>}
                            </div>
                          </div>
                          <span className="text-xs font-medium text-slate-500">{item.detail}</span>
                        </div>
                      ))}
                    </div>
                    <div className={`px-5 py-3 border-t ${canActivate ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                      <p className={`text-xs font-bold ${canActivate ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {canActivate ? '✓ Ready for Activation' : `✗ Not Ready — ${firstFailReason}`}
                      </p>
                    </div>
                  </div>

                  {/* Service Start Date */}
                  <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 mb-5">
                    <label className="block text-sm font-bold text-slate-700 mb-1">Service Start Date</label>
                    <p className="text-xs text-slate-500 mb-3">Official start date for this engagement. This will be stored with the activation record.</p>
                    <input
                      type="date"
                      value={activationStartDate}
                      onChange={e => setActivationStartDate(e.target.value)}
                      className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow"
                    />
                  </div>

                  {/* Activation Error */}
                  {activationError && (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-4 flex items-start gap-3">
                      <X size={16} className="text-rose-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-rose-700 font-medium">{activationError}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        {!isActivated && (
          <div className="p-6 border-t border-slate-100 flex justify-between items-center shrink-0 bg-white rounded-b-2xl">
            <button
              onClick={() => {
                if (step > 1) setStep(step - 1);
                else onClose();
              }}
              className="px-6 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              {step > 1 ? 'Back' : 'Cancel'}
            </button>
            <div className="flex items-center gap-3">
              {step === 6 && !canActivate && firstFailReason && (
                <p className="text-xs text-rose-600 font-medium max-w-xs text-right">{firstFailReason}</p>
              )}
              <button
                disabled={
                  !selectedServiceId ||
                  (step === 5 && selectedService && selectedService.requiredDocuments?.filter(d => d.isRequired).some(reqDoc =>
                    !currentClientDocs.some(doc => doc.documentRequirementId === reqDoc.id && doc.reviewStatus === 'APPROVED')
                  )) ||
                  (step === 6 && !canActivate)
                }
                onClick={() => {
                  if (step === 6) setShowActivationConfirm(true);
                  else handleNext();
                }}
                className="px-6 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors"
              >
                {step === 6 ? 'Activate Service' : 'Next'}
              </button>
            </div>
          </div>
        )}

        {/* Enhanced Confirmation Modal */}
        {showActivationConfirm && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm rounded-2xl">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md animate-in zoom-in-95 duration-200">
              <h3 className="text-lg font-bold text-slate-800 mb-1">Activate Service?</h3>
              <p className="text-xs text-slate-500 mb-5">Review the details below before confirming. This action will create an active client service record.</p>

              <div className="bg-slate-50 border border-slate-200 rounded-xl divide-y divide-slate-200 mb-5 overflow-hidden text-sm">
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-slate-500">Client</span>
                  <span className="font-bold text-slate-800">{client?.companyName}</span>
                </div>
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-slate-500">Service</span>
                  <span className="font-bold text-slate-800">{selectedService?.name}</span>
                </div>
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-slate-500">Required Documents</span>
                  <span className="font-bold text-emerald-600">
                    {currentClientDocs.filter(d => d.reviewStatus === 'APPROVED').length} / {selectedService?.requiredDocuments?.filter(d => d.isRequired).length || 0} Approved
                  </span>
                </div>
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-slate-500">Configuration</span>
                  <span className="font-bold text-slate-800">{serviceParameters.length} param(s) — Complete</span>
                </div>
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-slate-500">Start Date</span>
                  <span className="font-bold text-slate-800">{new Date(activationStartDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>

              <p className="text-xs text-slate-500 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-5">
                Once activated, this service will become an <strong>active service</strong> for this client. The configuration and approved documents will be locked as a snapshot.
              </p>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowActivationConfirm(false)}
                  className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleActivateService}
                  className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                >
                  Confirm Activation
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
