'use client';

import React, { useState, useEffect } from 'react';
import { Building2, Plus, Search, Edit2, CheckCircle2, XCircle, Phone, Mail, FileText, AlertCircle } from 'lucide-react';

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
    address: 'Plot 42, MIDC Industrial Area, Pune',
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
    address: 'Tech Park Phase 2, Bangalore',
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
        if (Array.isArray(data)) setCustomers(data);
      })
      .catch(() => {
        // Fallback to initial data if backend not reachable
      });
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
        // Local state fallback if API auth/server fails during dev UI testing
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
      // Offline fallback
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
    } catch {
      // ignore offline error
    }
    setCustomers(
      customers.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c))
    );
  };

  const filtered = customers.filter((c) =>
    c.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.code && c.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.contactPerson && c.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-wide">Customer Master</h1>
            <p className="text-xs text-slate-500 font-mono mt-1 font-bold">
              PCB CLIENTS • GSTIN RECORDS • BILLING & CONTACT DIRECTORY
            </p>
          </div>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Customer</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
        <Search className="w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search by Company Name, Customer Code, or Contact Person..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent text-sm text-slate-800 placeholder-slate-400 w-full focus:outline-none font-medium"
        />
      </div>

      {/* Table / List */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-mono uppercase text-slate-500 font-bold">
                <th className="py-4 px-6">Customer Code</th>
                <th className="py-4 px-6">Company Name</th>
                <th className="py-4 px-6">Contact Person</th>
                <th className="py-4 px-6">GSTIN / Tax ID</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filtered.map((customer) => (
                <tr key={customer.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-6 font-mono text-xs font-bold text-blue-600">
                    {customer.code || '—'}
                  </td>
                  <td className="py-4 px-6 font-bold text-slate-800">
                    <div className="flex flex-col">
                      <span>{customer.companyName}</span>
                      {customer.address && (
                        <span className="text-xs text-slate-500 font-normal truncate max-w-xs">{customer.address}</span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-slate-600">
                    {customer.contactPerson ? (
                      <div className="space-y-1">
                        <div className="font-bold text-slate-800">{customer.contactPerson}</div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
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
                      '—'
                    )}
                  </td>
                  <td className="py-4 px-6 font-mono text-xs text-slate-500 font-bold">
                    {customer.gstNo || '—'}
                  </td>
                  <td className="py-4 px-6">
                    <button
                      onClick={() => toggleStatus(customer.id)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border transition-colors ${
                        customer.isActive
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100'
                          : 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
                      }`}
                    >
                      {customer.isActive ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Active</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Inactive</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => handleOpenEdit(customer)}
                      className="p-2 bg-white border border-slate-200 hover:border-blue-200 hover:bg-slate-50 text-slate-500 hover:text-blue-600 rounded-lg transition-colors inline-flex items-center gap-1.5 text-xs font-bold"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No customers found matching "{searchTerm}".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold">
                  {editingCustomer ? 'ED' : 'NEW'}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    {editingCustomer ? 'Edit Customer Record' : 'Create Customer Record'}
                  </h2>
                  <p className="text-xs text-slate-500 font-mono">
                    {editingCustomer ? `ID: ${editingCustomer.code || editingCustomer.id}` : 'ENTER CLIENT MASTER DETAILS'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-800 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-500 font-bold mb-1">
                    COMPANY NAME *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="e.g. Apex Electronics Ltd"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-500 font-bold mb-1">
                    CUSTOMER CODE
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g. CUST-001"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 font-mono text-xs focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-500 font-bold mb-1">
                    CONTACT PERSON
                  </label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    placeholder="e.g. Rajesh Mehta"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-500 font-bold mb-1">
                    PHONE NUMBER
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-500 font-bold mb-1">
                    EMAIL ADDRESS
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. contact@client.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-500 font-bold mb-1">
                    GSTIN / TAX ID
                  </label>
                  <input
                    type="text"
                    value={formData.gstNo}
                    onChange={(e) => setFormData({ ...formData, gstNo: e.target.value })}
                    placeholder="e.g. 27AABCU9603R1ZM"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 font-mono text-xs focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-500 font-bold mb-1">
                  BILLING / SHIPPING ADDRESS
                </label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street, MIDC Area, City, State, PIN"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm"
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
