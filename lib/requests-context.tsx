"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./auth-context";
import {
  HistoryEvent,
  PermissionRequest,
  RequestStatus,
} from "./types";

interface Stats {
  total: number;
  pending: number;
  preapproved: number;
  approved: number;
  rejected: number;
  cancelled: number;
}

interface NewRequestInput
  extends Omit<PermissionRequest, "id" | "code" | "createdAt" | "updatedAt" | "history" | "status"> {
  status?: RequestStatus;
}

interface RequestsContextType {
  requests: PermissionRequest[];
  loading: boolean;
  stats: Stats;
  addRequest: (request: NewRequestInput) => Promise<string>;
  updateRequestStatus: (
    id: string,
    status: RequestStatus,
    observation: string,
    by: string,
    byUid?: string
  ) => Promise<void>;
  cancelRequest: (id: string, by: string, byUid?: string) => Promise<void>;
  getRequestById: (id: string) => PermissionRequest | undefined;
  getRequestsByEmployee: (employeeId: string) => PermissionRequest[];
}

const RequestsContext = createContext<RequestsContextType | undefined>(undefined);

function tsToIso(value: unknown): string {
  if (!value) return "";
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return "";
}

function mapRequest(id: string, data: Record<string, unknown>): PermissionRequest {
  const history = Array.isArray(data.history)
    ? (data.history as Array<Record<string, unknown>>).map((h) => ({
        date: tsToIso(h.date),
        action: String(h.action ?? ""),
        by: String(h.by ?? ""),
        byUid: h.byUid as string | undefined,
        observation: h.observation as string | undefined,
        fromStatus: h.fromStatus as RequestStatus | undefined,
        toStatus: h.toStatus as RequestStatus | undefined,
      }))
    : [];
  return {
    id,
    code: String(data.code ?? id),
    employeeId: String(data.employeeId ?? ""),
    employeeName: String(data.employeeName ?? ""),
    employeeDocument: String(data.employeeDocument ?? ""),
    employeeArea: String(data.employeeArea ?? ""),
    employeePosition: String(data.employeePosition ?? ""),
    contractType: String(data.contractType ?? ""),
    supervisor: String(data.supervisor ?? ""),
    reason: data.reason as PermissionRequest["reason"],
    requestDate: String(data.requestDate ?? ""),
    permissionDate: String(data.permissionDate ?? ""),
    startTime: String(data.startTime ?? ""),
    endTime: String(data.endTime ?? ""),
    duration: String(data.duration ?? ""),
    isPaid: Boolean(data.isPaid),
    hasReplacement: Boolean(data.hasReplacement),
    replacementDate: data.replacementDate as string | undefined,
    replacementStartTime: data.replacementStartTime as string | undefined,
    replacementEndTime: data.replacementEndTime as string | undefined,
    replacementPerson: data.replacementPerson as string | undefined,
    status: (data.status as RequestStatus) ?? "pending",
    observations: data.observations as string | undefined,
    attachment: data.attachment as string | undefined,
    attachmentUrl: data.attachmentUrl as string | undefined,
    createdAt: tsToIso(data.createdAt),
    updatedAt: tsToIso(data.updatedAt),
    history,
  };
}

async function nextRequestCode(): Promise<string> {
  const counterRef = doc(db, "counters", "requests");
  return await runTransaction(db, async (tx) => {
    const snap = await tx.get(counterRef);
    const current = (snap.exists() ? (snap.data().lastNumber as number) : 0) || 0;
    const next = current + 1;
    tx.set(counterRef, { lastNumber: next }, { merge: true });
    return `PRM-${String(next).padStart(4, "0")}`;
  });
}

export function RequestsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [requests, setRequests] = useState<PermissionRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRequests([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const col = collection(db, "requests");
    const q =
      user.role === "admin"
        ? query(col, orderBy("createdAt", "desc"))
        : query(col, where("employeeId", "==", user.uid), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(
      q,
      (snap) => {
        setRequests(snap.docs.map((d) => mapRequest(d.id, d.data())));
        setLoading(false);
      },
      (err) => {
        console.error("requests snapshot error:", err);
        setLoading(false);
      }
    );
    return unsub;
  }, [user]);

  const stats = useMemo<Stats>(() => {
    const s: Stats = {
      total: requests.length,
      pending: 0,
      preapproved: 0,
      approved: 0,
      rejected: 0,
      cancelled: 0,
    };
    for (const r of requests) s[r.status]++;
    return s;
  }, [requests]);

  const addRequest = useCallback<RequestsContextType["addRequest"]>(
    async (input) => {
      const code = await nextRequestCode();
      const now = new Date().toISOString();
      const history: HistoryEvent[] = [
        { date: now, action: "Solicitud creada", by: input.employeeName },
        { date: now, action: "Estado: Pendiente de revision", by: "Sistema automatico" },
      ];
      const payload = {
        ...input,
        code,
        status: input.status ?? "pending",
        history,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      // Firestore no acepta valores undefined: eliminarlos antes de escribir.
      const clean = Object.fromEntries(
        Object.entries(payload).filter(([, v]) => v !== undefined)
      );
      const ref = await addDoc(collection(db, "requests"), clean);
      return ref.id;
    },
    []
  );

  const updateRequestStatus = useCallback<RequestsContextType["updateRequestStatus"]>(
    async (id, status, observation, by, byUid) => {
      const ref = doc(db, "requests", id);
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists()) throw new Error("Solicitud no encontrada");
        const data = snap.data();
        const fromStatus = data.status as RequestStatus;
        const newEvent = {
          date: new Date().toISOString(),
          action: `Estado cambiado a: ${status}`,
          by,
          byUid: byUid ?? null,
          observation,
          fromStatus,
          toStatus: status,
        };
        const prevHistory = Array.isArray(data.history) ? data.history : [];
        tx.update(ref, {
          status,
          observations: observation,
          updatedAt: serverTimestamp(),
          history: [...prevHistory, newEvent],
        });

        if (data.employeeId && data.employeeId !== byUid) {
          const notifRef = doc(collection(db, "notifications"));
          tx.set(notifRef, {
            userId: data.employeeId,
            type: "status_change",
            requestId: id,
            title: `Tu solicitud ${data.code ?? id} fue actualizada`,
            message: `Nuevo estado: ${status}. ${observation ? "Observacion: " + observation : ""}`,
            read: false,
            createdAt: serverTimestamp(),
          });
        }
      });
    },
    []
  );

  const cancelRequest = useCallback<RequestsContextType["cancelRequest"]>(
    async (id, by, byUid) => {
      await updateRequestStatus(id, "cancelled", "Cancelada por el empleado", by, byUid);
    },
    [updateRequestStatus]
  );

  const getRequestById = useCallback(
    (id: string) => requests.find((r) => r.id === id || r.code === id),
    [requests]
  );

  const getRequestsByEmployee = useCallback(
    (employeeId: string) => requests.filter((r) => r.employeeId === employeeId),
    [requests]
  );

  return (
    <RequestsContext.Provider
      value={{
        requests,
        loading,
        stats,
        addRequest,
        updateRequestStatus,
        cancelRequest,
        getRequestById,
        getRequestsByEmployee,
      }}
    >
      {children}
    </RequestsContext.Provider>
  );
}

export function useRequests() {
  const context = useContext(RequestsContext);
  if (context === undefined) {
    throw new Error("useRequests must be used within a RequestsProvider");
  }
  return context;
}
