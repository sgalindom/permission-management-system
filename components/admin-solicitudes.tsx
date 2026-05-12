"use client";

import { useState } from "react";
import { useRequests } from "@/lib/requests-context";
import { useAuth } from "@/lib/auth-context";
import { useCatalogs } from "@/lib/catalogs-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RequestStatus, STATUS_LABELS, REASON_LABELS } from "@/lib/types";
import {
  Search,
  Download,
  Plus,
  Eye,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AdminSolicitudesProps {
  onManageRequest: (requestId: string) => void;
}

const statusColors = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  preapproved: "bg-sky-100 text-sky-700 border-sky-200",
  approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
  cancelled: "bg-gray-100 text-gray-600 border-gray-200",
};

const statusFilters: { value: RequestStatus | "all"; label: string; count?: number }[] = [
  { value: "all", label: "Todos" },
  { value: "pending", label: "Pendiente" },
  { value: "preapproved", label: "Pre-aprobada" },
  { value: "approved", label: "Aprobada" },
  { value: "rejected", label: "Rechazada" },
  { value: "cancelled", label: "Cancelada" },
];

export function AdminSolicitudes({ onManageRequest }: AdminSolicitudesProps) {
  const { requests, stats, updateRequestStatus } = useRequests();
  const { user } = useAuth();
  const { areas } = useCatalogs();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "all">("all");
  const [areaFilter, setAreaFilter] = useState<string>("all");
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Filter requests
  const filteredRequests = requests.filter((req) => {
    const matchesSearch =
      req.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || req.status === statusFilter;
    const matchesArea = areaFilter === "all" || req.employeeArea === areaFilter;
    return matchesSearch && matchesStatus && matchesArea;
  });

  // Pagination
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRequests(paginatedRequests.map((r) => r.id));
    } else {
      setSelectedRequests([]);
    }
  };

  const handleSelectRequest = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedRequests((prev) => [...prev, id]);
    } else {
      setSelectedRequests((prev) => prev.filter((r) => r !== id));
    }
  };

  const handleBulkApprove = () => {
    const obs = prompt("Observacion para la aprobacion (obligatoria):");
    if (!obs || !obs.trim()) return;
    const adminName = user?.name || "Admin";
    selectedRequests.forEach((id) => {
      updateRequestStatus(id, "approved", obs.trim(), adminName, user?.uid);
    });
    setSelectedRequests([]);
  };

  const handleBulkReject = () => {
    const obs = prompt("Motivo del rechazo (obligatorio):");
    if (!obs || !obs.trim()) return;
    const adminName = user?.name || "Admin";
    selectedRequests.forEach((id) => {
      updateRequestStatus(id, "rejected", obs.trim(), adminName, user?.uid);
    });
    setSelectedRequests([]);
  };

  const handleQuickApprove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const obs = prompt("Observacion para la aprobacion (obligatoria):");
    if (!obs || !obs.trim()) return;
    updateRequestStatus(id, "approved", obs.trim(), user?.name || "Admin", user?.uid);
  };

  const handleQuickReject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const obs = prompt("Motivo del rechazo (obligatorio):");
    if (!obs || !obs.trim()) return;
    updateRequestStatus(id, "rejected", obs.trim(), user?.name || "Admin", user?.uid);
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50 min-h-screen">
      {/* Top Bar */}
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-10">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Ver Solicitudes</h1>
          <p className="text-sm text-gray-500">Inicio / Solicitudes</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Exportar
          </Button>
          <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4" />
            Nueva Solicitud
          </Button>
        </div>
      </header>

      <main className="flex-1 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Todas las solicitudes</h2>
          <p className="text-gray-500">Gestiona, aprueba o rechaza solicitudes de permiso laboral</p>
        </div>

        {/* Filters Bar */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Search */}
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nombre, ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-50 border-gray-200"
                />
              </div>

              {/* Status Filter Chips */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-500 mr-1">Estado:</span>
                {statusFilters.map((filter) => {
                  const count =
                    filter.value === "all"
                      ? stats.total
                      : filter.value === "pending"
                      ? stats.pending
                      : filter.value === "preapproved"
                      ? stats.preapproved
                      : filter.value === "approved"
                      ? stats.approved
                      : filter.value === "rejected"
                      ? stats.rejected
                      : stats.cancelled;
                  return (
                    <button
                      key={filter.value}
                      onClick={() => {
                        setStatusFilter(filter.value);
                        setCurrentPage(1);
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        statusFilter === filter.value
                          ? "bg-blue-50 border-blue-200 text-blue-700"
                          : "bg-white border-gray-200 text-gray-600 hover:border-blue-200 hover:text-blue-600"
                      }`}
                    >
                      {filter.label} <span className="opacity-60">({count})</span>
                    </button>
                  );
                })}
              </div>

              {/* Area & Reason Filters */}
              <div className="flex items-center gap-2 ml-auto">
                <Select value={areaFilter} onValueChange={(v) => { setAreaFilter(v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-40 bg-white">
                    <SelectValue placeholder="Todas las areas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las areas</SelectItem>
                    {areas.map((area) => (
                      <SelectItem key={area.id} value={area.name}>
                        {area.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions Bar */}
        {selectedRequests.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-4">
            <input type="checkbox" checked className="w-4 h-4 text-blue-600 rounded" readOnly />
            <span className="font-medium text-blue-700">{selectedRequests.length} solicitudes seleccionadas</span>
            <div className="flex gap-2 ml-auto">
              <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white" onClick={handleBulkApprove}>
                <Check className="w-4 h-4 mr-1" />
                Aprobar seleccion
              </Button>
              <Button size="sm" variant="destructive" onClick={handleBulkReject}>
                <X className="w-4 h-4 mr-1" />
                Rechazar seleccion
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedRequests([])}>
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 w-12">
                      <input
                        type="checkbox"
                        checked={selectedRequests.length === paginatedRequests.length && paginatedRequests.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Empleado
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Area
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Motivo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Fecha Permiso
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Duracion
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Remunerado
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Jefe Inmediato
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedRequests.includes(request.id)}
                          onChange={(e) => handleSelectRequest(request.id, e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm text-blue-600">#{request.id}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900">{request.employeeName}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-500">{request.employeeArea}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm px-2 py-1 rounded bg-gray-100 text-gray-700">
                          {REASON_LABELS[request.reason]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm text-gray-500">{request.permissionDate}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-500">{request.duration}</span>
                      </td>
                      <td className="px-4 py-3">
                        {request.isPaid ? (
                          <span className="text-sm text-emerald-600 font-medium">Si</span>
                        ) : (
                          <span className="text-sm text-red-600 font-medium">No</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={statusColors[request.status]}>
                          {STATUS_LABELS[request.status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-500">{request.supervisor.split(" ").slice(0, 2).join(" ")}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onManageRequest(request.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {(request.status === "pending" || request.status === "preapproved") && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                onClick={(e) => handleQuickApprove(request.id, e)}
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={(e) => handleQuickReject(request.id, e)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Mostrando {(currentPage - 1) * itemsPerPage + 1}–
                {Math.min(currentPage * itemsPerPage, filteredRequests.length)} de {filteredRequests.length} registros
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    className={currentPage === page ? "bg-blue-600 text-white" : ""}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                ))}
                {totalPages > 5 && (
                  <>
                    <span className="text-gray-400">...</span>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(totalPages)}>
                      {totalPages}
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <Select defaultValue="6">
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">6</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
