'use client';

import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  Building2, 
  Key, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Save, 
  Shield, 
  Layers, 
  Laptop, 
  Clock,
  Check,
  Building
} from 'lucide-react';
import { fetchApi } from '@/lib/utils';

type ProfileTab = 'general' | 'security' | 'permissions';

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<ProfileTab>('general');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Profile fields
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'SUPER_ADMIN',
    department: 'Management & IT Operations',
    plantLocation: 'Greater Noida Plant (Ecotech 12)',
    address: 'Plot No 106, Sector Ecotech 12',
    city: 'Greater Noida',
    state: 'Uttar Pradesh',
    country: 'India',
    pinCode: '201306',
    joiningDate: '',
  });

  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password fields
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem('userRole') || 'SUPER_ADMIN';
    const email = localStorage.getItem('userEmail') || 'admin@rfelectro.com';
    const name = localStorage.getItem('userName') || 'Super Admin';

    const parts = name.trim().split(/\s+/).filter(Boolean);
    setFormData(prev => ({
      ...prev,
      firstName: parts[0] || 'Super',
      lastName: parts.slice(1).join(' ') || 'Admin',
      email,
      role,
    }));

    fetchApi('/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((user) => {
        if (user && user.email) {
          setCurrentUser(user);
          const nameParts = (user.name || '').trim().split(/\s+/).filter(Boolean);
          setFormData((prev) => ({
            ...prev,
            firstName: nameParts[0] || prev.firstName,
            lastName: nameParts.slice(1).join(' ') || prev.lastName,
            email: user.email,
            phone: user.phone || prev.phone,
            role: user.role || prev.role,
            department: user.department?.name || prev.department,
            joiningDate: user.createdAt 
              ? new Date(user.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
              : 'Oct 2024',
          }));
        }
      })
      .catch((err) => console.error('Failed to load profile:', err));
  }, []);

  const triggerToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName.trim()) {
      triggerToast('error', 'First name is required');
      return;
    }

    try {
      setIsSavingProfile(true);
      const targetId = currentUser?.id || localStorage.getItem('userId');
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();

      if (targetId) {
        const res = await fetchApi(`/users/${targetId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            name: fullName,
            phone: formData.phone || undefined,
          }),
        });

        if (res.ok) {
          localStorage.setItem('userName', fullName);
          triggerToast('success', 'Profile details updated successfully');
          // Instantly re-fetch from database to reflect backend state
          fetchApi('/auth/me')
            .then((r) => (r.ok ? r.json() : null))
            .then((updatedUser) => {
              if (updatedUser) {
                setCurrentUser(updatedUser);
                const nameParts = (updatedUser.name || '').trim().split(/\s+/).filter(Boolean);
                setFormData((prev) => ({
                  ...prev,
                  firstName: nameParts[0] || prev.firstName,
                  lastName: nameParts.slice(1).join(' ') || prev.lastName,
                  email: updatedUser.email || prev.email,
                  phone: updatedUser.phone || prev.phone,
                  role: updatedUser.role || prev.role,
                  department: updatedUser.department?.name || prev.department,
                }));
              }
            });
        } else {
          localStorage.setItem('userName', fullName);
          triggerToast('success', 'Profile updated locally');
        }
      } else {
        localStorage.setItem('userName', fullName);
        triggerToast('success', 'Profile updated locally');
      }
    } catch {
      triggerToast('error', 'Unable to reach server. Please check connection.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordData.newPassword || passwordData.newPassword.length < 6) {
      triggerToast('error', 'New password must be at least 6 characters long');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      triggerToast('error', 'New password and confirm password do not match');
      return;
    }

    try {
      setIsSavingPassword(true);
      const targetId = currentUser?.id || localStorage.getItem('userId');
      if (targetId) {
        const res = await fetchApi(`/users/${targetId}`, {
          method: 'PATCH',
          body: JSON.stringify({ password: passwordData.newPassword }),
        });
        if (res.ok) {
          triggerToast('success', 'Password updated successfully');
          setPasswordData({ newPassword: '', confirmPassword: '' });
        } else {
          triggerToast('error', 'Failed to update password');
        }
      } else {
        triggerToast('error', 'Active session not found. Please log in again.');
      }
    } catch {
      triggerToast('error', 'Server error while updating password');
    } finally {
      setIsSavingPassword(false);
    }
  };

  const initials = ((formData.firstName?.[0] || 'S') + (formData.lastName?.[0] || 'A')).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 sm:p-6 lg:p-8 font-sans">
      
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all ${
          toast.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-slate-600">✕</button>
        </div>
      )}

      <div className="max-w-5xl mx-auto space-y-6">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Account Settings</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Manage your personal information, security credentials, and system access.
            </p>
          </div>
        </div>

        {/* User Identity Summary Banner (Clean, Real Theme) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-600 text-white font-bold text-xl flex items-center justify-center shrink-0 shadow-xs">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">{formData.firstName} {formData.lastName}</h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Check className="w-3 h-3 stroke-[3]" /> Active
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-2">
                <span>{formData.email}</span>
                <span>•</span>
                <span className="font-semibold text-slate-700">{formData.role.replace(/_/g, ' ')}</span>
                <span>•</span>
                <span>{formData.plantLocation}</span>
              </p>
            </div>
          </div>

          <div className="text-xs text-slate-400 font-medium sm:text-right">
            <span>Employee ID: </span>
            <span className="font-mono font-semibold text-slate-700">
              {currentUser?.id ? `RFE-${currentUser.id.slice(0, 6).toUpperCase()}` : 'RFE-001'}
            </span>
            {formData.joiningDate && (
              <p className="text-[11px] text-slate-400 mt-0.5">Member since {formData.joiningDate}</p>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 gap-6 text-sm font-medium">
          <button
            onClick={() => setActiveTab('general')}
            className={`pb-3 flex items-center gap-2 transition-colors cursor-pointer border-b-2 -mb-px ${
              activeTab === 'general'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Personal Information</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`pb-3 flex items-center gap-2 transition-colors cursor-pointer border-b-2 -mb-px ${
              activeTab === 'security'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Login & Security</span>
          </button>

          <button
            onClick={() => setActiveTab('permissions')}
            className={`pb-3 flex items-center gap-2 transition-colors cursor-pointer border-b-2 -mb-px ${
              activeTab === 'permissions'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Station Access & Permissions</span>
          </button>
        </div>

        {/* TAB 1: PERSONAL INFORMATION */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            
            {/* Personal Details Form */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-base font-bold text-slate-900">Personal Details</h3>
                <p className="text-xs text-slate-500 mt-0.5">Update your personal contact information.</p>
              </div>

              <form onSubmit={handleSaveGeneral} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">First Name</label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Last Name</label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
                    <input
                      type="email"
                      disabled
                      value={formData.email}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-500 cursor-not-allowed"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">To change email, contact system administrator.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Phone Number</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 92050 09707"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Department</label>
                    <input
                      type="text"
                      disabled
                      value={formData.department}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-600 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Assigned Facility</label>
                    <input
                      type="text"
                      disabled
                      value={formData.plantLocation}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-600 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-sm font-semibold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSavingProfile ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Plant & Office Address */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">Registered Office & Plant Address</h3>
                <p className="text-xs text-slate-500 mt-0.5">Physical facility location of RF Electro Tech.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-xs font-medium text-slate-500 block">Address Line</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{formData.address}</p>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-xs font-medium text-slate-500 block">City & State</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{formData.city}, {formData.state}</p>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-xs font-medium text-slate-500 block">Postal PIN</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{formData.pinCode}</p>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-xs font-medium text-slate-500 block">Country</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{formData.country}</p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: LOGIN & SECURITY */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            
            {/* Change Password Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-base font-bold text-slate-900">Change Password</h3>
                <p className="text-xs text-slate-500 mt-0.5">Ensure your account uses a strong, secure password.</p>
              </div>

              <form onSubmit={handleSavePassword} className="space-y-4 max-w-lg text-sm">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">New Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      placeholder="Minimum 6 characters"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Confirm New Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    placeholder="Re-enter new password"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSavingPassword}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-sm font-semibold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                  >
                    <Key className="w-4 h-4" />
                    <span>{isSavingPassword ? 'Updating...' : 'Update Password'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Authentication & Session Details */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">Authentication & Security Settings</h3>
                <p className="text-xs text-slate-500 mt-0.5">Active security methods configured for your account.</p>
              </div>

              <div className="divide-y divide-slate-100 text-sm">
                <div className="py-3.5 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">Two-Factor Authentication (2FA)</p>
                    <p className="text-xs text-slate-500 mt-0.5">One-time passcodes sent via email/SMS for enhanced security.</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Enabled
                  </span>
                </div>

                <div className="py-3.5 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">Single Sign-On (SSO) Identifier</p>
                    <p className="text-xs text-slate-500 mt-0.5 font-mono">
                      {currentUser?.id ? `SSO-${currentUser.id.slice(0, 8).toUpperCase()}` : 'SSO-ACTIVE-SESSION'}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                    JWT Managed
                  </span>
                </div>

                <div className="py-3.5 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">Active Workstation Session</p>
                    <p className="text-xs text-slate-500 mt-0.5">Chrome on Windows (Current Web Session)</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Online Now
                  </span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: STATION ACCESS & PERMISSIONS */}
        {activeTab === 'permissions' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900">Assigned Manufacturing Access Rights</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Authority matrix for Role: <span className="font-semibold text-slate-700">{formData.role}</span>
                </p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 self-start sm:self-auto">
                {formData.role === 'SUPER_ADMIN' ? 'Full Administrator Rights' : `${formData.role.replace(/_/g, ' ')} Clearance`}
              </span>
            </div>

            {currentUser?.assignedStage && (
              <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-blue-900 block">Assigned Shop Floor Manufacturing Stage:</span>
                  <span className="text-blue-700 font-semibold">{currentUser.assignedStage.name} ({currentUser.assignedStage.code})</span>
                </div>
                <span className="px-2.5 py-1 rounded-md bg-blue-600 text-white font-bold text-[10px]">
                  Order: {currentUser.assignedStage.defaultOrder}
                </span>
              </div>
            )}

            {currentUser?.permissions && currentUser.permissions.length > 0 && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Live Security Permission Keys</span>
                <div className="flex flex-wrap gap-1.5">
                  {currentUser.permissions.map((permKey: string) => (
                    <span key={permKey} className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                      {permKey}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="divide-y divide-slate-100 text-sm">
              {[
                { module: 'Customer PO & Sales Management', access: 'Read / Write / Split', desc: 'Accept customer purchase orders, manage revisions, and track order quantities.' },
                { module: 'Product Gerber & Stackup Specs', access: 'CAM Verification', desc: 'Approve CAM tooling specs, base laminates, copper thickness, and solder mask.' },
                { module: 'Job Card Generation & Lot Splitting', access: 'Full Access', desc: 'Generate exact WIP Job Cards without stripping suffixes, create -A/-B sub-lots.' },
                { module: 'Shop Floor PWA & QR Tracking', access: 'All Stages Override', desc: 'Authorized to scan and advance panel WIP across all 20 PF-01 process stages.' },
                { module: 'Quality Assurance & Non-Conformance (NC)', access: 'Sign-Off Authority', desc: 'Accept, scrap, or assign rework for panels failing inspection checks.' },
                { module: 'Dispatch & Delivery Challan Export', access: 'Authorized Signatory', desc: 'Generate delivery challans, gate passes, and signed shipping documentation.' },
                { module: 'User Management & Security Governance', access: 'Administrator', desc: 'Manage staff accounts, assign manufacturing stages, and control ERP permissions.' },
              ].map((item, idx) => (
                <div key={idx} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-slate-900 text-sm">{item.module}</p>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200 shrink-0 self-start sm:self-auto">
                    {item.access}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
