'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Mail, Lock, ArrowRight, Shield, Layers, CheckCircle2, Truck, Info, Check, Globe } from 'lucide-react';

const DEMO_CREDENTIALS = [
  {
    role: 'Super Admin',
    email: 'admin@rfelectro.com',
    icon: Shield,
    color: 'bg-rose-100 text-rose-600',
    borderColor: 'border-rose-200'
  },
  {
    role: 'Production Manager',
    email: 'production@rfelectro.com',
    icon: Layers,
    color: 'bg-emerald-100 text-emerald-600',
    borderColor: 'border-emerald-200'
  },
  {
    role: 'Quality Inspector',
    email: 'quality@rfelectro.com',
    icon: CheckCircle2,
    color: 'bg-blue-100 text-blue-600',
    borderColor: 'border-blue-200'
  },
  {
    role: 'Dispatch Manager',
    email: 'dispatch@rfelectro.com',
    icon: Truck,
    color: 'bg-amber-100 text-amber-600',
    borderColor: 'border-amber-200'
  }
];

const STAGE_OPERATOR_CREDENTIALS = [
  { order: 1, name: 'SHEARING', code: 'SHR', email: 'stage01.shearing@rfelectro.com', label: '1. SHEARING' },
  { order: 2, name: 'DRILLING', code: 'DRL', email: 'stage02.drilling@rfelectro.com', label: '2. DRILLING' },
  { order: 3, name: 'DRL-QC', code: 'DRL-QC', email: 'stage03.drlqc@rfelectro.com', label: '3. DRL-QC' },
  { order: 4, name: 'DML', code: 'DML', email: 'stage04.dml@rfelectro.com', label: '4. DML' },
  { order: 5, name: 'PIT', code: 'PIT', email: 'stage05.pit@rfelectro.com', label: '5. PIT' },
  { order: 6, name: 'PIT-QC', code: 'PIT-QC', email: 'stage06.pitqc@rfelectro.com', label: '6. PIT-QC' },
  { order: 7, name: 'PLATING', code: 'PLT', email: 'stage07.plating@rfelectro.com', label: '7. PLATING' },
  { order: 8, name: 'ETCHING', code: 'ETC', email: 'stage08.etching@rfelectro.com', label: '8. ETCHING' },
  { order: 9, name: 'PREMASK-QC/AOI', code: 'AOI', email: 'stage09.aoi@rfelectro.com', label: '9. PREMASK-QC/AOI' },
  { order: 10, name: 'PISM', code: 'PISM', email: 'stage10.pism@rfelectro.com', label: '10. PISM' },
  { order: 11, name: 'PISM-QC', code: 'PISM-QC', email: 'stage11.pismqc@rfelectro.com', label: '11. PISM-QC' },
  { order: 12, name: 'LEGEND PRINT', code: 'LGD', email: 'stage12.legend@rfelectro.com', label: '12. LEGEND PRINT' },
  { order: 13, name: 'HASL', code: 'HASL', email: 'stage13.hasl@rfelectro.com', label: '13. HASL' },
  { order: 14, name: 'HASL-QC', code: 'HASL-QC', email: 'stage14.haslqc@rfelectro.com', label: '14. HASL-QC' },
  { order: 15, name: 'ROUTING', code: 'RTE', email: 'stage15.routing@rfelectro.com', label: '15. ROUTING' },
  { order: 16, name: 'VG', code: 'VG', email: 'stage16.vg@rfelectro.com', label: '16. VG' },
  { order: 17, name: 'BBT', code: 'BBT', email: 'stage17.bbt@rfelectro.com', label: '17. BBT' },
  { order: 18, name: 'FQC (AI)', code: 'FQC', email: 'stage18.fqc@rfelectro.com', label: '18. FQC (AI)' },
  { order: 19, name: 'PDI-AQL', code: 'PDI', email: 'stage19.pdi@rfelectro.com', label: '19. PDI-AQL' },
  { order: 20, name: 'PACKING', code: 'PKG', email: 'stage20.packing@rfelectro.com', label: '20. PACKING' },
];

import { getApiBaseUrl } from '@/lib/utils';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeRole, setActiveRole] = useState<string | null>(null);
  const [activeStage, setActiveStage] = useState<string | null>(null);
  const [loginTab, setLoginTab] = useState<'MANAGEMENT' | 'STAGES'>('MANAGEMENT');
  const [stageSearch, setStageSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDemoClick = (role: string, roleEmail: string, stageName?: string) => {
    setEmail(roleEmail);
    setPassword('RF-secure-2026!');
    setActiveRole(role);
    setActiveStage(stageName || null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.accessToken) {
          localStorage.setItem('token', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken || '');
        }
        localStorage.setItem('isAuthenticated', 'true');
        const roleName = data.user?.role?.name || data.user?.role || activeRole || 'Super Admin';
        localStorage.setItem('userRole', roleName);
        localStorage.setItem('userEmail', data.user?.email || email || 'admin@rfelectro.com');
        if (data.user?.assignedStage?.name) {
          localStorage.setItem('assignedStage', data.user.assignedStage.name);
        } else if (activeStage) {
          localStorage.setItem('assignedStage', activeStage);
        } else {
          localStorage.removeItem('assignedStage');
        }
        if (data.user?.assignedStage?.id) {
          localStorage.setItem('assignedStageId', data.user.assignedStage.id);
        }
        router.push('/dashboard');
        return;
      }
    } catch (err) {
      console.warn('Backend login request error:', err);
    }

    // Demo fallback for local development / test logins
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('userRole', activeRole || 'Super Admin');
    localStorage.setItem('userEmail', email || 'admin@rfelectro.com');
    if (activeStage) {
      localStorage.setItem('assignedStage', activeStage);
    } else {
      localStorage.removeItem('assignedStage');
    }
    router.push('/dashboard');
  };

  const filteredStages = STAGE_OPERATOR_CREDENTIALS.filter((s) =>
    s.name.toLowerCase().includes(stageSearch.toLowerCase()) ||
    s.code.toLowerCase().includes(stageSearch.toLowerCase()) ||
    s.label.toLowerCase().includes(stageSearch.toLowerCase()) ||
    s.email.toLowerCase().includes(stageSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
      {/* Left side - Branding / Visuals */}
      <div className="hidden md:flex flex-col justify-between w-1/2 bg-[#0B1120] p-12 text-white relative overflow-hidden">
        {/* Video Background */}
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover z-0"
        >
          <source src="/Video/inko_add_karke_banavo_kuch_ach.mp4" type="video/mp4" />
        </video>
        
        {/* Dark/Gradient Overlay for text readability */}
        <div className="absolute inset-0 bg-[#0B1120]/60 z-0" />
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/30 to-transparent z-0" />

        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3 mb-16">
            <Image src="/Assets/logo-1.png" alt="RF Electrotech" width={220} height={60} className="object-contain opacity-100" />
          </div>
          
          <div className="space-y-6 max-w-lg animate-in slide-in-from-left-8 duration-700 fade-in zoom-in-95">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold tracking-wide uppercase">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              ERP System Active • 20 Stages Connected
            </div>
            <h2 className="text-5xl font-extrabold leading-[1.15] tracking-tight">
              Traceability & Control <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">at Every Stage.</span>
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed">
              Dedicated login access for each manufacturing stage. Real-time shop-floor tracking with isolated stage views.
            </p>
          </div>
        </div>
        
        <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-6">
          <div className="text-sm text-slate-500 font-medium">
            &copy; {new Date().getFullYear()} RF Electrotech. All rights reserved.
          </div>
          <div className="flex gap-4 text-sm text-slate-500 font-medium">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative bg-white overflow-y-auto">
        <div className="absolute top-4 right-4 sm:top-6 sm:right-8 z-10">
          <a href="/" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all border border-slate-200/80 shadow-xs">
            <span>Website</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
          </a>
        </div>

        <div className="w-full max-w-md space-y-6 animate-in fade-in zoom-in-95 duration-500 my-auto py-6">
          
          {/* Mobile Header (Hidden on Desktop) */}
          <div className="md:hidden flex flex-col items-center gap-3 mb-4">
            <Image src="/logo-removebg-preview.png" alt="RF Electrotech" width={200} height={55} className="object-contain filter drop-shadow-xs" />
          </div>

          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Welcome back</h2>
            <p className="text-slate-500 text-sm">Enter your credentials or select your stage login</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 pt-2">
            <div className="space-y-4">
              <div className="group">
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider group-focus-within:text-blue-600 transition-colors">Email or Stage ID</label>
                <div className="relative">
                  <Mail className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@rfelectrotech.com"
                    className="w-full bg-slate-50/50 border-2 border-slate-200 rounded-2xl pl-12 pr-4 py-3 text-slate-900 font-medium placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all text-sm"
                  />
                </div>
              </div>

              <div className="group">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider group-focus-within:text-blue-600 transition-colors">Password</label>
                  <a href="#" className="text-[12px] text-blue-600 hover:text-blue-800 font-semibold transition-colors">Forgot password?</a>
                </div>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50/50 border-2 border-slate-200 rounded-2xl pl-12 pr-4 py-3 text-slate-900 font-medium placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all text-sm"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="group relative w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-[0_8px_20px_rgba(37,99,235,0.2)] hover:shadow-[0_12px_25px_rgba(37,99,235,0.3)] active:scale-[0.98] overflow-hidden cursor-pointer"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin relative z-10" />
              ) : (
                <span className="relative z-10 flex items-center gap-2 text-sm">
                  Sign In to Dashboard <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </button>
          </form>

          {/* Quick Access Credentials Section */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            {/* Tab Selector */}
            <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
              <button
                type="button"
                onClick={() => setLoginTab('MANAGEMENT')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  loginTab === 'MANAGEMENT'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                👑 Admin & Management
              </button>
              <button
                type="button"
                onClick={() => setLoginTab('STAGES')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  loginTab === 'STAGES'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>⚙️ 20 Stage Logins</span>
                <span className="px-1.5 py-0.2 bg-amber-400 text-slate-950 rounded-full text-[10px] font-black">20</span>
              </button>
            </div>

            {/* MANAGEMENT TAB */}
            {loginTab === 'MANAGEMENT' && (
              <div className="space-y-2 animate-in fade-in duration-200">
                {DEMO_CREDENTIALS.map((cred) => {
                  const Icon = cred.icon;
                  const isSelected = activeRole === cred.role && !activeStage;
                  
                  return (
                    <button
                      key={cred.role}
                      type="button"
                      onClick={() => handleDemoClick(cred.role, cred.email)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl border bg-white text-left transition-all hover:shadow-xs cursor-pointer ${
                        isSelected 
                          ? 'border-blue-500 ring-1 ring-blue-500 shadow-xs bg-blue-50/40' 
                          : 'border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${cred.color} ${cred.borderColor} shrink-0`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-900">{cred.role}</div>
                          <div className="text-[11px] text-slate-500">{cred.email}</div>
                        </div>
                      </div>
                      <div className={`text-[11px] font-semibold ${isSelected ? 'text-blue-600' : 'text-slate-400'}`}>
                        {isSelected ? (
                          <span className="flex items-center gap-1">
                            <Check className="w-3.5 h-3.5 text-blue-600" /> Selected
                          </span>
                        ) : (
                          'Auto-fill'
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* STAGES TAB (ALL 20 PROCESS STAGES) */}
            {loginTab === 'STAGES' && (
              <div className="space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center justify-between bg-blue-50 text-blue-800 px-3 py-1.5 rounded-xl border border-blue-100 text-xs">
                  <span className="font-bold">Select Stage ID (Shows ONLY this stage's jobs):</span>
                  <span className="text-[10px] font-mono text-blue-600 font-bold">20 Stages Ready</span>
                </div>

                <input
                  type="text"
                  value={stageSearch}
                  onChange={(e) => setStageSearch(e.target.value)}
                  placeholder="Filter stage (e.g. Drilling, PIT, HASL, AOI)..."
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                />

                <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                  {filteredStages.map((stg) => {
                    const isSelected = activeStage === stg.label || activeStage === stg.name || email === stg.email;
                    const isQc = stg.name.includes('QC') || stg.name.includes('AOI') || stg.name.includes('FQC') || stg.name.includes('PDI');

                    return (
                      <button
                        key={stg.order}
                        type="button"
                        onClick={() => handleDemoClick(`Stage-${String(stg.order).padStart(2, '0')} Operator`, stg.email, stg.label)}
                        className={`w-full flex items-center justify-between p-2 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50/80 ring-1 ring-blue-500 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono font-black text-[10px] shrink-0 border ${
                            isQc
                              ? 'bg-purple-100 text-purple-700 border-purple-200'
                              : 'bg-blue-100 text-blue-700 border-blue-200'
                          }`}>
                            {String(stg.order).padStart(2, '0')}
                          </span>
                          <div className="truncate">
                            <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5 truncate">
                              <span>{stg.name}</span>
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-bold">{stg.code}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono truncate">{stg.email}</div>
                          </div>
                        </div>

                        <div className="shrink-0 text-[11px] font-bold">
                          {isSelected ? (
                            <span className="text-blue-600 flex items-center gap-1">
                              <Check className="w-3.5 h-3.5 text-blue-600" /> Selected
                            </span>
                          ) : (
                            <span className="text-slate-400 hover:text-blue-600">Auto-fill</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}
