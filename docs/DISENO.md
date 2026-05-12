# Sistema de Diseño — GestionaPermisos

## Identidad

| Elemento | Valor |
|---|---|
| Nombre | **GestionaPermisos** |
| Tagline | "Plataforma de permisos laborales" |
| Logo (lockup) | Icono `ClipboardList` (lucide) en cuadrado azul con esquinas redondeadas + wordmark |
| Personalidad | Profesional, claro, eficiente, corporativo-moderno |
| Idioma | Español (sin tildes en código, con tildes en copy del producto) |

## Paleta de colores

Toda la paleta vive en `app/globals.css` como variables CSS (`--primary`, `--background`, etc.), consumidas por Tailwind v4 vía `@theme inline`.

### Modo claro (default)

#### Colores semánticos principales

| Variable | Hex | Uso |
|---|---|---|
| `--background` | `#f8fafc` | Fondo principal de la app |
| `--foreground` | `#0f172a` | Texto principal |
| `--card` | `#ffffff` | Fondo de tarjetas |
| `--card-foreground` | `#0f172a` | Texto en tarjetas |
| `--popover` | `#ffffff` | Fondo de popovers/menús |
| `--popover-foreground` | `#0f172a` | Texto en popovers |
| `--primary` | `#2563eb` | **Azul corporativo** — botones primarios, links, énfasis |
| `--primary-foreground` | `#ffffff` | Texto sobre primary |
| `--secondary` | `#f1f5f9` | Fondos suaves |
| `--secondary-foreground` | `#1e293b` | Texto sobre secondary |
| `--muted` | `#f1f5f9` | Fondos atenuados |
| `--muted-foreground` | `#64748b` | Texto auxiliar / metadata |
| `--accent` | `#eff6ff` | Fondos de hover, items seleccionados |
| `--accent-foreground` | `#1e40af` | Texto sobre accent |
| `--destructive` | `#dc2626` | Acciones destructivas, rechazos |
| `--destructive-foreground` | `#ffffff` | Texto sobre destructive |
| `--border` | `#e2e8f0` | Bordes |
| `--input` | `#e2e8f0` | Bordes de inputs |
| `--ring` | `#2563eb` | Anillo de foco |

#### Sidebar

| Variable | Hex |
|---|---|
| `--sidebar` | `#ffffff` |
| `--sidebar-foreground` | `#0f172a` |
| `--sidebar-primary` | `#2563eb` |
| `--sidebar-primary-foreground` | `#ffffff` |
| `--sidebar-accent` | `#eff6ff` |
| `--sidebar-accent-foreground` | `#1e40af` |
| `--sidebar-border` | `#e2e8f0` |
| `--sidebar-ring` | `#2563eb` |

#### Estados de solicitud (colores semánticos del dominio)

| Estado | Variable | Color | Fondo | Uso |
|---|---|---|---|---|
| Pendiente | `--status-pending` | `#f59e0b` (amber-500) | `#fef3c7` (amber-100) | Solicitud sin gestionar |
| Pre-aprobada | `--status-preapproved` | `#0284c7` (sky-600) | `#e0f2fe` (sky-100) | Aprobada por supervisor, falta admin |
| Aprobada | `--status-approved` | `#16a34a` (green-600) | `#dcfce7` (green-100) | Decisión final positiva |
| Rechazada | `--status-rejected` | `#dc2626` (red-600) | `#fee2e2` (red-100) | Decisión final negativa |
| Cancelada | `--status-cancelled` | `#78716c` (stone-500) | `#f5f5f4` (stone-100) | Cancelada por empleado |

#### Colores de gráficos (Recharts)

| Variable | Hex | Uso típico |
|---|---|---|
| `--chart-1` | `#2563eb` | Azul (primario) |
| `--chart-2` | `#16a34a` | Verde |
| `--chart-3` | `#eab308` | Amarillo |
| `--chart-4` | `#dc2626` | Rojo |
| `--chart-5` | `#8b5cf6` | Violeta |

### Modo oscuro (definido pero sin toggle activo)

Las variables `dark:` están en `app/globals.css` pero **no hay aún un selector de tema activo**. Cuando se implemente, los valores son:

| Variable | Hex |
|---|---|
| `--background` | `#0f172a` |
| `--foreground` | `#f8fafc` |
| `--card` | `#1e293b` |
| `--primary` | `#3b82f6` |
| `--destructive` | `#ef4444` |
| ... | (ver `app/globals.css`) |

## Tipografía

### Familias

| Familia | Origen | Uso |
|---|---|---|
| **Geist** | `next/font/google` | Texto general (sans-serif) |
| **Geist Mono** | `next/font/google` | Códigos como `PRM-0148`, números de documento |

Definidas en `app/layout.tsx` y mapeadas a CSS:

```css
--font-sans: 'Geist', 'Geist Fallback';
--font-mono: 'Geist Mono', 'Geist Mono Fallback';
```

Aplicado al body con `font-sans antialiased`.

### Escala tipográfica (Tailwind)

| Clase | Tamaño | Uso típico |
|---|---|---|
| `text-xs` | 12px | Metadata, badges, timestamps |
| `text-sm` | 14px | Body por defecto, labels |
| `text-base` | 16px | Párrafos, inputs |
| `text-lg` | 18px | Subtítulos de sección |
| `text-xl` | 20px | Títulos de tarjeta |
| `text-2xl` | 24px | Títulos de página ("Hola, Sebastian!") |
| `text-3xl` | 30px | Números grandes (stats) |

### Pesos

| Clase | Peso | Uso |
|---|---|---|
| `font-normal` | 400 | Body |
| `font-medium` | 500 | Botones, items de nav |
| `font-semibold` | 600 | Subtítulos, labels destacados |
| `font-bold` | 700 | Títulos, números de stats |

### Mayúsculas

`uppercase tracking-wide` en metadata pequeña (ej. "TOTAL REGISTRADAS").

## Espaciado

Tailwind escala 0.25rem = 4px:

| Clase | Valor |
|---|---|
| `gap-1` / `p-1` | 4px |
| `gap-2` / `p-2` | 8px |
| `gap-3` / `p-3` | 12px |
| `gap-4` / `p-4` | 16px |
| `gap-6` / `p-6` | 24px |
| `gap-8` / `p-8` | 32px |

**Patrones:**
- Padding de página: `p-6`
- Padding de card: `p-4` (compact) o `p-5`/`p-6` (estándar)
- Gap entre items de lista: `space-y-2` o `space-y-3`
- Gap entre secciones: `mb-6` u `mb-8`

## Radios

Variable base: `--radius: 0.625rem` (10px).

| Token Tailwind | Valor calculado | Uso |
|---|---|---|
| `rounded-sm` (radius-sm) | 6px | Tags pequeños |
| `rounded-md` (radius-md) | 8px | Inputs, badges |
| `rounded-lg` (radius-lg) | 10px | Botones, items de lista |
| `rounded-xl` (radius-xl) | 14px | Cards, modals |
| `rounded-2xl` | 16px | Logo, headers especiales |
| `rounded-full` | 9999px | Avatares, badges circulares |

## Sombras

Tailwind por defecto:

| Clase | Uso |
|---|---|
| `shadow-sm` | Inputs, cards sutiles |
| `shadow-md` | Hover de cards |
| `shadow-lg` | Cards principales, dropdowns |
| `shadow-xl` | Modales, login card |
| `shadow-2xl` | Modal del gestor de solicitudes |

Sombras de color para énfasis:
- `shadow-lg shadow-blue-500/25` — botón primario del login
- `shadow-blue-500/30` — logo del sidebar

## Iconografía

**Librería:** [lucide-react](https://lucide.dev) — set unificado, peso de trazo consistente.

### Iconos por contexto

| Contexto | Icono |
|---|---|
| Logo del producto | `ClipboardList` |
| Dashboard | `LayoutDashboard` |
| Solicitudes (lista) | `FileText` |
| Gestionar | `CheckSquare` |
| Empleados | `Users` |
| Reportes | `BarChart3` |
| Configuración | `Settings` |
| Perfil | `User` |
| Notificaciones | `Bell` |
| Nueva | `PlusCircle` / `Plus` |
| Calendario | `Calendar` |
| Adjuntar | `Paperclip` / `Upload` |
| Cerrar | `X` |
| Editar | `Pencil` |
| Eliminar | `Trash2` |
| Activar usuario | `UserCheck` (verde) |
| Desactivar usuario | `UserX` (rojo) |
| Aprobado | `CheckCircle2` |
| Rechazado | `XCircle` |
| Cargando | `Loader2` (con `animate-spin`) |
| Error/alerta | `AlertCircle` |
| Copiar | `Copy` |

**Tamaños estándar:**
- `w-4 h-4` (16px) — inline con texto
- `w-5 h-5` (20px) — items de nav
- `w-8 h-8` (32px) — headers de sección vacía
- `w-12 h-12` (48px) — empty states grandes
- `w-16 h-16` (64px) — logo, avatares grandes

## Componentes UI (shadcn)

Solo los 11 que están en `components/ui/`. Para detalles de cada uno ver la documentación oficial de shadcn/ui.

| Componente | Uso principal |
|---|---|
| `Alert` | Mensajes de éxito/error en formularios |
| `Badge` | Tags de estado, roles |
| `Button` | Acciones primarias y secundarias |
| `Card` | Contenedor estándar de bloques |
| `Dialog` | Modales (crear empleado, editar, reset password) |
| `DropdownMenu` | Menú de usuario en sidebar, campana de notificaciones |
| `Input` | Campos de texto, fecha, hora, email, contraseña |
| `Label` | Etiquetas de campos |
| `Select` | Dropdowns (rol, área, supervisor, motivo) |
| `Tabs` | Switch entre "Áreas" y "Supervisores" en Configuración |
| `Textarea` | Observaciones |

### Variantes de Button

| Variante | Estilo | Uso |
|---|---|---|
| `default` | Azul sólido | Acción primaria |
| `outline` | Borde + transparente | Acción secundaria |
| `ghost` | Sin borde, hover gris | Iconos de tabla, acciones discretas |
| `destructive` | Rojo | Eliminar |

### Variantes de Badge

| Estilo | Uso |
|---|---|
| `default` | Rol admin |
| `secondary` | Rol empleado |
| Clase custom `bg-emerald-100 text-emerald-700` | Estado "Activo" |
| Clase custom `bg-gray-200 text-gray-700` | Estado "Inactivo" |

## Patrones de UI recurrentes

### Header de página
```
┌─────────────────────────────────────────────────────────┐
│ Título (text-lg semibold)         [Botones acción] [🔔] │
│ Subtítulo (text-sm muted)                                │
└─────────────────────────────────────────────────────────┘
```
- Altura fija `h-16`, `bg-white`, `border-b`, `sticky top-0 z-10`.

### Card con borde superior de color
```
┌─────────────────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │  ← border-t-4 border-t-blue-500
│ Métrica (text-3xl bold)     │
│ Subtítulo (text-xs muted)   │
└─────────────────────────────┘
```
Uso: tarjetas de stats en el home.

### Item de lista con avatar circular
Avatar circular con gradiente azul→índigo + iniciales en blanco. Usado en sidebar, lista de empleados, lista de solicitudes.

```html
<div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-semibold">
  {iniciales}
</div>
```

### Empty state
```
┌─────────────────────────────┐
│        [Icono 48px gris]    │
│                              │
│  Mensaje en muted-foreground │
└─────────────────────────────┘
```
Centrado, padding generoso (`p-8` o `p-12`).

### Stepper (en Nueva Solicitud)
Círculos numerados conectados por línea, con colores:
- Activo: `bg-blue-600 text-white shadow-lg`
- Completado: `bg-emerald-100 text-emerald-600 border-2 border-emerald-300`
- Pendiente: `bg-gray-100 text-gray-400`

## Accesibilidad

- Todos los inputs con `<Label>` asociado.
- Componentes Radix UI son accesibles por defecto (keyboard navigation, ARIA).
- Contraste WCAG AA respetado por la paleta (texto `#0f172a` sobre `#ffffff` = 17.85:1).
- Anillo de foco visible (`--ring: #2563eb`).
- Botones tienen `disabled` durante operaciones async.

## Animaciones

Vienen de `tw-animate-css` (paquete que extiende Tailwind con utilidades de animación).

| Clase | Uso |
|---|---|
| `animate-spin` | `Loader2` (spinner de carga) |
| `transition-all` / `transition-colors` | Hover y estados |
| `animate-in fade-in` | Aparición de modales/dropdowns (Radix lo aplica) |

## No-goals (cosas que NO hace el diseño)

- No usa emojis decorativos en la UI (solo en notificaciones del usuario si los escribe).
- No tiene ilustraciones — solo iconos minimalistas.
- No usa color como única señal (siempre va con texto o icono).
- No tiene microinteracciones complejas — todo es funcional y directo.
