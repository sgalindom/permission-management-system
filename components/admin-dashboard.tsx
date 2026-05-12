"use client";

import { useRequests } from "@/lib/requests-context";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS, REASON_LABELS } from "@/lib/types";
import {
  Calendar,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  Eye,
  ClipboardList,
  Download,
} from "lucide-react";
import { AdminView } from "./sidebar";
import { NotificationsBell } from "./notifications-bell";

interface AdminDashboardProps {
  onViewChange: (view: AdminView) => void;
  onManageRequest: (requestId: string) => void;
}

const statusColors = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  preapproved: "bg-sky-100 text-sky-700 border-sky-200",
  approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
  cancelled: "bg-gray-100 text-gray-600 border-gray-200",
};

export function AdminDashboard({ onViewChange, onManageRequest }: AdminDashboardProps) {
  const { requests, stats } = useRequests();
  const { user } = useAuth();

  const recentRequests = requests.slice(0, 5);
  const pendingRequests = requests.filter((r) => r.status === "pending");

  return (
    <div className="flex-1 flex flex-col bg-gray-50 min-h-screen">
      {/* Top Bar */}
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-10">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">Inicio / Dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2">
            <Calendar className="w-4 h-4" />
            Abr 2026
          </Button>
          <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700">
            <FileText className="w-4 h-4" />
            Nueva Solicitud
          </Button>
          <NotificationsBell />
        </div>
      </header>

      <main className="flex-1 p-6">
        {/* Alert Banner */}
        {pendingRequests.length > 0 && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-4">
            <AlertCircle className="w-6 h-6 text-amber-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-amber-800">{pendingRequests.length} solicitudes pendientes</p>
              <p className="text-sm text-amber-600">requieren gestion. La mas antigua lleva 3 dias esperando.</p>
            </div>
            <Button
              size="sm"
              className="bg-amber-500 hover:bg-amber-600 text-white"
              onClick={() => onViewChange("solicitudes")}
            >
              Ver ahora
            </Button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <Card className="border-t-4 border-t-blue-500">
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total solicitudes</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-green-500" />
                +8 este mes
              </p>
              {/* Mini chart */}
              <div className="flex items-end gap-1 h-8 mt-2">
                {[40, 55, 45, 70, 60, 80, 100].map((height, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-t ${i === 6 ? "bg-blue-500" : "bg-blue-200"}`}
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-amber-500">
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pendientes</p>
              <p className="text-3xl font-bold text-amber-600 mt-1">{stats.pending}</p>
              <p className="text-xs text-amber-600 mt-1">Requieren accion</p>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-sky-500">
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pre-aprobadas</p>
              <p className="text-3xl font-bold text-sky-600 mt-1">{stats.preapproved}</p>
              <p className="text-xs text-gray-500 mt-1">En revision final</p>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-emerald-500">
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Aprobadas</p>
              <p className="text-3xl font-bold text-emerald-600 mt-1">{stats.approved}</p>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-green-500" />
                +5 esta semana
              </p>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-red-500">
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Rechazadas</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{stats.rejected}</p>
              <p className="text-xs text-gray-500 mt-1">12.1% del total</p>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-gray-400">
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Canceladas</p>
              <p className="text-3xl font-bold text-gray-600 mt-1">{stats.cancelled}</p>
              <p className="text-xs text-gray-500 mt-1">Por empleado</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Requests Table */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-semibold">Solicitudes recientes</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => onViewChange("solicitudes")} className="gap-1">
                  Ver todas <ArrowRight className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-y border-gray-200">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          ID
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Empleado
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Motivo
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Fecha
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Estado
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Accion
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {recentRequests.map((request) => (
                        <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <span className="font-mono text-sm text-blue-600">#{request.id}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-medium text-gray-900">{request.employeeName}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-500">{REASON_LABELS[request.reason]}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-mono text-sm text-gray-500">{request.permissionDate}</span>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className={statusColors[request.status]}>
                              {STATUS_LABELS[request.status]}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onManageRequest(request.id)}
                              className="text-gray-600 hover:text-blue-600"
                            >
                              {request.status === "pending" || request.status === "preapproved"
                                ? "Gestionar"
                                : "Ver detalle"}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Acciones rapidas</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => onViewChange("solicitudes")}
                  className="p-3 bg-blue-50 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors flex items-center gap-3"
                >
                  <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                    <ClipboardList className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Ver solicitudes</span>
                </button>
                <button className="p-3 bg-amber-50 rounded-lg border border-amber-100 hover:bg-amber-100 transition-colors flex items-center gap-3">
                  <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Pendientes</span>
                </button>
                <button className="p-3 bg-emerald-50 rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-colors flex items-center gap-3">
                  <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Aprobar masivo</span>
                </button>
                <button className="p-3 bg-purple-50 rounded-lg border border-purple-100 hover:bg-purple-100 transition-colors flex items-center gap-3">
                  <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Download className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Exportar reporte</span>
                </button>
              </CardContent>
            </Card>

            {/* Status Distribution */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Distribucion de estados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "Aprobadas", value: stats.approved, total: stats.total, color: "bg-emerald-500" },
                  { label: "Pendientes", value: stats.pending, total: stats.total, color: "bg-amber-500" },
                  { label: "Rechazadas", value: stats.rejected, total: stats.total, color: "bg-red-500" },
                  { label: "Pre-aprobadas", value: stats.preapproved, total: stats.total, color: "bg-sky-500" },
                  { label: "Canceladas", value: stats.cancelled, total: stats.total, color: "bg-gray-400" },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700">{item.label}</span>
                      <span className="text-xs text-gray-500">
                        {item.value} - {((item.value / item.total) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full transition-all`}
                        style={{ width: `${(item.value / item.total) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
