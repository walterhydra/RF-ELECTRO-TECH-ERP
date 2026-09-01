'use client';

import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  Edit2, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  Building2, 
  Calendar, 
  Key, 
  Lock, 
  CheckCircle2, 
  Award, 
  Clock, 
  Sparkles,
  Save,
  X
} from 'lucide-react';

export default function ProfilePage() {
  const [userRole, setUserRole] = useState('Super Admin');
  const [userEmail, setUserEmail] = useState('admin@rfelectro.com');
  const [isEditing, setIsEditing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [profileData, setProfileData] = useState({
    firstName: 'Admin',
    lastName: 'Technocrat',
    dob: '1990-10-12',
    email: 'admin@rfelectro.com',
    phone: '+91 98765 43210',
    role: 'Super Admin',
    plantLocation: 'Plant-01 (Noida Sector 62)',
    country: 'India',
    city: 'Noida, Uttar Pradesh',
    postalCode: '201309',
    department: 'Executive Systems & Governance',
  });

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    const email = localStorage.getItem('userEmail');
    if (role) setUserRole(role);
    if (email) setUserEmail(email);
  }, []);

  const initials = profileData.firstName.substring(0, 1) + (profileData.lastName ? profileData.lastName.substring(0, 1) : '');

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditing(false);
    setSuccessMsg('Profile details updated successfully!');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <div className="space-y-6 p-6 max-w-[1200px] mx-auto pb-16 bg-slate-100 min-h-screen text-slate-900 font-sans">
      
      {/* Success Banner */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-700 hover:text-emerald-900 font-bold text-sm">✕</button>
        </div>
      )}

      {/* Profile Banner & Cover Header */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        
        {/* Cover Background */}
        <div className="h-32 bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 relative p-6 flex items-end justify-between">
          <div className="absolute inset-0 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
          <span className="relative text-[10px] font-mono font-bold text-amber-400 bg-slate-950/60 px-3 py-1 rounded-full border border-amber-500/30 backdrop-blur-sm">
            RF ELECTRO ERP • ENTERPRISE USER PROFILE
          </span>
        </div>

        {/* Profile Avatar & Info Row */}
        <div className="p-6 pt-0 relative flex flex-col md:flex-row md:items-end justify-between gap-4">
          
          <div className="flex items-end gap-5 -mt-12">
            {/* Avatar Circle */}
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl border-4 border-white bg-amber-50 border-amber-300 shadow-md flex items-center justify-center text-2xl font-bold font-mono text-amber-700">
                {initials || 'SA'}
              </div>
              <button 
                className="absolute -bottom-1 -right-1 bg-white p-2 rounded-xl border border-slate-200 shadow-sm hover:bg-slate-50 text-slate-700 transition-colors"
                title="Change Avatar Photo"
              >
                <Camera className="w-4 h-4 text-amber-600" />
              </button>
            </div>

            {/* Name & Role */}
            <div className="pb-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">{profileData.firstName} {profileData.lastName}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">{profileData.role} • {profileData.department}</p>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mt-1">
                <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>{profileData.city}</span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm shrink-0"
            >
              <Edit2 className="w-4 h-4 stroke-[2.5]" />
              <span>{isEditing ? 'Cancel Editing' : 'Edit Profile Details'}</span>
            </button>
          </div>

        </div>
      </div>

      {/* Top User Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Security Clearance</p>
            <p className="text-sm font-bold text-slate-900 mt-0.5">Level 5 (Super Admin)</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Factory Facility</p>
            <p className="text-sm font-bold text-slate-900 mt-0.5">{profileData.plantLocation}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Current Shift Status</p>
            <p className="text-sm font-bold text-blue-700 mt-0.5">🟢 Active On Duty</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 shrink-0">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Authentication Mode</p>
            <p className="text-sm font-bold text-slate-900 mt-0.5">2FA & JWT Token</p>
          </div>
        </div>
      </div>

      {/* Main Profile Data Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Personal Information Form/View */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 font-bold">
                  <User className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-slate-900">Personal Information</h2>
              </div>
              <span className="text-[11px] font-mono text-slate-400">USER ID: RF-USER-001</span>
            </div>

            {isEditing ? (
              <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">FIRST NAME *</label>
                    <input
                      type="text"
                      required
                      value={profileData.firstName}
                      onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-amber-500 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">LAST NAME *</label>
                    <input
                      type="text"
                      required
                      value={profileData.lastName}
                      onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-amber-500 font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">EMAIL ADDRESS *</label>
                    <input
                      type="email"
                      required
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-amber-500 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">PHONE NUMBER *</label>
                    <input
                      type="text"
                      required
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-mono text-xs focus:bg-white focus:outline-none focus:border-amber-500 font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">DATE OF BIRTH</label>
                    <input
                      type="date"
                      value={profileData.dob}
                      onChange={(e) => setProfileData({ ...profileData, dob: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-mono text-xs focus:bg-white focus:outline-none focus:border-amber-500 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">USER ROLE</label>
                    <input
                      type="text"
                      disabled
                      value={profileData.role}
                      className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-500 font-mono text-xs cursor-not-allowed font-semibold"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition-all shadow-sm flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">First Name</span>
                  <span className="font-bold text-slate-900 text-sm">{profileData.firstName}</span>
                </div>

                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">Last Name</span>
                  <span className="font-bold text-slate-900 text-sm">{profileData.lastName}</span>
                </div>

                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">Date of Birth</span>
                  <span className="font-bold font-mono text-slate-900 text-sm">{new Date(profileData.dob).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>

                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">Email Address</span>
                  <span className="font-semibold text-blue-700 text-sm flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {profileData.email}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">Phone Number</span>
                  <span className="font-bold font-mono text-slate-900 text-sm flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {profileData.phone}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">ERP Governance Role</span>
                  <span className="px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-800 font-bold font-mono inline-block">
                    {profileData.role}
                  </span>
                </div>
              </div>
            )}

          </div>

          {/* Location & Address Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold">
                  <MapPin className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-slate-900">Registered Office Address</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">Country</span>
                <span className="font-bold text-slate-900 text-sm">{profileData.country}</span>
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">City & State</span>
                <span className="font-bold text-slate-900 text-sm">{profileData.city}</span>
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">Postal Code</span>
                <span className="font-bold font-mono text-slate-900 text-sm">{profileData.postalCode}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Station Permissions & Security Credentials */}
        <div className="space-y-6">
          
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 font-bold">
                <Lock className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-900">Security Credentials</h2>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Single Sign-On (SSO) ID</span>
                <p className="font-mono font-bold text-slate-900">RF-SSO-ADMIN-990</p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Password Last Changed</span>
                <p className="font-mono font-bold text-slate-900">14 Days Ago (01-08-2026)</p>
              </div>

              <button 
                onClick={() => alert('Password Reset email link dispatched!')}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs border border-slate-200 transition-all flex items-center justify-center gap-2"
              >
                <Key className="w-3.5 h-3.5 text-amber-600" />
                <span>Reset User Password</span>
              </button>
            </div>
          </div>

          {/* Station Privileges */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 font-bold">
                <Award className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-900">ERP Station Access</h2>
            </div>

            <div className="space-y-2 text-xs">
              {[
                { name: 'Customer Master & PO Entry', level: 'Full Read/Write' },
                { name: 'Product Gerber Master Specs', level: 'Full Read/Write' },
                { name: 'Job Card Generation & Split', level: 'Full Read/Write' },
                { name: 'Shop Floor PWA & QC Disposition', level: 'Super Admin Override' },
                { name: 'Dispatch & Challan PDF Export', level: 'Authorized Signatory' },
              ].map((perm, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="font-medium text-slate-800 text-[11px]">{perm.name}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {perm.level}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
