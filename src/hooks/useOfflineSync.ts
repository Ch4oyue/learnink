import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

interface PendingSync {
  userId: string;
  moduleId: string;
  progressPercent: number;
  isCompleted?: boolean;
  timestamp: string;
}

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [pendingSyncs, setPendingSyncs] = useState<PendingSync[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("pending_progress_syncs");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const saveToOfflineQueue = useCallback((sync: PendingSync) => {
    setPendingSyncs((prev) => {
      // Remove existing pending sync for the same module to avoid duplicates
      const filtered = prev.filter(p => p.moduleId !== sync.moduleId);
      const updated = [...filtered, sync];
      localStorage.setItem("pending_progress_syncs", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const syncNow = useCallback(async () => {
    if (!isOnline || pendingSyncs.length === 0) return;

    logger.info(`Starting offline sync for ${pendingSyncs.length} items...`);
    const successfulSyncIds: string[] = [];

    for (const item of pendingSyncs) {
      try {
        const updateData: {
          user_id: string;
          module_id: string;
          progress_percent: number;
          is_completed?: boolean;
          completed_at?: string;
        } = {
          user_id: item.userId,
          module_id: item.moduleId,
          progress_percent: item.progressPercent,
        };

        if (item.isCompleted) {
          updateData.is_completed = true;
          updateData.completed_at = item.timestamp;
        }

        const { error } = await supabase
          .from("user_progress")
          .upsert(updateData, { onConflict: "user_id,module_id" });

        if (!error) {
          successfulSyncIds.push(item.moduleId);
        }
      } catch (err) {
        logger.error("Error during background sync:", err);
      }
    }

    setPendingSyncs((prev) => {
      const remaining = prev.filter(p => !successfulSyncIds.includes(p.moduleId));
      localStorage.setItem("pending_progress_syncs", JSON.stringify(remaining));
      return remaining;
    });

    if (successfulSyncIds.length > 0) {
      logger.info(`Successfully synced ${successfulSyncIds.length} items.`);
    }
  }, [isOnline, pendingSyncs]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pendingSyncs.length > 0) {
      syncNow();
    }
  }, [isOnline, pendingSyncs.length, syncNow]);

  return { isOnline, pendingSyncs, saveToOfflineQueue, syncNow };
}
