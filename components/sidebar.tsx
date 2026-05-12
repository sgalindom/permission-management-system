"use client";

import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  CheckSquare,
  Users,
  BarChart3,
  Settings,
  User,
  Bell,
  PlusCircle,
  ClipboardList,
  LogOut,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type AdminView = "dashboard" | "solicitudes" | "gestionar" | "empleados" | "reportes" | "configuracion" | "perfil";
export type EmployeeView = "inicio" | "mis-solicitudes" | "nueva-solicitud" | "perfil" | "notificaciones";

interface SidebarProps {
  currentView: AdminView | EmployeeView;
  onViewChange: (view: AdminView | EmployeeView) => void;
  onLogout: () => void;
  pendingCount?: number;
}

export function Sidebar({ currentView, onViewChange, onLogout, pendingCount = 12 }: SidebarProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const adminNavItems = [
    { id: "dashboard" as AdminView, label: "Dashboard", icon: LayoutDashboard },
    { id: "solicitudes" as AdminView, label: "Ver Solicitudes", icon: FileText, badge: pendingCount },
    { id: "gestionar" as AdminView, label: "Gestionar Solicitudes", icon: CheckSquare },
  ];

  const adminConfigItems = [
    { id: "empleados" as AdminView, label: "Empleados", icon: Users },
    { id: "reportes" as AdminView, label: "Reportes", icon: BarChart3 },
    { id: "configuracion" as AdminView, label: "Configuracion", icon: Settings },
  ];

  const employeeNavItems = [
    { id: "inicio" as EmployeeView, label: "Inicio", icon: LayoutDashboard },
    { id: "mis-solicitudes" as EmployeeView, label: "Mis Solicitudes", icon: FileText, badge: 2 },
    { id: "nueva-solicitud" as EmployeeView, label: "Nueva Solicitud", icon: PlusCircle },
  ];

  const employeeAccountItems = [
    { id: "perfil" as EmployeeView, label: "Mi Perfil", icon: User },
    { id: "notificaciones" as EmployeeView, label: "Notificaciones", icon: Bell },
  ];

  const navItems = isAdmin ? adminNavItems : employeeNavItems;
  const secondaryItems = isAdmin ? adminConfigItems : employeeAccountItems;

  return (
    <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-5 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
            <ClipboardList className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900">GestionaPermisos</h1>
            <p className="text-xs text-gray-500">Permisos laborales</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 overflow-y-auto">
        <div className="space-y-1">
          <p className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            {isAdmin ? "Principal" : "Mi espacio"}
          </p>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative",
                currentView === item.id
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              {currentView === item.id && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-r-full" />
              )}
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
              {item.badge && (
                <span className="ml-auto bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-1">
          <p className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            {isAdmin ? "Configuracion" : "Cuenta"}
          </p>
          {secondaryItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative",
                currentView === item.id
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              {currentView === item.id && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-r-full" />
              )}
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* User Card */}
      <div className="p-3 border-t border-gray-200">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-semibold">
                {user?.avatar}
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{isAdmin ? "Administrador" : "Empleado"}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => onViewChange("perfil")}>
              <User className="mr-2 h-4 w-4" />
              Mi Perfil
            </DropdownMenuItem>
            {isAdmin && (
              <DropdownMenuItem onClick={() => onViewChange("configuracion")}>
                <Settings className="mr-2 h-4 w-4" />
                Configuracion
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout} className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
