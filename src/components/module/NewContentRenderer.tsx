import { forwardRef } from "react";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================
// TYPES
// ============================================

interface ModuleMetadata {
    title: string;
    description?: string;
    category?: string;
    moduleNumber?: number;
}

interface NewContentRendererProps {
    content?: string | null;
    metadata?: ModuleMetadata;
    isLoading?: boolean;
}

// ============================================
// MAIN COMPONENT
// ============================================

export const NewContentRenderer = forwardRef<HTMLElement, NewContentRendererProps>(
    ({ content, metadata, isLoading }, ref) => {
        if (isLoading) {
            return (
                <main className="flex-1 overflow-y-auto bg-[#0b0c0e] relative">
                    <div className="max-w-3xl mx-auto px-8 pt-16 pb-10">
                        <div className="animate-pulse space-y-6">
                            <div className="flex items-center gap-2">
                                <div className="h-4 w-16 bg-zinc-800 rounded" />
                                <div className="h-4 w-4 bg-zinc-800 rounded" />
                                <div className="h-4 w-12 bg-zinc-800 rounded" />
                            </div>
                            <div className="h-12 w-3/4 bg-zinc-800 rounded" />
                            <div className="space-y-3">
                                <div className="h-4 bg-zinc-800 rounded" />
                                <div className="h-4 w-5/6 bg-zinc-800 rounded" />
                                <div className="h-4 w-4/6 bg-zinc-800 rounded" />
                            </div>
                        </div>
                    </div>
                </main>
            );
        }

        return (
            <main
                ref={ref}
                className="flex-1 overflow-y-auto bg-[#0b0c0e] relative scroll-smooth"
            >
                <div className="max-w-3xl mx-auto px-8 pt-16 pb-10">
                    {/* Breadcrumbs */}
                    {metadata && (
                        <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 mb-6">
                            <span>Module {metadata.moduleNumber || 1}</span>
                            <ChevronRight className="h-3 w-3" />
                            <span className="text-purple-400">{metadata.category || "Lesson"}</span>
                        </div>
                    )}

                    {/* Article Header */}
                    {metadata && (
                        <h1 className="text-4xl font-bold text-white mb-6 tracking-tight">
                            {metadata.title}
                        </h1>
                    )}

                    {/* Prose Content */}
                    <div className="prose prose-invert prose-lg max-w-none text-zinc-400">
                        {content ? (
                            <>
                                {metadata?.description && (
                                    <p className="leading-relaxed mb-6 text-lg">{metadata.description}</p>
                                )}
                                <div className="reading-content">
                                    <MarkdownRenderer content={content} />
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-12">
                                <p className="text-zinc-500">Content not available yet.</p>
                            </div>
                        )}
                    </div>

                    {/* Code Block Demonstration (Optional) */}
                    {content && (
                        <div className="my-10 rounded-xl overflow-hidden bg-[#15151a] border border-zinc-800 shadow-2xl shadow-black/50">
                            {/* Window Header */}
                            <div className="h-10 bg-[#1e1e24] flex items-center px-4 border-b border-zinc-800 relative">
                                <div className="flex gap-2 absolute left-4">
                                    <div className="w-3 h-3 rounded-full bg-red-500" />
                                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                                    <div className="w-3 h-3 rounded-full bg-green-500" />
                                </div>
                                <div className="mx-auto text-xs text-zinc-500 font-mono">
                                    example.jsx
                                </div>
                            </div>
                            {/* Preview Code */}
                            <div className="p-6 font-mono text-sm leading-relaxed overflow-x-auto">
                                <pre className="text-zinc-300">
                                    <code>
                                        <span className="text-purple-400">import</span> React, {"{ useState }"}{" "}
                                        <span className="text-purple-400">from</span>{" "}
                                        <span className="text-green-400">'react'</span>;{"\n\n"}
                                        <span className="text-purple-400">export default function</span>{" "}
                                        <span className="text-blue-400">Example</span>() {"{"}
                                        {"\n"}
                                        {"  "}
                                        <span className="text-zinc-600 italic">
                      // Your code here
                                        </span>
                                        {"\n"}
                                        {"  "}
                                        <span className="text-purple-400">const</span> [value, setValue] ={" "}
                                        <span className="text-blue-300">useState</span>(
                                        <span className="text-orange-300">0</span>);{"\n\n"}
                                        {"  "}
                                        <span className="text-purple-400">return</span> (
                                        {"\n"}
                                        {"    "}
                                        <span className="text-zinc-400">&lt;</span>
                                        <span className="text-red-400">div</span>
                                        <span className="text-zinc-400">&gt;</span>
                                        {"{value}"}
                                        <span className="text-zinc-400">&lt;/</span>
                                        <span className="text-red-400">div</span>
                                        <span className="text-zinc-400">&gt;</span>
                                        {"\n"}
                                        {"  "});{"\n"}
                                        {"}"}
                                    </code>
                                </pre>
                            </div>
                        </div>
                    )}

                    {/* End of Content Spacer */}
                    <div className="h-20" />
                </div>
            </main>
        );
    }
);

NewContentRenderer.displayName = "NewContentRenderer";
