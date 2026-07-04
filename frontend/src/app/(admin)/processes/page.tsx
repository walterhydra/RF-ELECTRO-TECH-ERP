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
    description:
      "Engineering verification, panelization & tool data generation",
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
    description:
      "Photoresist lamination, UV exposure, development & acid etching",
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
    description:
      "Liquid Photo Imageable green/black mask coating and thermal cure",
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
    description: "Visual audit, moisture-barrier sealing & dispatch labeling",
    defaultOrder: 120,
    departmentId: "dep-5",
    departmentName: "Dispatch & Store",
    isActive: true,
  },
];

export default function ProcessMasterPage() {
  const [activeTab, setActiveTab] = useState<"stages" | "flows">("stages");
  const [stages, setStages] = useState<ProcessStage[]>(INITIAL_STAGES);
  const [flows, setFlows] = useState<ProcessFlowMaster[]>([
    {
      id: "flow-1",
      name: "Standard 10-Stage Multilayer Flow",
      totalSteps: 10,
      isActive: true,
      steps: INITIAL_STAGES.slice(0, 10).map((stage, idx) => ({
        stepOrder: idx + 1,
        stage,
      })),
    },
    {
      id: "flow-2",
      name: "4-Layer Quick-Turn Routing Flow",
      totalSteps: 8,
      isActive: true,
      steps: INITIAL_STAGES.filter((s) =>
        ["CAM", "CUT", "DRL", "PLT", "ETCH", "AOI", "SM", "FQC"].includes(
          s.code || "",
        ),
      ).map((stage, idx) => ({ stepOrder: idx + 1, stage })),
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFlowModalOpen, setIsFlowModalOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<ProcessStage | null>(null);

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
        if (Array.isArray(data) && data.length > 0) {
          setStages(
            data.map((item: any) => ({
              ...item,
              departmentName: item.department?.name || "Production",
            })),
          );
        }
      })
      .catch(() => {});

    fetch("http://localhost:3001/api/v1/process-stages/flows")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setFlows(data);
        }
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
        const formatted = { ...saved, departmentName: formData.departmentName };
        if (editingStage) {
          setStages(stages.map((s) => (s.id === saved.id ? formatted : s)));
        } else {
          setStages(
            [...stages, formatted].sort(
              (a, b) => a.defaultOrder - b.defaultOrder,
            ),
          );
        }
        setIsModalOpen(false);
      } else {
        if (editingStage) {
          setStages(
            stages
              .map((s) =>
                s.id === editingStage.id ? { ...s, ...formData } : s,
              )
              .sort((a, b) => a.defaultOrder - b.defaultOrder),
          );
        } else {
          const newStage: ProcessStage = {
            id: String(Date.now()),
            departmentId: "dep-x",
            ...formData,
          };
          setStages(
            [...stages, newStage].sort(
              (a, b) => a.defaultOrder - b.defaultOrder,
            ),
          );
        }
        setIsModalOpen(false);
      }
    } catch {
      if (editingStage) {
        setStages(
          stages
            .map((s) => (s.id === editingStage.id ? { ...s, ...formData } : s))
            .sort((a, b) => a.defaultOrder - b.defaultOrder),
        );
      } else {
        const newStage: ProcessStage = {
          id: String(Date.now()),
          departmentId: "dep-x",
          ...formData,
        };
        setStages(
          [...stages, newStage].sort((a, b) => a.defaultOrder - b.defaultOrder),
        );
      }
      setIsModalOpen(false);
    }
  };

  const handleSaveFlow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flowName.trim() || selectedStageIds.length === 0) {
      setError(
        "Please provide a flow name and select at least one process stage.",
      );
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
        },
      );

      if (res.ok) {
        const saved = await res.json();
        setFlows([...flows, saved]);
        setIsFlowModalOpen(false);
      } else {
        const selectedStages = selectedStageIds
          .map((id) => stages.find((s) => s.id === id))
          .filter(Boolean) as ProcessStage[];

        const newFlow: ProcessFlowMaster = {
          id: `flow-${Date.now()}`,
          name: flowName,
          totalSteps: selectedStages.length,
          isActive: true,
          steps: selectedStages.map((stage, idx) => ({
            stepOrder: idx + 1,
            stage,
          })),
        };
        setFlows([...flows, newFlow]);
        setIsFlowModalOpen(false);
      }
    } catch {
      const selectedStages = selectedStageIds
        .map((id) => stages.find((s) => s.id === id))
        .filter(Boolean) as ProcessStage[];

      const newFlow: ProcessFlowMaster = {
        id: `flow-${Date.now()}`,
        name: flowName,
        totalSteps: selectedStages.length,
        isActive: true,
        steps: selectedStages.map((stage, idx) => ({
          stepOrder: idx + 1,
          stage,
        })),
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
      stages.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s)),
    );
  };

  const toggleStageSelection = (id: string) => {
    if (selectedStageIds.includes(id)) {
      setSelectedStageIds(selectedStageIds.filter((item) => item !== id));
    } else {
      setSelectedStageIds([...selectedStageIds, id]);
    }
  };

  const filteredStages = stages.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.code && s.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.departmentName &&
        s.departmentName.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const filteredFlows = flows.filter((f) =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-wide">
              Process Master & Flow Routes
            </h1>
            <p className="text-xs text-slate-500 font-mono mt-1">
              PCB MANUFACTURING ROUTING SEQUENCE • DEPARTMENT ASSIGNMENTS •
              TRACEABILITY
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={activeTab === "stages" ? handleOpenAdd : handleOpenAddFlow}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all shadow-sm hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>
              {activeTab === "stages"
                ? "New Process Stage"
                : "New Process Flow"}
            </span>
          </button>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200 bg-slate-50 p-1.5 rounded-xl gap-2 w-fit">
        <button
          onClick={() => setActiveTab("stages")}
          className={`px-5 py-2 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-2 ${
            activeTab === "stages"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-500 hover:text-slate-900 hover:bg-slate-200"
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>PROCESS STAGES MASTER ({stages.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("flows")}
          className={`px-5 py-2 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-2 ${
            activeTab === "flows"
              ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <GitCommit className="w-4 h-4" />
          <span>MANUFACTURING FLOW ROUTING ({flows.length})</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
        <Search className="w-5 h-5 text-slate-500" />
        <input
          type="text"
          placeholder={
            activeTab === "stages"
              ? "Search stages by Name, Code (e.g. DRL, PLT), Department..."
              : "Search manufacturing flows by Name..."
          }
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent text-sm text-slate-900 placeholder-slate-400 w-full focus:outline-none"
        />
      </div>

      {/* TAB 1: STAGES MASTER */}
      {activeTab === "stages" && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-mono uppercase text-slate-600">
                  <th className="py-4 px-6 w-20 text-center">Seq #</th>
                  <th className="py-4 px-6 w-28">Code</th>
                  <th className="py-4 px-6">Process Name & Description</th>
                  <th className="py-4 px-6">Department</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredStages.map((stage) => (
                  <tr
                    key={stage.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="py-4 px-6 text-center font-mono font-bold text-slate-700">
                      <span className="inline-block px-2 py-1 rounded bg-slate-100 text-xs">
                        {stage.defaultOrder}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-mono text-xs font-bold text-blue-600">
                      {stage.code || "—"}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900">
                          {stage.name}
                        </span>
                        {stage.description && (
                          <span className="text-xs text-slate-500 font-normal mt-0.5">
                            {stage.description}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200">
                        <Activity className="w-3 h-3 text-blue-600" />
                        {stage.departmentName || "Production"}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => toggleStatus(stage.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                          stage.isActive
                            ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                            : "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                        }`}
                      >
                        {stage.isActive ? (
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
                        onClick={() => handleOpenEdit(stage)}
                        className="p-2 bg-white border border-slate-200 hover:border-blue-500 text-slate-700 hover:text-blue-700 rounded-lg transition-colors inline-flex items-center gap-1.5 text-xs font-medium shadow-sm"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredStages.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-12 text-center text-slate-500"
                    >
                      No process stages found matching "{searchTerm}".
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
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 hover:border-slate-300 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-mono font-bold">
                    <GitCommit className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {flow.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      TOTAL ROUTING STAGES:{" "}
                      <span className="text-blue-600 font-bold">
                        {flow.totalSteps || flow.steps?.length || 0} STEPS
                      </span>{" "}
                      • TRACEABILITY LINKED
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-mono font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> ACTIVE FLOW ROUTE
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
                      <div className="bg-white border border-slate-200 hover:border-blue-300 shadow-sm rounded-xl px-3 py-2 flex items-center gap-2 transition-all">
                        <span className="w-6 h-6 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-mono text-xs font-bold">
                          {step.stepOrder || idx + 1}
                        </span>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-900 leading-tight">
                            {step.stage?.name || "Stage"}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
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
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
              No manufacturing flow sequences found.
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Stage Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold">
                  {editingStage ? "ED" : "NEW"}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {editingStage
                      ? "Edit Process Stage"
                      : "Create Process Stage"}
                  </h2>
                  <p className="text-xs text-slate-500 font-mono">
                    MANUFACTURING STEP SPECIFICATION
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSaveStage} className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-500 mb-1">
                    PROCESS NAME *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g. Electroless Copper / Plating"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-blue-500 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-500 mb-1">
                    PROCESS CODE
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        code: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="e.g. PLT, DRL, AOI"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-500 uppercase shadow-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-500 mb-1">
                    SEQUENCE ORDER #
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.defaultOrder}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        defaultOrder: Number(e.target.value),
                      })
                    }
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-500 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-500 mb-1">
                    DEPARTMENT
                  </label>
                  <select
                    value={formData.departmentName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        departmentName: e.target.value,
                      })
                    }
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 text-xs focus:outline-none focus:border-blue-500 shadow-sm"
                  >
                    <option value="Engineering">Engineering (CAM/CAD)</option>
                    <option value="Mechanical">
                      Mechanical (Cut/Drill/Route)
                    </option>
                    <option value="Wet Processing">
                      Wet Processing (Plating/Etch/Mask)
                    </option>
                    <option value="Quality Assurance">
                      Quality Assurance (AOI/E-Test/QC)
                    </option>
                    <option value="Dispatch & Store">Dispatch & Store</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-500 mb-1">
                  PROCESS DESCRIPTION / WORK INSTRUCTIONS
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Standard operating procedures or quality parameters for this stage..."
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:border-blue-500 resize-none shadow-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-semibold transition-colors shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-sm"
                >
                  {editingStage ? "Update Stage" : "Save Process Stage"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Flow Modal */}
      {isFlowModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 my-8 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold">
                  FL
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Create Manufacturing Process Flow
                  </h2>
                  <p className="text-xs text-slate-500 font-mono">
                    SELECT AND ORDER PRODUCTION ROUTING STAGES
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsFlowModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSaveFlow} className="space-y-6 text-sm">
              <div>
                <label className="block text-xs font-mono text-slate-500 mb-1">
                  PROCESS FLOW SEQUENCE NAME *
                </label>
                <input
                  type="text"
                  required
                  value={flowName}
                  onChange={(e) => setFlowName(e.target.value)}
                  placeholder="e.g. 4-Layer Quick-Turn Multilayer Flow"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-semibold focus:outline-none focus:border-blue-500 shadow-sm"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-mono text-slate-500">
                    SELECT STAGES IN MANUFACTURING ROUTE (
                    {selectedStageIds.length} SELECTED)
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedStageIds(stages.map((s) => s.id))
                      }
                      className="text-[11px] text-blue-600 hover:underline font-mono"
                    >
                      Select All
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setSelectedStageIds([])}
                      className="text-[11px] text-slate-500 hover:underline font-mono"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl">
                  {stages.map((stage) => {
                    const isSelected = selectedStageIds.includes(stage.id);
                    return (
                      <div
                        key={stage.id}
                        onClick={() => toggleStageSelection(stage.id)}
                        className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                          isSelected
                            ? "bg-blue-50 border-blue-200 text-blue-700"
                            : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 shadow-sm"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <div
                            className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border ${
                              isSelected
                                ? "bg-blue-600 border-blue-600 text-white"
                                : "border-slate-200 bg-slate-50"
                            }`}
                          >
                            {isSelected && (
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            )}
                          </div>
                          <div className="truncate">
                            <div className="text-xs font-bold truncate">
                              {stage.name}
                            </div>
                            <div className="text-[10px] font-mono text-slate-500">
                              CODE: {stage.code || "—"}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                          #{stage.defaultOrder}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={() => setIsFlowModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-semibold transition-colors shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-sm"
                >
                  Save Process Flow Sequence
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
