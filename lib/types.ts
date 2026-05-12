import { Timestamp } from "firebase/firestore";

export type UserRole = "admin" | "employee";

export type RequestStatus = "pending" | "preapproved" | "approved" | "rejected" | "cancelled";

export type RequestReason = "cita_medica" | "calamidad" | "compensatorio" | "motivos_personales";

export interface AppUser {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  documentNumber: string;
  area: string;
  position: string;
  contractType: string;
  supervisor: string;
  phone?: string;
  costCenter?: string;
  headquarters?: string;
  avatar: string;
  active: boolean;
  createdAt: Timestamp | Date | null;
}

export interface PermissionRequest {
  id: string;
  code: string;
  employeeId: string;
  employeeName: string;
  employeeDocument: string;
  employeeArea: string;
  employeePosition: string;
  contractType: string;
  supervisor: string;
  reason: RequestReason;
  requestDate: string;
  permissionDate: string;
  startTime: string;
  endTime: string;
  duration: string;
  isPaid: boolean;
  hasReplacement: boolean;
  replacementDate?: string;
  replacementStartTime?: string;
  replacementEndTime?: string;
  replacementPerson?: string;
  status: RequestStatus;
  observations?: string;
  attachment?: string;
  attachmentUrl?: string;
  createdAt: string;
  updatedAt?: string;
  history: HistoryEvent[];
}

export interface HistoryEvent {
  date: string;
  action: string;
  by: string;
  byUid?: string;
  observation?: string;
  fromStatus?: RequestStatus;
  toStatus?: RequestStatus;
}

export interface AppNotification {
  id: string;
  userId: string;
  type: "status_change" | "new_request" | "comment";
  requestId?: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface Area {
  id: string;
  name: string;
}

export interface Supervisor {
  id: string;
  name: string;
  area?: string;
  email?: string;
}

export const REASON_LABELS: Record<RequestReason, string> = {
  cita_medica: "Cita Medica",
  calamidad: "Calamidad",
  compensatorio: "Compensatorio",
  motivos_personales: "Motivos Personales",
};

export const STATUS_LABELS: Record<RequestStatus, string> = {
  pending: "Pendiente",
  preapproved: "Pre-aprobada",
  approved: "Aprobada",
  rejected: "Rechazada",
  cancelled: "Cancelada",
};
