import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Play,
  Clock,
  Trophy,
  CheckCircle,
  BarChart3,
  Bot,
  Brain,
  Workflow,
  Sparkles,
  Cpu,
} from "lucide-react";

interface ModuleHeaderProps {
  module: {
    id: string;
    title: string;
    summary?: string | null;
    level?: string | null;
    category?: string | null;
  };
  currentProgress: number;
  isCompleted: boolean;
  hasStartedLearning?: boolean;
  onStartLearning: () => void;
  onContinue: () => void;
  onMarkComplete: () => void;
  isUpdating: boolean;
  onBack: () => void;
}

const levelColors: Record<string, string> = {
  Pemula: "bg-green-500/10 text-green-600 border-green-500/20",
  Menengah: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  Lanjutan: "bg-red-500/10 text-red-600 border-red-500/20",
};

const categoryIcons: Record<string, React.ReactNode> = {
  "AI Dasar": <Brain className="h-3 w-3" />,
  "Machine Learning": <Cpu className="h-3 w-3" />,
  Automation: <Workflow className="h-3 w-3" />,
  "AI Tools": <Sparkles className="h-3 w-3" />,
  Chatbot: <Bot className="h-3 w-3" />,
};

export function ModuleHeader({
  module,
  currentProgress,
  isCompleted,
  hasStartedLearning = false,
  onStartLearning,
  onContinue,
  onMarkComplete,
  isUpdating,
  onBack,
}: ModuleHeaderProps) {
  const { user } = useAuth();
  const level = module.level || "Pemula";
  const category = module.category || "AI Dasar";

  return (
    <header className="bg-card border border-border rounded-2xl overflow-hidden shadow-soft">
      {/* Top bar with back button */}
      <div className="px-6 py-3 border-b border-border bg-muted/30">
        <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>
      </div>

      {/* Main header content */}
      <div className="p-6 md:p-8">
        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
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
          <p className="text-muted-foreground mb-6 leading-relaxed">
            {module.summary}
          </p>
        )}

        {/* CTA and Progress */}
        {user ? (
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* CTA Buttons */}
            <div className="flex items-center gap-3">
              {!hasStartedLearning ? (
                <Button onClick={onStartLearning} disabled={isUpdating} size="lg">
                  <Play className="h-4 w-4 mr-2" />
                  Mulai Belajar
                </Button>
              ) : !isCompleted ? (
                <>
                  <Button onClick={onContinue} disabled={isUpdating} size="lg">
                    <Play className="h-4 w-4 mr-2" />
                    Lanjutkan Belajar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={onMarkComplete}
                    disabled={isUpdating}
                  >
                    <Trophy className="h-4 w-4 mr-2" />
                    Tandai Selesai
                  </Button>
                </>
              ) : (
                <div className="flex items-center gap-2 text-green-600 bg-green-500/10 px-4 py-2 rounded-lg">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Modul selesai!</span>
                </div>
              )}
            </div>

            {/* Compact Progress - only show if started */}
            {hasStartedLearning && (
              <div className="flex items-center gap-3 sm:ml-auto">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Progress:</span>
                  <Progress value={currentProgress} className="h-2 w-24" />
                  <span className="font-medium text-foreground">{currentProgress}%</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
            <p className="text-muted-foreground text-sm">
              Masuk untuk melacak progress belajar Anda
            </p>
            <Button asChild size="sm">
              <Link to="/auth">Masuk</Link>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
