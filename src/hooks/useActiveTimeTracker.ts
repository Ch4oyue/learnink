import { useEffect, useRef, useCallback } from 'react';
import { logger } from '@/lib/logger';

import { supabase } from '@/integrations/supabase/client';

const IDLE_TIMEOUT_MS = 60 * 1000; // 60 seconds
const SYNC_INTERVAL_MS = 10 * 1000; // 10 seconds
const ACTIVITY_UPDATE_THROTTLE_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Tracks active time on a module.
 *
 * The counter lives in a ref on purpose: publishing it through state meant one
 * React render per second of the whole learn page (markdown, TOC, quiz) for a
 * value no screen displays. Read `totalTimeRef.current` when you need it.
 */
export function useActiveTimeTracker(moduleId: string | undefined, userId: string | undefined) {
  const lastActivityRef = useRef<number>(Date.now());
  const lastDbUpdateRef = useRef<number>(0); // Track last DB sync
  const totalTimeRef = useRef(0);

  // Load initial time from local storage
  useEffect(() => {
    if (!moduleId || !userId) return;

    totalTimeRef.current = 0;
    lastActivityRef.current = Date.now();
    lastDbUpdateRef.current = 0;

    const key = `learnink_analytics_${userId}_${moduleId}`;
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.timeSpent === 'number') {
          totalTimeRef.current = parsed.timeSpent;
        }
      }
    } catch (e) {
      logger.error("Failed to load analytics", e);
    }
  }, [moduleId, userId]);

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
    // Passive listeners: none of these need to block scrolling.
    events.forEach(event => window.addEventListener(event, handleActivity, { passive: true }));

    return () => {
      events.forEach(event => window.removeEventListener(event, handleActivity));
    };
  }, [handleActivity, moduleId, userId]);

  // Timer loop - ref only, no state updates while the learner is reading
  useEffect(() => {
    if (!moduleId || !userId) return;

    const interval = setInterval(() => {
      const isIdle = Date.now() - lastActivityRef.current > IDLE_TIMEOUT_MS;

      if (!isIdle && !document.hidden) {
        totalTimeRef.current += 1;
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

  return { totalTimeRef };
}
