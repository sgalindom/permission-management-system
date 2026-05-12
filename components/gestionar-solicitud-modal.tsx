"use client";

import { useState } from "react";
import { useRequests } from "@/lib/requests-context";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RequestStatus, STATUS_LABELS, REASON_LABELS } from "@/lib/types";
import {
  X,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  User,
  Calendar,
  Paperclip,
  Ban,
} from "lucide-react";

interface GestionarSolicitudModalProps {
  requestId: string;
  onClose: () => void;
}

const statusColors = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  preapproved: "bg-sky-100 text-sky-700 border-sky-200",
  approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
  cancelled: "bg-gray-100 text-gray-600 border-gray-200",
};

const statusSteps = ["created", "pending", "preapproved", "approved"] as const;

export function GestionarSolicitudModal({ requestId, onClose }: GestionarSolicitudModalProps) {
  const { getRequestById, updateRequestStatus } = useRequests();
  const { user } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState<RequestStatus | null>(null);
  const [observation, setObservation] = useState("");
  const [error, setError] = useState("");

  const request = getRequestById(requestId);

  if (!request) {
    return null;
  }

  const getCurrentStep = () => {
    switch (request.status) {
      case "pending":
        return 1;
      case "preapproved":
        return 2;
      case "approved":
        return 3;
      case "rejected":
      case "cancelled":
        return 4;
      default:
        return 0;
    }
  };

  const handleSaveDecision = () => {
    if (!selectedStatus) {
      setError("Debe seleccionar una decision");
      return;
    }
    if (!observation.trim()) {
      setError("La observacion es obligatoria al cambiar el estado");
      return;
    }

    updateRequestStatus(request.id, selectedStatus, observation, user?.name || "Admin", user?.uid);
    onClose();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-start justify-between bg-white sticky top-0 z-10">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="font-mono text-sm bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-200">
                #{request.id}
              </span>
              <Badge variant="outline" className={statusColors[request.status]}>
                {STATUS_LABELS[request.status]}
              </Badge>
              <span className="text-xs text-gray-400 font-mono ml-auto">
                Creada: {formatDate(request.createdAt)}
              </span>
            </div>
            <h2 className="text-lg font-bold text-gray-900">
              Solicitud de Permiso - {request.employeeName}
            </h2>
            <p className="text-sm text-gray-500">
              {REASON_LABELS[request.reason]} - Area {request.employeeArea} - Jefe: {request.supervisor.split(" ").slice(0, 2).join(" ")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Status Flow */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              {["Creada", "Pendiente", "Pre-aprobada", "Aprobada", "Rechazada/Cancelada"].map(
                (step, index) => {
                  const currentStep = getCurrentStep();
                  const isDone = index < currentStep;
                  const isCurrent = index === currentStep;
                  const isLast = index === 4;

                  return (
                    <div key={step} className="flex items-center">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            isDone
                              ? "bg-emerald-100 text-emerald-600 border-2 border-emerald-300"
                              : isCurrent
                              ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                              : isLast
                              ? "bg-gray-200 text-gray-400"
                              : "bg-gray-100 text-gray-400 border border-gray-200"
                          }`}
                        >
                          {isDone ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            index + 1
                          )}
                        </div>
                        <span
                          className={`text-xs mt-1 text-center ${
                            isCurrent ? "text-blue-600 font-medium" : isDone ? "text-emerald-600" : "text-gray-400"
                          }`}
                        >
                          {step}
                        </span>
                      </div>
                      {index < 4 && (
                        <div
                          className={`w-12 h-0.5 mx-2 ${isDone ? "bg-emerald-300" : "bg-gray-200"}`}
                        />
                      )}
                    </div>
                  );
                }
              )}
            </div>
          </div>

          {/* Detail Section */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Detalle del permiso
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Empleado</p>
                <p className="text-sm font-medium text-gray-900">{request.employeeName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Documento</p>
                <p className="text-sm font-mono text-gray-900">{request.employeeDocument}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Cargo</p>
                <p className="text-sm font-medium text-gray-900">{request.employeePosition}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Tipo de contrato</p>
                <p className="text-sm text-gray-900">{request.contractType}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Fecha del permiso</p>
                <p className="text-sm font-mono text-gray-900">{request.permissionDate}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Horario</p>
                <p className="text-sm font-mono text-gray-900">
                  {request.startTime} - {request.endTime}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Duracion</p>
                <p className="text-sm text-gray-900">{request.duration}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Motivo</p>
                <span className="text-sm px-2 py-0.5 bg-blue-50 text-blue-700 rounded">
                  {REASON_LABELS[request.reason]}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Permiso remunerado</p>
                <p className={`text-sm font-medium ${request.isPaid ? "text-emerald-600" : "text-red-600"}`}>
                  {request.isPaid ? "Si" : "No"}
                </p>
              </div>
              {request.hasReplacement && (
                <>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Reposicion</p>
                    <p className="text-sm text-gray-900">
                      {request.replacementDate} {request.replacementStartTime} - {request.replacementEndTime}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Persona que reemplaza</p>
                    <p className="text-sm text-gray-900">{request.replacementPerson}</p>
                  </div>
                </>
              )}
              {request.attachment && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Soporte adjunto</p>
                  <button className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                    <Paperclip className="w-3 h-3" />
                    {request.attachment}
                  </button>
                </div>
              )}
            </div>
          </div>

          <hr className="my-6 border-gray-200" />

          {/* Decision Section */}
          {(request.status === "pending" || request.status === "preapproved") && (
            <>
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Cambiar estado - Tomar decision
                </h3>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span className="text-sm text-amber-700">
                    La observacion es <strong>obligatoria</strong> al cambiar el estado de la solicitud
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                  <button
                    onClick={() => setSelectedStatus("approved")}
                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                      selectedStatus === "approved"
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-gray-200 hover:border-emerald-300 bg-white"
                    }`}
                  >
                    <CheckCircle2
                      className={`w-8 h-8 ${selectedStatus === "approved" ? "text-emerald-600" : "text-emerald-400"}`}
                    />
                    <span
                      className={`text-sm font-medium ${
                        selectedStatus === "approved" ? "text-emerald-700" : "text-gray-600"
                      }`}
                    >
                      Aprobar
                    </span>
                  </button>

                  <button
                    onClick={() => setSelectedStatus("preapproved")}
                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                      selectedStatus === "preapproved"
                        ? "border-sky-500 bg-sky-50"
                        : "border-gray-200 hover:border-sky-300 bg-white"
                    }`}
                  >
                    <Clock
                      className={`w-8 h-8 ${selectedStatus === "preapproved" ? "text-sky-600" : "text-sky-400"}`}
                    />
                    <span
                      className={`text-sm font-medium ${
                        selectedStatus === "preapproved" ? "text-sky-700" : "text-gray-600"
                      }`}
                    >
                      Pre-aprobar
                    </span>
                  </button>

                  <button
                    onClick={() => setSelectedStatus("rejected")}
                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                      selectedStatus === "rejected"
                        ? "border-red-500 bg-red-50"
                        : "border-gray-200 hover:border-red-300 bg-white"
                    }`}
                  >
                    <XCircle
                      className={`w-8 h-8 ${selectedStatus === "rejected" ? "text-red-600" : "text-red-400"}`}
                    />
                    <span
                      className={`text-sm font-medium ${
                        selectedStatus === "rejected" ? "text-red-700" : "text-gray-600"
                      }`}
                    >
                      Rechazar
                    </span>
                  </button>

                  <button
                    onClick={() => setSelectedStatus("cancelled")}
                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                      selectedStatus === "cancelled"
                        ? "border-gray-500 bg-gray-100"
                        : "border-gray-200 hover:border-gray-400 bg-white"
                    }`}
                  >
                    <Ban
                      className={`w-8 h-8 ${selectedStatus === "cancelled" ? "text-gray-600" : "text-gray-400"}`}
                    />
                    <span
                      className={`text-sm font-medium ${
                        selectedStatus === "cancelled" ? "text-gray-700" : "text-gray-600"
                      }`}
                    >
                      Cancelar Sol.
                    </span>
                  </button>

                  <button
                    onClick={() => setSelectedStatus("pending")}
                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                      selectedStatus === "pending"
                        ? "border-amber-500 bg-amber-50"
                        : "border-gray-200 hover:border-amber-300 bg-white"
                    }`}
                  >
                    <Clock
                      className={`w-8 h-8 ${selectedStatus === "pending" ? "text-amber-600" : "text-amber-400"}`}
                    />
                    <span
                      className={`text-sm font-medium ${
                        selectedStatus === "pending" ? "text-amber-700" : "text-gray-600"
                      }`}
                    >
                      Mantener Pendiente
                    </span>
                  </button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observation">
                    Observaciones del administrador <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="observation"
                    placeholder="Describa el motivo de la decision tomada..."
                    value={observation}
                    onChange={(e) => {
                      setObservation(e.target.value);
                      setError("");
                    }}
                    className="min-h-20"
                  />
                  {error && <p className="text-sm text-red-500">{error}</p>}
                </div>
              </div>

              <hr className="my-6 border-gray-200" />
            </>
          )}

          {/* History */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Historial de cambios
            </h3>
            <div className="relative">
              <div className="absolute left-3 top-3 bottom-3 w-0.5 bg-gray-200" />
              <div className="space-y-4">
                {request.history.map((entry, index) => (
                  <div key={index} className="flex gap-4 relative">
                    <div className="w-6 h-6 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center z-10">
                      <div className="w-2 h-2 rounded-full bg-gray-400" />
                    </div>
                    <div className="flex-1 pb-2">
                      <p className="text-sm font-medium text-gray-900">{entry.action}</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(entry.date)} - Por: {entry.by}
                      </p>
                      {entry.observation && (
                        <p className="text-sm text-gray-600 mt-1 bg-gray-50 p-2 rounded">
                          {entry.observation}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-white sticky bottom-0">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          {(request.status === "pending" || request.status === "preapproved") && (
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSaveDecision}>
              Guardar decision
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
