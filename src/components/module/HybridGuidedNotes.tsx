import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    FileText,
    X,
    Check,
    Plus,
    ArrowUp,
    Edit3,
    Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { LearningNote } from "@/hooks/useLearningNotes";

// ============================================
// TYPES
// ============================================

interface HybridGuidedNotesProps {
    notes: LearningNote[];
    isLoading?: boolean;
    onCreateNote?: (content: string) => void;
    onDeleteNote?: (noteId: string) => void;
    onExportPdf?: () => void;
    isCreating?: boolean;
    isDeleting?: boolean;
}

// ============================================
// HYBRID GUIDED NOTES
// Layout from variant_2 (360px width, sticky input at bottom)
// Colors from dark_mode (#111316 bg, zinc borders, purple accents)
// ============================================

export function HybridGuidedNotes({
    notes,
    isLoading,
    onCreateNote,
    onDeleteNote,
    onExportPdf,
    isCreating,
    isDeleting,
}: HybridGuidedNotesProps) {
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
        <aside className="w-[360px] bg-[#111316] border-l border-zinc-800 flex flex-col shrink-0 z-20 shadow-[-10px_0_30px_rgba(0,0,0,0.1)]">
            {/* Notes Header - Sticky with backdrop blur */}
            <div className="px-6 py-5 border-b border-zinc-800 flex justify-between items-center bg-[#111316]/90 backdrop-blur sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-white/10 rounded-md shadow-sm">
                        <FileText className="h-5 w-5 text-purple-400" />
                    </div>
                    <h2 className="font-bold text-white text-lg tracking-tight">
                        Guided Notes
                    </h2>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onExportPdf}
                    className="text-[11px] font-bold text-purple-400 bg-transparent px-3 py-1.5 rounded-full border-purple-500/30 hover:bg-purple-500 hover:text-white hover:border-purple-500 transition-all"
                >
                    Export PDF
                </Button>
            </div>

            {/* Notes Content - Scrollable */}
            <ScrollArea className="flex-1 p-6">
                <div className="flex flex-col gap-5">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
                        </div>
                    ) : notes.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-sm text-zinc-500">Belum ada catatan</p>
                            <p className="text-xs text-zinc-600 mt-1">
                                Pilih teks atau tulis catatan di bawah
                            </p>
                        </div>
                    ) : (
                        notes.map((note) => (
                            <NoteCard
                                key={note.id}
                                note={note}
                                onDelete={onDeleteNote}
                                isDeleting={isDeleting}
                            />
                        ))
                    )}
                </div>
            </ScrollArea>

            {/* Notion-like Input Area - Sticky at bottom */}
            <div className="p-6 bg-[#111316] border-t border-zinc-800 sticky bottom-0">
                <div className="relative group">
                    <div className="absolute left-4 top-3.5 text-zinc-500 group-focus-within:text-purple-400 transition-colors">
                        <Plus className="h-5 w-5" />
                    </div>
                    <Textarea
                        value={newNoteText}
                        onChange={(e) => setNewNoteText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type '/' for commands"
                        className="w-full bg-zinc-900 border-none shadow-subtle rounded-xl py-3.5 pl-12 pr-12 text-sm text-white placeholder:text-zinc-500 focus-visible:ring-2 focus-visible:ring-purple-500/20 resize-none min-h-[56px]"
                    />
                    {/* Submit Button */}
                    <Button
                        size="icon"
                        onClick={handleSubmit}
                        disabled={!newNoteText.trim() || isCreating}
                        className={cn(
                            "absolute right-2 top-2 h-8 w-8 rounded-lg shadow-md transition-all bg-purple-600 hover:bg-purple-500",
                            newNoteText.trim()
                                ? "opacity-100 scale-100"
                                : "opacity-0 scale-90"
                        )}
                    >
                        {isCreating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <ArrowUp className="h-4 w-4" />
                        )}
                    </Button>
                </div>
                <div className="flex justify-between items-center mt-3 px-1">
                    <div className="flex gap-3">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider hover:text-zinc-300 cursor-pointer">
                            Markdown
                        </span>
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider hover:text-zinc-300 cursor-pointer">
                            Shortcuts
                        </span>
                    </div>
                </div>
            </div>
        </aside>
    );
}

// ============================================
// NOTE CARD COMPONENT
// Style from variant_2 (rounded-2xl, hover border)
// Colors from dark_mode (zinc-900 bg, green accent for saved)
// ============================================

interface NoteCardProps {
    note: LearningNote;
    onDelete?: (noteId: string) => void;
    isDeleting?: boolean;
}

function NoteCard({ note, onDelete, isDeleting }: NoteCardProps) {
    const isHighlightedNote = !!note.highlighted_text;

    return (
        <div
            className={cn(
                "bg-zinc-900 p-5 rounded-2xl border group transition-all duration-300 hover:shadow-md",
                isHighlightedNote
                    ? "border-transparent hover:border-purple-500/20"
                    : "border-dashed border-zinc-700 hover:border-purple-500/50"
            )}
        >
            {/* Header with badge and delete button */}
            <div className="flex justify-between items-start mb-3">
                {isHighlightedNote ? (
                    <span className="bg-green-900/20 text-green-400 text-[10px] font-extrabold tracking-wider px-2 py-1 rounded-md flex items-center gap-1">
                        SAVED <Check className="h-3 w-3" />
                    </span>
                ) : (
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                        NOTE
                    </span>
                )}
                <button
                    onClick={() => onDelete?.(note.id)}
                    disabled={isDeleting}
                    className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 transition-colors"
                >
                    {isDeleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <X className="h-4 w-4" />
                    )}
                </button>
            </div>

            {/* Highlighted text (if from selection) */}
            {note.highlighted_text && (
                <div className="bg-black/30 rounded-lg p-3 font-mono text-[11px] text-zinc-300 border border-zinc-700/50 leading-relaxed mb-3">
                    "{note.highlighted_text}"
                </div>
            )}

            {/* Note content */}
            <p className="text-sm text-zinc-300 leading-relaxed">{note.content}</p>

            {/* Timestamp */}
            <div className="mt-3 text-[10px] text-zinc-600">
                {format(new Date(note.created_at), "dd MMM yyyy, HH:mm", {
                    locale: localeId,
                })}
            </div>

            {/* Edit indicator for user notes */}
            {!isHighlightedNote && (
                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Edit3 className="h-4 w-4 text-zinc-500" />
                </div>
            )}
        </div>
    );
}
