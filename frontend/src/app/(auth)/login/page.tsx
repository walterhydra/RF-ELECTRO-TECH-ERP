'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Mail, Lock, ArrowRight, Shield, Layers, CheckCircle2, Truck, Info, Check } from 'lucide-react';

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

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeRole, setActiveRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDemoClick = (role: string, roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('RF-secure-2026!');
    setActiveRole(role);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate backend auth delay
    setTimeout(() => {
      // In a real app, store JWT and user context
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userRole', activeRole || 'Super Admin');
      localStorage.setItem('userEmail', email || 'admin@rfelectro.com');
      router.push('/dashboard');
    }, 800);
  };

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
              ERP System Active
            </div>
            <h2 className="text-5xl font-extrabold leading-[1.15] tracking-tight">
              Traceability & Control <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">at Every Stage.</span>
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed">
              The unified operating system for real-time PCB production tracking, quality control, and shop-floor management.
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
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative bg-white">
        <div className="absolute top-0 right-0 p-8">
          <a href="/" className="text-sm font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-2 transition-colors">
            Back to Website <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in-95 duration-500">
          
          {/* Mobile Header (Hidden on Desktop) */}
          <div className="md:hidden flex flex-col items-center gap-3 mb-10">
            <div className="p-4 bg-slate-900 rounded-2xl">
              <Image src="/Assets/logo-1.png" alt="RF Electrotech" width={160} height={45} className="object-contain" />
            </div>
          </div>

          <div className="space-y-3 text-center md:text-left">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Welcome back</h2>
            <p className="text-slate-500 text-lg">Enter your credentials to access the portal</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6 pt-4">
            <div className="space-y-5">
              <div className="group">
                <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wider group-focus-within:text-blue-600 transition-colors">Email or Phone</label>
                <div className="relative">
                  <Mail className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@rfelectrotech.com"
                    className="w-full bg-slate-50/50 border-2 border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 text-slate-900 font-medium placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all"
                  />
                </div>
              </div>

              <div className="group">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider group-focus-within:text-blue-600 transition-colors">Password</label>
                  <a href="#" className="text-[13px] text-blue-600 hover:text-blue-800 font-semibold transition-colors">Forgot password?</a>
                </div>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50/50 border-2 border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 text-slate-900 font-medium placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="group relative w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-[0_8px_20px_rgba(37,99,235,0.2)] hover:shadow-[0_12px_25px_rgba(37,99,235,0.3)] active:scale-[0.98] overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin relative z-10" />
              ) : (
                <span className="relative z-10 flex items-center gap-2">
                  Sign In to Dashboard <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </button>
          </form>

          {/* Demo Credentials Section */}
          <div className="pt-6 border-t border-slate-200">
            <div className="flex items-center gap-2 mb-4 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg border border-blue-100">
              <Info className="w-4 h-4 shrink-0" />
              <span className="text-xs font-semibold">Demo Credentials (Click to auto-fill)</span>
            </div>
            
            <div className="space-y-2.5">
              {DEMO_CREDENTIALS.map((cred) => {
                const Icon = cred.icon;
                const isSelected = activeRole === cred.role;
                
                return (
                  <button
                    key={cred.role}
                    type="button"
                    onClick={() => handleDemoClick(cred.role, cred.email)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border bg-white text-left transition-all hover:shadow-md ${
                      isSelected 
                        ? 'border-blue-500 ring-1 ring-blue-500 shadow-sm' 
                        : 'border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${cred.color} ${cred.borderColor}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-900">{cred.role}</div>
                        <div className="text-xs text-slate-500">{cred.email}</div>
                      </div>
                    </div>
                    <div className={`text-xs font-semibold ${isSelected ? 'text-blue-600' : 'text-slate-400'}`}>
                      {isSelected ? (
                        <span className="flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Selected
                        </span>
                      ) : (
                        'Click to use'
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
