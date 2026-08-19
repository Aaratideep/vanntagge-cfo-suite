'use client';

import React, { useState } from 'react';
import { Settings as SettingsIcon, ShieldCheck, Database, Bot, Share2, Mail, Users, Check } from 'lucide-react';
import { useDashboardStore } from '../../store/dashboardStore';

import { isFirebaseConfigured } from '../../lib/firebase';
import { pushRecordToFirebase } from '../../lib/firebaseSync';

export const SettingsView: React.FC = () => {
  const { currentUser, addAuditLog, adminSettings, setAdminSettings } = useDashboardStore();

  const [tallyEnabled, setTallyEnabled] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [whatsappEnabled, setWhatsappEnabled] = useState(!!adminSettings?.twilioAccountSid);
  const [powerBiEnabled, setPowerBiEnabled] = useState(true);

  const [seeding, setSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);
  const [seedError, setSeedError] = useState('');

  if (!currentUser) return null;

  const handleSeedFirebase = async () => {
    setSeeding(true);
    setSeedSuccess(false);
    setSeedError('');
    try {
      const store = useDashboardStore.getState();
      
      // 1. Seed Users
      for (const user of store.users) {
        await pushRecordToFirebase('users', user.id, {
          name: user.name,
          email: user.email,
          role: user.role,
          permissions: user.permissions,
        });
      }

      // 2. Seed Leads
      for (const lead of store.leads) {
        await pushRecordToFirebase('leads', lead.id, lead);
      }

      // 3. Seed Engagements
      for (const eng of store.engagements) {
        await pushRecordToFirebase('engagements', eng.id, eng);
      }

      setSeedSuccess(true);
      addAuditLog('FIREBASE_SEED', 'Initialized Firebase Firestore collections with default mock schemas.');
    } catch (err) {
      setSeedError('Failed to seed Firebase. Ensure Firestore rules allow writes.');
      console.error(err);
    } finally {
      setSeeding(false);
    }
  };

  const handleToggleFeature = (feature: string, enabled: boolean) => {
    addAuditLog('TOGGLE_INTEGRATION', `${feature} integration toggled to ${enabled ? 'ENABLED' : 'DISABLED'}`);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="border-b border-slate-200 pb-2">
        <h1 className="text-xl font-bold tracking-tight text-slate-800 font-outfit">Suite System Settings</h1>
        <p className="text-xs text-slate-500">Configure parameters, role access control limits, and third-party integrations.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="space-y-6 lg:col-span-1">
          {/* Admin Sender Identity */}
          <div className="premium-card p-5 space-y-4 bg-white">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wide flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Users size={14} className="text-blue-500" />
              Admin Sender Identity
            </h3>
            
            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-500 mb-1 font-semibold">Official Name</label>
                <input
                  type="text"
                  value={adminSettings.adminName}
                  onChange={(e) => setAdminSettings({ adminName: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-700 outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1 font-semibold">Official Email</label>
                <input
                  type="email"
                  value={adminSettings.adminEmail}
                  onChange={(e) => setAdminSettings({ adminEmail: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-700 outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1 font-semibold">WhatsApp Number (e.g. 919876543210)</label>
                <input
                  type="text"
                  value={adminSettings.adminPhone}
                  onChange={(e) => setAdminSettings({ adminPhone: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-700 outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1 font-semibold">Firm Name</label>
                <input
                  type="text"
                  value={adminSettings.companyName}
                  onChange={(e) => setAdminSettings({ companyName: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-700 outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1 font-semibold">SMTP App Password (For Email Dispatch)</label>
                <input
                  type="password"
                  placeholder="16-digit App Password"
                  value={adminSettings.smtpPassword || ''}
                  onChange={(e) => setAdminSettings({ smtpPassword: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-700 outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Firebase Cloud Database */}
          <div className="premium-card p-5 space-y-4 bg-white">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wide flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <span className="material-symbols-outlined text-[16px] text-blue-500">cloud</span>
              Firebase Cloud Database
            </h3>
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Connection Status:</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${isFirebaseConfigured ? 'bg-green-50 text-green-700 border-green-150' : 'bg-amber-50 text-amber-700 border-amber-150'}`}>
                  {isFirebaseConfigured ? 'Connected' : 'Disconnected (Sandbox)'}
                </span>
              </div>
              
              {isFirebaseConfigured ? (
                <div className="space-y-3">
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Your Cloud Firestore database is active. If this is a fresh setup, you can seed the default mock datasets (leads, clients, engagements, compliance timelines) using the trigger below.
                  </p>
                  
                  {seedSuccess ? (
                    <div className="p-2.5 bg-green-50 text-green-800 border border-green-100 rounded-lg font-semibold text-[10px]">
                      ✓ Cloud collections successfully seeded with schemas!
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleSeedFirebase}
                        disabled={seeding}
                        className="flex-1 bg-primary text-on-primary py-2.5 rounded-lg font-semibold shadow-sm hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                      >
                        {seeding ? (
                          <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-[16px]">database</span>
                            <span>Sync to Firebase</span>
                          </>
                        )}
                      </button>
                      
                      <button
                        onClick={() => useDashboardStore.getState().seedDummyData()}
                        className="flex-1 bg-slate-800 text-white py-2.5 rounded-lg font-semibold shadow-sm hover:bg-slate-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[16px]">magic_button</span>
                        <span>Seed Dummy Data</span>
                      </button>
                    </div>
                  )}
                  {seedError && (
                    <div className="p-2.5 bg-red-50 text-red-700 border border-red-100 rounded-lg text-[10px]">
                      ⚠ {seedError}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-[10px] text-slate-400 leading-normal">
                    To connect a live Firebase instance, enter your credentials in <code>.env.local</code> and restart the Next.js dev server. Follow the guide in <code>firebase_setup.md</code>.
                  </p>
                  
                  <button
                    onClick={() => useDashboardStore.getState().seedDummyData()}
                    className="w-full bg-slate-800 text-white py-2.5 rounded-lg font-semibold shadow-sm hover:bg-slate-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[16px]">magic_button</span>
                    <span>Populate Local Dummy Data</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Future Integrations / Add-ons */}
        <div className="premium-card p-5 space-y-4 lg:col-span-2 bg-white">
          <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wide flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <Database size={14} className="text-blue-500" />
            Integrations & Scalability Channels
          </h3>

          <div className="divide-y divide-slate-100">
            
            {/* Tally Prime Integration */}
            <div className="py-3 flex items-center justify-between text-xs">
              <div className="space-y-1 pr-4">
                <span className="font-bold text-slate-800 block">Tally Prime Direct Sync Integration</span>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Synchronize clients trial balance ledgers and sales invoices directly with local Tally servers using XML gateways.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={tallyEnabled}
                  onChange={(e) => {
                    setTallyEnabled(e.target.checked);
                    handleToggleFeature('Tally Prime Sync', e.target.checked);
                  }}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
              </label>
            </div>

            {/* AI Financial assistant */}
            <div className="py-3 flex items-center justify-between text-xs">
              <div className="space-y-1 pr-4">
                <span className="font-bold text-slate-800 block flex items-center gap-1.5">
                  AI Financial Assistant
                  <span className="px-1.5 py-0.2 bg-blue-100 text-blue-800 font-bold text-[8px] rounded uppercase">Active</span>
                </span>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Draft client reports dynamically and analyze uploaded tax audit ledger sheets using Gemini LLMs.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={aiEnabled}
                  onChange={(e) => {
                    setAiEnabled(e.target.checked);
                    handleToggleFeature('AI Assistant', e.target.checked);
                  }}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
              </label>
            </div>

            {/* WhatsApp Integration */}
            <div className="py-3 flex flex-col text-xs border-b border-slate-50 last:border-0">
              <div className="flex items-center justify-between">
                <div className="space-y-1 pr-4">
                  <span className="font-bold text-slate-800 block">WhatsApp Automation API (Twilio)</span>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Send compliance calendar filing alerts and collection payment invoices directly to client CFO whatsapp lines.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={whatsappEnabled}
                    onChange={(e) => {
                      setWhatsappEnabled(e.target.checked);
                      handleToggleFeature('WhatsApp Alerts', e.target.checked);
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                </label>
              </div>
              
              {whatsappEnabled && (
                <div className="mt-4 p-4 bg-slate-50 rounded-xl space-y-3 border border-slate-100">
                  <div>
                    <label className="block text-slate-500 mb-1 font-semibold">Twilio Account SID</label>
                    <input
                      type="text"
                      placeholder="ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                      value={adminSettings.twilioAccountSid || ''}
                      onChange={(e) => setAdminSettings({ twilioAccountSid: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 font-semibold text-slate-700 outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1 font-semibold">Twilio Auth Token</label>
                    <input
                      type="password"
                      placeholder="Your Auth Token"
                      value={adminSettings.twilioAuthToken || ''}
                      onChange={(e) => setAdminSettings({ twilioAuthToken: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 font-semibold text-slate-700 outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1 font-semibold">Twilio WhatsApp Number</label>
                    <input
                      type="text"
                      placeholder="+14155238886"
                      value={adminSettings.twilioWhatsAppNumber || ''}
                      onChange={(e) => setAdminSettings({ twilioWhatsAppNumber: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 font-semibold text-slate-700 outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Power BI Dashboard sync */}
            <div className="py-3 flex items-center justify-between text-xs">
              <div className="space-y-1 pr-4">
                <span className="font-bold text-slate-800 block flex items-center gap-1.5">
                  Power BI Analytics Pipeline
                  <span className="px-1.5 py-0.2 bg-blue-100 text-blue-800 font-bold text-[8px] rounded uppercase">Active</span>
                </span>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Expose read-only endpoints to stream client billing metrics directly to Power BI reporting charts.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={powerBiEnabled}
                  onChange={(e) => {
                    setPowerBiEnabled(e.target.checked);
                    handleToggleFeature('Power BI Hooks', e.target.checked);
                  }}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
              </label>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
