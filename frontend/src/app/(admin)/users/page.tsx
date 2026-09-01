'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ShieldCheck, 
  Plus, 
  Search, 
  Edit2, 
  CheckCircle2, 
  XCircle, 
  Layers, 
  AlertCircle, 
  Mail, 
  Phone, 
  Lock, 
  CheckSquare, 
  Square,
  Cpu,
  HardHat,
  UserCheck,
  Building2
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  department?: string;
  phone?: string;
  assignedStages?: string[];
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

// Format role names cleanly
const formatRoleName = (role: string) => {
  return role.replace(/_/g, ' ');
};

// Stage chip styling for Light Theme
const getStageBadgeStyle = (stage: string) => {
  if (stage.includes('System Wide')) {
    return 'bg-amber-50 text-amber-800 border-amber-300 font-semibold';
  }
  if (stage.includes('CAM') || stage.includes('Gerber')) {
    return 'bg-indigo-50 text-indigo-700 border-indigo-200';
  }
  if (stage.includes('CNC') || stage.includes('Cutting') || stage.includes('Drilling')) {
    return 'bg-orange-50 text-orange-700 border-orange-200';
  }
  if (stage.includes('Copper') || stage.includes('Plating') || stage.includes('Etching')) {
    return 'bg-cyan-50 text-cyan-700 border-cyan-200';
  }
  if (stage.includes('AOI') || stage.includes('Testing') || stage.includes('QC')) {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }
  return 'bg-slate-100 text-slate-700 border-slate-200';
};

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

  // Filtered list
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.assignedStages?.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = selectedRoleFilter === 'ALL' || u.role === selectedRoleFilter;
    return matchesSearch && matchesRole;
  });

  // Calculate Metrics
  const totalStaff = users.length;
  const operatorCount = users.filter((u) => u.role === 'PROCESS_OPERATOR').length;
  const engQcCount = users.filter((u) => u.role === 'CAM_ENGINEER' || u.role === 'QA_QC_ENGINEER').length;
  const adminCount = users.filter((u) => u.role === 'SUPER_ADMIN').length;

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

  const handleSelectAllStages = () => {
    setFormData((prev) => ({ ...prev, assignedStages: [...AVAILABLE_STAGES] }));
  };

  const handleClearAllStages = () => {
    setFormData((prev) => ({ ...prev, assignedStages: [] }));
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
        if (editingUser) {
          setUsers(users.map((u) => (u.id === editingUser.id ? { ...u, ...formData } : u)));
        } else {
          const newUser: User = { id: String(Date.now()), ...formData };
          setUsers([newUser, ...users]);
        }
        setIsModalOpen(false);
      }
    } catch {
      if (editingUser) {
        setUsers(users.map((u) => (u.id === editingUser.id ? { ...u, ...formData } : u)));
      } else {
        const newUser: User = { id: String(Date.now()), ...formData };
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

  return (
    <div className="space-y-6 p-6 max-w-[1400px] mx-auto pb-16 bg-slate-100 min-h-screen text-slate-900">
      
      {/* Top Banner & Header (White Theme Card) */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">User Management & Stage Assignment</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-amber-100 text-amber-800 font-semibold border border-amber-200">
                RBAC 10-Role
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage factory staff accounts, role-based permissions, and shop-floor process assignments.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>New Staff / Operator</span>
        </button>
      </div>

      {/* Metrics Cards Grid (White Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Staff Active</p>
            <p className="text-lg font-bold text-slate-900 mt-0.5">{totalStaff} Members</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
            <HardHat className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Shop Floor Operators</p>
            <p className="text-lg font-bold text-slate-900 mt-0.5">{operatorCount} Operators</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 shrink-0">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">CAM & QA Engineers</p>
            <p className="text-lg font-bold text-slate-900 mt-0.5">{engQcCount} Engineers</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Super Admin Governance</p>
            <p className="text-lg font-bold text-slate-900 mt-0.5">{adminCount} Super Admin</p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar (White Theme) */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl space-y-3 shadow-sm">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search staff by Name, Email, Role, or Assigned Stage..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            )}
          </div>

          {/* Clean Role Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap mr-1">Filter Role:</span>
            <button
              onClick={() => setSelectedRoleFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                selectedRoleFilter === 'ALL'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 border border-slate-200'
              }`}
            >
              All ({users.length})
            </button>
            
            {ROLES.filter((r) => users.some((u) => u.role === r)).map((role) => {
              const count = users.filter((u) => u.role === role).length;
              const isSelected = selectedRoleFilter === role;
              return (
                <button
                  key={role}
                  onClick={() => setSelectedRoleFilter(role)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  <span>{formatRoleName(role)}</span>
                  <span className={`px-1.5 py-0.2 rounded text-[10px] ${
                    isSelected ? 'bg-slate-950/20 text-slate-950 font-extrabold' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

        </div>
      </div>

      {/* Main Staff Table (White Container) */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-mono uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-5">Employee Name</th>
                <th className="py-3.5 px-5">Email & Phone</th>
                <th className="py-3.5 px-5">RBAC Role</th>
                <th className="py-3.5 px-5 min-w-[300px]">Assigned Process Stages</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                  
                  {/* Employee Name & Avatar */}
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 shrink-0">
                        {user.firstName[0]}{user.lastName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {user.firstName} {user.lastName}
                        </p>
                        {user.department && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            <span>{user.department}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Contact Info */}
                  <td className="py-3.5 px-5 text-slate-600">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-mono text-slate-700">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{user.email}</span>
                      </div>
                      {user.phone && (
                        <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{user.phone}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* RBAC Role */}
                  <td className="py-3.5 px-5">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono border ${
                      user.role === 'SUPER_ADMIN'
                        ? 'bg-amber-50 border-amber-200 text-amber-800 font-bold'
                        : user.role === 'PROCESS_OPERATOR'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-semibold'
                        : user.role.includes('ENGINEER') || user.role.includes('MANAGER')
                        ? 'bg-blue-50 border-blue-200 text-blue-800 font-semibold'
                        : 'bg-slate-100 border-slate-200 text-slate-700'
                    }`}>
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                      <span>{formatRoleName(user.role)}</span>
                    </span>
                  </td>

                  {/* Assigned Process Stages (Clean Light Chips) */}
                  <td className="py-3.5 px-5">
                    <div className="flex flex-wrap gap-1.5 max-w-md py-0.5">
                      {user.assignedStages && user.assignedStages.length > 0 ? (
                        user.assignedStages.map((stage, i) => {
                          const badgeStyle = getStageBadgeStyle(stage);
                          return (
                            <span
                              key={i}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border leading-snug shadow-2xs ${badgeStyle}`}
                            >
                              <Layers className="w-3 h-3 shrink-0 opacity-70" />
                              <span>{stage}</span>
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-slate-400 text-xs italic font-normal">— Unassigned —</span>
                      )}
                    </div>
                  </td>

                  {/* Status Toggle */}
                  <td className="py-3.5 px-5">
                    <button
                      onClick={() => toggleStatus(user.id)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                        user.isActive
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      <span>{user.isActive ? 'Active' : 'Inactive'}</span>
                    </button>
                  </td>

                  {/* Edit Action Button */}
                  <td className="py-3.5 px-5 text-right">
                    <button
                      onClick={() => handleOpenEdit(user)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 rounded-xl transition-all inline-flex items-center gap-1.5 text-xs font-medium shadow-2xs"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-amber-600" />
                      <span>Edit & Assign</span>
                    </button>
                  </td>
                </tr>
              ))}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-medium">No staff records found matching your query.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal (White Theme Modal) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 my-8 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto text-slate-900">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 font-bold shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {editingUser ? 'Edit Staff Credentials & Stage Linkage' : 'Create New Staff Record'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Assign RBAC governance role and shop-floor process authorization.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">FIRST NAME *</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="e.g. Suresh"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">LAST NAME *</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="e.g. Patel"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">EMAIL ADDRESS *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. suresh@rfelectro.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">PHONE NUMBER</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. +91 98000 00003"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">RBAC ROLE *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-amber-500"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{formatRoleName(r)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">DEPARTMENT</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-amber-500"
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
                  <label className="block text-xs font-semibold text-slate-600 mb-1">INITIAL PASSWORD *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500 text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Stage Linkage Selector */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-700 flex items-center gap-1.5">
                    <Layers className="w-4 h-4" /> Authorized Process Stages ({formData.assignedStages.length} Selected)
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleSelectAllStages}
                      className="text-[11px] text-amber-600 hover:underline flex items-center gap-1 font-medium"
                    >
                      <CheckSquare className="w-3.5 h-3.5" /> Select All
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={handleClearAllStages}
                      className="text-[11px] text-slate-500 hover:underline flex items-center gap-1 font-medium"
                    >
                      <Square className="w-3.5 h-3.5" /> Clear
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                  {AVAILABLE_STAGES.map((stage) => {
                    const isSelected = formData.assignedStages.includes(stage);
                    return (
                      <button
                        type="button"
                        key={stage}
                        onClick={() => toggleStageAssignment(stage)}
                        className={`text-left p-2.5 rounded-xl text-xs font-medium border transition-all flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'bg-amber-100/80 border-amber-300 text-amber-900 font-semibold shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <span>{stage}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 sticky bottom-0 bg-white z-10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-all shadow-sm"
                >
                  {editingUser ? 'Update Staff Record' : 'Save Staff Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
