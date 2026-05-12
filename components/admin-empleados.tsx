"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useCatalogs } from "@/lib/catalogs-context";
import { adminCreateUser, setUserActive, subscribeToUsers, updateUser } from "@/lib/users-service";
import { AppUser, UserRole } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Loader2,
  Plus,
  Search,
  UserCheck,
  UserX,
  Pencil,
} from "lucide-react";

function genPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 12; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export function AdminEmpleados() {
  const { user: currentUser } = useAuth();
  const { areas, supervisors } = useCatalogs();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState<AppUser | null>(null);
  const [credentialsModal, setCredentialsModal] = useState<{ email: string; password: string } | null>(null);

  useEffect(() => {
    const unsub = subscribeToUsers((u) => {
      setUsers(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.documentNumber ?? "").toLowerCase().includes(q) ||
      (u.area ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex-1 flex flex-col bg-gray-50 min-h-screen">
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-10">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Gestion de Empleados</h1>
          <p className="text-sm text-gray-500">{users.length} usuarios registrados</p>
        </div>
        <Button onClick={() => setOpenCreate(true)} className="bg-blue-600 hover:bg-blue-700 gap-2">
          <Plus className="w-4 h-4" />
          Nuevo empleado
        </Button>
      </header>

      <main className="flex-1 p-6">
        <Card>
          <CardContent className="p-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre, correo, documento o area..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {loading ? (
              <div className="py-12 text-center text-gray-500">Cargando...</div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-gray-500">No hay empleados que coincidan.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs uppercase text-gray-500">
                      <th className="py-3 px-3">Empleado</th>
                      <th className="py-3 px-3">Documento</th>
                      <th className="py-3 px-3">Area</th>
                      <th className="py-3 px-3">Cargo</th>
                      <th className="py-3 px-3">Rol</th>
                      <th className="py-3 px-3">Estado</th>
                      <th className="py-3 px-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((u) => (
                      <tr key={u.uid} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold">
                              {u.avatar || u.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{u.name}</p>
                              <p className="text-xs text-gray-500">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-gray-700">{u.documentNumber || "-"}</td>
                        <td className="py-3 px-3 text-gray-700">{u.area || "-"}</td>
                        <td className="py-3 px-3 text-gray-700">{u.position || "-"}</td>
                        <td className="py-3 px-3">
                          <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                            {u.role === "admin" ? "Admin" : "Empleado"}
                          </Badge>
                        </td>
                        <td className="py-3 px-3">
                          {u.active ? (
                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                              Activo
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-200 text-gray-700 hover:bg-gray-200">Inactivo</Badge>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setOpenEdit(u)}
                              title="Editar"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            {u.uid !== currentUser?.uid && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setUserActive(u.uid, !u.active)}
                                title={u.active ? "Desactivar" : "Activar"}
                              >
                                {u.active ? (
                                  <UserX className="w-4 h-4 text-red-600" />
                                ) : (
                                  <UserCheck className="w-4 h-4 text-emerald-600" />
                                )}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {openCreate && (
        <CreateUserDialog
          open={openCreate}
          onClose={() => setOpenCreate(false)}
          areas={areas.map((a) => a.name)}
          supervisors={supervisors.map((s) => s.name)}
          onCreated={(email, password) => {
            setOpenCreate(false);
            setCredentialsModal({ email, password });
          }}
        />
      )}

      {openEdit && (
        <EditUserDialog
          user={openEdit}
          areas={areas.map((a) => a.name)}
          supervisors={supervisors.map((s) => s.name)}
          onClose={() => setOpenEdit(null)}
        />
      )}

      {credentialsModal && (
        <CredentialsDialog
          email={credentialsModal.email}
          password={credentialsModal.password}
          onClose={() => setCredentialsModal(null)}
        />
      )}
    </div>
  );
}

function CreateUserDialog({
  open,
  onClose,
  areas,
  supervisors,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  areas: string[];
  supervisors: string[];
  onCreated: (email: string, password: string) => void;
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    documentNumber: "",
    role: "employee" as UserRole,
    area: "",
    position: "",
    contractType: "Contrato Directo",
    supervisor: "",
    phone: "",
    costCenter: "",
    headquarters: "",
    password: genPassword(),
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.name || !form.email || !form.password || !form.documentNumber) {
      setError("Completa nombre, correo, documento y contrasena.");
      return;
    }
    if (form.password.length < 6) {
      setError("La contrasena debe tener al menos 6 caracteres.");
      return;
    }
    setSubmitting(true);
    try {
      await adminCreateUser(form);
      onCreated(form.email, form.password);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? "";
      setError(
        code === "auth/email-already-in-use"
          ? "Ese correo ya esta en uso."
          : code === "auth/invalid-email"
          ? "El correo no tiene un formato valido."
          : code === "auth/weak-password"
          ? "La contrasena es demasiado debil."
          : (err as Error)?.message ?? "No fue posible crear el usuario."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear nuevo empleado</DialogTitle>
          <DialogDescription>
            La contrasena se generara automaticamente y se mostrara una sola vez al terminar.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Nombre completo *</Label>
              <Input value={form.name} onChange={(e) => update("name", e.target.value)} />
            </div>
            <div>
              <Label>Correo *</Label>
              <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
            </div>
            <div>
              <Label>Numero de documento *</Label>
              <Input value={form.documentNumber} onChange={(e) => update("documentNumber", e.target.value)} />
            </div>
            <div>
              <Label>Telefono</Label>
              <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} />
            </div>
            <div>
              <Label>Rol *</Label>
              <Select value={form.role} onValueChange={(v) => update("role", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Empleado</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Area *</Label>
              <Select value={form.area} onValueChange={(v) => update("area", v)}>
                <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                <SelectContent>
                  {areas.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Cargo *</Label>
              <Input value={form.position} onChange={(e) => update("position", e.target.value)} />
            </div>
            <div>
              <Label>Tipo de contrato</Label>
              <Select value={form.contractType} onValueChange={(v) => update("contractType", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Contrato Directo">Contrato Directo</SelectItem>
                  <SelectItem value="Contrato Temporal">Contrato Temporal</SelectItem>
                  <SelectItem value="Prestacion de Servicios">Prestacion de Servicios</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Jefe inmediato</Label>
              <Select value={form.supervisor} onValueChange={(v) => update("supervisor", v)}>
                <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                <SelectContent>
                  {supervisors.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Centro de costo</Label>
              <Input value={form.costCenter} onChange={(e) => update("costCenter", e.target.value)} />
            </div>
            <div>
              <Label>Sede</Label>
              <Input value={form.headquarters} onChange={(e) => update("headquarters", e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <Label>Contrasena temporal *</Label>
              <div className="flex gap-2">
                <Input value={form.password} onChange={(e) => update("password", e.target.value)} />
                <Button type="button" variant="outline" onClick={() => update("password", genPassword())}>
                  Generar
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                El usuario podra cambiarla con "Olvidaste tu contrasena" desde el login.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Crear empleado
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditUserDialog({
  user,
  areas,
  supervisors,
  onClose,
}: {
  user: AppUser;
  areas: string[];
  supervisors: string[];
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: user.name,
    documentNumber: user.documentNumber ?? "",
    role: user.role,
    area: user.area ?? "",
    position: user.position ?? "",
    contractType: user.contractType ?? "Contrato Directo",
    supervisor: user.supervisor ?? "",
    phone: user.phone ?? "",
    costCenter: user.costCenter ?? "",
    headquarters: user.headquarters ?? "",
  });
  const [saving, setSaving] = useState(false);

  const update = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      await updateUser(user.uid, form);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar empleado</DialogTitle>
          <DialogDescription>{user.email}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label>Nombre</Label>
            <Input value={form.name} onChange={(e) => update("name", e.target.value)} />
          </div>
          <div>
            <Label>Documento</Label>
            <Input value={form.documentNumber} onChange={(e) => update("documentNumber", e.target.value)} />
          </div>
          <div>
            <Label>Rol</Label>
            <Select value={form.role} onValueChange={(v) => update("role", v as UserRole)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="employee">Empleado</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Telefono</Label>
            <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} />
          </div>
          <div>
            <Label>Area</Label>
            <Select value={form.area} onValueChange={(v) => update("area", v)}>
              <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
              <SelectContent>
                {areas.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Cargo</Label>
            <Input value={form.position} onChange={(e) => update("position", e.target.value)} />
          </div>
          <div>
            <Label>Tipo de contrato</Label>
            <Select value={form.contractType} onValueChange={(v) => update("contractType", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Contrato Directo">Contrato Directo</SelectItem>
                <SelectItem value="Contrato Temporal">Contrato Temporal</SelectItem>
                <SelectItem value="Prestacion de Servicios">Prestacion de Servicios</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Jefe inmediato</Label>
            <Select value={form.supervisor} onValueChange={(v) => update("supervisor", v)}>
              <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
              <SelectContent>
                {supervisors.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Centro de costo</Label>
            <Input value={form.costCenter} onChange={(e) => update("costCenter", e.target.value)} />
          </div>
          <div>
            <Label>Sede</Label>
            <Input value={form.headquarters} onChange={(e) => update("headquarters", e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Guardar cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CredentialsDialog({
  email,
  password,
  onClose,
}: {
  email: string;
  password: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const text = `Correo: ${email}\nContrasena: ${password}`;
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            Usuario creado
          </DialogTitle>
          <DialogDescription>
            Entrega estas credenciales al empleado. No volveran a mostrarse.
          </DialogDescription>
        </DialogHeader>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 font-mono text-sm">
          <p><span className="text-gray-500">Correo:</span> {email}</p>
          <p><span className="text-gray-500">Contrasena:</span> {password}</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={copy} className="gap-2">
            <Copy className="w-4 h-4" />
            {copied ? "Copiado!" : "Copiar"}
          </Button>
          <Button onClick={onClose}>Listo</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
