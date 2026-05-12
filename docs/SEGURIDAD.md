# Seguridad — GestionaPermisos

## Modelo de seguridad

Como **no hay servidor propio**, toda la seguridad descansa en tres pilares:

1. **Firebase Authentication** — verifica la identidad del usuario.
2. **Firestore Security Rules** — autorizan o deniegan cada operación a nivel de fila.
3. **Storage Security Rules** — controlan acceso a archivos.

> ⚠️ El `apiKey` web de Firebase **NO es secreto** — está en el bundle del cliente. Lo que protege la BD son las reglas.

## Autenticación

### Método único habilitado
Email + contraseña (Firebase Authentication estándar).

### Persistencia de sesión
Por defecto Firebase usa `localStorage`. El `onAuthStateChanged` mantiene la sesión entre recargas.

### Cierre forzado de sesión
Cualquiera de estas condiciones cierra la sesión:
- Usuario hace `logout()`.
- Al hidratar, su documento `users/{uid}` no existe.
- Al hidratar, su `active === false`.

### Reset de contraseña
- Vía email estándar de Firebase.
- El usuario nunca ve la contraseña que el admin generó si la cambia por reset.

### Reautenticación
Para cambiar la contraseña desde el perfil, Firebase exige reautenticación reciente (`reauthenticateWithCredential`).

## Roles y permisos

### Roles
- `admin` — control total
- `employee` — sólo lo suyo

### Matriz de permisos

| Acción | admin | employee |
|---|---|---|
| Ver todas las solicitudes | ✅ | ❌ |
| Ver sus propias solicitudes | ✅ | ✅ |
| Crear solicitud para sí mismo | ✅ | ✅ |
| Crear solicitud para otro | ❌ | ❌ |
| Cambiar estado de cualquier solicitud | ✅ | ❌ |
| Cancelar su propia solicitud (si está pending/preapproved) | ✅ | ✅ |
| Listar usuarios | ✅ | ❌ |
| Crear/editar usuarios | ✅ | ❌ |
| Desactivar usuarios | ✅ | ❌ |
| CRUD áreas/supervisores | ✅ | ❌ |
| Ver sus notificaciones | ✅ | ✅ |
| Ver notificaciones de otros | ❌ | ❌ |
| Marcar sus notificaciones como leídas | ✅ | ✅ |
| Subir adjuntos en su carpeta | ✅ | ✅ |
| Leer adjuntos de otros | ✅ (admin) | ❌ |
| Eliminar documentos en Firestore | ❌ | ❌ (audit trail) |

## Firestore Security Rules

Archivo: `firestore.rules` (en la raíz del proyecto).

### Helpers globales

```javascript
function isSignedIn() {
  return request.auth != null;
}

function userDoc() {
  return get(/databases/$(database)/documents/users/$(request.auth.uid));
}

function isAdmin() {
  return isSignedIn() && userDoc().data.role == "admin" && userDoc().data.active == true;
}

function isActiveUser() {
  return isSignedIn() && userDoc().data.active == true;
}
```

### `users/{uid}`

```javascript
allow get: if isSignedIn() && (request.auth.uid == uid || isAdmin());
allow list: if isAdmin();
allow create, update, delete: if isAdmin();
```

- Cualquier usuario puede leer su propio doc.
- Solo el admin lista o modifica.

### `requests/{requestId}`

```javascript
allow get: if isSignedIn() && (isAdmin() || resource.data.employeeId == request.auth.uid);
allow list: if isSignedIn();

allow create: if isActiveUser()
  && request.resource.data.employeeId == request.auth.uid
  && request.resource.data.status == "pending";

allow update: if isAdmin()
  || (
    resource.data.employeeId == request.auth.uid
    && request.resource.data.status == "cancelled"
    && resource.data.status in ["pending", "preapproved"]
  );

allow delete: if false;
```

**Lo que esto garantiza:**
- Solo el dueño o un admin puede leer la solicitud.
- Al crear, **obligatorio** que `employeeId === auth.uid` y `status === "pending"`.
- Al actualizar:
  - El admin puede todo.
  - El empleado solo puede cambiar a `cancelled` y solo si estaba `pending` o `preapproved`.
- Nadie puede borrar (audit trail).

### `notifications/{notifId}`

```javascript
allow get, list: if isSignedIn() && resource.data.userId == request.auth.uid;
allow create: if isSignedIn();
allow update: if isSignedIn()
  && resource.data.userId == request.auth.uid
  && request.resource.data.diff(resource.data).changedKeys().hasOnly(["read"]);
allow delete: if isAdmin();
```

- Solo el destinatario lee sus notificaciones.
- Cualquier usuario autenticado puede crear (la transacción de cambio de estado lo hace).
- El destinatario solo puede flipear `read`, no modificar el resto del documento.

### `areas/{areaId}` y `supervisors/{supId}`

```javascript
allow read: if isSignedIn();
allow create, update, delete: if isAdmin();
```

Catálogos públicos para usuarios autenticados, escritura solo admin.

### `counters/{counterId}`

```javascript
allow read, write: if isActiveUser();
```

Cualquier usuario activo puede incrementarlo (necesario para `nextRequestCode()`).

## Storage Security Rules

Archivo: `storage.rules`.

```javascript
match /requests/{employeeUid}/{folder}/{filename} {
  allow read: if isSignedIn() && (request.auth.uid == employeeUid || isAdmin());
  allow write: if isSignedIn()
    && request.auth.uid == employeeUid
    && request.resource.size < 10 * 1024 * 1024;  // 10 MB
  allow delete: if isAdmin() || request.auth.uid == employeeUid;
}

function isAdmin() {
  return isSignedIn()
    && firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.role == "admin";
}
```

- Solo el dueño o el admin pueden leer.
- Solo el dueño puede subir (a su propia carpeta).
- Tamaño máximo 10 MB.

## Validaciones a nivel cliente

Además de las reglas (que son la línea de defensa real), el cliente valida:

| Pantalla | Validación |
|---|---|
| Login | Email + contraseña no vacíos |
| Nueva solicitud | Fechas, horas, motivo, duración; tamaño de adjunto |
| Crear empleado | Contraseña ≥ 6 chars |
| Gestionar | Observación obligatoria |
| Cambiar contraseña | Coincidencia, longitud |

> Las validaciones de cliente son **UX**, no seguridad. Cualquier validación crítica debe estar también en las reglas.

## Configuración crítica de la consola Firebase

### 1. Dominios autorizados (Authentication → Settings)
Solo permitir:
- `localhost` (desarrollo)
- Dominio de Vercel
- Dominio de producción

Esto evita que un atacante use tu `apiKey` desde su propio sitio.

### 2. App Check (recomendado en producción)
Habilitar **reCAPTCHA Enterprise** o **Play Integrity / DeviceCheck** vía App Check. Esto bloquea peticiones que no provienen de tu app legítima.

### 3. Quotas y alerts
- Configurar alertas de **billing** (Firebase puede facturar si se excede el free tier).
- Configurar alertas de **errores de reglas** para detectar intentos de abuso.

## Buenas prácticas aplicadas

✅ **Defensa en profundidad** — reglas + validación cliente.
✅ **Principio de menor privilegio** — empleados solo ven lo suyo.
✅ **Audit trail** — `history` inmutable + `delete` deshabilitado.
✅ **No secretos en el cliente** — toda la "seguridad" depende de las reglas, no del SDK.
✅ **Reset por email** — no se reenvía contraseña en texto claro.
✅ **Reautenticación** — cambio de contraseña requiere conocer la actual.
✅ **Active flag** — un usuario despedido se desactiva, no se borra.

## Pendientes / mejoras futuras

| Mejora | Beneficio |
|---|---|
| **App Check** | Evita uso del API key desde sitios no autorizados |
| **Custom Claims** | Meter `role` en el JWT — más rápido que `get(users/{uid})` en reglas |
| **Cloud Functions con audit log** | Historial inmutable escrito solo por el servidor |
| **MFA (multi-factor)** | Reducir riesgo de cuentas comprometidas |
| **Rate limiting** | Limitar logins fallidos (Firebase ya lo hace parcialmente con `auth/too-many-requests`) |
| **Sanitización de inputs** | Aunque React escapa por defecto, agregar DOMPurify en campos free-text |
| **Política de contraseñas más estricta** | Mínimo 8 chars, mayúsculas, dígitos, etc. |
| **Sesión con expiración** | Auto-logout tras X minutos inactivo |

## Qué hacer si la API key se filtra

Como ya está en el bundle, no hay nada que "rotar" tras una filtración pública: el daño se contiene con:

1. **Verificar las reglas** — si están bien escritas, el atacante no puede leer/escribir datos.
2. **Verificar dominios autorizados** — sin tu dominio, ni siquiera puede usar Auth.
3. **Habilitar App Check** — bloquea casi todo el abuso.
4. (Último recurso) **Crear un nuevo proyecto Firebase** y migrar la BD.

## Cumplimiento

- **LGPD / Habeas Data (Colombia, ley 1581/2012):** los datos personales se guardan solo con consentimiento implícito al usar la herramienta laboral. Para borrado, el admin puede desactivar usuarios (no se borran datos históricos por audit trail).
- **GDPR:** si se opera en Europa, se debería agregar mecanismo de exportación y borrado real (no implementado).
