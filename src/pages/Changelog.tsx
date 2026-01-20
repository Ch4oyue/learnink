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
import { getChangelog, type ChangelogEntry } from "@/lib/changelogParser";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { cn } from "@/lib/utils";

// ============================================
// CHANGELOG DATA (Dynamic from CHANGELOG.md)
// ============================================

const CHANGELOG_DATA: ChangelogEntry[] = getChangelog();

// ============================================
// COLLAPSIBLE SECTION COMPONENT
// ============================================

interface CollapsibleSectionProps {
    title: string;
    count: number;
    items: string[];
    icon: React.ReactNode;
    type: 'improvements' | 'fixes' | 'patches';
}

const SECTION_STYLES = {
    improvements: {
        text: "text-green-500",
        bullet: "bg-green-500"
    },
    fixes: {
        text: "text-amber-500",
        bullet: "bg-amber-500"
    },
    patches: {
        text: "text-blue-500",
        bullet: "bg-blue-500"
    }
};

function CollapsibleSection({ title, count, items, icon, type }: CollapsibleSectionProps) {
    const [isOpen, setIsOpen] = useState(false);
    const styles = SECTION_STYLES[type];

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
                <span className={cn("flex items-center gap-2 text-sm font-medium", styles.text)}>
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
                            <span className={cn("mt-1.5 h-1.5 w-1.5 rounded-full shrink-0", styles.bullet)} />
                            <div className="flex-1">
                                <MarkdownRenderer 
                                    content={item} 
                                    variant="compact" 
                                    enableCodeEditor={false} 
                                />
                            </div>
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
                                        type="improvements"
                                    />
                                    <CollapsibleSection
                                        title="Fixes"
                                        count={entry.fixes.length}
                                        items={entry.fixes}
                                        icon={<Wrench className="h-4 w-4" />}
                                        type="fixes"
                                    />
                                    <CollapsibleSection
                                        title="Patches"
                                        count={entry.patches.length}
                                        items={entry.patches}
                                        icon={<Package className="h-4 w-4" />}
                                        type="patches"
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
