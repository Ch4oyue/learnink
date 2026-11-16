import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";

export interface Quiz {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  time_limit_minutes: number;
  passing_score: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: "multiple_choice" | "true_false" | "fill_blank";
  options: string[] | null;
  correct_answer: string;
  explanation: string | null;
  points: number;
  order_index: number;
}

// Safe version without correct_answer for students
export interface QuizQuestionSafe {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: "multiple_choice" | "true_false" | "fill_blank";
  options: string[] | null;
  points: number;
  order_index: number;
}

export interface QuizAttempt {
  id: string;
  user_id: string;
  quiz_id: string;
  score: number;
  total_points: number;
  percentage: number;
  passed: boolean;
  answers: Record<string, string>;
  started_at: string;
  completed_at: string | null;
}

export type QuizAttemptList = Omit<QuizAttempt, "answers">;

export interface QuizValidationResult {
  attempt: QuizAttempt;
  results: {
    score: number;
    totalPoints: number;
    percentage: number;
    passed: boolean;
    correctAnswers: Record<string, boolean>;
    explanations: Record<string, string | null>;
    correctAnswerValues: Record<string, string>;
  };
}

export function useQuizzes(moduleId?: string) {
  return useQuery({
    queryKey: ["quizzes", moduleId],
    queryFn: async () => {
      let query = supabase.from("quizzes").select("*");
      if (moduleId) {
        query = query.eq("module_id", moduleId);
      }
      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      return data as Quiz[];
    },
    enabled: !!moduleId || true,
  });
}

export function useQuiz(quizId?: string) {
  return useQuery({
    queryKey: ["quiz", quizId],
    queryFn: async () => {
      if (!quizId) return null;
      const { data, error } = await supabase
        .from("quizzes")
        .select("*")
        .eq("id", quizId)
        .single();
      if (error) throw error;
      return data as Quiz;
    },
    enabled: !!quizId,
  });
}

// Fetch questions WITHOUT correct_answer for students (security via RPC function)
export function useQuizQuestionsSafe(quizId?: string) {
  return useQuery({
    queryKey: ["quiz-questions-safe", quizId],
    queryFn: async () => {
      if (!quizId) return [];
      
      // Use secure RPC function that doesn't expose correct_answer
      const { data, error } = await supabase
        .rpc("get_quiz_questions_safe", { p_quiz_id: quizId });
      
      if (error) {
        logger.error("Error fetching quiz questions:", error);
        throw error;
      }
      
      return (data || []) as QuizQuestionSafe[];
    },
    enabled: !!quizId,
  });
}

// Fetch full questions WITH correct_answer (for tutors/admins only)
export function useQuizQuestions(quizId?: string) {
  return useQuery({
    queryKey: ["quiz-questions", quizId],
    queryFn: async () => {
      if (!quizId) return [];
      const { data, error } = await supabase
        .from("quiz_questions")
        .select("*")
        .eq("quiz_id", quizId)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data as QuizQuestion[];
    },
    enabled: !!quizId,
  });
}

export function useUserQuizAttempts(userId?: string, quizId?: string) {
  return useQuery({
    queryKey: ["quiz-attempts", userId, quizId],
    queryFn: async () => {
      if (!userId) return [];
      let query = supabase
        .from("user_quiz_attempts")
        .select(
          "id, user_id, quiz_id, score, total_points, percentage, passed, started_at, completed_at"
        )
        .eq("user_id", userId);
      if (quizId) {
        query = query.eq("quiz_id", quizId);
      }
      const { data, error } = await query.order("completed_at", { ascending: false });
      if (error) throw error;
      return data as QuizAttemptList[];
    },
    enabled: !!userId,
  });
}

export function useCreateQuiz() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (quiz: Omit<Quiz, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("quizzes")
        .insert(quiz)
        .select()
        .single();
      if (error) throw error;
      return data as Quiz;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
      toast({ title: "Success", description: "Quiz created successfully" });
    },
    onError: (error) => {
      logger.error("Error creating quiz:", error);
      toast({
        title: "Error",
        description: "Failed to create quiz",
        variant: "destructive",
      });
    },
  });
}

export function useCreateQuizQuestions() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (questions: Omit<QuizQuestion, "id" | "created_at">[]) => {
      const { data, error } = await supabase
        .from("quiz_questions")
        .insert(questions)
        .select();
      if (error) throw error;
      return data as QuizQuestion[];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quiz-questions"] });
    },
    onError: (error) => {
      logger.error("Error creating questions:", error);
      toast({
        title: "Error",
        description: "Failed to create quiz questions",
        variant: "destructive",
      });
    },
  });
}

// Server-side quiz validation (secure)
export function useValidateQuizAnswers() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: { quiz_id: string; answers: Record<string, string>; time_taken: number }) => {
      const { data, error } = await supabase.functions.invoke('validate-quiz-answers', {
        body: params,
      });
      
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      return data as QuizValidationResult;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["quiz-attempts"] });
      toast({
        title: data.results.passed ? "Selamat!" : "Coba Lagi",
        description: data.results.passed 
          ? `You passed with a score of ${data.results.percentage}%` 
          : `Your score is ${data.results.percentage}%. A minimum score is required to pass.`,
        variant: data.results.passed ? "default" : "destructive",
      });
    },
    onError: (error) => {
      logger.error("Error validating quiz:", error);
      toast({
        title: "Error",
        description: "Failed to process quiz results",
        variant: "destructive",
      });
    },
  });
}

// Deprecated: Use useValidateQuizAnswers instead for security
export function useSubmitQuizAttempt() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (attempt: Omit<QuizAttempt, "id" | "started_at">) => {
      const { data, error } = await supabase
        .from("user_quiz_attempts")
        .insert({
          ...attempt,
          completed_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      return data as QuizAttempt;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["quiz-attempts"] });
      toast({
        title: data.passed ? "Selamat!" : "Coba Lagi",
        description: data.passed 
          ? `You passed with a score of ${data.percentage}%` 
          : `Your score is ${data.percentage}%. A minimum of ${70}% is required to pass.`,
        variant: data.passed ? "default" : "destructive",
      });
    },
    onError: (error) => {
      logger.error("Error submitting attempt:", error);
      toast({
        title: "Error",
        description: "Failed to save quiz results",
        variant: "destructive",
      });
    },
  });
}
