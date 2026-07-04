'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Cpu, 
  ShoppingCart, 
  Layers, 
  Activity, 
  BarChart3, 
  Users, 
  QrCode,
  Building2,
  Settings2,
  Truck,
  Lock,
  ArrowRight
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const [userRole, setUserRole] = React.useState('Super Admin');
  const [userEmail, setUserEmail] = React.useState('admin@rfelectro.com');
  const [showRestrictedModal, setShowRestrictedModal] = React.useState(false);

  React.useEffect(() => {
    const role = localStorage.getItem('userRole');
    const email = localStorage.getItem('userEmail');
    if (role) setUserRole(role);
    if (email) setUserEmail(email);
  }, []);
  
  const allNavItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Customer Master', href: '/customers', icon: Building2, roles: ['Super Admin', 'Production Manager'] },
    { label: 'Product Master (Specs)', href: '/products', icon: Cpu, roles: ['Super Admin', 'Production Manager'] },
    { label: 'Process Master', href: '/processes', icon: Settings2, roles: ['Super Admin', 'Production Manager'] },
    { label: 'Customer POs', href: '/pos', icon: ShoppingCart, roles: ['Super Admin', 'Production Manager', 'Dispatch Manager'] },
    { label: 'Job Cards & Split', href: '/job-cards', icon: Layers, roles: ['Super Admin', 'Production Manager'] },
    { label: 'Floor Monitor', href: '/floor', icon: Activity, roles: ['Super Admin', 'Production Manager', 'Quality Inspector'] },
    { label: 'Production Reports', href: '/reports', icon: BarChart3, roles: ['Super Admin', 'Production Manager'] },
    { label: 'Floor PWA Scanner', href: '/scan', icon: QrCode, roles: ['Super Admin', 'Quality Inspector', 'Production Manager'] },
    { label: 'Rejection & Rework', href: '/rejections', icon: Activity, roles: ['Super Admin', 'Quality Inspector', 'Production Manager'] },
    { label: 'Dispatch & Delivery', href: '/dispatches', icon: Truck, roles: ['Super Admin', 'Dispatch Manager'] },
    { label: 'User & Stage Linkage', href: '/users', icon: Users, roles: ['Super Admin'] },
  ];

  const navItems = allNavItems.filter(item => !item.roles || item.roles.includes(userRole));

  const initials = userRole.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <>
      <aside className="w-64 bg-[#0f172a] flex flex-col text-slate-400 h-full shrink-0" data-purpose="main-sidebar">
        <div className="p-6 flex items-center space-x-3">
          <Image src="/Assets/logo-1.png" alt="RF Electrotech Logo" width={180} height={45} className="object-contain opacity-90" />
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname?.startsWith(item.href);
            
            if (item.href === '/scan') {
              return (
                <a
                  key={item.href}
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowRestrictedModal(true);
                  }}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600/10 text-blue-500 border-r-4 border-blue-600'
                      : 'hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </a>
              );
            }

            if (isActive) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-blue-600/10 text-blue-500 border-r-4 border-blue-600 transition-colors"
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors"
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-6 border-t border-slate-800 space-y-1">
          <div className="flex items-center space-x-3 px-3 py-2 rounded-lg text-slate-400">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-200 truncate">{userRole}</p>
              <p className="text-[10px] text-emerald-400 font-mono">ONLINE</p>
            </div>
          </div>
        </div>
      </aside>

      {showRestrictedModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full bg-[#0a0a0a] border-y border-white/10 py-16 px-8 md:px-24 flex flex-col md:flex-row items-center justify-center gap-12 shadow-[0_0_100px_rgba(0,0,0,1)] animate-in slide-in-from-bottom-8 zoom-in-95 duration-500 ease-out">
            <div className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-8">
              <div className="w-20 h-20 shrink-0 rounded-full bg-[#1a1a1a] border border-white/5 flex items-center justify-center shadow-inner relative group">
                <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <Lock className="w-6 h-6 text-amber-500 relative z-10" />
              </div>
              <div className="space-y-3 pt-1">
                <h2 className="text-3xl font-black text-white tracking-tight">FEATURE IN PROGRESS</h2>
                <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
                  This module is currently under development and requires exclusive clearance. Please contact our team to verify your identity and unlock this feature.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-8 shrink-0 mt-8 md:mt-0">
              <button 
                onClick={() => setShowRestrictedModal(false)}
                className="text-sm font-bold text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => setShowRestrictedModal(false)}
                className="flex items-center gap-2 px-8 py-3.5 bg-white text-black font-bold rounded-full hover:bg-slate-200 transition-colors shadow-lg hover:shadow-xl hover:-translate-y-0.5 transform duration-200"
              >
                Got it <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
