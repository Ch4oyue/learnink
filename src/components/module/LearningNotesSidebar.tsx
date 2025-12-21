import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import type { LearningNote } from "@/hooks/useLearningNotes";

interface LearningNotesSidebarProps {
  notes: LearningNote[];
  isLoading: boolean;
  onDelete: (noteId: string) => void;
  isDeleting?: boolean;
}

export function LearningNotesSidebar({ 
  notes, 
  isLoading, 
  onDelete,
  isDeleting = false 
}: LearningNotesSidebarProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">
          Belum ada catatan
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Pilih teks untuk membuat catatan
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-3 pr-3">
        {notes.map((note) => (
          <div 
            key={note.id}
            className="group p-3 bg-muted/50 rounded-lg border border-border hover:border-primary/20 transition-colors"
          >
            {note.highlighted_text && (
              <p className="text-xs text-muted-foreground italic mb-2 line-clamp-2 border-l-2 border-primary/50 pl-2">
                "{note.highlighted_text}"
              </p>
            )}
            <p className="text-sm text-foreground line-clamp-3">
              {note.content}
            </p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-muted-foreground">
                {format(new Date(note.created_at), "dd MMM, HH:mm", { locale: localeId })}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(note.id)}
                disabled={isDeleting}
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
              >
                {isDeleting ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Trash2 className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
