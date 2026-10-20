'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Search, 
  ArrowLeft, 
  Cpu, 
  FileText, 
  Building2, 
  Layers, 
  ChevronRight, 
  Loader2, 
  ExternalLink,
  Filter,
  CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import { fetchApi } from '@/lib/utils';

export default function SearchResultsPage() {
  const searchParams = useSearchParams();
  const query = (searchParams.get('q') || '').trim();
  
  const [activeTab, setActiveTab] = useState<'ALL' | 'JOB_CARDS' | 'POS' | 'PRODUCTS' | 'CUSTOMERS'>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  const [jobCards, setJobCards] = useState<any[]>([]);
  const [pos, setPos] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);

    Promise.all([
      fetchApi('/job-cards').then((r) => (r.ok ? r.json() : [])).catch(() => []),
      fetchApi('/customer-pos').then((r) => (r.ok ? r.json() : [])).catch(() => []),
      fetchApi('/products').then((r) => (r.ok ? r.json() : [])).catch(() => []),
      fetchApi('/customers').then((r) => (r.ok ? r.json() : [])).catch(() => []),
    ])
      .then(([jcList, poList, prodList, custList]) => {
        if (isCancelled) return;
        setJobCards(Array.isArray(jcList) ? jcList : []);
        setPos(Array.isArray(poList) ? poList : []);
        setProducts(Array.isArray(prodList) ? prodList : []);
        setCustomers(Array.isArray(custList) ? custList : []);
        setIsLoading(false);
      })
      .catch((err) => {
        if (!isCancelled) {
          console.error('Failed to load search data:', err);
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  const lowerQ = query.toLowerCase();

  const matchingJobCards = query
    ? jobCards.filter((j: any) =>
        (j.jobCardNo && j.jobCardNo.toLowerCase().includes(lowerQ)) ||
        (j.customerPartNo && j.customerPartNo.toLowerCase().includes(lowerQ)) ||
        (j.rfePartCode && j.rfePartCode.toLowerCase().includes(lowerQ)) ||
        (j.customerCode && j.customerCode.toLowerCase().includes(lowerQ)) ||
        (j.status && j.status.toLowerCase().includes(lowerQ)) ||
        (j.product?.name && j.product.name.toLowerCase().includes(lowerQ)) ||
        (j.product?.code && j.product.code.toLowerCase().includes(lowerQ))
      )
    : [];

  const matchingPos = query
    ? pos.filter((p: any) =>
        (p.poNo && p.poNo.toLowerCase().includes(lowerQ)) ||
        (p.customer?.companyName && p.customer.companyName.toLowerCase().includes(lowerQ)) ||
        (p.customer?.code && p.customer.code.toLowerCase().includes(lowerQ)) ||
        (p.product?.code && p.product.code.toLowerCase().includes(lowerQ)) ||
        (p.product?.name && p.product.name.toLowerCase().includes(lowerQ))
      )
    : [];

  const matchingProducts = query
    ? products.filter((p: any) =>
        (p.code && p.code.toLowerCase().includes(lowerQ)) ||
        (p.name && p.name.toLowerCase().includes(lowerQ)) ||
        (p.specCardNo && p.specCardNo.toLowerCase().includes(lowerQ))
      )
    : [];

  const matchingCustomers = query
    ? customers.filter((c: any) =>
        (c.companyName && c.companyName.toLowerCase().includes(lowerQ)) ||
        (c.code && c.code.toLowerCase().includes(lowerQ)) ||
        (c.contactPerson && c.contactPerson.toLowerCase().includes(lowerQ)) ||
        (c.email && c.email.toLowerCase().includes(lowerQ))
      )
    : [];

  const totalResults =
    matchingJobCards.length +
    matchingPos.length +
    matchingProducts.length +
    matchingCustomers.length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto min-h-screen font-sans bg-slate-50 text-slate-900">
      <Link
        href="/dashboard"
        className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1.5" />
        Back to Dashboard
      </Link>

      <div className="mb-6 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Search className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-black text-slate-900">Global Search</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Live PostgreSQL Database Query Results for:{' '}
            <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              "{query}"
            </span>
          </p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-black font-mono text-slate-900">{totalResults}</span>
          <span className="text-xs text-slate-500 block uppercase font-mono tracking-wider">
            Total Matches
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 mb-6">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'ALL'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          All Categories ({totalResults})
        </button>
        <button
          onClick={() => setActiveTab('JOB_CARDS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'JOB_CARDS'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          Job Cards ({matchingJobCards.length})
        </button>
        <button
          onClick={() => setActiveTab('POS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'POS'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Purchase Orders ({matchingPos.length})
        </button>
        <button
          onClick={() => setActiveTab('PRODUCTS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'PRODUCTS'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Products ({matchingProducts.length})
        </button>
        <button
          onClick={() => setActiveTab('CUSTOMERS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'CUSTOMERS'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          Customers ({matchingCustomers.length})
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-3" />
          <h2 className="text-base font-bold text-slate-800">Querying live PostgreSQL database...</h2>
          <p className="text-slate-500 text-xs mt-1 font-mono">Searching records for "{query}"</p>
        </div>
      ) : totalResults === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
            <Search className="w-8 h-8" />
          </div>
          <h2 className="text-base font-bold text-slate-800">No matching records found</h2>
          <p className="text-slate-500 text-xs max-w-sm mt-1">
            No live Job Cards, Purchase Orders, Products, or Customers matched your query "{query}".
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Job Cards Section */}
          {(activeTab === 'ALL' || activeTab === 'JOB_CARDS') && matchingJobCards.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-blue-600" />
                  Job Cards ({matchingJobCards.length})
                </h2>
                <Link href="/job-cards" className="text-xs font-semibold text-blue-600 hover:underline">
                  View All in Table ↗
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {matchingJobCards.map((j: any) => (
                  <Link
                    key={j.id}
                    href={`/job-cards/${j.id}`}
                    className="bg-white border border-slate-200 hover:border-blue-400 rounded-xl p-4 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono font-bold text-sm text-blue-600 group-hover:underline">
                          {j.jobCardNo}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            j.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {j.status || 'WIP'}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-800">
                        {j.product?.name || j.customerPartNo || 'PCB Product'}
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        Code: {j.product?.code || j.rfePartCode || '—'}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Customer: <span className="font-medium text-slate-700">{j.customerPO?.customer?.companyName || j.customerCode || '—'}</span>
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span>Total Qty: <strong className="text-slate-800 font-mono">{j.totalQty || j.custPnlQty || 0}</strong></span>
                      <span className="text-blue-600 font-medium group-hover:translate-x-0.5 transition-transform flex items-center">
                        Details <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Customer POs Section */}
          {(activeTab === 'ALL' || activeTab === 'POS') && matchingPos.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  Customer Purchase Orders ({matchingPos.length})
                </h2>
                <Link href="/pos" className="text-xs font-semibold text-emerald-600 hover:underline">
                  View All in Table ↗
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {matchingPos.map((p: any) => (
                  <Link
                    key={p.id}
                    href={`/purchase-orders/${p.id}`}
                    className="bg-white border border-slate-200 hover:border-emerald-400 rounded-xl p-4 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono font-bold text-sm text-emerald-600 group-hover:underline">
                          {p.poNo}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {p.status || 'ACTIVE'}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-800">
                        {p.customer?.companyName || 'Customer'}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Product: {p.product?.name || p.product?.code || '—'}
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span>Order Qty: <strong className="text-slate-800 font-mono">{(p.orderQty || 0).toLocaleString()}</strong></span>
                      <span className="text-emerald-600 font-medium group-hover:translate-x-0.5 transition-transform flex items-center">
                        View PO <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Products Section */}
          {(activeTab === 'ALL' || activeTab === 'PRODUCTS') && matchingProducts.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-600" />
                  Products & Spec Cards ({matchingProducts.length})
                </h2>
                <Link href="/products" className="text-xs font-semibold text-purple-600 hover:underline">
                  View All in Table ↗
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {matchingProducts.map((prod: any) => (
                  <Link
                    key={prod.id}
                    href={`/spec-cards/${prod.id}`}
                    className="bg-white border border-slate-200 hover:border-purple-400 rounded-xl p-4 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono font-bold text-sm text-purple-600 group-hover:underline">
                          {prod.code}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          {prod.layers || 2}L
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-800 line-clamp-1">
                        {prod.name}
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        Spec Card: {prod.specCardNo || '—'}
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span>Customer: <strong className="text-slate-700">{prod.customer?.companyName || '—'}</strong></span>
                      <span className="text-purple-600 font-medium group-hover:translate-x-0.5 transition-transform flex items-center">
                        Spec Sheet <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Customers Section */}
          {(activeTab === 'ALL' || activeTab === 'CUSTOMERS') && matchingCustomers.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-amber-600" />
                  Customers ({matchingCustomers.length})
                </h2>
                <Link href="/customers" className="text-xs font-semibold text-amber-600 hover:underline">
                  View All in Directory ↗
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {matchingCustomers.map((c: any) => (
                  <Link
                    key={c.id}
                    href="/customers"
                    className="bg-white border border-slate-200 hover:border-amber-400 rounded-xl p-4 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono font-bold text-sm text-amber-600 group-hover:underline">
                          {c.code || 'CUST'}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          ACTIVE
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-800">
                        {c.companyName}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Contact: {c.contactPerson || '—'}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {c.email || c.phone || '—'}
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span>Customer Record</span>
                      <span className="text-amber-600 font-medium group-hover:translate-x-0.5 transition-transform flex items-center">
                        Directory <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
