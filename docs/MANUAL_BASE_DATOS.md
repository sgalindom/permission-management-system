# Manual de la Base de Datos — GestionaPermisos

Guía práctica para operar y administrar la base de datos del sistema.
Si buscas el **esquema técnico** (campos, tipos, relaciones), ver [BASE_DE_DATOS.md](./BASE_DE_DATOS.md).

---

## Tabla de contenidos

1. [Acceso a la consola Firebase](#1-acceso-a-la-consola-firebase)
2. [Vista general de las colecciones](#2-vista-general-de-las-colecciones)
3. [Tareas administrativas comunes](#3-tareas-administrativas-comunes)
4. [Crear usuarios manualmente](#4-crear-usuarios-manualmente)
5. [Modificar / eliminar registros](#5-modificar--eliminar-registros)
6. [Gestionar reglas de seguridad](#6-gestionar-reglas-de-seguridad)
7. [Índices](#7-índices)
8. [Backup y restauración](#8-backup-y-restauración)
9. [Monitoreo y costos](#9-monitoreo-y-costos)
10. [Scripts de mantenimiento](#10-scripts-de-mantenimiento)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. Acceso a la consola Firebase

### URL del proyecto
👉 https://console.firebase.google.com/project/gestor-de-permiso

### Permisos necesarios
El admin del proyecto debe invitarte como **Editor** o **Viewer** desde:
- Firebase Console → ⚙️ Configuración → Usuarios y permisos → Agregar miembro

### Paneles principales
| Panel | Para qué sirve |
|---|---|
| **Authentication** | Ver usuarios registrados, crear/eliminar, resetear contraseñas |
| **Firestore Database** | Ver/editar documentos de la base de datos |
| **Storage** | Ver adjuntos subidos por los empleados |
| **Configuración del proyecto** | API keys, dominios autorizados, miembros |
| **Uso y facturación** | Cuotas y consumo |

---

## 2. Vista general de las colecciones

Al entrar a **Firestore Database → Data** verás:

```
gestor-de-permiso (default)
├── areas/                ← Catálogo de áreas
├── counters/             ← Contador para generar PRM-XXXX
│   └── requests
├── notifications/        ← Notificaciones de los usuarios
├── requests/             ← Solicitudes de permiso
├── supervisors/          ← Catálogo de supervisores
└── users/                ← Perfiles de usuarios del sistema
```

### Cardinalidad estimada
| Colección | Tamaño esperado |
|---|---|
| `users` | 1 doc por empleado activo |
| `requests` | Crece sin límite (1 doc por solicitud creada) |
| `notifications` | Crece sin límite (1 doc por evento de cambio) |
| `areas` | 4–10 docs |
| `supervisors` | 5–30 docs |
| `counters/requests` | Siempre 1 doc fijo |

---

## 3. Tareas administrativas comunes

### 3.1 Activar / desactivar un usuario
La forma recomendada es desde la app: **Admin → Empleados → ícono 🚫** sobre el usuario.

Si necesitas hacerlo manualmente:
1. Firestore → `users/{uid}` → click sobre el documento.
2. Botón ✏️ junto al campo `active`.
3. Cambiar a `true` o `false`.
4. Guardar.

Un usuario con `active: false` no puede iniciar sesión (la app lo desconecta inmediatamente).

### 3.2 Cambiar el rol de un usuario
1. Firestore → `users/{uid}`.
2. Editar campo `role` → cambiar entre `"admin"` o `"employee"`.

> ⚠️ Si conviertes un empleado en admin, **debe cerrar sesión y volver a entrar** para que el cambio surta efecto.

### 3.3 Resetear la contraseña de alguien
**Opción A — Desde la app (recomendada):** en la pantalla de login el usuario clickea "¿Olvidaste tu contraseña?".

**Opción B — Desde la consola:**
1. Authentication → buscar al usuario por correo.
2. Click sobre los 3 puntos (⋮) → "Restablecer contraseña".
3. Firebase enviará un email al usuario.

### 3.4 Eliminar definitivamente un usuario
**No recomendado** — perderías el rastro en historial de solicitudes. Mejor desactivarlo (`active: false`).

Si insistes en eliminar:
1. Authentication → buscar → ⋮ → "Eliminar cuenta" (borra del Auth).
2. Firestore → `users/{uid}` → ⋮ → "Eliminar documento".

> Las solicitudes históricas conservarán el nombre del empleado denormalizado, pero el link al `users/{uid}` quedará roto. Por eso preferimos desactivar.

### 3.5 Agregar áreas o supervisores
**Desde la app (recomendado):** Admin → Configuración → pestaña correspondiente → "Nueva".

**Desde la consola:**
1. Firestore → `areas/` → "Add document"
2. ID: auto o slug (`recursos-humanos`)
3. Campo `name` (string): "Recursos Humanos"
4. Guardar.

Igual para `supervisors/` con campos adicionales `area` y `email` (opcionales).

### 3.6 Resetear el contador de solicitudes
Si necesitas reiniciar la numeración `PRM-XXXX` (por ejemplo a inicio de año):

1. Firestore → `counters/requests`.
2. Editar `lastNumber` → cambiar al número deseado (ej. `0` para empezar en `PRM-0001`).

> ⚠️ Solo hacerlo si **estás seguro** de que no hay solicitudes recientes con esa numeración, para evitar duplicados.

---

## 4. Crear usuarios manualmente

### Vía la app (recomendada — fácil)
Admin → Empleados → "Nuevo empleado". La app crea automáticamente el usuario en Auth + el documento en Firestore.

### Vía script (para usuarios admin iniciales)

#### A) Bootstrap completo (solo primera vez del proyecto)
```powershell
pnpm bootstrap
```
Crea: el admin definido en `scripts/bootstrap-admin.mjs` + `counters/requests` + 4 áreas + 5 supervisores semilla.

#### B) Crear un admin adicional
1. Editar `scripts/create-admin-user.mjs` (correo, contraseña, nombre).
2. Ejecutar:
```powershell
node scripts/create-admin-user.mjs
```
El script crea al usuario en Auth + Firestore. Te muestra credenciales por consola.

### Vía consola Firebase (manual, paso a paso)
1. **Authentication → Users → "Add user"**
   - Correo: `nuevo@empresa.com`
   - Contraseña: temporal
   - **Copiar el UID generado**.
2. **Firestore → `users/` → "Add document"**
   - Document ID: pegar el UID
   - Agregar los campos:

| Campo | Tipo | Valor ejemplo |
|---|---|---|
| `email` | string | `nuevo@empresa.com` |
| `name` | string | `Juan Pérez` |
| `role` | string | `employee` |
| `documentNumber` | string | `1012345678` |
| `area` | string | `Comercial` |
| `position` | string | `Ejecutivo de ventas` |
| `contractType` | string | `Contrato Directo` |
| `supervisor` | string | `(nombre del jefe)` |
| `avatar` | string | `JP` |
| `active` | boolean | `true` |
| `createdAt` | timestamp | (icono de reloj → "current time") |

---

## 5. Modificar / eliminar registros

### 5.1 Editar un campo de una solicitud
1. Firestore → `requests/{requestId}`.
2. Click sobre el documento.
3. Click ✏️ junto al campo a editar.
4. Cambiar valor → Guardar.

> ⚠️ Editar manualmente las solicitudes **no genera evento de historial**. Si quieres mantener trazabilidad, mejor hacerlo desde la app.

### 5.2 Forzar cambio de estado de una solicitud
1. Firestore → `requests/{requestId}`.
2. Editar `status` → escribir el nuevo valor (`pending`, `preapproved`, `approved`, `rejected`, `cancelled`).
3. Agregar entrada al array `history` manualmente si quieres mantener el log.

### 5.3 Eliminar notificaciones viejas
Para limpiar el ruido tras unos meses:
1. Firestore → `notifications/` → filtrar por fecha (ordenar por `createdAt`).
2. Eliminar manualmente las viejas, o usar un script Node con `where("createdAt", "<", X)`.

> No hay limpieza automática hoy. Si crecen mucho, considerar Cloud Function programada.

---

## 6. Gestionar reglas de seguridad

### Ubicación
El archivo fuente es `firestore.rules` (raíz del proyecto). La versión "viva" está en la consola Firebase.

### Cómo publicarlas
1. Abrir `firestore.rules` en VS Code.
2. Copiar todo su contenido (Ctrl + A, Ctrl + C).
3. Firebase Console → Firestore → **Rules**.
4. Pegar reemplazando lo que esté.
5. Click **"Publish"**.

Cambios surten efecto en **menos de 1 minuto**.

### Probar reglas antes de publicar
En Firestore → Rules → **"Playground"** puedes simular operaciones:
- Auth UID a usar
- Tipo de operación (get/list/create/update/delete)
- Path
- Datos

Te dice si la regla **permite** o **deniega** y por qué.

### Errores comunes en reglas
| Síntoma | Causa probable |
|---|---|
| Todo el mundo lee/escribe todo | Reglas en modo test (`allow read, write: if true`) |
| "Permission denied" para usuarios válidos | Falta el documento `users/{uid}` o `active: false` |
| "Permission denied" al listar | La regla `list` está restrictiva pero la query no usa `where` adecuado |

---

## 7. Índices

### Auto-creados
Firestore crea automáticamente índices simples (un solo campo).

### Compuestos (para queries con `where + orderBy`)
Definidos en `firestore.indexes.json`:

```json
{
  "collectionGroup": "requests",
  "fields": [
    { "fieldPath": "employeeId", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```

### Cómo crear índices
**Manera fácil:** cuando la app falla con "the query requires an index", el error de la consola del navegador trae un **link directo** que crea el índice con un click.

**Manera manual:**
1. Firebase Console → Firestore → **Indexes** → "Create Index".
2. Llenar:
   - Collection ID: `requests`
   - Fields:
     - `employeeId` Ascending
     - `createdAt` Descending
3. Crear (tarda 1–5 minutos en propagarse).

### Cuándo borrar un índice
Solo si:
- Lo creaste por error.
- Cambió la query y ya no se usa.

No tienen costo de almacenamiento significativo, pero **ralentizan escrituras** porque cada vez que escribes hay que actualizar todos los índices.

---

## 8. Backup y restauración

### Punto en el tiempo (PITR — incluido)
Firestore en **modo producción** mantiene snapshots automáticos de los **últimos 7 días**. Para restaurar:
- Firebase Console → Firestore → **Recuperación ante desastres**.
- Elegir punto en el tiempo y restaurar.

### Export manual a Cloud Storage
Para backups más largos:
1. Habilitar Cloud Storage en Google Cloud Console.
2. Crear bucket `gs://gestor-de-permiso-backups`.
3. Desde **Cloud Shell**:
```bash
gcloud firestore export gs://gestor-de-permiso-backups/$(date +%Y-%m-%d)
```

Para automatizarlo, configurar **Cloud Scheduler** que lance ese comando semanalmente.

### Importar desde un export
```bash
gcloud firestore import gs://gestor-de-permiso-backups/2026-01-15
```

> ⚠️ El import **sobreescribe** datos existentes con el mismo ID.

### Export rápido a JSON (un solo doc)
Útil para inspeccionar o documentar:
1. Click sobre el documento en la consola.
2. Menú ⋮ → "Export to JSON" (en algunas vistas, o copia manual).

---

## 9. Monitoreo y costos

### Plan actual (Spark gratuito)
Firebase ofrece:
- **50,000 lecturas/día**
- **20,000 escrituras/día**
- **20,000 eliminaciones/día**
- **1 GB de almacenamiento**

Para un equipo de hasta ~100 personas con uso normal, esto sobra.

### Ver consumo
Firebase Console → **Uso y facturación**.

Indicadores a vigilar:
| Métrica | Alerta si... |
|---|---|
| Reads/day | > 30,000 (estás cerca del límite) |
| Writes/day | > 15,000 |
| Storage | > 800 MB |
| Bandwidth | > 8 GB/mes |

### Reducir consumo si te acercas al límite
1. **Limitar listeners abiertos** — cerrar suscripciones cuando no se usen.
2. **Paginación** — no traer todas las solicitudes a la vez.
3. **Filtrar en query** — `where()` antes de traer datos.
4. **Denormalización agresiva** — para evitar joins (ya lo hacemos).
5. **Borrar notificaciones viejas** (>3 meses).

### Si necesitas pasar a plan pagado (Blaze)
Activar tarjeta en Firebase Console → Facturación. Es **pay-as-you-go**, sigue siendo gratuito hasta los mismos límites; solo pagas el excedente. Configurar **presupuesto con alerta** en Google Cloud Billing para evitar sorpresas.

---

## 10. Scripts de mantenimiento

### `pnpm bootstrap` (solo primera vez)
Crea el admin inicial + catálogos. Definido en `scripts/bootstrap-admin.mjs`.

### `node scripts/create-admin-user.mjs`
Crea un admin adicional (correo + contraseña + perfil Firestore en un solo paso).

### Scripts personalizados que puedes escribir
Patrón base para cualquier mantenimiento:

```js
// scripts/mi-tarea.mjs
import { readFileSync } from "node:fs";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

// ... cargar .env.local como en bootstrap-admin.mjs ...

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const snap = await getDocs(collection(db, "requests"));
snap.forEach((d) => {
  console.log(d.id, d.data().code, d.data().status);
});
```

Ejecutar con `node scripts/mi-tarea.mjs`.

### Ejemplos de scripts útiles a futuro
- `clean-old-notifications.mjs` — borra notificaciones con > 90 días.
- `export-requests-csv.mjs` — exporta toda la BD a CSV.
- `migrate-field.mjs` — agrega/renombra un campo en todos los docs.

---

## 11. Troubleshooting

### "Missing or insufficient permissions"
**Causa más común:** el usuario logueado no tiene su documento `users/{uid}` o tiene `active: false`.

**Solución:** ir a Firestore → `users/{uid}` y verificar que:
- Existe el documento.
- `role` está bien (`admin` o `employee`).
- `active` es `true`.

### Las queries con `where + orderBy` fallan
Falta un índice compuesto. La consola del navegador trae un link directo que lo crea.

### Un campo no aparece en el frontend
Posibilidades:
- El campo está en Firestore pero el código no lo está leyendo. Revisar el mapper en `lib/requests-context.tsx` o similar.
- El tipo del campo en Firestore no coincide (ej. guardaste string donde se espera boolean).

### Las notificaciones llegan duplicadas
No debería ocurrir gracias a la transacción. Si pasa, revisar que no haya múltiples listeners abiertos en el mismo cliente (React StrictMode duplica en dev).

### El contador `counters/requests` se duplicó
Si dos solicitudes salieron con el mismo `PRM-XXXX`:
1. Pausar la app momentáneamente.
2. Revisar `requests/` y arreglar el `code` de la duplicada (renumerarla manualmente).
3. Verificar el `lastNumber` en `counters/requests` y ajustarlo al máximo `+1`.

Es muy raro porque la transacción lo previene, pero teóricamente posible bajo condiciones extremas.

### Reglas no surten efecto tras "Publish"
Esperar 1 minuto adicional. Si persiste, verificar que estás viendo el proyecto correcto (a veces se confunde con otro Firebase project).

### Storage rechaza un upload
1. Verificar tamaño (< 10 MB).
2. Verificar que el path comience con `requests/{auth.uid}/...` (la regla exige que el UID en el path coincida con quien sube).
3. Revisar que estés logueado.

---

## Anexo: comandos de gcloud útiles

Requiere [Google Cloud SDK](https://cloud.google.com/sdk/docs/install).

```bash
# Autenticarse
gcloud auth login

# Seleccionar proyecto
gcloud config set project gestor-de-permiso

# Export completo
gcloud firestore export gs://gestor-de-permiso-backups/$(date +%Y-%m-%d)

# Listar colecciones
gcloud firestore databases describe --database='(default)'

# Borrar todas las notificaciones (¡cuidado!)
gcloud firestore bulk-delete --collection-ids=notifications
```

---

## Contactos

- **Admin del proyecto Firebase:** Sebastián Galindo (`sgalindom2612@gmail.com`)
- **Admin del aplicativo:** `admin@gestionpermisos.com`
- **Soporte Firebase:** https://firebase.google.com/support
