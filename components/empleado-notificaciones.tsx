"use client";

import { useNotifications } from "@/lib/notifications-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export function EmpleadoNotificaciones() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  return (
    <div className="flex-1 flex flex-col bg-gray-50 min-h-screen">
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-10">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Notificaciones</h1>
          <p className="text-sm text-gray-500">
            {unreadCount > 0 ? `${unreadCount} sin leer` : "Todas las notificaciones leidas"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAllAsRead()} className="gap-2">
            <CheckCheck className="w-4 h-4" />
            Marcar todas como leidas
          </Button>
        )}
      </header>

      <main className="flex-1 p-6">
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No tienes notificaciones aun.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2 max-w-3xl">
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => !n.read && markAsRead(n.id)}
                className={`w-full text-left bg-white border rounded-lg p-4 transition-colors hover:bg-gray-50 ${
                  !n.read ? "border-blue-200 bg-blue-50/40" : "border-gray-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  {!n.read && <span className="mt-2 w-2 h-2 rounded-full bg-blue-600 flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900">{n.title}</p>
                      {n.createdAt && (
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: es })}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 mt-1">{n.message}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
