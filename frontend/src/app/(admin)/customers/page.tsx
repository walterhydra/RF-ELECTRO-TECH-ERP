'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  Edit2, 
  CheckCircle2, 
  XCircle, 
  Phone, 
  Mail, 
  FileText, 
  AlertCircle,
  MapPin,
  ShieldCheck,
  Briefcase
} from 'lucide-react';

interface Customer {
  id: string;
  companyName: string;
  code: string | null;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  gstNo: string | null;
  isActive: boolean;
}

const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: '1',
    companyName: 'Apex Electronics Ltd',
    code: 'CUST-APEX',
    contactPerson: 'Rajesh Mehta',
    email: 'rajesh@apexelectronics.com',
    phone: '+91 98765 43210',
    address: 'Plot 42, MIDC Industrial Area, Pune, MH',
    gstNo: '27AABCU9603R1ZM',
    isActive: true,
  },
  {
    id: '2',
    companyName: 'Zenith Aerospace Systems',
    code: 'CUST-ZEN',
    contactPerson: 'Vikram Sharma',
    email: 'vsharma@zenithaerospace.in',
    phone: '+91 98111 22334',
    address: 'Tech Park Phase 2, Bangalore, KA',
    gstNo: '29AACCF8822K1Z5',
    isActive: true,
  },
  {
    id: '3',
    companyName: 'Orbit Medical Devices',
    code: 'CUST-ORB',
    contactPerson: 'Ananya Iyer',
    email: 'ananya@orbitmed.com',
    phone: '+91 94455 66778',
    address: 'Sector 18, Gurgaon, Haryana',
    gstNo: '06AAXCO1234F1Z9',
    isActive: true,
  },
];

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    companyName: '',
    code: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    gstNo: '',
    isActive: true,
  });
  const [error, setError] = useState('');

  // Fetch from backend API if available
  useEffect(() => {
    fetch('http://localhost:3001/api/v1/customers')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setCustomers(data);
      })
      .catch(() => {});
  }, []);

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setFormData({
      companyName: '',
      code: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      gstNo: '',
      isActive: true,
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      companyName: customer.companyName,
      code: customer.code || '',
      contactPerson: customer.contactPerson || '',
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      gstNo: customer.gstNo || '',
      isActive: customer.isActive,
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName.trim()) {
      setError('Company Name is required');
      return;
    }

    try {
      const method = editingCustomer ? 'PATCH' : 'POST';
      const url = editingCustomer
        ? `http://localhost:3001/api/v1/customers/${editingCustomer.id}`
        : 'http://localhost:3001/api/v1/customers';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const saved = await res.json();
        if (editingCustomer) {
          setCustomers(customers.map((c) => (c.id === saved.id ? saved : c)));
        } else {
          setCustomers([saved, ...customers]);
        }
        setIsModalOpen(false);
      } else {
        if (editingCustomer) {
          setCustomers(
            customers.map((c) =>
              c.id === editingCustomer.id ? { ...c, ...formData, id: c.id } : c
            )
          );
        } else {
          const newCust: Customer = {
            id: String(Date.now()),
            ...formData,
          };
          setCustomers([newCust, ...customers]);
        }
        setIsModalOpen(false);
      }
    } catch {
      if (editingCustomer) {
        setCustomers(
          customers.map((c) =>
            c.id === editingCustomer.id ? { ...c, ...formData, id: c.id } : c
          )
        );
      } else {
        const newCust: Customer = {
          id: String(Date.now()),
          ...formData,
        };
        setCustomers([newCust, ...customers]);
      }
      setIsModalOpen(false);
    }
  };

  const toggleStatus = async (id: string) => {
    try {
      await fetch(`http://localhost:3001/api/v1/customers/${id}/status`, {
        method: 'PATCH',
      });
    } catch {}
    setCustomers(
      customers.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c))
    );
  };

  const filtered = customers.filter(
    (c) =>
      c.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.code && c.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.contactPerson && c.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.gstNo && c.gstNo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const activeCount = customers.filter((c) => c.isActive).length;
  const gstRegisteredCount = customers.filter((c) => c.gstNo && c.gstNo.length > 5).length;

  return (
    <div className="space-y-6 p-6 max-w-[1400px] mx-auto pb-16 bg-slate-100 min-h-screen text-slate-900 font-sans">
      
      {/* Top Banner & Header */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Customer Master Directory</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                PCB Clients & Billing
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage client companies, contact persons, GSTIN records, and shipping addresses.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>New Customer Record</span>
        </button>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Active PCB Clients</p>
            <p className="text-lg font-bold text-slate-900 mt-0.5">{activeCount} Companies</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">GSTIN Registered</p>
            <p className="text-lg font-bold text-slate-900 mt-0.5">{gstRegisteredCount} Tax Compliant</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Portal Access Ready</p>
            <p className="text-lg font-bold text-slate-900 mt-0.5">{activeCount} Client Portals</p>
          </div>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="bg-white border border-slate-200 p-3.5 rounded-xl shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
        <input
          type="text"
          placeholder="Search by Company Name, Customer Code, Contact Person, or GSTIN..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent text-xs text-slate-900 placeholder-slate-400 w-full focus:outline-none"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="text-xs text-slate-400 hover:text-slate-700 px-2 py-1 bg-slate-100 rounded-md"
          >
            Clear
          </button>
        )}
      </div>

      {/* Main Customers Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-mono uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-5">Customer Code</th>
                <th className="py-3.5 px-5">Company Name & Address</th>
                <th className="py-3.5 px-5">Primary Contact</th>
                <th className="py-3.5 px-5">GSTIN / Tax ID</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filtered.map((customer) => (
                <tr key={customer.id} className="hover:bg-slate-50/80 transition-colors">
                  
                  {/* Code */}
                  <td className="py-3.5 px-5">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-800 font-mono text-xs font-bold">
                      {customer.code || 'CUST-NEW'}
                    </span>
                  </td>

                  {/* Company Name & Address */}
                  <td className="py-3.5 px-5">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-xs font-bold text-blue-700 shrink-0 mt-0.5">
                        {customer.companyName.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900">{customer.companyName}</span>
                        {customer.address && (
                          <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-xs">{customer.address}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Contact Person */}
                  <td className="py-3.5 px-5 text-slate-700">
                    {customer.contactPerson ? (
                      <div className="space-y-1">
                        <div className="font-medium text-slate-900 flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                          <span>{customer.contactPerson}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
                          {customer.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" /> {customer.phone}
                            </span>
                          )}
                          {customer.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-400" /> {customer.email}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs italic">—</span>
                    )}
                  </td>

                  {/* GSTIN */}
                  <td className="py-3.5 px-5">
                    {customer.gstNo ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono text-xs font-medium">
                        <FileText className="w-3 h-3 opacity-70" />
                        <span>{customer.gstNo}</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs font-mono">—</span>
                    )}
                  </td>

                  {/* Status Toggle */}
                  <td className="py-3.5 px-5">
                    <button
                      onClick={() => toggleStatus(customer.id)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                        customer.isActive
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${customer.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      <span>{customer.isActive ? 'Active' : 'Inactive'}</span>
                    </button>
                  </td>

                  {/* Edit Action */}
                  <td className="py-3.5 px-5 text-right">
                    <button
                      onClick={() => handleOpenEdit(customer)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 rounded-xl transition-all inline-flex items-center gap-1.5 text-xs font-medium shadow-2xs"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-amber-600" />
                      <span>Edit</span>
                    </button>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-medium">No customer records found matching "{searchTerm}".</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal (White Theme) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6 my-8 animate-in fade-in zoom-in-95 duration-200 text-slate-900">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 font-bold shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {editingCustomer ? 'Edit Customer Master Record' : 'Create Customer Record'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {editingCustomer ? `Code: ${editingCustomer.code || 'N/A'}` : 'ENTER CLIENT MASTER DETAILS'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">COMPANY NAME *</label>
                  <input
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="e.g. Apex Electronics Ltd"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500 text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">CUSTOMER CODE</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g. CUST-APEX"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-mono text-xs focus:bg-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">CONTACT PERSON</label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    placeholder="e.g. Rajesh Mehta"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">PHONE NUMBER</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">EMAIL ADDRESS</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. contact@client.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">GSTIN / TAX ID</label>
                  <input
                    type="text"
                    value={formData.gstNo}
                    onChange={(e) => setFormData({ ...formData, gstNo: e.target.value })}
                    placeholder="e.g. 27AABCU9603R1ZM"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-mono text-xs focus:bg-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">BILLING / SHIPPING ADDRESS</label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street, MIDC Area, City, State, PIN"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500 text-xs resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-all shadow-sm"
                >
                  {editingCustomer ? 'Update Customer' : 'Save Customer Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
