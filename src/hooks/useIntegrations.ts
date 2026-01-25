
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type Integration = Database["public"]["Tables"]["integrations"]["Row"];

export const useGetLatestIntegration = () => {
  return useQuery({
    queryKey: ["latest-integration", "n8n"],
    queryFn: async () => {
      // Fetch the most recent active integration for n8n
      const { data, error } = await supabase
        .from("integrations")
        .select("*")
        .eq("source", "n8n")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data;
    },
  });
};

export const useGenerateApiKey = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, description }: { name: string; description?: string }) => {
      const { data, error } = await supabase.functions.invoke("generate-api-key", {
        body: {
          name,
          source: "n8n",
          description,
        },
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || "Failed to generate API key");
      }

      return data;
    },
    onSuccess: () => {
      // Invalidate the cache to refresh the integration list/latest integration
      queryClient.invalidateQueries({ queryKey: ["latest-integration"] });
    },
  });
};
