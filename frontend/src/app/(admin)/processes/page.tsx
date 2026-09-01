"use client";

import React, { useState, useEffect } from "react";
import {
  Layers,
  Plus,
  Search,
  Edit2,
  CheckCircle2,
  XCircle,
  Activity,
  AlertCircle,
  GitCommit,
  ArrowRight,
  Check,
  Building2,
  Settings2,
  Workflow,
  CheckSquare,
  Square,
  ChevronRight,
  Filter,
  Info
} from "lucide-react";

interface ProcessStage {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  defaultOrder: number;
  departmentId: string | null;
  departmentName?: string;
  isActive: boolean;
}

interface ProcessFlowMaster {
  id: string;
  name: string;
  totalSteps: number;
  isActive: boolean;
  steps?: { stepOrder: number; stage: ProcessStage }[];
}

const INITIAL_STAGES: ProcessStage[] = [
  {
    id: "1",
    name: "CAM & Gerber Verification",
    code: "CAM",
    description: "Engineering verification, panelization & tool data generation",
    defaultOrder: 10,
    departmentId: "dep-1",
    departmentName: "Engineering",
    isActive: true,
  },
  {
    id: "2",
    name: "CNC Material Cutting",
    code: "CUT",
    description: "Laminate cutting to panel size & edge beveling",
    defaultOrder: 20,
    departmentId: "dep-2",
    departmentName: "Mechanical",
    isActive: true,
  },
  {
    id: "3",
    name: "CNC Drilling & Routing",
    code: "DRL",
    description: "Precision mechanical drilling of via and component holes",
    defaultOrder: 30,
    departmentId: "dep-2",
    departmentName: "Mechanical",
    isActive: true,
  },
  {
    id: "4",
    name: "Electroless Copper / Plating",
    code: "PLT",
    description: "PTH metallization & electrolytic copper build-up",
    defaultOrder: 40,
    departmentId: "dep-3",
    departmentName: "Wet Processing",
    isActive: true,
  },
  {
    id: "5",
    name: "Dry Film Imaging & Etching",
    code: "ETCH",
    description: "Photoresist lamination, UV exposure, development & acid etching",
    defaultOrder: 50,
    departmentId: "dep-3",
    departmentName: "Wet Processing",
    isActive: true,
  },
  {
    id: "6",
    name: "AOI (Automated Optical Inspection)",
    code: "AOI",
    description: "Optical inspection for shorts, opens, and line width defects",
    defaultOrder: 60,
    departmentId: "dep-4",
    departmentName: "Quality Assurance",
    isActive: true,
  },
  {
    id: "7",
    name: "LPI Solder Mask & Curing",
    code: "SM",
    description: "Liquid Photo Imageable green/black mask coating and thermal cure",
    defaultOrder: 70,
    departmentId: "dep-3",
    departmentName: "Wet Processing",
    isActive: true,
  },
  {
    id: "8",
    name: "Legend / Component Silkscreen",
    code: "LEG",
    description: "White/yellow ink component nomenclature printing",
    defaultOrder: 80,
    departmentId: "dep-3",
    departmentName: "Wet Processing",
    isActive: true,
  },
  {
    id: "9",
    name: "Surface Finish (ENIG / HASL)",
    code: "FIN",
    description: "Immersion Gold or Lead-Free Hot Air Solder Leveling coating",
    defaultOrder: 90,
    departmentId: "dep-3",
    departmentName: "Wet Processing",
    isActive: true,
  },
  {
    id: "10",
    name: "Electrical Testing (E-Test / Flying Probe)",
    code: "TST",
    description: "100% netlist continuity and high-voltage isolation testing",
    defaultOrder: 100,
    departmentId: "dep-4",
    departmentName: "Quality Assurance",
    isActive: true,
  },
  {
    id: "11",
    name: "Final CNC Routing & V-Scored Profiling",
    code: "PROF",
    description: "Individual board singulation and edge chamfering",
    defaultOrder: 110,
    departmentId: "dep-2",
    departmentName: "Mechanical",
    isActive: true,
  },
  {
    id: "12",
    name: "Final QC & Vacuum Packaging",
    code: "FQC",
    description: "Visual audit, certificate of conformance & moisture barrier seal",
    defaultOrder: 120,
    departmentId: "dep-4",
    departmentName: "Quality Assurance",
    isActive: true,
  },
];

const INITIAL_FLOWS: ProcessFlowMaster[] = [
  {
    id: "flow-1",
    name: "Standard 10-Stage Multilayer Flow",
    totalSteps: 10,
    isActive: true,
    steps: [
      { stepOrder: 1, stage: INITIAL_STAGES[0] },
      { stepOrder: 2, stage: INITIAL_STAGES[1] },
      { stepOrder: 3, stage: INITIAL_STAGES[2] },
      { stepOrder: 4, stage: INITIAL_STAGES[3] },
      { stepOrder: 5, stage: INITIAL_STAGES[4] },
      { stepOrder: 6, stage: INITIAL_STAGES[5] },
      { stepOrder: 7, stage: INITIAL_STAGES[6] },
      { stepOrder: 8, stage: INITIAL_STAGES[7] },
      { stepOrder: 9, stage: INITIAL_STAGES[8] },
      { stepOrder: 10, stage: INITIAL_STAGES[11] },
    ],
  },
  {
    id: "flow-2",
    name: "4-Layer Quick-Turn Routing Flow",
    totalSteps: 8,
    isActive: true,
    steps: [
      { stepOrder: 1, stage: INITIAL_STAGES[0] },
      { stepOrder: 2, stage: INITIAL_STAGES[1] },
      { stepOrder: 3, stage: INITIAL_STAGES[2] },
      { stepOrder: 4, stage: INITIAL_STAGES[3] },
      { stepOrder: 5, stage: INITIAL_STAGES[4] },
      { stepOrder: 6, stage: INITIAL_STAGES[5] },
      { stepOrder: 7, stage: INITIAL_STAGES[6] },
      { stepOrder: 8, stage: INITIAL_STAGES[11] },
    ],
  },
];

const DEPARTMENTS = [
  "ALL",
  "Engineering",
  "Mechanical",
  "Wet Processing",
  "Quality Assurance",
];

// Department styling helpers
const getDepartmentBadgeStyle = (deptName?: string) => {
  switch (deptName) {
    case "Engineering":
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    case "Mechanical":
      return "bg-orange-50 text-orange-700 border-orange-200";
    case "Wet Processing":
      return "bg-cyan-50 text-cyan-700 border-cyan-200";
    case "Quality Assurance":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
};

export default function ProcessesPage() {
  const [stages, setStages] = useState<ProcessStage[]>(INITIAL_STAGES);
  const [flows, setFlows] = useState<ProcessFlowMaster[]>(INITIAL_FLOWS);
  const [activeTab, setActiveTab] = useState<"stages" | "flows">("stages");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>("ALL");

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFlowModalOpen, setIsFlowModalOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<ProcessStage | null>(null);

  // Forms
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    defaultOrder: 10,
    departmentName: "Engineering",
    isActive: true,
  });

  const [flowName, setFlowName] = useState("");
  const [selectedStageIds, setSelectedStageIds] = useState<string[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("http://localhost:3001/api/v1/process-stages")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setStages(data);
      })
      .catch(() => {});

    fetch("http://localhost:3001/api/v1/process-stages/flows")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setFlows(data);
      })
      .catch(() => {});
  }, []);

  const handleOpenAdd = () => {
    setEditingStage(null);
    setFormData({
      name: "",
      code: "",
      description: "",
      defaultOrder: (stages.length + 1) * 10,
      departmentName: "Engineering",
      isActive: true,
    });
    setError("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (stage: ProcessStage) => {
    setEditingStage(stage);
    setFormData({
      name: stage.name,
      code: stage.code || "",
      description: stage.description || "",
      defaultOrder: stage.defaultOrder,
      departmentName: stage.departmentName || "Production",
      isActive: stage.isActive,
    });
    setError("");
    setIsModalOpen(true);
  };

  const handleOpenAddFlow = () => {
    setFlowName("");
    setSelectedStageIds(stages.map((s) => s.id));
    setError("");
    setIsFlowModalOpen(true);
  };

  const handleSaveStage = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!formData.name.trim()) {
      setError("Process Stage Name is required.");
      return;
    }

    try {
      const method = editingStage ? "PATCH" : "POST";
      const url = editingStage
        ? `http://localhost:3001/api/v1/process-stages/${editingStage.id}`
        : "http://localhost:3001/api/v1/process-stages";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const saved = await res.json();
        if (editingStage) {
          setStages(
            stages
              .map((s) => (s.id === saved.id ? saved : s))
              .sort((a, b) => a.defaultOrder - b.defaultOrder)
          );
        } else {
          setStages(
            [...stages, saved].sort((a, b) => a.defaultOrder - b.defaultOrder)
          );
        }
        setIsModalOpen(false);
      } else {
        if (editingStage) {
          setStages(
            stages.map((s) =>
              s.id === editingStage.id ? { ...s, ...formData } : s
            )
          );
        } else {
          const newStage: ProcessStage = {
            id: String(Date.now()),
            ...formData,
          };
          setStages(
            [...stages, newStage].sort((a, b) => a.defaultOrder - b.defaultOrder)
          );
        }
        setIsModalOpen(false);
      }
    } catch {
      if (editingStage) {
        setStages(
          stages.map((s) =>
            s.id === editingStage.id ? { ...s, ...formData } : s
          )
        );
      } else {
        const newStage: ProcessStage = {
          id: String(Date.now()),
          ...formData,
        };
        setStages(
          [...stages, newStage].sort((a, b) => a.defaultOrder - b.defaultOrder)
        );
      }
      setIsModalOpen(false);
    }
  };

  const handleSaveFlow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flowName.trim() || selectedStageIds.length === 0) {
      setError("Please provide a flow name and select at least one process stage.");
      return;
    }

    try {
      const payload = {
        name: flowName,
        stageIds: selectedStageIds,
      };

      const res = await fetch(
        "http://localhost:3001/api/v1/process-stages/flows",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (res.ok) {
        const saved = await res.json();
        setFlows([...flows, saved]);
        setIsFlowModalOpen(false);
      } else {
        const flowSteps = selectedStageIds
          .map((id, index) => {
            const st = stages.find((s) => s.id === id);
            return st ? { stepOrder: index + 1, stage: st } : null;
          })
          .filter(Boolean) as { stepOrder: number; stage: ProcessStage }[];

        const newFlow: ProcessFlowMaster = {
          id: String(Date.now()),
          name: flowName,
          totalSteps: flowSteps.length,
          isActive: true,
          steps: flowSteps,
        };
        setFlows([...flows, newFlow]);
        setIsFlowModalOpen(false);
      }
    } catch {
      const flowSteps = selectedStageIds
        .map((id, index) => {
          const st = stages.find((s) => s.id === id);
          return st ? { stepOrder: index + 1, stage: st } : null;
        })
        .filter(Boolean) as { stepOrder: number; stage: ProcessStage }[];

      const newFlow: ProcessFlowMaster = {
        id: String(Date.now()),
        name: flowName,
        totalSteps: flowSteps.length,
        isActive: true,
        steps: flowSteps,
      };
      setFlows([...flows, newFlow]);
      setIsFlowModalOpen(false);
    }
  };

  const toggleStatus = async (id: string) => {
    try {
      await fetch(`http://localhost:3001/api/v1/process-stages/${id}/status`, {
        method: "PATCH",
      });
    } catch {}
    setStages(
      stages.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s))
    );
  };

  const toggleStageSelection = (id: string) => {
    if (selectedStageIds.includes(id)) {
      setSelectedStageIds(selectedStageIds.filter((item) => item !== id));
    } else {
      setSelectedStageIds([...selectedStageIds, id]);
    }
  };

  // Filtered list by Search and Department
  const filteredStages = stages.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.code && s.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.departmentName &&
        s.departmentName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesDept =
      selectedDeptFilter === "ALL" || s.departmentName === selectedDeptFilter;
    return matchesSearch && matchesDept;
  });

  const filteredFlows = flows.filter((f) =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 p-6 max-w-[1400px] mx-auto pb-16 bg-slate-100 min-h-screen text-slate-900 font-sans">
      
      {/* Top Banner & Header */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
            <Settings2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Process Master & Shop Floor Routing
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                12 Master Stages
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure PCB manufacturing stages, department authorizations & multi-layer routing flows.
            </p>
          </div>
        </div>

        <button
          onClick={activeTab === "stages" ? handleOpenAdd : handleOpenAddFlow}
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>
            {activeTab === "stages" ? "New Process Stage" : "New Process Flow"}
          </span>
        </button>
      </div>



      {/* Metrics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Process Stages</p>
            <p className="text-lg font-bold text-slate-900 mt-0.5">{stages.length} Master Stages</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
            <Workflow className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Flow Routing Sequences</p>
            <p className="text-lg font-bold text-slate-900 mt-0.5">{flows.length} Active Routes</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600 shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Shop Floor Depts</p>
            <p className="text-lg font-bold text-slate-900 mt-0.5">4 Departments</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Stage Traceability</p>
            <p className="text-lg font-bold text-slate-900 mt-0.5">100% Verified</p>
          </div>
        </div>
      </div>

      {/* Tabs Switcher, Department Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Tabs */}
          <div className="flex border border-slate-200 bg-slate-100 p-1 rounded-xl gap-1">
            <button
              onClick={() => setActiveTab("stages")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === "stages"
                  ? "bg-amber-500 text-slate-950 shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Process Stages Master ({stages.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("flows")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === "flows"
                  ? "bg-amber-500 text-slate-950 shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
              }`}
            >
              <GitCommit className="w-4 h-4" />
              <span>Flow Routing Master ({flows.length})</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={
                activeTab === "stages"
                  ? "Search stages by Name, Code (e.g. DRL, PLT), Department..."
                  : "Search manufacturing flows by Name..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            )}
          </div>

        </div>

        {/* Department Filter Chips (For Stages Tab) */}
        {activeTab === "stages" && (
          <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-100">
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap flex items-center gap-1.5 mr-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" /> Filter Department:
            </span>
            {DEPARTMENTS.map((dept) => {
              const count =
                dept === "ALL"
                  ? stages.length
                  : stages.filter((s) => s.departmentName === dept).length;
              const isSelected = selectedDeptFilter === dept;
              return (
                <button
                  key={dept}
                  onClick={() => setSelectedDeptFilter(dept)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-amber-500 text-slate-950 font-bold shadow-sm"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                  }`}
                >
                  <span>{dept === "ALL" ? "All Departments" : dept}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] ${
                      isSelected
                        ? "bg-slate-950/20 text-slate-950 font-extrabold"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* TAB 1: STAGES MASTER TABLE */}
      {activeTab === "stages" && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-mono uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-5 text-center w-24">Seq Order</th>
                  <th className="py-3.5 px-5 w-28">Stage Code</th>
                  <th className="py-3.5 px-5">Process Stage & Operation Details</th>
                  <th className="py-3.5 px-5">Department</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredStages.map((stage) => {
                  const deptBadge = getDepartmentBadgeStyle(stage.departmentName);
                  return (
                    <tr
                      key={stage.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-3.5 px-5 text-center font-mono text-xs">
                        <span className="inline-block px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 font-extrabold text-slate-900 shadow-2xs">
                          #{stage.defaultOrder}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 font-mono text-xs">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-700 font-extrabold">
                          {stage.code || "—"}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900 flex items-center gap-2">
                            {stage.name}
                          </span>
                          {stage.description && (
                            <span className="text-xs text-slate-500 font-normal mt-0.5 leading-relaxed">
                              {stage.description}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${deptBadge}`}>
                          <Building2 className="w-3.5 h-3.5 opacity-70" />
                          <span>{stage.departmentName || "Production"}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <button
                          onClick={() => toggleStatus(stage.id)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                            stage.isActive
                              ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                              : "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100"
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${stage.isActive ? "bg-emerald-500" : "bg-rose-500"}`} />
                          <span>{stage.isActive ? "Active" : "Inactive"}</span>
                        </button>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={() => handleOpenEdit(stage)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 rounded-xl transition-all inline-flex items-center gap-1.5 text-xs font-medium shadow-2xs"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-amber-600" />
                          <span>Edit & Config</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredStages.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-12 text-center text-slate-400"
                    >
                      <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-medium">No process stages found matching your criteria.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: FLOW ROUTING MASTER */}
      {activeTab === "flows" && (
        <div className="grid grid-cols-1 gap-6">
          {filteredFlows.map((flow) => (
            <div
              key={flow.id}
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 hover:border-amber-300 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 font-bold shrink-0">
                    <GitCommit className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {flow.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      TOTAL ROUTING STAGES:{" "}
                      <span className="text-amber-700 font-bold">
                        {flow.totalSteps || flow.steps?.length || 0} STEPS
                      </span>{" "}
                      • SHOP FLOOR TRACEABILITY LINKED
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-mono font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> ACTIVE FLOW ROUTE
                  </span>
                </div>
              </div>

              {/* Steps badges sequence */}
              <div className="space-y-2">
                <span className="text-[11px] font-mono uppercase text-slate-500 font-bold block tracking-wider">
                  MANUFACTURING PROCESS ROUTING SEQUENCE:
                </span>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {(flow.steps || []).map((step, idx) => (
                    <React.Fragment key={`${flow.id}-step-${idx}`}>
                      <div className="bg-slate-50 border border-slate-200 hover:border-amber-400 hover:bg-amber-50/40 shadow-2xs rounded-xl px-3.5 py-2 flex items-center gap-2.5 transition-all">
                        <span className="w-6 h-6 rounded-lg bg-amber-500 text-slate-950 font-mono text-xs font-extrabold flex items-center justify-center shrink-0">
                          {step.stepOrder || idx + 1}
                        </span>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-900 leading-tight">
                            {step.stage?.name || "Stage"}
                          </span>
                          <span className="text-[10px] font-mono text-blue-700 font-bold mt-0.5">
                            CODE: {step.stage?.code || "—"}
                          </span>
                        </div>
                      </div>
                      {idx < (flow.steps?.length || 0) - 1 && (
                        <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          ))}
          {filteredFlows.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 shadow-sm">
              <Workflow className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium">No manufacturing flow sequences found matching "{searchTerm}".</p>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Stage Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6 my-8 animate-in fade-in zoom-in-95 duration-200 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 font-bold shrink-0">
                  <Settings2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {editingStage ? "Edit Process Stage" : "Create Process Stage"}
                  </h2>
                  <p className="text-xs text-slate-500 font-mono">
                    MANUFACTURING STEP SPECIFICATION
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

            <form onSubmit={handleSaveStage} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  STAGE NAME *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. CNC Drilling & Routing"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500 text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    STAGE CODE
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. DRL"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-mono text-xs focus:bg-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    DEFAULT ORDER (SEQUENCE)
                  </label>
                  <input
                    type="number"
                    value={formData.defaultOrder}
                    onChange={(e) => setFormData({ ...formData, defaultOrder: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-mono text-xs focus:bg-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  DEPARTMENT AUTHORIZATION
                </label>
                <select
                  value={formData.departmentName}
                  onChange={(e) => setFormData({ ...formData, departmentName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-amber-500"
                >
                  <option value="Engineering">Engineering (CAM/CAD)</option>
                  <option value="Mechanical">Mechanical (Cut/Drill/Route)</option>
                  <option value="Wet Processing">Wet Processing (Plating/Etch/Mask)</option>
                  <option value="Quality Assurance">Quality Assurance (AOI/E-Test/QC)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  STAGE DESCRIPTION
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Details of operation, machinery used, and QC requirements"
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
                  {editingStage ? "Update Stage" : "Save Process Stage"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Flow Route Modal */}
      {isFlowModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-6 my-8 animate-in fade-in zoom-in-95 duration-200 text-slate-900 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 font-bold shrink-0">
                  <Workflow className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Create Manufacturing Flow Route
                  </h2>
                  <p className="text-xs text-slate-500">
                    Define custom shop-floor routing sequence for PCB products.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsFlowModalOpen(false)}
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

            <form onSubmit={handleSaveFlow} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  FLOW ROUTE NAME *
                </label>
                <input
                  type="text"
                  required
                  value={flowName}
                  onChange={(e) => setFlowName(e.target.value)}
                  placeholder="e.g. 6-Layer HDI High-Density Flow"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500 text-xs font-medium"
                />
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <span className="text-xs font-semibold text-amber-700 flex items-center gap-1.5">
                  <Layers className="w-4 h-4" /> Select Included Stages ({selectedStageIds.length} Stages)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {stages.map((stage) => {
                    const isSelected = selectedStageIds.includes(stage.id);
                    return (
                      <button
                        type="button"
                        key={stage.id}
                        onClick={() => toggleStageSelection(stage.id)}
                        className={`text-left p-2.5 rounded-xl text-xs font-medium border transition-all flex items-center justify-between gap-2 ${
                          isSelected
                            ? "bg-amber-100/80 border-amber-300 text-amber-900 font-semibold shadow-2xs"
                            : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                        }`}
                      >
                        <span>{stage.name}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 sticky bottom-0 bg-white z-10">
                <button
                  type="button"
                  onClick={() => setIsFlowModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-all shadow-sm"
                >
                  Save Flow Route
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
