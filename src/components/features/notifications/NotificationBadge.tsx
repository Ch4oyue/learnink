import { Bell } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications, useUnreadNotificationCount, useMarkNotificationAsRead, useMarkAllNotificationsAsRead, Notification } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { BookOpen, CheckCircle, MessageSquare, Info, Sparkles, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const typeIcons: Record<string, React.ElementType> = {
  module: BookOpen,
  module_created: Rocket,
  success: CheckCircle,
  request: MessageSquare,
  request_completed: CheckCircle,
  info: Info,
};

const typeColors: Record<string, string> = {
  module: "bg-primary/10 text-primary",
  module_created: "bg-emerald-500/10 text-emerald-500",
  success: "bg-success/10 text-success",
  request: "bg-warning/10 text-warning",
  request_completed: "bg-emerald-500/10 text-emerald-500",
  info: "bg-muted text-muted-foreground",
};

export function NotificationBadge() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: notifications, isLoading } = useNotifications(user?.id);
  const { data: unreadCount } = useUnreadNotificationCount(user?.id);
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();

  // ============================================
  // REALTIME SUBSCRIPTION
  // ============================================
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel("notification-badge-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // Show toast
          const newNotification = payload.new as Notification;
          toast(newNotification.title || "Notifikasi Baru", {
            description: newNotification.message,
            action: {
              label: "Lihat",
              onClick: () => navigate("/dashboard/notifications"),
            },
          });

          // Invalidate queries to refetch notifications
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
          queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient, navigate]);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead.mutate(notification.id);
    }

    // Navigate based on notification type
    if (notification.related_module_id) {
      navigate(`/learn/${notification.related_module_id}`);
    } else if (notification.related_request_id) {
      navigate(`/dashboard?tab=requests`);
    }
  };

  const handleMarkAllRead = () => {
    if (user?.id) {
      markAllAsRead.mutate(user.id);
    }
  };

  if (!user) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-full hover:bg-secondary/80 transition-colors"
        >
          <Bell className="h-5 w-5 text-muted-foreground" />
          {(unreadCount || 0) > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-medium flex items-center justify-center badge-pulse">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0 rounded-2xl shadow-elevated border-border/50"
        align="end"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Notifikasi
          </h3>
          {(unreadCount || 0) > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              className="text-xs text-primary hover:text-primary/80 h-auto py-1 px-2"
            >
              Tandai semua dibaca
            </Button>
          )}
        </div>

        {/* Content */}
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
            </div>
          ) : !notifications || notifications.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                <Bell className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Belum ada notifikasi
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {notifications.slice(0, 10).map((notification) => {
                const Icon = typeIcons[notification.type] || Info;
                const iconColor = typeColors[notification.type] || typeColors.info;

                return (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      "w-full p-4 text-left hover:bg-secondary/50 transition-colors",
                      !notification.is_read && "bg-primary/5"
                    )}
                  >
                    <div className="flex gap-3">
                      <div className={cn("w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0", iconColor)}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn(
                            "text-sm line-clamp-1",
                            !notification.is_read ? "font-semibold text-foreground" : "text-foreground"
                          )}>
                            {notification.title}
                          </p>
                          {!notification.is_read && (
                            <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {notification.message}
                        </p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                            locale: idLocale,
                          })}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications && notifications.length > 10 && (
          <div className="p-2 border-t border-border/50">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard/notifications")}
              className="w-full text-xs text-primary"
            >
              Lihat semua notifikasi
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
