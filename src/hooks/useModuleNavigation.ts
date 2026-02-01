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

  // 2. Local State
  const [currentSectionId, setCurrentSectionId] = useState<string | null>(null);
  const [localMaxProgress, setLocalMaxProgress] = useState(0);
  const [maxVisitedSectionIndex, setMaxVisitedSectionIndex] = useState(0);

  // Set initial section
  useEffect(() => {
    if (order.length > 0 && !currentSectionId) {
      setCurrentSectionId(order[0]);
    }
  }, [order, currentSectionId]);

  // 3. Sync with Server Progress
  useEffect(() => {
    if (serverProgress) {
      setLocalMaxProgress((prev) => Math.max(prev, serverProgress));

      // Calculate max visited index from server progress
      if (order.length > 0) {
        const estimatedIndex = Math.ceil((serverProgress / 100) * order.length) - 1;
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

      // Only save if progress increased and is new
      if (newProgress > lastSavedProgressRef.current) {
        lastSavedProgressRef.current = newProgress;
        onUpdateProgress({
          userId,
          moduleId,
          progressPercent: Math.min(newProgress, 100),
          isCompleted: newProgress >= 100,
        });
      }
    },
    [userId, moduleId, onUpdateProgress]
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

    // Update max visited index
    setMaxVisitedSectionIndex(prev => Math.max(prev, currentSectionIndex));

    const newProgress = Math.round(((currentSectionIndex + 1) / order.length) * 100);

    if (newProgress > localMaxProgress) {
      setLocalMaxProgress(newProgress);
      debouncedSaveProgress(newProgress);
    }
  }, [currentSectionIndex, order.length, localMaxProgress, debouncedSaveProgress]);

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
