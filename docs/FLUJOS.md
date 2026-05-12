# Flujos de Usuario — GestionaPermisos

## 1. Login (WGH-001)

```
Usuario abre la app
       │
       ▼
¿Hay sesión activa? ─── Sí ──► Dashboard (según rol)
       │
       No
       ▼
Pantalla de login
       │
   Ingresa email + contraseña → click "Ingresar"
       │
       ▼
signInWithEmailAndPassword(email, pass)
       │
       ├─ Falla ─► Mostrar "Credenciales incorrectas"
       │
       └─ Éxito
            │
            ▼
       getDoc(users/{uid})
            │
            ├─ No existe / active=false ─► signOut + mensaje "Cuenta no autorizada"
            │
            └─ Éxito
                 │
                 ▼
            Hidratar contexto Auth con user
                 │
                 ▼
            Renderizar vista según role
```

## 2. Recuperar contraseña (WGH-001 escenario 2)

```
Click "Olvidaste tu contraseña?"
       │
       ▼
Diálogo pide email
       │
   Ingresa correo → "Enviar enlace"
       │
       ▼
sendPasswordResetEmail(auth, email)
       │
       ├─ Falla ─► Mostrar error
       │
       └─ Éxito ─► Mostrar "Te enviamos un enlace"
            │
            ▼
       Usuario revisa su email
            │
            ▼
       Click en el link de Firebase
            │
            ▼
       Página oficial de Firebase para ingresar nueva contraseña
            │
            ▼
       Usuario vuelve al login con su nueva contraseña
```

## 3. Admin crea un empleado

```
Admin → menú Empleados → click "Nuevo empleado"
       │
       ▼
Diálogo con formulario (contraseña auto-generada)
       │
   Llena datos: nombre, email, documento, área, cargo, rol, etc.
   Puede regenerar contraseña con botón "Generar"
       │
       ▼
Click "Crear empleado"
       │
       ▼
adminCreateUser(input)
       │
       ├─► Usar instancia SECUNDARIA de Firebase
       │     │
       │     ▼
       │   createUserWithEmailAndPassword(secondaryAuth, email, pass)
       │     │
       │     ▼
       │   uid generado
       │
       ├─► setDoc(users/{uid}, { ...datos, role, active: true, createdAt })
       │
       └─► signOut(secondaryAuth)   ← libera la sesión secundaria
            │
            ▼
       Sesión del admin INTACTA
            │
            ▼
       Diálogo muestra credenciales (correo + contraseña)
            │
       Admin copia y entrega al empleado
            │
            ▼
       Empleado puede iniciar sesión
       (opcional: usa "Olvidé contraseña" para cambiarla)
```

## 4. Empleado crea una solicitud (WGH-004)

```
Empleado → Nueva Solicitud
       │
       ▼
PASO 1 (autocompletado): nombre, documento, área, cargo (read-only)
   + selecciona supervisor desde catálogo
       │
       ▼
PASO 2: detalle del permiso
   - Fecha del permiso (date picker)
   - Hora inicio / fin
   - Motivo (cita médica / calamidad / compensatorio / motivos personales)
   - Duración (horas O días, exclusivo)
       │
       ▼
PASO 3: reposición
   - ¿Va a reponer? Sí/No
   - Si Sí: fecha, hora inicio/fin, persona que reemplaza
       │
       ▼
PASO 4: info adicional
   - Es remunerado? Sí/No
   - Observaciones (opcional)
   - Adjuntar soporte (opcional, máx 10 MB)
       │
       ▼
Click "Enviar solicitud"
       │
       ▼
Si hay adjunto:
   uploadRequestAttachment(file) → URL en Storage
       │
       ▼
nextRequestCode() en transacción → "PRM-0042"
       │
       ▼
addDoc(requests, { ...formData, code, status: "pending",
                    createdAt: serverTimestamp(),
                    history: [
                      { action: "Solicitud creada", by: empleado },
                      { action: "Estado: Pendiente de revision", by: "Sistema" }
                    ] })
       │
       ▼
Redirect a "Mis Solicitudes"
       │
       ▼
La nueva solicitud aparece en la lista (sin recargar — onSnapshot)
```

## 5. Admin gestiona una solicitud (WGH-005, WGH-006)

```
Admin → Dashboard o Ver Solicitudes
       │
       ▼
Click sobre una solicitud
       │
       ▼
Se abre GestionarSolicitudModal
   - Muestra detalle completo
   - Historial cronológico
   - Selector de nuevo estado: Pre-aprobada / Aprobada / Rechazada
   - Textarea para Observación (OBLIGATORIA)
       │
   Admin elige nuevo estado y escribe observación
       │
       ▼
Click "Guardar decisión"
       │
       ├─ Observación vacía ─► Error inline "La observación es obligatoria"
       │
       └─ OK
            │
            ▼
       runTransaction(db):
         │
         ├─ get(requests/{id})
         ├─ update(requests/{id}, {
         │     status: nuevo,
         │     observations,
         │     updatedAt: serverTimestamp(),
         │     history: [...previo, {
         │       date, action, by: admin.name, byUid: admin.uid,
         │       observation, fromStatus, toStatus
         │     }]
         │   })
         └─ Si byUid !== employeeId:
               create(notifications/{auto}, {
                 userId: employeeId,
                 type: "status_change",
                 requestId,
                 title: "Tu solicitud PRM-0042 fue actualizada",
                 message: "Nuevo estado: approved. Observación: ...",
                 read: false,
                 createdAt: serverTimestamp()
               })
       │
       ▼
       Transacción confirmada
       │
       ▼
       Modal se cierra
       │
       ▼
       (en otra ventana/dispositivo) El empleado ve:
         - El estado de su solicitud cambió en "Mis Solicitudes"
         - La campana 🔔 muestra +1
         - En notificaciones aparece la entrada nueva
```

## 6. Empleado cancela su propia solicitud

```
Empleado → Mis Solicitudes
       │
   Solo solicitudes en estado "pending" o "preapproved" tienen botón Cancelar
       │
       ▼
Click "Cancelar"
       │
       ▼
confirm("¿Está seguro?")
       │
       ▼ (Sí)
cancelRequest(id, user.name, user.uid)
       │
       └─► updateRequestStatus(id, "cancelled", "Cancelada por el empleado", ...)
              │
              ▼
         Misma transacción que WGH-006:
         actualiza status + history + NO crea notificación
         (porque byUid === employeeId)
```

## 7. Aprobaciones rápidas y masivas (Admin)

### Rápida (un solo botón en la tabla)
```
Click "Aprobar rápido" o "Rechazar rápido" sobre una fila
       │
       ▼
prompt("Observación (obligatoria):")
       │
       ├─ Vacío ─► Cancela
       │
       └─► updateRequestStatus(id, "approved" | "rejected", observación, ...)
```

### Masiva (selección múltiple)
```
Admin selecciona varias filas con checkbox
       │
       ▼
Click "Aprobar seleccionadas" o "Rechazar seleccionadas"
       │
       ▼
prompt("Observación / Motivo:")
       │
       └─► Loop: para cada id, updateRequestStatus(...)
```

## 8. Recibir notificación

```
Cualquier escritura en notifications/{id} con userId === auth.uid
       │
       ▼
onSnapshot fires en el cliente del empleado
       │
       ├─► NotificationsBell actualiza el badge con unreadCount
       │
       └─► Lista en pantalla "Notificaciones" se actualiza

Click en una notificación
       │
       ▼
markAsRead(id) → updateDoc(notifications/{id}, { read: true })
       │
       ▼
El badge baja automáticamente
```

## 9. Cambiar contraseña (perfil)

```
Empleado → Mi Perfil → tarjeta "Cambiar contraseña"
       │
   Ingresa contraseña actual + nueva + confirmar
       │
       ▼
EmailAuthProvider.credential(email, currentPwd)
       │
       ▼
reauthenticateWithCredential(currentUser, cred)
       │
       ├─ Falla ─► "La contraseña actual es incorrecta"
       │
       └─ OK
            │
            ▼
       updatePassword(currentUser, newPwd)
            │
            ▼
       Mostrar "Contraseña actualizada"
```

## 10. Editar catálogos (admin → Configuración)

### Áreas
```
Pestaña "Áreas" → "Nueva"
       │
   Diálogo pide nombre → Guardar
       │
       ▼
addDoc(areas, { name }) → Aparece en todos los dropdowns en tiempo real

Editar: click lápiz → diálogo prellenado → guardar → updateDoc
Eliminar: click papelera → confirm → deleteDoc
```

### Supervisores
Idéntico, con campos extra `area` y `email`.

## 11. Exportar reporte (admin → Reportes)

```
Admin → Reportes
       │
   Ve gráficos (estado, motivo, área, mes)
       │
       ▼
Click "Exportar CSV"
       │
       ▼
Genera CSV en cliente con TODAS las solicitudes:
   código, empleado, documento, área, cargo, motivo, fecha,
   horarios, duración, remunerado, estado, observaciones, fecha creación
       │
       ▼
Descarga archivo "solicitudes-YYYY-MM-DD.csv"
```

## Estados y transiciones permitidas

```
                  ┌──────────────────────────┐
                  │                          │
                  ▼                          │
   ┌──── pending ─────► preapproved          │
   │       │                  │              │
   │       │                  │              │
   │       ▼                  ▼              │
   │   approved           approved           │
   │       │                  │              │
   │       │                  │              │
   │       ▼                  ▼              │
   │   (final)            (final)            │
   │                                         │
   ├──► rejected (final)                     │
   │                                         │
   └──► cancelled (final, solo por empleado)─┘
        (solo desde pending o preapproved)
```

| Desde | Hacia | Quién puede |
|---|---|---|
| `pending` | `preapproved` | Admin |
| `pending` | `approved` | Admin |
| `pending` | `rejected` | Admin |
| `pending` | `cancelled` | Empleado dueño |
| `preapproved` | `approved` | Admin |
| `preapproved` | `rejected` | Admin |
| `preapproved` | `cancelled` | Empleado dueño |
| `approved` / `rejected` / `cancelled` | — | (estados finales) |

## Validaciones del cliente

| Pantalla | Validaciones |
|---|---|
| Login | Email no vacío, contraseña no vacía |
| Nueva solicitud Step 2 | Fecha, horas, motivo obligatorios; horas XOR días |
| Nueva solicitud Step 3 | Si `hasReplacement`, fecha+horas obligatorias |
| Nueva solicitud adjunto | Tamaño máx 10 MB |
| Crear empleado | Nombre, email, documento, contraseña ≥6 chars |
| Cambiar contraseña | Nueva ≥6 chars + coincide con confirmación |
| Gestionar solicitud | Decisión + observación obligatoria |
| Aprobación rápida/masiva | Observación obligatoria (prompt) |
