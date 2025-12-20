import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
        .select("*")
        .eq("user_id", userId);
      if (quizId) {
        query = query.eq("quiz_id", quizId);
      }
      const { data, error } = await query.order("completed_at", { ascending: false });
      if (error) throw error;
      return data as QuizAttempt[];
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
      toast({ title: "Sukses", description: "Kuis berhasil dibuat" });
    },
    onError: (error) => {
      console.error("Error creating quiz:", error);
      toast({
        title: "Error",
        description: "Gagal membuat kuis",
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
      console.error("Error creating questions:", error);
      toast({
        title: "Error",
        description: "Gagal membuat soal kuis",
        variant: "destructive",
      });
    },
  });
}

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
          ? `Anda lulus dengan skor ${data.percentage}%` 
          : `Skor Anda ${data.percentage}%. Minimal ${70}% untuk lulus.`,
        variant: data.passed ? "default" : "destructive",
      });
    },
    onError: (error) => {
      console.error("Error submitting attempt:", error);
      toast({
        title: "Error",
        description: "Gagal menyimpan hasil kuis",
        variant: "destructive",
      });
    },
  });
}
