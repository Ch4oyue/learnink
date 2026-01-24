import { logger } from "@/lib/logger";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface UserProgress {
  id: string;
  user_id: string;
  module_id: string;
  progress_percent: number | null;
  is_completed: boolean | null;
  started_at: string | null;
  completed_at: string | null;
}

export interface UserProgressWithModule extends UserProgress {
  modules: {
    id: string;
    title: string;
    level: string | null;
    icon_name: string | null;
  } | null;
}

export function useUserProgress(userId?: string) {
  return useQuery({
    queryKey: ['user-progress', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('user_progress')
        .select(`
          *,
          modules (
            id,
            title,
            level,
            icon_name
          )
        `)
        .eq('user_id', userId)
        .order('started_at', { ascending: false });

      if (error) throw error;
      return data as UserProgressWithModule[];
    },
    enabled: !!userId,
  });
}

export function useAllProgress(page = 0, limit = 10) {
  return useQuery({
    queryKey: ['all-progress', page, limit],
    queryFn: async () => {
      const from = page * limit;
      const to = from + limit - 1;

      const { data, count, error } = await supabase
        .from('user_progress')
        .select(`
          *,
          modules (
            id,
            title,
            level,
            icon_name
          )
        `, { count: 'exact' })
        .range(from, to)
        .order('started_at', { ascending: false });

      if (error) throw error;
      return { data: data as UserProgressWithModule[], count };
    },
    placeholderData: (previousData) => previousData,
  });
}

export function useModuleProgress(userId?: string, moduleId?: string) {
  return useQuery({
    queryKey: ['user-progress', userId, moduleId],
    queryFn: async () => {
      if (!userId || !moduleId) return null;

      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('module_id', moduleId)
        .maybeSingle();

      if (error) throw error;
      return data as UserProgress | null;
    },
    enabled: !!userId && !!moduleId,
  });
}

export function useModuleStudentCount(moduleId?: string) {
  return useQuery({
    queryKey: ['module-student-count', moduleId],
    queryFn: async () => {
      if (!moduleId) return 0;

      const { count, error } = await supabase
        .from('user_progress')
        .select('*', { count: 'exact', head: true })
        .eq('module_id', moduleId);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!moduleId,
  });
}

export function useTotalStudents() {
  return useQuery({
    queryKey: ['total-students'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_unique_student_count');

      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateProgress() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      userId,
      moduleId,
      progressPercent,
      isCompleted
    }: {
      userId: string;
      moduleId: string;
      progressPercent: number;
      isCompleted?: boolean;
    }) => {
      const updateData: Record<string, unknown> = {
        progress_percent: progressPercent,
      };

      if (isCompleted !== undefined) {
        updateData.is_completed = isCompleted;
        if (isCompleted) {
          updateData.completed_at = new Date().toISOString();
        }
      }

      const { data, error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: userId,
          module_id: moduleId,
          ...updateData,
        }, {
          onConflict: 'user_id,module_id',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      // Silently invalidate cache - no toast for automatic progress saves
      queryClient.invalidateQueries({ queryKey: ['user-progress', variables.userId] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Gagal menyimpan progress",
        variant: "destructive",
      });
      logger.error('Error updating progress:', error);
    },
  });
}

export function useProgressStats(userId?: string) {
  const { data: progress } = useUserProgress(userId);

  const totalModules = progress?.length || 0;
  const completedModules = progress?.filter(p => p.is_completed).length || 0;
  const averageProgress = totalModules > 0
    ? Math.round(progress!.reduce((sum, p) => sum + (p.progress_percent || 0), 0) / totalModules)
    : 0;

  return {
    totalModules,
    completedModules,
    averageProgress,
    inProgressModules: totalModules - completedModules,
  };
}
