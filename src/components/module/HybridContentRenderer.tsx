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
        if (isLoading) {
            return (
                <main className="flex-1 overflow-y-auto bg-[#0b0c0e] relative">
                    <div className="max-w-[800px] mx-auto py-16 px-10 flex flex-col gap-10">
                        <div className="animate-pulse space-y-4">
                            <div className="h-6 w-32 bg-zinc-800 rounded" />
                            <div className="h-12 w-3/4 bg-zinc-800 rounded" />
                            <div className="h-4 w-1/2 bg-zinc-800 rounded" />
                            <div className="h-32 bg-zinc-800 rounded-xl mt-8" />
                        </div>
                    </div>
                </main>
            );
        }

        return (
            <main
                ref={ref}
                className="flex-1 overflow-y-auto bg-[#0b0c0e] relative scroll-smooth"
                style={{ scrollbarWidth: "thin", scrollbarColor: "#333 transparent" }}
            >
                {/* Focus Container - 800px max like variant_2 */}
                <div className="max-w-[800px] mx-auto py-16 px-10 flex flex-col gap-10">
                    {/* Page Title Block - Hover interaction from variant_2, colors from dark_mode */}
                    {metadata && (
                        <div className="group relative -ml-6 pl-6 border-l-4 border-transparent hover:border-purple-500/20 transition-all duration-500">
                            {/* Category & Reading Time */}
                            <div className="mb-4 flex items-center gap-3">
                                {metadata.category && (
                                    <Badge
                                        variant="secondary"
                                        className="bg-purple-900/20 text-purple-300 text-xs font-bold uppercase tracking-wider border-0"
                                    >
                                        {metadata.category}
                                    </Badge>
                                )}
                                {metadata.readingTime && (
                                    <span className="flex items-center gap-1 text-xs text-zinc-500 font-medium">
                                        <Clock className="h-3.5 w-3.5" />
                                        {metadata.readingTime} min read
                                    </span>
                                )}
                            </div>

                            {/* Title */}
                            <h1 className="text-5xl font-black tracking-tighter leading-[1.1] text-white mb-4">
                                {metadata.title}
                            </h1>

                            {/* Description */}
                            {metadata.description && (
                                <p className="text-xl text-zinc-400 font-light">
                                    {metadata.description}
                                </p>
                            )}

                            {/* Hover Action - Clone Section */}
                            <div className="absolute top-2 right-0 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-zinc-500 hover:text-purple-400 hover:bg-purple-500/10"
                                    title="Clone Entire Section"
                                >
                                    <LibraryBig className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Content Blocks with Hover Interactions */}
                    {content ? (
                        <div className="reading-content prose prose-lg prose-invert max-w-none">
                            {/* Wrap content in reading blocks style */}
                            <div className="group relative rounded-xl -ml-6 pl-6 p-4 border-l-4 border-transparent hover:border-purple-500/20 hover:bg-zinc-900/30 transition-all duration-300">
                                <div className="text-[1.15rem] leading-[1.8] text-zinc-300 font-normal">
                                    <MarkdownRenderer content={content} />
                                </div>

                                {/* Add to Notes Button (appears on hover) */}
                                <button
                                    onClick={() => onAddToNotes?.(content)}
                                    className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-200 p-2 text-purple-400 bg-zinc-800 shadow-subtle rounded-lg hover:scale-105 active:scale-95"
                                    title="Add to Notes"
                                >
                                    <PlusCircle className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-zinc-500">Konten modul belum tersedia</p>
                        </div>
                    )}

                    {/* End of Section Divider - Style from variant_2 */}
                    <div className="h-32 w-full flex items-center justify-center">
                        <div className="h-[1px] w-24 bg-zinc-700" />
                        <span className="mx-4 text-zinc-500 text-sm font-medium tracking-widest uppercase">
                            End of Section
                        </span>
                        <div className="h-[1px] w-24 bg-zinc-700" />
                    </div>
                </div>
            </main>
        );
    }
);

HybridContentRenderer.displayName = "HybridContentRenderer";
