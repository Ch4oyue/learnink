import type { QueryClient } from '@tanstack/react-query';
import type { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

type FeedbackOptions = {
  queryClient: Pick<QueryClient, 'invalidateQueries'>;
  toast: ReturnType<typeof useToast>['toast'];
  queryKeys: readonly string[];
  success: string;
  failure: string;
  logMessage: string;
  logFirst?: boolean;
};

/** Reuse lifecycle feedback without changing any mutation's database operation. */
export function mutationFeedback({ queryClient, toast, queryKeys, success, failure, logMessage, logFirst = false }: FeedbackOptions) {
  return {
    onSuccess: () => {
      for (const key of queryKeys) queryClient.invalidateQueries({ queryKey: [key] });
      toast({ title: 'Success', description: success });
    },
    onError: (error: unknown) => {
      if (logFirst) logger.error(logMessage, error);
      toast({ title: 'Error', description: failure, variant: 'destructive' });
      if (!logFirst) logger.error(logMessage, error);
    },
  };
}
