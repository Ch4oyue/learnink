import { useEffect, useRef, useCallback } from "react";

interface UseScrollProgressOptions {
  contentRef: React.RefObject<HTMLElement>;
  onProgressChange: (progress: number) => void;
  debounceMs?: number;
}

export function useScrollProgress({
  contentRef,
  onProgressChange,
  debounceMs = 500,
}: UseScrollProgressOptions) {
  const lastProgress = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);

  // Cache layout metrics to avoid reading DOM on every scroll
  // This drastically reduces Layout Thrashing on low-end devices
  const metrics = useRef({
    top: 0,
    height: 0,
    windowHeight: 0
  });

  const updateMetrics = useCallback(() => {
    if (!contentRef.current) return;

    const element = contentRef.current;
    const rect = element.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;

    metrics.current = {
      // Calculate absolute top position in the document
      top: rect.top + scrollTop,
      height: element.scrollHeight,
      windowHeight: window.innerHeight
    };
  }, [contentRef]);

  const calculateProgress = useCallback(() => {
    // Fallback: If metrics aren't ready, measure immediately (should be rare)
    if (metrics.current.height === 0) {
      updateMetrics();
    }

    const { top, height, windowHeight } = metrics.current;
    const currentScrollY = window.scrollY || document.documentElement.scrollTop;

    // Calculate relative position based on cached absolute top and current scroll
    // This avoids getBoundingClientRect() in the hot path
    const currentRectTop = top - currentScrollY;

    // Calculate how much of the content has been scrolled past
    // Logic: distance past the viewport center
    const scrolled = Math.max(0, -currentRectTop + windowHeight * 0.5);
    const maxScroll = height - windowHeight * 0.5;

    if (maxScroll <= 0) return 100;

    const progress = Math.min(100, Math.max(0, (scrolled / maxScroll) * 100));
    return Math.round(progress);
  }, [updateMetrics]);

  const handleScroll = useCallback(() => {
    // Throttle with requestAnimationFrame
    if (rafRef.current !== null) return;

    rafRef.current = requestAnimationFrame(() => {
      const currentProgress = calculateProgress();

      // Only update if progress increased (don't decrease on scroll up)
      if (currentProgress > lastProgress.current) {
        lastProgress.current = currentProgress;

        // Debounce the callback to avoid too many updates
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          onProgressChange(currentProgress);
        }, debounceMs);
      }

      rafRef.current = null;
    });
  }, [calculateProgress, onProgressChange, debounceMs]);

  useEffect(() => {
    // Initial measurement
    updateMetrics();

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", updateMetrics, { passive: true });

    // Use ResizeObserver to detect content size changes (e.g. images loading)
    let resizeObserver: ResizeObserver | null = null;
    if (contentRef.current && typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        updateMetrics();
      });
      resizeObserver.observe(contentRef.current);
    }

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updateMetrics);

      if (resizeObserver) {
        resizeObserver.disconnect();
      }

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [handleScroll, updateMetrics, contentRef]);

  const setInitialProgress = useCallback((progress: number) => {
    lastProgress.current = progress;
  }, []);

  return { setInitialProgress };
}
