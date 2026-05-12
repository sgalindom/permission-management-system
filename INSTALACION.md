# Guía de Instalación — GestionaPermisos

Esta guía explica paso a paso cómo dejar el proyecto corriendo en tu computador desde cero.

---

## 1. Requisitos previos

Antes de empezar, instala estas herramientas:

### 1.1 Node.js (versión 20 o superior)

- Descárgalo desde https://nodejs.org
- Elige la versión **LTS** (Long Term Support).
- Instálalo con los valores por defecto.

Para verificar que quedó instalado, abre **PowerShell** y ejecuta:

```powershell
node --version
```

Debe responder algo como `v20.x.x` o superior. Si dice "no se reconoce", reinicia el computador.

### 1.2 pnpm (gestor de paquetes)

Una vez tengas Node, abre PowerShell y ejecuta:

```powershell
npm install -g pnpm
```

Verifica:

```powershell
pnpm --version
```

### 1.3 Editor de código (recomendado)

**Visual Studio Code:** https://code.visualstudio.com

No es obligatorio pero hace todo más fácil.

### 1.4 Cuenta en Firebase

Necesitas acceso al proyecto Firebase **gestor-de-permiso**. Pídele al admin del proyecto que te agregue como **viewer** o **editor** en:

https://console.firebase.google.com/project/gestor-de-permiso

---

## 2. Obtener el código

Descomprime el ZIP que te enviaron en una ubicación cómoda. Por ejemplo:

```
C:\Proyectos\gestiona-permisos\
```

> Evita rutas con espacios o caracteres especiales (tilde, ñ).

---

## 3. Configurar variables de entorno

El proyecto necesita las credenciales de Firebase para funcionar.

### 3.1 Crear el archivo `.env.local`

En la raíz del proyecto (donde está `package.json`), crea un archivo llamado **`.env.local`** (con el punto adelante) con el siguiente contenido:

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyD836E_EsDSDXUXkfytUE-1NQtX0R5m8sI
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=gestor-de-permiso.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=gestor-de-permiso
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=gestor-de-permiso.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=434440010899
NEXT_PUBLIC_FIREBASE_APP_ID=1:434440010899:web:1c627938c2f31d9f946166
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-7B8K6P443W
```

> Pídele estas variables al admin del proyecto si no las tienes. Sin ellas, la app no se conecta a Firebase.

---

## 4. Instalar las dependencias

Abre **PowerShell** en la carpeta del proyecto. Forma fácil:
- Abre el Explorador en `C:\Proyectos\gestiona-permisos\`
- **Shift + click derecho** dentro de la carpeta → "Abrir ventana de PowerShell aquí" (o "Abrir en Terminal").

Ejecuta:

```powershell
pnpm install
```

Esto descarga las ~150 librerías que usa el proyecto. La primera vez tarda **2–5 minutos** dependiendo de tu internet.

Cuando termine, verás algo como:

```
Done in 2.7s using pnpm v11.x.x
```

> Si aparece un aviso `ERR_PNPM_IGNORED_BUILDS` sobre `sharp` o `protobufjs`, **es solo informativo**, no es un error.

---

## 5. Arrancar el servidor de desarrollo

Sigue en la misma PowerShell:

```powershell
pnpm dev
```

Verás algo como:

```
▲ Next.js 16.2.0
- Local:        http://localhost:3000
- Network:      http://192.168.x.x:3000

✓ Ready in 2s
```

Abre el navegador en: **http://localhost:3000**

Para **detener** el servidor: en la terminal presiona `Ctrl + C`.

---

## 6. Iniciar sesión

La aplicación requiere un usuario válido creado por el admin.

**Credenciales del usuario administrador del aplicativo:**

| Campo | Valor |
|---|---|
| Correo | `admin@gestionpermisos.com` |
| Contraseña | `Admin2026*` |
| Nombre | Administrador Aplicativo |
| Rol | Administrador |

> ⚠️ **Por seguridad**, en el primer inicio te recomendamos cambiar la contraseña usando la opción **"¿Olvidaste tu contraseña?"** desde la pantalla de login. Eso enviará un enlace de restablecimiento al correo.

Si necesitas un usuario empleado para pruebas, entra como admin y créalo desde **Admin → Empleados → Nuevo empleado**. Al terminar, el sistema te mostrará el correo y la contraseña generada para entregarle al empleado.

---

## 7. Estructura del proyecto

```
gestiona-permisos/
├── app/                    # Páginas de Next.js
├── components/             # Componentes de React
│   └── ui/                # Primitivas reutilizables (shadcn/ui)
├── lib/                    # Lógica, contextos, servicios Firebase
├── scripts/                # Scripts auxiliares (bootstrap)
├── docs/                   # Documentación técnica completa
├── public/                 # Iconos
├── firestore.rules         # Reglas de seguridad Firestore
├── storage.rules           # Reglas de seguridad Storage
├── package.json            # Dependencias y scripts
├── .env.local              # Variables (NO compartir públicamente)
├── INSTALACION.md          # Este archivo
└── SETUP_FIREBASE.md       # Setup avanzado de Firebase
```

---

## 8. Comandos útiles

| Comando | Qué hace |
|---|---|
| `pnpm install` | Instala/actualiza dependencias |
| `pnpm dev` | Arranca el servidor de desarrollo (con hot reload) |
| `pnpm build` | Genera el build de producción |
| `pnpm start` | Sirve el build de producción |
| `pnpm lint` | Revisa el código con ESLint |
| `pnpm bootstrap` | Crea el admin inicial y catálogos (solo primera vez del proyecto) |

---

## 9. Documentación técnica

En la carpeta `docs/` encuentras documentación completa:

| Documento | Contenido |
|---|---|
| `docs/README.md` | Índice y resumen del proyecto |
| `docs/ARQUITECTURA.md` | Arquitectura general |
| `docs/FRONTEND.md` | Cómo está organizado el frontend |
| `docs/BACKEND.md` | Servicios Firebase y lógica |
| `docs/BASE_DE_DATOS.md` | Colecciones, campos y relaciones |
| `docs/DISENO.md` | Colores, tipografía, iconos |
| `docs/FLUJOS.md` | Flujos de usuario paso a paso |
| `docs/SEGURIDAD.md` | Reglas y permisos |
| `docs/DESARROLLO.md` | Guía detallada para desarrolladores |

---

## 10. Problemas comunes

### "pnpm no se reconoce como comando"
Cierra y abre PowerShell de nuevo. Si persiste, reinstala pnpm: `npm install -g pnpm`.

### "Error: Cannot find module 'firebase'"
No ejecutaste `pnpm install` o falló. Vuelve a correrlo.

### "FirebaseError: Missing or insufficient permissions"
Tu usuario:
- No tiene cuenta en Firebase Authentication, o
- No tiene documento en la colección `users/` de Firestore, o
- Tiene `active: false`.

**Solución:** pídele al admin que te cree el usuario desde la app o desde la consola Firebase.

### El puerto 3000 está ocupado
Otro programa (otra Next.js, otra app) está usando ese puerto. Cierra el otro programa o cambia el puerto:

```powershell
pnpm dev -- -p 3001
```

### Cambié código y no veo cambios en el navegador
- Asegúrate de haber guardado el archivo (`Ctrl + S`).
- Refresca con `Ctrl + F5` (descarta caché).
- Si persiste, detén `pnpm dev` (`Ctrl + C`) y vuelve a arrancarlo.

### Pantalla blanca o errores raros
1. Abre la consola del navegador (F12 → pestaña Console) y revisa el mensaje rojo.
2. Si dice "Missing API key" o similar, revisa tu `.env.local`.
3. Si dice "permissions", ver el problema anterior.

---

## 11. Cómo desplegar a producción (opcional)

Para subir el proyecto a un dominio público, lo más sencillo es **Vercel**:

1. Crear cuenta en https://vercel.com (puedes usar tu GitHub).
2. **Add New → Project** → conectar el repositorio Git.
3. En **Environment Variables** pegar las mismas variables del `.env.local`.
4. **Deploy**. En 2 minutos te da una URL pública.

Para más detalles, ver `docs/DESARROLLO.md`.

---

## 12. Contacto

Para dudas técnicas del proyecto, contactar al responsable del equipo.

¡Listo! Si todo salió bien, ya tienes la app corriendo en `http://localhost:3000`. 🚀
