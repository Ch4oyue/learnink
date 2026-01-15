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
import { NewSidebar } from "@/components/module/NewSidebar";
import { NewContentRenderer } from "@/components/module/NewContentRenderer";
import { NewGuidedNotes } from "@/components/module/NewGuidedNotes";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { BookOpen, ChevronRight, Loader2, Menu, StickyNote } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function ModuleLearn() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, role, profile } = useAuth();
  const { toast } = useToast();

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

  // Text selection state
  const [selectedText, setSelectedText] = useState("");
  const [selectionPosition, setSelectionPosition] = useState<{ x: number; y: number } | null>(null);

  // Mobile sheet state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileNotesOpen, setMobileNotesOpen] = useState(false);

  // Content ref for scroll tracking
  const contentRef = useRef<HTMLElement>(null);

  const module = modules?.find(m => m.id === id);
  const progress = userProgress?.find(p => p.module_id === id);
  const canManageQuiz = role === 'tutor' || role === 'admin';
  const currentProgress = progress?.progress_percent || 0;
  const isCompleted = progress?.is_completed || false;

  // Check if user has passed any quiz for this module
  const hasPassedQuiz = userQuizAttempts?.some(
    attempt => quizzes?.some(q => q.id === attempt.quiz_id) && attempt.passed
  ) || false;

  // Extract TOC from content
  const tocItems = module?.content ? extractTOC(module.content) : [];

  // Disable right-click on learning page
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
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
          setSelectionPosition({
            x: rect.left + rect.width / 2,
            y: rect.top - 10
          });
        }
      } else {
        setSelectedText("");
        setSelectionPosition(null);
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, []);

  // Handle scroll progress update
  const handleScrollProgressChange = useCallback((scrollProgress: number) => {
    if (!user || !id || isCompleted) return;

    const maxScrollProgress = 80;
    const newProgress = Math.min(scrollProgress, maxScrollProgress);

    if (newProgress > currentProgress) {
      updateProgress.mutate(
        {
          userId: user.id,
          moduleId: id,
          progressPercent: newProgress,
          isCompleted: false,
        },
        {
          onSuccess: () => {
            refetchProgress();
          },
        }
      );
    }
  }, [user, id, currentProgress, isCompleted, updateProgress, refetchProgress]);

  const { setInitialProgress } = useScrollProgress({
    contentRef,
    onProgressChange: handleScrollProgressChange,
    debounceMs: 1000,
  });

  useEffect(() => {
    if (currentProgress > 0) {
      setInitialProgress(currentProgress);
    }
  }, [currentProgress, setInitialProgress]);

  const handleGenerateQuiz = async () => {
    if (!id) return;

    setIsGeneratingQuiz(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-quiz', {
        body: { moduleId: id, questionCount: 5 }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Kuis Berhasil Dibuat",
          description: `${data.quiz.questions_count} soal telah dibuat untuk modul ini.`,
        });
        refetchQuizzes();
      } else {
        throw new Error(data.error || "Gagal membuat kuis");
      }
    } catch (error: any) {
      console.error("Error generating quiz:", error);
      toast({
        title: "Gagal Membuat Kuis",
        description: error.message || "Terjadi kesalahan saat membuat kuis.",
        variant: "destructive",
      });
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

      updateProgress.mutate(
        {
          userId: user.id,
          moduleId: id,
          progressPercent: newProgress,
          isCompleted: attempt.passed && newProgress >= 90,
        },
        {
          onSuccess: () => {
            refetchProgress();
          },
        }
      );
    }
  };

  const handleCopyText = () => {
    if (selectedText) {
      navigator.clipboard.writeText(selectedText);
      toast({
        title: "Disalin!",
        description: "Teks berhasil disalin ke clipboard.",
      });
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
      }, {
        onSuccess: () => {
          toast({
            title: "Catatan Dibuat!",
            description: "Teks berhasil disimpan sebagai catatan.",
          });
        }
      });
      setSelectedText("");
      setSelectionPosition(null);
    }
  };

  const handleCreateCustomNote = (content: string) => {
    if (content && user && id) {
      createNote.mutate({
        user_id: user.id,
        module_id: id,
        content: content,
        highlighted_text: null,
      }, {
        onSuccess: () => {
          toast({
            title: "Catatan Dibuat!",
            description: "Catatan Anda berhasil disimpan.",
          });
        }
      });
    }
  };

  const handleDeleteNote = (noteId: string) => {
    deleteNote.mutate(noteId);
  };

  // Redirect if not authenticated or hasn't started learning (no progress record)
  useEffect(() => {
    if (modulesLoading) return;

    if (!user) {
      navigate(`/module/${id}`);
      return;
    }

    // Check if user has started learning (has a progress record for this module)
    const hasProgress = userProgress?.some(p => p.module_id === id);
    if (userProgress !== undefined && !hasProgress) {
      // User hasn't clicked "Mulai Belajar" yet, redirect to overview
      navigate(`/module/${id}`);
    }
  }, [user, modulesLoading, id, navigate, userProgress]);

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

  if (!module) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center py-16">
          <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Modul Tidak Ditemukan</h1>
          <p className="text-muted-foreground mb-6">
            Modul yang Anda cari tidak ada atau belum dipublikasikan.
          </p>
          <Button onClick={() => navigate('/modules')}>
            Kembali ke Daftar Modul
          </Button>
        </div>
      </div>
    );
  }

  const userName = profile?.full_name || user?.email?.split('@')[0] || 'User';
  const userInitials = userName.slice(0, 2).toUpperCase();

  return (
    <div className="h-screen overflow-hidden bg-[#050505] text-zinc-300 font-sans antialiased selection:bg-purple-500/20 selection:text-purple-200">
      {/* Top Header - positioned to the right of sidebar */}
      <header className="fixed top-0 right-0 h-14 border-b border-zinc-800 bg-[#0b0c0e] flex items-center justify-end px-5 z-20 ml-[280px] w-[calc(100%-280px)]">
        {/* Right: Controls */}
        <div className="flex items-center gap-4 text-sm">
          {/* Live Status Pill */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-900/30 border border-green-800">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-green-400 font-medium text-xs">v2.0 Live</span>
          </div>
          <div className="h-5 w-[1px] bg-zinc-800" />

          {/* Progress */}
          <span className="text-xs font-bold text-primary tracking-wide">
            {currentProgress}% COMPLETE
          </span>

          {/* Mobile Menu Button */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden text-zinc-400 hover:text-white">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0 bg-[#111316] border-zinc-800">
              <SheetHeader className="p-4 border-b border-zinc-800">
                <SheetTitle className="text-white">Table of Contents</SheetTitle>
              </SheetHeader>
              <div className="p-4">
                {tocItems.length > 0 ? (
                  <div onClick={() => setMobileMenuOpen(false)}>
                    <ModuleTOC items={tocItems} className="w-full" />
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500">No table of contents</p>
                )}
              </div>
            </SheetContent>
          </Sheet>

          {/* Mobile Notes Button */}
          <Sheet open={mobileNotesOpen} onOpenChange={setMobileNotesOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden text-zinc-400 hover:text-white">
                <StickyNote className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 p-0 bg-[#111316] border-zinc-800">
              <NewGuidedNotes
                notes={notes || []}
                isLoading={notesLoading}
                onCreateNote={handleCreateCustomNote}
                onDeleteNote={handleDeleteNote}
                isCreating={createNote.isPending}
                isDeleting={deleteNote.isPending}
              />
            </SheetContent>
          </Sheet>

          <Avatar
            className="h-8 w-8 ring-2 ring-zinc-800 cursor-pointer"
            onClick={() => navigate('/dashboard/profile')}
          >
            <AvatarImage src={profile?.avatar_url || undefined} alt={userName} />
            <AvatarFallback className="bg-gradient-to-tr from-primary to-purple-500 text-white text-xs font-bold">
              {userInitials}
            </AvatarFallback>
          </Avatar>
        </div>
      </header>

      {/* Main Layout with Fixed Sidebar */}
  <div className="flex h-full overflow-hidden">
    {/* Fixed Left Sidebar (Desktop) */}
    <div className="hidden lg:block">
      <NewSidebar
        courseName={module.title}
        courseProgress={currentProgress}
        totalLessons={10}
        completedLessons={Math.round(currentProgress / 10)}
        lessons={tocItems.map((item, idx) => ({
          id: item.id,
          title: item.title,
          duration: `${Math.floor(Math.random() * 15) + 5} min read`,
          isActive: idx === 0,
          isCompleted: currentProgress > (idx + 1) * 10,
          isLocked: idx > 3 && !hasPassedQuiz,
        }))}
        onSettingsClick={() => navigate('/dashboard/settings')}
      />
    </div>

    {/* Main Content Area - offset by sidebar width */}
    <div className="flex flex-1 overflow-hidden ml-0 lg:ml-[280px] mt-14">
      {/* Text Selection Menu */}
      {selectionPosition && selectedText && (
        <TextSelectionMenu
          position={selectionPosition}
          onCopy={handleCopyText}
          onCreateNote={handleCreateNote}
          isCreating={createNote.isPending}
        />
      )}

      {/* Resizable Panels for Content and Notes */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Center Content Panel */}
        <ResizablePanel defaultSize={100} minSize={50}>
          <div className="h-full overflow-y-auto scroll-smooth">
            <NewContentRenderer
              ref={contentRef}
              content={module.content}
              metadata={{
                title: module.title,
                description: module.description || undefined,
                category: module.category || undefined,
                moduleNumber: 1,
              }}
              isLoading={modulesLoading}
            />

            {/* Quiz Section */}
            <div className="max-w-3xl mx-auto px-8 pb-16">
              <QuizSection
                quizzes={quizzes}
                isLoading={quizzesLoading}
                canManageQuiz={canManageQuiz}
                isGenerating={isGeneratingQuiz}
                onGenerateQuiz={handleGenerateQuiz}
                onStartQuiz={handleStartQuiz}
              />
            </div>
          </div>
        </ResizablePanel>

        {/* Resize Handle */}
        <ResizableHandle withHandle className="hidden lg:flex" />

        {/* Right Notes Panel (Desktop) */}
        <ResizablePanel defaultSize={0} minSize={0} maxSize={40} className="hidden lg:block">
          <NewGuidedNotes
            notes={notes || []}
            isLoading={notesLoading}
            onCreateNote={handleCreateCustomNote}
            onDeleteNote={handleDeleteNote}
            isCreating={createNote.isPending}
            isDeleting={deleteNote.isPending}
            onMarkComplete={() => {
              if (user && id) {
                updateProgress.mutate({
                  userId: user.id,
                  moduleId: id,
                  progressPercent: Math.min(100, currentProgress + 10),
                  isCompleted: currentProgress >= 90,
                });
              }
            }}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  </div>

  {/* Quiz Player Dialog */ }
  <Dialog open={showQuizPlayer} onOpenChange={(open) => !open && handleQuizComplete()}>
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
    </div >
  );
}
