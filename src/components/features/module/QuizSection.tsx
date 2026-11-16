import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Quiz } from "@/hooks/useQuiz";
import {
  FileQuestion,
  Play,
  Timer,
  Target,
  Sparkles,
  Loader2,
  Trophy,
} from "lucide-react";

interface QuizSectionProps {
  quizzes: Quiz[] | undefined;
  isLoading: boolean;
  canManageQuiz: boolean;
  isGenerating: boolean;
  onGenerateQuiz: () => void;
  onStartQuiz: (quiz: Quiz) => void;
  userAttempts?: Record<string, { count: number; highestScore: number }>;
}

export function QuizSection({
  quizzes,
  isLoading,
  canManageQuiz,
  isGenerating,
  onGenerateQuiz,
  onStartQuiz,
  userAttempts,
}: QuizSectionProps) {
  const { user } = useAuth();

  return (
    <section
      id="quiz-section"
      className="bg-card border-2 border-amber-500/20 rounded-2xl overflow-hidden shadow-soft"
    >
      {/* Section Header */}
      <div className="px-6 py-4 bg-amber-500/5 border-b border-amber-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-amber-500/10 rounded-lg flex items-center justify-center">
              <FileQuestion className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Module Quiz
              </h2>
              <p className="text-sm text-muted-foreground">
                Test your understanding after reading the material
              </p>
            </div>
          </div>
          {canManageQuiz && (
            <Button
              onClick={onGenerateQuiz}
              disabled={isGenerating}
              size="sm"
              variant="outline"
              className="border-amber-500/30 text-amber-700 hover:bg-amber-500/10"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate AI Quiz
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Quiz List */}
      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
          </div>
        ) : quizzes && quizzes.length > 0 ? (
          <div className="space-y-4">
            {quizzes.map((quiz) => {
              const attempts = userAttempts?.[quiz.id];
              return (
                <div
                  key={quiz.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-muted/50 rounded-xl border border-border"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground mb-1">
                      {quiz.title}
                    </h3>
                    {quiz.description && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {quiz.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Timer className="h-3 w-3" />
                        {quiz.time_limit_minutes} minutes
                      </span>
                      <span className="flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        Pass mark: {quiz.passing_score}%
                      </span>
                      {attempts && (
                        <>
                          <Badge variant="secondary" className="text-xs">
                            {attempts.count}attempts
                          </Badge>
                          <span className="flex items-center gap-1 text-amber-600">
                            <Trophy className="h-3 w-3" />
                            Best score: {attempts.highestScore}%
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  {user ? (
                    <Button onClick={() => onStartQuiz(quiz)} size="sm">
                      <Play className="h-4 w-4 mr-2" />
                      Start Quiz
                    </Button>
                  ) : (
                    <Button asChild size="sm" variant="outline">
                      <Link to="/auth">Log In to Take the Quiz</Link>
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <FileQuestion className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              {canManageQuiz
                ? "No quiz yet. Click 'Generate AI Quiz' to create one automatically."
                : "No quiz available for this module yet."}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
