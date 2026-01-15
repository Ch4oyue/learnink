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

interface NewGuidedNotesProps {
    notes: LearningNote[];
    isLoading?: boolean;
    onCreateNote?: (content: string) => void;
    onDeleteNote?: (noteId: string) => void;
    onExportPdf?: () => void;
    isCreating?: boolean;
    isDeleting?: boolean;
}

export function NewGuidedNotes({
    notes,
    isLoading,
    onCreateNote,
    onDeleteNote,
    onExportPdf,
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
        <aside className="w-full h-full bg-notes-bg dark:bg-[#0f161a] flex flex-col">
            {/* Notes Header */}
            <div className="px-6 py-5 border-b border-border flex justify-between items-center bg-notes-bg/90 dark:bg-[#0f161a]/90 backdrop-blur sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-card rounded-md shadow-sm">
                        <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <h2 className="font-bold text-foreground text-lg tracking-tight">
                        Guided Notes
                    </h2>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onExportPdf}
                    className="text-[11px] font-bold text-primary bg-card px-3 py-1.5 rounded-full border-primary/20 hover:bg-primary hover:text-primary-foreground"
                >
                    Export PDF
                </Button>
            </div>

            {/* Notes Content */}
            <ScrollArea className="flex-1 p-6">
                <div className="flex flex-col gap-5">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : notes.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-sm text-muted-foreground">
                                Belum ada catatan
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
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

            {/* Notion-like Input Area */}
            <div className="p-6 bg-notes-bg dark:bg-[#0f161a] border-t border-border">
                <div className="relative group">
                    <div className="absolute left-4 top-3.5 text-muted-foreground group-focus-within:text-primary transition-colors">
                        <Plus className="h-5 w-5" />
                    </div>
                    <Textarea
                        value={newNoteText}
                        onChange={(e) => setNewNoteText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Tulis catatan baru..."
                        className="w-full bg-card border-none shadow-subtle rounded-xl py-3.5 pl-12 pr-12 text-sm placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/20 resize-none min-h-[56px]"
                    />
                    {/* Submit Button */}
                    <Button
                        size="icon"
                        onClick={handleSubmit}
                        disabled={!newNoteText.trim() || isCreating}
                        className={cn(
                            "absolute right-2 top-2 h-8 w-8 rounded-lg shadow-md transition-all",
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
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider hover:text-foreground cursor-pointer">
                            Markdown
                        </span>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider hover:text-foreground cursor-pointer">
                            Shortcuts
                        </span>
                    </div>
                </div>
            </div>
        </aside>
    );
}

// Individual Note Card Component
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
                "bg-card p-5 rounded-2xl border group transition-all duration-300 hover:shadow-md",
                isHighlightedNote
                    ? "border-transparent hover:border-primary/20 shadow-subtle"
                    : "border-dashed border-border hover:border-primary/50 shadow-none"
            )}
        >
            {/* Header with badge and delete button */}
            <div className="flex justify-between items-start mb-3">
                {isHighlightedNote ? (
                    <span className="bg-accent-green dark:bg-green-900/20 text-accent-green-text dark:text-green-400 text-[10px] font-extrabold tracking-wider px-2 py-1 rounded-md flex items-center gap-1">
                        SAVED <Check className="h-3 w-3" />
                    </span>
                ) : (
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        NOTE
                    </span>
                )}
                <button
                    onClick={() => onDelete?.(note.id)}
                    disabled={isDeleting}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-colors"
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
                <div className="bg-muted/50 rounded-lg p-3 font-mono text-[11px] text-foreground border border-border/50 leading-relaxed mb-3">
                    "{note.highlighted_text}"
                </div>
            )}

            {/* Note content */}
            <p className="text-sm text-muted-foreground leading-relaxed">
                {note.content}
            </p>

            {/* Timestamp */}
            <div className="mt-3 text-[10px] text-muted-foreground">
                {format(new Date(note.created_at), "dd MMM yyyy, HH:mm", {
                    locale: localeId,
                })}
            </div>

            {/* Edit indicator for user notes */}
            {!isHighlightedNote && (
                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Edit3 className="h-4 w-4 text-muted-foreground" />
                </div>
            )}
        </div>
    );
}
