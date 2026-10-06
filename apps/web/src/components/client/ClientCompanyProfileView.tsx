import React, { useState } from 'react';
import { useDashboardStore } from '../../store/dashboardStore';
import { Building, Mail, Phone, MapPin, ShieldCheck, CheckCircle2, Lock, Save } from 'lucide-react';

export const ClientCompanyProfileView: React.FC = () => {
  const { currentUser, clients, updateClientCompanyProfile } = useDashboardStore();

  const client = clients.find((c) => c.id === currentUser?.id);

  const [contactPerson, setContactPerson] = useState(client?.contactPerson || currentUser?.name || '');
  const [email, setEmail] = useState(client?.email || currentUser?.email || '');
  const [phone, setPhone] = useState(client?.phone || currentUser?.phone || '');
  const [address, setAddress] = useState(client?.address || 'Mumbai, Maharashtra, India');

  const [savedNotice, setSavedNotice] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!currentUser) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const res = updateClientCompanyProfile(currentUser.id, {
      contactPerson,
      email,
      phone,
      address,
    });

    if (res.success) {
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 3000);
    } else {
      setErrorMsg(res.error || 'Failed to update profile.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl">
      {/* Header */}
      <div className="border-b border-slate-200/80 pb-4">
        <h1 className="text-xl font-bold tracking-tight text-slate-800 font-outfit flex items-center gap-2">
          <Building className="w-6 h-6 text-blue-600" />
          Company Master Profile
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          View registered corporate details and manage authorized primary contact information.
        </p>
      </div>

      {savedNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Company contact profile updated successfully!
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      {/* Protected Master Information */}
      <div className="premium-card p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-outfit flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-400" />
            <span>Protected Corporate Master Data</span>
          </h3>
          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
            Read-Only Master Record
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-500 block">Company Registered Name:</span>
            <span className="font-bold text-slate-900 text-sm font-outfit">
              {client?.companyName || currentUser.name || 'ABC Pvt Ltd'}
            </span>
          </div>

          <div>
            <span className="text-slate-500 block">Industry Sector:</span>
            <span className="font-semibold text-slate-800">
              {client?.industry || 'Technology & Financial Services'}
            </span>
          </div>

          <div>
            <span className="text-slate-500 block">GSTIN Number:</span>
            <span className="font-mono font-bold text-slate-800">
              {client?.gstin || '27AABCU9603R1ZM'}
            </span>
          </div>

          <div>
            <span className="text-slate-500 block">PAN Number:</span>
            <span className="font-mono font-bold text-slate-800">
              {client?.pan || 'AABCU9603R'}
            </span>
          </div>
        </div>
      </div>

      {/* Editable Contact Details Form */}
      <form onSubmit={handleSaveProfile} className="premium-card p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-outfit flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Authorized Contact Details (Client Editable)</span>
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Primary Contact Person</label>
            <input
              type="text"
              required
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-blue-600" /> Authorized Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-blue-600" /> Authorized Phone Number
            </label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-blue-600" /> Corporate Office Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 font-semibold focus:bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
          <button
            type="submit"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save Profile Updates</span>
          </button>
        </div>
      </form>
    </div>
  );
};
