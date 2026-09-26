import React from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen md:h-screen bg-slate-100 text-slate-900 md:overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 md:overflow-hidden">
        <Header />
        <main className="flex-1 md:overflow-y-auto bg-slate-100">
          {children}
        </main>
      </div>
    </div>
  );
}
