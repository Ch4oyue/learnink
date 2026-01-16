import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LearningSource {
    id: string;
    name: string;
    logo_url: string;
    website_url: string | null;
    description: string | null;
    category: string;
    display_order: number;
}

export function useLearningSourcesMarquee() {
    return useQuery({
        queryKey: ["learning-sources"],
        queryFn: async (): Promise<LearningSource[]> => {
            const { data, error } = await supabase
                .from("learning_sources")
                .select("id, name, logo_url, website_url, description, category, display_order")
                .eq("is_active", true)
                .order("display_order", { ascending: true });

            if (error) {
                console.error("Error fetching learning sources:", error);
                return [];
            }

            return data || [];
        },
        staleTime: 10 * 60 * 1000, // 10 minutes
        gcTime: 30 * 60 * 1000, // 30 minutes
    });
}
