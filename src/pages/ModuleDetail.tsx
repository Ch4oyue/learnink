import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useModules } from "@/hooks/useModules";
import { useUserProgress, useUpdateProgress } from "@/hooks/useUserProgress";
import { useQuizzes, useQuizQuestionsSafe, useUserQuizAttempts, Quiz } from "@/hooks/useQuiz";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { QuizPlayer } from "@/components/quiz/QuizPlayer";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  ArrowLeft, 
  BookOpen, 
  Clock, 
  Trophy,
  CheckCircle,
  Play,
  BarChart3,
  FileQuestion,
  Sparkles,
  Loader2,
  Timer,
  Target,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const levelColors: Record<string, string> = {
  Pemula: 'bg-green-500/10 text-green-600',
  Menengah: 'bg-amber-500/10 text-amber-600',
  Lanjutan: 'bg-red-500/10 text-red-600',
};

const categoryColors: Record<string, string> = {
  Umum: 'bg-primary/10 text-primary',
  Matematika: 'bg-blue-500/10 text-blue-600',
  Sains: 'bg-emerald-500/10 text-emerald-600',
  Bahasa: 'bg-purple-500/10 text-purple-600',
  Teknologi: 'bg-cyan-500/10 text-cyan-600',
};

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
  const { data: quizAttempts } = useUserQuizAttempts(user?.id, selectedQuiz?.id);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [showQuizPlayer, setShowQuizPlayer] = useState(false);

  const module = modules?.find(m => m.id === id);
  const progress = userProgress?.find(p => p.module_id === id);
  const canManageQuiz = role === 'tutor' || role === 'admin';

  const handleStartLearning = () => {
    if (!user || !id) return;
    
    updateProgress.mutate({
      userId: user.id,
      moduleId: id,
      progressPercent: progress?.progress_percent || 10,
      isCompleted: false,
    });
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

  const handleUpdateProgress = (percent: number) => {
    if (!user || !id) return;
    
    updateProgress.mutate({
      userId: user.id,
      moduleId: id,
      progressPercent: percent,
      isCompleted: percent >= 100,
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

  const level = module.level || 'Pemula';
  const category = module.category || 'Umum';
  const currentProgress = progress?.progress_percent || 0;
  const isCompleted = progress?.is_completed || false;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>

        {/* Header */}
        <div className="bg-card border border-border rounded-2xl p-8 mb-8 shadow-soft">
          <div className="flex flex-wrap gap-3 mb-4">
            <Badge className={levelColors[level]}>
              <BarChart3 className="h-3 w-3 mr-1" />
              {level}
            </Badge>
            <Badge className={categoryColors[category] || categoryColors.Umum}>
              {category}
            </Badge>
            {isCompleted && (
              <Badge className="bg-green-500/10 text-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Selesai
              </Badge>
            )}
          </div>
          
          <h1 className="text-3xl font-bold text-foreground mb-4">
            {module.title}
          </h1>
          
          {module.summary && (
            <p className="text-lg text-muted-foreground mb-6">
              {module.summary}
            </p>
          )}

          {/* Progress Section */}
          {user && (
            <div className="bg-muted/50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-foreground">Progress Belajar</span>
                <span className="text-sm text-muted-foreground">{currentProgress}%</span>
              </div>
              <Progress value={currentProgress} className="h-2 mb-4" />
              
              <div className="flex flex-wrap gap-3">
                {currentProgress === 0 ? (
                  <Button onClick={handleStartLearning} disabled={updateProgress.isPending}>
                    <Play className="h-4 w-4 mr-2" />
                    Mulai Belajar
                  </Button>
                ) : !isCompleted ? (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={() => handleUpdateProgress(Math.min(currentProgress + 25, 100))}
                      disabled={updateProgress.isPending}
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Lanjutkan (+25%)
                    </Button>
                    <Button onClick={handleMarkComplete} disabled={updateProgress.isPending}>
                      <Trophy className="h-4 w-4 mr-2" />
                      Tandai Selesai
                    </Button>
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Anda telah menyelesaikan modul ini!</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {!user && (
            <div className="bg-muted/50 rounded-xl p-6">
              <p className="text-muted-foreground mb-3">
                Masuk untuk melacak progress belajar Anda
              </p>
              <Button asChild>
                <Link to="/auth">Masuk Sekarang</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Quiz Section */}
        <div className="bg-card border border-border rounded-2xl p-8 mb-8 shadow-soft">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <FileQuestion className="h-5 w-5" />
              Kuis Modul
            </h2>
            {canManageQuiz && (
              <Button 
                onClick={handleGenerateQuiz} 
                disabled={isGeneratingQuiz}
                size="sm"
              >
                {isGeneratingQuiz ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Membuat Kuis...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Kuis AI
                  </>
                )}
              </Button>
            )}
          </div>
          
          {quizzesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : quizzes && quizzes.length > 0 ? (
            <div className="space-y-4">
              {quizzes.map((quiz) => (
                <div 
                  key={quiz.id}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-xl"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">{quiz.title}</h3>
                    {quiz.description && (
                      <p className="text-sm text-muted-foreground mt-1">{quiz.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Timer className="h-3 w-3" />
                        {quiz.time_limit_minutes} menit
                      </span>
                      <span className="flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        Lulus: {quiz.passing_score}%
                      </span>
                    </div>
                  </div>
                  {user ? (
                    <Button 
                      onClick={() => handleStartQuiz(quiz)}
                      size="sm"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Mulai Kuis
                    </Button>
                  ) : (
                    <Button asChild size="sm" variant="outline">
                      <Link to="/auth">Login untuk Kuis</Link>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileQuestion className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                {canManageQuiz 
                  ? "Belum ada kuis. Klik 'Generate Kuis AI' untuk membuat kuis otomatis."
                  : "Belum ada kuis tersedia untuk modul ini."
                }
              </p>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-soft">
          <h2 className="text-xl font-semibold text-foreground mb-6 pb-4 border-b border-border">
            Materi Pembelajaran
          </h2>
          
          {module.content ? (
            <MarkdownRenderer content={module.content} />
          ) : (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                Konten modul belum tersedia
              </p>
            </div>
          )}
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
