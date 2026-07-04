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
  ExternalLink
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
    attachmentUrl: '',
    notes: '',
  });
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch real data from backend API if running
  useEffect(() => {
    fetch('http://localhost:3001/api/v1/customer-pos')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setPos(data);
      })
      .catch(() => {});

    fetch('http://localhost:3001/api/v1/customers')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCustomers(data);
      })
      .catch(() => {});

    fetch('http://localhost:3001/api/v1/products')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setProducts(data);
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
      attachmentUrl: '',
      notes: '',
    });
    setError('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (po: CustomerPO) => {
    setEditingPo(po);
    setFormData({
      poNo: po.poNo,
      customerId: po.customerId,
      productId: po.productId,
      orderQty: po.orderQty,
      poDate: po.poDate.split('T')[0],
      expectedDeliveryDate: po.expectedDeliveryDate.split('T')[0],
      status: po.status,
      attachmentUrl: po.attachmentUrl || '',
      notes: po.notes || '',
    });
    setError('');
    setIsAddModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!formData.poNo || !formData.customerId || !formData.productId || !formData.orderQty || !formData.poDate) {
      setError('Please fill in all required fields (PO No, Customer, Product Spec Card, Qty, Date)');
      return;
    }

    const payload = {
      ...formData,
      orderQty: Number(formData.orderQty),
    };

    try {
      const url = editingPo
        ? `http://localhost:3001/api/v1/customer-pos/${editingPo.id}`
        : 'http://localhost:3001/api/v1/customer-pos';
      const method = editingPo ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ message: 'Failed to save PO' }));
        throw new Error(errData.message || 'Error occurred while saving PO');
      }

      const savedPo = await res.json();
      if (editingPo) {
        setPos(pos.map((p) => (p.id === savedPo.id ? savedPo : p)));
        setSuccessMsg(`PO "${savedPo.poNo}" updated successfully`);
      } else {
        setPos([savedPo, ...pos]);
        setSuccessMsg(`PO "${savedPo.poNo}" created successfully`);
      }
      setIsAddModalOpen(false);
    } catch (err: any) {
      // Fallback local UI update if backend not online during testing
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
      setSuccessMsg(`PO "${formData.poNo}" saved (Local mode)`);
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

  // Filter pos
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

  // KPIs
  const totalOrders = pos.length;
  const openOrders = pos.filter((p) => p.status === 'OPEN').length;
  const inProdOrders = pos.filter((p) => p.status === 'IN_PRODUCTION').length;
  const totalQty = pos.reduce((acc, curr) => acc + curr.orderQty, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1 w-fit"><Clock className="w-3 h-3" /> OPEN</span>;
      case 'IN_PRODUCTION':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1 w-fit"><Cpu className="w-3 h-3" /> IN PROD</span>;
      case 'READY':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 w-fit"><CheckCircle2 className="w-3 h-3" /> READY</span>;
      case 'DISPATCHED':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center gap-1 w-fit"><ArrowUpRight className="w-3 h-3" /> DISPATCHED</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1 w-fit"><AlertCircle className="w-3 h-3" /> CANCELLED</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-500/20 text-slate-400">{status}</span>;
    }
  };

  // Filter products by selected customer in form if desired
  const availableProducts = formData.customerId 
    ? products.filter((p) => !p.customerId || p.customerId === formData.customerId)
    : products;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShoppingCart className="w-7 h-7 text-blue-600" />
            <span>Customer Purchase Orders</span>
          </h1>
          <p className="text-xs text-slate-500 font-mono mt-1">
            MODULE 4: COMMERCIAL ORDER ENTRY, SPEC LINKAGE & DELIVERY TRACKING
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-lg text-xs flex items-center gap-2 transition-all shadow-sm shrink-0 w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>New Customer PO</span>
        </button>
      </div>

      {/* Success alert */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-600/70 hover:text-emerald-700 font-bold">&times;</button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Orders</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{totalOrders}</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Open / Unlaunched</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{openOrders}</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">In Production</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{inProdOrders}</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Volume Ordered</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{totalQty.toLocaleString()} <span className="text-xs text-slate-500 font-normal">PCBs</span></p>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search PO No, Customer, Spec No..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <div className="flex items-center gap-2 shrink-0">
            <Building2 className="w-4 h-4 text-slate-400" />
            <select
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Customers</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.companyName}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">OPEN</option>
              <option value="IN_PRODUCTION">IN PRODUCTION</option>
              <option value="READY">READY FOR DISPATCH</option>
              <option value="DISPATCHED">DISPATCHED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-mono uppercase tracking-wider text-slate-500">
                <th className="p-4">PO Number</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Product / Spec Card</th>
                <th className="p-4 text-right">Order Qty</th>
                <th className="p-4">Delivery Date</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Attachment</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredPos.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    No purchase orders found matching selected filters.
                  </td>
                </tr>
              ) : (
                filteredPos.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-4 font-mono font-bold text-blue-700">
                      {po.poNo}
                      <div className="text-[10px] font-normal text-slate-500 mt-0.5">
                        Recv: {new Date(po.poDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-slate-900">
                      {po.customer?.companyName || 'Unknown Customer'}
                      <div className="text-[10px] font-mono text-slate-500">
                        {po.customer?.code || ''}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-slate-700">
                        {po.product?.name || 'Custom PCB'}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-mono text-blue-700 border border-slate-200">
                          Spec: {po.product?.specCardNo || 'D000'}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {po.product?.layers || 2}L • {po.product?.pcbSize || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-slate-900 text-sm">
                      {po.orderQty.toLocaleString()}
                    </td>
                    <td className="p-4 font-mono text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{new Date(po.expectedDeliveryDate).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      {getStatusBadge(po.status)}
                    </td>
                    <td className="p-4 text-center">
                      {po.attachmentUrl ? (
                        <a
                          href={po.attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-blue-600 text-[10px] font-mono transition-colors border border-slate-200"
                          title="View PO Attachment / Gerber"
                        >
                          <Paperclip className="w-3 h-3 text-blue-500" />
                          <span>View PDF</span>
                        </a>
                      ) : (
                        <span className="text-slate-400 text-[10px] font-mono">—</span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => setViewingPo(po)}
                        className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-900 border border-slate-200 transition-colors"
                        title="View Full Detail"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(po)}
                        className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-blue-600 border border-slate-200 transition-colors"
                        title="Edit PO"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
                <span>{editingPo ? `Edit PO: ${editingPo.poNo}` : 'Create New Customer Purchase Order'}</span>
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg"
              >
                &times;
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-medium mb-1.5">PO Number (Customer Reference) *</label>
                  <input
                    type="text"
                    required
                    value={formData.poNo}
                    onChange={(e) => setFormData({ ...formData, poNo: e.target.value })}
                    placeholder="e.g. PO-2026-105"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1.5">Order Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500"
                  >
                    <option value="OPEN">OPEN (Unlaunched)</option>
                    <option value="IN_PRODUCTION">IN PRODUCTION</option>
                    <option value="READY">READY FOR DISPATCH</option>
                    <option value="DISPATCHED">DISPATCHED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-medium mb-1.5">Select Customer *</label>
                  <select
                    required
                    value={formData.customerId}
                    onChange={(e) => {
                      const newCustId = e.target.value;
                      const firstProd = products.find((p) => !p.customerId || p.customerId === newCustId);
                      setFormData({ 
                        ...formData, 
                        customerId: newCustId,
                        productId: firstProd ? firstProd.id : ''
                      });
                    }}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- Select Customer --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>{c.companyName} ({c.code || 'No Code'})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1.5">Link Product Spec Card *</label>
                  <select
                    required
                    value={formData.productId}
                    onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- Select Spec Card --</option>
                    {availableProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        [{p.specCardNo}] {p.name} ({p.layers}L, {p.pcbSize})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-700 font-medium mb-1.5">Order Quantity (PCBs) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.orderQty}
                    onChange={(e) => setFormData({ ...formData, orderQty: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1.5">PO Received Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.poDate}
                    onChange={(e) => setFormData({ ...formData, poDate: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1.5">Expected Delivery Date (EDD) *</label>
                  <input
                    type="date"
                    required
                    value={formData.expectedDeliveryDate}
                    onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1.5">Attachment / Gerber File URL</label>
                <div className="relative">
                  <Paperclip className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={formData.attachmentUrl}
                    onChange={(e) => setFormData({ ...formData, attachmentUrl: e.target.value })}
                    placeholder="https://storage.rfelectro.com/gerbers/PO-2026-105.zip or Drive link"
                    className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Provide link to customer PDF PO or CAM Gerber package.</p>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1.5">Commercial Notes & Special Instructions</label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Test coupons required on 2 panels. Standard payment terms apply."
                  className="w-full bg-white border border-slate-200 rounded-lg p-3 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-sm"
                >
                  {editingPo ? 'Update Purchase Order' : 'Create & Save PO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Detail Modal */}
      {viewingPo && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-slate-900 font-mono">{viewingPo.poNo}</h2>
                  {getStatusBadge(viewingPo.status)}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Customer PO Commercial & Production Specification Detail
                </p>
              </div>
              <button
                onClick={() => setViewingPo(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg"
              >
                &times;
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <h3 className="font-bold text-slate-700 uppercase tracking-wider text-[10px] font-mono border-b border-slate-200 pb-2">
                  1. Customer Information
                </h3>
                <div>
                  <span className="text-slate-500 block text-[10px]">Company Name</span>
                  <span className="text-slate-900 font-bold text-sm">{viewingPo.customer?.companyName || 'Unknown'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Customer Code</span>
                  <span className="text-blue-700 font-mono">{viewingPo.customer?.code || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">PO Date</span>
                  <span className="text-slate-700 font-mono">{new Date(viewingPo.poDate).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Expected Delivery Date (EDD)</span>
                  <span className="text-emerald-600 font-mono font-bold">{new Date(viewingPo.expectedDeliveryDate).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <h3 className="font-bold text-slate-700 uppercase tracking-wider text-[10px] font-mono border-b border-slate-200 pb-2">
                  2. Linked Product Spec Card
                </h3>
                <div>
                  <span className="text-slate-500 block text-[10px]">Product Name</span>
                  <span className="text-slate-900 font-bold text-sm">{viewingPo.product?.name || 'Custom PCB'}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Spec Card No</span>
                    <span className="text-blue-700 font-mono font-bold text-sm">[{viewingPo.product?.specCardNo || 'D000'}]</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Product Code</span>
                    <span className="text-slate-700 font-mono">{viewingPo.product?.code || '—'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 pt-1">
                  <div className="bg-white px-2.5 py-1 rounded border border-slate-200">
                    <span className="text-[10px] text-slate-500">Layers: </span>
                    <span className="font-bold text-slate-900 font-mono">{viewingPo.product?.layers || 2}L</span>
                  </div>
                  <div className="bg-white px-2.5 py-1 rounded border border-slate-200">
                    <span className="text-[10px] text-slate-500">Size: </span>
                    <span className="font-bold text-slate-900 font-mono">{viewingPo.product?.pcbSize || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Commercial Volume & Notes */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4 text-xs">
              <h3 className="font-bold text-slate-700 uppercase tracking-wider text-[10px] font-mono border-b border-slate-200 pb-2">
                3. Commercial Order Detail & Attachments
              </h3>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-500 text-[11px]">Total Quantity Ordered:</span>
                  <div className="text-2xl font-bold font-mono text-blue-700 mt-0.5">
                    {viewingPo.orderQty.toLocaleString()} <span className="text-xs font-normal text-slate-500">PCBs</span>
                  </div>
                </div>
                {viewingPo.attachmentUrl ? (
                  <a
                    href={viewingPo.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 transition-all w-fit shadow-sm"
                  >
                    <Paperclip className="w-4 h-4" />
                    <span>Download PO / Gerber File</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-slate-500 text-xs italic">No attachment file linked to this PO.</span>
                )}
              </div>

              {viewingPo.notes && (
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-mono mb-1">Commercial Notes & Special Instructions:</span>
                  <div className="bg-white p-3 rounded-lg border border-slate-200 text-slate-700 font-mono text-xs leading-relaxed">
                    {viewingPo.notes}
                  </div>
                </div>
              )}
            </div>

            {/* Job Card Traceability Status */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="font-bold text-slate-700 uppercase tracking-wider text-[10px] font-mono">
                  4. Production Job Card Traceability (Module 5 Preview)
                </h3>
                <span className="text-[10px] font-mono text-blue-700">
                  {viewingPo.jobCards?.length || 0} Job Card(s) Generated
                </span>
              </div>
              
              {viewingPo.jobCards && viewingPo.jobCards.length > 0 ? (
                <div className="space-y-2">
                  {viewingPo.jobCards.map((jc) => (
                    <div key={jc.id} className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-200 font-mono">
                      <span className="font-bold text-slate-900">{jc.jobCardNo}</span>
                      <span className="text-slate-500">Qty: {jc.totalQty}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-blue-50 text-blue-600 border border-blue-200">
                        {jc.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center bg-white rounded-lg border border-dashed border-slate-300 text-slate-500">
                  No Job Cards generated from this PO yet. Use Job Card Module to launch production.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewingPo(null)}
                className="px-6 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
              >
                Close Detail
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
