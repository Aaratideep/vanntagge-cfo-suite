import React from 'react';
import { X, Building, Mail, Phone, MapPin, CheckCircle, FileText, Download, Briefcase } from 'lucide-react';
import { User } from '../../types';

interface ClientUserDetailsModalProps {
  user: User;
  onClose: () => void;
}

export const ClientUserDetailsModal: React.FC<ClientUserDetailsModalProps> = ({ user, onClose }) => {
  const data = user.clientOnboardingData;

  const handleDownload = (base64Data: string, filename: string) => {
    const a = document.createElement('a');
    a.href = base64Data;
    a.download = filename;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-200 p-6 flex justify-between items-start shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-2xl shadow-sm">
              {data?.companyName?.charAt(0) || user.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">{data?.companyName || user.name}</h2>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm text-slate-500">{user.email}</span>
                {user.isOnboarded ? (
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-bold flex items-center gap-1">
                    <CheckCircle size={12} /> Setup Complete
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-bold">
                    Pending Setup
                  </span>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {!data ? (
            <div className="text-center py-12">
              <p className="text-slate-500">This client has not completed the onboarding process yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Profile Details */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4 flex items-center gap-2">
                  <Building size={18} className="text-blue-600"/> Company Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                  <div><p className="text-xs text-slate-500 font-medium">Legal Name</p><p className="text-sm font-bold text-slate-800">{data.companyName}</p></div>
                  <div><p className="text-xs text-slate-500 font-medium">Entity Type</p><p className="text-sm font-bold text-slate-800">{data.entityType}</p></div>
                  <div><p className="text-xs text-slate-500 font-medium">Industry</p><p className="text-sm font-bold text-slate-800">{data.industry}</p></div>
                  <div className="md:col-span-2"><p className="text-xs text-slate-500 font-medium flex items-center gap-1"><MapPin size={12}/> Registered Address</p><p className="text-sm font-bold text-slate-800 mt-1">{data.registeredAddress}</p></div>
                </div>
              </div>

              {/* Contact Person */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4 flex items-center gap-2">
                  <Briefcase size={18} className="text-emerald-600"/> Primary Contact
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-y-4 gap-x-8">
                  <div><p className="text-xs text-slate-500 font-medium">Contact Person</p><p className="text-sm font-bold text-slate-800">{data.contactPerson}</p></div>
                  <div><p className="text-xs text-slate-500 font-medium flex items-center gap-1"><Phone size={12}/> Mobile</p><p className="text-sm font-bold text-slate-800">{data.mobileNo}</p></div>
                  <div><p className="text-xs text-slate-500 font-medium flex items-center gap-1"><Mail size={12}/> Email</p><p className="text-sm font-bold text-slate-800">{data.email}</p></div>
                </div>
              </div>

              {/* Statutory Info */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4 flex items-center gap-2">
                  <FileText size={18} className="text-purple-600"/> Statutory Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                  <div><p className="text-xs text-slate-500 font-medium">GSTIN</p><p className="text-sm font-bold text-slate-800 uppercase">{data.gstin}</p></div>
                  <div><p className="text-xs text-slate-500 font-medium">PAN Card No.</p><p className="text-sm font-bold text-slate-800 uppercase">{data.panCardNo}</p></div>
                </div>
              </div>

              {/* Uploaded Documents */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4 flex items-center gap-2">
                  <Download size={18} className="text-amber-600"/> Uploaded Documents
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.gstCertificateBase64 && (
                    <div className="p-3 border border-slate-200 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2"><FileText size={16} className="text-slate-400"/><span className="text-sm font-medium text-slate-700">GST Certificate</span></div>
                      <button onClick={() => handleDownload(data.gstCertificateBase64!, `${data.companyName}-GST.png`)} className="text-blue-600 hover:text-blue-800 text-xs font-bold">Download</button>
                    </div>
                  )}
                  {data.panCardBase64 && (
                    <div className="p-3 border border-slate-200 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2"><FileText size={16} className="text-slate-400"/><span className="text-sm font-medium text-slate-700">Company PAN</span></div>
                      <button onClick={() => handleDownload(data.panCardBase64!, `${data.companyName}-PAN.png`)} className="text-blue-600 hover:text-blue-800 text-xs font-bold">Download</button>
                    </div>
                  )}
                  {data.incorporationCertBase64 && (
                    <div className="p-3 border border-slate-200 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2"><FileText size={16} className="text-slate-400"/><span className="text-sm font-medium text-slate-700">Incorporation Cert</span></div>
                      <button onClick={() => handleDownload(data.incorporationCertBase64!, `${data.companyName}-Incorp.png`)} className="text-blue-600 hover:text-blue-800 text-xs font-bold">Download</button>
                    </div>
                  )}
                  {data.cancelledChequeBase64 && (
                    <div className="p-3 border border-slate-200 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2"><FileText size={16} className="text-slate-400"/><span className="text-sm font-medium text-slate-700">Cancelled Cheque</span></div>
                      <button onClick={() => handleDownload(data.cancelledChequeBase64!, `${data.companyName}-Cheque.png`)} className="text-blue-600 hover:text-blue-800 text-xs font-bold">Download</button>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};
