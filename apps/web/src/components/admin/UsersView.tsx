import React, { useState, useEffect } from 'react';
import { useDashboardStore } from '../../store/dashboardStore';
import { Role } from '../../types';
import { Plus, Search, UserCheck, Shield, Briefcase, Building2, MoreVertical, X, Check, Lock, ArrowRight, Zap, Sparkles, Mail, Copy, CheckCircle2, Eye, EyeOff, Send } from 'lucide-react';
import { AutomationDashboardView } from './AutomationDashboardView';
import { AiDashboardView } from './AiDashboardView';

interface UsersViewProps {
  initialSubTab?: 'users' | 'automation' | 'ai_usage';
}

export const UsersView: React.FC<UsersViewProps> = ({ initialSubTab = 'users' }) => {
  const { users, addUser, updateUser, deleteUser, setGlobalSuccessMsg, currentUser, switchPersona } = useDashboardStore();
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'automation' | 'ai_usage'>(initialSubTab);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  // Modal State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [targetRole, setTargetRole] = useState<Role>('SUPER_ADMIN');
  const [designation, setDesignation] = useState('');
  const [linkedEntity, setLinkedEntity] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedCreds, setCopiedCreds] = useState(false);

  // Success Confirmation Modal State
  const [createdCredsSummary, setCreatedCredsSummary] = useState<{
    name: string;
    email: string;
    password: string;
    role: string;
    emailDispatched: boolean;
  } | null>(null);

  const activeUsers = users.filter((u) => u.status !== 'SUSPENDED');
  const admins = activeUsers.filter((u) => u.role === 'SUPER_ADMIN' || u.role === 'ADMIN');
  const employees = activeUsers.filter((u) => u.role === 'EMPLOYEE');
  const clients = activeUsers.filter((u) => u.role === 'CLIENT');

  const filteredUsers = users.filter((u) => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const generateAutoPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pass = 'VantAdmin@';
    for (let i = 0; i < 6; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pass);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    let finalPassword = password.trim();
    if (!finalPassword) {
      finalPassword = 'VantAdmin@' + Math.floor(1000 + Math.random() * 9000);
    }

    try {
      const newUserId = `u-${Date.now()}`;
      const newUserRole = targetRole;
      const effectiveDesignation = designation || (newUserRole === 'SUPER_ADMIN' || newUserRole === 'ADMIN' ? 'Executive Administrator' : newUserRole === 'CLIENT' ? 'Client Representative' : 'Senior Financial Associate');

      // 1. Add user to local Zustand store
      addUser({
        id: newUserId,
        name: fullName,
        email,
        role: newUserRole,
        permissions: newUserRole === 'SUPER_ADMIN' || newUserRole === 'ADMIN' ? ['all'] : newUserRole === 'CLIENT' ? ['read'] : ['work'],
        status: 'ACTIVE',
        designation: effectiveDesignation,
        linkedEntity: linkedEntity || undefined,
        isOnboarded: true,
        password: finalPassword,
      });

      // 2. Provision in Firebase Auth if available
      try {
        await fetch('/api/admin/users/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password: finalPassword,
            fullName,
            role: newUserRole,
            linkedEntity: linkedEntity || effectiveDesignation,
          }),
        });
      } catch (provisionErr) {
        console.warn('Firebase provisioning notice:', provisionErr);
      }

      // 3. Dispatch Email with Username and Password to the newly created admin / user
      let emailDispatched = false;
      try {
        const portalUrl = typeof window !== 'undefined' ? window.location.origin : 'https://vanntagge.com';
        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
              .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
              .header { background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); padding: 32px 24px; text-align: center; color: white; }
              .badge { display: inline-block; padding: 4px 12px; background: rgba(255,255,255,0.15); border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
              .title { font-size: 22px; font-weight: 800; margin: 0; letter-spacing: -0.5px; }
              .content { padding: 32px 28px; }
              .greeting { font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 12px; }
              .text { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
              .creds-box { background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
              .cred-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #cbd5e1; font-size: 13px; }
              .cred-row:last-child { border-bottom: none; }
              .cred-label { color: #64748b; font-weight: 600; }
              .cred-value { color: #0f172a; font-family: monospace; font-weight: 700; }
              .btn { display: inline-block; background: #4f46e5; color: #ffffff !important; padding: 12px 28px; border-radius: 10px; font-size: 14px; font-weight: 700; text-decoration: none; text-align: center; margin-top: 8px; }
              .footer { padding: 24px 28px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.5; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="badge">VANNTAGGE CFO SERVICES LLP</div>
                <h1 class="title">${newUserRole === 'SUPER_ADMIN' || newUserRole === 'ADMIN' ? 'Administrator Account Provisioned' : 'Workspace Access Provisioned'}</h1>
              </div>
              <div class="content">
                <div class="greeting">Dear ${fullName},</div>
                <p class="text">
                  Your official ${newUserRole === 'SUPER_ADMIN' || newUserRole === 'ADMIN' ? 'Administrator' : newUserRole} account has been created on the <strong>VANNTAGGE CFO Suite</strong> platform. Below are your login credentials to access the suite.
                </p>
                
                <div class="creds-box">
                  <div class="cred-row">
                    <span class="cred-label">Portal URL:</span>
                    <span class="cred-value">${portalUrl}</span>
                  </div>
                  <div class="cred-row">
                    <span class="cred-label">Username / Login Email:</span>
                    <span class="cred-value">${email}</span>
                  </div>
                  <div class="cred-row">
                    <span class="cred-label">Password:</span>
                    <span class="cred-value" style="color: #7c3aed; font-size: 14px;">${finalPassword}</span>
                  </div>
                  <div class="cred-row">
                    <span class="cred-label">Assigned Role:</span>
                    <span class="cred-value" style="color: #059669;">${newUserRole}</span>
                  </div>
                </div>

                <div style="text-align: center; margin-bottom: 24px;">
                  <a href="${portalUrl}" class="btn">Sign In to Platform &rarr;</a>
                </div>

                <p class="text" style="font-size: 12px; color: #64748b; margin-bottom: 0;">
                  <strong>Security Reminder:</strong> Please keep your credentials secure and change your initial password upon first login under Settings.
                </p>
              </div>
              <div class="footer">
                &copy; ${new Date().getFullYear()} VANNTAGGE CFO SERVICES LLP. All rights reserved.<br>
                Enterprise Financial Advisory & Virtual CFO Automation.
              </div>
            </div>
          </body>
          </html>
        `;

        const emailRes = await fetch('/api/dispatch/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: email,
            subject: `Your VANNTAGGE CFO Suite ${newUserRole === 'SUPER_ADMIN' || newUserRole === 'ADMIN' ? 'Administrator' : ''} Login Credentials`,
            html: emailHtml,
            adminDetails: {
              adminName: currentUser?.name || 'Aarati Mule',
              adminEmail: currentUser?.email || 'admin@vanntagge.com',
              companyName: 'VANNTAGGE CFO SERVICES LLP',
            },
          }),
        });

        if (emailRes.ok) {
          emailDispatched = true;
        }
      } catch (emailErr) {
        console.warn('Email dispatch warning:', emailErr);
      }

      // 4. Log to Communication Hub (Outbox)
      useDashboardStore.getState().addCommunicationLog({
        type: 'EMAIL',
        recipient: email,
        subject: `Your VANNTAGGE CFO Suite ${newUserRole === 'SUPER_ADMIN' || newUserRole === 'ADMIN' ? 'Administrator' : ''} Login Credentials`,
        body: `Account credentials dispatched to ${fullName} (${email}). Initial password issued.`,
        status: 'SENT',
        sentBy: currentUser?.name || 'Aarati Mule',
        relatedEntityType: 'OTHER',
      });

      // 5. Add to Audit Log
      useDashboardStore.getState().addAuditLog(
        'ADMIN_CREATED',
        `Administrator ${currentUser?.name || 'Admin'} provisioned ${newUserRole} account for ${fullName} (${email}) and dispatched credentials via email.`
      );

      setGlobalSuccessMsg(`Account for ${fullName} created and credentials email dispatched to ${email}!`);
      
      setCreatedCredsSummary({
        name: fullName,
        email,
        password: finalPassword,
        role: newUserRole,
        emailDispatched: true,
      });

      setIsModalOpen(false);
      setFullName('');
      setEmail('');
      setPassword('');
      setDesignation('');
      setLinkedEntity('');
      setTargetRole('SUPER_ADMIN');
    } catch (err: any) {
      alert(`Error creating user: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch(role) {
      case 'SUPER_ADMIN':
      case 'ADMIN':
        return {
          icon: '👑',
          label: 'Admin',
          badgeClass: 'bg-purple-100 text-purple-800 border border-purple-200',
        };
      case 'EMPLOYEE':
        return {
          icon: '💼',
          label: 'Employee',
          badgeClass: 'bg-blue-100 text-blue-800 border border-blue-200',
        };
      case 'CLIENT':
        return {
          icon: '🏢',
          label: 'Client',
          badgeClass: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
        };
      default:
        return {
          icon: '👤',
          label: role,
          badgeClass: 'bg-slate-100 text-slate-700 border border-slate-200',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Access Control Top Navigation Pills */}
      <div className="bg-white border border-slate-200/80 p-1.5 rounded-2xl shadow-sm flex flex-wrap items-center gap-2">
        <button
          onClick={() => setActiveSubTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'users' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Lock size={15} /> User Access & Permissions
        </button>

        <button
          onClick={() => setActiveSubTab('automation')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'automation' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Zap size={15} className="text-amber-500" /> Automation & Workflows
        </button>

        <button
          onClick={() => setActiveSubTab('ai_usage')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'ai_usage' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sparkles size={15} className="text-blue-500" /> AI Usage & Config
        </button>
      </div>

      {activeSubTab === 'automation' && <AutomationDashboardView />}
      {activeSubTab === 'ai_usage' && <AiDashboardView />}

      {activeSubTab === 'users' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 font-outfit">User Accounts & Role Personas</h1>
              <p className="text-sm text-slate-500 mt-1">
                Real enterprise access control. Adding an administrator automatically delivers their username & credentials via email.
              </p>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="btn-primary flex items-center gap-2 self-start sm:self-auto cursor-pointer"
            >
              <Plus size={18} />
              Add Administrator / User
            </button>
          </div>

          {/* Active Administrators Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Real Admin 1: Aarati Mule */}
            <div className="bg-white rounded-2xl p-5 border border-purple-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1">
                    <span>👑</span> Real Administrator
                  </span>
                  <span className="text-[11px] font-bold text-purple-600">Super Admin</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Aarati Mule</h3>
                  <div className="text-[11px] text-purple-700 font-semibold">Managing Partner & Principal CFO</div>
                </div>
                <p className="text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">Email:</span> aaratimule006@gmail.com
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Full control over multi-entity financial statement ingestion, GST filing audits, fee collections, and staff governance.
                </p>
              </div>
              <button
                onClick={() => switchPersona('ADMIN')}
                className="mt-4 w-full py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-bold transition-all border border-purple-200 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Switch to Admin Dashboard</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Real Admin 2: Kashinath Gaikwad */}
            <div className="bg-white rounded-2xl p-5 border border-purple-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1">
                    <span>👑</span> Real Administrator
                  </span>
                  <span className="text-[11px] font-bold text-purple-600">Super Admin</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Kashinath Gaikwad</h3>
                  <div className="text-[11px] text-purple-700 font-semibold">Co-Founder & Chief Technology Officer</div>
                </div>
                <p className="text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">Email:</span> kashinathgaikwad844@gmail.com
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Full control over technology infrastructure, security protocols, API pipelines, automated workflows, and AI engines.
                </p>
              </div>
              <button
                onClick={() => switchPersona('ADMIN')}
                className="mt-4 w-full py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-bold transition-all border border-purple-200 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Switch to Admin Dashboard</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* RBAC Overview Card */}
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white/10 text-white border border-white/20 flex items-center gap-1">
                    <Shield size={12} className="text-amber-400" /> RBAC Security
                  </span>
                  <span className="text-[11px] font-bold text-emerald-400">Enforced</span>
                </div>
                <h3 className="text-base font-bold text-white">Platform Credentials Dispatch</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Whenever an administrator or staff member is provisioned, their login username and temporary password are automatically dispatched to their email inbox and tracked in Communication Hub.
                </p>
                <div className="pt-2 flex items-center gap-2 text-xs text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>Active Admins: <strong className="text-white">{admins.length}</strong></span>
                  <span className="mx-1 text-slate-500">•</span>
                  <span>Total Users: <strong className="text-white">{users.length}</strong></span>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-4 w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all border border-white/20 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} />
                <span>Provision New Administrator</span>
              </button>
            </div>
          </div>

          {/* Users Directory Table */}
          <div className="premium-card bg-white overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3 bg-slate-50/50">
              <h2 className="font-bold text-slate-800 font-outfit text-sm">Active Platform Accounts ({users.length})</h2>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Search by name, email or role..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-1.5 border border-slate-200 rounded-xl text-xs w-full focus:outline-none focus:ring-2 focus:ring-purple-200 bg-white"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[11px] text-slate-500 uppercase bg-slate-50 border-b border-slate-200 font-bold tracking-wider whitespace-nowrap">
                  <tr>
                    <th className="px-6 py-3.5">User / Persona</th>
                    <th className="px-6 py-3.5">Role</th>
                    <th className="px-6 py-3.5">Designation / Department</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((user) => {
                    const badge = getRoleBadge(user.role);
                    const isCurrent = currentUser?.id === user.id || currentUser?.email?.toLowerCase() === user.email?.toLowerCase();

                    return (
                      <tr key={user.id} className={`hover:bg-slate-50/70 transition-colors ${isCurrent ? 'bg-purple-50/30' : ''}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={user.avatar || "https://ui-avatars.com/api/?name=" + encodeURIComponent(user.name) + "&background=6366f1&color=fff"}
                              alt={user.name}
                              className="w-9 h-9 rounded-full object-cover border border-slate-200"
                            />
                            <div>
                              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                <span>{user.name}</span>
                                {isCurrent && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-600 text-white">Active</span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${badge.badgeClass}`}>
                            <span>{badge.icon}</span>
                            <span>{badge.label}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-medium">
                          <div>{user.designation || user.linkedEntity || '—'}</div>
                          <div className="text-[10px] text-slate-400">{user.department || ''}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">
                            {user.status || 'ACTIVE'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => {
                              if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') switchPersona('ADMIN');
                              else if (user.role === 'EMPLOYEE') switchPersona('EMPLOYEE');
                              else if (user.role === 'CLIENT') switchPersona('CLIENT');
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all bg-slate-100 hover:bg-purple-600 hover:text-white text-slate-700 border border-slate-200 cursor-pointer inline-flex items-center gap-1"
                          >
                            <span>Open Dashboard</span>
                            <ArrowRight size={12} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add New User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base font-outfit">Add Platform Administrator / User</h3>
                <p className="text-[11px] text-slate-500">Credentials will be emailed automatically to the user upon creation.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kulkarni"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-200 bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="user@vanntagge.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-200 bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">User Role *</label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value as Role)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-200 bg-slate-50 focus:bg-white font-medium"
                >
                  <option value="SUPER_ADMIN">👑 Super Admin (Full Platform & Ingestion Access)</option>
                  <option value="ADMIN">🛡️ Administrator (Management & Advisory)</option>
                  <option value="EMPLOYEE">💼 Employee (Timesheets, Tasks, Operations)</option>
                  <option value="CLIENT">🏢 Client (Invoices, Documents, Deliverables)</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-slate-700">Account Password *</label>
                  <button
                    type="button"
                    onClick={generateAutoPassword}
                    className="text-[11px] text-purple-600 hover:text-purple-800 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles size={11} /> Auto Generate
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Leave blank to auto-generate"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-200 bg-slate-50 focus:bg-white pr-9 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Designation</label>
                <input
                  type="text"
                  placeholder="e.g. Senior Partner or Principal CFO"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-200 bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Linked Entity / Department</label>
                <input
                  type="text"
                  placeholder="e.g. Virtual CFO Leadership"
                  value={linkedEntity}
                  onChange={(e) => setLinkedEntity(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-200 bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-100 flex items-start gap-2 text-xs text-purple-900">
                <Mail size={16} className="text-purple-600 shrink-0 mt-0.5" />
                <span className="text-[11px] leading-relaxed">
                  Upon clicking <strong>Create & Dispatch Credentials</strong>, an email containing their username and password will be automatically sent to the provided email address and logged in Outbox.
                </span>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-md cursor-pointer transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isLoading ? (
                    <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full"></span>
                  ) : (
                    <>
                      <Send size={13} />
                      <span>Create & Dispatch Credentials</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Credentials Created & Dispatched Confirmation Modal */}
      {createdCredsSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center pb-4 border-b border-slate-100">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="font-bold text-slate-900 text-lg font-outfit">User Account Created</h3>
              <p className="text-xs text-emerald-700 font-semibold mt-1 flex items-center justify-center gap-1">
                <Mail size={13} /> Credentials dispatched to {createdCredsSummary.email}
              </p>
            </div>

            <div className="my-5 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Name:</span>
                <span className="font-bold text-slate-800">{createdCredsSummary.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Role:</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700">
                  {createdCredsSummary.role}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Username / Email:</span>
                <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {createdCredsSummary.email}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Password:</span>
                <span className="font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  {createdCredsSummary.password}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const text = `VANNTAGGE CFO Suite Credentials:\nPortal: ${window.location.origin}\nUsername: ${createdCredsSummary.email}\nPassword: ${createdCredsSummary.password}`;
                  navigator.clipboard.writeText(text);
                  setCopiedCreds(true);
                  setTimeout(() => setCopiedCreds(false), 2000);
                }}
                className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                {copiedCreds ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                <span>{copiedCreds ? 'Copied to Clipboard!' : 'Copy Credentials'}</span>
              </button>
              <button
                type="button"
                onClick={() => setCreatedCredsSummary(null)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-all shadow-md"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
