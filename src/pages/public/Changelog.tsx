import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Disclosure } from "@heroui/react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    ArrowLeft,
    ChevronDown,
    Sparkles,
    Wrench,
    Package,
    Calendar,
    Tag,
    History,
} from "lucide-react";
import { getChangelog, getVersionSummary, type ChangelogEntry } from "@/lib/changelogParser";
import { MarkdownRenderer } from "@/components/shared/MarkdownRenderer";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// ============================================
// CHANGELOG DATA (Dynamic from CHANGELOG.md)
// ============================================

const CHANGELOG_DATA: ChangelogEntry[] = getChangelog();
const SUMMARY_DATA = getVersionSummary();

// ============================================
// COLLAPSIBLE SECTION COMPONENT
// ============================================

interface CollapsibleSectionProps {
    title: string;
    count: number;
    items: string[];
    icon: React.ReactNode;
    type: 'improvements' | 'fixes' | 'patches';
    defaultOpen?: boolean;
}

const SECTION_STYLES = {
    improvements: {
        text: "text-emerald-500",
        bg: "bg-emerald-500/10",
        bgHover: "hover:bg-emerald-500/15",
        bullet: "bg-emerald-500",
    },
    fixes: {
        text: "text-amber-500",
        bg: "bg-amber-500/10",
        bgHover: "hover:bg-amber-500/15",
        bullet: "bg-amber-500",
    },
    patches: {
        text: "text-sky-500",
        bg: "bg-sky-500/10",
        bgHover: "hover:bg-sky-500/15",
        bullet: "bg-sky-500",
    }
};

function CollapsibleSection({ title, count, items, icon, type, defaultOpen = false }: CollapsibleSectionProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const styles = SECTION_STYLES[type];

    if (count === 0) {
        return null;
    }

    return (
        <Disclosure isExpanded={isOpen} onExpandedChange={setIsOpen}>
            <Disclosure.Trigger
                className={cn(
                    "flex items-center justify-between w-full py-2.5 px-4 rounded-xl transition-all duration-200 group",
                    styles.bg,
                    styles.bgHover
                )}
            >
                <span className={cn("flex items-center gap-2.5 text-sm font-semibold", styles.text)}>
                    {icon}
                    {title}
                    <Badge
                        variant="secondary"
                        className={cn(
                            "h-5 px-1.5 text-xs font-bold rounded-md",
                            styles.bg,
                            styles.text
                        )}
                    >
                        {count}
                    </Badge>
                </span>
                <ChevronDown
                    className={cn(
                        "h-4 w-4 transition-transform duration-300",
                        styles.text,
                        isOpen ? "rotate-180" : ""
                    )}
                />
            </Disclosure.Trigger>
            <AnimatePresence>
                {isOpen && (
                    <Disclosure.Content>
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                            className="overflow-hidden"
                        >
                            <ul className="space-y-2 pt-3 pl-4">
                                {items.map((item, index) => (
                                    <motion.li
                                        key={index}
                                        initial={{ x: -10, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: index * 0.03 }}
                                        className="text-sm text-muted-foreground flex items-start gap-3"
                                    >
                                        <span className={cn(
                                            "mt-2 h-1.5 w-1.5 rounded-full shrink-0",
                                            styles.bullet
                                        )} />
                                        <div className="flex-1 leading-relaxed">
                                            <MarkdownRenderer
                                                content={item}
                                                variant="compact"
                                                enableCodeEditor={false}
                                            />
                                        </div>
                                    </motion.li>
                                ))}
                            </ul>
                        </motion.div>
                    </Disclosure.Content>
                )}
            </AnimatePresence>
        </Disclosure>
    );
}

// ============================================
// MAIN CHANGELOG PAGE COMPONENT
// ============================================

export default function Changelog() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b border-border bg-card/50 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Back"
                                onClick={() => {
                                    if (window.history.state && window.history.state.idx > 0) {
                                        navigate(-1);
                                    } else {
                                        navigate('/dashboard');
                                    }
                                }}
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <div>
                                <h1 className="text-xl font-bold text-foreground">Changelog</h1>
                                <p className="text-sm text-muted-foreground">Version history and updates</p>
                            </div>
                        </div>
                        <Badge
                            className="bg-primary text-primary-foreground border-0"
                        >
                            v{CHANGELOG_DATA[0]?.version}
                        </Badge>
                    </div>
                </div>
            </div>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-4 py-8">
                {/* Version Header */}
                <div className="flex items-center gap-4 mb-8 text-sm text-muted-foreground">
                    <span className="font-medium">Version</span>
                    <span className="flex-1 border-b border-border" />
                    <span className="font-medium">Description</span>
                </div>

                {/* Changelog Entries - Classic 2-column grid layout */}
                <div className="space-y-8">
                    {CHANGELOG_DATA.map((entry, index) => (
                        <motion.div
                            key={entry.version}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.08, duration: 0.4 }}
                            className="relative grid grid-cols-1 md:grid-cols-[140px_1fr] gap-4 md:gap-8 pb-8 border-b border-border last:border-0"
                        >
                            {/* Version & Date Column */}
                            <div className="flex md:flex-col items-center md:items-start gap-3 md:gap-2">
                                <div className="flex items-center gap-2">
                                    <Tag className="h-4 w-4 text-primary" />
                                    <span className={cn(
                                        "font-bold",
                                        index === 0
                                            ? "text-primary"
                                            : "text-foreground"
                                    )}>
                                        {entry.version}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                    <Calendar className="h-3 w-3" />
                                    {entry.date}
                                </div>
                                {index === 0 && (
                                    <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                                        <span className="relative flex h-2 w-2 mr-1.5">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                        </span>
                                        Latest
                                    </Badge>
                                )}
                            </div>

                            {/* Content Column */}
                            <div className={cn(
                                "glass-liquid rounded-[24px] p-5 md:p-6 transition-all duration-300",
                                "hover:shadow-lg hover:bg-opacity-80",
                                index === 0 && "ring-1 ring-primary/10"
                            )}>
                                <h2 className="text-lg font-bold text-foreground mb-2">
                                    {entry.title}
                                </h2>
                                {entry.description && (
                                    <p className="text-muted-foreground text-sm mb-5 leading-relaxed">
                                        {entry.description}
                                    </p>
                                )}

                                {/* Collapsible Sections */}
                                <div className="space-y-2 border-t border-border pt-4">
                                    <CollapsibleSection
                                        title="Improvements"
                                        count={entry.improvements.length}
                                        items={entry.improvements}
                                        icon={<Sparkles className="h-4 w-4" />}
                                        type="improvements"
                                        defaultOpen={index === 0}
                                    />
                                    <CollapsibleSection
                                        title="Fixes"
                                        count={entry.fixes.length}
                                        items={entry.fixes}
                                        icon={<Wrench className="h-4 w-4" />}
                                        type="fixes"
                                        defaultOpen={index === 0}
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
                        </motion.div>
                    ))}
                </div>

                {/* Version History Summary */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="mt-12"
                >
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <History className="h-5 w-5" />
                        Version History Summary
                    </h2>
                    <div className="glass-liquid rounded-[24px] overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-b-black/5 dark:border-b-white/10">
                                    <TableHead className="w-[100px]">Version</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Highlights</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {SUMMARY_DATA.map((item) => (
                                    <TableRow key={item.version} className="hover:bg-primary/5 border-b-black/5 dark:border-b-white/10">
                                        <TableCell className="font-medium">{item.version}</TableCell>
                                        <TableCell>{item.date}</TableCell>
                                        <TableCell>{item.highlights}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </motion.div>

                {/* Footer */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-10 pt-6 border-t border-border/40 text-center"
                >
                    <p className="text-sm text-muted-foreground">
                        Want to request a feature?{" "}
                        <Link to="/dashboard/requests?tab=feature" className="text-primary hover:underline font-medium">
                            Let us know
                        </Link>
                    </p>
                </motion.div>
            </main>
        </div>
    );
}
