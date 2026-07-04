import React from 'react';
import Link from 'next/link';
import { LayoutDashboard, Package, FileText, Activity, Truck, LogOut } from 'lucide-react';

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navItems = [
    { name: 'Dashboard', href: '/portal/dashboard', icon: LayoutDashboard },
    { name: 'My Products', href: '/portal/products', icon: Package },
    { name: 'My Orders', href: '/portal/orders', icon: FileText },
    { name: 'Job Cards & Progress', href: '/portal/job-cards', icon: Activity },
    { name: 'Dispatches & Delivery', href: '/portal/dispatches', icon: Truck },
  ];

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 flex flex-col border-r border-slate-800">
        <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-3">
          <div className="w-8 h-8 rounded bg-blue-500 flex items-center justify-center font-bold text-slate-950 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
            CP
          </div>
          <div>
            <h1 className="font-bold text-sm text-white">CUSTOMER PORTAL</h1>
          </div>
        </div>
        
        <div className="p-4 flex flex-col gap-2 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="text-[10px] text-blue-400 font-mono">SCOPED ORDER TRACKING</div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-mono text-slate-300">Welcome, Valued Customer</span>
            <Link href="/login" className="p-2 text-slate-400 hover:text-red-400 transition-colors">
              <LogOut className="w-4 h-4" />
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-950">
          <div className="max-w-6xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
