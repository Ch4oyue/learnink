import { logger } from "@/lib/logger";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ModuleCategory {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon_name: string;
  order_index: number;
  created_at: string;
}

export interface ModuleLevel {
  id: string;
  name: string;
  description: string | null;
  color: string;
  order_index: number;
  created_at: string;
}

export function useModuleCategories() {
  return useQuery({
    queryKey: ["module-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("module_categories")
        .select("*")
        .order("order_index", { ascending: true });
      
      if (error) throw error;
      return data as ModuleCategory[];
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; color?: string; description?: string }) => {
      const { data, error } = await supabase
        .from("module_categories")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as ModuleCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["module-categories"] });
      toast({
        title: "Sukses",
        description: "Kategori berhasil diperbarui",
      });
    },
    onError: (error) => {
      logger.error("Error updating category:", error);
      toast({
        title: "Error",
        description: "Gagal memperbarui kategori",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateLevel() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; color?: string; description?: string }) => {
      const { data, error } = await supabase
        .from("module_levels")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as ModuleLevel;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["module-levels"] });
      toast({
        title: "Sukses",
        description: "Level berhasil diperbarui",
      });
    },
    onError: (error) => {
      logger.error("Error updating level:", error);
      toast({
        title: "Error",
        description: "Gagal memperbarui level",
        variant: "destructive",
      });
    },
  });
}

export function useModuleLevels() {
  return useQuery({
    queryKey: ["module-levels"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("module_levels")
        .select("*")
        .order("order_index", { ascending: true });
      
      if (error) throw error;
      return data as ModuleLevel[];
    },
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (category: { name: string; color: string; description?: string }) => {
      const { data, error } = await supabase
        .from("module_categories")
        .insert(category)
        .select()
        .single();
      
      if (error) throw error;
      return data as ModuleCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["module-categories"] });
    },
    onError: (error) => {
      logger.error("Error creating category:", error);
      toast({
        title: "Error",
        description: "Gagal membuat kategori",
        variant: "destructive",
      });
    },
  });
}

export function useCreateLevel() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (level: { name: string; color: string; description?: string }) => {
      const { data, error } = await supabase
        .from("module_levels")
        .insert(level)
        .select()
        .single();
      
      if (error) throw error;
      return data as ModuleLevel;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["module-levels"] });
    },
    onError: (error) => {
      logger.error("Error creating level:", error);
      toast({
        title: "Error",
        description: "Gagal membuat level",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (categoryId: string) => {
      const { error } = await supabase
        .from("module_categories")
        .delete()
        .eq("id", categoryId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["module-categories"] });
      toast({
        title: "Sukses",
        description: "Kategori berhasil dihapus",
      });
    },
    onError: (error) => {
      logger.error("Error deleting category:", error);
      toast({
        title: "Error",
        description: "Gagal menghapus kategori",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteLevel() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (levelId: string) => {
      const { error } = await supabase
        .from("module_levels")
        .delete()
        .eq("id", levelId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["module-levels"] });
      toast({
        title: "Sukses",
        description: "Level berhasil dihapus",
      });
    },
    onError: (error) => {
      logger.error("Error deleting level:", error);
      toast({
        title: "Error",
        description: "Gagal menghapus level",
        variant: "destructive",
      });
    },
  });
}
