import { mutationFeedback } from "@/lib/mutationFeedback";
import { logger } from "@/lib/logger";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Module {
  id: string;
  title: string;
  summary: string | null;
  level: string | null;
  icon_name: string | null;
  is_published: boolean | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
  category: string | null;
  content?: string | null;
  generated_at: string | null;
  source_request_id?: string | null;
  track_id?: string | null;
  author?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  status?: string | null;
}

export function useModules(optionsOrPublishedOnly: { publishedOnly?: boolean; minimal?: boolean; trackId?: string } | boolean = {}) {
  // Handle legacy boolean argument (publishedOnly)
  const options = typeof optionsOrPublishedOnly === 'boolean'
    ? { publishedOnly: optionsOrPublishedOnly, minimal: true }
    : { minimal: true, ...optionsOrPublishedOnly };

  const { publishedOnly = false, minimal = true, trackId } = options;

  return useQuery({
    queryKey: ["modules", publishedOnly, minimal, trackId],
    queryFn: async () => {
      let query = supabase.from("modules");

      if (minimal) {
        query = query.select(
          "id, title, summary, level, category, is_published, created_at, status"
        );
      } else {
        query = query.select("*");
      }

      if (publishedOnly) {
        query = query.eq("is_published", true);
      }

      if (trackId) {
        query = query.eq("track_id", trackId);
      }

      const { data, error } = await query.order("created_at", {
        ascending: false,
      });

      if (error) throw error;
      return data as Module[];
    },
  });
}

export function usePopularModules(limit = 6) {
  return useQuery({
    queryKey: ["popular-modules", limit],
    queryFn: async () => {
      // Fallback to fetching latest modules since RPC 'get_popular_modules' is missing
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error("Popular modules fetch error:", error);
        return [];
      }
      return data;
    },
  });
}

export function useModule(id?: string) {
  return useQuery({
    queryKey: ['module', id],
    queryFn: async () => {
      if (!id) return null;

      // First try to get the module directly (without author join which can fail)
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        logger.error('Module fetch error:', error.message, error.details);
        throw error;
      }

      return data as Module;
    },
    enabled: !!id,
    retry: 1, // Limit retries to avoid delays
  });
}

export function useModuleByRequestId(requestId?: string) {
  return useQuery({
    queryKey: ['module-by-request', requestId],
    queryFn: async () => {
      if (!requestId) return null;

      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .eq('source_request_id', requestId)
        .maybeSingle();

      if (error) {
        logger.error('Module fetch by request error:', error.message);
        throw error;
      }

      return data as Module | null;
    },
    enabled: !!requestId,
  });
}

export function useMyModules(userId?: string) {
  return useQuery({
    queryKey: ["my-modules", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("modules")
        .select(
          "id, title, summary, level, category, is_published, created_at"
        )
        .eq("created_by", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Module[];
    },
    enabled: !!userId,
  });
}


export function useCreateModule() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (module: Omit<Module, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('modules')
        .insert(module)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    ...mutationFeedback({
      queryClient, toast,
      queryKeys: ['modules', 'my-modules'],
      success: 'Module created successfully',
      failure: 'Failed to create module',
      logMessage: 'Error creating module:',
    }),
  });
}

export function useUpdateModule() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Module> & { id: string }) => {
      const { data, error } = await supabase
        .from('modules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    ...mutationFeedback({
      queryClient, toast,
      queryKeys: ['modules', 'my-modules'],
      success: 'Module updated successfully',
      failure: 'Failed to update module',
      logMessage: 'Error updating module:',
    }),
  });
}

export function useDeleteModule() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('modules')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      queryClient.invalidateQueries({ queryKey: ['my-modules'] });
      toast({
        title: "Success",
        description: "Module deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete module",
        variant: "destructive",
      });
      logger.error('Error deleting module:', error);
    },
  });
}
