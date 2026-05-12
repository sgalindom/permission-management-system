"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { auth } from "@/lib/firebase";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Loader2, KeyRound } from "lucide-react";

export function EmpleadoPerfil() {
  const { user, resetPassword } = useAuth();
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (!currentPwd || !newPwd || !confirmPwd) {
      setMsg({ ok: false, text: "Completa todos los campos." });
      return;
    }
    if (newPwd.length < 6) {
      setMsg({ ok: false, text: "La nueva contrasena debe tener al menos 6 caracteres." });
      return;
    }
    if (newPwd !== confirmPwd) {
      setMsg({ ok: false, text: "Las contrasenas no coinciden." });
      return;
    }
    const fbUser = auth.currentUser;
    if (!fbUser || !fbUser.email) {
      setMsg({ ok: false, text: "Sesion no valida. Vuelve a iniciar sesion." });
      return;
    }
    setSaving(true);
    try {
      const cred = EmailAuthProvider.credential(fbUser.email, currentPwd);
      await reauthenticateWithCredential(fbUser, cred);
      await updatePassword(fbUser, newPwd);
      setMsg({ ok: true, text: "Contrasena actualizada correctamente." });
      setCurrentPwd("");
      setNewPwd("");
      setConfirmPwd("");
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? "";
      setMsg({
        ok: false,
        text:
          code === "auth/wrong-password" || code === "auth/invalid-credential"
            ? "La contrasena actual es incorrecta."
            : code === "auth/weak-password"
            ? "La nueva contrasena es muy debil."
            : "No fue posible cambiar la contrasena.",
      });
    } finally {
      setSaving(false);
    }
  };

  const sendReset = async () => {
    if (!user.email) return;
    setMsg(null);
    const res = await resetPassword(user.email);
    setMsg(
      res.ok
        ? { ok: true, text: "Te enviamos un correo con el enlace para restablecer tu contrasena." }
        : { ok: false, text: res.error ?? "No fue posible enviar el correo." }
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50 min-h-screen">
      <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6 sticky top-0 z-10">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Mi Perfil</h1>
          <p className="text-sm text-gray-500">Tus datos personales</p>
        </div>
      </header>

      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Datos personales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold">
                {user.avatar}
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900">{user.name}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
                <Badge variant={user.role === "admin" ? "default" : "secondary"} className="mt-1">
                  {user.role === "admin" ? "Administrador" : "Empleado"}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <Field label="Numero de documento" value={user.documentNumber} />
              <Field label="Telefono" value={user.phone} />
              <Field label="Area" value={user.area} />
              <Field label="Cargo" value={user.position} />
              <Field label="Tipo de contrato" value={user.contractType} />
              <Field label="Jefe inmediato" value={user.supervisor} />
              <Field label="Centro de costo" value={user.costCenter} />
              <Field label="Sede" value={user.headquarters} />
            </div>
            <p className="text-xs text-gray-500 mt-6">
              Para modificar tus datos personales contacta al administrador.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="w-4 h-4" />
              Cambiar contrasena
            </CardTitle>
          </CardHeader>
          <CardContent>
            {msg && (
              <Alert
                variant={msg.ok ? "default" : "destructive"}
                className={msg.ok ? "bg-emerald-50 border-emerald-200 text-emerald-800 mb-4" : "mb-4"}
              >
                {msg.ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                <AlertDescription>{msg.text}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={changePassword} className="space-y-3">
              <div>
                <Label>Contrasena actual</Label>
                <Input
                  type="password"
                  value={currentPwd}
                  onChange={(e) => setCurrentPwd(e.target.value)}
                />
              </div>
              <div>
                <Label>Nueva contrasena</Label>
                <Input
                  type="password"
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                />
              </div>
              <div>
                <Label>Confirmar nueva contrasena</Label>
                <Input
                  type="password"
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={saving} className="w-full">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Actualizar contrasena
              </Button>
            </form>
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-gray-500 mb-2">No recuerdas tu contrasena actual?</p>
              <Button variant="outline" size="sm" className="w-full" onClick={sendReset}>
                Enviarme un correo de restablecimiento
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-gray-900 font-medium">{value || "-"}</p>
    </div>
  );
}
