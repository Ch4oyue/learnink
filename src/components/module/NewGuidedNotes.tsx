import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Shapes,
    FileText,
    X,
    Check,
    Plus,
    ArrowUp,
    Loader2,
    Copy,
    MoreHorizontal,
    Bold,
    Italic,
    Underline,
    List,
    Link,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { LearningNote } from "@/hooks/useLearningNotes";

// ============================================
// TYPES
// ============================================

interface NewGuidedNotesProps {
    notes: LearningNote[];
    isLoading?: boolean;
    onCreateNote?: (content: string) => void;
    onDeleteNote?: (noteId: string) => void;
    onMarkComplete?: () => void;
    isCreating?: boolean;
    isDeleting?: boolean;
}

// ============================================
// MAIN COMPONENT
// ============================================

export function NewGuidedNotes({
    notes,
    isLoading,
    onCreateNote,
    onDeleteNote,
    onMarkComplete,
    isCreating,
    isDeleting,
}: NewGuidedNotesProps) {
    const [newNoteText, setNewNoteText] = useState("");

    const handleSubmit = () => {
        if (newNoteText.trim() && onCreateNote) {
            onCreateNote(newNoteText.trim());
            setNewNoteText("");
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <aside className="w-[320px] bg-[#111316] border-l border-zinc-800 flex flex-col shrink-0">
            {/* Guided Notes Header */}
            <div className="p-3 border-b border-zinc-800 flex items-center justify-between bg-[#111316]">
                <div className="flex items-center gap-2">
                    <Shapes className="h-4 w-4 text-purple-400" />
                    <span className="text-xs font-bold tracking-widest text-zinc-400 uppercase">
                        Guided Notes
                    </span>
                </div>
                <div className="flex items-center gap-3 text-zinc-500">
                    <FileText className="h-4 w-4 cursor-pointer hover:text-white transition-colors" />
                    <MoreHorizontal className="h-4 w-4 cursor-pointer hover:text-white transition-colors" />
                </div>
            </div>

            {/* Rich Text Toolbar */}
            <div className="bg-zinc-900 p-2 flex items-center gap-4 text-zinc-400 border-b border-zinc-800">
                <button className="hover:text-white transition-colors">
                    <Bold className="h-4 w-4" />
                </button>
                <button className="hover:text-white transition-colors">
                    <Italic className="h-4 w-4" />
                </button>
                <button className="hover:text-white transition-colors">
                    <Underline className="h-4 w-4" />
                </button>
                <div className="w-[1px] h-4 bg-zinc-700" />
                <button className="hover:text-white transition-colors text-sm font-bold">
                    H1
                </button>
                <button className="hover:text-white transition-colors">
                    <List className="h-4 w-4" />
                </button>
                <button className="hover:text-white transition-colors">
                    <Link className="h-4 w-4" />
                </button>
                <button className="hover:text-white transition-colors ml-auto">
                    <MoreHorizontal className="h-4 w-4" />
                </button>
            </div>

            {/* Notes Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-8">
                {/* Key Takeaways Section */}
                <section>
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">
                        Key Takeaways
                    </h4>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
                        </div>
                    ) : notes.length === 0 ? (
                        <p className="text-sm text-zinc-500">No notes yet. Start by highlighting text or typing below.</p>
                    ) : (
                        <ul className="space-y-3">
                            {notes.slice(0, 5).map((note) => (
                                <li key={note.id} className="flex items-start gap-3 group">
                                    <Checkbox
                                        className="mt-1 w-4 h-4 rounded border-zinc-600 bg-transparent data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                                        defaultChecked={!!note.highlighted_text}
                                    />
                                    <div className="flex-1">
                                        <p className="text-sm text-zinc-300 leading-tight">
                                            {note.content || note.highlighted_text}
                                        </p>
                                        <button
                                            onClick={() => onDeleteNote?.(note.id)}
                                            className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 text-xs mt-1 transition-all"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <div className="border-t border-dashed border-zinc-800" />

                {/* Quick Snippets Section */}
                <section>
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">
                        Quick Snippets
                    </h4>
                    <div className="bg-black rounded-lg border border-zinc-800 p-3 relative group">
                        <button className="absolute top-2 right-2 text-zinc-600 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                            <Copy className="h-4 w-4" />
                        </button>
                        <code className="text-xs font-mono text-zinc-300 block leading-relaxed">
                            <span className="text-purple-400">const</span> [user, setUser] ={" "}
                            <br />
                            <span className="text-blue-300">useState</span>(
                            <span className="text-purple-400">null</span>);
                        </code>
                    </div>
                </section>

                {/* Personal Thoughts Section */}
                <section className="flex-1 flex flex-col">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">
                        Personal Thoughts
                    </h4>
                    <div className="relative flex-1 min-h-[150px]">
                        <Textarea
                            value={newNoteText}
                            onChange={(e) => setNewNoteText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type your personal notes here..."
                            className="w-full h-full bg-transparent text-zinc-300 text-sm resize-none focus:outline-none border-none placeholder:text-zinc-600"
                        />
                        {/* Submit on Enter indicator */}
                        {newNoteText.trim() && (
                            <div className="absolute bottom-2 right-2">
                                <Button
                                    size="sm"
                                    onClick={handleSubmit}
                                    disabled={isCreating}
                                    className="h-7 px-2 bg-purple-600 hover:bg-purple-700 text-white"
                                >
                                    {isCreating ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                        <ArrowUp className="h-3 w-3" />
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>
                    {/* Bottom Toolbar */}
                    <div className="border-t border-zinc-800 pt-2 flex items-center justify-between text-zinc-600 mt-2">
                        <div className="flex gap-3">
                            <Bold className="h-3.5 w-3.5 hover:text-white cursor-pointer" />
                            <Italic className="h-3.5 w-3.5 hover:text-white cursor-pointer" />
                            <Underline className="h-3.5 w-3.5 hover:text-white cursor-pointer" />
                            <span className="hover:text-white cursor-pointer text-xs font-bold">
                                H1
                            </span>
                            <List className="h-3.5 w-3.5 hover:text-white cursor-pointer" />
                        </div>
                    </div>
                </section>
            </div>

            {/* Footer Button */}
            <div className="p-4 bg-[#111316] border-t border-zinc-800">
                <Button
                    onClick={onMarkComplete}
                    className="w-full bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium py-3 rounded-md transition-colors shadow-lg"
                >
                    Mark Section Complete
                </Button>
            </div>
        </aside>
    );
}
