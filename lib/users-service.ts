"use client";

import { createUserWithEmailAndPassword, getAuth, signOut } from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db, getSecondaryApp } from "./firebase";
import { AppUser, UserRole } from "./types";

export interface CreateUserInput {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  documentNumber: string;
  area: string;
  position: string;
  contractType?: string;
  supervisor?: string;
  phone?: string;
  costCenter?: string;
  headquarters?: string;
}

function initialsOf(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Admin creates a new user. Uses a secondary Firebase app instance so the
 * admin's own session is NOT replaced after createUserWithEmailAndPassword.
 */
export async function adminCreateUser(input: CreateUserInput): Promise<{ uid: string }> {
  const secondaryApp = getSecondaryApp();
  const secondaryAuth = getAuth(secondaryApp);

  const cred = await createUserWithEmailAndPassword(
    secondaryAuth,
    input.email.trim(),
    input.password
  );
  const uid = cred.user.uid;

  const userDoc: Omit<AppUser, "uid"> = {
    email: input.email.trim(),
    name: input.name,
    role: input.role,
    documentNumber: input.documentNumber,
    area: input.area,
    position: input.position,
    contractType: input.contractType ?? "Contrato Directo",
    supervisor: input.supervisor ?? "",
    phone: input.phone,
    costCenter: input.costCenter,
    headquarters: input.headquarters,
    avatar: initialsOf(input.name),
    active: true,
    createdAt: serverTimestamp() as unknown as Date,
  };

  await setDoc(doc(db, "users", uid), userDoc);

  // Sign out the secondary instance immediately so it doesn't keep that session.
  await signOut(secondaryAuth);

  return { uid };
}

export async function updateUser(uid: string, patch: Partial<AppUser>): Promise<void> {
  await updateDoc(doc(db, "users", uid), patch);
}

export async function setUserActive(uid: string, active: boolean): Promise<void> {
  await updateDoc(doc(db, "users", uid), { active });
}

export async function listUsersOnce(): Promise<AppUser[]> {
  const snap = await getDocs(query(collection(db, "users"), orderBy("name")));
  return snap.docs.map((d) => ({ uid: d.id, ...(d.data() as Omit<AppUser, "uid">) }));
}

export function subscribeToUsers(cb: (users: AppUser[]) => void): () => void {
  return onSnapshot(query(collection(db, "users"), orderBy("name")), (snap) => {
    cb(snap.docs.map((d) => ({ uid: d.id, ...(d.data() as Omit<AppUser, "uid">) })));
  });
}
