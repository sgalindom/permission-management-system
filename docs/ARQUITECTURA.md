# Arquitectura — GestionaPermisos

## Visión general

GestionaPermisos es una **aplicación web cliente-servidor sin servidor propio**: todo el backend lo provee Firebase como BaaS (Backend-as-a-Service). El frontend, una SPA construida con Next.js (modo cliente), se conecta directamente a los servicios de Firebase mediante el SDK web.

```
┌────────────────────────────────────────────────────────────────────┐
│                          NAVEGADOR DEL USUARIO                      │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │            Next.js 16 (App Router) — SPA cliente              │  │
│  │                                                                │  │
│  │  ┌───────────┐  ┌─────────────┐  ┌──────────────────────┐    │  │
│  │  │  Pages    │  │ Components  │  │  Context Providers   │    │  │
│  │  │  app/     │  │ components/ │  │  • AuthProvider      │    │  │
│  │  │  page.tsx │  │             │  │  • RequestsProvider  │    │  │
│  │  └─────┬─────┘  └──────┬──────┘  │  • CatalogsProvider  │    │  │
│  │        │               │         │  • NotificationsProv │    │  │
│  │        └───────┬───────┘         └──────────┬───────────┘    │  │
│  │                │                            │                 │  │
│  │  ┌─────────────▼────────────────────────────▼──────────────┐ │  │
│  │  │            lib/firebase.ts  (Firebase SDK init)          │ │  │
│  │  └──────┬──────────────┬───────────────┬──────────────┬────┘ │  │
│  └─────────┼──────────────┼───────────────┼──────────────┼──────┘  │
└────────────┼──────────────┼───────────────┼──────────────┼─────────┘
             │              │               │              │
             │ HTTPS        │ HTTPS         │ HTTPS        │ HTTPS
             ▼              ▼               ▼              ▼
       ┌──────────┐   ┌───────────┐   ┌──────────┐   ┌──────────┐
       │ Firebase │   │ Firestore │   │ Firebase │   │ Firebase │
       │   Auth   │   │    DB     │   │ Storage  │   │Analytics │
       └──────────┘   └─────┬─────┘   └──────────┘   └──────────┘
                            │
                            ▼
                  ┌──────────────────┐
                  │ Security Rules   │
                  │ firestore.rules  │
                  │ storage.rules    │
                  └──────────────────┘
```

## Capas del sistema

### 1. Capa de presentación (UI)
- **Framework:** Next.js 16 con App Router (`app/`).
- **Renderizado:** todo cliente (`"use client"` en cada componente); la app se entrega como un solo bundle y la navegación interna es por estado (`useState`), no rutas reales.
- **UI primitives:** [shadcn/ui](https://ui.shadcn.com) sobre Radix UI (solo los 11 componentes que se usan).
- **Estilos:** Tailwind CSS v4 con variables CSS personalizadas en `app/globals.css`.
- **Iconos:** lucide-react.
- **Gráficos:** Recharts (en pantalla de Reportes).
- **Fechas:** date-fns + locale `es`.

### 2. Capa de aplicación (estado y lógica)
- **Context API de React** para estado global:
  - `AuthProvider` — sesión actual + login/logout/reset password.
  - `RequestsProvider` — solicitudes (suscripción en tiempo real a Firestore).
  - `CatalogsProvider` — catálogos de áreas y supervisores.
  - `NotificationsProvider` — notificaciones del usuario logueado.
- **Servicios** (módulos puros sin React):
  - `lib/users-service.ts` — creación/edición/activación de usuarios.
  - `lib/storage-service.ts` — subida de adjuntos a Firebase Storage.
- **Tipado:** TypeScript en todo el código.

### 3. Capa de datos (BaaS — Firebase)
- **Firebase Authentication** — login con email/contraseña, reset por email.
- **Firestore** — base de datos NoSQL en tiempo real (`onSnapshot`).
- **Firebase Storage** — almacenamiento de adjuntos (PDF/imágenes).
- **Security Rules** — autorización a nivel de fila, configurada en `firestore.rules` y `storage.rules`.

### 4. Operación
- **Hosting recomendado:** Vercel (deploy desde GitHub o CLI).
- **Variables sensibles:** `.env.local` (gitignored).
- **Bootstrap inicial:** script Node `scripts/bootstrap-admin.mjs` crea el primer admin y los catálogos.

## Diagrama de componentes lógicos

```
                       Sidebar (nav según rol)
                              │
       ┌──────────────────────┼──────────────────────┐
       │                      │                      │
   Admin views          Employee views         Modal global
       │                      │                      │
 ┌─────┴─────┐         ┌──────┴──────┐               │
 │           │         │             │               │
 ├ Dashboard │         ├ Home        │       GestionarSolicitud
 ├ Solicitudes        ├ Mis Solic.  │           Modal
 ├ Empleados          ├ Nueva Solic.│
 ├ Reportes           ├ Perfil      │
 └ Configuración      └ Notificac.  │
```

## Comunicación en tiempo real

Firestore expone listeners reactivos (`onSnapshot`). Cuando el admin cambia el estado de una solicitud:

1. La transacción actualiza el documento `requests/{id}` y crea otro doc en `notifications/`.
2. El frontend del empleado, suscrito a `notifications` filtrado por su `uid`, recibe el cambio en milisegundos.
3. La campana 🔔 se actualiza con el badge sin recargar.

```
Admin click "Aprobar"
        │
        ▼
runTransaction(db)
   ├─► update requests/{id}  (status + history)
   └─► create notifications/{auto}  (userId = empleado)
        │
   onSnapshot fires
        │
        ▼
Empleado ve la campana con +1
```

## Multi-tenancy (a futuro)

Hoy la app es **single-tenant** (una empresa). Si se requiriera SaaS multi-empresa habría que:
- Añadir colección `organizations/`.
- Prefijar todas las colecciones por `organizations/{orgId}/...` o agregar campo `orgId` en cada documento.
- Modificar reglas para filtrar por `orgId` del token / custom claim.

## Tecnologías y versiones

| Tecnología | Versión | Uso |
|---|---|---|
| Next.js | 16.2 | Framework |
| React | 19.2 | UI |
| TypeScript | 5.7 | Tipado |
| Tailwind CSS | 4.2 | Estilos |
| Firebase JS SDK | 12.13 | Backend |
| Radix UI | varios | Primitivas accesibles |
| Recharts | 2.15 | Gráficos |
| date-fns | 4.1 | Fechas |
| lucide-react | 0.564 | Iconos |
| pnpm | 11 | Gestor de paquetes |
