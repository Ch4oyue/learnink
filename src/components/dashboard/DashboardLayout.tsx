import { ReactNode } from "react";
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
  Menu
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
};

const roleBadgeColors: Record<AppRole, string> = {
  user: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  tutor: "bg-green-500/10 text-green-400 border-green-500/20",
  admin: "bg-red-500/10 text-red-400 border-red-500/20",
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
        { href: "/dashboard/admin/approval", label: "Inbox Review", icon: CheckCircle },
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

function AppSidebar() {
  const { user, role, profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useSidebar();

  const currentRole: AppRole = role ?? "user";
  const displayName =
    profile?.display_name ||
    user?.user_metadata?.display_name ||
    user?.email?.split("@")[0] ||
    "User";
  const userInitials = displayName.slice(0, 2).toUpperCase();

  // Fetch pending approval count for admin
  const { data: pendingCount = 0 } = useQuery({
    queryKey: ["pending-approvals"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("incoming_contents")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      if (error) throw error;
      return count || 0;
    },
    enabled: currentRole === "admin",
    refetchInterval: 30000,
  });

  const navGroups: NavGroup[] = MENU_CONFIG[currentRole].map(group => ({
    ...group,
    items: group.items.map(item => {
      if (currentRole === "admin" && item.href === "/dashboard/admin/approval" && pendingCount > 0) {
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
    <Sidebar collapsible="icon" className="border-r border-white/5 bg-background/60 backdrop-blur-xl">
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
                  <span className="truncate text-xs text-muted-foreground">{roleLabels[currentRole]}</span>
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
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                        <Link to={item.href}>
                          <item.icon />
                          <span>{item.label}</span>
                          {item.badge && (
                            <Badge className="ml-auto h-5 px-1.5 min-w-[20px] justify-center bg-destructive text-destructive-foreground hover:bg-destructive">
                               {formatBadgeCount(item.badge)}
                            </Badge>
                          )}
                        </Link>
                      </SidebarMenuButton>
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

function MobileBottomNav() {
  const { role, profile } = useAuth();
  const currentRole: AppRole = role ?? "user";
  const location = useLocation();
  const { toggleSidebar, openMobile } = useSidebar();

  const navGroups = MENU_CONFIG[currentRole];
  // Flatten items for mobile view, take top 4 + "Menu" trigger
  const primaryItems = navGroups.flatMap(g => g.items).slice(0, 4);

  return (
    <div className="md:hidden fixed bottom-6 left-6 right-6 z-50">
      <nav className="bg-background/80 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-lg shadow-black/5 p-2">
        <ul className="flex items-center justify-around">
          {primaryItems.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  to={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-300",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm scale-110"
                      : "text-muted-foreground hover:bg-white/5 active:scale-95"
                  )}
                >
                  <Icon className="w-5 h-5" />
                </Link>
              </li>
            );
          })}

          {/* Menu Trigger (Opens Sidebar Sheet) */}
          <li>
            <button
              onClick={toggleSidebar}
              className={cn(
                "flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-300",
                openMobile
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:bg-white/5 active:scale-95"
              )}
            >
              <Menu className="w-5 h-5" />
            </button>
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
    const { loading } = useAuth();
    const { role } = useAuth();
    const currentRole: AppRole = role ?? "user";

    if (loading) {
        return (
             <div className="flex h-screen w-full items-center justify-center">
                <Skeleton className="h-[500px] w-[800px] rounded-xl" />
             </div>
        );
    }

    return (
        <SidebarProvider>
            <AppSidebar />
            <MobileBottomNav />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 border-b border-white/5 bg-background/60 px-4 backdrop-blur-xl transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 md:flex hidden">
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
                </header>
                {/* Mobile Header (Simplified) */}
                <header className="md:hidden flex h-14 shrink-0 items-center justify-between gap-2 border-b border-white/5 bg-background/60 px-4 backdrop-blur-xl">
                   <div className="flex items-center gap-2">
                      <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <Layers className="size-4" />
                      </div>
                      <span className="font-semibold text-sm">LearnInk</span>
                   </div>
                   <Badge
                      variant="outline"
                      className={cn(
                          "text-[10px] font-bold uppercase tracking-wider",
                          roleBadgeColors[currentRole]
                      )}
                  >
                      {roleLabels[currentRole]}
                  </Badge>
                </header>

                {/* Add bottom padding for mobile to account for floating nav */}
                <div className="flex-1 p-4 md:p-8 pt-4 pb-24 md:pb-8">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}

export default DashboardLayout;
