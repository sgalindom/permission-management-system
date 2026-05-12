# Base de Datos — GestionaPermisos

## Motor

**Cloud Firestore** — base de datos NoSQL documental de Firebase. Modo **producción** (no test). Región sugerida: `nam5 (us-central)` o la más cercana al equipo.

## Diagrama lógico

```
                         users (uid)
                            │
                    1       │     N
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        │ employeeId       │ byUid            │ userId
        ▼                   ▼                   ▼
    requests            history[]          notifications
   (PRM-XXXX)        (array en cada req)
        │
        │ attachmentUrl
        ▼
    Storage  (gs://.../requests/{uid}/{folder}/{file})

  Catálogos (independientes):
    areas        supervisors
                    │
            counters/requests   ← genera PRM-XXXX
```

## Colecciones

### `users/{uid}`
Información de cada persona autorizada a usar la plataforma. El `{uid}` es el mismo de Firebase Auth.

| Campo | Tipo | Obligatorio | Notas |
|---|---|---|---|
| `email` | string | ✓ | Único, mismo que en Auth |
| `name` | string | ✓ | Nombre completo |
| `role` | `"admin" \| "employee"` | ✓ | Determina permisos y menú |
| `documentNumber` | string | ✓ | Cédula / DNI |
| `area` | string | ✓ | Nombre del área (referencia textual al catálogo `areas/`) |
| `position` | string | ✓ | Cargo |
| `contractType` | string | ✓ | `"Contrato Directo" \| "Contrato Temporal" \| "Prestacion de Servicios"` |
| `supervisor` | string | — | Nombre del supervisor (referencia textual a `supervisors/`) |
| `phone` | string | — | Teléfono |
| `costCenter` | string | — | Centro de costo |
| `headquarters` | string | — | Sede |
| `avatar` | string | ✓ | Iniciales (ej. "SG") |
| `active` | boolean | ✓ | Si `false`, no puede iniciar sesión |
| `createdAt` | Timestamp | ✓ | `serverTimestamp()` |

### `requests/{requestId}`
Cada solicitud de permiso. El `{requestId}` es auto-ID de Firestore; el código legible está en `code` (formato `PRM-0001`).

| Campo | Tipo | Obligatorio | Notas |
|---|---|---|---|
| `code` | string | ✓ | `"PRM-0001"`, generado por `counters/requests` |
| `employeeId` | string (uid) | ✓ | Dueño de la solicitud |
| `employeeName` | string | ✓ | Denormalizado para listados rápidos |
| `employeeDocument` | string | ✓ | Denormalizado |
| `employeeArea` | string | ✓ | Denormalizado |
| `employeePosition` | string | ✓ | Denormalizado |
| `contractType` | string | ✓ | Denormalizado |
| `supervisor` | string | ✓ | Jefe inmediato |
| `reason` | `"cita_medica" \| "calamidad" \| "compensatorio" \| "motivos_personales"` | ✓ | |
| `requestDate` | string (`YYYY-MM-DD`) | ✓ | Fecha en que se hace la solicitud |
| `permissionDate` | string (`YYYY-MM-DD`) | ✓ | Fecha del permiso |
| `startTime` | string (`HH:MM`) | ✓ | Hora inicio |
| `endTime` | string (`HH:MM`) | ✓ | Hora fin |
| `duration` | string | ✓ | "2h" o "1 dia" o "3 dias" |
| `isPaid` | boolean | ✓ | Si es remunerado |
| `hasReplacement` | boolean | ✓ | Si va a reponer el tiempo |
| `replacementDate` | string | — | Solo si `hasReplacement` |
| `replacementStartTime` | string | — | Solo si `hasReplacement` |
| `replacementEndTime` | string | — | Solo si `hasReplacement` |
| `replacementPerson` | string | — | Persona que lo reemplazará |
| `status` | `"pending" \| "preapproved" \| "approved" \| "rejected" \| "cancelled"` | ✓ | Estado actual |
| `observations` | string | — | Observación de la última gestión |
| `attachment` | string | — | Nombre original del archivo adjunto |
| `attachmentUrl` | string | — | URL pública firmada del adjunto (Storage) |
| `history` | array | ✓ | Eventos del ciclo de vida (ver abajo) |
| `createdAt` | Timestamp | ✓ | `serverTimestamp()` |
| `updatedAt` | Timestamp | ✓ | `serverTimestamp()` |

#### Sub-campo `history[]`

Array dentro del documento de la solicitud. Cada entrada:

```ts
{
  date: string,            // ISO 8601
  action: string,          // "Solicitud creada" | "Estado cambiado a: approved" | etc.
  by: string,              // Nombre de quien hizo el cambio
  byUid?: string,          // uid de quien hizo el cambio
  observation?: string,    // Observación del cambio
  fromStatus?: RequestStatus,
  toStatus?: RequestStatus,
}
```

> **Por qué array en vez de subcolección:** simplifica las queries (todo viene con el documento) y como rara vez supera 10-20 entradas por solicitud, cabe sin problema en el límite de 1 MB por documento. Si crece, se migra a subcolección `requests/{id}/history`.

### `notifications/{notifId}`
Notificaciones en-app para los usuarios.

| Campo | Tipo | Obligatorio | Notas |
|---|---|---|---|
| `userId` | string (uid) | ✓ | Destinatario |
| `type` | `"status_change" \| "new_request" \| "comment"` | ✓ | |
| `requestId` | string | — | Solicitud relacionada |
| `title` | string | ✓ | Encabezado corto |
| `message` | string | ✓ | Cuerpo |
| `read` | boolean | ✓ | Default `false` |
| `createdAt` | Timestamp | ✓ | `serverTimestamp()` |

### `areas/{areaId}`
Catálogo editable de áreas/departamentos de la empresa.

| Campo | Tipo |
|---|---|
| `name` | string |

`{areaId}` es slug derivado del nombre (`administrativo`, `comercial`, ...) o auto-ID.

### `supervisors/{supId}`
Catálogo editable de supervisores que aparecen en el dropdown del formulario.

| Campo | Tipo | Obligatorio |
|---|---|---|
| `name` | string | ✓ |
| `area` | string | — |
| `email` | string | — |

### `counters/requests`
Documento único que mantiene el contador para generar `PRM-XXXX`.

| Campo | Tipo |
|---|---|
| `lastNumber` | number |

Solo se actualiza dentro de una `runTransaction` para garantizar unicidad bajo concurrencia.

## Relaciones

| Relación | Implementación |
|---|---|
| `users` ↔ `requests` | `requests.employeeId` apunta a `users.uid` |
| `requests` ↔ `notifications` | `notifications.requestId` apunta a `requests.{id}` |
| `users` ↔ `notifications` | `notifications.userId` apunta a `users.uid` |
| `requests` ↔ Storage | `requests.attachmentUrl` apunta a un objeto en Storage |
| `users` ↔ `areas` / `supervisors` | Referencia textual (no por id), porque los catálogos son pocos y editables |

## Decisiones de modelado

### 1. Denormalización en `requests`
Guardamos `employeeName`, `employeeDocument`, `employeeArea`, `employeePosition` directamente en la solicitud aunque ya existan en `users/{uid}`. Razones:

- **Velocidad de listado:** un admin lista 100+ solicitudes; sin denormalizar habría que hacer 100 lecturas extra.
- **Auditoría histórica:** si un empleado cambia de área o cargo, las solicitudes viejas deben conservar los datos que tenía en ese momento.

### 2. Catálogos como strings, no referencias
`requests.supervisor` guarda `"Belcy Astrid Angulo Rodriguez"`, no `supervisors/abc123`. Lo mismo para áreas. Razón: simplifica las queries y mantiene la solicitud autocontenida.

### 3. Historial como array
Ver explicación arriba. Si se llega al límite de 1 MB por doc, migrar a subcolección.

### 4. Códigos `PRM-XXXX` separados del `docId`
El `docId` es auto-ID de Firestore (eficiente para escrituras distribuidas). El `code` legible es para el usuario y se genera con contador.

## Índices

### Auto-indexados por Firestore (no requieren configuración)
- Cualquier campo simple usado en `where()` o `orderBy()` solo.

### Compuestos (requieren `firestore.indexes.json`)

```json
{
  "indexes": [
    {
      "collectionGroup": "requests",
      "fields": [
        { "fieldPath": "employeeId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "notifications",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

**Por qué:** las queries:
- `where("employeeId", "==", uid).orderBy("createdAt", "desc")` (Mis Solicitudes)
- `where("userId", "==", uid).orderBy("createdAt", "desc")` (Notificaciones del usuario)

requieren índice compuesto. Si la query falla, Firestore arroja un error con un link que crea el índice automáticamente.

## Tamaños y límites de Firestore

| Recurso | Límite | Implicación |
|---|---|---|
| Documento | 1 MB | El `history` no debe crecer más allá de ~5000 eventos. |
| Campo | 1 MB | Adjuntos van a Storage, no a Firestore. |
| Profundidad de subcolecciones | 100 | No nos acercamos ni de lejos. |
| Escrituras por segundo a un solo doc | ~1/s | El contador `counters/requests` podría ser cuello de botella si llegamos a >1 solicitud/s simultáneas. Mitigación: contador distribuido (sharded counter). |

## Migraciones futuras

| Cuándo | Qué cambiar |
|---|---|
| Si las empresas piden auditoría legal | Mover `history` a subcolección con escritura solo por Cloud Function. |
| Si crece a multi-tenant | Prefijar todas las colecciones por `organizations/{orgId}/...`. |
| Si necesitan emails de notificación | Agregar Cloud Function que escucha `notifications/{notif}.onCreate` y envía vía SendGrid/Resend. |
| Si necesitan exportación masiva | Usar Firestore export-to-BigQuery extension. |

## Backups

Por defecto Firestore retiene **PITR (Point-in-Time Recovery)** de los últimos 7 días en modo producción. Para retención más larga:

1. Habilitar exportación programada a GCS (Google Cloud Storage).
2. Configurar `gcloud firestore export` mediante Cloud Scheduler.

## Seeding inicial

Ver `scripts/bootstrap-admin.mjs`:
- 1 documento en `users/` (el admin).
- 1 documento en `counters/requests` con `lastNumber: 0`.
- 4 documentos en `areas/`.
- 5 documentos en `supervisors/`.
