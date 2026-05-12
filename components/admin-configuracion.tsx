"use client";

import { useState } from "react";
import { useCatalogs } from "@/lib/catalogs-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";

export function AdminConfiguracion() {
  const {
    areas,
    supervisors,
    addArea,
    updateArea,
    deleteArea,
    addSupervisor,
    updateSupervisor,
    deleteSupervisor,
  } = useCatalogs();

  const [areaForm, setAreaForm] = useState({ id: "", name: "" });
  const [areaOpen, setAreaOpen] = useState(false);
  const [supForm, setSupForm] = useState({ id: "", name: "", area: "", email: "" });
  const [supOpen, setSupOpen] = useState(false);

  const openNewArea = () => {
    setAreaForm({ id: "", name: "" });
    setAreaOpen(true);
  };
  const openEditArea = (id: string, name: string) => {
    setAreaForm({ id, name });
    setAreaOpen(true);
  };
  const submitArea = async () => {
    if (!areaForm.name.trim()) return;
    if (areaForm.id) await updateArea(areaForm.id, areaForm.name.trim());
    else await addArea(areaForm.name.trim());
    setAreaOpen(false);
  };

  const openNewSup = () => {
    setSupForm({ id: "", name: "", area: "", email: "" });
    setSupOpen(true);
  };
  const openEditSup = (s: { id: string; name: string; area?: string; email?: string }) => {
    setSupForm({ id: s.id, name: s.name, area: s.area ?? "", email: s.email ?? "" });
    setSupOpen(true);
  };
  const submitSup = async () => {
    if (!supForm.name.trim()) return;
    const payload = {
      name: supForm.name.trim(),
      area: supForm.area.trim() || undefined,
      email: supForm.email.trim() || undefined,
    };
    if (supForm.id) await updateSupervisor(supForm.id, payload);
    else await addSupervisor(payload);
    setSupOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50 min-h-screen">
      <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6 sticky top-0 z-10">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Configuracion</h1>
          <p className="text-sm text-gray-500">Catalogos del sistema</p>
        </div>
      </header>

      <main className="flex-1 p-6">
        <Tabs defaultValue="areas">
          <TabsList>
            <TabsTrigger value="areas">Areas ({areas.length})</TabsTrigger>
            <TabsTrigger value="supervisors">Supervisores ({supervisors.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="areas" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Areas</CardTitle>
                <Button size="sm" onClick={openNewArea} className="gap-1">
                  <Plus className="w-4 h-4" />Nueva
                </Button>
              </CardHeader>
              <CardContent>
                {areas.length === 0 ? (
                  <p className="text-sm text-gray-500 py-8 text-center">Sin areas aun.</p>
                ) : (
                  <ul className="divide-y">
                    {areas.map((a) => (
                      <li key={a.id} className="flex items-center justify-between py-3">
                        <span>{a.name}</span>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => openEditArea(a.id, a.name)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (confirm(`Eliminar el area "${a.name}"?`)) deleteArea(a.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="supervisors" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Supervisores</CardTitle>
                <Button size="sm" onClick={openNewSup} className="gap-1">
                  <Plus className="w-4 h-4" />Nuevo
                </Button>
              </CardHeader>
              <CardContent>
                {supervisors.length === 0 ? (
                  <p className="text-sm text-gray-500 py-8 text-center">Sin supervisores aun.</p>
                ) : (
                  <ul className="divide-y">
                    {supervisors.map((s) => (
                      <li key={s.id} className="flex items-center justify-between py-3">
                        <div>
                          <p className="font-medium">{s.name}</p>
                          <p className="text-xs text-gray-500">
                            {[s.area, s.email].filter(Boolean).join(" - ") || "Sin datos adicionales"}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => openEditSup(s)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (confirm(`Eliminar al supervisor "${s.name}"?`)) deleteSupervisor(s.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={areaOpen} onOpenChange={(v) => !v && setAreaOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{areaForm.id ? "Editar area" : "Nueva area"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Nombre</Label>
            <Input
              value={areaForm.name}
              onChange={(e) => setAreaForm({ ...areaForm, name: e.target.value })}
              placeholder="Ej. Recursos Humanos"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAreaOpen(false)}>Cancelar</Button>
            <Button onClick={submitArea}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={supOpen} onOpenChange={(v) => !v && setSupOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{supForm.id ? "Editar supervisor" : "Nuevo supervisor"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nombre completo *</Label>
              <Input value={supForm.name} onChange={(e) => setSupForm({ ...supForm, name: e.target.value })} />
            </div>
            <div>
              <Label>Area</Label>
              <Input value={supForm.area} onChange={(e) => setSupForm({ ...supForm, area: e.target.value })} />
            </div>
            <div>
              <Label>Correo</Label>
              <Input
                type="email"
                value={supForm.email}
                onChange={(e) => setSupForm({ ...supForm, email: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSupOpen(false)}>Cancelar</Button>
            <Button onClick={submitSup}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
