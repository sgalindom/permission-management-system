# Backend — GestionaPermisos

## ¿Qué es "backend" aquí?

La aplicación **no tiene servidor propio**. El backend lo provee **Firebase** como BaaS. La "lógica de backend" vive en tres capas:

1. **Servicios de Firebase** (Auth, Firestore, Storage) — accedidos vía SDK web desde el cliente.
2. **Reglas de seguridad** (`firestore.rules`, `storage.rules`) — controlan quién puede leer/escribir qué.
3. **Módulos de servicio en `lib/`** — funciones puras que orquestan llamadas al SDK y empaquetan la lógica de negocio.

## Mapa de servicios

```
lib/firebase.ts
   ├── app        (FirebaseApp principal)
   ├── auth       (Authentication)
   ├── db         (Firestore)
   ├── storage    (Cloud Storage)
   └── getSecondaryApp()   ← instancia paralela para crear usuarios

lib/auth-context.tsx       ← sesión, login, reset password
lib/requests-context.tsx   ← CRUD de solicitudes + transacciones
lib/catalogs-context.tsx   ← CRUD de áreas/supervisores
lib/notifications-context.tsx ← lista + marcar leídas
lib/users-service.ts       ← admin crea/edita usuarios
lib/storage-service.ts     ← subir adjuntos
```

## Authentication

### Proveedor habilitado
- **Email / Password** (Firebase Authentication estándar).

### Operaciones expuestas

| Función | Archivo | Hace |
|---|---|---|
| `login(email, password)` | `auth-context.tsx` | `signInWithEmailAndPassword` + lee doc `users/{uid}` para hidratar el rol. Si el doc no existe o `active=false`, cierra sesión. |
| `logout()` | `auth-context.tsx` | `signOut(auth)` |
| `resetPassword(email)` | `auth-context.tsx` | `sendPasswordResetEmail(auth, email)` — envía email estándar de Firebase |
| `adminCreateUser(input)` | `users-service.ts` | Crea usuario en **instancia secundaria** (ver más abajo) y escribe doc en `users/` |
| `updatePassword` (en perfil) | `empleado-perfil.tsx` | `reauthenticateWithCredential` + `updatePassword` |

### Patrón "instancia secundaria"

**Problema:** cuando el admin llama `createUserWithEmailAndPassword`, Firebase Auth **reemplaza la sesión activa** con la del nuevo usuario. El admin sería desconectado.

**Solución:** se inicializa una segunda app de Firebase (`getSecondaryApp()`) con la misma config pero nombre distinto. El nuevo usuario se crea en esa instancia secundaria, sin afectar la sesión principal del admin.

```ts
// lib/users-service.ts
const secondaryApp = getSecondaryApp();
const secondaryAuth = getAuth(secondaryApp);
const cred = await createUserWithEmailAndPassword(secondaryAuth, email, pass);
await setDoc(doc(db, "users", cred.user.uid), userDoc);
await signOut(secondaryAuth);  // liberamos la sesión secundaria
```

## Firestore

### Lectura reactiva (real-time)

Todas las pantallas que muestran datos usan `onSnapshot`. Esto significa:
- No hay polling.
- Cuando alguien escribe en Firestore, el cambio se propaga a todos los clientes suscritos en milisegundos.

Ejemplo:

```ts
// lib/requests-context.tsx
const q = user.role === "admin"
  ? query(collection(db, "requests"), orderBy("createdAt", "desc"))
  : query(collection(db, "requests"), where("employeeId", "==", user.uid), orderBy("createdAt", "desc"));

const unsub = onSnapshot(q, (snap) => {
  setRequests(snap.docs.map((d) => mapRequest(d.id, d.data())));
});
```

### Transacciones

Operaciones que **deben ser atómicas** usan `runTransaction`:

#### 1. Cambio de estado de una solicitud
Actualiza el documento de la solicitud + añade evento al historial + crea documento de notificación, **todo o nada**.

```ts
await runTransaction(db, async (tx) => {
  const snap = await tx.get(ref);
  // ... validaciones ...
  tx.update(ref, { status, observations, history: [...] });

  if (data.employeeId !== byUid) {
    const notifRef = doc(collection(db, "notifications"));
    tx.set(notifRef, { userId, type, requestId, title, message, read: false, ... });
  }
});
```

#### 2. Generación del código `PRM-XXXX`
Lee el contador, lo incrementa y lo guarda, todo en una transacción para evitar duplicados con concurrencia.

```ts
async function nextRequestCode(): Promise<string> {
  const counterRef = doc(db, "counters", "requests");
  return await runTransaction(db, async (tx) => {
    const snap = await tx.get(counterRef);
    const next = (snap.exists() ? snap.data().lastNumber : 0) + 1;
    tx.set(counterRef, { lastNumber: next }, { merge: true });
    return `PRM-${String(next).padStart(4, "0")}`;
  });
}
```

### Operaciones por batch
La función `markAllAsRead` de notificaciones usa `writeBatch` para marcar varias en una sola operación de red.

## Storage

### Estructura de carpetas

```
gs://gestor-de-permiso.firebasestorage.app/
└── requests/
    └── {employeeUid}/
        └── {requestId-or-tmp-folder}/
            └── {timestamp}-{filename}
```

### Upload

```ts
// lib/storage-service.ts
export async function uploadRequestAttachment(
  file: File,
  opts: { requestId?: string; employeeUid: string }
): Promise<{ url: string; path: string; name: string }> {
  const safeName = file.name.replace(/[^\w.\-]+/g, "_");
  const path = `requests/${opts.employeeUid}/${opts.requestId ?? `tmp-${Date.now()}`}/${Date.now()}-${safeName}`;
  const fileRef = ref(storage, path);
  await uploadBytes(fileRef, file, { contentType: file.type });
  const url = await getDownloadURL(fileRef);
  return { url, path, name: file.name };
}
```

### Restricciones
- **Tamaño máx:** 10 MB (enforced en cliente + en `storage.rules`).
- **Tipos:** cualquiera (PDF, JPG, PNG, DOCX, etc.).

## Generación de códigos

| Recurso | Formato | Generador |
|---|---|---|
| Solicitudes | `PRM-0001`, `PRM-0002`, ... | Contador transaccional en `counters/requests` |
| Usuarios | `uid` automático de Firebase Auth | — |
| Notificaciones | `auto-id` de Firestore | — |

## Lógica de notificaciones

Cuando el admin (o el propio empleado, al cancelar) cambia el estado de una solicitud, dentro de la misma transacción se crea un documento en `notifications/` dirigido al empleado dueño de la solicitud.

```ts
if (data.employeeId !== byUid) {
  tx.set(notifRef, {
    userId: data.employeeId,
    type: "status_change",
    requestId: id,
    title: `Tu solicitud ${data.code} fue actualizada`,
    message: `Nuevo estado: ${status}. ${observation}`,
    read: false,
    createdAt: serverTimestamp(),
  });
}
```

El empleado recibe la notificación en tiempo real por su listener de `notifications` filtrado por `userId == auth.uid`.

## Manejo de errores

| Tipo | Estrategia |
|---|---|
| Auth (`auth/invalid-credential`, `auth/email-already-in-use`, etc.) | Traducir el `code` a mensaje en español y mostrar en `Alert`. |
| Firestore (`permission-denied`, etc.) | `console.error` + alerta genérica al usuario. |
| Storage (oversize, type) | Validado en cliente antes de subir. |
| Form validation | Estado local `errors: Record<string, string>` por campo. |

## Variables de entorno

Todas las variables públicas de Firebase llevan prefijo `NEXT_PUBLIC_` (requisito de Next.js para que estén disponibles en el navegador):

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
```

> El `apiKey` web de Firebase **no es secreto** — sale en el bundle del cliente. La protección real son las Security Rules.

## Script de bootstrap

`scripts/bootstrap-admin.mjs` es un script Node de un solo uso. Ejecuta:

1. Lee `.env.local`.
2. Crea el documento `users/{adminUid}` con `role: "admin"`.
3. Crea `counters/requests` con `lastNumber: 0`.
4. Carga 4 áreas y 5 supervisores semilla.

Se ejecuta con `pnpm bootstrap`. Sólo es necesario una vez al iniciar el proyecto.

## Por qué no usamos Cloud Functions

Hoy todas las escrituras críticas (cambio de estado + notificación + historial) se hacen en una transacción del cliente. Esto funciona porque:

- Las reglas de seguridad **autorizan** la operación pero no la disparan.
- La transacción garantiza atomicidad.

En el futuro convendría mover a Cloud Functions:
- Envío de emails (cuando se quiera notificación por correo).
- Auditoría inmutable del historial (subcolección con escritura solo por servidor).
- Backups automáticos.
- Custom claims para meter el `role` en el JWT y validarlo más rápido en reglas.
