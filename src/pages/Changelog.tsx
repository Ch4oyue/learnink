import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
    ArrowLeft,
    ChevronDown,
    Sparkles,
    Wrench,
    Package,
    Calendar,
    Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================
// CHANGELOG DATA
// ============================================

interface ChangelogEntry {
    version: string;
    date: string;
    title: string;
    description: string;
    improvements: string[];
    fixes: string[];
    patches: string[];
}

const CHANGELOG_DATA: ChangelogEntry[] = [
    {
        version: "1.3.0",
        date: "Jan 17, 2026",
        title: "Total System Repair",
        description: "Major system-wide repair and redesign to stabilize the application after failed redesign attempt.",
        improvements: [
            "Implemented dark-first design system with Indigo/Zinc color palette",
            "Added URL-based tab persistence across Profile and Admin Dashboard",
            "Created interactive sidebar account dropdown with hover effects",
            "Improved marquee animation with 3-track seamless infinite loop",
            "Added responsive 3-column layout for learning interface",
            "Implemented role-based navigation in dashboard sidebar",
            "Added collapsible sidebar feature for more workspace",
            "Improved mobile responsiveness with bottom navigation",
        ],
        fixes: [
            "Fixed sidebar overlap issue with main content (250px fixed width)",
            "Fixed tab content isolation in Profile page",
            "Fixed profile header showing in all tabs (now only in Profile tab)",
            "Fixed Coming Soon pages having redundant buttons",
            "Fixed marquee loop jerk/gap when resetting",
            "Fixed missing routes returning 404",
        ],
        patches: [
            "Added Coming Soon routes for unimplemented features",
            "Cleaned up unused imports in DashboardSettings",
            "Removed progress indicator from Coming Soon pages",
        ],
    },
    {
        version: "1.2.0",
        date: "Jan 15, 2026",
        title: "Learning Interface Redesign",
        description: "Comprehensive redesign of the learning interface with hybrid layout.",
        improvements: [
            "New 3-column learning layout (Rail + Content + Notes)",
            "Resizable panels for content and notes sections",
            "Text selection to notes feature",
            "Quiz section integration at end of content",
            "Scroll-based progress tracking",
        ],
        fixes: [
            "Fixed guided notes not persisting",
            "Fixed quiz completion not updating progress",
            "Fixed content rendering issues with markdown",
        ],
        patches: [
            "Updated quiz player styling",
            "Improved notes panel scrolling",
        ],
    },
    {
        version: "1.1.0",
        date: "Jan 10, 2026",
        title: "Dashboard and Authentication",
        description: "Core dashboard implementation with role-based access.",
        improvements: [
            "Role-based dashboard views (Student, Tutor, Admin)",
            "User management for admins",
            "Material request system",
            "AI-powered module generation",
            "Learning sources management",
            "Profile page with activity tracking",
        ],
        fixes: [
            "Fixed Supabase authentication flow",
            "Fixed role detection on login",
        ],
        patches: [
            "Added loading skeletons for better UX",
        ],
    },
    {
        version: "1.0.0",
        date: "Dec 23, 2025",
        title: "Initial Release",
        description: "First stable release of LearnInk learning platform.",
        improvements: [
            "User authentication with Supabase",
            "Module browsing and learning",
            "Guided notes system",
            "Quiz system with scoring",
            "Progress tracking",
            "Dark/Light theme support",
            "Mobile-responsive design",
        ],
        fixes: [],
        patches: [],
    },
];

// ============================================
// COLLAPSIBLE SECTION COMPONENT
// ============================================

interface CollapsibleSectionProps {
    title: string;
    count: number;
    items: string[];
    icon: React.ReactNode;
    colorClass: string;
}

function CollapsibleSection({ title, count, items, icon, colorClass }: CollapsibleSectionProps) {
    const [isOpen, setIsOpen] = useState(false);

    if (count === 0) {
        return (
            <div className="flex items-center justify-between py-2 px-3 text-muted-foreground text-sm">
                <span className="flex items-center gap-2">
                    {icon}
                    {title} ({count})
                </span>
            </div>
        );
    }

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-2 px-3 hover:bg-muted/50 rounded-lg transition-colors group">
                <span className={cn("flex items-center gap-2 text-sm font-medium", colorClass)}>
                    {icon}
                    {title} ({count})
                </span>
                <ChevronDown className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    isOpen && "rotate-180"
                )} />
            </CollapsibleTrigger>
            <CollapsibleContent className="px-3 pb-2">
                <ul className="space-y-1.5 mt-2 ml-6">
                    {items.map((item, index) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className={cn("mt-1.5 h-1.5 w-1.5 rounded-full shrink-0", colorClass.replace("text-", "bg-"))} />
                            {item}
                        </li>
                    ))}
                </ul>
            </CollapsibleContent>
        </Collapsible>
    );
}

// ============================================
// MAIN CHANGELOG PAGE COMPONENT
// ============================================

export default function Changelog() {
    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="icon" asChild>
                                <Link to="/">
                                    <ArrowLeft className="h-4 w-4" />
                                </Link>
                            </Button>
                            <div>
                                <h1 className="text-xl font-bold text-foreground">Changelog</h1>
                                <p className="text-sm text-muted-foreground">Version history and updates</p>
                            </div>
                        </div>
                        <Badge variant="outline" className="text-primary border-primary/30">
                            v{CHANGELOG_DATA[0].version}
                        </Badge>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Version Header */}
                <div className="flex items-center gap-4 mb-8 text-sm text-muted-foreground">
                    <span className="font-medium">Version</span>
                    <span className="flex-1 border-b border-border" />
                    <span className="font-medium">Description</span>
                </div>

                {/* Changelog Entries */}
                <div className="space-y-6">
                    {CHANGELOG_DATA.map((entry, index) => (
                        <div
                            key={entry.version}
                            className="relative grid grid-cols-[120px_1fr] gap-6 pb-8 border-b border-border last:border-0"
                        >
                            {/* Version & Date Column */}
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <Tag className="h-4 w-4 text-primary" />
                                    <span className="font-bold text-foreground">{entry.version}</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                    <Calendar className="h-3 w-3" />
                                    {entry.date}
                                </div>
                                {index === 0 && (
                                    <Badge className="mt-2 bg-primary/10 text-primary border-primary/20">
                                        Latest
                                    </Badge>
                                )}
                            </div>

                            {/* Content Column */}
                            <div className="bg-card border border-border rounded-xl p-5 shadow-soft">
                                <h2 className="text-lg font-bold text-foreground mb-2">
                                    {entry.title}
                                </h2>
                                <p className="text-muted-foreground text-sm mb-4">
                                    {entry.description}
                                </p>

                                {/* Collapsible Sections */}
                                <div className="space-y-1 border-t border-border pt-3">
                                    <CollapsibleSection
                                        title="Improvements"
                                        count={entry.improvements.length}
                                        items={entry.improvements}
                                        icon={<Sparkles className="h-4 w-4" />}
                                        colorClass="text-green-500"
                                    />
                                    <CollapsibleSection
                                        title="Fixes"
                                        count={entry.fixes.length}
                                        items={entry.fixes}
                                        icon={<Wrench className="h-4 w-4" />}
                                        colorClass="text-amber-500"
                                    />
                                    <CollapsibleSection
                                        title="Patches"
                                        count={entry.patches.length}
                                        items={entry.patches}
                                        icon={<Package className="h-4 w-4" />}
                                        colorClass="text-blue-500"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
