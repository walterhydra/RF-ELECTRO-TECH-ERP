'use client';

import React, { useState, useEffect } from 'react';
import { Camera, Edit2 } from 'lucide-react';

export default function ProfilePage() {
  const [userRole, setUserRole] = useState('Loading...');
  const [userEmail, setUserEmail] = useState('Loading...');

  useEffect(() => {
    setUserRole(localStorage.getItem('userRole') || 'Super Admin');
    setUserEmail(localStorage.getItem('userEmail') || 'admin@rfelectro.com');
  }, []);

  const initials = userRole.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const userName = userEmail.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <div className="max-w-5xl mx-auto pb-12 space-y-6">
      <h1 className="text-2xl font-bold text-slate-800 mb-2">My Profile</h1>

      {/* Profile Header Card */}
      <div className="bg-white rounded-2xl p-6 flex items-center border border-slate-200 shadow-sm">
        <div className="relative">
          <div className="w-24 h-24 rounded-full border-4 border-blue-400 bg-blue-50 flex items-center justify-center text-3xl font-bold text-blue-600 shadow-sm">
            {initials}
          </div>
          <button className="absolute bottom-0 right-0 bg-white p-1.5 rounded-full border border-slate-200 shadow-sm hover:text-blue-600 transition-colors">
            <Camera className="w-4 h-4 text-slate-600 hover:text-blue-600" />
          </button>
        </div>
        <div className="ml-6">
          <h2 className="text-xl font-bold text-slate-900">{userName}</h2>
          <p className="text-slate-500 text-sm font-medium">{userRole}</p>
          <p className="text-slate-400 text-sm mt-1">Noida, Uttar Pradesh</p>
        </div>
      </div>

      {/* Personal Information Section */}
      <section className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-4">
          <h3 className="text-lg font-bold text-slate-800">Personal Information</h3>
          <button className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium flex items-center hover:bg-blue-700 transition-colors shadow-sm">
            Edit
            <Edit2 className="ml-2 w-4 h-4" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-y-8 gap-x-6">
          <div>
            <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">First Name</label>
            <div className="text-slate-800 font-semibold">{userName.split(' ')[0] || userName}</div>
          </div>
          <div>
            <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Last Name</label>
            <div className="text-slate-800 font-semibold">{userName.split(' ')[1] || '-'}</div>
          </div>
          <div>
            <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Date of Birth</label>
            <div className="text-slate-800 font-semibold">12-10-1990</div>
          </div>
          <div>
            <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Email Address</label>
            <div className="text-slate-800 font-semibold">{userEmail}</div>
          </div>
          <div>
            <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Phone Number</label>
            <div className="text-slate-800 font-semibold">+91 98765 43210</div>
          </div>
          <div>
            <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">User Role</label>
            <div className="text-slate-800 font-semibold">{userRole}</div>
          </div>
        </div>
      </section>

      {/* Address Section */}
      <section className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-4">
          <h3 className="text-lg font-bold text-slate-800">Address</h3>
          <button className="bg-white border border-slate-200 text-slate-600 px-5 py-2 rounded-lg text-sm font-medium flex items-center hover:bg-slate-50 transition-colors shadow-sm">
            Edit
            <Edit2 className="ml-2 w-4 h-4" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-y-8 gap-x-6">
          <div>
            <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Country</label>
            <div className="text-slate-800 font-semibold">India</div>
          </div>
          <div>
            <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">City</label>
            <div className="text-slate-800 font-semibold">Noida, Sector 62</div>
          </div>
          <div>
            <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Postal Code</label>
            <div className="text-slate-800 font-semibold">201309</div>
          </div>
        </div>
      </section>
      
    </div>
  );
}
