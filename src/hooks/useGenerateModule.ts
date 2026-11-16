import { logger } from "@/lib/logger";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useGenerateModule() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (requestId: string) => {
      const { data, error } = await supabase.functions.invoke('generate-module', {
        body: { request_id: requestId }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['my-requests'] });
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      queryClient.invalidateQueries({ queryKey: ['my-modules'] });
      toast({
        title: "Module Created!",
        description: "A new module has been generated from the material request.",
      });
    },
    onError: (error: Error) => {
      logger.error('Error generating module:', error);
      toast({
        title: "Module generation failed",
        description: error.message || "An error occurred while generating the module.",
        variant: "destructive",
      });
    },
  });
}
