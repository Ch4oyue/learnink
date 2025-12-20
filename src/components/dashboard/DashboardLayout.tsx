import { ReactNode, forwardRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUnreadNotificationCount } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { BottomNavigation } from "@/components/layout/BottomNavigation";
import {
  LogOut,
  LayoutDashboard,
  BookOpen,
  FileQuestion,
  Users,
  ChevronLeft,
  Bell,
} from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
}

const roleLabels = {
  user: 'Pelajar',
  tutor: 'Tutor',
  admin: 'Admin',
};

const roleBadgeVariants = {
  user: 'secondary',
  tutor: 'default',
  admin: 'destructive',
} as const;

export const DashboardLayout = forwardRef<HTMLDivElement, DashboardLayoutProps>(function DashboardLayout({ children }, ref) {
  const { user, role, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { data: unreadCount } = useUnreadNotificationCount(user?.id);

  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "User";

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const navItems = [
    { 
      href: role === 'admin' ? '/dashboard/admin' : role === 'tutor' ? '/dashboard/tutor' : '/dashboard/user', 
      label: 'Dashboard', 
      icon: LayoutDashboard,
      roles: ['user', 'tutor', 'admin'] 
    },
    { href: '/dashboard/modules', label: 'Modul', icon: BookOpen, roles: ['user', 'tutor', 'admin'] },
    { href: '/dashboard/requests', label: 'Request Materi', icon: FileQuestion, roles: ['tutor', 'admin'] },
    { href: '/dashboard/users', label: 'Manajemen User', icon: Users, roles: ['admin'] },
    { href: '/dashboard/notifications', label: 'Notifikasi', icon: Bell, badge: unreadCount, roles: ['user', 'tutor', 'admin'] },
  ];

  const filteredNavItems = navItems.filter(item => 
    role && item.roles.includes(role)
  );

  return (
    <div ref={ref} className="min-h-screen bg-background">
      {/* Sidebar - Hidden on mobile */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-card/50 backdrop-blur-sm hidden md:block">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center border-b border-border px-6">
            <Link to="/" className="flex items-center gap-2 text-lg font-semibold">
              <ChevronLeft className="h-4 w-4 text-muted-foreground" />
              <span>Learn<span className="text-primary">AI</span></span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {filteredNavItems.map((item) => {
              const isActive = location.pathname === item.href || 
                (item.href.includes('/dashboard/user') && location.pathname === '/dashboard/user') ||
                (item.href.includes('/dashboard/tutor') && location.pathname === '/dashboard/tutor') ||
                (item.href.includes('/dashboard/admin') && location.pathname === '/dashboard/admin');
              
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors relative",
                    isActive 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                  {item.badge && item.badge > 0 && (
                    <span className="ml-auto h-5 min-w-5 px-1.5 rounded-full bg-destructive text-destructive-foreground text-xs font-medium flex items-center justify-center">
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User info */}
          <div className="border-t border-border p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium text-primary">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
                <Badge variant={role ? roleBadgeVariants[role] : 'secondary'} className="text-xs">
                  {role ? roleLabels[role] : 'Loading...'}
                </Badge>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="w-full justify-start text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Keluar
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="md:ml-64 min-h-screen pb-20 md:pb-0">
        {/* Mobile Header */}
        <div className="md:hidden sticky top-0 z-30 flex items-center justify-between h-14 px-4 border-b bg-card/95 backdrop-blur-sm">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <span>Learn<span className="text-primary">AI</span></span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/dashboard/notifications" className="relative p-2">
              <Bell className="h-5 w-5" />
              {unreadCount && unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-medium flex items-center justify-center">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>

      {/* Bottom Navigation - Mobile only */}
      <BottomNavigation />
    </div>
  );
});

DashboardLayout.displayName = "DashboardLayout";
