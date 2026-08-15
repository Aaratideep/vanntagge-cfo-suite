import React, { useState, useRef, useEffect } from 'react';
import { useDashboardStore } from '../../store/dashboardStore';
import { ClientOnboardingData } from '../../types';
import { CheckCircle2, ChevronDown } from 'lucide-react';

const REQUIRED_PROCESSES = {
  "Sales & Debtors": [
    "Sales outlet wise tracking & billing",
    "Debtors only from latest week",
    "Debtors Recovery Tracker"
  ],
  "Purchase & Creditors": [
    "Purchase of material outletwise billing",
    "Labour charges outletwise billing",
    "Other purchases outletwise & billing",
    "Purchase returns (if nay) outletwise & billing",
    "Product transfer inward & outwards outletwise",
    "Product transfer inter company matching",
    "Vendor payment",
    "Vendor Reconciliation",
    "Creditor ageing tracker"
  ],
  "Bank": [
    "Bank receipt entries in Books",
    "Bank payment entries in Books",
    "Bank transfer Inter company entries in Books",
    "Bank Reconciliations",
    "BG recovery",
    "OD Line, Credit card, OD line, FD",
    "Clear Unidentified/ Suspense entries in Books"
  ],
  "Salary & Wages": [
    "Salary payment : cash",
    "Salary payment : bank",
    "Salary exp & payment booking in Books",
    "PF Payment",
    "PT Payment",
    "ESIC Payment",
    "MLWF Payment"
  ],
  "Statutory Dues": [
    "GSTR 1",
    "GSTR 3B",
    "GSTR 2 ReCo",
    "GST Annual Audit",
    "GST pendancy : recovery",
    "TDS Working (exp booking & payment review)",
    "TDS Payment",
    "TDS Return filing"
  ],
  "Other Exp": [
    "Deposits Assets",
    "Deposits liability",
    "Provision for expenses",
    "Other Payables",
    "Tally Back up"
  ]
};

const MultiSelectDropdown = ({ label, options, selected, onChange }: { label: string, options: string[], selected: string[], onChange: (val: string[]) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(item => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">{label}</label>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full border-b border-slate-300 py-2 cursor-pointer flex justify-between items-center transition-colors text-sm font-medium text-slate-800 bg-transparent"
      >
        <span className="truncate pr-4">
          {selected.length === 0 ? "Select options..." : `${selected.length} selected`}
        </span>
        <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      
      {isOpen && (
        <div className="absolute z-10 top-full left-0 w-full mt-1 bg-white border border-slate-200 shadow-xl rounded-lg max-h-60 overflow-y-auto">
          {options.map((opt, i) => (
            <label key={i} className="flex items-start gap-3 p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0">
              <input 
                type="checkbox" 
                checked={selected.includes(opt)} 
                onChange={() => toggleOption(opt)}
                className="mt-1"
              />
              <span className="text-xs text-slate-700 font-medium leading-tight">{opt}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

export const ClientOnboardingModal: React.FC = () => {
  const { currentUser, submitClientOnboarding, logoutUser } = useDashboardStore();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState<Partial<ClientOnboardingData>>({
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    companyName: '',
    entityType: 'Pvt. Ltd.',
    industry: '',
    contactPerson: currentUser?.name || '',
    mobileNo: '',
    email: currentUser?.email || '',
    registeredAddress: '',
    gstin: '',
    panCardNo: '',
    requiredServices: {}
  });

  const handleServiceChange = (category: string, selectedOptions: string[]) => {
    setFormData(prev => ({
      ...prev,
      requiredServices: {
        ...(prev.requiredServices || {}),
        [category]: selectedOptions
      }
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, fieldName: keyof ClientOnboardingData) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, [fieldName]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProcessDocUpload = (e: React.ChangeEvent<HTMLInputElement>, category: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ 
          ...prev, 
          processDocuments: {
            ...(prev.processDocuments || {}),
            [category]: reader.result as string
          }
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
      return;
    }

    if (!currentUser) return;

    setLoading(true);
    // Add submission date
    const finalData = {
      ...formData,
      submittedAt: new Date().toISOString(),
    } as ClientOnboardingData;

    setTimeout(() => {
      submitClientOnboarding(currentUser.id, finalData);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-5xl overflow-hidden flex flex-col max-h-[95vh] shadow-2xl relative">
        
        {/* Document Header (Invoice Style) */}
        <div className="bg-white p-8 border-b border-slate-200 shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              VANNTAGGE <span className="text-blue-600">CLIENT</span>
            </h1>
            <p className="text-slate-500 text-sm mt-1 font-medium tracking-wide uppercase">Client Onboarding & Setup Form</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-2 text-slate-600 border border-slate-300 hover:bg-slate-50 rounded font-bold text-xs uppercase tracking-wider transition-colors"
              >
                ← Back
              </button>
            )}
            {step === 1 && (
              <button
                type="button"
                onClick={logoutUser}
                className="px-5 py-2 text-slate-600 border border-slate-300 hover:bg-slate-50 rounded font-bold text-xs uppercase tracking-wider transition-colors w-full md:w-auto text-center"
              >
                Sign Out
              </button>
            )}
            <button 
              type="submit" 
              form="clientOnboardingForm" 
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white border border-blue-700 rounded font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center justify-center gap-2 w-full md:w-auto"
            >
              {loading ? 'Submitting...' : step === 1 ? 'Next ➔' : 'Complete Setup'}
            </button>
          </div>
        </div>

        {/* Scrollable Form Area */}
        <div className="p-8 overflow-y-auto flex-1 bg-white">
          <form id="clientOnboardingForm" onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-12">
            
            {/* Header info box */}
            <div className="flex flex-col md:flex-row gap-8 pb-8 border-b border-slate-200">
              <div className="flex-1">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Account Holder</span>
                <p className="text-sm font-bold text-slate-800">{currentUser?.name}</p>
                <p className="text-sm text-slate-600 mt-1">{currentUser?.email}</p>
                <p className="text-sm text-slate-600 mt-1">Role: Client Representative</p>
              </div>
              <div className="flex-1 md:border-l md:border-slate-200 md:pl-8">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Form Tracking</span>
                <p className="text-sm text-slate-600 mt-1 flex justify-between"><span className="font-medium text-slate-500">Date:</span> <span className="font-bold text-slate-800">{new Date().toISOString().split('T')[0]}</span></p>
                <p className="text-sm text-slate-600 mt-1 flex justify-between"><span className="font-medium text-slate-500">Status:</span> <span className="font-bold text-amber-600">Pending Setup</span></p>
              </div>
            </div>

            {step === 1 && (
              <>
                {/* 1. Owner / Founder Details */}
                <section>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-purple-600 rounded-full"></span> Owner / Founder Details
                  </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Owner Name</label>
                  <input type="text" name="ownerName" value={formData.ownerName} onChange={handleChange} className="w-full border-b border-slate-300 py-2 focus:outline-none focus:border-purple-600 transition-colors text-sm font-medium text-slate-800 bg-transparent" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Owner Email</label>
                  <input type="email" name="ownerEmail" value={formData.ownerEmail} onChange={handleChange} className="w-full border-b border-slate-300 py-2 focus:outline-none focus:border-purple-600 transition-colors text-sm font-medium text-slate-800 bg-transparent" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Owner Phone</label>
                  <input type="tel" name="ownerPhone" value={formData.ownerPhone} onChange={handleChange} className="w-full border-b border-slate-300 py-2 focus:outline-none focus:border-purple-600 transition-colors text-sm font-medium text-slate-800 bg-transparent" />
                </div>
              </div>
            </section>

            {/* 2. Company Profile */}
            <section className="pt-8 border-t border-slate-200">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span> Company Profile
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Legal Company Name *</label>
                  <input required type="text" name="companyName" value={formData.companyName} onChange={handleChange} className="w-full border-b border-slate-300 py-2 focus:outline-none focus:border-blue-600 transition-colors text-sm font-medium text-slate-800 bg-transparent" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Entity Type *</label>
                  <select required name="entityType" value={formData.entityType} onChange={handleChange} className="w-full border-b border-slate-300 py-2 focus:outline-none focus:border-blue-600 transition-colors text-sm font-medium text-slate-800 bg-transparent">
                    <option value="Pvt. Ltd.">Private Limited (Pvt. Ltd.)</option>
                    <option value="LLP">Limited Liability Partnership (LLP)</option>
                    <option value="Partnership">Partnership</option>
                    <option value="Proprietorship">Sole Proprietorship</option>
                    <option value="Public Ltd.">Public Limited</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Industry *</label>
                  <input required type="text" name="industry" value={formData.industry} onChange={handleChange} className="w-full border-b border-slate-300 py-2 focus:outline-none focus:border-blue-600 transition-colors text-sm font-medium text-slate-800 bg-transparent" placeholder="e.g. Technology, Retail, Manufacturing" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Registered Address *</label>
                  <textarea required name="registeredAddress" value={formData.registeredAddress} onChange={handleChange} className="w-full border border-slate-300 p-3 focus:outline-none focus:border-blue-600 transition-colors text-sm font-medium text-slate-800 bg-transparent h-24 resize-none" />
                </div>
              </div>
            </section>

            {/* 2. Primary Contact Details */}
            <section className="pt-8 border-t border-slate-200">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span> Primary Contact Person
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Full Name *</label>
                  <input required type="text" name="contactPerson" value={formData.contactPerson} onChange={handleChange} className="w-full border-b border-slate-300 py-2 focus:outline-none focus:border-green-600 transition-colors text-sm font-medium text-slate-800 bg-transparent" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Email Address *</label>
                  <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full border-b border-slate-300 py-2 focus:outline-none focus:border-green-600 transition-colors text-sm font-medium text-slate-500 bg-transparent" disabled />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Mobile Number *</label>
                  <input required type="tel" name="mobileNo" value={formData.mobileNo} onChange={handleChange} className="w-full border-b border-slate-300 py-2 focus:outline-none focus:border-green-600 transition-colors text-sm font-medium text-slate-800 bg-transparent" placeholder="+91" />
                </div>
              </div>
            </section>

            {/* 3. Statutory Details & Documents */}
            <section className="pt-8 border-t border-slate-200 pb-12">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-purple-600 rounded-full"></span> Statutory KYC & Documents
              </h3>
              
              <div className="border border-slate-200 rounded-sm">
                <div className="grid grid-cols-12 bg-slate-50 border-b border-slate-200 p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <div className="col-span-4">Document Type</div>
                  <div className="col-span-4">Registration Number</div>
                  <div className="col-span-4">File Upload</div>
                </div>
                
                {/* GST Row */}
                <div className="grid grid-cols-12 border-b border-slate-200 p-3 items-center">
                  <div className="col-span-4 text-sm font-bold text-slate-800">GST Registration *</div>
                  <div className="col-span-4 pr-4">
                    <input required type="text" name="gstin" placeholder="GSTIN" value={formData.gstin} onChange={handleChange} className="w-full border-b border-slate-300 py-1 focus:outline-none focus:border-purple-600 uppercase text-xs font-medium" />
                  </div>
                  <div className="col-span-4">
                    <input required type="file" accept="image/*,.pdf" onChange={(e) => handleFileUpload(e, 'gstCertificateBase64')} className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:border file:border-slate-300 file:bg-white file:text-slate-700 file:text-xs file:font-bold hover:file:bg-slate-50 cursor-pointer transition-colors" />
                  </div>
                </div>

                {/* PAN Row */}
                <div className="grid grid-cols-12 border-b border-slate-200 p-3 items-center">
                  <div className="col-span-4 text-sm font-bold text-slate-800">Company PAN *</div>
                  <div className="col-span-4 pr-4">
                    <input required type="text" name="panCardNo" placeholder="PAN Number" value={formData.panCardNo} onChange={handleChange} className="w-full border-b border-slate-300 py-1 focus:outline-none focus:border-purple-600 uppercase text-xs font-medium" />
                  </div>
                  <div className="col-span-4">
                    <input required type="file" accept="image/*,.pdf" onChange={(e) => handleFileUpload(e, 'panCardBase64')} className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:border file:border-slate-300 file:bg-white file:text-slate-700 file:text-xs file:font-bold hover:file:bg-slate-50 cursor-pointer transition-colors" />
                  </div>
                </div>

                {/* Incorporation Row */}
                <div className="grid grid-cols-12 border-b border-slate-200 p-3 items-center">
                  <div className="col-span-4 text-sm font-bold text-slate-800">Incorporation Cert *</div>
                  <div className="col-span-4 pr-4 text-xs text-slate-500">Not Applicable for Proprietorship</div>
                  <div className="col-span-4">
                    <input required={formData.entityType !== 'Proprietorship'} type="file" accept="image/*,.pdf" onChange={(e) => handleFileUpload(e, 'incorporationCertBase64')} className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:border file:border-slate-300 file:bg-white file:text-slate-700 file:text-xs file:font-bold hover:file:bg-slate-50 cursor-pointer transition-colors" />
                  </div>
                </div>

                {/* Cancelled Cheque */}
                <div className="grid grid-cols-12 p-3 items-center">
                  <div className="col-span-4 text-sm font-bold text-slate-800">Cancelled Cheque *</div>
                  <div className="col-span-4 pr-4 text-xs text-slate-500">For Bank Account Verification</div>
                  <div className="col-span-4">
                    <input required type="file" accept="image/*,.pdf" onChange={(e) => handleFileUpload(e, 'cancelledChequeBase64')} className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:border file:border-slate-300 file:bg-white file:text-slate-700 file:text-xs file:font-bold hover:file:bg-slate-50 cursor-pointer transition-colors" />
                  </div>
                </div>
              </div>
            </section>

            {/* 4. Required Services & Processes */}
            <section className="pt-8 border-t border-slate-200 pb-12">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-amber-600 rounded-full"></span> Required Services & Processes
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
                {Object.entries(REQUIRED_PROCESSES).map(([category, options]) => (
                  <MultiSelectDropdown
                    key={category}
                    label={category}
                    options={options}
                    selected={formData.requiredServices?.[category] || []}
                    onChange={(selected) => handleServiceChange(category, selected)}
                  />
                ))}
              </div>
            </section>
            </>
            )}

            {step === 2 && (
              <>
                <section className="pt-4 pb-12">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full"></span> Process Document Uploads
                  </h3>
                  <p className="text-xs text-slate-500 mb-6">Upload required documents for the processes you selected in the previous step.</p>
                  
                  <div className="space-y-6">
                    {Object.entries(formData.requiredServices || {}).filter(([_, opts]) => opts.length > 0).length === 0 ? (
                      <div className="p-8 border-2 border-dashed border-slate-200 rounded-xl text-center">
                        <p className="text-sm text-slate-500 font-medium">No required processes were selected.</p>
                        <p className="text-xs text-slate-400 mt-1">You can skip this step or go back to select processes.</p>
                      </div>
                    ) : (
                      Object.entries(formData.requiredServices || {})
                        .filter(([_, opts]) => opts.length > 0)
                        .map(([category, opts]) => (
                          <div key={category} className="border border-slate-200 rounded-xl overflow-hidden">
                            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                              <h4 className="text-sm font-bold text-slate-800">{category}</h4>
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-200 px-2 py-0.5 rounded-full">{opts.length} selected</span>
                            </div>
                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                              <div>
                                <p className="text-xs font-semibold text-slate-600 mb-1">Selected Processes:</p>
                                <ul className="list-disc pl-4 space-y-1">
                                  {opts.map((opt, i) => (
                                    <li key={i} className="text-[10px] text-slate-500">{opt}</li>
                                  ))}
                                </ul>
                              </div>
                              <div className="bg-white border border-slate-200 rounded-lg p-3">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Upload Requirements File</label>
                                <input 
                                  type="file" 
                                  accept="image/*,.pdf,.csv,.xlsx" 
                                  onChange={(e) => handleProcessDocUpload(e, category)} 
                                  className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:border file:border-slate-300 file:bg-white file:text-slate-700 file:text-xs file:font-bold hover:file:bg-slate-50 cursor-pointer transition-colors rounded-md" 
                                />
                                {formData.processDocuments?.[category] && (
                                  <div className="mt-2 text-xs font-bold text-emerald-600 flex items-center gap-1">
                                    <CheckCircle2 size={12} /> File Uploaded
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </section>
              </>
            )}

          </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
          <p className="text-xs text-slate-500 pl-4">
            <span className="font-bold text-slate-700 flex items-center gap-1"><CheckCircle2 size={12} className="text-green-500" /> Data Privacy:</span> 
            All documents are stored securely with encryption and restricted access.
          </p>
        </div>
      </div>
    </div>
  );
};
