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
  ArrowRight,
  X
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const [userRole, setUserRole] = React.useState('Super Admin');
  const [userEmail, setUserEmail] = React.useState('admin@rfelectro.com');

  const [isMobileOpen, setIsMobileOpen] = React.useState(false);
  const [isMobileScreen, setIsMobileScreen] = React.useState(false);

  const [assignedStage, setAssignedStage] = React.useState<string | null>(null);

  React.useEffect(() => {
    const role = localStorage.getItem('userRole');
    const email = localStorage.getItem('userEmail');
    const stage = localStorage.getItem('assignedStage');
    if (role) setUserRole(role);
    if (email) setUserEmail(email);
    if (stage) setAssignedStage(stage);

    const handleResize = () => {
      setIsMobileScreen(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const handleToggle = () => setIsMobileOpen(prev => !prev);
    window.addEventListener('toggle-mobile-sidebar', handleToggle);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('toggle-mobile-sidebar', handleToggle);
    };
  }, []);

  // Close mobile sidebar on route change
  React.useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);
  
  const allNavItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: assignedStage ? `Job Cards (${assignedStage.replace(/^\d+\.\s*/, '')})` : 'Job Cards & Split', href: '/job-cards', icon: Layers, roles: ['Super Admin', 'Production Manager', 'Stage Operator', 'PROCESS_OPERATOR', 'NORMAL', 'Quality Inspector', 'QC_OFFICER'] },
    { label: 'Job Movement & Update', href: '/job-cards/movement', icon: Activity, roles: ['Super Admin', 'Production Manager', 'Stage Operator', 'PROCESS_OPERATOR', 'NORMAL', 'Quality Inspector'] },
    { label: 'Floor Monitor', href: '/floor', icon: Activity, roles: ['Super Admin', 'Production Manager', 'Quality Inspector', 'Stage Operator', 'PROCESS_OPERATOR', 'NORMAL'] },
    { label: 'Customer Master', href: '/customers', icon: Building2, roles: ['Super Admin', 'Production Manager'] },
    { label: 'Product Master (Specs)', href: '/products', icon: Cpu, roles: ['Super Admin', 'Production Manager'] },
    { label: 'Process Master', href: '/processes', icon: Settings2, roles: ['Super Admin', 'Production Manager'] },
    { label: 'Customer POs', href: '/pos', icon: ShoppingCart, roles: ['Super Admin', 'Production Manager', 'Dispatch Manager'] },
    { label: 'Production Reports', href: '/reports', icon: BarChart3, roles: ['Super Admin', 'Production Manager'] },
    { label: 'Floor PWA Scanner', href: '/scan', icon: QrCode, roles: ['Super Admin', 'Quality Inspector', 'Production Manager', 'Stage Operator', 'PROCESS_OPERATOR', 'NORMAL'] },
    { label: 'Rejection & Rework', href: '/rejections', icon: Activity, roles: ['Super Admin', 'Quality Inspector', 'Production Manager'] },
    { label: 'Dispatch & Delivery', href: '/dispatches', icon: Truck, roles: ['Super Admin', 'Dispatch Manager'] },
    { label: 'User & Stage Linkage', href: '/users', icon: Users, roles: ['Super Admin'] },
  ];

  const isSuperAdmin = userRole === 'Super Admin' || userRole === 'SUPER_ADMIN';
  const isOperator = userRole.toLowerCase().includes('operator') || Boolean(assignedStage) || userRole === 'NORMAL' || userRole === 'PROCESS_OPERATOR';

  const navItems = allNavItems.filter(item => {
    if (!item.roles || isSuperAdmin) return true;
    if (isOperator && (item.roles.includes('Stage Operator') || item.roles.includes('PROCESS_OPERATOR') || item.roles.includes('NORMAL'))) {
      return true;
    }
    const normalizedRole = userRole.toUpperCase().replace(/\s+/g, '_');
    return item.roles.some(r => r === userRole || r.toUpperCase().replace(/\s+/g, '_') === normalizedRole);
  });

  const displayedNavItems = navItems;

  const initials = userRole.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Component: Desktop (static md:flex) + Mobile Drawer (fixed z-50 md:hidden) */}
      <aside 
        className={`bg-[#0f172a] flex-col text-slate-400 h-full shrink-0 ${
          isMobileOpen 
            ? 'fixed inset-y-0 left-0 z-50 w-72 flex shadow-2xl animate-in slide-in-from-left duration-200' 
            : 'hidden md:flex w-64'
        }`}
        data-purpose="main-sidebar"
      >
        <div className="p-5 flex items-center justify-between border-b border-slate-800/80">
          <Image src="/Assets/logo-1.png" alt="RF Electrotech Logo" width={160} height={40} className="object-contain opacity-90" />
          <button
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {displayedNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname?.startsWith(item.href);

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
    </>
  );
};
