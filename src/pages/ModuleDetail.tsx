import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useModules } from "@/hooks/useModules";
import { useUserProgress, useUpdateProgress } from "@/hooks/useUserProgress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import {
  BookOpen,
  ArrowLeft,
  Play,
  CheckCircle,
  BarChart3,
  Brain,
  Cpu,
  Workflow,
  Sparkles,
  Bot,
  Clock,
  ListChecks,
  User,
  Wand2,
  Shield,
} from "lucide-react";

const levelColors: Record<string, string> = {
  Pemula: "bg-green-500/10 text-green-600 border-green-500/20",
  Menengah: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  Lanjutan: "bg-red-500/10 text-red-600 border-red-500/20",
};

const categoryIcons: Record<string, React.ReactNode> = {
  "AI Dasar": <Brain className="h-4 w-4" />,
  "Machine Learning": <Cpu className="h-4 w-4" />,
  Automation: <Workflow className="h-4 w-4" />,
  "AI Tools": <Sparkles className="h-4 w-4" />,
  Chatbot: <Bot className="h-4 w-4" />,
};

export default function ModuleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: modules, isLoading: modulesLoading } = useModules(true);
  const { data: userProgress } = useUserProgress(user?.id);
  const updateProgress = useUpdateProgress();

  const module = modules?.find(m => m.id === id);
  const progress = userProgress?.find(p => p.module_id === id);
  const currentProgress = progress?.progress_percent || 0;
  const isCompleted = progress?.is_completed || false;
  const hasStartedLearning = currentProgress > 0 || isCompleted;

  const level = module?.level || "Pemula";
  const category = module?.category || "AI Dasar";

  // Handle "Mulai Belajar" - creates progress record and navigates to learn page
  const handleStartLearning = () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (!id) return;

    // Create initial progress record then navigate
    updateProgress.mutate(
      {
        userId: user.id,
        moduleId: id,
        progressPercent: 5,
        isCompleted: false,
      },
      {
        onSuccess: () => {
          navigate(`/module/${id}/learn`);
        },
      }
    );
  };

  // Handle "Lanjutkan Belajar" - just navigate (progress already exists)
  const handleContinueLearning = () => {
    navigate(`/module/${id}/learn`);
  };

  if (modulesLoading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Simple Header */}
        <header className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
          <div className="container mx-auto px-4 h-14 flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/modules')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Kembali</span>
            </Button>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8 pt-20">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="h-64 bg-muted rounded-xl" />
          </div>
        </main>
      </div>
    );
  }

  if (!module) {
    return (
      <div className="min-h-screen bg-background">
        {/* Simple Header */}
        <header className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
          <div className="container mx-auto px-4 h-14 flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/modules')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Kembali</span>
            </Button>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8 pt-20">
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
      </div>
    );
  }

  // Determine creator type for watermark
  const getCreatorBadge = () => {
    // Check if module was AI generated (using optional chaining for type safety)
    const isAiGenerated = (module as any).is_ai_generated;
    if (isAiGenerated) {
      return (
        <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20 gap-1">
          <Wand2 className="h-3 w-3" />
          AI Generated
        </Badge>
      );
    }
    // Default to showing it's from a tutor/admin
    return (
      <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 gap-1">
        <User className="h-3 w-3" />
        Tutor
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Simple Header - Clean, distraction-free */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container mx-auto px-4 h-14 flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/modules')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Kembali ke Modul</span>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 pt-20">

        {/* Module Overview Card */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {/* Header Section */}
            <div className="p-6 md:p-8 border-b border-border">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {/* Creator Badge */}
                {getCreatorBadge()}
                <Badge className={levelColors[level]} variant="outline">
                  <BarChart3 className="h-3 w-3 mr-1" />
                  {level}
                </Badge>
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                  {categoryIcons[category] || <Brain className="h-3 w-3" />}
                  <span className="ml-1">{category}</span>
                </Badge>
                {isCompleted && (
                  <Badge className="bg-green-500/10 text-green-600 border-green-500/20" variant="outline">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Selesai
                  </Badge>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                {module.title}
              </h1>

              {/* Summary */}
              {module.summary && (
                <p className="text-muted-foreground mb-6 leading-relaxed max-w-3xl">
                  {module.summary}
                </p>
              )}

              {/* CTA Section */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {user ? (
                  <>
                    {!hasStartedLearning ? (
                      <Button
                        onClick={handleStartLearning}
                        disabled={updateProgress.isPending}
                        size="lg"
                        className="gap-2"
                      >
                        <Play className="h-5 w-5" />
                        Mulai Belajar
                      </Button>
                    ) : isCompleted ? (
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-green-600 bg-green-500/10 px-4 py-2 rounded-lg">
                          <CheckCircle className="h-5 w-5" />
                          <span className="font-medium">Modul selesai!</span>
                        </div>
                        <Button
                          onClick={handleContinueLearning}
                          variant="outline"
                          size="lg"
                        >
                          Lihat Materi
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={handleContinueLearning}
                        size="lg"
                        className="gap-2"
                      >
                        <Play className="h-5 w-5" />
                        Lanjutkan Belajar
                      </Button>
                    )}

                    {/* Progress indicator */}
                    {hasStartedLearning && !isCompleted && (
                      <div className="flex items-center gap-3">
                        <Progress value={currentProgress} className="h-2 w-32" />
                        <span className="text-sm text-muted-foreground font-medium">
                          {currentProgress}%
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
                    <p className="text-muted-foreground text-sm">
                      Masuk untuk melacak progress belajar Anda
                    </p>
                    <Button onClick={() => navigate("/auth")} size="sm">
                      Masuk
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* What You'll Learn Section */}
            <div className="p-6 md:p-8 bg-muted/30">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <ListChecks className="h-5 w-5 text-primary" />
                Apa yang akan Anda pelajari
              </h2>
              <div className="grid md:grid-cols-2 gap-3">
                <div className="flex items-start gap-3 p-3 bg-background rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground">Materi pembelajaran lengkap dan terstruktur</span>
                </div>
                <div className="flex items-start gap-3 p-3 bg-background rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground">Contoh kode dan praktik langsung</span>
                </div>
                <div className="flex items-start gap-3 p-3 bg-background rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground">Quiz untuk menguji pemahaman</span>
                </div>
                <div className="flex items-start gap-3 p-3 bg-background rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground">Fitur catatan untuk highlight penting</span>
                </div>
              </div>

              {/* Estimated time */}
              <div className="mt-6 flex items-center gap-2 text-muted-foreground text-sm">
                <Clock className="h-4 w-4" />
                <span>Estimasi waktu belajar: 15-30 menit</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
