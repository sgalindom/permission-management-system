"use client";

import { useState } from "react";
import { useRequests } from "@/lib/requests-context";
import { useAuth } from "@/lib/auth-context";
import { useCatalogs } from "@/lib/catalogs-context";
import { uploadRequestAttachment } from "@/lib/storage-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RequestReason } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  FileText,
  RotateCcw,
  Paperclip,
  Check,
  ChevronLeft,
  Upload,
  AlertCircle,
  X,
  Loader2,
} from "lucide-react";
import { EmployeeView } from "./sidebar";

interface NuevaSolicitudProps {
  onViewChange: (view: EmployeeView) => void;
  onSuccess: () => void;
}

export function NuevaSolicitud({ onViewChange, onSuccess }: NuevaSolicitudProps) {
  const { addRequest } = useRequests();
  const { user } = useAuth();
  const { supervisors } = useCatalogs();

  const [currentStep, setCurrentStep] = useState(2);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    supervisor: user?.supervisor || "",
    contractType: user?.contractType || "Contrato Directo",
    requestDate: new Date().toISOString().split("T")[0],
    permissionDate: "",
    startTime: "",
    endTime: "",
    reason: "" as RequestReason | "",
    hoursCount: 0,
    daysCount: 0,
    hasReplacement: true,
    replacementDate: "",
    replacementStartTime: "",
    replacementEndTime: "",
    replacementPerson: "",
    isPaid: true,
    observations: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const steps = [
    { id: 1, label: "Datos personales", icon: User },
    { id: 2, label: "Detalle del permiso", icon: FileText },
    { id: 3, label: "Reposicion", icon: RotateCcw },
    { id: 4, label: "Confirmacion", icon: Check },
  ];

  const reasons: { value: RequestReason; label: string }[] = [
    { value: "cita_medica", label: "Cita Medica" },
    { value: "calamidad", label: "Calamidad" },
    { value: "compensatorio", label: "Compensatorio" },
    { value: "motivos_personales", label: "Motivos Personales" },
  ];

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateStep = () => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 2) {
      if (!formData.permissionDate) newErrors.permissionDate = "Fecha del permiso es requerida";
      if (!formData.startTime) newErrors.startTime = "Hora de inicio es requerida";
      if (!formData.endTime) newErrors.endTime = "Hora de fin es requerida";
      if (!formData.reason) newErrors.reason = "Motivo es requerido";
      if (formData.hoursCount === 0 && formData.daysCount === 0) {
        newErrors.duration = "Debe seleccionar duracion en horas o dias";
      }
    }

    if (currentStep === 3 && formData.hasReplacement) {
      if (!formData.replacementDate) newErrors.replacementDate = "Fecha de reposicion es requerida";
      if (!formData.replacementStartTime) newErrors.replacementStartTime = "Hora inicio reposicion es requerida";
      if (!formData.replacementEndTime) newErrors.replacementEndTime = "Hora fin reposicion es requerida";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 2));
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    if (!user) {
      setSubmitError("Sesion no valida.");
      return;
    }
    setSubmitError(null);
    setSubmitting(true);

    try {
      const duration =
        formData.daysCount > 0
          ? `${formData.daysCount} dia${formData.daysCount > 1 ? "s" : ""}`
          : `${formData.hoursCount}h`;

      let attachment: string | undefined;
      let attachmentUrl: string | undefined;
      if (attachmentFile) {
        const uploaded = await uploadRequestAttachment(attachmentFile, { employeeUid: user.uid });
        attachment = uploaded.name;
        attachmentUrl = uploaded.url;
      }

      await addRequest({
        employeeId: user.uid,
        employeeName: user.name,
        employeeDocument: user.documentNumber || "",
        employeeArea: user.area || "",
        employeePosition: user.position || "",
        contractType: formData.contractType,
        supervisor: formData.supervisor,
        reason: formData.reason as RequestReason,
        requestDate: formData.requestDate,
        permissionDate: formData.permissionDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
        duration,
        isPaid: formData.isPaid,
        hasReplacement: formData.hasReplacement,
        replacementDate: formData.hasReplacement ? formData.replacementDate : undefined,
        replacementStartTime: formData.hasReplacement ? formData.replacementStartTime : undefined,
        replacementEndTime: formData.hasReplacement ? formData.replacementEndTime : undefined,
        replacementPerson: formData.hasReplacement ? formData.replacementPerson : undefined,
        status: "pending",
        observations: formData.observations,
        attachment,
        attachmentUrl,
      });

      onSuccess();
    } catch (err) {
      console.error(err);
      setSubmitError("No fue posible enviar la solicitud. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50 min-h-screen">
      {/* Top Bar */}
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-10">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Nueva Solicitud de Permiso</h1>
          <p className="text-sm text-gray-500">Inicio / Mis Solicitudes / Nueva</p>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-4xl mx-auto w-full">
        {/* Stepper */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                      currentStep > step.id
                        ? "bg-emerald-100 text-emerald-600 border-2 border-emerald-300"
                        : currentStep === step.id
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                        : "bg-gray-100 text-gray-400 border border-gray-200"
                    }`}
                  >
                    {currentStep > step.id ? <Check className="w-4 h-4" /> : step.id}
                  </div>
                  <span
                    className={`text-sm font-medium hidden md:inline ${
                      currentStep === step.id
                        ? "text-blue-600"
                        : currentStep > step.id
                        ? "text-emerald-600"
                        : "text-gray-400"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-8 lg:w-16 h-0.5 mx-2 ${
                      currentStep > step.id ? "bg-emerald-300" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Employee Data (Read-only) */}
        <Card className="mb-4">
          <CardHeader className="py-4 bg-gray-50 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-500" />
                <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Datos del empleado
                </CardTitle>
              </div>
              <span className="text-xs text-blue-600 cursor-pointer hover:underline">Editar</span>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-500">Nombres y apellidos</Label>
                <Input value={user?.name ?? ""} disabled className="bg-gray-50 mt-1" />
              </div>
              <div>
                <Label className="text-gray-500">Documento</Label>
                <Input value={user?.documentNumber ?? ""} disabled className="bg-gray-50 mt-1 font-mono" />
              </div>
              <div>
                <Label className="text-gray-500">Area</Label>
                <Input value={user?.area ?? ""} disabled className="bg-gray-50 mt-1" />
              </div>
              <div>
                <Label className="text-gray-500">Cargo</Label>
                <Input value={user?.position ?? ""} disabled className="bg-gray-50 mt-1" />
              </div>
              <div>
                <Label className="text-gray-500">Tipo de contrato</Label>
                <Select
                  value={formData.contractType}
                  onValueChange={(v) => handleInputChange("contractType", v)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Contrato Directo">Contrato Directo</SelectItem>
                    <SelectItem value="Contrato Temporal">Contrato Temporal</SelectItem>
                    <SelectItem value="Prestacion de Servicios">Prestacion de Servicios</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-500">
                  Jefe inmediato <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.supervisor}
                  onValueChange={(v) => handleInputChange("supervisor", v)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Seleccione jefe inmediato" />
                  </SelectTrigger>
                  <SelectContent>
                    {supervisors.map((sup) => (
                      <SelectItem key={sup.id} value={sup.name}>
                        {sup.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Permission Details */}
        {currentStep >= 2 && (
          <Card className="mb-4">
            <CardHeader className="py-4 bg-gray-50 border-b">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-500" />
                <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Detalle del permiso
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>
                    Fecha de solicitud <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={formData.requestDate}
                    onChange={(e) => handleInputChange("requestDate", e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>
                    Fecha del permiso <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={formData.permissionDate}
                    onChange={(e) => handleInputChange("permissionDate", e.target.value)}
                    className={`mt-1 ${errors.permissionDate ? "border-red-500" : ""}`}
                  />
                  {errors.permissionDate && (
                    <p className="text-xs text-red-500 mt-1">{errors.permissionDate}</p>
                  )}
                </div>
                <div>
                  <Label>
                    Permiso desde <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => handleInputChange("startTime", e.target.value)}
                    className={`mt-1 ${errors.startTime ? "border-red-500" : ""}`}
                  />
                  {errors.startTime && <p className="text-xs text-red-500 mt-1">{errors.startTime}</p>}
                </div>
                <div>
                  <Label>
                    Permiso hasta <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => handleInputChange("endTime", e.target.value)}
                    className={`mt-1 ${errors.endTime ? "border-red-500" : ""}`}
                  />
                  {errors.endTime && <p className="text-xs text-red-500 mt-1">{errors.endTime}</p>}
                </div>
                <div className="md:col-span-2">
                  <Label>
                    Motivo del permiso <span className="text-red-500">*</span>
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                    {reasons.map((r) => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => handleInputChange("reason", r.value)}
                        className={`p-3 rounded-lg border-2 transition-all text-left ${
                          formData.reason === r.value
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-200 hover:border-blue-300 text-gray-600"
                        }`}
                      >
                        <span className="text-sm font-medium">{r.label}</span>
                      </button>
                    ))}
                  </div>
                  {errors.reason && <p className="text-xs text-red-500 mt-1">{errors.reason}</p>}
                </div>
              </div>

              {/* Duration Selection */}
              <div className="mt-6">
                <Label>
                  Duracion del permiso <span className="text-red-500">*</span>
                </Label>
                <div className="mt-2 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-2 text-xs text-amber-600 mb-3">
                    <AlertCircle className="w-4 h-4" />
                    Si el permiso es por horas, marcar N/A en Dias. Si es por dias, marcar N/A en Horas.
                  </div>

                  <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Horas</p>
                    <div className="flex gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          handleInputChange("hoursCount", 0);
                          handleInputChange("daysCount", formData.daysCount || 1);
                        }}
                        className={`px-3 py-2 rounded border text-sm ${
                          formData.hoursCount === 0 && formData.daysCount > 0
                            ? "bg-blue-50 border-blue-300 text-blue-700"
                            : "border-gray-200 text-gray-600"
                        }`}
                      >
                        N/A
                      </button>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((h) => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => {
                            handleInputChange("hoursCount", h);
                            handleInputChange("daysCount", 0);
                          }}
                          className={`px-3 py-2 rounded border text-sm ${
                            formData.hoursCount === h
                              ? "bg-blue-50 border-blue-300 text-blue-700 font-semibold"
                              : "border-gray-200 text-gray-600 hover:border-blue-200"
                          }`}
                        >
                          {h}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Dias</p>
                    <div className="flex gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          handleInputChange("daysCount", 0);
                          handleInputChange("hoursCount", formData.hoursCount || 1);
                        }}
                        className={`px-3 py-2 rounded border text-sm ${
                          formData.daysCount === 0 && formData.hoursCount > 0
                            ? "bg-blue-50 border-blue-300 text-blue-700"
                            : "border-gray-200 text-gray-600"
                        }`}
                      >
                        N/A
                      </button>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => {
                            handleInputChange("daysCount", d);
                            handleInputChange("hoursCount", 0);
                          }}
                          className={`px-3 py-2 rounded border text-sm ${
                            formData.daysCount === d
                              ? "bg-blue-50 border-blue-300 text-blue-700 font-semibold"
                              : "border-gray-200 text-gray-600 hover:border-blue-200"
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                  {errors.duration && <p className="text-xs text-red-500 mt-2">{errors.duration}</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Replacement */}
        {currentStep >= 3 && (
          <Card className="mb-4">
            <CardHeader className="py-4 bg-gray-50 border-b">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-gray-500" />
                <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Reposicion del tiempo
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <div className="mb-4">
                <Label>
                  Realizara reposicion? <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-4 mt-2">
                  <button
                    type="button"
                    onClick={() => handleInputChange("hasReplacement", true)}
                    className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                      formData.hasReplacement
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 text-gray-600"
                    }`}
                  >
                    Si, voy a reponer
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInputChange("hasReplacement", false)}
                    className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                      !formData.hasReplacement
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 text-gray-600"
                    }`}
                  >
                    No - N/A
                  </button>
                </div>
              </div>

              {formData.hasReplacement && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>
                      Fecha de reposicion <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="date"
                      value={formData.replacementDate}
                      onChange={(e) => handleInputChange("replacementDate", e.target.value)}
                      className={`mt-1 ${errors.replacementDate ? "border-red-500" : ""}`}
                    />
                    {errors.replacementDate && (
                      <p className="text-xs text-red-500 mt-1">{errors.replacementDate}</p>
                    )}
                  </div>
                  <div>
                    <Label>Persona que reemplaza</Label>
                    <Input
                      value={formData.replacementPerson}
                      onChange={(e) => handleInputChange("replacementPerson", e.target.value)}
                      placeholder="Nombre del reemplazante"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>
                      Reposicion desde <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="time"
                      value={formData.replacementStartTime}
                      onChange={(e) => handleInputChange("replacementStartTime", e.target.value)}
                      className={`mt-1 ${errors.replacementStartTime ? "border-red-500" : ""}`}
                    />
                    {errors.replacementStartTime && (
                      <p className="text-xs text-red-500 mt-1">{errors.replacementStartTime}</p>
                    )}
                  </div>
                  <div>
                    <Label>
                      Reposicion hasta <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="time"
                      value={formData.replacementEndTime}
                      onChange={(e) => handleInputChange("replacementEndTime", e.target.value)}
                      className={`mt-1 ${errors.replacementEndTime ? "border-red-500" : ""}`}
                    />
                    {errors.replacementEndTime && (
                      <p className="text-xs text-red-500 mt-1">{errors.replacementEndTime}</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 4: Additional Info */}
        {currentStep >= 4 && (
          <Card className="mb-4">
            <CardHeader className="py-4 bg-gray-50 border-b">
              <div className="flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-gray-500" />
                <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Informacion adicional
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>
                    Permiso remunerado? <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex gap-4 mt-2">
                    <button
                      type="button"
                      onClick={() => handleInputChange("isPaid", true)}
                      className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                        formData.isPaid
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 text-gray-600"
                      }`}
                    >
                      Si
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInputChange("isPaid", false)}
                      className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                        !formData.isPaid
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 text-gray-600"
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>
                <div>
                  <Label>Observaciones</Label>
                  <Textarea
                    value={formData.observations}
                    onChange={(e) => handleInputChange("observations", e.target.value)}
                    placeholder="Informacion adicional..."
                    className="mt-1"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Adjuntar soporte (cita medica, calamidad, etc.)</Label>
                  {attachmentFile ? (
                    <div className="mt-2 flex items-center justify-between border border-gray-200 rounded-lg p-3 bg-gray-50">
                      <div className="flex items-center gap-2 min-w-0">
                        <Paperclip className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{attachmentFile.name}</p>
                          <p className="text-xs text-gray-500">
                            {(attachmentFile.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAttachmentFile(null)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <X className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  ) : (
                    <label className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all flex flex-col items-center">
                      <Upload className="w-10 h-10 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">Haz clic para adjuntar el archivo</p>
                      <p className="text-xs text-gray-400 mt-1">Max. 10 MB</p>
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          if (f.size > 10 * 1024 * 1024) {
                            setSubmitError("El archivo excede 10 MB.");
                            return;
                          }
                          setSubmitError(null);
                          setAttachmentFile(f);
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {submitError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={currentStep === 2 ? () => onViewChange("mis-solicitudes") : handlePrev}
              className="gap-2"
              disabled={submitting}
            >
              <ChevronLeft className="w-4 h-4" />
              {currentStep === 2 ? "Cancelar" : "Anterior"}
            </Button>
            <div className="flex gap-3">
              {currentStep < 4 ? (
                <Button
                  onClick={handleNext}
                  className="bg-blue-600 hover:bg-blue-700 gap-2"
                >
                  Siguiente
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700 gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar solicitud"
                  )}
                </Button>
              )}
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
