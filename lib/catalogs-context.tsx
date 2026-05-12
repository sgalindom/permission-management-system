"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import { Area, Supervisor } from "./types";

interface CatalogsContextType {
  areas: Area[];
  supervisors: Supervisor[];
  loading: boolean;
  addArea: (name: string) => Promise<void>;
  updateArea: (id: string, name: string) => Promise<void>;
  deleteArea: (id: string) => Promise<void>;
  addSupervisor: (data: Omit<Supervisor, "id">) => Promise<void>;
  updateSupervisor: (id: string, data: Partial<Omit<Supervisor, "id">>) => Promise<void>;
  deleteSupervisor: (id: string) => Promise<void>;
}

const CatalogsContext = createContext<CatalogsContextType | undefined>(undefined);

export function CatalogsProvider({ children }: { children: ReactNode }) {
  const [areas, setAreas] = useState<Area[]>([]);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [loadingAreas, setLoadingAreas] = useState(true);
  const [loadingSupervisors, setLoadingSupervisors] = useState(true);

  useEffect(() => {
    const unsubAreas = onSnapshot(
      query(collection(db, "areas"), orderBy("name")),
      (snap) => {
        setAreas(snap.docs.map((d) => ({ id: d.id, name: String(d.data().name ?? "") })));
        setLoadingAreas(false);
      },
      () => setLoadingAreas(false)
    );
    const unsubSup = onSnapshot(
      query(collection(db, "supervisors"), orderBy("name")),
      (snap) => {
        setSupervisors(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              name: String(data.name ?? ""),
              area: data.area as string | undefined,
              email: data.email as string | undefined,
            };
          })
        );
        setLoadingSupervisors(false);
      },
      () => setLoadingSupervisors(false)
    );
    return () => {
      unsubAreas();
      unsubSup();
    };
  }, []);

  const addArea = async (name: string) => {
    await addDoc(collection(db, "areas"), { name });
  };
  const updateArea = async (id: string, name: string) => {
    await updateDoc(doc(db, "areas", id), { name });
  };
  const deleteArea = async (id: string) => {
    await deleteDoc(doc(db, "areas", id));
  };

  const addSupervisor = async (data: Omit<Supervisor, "id">) => {
    await addDoc(collection(db, "supervisors"), data);
  };
  const updateSupervisor = async (id: string, data: Partial<Omit<Supervisor, "id">>) => {
    await updateDoc(doc(db, "supervisors", id), data);
  };
  const deleteSupervisor = async (id: string) => {
    await deleteDoc(doc(db, "supervisors", id));
  };

  return (
    <CatalogsContext.Provider
      value={{
        areas,
        supervisors,
        loading: loadingAreas || loadingSupervisors,
        addArea,
        updateArea,
        deleteArea,
        addSupervisor,
        updateSupervisor,
        deleteSupervisor,
      }}
    >
      {children}
    </CatalogsContext.Provider>
  );
}

export function useCatalogs() {
  const ctx = useContext(CatalogsContext);
  if (!ctx) throw new Error("useCatalogs must be used within a CatalogsProvider");
  return ctx;
}
