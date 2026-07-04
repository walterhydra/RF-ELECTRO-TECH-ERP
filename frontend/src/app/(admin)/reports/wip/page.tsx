"use client";

import React, { useEffect, useState } from "react";
import { Download, RefreshCw, BarChart2 } from "lucide-react";

export default function WipPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const res = await fetch("http://localhost:3001/api/v1/reports/wip", {
        headers,
      });
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const exportCsv = () => {
    if (data.length === 0) return;
    const headers = ["Stage Name", "Total Active Lots", "Total Quantity"];
    const csvContent = [
      headers.join(","),
      ...data.map((r) => `${r.stageName},${r.totalLots},${r.totalQty}`),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `wip_report_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart2 className="text-cyan-600 w-6 h-6" /> Pending WIP
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time work-in-progress inventory across all stages.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchReport}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-lg text-xs flex items-center gap-2 shadow-sm font-bold"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />{" "}
            Refresh
          </button>
          <button
            onClick={exportCsv}
            className="bg-cyan-50 border border-cyan-200 hover:bg-cyan-100 text-cyan-700 px-3 py-2 rounded-lg text-xs flex items-center gap-2 shadow-sm font-bold"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs">
              <tr>
                <th className="px-6 py-4 font-semibold">Process Stage</th>
                <th className="px-6 py-4 font-semibold text-right">
                  Active Lots
                </th>
                <th className="px-6 py-4 font-semibold text-right text-cyan-700">
                  Total WIP Qty
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={3} className="text-center py-8 text-slate-500">
                    Loading data...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-8 text-slate-500">
                    No active WIP found
                  </td>
                </tr>
              ) : (
                data.map((row, i) => (
                  <tr
                    key={i}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-slate-900 font-bold">
                      {row.stageName}
                    </td>
                    <td className="px-6 py-4 text-right">{row.totalLots}</td>
                    <td className="px-6 py-4 text-right text-cyan-600 font-bold">
                      {row.totalQty}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
