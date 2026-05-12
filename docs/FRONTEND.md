# Frontend — GestionaPermisos

## Stack

- **Framework:** Next.js 16 (App Router, modo cliente)
- **UI:** React 19
- **Lenguaje:** TypeScript 5.7
- **Estilos:** Tailwind CSS v4 + variables CSS
- **Primitivas:** shadcn/ui sobre Radix UI
- **Iconos:** lucide-react
- **Gráficos:** Recharts
- **Fechas:** date-fns

## Estructura de carpetas

```
v0-permiso-platform-ui/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Layout raíz, metadata, fuente Geist
│   ├── page.tsx                  # Página única — orquesta la app entera
│   ├── globals.css               # Tema, variables CSS, Tailwind v4
│   └── global-error.tsx          # Boundary de error global
│
├── components/                   # Componentes de la app
│   ├── ui/                       # Primitivas shadcn/ui (11 archivos)
│   │   ├── alert.tsx
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── select.tsx
│   │   ├── tabs.tsx
│   │   └── textarea.tsx
│   │
│   ├── sidebar.tsx               # Navegación lateral, varía por rol
│   ├── login-page.tsx            # Pantalla de login + diálogo reset
│   │
│   ├── admin-dashboard.tsx       # Dashboard del admin
│   ├── admin-solicitudes.tsx     # Lista filtrable de todas las solicitudes
│   ├── admin-empleados.tsx       # CRUD de usuarios (crea/edita/desactiva)
│   ├── admin-configuracion.tsx   # CRUD de áreas y supervisores
│   ├── admin-reportes.tsx        # Gráficos y export CSV
│   │
│   ├── employee-solicitudes.tsx  # "Mis solicitudes" (vista empleado)
│   ├── nueva-solicitud.tsx       # Wizard de 4 pasos para crear solicitud
│   ├── empleado-perfil.tsx       # Datos personales + cambiar contraseña
│   ├── empleado-notificaciones.tsx # Lista completa de notificaciones
│   │
│   ├── gestionar-solicitud-modal.tsx # Modal de aprobar/rechazar
│   └── notifications-bell.tsx    # Campana del header
│
├── lib/                          # Lógica de aplicación
│   ├── firebase.ts               # Init del SDK (auth, db, storage)
│   ├── types.ts                  # Tipos del dominio
│   ├── utils.ts                  # cn() para Tailwind
│   ├── auth-context.tsx          # Sesión y auth
│   ├── requests-context.tsx      # Solicitudes (suscripción tiempo real)
│   ├── catalogs-context.tsx      # Áreas y supervisores
│   ├── notifications-context.tsx # Notificaciones del usuario
│   ├── users-service.ts          # Admin crea/edita usuarios
│   └── storage-service.ts        # Upload adjuntos
│
├── scripts/
│   └── bootstrap-admin.mjs       # Seed inicial (admin + catálogos)
│
├── docs/                         # Esta documentación
├── public/                       # Iconos del producto
├── firestore.rules               # Reglas Firestore
├── firestore.indexes.json        # Índices compuestos
├── storage.rules                 # Reglas Storage
├── firebase.json                 # Config Firebase CLI
├── next.config.mjs               # Config Next
├── tsconfig.json                 # Config TypeScript
├── package.json
└── .env.local                    # Vars de entorno (gitignored)
```

## Navegación

La app es **SPA**: una sola página (`app/page.tsx`) decide qué componente renderizar según el estado interno.

```tsx
// app/page.tsx (resumen)
const [adminView, setAdminView] = useState<AdminView>("dashboard");
const [employeeView, setEmployeeView] = useState<EmployeeView>("inicio");

if (!isAuthenticated) return <LoginPage />;
if (isAdmin) renderAdminView(adminView);
else renderEmployeeView(employeeView);
```

### Vistas del Admin (`AdminView`)
| Valor | Componente |
|---|---|
| `dashboard` | `AdminDashboard` |
| `solicitudes` | `AdminSolicitudes` |
| `gestionar` | `AdminSolicitudes` (mismo, abre modal) |
| `empleados` | `AdminEmpleados` |
| `reportes` | `AdminReportes` |
| `configuracion` | `AdminConfiguracion` |

### Vistas del Empleado (`EmployeeView`)
| Valor | Componente |
|---|---|
| `inicio` | `EmployeeHome` (definido dentro de `page.tsx`) |
| `mis-solicitudes` | `EmployeeSolicitudes` |
| `nueva-solicitud` | `NuevaSolicitud` |
| `perfil` | `EmpleadoPerfil` |
| `notificaciones` | `EmpleadoNotificaciones` |

## Árbol de Providers

```
<AuthProvider>            ← sesión + login
  <CatalogsProvider>      ← áreas, supervisores (público para usuarios autenticados)
    <RequestsProvider>    ← solicitudes (filtradas por rol)
      <NotificationsProvider>  ← notificaciones del usuario actual
        <AppContent />
      </NotificationsProvider>
    </RequestsProvider>
  </CatalogsProvider>
</AuthProvider>
```

Cada provider expone un hook `use*()` para consumirlo. Si se usa fuera del provider, lanza error.

## Hooks personalizados

| Hook | Origen | Devuelve |
|---|---|---|
| `useAuth()` | `lib/auth-context.tsx` | `user, loading, login, logout, resetPassword, isAuthenticated` |
| `useRequests()` | `lib/requests-context.tsx` | `requests, loading, stats, addRequest, updateRequestStatus, cancelRequest, getRequestById, getRequestsByEmployee` |
| `useCatalogs()` | `lib/catalogs-context.tsx` | `areas, supervisors, addArea, updateArea, deleteArea, addSupervisor, updateSupervisor, deleteSupervisor` |
| `useNotifications()` | `lib/notifications-context.tsx` | `notifications, unreadCount, markAsRead, markAllAsRead` |

## Patrones de componentes

### 1. "Use client" en todos los componentes
Toda la app corre en cliente porque depende de hooks de React y del SDK de Firebase (que es cliente).

### 2. Componentes "presentacionales" reciben callbacks
Los componentes hijos no navegan solos; reciben `onViewChange`, `onSuccess`, `onClose` desde `page.tsx` o desde su padre directo.

### 3. shadcn/ui en `components/ui/`
Componentes de bajo nivel (Button, Card, Dialog, etc.) extraídos del catálogo de shadcn. No los modificamos directamente, los usamos como están.

### 4. Composición sobre props
Por ejemplo, `Dialog` se compone con `DialogHeader`, `DialogContent`, `DialogFooter` — siguiendo el patrón Radix.

## Aliases TypeScript

`tsconfig.json` define:

```json
"paths": {
  "@/*": ["./*"]
}
```

Por eso los imports usan `@/components/...`, `@/lib/...`.

## Manejo de fechas

- En Firestore se guardan como **`Timestamp`** (tipo nativo) o como **`serverTimestamp()`** para que la hora venga del servidor.
- Al leer en el frontend se convierten a **ISO string** con la función `tsToIso()` (ver `requests-context.tsx`).
- En la UI se formatean con `date-fns` + `locale: es`.

```tsx
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: es })
// → "hace 5 minutos"
```

## Manejo de archivos adjuntos

Flujo en `nueva-solicitud.tsx`:

1. Usuario selecciona archivo desde input file.
2. Se valida tamaño máximo (10 MB en cliente, también en regla Storage).
3. Al enviar, `uploadRequestAttachment()` sube a `requests/{uid}/{tmp-folder}/{timestamp}-{filename}`.
4. La URL pública firmada (`getDownloadURL`) se guarda en el campo `attachmentUrl` del documento de solicitud.

## Estado y reactividad

Todo el estado de datos se mantiene **sincronizado en tiempo real** con Firestore:

- `requests-context` se suscribe con `onSnapshot(query(...))` filtrado por rol.
- Cuando un admin actualiza un estado, todas las vistas que muestran esa solicitud (incluida la del empleado en otra ventana) se actualizan automáticamente.
- Las notificaciones aparecen en la campana sin polling.

## Convenciones

- **Nombres de archivos:** kebab-case (`admin-solicitudes.tsx`).
- **Nombres de componentes:** PascalCase (`AdminSolicitudes`).
- **Funciones/variables:** camelCase.
- **Tipos/interfaces:** PascalCase (`AppUser`, `PermissionRequest`).
- **Constantes:** UPPER_SNAKE_CASE (`STATUS_LABELS`).
- **Strings al usuario:** en español sin tildes en código (se respetan en literales largos cuando aplica).

## Limitaciones actuales

- La navegación es **SPA con `useState`**, no rutas reales de Next.js. No hay deep-linking ni back/forward del browser.
- `next.config.mjs` tiene `ignoreBuildErrors: true` (heredado del prototipo v0) — conviene quitarlo en una pasada futura.
- No hay tests automatizados.
- No hay tema oscuro implementado (variables CSS existen pero no hay toggle).
