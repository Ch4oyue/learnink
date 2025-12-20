import { Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { useModules } from "@/hooks/useModules";
import { useUserProgress } from "@/hooks/useUserProgress";
import {
  BookOpen,
  Calculator,
  Code,
  FlaskConical,
  Globe,
  CheckCircle2,
  Circle,
  Lock,
  ArrowRight,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen,
  Calculator,
  Code,
  FlaskConical,
  Globe,
};

const learningPaths = [
  {
    id: "fundamentals",
    title: "Dasar-Dasar",
    description: "Pelajari konsep fundamental sebelum melanjutkan",
    icon: BookOpen,
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-500/10",
    textColor: "text-blue-500",
    categories: ["Umum"],
    levels: ["Pemula"],
  },
  {
    id: "core-skills",
    title: "Kemampuan Inti",
    description: "Bangun kemampuan inti yang dibutuhkan",
    icon: Target,
    color: "from-purple-500 to-pink-500",
    bgColor: "bg-purple-500/10",
    textColor: "text-purple-500",
    categories: ["Matematika", "Sains"],
    levels: ["Pemula", "Menengah"],
  },
  {
    id: "advanced",
    title: "Tingkat Lanjut",
    description: "Kuasai topik tingkat lanjut",
    icon: Zap,
    color: "from-orange-500 to-red-500",
    bgColor: "bg-orange-500/10",
    textColor: "text-orange-500",
    categories: ["Teknologi"],
    levels: ["Menengah", "Lanjutan"],
  },
  {
    id: "mastery",
    title: "Penguasaan",
    description: "Capai penguasaan penuh materi",
    icon: Trophy,
    color: "from-amber-500 to-yellow-500",
    bgColor: "bg-amber-500/10",
    textColor: "text-amber-500",
    categories: [],
    levels: ["Lanjutan"],
  },
];

export default function Syllabus() {
  const { user } = useAuth();
  const { data: modules, isLoading } = useModules(true);
  const { data: progress } = useUserProgress(user?.id);

  const getModulesForPath = (path: (typeof learningPaths)[0]) => {
    if (!modules) return [];
    return modules.filter((m) => {
      if (path.categories.length > 0 && !path.categories.includes(m.category || "")) {
        return false;
      }
      if (path.levels.length > 0 && !path.levels.includes(m.level || "")) {
        return false;
      }
      return true;
    });
  };

  const getProgressForModule = (moduleId: string) => {
    return progress?.find((p) => p.module_id === moduleId);
  };

  const calculatePathProgress = (path: (typeof learningPaths)[0]) => {
    const pathModules = getModulesForPath(path);
    if (pathModules.length === 0) return 0;
    const completed = pathModules.filter((m) =>
      getProgressForModule(m.id)?.is_completed
    ).length;
    return Math.round((completed / pathModules.length) * 100);
  };

  const totalModules = modules?.length || 0;
  const completedModules = progress?.filter((p) => p.is_completed).length || 0;
  const overallProgress = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-24 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">
              <Sparkles className="h-3 w-3 mr-1" />
              Learning Path
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Silabus <span className="text-gradient">Pembelajaran</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Ikuti jalur pembelajaran yang terstruktur untuk mencapai tujuan belajar Anda
            </p>
          </div>

          {/* Overall Progress */}
          {user && (
            <div className="max-w-md mx-auto mb-12">
              <div className="p-6 rounded-2xl border bg-card shadow-soft">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">Progress Keseluruhan</span>
                  <span className="text-2xl font-bold text-primary">{overallProgress}%</span>
                </div>
                <Progress value={overallProgress} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  {completedModules} dari {totalModules} modul selesai
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Learning Paths */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="space-y-16">
            {learningPaths.map((path, pathIndex) => {
              const PathIcon = path.icon;
              const pathModules = getModulesForPath(path);
              const pathProgress = calculatePathProgress(path);
              const isUnlocked = pathIndex === 0 || calculatePathProgress(learningPaths[pathIndex - 1]) >= 50;

              return (
                <div key={path.id} className="relative">
                  {/* Connector Line */}
                  {pathIndex < learningPaths.length - 1 && (
                    <div className="absolute left-8 top-full w-0.5 h-16 bg-border hidden md:block" />
                  )}

                  {/* Path Header */}
                  <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
                    <div
                      className={`h-16 w-16 rounded-2xl flex items-center justify-center bg-gradient-to-br ${path.color} text-white shadow-medium`}
                    >
                      <PathIcon className="h-7 w-7" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-xl font-semibold">{path.title}</h2>
                        {!isUnlocked && (
                          <Lock className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <p className="text-muted-foreground">{path.description}</p>
                    </div>
                    {user && pathModules.length > 0 && (
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-2xl font-bold">{pathProgress}%</p>
                          <p className="text-xs text-muted-foreground">Selesai</p>
                        </div>
                        <div className="w-24">
                          <Progress value={pathProgress} className="h-2" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Modules Grid */}
                  {isLoading ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="h-32 rounded-xl bg-muted animate-pulse"
                        />
                      ))}
                    </div>
                  ) : pathModules.length === 0 ? (
                    <div
                      className={`p-8 rounded-xl border-2 border-dashed ${path.bgColor} text-center`}
                    >
                      <p className={`${path.textColor} font-medium`}>
                        Modul untuk jalur ini akan segera tersedia
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {pathModules.map((module, moduleIndex) => {
                        const moduleProgress = getProgressForModule(module.id);
                        const isCompleted = moduleProgress?.is_completed;
                        const isStarted = !!moduleProgress;
                        const IconComponent = iconMap[module.icon_name || "BookOpen"] || BookOpen;

                        return (
                          <Link
                            to={`/module/${module.id}`}
                            key={module.id}
                            className={`group relative p-5 rounded-xl border bg-card transition-all duration-300 hover:shadow-medium ${
                              !isUnlocked ? "opacity-50 pointer-events-none" : ""
                            }`}
                            style={{
                              animationDelay: `${moduleIndex * 100}ms`,
                            }}
                          >
                            {/* Status Icon */}
                            <div className="absolute top-4 right-4">
                              {isCompleted ? (
                                <CheckCircle2 className="h-5 w-5 text-success" />
                              ) : isStarted ? (
                                <div className="h-5 w-5 rounded-full border-2 border-primary flex items-center justify-center">
                                  <div className="h-2 w-2 rounded-full bg-primary" />
                                </div>
                              ) : (
                                <Circle className="h-5 w-5 text-muted-foreground/30" />
                              )}
                            </div>

                            <div className="flex items-start gap-3">
                              <div
                                className={`h-10 w-10 rounded-lg flex items-center justify-center ${path.bgColor}`}
                              >
                                <IconComponent className={`h-5 w-5 ${path.textColor}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium mb-1 group-hover:text-primary transition-colors line-clamp-1">
                                  {module.title}
                                </h3>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {module.summary}
                                </p>
                              </div>
                            </div>

                            {moduleProgress && !isCompleted && (
                              <div className="mt-3">
                                <Progress
                                  value={moduleProgress.progress_percent || 0}
                                  className="h-1"
                                />
                              </div>
                            )}

                            <div className="mt-3 flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {module.category}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {module.level}
                              </Badge>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!user && (
        <section className="py-16 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-semibold mb-4">
              Mulai Perjalanan Belajar Anda
            </h2>
            <p className="text-muted-foreground mb-6">
              Daftar sekarang untuk melacak progress belajar dan dapatkan rekomendasi
              materi yang dipersonalisasi
            </p>
            <Button asChild size="lg" className="gap-2">
              <Link to="/auth">
                Mulai Sekarang
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
