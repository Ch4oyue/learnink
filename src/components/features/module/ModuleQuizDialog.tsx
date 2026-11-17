import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { Quiz, useQuizzes, useQuizQuestionsSafe, useUserQuizAttempts } from "@/hooks/useQuiz";
import { QuizSection } from "@/components/features/module/QuizSection";
import { QuizPlayer } from "@/components/features/quiz/QuizPlayer";

interface ModuleQuizDialogProps {
  moduleId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Lists the quizzes of a module and runs one. Grading is server-side (validate-quiz-answers);
 * this component only renders existing quizzes and never creates or grades anything itself.
 */
export default function ModuleQuizDialog({ moduleId, open, onOpenChange }: ModuleQuizDialogProps) {
  const { user } = useAuth();
  const { data: quizzes, isLoading } = useQuizzes(moduleId);
  const { data: attempts } = useUserQuizAttempts(user?.id);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const { data: questions, isLoading: questionsLoading } = useQuizQuestionsSafe(activeQuiz?.id);

  const userAttempts = useMemo(() => {
    const byQuiz: Record<string, { count: number; highestScore: number }> = {};
    for (const a of attempts ?? []) {
      const cur = byQuiz[a.quiz_id] ?? { count: 0, highestScore: 0 };
      byQuiz[a.quiz_id] = { count: cur.count + 1, highestScore: Math.max(cur.highestScore, Math.round(a.percentage)) };
    }
    return byQuiz;
  }, [attempts]);

  const close = (next: boolean) => {
    if (!next) setActiveQuiz(null);
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogTitle className="sr-only">Module quiz</DialogTitle>
        <DialogDescription className="sr-only">Take a quiz for this module</DialogDescription>
        {activeQuiz ? (
          questionsLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : questions && questions.length > 0 ? (
            <QuizPlayer quiz={activeQuiz} questions={questions} onComplete={() => undefined} onCancel={() => setActiveQuiz(null)} />
          ) : (
            <p className="py-8 text-center text-muted-foreground">This quiz has no questions yet.</p>
          )
        ) : (
          <QuizSection
            quizzes={quizzes}
            isLoading={isLoading}
            canManageQuiz={false}
            isGenerating={false}
            onGenerateQuiz={() => undefined}
            onStartQuiz={setActiveQuiz}
            userAttempts={userAttempts}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
