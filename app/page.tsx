"use client";

import { useState } from "react";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { RequestsProvider, useRequests } from "@/lib/requests-context";
import { CatalogsProvider } from "@/lib/catalogs-context";
import { NotificationsProvider } from "@/lib/notifications-context";
import { LoginPage } from "@/components/login-page";
import { Sidebar, AdminView, EmployeeView } from "@/components/sidebar";
import { AdminDashboard } from "@/components/admin-dashboard";
import { AdminSolicitudes } from "@/components/admin-solicitudes";
import { AdminEmpleados } from "@/components/admin-empleados";
import { AdminConfiguracion } from "@/components/admin-configuracion";
import { AdminReportes } from "@/components/admin-reportes";
import { GestionarSolicitudModal } from "@/components/gestionar-solicitud-modal";
import { EmployeeSolicitudes } from "@/components/employee-solicitudes";
import { EmpleadoNotificaciones } from "@/components/empleado-notificaciones";
import { EmpleadoPerfil } from "@/components/empleado-perfil";
import { NuevaSolicitud } from "@/components/nueva-solicitud";
import { NotificationsBell } from "@/components/notifications-bell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Plus } from "lucide-react";

function EmployeeHome({ onGoNueva }: { onGoNueva: () => void }) {
  const { user } = useAuth();
  const { getRequestsByEmployee } = useRequests();
  const myRequests = getRequestsByEmployee(user?.uid || "");

  const stats = {
    total: myRequests.length,
    pending: myRequests.filter((r) => r.status === "pending").length,
    approved: myRequests.filter((r) => r.status === "approved").length,
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50 min-h-screen">
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-10">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Inicio</h1>
          <p className="text-sm text-gray-500">Bienvenido, {user?.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <NotificationsBell />
        </div>
      </header>

      <main className="flex-1 p-6">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Hola, {user?.name?.split(" ")[0]}!</h2>
          <p className="text-gray-500">Este es tu panel de gestion de permisos laborales.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-t-4 border-t-blue-500">
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Mis solicitudes</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
              <p className="text-xs text-gray-500 mt-1">Total registradas</p>
            </CardContent>
          </Card>
          <Card className="border-t-4 border-t-amber-500">
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">En proceso</p>
              <p className="text-3xl font-bold text-amber-600 mt-1">{stats.pending}</p>
              <p className="text-xs text-gray-500 mt-1">Pendientes de revision</p>
            </CardContent>
          </Card>
          <Card className="border-t-4 border-t-emerald-500">
            <CardContent className="pt-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Aprobadas</p>
              <p className="text-3xl font-bold text-emerald-600 mt-1">{stats.approved}</p>
              <p className="text-xs text-gray-500 mt-1">Este ano</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Necesitas un permiso?</h3>
            <p className="text-gray-500 mb-4">Crea una nueva solicitud de permiso laboral de manera rapida y sencilla.</p>
            <Button onClick={onGoNueva} className="bg-blue-600 hover:bg-blue-700 gap-2">
              <Plus className="w-4 h-4" />
              Nueva Solicitud
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function AppContent() {
  const { user, isAuthenticated, logout, loading } = useAuth();
  const { stats } = useRequests();
  const [adminView, setAdminView] = useState<AdminView>("dashboard");
  const [employeeView, setEmployeeView] = useState<EmployeeView>("inicio");
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Cargando...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={() => {}} />;
  }

  const isAdmin = user?.role === "admin";

  const handleViewChange = (view: AdminView | EmployeeView) => {
    if (isAdmin) {
      setAdminView(view as AdminView);
    } else {
      setEmployeeView(view as EmployeeView);
    }
  };

  const handleLogout = async () => {
    await logout();
    setAdminView("dashboard");
    setEmployeeView("inicio");
  };

  const handleManageRequest = (requestId: string) => {
    setSelectedRequestId(requestId);
  };

  const renderAdminView = () => {
    switch (adminView) {
      case "dashboard":
        return (
          <AdminDashboard
            onViewChange={setAdminView}
            onManageRequest={handleManageRequest}
          />
        );
      case "solicitudes":
        return <AdminSolicitudes onManageRequest={handleManageRequest} />;
      case "gestionar":
        return <AdminSolicitudes onManageRequest={handleManageRequest} />;
      case "empleados":
        return <AdminEmpleados />;
      case "reportes":
        return <AdminReportes />;
      case "configuracion":
        return <AdminConfiguracion />;
      case "perfil":
        return <EmpleadoPerfil />;
      default:
        return <AdminDashboard onViewChange={setAdminView} onManageRequest={handleManageRequest} />;
    }
  };

  const renderEmployeeView = () => {
    switch (employeeView) {
      case "inicio":
        return <EmployeeHome onGoNueva={() => setEmployeeView("nueva-solicitud")} />;
      case "mis-solicitudes":
        return (
          <EmployeeSolicitudes
            onViewChange={setEmployeeView}
            onViewDetail={handleManageRequest}
          />
        );
      case "nueva-solicitud":
        return (
          <NuevaSolicitud
            onViewChange={setEmployeeView}
            onSuccess={() => setEmployeeView("mis-solicitudes")}
          />
        );
      case "perfil":
        return <EmpleadoPerfil />;
      case "notificaciones":
        return <EmpleadoNotificaciones />;
      default:
        return <EmployeeHome onGoNueva={() => setEmployeeView("nueva-solicitud")} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        currentView={isAdmin ? adminView : employeeView}
        onViewChange={handleViewChange}
        onLogout={handleLogout}
        pendingCount={stats.pending}
      />
      {isAdmin ? renderAdminView() : renderEmployeeView()}

      {selectedRequestId && (
        <GestionarSolicitudModal
          requestId={selectedRequestId}
          onClose={() => setSelectedRequestId(null)}
        />
      )}
    </div>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <CatalogsProvider>
        <RequestsProvider>
          <NotificationsProvider>
            <AppContent />
          </NotificationsProvider>
        </RequestsProvider>
      </CatalogsProvider>
    </AuthProvider>
  );
}
