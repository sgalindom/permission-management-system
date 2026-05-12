"use client";

import { useMemo } from "react";
import { useRequests } from "@/lib/requests-context";
import { REASON_LABELS, STATUS_LABELS, RequestStatus, RequestReason } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Download } from "lucide-react";

const STATUS_COLORS: Record<RequestStatus, string> = {
  pending: "#f59e0b",
  preapproved: "#3b82f6",
  approved: "#10b981",
  rejected: "#ef4444",
  cancelled: "#6b7280",
};

export function AdminReportes() {
  const { requests, stats } = useRequests();

  const byStatus = useMemo(
    () =>
      (Object.keys(STATUS_LABELS) as RequestStatus[]).map((s) => ({
        name: STATUS_LABELS[s],
        value: stats[s] ?? 0,
        color: STATUS_COLORS[s],
      })),
    [stats]
  );

  const byReason = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of requests) {
      const label = REASON_LABELS[r.reason as RequestReason] ?? r.reason;
      map[label] = (map[label] ?? 0) + 1;
    }
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [requests]);

  const byArea = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of requests) {
      const k = r.employeeArea || "Sin area";
      map[k] = (map[k] ?? 0) + 1;
    }
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [requests]);

  const byMonth = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of requests) {
      if (!r.createdAt) continue;
      const d = new Date(r.createdAt);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      map[k] = (map[k] ?? 0) + 1;
    }
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, value]) => ({ name, value }));
  }, [requests]);

  const exportCsv = () => {
    const header = [
      "Codigo",
      "Empleado",
      "Documento",
      "Area",
      "Cargo",
      "Motivo",
      "Fecha permiso",
      "Hora inicio",
      "Hora fin",
      "Duracion",
      "Remunerado",
      "Estado",
      "Observaciones",
      "Creado",
    ];
    const rows = requests.map((r) => [
      r.code,
      r.employeeName,
      r.employeeDocument,
      r.employeeArea,
      r.employeePosition,
      REASON_LABELS[r.reason] ?? r.reason,
      r.permissionDate,
      r.startTime,
      r.endTime,
      r.duration,
      r.isPaid ? "Si" : "No",
      STATUS_LABELS[r.status],
      (r.observations ?? "").replace(/[\r\n]+/g, " "),
      r.createdAt,
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `solicitudes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50 min-h-screen">
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-10">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Reportes</h1>
          <p className="text-sm text-gray-500">{requests.length} solicitudes totales</p>
        </div>
        <Button onClick={exportCsv} className="gap-2">
          <Download className="w-4 h-4" />
          Exportar CSV
        </Button>
      </header>

      <main className="flex-1 p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {(Object.keys(STATUS_LABELS) as RequestStatus[]).map((s) => (
            <Card key={s}>
              <CardContent className="pt-4">
                <p className="text-xs uppercase text-gray-500 tracking-wide">{STATUS_LABELS[s]}</p>
                <p className="text-3xl font-bold mt-1" style={{ color: STATUS_COLORS[s] }}>
                  {stats[s] ?? 0}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Por estado</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byStatus} dataKey="value" nameKey="name" outerRadius={90} label>
                    {byStatus.map((d) => (
                      <Cell key={d.name} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Por motivo</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byReason}>
                  <XAxis dataKey="name" fontSize={11} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Por area</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byArea}>
                  <XAxis dataKey="name" fontSize={11} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Solicitudes por mes</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byMonth}>
                  <XAxis dataKey="name" fontSize={11} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
