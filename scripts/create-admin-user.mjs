// One-shot script to create a new admin user (Auth + Firestore doc).
// Run from project root:   node scripts/create-admin-user.mjs

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "..", ".env.local");
const envRaw = readFileSync(envPath, "utf8");
const env = Object.fromEntries(
  envRaw
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const idx = l.indexOf("=");
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
    })
);

const firebaseConfig = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const ADMIN = {
  email: "admin@gestionpermisos.com",
  password: "Admin2026*",
  name: "Administrador Aplicativo",
  role: "admin",
  documentNumber: "0000000000",
  area: "Administracion",
  position: "Administrador del sistema",
  contractType: "Contrato Directo",
  supervisor: "",
  avatar: "AA",
  active: true,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function main() {
  console.log("Project:", firebaseConfig.projectId);
  console.log(`Creating admin: ${ADMIN.email} ...`);

  let uid;
  try {
    const cred = await createUserWithEmailAndPassword(auth, ADMIN.email, ADMIN.password);
    uid = cred.user.uid;
    console.log(`  Auth user created. UID: ${uid}`);
  } catch (err) {
    if (err.code === "auth/email-already-in-use") {
      console.error(
        `\nERROR: El correo ${ADMIN.email} ya esta registrado en Authentication.\n` +
        `       Si quieres reusar ese usuario, abre Firebase Console -> Authentication,\n` +
        `       copia el UID y crea su documento Firestore manualmente, o borra el usuario y vuelve a correr este script.\n`
      );
      process.exit(1);
    }
    throw err;
  }

  const { password, ...userDoc } = ADMIN;
  await setDoc(doc(db, "users", uid), {
    ...userDoc,
    createdAt: serverTimestamp(),
  });
  console.log(`  Firestore doc users/${uid} creado.`);

  console.log("\n=================================");
  console.log("  USUARIO ADMIN CREADO");
  console.log("=================================");
  console.log(`  Correo:      ${ADMIN.email}`);
  console.log(`  Contrasena:  ${ADMIN.password}`);
  console.log(`  Nombre:      ${ADMIN.name}`);
  console.log(`  Rol:         ${ADMIN.role}`);
  console.log("=================================\n");
  console.log("Recomienda al usuario cambiar la contrasena con 'Olvidaste tu contrasena' al primer inicio.\n");
  process.exit(0);
}

main().catch((err) => {
  console.error("FAILED:", err);
  process.exit(1);
});
