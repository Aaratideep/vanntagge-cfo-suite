import React, { useState } from 'react';
import { useDashboardStore } from '../../store/dashboardStore';
import { Plus, Search, ShieldAlert, UserCheck, Shield, MoreVertical, X } from 'lucide-react';

export const UsersView = () => {
  const { users, addUser, updateUser, deleteUser, setGlobalSuccessMsg, currentUser } = useDashboardStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [targetRole, setTargetRole] = useState<'EMPLOYEE' | 'CLIENT' | 'SUPER_ADMIN'>('EMPLOYEE');
  const [linkedEntity, setLinkedEntity] = useState('');
  const [autoDispatch, setAutoDispatch] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const activeUsers = users.filter((u) => u.status !== 'SUSPENDED');
  const admins = activeUsers.filter((u) => u.role === 'SUPER_ADMIN' || u.role === 'ADMIN');
  const employees = activeUsers.filter((u) => u.role === 'EMPLOYEE');
  const clients = activeUsers.filter((u) => u.role === 'CLIENT');

  const filteredUsers = users.filter((u) => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
    let pass = '';
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pass);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          password: password || undefined,
          role: targetRole,
          linkedEntity,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      addUser({
        id: data.uid,
        name: fullName,
        email,
        role: targetRole,
        permissions: targetRole === 'SUPER_ADMIN' ? ['all'] : targetRole === 'CLIENT' ? ['read'] : ['work'],
        status: 'ACTIVE',
        linkedEntity: linkedEntity || undefined,
      });

      setGlobalSuccessMsg(`User ${fullName} provisioned successfully${autoDispatch ? ' and credentials dispatched' : ''}!`);
      setIsModalOpen(false);
      
      // Reset form
      setFullName('');
      setEmail('');
      setPassword('');
      setTargetRole('EMPLOYEE');
      setLinkedEntity('');
    } catch (err: any) {
      alert(`Error provisioning user: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch(role) {
      case 'SUPER_ADMIN':
      case 'ADMIN': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'EMPLOYEE': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'CLIENT': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Metric Cards */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface font-outfit">User Management</h1>
          <p className="text-sm text-outline mt-1">Provision credentials, manage access, and elevate roles.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          Add New User
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="premium-card p-5 bg-white flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <UserCheck size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-outline uppercase tracking-wide">Total Active Users</p>
            <p className="text-2xl font-black text-on-surface font-outfit">{activeUsers.length}</p>
          </div>
        </div>
        <div className="premium-card p-5 bg-white flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-700">
            <Shield size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-outline uppercase tracking-wide">Admins</p>
            <p className="text-2xl font-black text-on-surface font-outfit">{admins.length}</p>
          </div>
        </div>
        <div className="premium-card p-5 bg-white flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">
            <ShieldAlert size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-outline uppercase tracking-wide">Employees</p>
            <p className="text-2xl font-black text-on-surface font-outfit">{employees.length}</p>
          </div>
        </div>
        <div className="premium-card p-5 bg-white flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
            <UserCheck size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-outline uppercase tracking-wide">Clients</p>
            <p className="text-2xl font-black text-on-surface font-outfit">{clients.length}</p>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="premium-card bg-white overflow-hidden">
        <div className="p-4 border-b border-outline-variant/30 flex justify-between items-center bg-slate-50/50">
          <h2 className="font-bold text-on-surface font-outfit">Registered Users</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search users..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-1.5 border border-outline-variant rounded-full text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-outline uppercase bg-slate-50 border-b border-outline-variant/30">
              <tr>
                <th className="px-6 py-4 font-bold tracking-wider">User / Email</th>
                <th className="px-6 py-4 font-bold tracking-wider">Current Role</th>
                <th className="px-6 py-4 font-bold tracking-wider">Linked Entity / Dept</th>
                <th className="px-6 py-4 font-bold tracking-wider">Status</th>
                <th className="px-6 py-4 font-bold tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-on-surface">{user.name}</div>
                        <div className="text-xs text-outline">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getRoleBadgeColor(user.role || 'PENDING')}`}>
                      {user.role || 'PENDING'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-on-surface-variant font-medium">
                      {user.linkedEntity || user.department || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${user.status === 'SUSPENDED' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {user.status || 'ACTIVE'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="relative group inline-block text-left">
                      <button className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 transition-colors">
                        <MoreVertical size={16} />
                      </button>
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-outline-variant/30 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 py-1">
                        {user.role !== 'SUPER_ADMIN' && (
                          <button 
                            onClick={() => {
                              updateUser(user.id!, { role: 'SUPER_ADMIN' });
                              setGlobalSuccessMsg(`${user.name} elevated to Admin.`);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 font-medium"
                          >
                            Make Admin
                          </button>
                        )}
                        {user.role === 'SUPER_ADMIN' && user.id !== currentUser?.id && (
                          <button 
                            onClick={() => {
                              updateUser(user.id!, { role: 'EMPLOYEE' });
                              setGlobalSuccessMsg(`${user.name} demoted to Employee.`);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 font-medium"
                          >
                            Demote to Employee
                          </button>
                        )}
                        <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 font-medium">
                          Reset Password
                        </button>
                        <div className="h-px bg-slate-100 my-1"></div>
                        <button 
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to suspend/remove ${user.name}?`)) {
                              updateUser(user.id!, { status: 'SUSPENDED' });
                              setGlobalSuccessMsg(`${user.name} access revoked.`);
                            }
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium"
                        >
                          Revoke Access
                        </button>
                        <button 
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to permanently delete ${user.name}? This action cannot be undone.`)) {
                              deleteUser(user.id!);
                              setGlobalSuccessMsg(`${user.name} deleted permanently.`);
                            }
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-100 font-bold"
                        >
                          Delete Permanently
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-outline">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provision User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-outline-variant/30 bg-slate-50/50">
              <h2 className="text-xl font-bold text-on-surface font-outfit">Provision New Account</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface uppercase tracking-wide">Full Name</label>
                  <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} className="w-full p-2.5 border border-outline-variant rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none" placeholder="Rohan Varma" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface uppercase tracking-wide">Email Address</label>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2.5 border border-outline-variant rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none" placeholder="rohan@example.com" />
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface uppercase tracking-wide">Password (Optional)</label>
                <div className="flex gap-2">
                  <input type="text" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-2.5 border border-outline-variant rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none" placeholder="Leave blank to generate randomly" />
                  <button type="button" onClick={generatePassword} className="btn-secondary whitespace-nowrap text-xs">Generate</button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface uppercase tracking-wide">Target Role</label>
                  <select value={targetRole} onChange={e => setTargetRole(e.target.value as any)} className="w-full p-2.5 border border-outline-variant rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none bg-white">
                    <option value="EMPLOYEE">Employee</option>
                    <option value="CLIENT">Client</option>
                    <option value="SUPER_ADMIN">Admin</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface uppercase tracking-wide">
                    {targetRole === 'CLIENT' ? 'Company Name' : 'Department'}
                  </label>
                  <input type="text" value={linkedEntity} onChange={e => setLinkedEntity(e.target.value)} className="w-full p-2.5 border border-outline-variant rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none" placeholder={targetRole === 'CLIENT' ? "TechNova Solutions" : "Taxation / Advisory"} />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-3 p-3 border border-outline-variant rounded-xl bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                  <input type="checkbox" checked={autoDispatch} onChange={e => setAutoDispatch(e.target.checked)} className="w-4 h-4 text-primary rounded border-outline" />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-on-surface">Auto-Dispatch Credentials</span>
                    <span className="text-xs text-outline">Send login credentials via Email & WhatsApp automatically.</span>
                  </div>
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-outline-variant/30 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={isLoading} className="btn-primary flex items-center gap-2">
                  {isLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <UserCheck size={18} />}
                  Provision User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
