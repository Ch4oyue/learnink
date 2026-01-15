import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useModules } from "@/hooks/useModules";
import { useUserProgress, useUpdateProgress } from "@/hooks/useUserProgress";
import { useLearningNotes, useCreateLearningNote, useDeleteLearningNote } from "@/hooks/useLearningNotes";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Menu,
  StickyNote,
  Check,
  Loader2,
  ArrowLeft,
  FileText,
  X,
  ArrowUp,
  PlusCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { LearningNote } from "@/hooks/useLearningNotes";

/**
 * ModuleLearn - Redesigned for Reading Focus
 * ==========================================
 * Layout: 3-Panel Hybrid with react-resizable-panels
 * - Left (20%): Table of Contents / Section Navigation
 * - Center (55%): Main Reading Area with prose styling
 * - Right (25%): Guided Notes Panel
 */

// ============================================
// TYPES
// ============================================

interface TOCItem {
  id: string;
  title: string;
  level: number;
}

// ============================================
// HELPER: Extract TOC from Markdown
// ============================================

function extractTOCFromContent(content: string): TOCItem[] {
  const headingRegex = /^(#{1,3})\s+(.+)$/gm;
  const items: TOCItem[] = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const title = match[2].trim();
    const id = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");
    items.push({ id, title, level });
  }

  return items;
}

function extractSectionContent(content: string, sectionId: string, allSections: TOCItem[]): string {
  const lines = content.split("\n");
  const sectionIndex = allSections.findIndex((s) => s.id === sectionId);

  if (sectionIndex === -1) return content;

  const currentSection = allSections[sectionIndex];
  const nextSection = allSections[sectionIndex + 1];

  // Find start line
  const startPattern = new RegExp(`^#{${currentSection.level}}\\s+${currentSection.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, "i");
  let startLine = 0;
  for (let i = 0; i < lines.length; i++) {
    if (startPattern.test(lines[i])) {
      startLine = i;
      break;
    }
  }

  // Find end line
  let endLine = lines.length;
  if (nextSection) {
    const endPattern = new RegExp(`^#{${nextSection.level}}\\s+${nextSection.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, "i");
    for (let i = startLine + 1; i < lines.length; i++) {
      if (endPattern.test(lines[i])) {
        endLine = i;
        break;
      }
    }
  }

  return lines.slice(startLine, endLine).join("\n");
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function ModuleLearn() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const contentRef = useRef<HTMLDivElement>(null);

  // Data hooks
  const { data: modules, isLoading: modulesLoading } = useModules(true);
  const { data: userProgress, refetch: refetchProgress } = useUserProgress(user?.id);
  const updateProgress = useUpdateProgress();

  // Notes hooks
  const { data: notes, isLoading: notesLoading } = useLearningNotes(user?.id, moduleId);
  const createNote = useCreateLearningNote();
  const deleteNote = useDeleteLearningNote();
  const [newNoteText, setNewNoteText] = useState("");

  // UI State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileNotesOpen, setMobileNotesOpen] = useState(false);
  const [currentSectionId, setCurrentSectionId] = useState<string | null>(null);

  // Derived state
  const module = modules?.find((m) => m.id === moduleId);
  const progress = userProgress?.find((p) => p.module_id === moduleId);
  const currentProgress = progress?.progress_percent || 0;

  // Extract TOC from content
  const tocItems = useMemo(() => {
    if (!module?.content) return [];
    return extractTOCFromContent(module.content);
  }, [module?.content]);

  // Get current section content
  const currentContent = useMemo(() => {
    if (!module?.content) return "";
    if (!currentSectionId || tocItems.length === 0) return module.content;
    return extractSectionContent(module.content, currentSectionId, tocItems);
  }, [module?.content, currentSectionId, tocItems]);

  // Navigation helpers
  const currentSectionIndex = tocItems.findIndex((item) => item.id === currentSectionId);
  const hasPrevious = currentSectionIndex > 0;
  const hasNext = currentSectionIndex < tocItems.length - 1 && currentSectionIndex >= 0;

  // Set initial section
  useEffect(() => {
    if (tocItems.length > 0 && !currentSectionId) {
      setCurrentSectionId(tocItems[0].id);
    }
  }, [tocItems, currentSectionId]);

  // Scroll to top when section changes
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentSectionId]);

  // Update progress when changing sections
  useEffect(() => {
    if (!user || !moduleId || tocItems.length === 0 || currentSectionIndex < 0) return;

    const newProgress = Math.round(((currentSectionIndex + 1) / tocItems.length) * 100);
    if (newProgress > currentProgress) {
      updateProgress.mutate(
        {
          userId: user.id,
          moduleId: moduleId,
          progressPercent: Math.min(newProgress, 100),
          isCompleted: newProgress >= 100,
        },
        { onSuccess: () => refetchProgress() }
      );
    }
  }, [currentSectionIndex, tocItems.length, user, moduleId, currentProgress]);

  // Navigation handlers
  const handlePrevious = () => {
    if (hasPrevious) {
      setCurrentSectionId(tocItems[currentSectionIndex - 1].id);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      setCurrentSectionId(tocItems[currentSectionIndex + 1].id);
    }
  };

  const handleSectionClick = (sectionId: string) => {
    setCurrentSectionId(sectionId);
    setMobileMenuOpen(false);
  };

  // Note handlers
  const handleCreateNote = () => {
    if (newNoteText.trim() && user && moduleId) {
      createNote.mutate(
        {
          user_id: user.id,
          module_id: moduleId,
          content: newNoteText.trim(),
          highlighted_text: null,
        },
        {
          onSuccess: () => {
            toast({ title: "Note Created!" });
            setNewNoteText("");
          },
        }
      );
    }
  };

  const handleDeleteNote = (noteId: string) => {
    deleteNote.mutate(noteId);
  };

  // ============================================
  // LOADING STATE
  // ============================================

  if (modulesLoading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading module...</p>
        </div>
      </div>
    );
  }

  // ============================================
  // NOT FOUND STATE
  // ============================================

  if (!module) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center py-16">
          <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Module Not Found</h1>
          <p className="text-muted-foreground mb-6">The module you're looking for doesn't exist.</p>
          <Button onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  // ============================================
  // MAIN RENDER
  // ============================================

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-background text-foreground">
      {/* TOP HEADER */}
      <header className="h-14 flex items-center justify-between px-4 border-b border-border bg-card shrink-0 z-30">
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-muted">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${currentProgress}%` }}
          />
        </div>

        {/* Left: Back + Title */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          {/* Mobile TOC Trigger */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0 bg-card">
              <SheetHeader className="p-4 border-b border-border">
                <SheetTitle>Table of Contents</SheetTitle>
              </SheetHeader>
              <TOCSidebar
                items={tocItems}
                currentSectionId={currentSectionId}
                onSectionClick={handleSectionClick}
                moduleTitle={module.title}
                progress={currentProgress}
              />
            </SheetContent>
          </Sheet>

          <div className="hidden sm:block">
            <h1 className="font-semibold text-sm line-clamp-1">{module.title}</h1>
            <p className="text-xs text-muted-foreground">
              {currentSectionIndex + 1} of {tocItems.length || 1} sections
            </p>
          </div>
        </div>

        {/* Right: Progress + Notes Toggle */}
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="hidden sm:flex">
            {currentProgress}% Complete
          </Badge>

          {/* Mobile Notes Trigger */}
          <Sheet open={mobileNotesOpen} onOpenChange={setMobileNotesOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <StickyNote className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 p-0 bg-card">
              <NotesPanel
                notes={notes || []}
                isLoading={notesLoading}
                newNoteText={newNoteText}
                setNewNoteText={setNewNoteText}
                onCreateNote={handleCreateNote}
                onDeleteNote={handleDeleteNote}
                isCreating={createNote.isPending}
              />
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* MAIN 3-PANEL LAYOUT */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* LEFT: TOC Sidebar (20%) */}
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="hidden lg:block">
          <TOCSidebar
            items={tocItems}
            currentSectionId={currentSectionId}
            onSectionClick={handleSectionClick}
            moduleTitle={module.title}
            progress={currentProgress}
          />
        </ResizablePanel>

        <ResizableHandle withHandle className="hidden lg:flex" />

        {/* CENTER: Main Content (55%) */}
        <ResizablePanel defaultSize={55} minSize={40}>
          <div ref={contentRef} className="h-full overflow-y-auto">
            {/* Content Area with Prose Styling */}
            <div className="max-w-3xl mx-auto py-8 px-6 lg:px-10">
              {/* Section Title */}
              {currentSectionId && tocItems.length > 0 && (
                <div className="mb-6">
                  <Badge variant="secondary" className="mb-2">
                    Section {currentSectionIndex + 1} of {tocItems.length}
                  </Badge>
                </div>
              )}

              {/* Markdown Content */}
              {module.content ? (
                <div className="prose prose-invert max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-p:text-muted-foreground prose-p:leading-relaxed prose-a:text-primary prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-card prose-pre:border prose-pre:border-border">
                  <MarkdownRenderer content={currentContent} />
                </div>
              ) : (
                <div className="text-center py-16">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No content available for this module.</p>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between mt-12 pt-8 border-t border-border">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={!hasPrevious}
                  className="gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                {hasNext ? (
                  <Button onClick={handleNext} className="gap-2">
                    Next Section
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={() => navigate("/dashboard")}
                    className="gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <Check className="h-4 w-4" />
                    Complete Module
                  </Button>
                )}
              </div>
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle className="hidden lg:flex" />

        {/* RIGHT: Notes Panel (25%) */}
        <ResizablePanel defaultSize={25} minSize={20} maxSize={35} className="hidden lg:block">
          <NotesPanel
            notes={notes || []}
            isLoading={notesLoading}
            newNoteText={newNoteText}
            setNewNoteText={setNewNoteText}
            onCreateNote={handleCreateNote}
            onDeleteNote={handleDeleteNote}
            isCreating={createNote.isPending}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================

interface TOCSidebarProps {
  items: TOCItem[];
  currentSectionId: string | null;
  onSectionClick: (id: string) => void;
  moduleTitle: string;
  progress: number;
}

function TOCSidebar({ items, currentSectionId, onSectionClick, moduleTitle, progress }: TOCSidebarProps) {
  return (
    <aside className="h-full bg-sidebar flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="font-bold text-foreground mb-2 line-clamp-2">{moduleTitle}</h2>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">{progress}% complete</p>
      </div>

      {/* TOC List */}
      <ScrollArea className="flex-1 p-3">
        <nav className="space-y-1">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground p-2">No sections available</p>
          ) : (
            items.map((item, index) => {
              const isActive = item.id === currentSectionId;
              const isCompleted = currentSectionId
                ? items.findIndex((i) => i.id === currentSectionId) > index
                : false;

              return (
                <button
                  key={item.id}
                  onClick={() => onSectionClick(item.id)}
                  className={cn(
                    "w-full text-left p-2.5 rounded-lg transition-all flex items-start gap-2 text-sm",
                    isActive
                      ? "bg-primary/10 text-primary border-l-2 border-primary"
                      : isCompleted
                        ? "text-muted-foreground hover:bg-muted"
                        : "text-foreground hover:bg-muted",
                    item.level === 2 && "pl-4",
                    item.level === 3 && "pl-6"
                  )}
                >
                  <span
                    className={cn(
                      "shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium mt-0.5",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : isCompleted
                          ? "bg-green-500/20 text-green-400"
                          : "bg-muted text-muted-foreground"
                    )}
                  >
                    {isCompleted ? <Check className="h-3 w-3" /> : index + 1}
                  </span>
                  <span className="line-clamp-2">{item.title}</span>
                </button>
              );
            })
          )}
        </nav>
      </ScrollArea>
    </aside>
  );
}

interface NotesPanelProps {
  notes: LearningNote[];
  isLoading: boolean;
  newNoteText: string;
  setNewNoteText: (text: string) => void;
  onCreateNote: () => void;
  onDeleteNote: (id: string) => void;
  isCreating: boolean;
}

function NotesPanel({
  notes,
  isLoading,
  newNoteText,
  setNewNoteText,
  onCreateNote,
  onDeleteNote,
  isCreating,
}: NotesPanelProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onCreateNote();
    }
  };

  return (
    <aside className="h-full bg-sidebar border-l border-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center gap-2">
        <FileText className="h-5 w-5 text-primary" />
        <h2 className="font-bold text-foreground">Notes</h2>
      </div>

      {/* Notes List */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-8">
              <StickyNote className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No notes yet</p>
              <p className="text-xs text-muted-foreground mt-1">Add your first note below</p>
            </div>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                className="bg-card p-3 rounded-lg border border-border group hover:border-primary/30 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">
                    {note.highlighted_text ? "Highlight" : "Note"}
                  </span>
                  <button
                    onClick={() => onDeleteNote(note.id)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
                {note.highlighted_text && (
                  <p className="text-xs text-primary bg-primary/5 px-2 py-1 rounded mb-2 italic">
                    "{note.highlighted_text}"
                  </p>
                )}
                <p className="text-sm text-foreground">{note.content}</p>
                <p className="text-[10px] text-muted-foreground mt-2">
                  {format(new Date(note.created_at), "dd MMM, HH:mm", { locale: localeId })}
                </p>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="relative">
          <Textarea
            value={newNoteText}
            onChange={(e) => setNewNoteText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a note..."
            className="w-full resize-none min-h-[80px] pr-10 bg-card"
          />
          <Button
            size="icon"
            onClick={onCreateNote}
            disabled={!newNoteText.trim() || isCreating}
            className={cn(
              "absolute right-2 bottom-2 h-7 w-7 transition-all",
              newNoteText.trim() ? "opacity-100" : "opacity-50"
            )}
          >
            {isCreating ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <ArrowUp className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>
    </aside>
  );
}
