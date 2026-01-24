import { logger } from "@/lib/logger";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";

// ============================================
// TYPES
// ============================================

type LearningSourceRow = Database["public"]["Tables"]["learning_sources"]["Row"];
type LearningSourceInsert = Database["public"]["Tables"]["learning_sources"]["Insert"];
type LearningSourceUpdate = Database["public"]["Tables"]["learning_sources"]["Update"];

export type LearningSource = LearningSourceRow;

export interface CreateLearningSourceInput {
    name: string;
    logo_url: string;
    website_url?: string | null;
    description?: string | null;
    category?: string;
    is_active?: boolean;
    display_order?: number;
}

export interface UpdateLearningSourceInput {
    id: string;
    name?: string;
    logo_url?: string;
    website_url?: string | null;
    description?: string | null;
    category?: string;
    is_active?: boolean;
    display_order?: number;
}

// ============================================
// FETCH ALL LEARNING SOURCES
// ============================================

export function useLearningSourcesCRUD() {
    return useQuery({
        queryKey: ["learning-sources-all"],
        queryFn: async (): Promise<LearningSource[]> => {
            const { data, error } = await supabase
                .from("learning_sources")
                .select("*")
                .order("display_order", { ascending: true });

            if (error) {
                logger.error("Error fetching learning sources:", error);
                throw error;
            }

            return data || [];
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

// ============================================
// CREATE LEARNING SOURCE
// ============================================

export function useCreateLearningSource() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (input: CreateLearningSourceInput): Promise<LearningSource> => {
            const insertData: LearningSourceInsert = {
                name: input.name,
                logo_url: input.logo_url,
                website_url: input.website_url ?? null,
                description: input.description ?? null,
                category: input.category ?? "general",
                is_active: input.is_active ?? true,
                display_order: input.display_order ?? 0,
            };

            const { data, error } = await supabase
                .from("learning_sources")
                .insert(insertData)
                .select()
                .single();

            if (error) {
                throw error;
            }

            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["learning-sources-all"] });
            queryClient.invalidateQueries({ queryKey: ["learning-sources"] }); // For marquee
            toast({
                title: "Berhasil",
                description: "Sumber belajar berhasil ditambahkan",
            });
        },
        onError: (error) => {
            logger.error("Error creating learning source:", error);
            toast({
                title: "Error",
                description: "Gagal menambahkan sumber belajar",
                variant: "destructive",
            });
        },
    });
}

// ============================================
// UPDATE LEARNING SOURCE
// ============================================

export function useUpdateLearningSource() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (input: UpdateLearningSourceInput): Promise<LearningSource> => {
            const { id, ...updateFields } = input;

            const updateData: LearningSourceUpdate = {};

            if (updateFields.name !== undefined) updateData.name = updateFields.name;
            if (updateFields.logo_url !== undefined) updateData.logo_url = updateFields.logo_url;
            if (updateFields.website_url !== undefined) updateData.website_url = updateFields.website_url;
            if (updateFields.description !== undefined) updateData.description = updateFields.description;
            if (updateFields.category !== undefined) updateData.category = updateFields.category;
            if (updateFields.is_active !== undefined) updateData.is_active = updateFields.is_active;
            if (updateFields.display_order !== undefined) updateData.display_order = updateFields.display_order;

            const { data, error } = await supabase
                .from("learning_sources")
                .update(updateData)
                .eq("id", id)
                .select()
                .single();

            if (error) {
                throw error;
            }

            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["learning-sources-all"] });
            queryClient.invalidateQueries({ queryKey: ["learning-sources"] }); // For marquee
            toast({
                title: "Berhasil",
                description: "Sumber belajar berhasil diperbarui",
            });
        },
        onError: (error) => {
            logger.error("Error updating learning source:", error);
            toast({
                title: "Error",
                description: "Gagal memperbarui sumber belajar",
                variant: "destructive",
            });
        },
    });
}

// ============================================
// DELETE LEARNING SOURCE
// ============================================

export function useDeleteLearningSource() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (id: string): Promise<void> => {
            const { error } = await supabase
                .from("learning_sources")
                .delete()
                .eq("id", id);

            if (error) {
                throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["learning-sources-all"] });
            queryClient.invalidateQueries({ queryKey: ["learning-sources"] }); // For marquee
            toast({
                title: "Berhasil",
                description: "Sumber belajar berhasil dihapus",
            });
        },
        onError: (error) => {
            logger.error("Error deleting learning source:", error);
            toast({
                title: "Error",
                description: "Gagal menghapus sumber belajar",
                variant: "destructive",
            });
        },
    });
}

// ============================================
// TOGGLE ACTIVE STATUS
// ============================================

export function useToggleLearningSourceActive() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }): Promise<LearningSource> => {
            const { data, error } = await supabase
                .from("learning_sources")
                .update({ is_active })
                .eq("id", id)
                .select()
                .single();

            if (error) {
                throw error;
            }

            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["learning-sources-all"] });
            queryClient.invalidateQueries({ queryKey: ["learning-sources"] });
            toast({
                title: "Berhasil",
                description: data.is_active ? "Sumber belajar diaktifkan" : "Sumber belajar dinonaktifkan",
            });
        },
        onError: (error) => {
            logger.error("Error toggling learning source status:", error);
            toast({
                title: "Error",
                description: "Gagal mengubah status sumber belajar",
                variant: "destructive",
            });
        },
    });
}
