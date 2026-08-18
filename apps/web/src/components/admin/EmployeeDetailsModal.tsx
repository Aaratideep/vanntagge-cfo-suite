import React from 'react';
import { User as UserType } from '../../types';
import { User, FileText, Phone, MapPin, X, ShieldCheck, Briefcase } from 'lucide-react';

interface EmployeeDetailsModalProps {
  employee: UserType;
  onClose: () => void;
}

const DocumentPreview = ({ label, base64Data }: { label: string, base64Data?: string }) => {
  if (!base64Data) return <div className="text-xs text-slate-400 italic py-2">Not provided</div>;
  
  const isPdf = base64Data.startsWith('data:application/pdf');
  
  return (
    <div className="mt-2 border rounded-lg overflow-hidden bg-slate-50 relative group">
      <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <a href={base64Data} download={`${label.replace(' ', '_')}`} className="text-xs bg-white text-slate-900 px-3 py-1.5 rounded-full font-bold shadow-md hover:bg-slate-100 transition-colors">
          Download File
        </a>
      </div>
      {isPdf ? (
        <div className="h-32 flex flex-col items-center justify-center text-slate-400">
          <FileText size={32} className="mb-2" />
          <span className="text-xs font-bold">PDF Document</span>
        </div>
      ) : (
        <img src={base64Data} alt={label} className="w-full h-32 object-cover object-top" />
      )}
    </div>
  );
};

export const EmployeeDetailsModal: React.FC<EmployeeDetailsModalProps> = ({ employee, onClose }) => {
  const data = employee.onboardingData;

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-white p-6 border-b border-slate-100 flex items-start justify-between shrink-0 rounded-t-2xl">
          <div className="flex items-center gap-4">
            {data?.photoBase64 ? (
              <img src={data.photoBase64} alt={employee.name} className="w-16 h-16 rounded-full object-cover border-2 border-slate-100" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-2xl font-bold">
                {employee.name.charAt(0)}
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold text-slate-800">{employee.name}</h2>
              <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                <span className="font-medium text-slate-700">{employee.designation || 'Employee'}</span>
                <span>•</span>
                <span>{employee.email}</span>
                <span>•</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${employee.isOnboarded ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                  {employee.isOnboarded ? 'ONBOARDED' : 'PENDING ONBOARDING'}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto bg-slate-50/50 flex-1 space-y-6">
          {!employee.isOnboarded ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">Onboarding Incomplete</h3>
              <p className="text-sm text-slate-500">This employee has not completed their onboarding form yet.</p>
            </div>
          ) : (
            <>
              {/* Personal Details */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 border-b pb-2">
                  <User size={16} className="text-blue-600" /> Personal Details
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-6">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Full Name</span>
                    <span className="text-sm font-medium text-slate-700">{data?.fullName || '-'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Date of Birth</span>
                    <span className="text-sm font-medium text-slate-700">{data?.dob || '-'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Blood Group</span>
                    <span className="text-sm font-medium text-slate-700">{data?.bloodGroup || '-'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Mobile No</span>
                    <span className="text-sm font-medium text-slate-700">{data?.mobileNo || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Addresses */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 border-b pb-2">
                  <MapPin size={16} className="text-emerald-600" /> Addresses
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Permanent Address</span>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{data?.permanentAddress || '-'}</p>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Local Address</span>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{data?.localAddress || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 border-b pb-2">
                  <ShieldCheck size={16} className="text-purple-600" /> Identity Documents
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">PAN Card</span>
                    <span className="text-sm font-bold text-slate-800 uppercase block">{data?.panCardNo || '-'}</span>
                    <DocumentPreview label="PAN Card" base64Data={data?.panCardBase64} />
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Aadhar Card</span>
                    <span className="text-sm font-bold text-slate-800 uppercase block">{data?.aadharCardNo || '-'}</span>
                    <DocumentPreview label="Aadhar Card" base64Data={data?.aadharCardBase64} />
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Passport</span>
                    <span className="text-sm font-bold text-slate-800 uppercase block">{data?.passportNo || 'N/A'}</span>
                    <DocumentPreview label="Passport" base64Data={data?.passportBase64} />
                  </div>
                </div>
              </div>

              {/* Education / Professional */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 border-b pb-2">
                  <Briefcase size={16} className="text-amber-600" /> Professional & Education
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Degree Certificate</span>
                    <DocumentPreview label="Degree Certificate" base64Data={data?.educationDegreeBase64} />
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Previous Appointment</span>
                    <DocumentPreview label="Appointment Letter" base64Data={data?.previousApptLetterBase64} />
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Relieving Letter</span>
                    <DocumentPreview label="Relieving Letter" base64Data={data?.relievingLetterBase64} />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
