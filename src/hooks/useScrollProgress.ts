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
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const calculateProgress = useCallback(() => {
    if (!contentRef.current) return 0;

    const element = contentRef.current;
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const elementHeight = element.scrollHeight;
    
    // Calculate how much of the content has been scrolled past
    const scrolled = Math.max(0, -rect.top + windowHeight * 0.5);
    const maxScroll = elementHeight - windowHeight * 0.5;
    
    const progress = Math.min(100, Math.max(0, (scrolled / maxScroll) * 100));
    return Math.round(progress);
  }, [contentRef]);

  const handleScroll = useCallback(() => {
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
  }, [calculateProgress, onProgressChange, debounceMs]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [handleScroll]);

  const setInitialProgress = useCallback((progress: number) => {
    lastProgress.current = progress;
  }, []);

  return { setInitialProgress };
}
