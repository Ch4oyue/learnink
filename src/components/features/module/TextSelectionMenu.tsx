import { Copy, StickyNote, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TextSelectionMenuProps {
  position: { x: number; y: number };
  onCopy: () => void;
  onCreateNote: () => void;
  isCreating?: boolean;
}

export function TextSelectionMenu({ 
  position, 
  onCopy, 
  onCreateNote,
  isCreating = false 
}: TextSelectionMenuProps) {
  return (
    <div 
      className="fixed z-50 flex items-center gap-1 p-1 bg-card border border-border rounded-lg shadow-lg"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -100%)',
      }}
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={onCopy}
        className="h-8 px-2 gap-1"
      >
        <Copy className="h-3 w-3" />
        <span className="text-xs">Salin</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onCreateNote}
        disabled={isCreating}
        className="h-8 px-2 gap-1"
      >
        {isCreating ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <StickyNote className="h-3 w-3" />
        )}
        <span className="text-xs">Buat Catatan</span>
      </Button>
    </div>
  );
}
