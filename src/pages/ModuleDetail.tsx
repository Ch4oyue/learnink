import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useModules } from "@/hooks/useModules";
import { useUserProgress, useUpdateProgress } from "@/hooks/useUserProgress";
import { useQuizzes, useQuizQuestionsSafe, useUserQuizAttempts, Quiz } from "@/hooks/useQuiz";
import { QuizPlayer } from "@/components/quiz/QuizPlayer";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ModuleHeader } from "@/components/module/ModuleHeader";
import { StickyProgressBar } from "@/components/module/StickyProgressBar";
import { ContentSection } from "@/components/module/ContentSection";
import { QuizSection } from "@/components/module/QuizSection";
import { ModuleTOC, extractTOC } from "@/components/module/ModuleTOC";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BookOpen, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function ModuleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const { toast } = useToast();
  
  const { data: modules, isLoading: modulesLoading } = useModules(true);
  const { data: userProgress } = useUserProgress(user?.id);
  const updateProgress = useUpdateProgress();
  
  // Quiz state
  const { data: quizzes, isLoading: quizzesLoading, refetch: refetchQuizzes } = useQuizzes(id);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const { data: quizQuestions } = useQuizQuestionsSafe(selectedQuiz?.id);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [showQuizPlayer, setShowQuizPlayer] = useState(false);
  
  // Sticky progress bar state
  const [showStickyProgress, setShowStickyProgress] = useState(false);

  const module = modules?.find(m => m.id === id);
  const progress = userProgress?.find(p => p.module_id === id);
  const canManageQuiz = role === 'tutor' || role === 'admin';
  const currentProgress = progress?.progress_percent || 0;
  const isCompleted = progress?.is_completed || false;

  // Extract TOC from content
  const tocItems = module?.content ? extractTOC(module.content) : [];

  // Handle scroll for sticky progress bar
  useEffect(() => {
    const handleScroll = () => {
      setShowStickyProgress(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToContent = () => {
    document.getElementById('learning-content')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  };

  const handleStartLearning = () => {
    if (!user || !id) return;
    
    updateProgress.mutate({
      userId: user.id,
      moduleId: id,
      progressPercent: progress?.progress_percent || 10,
      isCompleted: false,
    });
    
    // Scroll to content after starting
    setTimeout(scrollToContent, 100);
  };

  const handleContinueLearning = () => {
    scrollToContent();
  };

  const handleMarkComplete = () => {
    if (!user || !id) return;
    
    updateProgress.mutate({
      userId: user.id,
      moduleId: id,
      progressPercent: 100,
      isCompleted: true,
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

  const handleQuizComplete = () => {
    setShowQuizPlayer(false);
    setSelectedQuiz(null);
  };

  if (modulesLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="h-64 bg-muted rounded-xl" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!module) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
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
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Sticky Progress Bar */}
      <StickyProgressBar
        title={module.title}
        progress={currentProgress}
        isVisible={showStickyProgress && !!user}
      />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header with compact progress */}
        <div className="mb-8">
          <ModuleHeader
            module={module}
            currentProgress={currentProgress}
            isCompleted={isCompleted}
            onStartLearning={handleStartLearning}
            onContinue={handleContinueLearning}
            onMarkComplete={handleMarkComplete}
            isUpdating={updateProgress.isPending}
            onBack={() => navigate(-1)}
          />
        </div>

        {/* Main Content Layout */}
        <div className="flex gap-8">
          {/* TOC Sidebar - Desktop only */}
          {tocItems.length > 0 && (
            <ModuleTOC
              items={tocItems}
              className="hidden lg:block w-56 flex-shrink-0"
            />
          )}

          {/* Main Content Area */}
          <div className="flex-1 min-w-0 space-y-8">
            {/* 1. Learning Content (FIRST - Most Important) */}
            <ContentSection content={module.content} />

            {/* 2. Quiz Section (AFTER content) */}
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

      <Footer />

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
              onCancel={handleQuizComplete}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
