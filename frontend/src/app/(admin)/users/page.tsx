'use client';

import React, { useState, useEffect } from 'react';
import { Users, ShieldCheck, Plus, Search, Edit2, CheckCircle2, XCircle, Layers, UserCheck, AlertCircle, Mail, Phone, Lock } from 'lucide-react';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  department?: string;
  phone?: string;
  assignedStages?: string[]; // codes or names of assigned process stages
  isActive: boolean;
}

const INITIAL_USERS: User[] = [
  {
    id: '1',
    email: 'admin@rfelectro.com',
    firstName: 'System',
    lastName: 'Administrator',
    role: 'SUPER_ADMIN',
    department: 'Management',
    phone: '+91 98000 00001',
    assignedStages: ['All Stages (System Wide)'],
    isActive: true,
  },
  {
    id: '2',
    email: 'ramesh@rfelectro.com',
    firstName: 'Ramesh',
    lastName: 'Kulkarni',
    role: 'CAM_ENGINEER',
    department: 'Engineering',
    phone: '+91 98000 00002',
    assignedStages: ['CAM & Gerber Verification'],
    isActive: true,
  },
  {
    id: '3',
    email: 'suresh@rfelectro.com',
    firstName: 'Suresh',
    lastName: 'Patel',
    role: 'PROCESS_OPERATOR',
    department: 'Wet Processing',
    phone: '+91 98000 00003',
    assignedStages: ['Electroless Copper / Plating', 'Dry Film Imaging & Etching'],
    isActive: true,
  },
  {
    id: '4',
    email: 'amit@rfelectro.com',
    firstName: 'Amit',
    lastName: 'Verma',
    role: 'PROCESS_OPERATOR',
    department: 'Mechanical',
    phone: '+91 98000 00004',
    assignedStages: ['CNC Material Cutting', 'CNC Drilling & Routing', 'Final CNC Routing & V-Scored Profiling'],
    isActive: true,
  },
  {
    id: '5',
    email: 'deepa@rfelectro.com',
    firstName: 'Deepa',
    lastName: 'Nair',
    role: 'QA_QC_ENGINEER',
    department: 'Quality Assurance',
    phone: '+91 98000 00005',
    assignedStages: ['AOI (Automated Optical Inspection)', 'Electrical Testing (E-Test)', 'Final QC & Vacuum Packaging'],
    isActive: true,
  },
];

const AVAILABLE_STAGES = [
  'CAM & Gerber Verification',
  'CNC Material Cutting',
  'CNC Drilling & Routing',
  'Electroless Copper / Plating',
  'Dry Film Imaging & Etching',
  'AOI (Automated Optical Inspection)',
  'LPI Solder Mask & Curing',
  'Legend / Component Silkscreen',
  'Surface Finish (ENIG / HASL)',
  'Electrical Testing (E-Test)',
  'Final CNC Routing & V-Scored Profiling',
  'Final QC & Vacuum Packaging',
];

const ROLES = [
  'SUPER_ADMIN',
  'GENERAL_MANAGER',
  'PLANNING_MANAGER',
  'CAM_ENGINEER',
  'PRODUCTION_MANAGER',
  'STAGE_SUPERVISOR',
  'PROCESS_OPERATOR',
  'QA_QC_ENGINEER',
  'STORE_MANAGER',
  'CUSTOMER_PORTAL_USER',
];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    role: 'PROCESS_OPERATOR',
    department: 'Wet Processing',
    phone: '',
    assignedStages: [] as string[],
    isActive: true,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('http://localhost:3001/api/v1/users')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setUsers(
            data.map((u: any) => ({
              ...u,
              assignedStages: u.assignedStages?.length ? u.assignedStages : ['Unassigned / General'],
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
      password: '',
      role: 'PROCESS_OPERATOR',
      department: 'Wet Processing',
      phone: '',
      assignedStages: ['Electroless Copper / Plating'],
      isActive: true,
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      password: '',
      role: user.role,
      department: user.department || 'Production',
      phone: user.phone || '',
      assignedStages: user.assignedStages || [],
      isActive: user.isActive,
    });
    setError('');
    setIsModalOpen(true);
  };

  const toggleStageAssignment = (stageName: string) => {
    setFormData((prev) => {
      const exists = prev.assignedStages.includes(stageName);
      if (exists) {
        return { ...prev, assignedStages: prev.assignedStages.filter((s) => s !== stageName) };
      } else {
        return { ...prev, assignedStages: [...prev.assignedStages, stageName] };
      }
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email.trim() || !formData.firstName.trim() || !formData.lastName.trim()) {
      setError('Email, First Name, and Last Name are required');
      return;
    }
    if (!editingUser && !formData.password) {
      setError('Password is required for new users');
      return;
    }

    try {
      const method = editingUser ? 'PATCH' : 'POST';
      const url = editingUser
        ? `http://localhost:3001/api/v1/users/${editingUser.id}`
        : 'http://localhost:3001/api/v1/users';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const saved = await res.json();
        const formatted = { ...saved, assignedStages: formData.assignedStages };
        if (editingUser) {
          setUsers(users.map((u) => (u.id === saved.id ? formatted : u)));
        } else {
          setUsers([formatted, ...users]);
        }
        setIsModalOpen(false);
      } else {
        // Fallback state update
        if (editingUser) {
          setUsers(
            users.map((u) => (u.id === editingUser.id ? { ...u, ...formData } : u))
          );
        } else {
          const newUser: User = {
            id: String(Date.now()),
            ...formData,
          };
          setUsers([newUser, ...users]);
        }
        setIsModalOpen(false);
      }
    } catch {
      if (editingUser) {
        setUsers(
          users.map((u) => (u.id === editingUser.id ? { ...u, ...formData } : u))
        );
      } else {
        const newUser: User = {
          id: String(Date.now()),
          ...formData,
        };
        setUsers([newUser, ...users]);
      }
      setIsModalOpen(false);
    }
  };

  const toggleStatus = async (id: string) => {
    try {
      await fetch(`http://localhost:3001/api/v1/users/${id}/status`, { method: 'PATCH' });
    } catch {}
    setUsers(users.map((u) => (u.id === id ? { ...u, isActive: !u.isActive } : u)));
  };

  const filtered = users.filter((u) => {
    const matchesSearch =
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRoleFilter === 'ALL' || u.role === selectedRoleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-wide">User Management & Stage Assignment</h1>
            <p className="text-xs text-slate-400 font-mono mt-1">
              RBAC 10-ROLE GOVERNANCE • PROCESS OPERATOR STAGE LINKAGE
            </p>
          </div>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          <span>New Staff / Operator</span>
        </button>
      </div>

      {/* Role Badges Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 overflow-x-auto flex items-center gap-2">
        <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider shrink-0 mr-2 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-amber-400" /> Role Filter:
        </span>
        <button
          onClick={() => setSelectedRoleFilter('ALL')}
          className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
            selectedRoleFilter === 'ALL'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
              : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          ALL ({users.length})
        </button>
        {ROLES.map((role) => {
          const count = users.filter((u) => u.role === role).length;
          return (
            <button
              key={role}
              onClick={() => setSelectedRoleFilter(role)}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition-all whitespace-nowrap ${
                selectedRoleFilter === role
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {role.replace('_', ' ')} {count > 0 && `(${count})`}
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
        <Search className="w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search staff by Name, Email, or Assigned Process Stage..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent text-sm text-slate-200 placeholder-slate-500 w-full focus:outline-none"
        />
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-mono uppercase text-slate-400">
                <th className="py-4 px-6">Employee Name</th>
                <th className="py-4 px-6">Email & Phone</th>
                <th className="py-4 px-6">RBAC Role</th>
                <th className="py-4 px-6">Assigned Process Stages</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {filtered.map((user) => (
                <tr key={user.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-4 px-6 font-semibold text-white">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-amber-400 shrink-0">
                        {user.firstName[0]}{user.lastName[0]}
                      </div>
                      <div className="flex flex-col">
                        <span>{user.firstName} {user.lastName}</span>
                        {user.department && (
                          <span className="text-xs text-slate-400 font-normal">{user.department}</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-slate-300">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Mail className="w-3.5 h-3.5 text-slate-500" />
                        <span>{user.email}</span>
                      </div>
                      {user.phone && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <Phone className="w-3.5 h-3.5 text-slate-500" />
                          <span>{user.phone}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6 font-mono text-xs font-bold">
                    <span className={`inline-block px-2.5 py-1 rounded-md border ${
                      user.role === 'SUPER_ADMIN'
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                        : user.role.includes('MANAGER') || user.role.includes('ENGINEER')
                        ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                        : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {user.assignedStages?.map((stage, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800/80 text-[11px] text-slate-300 border border-slate-700/60 font-mono"
                        >
                          <Layers className="w-3 h-3 text-amber-400/80" />
                          {stage}
                        </span>
                      )) || <span className="text-slate-500 text-xs">—</span>}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <button
                      onClick={() => toggleStatus(user.id)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                        user.isActive
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                      }`}
                    >
                      {user.isActive ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Active</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Inactive</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => handleOpenEdit(user)}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors inline-flex items-center gap-1.5 text-xs font-medium"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Edit & Assign</span>
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No users found matching "{searchTerm}".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 my-8 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 sticky top-0 bg-slate-900 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
                  {editingUser ? 'ED' : 'NEW'}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {editingUser ? 'Edit User & Process Assignment' : 'Create New Staff / Operator'}
                  </h2>
                  <p className="text-xs text-slate-400 font-mono">
                    RBAC ROLE GOVERNANCE & STAGE LINKAGE
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">FIRST NAME *</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="e.g. Suresh"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">LAST NAME *</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="e.g. Patel"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">EMAIL ADDRESS *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. suresh@rfelectro.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">PHONE NUMBER</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. +91 98000 00003"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">RBAC ROLE *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 text-xs font-mono focus:outline-none focus:border-amber-500"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">DEPARTMENT</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 text-xs focus:outline-none focus:border-amber-500"
                  >
                    <option value="Engineering">Engineering (CAM/CAD)</option>
                    <option value="Mechanical">Mechanical (Cut/Drill/Route)</option>
                    <option value="Wet Processing">Wet Processing (Plating/Etch/Mask)</option>
                    <option value="Quality Assurance">Quality Assurance (AOI/E-Test/QC)</option>
                    <option value="Dispatch & Store">Dispatch & Store</option>
                    <option value="Management">Management</option>
                  </select>
                </div>
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">
                    INITIAL PASSWORD *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              )}

              {/* Process Assignment Box */}
              <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" /> Assign Process Stages ({formData.assignedStages.length} selected)
                  </span>
                  <span className="text-[10px] text-slate-400">Click to toggle assignment</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {AVAILABLE_STAGES.map((stage) => {
                    const isSelected = formData.assignedStages.includes(stage);
                    return (
                      <button
                        type="button"
                        key={stage}
                        onClick={() => toggleStageAssignment(stage)}
                        className={`text-left p-2 rounded-lg text-xs font-mono border transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 font-bold'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <span className="truncate pr-2">{stage}</span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800 sticky bottom-0 bg-slate-900 z-10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                >
                  {editingUser ? 'Update User & Assignments' : 'Create Staff Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
