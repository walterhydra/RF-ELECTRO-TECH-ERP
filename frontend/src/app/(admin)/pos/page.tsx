'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit2, 
  FileText, 
  Calendar, 
  Building2, 
  Cpu, 
  Paperclip, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Layers,
  ArrowUpRight,
  ExternalLink,
  PackageCheck,
  Rocket,
  ShieldCheck,
  TrendingUp,
  FileCheck
} from 'lucide-react';

interface Customer {
  id: string;
  companyName: string;
  code: string | null;
}

interface Product {
  id: string;
  name: string;
  code: string;
  specCardNo: string;
  pcbSize: string;
  layers: number;
  customerId?: string;
}

interface CustomerPO {
  id: string;
  poNo: string;
  customerId: string;
  productId: string;
  orderQty: number;
  poDate: string;
  expectedDeliveryDate: string;
  status: 'OPEN' | 'IN_PRODUCTION' | 'READY' | 'DISPATCHED' | 'CANCELLED';
  attachmentUrl?: string | null;
  notes?: string | null;
  customer?: {
    companyName: string;
    code: string | null;
  };
  product?: {
    name: string;
    code: string;
    specCardNo: string;
    pcbSize: string;
    layers: number;
  };
  jobCards?: {
    id: string;
    jobCardNo: string;
    status: string;
    totalQty: number;
  }[];
}

const INITIAL_POS: CustomerPO[] = [
  {
    id: '1',
    poNo: 'PO-2026-001',
    customerId: '1',
    productId: '1',
    orderQty: 2500,
    poDate: '2026-07-01',
    expectedDeliveryDate: '2026-07-15',
    status: 'IN_PRODUCTION',
    attachmentUrl: 'https://storage.rfelectro.com/pos/PO-2026-001.pdf',
    notes: 'Urgent delivery required for Q3 production run. Standard ENIG finish.',
    customer: { companyName: 'Apex Electronics Ltd', code: 'CUST-APEX' },
    product: { name: 'Main Motherboard V2', code: 'PCB-MB-V2', specCardNo: 'D001', pcbSize: '150x100mm', layers: 4 },
    jobCards: [{ id: 'jc-1', jobCardNo: 'JC-2026-001', status: 'IN_PROGRESS', totalQty: 2500 }]
  },
  {
    id: '2',
    poNo: 'PO-2026-002',
    customerId: '2',
    productId: '2',
    orderQty: 1000,
    poDate: '2026-07-02',
    expectedDeliveryDate: '2026-07-20',
    status: 'OPEN',
    attachmentUrl: null,
    notes: 'Include test certificates with shipment.',
    customer: { companyName: 'Zenith Aerospace Systems', code: 'CUST-ZEN' },
    product: { name: 'RF Transceiver Board', code: 'PCB-RF-01', specCardNo: 'D002', pcbSize: '80x60mm', layers: 6 },
    jobCards: []
  },
  {
    id: '3',
    poNo: 'PO-2026-003',
    customerId: '3',
    productId: '3',
    orderQty: 5000,
    poDate: '2026-06-28',
    expectedDeliveryDate: '2026-07-10',
    status: 'READY',
    attachmentUrl: 'https://storage.rfelectro.com/pos/PO-2026-003.pdf',
    notes: 'Packed in vacuum sealed bags of 50.',
    customer: { companyName: 'Orbit Medical Devices', code: 'CUST-ORB' },
    product: { name: 'Power Supply PCB', code: 'PCB-PSU-10', specCardNo: 'D003', pcbSize: '120x120mm', layers: 2 },
    jobCards: [{ id: 'jc-2', jobCardNo: 'JC-2026-002', status: 'COMPLETED', totalQty: 5000 }]
  }
];

const INITIAL_CUSTOMERS: Customer[] = [
  { id: '1', companyName: 'Apex Electronics Ltd', code: 'CUST-APEX' },
  { id: '2', companyName: 'Zenith Aerospace Systems', code: 'CUST-ZEN' },
  { id: '3', companyName: 'Orbit Medical Devices', code: 'CUST-ORB' },
];

const INITIAL_PRODUCTS: Product[] = [
  { id: '1', name: 'Main Motherboard V2', code: 'PCB-MB-V2', specCardNo: 'D001', pcbSize: '150x100mm', layers: 4, customerId: '1' },
  { id: '2', name: 'RF Transceiver Board', code: 'PCB-RF-01', specCardNo: 'D002', pcbSize: '80x60mm', layers: 6, customerId: '2' },
  { id: '3', name: 'Power Supply PCB', code: 'PCB-PSU-10', specCardNo: 'D003', pcbSize: '120x120mm', layers: 2, customerId: '3' },
];

const STATUS_OPTIONS = [
  { id: 'ALL', label: 'All Orders' },
  { id: 'OPEN', label: '🔵 Open / Unlaunched' },
  { id: 'IN_PRODUCTION', label: '🟠 In Production' },
  { id: 'READY', label: '🟢 Ready for Dispatch' },
  { id: 'DISPATCHED', label: '🟣 Dispatched' },
  { id: 'CANCELLED', label: '🔴 Cancelled' },
];

export default function POsPage() {
  const [pos, setPos] = useState<CustomerPO[]>(INITIAL_POS);
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [customerFilter, setCustomerFilter] = useState('ALL');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewingPo, setViewingPo] = useState<CustomerPO | null>(null);
  const [editingPo, setEditingPo] = useState<CustomerPO | null>(null);
  
  const [formData, setFormData] = useState({
    poNo: `PO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    customerId: '',
    productId: '',
    orderQty: 1000,
    poDate: new Date().toISOString().split('T')[0],
    expectedDeliveryDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    status: 'OPEN' as any,
    notes: '',
    attachmentUrl: '',
  });

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch API
  useEffect(() => {
    fetch('http://localhost:3001/api/v1/customer-pos')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setPos(data);
      })
      .catch(() => {});

    fetch('http://localhost:3001/api/v1/customers')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setCustomers(data);
      })
      .catch(() => {});

    fetch('http://localhost:3001/api/v1/products')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setProducts(data);
      })
      .catch(() => {});
  }, []);

  const handleOpenAdd = () => {
    setEditingPo(null);
    setFormData({
      poNo: `PO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      customerId: customers[0]?.id || '',
      productId: products[0]?.id || '',
      orderQty: 1000,
      poDate: new Date().toISOString().split('T')[0],
      expectedDeliveryDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      status: 'OPEN',
      notes: '',
      attachmentUrl: '',
    });
    setErrorMsg('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (po: CustomerPO) => {
    setEditingPo(po);
    setFormData({
      poNo: po.poNo,
      customerId: po.customerId,
      productId: po.productId,
      orderQty: po.orderQty,
      poDate: po.poDate ? po.poDate.split('T')[0] : '',
      expectedDeliveryDate: po.expectedDeliveryDate ? po.expectedDeliveryDate.split('T')[0] : '',
      status: po.status,
      notes: po.notes || '',
      attachmentUrl: po.attachmentUrl || '',
    });
    setErrorMsg('');
    setIsAddModalOpen(true);
  };

  const handleSavePo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.poNo.trim() || !formData.customerId || !formData.productId) {
      setErrorMsg('PO Number, Customer, and Product selection are required');
      return;
    }

    try {
      const method = editingPo ? 'PATCH' : 'POST';
      const url = editingPo
        ? `http://localhost:3001/api/v1/customer-pos/${editingPo.id}`
        : 'http://localhost:3001/api/v1/customer-pos';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          orderQty: Number(formData.orderQty),
        }),
      });

      const selectedCust = customers.find((c) => c.id === formData.customerId);
      const selectedProd = products.find((p) => p.id === formData.productId);

      if (res.ok) {
        const saved = await res.json();
        const fullPo = {
          ...saved,
          customer: selectedCust ? { companyName: selectedCust.companyName, code: selectedCust.code } : saved.customer,
          product: selectedProd ? { name: selectedProd.name, code: selectedProd.code, specCardNo: selectedProd.specCardNo, pcbSize: selectedProd.pcbSize, layers: selectedProd.layers } : saved.product,
        };
        if (editingPo) {
          setPos(pos.map((p) => (p.id === saved.id ? fullPo : p)));
          setSuccessMsg(`PO "${saved.poNo}" updated successfully`);
        } else {
          setPos([fullPo, ...pos]);
          setSuccessMsg(`PO "${saved.poNo}" created successfully`);
        }
        setIsAddModalOpen(false);
      } else {
        if (editingPo) {
          setPos(
            pos.map((p) =>
              p.id === editingPo.id
                ? {
                    ...p,
                    ...formData,
                    orderQty: Number(formData.orderQty),
                    customer: selectedCust ? { companyName: selectedCust.companyName, code: selectedCust.code } : p.customer,
                    product: selectedProd ? { name: selectedProd.name, code: selectedProd.code, specCardNo: selectedProd.specCardNo, pcbSize: selectedProd.pcbSize, layers: selectedProd.layers } : p.product,
                  }
                : p
            )
          );
        } else {
          const newPo: CustomerPO = {
            id: String(Date.now()),
            ...formData,
            orderQty: Number(formData.orderQty),
            customer: selectedCust ? { companyName: selectedCust.companyName, code: selectedCust.code } : { companyName: 'Customer', code: 'CUST' },
            product: selectedProd ? { name: selectedProd.name, code: selectedProd.code, specCardNo: selectedProd.specCardNo, pcbSize: selectedProd.pcbSize, layers: selectedProd.layers } : { name: 'Product', code: 'PROD', specCardNo: 'D000', pcbSize: '100x100mm', layers: 2 },
            jobCards: [],
          };
          setPos([newPo, ...pos]);
        }
        setIsAddModalOpen(false);
        setSuccessMsg(`PO "${formData.poNo}" saved`);
      }
    } catch {
      const selectedCust = customers.find((c) => c.id === formData.customerId);
      const selectedProd = products.find((p) => p.id === formData.productId);

      if (editingPo) {
        setPos(
          pos.map((p) =>
            p.id === editingPo.id
              ? {
                  ...p,
                  ...formData,
                  orderQty: Number(formData.orderQty),
                  customer: selectedCust ? { companyName: selectedCust.companyName, code: selectedCust.code } : p.customer,
                  product: selectedProd ? { name: selectedProd.name, code: selectedProd.code, specCardNo: selectedProd.specCardNo, pcbSize: selectedProd.pcbSize, layers: selectedProd.layers } : p.product,
                }
              : p
          )
        );
      } else {
        const newPo: CustomerPO = {
          id: String(Date.now()),
          ...formData,
          orderQty: Number(formData.orderQty),
          customer: selectedCust ? { companyName: selectedCust.companyName, code: selectedCust.code } : { companyName: 'Customer', code: 'CUST' },
          product: selectedProd ? { name: selectedProd.name, code: selectedProd.code, specCardNo: selectedProd.specCardNo, pcbSize: selectedProd.pcbSize, layers: selectedProd.layers } : { name: 'Product', code: 'PROD', specCardNo: 'D000', pcbSize: '100x100mm', layers: 2 },
          jobCards: [],
        };
        setPos([newPo, ...pos]);
      }
      setIsAddModalOpen(false);
      setSuccessMsg(`PO "${formData.poNo}" saved`);
    }
  };

  const handleStatusChange = async (poId: string, newStatus: string) => {
    try {
      await fetch(`http://localhost:3001/api/v1/customer-pos/${poId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (e) {}

    setPos(pos.map((p) => (p.id === poId ? { ...p, status: newStatus as any } : p)));
    setSuccessMsg(`Order status updated to ${newStatus}`);
  };

  // Filtered list
  const filteredPos = pos.filter((p) => {
    const matchesSearch =
      p.poNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.customer?.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.product?.specCardNo.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    const matchesCustomer = customerFilter === 'ALL' || p.customerId === customerFilter;

    return matchesSearch && matchesStatus && matchesCustomer;
  });

  // Metrics
  const totalOrders = pos.length;
  const openOrders = pos.filter((p) => p.status === 'OPEN').length;
  const inProdOrders = pos.filter((p) => p.status === 'IN_PRODUCTION').length;
  const totalQty = pos.reduce((acc, curr) => acc + curr.orderQty, 0);

  const availableProducts = formData.customerId 
    ? products.filter((p) => !p.customerId || p.customerId === formData.customerId)
    : products;

  return (
    <div className="space-y-6 p-6 max-w-[1400px] mx-auto pb-16 bg-slate-100 min-h-screen text-slate-900 font-sans">
      
      {/* Top Banner & Header */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Customer Purchase Orders Master</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                Commercial PO Entry & Gerber Linkage
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage client purchase orders, spec card mapping, order quantities, delivery dates & job card launches.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>New Customer PO</span>
        </button>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-700 hover:text-emerald-900 font-bold text-sm">✕</button>
        </div>
      )}

      {/* Top Metrics Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Commercial POs</p>
            <p className="text-lg font-bold text-slate-900 mt-0.5">{totalOrders} Active Orders</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Open / Unlaunched</p>
            <p className="text-lg font-bold text-slate-900 mt-0.5">{openOrders} Orders Pending</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">In Production</p>
            <p className="text-lg font-bold text-slate-900 mt-0.5">{inProdOrders} Active Lots</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Volume Ordered</p>
            <p className="text-lg font-bold text-slate-900 mt-0.5">{totalQty.toLocaleString()} PCBs</p>
          </div>
        </div>
      </div>

      {/* Tabs & Search & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4 shadow-sm">
        
        {/* Status Filter Chips Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-100">
          <span className="text-xs text-slate-500 font-medium whitespace-nowrap flex items-center gap-1.5 mr-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" /> Filter Status:
          </span>
          {STATUS_OPTIONS.map((st) => {
            const count = st.id === 'ALL' ? pos.length : pos.filter((p) => p.status === st.id).length;
            const isSelected = statusFilter === st.id;
            return (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <span>{st.label}</span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] ${
                  isSelected ? 'bg-slate-950/20 text-slate-950 font-extrabold' : 'bg-slate-200 text-slate-700'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Customer Dropdown Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          
          {/* Search Input */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by PO No, Customer Name, Spec Card No..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-amber-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            )}
          </div>

          {/* Customer Dropdown */}
          <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
            <Building2 className="w-4 h-4 text-slate-400" />
            <select
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500 w-full md:w-auto"
            >
              <option value="ALL">All Customers ({customers.length})</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.companyName}</option>
              ))}
            </select>
          </div>

        </div>

      </div>

      {/* Main PO Data Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-mono uppercase tracking-wider text-slate-500">
                <th className="py-3 px-3">PO Number</th>
                <th className="py-3 px-3">Customer Company</th>
                <th className="py-3 px-3">Product & Gerber Spec</th>
                <th className="py-3 px-3 text-right">Order Qty</th>
                <th className="py-3 px-3">Delivery Date</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-center">Attachment</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredPos.map((po) => (
                <tr key={po.id} className="hover:bg-slate-50/80 transition-colors">
                  
                  {/* PO Number (No Wrapping) */}
                  <td className="py-3 px-3 font-mono text-xs whitespace-nowrap">
                    <span className="font-bold text-slate-900 px-2 py-0.5 rounded bg-slate-100 border border-slate-200 shadow-2xs whitespace-nowrap inline-block">
                      {po.poNo}
                    </span>
                    <div className="text-[10px] font-normal text-slate-500 mt-0.5 whitespace-nowrap flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>Recv: {new Date(po.poDate).toLocaleDateString()}</span>
                    </div>
                  </td>

                  {/* Customer Company */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-[11px] font-bold text-blue-700 shrink-0">
                        {po.customer?.companyName.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900 text-xs truncate max-w-[140px]">{po.customer?.companyName || 'Unknown Customer'}</span>
                        {po.customer?.code && (
                          <span className="text-[10px] font-mono text-slate-500">{po.customer.code}</span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Product & Gerber Spec */}
                  <td className="py-3 px-3">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900 text-xs truncate max-w-[160px]">{po.product?.name || '—'}</span>
                      <div className="flex items-center gap-1 mt-0.5 font-mono text-xs">
                        <span className="px-1.5 py-0.2 rounded bg-blue-50 border border-blue-200 text-blue-700 font-bold text-[11px]">
                          {po.product?.specCardNo || 'D000'}
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-purple-50 border border-purple-200 text-purple-700 font-semibold text-[11px]">
                          {po.product?.layers || 2}L
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200 text-slate-600 text-[10px]">
                          {po.product?.pcbSize || '—'}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Order Qty */}
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 text-xs whitespace-nowrap">
                    {po.orderQty.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">pcs</span>
                  </td>

                  {/* Delivery Date */}
                  <td className="py-3 px-3 font-mono text-xs whitespace-nowrap">
                    <div className="flex items-center gap-1 text-slate-700 font-semibold whitespace-nowrap">
                      <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>{new Date(po.expectedDeliveryDate).toLocaleDateString()}</span>
                    </div>
                  </td>

                  {/* Status Dropdown */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <select
                      value={po.status}
                      onChange={(e) => handleStatusChange(po.id, e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 cursor-pointer whitespace-nowrap shadow-2xs"
                    >
                      <option value="OPEN">🔵 OPEN</option>
                      <option value="IN_PRODUCTION">🟠 IN PRODUCTION</option>
                      <option value="READY">🟢 READY FOR DISPATCH</option>
                      <option value="DISPATCHED">🟣 DISPATCHED</option>
                      <option value="CANCELLED">🔴 CANCELLED</option>
                    </select>
                  </td>

                  {/* Attachment PDF */}
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    {po.attachmentUrl ? (
                      <a
                        href={po.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-blue-700 hover:text-blue-900 font-medium hover:underline bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 shadow-2xs"
                      >
                        <Paperclip className="w-3 h-3" />
                        <span>PDF</span>
                      </a>
                    ) : (
                      <span className="text-slate-400 text-xs font-mono">—</span>
                    )}
                  </td>

                  {/* Action Buttons */}
                  <td className="py-3 px-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setViewingPo(po)}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-blue-700 border border-slate-200 rounded-lg transition-all inline-flex items-center gap-1 text-[11px] font-medium shadow-2xs"
                        title="View Commercial PO Summary"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>

                      <button
                        onClick={() => handleOpenEdit(po)}
                        className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg transition-all shadow-2xs"
                        title="Edit Order Details"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-amber-600" />
                      </button>
                    </div>
                  </td>

                </tr>
              ))}

              {filteredPos.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <ShoppingCart className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-medium">No purchase orders found matching your search & status filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit PO Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6 my-8 animate-in fade-in zoom-in-95 duration-200 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 font-bold shrink-0">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {editingPo ? 'Edit Customer Purchase Order' : 'New Customer Purchase Order'}
                  </h2>
                  <p className="text-xs text-slate-500 font-mono">
                    COMMERCIAL ORDER MASTER ENTRY
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSavePo} className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">PO NUMBER *</label>
                  <input
                    type="text"
                    required
                    value={formData.poNo}
                    onChange={(e) => setFormData({ ...formData, poNo: e.target.value })}
                    placeholder="e.g. PO-2026-099"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-mono text-xs focus:bg-white focus:outline-none focus:border-amber-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">ORDER QTY (PCS) *</label>
                  <input
                    type="number"
                    required
                    value={formData.orderQty}
                    onChange={(e) => setFormData({ ...formData, orderQty: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-mono text-xs focus:bg-white focus:outline-none focus:border-amber-500 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">SELECT CUSTOMER *</label>
                <select
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-amber-500 font-medium"
                >
                  <option value="">-- Select Client --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.companyName} ({c.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">SELECT PCB PRODUCT SPEC CARD *</label>
                <select
                  value={formData.productId}
                  onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-amber-500 font-medium"
                >
                  <option value="">-- Select Product Spec Card --</option>
                  {availableProducts.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} [{p.specCardNo}] - {p.layers}L ({p.code})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">PO RECEIVED DATE</label>
                  <input
                    type="date"
                    value={formData.poDate}
                    onChange={(e) => setFormData({ ...formData, poDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-mono text-xs focus:bg-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">TARGET DELIVERY DATE</label>
                  <input
                    type="date"
                    value={formData.expectedDeliveryDate}
                    onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-mono text-xs focus:bg-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">COMMERCIAL NOTES & INSTRUCTIONS</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Special packaging, delivery instructions, Hipot test certs required..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500 text-xs resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-all shadow-sm"
                >
                  {editingPo ? 'Update Purchase Order' : 'Save Purchase Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View PO Summary Modal */}
      {viewingPo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 font-bold shrink-0">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{viewingPo.poNo}</h2>
                  <p className="text-xs text-slate-500 font-mono">COMMERCIAL PURCHASE ORDER SUMMARY</p>
                </div>
              </div>
              <button
                onClick={() => setViewingPo(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <p className="text-[10px] font-mono text-slate-500 uppercase">Customer Company</p>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">{viewingPo.customer?.companyName}</p>
                  <p className="font-mono text-slate-500 mt-0.5">{viewingPo.customer?.code}</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono text-slate-500 uppercase">Ordered Quantity</p>
                  <p className="font-bold text-amber-700 text-base mt-0.5 font-mono">{viewingPo.orderQty.toLocaleString()} PCBs</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <p className="text-[10px] font-mono text-slate-500 uppercase">Linked Product Gerber Spec</p>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">{viewingPo.product?.name}</span>
                  <span className="px-2.5 py-1 rounded bg-blue-50 border border-blue-200 text-blue-700 font-mono font-bold">
                    {viewingPo.product?.specCardNo}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-slate-600 font-mono pt-1">
                  <span>Code: {viewingPo.product?.code}</span>
                  <span>•</span>
                  <span>{viewingPo.product?.layers} Layers</span>
                  <span>•</span>
                  <span>Size: {viewingPo.product?.pcbSize}</span>
                </div>
              </div>

              {viewingPo.notes && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
                  <p className="font-semibold text-[11px] mb-1">Commercial Notes:</p>
                  <p className="leading-relaxed">{viewingPo.notes}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end pt-4 border-t border-slate-100">
              <button
                onClick={() => setViewingPo(null)}
                className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
              >
                Close Summary
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
