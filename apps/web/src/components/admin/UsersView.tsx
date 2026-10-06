import React, { useState } from 'react';
import { useDashboardStore } from '../../store/dashboardStore';
import { Role } from '../../types';
import { Plus, Search, UserCheck, Shield, Briefcase, Building2, MoreVertical, X, Check, Lock, ArrowRight } from 'lucide-react';

export const UsersView = () => {
  const { users, addUser, updateUser, deleteUser, setGlobalSuccessMsg, currentUser, switchPersona } = useDashboardStore();
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
  const [targetRole, setTargetRole] = useState<Role>('EMPLOYEE');
  const [linkedEntity, setLinkedEntity] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const activeUsers = users.filter((u) => u.status !== 'SUSPENDED');
  const admins = activeUsers.filter((u) => u.role === 'SUPER_ADMIN' || u.role === 'ADMIN');
  const employees = activeUsers.filter((u) => u.role === 'EMPLOYEE');
  const clients = activeUsers.filter((u) => u.role === 'CLIENT');

  const filteredUsers = users.filter((u) => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      addUser({
        id: `u-${Date.now()}`,
        name: fullName,
        email,
        role: targetRole,
        permissions: targetRole === 'SUPER_ADMIN' || targetRole === 'ADMIN' ? ['all'] : targetRole === 'CLIENT' ? ['read'] : ['work'],
        status: 'ACTIVE',
        linkedEntity: linkedEntity || undefined,
        isOnboarded: true,
      });

      setGlobalSuccessMsg(`User ${fullName} (${targetRole}) created successfully!`);
      setIsModalOpen(false);
      
      // Reset form
      setFullName('');
      setEmail('');
      setPassword('');
      setTargetRole('EMPLOYEE');
      setLinkedEntity('');
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 font-outfit">User Accounts & Role Personas</h1>
          <p className="text-sm text-slate-500 mt-1">
            Streamlined access control for the 3 primary platform personas: <span className="font-semibold text-purple-700">Admin</span>, <span className="font-semibold text-blue-700">Employee</span>, and <span className="font-semibold text-emerald-700">Client</span>.
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Plus size={18} />
          Add User
        </button>
      </div>

      {/* 3 Active Personas Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Admin Persona */}
        <div className="bg-white rounded-2xl p-5 border border-purple-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1">
                <span>👑</span> Administrator
              </span>
              <span className="text-[11px] font-bold text-slate-400">1 Account</span>
            </div>
            <h3 className="text-base font-bold text-slate-900">Aarati Mule</h3>
            <p className="text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Email:</span> admin@vantage.com
            </p>
            <p className="text-xs text-slate-500 leading-relaxed">
              Full control over multi-entity GST billing, CRM sales pipeline, client onboarding signoffs, and timesheet approvals.
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

        {/* Employee Persona */}
        <div className="bg-white rounded-2xl p-5 border border-blue-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
                <span>💼</span> Employee / Analyst
              </span>
              <span className="text-[11px] font-bold text-slate-400">1 Account</span>
            </div>
            <h3 className="text-base font-bold text-slate-900">Priya Sharma</h3>
            <p className="text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Email:</span> employee@vantage.com
            </p>
            <p className="text-xs text-slate-500 leading-relaxed">
              Assigned deliverables & compliance tasks, daily client timesheet submission, leave balances (12 CLs), and payroll payslips.
            </p>
          </div>
          <button
            onClick={() => switchPersona('EMPLOYEE')}
            className="mt-4 w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-all border border-blue-200 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Switch to Employee Workspace</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Client Persona */}
        <div className="bg-white rounded-2xl p-5 border border-emerald-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <span>🏢</span> Client Stakeholder
              </span>
              <span className="text-[11px] font-bold text-slate-400">1 Account</span>
            </div>
            <h3 className="text-base font-bold text-slate-900">Rajesh Mehta (Acme Corp)</h3>
            <p className="text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Email:</span> client@vantage.com
            </p>
            <p className="text-xs text-slate-500 leading-relaxed">
              Client portal view: Milestone invoices (paid & pending), GST/ROC compliance statuses, deliverables, and secure KYC vault.
            </p>
          </div>
          <button
            onClick={() => switchPersona('CLIENT')}
            className="mt-4 w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold transition-all border border-emerald-200 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Switch to Client Portal</span>
            <ArrowRight size={14} />
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
                const isCurrent = currentUser?.id === user.id || currentUser?.role === user.role;

                return (
                  <tr key={user.id} className={`hover:bg-slate-50/70 transition-colors ${isCurrent ? 'bg-purple-50/30' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={user.avatar || "https://ui-avatars.com/api/?name=" + encodeURIComponent(user.name) + "&background=0D8ABC&color=fff"}
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

      {/* Add New User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base font-outfit">Add New Platform User</h3>
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
                  placeholder="user@vantage.com"
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
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-200 bg-slate-50 focus:bg-white"
                >
                  <option value="SUPER_ADMIN">👑 Administrator (Full Platform Access)</option>
                  <option value="EMPLOYEE">💼 Employee (Timesheets, Tasks, Operations)</option>
                  <option value="CLIENT">🏢 Client (Invoices, Documents, Deliverables)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Linked Entity / Department</label>
                <input
                  type="text"
                  placeholder="e.g. Acme Corp or Virtual CFO Operations"
                  value={linkedEntity}
                  onChange={(e) => setLinkedEntity(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-200 bg-slate-50 focus:bg-white"
                />
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
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-md cursor-pointer transition-all disabled:opacity-50"
                >
                  {isLoading ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
