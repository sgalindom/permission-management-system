# GestionaPermisos — Documentación

Plataforma web profesional para la gestión de permisos laborales.
Permite a los empleados registrar solicitudes de permiso y a los administradores aprobarlas, rechazarlas o pre-aprobarlas, con historial, notificaciones y reportes.

---

## Índice de documentos

| Documento | Descripción |
|---|---|
| [ARQUITECTURA.md](./ARQUITECTURA.md) | Visión general del sistema, capas, tecnologías, diagrama de componentes |
| [FRONTEND.md](./FRONTEND.md) | Estructura de carpetas, componentes, contextos, patrones de UI |
| [BACKEND.md](./BACKEND.md) | Servicios Firebase, hooks, transacciones, lógica de negocio |
| [BASE_DE_DATOS.md](./BASE_DE_DATOS.md) | Colecciones Firestore, esquemas, índices, relaciones |
| [MANUAL_BASE_DATOS.md](./MANUAL_BASE_DATOS.md) | **Manual operativo** de la BD (tareas comunes, backup, troubleshooting) |
| [DISENO.md](./DISENO.md) | Paleta de colores, tipografía, espaciado, sistema de diseño |
| [FLUJOS.md](./FLUJOS.md) | Flujos de usuario (login, crear/gestionar solicitudes, notificaciones) |
| [SEGURIDAD.md](./SEGURIDAD.md) | Reglas de Firestore/Storage, autenticación, roles y permisos |
| [DESARROLLO.md](./DESARROLLO.md) | Setup local, scripts, variables de entorno, despliegue |

---

## Resumen ejecutivo

- **Nombre del producto:** GestionaPermisos
- **Tipo:** Aplicación web SaaS (Single-Page App con autenticación)
- **Audiencia:** Empresas que necesitan formalizar las solicitudes de permisos laborales (citas médicas, calamidad doméstica, compensatorios, asuntos personales).
- **Stack:** Next.js 16 + React 19 + TypeScript + Tailwind 4 + Firebase (Auth/Firestore/Storage)
- **Roles:** `admin` y `employee`
- **Estado de las solicitudes:** `pending → preapproved → approved | rejected | cancelled`

## Historias de usuario implementadas (Product Backlog)

| ID | Historia | Estado |
|---|---|---|
| WGH-001 | Login con email/contraseña + recuperar contraseña | ✅ |
| WGH-002 | Validación de rol y menú dinámico por rol | ✅ |
| WGH-003 | Admin ve, filtra y gestiona todas las solicitudes | ✅ |
| WGH-004 | Empleado ve solo sus solicitudes y puede crear nuevas | ✅ |
| WGH-005 | Admin aprueba/rechaza con observación obligatoria | ✅ |
| WGH-006 | Historial de cambios y notificación al solicitante | ✅ |

## Inicio rápido

```powershell
# 1. Instalar dependencias
pnpm install

# 2. Crear el admin inicial y los catálogos base
pnpm bootstrap

# 3. Arrancar en modo desarrollo
pnpm dev
```

Abre http://localhost:3000

Para configuración detallada de Firebase, ver [DESARROLLO.md](./DESARROLLO.md) y `/SETUP_FIREBASE.md`.
