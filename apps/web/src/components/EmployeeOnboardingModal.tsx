import React, { useState } from 'react';
import { useDashboardStore } from '../store/dashboardStore';
import { EmployeeOnboardingData } from '../types';
import { User, FileText, Briefcase, Camera, ShieldCheck, Phone, MapPin, CheckCircle2 } from 'lucide-react';

export const EmployeeOnboardingModal: React.FC = () => {
  const { currentUser, submitEmployeeOnboarding, logoutUser } = useDashboardStore();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<Partial<EmployeeOnboardingData>>({
    fullName: currentUser?.name || '',
    email: currentUser?.email || '',
    dob: '',
    bloodGroup: '',
    mobileNo: '',
    permanentAddress: '',
    localAddress: '',
    panCardNo: '',
    aadharCardNo: '',
    passportNo: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, fieldName: keyof EmployeeOnboardingData) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, [fieldName]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setLoading(true);
    // Add submission date
    const finalData = {
      ...formData,
      submittedAt: new Date().toISOString(),
    } as EmployeeOnboardingData;

    setTimeout(() => {
      submitEmployeeOnboarding(currentUser.id, finalData);
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
              VANNTAGGE <span className="text-blue-600">ONBOARDING</span>
            </h1>
            <p className="text-slate-500 text-sm mt-1 font-medium tracking-wide uppercase">Employee Profile & Documentation Form</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              type="button"
              onClick={logoutUser}
              className="px-5 py-2 text-slate-600 border border-slate-300 hover:bg-slate-50 rounded font-bold text-xs uppercase tracking-wider transition-colors w-full md:w-auto text-center"
            >
              Sign Out
            </button>
            <button 
              type="submit" 
              form="onboardingForm" 
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white border border-blue-700 rounded font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center justify-center gap-2 w-full md:w-auto"
            >
              {loading ? 'Submitting...' : 'Submit Form'}
            </button>
          </div>
        </div>

        {/* Scrollable Form Area */}
        <div className="p-8 overflow-y-auto flex-1 bg-white">
          <form id="onboardingForm" onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-12">
            
            {/* Header info box (like Invoice "BILLED TO") */}
            <div className="flex flex-col md:flex-row gap-8 pb-8 border-b border-slate-200">
              <div className="flex-1">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Employee Details</span>
                <p className="text-sm font-bold text-slate-800">{currentUser?.name}</p>
                <p className="text-sm text-slate-600 mt-1">{currentUser?.email}</p>
                <p className="text-sm text-slate-600 mt-1">Role: {currentUser?.role}</p>
              </div>
              <div className="flex-1 md:border-l md:border-slate-200 md:pl-8">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Form Tracking</span>
                <p className="text-sm text-slate-600 mt-1 flex justify-between"><span className="font-medium text-slate-500">Date:</span> <span className="font-bold text-slate-800">{new Date().toISOString().split('T')[0]}</span></p>
                <p className="text-sm text-slate-600 mt-1 flex justify-between"><span className="font-medium text-slate-500">Status:</span> <span className="font-bold text-amber-600">Pending Setup</span></p>
              </div>
            </div>

            {/* 1. Personal Details */}
            <section>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span> Personal Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Full Legal Name *</label>
                  <input required type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="w-full border-b border-slate-300 py-2 focus:outline-none focus:border-blue-600 transition-colors text-sm font-medium text-slate-800 bg-transparent" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Email Address *</label>
                  <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full border-b border-slate-300 py-2 focus:outline-none text-sm font-medium text-slate-500 bg-transparent" disabled />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Date of Birth *</label>
                  <input required type="date" name="dob" value={formData.dob} onChange={handleChange} className="w-full border-b border-slate-300 py-2 focus:outline-none focus:border-blue-600 transition-colors text-sm font-medium text-slate-800 bg-transparent" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Blood Group *</label>
                  <div className="grid grid-cols-8 gap-1">
                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bg) => (
                      <button
                        key={bg}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, bloodGroup: bg }))}
                        className={`py-1 text-[10px] font-bold transition-all border ${
                          formData.bloodGroup === bg 
                            ? 'bg-slate-800 text-white border-slate-800 shadow-sm' 
                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                        }`}
                      >
                        {bg}
                      </button>
                    ))}
                  </div>
                  <input type="text" required value={formData.bloodGroup} className="w-0 h-0 opacity-0 absolute" readOnly />
                </div>
                <div className="md:col-span-2 mt-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Profile Photo *</label>
                  <input required type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'photoBase64')} className="w-full text-sm text-slate-500 file:mr-4 file:py-1.5 file:px-4 file:border file:border-slate-300 file:bg-white file:text-slate-700 file:text-xs file:font-bold hover:file:bg-slate-50 cursor-pointer transition-colors" />
                </div>
              </div>
            </section>

            {/* 2. Contact & Address */}
            <section className="pt-8 border-t border-slate-200">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span> Contact & Location
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Mobile Number *</label>
                  <input required type="tel" name="mobileNo" value={formData.mobileNo} onChange={handleChange} className="w-full md:w-1/2 border-b border-slate-300 py-2 focus:outline-none focus:border-green-600 transition-colors text-sm font-medium text-slate-800 bg-transparent" placeholder="+91" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Permanent Address *</label>
                  <textarea required name="permanentAddress" value={formData.permanentAddress} onChange={handleChange} className="w-full border border-slate-300 p-3 focus:outline-none focus:border-green-600 transition-colors text-sm font-medium text-slate-800 bg-transparent h-24 resize-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Local Address *</label>
                  <textarea required name="localAddress" value={formData.localAddress} onChange={handleChange} className="w-full border border-slate-300 p-3 focus:outline-none focus:border-green-600 transition-colors text-sm font-medium text-slate-800 bg-transparent h-24 resize-none" placeholder="Same as permanent address if applicable" />
                </div>
              </div>
            </section>

            {/* 3. Identity Documents */}
            <section className="pt-8 border-t border-slate-200">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-purple-600 rounded-full"></span> Identity Verification
              </h3>
              
              {/* Document Grid (Table-like style) */}
              <div className="border border-slate-200 rounded-sm">
                <div className="grid grid-cols-12 bg-slate-50 border-b border-slate-200 p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <div className="col-span-4">Document Type</div>
                  <div className="col-span-4">Document Number</div>
                  <div className="col-span-4">File Upload</div>
                </div>
                
                {/* PAN Row */}
                <div className="grid grid-cols-12 border-b border-slate-200 p-3 items-center">
                  <div className="col-span-4 text-sm font-bold text-slate-800">PAN Card *</div>
                  <div className="col-span-4 pr-4">
                    <input required type="text" name="panCardNo" placeholder="ABCD..." value={formData.panCardNo} onChange={handleChange} className="w-full border-b border-slate-300 py-1 focus:outline-none focus:border-purple-600 uppercase text-xs font-medium" />
                  </div>
                  <div className="col-span-4">
                    <input required type="file" accept="image/*,.pdf" onChange={(e) => handleFileUpload(e, 'panCardBase64')} className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:border file:border-slate-300 file:bg-white file:text-slate-700 file:text-xs file:font-bold hover:file:bg-slate-50 cursor-pointer transition-colors" />
                  </div>
                </div>

                {/* Aadhar Row */}
                <div className="grid grid-cols-12 border-b border-slate-200 p-3 items-center">
                  <div className="col-span-4 text-sm font-bold text-slate-800">Aadhar Card *</div>
                  <div className="col-span-4 pr-4">
                    <input required type="text" name="aadharCardNo" placeholder="1234..." value={formData.aadharCardNo} onChange={handleChange} className="w-full border-b border-slate-300 py-1 focus:outline-none focus:border-purple-600 text-xs font-medium" />
                  </div>
                  <div className="col-span-4">
                    <input required type="file" accept="image/*,.pdf" onChange={(e) => handleFileUpload(e, 'aadharCardBase64')} className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:border file:border-slate-300 file:bg-white file:text-slate-700 file:text-xs file:font-bold hover:file:bg-slate-50 cursor-pointer transition-colors" />
                  </div>
                </div>

                {/* Passport Row */}
                <div className="grid grid-cols-12 p-3 items-center">
                  <div className="col-span-4 text-sm font-bold text-slate-800">Passport <span className="text-slate-400 font-normal text-xs ml-1">(Optional)</span></div>
                  <div className="col-span-4 pr-4">
                    <input type="text" name="passportNo" placeholder="Opt..." value={formData.passportNo} onChange={handleChange} className="w-full border-b border-slate-300 py-1 focus:outline-none focus:border-purple-600 uppercase text-xs font-medium" />
                  </div>
                  <div className="col-span-4">
                    <input type="file" accept="image/*,.pdf" onChange={(e) => handleFileUpload(e, 'passportBase64')} className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:border file:border-slate-300 file:bg-white file:text-slate-700 file:text-xs file:font-bold hover:file:bg-slate-50 cursor-pointer transition-colors" />
                  </div>
                </div>
              </div>
            </section>

            {/* 4. Professional Documents */}
            <section className="pt-8 border-t border-slate-200 pb-12">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-amber-600 rounded-full"></span> Professional & Education
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Degree Certificate *</label>
                  <input required type="file" accept="image/*,.pdf" onChange={(e) => handleFileUpload(e, 'educationDegreeBase64')} className="w-full text-sm text-slate-500 file:mr-4 file:py-1.5 file:px-4 file:border file:border-slate-300 file:bg-white file:text-slate-700 file:text-xs file:font-bold hover:file:bg-slate-50 cursor-pointer transition-colors" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Previous Appointment Letter *</label>
                  <input required type="file" accept="image/*,.pdf" onChange={(e) => handleFileUpload(e, 'previousApptLetterBase64')} className="w-full text-sm text-slate-500 file:mr-4 file:py-1.5 file:px-4 file:border file:border-slate-300 file:bg-white file:text-slate-700 file:text-xs file:font-bold hover:file:bg-slate-50 cursor-pointer transition-colors" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Relieving Letter *</label>
                  <input required type="file" accept="image/*,.pdf" onChange={(e) => handleFileUpload(e, 'relievingLetterBase64')} className="w-full text-sm text-slate-500 file:mr-4 file:py-1.5 file:px-4 file:border file:border-slate-300 file:bg-white file:text-slate-700 file:text-xs file:font-bold hover:file:bg-slate-50 cursor-pointer transition-colors" />
                </div>
              </div>
            </section>

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
