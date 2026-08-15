'use client';

import React, { useState, useEffect } from 'react';
import { useDashboardStore } from '../../store/dashboardStore';
import { pullDatabaseFromFirebase } from '../../lib/firebaseSync';
import { Shield, Plus, Edit2, Trash2, Check, X, ShieldAlert, Eye } from 'lucide-react';
import { User, Role } from '../../types';
import { EmployeeDetailsModal } from './EmployeeDetailsModal';
import { ClientUserDetailsModal } from './ClientUserDetailsModal';

export const UsersManagementView: React.FC = () => {
  const { users, addUser, updateUser, deleteUser, currentUser, registrationCode } = useDashboardStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [selectedUserForProfile, setSelectedUserForProfile] = useState<User | null>(null);
  
  // Refresh latest users when visiting this tab
  useEffect(() => {
    pullDatabaseFromFirebase().catch(console.error);
  }, []);
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('EMPLOYEE');

  const roles: { value: Role; label: string; desc: string }[] = [
    { value: 'SUPER_ADMIN', label: 'Super Admin', desc: 'Full platform access.' },
    { value: 'EMPLOYEE', label: 'Employee', desc: 'Can manage assigned engagements & tasks.' },
    { value: 'CLIENT', label: 'Client', desc: 'Read-only access to their own data.' },
    { value: 'PENDING', label: 'Pending Approval', desc: 'No access until role is assigned.' }
  ];

  const resetForm = () => {
    setName('');
    setEmail('');
    setRole('EMPLOYEE');
    setEditingUserId(null);
    setIsModalOpen(false);
  };

  const handleEdit = (user: User) => {
    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
    setEditingUserId(user.id);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUserId) {
      updateUser(editingUserId, { name, email, role, permissions: role === 'SUPER_ADMIN' ? ['all'] : ['work'] });
    } else {
      addUser({
        name,
        email,
        role,
        permissions: role === 'SUPER_ADMIN' ? ['all'] : ['work']
      });
    }
    resetForm();
  };

  const handleDelete = (id: string, userName: string) => {
    if (id === currentUser?.id) {
      alert("You cannot delete your own account.");
      return;
    }
    if (confirm(`Are you sure you want to remove access for ${userName}?`)) {
      deleteUser(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 font-outfit">Access Control & Users</h1>
          <p className="text-xs text-slate-500 mt-1">Manage team members, roles, and platform access permissions.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Registration Code:</span>
            <code className="text-sm font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200 select-all">{registrationCode}</code>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-800 transition-all flex items-center gap-2 shadow-md"
          >
            <Plus size={16} /> Add User
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 font-semibold text-xs uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">User Details</th>
              <th className="px-6 py-4">Assigned Role</th>
              <th className="px-6 py-4">Access Level</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {users.filter(u => u.id !== currentUser?.id).map((user) => (
              <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 text-sm">
                      {user.avatar ? <img src={user.avatar} alt="avatar" className="w-full h-full rounded-full object-cover" /> : user.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                    user.role === 'SUPER_ADMIN' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                    user.role === 'CLIENT' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    user.role === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    {user.role.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <Shield size={14} className={user.permissions.includes('all') ? 'text-emerald-500' : 'text-slate-400'} />
                    {user.permissions.includes('all') ? 'Full System Access' : 'Restricted (Ops Only)'}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {(user.role === 'EMPLOYEE' || user.role === 'CLIENT') && (
                      <button
                        onClick={() => setSelectedUserForProfile(user)}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="View Onboarding Profile"
                      >
                        <Eye size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(user)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit User"
                    >
                      <Edit2 size={16} />
                    </button>
                    {user.id !== currentUser?.id && (
                      <button
                        onClick={() => handleDelete(user.id, user.name)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove Access"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800">
                {editingUserId ? 'Edit User Role' : 'Provision New User'}
              </h2>
              <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {!editingUserId && (
                <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl flex gap-3 text-xs text-blue-800 mb-2">
                  <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                  <p>When this user logs in via Google with this email address, they will automatically be granted the role assigned below.</p>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Email Address (Google Account)</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="john@vanntagge.com"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">System Role</label>
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                  {roles.map((r) => (
                    <label key={r.value} className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${role === r.value ? 'bg-blue-50 border-blue-200' : 'border-slate-200 hover:bg-slate-50'}`}>
                      <div className="mt-0.5">
                        <input
                          type="radio"
                          name="role"
                          value={r.value}
                          checked={role === r.value}
                          onChange={(e) => setRole(e.target.value as Role)}
                          className="w-4 h-4 text-blue-600"
                        />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{r.label}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{r.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
                >
                  <Check size={16} /> {editingUserId ? 'Save Changes' : 'Provision User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Profile Modals */}
      {selectedUserForProfile?.role === 'EMPLOYEE' && (
        <EmployeeDetailsModal
          employee={selectedUserForProfile}
          onClose={() => setSelectedUserForProfile(null)}
        />
      )}
      {selectedUserForProfile?.role === 'CLIENT' && (
        <ClientUserDetailsModal
          user={selectedUserForProfile}
          onClose={() => setSelectedUserForProfile(null)}
        />
      )}
    </div>
  );
};
