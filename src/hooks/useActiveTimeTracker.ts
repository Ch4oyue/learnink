import { useEffect, useRef, useState, useCallback } from 'react';
import { logger } from '@/lib/logger';

const IDLE_TIMEOUT_MS = 60 * 1000; // 60 seconds
const SYNC_INTERVAL_MS = 10 * 1000; // 10 seconds

export function useActiveTimeTracker(moduleId: string | undefined, userId: string | undefined) {
  const lastActivityRef = useRef<number>(Date.now());
  const startTimeRef = useRef<number>(Date.now());
  const [totalTime, setTotalTime] = useState(0); // Exposed for UI if needed

  // Ref to track totalTime for effect access without dependency
  const totalTimeRef = useRef(0);

  // Sync state to ref
  useEffect(() => {
    totalTimeRef.current = totalTime;
  }, [totalTime]);

  // Load initial time from local storage
  useEffect(() => {
    if (!moduleId || !userId) return;

    const key = `learnink_analytics_${userId}_${moduleId}`;
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.timeSpent === 'number') {
          setTotalTime(parsed.timeSpent);
          totalTimeRef.current = parsed.timeSpent;
        }
      }
    } catch (e) {
      logger.error("Failed to load analytics", e);
    }
  }, [moduleId, userId]);

  import { supabase } from '@/integrations/supabase/client';

  // ... existing code ...

  const ACTIVITY_UPDATE_THROTTLE_MS = 5 * 60 * 1000; // 5 minutes

  export function useActiveTimeTracker(moduleId: string | undefined, userId: string | undefined) {
    const lastActivityRef = useRef<number>(Date.now());
    const lastDbUpdateRef = useRef<number>(0); // Track last DB sync
    // ... existing code ...

    // Activity listener with DB sync throttling
    const handleActivity = useCallback(() => {
      const now = Date.now();
      lastActivityRef.current = now;

      // Throttle DB updates to avoid spamming profile updates
      if (userId && now - lastDbUpdateRef.current > ACTIVITY_UPDATE_THROTTLE_MS) {
        lastDbUpdateRef.current = now;

        // Fire and forget update
        supabase.from('profiles').update({
          last_activity_date: new Date().toISOString()
        }).eq('id', userId).then(({ error }) => {
          if (error) logger.error('Failed to update activity', error);
        });
      }
    }, [userId]);

    useEffect(() => {
      if (!moduleId || !userId) return;

      const events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];
      events.forEach(event => window.addEventListener(event, handleActivity));

      return () => {
        events.forEach(event => window.removeEventListener(event, handleActivity));
      };
    }, [handleActivity, moduleId, userId]);

    // Timer loop
    useEffect(() => {
      if (!moduleId || !userId) return;

      const interval = setInterval(() => {
        // Check idle status
        const now = Date.now();
        const timeSinceLastActivity = now - lastActivityRef.current;
        const isIdle = timeSinceLastActivity > IDLE_TIMEOUT_MS;
        const isHidden = document.hidden;

        if (!isIdle && !isHidden) {
          setTotalTime(prev => prev + 1);
        }
      }, 1000);

      return () => clearInterval(interval);
    }, [moduleId, userId]);

    // Sync effect
    useEffect(() => {
      if (!moduleId || !userId) return;

      // Save on unmount or visibility change or periodically
      const key = `learnink_analytics_${userId}_${moduleId}`;

      const save = () => {
        localStorage.setItem(key, JSON.stringify({
          timeSpent: totalTimeRef.current,
          lastUpdated: new Date().toISOString()
        }));
      };

      // Auto save every SYNC_INTERVAL
      const syncInterval = setInterval(save, SYNC_INTERVAL_MS);

      // Save on visibility change (leaving tab)
      const handleVisibilityChange = () => {
        if (document.hidden) save();
      };
      document.addEventListener("visibilitychange", handleVisibilityChange);

      return () => {
        clearInterval(syncInterval);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        save(); // Save on unmount
      };
    }, [moduleId, userId]); // Dependencies stable, won't re-run every second

    return { totalTime };
  }
