import { forwardRef } from "react";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Clock,
    PlusCircle,
    Bookmark,
    LibraryBig,
    Copy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

// ============================================
// TYPES
// ============================================

interface ModuleMetadata {
    title: string;
    description?: string;
    category?: string;
    readingTime?: number;
}

interface HybridContentRendererProps {
    content?: string | null;
    metadata?: ModuleMetadata;
    onAddToNotes?: (text: string) => void;
    onCopyCode?: (code: string) => void;
    isLoading?: boolean;
}

// ============================================
// HYBRID CONTENT RENDERER
// Layout from variant_2 (800px container, reading blocks with hover)
// Colors from dark_mode (#0b0c0e bg, zinc text, purple accents)
// ============================================

export const HybridContentRenderer = forwardRef<HTMLElement, HybridContentRendererProps>(
    ({ content, metadata, onAddToNotes, onCopyCode, isLoading }, ref) => {
        const { resolvedTheme } = useTheme();

        if (isLoading) {
            return (
                <main className="flex-1 overflow-y-auto bg-background relative" aria-busy="true">
                    <div className="max-w-[800px] mx-auto py-16 px-10 flex flex-col gap-10">
                        <div className="animate-pulse space-y-4">
                            <div className="h-6 w-32 bg-muted rounded" />
                            <div className="h-12 w-3/4 bg-muted rounded" />
                            <div className="h-4 w-1/2 bg-muted rounded" />
                            <div className="h-32 bg-muted rounded-xl mt-8" />
                        </div>
                    </div>
                </main>
            );
        }

        return (
            <main
                ref={ref}
                className="flex-1 overflow-y-auto bg-background relative scroll-smooth"
                style={{ scrollbarWidth: "thin", scrollbarColor: "hsl(var(--muted)) transparent" }}
            >
                {/* Focus Container - 800px max like variant_2 */}
                <div className="max-w-[800px] mx-auto py-12 md:py-16 px-5 md:px-10 flex flex-col gap-8 md:gap-10">
                    {/* Page Title Block - Hover interaction from variant_2, colors from dark_mode */}
                    {metadata && (
                        <div className="group relative -ml-6 pl-6 border-l-4 border-transparent hover:border-primary/20 transition-all duration-500">
                            {/* Category & Reading Time */}
                            <div className="mb-4 flex items-center gap-3">
                                {metadata.category && (
                                    <Badge
                                        variant="secondary"
                                        className="text-xs font-bold uppercase tracking-wider"
                                    >
                                        {metadata.category}
                                    </Badge>
                                )}
                                {metadata.readingTime && (
                                    <span className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
                                        <Clock className="h-3.5 w-3.5" />
                                        {metadata.readingTime} min read
                                    </span>
                                )}
                            </div>

                            {/* Title */}
                            <h1 className="text-5xl font-black tracking-tighter leading-[1.1] text-foreground mb-4">
                                {metadata.title}
                            </h1>

                            {/* Description */}
                            {metadata.description && (
                                <p className="text-xl text-muted-foreground font-light">
                                    {metadata.description}
                                </p>
                            )}

                            {/* Hover Action - Clone Section */}
                            <div className="absolute top-2 right-0 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                                    title="Clone Entire Section"
                                >
                                    <LibraryBig className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Content Blocks with Hover Interactions */}
                    {content ? (
                        <div className={cn(
                            "reading-content prose prose-lg max-w-none",
                            resolvedTheme === "dark" && "prose-invert"
                        )}>
                            {/* Wrap content in reading blocks style */}
                            <div className="group relative rounded-xl -ml-4 pl-4 md:-ml-6 md:pl-6 p-4 border-l-4 border-transparent hover:border-primary/20 hover:bg-muted/30 transition-all duration-300">
                                <div className="text-[1.15rem] leading-loose md:leading-[2.0] text-muted-foreground font-normal tracking-wide">
                                    <MarkdownRenderer content={content} />
                                </div>

                                {/* Add to Notes Button (appears on hover) */}
                                <button
                                    onClick={() => onAddToNotes?.(content)}
                                    aria-label="Add to Notes"
                                    className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-200 p-2 text-primary bg-card shadow-subtle rounded-lg hover:scale-105 active:scale-95"
                                >
                                    <PlusCircle className="h-5 w-5" aria-hidden="true" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">Konten modul belum tersedia</p>
                        </div>
                    )}

                    {/* End of Section Divider - Style from variant_2 */}
                    <div className="h-32 w-full flex items-center justify-center">
                        <div className="h-[1px] w-24 bg-border" />
                        <span className="mx-4 text-muted-foreground text-sm font-medium tracking-widest uppercase">
                            End of Section
                        </span>
                        <div className="h-[1px] w-24 bg-border" />
                    </div>
                </div>
            </main>
        );
    }
);

HybridContentRenderer.displayName = "HybridContentRenderer";
