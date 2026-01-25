import { memo } from "react";
import { useNavigate } from "react-router-dom";
import {
    GraduationCap,
    BookOpen,
    Search,
    LayoutDashboard,
    Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";

// ============================================
// TYPES
// ============================================

interface NavItem {
    icon: React.ReactNode;
    label: string;
    isActive?: boolean;
    onClick?: () => void;
}

interface HybridSidebarProps {
    onTableOfContentsClick?: () => void;
    onSearchClick?: () => void;
    onBackClick?: () => void;
    activeTab?: "toc" | "content" | "dashboard";
}

// ============================================
// HYBRID SIDEBAR (72px Rail - Layout from variant_2, Colors from dark_mode)
// ============================================

export const HybridSidebar = memo(function HybridSidebar({
    onTableOfContentsClick,
    onSearchClick,
    onBackClick,
    activeTab = "content",
}: HybridSidebarProps) {
    const navigate = useNavigate();

    const navItems: NavItem[] = [
        {
            icon: <BookOpen className="h-5 w-5" />,
            label: "Table of Contents",
            isActive: activeTab === "toc",
            onClick: onTableOfContentsClick,
        },
        {
            icon: <Search className="h-5 w-5" />,
            label: "Search",
            onClick: onSearchClick,
        },
        {
            icon: <LayoutDashboard className="h-5 w-5" />,
            label: "Dashboard",
            isActive: activeTab === "dashboard",
            onClick: () => navigate("/dashboard"),
        },
    ];

    return (
        <aside
            className="w-[72px] border-r border-sidebar-border bg-sidebar flex flex-col items-center py-6 gap-8 shrink-0 z-20"
            aria-label="Learning navigation"
        >
            {/* Brand Mark - Clean Dark Style */}
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-lg mb-2">
                <GraduationCap className="h-5 w-5" aria-hidden="true" />
            </div>

            {/* Nav Icons with Tooltips */}
            <div className="flex flex-col gap-4 w-full px-3">
                {navItems.map((item, index) => (
                    <Tooltip key={index}>
                        <TooltipTrigger asChild>
                            <button
                                onClick={item.onClick}
                                aria-label={item.label}
                                aria-pressed={item.isActive}
                                className={cn(
                                    "w-full aspect-square flex items-center justify-center rounded-xl transition-all",
                                    item.isActive
                                        ? "text-primary bg-sidebar-accent shadow-inner"
                                        : "text-sidebar-foreground hover:text-primary hover:bg-sidebar-accent"
                                )}
                            >
                                {item.icon}
                            </button>
                        </TooltipTrigger>
                        <TooltipContent
                            side="right"
                            sideOffset={10}
                            className="bg-card text-foreground border-border"
                        >
                            <p className="text-xs font-bold">{item.label}</p>
                        </TooltipContent>
                    </Tooltip>
                ))}
            </div>

            {/* Bottom Settings */}
            <div className="mt-auto px-3 w-full">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            onClick={() => navigate("/dashboard/settings")}
                            aria-label="Settings"
                            className="w-full aspect-square flex items-center justify-center rounded-xl text-sidebar-foreground hover:text-primary hover:bg-sidebar-accent transition-all"
                        >
                            <Settings className="h-5 w-5" aria-hidden="true" />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent
                        side="right"
                        sideOffset={10}
                        className="bg-card text-foreground border-border"
                    >
                        <p className="text-xs font-bold">Settings</p>
                    </TooltipContent>
                </Tooltip>
            </div>
        </aside>
    );
});
