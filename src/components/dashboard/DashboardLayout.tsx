import { ReactNode, forwardRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { LogOut, LayoutDashboard, User, Layers, ChevronRight } from "lucide-react";

/**
 * DashboardLayout - Cleaned Version
 * ==================================
 * Simplified sidebar with only essential navigation:
 * - Home (/dashboard)
 * - Profile (/dashboard/profile)
 */

interface DashboardLayoutProps {
  children: ReactNode;
}

const SIDEBAR_WIDTH = 250;

const roleLabels = {
  user: "Pelajar",
  tutor: "Tutor",
  admin: "Admin",
};

const roleBadgeColors = {
  user: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  tutor: "bg-green-500/10 text-green-400 border-green-500/20",
  admin: "bg-red-500/10 text-red-400 border-red-500/20",
};

export const DashboardLayout = forwardRef<HTMLDivElement, DashboardLayoutProps>(
  function DashboardLayout({ children }, ref) {
    const { user, role, profile, signOut } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const displayName =
      profile?.full_name ||
      user?.user_metadata?.display_name ||
      user?.email?.split("@")[0] ||
      "User";
    const userInitials = displayName.slice(0, 2).toUpperCase();

    const handleSignOut = async () => {
      await signOut();
      navigate("/");
    };

    // SIMPLIFIED NAV ITEMS - Only Home and Profile
    const navItems = [
      {
        href: "/dashboard",
        label: "Home",
        icon: LayoutDashboard,
      },
      {
        href: "/dashboard/profile",
        label: "Profile",
        icon: User,
      },
    ];

    return (
      <div
        ref={ref}
        className="min-h-screen bg-background text-foreground font-sans"
      >
        {/* ============================================
            SIDEBAR - Fixed Position, Left Side
        ============================================ */}
        <aside
          className="fixed left-0 top-0 z-40 h-screen border-r border-border bg-sidebar hidden md:flex md:flex-col"
          style={{ width: `${SIDEBAR_WIDTH}px` }}
        >
          {/* Logo Header */}
          <div className="h-16 flex items-center px-6 border-b border-sidebar-border shrink-0">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
                <Layers className="h-4 w-4" />
              </div>
              <span className="font-bold text-lg text-foreground">
                Learn<span className="text-primary">Ink</span>
              </span>
            </Link>
          </div>

          {/* Navigation - Simplified */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all relative",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-sidebar-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {isActive && (
                    <ChevronRight className="h-4 w-4 text-primary/50" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Info Footer */}
          <div className="border-t border-sidebar-border p-4 shrink-0">
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={profile?.avatar_url || undefined}
                  alt={displayName}
                />
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {displayName}
                </p>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] font-bold",
                    role ? roleBadgeColors[role] : ""
                  )}
                >
                  {role ? roleLabels[role] : "Loading..."}
                </Badge>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Keluar
            </Button>
          </div>
        </aside>

        {/* ============================================
            MAIN CONTENT AREA
        ============================================ */}
        <main
          className="min-h-screen pb-20 md:pb-0"
          style={{ marginLeft: `${SIDEBAR_WIDTH}px` }}
        >
          {/* Mobile Header */}
          <div className="md:hidden sticky top-0 z-30 flex items-center justify-between h-14 px-4 border-b border-border bg-card/95 backdrop-blur-sm">
            <Link to="/" className="flex items-center gap-2 font-semibold">
              <span>
                Learn<span className="text-primary">Ink</span>
              </span>
            </Link>
            <div className="flex items-center gap-2">
              <Link to="/dashboard/profile" className="p-2">
                <Avatar className="h-7 w-7">
                  <AvatarImage
                    src={profile?.avatar_url || undefined}
                    alt={displayName}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </div>
          </div>

          {/* Content Container */}
          <div className="p-4 md:p-8">{children}</div>
        </main>

        {/* Mobile Reset - No sidebar on small screens */}
        <style>{`
          @media (max-width: 768px) {
            main {
              margin-left: 0 !important;
            }
          }
        `}</style>

        {/* Mobile Bottom Nav - Simplified */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-sm">
          <div className="flex items-center justify-around h-16">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center flex-1 h-full text-xs",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5 mb-1" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    );
  }
);

DashboardLayout.displayName = "DashboardLayout";
