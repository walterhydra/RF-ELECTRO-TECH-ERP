'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Mail, Lock, ArrowRight, Eye, EyeOff, ShieldCheck, ArrowLeft, RefreshCw, AlertCircle, KeyRound } from 'lucide-react';
import { getApiBaseUrl } from '@/lib/utils';

export default function LoginPage() {
  const router = useRouter();
  
  // Step State: 'CREDENTIALS' -> 'OTP'
  const [step, setStep] = useState<'CREDENTIALS' | 'OTP'>('CREDENTIALS');
  
  // Credentials
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // OTP State
  const [tempToken, setTempToken] = useState('');
  const [otp, setOtp] = useState('');
  const [targetEmail, setTargetEmail] = useState('milanpandavadra84@gmail.com');
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  
  // UI & Loading States
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  // ── Device Persistence Check ──
  // If already authenticated on this device, skip login and redirect directly!
  useEffect(() => {
    try {
      const isAuth = localStorage.getItem('isAuthenticated') === 'true';
      const token = localStorage.getItem('token');
      const hasCookie = typeof document !== 'undefined' && document.cookie.includes('rf_session_token');
      
      if (isAuth && (token || hasCookie)) {
        const isMobileScreen = typeof window !== 'undefined' && window.innerWidth < 768;
        router.replace(isMobileScreen ? '/job-cards' : '/dashboard');
      }
    } catch {
      // Ignore during initial SSR
    }
  }, [router]);

  // Cooldown countdown timer for Resend OTP button
  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = setInterval(() => {
      setOtpCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCooldown]);

  // ── Step 1: Request OTP with Credentials ──
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setErrorMessage('');
    setInfoMessage('');

    try {
      const res = await fetch(`${getApiBaseUrl()}/auth/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.message || 'Invalid username or password. Please try again.');
        setLoading(false);
        return;
      }

      if (data.otpRequired) {
        setTempToken(data.tempToken);
        setTargetEmail(data.targetEmail || 'milanpandavadra84@gmail.com');
        setStep('OTP');
        setOtpCooldown(30);
        setInfoMessage(`Security OTP code has been sent to ${data.targetEmail || 'milanpandavadra84@gmail.com'}`);
      } else if (data.accessToken) {
        // Fallback for direct token logins
        finalizeSuccessfulLogin(data);
        return;
      }
    } catch (err) {
      console.warn('Backend login request error:', err);
      setErrorMessage('Could not connect to authentication server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Verify OTP Code ──
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.trim().length < 4) {
      setErrorMessage('Please enter the full 6-digit OTP code.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch(`${getApiBaseUrl()}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken, otp: otp.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.message || `Invalid OTP code. Please enter the code sent to ${targetEmail || 'milanpandavadra84@gmail.com'}`);
        setLoading(false);
        return;
      }

      finalizeSuccessfulLogin(data);
    } catch (err) {
      console.warn('Verify OTP error:', err);
      setErrorMessage('Verification failed. Please check network connection and try again.');
      setLoading(false);
    }
  };

  // ── Resend Fresh OTP ──
  const handleResendOtp = async () => {
    if (otpCooldown > 0 || resending || !tempToken) return;
    setResending(true);
    setErrorMessage('');
    try {
      const res = await fetch(`${getApiBaseUrl()}/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken }),
      });
      const data = await res.json();
      if (res.ok) {
        setOtpCooldown(30);
        setInfoMessage(`Fresh OTP code has been re-sent to ${targetEmail}`);
      } else {
        setErrorMessage(data.message || 'Failed to resend code');
      }
    } catch {
      setErrorMessage('Could not resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  // ── Finalize Login & Set Persistent Device Session & Cookies ──
  const finalizeSuccessfulLogin = (data: any) => {
    if (data.accessToken) {
      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken || '');

      // Set persistent 90-day cookie for continuous session
      document.cookie = `rf_session_token=${data.accessToken}; path=/; max-age=7776000; SameSite=Lax`;
    }

    localStorage.setItem('isAuthenticated', 'true');

    const rawRole = data.user?.role?.name || data.user?.role || 'Super Admin';
    const roleMap: Record<string, string> = {
      SUPER_ADMIN: 'Super Admin',
      PRODUCTION_PLANNER: 'Production Manager',
      QC_OFFICER: 'Quality Inspector',
      STORE_DISPATCH: 'Dispatch Manager',
      PROCESS_OPERATOR: 'Stage Operator',
    };
    const roleName = roleMap[rawRole] || rawRole;
    localStorage.setItem('userRole', roleName);
    localStorage.setItem('userEmail', data.user?.email || email || 'admin@rfelectro.com');
    document.cookie = `rf_user_role=${encodeURIComponent(roleName)}; path=/; max-age=7776000; SameSite=Lax`;

    if (data.user?.assignedStage?.name) {
      localStorage.setItem('assignedStage', data.user.assignedStage.name);
    } else {
      localStorage.removeItem('assignedStage');
    }
    if (data.user?.assignedStage?.id) {
      localStorage.setItem('assignedStageId', data.user.assignedStage.id);
    }

    const isMobileScreen = typeof window !== 'undefined' && window.innerWidth < 768;
    if (isMobileScreen) {
      router.push('/job-cards');
    } else {
      router.push('/dashboard');
    }
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold tracking-wide uppercase font-mono">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              2FA Authentication Enabled • Secure ERP
            </div>
            <h2 className="text-5xl font-extrabold leading-[1.15] tracking-tight">
              Traceability & Control <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">at Every Stage.</span>
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed">
              Two-step verification with instant security code delivery to <strong>milanpandavadra84@gmail.com</strong> for high-security manufacturing audit.
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

      {/* Right side - Login / OTP Form */}
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

          {/* ── STEP 1: CREDENTIALS INPUT ── */}
          {step === 'CREDENTIALS' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="space-y-2 text-center md:text-left">
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Welcome back</h2>
                <p className="text-slate-500 text-sm">Enter your credentials to receive your security login code</p>
              </div>

              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleRequestOtp} className="space-y-4 pt-1">
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
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-50/50 border-2 border-slate-200 rounded-2xl pl-12 pr-12 py-3 text-slate-900 font-medium placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1 transition-colors cursor-pointer"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>A 6-digit OTP will be dispatched to <strong>milanpandavadra84@gmail.com</strong> upon clicking continue.</span>
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
                    <span className="relative z-10 flex items-center gap-2 text-sm font-semibold">
                      Send OTP & Continue <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* ── STEP 2: 2-FACTOR OTP CODE VERIFICATION ── */}
          {step === 'OTP' && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
              <button
                type="button"
                onClick={() => {
                  setStep('CREDENTIALS');
                  setOtp('');
                  setErrorMessage('');
                }}
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Login</span>
              </button>

              <div className="text-center space-y-2">
                <div className="w-14 h-14 bg-blue-50 border border-blue-200 rounded-2xl mx-auto flex items-center justify-center shadow-xs">
                  <KeyRound className="w-7 h-7 text-blue-600" />
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Two-Factor Authentication</h2>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Enter the 6-digit security code sent to <strong className="text-slate-800 font-mono font-bold">{targetEmail || 'milanpandavadra84@gmail.com'}</strong> for account <span className="text-slate-700 font-mono">{email}</span>.
                </p>
              </div>

              {infoMessage && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium text-center">
                  {infoMessage}
                </div>
              )}

              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center mb-2">
                    Enter 6-Digit Security Code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    autoFocus
                    maxLength={6}
                    value={otp}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setOtp(val);
                    }}
                    placeholder="••••••"
                    className="w-full text-center text-3xl font-extrabold font-mono tracking-[0.5em] py-3.5 bg-slate-50/70 border-2 border-slate-200 focus:border-blue-600 focus:bg-white rounded-2xl text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-blue-600/10 transition-all"
                  />
                  <span className="block text-[10px] text-slate-400 text-center mt-1.5 font-mono">
                    Code expires in 10 minutes
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.trim().length < 4}
                  className="group relative w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-[0_8px_20px_rgba(37,99,235,0.2)] hover:shadow-[0_12px_25px_rgba(37,99,235,0.3)] active:scale-[0.98] cursor-pointer"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      Verify Code & Access ERP <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  )}
                </button>
              </form>

              {/* Resend Code Action */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-400">Didn't receive the email?</span>
                <button
                  type="button"
                  disabled={otpCooldown > 0 || resending}
                  onClick={handleResendOtp}
                  className="font-semibold text-blue-600 hover:text-blue-800 disabled:text-slate-400 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {resending && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{otpCooldown > 0 ? `Resend Code in ${otpCooldown}s` : 'Resend Code'}</span>
                </button>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 text-center font-mono">
                🔒 Once verified, this device remains securely authenticated until you log out.
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

