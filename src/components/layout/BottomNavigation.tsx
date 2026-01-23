import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUnreadNotificationCount } from "@/hooks/useNotifications";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpen,
  FileQuestion,
  Bell,
  User,
  Users,
  Settings,
  CheckCircle,
} from "lucide-react";

export function BottomNavigation() {
  const { user, role } = useAuth();
  const location = useLocation();
  const { data: unreadCount } = useUnreadNotificationCount(user?.id);

  // Fetch pending approval count for admin
  const { data: pendingApprovalCount } = useQuery({
    queryKey: ["pending-approval-count-mobile"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("incoming_contents")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");
      if (error) throw error;
      return count || 0;
    },
    enabled: role === "admin",
    refetchInterval: 30000,
  });

  const getDashboardPath = () => {
    if (role === "admin") return "/dashboard/admin";
    if (role === "tutor") return "/dashboard/tutor";
    return "/dashboard/user";
  };

  const navItems = [
    {
      href: getDashboardPath(),
      label: "Home",
      icon: LayoutDashboard,
      roles: ["user", "tutor", "admin"],
    },
    {
      href: "/dashboard/modules",
      label: "Modul",
      icon: BookOpen,
      roles: ["user", "tutor", "admin"],
    },
    {
      href: "/dashboard/request-material",
      label: "Request",
      icon: FileQuestion,
      roles: ["user"],
    },
    {
      href: "/dashboard/requests",
      label: "Request",
      icon: FileQuestion,
      roles: ["tutor", "admin"],
    },
    {
      href: "/dashboard/users",
      label: "Users",
      icon: Users,
      roles: ["admin"],
    },
    {
      href: "/dashboard/admin/approval",
      label: "Inbox",
      icon: CheckCircle,
      badge: pendingApprovalCount,
      roles: ["admin"],
    },
    {
      href: "/dashboard/notifications",
      label: "Notifikasi",
      icon: Bell,
      badge: unreadCount,
      roles: ["user", "tutor", "admin"],
      hideOnPath: "/dashboard/notifications", // Hide when on this page
    },
    {
      href: "/dashboard/profile",
      label: "Profil",
      icon: User,
      roles: ["user", "tutor", "admin"],
    },
  ];


  const filteredItems = navItems.filter(
    (item) => role && item.roles.includes(role) &&
      (!item.hideOnPath || location.pathname !== item.hideOnPath)
  );

  const isActive = (href: string) => {
    if (href.includes("/dashboard/user") || href.includes("/dashboard/tutor") || href.includes("/dashboard/admin")) {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur-sm md:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {filteredItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors relative",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div className="relative">
                <item.icon className={cn("h-5 w-5", active && "text-primary")} />
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-medium flex items-center justify-center badge-pulse">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </div>
              <span className={cn("text-[10px] font-medium", active && "text-primary")}>
                {item.label}
              </span>
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
