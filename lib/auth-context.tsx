"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { AppUser, UserRole } from "./types";

export type { UserRole } from "./types";

// Legacy alias so older components keep working.
export interface User {
  id: string;
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  area: string;
  position: string;
  avatar: string;
  documentNumber?: string;
  contractType?: string;
  supervisor?: string;
  phone?: string;
  costCenter?: string;
  headquarters?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ ok: boolean; error?: string }>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function initialsOf(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

async function hydrateUser(fbUser: FirebaseUser): Promise<User | null> {
  const ref = doc(db, "users", fbUser.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data() as AppUser;
  if (data.active === false) return null;
  return {
    id: fbUser.uid,
    uid: fbUser.uid,
    name: data.name ?? fbUser.displayName ?? fbUser.email ?? "",
    email: data.email ?? fbUser.email ?? "",
    role: data.role,
    area: data.area ?? "",
    position: data.position ?? "",
    avatar: data.avatar ?? initialsOf(data.name ?? fbUser.email ?? "?"),
    documentNumber: data.documentNumber,
    contractType: data.contractType,
    supervisor: data.supervisor,
    phone: data.phone,
    costCenter: data.costCenter,
    headquarters: data.headquarters,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        const hydrated = await hydrateUser(fbUser);
        if (!hydrated) {
          await signOut(auth);
          setUser(null);
        } else {
          setUser(hydrated);
        }
      } catch (err) {
        console.error("Error hydrating user:", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });
    return unsub;
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const hydrated = await hydrateUser(cred.user);
      if (!hydrated) {
        await signOut(auth);
        return {
          ok: false,
          error: "Tu cuenta no esta registrada en el sistema o esta inactiva. Contacta al administrador.",
        };
      }
      setUser(hydrated);
      return { ok: true };
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? "";
      const message =
        code === "auth/invalid-credential" ||
        code === "auth/wrong-password" ||
        code === "auth/user-not-found" ||
        code === "auth/invalid-email"
          ? "Las credenciales ingresadas son incorrectas."
          : code === "auth/too-many-requests"
          ? "Demasiados intentos fallidos. Intenta de nuevo en unos minutos."
          : "No fue posible iniciar sesion. Intenta de nuevo.";
      return { ok: false, error: message };
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email.trim());
      return { ok: true };
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? "";
      const message =
        code === "auth/user-not-found"
          ? "No existe una cuenta con ese correo."
          : code === "auth/invalid-email"
          ? "El correo no tiene un formato valido."
          : "No fue posible enviar el correo de recuperacion.";
      return { ok: false, error: message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        resetPassword,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
