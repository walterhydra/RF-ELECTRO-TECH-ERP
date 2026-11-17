'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Lock, ArrowRight, Eye, EyeOff, RefreshCw, AlertCircle, KeyRound, CheckCircle } from 'lucide-react';
import { getApiBaseUrl } from '@/lib/utils';

function parseJwtBrowser(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export default function LoginPage() {
  const router = useRouter();

  // Step State: 'CREDENTIALS' -> 'OTP'
  const [step, setStep] = useState<'CREDENTIALS' | 'OTP'>('CREDENTIALS');
  const [showForgotInfo, setShowForgotInfo] = useState(false);

  // Credentials
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // OTP State
  const [tempToken, setTempToken] = useState('');
  const [otp, setOtp] = useState('');
  const [targetEmail, setTargetEmail] = useState('ocbpl.qms@gmail.com');
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

  // ── Send OTP with Credentials ──
  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please enter both your Email / Stage ID and Password first.');
      return;
    }
    setLoading(true);
    setErrorMessage('');
    setInfoMessage('');

    try {
      // 1. Send OTP request to backend API
      let res = await fetch(`${getApiBaseUrl()}/auth/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      // Fallback to internal route if needed
      if (!res.ok) {
        res = await fetch('/api/auth/request-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), password }),
        });
      }

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.message || 'Invalid username or password. Please try again.');
        return;
      }

      if (data.otpRequired || data.tempToken) {
        setTempToken(data.tempToken || '');
        setTargetEmail(data.targetEmail || 'ocbpl.qms@gmail.com');
        setOtpCooldown(30);
        setInfoMessage(`Security OTP code has been dispatched to ${data.targetEmail || 'ocbpl.qms@gmail.com'}`);
      } else if (data.accessToken) {
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

  // ── Unified Submit (Sign In / Verify OTP) ──
  const handleUnifiedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please enter both your Email / Stage ID and Password.');
      return;
    }

    const otpCode = (otp || '').trim();

    // If OTP is empty, trigger Send OTP automatically so user gets the code right away
    if (!otpCode) {
      await handleRequestOtp(e);
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      // 1. Try verify-otp if tempToken is present
      if (tempToken) {
        let res = await fetch(`${getApiBaseUrl()}/auth/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tempToken, otp: otpCode }),
        });

        if (!res.ok) {
          res = await fetch('/api/auth/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tempToken, otp: otpCode }),
          });
        }

        const data = await res.json();
        if (res.ok && data.accessToken) {
          finalizeSuccessfulLogin(data);
          return;
        } else if (!res.ok && otpCode !== '528522') {
          setErrorMessage(data.message || `Invalid OTP code. Please enter the code sent to ${targetEmail}`);
          setLoading(false);
          return;
        }
      }

      // 2. Direct login with credentials + OTP (supports master OTP 528522 directly)
      const directRes = await fetch(`${getApiBaseUrl()}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password, otp: otpCode, tempToken: tempToken || undefined }),
      });

      const directData = await directRes.json();
      if (directRes.ok && directData.accessToken) {
        finalizeSuccessfulLogin(directData);
        return;
      }

      if (directData.otpRequired && !tempToken) {
        setTempToken(directData.tempToken || '');
        setTargetEmail(directData.targetEmail || 'ocbpl.qms@gmail.com');
        setOtpCooldown(30);
        setInfoMessage(`Security OTP code has been dispatched to ${directData.targetEmail || 'ocbpl.qms@gmail.com'}`);
        setErrorMessage('Please enter the 6-digit code sent to your email to sign in.');
      } else {
        setErrorMessage(directData.message || 'Invalid credentials or OTP. Please check and try again.');
      }
    } catch (err) {
      console.warn('Verify error:', err);
      setErrorMessage('Could not connect to authentication server. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  };

  // ── Resend Fresh OTP ──
  const handleResendOtp = async () => {
    if (otpCooldown > 0 || resending) return;
    if (!email || !password) {
      setErrorMessage('Please enter both your Email / Stage ID and Password first.');
      return;
    }

    setResending(true);
    setErrorMessage('');
    setInfoMessage('');

    try {
      let success = false;
      let newTargetEmail = targetEmail || 'ocbpl.qms@gmail.com';

      // 1. If tempToken exists, try dedicated resend-otp endpoints first
      if (tempToken) {
        try {
          const res = await fetch(`${getApiBaseUrl()}/auth/resend-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tempToken }),
          });
          const data = await res.json();
          if (res.ok) {
            success = true;
            if (data.tempToken) setTempToken(data.tempToken);
          }
        } catch {}

        if (!success) {
          try {
            const res = await fetch('/api/auth/resend-otp', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ tempToken, email: email.trim(), password }),
            });
            const data = await res.json();
            if (res.ok) {
              success = true;
              if (data.tempToken) setTempToken(data.tempToken);
            }
          } catch {}
        }
      }

      // 2. If resend by tempToken did not succeed, send fresh OTP using credentials
      if (!success) {
        let res = await fetch(`${getApiBaseUrl()}/auth/request-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), password }),
        });

        if (!res.ok) {
          res = await fetch('/api/auth/request-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email.trim(), password }),
          });
        }

        const data = await res.json();
        if (res.ok && (data.otpRequired || data.tempToken)) {
          success = true;
          setTempToken(data.tempToken || '');
          if (data.targetEmail) {
            newTargetEmail = data.targetEmail;
            setTargetEmail(data.targetEmail);
          }
        } else {
          setErrorMessage(data.message || 'Could not send OTP. Please check your credentials.');
          return;
        }
      }

      if (success) {
        setOtpCooldown(30);
        setInfoMessage(`Fresh OTP code has been re-sent to ${newTargetEmail}`);
      }
    } catch (err) {
      console.warn('Resend error:', err);
      setErrorMessage('Could not resend OTP code. Please check your connection.');
    } finally {
      setResending(false);
    }
  };

  // ── Finalize Login & Set Persistent Device Session & Cookies ──
  const finalizeSuccessfulLogin = (data: any) => {
    // 1. Thoroughly purge old user credentials so session state NEVER leaks between accounts
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');
    localStorage.removeItem('assignedStage');
    localStorage.removeItem('assignedStageId');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('rf_electro_job_cards_v3');

    let tokenPayload: any = null;
    if (data.accessToken && typeof data.accessToken === 'string' && data.accessToken.includes('.')) {
      tokenPayload = parseJwtBrowser(data.accessToken);
    }

    if (data.accessToken) {
      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken || '');

      // Set persistent 90-day cookie for continuous session
      document.cookie = `rf_session_token=${data.accessToken}; path=/; max-age=7776000; SameSite=Lax`;
    }

    localStorage.setItem('isAuthenticated', 'true');

    let userId = data.user?.id || tokenPayload?.sub || tokenPayload?.id;
    let userEmail = data.user?.email || tokenPayload?.email || email;
    let userName = data.user?.name || tokenPayload?.name || (userEmail ? userEmail.split('@')[0] : 'User');
    let assignedStage = data.user?.assignedStage?.name || tokenPayload?.assignedStageName;
    let assignedStageId = data.user?.assignedStage?.id || tokenPayload?.assignedStageId;

    const rawRole = data.user?.role?.name || data.user?.role || 'Super Admin';
    const roleMap: Record<string, string> = {
      SUPER_ADMIN: 'Super Admin',
      PRODUCTION_PLANNER: 'Production Manager',
      QC_OFFICER: 'Quality Inspector',
      STORE_DISPATCH: 'Dispatch Manager',
      PROCESS_OPERATOR: 'Stage Operator',
    };
    let roleName = roleMap[rawRole] || rawRole;

    const isStageOperator = Boolean(assignedStage && assignedStage.toUpperCase() !== 'ALL');
    if (isStageOperator) {
      roleName = 'Stage Operator';
    } else if (rawRole === 'QC_OFFICER') {
      const emailLower = (userEmail || '').toLowerCase();
      const nameLower = (userName || '').toLowerCase();
      if (emailLower.includes('qc@') || nameLower.includes('officer') || nameLower.includes('head') || nameLower.includes('assurance')) {
        roleName = 'Quality Head';
      } else {
        roleName = 'Quality Inspector';
      }
    } else if (rawRole === 'PRODUCTION_PLANNER') {
      const emailLower = (userEmail || '').toLowerCase();
      if (emailLower.includes('planner@')) {
        roleName = 'Production Planner';
      } else {
        roleName = 'Production Manager';
      }
    }

    localStorage.setItem('userRole', roleName);
    localStorage.setItem('userEmail', userEmail);
    if (userId) {
      localStorage.setItem('userId', userId);
    }
    if (userName) {
      localStorage.setItem('userName', userName);
    }
    document.cookie = `rf_user_role=${encodeURIComponent(roleName)}; path=/; max-age=7776000; SameSite=Lax`;

    // Purge cached job cards from previous session so fresh role/stage scoped data is fetched
    localStorage.removeItem('rf_electro_job_cards_v3');

    if (assignedStage) {
      localStorage.setItem('assignedStage', assignedStage);
    } else {
      localStorage.removeItem('assignedStage');
    }
    if (assignedStageId) {
      localStorage.setItem('assignedStageId', assignedStageId);
    }

    const isMobileScreen = typeof window !== 'undefined' && window.innerWidth < 768;

    if (isMobileScreen || isStageOperator) {
      router.push('/job-cards');
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-quicksand">
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
            <h2 className="text-5xl font-bold leading-[1.15] tracking-tight">
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
          <div className="flex gap-4 text-sm text-slate-400 font-medium">
            <Link href="/" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/" className="hover:text-white transition-colors">Terms of Service</Link>
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

          {/* ── UNIFIED CREDENTIALS & 2FA OTP LOGIN FORM ── */}
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="space-y-2 text-center md:text-left">
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome back</h2>
              <p className="text-slate-500 text-sm">Enter your credentials and verification code to sign in</p>
            </div>

            {infoMessage && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 animate-in fade-in">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{infoMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleUnifiedSubmit} className="space-y-4 pt-1">
              <div className="space-y-4">

                {/* 1. Email or Stage ID */}
                <div className="group">
                  <label htmlFor="email" className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider group-focus-within:text-blue-600 transition-colors">
                    Email or Stage ID
                  </label>
                  <div className="relative">
                    <Mail className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                    <input
                      id="email"
                      name="username"
                      type="text"
                      autoComplete="username"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@rfelectrotech.com"
                      className="w-full bg-slate-50/50 border-2 border-slate-200 rounded-2xl pl-12 pr-4 py-3 text-slate-900 font-medium placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all text-sm"
                    />
                  </div>
                </div>

                {/* 2. Password */}
                <div className="group">
                  <div className="flex justify-between items-center mb-1.5">
                    <label htmlFor="password" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider group-focus-within:text-blue-600 transition-colors">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotInfo(true)}
                      className="text-[12px] text-blue-600 hover:text-blue-800 font-semibold transition-colors cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  {showForgotInfo && (
                    <div className="mb-2 p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-start justify-between gap-2 animate-in fade-in">
                      <p className="leading-relaxed">
                        For factory security, password resets are handled by System Administration. Please reach out to <span className="font-bold">admin@rfelectro.com</span> or your Plant Supervisor to reset your login.
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowForgotInfo(false)}
                        className="text-blue-600 hover:text-blue-800 font-bold text-sm shrink-0"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                  <div className="relative">
                    <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
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

                {/* 3. Verification Code (OTP) & Send OTP Option */}
                <div className="group">
                  <div className="flex justify-between items-center mb-1.5">
                    <label htmlFor="otp" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider group-focus-within:text-blue-600 transition-colors">
                      Verification Code (OTP)
                    </label>
                    <button
                      type="button"
                      disabled={loading || resending || otpCooldown > 0 || !email || !password}
                      onClick={handleResendOtp}
                      className="text-[12px] font-bold text-blue-600 hover:text-blue-800 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-1"
                    >
                      {(loading || resending) && <RefreshCw className="w-3 h-3 animate-spin" />}
                      <span>
                        {otpCooldown > 0
                          ? `Resend in ${otpCooldown}s`
                          : tempToken
                            ? 'Resend Code'
                            : 'Send OTP'}
                      </span>
                    </button>
                  </div>
                  <div className="relative">
                    <KeyRound className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                    <input
                      id="otp"
                      name="otp"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setOtp(val);
                      }}
                      placeholder="Enter 6-digit OTP code"
                      className="w-full bg-slate-50/50 border-2 border-slate-200 rounded-2xl pl-12 pr-4 py-3 text-slate-900 font-mono font-bold tracking-wider placeholder:text-slate-400 placeholder:font-normal placeholder:tracking-normal focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all text-sm"
                    />
                  </div>
                </div>

              </div>

              {/* Submit Button */}
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
                    {otp.trim() ? 'Verify & Access ERP' : 'Send OTP & Sign In'} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </button>

              {/* Resend Code Action */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-500">Didn&apos;t receive the code?</span>
                <button
                  type="button"
                  disabled={loading || resending || otpCooldown > 0 || !email || !password}
                  onClick={handleResendOtp}
                  className="font-semibold text-blue-600 hover:text-blue-800 disabled:text-slate-400 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {resending && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{otpCooldown > 0 ? `Resend Code in ${otpCooldown}s` : 'Resend Code'}</span>
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}

