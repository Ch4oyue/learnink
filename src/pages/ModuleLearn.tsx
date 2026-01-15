import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useModules } from "@/hooks/useModules";
import { useUserProgress, useUpdateProgress } from "@/hooks/useUserProgress";
import { useQuizzes, useQuizQuestionsSafe, Quiz, useUserQuizAttempts } from "@/hooks/useQuiz";
import { useScrollProgress } from "@/hooks/useScrollProgress";
import { useLearningNotes, useCreateLearningNote, useDeleteLearningNote } from "@/hooks/useLearningNotes";
import { QuizPlayer } from "@/components/quiz/QuizPlayer";
import { QuizSection } from "@/components/module/QuizSection";
import { ModuleTOC, extractTOC } from "@/components/module/ModuleTOC";
import { TextSelectionMenu } from "@/components/module/TextSelectionMenu";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  BookOpen,
  ChevronRight,
  Menu,
  StickyNote,
  Search,
  LayoutDashboard,
  Settings,
  Clock,
  PlusCircle,
  FileText,
  ArrowUp,
  X,
  Check,
  Loader2,
  GraduationCap,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { LearningNote } from "@/hooks/useLearningNotes";

/**
 * ModuleLearn - Total System Repair
 * ==================================
 * FASE 3: Hybrid Module Interface
 * 
 * STRUCTURE (from variant_2):
 * ┌───────────────────────────────────────────────────────────────────┐
 * │                    HEADER (60px, progress bar)                     │
 * ├───────┬─────────────────────────────────────┬─────────────────────┤
 * │ NAV   │           CONTENT                   │      NOTES          │
 * │ 72px  │         800px max                   │      360px          │
 * │ Rail  │         scrollable                  │      sticky input   │
 * └───────┴─────────────────────────────────────┴─────────────────────┘
 * 
 * AESTHETICS (from dark_mode):
 * - Background: #09090b (Zinc 950)
 * - Surface: #18181b (Zinc 900)
 * - Border: #27272a (Zinc 800)
 * - Primary: #6366f1 (Indigo 500)
 * - Text: #e4e4e7 (Zinc 200)
 */

export default function ModuleLearn() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, role, profile } = useAuth();
  const { toast } = useToast();

  // Data hooks
  const { data: modules, isLoading: modulesLoading } = useModules(true);
  const { data: userProgress, refetch: refetchProgress } = useUserProgress(user?.id);
  const updateProgress = useUpdateProgress();

  // Quiz state
  const { data: quizzes, isLoading: quizzesLoading, refetch: refetchQuizzes } = useQuizzes(id);
  const { data: userQuizAttempts } = useUserQuizAttempts(user?.id);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const { data: quizQuestions } = useQuizQuestionsSafe(selectedQuiz?.id);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [showQuizPlayer, setShowQuizPlayer] = useState(false);

  // Notes state
  const { data: notes, isLoading: notesLoading } = useLearningNotes(user?.id, id);
  const createNote = useCreateLearningNote();
  const deleteNote = useDeleteLearningNote();
  const [newNoteText, setNewNoteText] = useState("");

  // Text selection state
  const [selectedText, setSelectedText] = useState("");
  const [selectionPosition, setSelectionPosition] = useState<{ x: number; y: number } | null>(null);

  // Mobile sheet state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileNotesOpen, setMobileNotesOpen] = useState(false);

  // Content ref for scroll tracking
  const contentRef = useRef<HTMLElement>(null);

  // Derived state
  const module = modules?.find(m => m.id === id);
  const progress = userProgress?.find(p => p.module_id === id);
  const canManageQuiz = role === 'tutor' || role === 'admin';
  const currentProgress = progress?.progress_percent || 0;
  const isCompleted = progress?.is_completed || false;
  const tocItems = module?.content ? extractTOC(module.content) : [];
  const userName = profile?.full_name || user?.email?.split('@')[0] || 'User';
  const userInitials = userName.slice(0, 2).toUpperCase();

  // Disable right-click
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  // Handle text selection
  useEffect(() => {
    const handleMouseUp = () => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();
      if (text && text.length > 0) {
        const range = selection?.getRangeAt(0);
        const rect = range?.getBoundingClientRect();
        if (rect) {
          setSelectedText(text);
          setSelectionPosition({ x: rect.left + rect.width / 2, y: rect.top - 10 });
        }
      } else {
        setSelectedText("");
        setSelectionPosition(null);
      }
    };
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, []);

  // Scroll progress tracking
  const handleScrollProgressChange = useCallback((scrollProgress: number) => {
    if (!user || !id || isCompleted) return;
    const maxScrollProgress = 80;
    const newProgress = Math.min(scrollProgress, maxScrollProgress);
    if (newProgress > currentProgress) {
      updateProgress.mutate({
        userId: user.id,
        moduleId: id,
        progressPercent: newProgress,
        isCompleted: false,
      }, { onSuccess: () => refetchProgress() });
    }
  }, [user, id, currentProgress, isCompleted, updateProgress, refetchProgress]);

  const { setInitialProgress } = useScrollProgress({
    contentRef,
    onProgressChange: handleScrollProgressChange,
    debounceMs: 1000,
  });

  useEffect(() => {
    if (currentProgress > 0) setInitialProgress(currentProgress);
  }, [currentProgress, setInitialProgress]);

  // Quiz handlers
  const handleGenerateQuiz = async () => {
    if (!id) return;
    setIsGeneratingQuiz(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-quiz', {
        body: { moduleId: id, questionCount: 5 }
      });
      if (error) throw error;
      if (data.success) {
        toast({ title: "Kuis Berhasil Dibuat", description: `${data.quiz.questions_count} soal telah dibuat.` });
        refetchQuizzes();
      } else throw new Error(data.error || "Gagal membuat kuis");
    } catch (error: any) {
      toast({ title: "Gagal Membuat Kuis", description: error.message, variant: "destructive" });
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleStartQuiz = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setShowQuizPlayer(true);
  };

  const handleQuizComplete = (attempt?: { passed?: boolean; percentage?: number }) => {
    setShowQuizPlayer(false);
    setSelectedQuiz(null);
    if (user && id && attempt) {
      const quizBonus = attempt.passed ? 20 : 10;
      const newProgress = Math.min(100, currentProgress + quizBonus);
      updateProgress.mutate({
        userId: user.id,
        moduleId: id,
        progressPercent: newProgress,
        isCompleted: attempt.passed && newProgress >= 90,
      }, { onSuccess: () => refetchProgress() });
    }
  };

  // Note handlers
  const handleCopyText = () => {
    if (selectedText) {
      navigator.clipboard.writeText(selectedText);
      toast({ title: "Disalin!", description: "Teks berhasil disalin ke clipboard." });
      setSelectedText("");
      setSelectionPosition(null);
    }
  };

  const handleCreateNote = () => {
    if (selectedText && user && id) {
      createNote.mutate({
        user_id: user.id,
        module_id: id,
        content: selectedText,
        highlighted_text: selectedText,
      }, { onSuccess: () => toast({ title: "Catatan Dibuat!" }) });
      setSelectedText("");
      setSelectionPosition(null);
    }
  };

  const handleCreateCustomNote = () => {
    if (newNoteText.trim() && user && id) {
      createNote.mutate({
        user_id: user.id,
        module_id: id,
        content: newNoteText.trim(),
        highlighted_text: null,
      }, {
        onSuccess: () => {
          toast({ title: "Catatan Dibuat!" });
          setNewNoteText("");
        }
      });
    }
  };

  const handleDeleteNote = (noteId: string) => deleteNote.mutate(noteId);

  // Redirect checks
  useEffect(() => {
    if (modulesLoading) return;
    if (!user) { navigate(`/module/${id}`); return; }
    const hasProgress = userProgress?.some(p => p.module_id === id);
    if (userProgress !== undefined && !hasProgress) navigate(`/module/${id}`);
  }, [user, modulesLoading, id, navigate, userProgress]);

  // Loading state
  if (modulesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse space-y-4 max-w-2xl w-full mx-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-64 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  // Not found state
  if (!module) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center py-16">
          <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Modul Tidak Ditemukan</h1>
          <p className="text-muted-foreground mb-6">Modul yang Anda cari tidak ada.</p>
          <Button onClick={() => navigate('/modules')}>Kembali ke Daftar Modul</Button>
        </div>
      </div>
    );
  }

  // ============================================
  // MAIN RENDER - Hybrid 3-Column Layout
  // ============================================

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-background text-foreground font-sans antialiased selection:bg-primary/20 selection:text-primary">
      {/* TOP HEADER - 60px */}
      <header className="h-[60px] flex items-center justify-between px-6 border-b border-border bg-card/80 backdrop-blur-sm relative shrink-0 z-30">
        {/* Progress Bar at top edge */}
        <div className="absolute top-0 left-0 w-full h-[3px] bg-muted">
          <div
            className="h-full bg-primary transition-all duration-1000 ease-out shadow-glow"
            style={{ width: `${currentProgress}%` }}
          />
        </div>

        {/* Left: Breadcrumb */}
        <div className="flex items-center gap-4">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0 bg-card border-border">
              <SheetHeader className="p-4 border-b border-border">
                <SheetTitle>Table of Contents</SheetTitle>
              </SheetHeader>
              <div className="p-4">
                {tocItems.length > 0 ? (
                  <div onClick={() => setMobileMenuOpen(false)}>
                    <ModuleTOC items={tocItems} className="w-full" />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No table of contents</p>
                )}
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground font-medium">Course</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
            <span className="text-foreground font-bold tracking-tight line-clamp-1">
              {module.title}
            </span>
          </div>
        </div>

        {/* Right: Status & Profile */}
        <div className="flex items-center gap-6">
          <Sheet open={mobileNotesOpen} onOpenChange={setMobileNotesOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <StickyNote className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 p-0 bg-card border-border">
              <NotesPanel
                notes={notes || []}
                isLoading={notesLoading}
                newNoteText={newNoteText}
                setNewNoteText={setNewNoteText}
                onCreateNote={handleCreateCustomNote}
                onDeleteNote={handleDeleteNote}
                isCreating={createNote.isPending}
                isDeleting={deleteNote.isPending}
              />
            </SheetContent>
          </Sheet>

          <div className="hidden sm:flex flex-col items-end">
            <span className="text-xs font-bold text-primary tracking-wide">
              {currentProgress}% COMPLETE
            </span>
          </div>
          <div className="hidden sm:block h-8 w-[1px] bg-border" />
          <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
            <span className="text-sm font-semibold hidden sm:block">{userName}</span>
            <Avatar className="h-9 w-9 ring-2 ring-background shadow-sm">
              <AvatarImage src={profile?.avatar_url || undefined} alt={userName} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                {userInitials}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* Text Selection Menu */}
      {selectionPosition && selectedText && (
        <TextSelectionMenu
          position={selectionPosition}
          onCopy={handleCopyText}
          onCreateNote={handleCreateNote}
          isCreating={createNote.isPending}
        />
      )}

      {/* MAIN 3-COLUMN LAYOUT */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* LEFT NAV RAIL - 72px */}
        <aside className="w-[72px] border-r border-border bg-sidebar flex-col items-center py-6 gap-8 shrink-0 z-20 hidden lg:flex">
          <div className="size-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-lg mb-2">
            <GraduationCap className="h-4 w-4" />
          </div>
          <div className="flex flex-col gap-4 w-full px-3">
            <NavButton icon={<BookOpen className="h-5 w-5" />} label="Table of Contents" onClick={() => setMobileMenuOpen(true)} />
            <NavButton icon={<Search className="h-5 w-5" />} label="Search" />
            <NavButton icon={<LayoutDashboard className="h-5 w-5" />} label="Dashboard" onClick={() => navigate('/dashboard')} isActive />
          </div>
          <div className="mt-auto px-3 w-full">
            <NavButton icon={<Settings className="h-5 w-5" />} label="Settings" onClick={() => navigate('/dashboard/settings')} />
          </div>
        </aside>

        {/* RESIZABLE PANELS */}
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          {/* CENTER CONTENT */}
          <ResizablePanel defaultSize={65} minSize={40}>
            <main
              ref={contentRef}
              className="h-full overflow-y-auto scroll-smooth bg-background"
            >
              <div className="max-w-[800px] mx-auto py-16 px-10 flex flex-col gap-10">
                {/* Title Block */}
                <div className="group relative">
                  <div className="mb-4 flex items-center gap-3">
                    {module.category && (
                      <Badge variant="secondary" className="text-xs font-bold uppercase tracking-wider">
                        {module.category}
                      </Badge>
                    )}
                    {module.content && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
                        <Clock className="h-3.5 w-3.5" />
                        {Math.ceil(module.content.split(' ').length / 200)} min read
                      </span>
                    )}
                  </div>
                  <h1 className="text-5xl font-black tracking-tighter leading-[1.1] text-foreground mb-4">
                    {module.title}
                  </h1>
                  {module.description && (
                    <p className="text-xl text-muted-foreground font-light">
                      {module.description}
                    </p>
                  )}
                </div>

                {/* Content */}
                {module.content ? (
                  <div className="reading-content text-foreground">
                    <MarkdownRenderer content={module.content} />
                  </div>
                ) : (
                  <p className="text-muted-foreground">Konten modul belum tersedia.</p>
                )}

                {/* End divider */}
                <div className="h-32 w-full flex items-center justify-center">
                  <div className="h-[1px] w-24 bg-border" />
                  <span className="mx-4 text-muted-foreground text-sm font-medium tracking-widest uppercase">
                    End of Section
                  </span>
                  <div className="h-[1px] w-24 bg-border" />
                </div>

                {/* Quiz Section */}
                <QuizSection
                  quizzes={quizzes}
                  isLoading={quizzesLoading}
                  canManageQuiz={canManageQuiz}
                  isGenerating={isGeneratingQuiz}
                  onGenerateQuiz={handleGenerateQuiz}
                  onStartQuiz={handleStartQuiz}
                />
              </div>
            </main>
          </ResizablePanel>

          <ResizableHandle withHandle className="hidden lg:flex" />

          {/* RIGHT NOTES PANEL - 360px target */}
          <ResizablePanel defaultSize={35} minSize={25} maxSize={50} className="hidden lg:block">
            <NotesPanel
              notes={notes || []}
              isLoading={notesLoading}
              newNoteText={newNoteText}
              setNewNoteText={setNewNoteText}
              onCreateNote={handleCreateCustomNote}
              onDeleteNote={handleDeleteNote}
              isCreating={createNote.isPending}
              isDeleting={deleteNote.isPending}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Quiz Player Dialog */}
      <Dialog open={showQuizPlayer} onOpenChange={(open) => !open && handleQuizComplete()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-border">
          <DialogHeader>
            <DialogTitle>{selectedQuiz?.title}</DialogTitle>
            <DialogDescription>{selectedQuiz?.description}</DialogDescription>
          </DialogHeader>
          {selectedQuiz && quizQuestions && quizQuestions.length > 0 && (
            <QuizPlayer
              quiz={selectedQuiz}
              questions={quizQuestions}
              onComplete={handleQuizComplete}
              onCancel={() => handleQuizComplete()}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================

interface NavButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  isActive?: boolean;
}

function NavButton({ icon, label, onClick, isActive }: NavButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className={cn(
            "w-full aspect-square flex items-center justify-center rounded-xl transition-all",
            isActive
              ? "text-primary bg-primary/10 shadow-inner"
              : "text-muted-foreground hover:text-primary hover:bg-primary/5"
          )}
        >
          {icon}
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={10}>
        <p className="text-xs font-bold">{label}</p>
      </TooltipContent>
    </Tooltip>
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
  isDeleting: boolean;
}

function NotesPanel({
  notes,
  isLoading,
  newNoteText,
  setNewNoteText,
  onCreateNote,
  onDeleteNote,
  isCreating,
  isDeleting,
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
      <div className="px-6 py-5 border-b border-border flex justify-between items-center bg-sidebar/90 backdrop-blur sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-card rounded-md shadow-sm">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <h2 className="font-bold text-foreground text-lg tracking-tight">Guided Notes</h2>
        </div>
        <Button variant="outline" size="sm" className="text-[11px] font-bold text-primary rounded-full">
          Export PDF
        </Button>
      </div>

      {/* Notes List */}
      <ScrollArea className="flex-1 p-6">
        <div className="flex flex-col gap-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">Belum ada catatan</p>
              <p className="text-xs text-muted-foreground mt-1">Pilih teks atau tulis di bawah</p>
            </div>
          ) : (
            notes.map((note) => (
              <NoteCard key={note.id} note={note} onDelete={onDeleteNote} isDeleting={isDeleting} />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-6 bg-sidebar border-t border-border sticky bottom-0">
        <div className="relative group">
          <div className="absolute left-4 top-3.5 text-muted-foreground group-focus-within:text-primary transition-colors">
            <PlusCircle className="h-5 w-5" />
          </div>
          <Textarea
            value={newNoteText}
            onChange={(e) => setNewNoteText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type '/' for commands"
            className="w-full bg-card border-none shadow-subtle rounded-xl py-3.5 pl-12 pr-12 text-sm placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/20 resize-none min-h-[56px]"
          />
          <Button
            size="icon"
            onClick={onCreateNote}
            disabled={!newNoteText.trim() || isCreating}
            className={cn(
              "absolute right-2 top-2 h-8 w-8 rounded-lg shadow-md transition-all",
              newNoteText.trim() ? "opacity-100 scale-100" : "opacity-0 scale-90"
            )}
          >
            {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </aside>
  );
}

interface NoteCardProps {
  note: LearningNote;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

function NoteCard({ note, onDelete, isDeleting }: NoteCardProps) {
  const isHighlighted = !!note.highlighted_text;

  return (
    <div className={cn(
      "bg-card p-5 rounded-2xl border group transition-all duration-300 hover:shadow-md",
      isHighlighted
        ? "border-transparent hover:border-primary/20 shadow-subtle"
        : "border-dashed border-border hover:border-primary/50"
    )}>
      <div className="flex justify-between items-start mb-3">
        {isHighlighted ? (
          <span className="bg-green-500/10 text-green-400 text-[10px] font-extrabold tracking-wider px-2 py-1 rounded-md flex items-center gap-1">
            SAVED <Check className="h-3 w-3" />
          </span>
        ) : (
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">NOTE</span>
        )}
        <button
          onClick={() => onDelete(note.id)}
          disabled={isDeleting}
          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-colors"
        >
          {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
        </button>
      </div>
      {note.highlighted_text && (
        <div className="bg-muted/50 rounded-lg p-3 font-mono text-[11px] text-foreground border border-border/50 leading-relaxed mb-3">
          "{note.highlighted_text}"
        </div>
      )}
      <p className="text-sm text-muted-foreground leading-relaxed">{note.content}</p>
      <div className="mt-3 text-[10px] text-muted-foreground">
        {format(new Date(note.created_at), "dd MMM yyyy, HH:mm", { locale: localeId })}
      </div>
    </div>
  );
}
