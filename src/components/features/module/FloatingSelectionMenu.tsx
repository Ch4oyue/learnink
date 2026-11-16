import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StickyNote, Copy, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface FloatingSelectionMenuProps {
    selection: { text: string; top: number; left: number };
    onAddNote: (text: string, comment?: string) => void;
    onClose: () => void;
}

export function FloatingSelectionMenu({ selection, onAddNote, onClose }: FloatingSelectionMenuProps) {
    const { toast } = useToast();
    const [mode, setMode] = useState<"menu" | "note">("menu");
    const [comment, setComment] = useState("");
    const [copied, setCopied] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-focus input when entering note mode
    useEffect(() => {
        if (mode === "note" && inputRef.current) {
            inputRef.current.focus();
        }
    }, [mode]);

    const handleCopy = () => {
        navigator.clipboard.writeText(selection.text);
        setCopied(true);
        toast({ title: "Copied to clipboard" });
        setTimeout(onClose, 1000);
    };

    const handleAddNote = () => {
        onAddNote(selection.text, comment);
        onClose();
    };

    return (
        <div
            className="fixed z-50 animate-in fade-in zoom-in duration-200"
            style={{
                top: selection.top,
                left: selection.left,
                transform: 'translate(-50%, -100%) translateY(-10px)' // Position above selection
            }}
            onMouseDown={(e) => e.stopPropagation()} // Prevent deselection
        >
            <div className="bg-popover/90 backdrop-blur-xl border border-border shadow-xl rounded-2xl p-1.5 flex items-center gap-1 min-w-[120px]">
                {mode === "menu" ? (
                    <>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setMode("note")}
                            className="h-8 px-2 text-xs font-medium hover:bg-primary/10 hover:text-primary rounded-xl"
                        >
                            <StickyNote className="h-3.5 w-3.5 mr-1.5" />
                            Add Note
                        </Button>
                        <div className="w-[1px] h-4 bg-border mx-1" />
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCopy}
                            className="h-8 px-2 text-xs font-medium hover:bg-primary/10 hover:text-primary rounded-xl"
                        >
                            {copied ? <Check className="h-3.5 w-3.5 mr-1.5" /> : <Copy className="h-3.5 w-3.5 mr-1.5" />}
                            {copied ? "Copied" : "Copy"}
                        </Button>
                    </>
                ) : (
                    <div className="flex items-center gap-2 p-1">
                        <Input
                            ref={inputRef}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Add a comment (optional)..."
                            className="h-7 w-48 text-xs border-none bg-transparent focus-visible:ring-0 placeholder:text-muted-foreground/50"
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleAddNote();
                                if (e.key === "Escape") setMode("menu");
                            }}
                        />
                        <Button
                            size="icon"
                            className="h-6 w-6 rounded-full bg-primary text-primary-foreground"
                            onClick={handleAddNote}
                            aria-label="Simpan Catatan"
                        >
                            <Check className="h-3 w-3" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-full text-muted-foreground hover:text-destructive-text"
                            onClick={() => setMode("menu")}
                            aria-label="Batalkan"
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    </div>
                )}
            </div>
            {/* Arrow */}
            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-popover/90 absolute left-1/2 -translate-x-1/2 -bottom-1.5 filter drop-shadow-sm"></div>
        </div>
    );
}
