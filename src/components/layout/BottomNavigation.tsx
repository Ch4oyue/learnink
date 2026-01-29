import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUnreadNotificationCount } from "@/hooks/useNotifications";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
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
  const queryClient = useQueryClient();
  const { data: unreadCount } = useUnreadNotificationCount(user?.id);

  const [isTransparent, setIsTransparent] = useState(() => localStorage.getItem("transparentMobileNav") === "true");

  useEffect(() => {
    const handleStorage = () => {
      setIsTransparent(localStorage.getItem("transparentMobileNav") === "true");
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // Realtime subscription for badges
  useEffect(() => {
    if (!user) return;

    // Admin subscriptions
    if (role === "admin" || role === "superadmin") {
      const adminChannel = supabase
        .channel("mobile-nav-admin-badges")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "incoming_contents" },
          () => queryClient.invalidateQueries({ queryKey: ["pending-approval-count-mobile"] })
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "material_requests" },
          () => queryClient.invalidateQueries({ queryKey: ["pending-approval-count-mobile"] })
        )
        .subscribe();

      return () => { supabase.removeChannel(adminChannel); };
    }

    // User subscriptions (Notifications)
    const userChannel = supabase
      .channel(`mobile-nav-user-badges-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] })
      )
      .subscribe();

    return () => {
      supabase.removeChannel(userChannel);
    };
  }, [user, role, queryClient]);

  // Fetch pending approval count for admin
  const { data: pendingApprovalCount } = useQuery({
    queryKey: ["pending-approval-count-mobile"],
    queryFn: async () => {
      if (role !== "admin" && role !== "superadmin") return 0;

      const [contentsResult, requestsResult] = await Promise.all([
        supabase.from("incoming_contents").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("material_requests").select("*", { count: "exact", head: true }).eq("status", "pending")
      ]);

      if (contentsResult.error) throw contentsResult.error;
      if (requestsResult.error) throw requestsResult.error;

      return (contentsResult.count || 0) + (requestsResult.count || 0);
    },
    enabled: role === "admin" || role === "superadmin",
  });

  const getDashboardPath = () => {
    if (role === "admin" || role === "superadmin") return "/dashboard/admin";
    if (role === "tutor") return "/dashboard/tutor";
    return "/dashboard/user";
  };

  const navItems = [
    {
      href: getDashboardPath(),
      label: "Home",
      icon: LayoutDashboard,
      roles: ["user", "tutor", "admin", "superadmin"],
    },
    {
      href: "/dashboard/modules",
      label: "Modul",
      icon: BookOpen,
      roles: ["user", "tutor", "admin", "superadmin"],
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
      roles: ["tutor", "admin", "superadmin"],
    },
    {
      href: "/dashboard/users",
      label: "Users",
      icon: Users,
      roles: ["admin", "superadmin"],
    },
    {
      href: "/dashboard/admin/approval",
      label: "Inbox",
      icon: CheckCircle,
      badge: pendingApprovalCount,
      roles: ["admin", "superadmin"],
    },
    {
      href: "/dashboard/notifications",
      label: "Notifikasi",
      icon: Bell,
      badge: unreadCount,
      roles: ["user", "tutor", "admin", "superadmin"],
      hideOnPath: "/dashboard/notifications", // Hide when on this page
    },
    {
      href: "/dashboard/profile",
      label: "Profil",
      icon: User,
      roles: ["user", "tutor", "admin", "superadmin"],
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
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 z-50 border-t md:hidden safe-area-bottom transition-all duration-300",
      // Apple Liquid Glass - Ultra Subtle
      isTransparent
        ? [
          "bg-white/20 dark:bg-white/[0.06]",
          "backdrop-blur-[20px] backdrop-saturate-[120%]",
          "border-t-[0.5px] border-white/40 dark:border-white/10",
          "shadow-[inset_0_0.5px_0_rgba(255,255,255,0.7)]",
          "dark:shadow-[inset_0_0.5px_0_rgba(255,255,255,0.08)]"
        ].join(" ")
        : "bg-card/95 border-t backdrop-blur-md"
    )}>
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
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center shadow-sm z-10 animate-in zoom-in duration-300">
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
