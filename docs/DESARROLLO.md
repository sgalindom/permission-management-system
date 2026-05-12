# Desarrollo y Operación — GestionaPermisos

## Requisitos previos

| Herramienta | Versión mínima | Notas |
|---|---|---|
| **Node.js** | 20 LTS o superior | https://nodejs.org |
| **pnpm** | 9 o superior | `npm install -g pnpm` |
| **Git** | cualquiera | Para versionado |
| **Cuenta Firebase** | gratis | Para Auth/Firestore/Storage |
| **Editor** | VS Code recomendado | Con extensiones de TypeScript y Tailwind |

## Setup inicial (primera vez)

### 1. Instalar dependencias

```powershell
pnpm install
```

### 2. Configurar `.env.local`

Copiar `.env.example` a `.env.local` y rellenar con los valores de tu proyecto Firebase:

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu-proyecto
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu-proyecto.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=...
```

Estos valores los obtienes en **Firebase Console → Configuración del proyecto → Tus apps → Configuración de SDK**.

### 3. Configurar Firebase Console

Ver guía detallada en `SETUP_FIREBASE.md` (raíz del proyecto). En resumen:

1. **Authentication → Sign-in method:** habilitar **Email/Password**.
2. **Authentication → Settings → Authorized domains:** agregar `localhost` + tu dominio prod.
3. **Firestore Database → Crear:** modo producción, región `nam5`.
4. **Firestore → Rules:** pegar contenido de `firestore.rules` y publicar.
5. **Storage → Get started → Rules:** pegar contenido de `storage.rules` y publicar.

### 4. Bootstrap del admin inicial y catálogos

#### Opción A — Antes de crear el admin en Auth (NO recomendada)
Manualmente desde la consola.

#### Opción B — Script automatizado (recomendada)

1. En **Authentication → Users → Add user**, crear el admin (ej. `admin@empresa.com`).
2. Copiar el **UID** del usuario recién creado.
3. Editar `scripts/bootstrap-admin.mjs` y reemplazar el `uid` y `email` del `ADMIN` con los tuyos.
4. Ejecutar:

```powershell
pnpm bootstrap
```

Esto crea:
- Documento `users/{uid}` con `role: "admin"` y `active: true`.
- `counters/requests` con `lastNumber: 0`.
- 4 áreas y 5 supervisores semilla.

> ⚠️ Para que el script funcione, las reglas de Firestore deben estar abiertas temporalmente, o el script debe ejecutarse con un service account (avanzado). En desarrollo normal lo más fácil es abrir reglas, ejecutar el script, y volver a poner reglas estrictas.

### 5. Arrancar en desarrollo

```powershell
pnpm dev
```

Abre http://localhost:3000

## Scripts disponibles

| Comando | Hace |
|---|---|
| `pnpm dev` | Servidor de desarrollo con hot reload |
| `pnpm build` | Build de producción |
| `pnpm start` | Servir el build de producción |
| `pnpm lint` | Linter (ESLint) |
| `pnpm bootstrap` | Seed inicial (admin + catálogos) |

## Estructura del proyecto

```
v0-permiso-platform-ui/
├── app/                   # Páginas Next.js (App Router)
├── components/            # Componentes React
│   └── ui/               # Primitivas shadcn/ui
├── lib/                   # Lógica, contextos, servicios
├── scripts/               # Scripts de utilidad (bootstrap)
├── docs/                  # Esta documentación
├── public/                # Assets estáticos (iconos)
├── firestore.rules        # Reglas Firestore
├── firestore.indexes.json # Índices compuestos
├── storage.rules          # Reglas Storage
├── firebase.json          # Config Firebase CLI
├── next.config.mjs        # Config Next.js
├── tsconfig.json          # Config TypeScript
├── package.json
├── pnpm-lock.yaml
├── SETUP_FIREBASE.md      # Guía de configuración Firebase
└── .env.local             # Variables sensibles (NO commitear)
```

## Convenciones de código

- **Idioma:** comentarios y strings de UI en español (sin tildes en código, con tildes ok en literales).
- **Nombres archivos:** `kebab-case`.
- **Componentes:** `PascalCase`.
- **Funciones/vars:** `camelCase`.
- **Tipos:** `PascalCase`.
- **Constantes:** `UPPER_SNAKE_CASE`.
- **Imports:** absolutos con `@/...` para `components/lib/etc`, relativos para mismo directorio.

## Cómo agregar...

### ...una pantalla nueva
1. Crear archivo en `components/`.
2. Agregar caso al `switch` en `app/page.tsx`.
3. Si requiere entrada en sidebar, editar `components/sidebar.tsx`.

### ...un campo nuevo a una entidad
1. Actualizar tipo en `lib/types.ts`.
2. Si afecta `requests`: actualizar mapper en `lib/requests-context.tsx`.
3. Si afecta `users`: actualizar `lib/users-service.ts`.
4. Actualizar pantallas de creación/edición.
5. Si la lectura/escritura necesita protección, revisar `firestore.rules`.

### ...un componente shadcn nuevo
Solo agregar el archivo desde el sitio de shadcn. No tenemos CLI configurado pero los archivos son auto-contenidos. Asegúrate de instalar el paquete de Radix correspondiente si aplica.

### ...una notificación nueva
1. Definir el `type` en `lib/types.ts` (`AppNotification.type`).
2. Crear el documento en la transacción correspondiente con `userId`, `title`, `message`.
3. En `notifications-bell.tsx` ya se renderiza automáticamente.

## Despliegue

### Vercel (recomendado)

#### Vía GitHub
1. Push el proyecto a GitHub.
2. Importar en https://vercel.com.
3. En **Settings → Environment Variables**, pegar las mismas variables de `.env.local`.
4. Deploy automático al hacer push.

#### Vía CLI
```powershell
npm install -g vercel
vercel
```

#### Antes de hacer deploy a producción
- ✅ Reglas Firestore + Storage publicadas y restrictivas.
- ✅ Variables de entorno configuradas en Vercel.
- ✅ Dominio agregado a "Authorized domains" de Firebase Auth.
- ✅ Admin inicial creado.
- ✅ Probado el flujo completo localmente.

### Auto-hosting (alternativa)

Si quisieras hospedar en un VPS:

```powershell
pnpm build
pnpm start  # corre en puerto 3000
```

Necesitarás un reverse proxy (Nginx) con HTTPS.

## Variables de entorno

| Variable | Pública | Uso |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_*` | ✅ Sí | Config del SDK web — sale en el bundle |

No hay variables privadas porque no hay servidor propio. Si en el futuro agregamos Cloud Functions, ahí sí habrá secretos (sin prefijo `NEXT_PUBLIC_`).

## Debug y troubleshooting

### "FirebaseError: Missing or insufficient permissions"
Casi siempre significa:
- El usuario no tiene documento en `users/{uid}` con `role` y `active: true`.
- Las reglas no están publicadas o están mal escritas.
- Estás intentando una operación que las reglas no permiten.

**Debug:** abre la consola Firebase → Firestore → Reglas → Playground para simular la operación.

### "Index required" (al hacer query con orderBy + where)
Firestore te da un link en la consola que crea el índice automáticamente. Tras crearlo, espera 1-2 minutos.

### Tipos TypeScript se rompen tras cambiar `lib/types.ts`
Reinicia el servidor TS de VS Code (`Cmd/Ctrl + Shift + P` → "Restart TS Server").

### Hot reload no aplica cambios
Detén `pnpm dev` y vuelve a arrancarlo. A veces Next.js cachea agresivamente en Windows.

### Adjunto no sube
- Verifica que esté habilitado Storage en la consola.
- Reglas de Storage publicadas.
- El archivo no supera 10 MB.

## Testing manual

Checklist mínimo antes de marcar una feature como "lista":

- [ ] Crear empleado nuevo desde Admin → Empleados, copiar credenciales, entrar incógnito con ese empleado.
- [ ] Empleado crea solicitud (con y sin adjunto).
- [ ] Admin ve la solicitud en la lista.
- [ ] Admin la pre-aprueba → empleado ve campana 🔔 con +1 sin recargar.
- [ ] Admin la aprueba → empleado ve notificación nueva.
- [ ] Empleado intenta cancelar (debe poder solo si está pending/preapproved).
- [ ] Admin → Configuración: agregar/editar/borrar un área.
- [ ] Admin → Reportes: ver gráficos + exportar CSV.
- [ ] Empleado → Mi Perfil: cambiar contraseña (con contraseña actual correcta).
- [ ] Cerrar sesión y volver a entrar con la nueva contraseña.

## Limpieza periódica

| Tarea | Frecuencia |
|---|---|
| Revisar dependencias obsoletas (`pnpm outdated`) | Mensual |
| Auditoría de seguridad (`pnpm audit`) | Mensual |
| Eliminar adjuntos de solicitudes muy antiguas | Anual (con política) |
| Revisar billing de Firebase | Mensual |
| Backup de Firestore (export) | Mensual o automatizar con Cloud Scheduler |

## Recursos

- Next.js: https://nextjs.org/docs
- Firebase: https://firebase.google.com/docs
- shadcn/ui: https://ui.shadcn.com
- Tailwind: https://tailwindcss.com/docs
- Radix UI: https://www.radix-ui.com/primitives
- lucide-react: https://lucide.dev
- Recharts: https://recharts.org

## Contacto / soporte

Definido por la empresa que opere la herramienta.
