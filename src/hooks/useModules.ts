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
  author?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

export function useModules(optionsOrPublishedOnly: { publishedOnly?: boolean; minimal?: boolean } | boolean = {}) {
  // Handle legacy boolean argument (publishedOnly)
  const options = typeof optionsOrPublishedOnly === 'boolean'
    ? { publishedOnly: optionsOrPublishedOnly, minimal: true }
    : { minimal: true, ...optionsOrPublishedOnly };

  const { publishedOnly = false, minimal = true } = options;

  return useQuery({
    queryKey: ["modules", publishedOnly],
    queryFn: async () => {
      let query = supabase
        .from("modules")
        .select(
          "id, title, summary, level, category, is_published, created_at"
        );

      if (publishedOnly) {
        query = query.eq("is_published", true);
      }

      const { data, error } = await query.order("created_at", {
        ascending: false,
      });

      if (error) throw error;
      return data as Module[];
    },
  });
}

export function useModule(id?: string) {
  return useQuery({
    queryKey: ['module', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('modules')
        .select(`*, author:profiles(id, full_name, avatar_url)`)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Module;
    },
    enabled: !!id,
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      queryClient.invalidateQueries({ queryKey: ['my-modules'] });
      toast({
        title: "Berhasil",
        description: "Modul berhasil dibuat",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Gagal membuat modul",
        variant: "destructive",
      });
      logger.error('Error creating module:', error);
    },
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      queryClient.invalidateQueries({ queryKey: ['my-modules'] });
      toast({
        title: "Berhasil",
        description: "Modul berhasil diperbarui",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Gagal memperbarui modul",
        variant: "destructive",
      });
      logger.error('Error updating module:', error);
    },
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
        title: "Berhasil",
        description: "Modul berhasil dihapus",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Gagal menghapus modul",
        variant: "destructive",
      });
      logger.error('Error deleting module:', error);
    },
  });
}
