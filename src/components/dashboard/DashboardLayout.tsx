import { ReactNode, forwardRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  LogOut,
  LayoutDashboard,
  User,
  Layers,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Trophy,
  Palette,
  BarChart3,
  FileQuestion,
  Users,
  CheckCircle,
  Globe,
  Settings,
  Menu,
  ChevronDown,
  StickyNote,
  Sun,
  Moon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * DashboardLayout - Scalable Dashboard Shell
 * ==========================================
 * Dynamic sidebar that adapts to user role:
 * - Student: Home, My Courses, Achievements
 * - Tutor: Studio, Analytics, Material Requests
 * - Admin: Overview, Users, Content Approval, Learning Sources
 */

// ============================================
// TYPES
// ============================================

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string | number;
}

interface DashboardLayoutProps {
  children: ReactNode;
}

// ============================================
// CONSTANTS
// ============================================

const SIDEBAR_WIDTH = 250;
const SIDEBAR_COLLAPSED_WIDTH = 72;

const roleLabels: Record<AppRole, string> = {
  user: "Pelajar",
  tutor: "Tutor",
  admin: "Admin",
};

const roleBadgeColors: Record<AppRole, string> = {
  user: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  tutor: "bg-green-500/10 text-green-400 border-green-500/20",
  admin: "bg-red-500/10 text-red-400 border-red-500/20",
};

// ============================================
// MENU CONFIGURATION PER ROLE
// ============================================

const MENU_CONFIG: Record<AppRole, NavItem[]> = {
  user: [
    { href: "/dashboard", label: "Home", icon: LayoutDashboard },
    { href: "/dashboard/courses", label: "My Courses", icon: BookOpen },
    { href: "/dashboard/achievements", label: "Achievements", icon: Trophy },
  ],
  tutor: [
    { href: "/dashboard", label: "Studio", icon: Palette },
    { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/dashboard/requests", label: "Material Requests", icon: FileQuestion },
  ],
  admin: [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/users", label: "Users", icon: Users },
    { href: "/dashboard/approval", label: "Content Approval", icon: CheckCircle },
    { href: "/dashboard/admin/sources", label: "Learning Sources", icon: Globe },
    { href: "/dashboard/settings", label: "System Settings", icon: Settings },
  ],
};

// Common items shown for all roles at the bottom
// Note: Profile is accessed via user dropdown at footer, not duplicated here
const COMMON_NAV_ITEMS: NavItem[] = [];

// ============================================
// LOADING SKELETON COMPONENT
// ============================================

function SidebarSkeleton() {
  return (
    <aside
      className="fixed left-0 top-0 z-40 h-screen border-r border-border bg-sidebar hidden md:flex md:flex-col"
      style={{ width: `${SIDEBAR_WIDTH}px` }}
    >
      {/* Logo Header Skeleton */}
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border shrink-0">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-5 w-24 ml-3" />
      </div>

      {/* Navigation Skeleton */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-10 w-full rounded-lg" />
        ))}
      </nav>

      {/* User Info Skeleton */}
      <div className="border-t border-sidebar-border p-4 shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
        <Skeleton className="h-8 w-full" />
      </div>
    </aside>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export const DashboardLayout = forwardRef<HTMLDivElement, DashboardLayoutProps>(
  function DashboardLayout({ children }, ref) {
    const { user, role, profile, loading, signOut } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    // Persist sidebar collapsed state in localStorage
    const [isCollapsed, setIsCollapsed] = useState(() => {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("sidebar-collapsed");
        return saved === "true";
      }
      return false;
    });

    // Update localStorage when collapsed state changes
    const handleSetCollapsed = (collapsed: boolean) => {
      setIsCollapsed(collapsed);
      localStorage.setItem("sidebar-collapsed", String(collapsed));
    };

    // Get role-specific nav items with type safety
    const currentRole: AppRole = role ?? "user";
    const navItems: NavItem[] = MENU_CONFIG[currentRole];

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

    const sidebarWidth = isCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;

    // Show loading skeleton while checking auth state
    if (loading) {
      return (
        <div
          ref={ref}
          className="min-h-screen bg-background text-foreground font-sans"
        >
          <SidebarSkeleton />
          <main
            className="min-h-screen pb-20 md:pb-0 transition-all duration-300"
            style={{ marginLeft: `${SIDEBAR_WIDTH}px` }}
          >
            <div className="p-4 md:p-8">
              <div className="space-y-6">
                <Skeleton className="h-10 w-64" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-32 rounded-xl" />
                  ))}
                </div>
                <Skeleton className="h-64 w-full rounded-xl" />
              </div>
            </div>
          </main>
          {/* Mobile margin fix */}
          <style>{`
            @media (max-width: 768px) {
              main { margin-left: 0 !important; }
            }
          `}</style>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className="min-h-screen bg-background text-foreground font-sans"
      >
        {/* ============================================
            SIDEBAR - Fixed Position, Left Side
        ============================================ */}
        <aside
          className={cn(
            "fixed left-0 top-0 z-40 h-screen border-r border-border bg-sidebar hidden md:flex md:flex-col transition-all duration-300"
          )}
          style={{ width: `${sidebarWidth}px` }}
        >
          {/* Logo Header */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border shrink-0">
            <Link to="/" className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground shrink-0">
                <Layers className="h-4 w-4" />
              </div>
              {!isCollapsed && (
                <span className="font-bold text-lg text-foreground">
                  Learn<span className="text-primary">Ink</span>
                </span>
              )}
            </Link>
            {!isCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => handleSetCollapsed(true)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Expand button when collapsed */}
          {isCollapsed && (
            <div className="px-2 py-3 border-b border-sidebar-border">
              <Button
                variant="ghost"
                size="icon"
                className="w-full h-8 text-muted-foreground hover:text-foreground"
                onClick={() => handleSetCollapsed(false)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Role-Based Navigation */}
          <nav className="flex-1 overflow-y-auto p-2 space-y-1">
            {/* Role Badge */}
            {!isCollapsed && (
              <div className="px-2 py-3">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-wider w-full justify-center",
                    roleBadgeColors[currentRole]
                  )}
                >
                  {roleLabels[currentRole]} Dashboard
                </Badge>
              </div>
            )}

            {/* Main Navigation Items */}
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              const IconComponent = item.icon;

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  title={isCollapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all relative",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-sidebar-foreground hover:bg-muted hover:text-foreground",
                    isCollapsed && "justify-center px-0"
                  )}
                >
                  <IconComponent className="h-4 w-4 shrink-0" />
                  {!isCollapsed && (
                    <>
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="text-[10px] px-1.5">
                          {item.badge}
                        </Badge>
                      )}
                      {isActive && (
                        <ChevronRight className="h-4 w-4 text-primary/50" />
                      )}
                    </>
                  )}
                </Link>
              );
            })}

            {/* Separator */}
            <div className="my-4 border-t border-sidebar-border" />

            {/* Common Navigation Items */}
            {COMMON_NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.href;
              const IconComponent = item.icon;

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  title={isCollapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all relative",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-sidebar-foreground hover:bg-muted hover:text-foreground",
                    isCollapsed && "justify-center px-0"
                  )}
                >
                  <IconComponent className="h-4 w-4 shrink-0" />
                  {!isCollapsed && (
                    <>
                      <span className="flex-1">{item.label}</span>
                      {isActive && (
                        <ChevronRight className="h-4 w-4 text-primary/50" />
                      )}
                    </>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Info Footer - Interactive Dropdown */}
          <div className="border-t border-sidebar-border p-3 shrink-0">
            {!isCollapsed ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-all group">
                    <Avatar className="h-10 w-10 ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                      <AvatarImage
                        src={profile?.avatar_url || undefined}
                        alt={displayName}
                      />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {displayName}
                      </p>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-bold mt-0.5",
                          roleBadgeColors[currentRole]
                        )}
                      >
                        {roleLabels[currentRole]}
                      </Badge>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-all group-data-[state=open]:rotate-180" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56" sideOffset={8}>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{displayName}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to="/dashboard/profile?tab=profile" className="flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to="/dashboard/profile?tab=notes" className="flex items-center">
                      <StickyNote className="h-4 w-4 mr-2" />
                      My Notes
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to="/dashboard/profile?tab=settings" className="flex items-center">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Keluar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-full flex justify-center p-1 rounded-lg hover:bg-muted transition-all group">
                    <Avatar className="h-9 w-9 ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                      <AvatarImage
                        src={profile?.avatar_url || undefined}
                        alt={displayName}
                      />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="end" className="w-56" sideOffset={8}>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{displayName}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to="/dashboard/profile?tab=profile" className="flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to="/dashboard/profile?tab=notes" className="flex items-center">
                      <StickyNote className="h-4 w-4 mr-2" />
                      My Notes
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to="/dashboard/profile?tab=settings" className="flex items-center">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Keluar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </aside>

        {/* ============================================
            MAIN CONTENT AREA
        ============================================ */}
        <main
          className="min-h-screen pb-20 md:pb-0 transition-all duration-300"
          style={{ marginLeft: `${sidebarWidth}px` }}
        >
          {/* Mobile Header */}
          <div className="md:hidden sticky top-0 z-30 flex items-center justify-between h-14 px-4 border-b border-border bg-card/95 backdrop-blur-sm">
            <Link to="/" className="flex items-center gap-2 font-semibold">
              <span>
                Learn<span className="text-primary">Ink</span>
              </span>
            </Link>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={cn("text-[10px]", roleBadgeColors[currentRole])}
              >
                {roleLabels[currentRole]}
              </Badge>
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

        {/* Mobile Reset */}
        <style>{`
          @media (max-width: 768px) {
            main {
              margin-left: 0 !important;
            }
          }
        `}</style>

        {/* Mobile Bottom Nav - Role-Specific (max 5 items) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-sm">
          <div className="flex items-center justify-around h-16">
            {/* Show first 4 role-specific items + Profile */}
            {[...navItems.slice(0, 4), { href: "/dashboard/profile", label: "Profile", icon: User }].map((item) => {
              const isActive = location.pathname === item.href;
              const IconComponent = item.icon;

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
                  <IconComponent className="h-5 w-5 mb-1" />
                  <span className="truncate max-w-[60px]">{item.label}</span>
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
