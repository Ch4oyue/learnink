import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useDebouncedCallback } from "@/hooks/useDebounce";
import { parseModuleSections } from "@/lib/moduleParser";

interface UseModuleNavigationProps {
  moduleId?: string;
  userId?: string;
  moduleContent?: string;
  serverProgress?: number;
  onUpdateProgress: (data: { userId: string; moduleId: string; progressPercent: number; isCompleted: boolean }) => void;
}

export function useModuleNavigation({
  moduleId,
  userId,
  moduleContent,
  serverProgress,
  onUpdateProgress,
}: UseModuleNavigationProps) {
  // 1. Parse Sections
  const { sections, order } = useMemo(() => {
    if (!moduleContent) return { sections: {}, order: [] };
    return parseModuleSections(moduleContent);
  }, [moduleContent]);

  // 2. Local State & Persistence
  const [currentSectionId, setCurrentSectionId] = useState<string | null>(() => {
    if (typeof window !== "undefined" && moduleId) {
      return localStorage.getItem(`last_section_${moduleId}`);
    }
    return null;
  });

  const [localMaxProgress, setLocalMaxProgress] = useState(0);
  const [maxVisitedSectionIndex, setMaxVisitedSectionIndex] = useState(0);
  const isInitialMountRef = useRef(true);

  // Set initial section if none found in storage
  useEffect(() => {
    if (order.length > 0 && !currentSectionId) {
      setCurrentSectionId(order[0]);
    }
  }, [order, currentSectionId]);

  // Save section to storage on change
  useEffect(() => {
    if (moduleId && currentSectionId) {
      localStorage.setItem(`last_section_${moduleId}`, currentSectionId);
    }
  }, [moduleId, currentSectionId]);

  // 3. Sync with Server Progress
  useEffect(() => {
    if (serverProgress !== undefined) {
      setLocalMaxProgress((prev) => Math.max(prev, serverProgress));

      // Calculate max visited index from server progress
      if (order.length > 0) {
        const estimatedIndex = Math.floor((serverProgress / 100) * order.length);
        setMaxVisitedSectionIndex((prev) => Math.max(prev, estimatedIndex));
      }
    }
  }, [serverProgress, order.length]);

  // Derived Progress
  const currentProgress = Math.max(localMaxProgress, serverProgress || 0);

  // 4. Progress Saving Logic
  const lastSavedProgressRef = useRef<number>(0);

  const saveProgress = useCallback(
    (newProgress: number) => {
      if (!userId || !moduleId) return;

      // CRITICAL: Only save if new progress is strictly greater than what's on server
      // OR what we last saved. This prevents the "reset to 0 on refresh" bug.
      const baseline = Math.max(serverProgress || 0, lastSavedProgressRef.current);

      if (newProgress > baseline) {
        lastSavedProgressRef.current = newProgress;
        onUpdateProgress({
          userId,
          moduleId,
          progressPercent: Math.min(newProgress, 100),
          isCompleted: newProgress >= 100,
        });
      }
    },
    [userId, moduleId, onUpdateProgress, serverProgress]
  );

  const debouncedSaveProgress = useDebouncedCallback(saveProgress, 3000);

  // 5. Current Section Helpers
  const currentSection =
    currentSectionId && sections[currentSectionId]
      ? sections[currentSectionId]
      : order.length > 0
      ? sections[order[0]]
      : null;

  const currentContent = currentSection?.content || moduleContent || "";
  const currentSectionIndex = currentSectionId ? order.indexOf(currentSectionId) : 0;

  // 6. Navigation Helpers
  const hasPrevious = currentSectionIndex > 0;
  const hasNext = currentSectionIndex < order.length - 1 && currentSectionIndex >= 0;

  const handlePrevious = useCallback(() => {
    if (currentSectionIndex > 0) {
      setCurrentSectionId(order[currentSectionIndex - 1]);
    }
  }, [currentSectionIndex, order]);

  const handleNext = useCallback(() => {
    if (currentSectionIndex < order.length - 1) {
      setCurrentSectionId(order[currentSectionIndex + 1]);
    }
  }, [currentSectionIndex, order]);

  const handleSectionClick = useCallback((sectionId: string) => {
    setCurrentSectionId(sectionId);
  }, []);

  const resetLocalProgress = useCallback(() => {
    setLocalMaxProgress(0);
    setMaxVisitedSectionIndex(0);
    setCurrentSectionId(order.length > 0 ? order[0] : null);
  }, [order]);

  // 7. Update Progress on Section Change
  useEffect(() => {
    if (order.length === 0 || currentSectionIndex < 0) return;

    // Don't auto-save if we haven't even loaded server progress yet
    if (serverProgress === undefined) return;

    // Update max visited index
    setMaxVisitedSectionIndex(prev => Math.max(prev, currentSectionIndex));

    const newProgress = Math.round(((currentSectionIndex + 1) / order.length) * 100);

    // Only update and trigger save if it's actual progress
    if (newProgress > localMaxProgress) {
      setLocalMaxProgress(newProgress);
      debouncedSaveProgress(newProgress);
    }
  }, [currentSectionIndex, order.length, localMaxProgress, debouncedSaveProgress, serverProgress]);

  return {
    currentSectionId,
    setCurrentSectionId,
    currentSection,
    currentContent,
    currentSectionIndex,
    currentProgress,
    sections,
    order,
    hasPrevious,
    hasNext,
    handlePrevious,
    handleNext,
    handleSectionClick,
    maxVisitedSectionIndex,
    resetLocalProgress,
  };
}
