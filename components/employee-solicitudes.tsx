"use client";

import { useState } from "react";
import { useRequests } from "@/lib/requests-context";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RequestStatus, STATUS_LABELS, REASON_LABELS } from "@/lib/types";
import {
  Search,
  Plus,
  Eye,
  Ban,
  Clock,
  Download,
  Briefcase,
  DollarSign,
  RotateCcw,
  User,
} from "lucide-react";
import { EmployeeView } from "./sidebar";

interface EmployeeSolicitudesProps {
  onViewChange: (view: EmployeeView) => void;
  onViewDetail: (requestId: string) => void;
}

const statusColors = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  preapproved: "bg-sky-100 text-sky-700 border-sky-200",
  approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
  cancelled: "bg-gray-100 text-gray-600 border-gray-200",
};

const statusBorders = {
  pending: "border-l-amber-500",
  preapproved: "border-l-sky-500",
  approved: "border-l-emerald-500",
  rejected: "border-l-red-500",
  cancelled: "border-l-gray-400",
};

const statusFilters: { value: RequestStatus | "all"; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "pending", label: "Pendientes" },
  { value: "preapproved", label: "Pre-aprobadas" },
  { value: "approved", label: "Aprobadas" },
  { value: "rejected", label: "Rechazadas" },
  { value: "cancelled", label: "Canceladas" },
];

export function EmployeeSolicitudes({ onViewChange, onViewDetail }: EmployeeSolicitudesProps) {
  const { getRequestsByEmployee, cancelRequest } = useRequests();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "all">("all");

  const myRequests = getRequestsByEmployee(user?.id || "");

  // Calculate stats
  const stats = {
    total: myRequests.length,
    pending: myRequests.filter((r) => r.status === "pending").length,
    preapproved: myRequests.filter((r) => r.status === "preapproved").length,
    approved: myRequests.filter((r) => r.status === "approved").length,
    rejected: myRequests.filter((r) => r.status === "rejected").length,
  };

  // Filter requests
  const filteredRequests = myRequests.filter((req) => {
    const matchesSearch =
      req.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      REASON_LABELS[req.reason].toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCancelRequest = (id: string) => {
    if (confirm("Esta seguro que desea cancelar esta solicitud?")) {
      cancelRequest(id, user?.name || "Empleado", user?.uid);
    }
  };

  const getStatusMessage = (request: typeof myRequests[0]) => {
    switch (request.status) {
      case "pending":
        return `En espera de revision por: ${request.supervisor.split(" ").slice(0, 2).join(" ")}`;
      case "preapproved":
        return "Revision preliminar aprobada. Pendiente aprobacion final.";
      case "approved":
        const lastApproval = request.history.find((h) => h.action.includes("Aprobada"));
        return `Aprobado por: ${lastApproval?.by || "Admin"} - ${lastApproval?.date?.split("T")[0] || ""}`;
      case "rejected":
        const rejection = request.history.find((h) => h.action.includes("Rechazada"));
        return rejection?.observation || "Solicitud rechazada";
      case "cancelled":
        return "Cancelada por el empleado";
      default:
        return "";
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50 min-h-screen">
      {/* Top Bar */}
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-10">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Mis Solicitudes</h1>
          <p className="text-sm text-gray-500">Inicio / Mis Solicitudes</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            className="gap-2 bg-blue-600 hover:bg-blue-700"
            onClick={() => onViewChange("nueva-solicitud")}
          >
            <Plus className="w-4 h-4" />
            Nueva Solicitud
          </Button>
        </div>
      </header>

      <main className="flex-1 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Mis permisos registrados</h2>
          <p className="text-gray-500">Consulta el estado y seguimiento de tus solicitudes</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card className="border-t-4 border-t-blue-500">
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </CardContent>
          </Card>
          <Card className="border-t-4 border-t-amber-500">
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pendientes</p>
              <p className="text-3xl font-bold text-amber-600 mt-1">{stats.pending}</p>
            </CardContent>
          </Card>
          <Card className="border-t-4 border-t-sky-500">
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pre-aprobadas</p>
              <p className="text-3xl font-bold text-sky-600 mt-1">{stats.preapproved}</p>
            </CardContent>
          </Card>
          <Card className="border-t-4 border-t-emerald-500">
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Aprobadas</p>
              <p className="text-3xl font-bold text-emerald-600 mt-1">{stats.approved}</p>
            </CardContent>
          </Card>
          <Card className="border-t-4 border-t-red-500">
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Rechazadas</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{stats.rejected}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                statusFilter === filter.value
                  ? "bg-blue-50 border-blue-200 text-blue-700"
                  : "bg-white border-gray-200 text-gray-600 hover:border-blue-200 hover:text-blue-600"
              }`}
            >
              {filter.label}
            </button>
          ))}
          <div className="relative ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar solicitud..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-60 bg-white"
            />
          </div>
        </div>

        {/* Request Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRequests.map((request) => (
            <Card
              key={request.id}
              className={`overflow-hidden border-l-4 ${statusBorders[request.status]} hover:shadow-lg transition-shadow cursor-pointer`}
              onClick={() => onViewDetail(request.id)}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="font-mono text-xs text-blue-600">#{request.id}</span>
                    <h3 className="text-base font-semibold text-gray-900 mt-1">
                      {REASON_LABELS[request.reason]}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {request.permissionDate} - {request.duration}
                    </p>
                  </div>
                  <Badge variant="outline" className={statusColors[request.status]}>
                    {STATUS_LABELS[request.status]}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-2 mb-3 pt-3 border-t border-gray-100">
                  <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                    <Clock className="w-3 h-3" />
                    {request.startTime} - {request.endTime}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                    <Briefcase className="w-3 h-3" />
                    {request.employeeArea}
                  </span>
                  {request.isPaid && (
                    <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                      <DollarSign className="w-3 h-3" />
                      Remunerado
                    </span>
                  )}
                  {request.hasReplacement && (
                    <span className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      <RotateCcw className="w-3 h-3" />
                      Con reposicion
                    </span>
                  )}
                </div>

                <div
                  className={`text-xs p-2 rounded flex items-start gap-2 ${
                    request.status === "pending"
                      ? "bg-amber-50 text-amber-700"
                      : request.status === "preapproved"
                      ? "bg-sky-50 text-sky-700"
                      : request.status === "approved"
                      ? "bg-emerald-50 text-emerald-700"
                      : request.status === "rejected"
                      ? "bg-red-50 text-red-700"
                      : "bg-gray-50 text-gray-600"
                  }`}
                >
                  {request.status === "pending" && <Clock className="w-3 h-3 mt-0.5 flex-shrink-0" />}
                  {request.status === "approved" && <User className="w-3 h-3 mt-0.5 flex-shrink-0" />}
                  <span>{getStatusMessage(request)}</span>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewDetail(request.id);
                    }}
                  >
                    <Eye className="w-3 h-3" />
                    Ver detalle
                  </Button>
                  {request.status === "approved" && (
                    <Button variant="outline" size="sm" className="gap-1">
                      <Download className="w-3 h-3" />
                      Descargar
                    </Button>
                  )}
                  {request.status === "pending" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 text-red-600 border-red-200 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancelRequest(request.id);
                      }}
                    >
                      <Ban className="w-3 h-3" />
                      Cancelar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {/* New Request Card */}
          <Card
            className="border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50/50 cursor-pointer transition-all"
            onClick={() => onViewChange("nueva-solicitud")}
          >
            <CardContent className="flex flex-col items-center justify-center h-full min-h-48 p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                <Plus className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="font-semibold text-gray-700 mb-1">Crear nueva solicitud</h3>
              <p className="text-sm text-gray-500">Registra un nuevo permiso laboral</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
