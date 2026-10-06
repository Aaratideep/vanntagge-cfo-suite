import React, { useState } from 'react';
import { User as UserType } from '../../types';
import { 
  User, FileText, MapPin, ShieldCheck, Briefcase, 
  ArrowLeft, Calendar, IndianRupee, Target, Monitor,
  Download, Clock, CheckCircle, AlertCircle, FileSignature
} from 'lucide-react';
import { useDashboardStore } from '../../store/dashboardStore';

interface EmployeeProfileViewProps {
  employee: UserType;
  onBack: () => void;
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

export const EmployeeProfileView: React.FC<EmployeeProfileViewProps> = ({ employee, onBack }) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'ATTENDANCE' | 'PAYROLL' | 'PERFORMANCE' | 'ASSETS'>('OVERVIEW');
  const data = employee.onboardingData || employee.employeeOnboardingData;
  const { payrolls, leaves, assets, performanceReviews, addAsset, addPerformanceReview } = useDashboardStore();
  
  const employeePayrolls = payrolls.filter(p => p.userName === employee.name);
  const employeeLeaves = leaves.filter(l => l.userName === employee.name);
  const employeeAssets = assets.filter(a => a.userName === employee.name);
  const employeeReviews = performanceReviews.filter(r => r.userName === employee.name);

  const handleAddAsset = () => {
    const itemName = window.prompt("Enter Asset Name (e.g., MacBook Pro):");
    if (!itemName) return;
    const category = window.prompt("Enter Category (Hardware/Software):") || "Hardware";
    const assetTag = `AST-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`;
    addAsset({
      userName: employee.name,
      itemName,
      category,
      assetTag,
      assignedDate: new Date().toISOString().split('T')[0],
      status: 'IN USE'
    });
  };

  const handleAddReview = () => {
    const period = window.prompt("Enter Review Period (e.g., H1 2026):");
    if (!period) return;
    const rating = window.prompt("Enter Rating (e.g., EXCEEDS EXPECTATIONS):") || "MEETS EXPECTATIONS";
    const comments = window.prompt("Enter Review Comments:");
    addPerformanceReview({
      userName: employee.name,
      reviewPeriod: period,
      rating,
      comments: comments || "No comments provided.",
      reviewerName: "Admin",
      date: new Date().toISOString().split('T')[0],
    });
  };

  const renderOverview = () => {
    if (!employee.isOnboarded) {
      return (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileSignature size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">Onboarding Incomplete</h3>
          <p className="text-sm text-slate-500">This employee has not completed their onboarding form yet.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Personal Details */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 border-b pb-2">
            <User size={16} className="text-blue-600" /> Personal Details
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-6">
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Full Name</span>
              <span className="text-sm font-medium text-slate-700">{data?.fullName || employee.name || '-'}</span>
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
      </div>
    );
  };

  const renderAttendance = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="premium-card p-4 bg-white flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase">Present Days</p>
            <h4 className="text-xl font-extrabold text-slate-800">22<span className="text-xs text-slate-400 font-medium ml-1">this month</span></h4>
          </div>
        </div>
        <div className="premium-card p-4 bg-white flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <AlertCircle size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase">Leave Balance</p>
            <h4 className="text-xl font-extrabold text-slate-800">14<span className="text-xs text-slate-400 font-medium ml-1">days left</span></h4>
          </div>
        </div>
        <div className="premium-card p-4 bg-white flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase">Avg Work Hours</p>
            <h4 className="text-xl font-extrabold text-slate-800">8.5<span className="text-xs text-slate-400 font-medium ml-1">hrs/day</span></h4>
          </div>
        </div>
      </div>

      <div className="premium-card overflow-hidden bg-white">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-slate-800">Leave History</h3>
        </div>
        <div className="p-0">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider">
                <th className="p-4 font-bold">Type</th>
                <th className="p-4 font-bold">Date Range</th>
                <th className="p-4 font-bold">Duration</th>
                <th className="p-4 font-bold">Reason</th>
                <th className="p-4 font-bold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employeeLeaves.length > 0 ? employeeLeaves.map(leave => (
                <tr key={leave.id} className="hover:bg-slate-50">
                  <td className="p-4 font-medium text-slate-800">{leave.type}</td>
                  <td className="p-4 text-slate-600">{leave.startDate} to {leave.endDate}</td>
                  <td className="p-4 text-slate-600">{leave.days} Days</td>
                  <td className="p-4 text-slate-600">{leave.reason}</td>
                  <td className="p-4 text-right">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      leave.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                      leave.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {leave.status}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">No leave records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderPayroll = () => (
    <div className="space-y-6">
      <div className="premium-card overflow-hidden bg-white">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 className="font-bold text-slate-800">Payroll History</h3>
        </div>
        <div className="p-0">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider">
                <th className="p-4 font-bold">Month</th>
                <th className="p-4 font-bold">Basic Pay</th>
                <th className="p-4 font-bold">Allowances</th>
                <th className="p-4 font-bold">Deductions</th>
                <th className="p-4 font-bold">Net Pay</th>
                <th className="p-4 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employeePayrolls.length > 0 ? employeePayrolls.map(pay => (
                <tr key={pay.id} className="hover:bg-slate-50">
                  <td className="p-4 font-medium text-slate-800">{pay.month} {pay.year}</td>
                  <td className="p-4 text-slate-600">₹{pay.basic.toLocaleString('en-IN')}</td>
                  <td className="p-4 text-slate-600">₹{(pay.hra + pay.statutoryBonus).toLocaleString('en-IN')}</td>
                  <td className="p-4 text-red-600">₹{(pay.deductionsPfEsi + pay.deductionsTds).toLocaleString('en-IN')}</td>
                  <td className="p-4 font-bold text-emerald-600">₹{pay.netPay.toLocaleString('en-IN')}</td>
                  <td className="p-4 text-right">
                    <button onClick={() => alert('Download Payslip')} className="text-blue-600 hover:text-blue-800 text-xs font-bold flex items-center justify-end gap-1 w-full">
                      <Download size={14} /> Payslip
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">No payroll records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderPerformance = () => (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button onClick={handleAddReview} className="btn-primary py-1.5 px-3 text-xs font-bold">Add Review</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="premium-card p-6 bg-white">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Target size={18} className="text-purple-600" /> Current OKRs & Goals
          </h3>
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-bold text-slate-700">Q3 Client Deliverables Accuracy</span>
                <span className="text-blue-600 font-bold">85%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-bold text-slate-700">Audit Reports Completion</span>
                <span className="text-amber-500 font-bold">40%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-amber-500 h-2 rounded-full" style={{ width: '40%' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="premium-card p-6 bg-white overflow-y-auto max-h-[300px]">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <CheckCircle size={18} className="text-emerald-600" /> Performance Reviews
          </h3>
          <div className="space-y-4">
            {employeeReviews.length > 0 ? employeeReviews.map(review => (
              <div key={review.id} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{review.reviewPeriod}</span>
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold">{review.rating}</span>
                </div>
                <p className="text-sm text-slate-600 mb-3">{review.comments}</p>
                <span className="text-xs text-slate-400 font-medium">Reviewed by: {review.reviewerName} on {review.date}</span>
              </div>
            )) : (
              <p className="text-sm text-slate-500 text-center py-4">No performance reviews logged.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderAssets = () => (
    <div className="premium-card overflow-hidden bg-white">
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <Monitor size={16} className="text-blue-600" /> Assigned Company Assets
        </h3>
        <button onClick={handleAddAsset} className="btn-primary py-1.5 px-3 text-xs font-bold">Assign Asset</button>
      </div>
      <div className="p-0">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider">
              <th className="p-4 font-bold">Asset Tag</th>
              <th className="p-4 font-bold">Category</th>
              <th className="p-4 font-bold">Item Name</th>
              <th className="p-4 font-bold">Assigned Date</th>
              <th className="p-4 font-bold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {employeeAssets.length > 0 ? employeeAssets.map(asset => (
              <tr key={asset.id} className="hover:bg-slate-50">
                <td className="p-4 font-medium text-slate-800">{asset.assetTag}</td>
                <td className="p-4 text-slate-600">{asset.category}</td>
                <td className="p-4 text-slate-600">{asset.itemName}</td>
                <td className="p-4 text-slate-600">{asset.assignedDate}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 text-[10px] font-bold rounded ${
                    asset.status === 'IN USE' || asset.status === 'ACTIVE' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {asset.status}
                  </span>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">No assets assigned yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header Profile Summary */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div className="flex items-center gap-5">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 text-slate-500 rounded-full transition-colors mr-2">
            <ArrowLeft size={24} />
          </button>
          
          {data?.photoBase64 ? (
            <img src={data.photoBase64} alt={employee.name} className="w-20 h-20 rounded-full object-cover border-4 border-slate-50 shadow-sm" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-3xl font-bold shadow-sm">
              {employee.name.charAt(0)}
            </div>
          )}
          
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-bold text-slate-800 font-outfit">{employee.name}</h2>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider ${employee.isOnboarded ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                {employee.isOnboarded ? 'ACTIVE' : 'ONBOARDING'}
              </span>
            </div>
            <p className="text-sm font-medium text-slate-600 mb-2">{employee.designation || 'Employee'} • {employee.department || 'General'}</p>
            <p className="text-xs text-slate-500">{employee.email}</p>
          </div>
        </div>
        
        <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto">
          <button className="btn-primary py-2 px-4 flex-1 md:flex-auto text-center justify-center">Edit Profile</button>
          <button className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 py-2 px-4 rounded-xl font-bold text-xs flex-1 md:flex-auto text-center justify-center transition-colors">Reset Password</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 border-b border-slate-200 scrollbar-hide">
        {[
          { id: 'OVERVIEW', label: 'Overview & Docs', icon: <User size={16} /> },
          { id: 'ATTENDANCE', label: 'Attendance & Leaves', icon: <Calendar size={16} /> },
          { id: 'PAYROLL', label: 'Payroll & Payslips', icon: <IndianRupee size={16} /> },
          { id: 'PERFORMANCE', label: 'Performance', icon: <Target size={16} /> },
          { id: 'ASSETS', label: 'Company Assets', icon: <Monitor size={16} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="pb-8">
        {activeTab === 'OVERVIEW' && renderOverview()}
        {activeTab === 'ATTENDANCE' && renderAttendance()}
        {activeTab === 'PAYROLL' && renderPayroll()}
        {activeTab === 'PERFORMANCE' && renderPerformance()}
        {activeTab === 'ASSETS' && renderAssets()}
      </div>
    </div>
  );
};
