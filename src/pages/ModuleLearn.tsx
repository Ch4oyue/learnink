import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useModules } from "@/hooks/useModules";
import { useUserProgress, useUpdateProgress } from "@/hooks/useUserProgress";
import { useQuizzes, useQuizQuestionsSafe, Quiz, useUserQuizAttempts } from "@/hooks/useQuiz";
import { useScrollProgress } from "@/hooks/useScrollProgress";
import { useLearningNotes, useCreateLearningNote, useDeleteLearningNote } from "@/hooks/useLearningNotes";
import { QuizPlayer } from "@/components/quiz/QuizPlayer";
import { StickyProgressBar } from "@/components/module/StickyProgressBar";
import { ContentSection } from "@/components/module/ContentSection";
import { QuizSection } from "@/components/module/QuizSection";
import { ModuleTOC, extractTOC } from "@/components/module/ModuleTOC";
import { LearningNotesSidebar } from "@/components/module/LearningNotesSidebar";
import { TextSelectionMenu } from "@/components/module/TextSelectionMenu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { BookOpen, ArrowLeft, CheckCircle2, List, StickyNote, Loader2, Menu, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function ModuleLearn() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, role } = useAuth();
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

  // Sticky progress bar state
  const [showStickyProgress, setShowStickyProgress] = useState(false);

  // Mobile TOC sheet state
  const [mobileTocOpen, setMobileTocOpen] = useState(false);

  // Custom note creation state
  const [showCustomNoteInput, setShowCustomNoteInput] = useState(false);
  const [customNoteText, setCustomNoteText] = useState("");

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

  useEffect(() => {
    const handleScroll = () => {
      setShowStickyProgress(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleMarkComplete = () => {
    if (!user || !id || !hasPassedQuiz) {
      toast({
        title: "Selesaikan Quiz Terlebih Dahulu",
        description: "Anda harus lulus quiz sebelum dapat menandai modul sebagai selesai.",
        variant: "destructive",
      });
      return;
    }

    updateProgress.mutate({
      userId: user.id,
      moduleId: id,
      progressPercent: 100,
      isCompleted: true,
    }, {
      onSuccess: () => {
        toast({
          title: "Selamat! 🎉",
          description: "Modul berhasil ditandai sebagai selesai.",
        });
        refetchProgress();
      }
    });
  };

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

  const handleDeleteNote = (noteId: string) => {
    deleteNote.mutate(noteId);
  };

  // Handle custom note creation (user types their own note)
  const handleCreateCustomNote = () => {
    if (customNoteText.trim() && user && id) {
      createNote.mutate({
        user_id: user.id,
        module_id: id,
        content: customNoteText.trim(),
        highlighted_text: null,
      }, {
        onSuccess: () => {
          toast({
            title: "Catatan Dibuat!",
            description: "Catatan Anda berhasil disimpan.",
          });
          setCustomNoteText("");
          setShowCustomNoteInput(false);
        }
      });
    }
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
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Daftar Modul
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background reading-mode">
      {/* Floating Header - Back button + Mobile TOC */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/modules')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Kembali</span>
          </Button>

          <div className="flex items-center gap-2">
            {/* Mobile TOC Button */}
            <Sheet open={mobileTocOpen} onOpenChange={setMobileTocOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="lg:hidden gap-2">
                  <List className="h-4 w-4" />
                  <span className="hidden sm:inline">Daftar Isi</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SheetHeader>
                  <SheetTitle>Navigasi</SheetTitle>
                </SheetHeader>
                <Tabs defaultValue="toc" className="mt-4">
                  <TabsList className="w-full grid grid-cols-2">
                    <TabsTrigger value="toc" className="gap-1">
                      <List className="h-3 w-3" />
                      <span className="text-xs">Daftar Isi</span>
                    </TabsTrigger>
                    <TabsTrigger value="notes" className="gap-1">
                      <StickyNote className="h-3 w-3" />
                      <span className="text-xs">Catatan</span>
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="toc" className="mt-4">
                    {tocItems.length > 0 ? (
                      <div onClick={() => setMobileTocOpen(false)}>
                        <ModuleTOC items={tocItems} className="w-full" />
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Tidak ada daftar isi</p>
                    )}
                  </TabsContent>
                  <TabsContent value="notes" className="mt-4">
                    {/* Custom note creation */}
                    <div className="mb-4">
                      {showCustomNoteInput ? (
                        <div className="space-y-2">
                          <Input
                            placeholder="Tulis catatan Anda..."
                            value={customNoteText}
                            onChange={(e) => setCustomNoteText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCreateCustomNote()}
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={handleCreateCustomNote} disabled={createNote.isPending}>
                              {createNote.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Simpan'}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setShowCustomNoteInput(false)}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => setShowCustomNoteInput(true)}>
                          <Plus className="h-3 w-3" />
                          Buat Catatan
                        </Button>
                      )}
                    </div>
                    <LearningNotesSidebar
                      notes={notes || []}
                      isLoading={notesLoading}
                      onDelete={handleDeleteNote}
                      isDeleting={deleteNote.isPending}
                    />
                  </TabsContent>
                </Tabs>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Sticky Progress Bar */}
      <StickyProgressBar
        title={module.title}
        progress={currentProgress}
        isVisible={showStickyProgress}
      />

      {/* Text Selection Menu */}
      {selectionPosition && selectedText && (
        <TextSelectionMenu
          position={selectionPosition}
          onCopy={handleCopyText}
          onCreateNote={handleCreateNote}
          isCreating={createNote.isPending}
        />
      )}

      <main className="container mx-auto px-4 py-8 pt-20">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{module.title}</h1>
              <p className="text-muted-foreground mt-1">
                Progress: {currentProgress}% {isCompleted && <span className="text-success">(Selesai)</span>}
              </p>
            </div>

            {/* Mark Complete Button - Only show if quiz passed */}
            {!isCompleted && hasPassedQuiz && (
              <Button
                onClick={handleMarkComplete}
                disabled={updateProgress.isPending}
                className="gap-2"
              >
                {updateProgress.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Tandai Selesai
              </Button>
            )}

            {!isCompleted && !hasPassedQuiz && quizzes && quizzes.length > 0 && (
              <p className="text-sm text-muted-foreground italic">
                Selesaikan quiz untuk dapat menandai modul sebagai selesai
              </p>
            )}
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="flex gap-8">
          {/* Sidebar - TOC + Notes (Desktop) */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24">
              <Tabs defaultValue="toc" className="w-full">
                <TabsList className="w-full grid grid-cols-2">
                  <TabsTrigger value="toc" className="gap-1">
                    <List className="h-3 w-3" />
                    <span className="text-xs">Daftar Isi</span>
                  </TabsTrigger>
                  <TabsTrigger value="notes" className="gap-1">
                    <StickyNote className="h-3 w-3" />
                    <span className="text-xs">Catatan</span>
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="toc" className="mt-4">
                  {tocItems.length > 0 ? (
                    <ModuleTOC items={tocItems} className="w-full" />
                  ) : (
                    <p className="text-sm text-muted-foreground">Tidak ada daftar isi</p>
                  )}
                </TabsContent>
                <TabsContent value="notes" className="mt-4">
                  {/* Custom note creation */}
                  <div className="mb-4">
                    {showCustomNoteInput ? (
                      <div className="space-y-2">
                        <Input
                          placeholder="Tulis catatan Anda..."
                          value={customNoteText}
                          onChange={(e) => setCustomNoteText(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleCreateCustomNote()}
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleCreateCustomNote} disabled={createNote.isPending}>
                            {createNote.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Simpan'}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setShowCustomNoteInput(false)}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => setShowCustomNoteInput(true)}>
                        <Plus className="h-3 w-3" />
                        Buat Catatan
                      </Button>
                    )}
                  </div>
                  <LearningNotesSidebar
                    notes={notes || []}
                    isLoading={notesLoading}
                    onDelete={handleDeleteNote}
                    isDeleting={deleteNote.isPending}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0 space-y-8">
            {/* Learning Content */}
            <ContentSection
              ref={contentRef}
              content={module.content}
              isLocked={false}
              isAuthenticated={true}
            />

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
        </div>
      </main>

      {/* Quiz Player Dialog */}
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
    </div>
  );
}
