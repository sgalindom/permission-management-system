"use client";

import { useNotifications } from "@/lib/notifications-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface Props {
  onSeeAll?: () => void;
}

export function NotificationsBell({ onSeeAll }: Props) {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const recent = notifications.slice(0, 8);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
          <Bell className="w-5 h-5 text-gray-600" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <p className="text-sm font-semibold">Notificaciones</p>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsRead()}
              className="text-xs text-blue-600 hover:underline flex items-center gap-1"
            >
              <CheckCheck className="w-3 h-3" />
              Marcar todas
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {recent.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">Sin notificaciones</p>
          ) : (
            recent.map((n) => (
              <button
                key={n.id}
                onClick={() => !n.read && markAsRead(n.id)}
                className={`w-full text-left px-3 py-3 border-b hover:bg-gray-50 ${
                  !n.read ? "bg-blue-50/60" : ""
                }`}
              >
                <div className="flex items-start gap-2">
                  {!n.read && <span className="mt-1.5 w-2 h-2 rounded-full bg-blue-600 flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{n.title}</p>
                    <p className="text-xs text-gray-600 line-clamp-2">{n.message}</p>
                    {n.createdAt && (
                      <p className="text-[10px] text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: es })}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
        {onSeeAll && notifications.length > 0 && (
          <button
            onClick={onSeeAll}
            className="w-full text-center py-2 text-xs text-blue-600 hover:bg-gray-50 border-t"
          >
            Ver todas
          </button>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
