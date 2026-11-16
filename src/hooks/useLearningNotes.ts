import { logger } from "@/lib/logger";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface LearningNote {
  id: string;
  user_id: string;
  module_id: string;
  content: string;
  highlighted_text: string | null;
  created_at: string;
  updated_at: string;
}

export function useLearningNotes(userId?: string, moduleId?: string) {
  return useQuery({
    queryKey: ["learning-notes", userId, moduleId],
    queryFn: async () => {
      if (!userId) return [];
      
      let query = supabase
        .from("learning_notes")
        .select("*")
        .eq("user_id", userId);
      
      if (moduleId) {
        query = query.eq("module_id", moduleId);
      }
      
      const { data, error } = await query.order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as LearningNote[];
    },
    enabled: !!userId,
  });
}

export function useCreateLearningNote() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (note: Omit<LearningNote, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("learning_notes")
        .insert(note)
        .select()
        .single();
      
      if (error) throw error;
      return data as LearningNote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["learning-notes"] });
    },
    onError: (error) => {
      logger.error("Error creating note:", error);
      toast({
        title: "Error",
        description: "Gagal membuat catatan",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateLearningNote() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const { data, error } = await supabase
        .from("learning_notes")
        .update({ content })
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data as LearningNote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["learning-notes"] });
      toast({
        title: "Success",
        description: "Note updated successfully",
      });
    },
    onError: (error) => {
      logger.error("Error updating note:", error);
      toast({
        title: "Error",
        description: "Gagal memperbarui catatan",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteLearningNote() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase
        .from("learning_notes")
        .delete()
        .eq("id", noteId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["learning-notes"] });
      toast({
        title: "Success",
        description: "Note deleted successfully",
      });
    },
    onError: (error) => {
      logger.error("Error deleting note:", error);
      toast({
        title: "Error",
        description: "Gagal menghapus catatan",
        variant: "destructive",
      });
    },
  });
}
