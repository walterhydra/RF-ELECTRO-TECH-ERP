'use client';

import React from 'react';
import Head from 'next/head';

export default function ClientManagementDashboard() {
  return (
    <>
      <style jsx global>{`
        body {
          font-family: 'Inter', sans-serif;
        }
        /* Custom Scrollbar for better UI match */
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        ::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        /* Specific Sidebar styling to match the deep navy/black color */
        .sidebar-bg {
          background-color: #0f172a;
        }
        .table-header-shadow {
          box-shadow: 0 1px 0 0 #e2e8f0;
        }
      `}</style>
      
      <div className="bg-slate-100 text-slate-900 overflow-hidden h-screen flex w-full">
        {/* BEGIN: Sidebar */}
        <aside className="sidebar-bg w-64 flex-shrink-0 flex flex-col text-slate-400" data-purpose="main-sidebar">
          <div className="p-6 flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
            </div>
            <span className="text-white font-bold text-xl tracking-tight">FinTrace</span>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-1">
            <a className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors" href="#">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
              <span className="text-sm font-medium">Dashboard</span>
            </a>
            <a className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors" href="#">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              <span className="text-sm font-medium">Advisors</span>
            </a>
            {/* Active State */}
            <a className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-blue-600/10 text-blue-500 border-r-4 border-blue-600" href="#">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              <span className="text-sm font-medium">Clients</span>
            </a>
            <a className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors" href="#">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path></svg>
              <span className="text-sm font-medium">Unassigned</span>
            </a>
            <a className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors" href="#">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
              <span className="text-sm font-medium">Sold Investments</span>
            </a>
            <a className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors relative" href="#">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
              <span className="text-sm font-medium">Missed Premiums</span>
              <span className="absolute right-3 top-3 w-2 h-2 bg-blue-500 rounded-full"></span>
            </a>
          </nav>
          <div className="px-4 py-6 border-t border-slate-800 space-y-1">
            <a className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors" href="#">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              <span className="text-sm font-medium">Settings</span>
            </a>
          </div>
        </aside>
        {/* END: Sidebar */}

        {/* Main Content Wrapper */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* BEGIN: Top Header */}
          <header className="h-16 flex items-center justify-between px-8 bg-white border-b border-slate-200">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-slate-800">Clients</h1>
              <div className="flex space-x-2">
                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-semibold rounded-full border border-blue-100">567 policies</span>
                <span className="px-2 py-0.5 bg-green-50 text-green-600 text-xs font-semibold rounded-full border border-green-100">982 clients</span>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3 text-right">
                <div>
                  <p className="text-sm font-bold text-slate-800 leading-none">Ralph Edwards</p>
                  <p className="text-xs text-slate-500 mt-1">ralphed123@gmail.com</p>
                </div>
                <img alt="User Profile" className="w-10 h-10 rounded-full object-cover border-2 border-slate-100" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBOWgNylRuz2Jl1X2AfQ_RGxBOoKw7f4-GogeQfapIh_QlUxTXhw1qgiDFbavbhvbwOuFFzbYZnyfVA02Tye23NHvu70FP68vcxGE8LSQYkI1ZXZAcG-0xe0yt3htldwszmR5GLNUfiec5pJEzMq8jOrGVOONL1ltSUT9IlJ7IUGI_iGm2NsHojzrVKIVL6aLg9OmsozDJxejcG-nN75RPa6hWktlJfiS4iySRYrS14GlCVIxOAA_n88Z_2e0pXA8NHLSVC9R_5KpE"/>
                <button className="text-slate-400 hover:text-slate-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7"></path></svg>
                </button>
              </div>
            </div>
          </header>
          {/* END: Top Header */}

          {/* Scrollable Main Section */}
          <div className="flex-1 overflow-y-auto p-8 space-y-6">
            {/* BEGIN: Filters Section */}
            <section className="flex flex-col space-y-4" data-purpose="table-filters">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-4 flex-1 max-w-2xl">
                  <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </span>
                    <input className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 bg-white" placeholder="Client or Policy No..." type="text"/>
                  </div>
                  <div className="relative w-48">
                    <select className="block w-full pl-3 pr-10 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-blue-500 focus:border-blue-500 appearance-none">
                      <option>Advisor</option>
                    </select>
                  </div>
                </div>
                <button className="flex items-center space-x-2 px-4 py-2 border border-blue-200 text-blue-600 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
                  <span>Apply filters</span>
                </button>
              </div>
              {/* Active Filter Tags */}
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center space-x-2 bg-white border border-slate-200 px-3 py-1.5 rounded-md text-xs font-medium">
                  <span className="text-slate-500">Policy type:</span>
                  <span className="text-slate-800">Regular Savings</span>
                  <button className="text-slate-400 hover:text-slate-600">×</button>
                </div>
                <div className="flex items-center space-x-2 bg-white border border-slate-200 px-3 py-1.5 rounded-md text-xs font-medium">
                  <span className="text-slate-500">Policy type:</span>
                  <span className="text-slate-800">Insurance</span>
                  <button className="text-slate-400 hover:text-slate-600">×</button>
                </div>
                <div className="flex items-center space-x-2 bg-white border border-slate-200 px-3 py-1.5 rounded-md text-xs font-medium">
                  <span className="text-slate-500">Policy type:</span>
                  <span className="text-slate-800">Lump Sum</span>
                  <button className="text-slate-400 hover:text-slate-600">×</button>
                </div>
                <div className="flex items-center space-x-2 bg-white border border-slate-200 px-3 py-1.5 rounded-md text-xs font-medium">
                  <span className="text-slate-500">Currency:</span>
                  <span className="text-slate-800">USD</span>
                  <button className="text-slate-400 hover:text-slate-600">×</button>
                </div>
              </div>
            </section>
            {/* END: Filters Section */}

            {/* BEGIN: Clients Table Card */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden" data-purpose="clients-data-table">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        <div className="flex items-center space-x-1">
                          <span>Client Name</span>
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"></path></svg>
                        </div>
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Policy Number</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Currency</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        <div className="flex items-center space-x-1">
                          <span>Invested</span>
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"></path></svg>
                        </div>
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        <div className="flex items-center space-x-1">
                          <span>Valuation</span>
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"></path></svg>
                        </div>
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Policy Type</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">View</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {/* Row 1 */}
                    <tr className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <img alt="Ralph" className="w-9 h-9 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBPIl_gLqlyJR7xHbONTdcushBFDFcvQY827YFZPMKhELGfZ-aAVxDtZc4zQn5myKuwH-M_rVv7r0PIit5K92ud8c4vg8nhRkEYtnNglEW1x_fqhEI4bs6yYD-DNTSF7WDtoW7E_Actr1DZd50gsN0zey0ch0i4Q_Xfl2BVrAnsYm4T8Od9jVzfRRs7p-nu3narEx5V7KmeJHBFOUXgGUSnqvgmMbLsy_qTx7A-pMfdBl6gXr8hXZ2ySo5TojKNB6Lb4roXJpVc1Q4"/>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">Ralph Edwards</p>
                            <p className="text-xs text-slate-500">edwards@oakstreet.org</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600">5418821676YH</td>
                      <td className="px-6 py-4 text-sm text-slate-600">USD</td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-800">164,540.<sup>00</sup></td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-800">210,518.<sup>21</sup></td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-600 uppercase border border-blue-100">
                            <span className="w-1 h-1 bg-blue-600 rounded-full mr-1"></span> Regular Savings
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-600 uppercase border border-teal-100">
                            <span className="w-1 h-1 bg-teal-600 rounded-full mr-1"></span> Insurance
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-slate-400 group-hover:text-blue-600">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                        </button>
                      </td>
                    </tr>
                    {/* Row 2 */}
                    <tr className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <img alt="Wade" className="w-9 h-9 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBJk0IGsN7RCKbS-JsHkrXbX76kB1neZ5mmocsZYD4BsDKCaXOCtrlALtv-w4LzQU1wml1dCbF5ziEdAl_Bn0zGlAeL9IJnK6zR5sTBhiGrz2uLemi-Er91bX5oyVa8KxPhFPlEUaIZwgP-7YvdkTVP4MYryjJNAfyp0LDmRRrrPYPilvDqz9ZcAkUFbi40ZwMLiQ2YoyPJgwR1p9-DE03mkhOuvAfHKmH3irY3EeDqGXVcGjQ0DFuoTCFA85CW20dX5RRubaSptBk"/>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">Wade Warren</p>
                            <p className="text-xs text-slate-500">wade67@hotmail.com</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600">4233252311YT</td>
                      <td className="px-6 py-4 text-sm text-slate-600">USD</td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-800">154,000.<sup>75</sup></td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-800">187,578.<sup>33</sup></td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-600 uppercase border border-blue-100">
                          <span className="w-1 h-1 bg-blue-600 rounded-full mr-1"></span> Regular Savings
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-slate-400 group-hover:text-blue-600">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                        </button>
                      </td>
                    </tr>
                    {/* Row 3 */}
                    <tr className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <img alt="Eleanor" className="w-9 h-9 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBcDfBacveRLydILsNKx-ibcfJvojSsTsttvt6l_lC57wJ5pSpAx2yK26X0QBLhgRoVSqxakRfvhGsvrt6k2CBVu8hi7nLRmvi-ai23F_LvNN1IUgNkc_-TuuuJfUPzz9Nbbbe7wJ5j_M_lPa16yZkrdK_MM2u06qiOhwQk2NMu3YOnzCdjsuDBFcEbKOcx4ovtPDJi_MffOsfNcGep2MpsoPDXMgkC29y3ti0ZPL8TPFTTxh7SifWuLMmJh_EwLm3rJhJIVP55YYw"/>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">Eleanor Pena</p>
                            <p className="text-xs text-slate-500">pena.nancy@yahoo.com</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600">5818715443YH</td>
                      <td className="px-6 py-4 text-sm text-slate-600">USD</td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-800">120,500.<sup>00</sup></td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-800">146,818.<sup>67</sup></td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-600 uppercase border border-blue-100">
                            <span className="w-1 h-1 bg-blue-600 rounded-full mr-1"></span> Regular Savings
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-orange-50 text-orange-600 uppercase border border-orange-100">
                            <span className="w-1 h-1 bg-orange-600 rounded-full mr-1"></span> Lump Sum
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-slate-400 group-hover:text-blue-600">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                        </button>
                      </td>
                    </tr>
                    {/* Row 4 */}
                    <tr className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">JB</div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">Jerome Bell</p>
                            <p className="text-xs text-slate-500">jerome.b@hotmail.com</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600">4678871580YT</td>
                      <td className="px-6 py-4 text-sm text-slate-600">USD</td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-800">105,890.<sup>44</sup></td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-800">129,628.<sup>12</sup></td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-600 uppercase border border-blue-100">
                            <span className="w-1 h-1 bg-blue-600 rounded-full mr-1"></span> Regular Savings
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-600 uppercase border border-teal-100">
                            <span className="w-1 h-1 bg-teal-600 rounded-full mr-1"></span> Insurance
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-slate-400 group-hover:text-blue-600">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                        </button>
                      </td>
                    </tr>
                    {/* Row 5 */}
                    <tr className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <img alt="Albert" className="w-9 h-9 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBbt2Ae9mn4Ywd6PVIvmyLW3KnlkI_zt8HvH_oChvxa1O8IySrcvJuAcR8xvGRCT64ww_lta_gBF8BRfq3rrMoDbDsDmE3w7gi1roUQtHCtsseLk7qkOT-emnnBaoCyNVW-qnAuhXr4R-gZMG37Ee1h6abg44tEjhk0u_u3qyCFGBTRcB2BetwFJwGFsDeWbuOYO76Lr1CEkzpIOnZgahIoH9h1TWQVx02tyKRGTNOfFHIJrDNtVSicc0uHbtU90CFfDr-ogq-RZes"/>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">Albert Flores</p>
                            <p className="text-xs text-slate-500">albert.flores@schmidit.org</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600">4218782480YT</td>
                      <td className="px-6 py-4 text-sm text-slate-600">USD</td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-800">94,560.<sup>00</sup></td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-800">101,791.<sup>88</sup></td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-600 uppercase border border-teal-100">
                          <span className="w-1 h-1 bg-teal-600 rounded-full mr-1"></span> Insurance
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-slate-400 group-hover:text-blue-600">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {/* Table Footer: Pagination */}
              <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-white">
                <div className="flex items-center space-x-2 text-sm text-slate-500">
                  <span>Show result:</span>
                  <select className="border-0 bg-transparent py-0 pl-1 pr-8 text-sm font-bold text-slate-800 focus:ring-0 cursor-pointer">
                    <option>10</option>
                    <option>20</option>
                    <option>50</option>
                  </select>
                </div>
                <div className="flex items-center space-x-1">
                  <button className="p-2 text-slate-400 hover:text-slate-600 disabled:opacity-30" disabled>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7"></path></svg>
                  </button>
                  <button className="w-8 h-8 flex items-center justify-center rounded-md text-xs font-bold bg-blue-50 text-blue-600">1</button>
                  <button className="w-8 h-8 flex items-center justify-center rounded-md text-xs font-bold text-slate-500 hover:bg-slate-50">2</button>
                  <button className="w-8 h-8 flex items-center justify-center rounded-md text-xs font-bold text-slate-500 hover:bg-slate-50">3</button>
                  <button className="w-8 h-8 flex items-center justify-center rounded-md text-xs font-bold text-slate-500 hover:bg-slate-50">4</button>
                  <span className="px-2 text-slate-400">...</span>
                  <button className="w-8 h-8 flex items-center justify-center rounded-md text-xs font-bold text-slate-500 hover:bg-slate-50">82</button>
                  <button className="p-2 text-slate-400 hover:text-slate-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"></path></svg>
                  </button>
                </div>
              </div>
            </section>
            {/* END: Clients Table Card */}
          </div>
        </main>
      </div>
    </>
  );
}
