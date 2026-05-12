// One-shot script to seed the first admin user document in Firestore.
// Uses the public web SDK (works while security rules allow writes).
//
// Run from project root:   node scripts/bootstrap-admin.mjs
//
// After running, RE-LOCK your firestore.rules and re-publish them.

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { initializeApp } from "firebase/app";
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
  uid: "5f9eAZbrkvaLE3QB9YmOe6BzABj2",
  email: "sgalindom2612@gmail.com",
  name: "Sebastian Galindo",
  role: "admin",
  documentNumber: "0000000000",
  area: "Administracion",
  position: "Administrador",
  contractType: "Contrato Directo",
  supervisor: "",
  avatar: "SG",
  active: true,
};

const SEED_AREAS = [
  "Administrativo",
  "Comercial",
  "Logistica",
  "Soporte Tecnico",
];

const SEED_SUPERVISORS = [
  "Belcy Astrid Angulo Rodriguez",
  "Jeniffer Damaris Gomez",
  "Daniel Felipe Valenzuela Cuadros",
  "Giselle Escobar Zapata",
  "Andrea Beltran Moreno",
];

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function main() {
  console.log("Project:", firebaseConfig.projectId);

  // 1. Admin user doc
  console.log(`Writing users/${ADMIN.uid} ...`);
  const { uid, ...rest } = ADMIN;
  await setDoc(doc(db, "users", uid), {
    ...rest,
    createdAt: serverTimestamp(),
  });
  console.log("  OK admin user doc created");

  // 2. Counter doc
  console.log("Writing counters/requests ...");
  await setDoc(doc(db, "counters", "requests"), { lastNumber: 0 }, { merge: true });
  console.log("  OK counter created");

  // 3. Seed areas
  console.log("Seeding areas ...");
  for (const name of SEED_AREAS) {
    const id = name.toLowerCase().replace(/\s+/g, "-");
    await setDoc(doc(db, "areas", id), { name });
    console.log(`  + area: ${name}`);
  }

  // 4. Seed supervisors
  console.log("Seeding supervisors ...");
  for (const name of SEED_SUPERVISORS) {
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    await setDoc(doc(db, "supervisors", id), { name });
    console.log(`  + supervisor: ${name}`);
  }

  console.log("\nDONE. You can now log in at http://localhost:3000");
  console.log("REMINDER: re-publish your firestore.rules (locked-down version)\n");
  process.exit(0);
}

main().catch((err) => {
  console.error("FAILED:", err);
  process.exit(1);
});
