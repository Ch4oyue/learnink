import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
  BookOpen,
  Trophy,
  Palette,
  BarChart3,
  FileQuestion,
  Users,
  CheckCircle,
  Globe,
  Settings,
  StickyNote,
  Plug,
  MoreHorizontal,
  Menu,
  Crown,
  Inbox
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarInset,
  SidebarRail,
  useSidebar
} from "@/components/ui/sidebar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from "@/components/ui/sheet";
import { NotificationBadge } from "@/components/features/notifications/NotificationBadge";

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

interface NavGroup {
  title?: string; // Optional section header
  items: NavItem[];
}

interface DashboardLayoutProps {
  children: ReactNode;
}

// ============================================
// CONSTANTS
// ============================================

const formatBadgeCount = (count: string | number | undefined) => {
  if (count === undefined) return null;
  if (typeof count === "number") {
    return count > 999 ? "999+" : count;
  }
  return count;
};

const roleLabels: Record<AppRole, string> = {
  user: "Pelajar",
  tutor: "Tutor",
  admin: "Admin",
  superadmin: "Super Admin",
};

const roleBadgeColors: Record<AppRole, string> = {
  user: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  tutor: "bg-green-500/10 text-green-400 border-green-500/20",
  admin: "bg-red-500/10 text-red-400 border-red-500/20",
  superadmin: "bg-amber-500/10 text-amber-500 border-amber-500/20",
};

// ============================================
// MENU CONFIGURATION PER ROLE (Grouped)
// ============================================

const MENU_CONFIG: Record<AppRole, NavGroup[]> = {
  user: [
    {
      title: "Main",
      items: [
        { href: "/dashboard", label: "Home", icon: LayoutDashboard },
        { href: "/dashboard/second-brain", label: "Second Brain", icon: StickyNote },
        { href: "/dashboard/requests", label: "Requests", icon: FileQuestion },
      ],
    },
    {
      title: "THE SPECIALIST",
      items: [
        { href: "/dashboard/courses?track=specialist", label: "AI & Automation", icon: BookOpen },
      ],
    },
    {
      title: "LIFE OS",
      items: [
        { href: "/dashboard/courses?track=life-os", label: "Life Skills", icon: BookOpen },
      ],
    },
    {
      title: "Progress",
      items: [
        { href: "/dashboard/achievements", label: "Achievements", icon: Trophy },
      ],
    },
  ],
  tutor: [
    {
      items: [
        { href: "/dashboard", label: "Studio", icon: Palette },
        { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
        { href: "/dashboard/requests", label: "Material Requests", icon: FileQuestion },
      ],
    },
  ],
  admin: [
    {
      items: [
        { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
        { href: "/dashboard/users", label: "Users", icon: Users },
        { href: "/dashboard/admin/approval", label: "Inbox", icon: Inbox },
        { href: "/dashboard/admin/integrations", label: "Integrations", icon: Plug },
        { href: "/dashboard/admin/sources", label: "Learning Sources", icon: Globe },
        { href: "/dashboard/settings", label: "System Settings", icon: Settings },
      ],
    },
  ],
  superadmin: [
    {
      items: [
        { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
        { href: "/dashboard/users", label: "Users", icon: Users },
        { href: "/dashboard/admin/approval", label: "Inbox", icon: Inbox },
        { href: "/dashboard/admin/integrations", label: "Integrations", icon: Plug },
        { href: "/dashboard/admin/sources", label: "Learning Sources", icon: Globe },
        { href: "/dashboard/settings", label: "System Settings", icon: Settings },
      ],
    },
  ],
};

// ============================================
// APP SIDEBAR COMPONENT
// ============================================

interface SidebarProps {
  pendingCount?: number;
}

function AppSidebar({ pendingCount = 0 }: SidebarProps) {
  const { user, role, profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { state, isMobile } = useSidebar();

  const currentRole: AppRole = role ?? "user";
  const displayName =
    profile?.display_name ||
    user?.user_metadata?.display_name ||
    user?.email?.split("@")[0] ||
    "User";
  const userInitials = displayName.slice(0, 2).toUpperCase();

  const navGroups: NavGroup[] = MENU_CONFIG[currentRole].map(group => ({
    ...group,
    items: group.items.map(item => {
      if ((currentRole === "admin" || currentRole === "superadmin") && item.href === "/dashboard/admin/approval" && pendingCount > 0) {
        return { ...item, badge: pendingCount };
      }
      return item;
    })
  }));

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <Sidebar collapsible="icon" className="hidden md:flex m-4 h-[calc(100vh-2rem)] border-none glass-liquid rounded-[32px] overflow-hidden transition-all duration-300 shadow-glow">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Layers className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">LearnInk</span>
                  <div className="flex items-center gap-1">
                    <span className={cn("truncate text-xs text-muted-foreground", currentRole === 'superadmin' && "text-amber-500 font-medium")}>
                      {roleLabels[currentRole]}
                    </span>
                    {currentRole === 'superadmin' && <Crown className="size-3 text-amber-500" />}
                  </div>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {navGroups.map((group, index) => (
          <SidebarGroup key={index}>
            {group.title && (
               <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = location.pathname === item.href || location.pathname + location.search === item.href;
                  return (
                    <SidebarMenuItem key={item.href} className="relative">
                      <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                        <Link to={item.href}>
                          <item.icon />
                          <span>{item.label}</span>
                          {(state !== 'collapsed' || isMobile) && item.badge && (
                            <Badge className="ml-auto h-5 px-1.5 min-w-[20px] justify-center bg-destructive text-destructive-foreground hover:bg-destructive">
                               {formatBadgeCount(item.badge)}
                            </Badge>
                          )}
                        </Link>
                      </SidebarMenuButton>
                      {state === 'collapsed' && !isMobile && item.badge && (
                        <div className="absolute -top-1 right-0 z-50 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#f03e3e] px-1 text-[10px] font-bold text-white shadow-sm ring-1 ring-background pointer-events-none">
                            {formatBadgeCount(item.badge)}
                        </div>
                      )}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} />
                    <AvatarFallback className="rounded-lg">{userInitials}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{displayName}</span>
                    <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
                  </div>
                  <MoreHorizontal className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} />
                      <AvatarFallback className="rounded-lg">{userInitials}</AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{displayName}</span>
                      <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link to="/dashboard/profile?tab=profile">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link to="/dashboard/profile?tab=notes">
                      <StickyNote className="mr-2 h-4 w-4" />
                      My Notes
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link to="/dashboard/profile?tab=settings">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

// ============================================
// MOBILE BOTTOM NAV COMPONENT (Floating)
// ============================================

interface MobileNavProps {
  pendingCount?: number;
}

function MobileBottomNav({ pendingCount = 0 }: MobileNavProps) {
  const { role, signOut } = useAuth();
  const currentRole: AppRole = role ?? "user";
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const navGroups = MENU_CONFIG[currentRole].map(group => ({
    ...group,
    items: group.items.map(item => {
      if ((currentRole === "admin" || currentRole === "superadmin") && item.href === "/dashboard/admin/approval" && pendingCount > 0) {
        return { ...item, badge: pendingCount };
      }
      return item;
    })
  }));

  // Flatten items for mobile view, take top 4 + "Menu" trigger
  const primaryItems = navGroups.flatMap(g => g.items).slice(0, 4);
  const primaryHrefs = new Set(primaryItems.map(item => item.href));

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    navigate("/");
  };

  return (
    <div className="md:hidden fixed bottom-6 left-6 right-6 z-50 pb-[env(safe-area-inset-bottom)]">
      <nav className="glass-liquid rounded-[32px] p-2 transition-all duration-300 shadow-glow">
        <ul className="flex items-center justify-around">
          {primaryItems.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  to={item.href}
                  aria-label={item.label}
                  className={cn(
                    "flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-300",
                    isActive
                      ? "bg-primary/20 text-primary shadow-glow scale-110 border border-primary/20 backdrop-blur-md"
                      : "text-muted-foreground hover:bg-white/10 active:scale-95"
                  )}
                >
                  <div className="relative">
                    <Icon className="w-5 h-5" />
                    {item.badge && (
                      <Badge className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-destructive text-destructive-foreground p-0 flex items-center justify-center text-[10px] pointer-events-none">
                        {formatBadgeCount(item.badge)}
                      </Badge>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}

          {/* Menu Trigger (Opens Sheet) */}
          <li>
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <button
                  aria-label="Menu"
                  className={cn(
                    "flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 text-muted-foreground hover:bg-white/5 active:scale-95"
                  )}
                >
                  <Menu className="w-5 h-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="glass-liquid border-none rounded-t-[32px] max-h-[85vh] overflow-y-auto z-[60] shadow-[0_-8px_30px_rgba(0,0,0,0.1)]">
                <SheetHeader className="text-left mb-6 px-2">
                  <SheetTitle className="flex items-center gap-2">
                    <Layers className="size-5 text-primary" />
                    Menu
                  </SheetTitle>
                  <SheetDescription className="sr-only">
                    Mobile navigation menu
                  </SheetDescription>
                </SheetHeader>
                <div className="space-y-6 pb-8">
                  {navGroups.map((group, i) => {
                    // Filter items that are already in the floating dock (primaryItems)
                    const filteredItems = group.items.filter(item => !primaryHrefs.has(item.href));

                    if (filteredItems.length === 0) return null;

                    return (
                      <div key={i} className="space-y-2">
                        {group.title && <h3 className="text-xs font-bold text-muted-foreground px-4 uppercase tracking-wider">{group.title}</h3>}
                        <div className="grid grid-cols-1 gap-1">
                          {filteredItems.map(item => {
                            const isActive = location.pathname === item.href;
                            const Icon = item.icon;
                            return (
                              <Link
                                key={item.href}
                                to={item.href}
                                onClick={() => setOpen(false)}
                                className={cn(
                                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors",
                                  isActive ? "bg-primary/10 text-primary font-medium" : "hover:bg-white/5 text-foreground"
                                )}
                              >
                                <Icon className="w-5 h-5" />
                                <span>{item.label}</span>
                                {item.badge && <Badge className="ml-auto">{formatBadgeCount(item.badge)}</Badge>}
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  <div className="pt-4 mt-4 border-t border-white/10">
                    <div className="space-y-1">
                      <Link
                        to="/dashboard/profile"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors"
                      >
                        <User className="w-5 h-5" />
                        <span className="font-medium">Profile</span>
                      </Link>
                      <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-destructive/10 text-destructive transition-colors text-left">
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Log out</span>
                      </button>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </li>
        </ul>
      </nav>
    </div>
  );
}

// ============================================
// MAIN LAYOUT COMPONENT
// ============================================

export function DashboardLayout({ children }: DashboardLayoutProps) {
    const { loading, role } = useAuth();
    const currentRole: AppRole = role ?? "user";

    // Fetch pending approval count for admin - Lifted up to share between Sidebar and MobileNav
    const { data: pendingCount = 0 } = useQuery({
      queryKey: ["pending-approvals"],
      queryFn: async () => {
        // Count pending content
        const { count: contentCount, error: contentError } = await supabase
          .from("incoming_contents")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending");

        if (contentError) throw contentError;

        // Count pending requests
        const { count: requestCount, error: requestError } = await supabase
          .from("material_requests")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending");

        if (requestError) throw requestError;

        return (contentCount || 0) + (requestCount || 0);
      },
      enabled: currentRole === "admin" || currentRole === "superadmin",
      refetchInterval: 30000,
    });

    if (loading) {
        return (
             <div className="flex min-h-[100dvh] w-full items-center justify-center">
                <Skeleton className="h-[500px] w-[800px] rounded-xl" />
             </div>
        );
    }

    return (
        <SidebarProvider>
            <AppSidebar pendingCount={pendingCount} />
            <MobileBottomNav pendingCount={pendingCount} />
            <SidebarInset className="min-h-[100dvh] w-full max-w-[100vw] overflow-x-hidden bg-transparent relative z-10">
                <header className="flex h-16 shrink-0 items-center gap-2 border-none glass-liquid px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 md:flex hidden m-4 rounded-2xl shadow-sm">
                    <SidebarTrigger className="-ml-1" />
                    <div className="mr-4 flex">
                        <Badge
                            variant="outline"
                            className={cn(
                                "text-[10px] font-bold uppercase tracking-wider",
                                roleBadgeColors[currentRole]
                            )}
                        >
                            {roleLabels[currentRole]} Dashboard
                        </Badge>
                    </div>
                    <div className="ml-auto">
                      <NotificationBadge />
                    </div>
                </header>
                {/* Mobile Header (Simplified) */}
                <header className="md:hidden sticky top-0 z-40 flex min-h-14 h-auto pt-[env(safe-area-inset-top)] shrink-0 items-center justify-between gap-2 border-b border-white/5 glass-liquid px-4 backdrop-blur-xl transition-all">
                   <div className="flex items-center gap-2">
                      <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <Layers className="size-4" />
                      </div>
                      <span className="font-semibold text-sm">LearnInk</span>
                   </div>
                   <div className="flex items-center gap-3">
                     <NotificationBadge />
                     <Badge
                        variant="outline"
                        className={cn(
                            "text-[10px] font-bold uppercase tracking-wider",
                            roleBadgeColors[currentRole]
                        )}
                    >
                        {roleLabels[currentRole]}
                    </Badge>
                   </div>
                </header>

                {/* Add bottom padding for mobile to account for floating nav */}
                <main className="flex-1 p-4 md:p-8 pt-4 pb-32 md:pb-8">
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}

export default DashboardLayout;
