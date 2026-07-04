"use client";

import React, { useState, useEffect } from "react";
import {
  Cpu,
  Plus,
  Search,
  Edit2,
  CheckCircle2,
  XCircle,
  Layers,
  ShieldCheck,
  FileText,
  AlertCircle,
  Info,
  History,
  Printer,
  GitBranch,
  ArrowRight,
  Check,
  Eye,
  Clock,
  FileSpreadsheet,
} from "lucide-react";

interface ProcessFlowMaster {
  id: string;
  name: string;
  totalSteps?: number;
  steps?: {
    stepOrder: number;
    stage: { name: string; code?: string | null };
  }[];
}

interface ProductSpec {
  id: string;
  specCardNo: string;
  name: string;
  code: string;
  customerName?: string;
  pcbSize: string;
  layers: number;
  thicknessMm: number;
  copperWeight: string;
  solderMask: string;
  legend: string;
  surfaceFinish: string;
  materialType: string;
  panelSize?: string;
  qtyPerPanel: number;
  specialInstructions?: string;
  isActive: boolean;
  revisionNo?: string;
  processFlowId?: string;
  processFlowName?: string;
  processFlow?: ProcessFlowMaster;
  isCurrentRevision?: boolean;
  revisionReason?: string;
  createdAt?: string;
}

const INITIAL_FLOWS: ProcessFlowMaster[] = [
  {
    id: "flow-1",
    name: "Standard 10-Stage Multilayer Flow",
    totalSteps: 10,
    steps: [
      {
        stepOrder: 1,
        stage: { name: "CAM & Gerber Verification", code: "CAM" },
      },
      { stepOrder: 2, stage: { name: "CNC Material Cutting", code: "CUT" } },
      { stepOrder: 3, stage: { name: "CNC Drilling & Routing", code: "DRL" } },
      {
        stepOrder: 4,
        stage: { name: "Electroless Copper / Plating", code: "PLT" },
      },
      {
        stepOrder: 5,
        stage: { name: "Dry Film Imaging & Etching", code: "ETCH" },
      },
      {
        stepOrder: 6,
        stage: { name: "AOI (Automated Optical Inspection)", code: "AOI" },
      },
      { stepOrder: 7, stage: { name: "LPI Solder Mask & Curing", code: "SM" } },
      {
        stepOrder: 8,
        stage: { name: "Legend / Component Silkscreen", code: "LEG" },
      },
      {
        stepOrder: 9,
        stage: { name: "Surface Finish (ENIG / HASL)", code: "FIN" },
      },
      {
        stepOrder: 10,
        stage: { name: "Final QC & Vacuum Packaging", code: "FQC" },
      },
    ],
  },
  {
    id: "flow-2",
    name: "4-Layer Quick-Turn Routing Flow",
    totalSteps: 8,
    steps: [
      {
        stepOrder: 1,
        stage: { name: "CAM & Gerber Verification", code: "CAM" },
      },
      { stepOrder: 2, stage: { name: "CNC Material Cutting", code: "CUT" } },
      { stepOrder: 3, stage: { name: "CNC Drilling & Routing", code: "DRL" } },
      {
        stepOrder: 4,
        stage: { name: "Electroless Copper / Plating", code: "PLT" },
      },
      {
        stepOrder: 5,
        stage: { name: "Dry Film Imaging & Etching", code: "ETCH" },
      },
      {
        stepOrder: 6,
        stage: { name: "AOI (Automated Optical Inspection)", code: "AOI" },
      },
      { stepOrder: 7, stage: { name: "LPI Solder Mask & Curing", code: "SM" } },
      {
        stepOrder: 8,
        stage: { name: "Final QC & Vacuum Packaging", code: "FQC" },
      },
    ],
  },
];

const INITIAL_PRODUCTS: ProductSpec[] = [
  {
    id: "1",
    specCardNo: "D001",
    revisionNo: "Rev-01",
    isCurrentRevision: true,
    revisionReason:
      "Updated impedance control tolerance on internal layer pairs.",
    name: "Main Motherboard V2 - Industrial Controller",
    code: "PCB-IND-MB02",
    customerName: "Apex Electronics Ltd",
    pcbSize: "180x120 mm",
    layers: 4,
    thicknessMm: 1.6,
    copperWeight: "1oz",
    solderMask: "Matte Green",
    legend: "White",
    surfaceFinish: "ENIG (Immersion Gold)",
    materialType: "FR4 High-TG (TG 170+)",
    panelSize: "360x240 mm",
    qtyPerPanel: 4,
    specialInstructions:
      "Impedance controlled traces on Layer 2 & 3. 50 ohm differential pairs.",
    processFlowId: "flow-1",
    processFlow: INITIAL_FLOWS[0],
    isActive: true,
    createdAt: "2026-06-15T10:00:00Z",
  },
  {
    id: "1-old",
    specCardNo: "D001",
    revisionNo: "Rev-00",
    isCurrentRevision: false,
    revisionReason: "Initial specification baseline release.",
    name: "Main Motherboard V1 - Industrial Controller",
    code: "PCB-IND-MB01",
    customerName: "Apex Electronics Ltd",
    pcbSize: "180x120 mm",
    layers: 4,
    thicknessMm: 1.6,
    copperWeight: "1oz",
    solderMask: "Green",
    legend: "White",
    surfaceFinish: "HASL - Lead Free",
    materialType: "FR4 Standard (TG 130-140)",
    panelSize: "360x240 mm",
    qtyPerPanel: 4,
    specialInstructions: "Standard routing.",
    processFlowId: "flow-1",
    processFlow: INITIAL_FLOWS[0],
    isActive: true,
    createdAt: "2026-05-10T08:30:00Z",
  },
  {
    id: "2",
    specCardNo: "D002",
    revisionNo: "Rev-00",
    isCurrentRevision: true,
    revisionReason: "Initial specification creation.",
    name: "High Power LED Driver Module",
    code: "PCB-LED-DRV01",
    customerName: "Zenith Aerospace Systems",
    pcbSize: "90x45 mm",
    layers: 2,
    thicknessMm: 1.2,
    copperWeight: "2oz",
    solderMask: "Matte Black",
    legend: "White",
    surfaceFinish: "HASL - Lead Free",
    materialType: "Aluminum Core",
    panelSize: "270x180 mm",
    qtyPerPanel: 12,
    specialInstructions:
      "High thermal dissipation requirement. Hipot test 1.5kV.",
    processFlowId: "flow-2",
    processFlow: INITIAL_FLOWS[1],
    isActive: true,
    createdAt: "2026-06-20T14:15:00Z",
  },
  {
    id: "3",
    specCardNo: "D003",
    revisionNo: "Rev-00",
    isCurrentRevision: true,
    revisionReason: "Initial RF specification.",
    name: "RF Transceiver Board 5G V1.4",
    code: "PCB-RF-5G04",
    customerName: "Orbit Medical Devices",
    pcbSize: "110x85 mm",
    layers: 6,
    thicknessMm: 1.0,
    copperWeight: "0.5oz",
    solderMask: "Blue",
    legend: "Yellow",
    surfaceFinish: "Immersion Silver",
    materialType: "Rogers 4350B / High Frequency",
    panelSize: "220x170 mm",
    qtyPerPanel: 4,
    specialInstructions:
      "Strict dielectric thickness control. No solder mask over RF test points.",
    processFlowId: "flow-1",
    processFlow: INITIAL_FLOWS[0],
    isActive: true,
    createdAt: "2026-06-25T11:45:00Z",
  },
];

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductSpec[]>(INITIAL_PRODUCTS);
  const [flows, setFlows] = useState<ProcessFlowMaster[]>(INITIAL_FLOWS);
  const [searchTerm, setSearchTerm] = useState("");
  const [showArchivedRevs, setShowArchivedRevs] = useState(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isViewCardModalOpen, setIsViewCardModalOpen] = useState(false);
  const [isNewRevModalOpen, setIsNewRevModalOpen] = useState(false);

  // Selected targets
  const [editingProduct, setEditingProduct] = useState<ProductSpec | null>(
    null,
  );
  const [selectedProductForView, setSelectedProductForView] =
    useState<ProductSpec | null>(null);
  const [selectedProductForHistory, setSelectedProductForHistory] =
    useState<ProductSpec | null>(null);
  const [revisionHistoryList, setRevisionHistoryList] = useState<ProductSpec[]>(
    [],
  );
  const [newRevReason, setNewRevReason] = useState("");

  // Form Data
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    customerName: "Apex Electronics Ltd",
    pcbSize: "100x100 mm",
    layers: 2,
    thicknessMm: 1.6,
    copperWeight: "1oz",
    solderMask: "Green",
    legend: "White",
    surfaceFinish: "ENIG (Immersion Gold)",
    materialType: "FR4 Standard (TG 130-140)",
    panelSize: "200x200 mm",
    qtyPerPanel: 4,
    specialInstructions: "",
    processFlowId: "flow-1",
    isActive: true,
  });
  const [error, setError] = useState("");

  useEffect(() => {
    // Fetch Products
    fetch("http://localhost:3001/api/v1/products")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setProducts(
            data.map((item: any) => ({
              ...item,
              customerName:
                item.customer?.companyName ||
                item.customerName ||
                "Apex Electronics Ltd",
              revisionNo: item.revisionNo || "Rev-00",
              isCurrentRevision: item.isCurrentRevision !== false,
            })),
          );
        }
      })
      .catch(() => {});

    // Fetch Process Flows
    fetch("http://localhost:3001/api/v1/processes/flows")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setFlows(data);
        }
      })
      .catch(() => {});
  }, []);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      code: "",
      customerName: "Apex Electronics Ltd",
      pcbSize: "100x100 mm",
      layers: 4,
      thicknessMm: 1.6,
      copperWeight: "1oz",
      solderMask: "Green",
      legend: "White",
      surfaceFinish: "ENIG (Immersion Gold)",
      materialType: "FR4 High-TG (TG 170+)",
      panelSize: "300x200 mm",
      qtyPerPanel: 6,
      specialInstructions: "",
      processFlowId: flows[0]?.id || "flow-1",
      isActive: true,
    });
    setError("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product: ProductSpec) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      code: product.code,
      customerName: product.customerName || "Apex Electronics Ltd",
      pcbSize: product.pcbSize,
      layers: product.layers,
      thicknessMm: product.thicknessMm,
      copperWeight: product.copperWeight,
      solderMask: product.solderMask,
      legend: product.legend,
      surfaceFinish: product.surfaceFinish,
      materialType: product.materialType,
      panelSize: product.panelSize || "",
      qtyPerPanel: product.qtyPerPanel,
      specialInstructions: product.specialInstructions || "",
      processFlowId: product.processFlowId || flows[0]?.id || "flow-1",
      isActive: product.isActive,
    });
    setError("");
    setIsModalOpen(true);
  };

  const handleOpenHistory = async (product: ProductSpec) => {
    setSelectedProductForHistory(product);
    try {
      const res = await fetch(
        `http://localhost:3001/api/v1/products/${product.id}/revisions`,
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setRevisionHistoryList(data);
          setIsHistoryModalOpen(true);
          return;
        }
      }
    } catch {}

    // Fallback filter from local state
    const localRevs = products.filter(
      (p) => p.specCardNo === product.specCardNo,
    );
    setRevisionHistoryList(localRevs.length > 0 ? localRevs : [product]);
    setIsHistoryModalOpen(true);
  };

  const handleOpenNewRevision = (product: ProductSpec) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      code: product.code,
      customerName: product.customerName || "Apex Electronics Ltd",
      pcbSize: product.pcbSize,
      layers: product.layers,
      thicknessMm: product.thicknessMm,
      copperWeight: product.copperWeight,
      solderMask: product.solderMask,
      legend: product.legend,
      surfaceFinish: product.surfaceFinish,
      materialType: product.materialType,
      panelSize: product.panelSize || "",
      qtyPerPanel: product.qtyPerPanel,
      specialInstructions: product.specialInstructions || "",
      processFlowId: product.processFlowId || flows[0]?.id || "flow-1",
      isActive: true,
    });
    setNewRevReason("");
    setError("");
    setIsNewRevModalOpen(true);
  };

  const handleViewCard = (product: ProductSpec) => {
    // Attach flow details if missing
    let fullProd = { ...product };
    if (!fullProd.processFlow && fullProd.processFlowId) {
      const foundFlow = flows.find((f) => f.id === fullProd.processFlowId);
      if (foundFlow) fullProd.processFlow = foundFlow;
    }
    setSelectedProductForView(fullProd);
    setIsViewCardModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      setError("Product Name and Code are required");
      return;
    }

    try {
      const method = editingProduct ? "PATCH" : "POST";
      const url = editingProduct
        ? `http://localhost:3001/api/v1/products/${editingProduct.id}`
        : "http://localhost:3001/api/v1/products";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, createdById: "user-1" }),
      });

      if (res.ok) {
        const saved = await res.json();
        const foundFlow = flows.find((f) => f.id === formData.processFlowId);
        const formatted = {
          ...saved,
          customerName: formData.customerName,
          revisionNo: saved.revisionNo || "Rev-00",
          isCurrentRevision: true,
          processFlow: foundFlow || saved.processFlow,
        };
        if (editingProduct) {
          setProducts(products.map((p) => (p.id === saved.id ? formatted : p)));
        } else {
          setProducts([formatted, ...products]);
        }
        setIsModalOpen(false);
      } else {
        // Fallback state update
        const foundFlow = flows.find((f) => f.id === formData.processFlowId);
        if (editingProduct) {
          setProducts(
            products.map((p) =>
              p.id === editingProduct.id
                ? { ...p, ...formData, processFlow: foundFlow }
                : p,
            ),
          );
        } else {
          const nextCard = `D${String(new Set(products.map((p) => p.specCardNo)).size + 1).padStart(3, "0")}`;
          const newProd: ProductSpec = {
            id: String(Date.now()),
            specCardNo: nextCard,
            revisionNo: "Rev-00",
            isCurrentRevision: true,
            revisionReason: "Initial specification creation.",
            createdAt: new Date().toISOString(),
            ...formData,
            processFlow: foundFlow,
          };
          setProducts([newProd, ...products]);
        }
        setIsModalOpen(false);
      }
    } catch {
      const foundFlow = flows.find((f) => f.id === formData.processFlowId);
      if (editingProduct) {
        setProducts(
          products.map((p) =>
            p.id === editingProduct.id
              ? { ...p, ...formData, processFlow: foundFlow }
              : p,
          ),
        );
      } else {
        const nextCard = `D${String(new Set(products.map((p) => p.specCardNo)).size + 1).padStart(3, "0")}`;
        const newProd: ProductSpec = {
          id: String(Date.now()),
          specCardNo: nextCard,
          revisionNo: "Rev-00",
          isCurrentRevision: true,
          revisionReason: "Initial specification creation.",
          createdAt: new Date().toISOString(),
          ...formData,
          processFlow: foundFlow,
        };
        setProducts([newProd, ...products]);
      }
      setIsModalOpen(false);
    }
  };

  const handleSaveNewRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (!newRevReason.trim()) {
      setError("Please provide a reason or description for this new revision.");
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:3001/api/v1/products/${editingProduct.id}/revisions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            revisionReason: newRevReason,
            createdById: "user-1",
          }),
        },
      );

      if (res.ok) {
        const newRev = await res.json();
        const foundFlow = flows.find((f) => f.id === formData.processFlowId);
        const formatted = {
          ...newRev,
          customerName: formData.customerName,
          processFlow: foundFlow || newRev.processFlow,
        };
        // Mark previous revisions of same spec card as not current
        const updated = products.map((p) =>
          p.specCardNo === editingProduct.specCardNo
            ? { ...p, isCurrentRevision: false }
            : p,
        );
        setProducts([formatted, ...updated]);
        setIsNewRevModalOpen(false);
      } else {
        // Fallback local state revision creation
        const currentRevStr = editingProduct.revisionNo || "Rev-00";
        const revMatch = currentRevStr.match(/Rev-(\d+)/i);
        const nextRevNum = revMatch ? parseInt(revMatch[1], 10) + 1 : 1;
        const nextRevisionNo = `Rev-${String(nextRevNum).padStart(2, "0")}`;
        const foundFlow = flows.find((f) => f.id === formData.processFlowId);

        const newRevProd: ProductSpec = {
          ...editingProduct,
          id: String(Date.now()),
          revisionNo: nextRevisionNo,
          isCurrentRevision: true,
          revisionReason: newRevReason,
          createdAt: new Date().toISOString(),
          ...formData,
          processFlow: foundFlow,
        };

        const updated = products.map((p) =>
          p.specCardNo === editingProduct.specCardNo
            ? { ...p, isCurrentRevision: false }
            : p,
        );
        setProducts([newRevProd, ...updated]);
        setIsNewRevModalOpen(false);
      }
    } catch {
      const currentRevStr = editingProduct.revisionNo || "Rev-00";
      const revMatch = currentRevStr.match(/Rev-(\d+)/i);
      const nextRevNum = revMatch ? parseInt(revMatch[1], 10) + 1 : 1;
      const nextRevisionNo = `Rev-${String(nextRevNum).padStart(2, "0")}`;
      const foundFlow = flows.find((f) => f.id === formData.processFlowId);

      const newRevProd: ProductSpec = {
        ...editingProduct,
        id: String(Date.now()),
        revisionNo: nextRevisionNo,
        isCurrentRevision: true,
        revisionReason: newRevReason,
        createdAt: new Date().toISOString(),
        ...formData,
        processFlow: foundFlow,
      };

      const updated = products.map((p) =>
        p.specCardNo === editingProduct.specCardNo
          ? { ...p, isCurrentRevision: false }
          : p,
      );
      setProducts([newRevProd, ...updated]);
      setIsNewRevModalOpen(false);
    }
  };

  const toggleStatus = async (id: string) => {
    try {
      await fetch(`http://localhost:3001/api/v1/products/${id}/status`, {
        method: "PATCH",
      });
    } catch {}
    setProducts(
      products.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p)),
    );
  };

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.specCardNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.customerName &&
        p.customerName.toLowerCase().includes(searchTerm.toLowerCase()));

    if (showArchivedRevs) {
      return matchesSearch;
    }
    return matchesSearch && p.isCurrentRevision !== false;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-wide">
              Product Master (PCB Spec Cards)
            </h1>
            <p className="text-xs text-slate-500 font-mono mt-1">
              CAM GERBER SPECIFICATIONS • LAYER STACKUPS • REVISION TRACEABILITY
              • FLOW ROUTING
            </p>
          </div>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all shadow-sm hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          <span>New Spec Card</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3 flex-1 bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Spec Card # (e.g. D001), Product Name, PCB Code, or Customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent text-sm text-slate-900 placeholder-slate-500 w-full focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-3 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200">
          <label className="inline-flex items-center gap-2 text-xs text-slate-600 font-mono cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showArchivedRevs}
              onChange={(e) => setShowArchivedRevs(e.target.checked)}
              className="rounded bg-white border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
            <span>
              Show Old / Archived Revisions (
              {products.filter((p) => p.isCurrentRevision === false).length})
            </span>
          </label>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-mono uppercase text-slate-500">
                <th className="py-4 px-6 w-28">Spec Card #</th>
                <th className="py-4 px-6">Product Name & Code</th>
                <th className="py-4 px-6">Customer</th>
                <th className="py-4 px-6">Stackup & Specs</th>
                <th className="py-4 px-6">Routing Flow</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filtered.map((prod) => (
                <tr
                  key={prod.id}
                  className={`hover:bg-slate-50 transition-colors ${prod.isCurrentRevision === false ? "bg-slate-50/50 opacity-75" : ""}`}
                >
                  <td className="py-4 px-6 font-mono text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 px-2 py-1 rounded bg-white border border-slate-200 shadow-sm">
                        {prod.specCardNo}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          prod.isCurrentRevision !== false
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-500 border border-slate-200"
                        }`}
                      >
                        {prod.revisionNo || "Rev-00"}
                      </span>
                    </div>
                    {prod.isCurrentRevision === false && (
                      <span className="text-[10px] text-slate-500 font-mono block mt-1">
                        ARCHIVED
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900">
                        {prod.name}
                      </span>
                      <span className="text-xs font-mono text-slate-500 mt-0.5">
                        {prod.code}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6 font-medium text-slate-700">
                    {prod.customerName || "—"}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
                      <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-bold">
                        {prod.layers}L
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
                        {prod.thicknessMm}mm
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
                        {prod.copperWeight}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 truncate max-w-[120px]">
                        {prod.surfaceFinish.split(" ")[0]}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Mask: {prod.solderMask} | Legend: {prod.legend}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 shadow-sm text-xs text-slate-700 font-mono">
                      <GitBranch className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="truncate max-w-[140px]">
                        {flows.find((f) => f.id === prod.processFlowId)?.name ||
                          prod.processFlow?.name ||
                          "Standard Routing"}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <button
                      onClick={() => toggleStatus(prod.id)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                        prod.isActive
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                          : "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                      }`}
                    >
                      {prod.isActive ? (
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
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleViewCard(prod)}
                        title="View & Print PCB Specification Card"
                        className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-blue-600 hover:text-blue-700 rounded-lg transition-colors inline-flex items-center gap-1 text-xs font-medium shadow-sm"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="hidden lg:inline">Card</span>
                      </button>

                      <button
                        onClick={() => handleOpenHistory(prod)}
                        title="View Revision History & Traceability"
                        className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-sky-600 hover:text-sky-700 rounded-lg transition-colors inline-flex items-center gap-1 text-xs font-medium shadow-sm"
                      >
                        <History className="w-3.5 h-3.5" />
                        <span className="hidden lg:inline">Revs</span>
                      </button>

                      {prod.isCurrentRevision !== false && (
                        <button
                          onClick={() => handleOpenNewRevision(prod)}
                          title="Create New Revision (Rev-XX)"
                          className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-emerald-600 hover:text-emerald-700 rounded-lg transition-colors inline-flex items-center gap-1 text-xs font-medium shadow-sm"
                        >
                          <GitBranch className="w-3.5 h-3.5" />
                          <span className="hidden lg:inline">+Rev</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleOpenEdit(prod)}
                        title="Edit Spec Card"
                        className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 rounded-lg transition-colors inline-flex items-center gap-1 text-xs font-medium shadow-sm"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No product spec cards found matching "{searchTerm}".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-xl space-y-6 my-8 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold">
                  {editingProduct ? "ED" : "NEW"}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {editingProduct
                      ? "Edit PCB Spec Card"
                      : "Create PCB Spec Card"}
                  </h2>
                  <p className="text-xs text-slate-500 font-mono">
                    {editingProduct
                      ? `SPEC CARD: ${editingProduct.specCardNo} (${editingProduct.revisionNo || "Rev-00"})`
                      : "AUTO-ASSIGNING SEQUENTIAL SPEC CARD NUMBER (D00X)"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-900 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-500 mb-1">
                    PRODUCT NAME *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g. Main Motherboard V2"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-500 mb-1">
                    PRODUCT CODE *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value })
                    }
                    placeholder="e.g. PCB-IND-001"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-500 mb-1">
                    CUSTOMER
                  </label>
                  <select
                    value={formData.customerName}
                    onChange={(e) =>
                      setFormData({ ...formData, customerName: e.target.value })
                    }
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="Apex Electronics Ltd">
                      Apex Electronics Ltd
                    </option>
                    <option value="Zenith Aerospace Systems">
                      Zenith Aerospace Systems
                    </option>
                    <option value="Orbit Medical Devices">
                      Orbit Medical Devices
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-500 mb-1">
                    MANUFACTURING PROCESS FLOW ROUTING *
                  </label>
                  <select
                    value={formData.processFlowId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        processFlowId: e.target.value,
                      })
                    }
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-blue-600 font-bold font-mono text-xs focus:outline-none focus:border-blue-500"
                  >
                    {flows.map((fl) => (
                      <option key={fl.id} value={fl.id}>
                        {fl.name} ({fl.totalSteps || fl.steps?.length || 10}{" "}
                        Stages)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* PCB Specifications Grid */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <span className="text-[11px] font-mono text-slate-500 font-bold uppercase tracking-wider block">
                  STACKUP & MANUFACTURING PARAMETERS
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-500 mb-1">
                      LAYERS
                    </label>
                    <select
                      value={formData.layers}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          layers: Number(e.target.value),
                        })
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 text-xs focus:border-blue-500 focus:outline-none"
                    >
                      {[1, 2, 4, 6, 8, 10, 12, 16].map((l) => (
                        <option key={l} value={l}>
                          {l} Layer{l > 1 ? "s" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-slate-500 mb-1">
                      THICKNESS
                    </label>
                    <select
                      value={formData.thicknessMm}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          thicknessMm: Number(e.target.value),
                        })
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 text-xs focus:border-blue-500 focus:outline-none"
                    >
                      {[0.4, 0.8, 1.0, 1.2, 1.6, 2.0, 2.4, 3.2].map((t) => (
                        <option key={t} value={t}>
                          {t} mm
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-slate-500 mb-1">
                      COPPER
                    </label>
                    <select
                      value={formData.copperWeight}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          copperWeight: e.target.value,
                        })
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 text-xs focus:border-blue-500 focus:outline-none"
                    >
                      {["0.5oz", "1oz", "2oz", "3oz", "4oz"].map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-slate-500 mb-1">
                      FINISH
                    </label>
                    <select
                      value={formData.surfaceFinish}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          surfaceFinish: e.target.value,
                        })
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 text-xs truncate focus:border-blue-500 focus:outline-none"
                    >
                      {[
                        "ENIG (Immersion Gold)",
                        "HASL - Lead Free",
                        "HASL - Leaded",
                        "Immersion Tin",
                        "Immersion Silver",
                        "OSP",
                      ].map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-500 mb-1">
                      SOLDER MASK
                    </label>
                    <select
                      value={formData.solderMask}
                      onChange={(e) =>
                        setFormData({ ...formData, solderMask: e.target.value })
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 text-xs focus:border-blue-500 focus:outline-none"
                    >
                      {[
                        "Green",
                        "Blue",
                        "Black",
                        "Red",
                        "White",
                        "Yellow",
                        "Matte Green",
                        "Matte Black",
                        "None",
                      ].map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-slate-500 mb-1">
                      LEGEND (SILK)
                    </label>
                    <select
                      value={formData.legend}
                      onChange={(e) =>
                        setFormData({ ...formData, legend: e.target.value })
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 text-xs focus:border-blue-500 focus:outline-none"
                    >
                      {["White", "Black", "Yellow", "None"].map((lg) => (
                        <option key={lg} value={lg}>
                          {lg}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-slate-500 mb-1">
                      MATERIAL TYPE
                    </label>
                    <select
                      value={formData.materialType}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          materialType: e.target.value,
                        })
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 text-xs truncate focus:border-blue-500 focus:outline-none"
                    >
                      {[
                        "FR4 Standard (TG 130-140)",
                        "FR4 High-TG (TG 170+)",
                        "Aluminum Core",
                        "Rogers 4350B / High Frequency",
                        "Polyimide Flex / Rigid-Flex",
                      ].map((mt) => (
                        <option key={mt} value={mt}>
                          {mt}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-slate-500 mb-1">
                      QTY / PANEL
                    </label>
                    <input
                      type="number"
                      value={formData.qtyPerPanel}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          qtyPerPanel: Number(e.target.value),
                        })
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-mono text-xs focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-500 mb-1">
                    SINGLE PCB SIZE
                  </label>
                  <input
                    type="text"
                    value={formData.pcbSize}
                    onChange={(e) =>
                      setFormData({ ...formData, pcbSize: e.target.value })
                    }
                    placeholder="e.g. 100x100 mm"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-500 mb-1">
                    PRODUCTION PANEL SIZE
                  </label>
                  <input
                    type="text"
                    value={formData.panelSize}
                    onChange={(e) =>
                      setFormData({ ...formData, panelSize: e.target.value })
                    }
                    placeholder="e.g. 360x240 mm (Standard Panel)"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-500 mb-1">
                  SPECIAL CAM / ROUTING INSTRUCTIONS
                </label>
                <input
                  type="text"
                  value={formData.specialInstructions}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      specialInstructions: e.target.value,
                    })
                  }
                  placeholder="e.g. 50 ohm impedance control on L2/L3"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 sticky bottom-0 bg-white z-10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm"
                >
                  {editingProduct ? "Update Spec Card" : "Save PCB Spec Card"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Revision History Modal */}
      {isHistoryModalOpen && selectedProductForHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full p-6 shadow-xl space-y-6 my-8 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Revision History & Traceability
                  </h2>
                  <p className="text-xs text-slate-500 font-mono">
                    SPEC CARD NUMBER:{" "}
                    <span className="text-blue-600 font-bold">
                      {selectedProductForHistory.specCardNo}
                    </span>{" "}
                    ({selectedProductForHistory.code})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="text-slate-400 hover:text-slate-900 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-100 text-blue-700 p-3 rounded-xl text-xs flex items-center gap-2.5">
              <Info className="w-4 h-4 shrink-0" />
              <span>
                <strong>Traceability Notice:</strong> Per ERP compliance rules,
                all previous revision specifications remain preserved and
                immutable for historical audit and production traceability.
              </span>
            </div>

            <div className="space-y-4">
              {revisionHistoryList.map((rev, idx) => (
                <div
                  key={rev.id || idx}
                  className={`p-4 rounded-xl border transition-all ${
                    rev.isCurrentRevision !== false
                      ? "bg-white border-green-200 shadow-sm"
                      : "bg-slate-50 border-slate-200 opacity-80"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-1 rounded text-xs font-mono font-bold ${
                          rev.isCurrentRevision !== false
                            ? "bg-green-100 text-green-700 border border-green-200"
                            : "bg-slate-200 text-slate-600 border border-slate-300"
                        }`}
                      >
                        {rev.revisionNo || "Rev-00"}
                      </span>
                      <span className="font-semibold text-slate-900 text-sm">
                        {rev.name}
                      </span>
                      {rev.isCurrentRevision !== false && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
                          CURRENT PRODUCTION REV
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        {rev.createdAt
                          ? new Date(rev.createdAt).toLocaleDateString()
                          : "Active Baseline"}
                      </span>
                      <button
                        onClick={() => {
                          setIsHistoryModalOpen(false);
                          handleViewCard(rev);
                        }}
                        className="ml-2 px-2.5 py-1 rounded bg-white border border-slate-200 hover:bg-slate-50 text-blue-600 text-xs font-mono inline-flex items-center gap-1 transition-colors shadow-sm"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View Card</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono text-slate-700 mb-3">
                    <div>
                      <span className="text-slate-500 block text-[10px]">
                        STACKUP:
                      </span>
                      {rev.layers}L | {rev.thicknessMm}mm | {rev.copperWeight}
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">
                        FINISH & MASK:
                      </span>
                      {rev.surfaceFinish.split(" ")[0]} | {rev.solderMask}
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">
                        MATERIAL:
                      </span>
                      <span className="truncate block">{rev.materialType}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">
                        FLOW ROUTING:
                      </span>
                      <span className="text-blue-600 font-bold">
                        {flows.find((f) => f.id === rev.processFlowId)?.name ||
                          rev.processFlow?.name ||
                          "Standard Flow"}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <span className="text-slate-500 font-mono text-[10px] uppercase block mb-0.5">
                      REVISION REASON / CHANGE LOG:
                    </span>
                    <span className="text-slate-700 italic">
                      {rev.revisionReason || "Initial release specification."}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create New Revision Modal */}
      {isNewRevModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-xl space-y-6 my-8 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center text-green-600">
                  <GitBranch className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Create New PCB Specification Revision
                  </h2>
                  <p className="text-xs text-slate-500 font-mono">
                    UPGRADING SPEC CARD:{" "}
                    <span className="text-blue-600 font-bold">
                      {editingProduct.specCardNo}
                    </span>{" "}
                    FROM{" "}
                    <span className="text-slate-700">
                      {editingProduct.revisionNo || "Rev-00"}
                    </span>{" "}
                    TO NEXT REVISION
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsNewRevModalOpen(false)}
                className="text-slate-400 hover:text-slate-900 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form
              onSubmit={handleSaveNewRevision}
              className="space-y-4 text-sm"
            >
              <div className="bg-green-50 border border-green-200 p-4 rounded-xl space-y-2">
                <label className="block text-xs font-mono font-bold text-green-700 uppercase">
                  REVISION REASON / ENGINEERING CHANGE ORDER (ECO) DESCRIPTION *
                </label>
                <textarea
                  required
                  rows={2}
                  value={newRevReason}
                  onChange={(e) => setNewRevReason(e.target.value)}
                  placeholder="e.g., Changed copper thickness from 1oz to 2oz per ECO-2026-089. Updated routing impedance guidelines."
                  className="w-full bg-white border border-green-300 rounded-xl p-3 text-slate-900 text-xs focus:outline-none focus:border-green-500"
                />
                <p className="text-[11px] text-slate-500 italic">
                  Note: This description will be recorded in the immutable
                  revision log for ISO/TS traceability.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-500 mb-1">
                    PRODUCT NAME
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-500 mb-1">
                    MANUFACTURING PROCESS FLOW ROUTING
                  </label>
                  <select
                    value={formData.processFlowId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        processFlowId: e.target.value,
                      })
                    }
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-blue-600 font-bold font-mono text-xs focus:outline-none focus:border-blue-500"
                  >
                    {flows.map((fl) => (
                      <option key={fl.id} value={fl.id}>
                        {fl.name} ({fl.totalSteps || fl.steps?.length || 10}{" "}
                        Stages)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <span className="text-[11px] font-mono text-slate-500 font-bold uppercase tracking-wider block">
                  MODIFIABLE STACKUP & PCB PARAMETERS
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-500 mb-1">
                      LAYERS
                    </label>
                    <select
                      value={formData.layers}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          layers: Number(e.target.value),
                        })
                      }
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 text-xs"
                    >
                      {[1, 2, 4, 6, 8, 10, 12, 16].map((l) => (
                        <option key={l} value={l}>
                          {l} Layer{l > 1 ? "s" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-slate-500 mb-1">
                      THICKNESS
                    </label>
                    <select
                      value={formData.thicknessMm}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          thicknessMm: Number(e.target.value),
                        })
                      }
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 text-xs"
                    >
                      {[0.4, 0.8, 1.0, 1.2, 1.6, 2.0, 2.4, 3.2].map((t) => (
                        <option key={t} value={t}>
                          {t} mm
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-slate-500 mb-1">
                      COPPER
                    </label>
                    <select
                      value={formData.copperWeight}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          copperWeight: e.target.value,
                        })
                      }
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 text-xs"
                    >
                      {["0.5oz", "1oz", "2oz", "3oz", "4oz"].map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-slate-500 mb-1">
                      FINISH
                    </label>
                    <select
                      value={formData.surfaceFinish}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          surfaceFinish: e.target.value,
                        })
                      }
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 text-xs truncate"
                    >
                      {[
                        "ENIG (Immersion Gold)",
                        "HASL - Lead Free",
                        "HASL - Leaded",
                        "Immersion Tin",
                        "Immersion Silver",
                        "OSP",
                      ].map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-500 mb-1">
                      SOLDER MASK
                    </label>
                    <select
                      value={formData.solderMask}
                      onChange={(e) =>
                        setFormData({ ...formData, solderMask: e.target.value })
                      }
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 text-xs"
                    >
                      {[
                        "Green",
                        "Blue",
                        "Black",
                        "Red",
                        "White",
                        "Yellow",
                        "Matte Green",
                        "Matte Black",
                        "None",
                      ].map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-slate-500 mb-1">
                      LEGEND (SILK)
                    </label>
                    <select
                      value={formData.legend}
                      onChange={(e) =>
                        setFormData({ ...formData, legend: e.target.value })
                      }
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 text-xs"
                    >
                      {["White", "Black", "Yellow", "None"].map((lg) => (
                        <option key={lg} value={lg}>
                          {lg}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-slate-500 mb-1">
                      MATERIAL TYPE
                    </label>
                    <select
                      value={formData.materialType}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          materialType: e.target.value,
                        })
                      }
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 text-xs truncate"
                    >
                      {[
                        "FR4 Standard (TG 130-140)",
                        "FR4 High-TG (TG 170+)",
                        "Aluminum Core",
                        "Rogers 4350B / High Frequency",
                        "Polyimide Flex / Rigid-Flex",
                      ].map((mt) => (
                        <option key={mt} value={mt}>
                          {mt}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-slate-500 mb-1">
                      QTY / PANEL
                    </label>
                    <input
                      type="number"
                      value={formData.qtyPerPanel}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          qtyPerPanel: Number(e.target.value),
                        })
                      }
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-500 mb-1">
                  SPECIAL CAM / ROUTING INSTRUCTIONS
                </label>
                <input
                  type="text"
                  value={formData.specialInstructions}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      specialInstructions: e.target.value,
                    })
                  }
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 sticky bottom-0 bg-white z-10">
                <button
                  type="button"
                  onClick={() => setIsNewRevModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                >
                  <GitBranch className="w-4 h-4" />
                  <span>Commit New Revision</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View PCB Spec Card & Print Modal */}
      {isViewCardModalOpen && selectedProductForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full p-6 shadow-xl space-y-6 my-8 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            {/* Modal Header Actions - Hidden when printing */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 sticky top-0 bg-white z-10 print:hidden">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    PCB Manufacturing Spec Card Preview
                  </h2>
                  <p className="text-xs text-slate-500 font-mono">
                    READY FOR PRODUCTION / CAM PRINTING
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print / Save PDF</span>
                </button>
                <button
                  onClick={() => setIsViewCardModalOpen(false)}
                  className="text-slate-400 hover:text-slate-900 text-lg font-bold p-1 ml-2"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Area */}
            <div className="bg-white border-2 border-slate-200 p-8 rounded-xl text-slate-900 space-y-6 shadow-inner print:bg-white print:text-black print:border-black print:p-0 print:shadow-none font-sans">
              {/* Document Header */}
              <div className="border-b-2 border-slate-200 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:border-black">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-600 text-white font-black px-2.5 py-0.5 rounded text-xs font-mono tracking-widest uppercase print:bg-black print:text-white">
                      RF ELECTRO ERP
                    </span>
                    <span className="text-xs font-mono text-slate-500 print:text-black">
                      ISO 9001:2015 CERTIFIED PCB FACILITY
                    </span>
                  </div>
                  <h1 className="text-2xl font-black tracking-tight text-slate-900 mt-2 print:text-black">
                    PCB MANUFACTURING SPECIFICATION CARD
                  </h1>
                  <p className="text-xs text-slate-500 font-mono mt-0.5 print:text-black">
                    MASTER JOB ROUTING & CAM GERBER DATA SHEET
                  </p>
                </div>
                <div className="sm:text-right bg-slate-50 p-3 rounded-xl border border-slate-200 print:bg-transparent print:border-black">
                  <div className="text-xs font-mono text-slate-500 print:text-black">
                    SPEC CARD NUMBER
                  </div>
                  <div className="text-2xl font-mono font-black text-blue-600 print:text-black">
                    {selectedProductForView.specCardNo}
                  </div>
                  <div className="inline-block mt-1 px-2 py-0.5 rounded bg-green-100 text-green-700 font-mono text-xs font-bold print:bg-transparent print:text-black print:border print:border-black">
                    REVISION: {selectedProductForView.revisionNo || "Rev-00"}
                  </div>
                </div>
              </div>

              {/* Product & Customer Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 print:bg-transparent print:border-black">
                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase block print:text-black">
                    CUSTOMER NAME
                  </span>
                  <span className="text-sm font-bold text-slate-900 print:text-black">
                    {selectedProductForView.customerName ||
                      "Apex Electronics Ltd"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase block print:text-black">
                    PRODUCT CODE / PART NUMBER
                  </span>
                  <span className="text-sm font-bold font-mono text-blue-600 print:text-black">
                    {selectedProductForView.code}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase block print:text-black">
                    PRODUCT DESCRIPTION
                  </span>
                  <span className="text-sm font-medium text-slate-900 print:text-black">
                    {selectedProductForView.name}
                  </span>
                </div>
              </div>

              {/* Stackup & Technical Parameters Table */}
              <div className="space-y-2">
                <h3 className="text-xs font-mono font-bold text-blue-600 uppercase tracking-wider print:text-black">
                  1. TECHNICAL STACKUP & PCB PARAMETERS
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-4 gap-x-6 p-4 bg-white rounded-xl border border-slate-200 text-xs print:bg-transparent print:border-black font-mono">
                  <div>
                    <span className="text-slate-500 block text-[10px] print:text-black">
                      LAYER COUNT:
                    </span>
                    <span className="font-bold text-slate-900 text-sm print:text-black">
                      {selectedProductForView.layers} Layers (
                      {selectedProductForView.layers > 2
                        ? "Multilayer"
                        : "Standard"}
                      )
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] print:text-black">
                      BOARD THICKNESS:
                    </span>
                    <span className="font-bold text-slate-900 text-sm print:text-black">
                      {selectedProductForView.thicknessMm} mm (±10%)
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] print:text-black">
                      COPPER WEIGHT:
                    </span>
                    <span className="font-bold text-slate-900 text-sm print:text-black">
                      {selectedProductForView.copperWeight} Outer/Inner
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] print:text-black">
                      SURFACE FINISH:
                    </span>
                    <span className="font-bold text-blue-600 text-sm print:text-black">
                      {selectedProductForView.surfaceFinish}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] print:text-black">
                      SOLDER MASK COLOR:
                    </span>
                    <span className="font-bold text-slate-900 text-sm print:text-black">
                      {selectedProductForView.solderMask} (LPI)
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] print:text-black">
                      LEGEND (SILKSCREEN):
                    </span>
                    <span className="font-bold text-slate-900 text-sm print:text-black">
                      {selectedProductForView.legend}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] print:text-black">
                      BASE MATERIAL:
                    </span>
                    <span className="font-bold text-slate-900 text-sm print:text-black">
                      {selectedProductForView.materialType}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] print:text-black">
                      PANELIZATION:
                    </span>
                    <span className="font-bold text-slate-900 text-sm print:text-black">
                      {selectedProductForView.qtyPerPanel} pcs / panel
                    </span>
                  </div>
                </div>
              </div>

              {/* Manufacturing Flow Routing Sequence */}
              <div className="space-y-3">
                <h3 className="text-xs font-mono font-bold text-blue-600 uppercase tracking-wider print:text-black">
                  2. ASSIGNED MANUFACTURING PROCESS FLOW ROUTING
                </h3>
                <div className="p-4 bg-white rounded-xl border border-slate-200 print:bg-transparent print:border-black">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200 print:border-black">
                    <span className="text-xs font-bold text-slate-900 font-mono print:text-black">
                      FLOW MASTER:{" "}
                      {selectedProductForView.processFlow?.name ||
                        flows.find(
                          (f) => f.id === selectedProductForView.processFlowId,
                        )?.name ||
                        "Standard 10-Stage Multilayer Flow"}
                    </span>
                    <span className="text-xs font-mono text-slate-500 print:text-black">
                      TOTAL ROUTING STAGES:{" "}
                      {selectedProductForView.processFlow?.steps?.length || 10}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {(
                      selectedProductForView.processFlow?.steps ||
                      INITIAL_FLOWS[0].steps ||
                      []
                    ).map((step: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-2 rounded bg-slate-50 border border-slate-200 text-xs font-mono print:bg-transparent print:border-black"
                      >
                        <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 border border-blue-200 flex items-center justify-center font-bold text-[10px] shrink-0 print:border-black print:text-black">
                          {step.stepOrder || idx + 1}
                        </span>
                        <span className="font-semibold text-slate-900 truncate print:text-black">
                          {step.stage?.name || step.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Special CAM & Routing Instructions */}
              <div className="space-y-2">
                <h3 className="text-xs font-mono font-bold text-blue-600 uppercase tracking-wider print:text-black">
                  3. SPECIAL ENGINEERING & CAM INSTRUCTIONS
                </h3>
                <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs text-slate-600 font-mono italic print:bg-transparent print:border-black print:text-black">
                  {selectedProductForView.specialInstructions ||
                    "No special CAM instructions recorded. Follow standard IPC-A-600 Class 2 manufacturing tolerances."}
                </div>
              </div>

              {/* Revision Change Log block */}
              {selectedProductForView.revisionReason && (
                <div className="space-y-2">
                  <h3 className="text-xs font-mono font-bold text-blue-600 uppercase tracking-wider print:text-black">
                    4. LATEST REVISION NOTES (
                    {selectedProductForView.revisionNo || "Rev-00"})
                  </h3>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-600 font-mono print:bg-transparent print:border-black print:text-black">
                    {selectedProductForView.revisionReason}
                  </div>
                </div>
              )}

              {/* Sign-Off Block */}
              <div className="pt-8 border-t border-slate-200 grid grid-cols-3 gap-6 text-center font-mono text-xs print:border-black">
                <div className="border-t border-slate-300 pt-2 print:border-black">
                  <span className="block font-bold text-slate-900 print:text-black">
                    PREPARED BY
                  </span>
                  <span className="text-[10px] text-slate-500 print:text-black">
                    CAM / Engineering Dept
                  </span>
                </div>
                <div className="border-t border-slate-300 pt-2 print:border-black">
                  <span className="block font-bold text-slate-900 print:text-black">
                    QA APPROVED BY
                  </span>
                  <span className="text-[10px] text-slate-500 print:text-black">
                    Quality Assurance Mgr
                  </span>
                </div>
                <div className="border-t border-slate-300 pt-2 print:border-black">
                  <span className="block font-bold text-slate-900 print:text-black">
                    CUSTOMER SIGN-OFF
                  </span>
                  <span className="text-[10px] text-slate-500 print:text-black">
                    Authorized Signatory
                  </span>
                </div>
              </div>

              <div className="text-center text-[10px] font-mono text-slate-400 pt-4 print:text-black">
                CONFIDENTIAL — RF ELECTRO ERP MANUFACTURING SYSTEM — PRINTED ON{" "}
                {new Date().toLocaleDateString()}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 print:hidden">
              <button
                type="button"
                onClick={() => setIsViewCardModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
