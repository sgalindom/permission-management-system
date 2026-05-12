# Setup Firebase - Gestor de Permisos

Esta guia explica como dejar funcionando el proyecto con Firebase (Auth + Firestore + Storage).

## 1. Instalar dependencia

```powershell
pnpm add firebase
```

## 2. Variables de entorno

Ya esta creado `.env.local` con tu config. Si lo vas a desplegar a Vercel, copia esas mismas variables en **Vercel -> Project Settings -> Environment Variables**.

## 3. Habilitar servicios en la consola de Firebase

En https://console.firebase.google.com/project/gestor-de-permiso

### Authentication
1. Build -> Authentication -> Sign-in method
2. Habilita **Email/Password**.
3. (Opcional) En la pestaña **Templates** personaliza el correo de "Password reset".
4. En **Settings -> Authorized domains** agrega:
   - `localhost`
   - tu dominio de Vercel (ej: `tu-proyecto.vercel.app`)

### Firestore
1. Build -> Firestore Database -> Create database (modo **production**, region `us-central` o la mas cercana).
2. Pestaña **Rules** -> pega el contenido de `firestore.rules` y publica.
3. Pestaña **Indexes** -> los indices compuestos los puedes crear con Firebase CLI o cuando Firestore te pida el link al ejecutar la primera query (lo veras en la consola del navegador).

### Storage
1. Build -> Storage -> Get started.
2. Pestaña **Rules** -> pega el contenido de `storage.rules` y publica.

## 4. Crear el PRIMER administrador (bootstrap)

Como el sistema solo deja crear usuarios al admin, necesitas crear el admin inicial **manualmente**:

### Paso A - Crear la cuenta en Authentication
1. Firebase Console -> Authentication -> Users -> **Add user**
2. Correo: `admin@empresa.com` (o el que prefieras)
3. Contrasena: la que vayas a usar
4. Copia el **UID** que aparece (lo necesitas para el siguiente paso)

### Paso B - Crear su documento en Firestore
1. Firestore Database -> Start collection -> ID: `users`
2. Document ID: pega el UID copiado
3. Campos:

| Campo | Tipo | Valor |
|---|---|---|
| `email` | string | `admin@empresa.com` |
| `name` | string | `German A. Mesa` |
| `role` | string | `admin` |
| `documentNumber` | string | `123456789` |
| `area` | string | `Administracion` |
| `position` | string | `Administrador` |
| `contractType` | string | `Contrato Directo` |
| `supervisor` | string | `` (vacio) |
| `avatar` | string | `GA` |
| `active` | boolean | `true` |
| `createdAt` | timestamp | (haz clic en el icono de reloj -> ahora) |

Despues de esto ya puedes entrar a la app con esas credenciales.

## 5. (Opcional) Crear catalogos iniciales

Tambien desde la consola de Firestore, crea las colecciones:

### `areas/`
Cada documento con un solo campo `name` (string):
- "Administrativo"
- "Comercial"
- "Logistica"
- "Soporte Tecnico"

### `supervisors/`
Cada documento con campos `name` (string) y opcionalmente `area`, `email`:
- Belcy Astrid Angulo Rodriguez
- Jeniffer Damaris Gomez
- Daniel Felipe Valenzuela Cuadros
- Giselle Escobar Zapata
- Andrea Beltran Moreno

> Mas adelante el admin podra crear/editar estos catalogos desde la UI (pendiente de implementar la pantalla "Configuracion").

## 6. Arrancar la app

```powershell
pnpm dev
```

Entra a http://localhost:3000 y loguea con el admin.

## Estructura de colecciones

```
users/{uid}
  email, name, role: "admin"|"employee", documentNumber, area, position,
  contractType, supervisor, phone?, costCenter?, headquarters?,
  avatar, active, createdAt

requests/{requestId}
  code: "PRM-0001", employeeId (uid), employeeName, employeeDocument,
  employeeArea, employeePosition, contractType, supervisor, reason,
  permissionDate, startTime, endTime, duration, isPaid, hasReplacement,
  replacementDate?, replacementStartTime?, replacementEndTime?, replacementPerson?,
  status: "pending"|"preapproved"|"approved"|"rejected"|"cancelled",
  observations?, attachmentUrl?, createdAt, updatedAt,
  history: [{ date, action, by, byUid?, observation?, fromStatus?, toStatus? }]

notifications/{id}
  userId (destinatario), type: "status_change"|"new_request"|"comment",
  requestId?, title, message, read, createdAt

areas/{id}       { name }
supervisors/{id} { name, area?, email? }
counters/requests { lastNumber }   ← genera "PRM-0001", "PRM-0002", ...
```

## Notas de seguridad

- El `apiKey` web de Firebase **no es secreto**: lo que protege la BD son las **reglas** de `firestore.rules` y `storage.rules`.
- Cuando el admin crea un usuario, se usa una **instancia secundaria** de Firebase (`getSecondaryApp()`) para no perder la sesion del admin. Ver `lib/users-service.ts`.
- El reset de contrasena usa el flujo estandar de Firebase: se envia un email con un link valido por una hora.
- Adjuntos: maximo 10MB por archivo (regla en `storage.rules`).

## Que falta UI

Esta capa de datos esta completa. Faltan pantallas que **aun no estan en el codigo** y que conviene construir luego:

1. **Admin -> Empleados**: formulario para que el admin cree usuarios (usar `adminCreateUser()` de `lib/users-service.ts`).
2. **Admin -> Configuracion**: CRUD de areas y supervisores (usar `useCatalogs()`).
3. **Campana de notificaciones** en el header del sidebar (usar `useNotifications()`).
4. **Subida de adjuntos** en `nueva-solicitud.tsx` (usar `uploadRequestAttachment()` de `lib/storage-service.ts`).
