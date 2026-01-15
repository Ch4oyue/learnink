import { forwardRef } from "react";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Clock,
    PlusCircle,
    Bookmark,
    Lightbulb,
    Copy,
    LibraryBig,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ModuleMetadata {
    title: string;
    description?: string;
    category?: string;
    readingTime?: number;
}

interface NewContentRendererProps {
    content?: string | null;
    metadata?: ModuleMetadata;
    onAddToNotes?: (text: string) => void;
    onCopyText?: (text: string) => void;
    isLoading?: boolean;
}

export const NewContentRenderer = forwardRef<HTMLElement, NewContentRendererProps>(
    ({ content, metadata, onAddToNotes, onCopyText, isLoading }, ref) => {
        const handleCopyCode = (code: string) => {
            navigator.clipboard.writeText(code);
            onCopyText?.(code);
        };

        if (isLoading) {
            return (
                <div className="max-w-[800px] mx-auto py-16 px-10 flex flex-col gap-10">
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 w-32 bg-muted rounded" />
                        <div className="h-12 w-3/4 bg-muted rounded" />
                        <div className="h-4 w-1/2 bg-muted rounded" />
                    </div>
                </div>
            );
        }

        return (
            <main
                ref={ref}
                className="flex-1 overflow-y-auto bg-background relative scroll-smooth no-scrollbar"
            >
                {/* Focus Container */}
                <div className="max-w-[800px] mx-auto py-16 px-10 flex flex-col gap-10">
                    {/* Page Title Block */}
                    {metadata && (
                        <div className="group relative -ml-6 pl-6 border-l-4 border-transparent hover:border-primary/20 transition-all duration-500">
                            <div className="mb-4 flex items-center gap-3">
                                {metadata.category && (
                                    <Badge
                                        variant="secondary"
                                        className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 text-xs font-bold uppercase tracking-wider border-0"
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
                            <h1 className="text-5xl font-black tracking-tighter leading-[1.1] text-foreground mb-4">
                                {metadata.title}
                            </h1>
                            {metadata.description && (
                                <p className="text-xl text-muted-foreground font-light">
                                    {metadata.description}
                                </p>
                            )}
                            {/* Hover Interaction */}
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

                    {/* Rendered Content */}
                    {content ? (
                        <div className="reading-content prose prose-lg dark:prose-invert max-w-none">
                            <MarkdownRenderer content={content} />
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">
                                Konten modul belum tersedia
                            </p>
                        </div>
                    )}

                    {/* End of Section Divider */}
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

NewContentRenderer.displayName = "NewContentRenderer";
