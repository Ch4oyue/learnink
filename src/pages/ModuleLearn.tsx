import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useModule } from "@/hooks/useModules";
import { useModuleProgress, useUpdateProgress } from "@/hooks/useUserProgress";
import { useLearningNotes, useCreateLearningNote, useDeleteLearningNote } from "@/hooks/useLearningNotes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Menu,
  StickyNote,
  Check,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useDebouncedCallback } from "@/hooks/useDebounce";

// Hybrid Components
import { HybridSidebar } from "@/components/module/HybridSidebar";
import { HybridContentRenderer } from "@/components/module/HybridContentRenderer";
import { HybridGuidedNotes } from "@/components/module/HybridGuidedNotes";

/**
 * ModuleLearn - Hybrid View with 4-Panel Layout
 * ==============================================
 * Layout: Rail (72px) + TOC (240px) + Content (flex) + Notes (360px)
 * Premium Dark Mode: #0b0c0e background, purple accents
 */

import { parseModuleSections } from "@/lib/moduleParser";

// ============================================
// MAIN COMPONENT
// ============================================

export default function ModuleLearn() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const { user, canAccessTrack } = useAuth();
  const { toast } = useToast();
  const contentRef = useRef<HTMLElement>(null);

  // Data hooks
  // Optimized: Fetching single module by ID instead of all modules
  const { data: module, isLoading } = useModule(moduleId ?? "");
  const { data: progress } = useModuleProgress(user?.id, moduleId);
  const updateProgress = useUpdateProgress();

  // Access Control Check
  useEffect(() => {
    if (!isLoading && module) {
      if (module.track_id && !canAccessTrack(module.track_id)) {
        toast({
          title: "Akses Ditolak",
          description: "Anda harus mendaftar di kursus ini untuk mengakses materi.",
          variant: "destructive",
        });
        navigate(`/dashboard/course/${module.track_id}`);
      }
    }
  }, [module, isLoading, canAccessTrack, navigate, toast]);

  // Notes hooks
  const { data: notes, isLoading: notesLoading } = useLearningNotes(user?.id, moduleId);
  const createNote = useCreateLearningNote();
  const deleteNote = useDeleteLearningNote();

  // UI State - Persist panel visibility in localStorage
  const [showTOC, setShowTOC] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("module-show-toc");
      return saved !== "false"; // Default true
    }
    return true;
  });
  const [showNotes, setShowNotes] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("module-show-notes");
      return saved !== "false"; // Default true
    }
    return true;
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileNotesOpen, setMobileNotesOpen] = useState(false);
  const [currentSectionId, setCurrentSectionId] = useState<string | null>(null);

  // Persist panel visibility to localStorage (memoized handlers)
  const handleSetShowTOC = useCallback((show: boolean) => {
    setShowTOC(show);
    localStorage.setItem("module-show-toc", String(show));
  }, []);

  const handleSetShowNotes = useCallback((show: boolean) => {
    setShowNotes(show);
    localStorage.setItem("module-show-notes", String(show));
  }, []);

  const handleToggleTOC = useCallback(() => handleSetShowTOC(!showTOC), [handleSetShowTOC, showTOC]);
  const handleBack = useCallback(() => navigate("/dashboard"), [navigate]);

  // ============================================
  // PROGRESS OPTIMIZATION
  // ============================================

  // Optimistic local progress to update UI immediately
  const [localMaxProgress, setLocalMaxProgress] = useState(0);

  // Sync with server progress on initial load (only if server is ahead)
  useEffect(() => {
    if (progress?.progress_percent) {
      setLocalMaxProgress(prev => Math.max(prev, progress.progress_percent || 0));
    }
  }, [progress?.progress_percent]);

  // Derived state for UI (use max of local and server)
  const currentProgress = Math.max(localMaxProgress, progress?.progress_percent || 0);

  // Track last saved progress to avoid redundant calls
  const lastSavedProgressRef = useRef<number>(0);

  // Define the actual API call
  const saveProgress = useCallback((newProgress: number) => {
    if (!user || !moduleId) return;

    // Only save if progress increased and is new
    if (newProgress > lastSavedProgressRef.current) {
        lastSavedProgressRef.current = newProgress;
        updateProgress.mutate({
            userId: user.id,
            moduleId: moduleId,
            progressPercent: Math.min(newProgress, 100),
            isCompleted: newProgress >= 100,
        });
    }
  }, [user, moduleId, updateProgress]);

  // Create a debounced version of the save function (3s delay) to prevent database spam
  const debouncedSaveProgress = useDebouncedCallback(saveProgress, 3000);

  // ============================================
  // OPTIMIZED: Parse sections ONCE when content changes
  // Returns { sections: Map, order: Array }
  // ============================================
  const { sections, order } = useMemo(() => {
    if (!module?.content) return { sections: {}, order: [] };
    return parseModuleSections(module.content);
  }, [module?.content]);

  // Get current section content via simple lookup (O(1))
  const currentSection = currentSectionId && sections[currentSectionId]
    ? sections[currentSectionId]
    : (order.length > 0 ? sections[order[0]] : null);

  const currentContent = currentSection?.content || module?.content || "";

  // Calculate index efficiently for progress bar (O(N) but negligible for N < 100)
  // We prioritize O(1) content lookup over index lookup
  const currentSectionIndex = currentSectionId ? order.indexOf(currentSectionId) : 0;

  // Navigation helpers
  const hasPrevious = currentSectionIndex > 0;
  const hasNext = currentSectionIndex < order.length - 1 && currentSectionIndex >= 0;

  // Set initial section
  useEffect(() => {
    if (order.length > 0 && !currentSectionId) {
      setCurrentSectionId(order[0]);
    }
  }, [order, currentSectionId]);

  // Scroll to top when section changes
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentSectionId]);

  // Update progress when changing sections (Using debounced save)
  useEffect(() => {
    if (order.length === 0 || currentSectionIndex < 0) return;

    const newProgress = Math.round(((currentSectionIndex + 1) / order.length) * 100);

    // Update local optimistic state immediately if it's a new high
    if (newProgress > localMaxProgress) {
      setLocalMaxProgress(newProgress);

      // Schedule DB update (debounced)
      debouncedSaveProgress(newProgress);
    }
  }, [currentSectionIndex, order.length, localMaxProgress, debouncedSaveProgress]);

  // Navigation handlers (Wrapped in useCallback)
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
    setMobileMenuOpen(false);
  }, []);

  // Note handlers (Wrapped in useCallback)
  const handleCreateNote = useCallback((content: string) => {
    if (content.trim() && user && moduleId) {
      createNote.mutate(
        {
          user_id: user.id,
          module_id: moduleId,
          content: content.trim(),
          highlighted_text: null,
        },
        {
          onSuccess: () => {
            toast({ title: "Note Created!" });
          },
        }
      );
    }
  }, [createNote, user, moduleId, toast]);

  const handleDeleteNote = useCallback((noteId: string) => {
    deleteNote.mutate(noteId);
  }, [deleteNote]);

  const handleAddToNotes = useCallback((text: string) => {
    if (text && user && moduleId) {
      createNote.mutate(
        {
          user_id: user.id,
          module_id: moduleId,
          content: "Added from content",
          highlighted_text: text.slice(0, 200),
        },
        {
          onSuccess: () => {
            toast({ title: "Added to notes!" });
          },
        }
      );
    }
  }, [createNote, user, moduleId, toast]);

  // Stable props objects
  const metadata = useMemo(() => ({
    title: currentSection?.title || module?.title || "",
    description: module?.summary || undefined,
    category: module?.category || undefined,
    readingTime: Math.ceil((currentContent?.length || 0) / 1000),
  }), [currentSection, module, currentContent]);

  // ============================================
  // LOADING STATE
  // ============================================

  if (isLoading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading module...</p>
        </div>
      </div>
    );
  }

  // ============================================
  // NOT FOUND STATE
  // ============================================

  if (!module) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center py-16">
          <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Module Not Found</h1>
          <p className="text-muted-foreground mb-6">The module you're looking for doesn't exist.</p>
          <Button onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // ============================================
  // MAIN RENDER - 4 PANEL HYBRID LAYOUT
  // ============================================

  return (
    <div className="h-screen overflow-hidden flex bg-background">
      {/* ============================================
          PANEL 1: Icon Rail (72px) - Desktop Only
      ============================================ */}
      <div className="hidden md:block">
        <HybridSidebar
          activeTab={showTOC ? "toc" : "content"}
          onTableOfContentsClick={handleToggleTOC}
          onBackClick={handleBack}
        />
      </div>

      {/* ============================================
          PANEL 2: TOC Sidebar (240px) - Collapsible
      ============================================ */}
      {showTOC && (
        <aside className="hidden md:flex w-[240px] bg-sidebar border-r border-sidebar-border flex-col shrink-0">
          {/* TOC Header */}
          <div className="p-4 border-b border-sidebar-border">
            <h2 className="font-bold text-foreground text-sm mb-3 line-clamp-2">{module.title}</h2>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${currentProgress}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 font-medium">{currentProgress}% complete</p>
          </div>

          {/* TOC List */}
          <ScrollArea className="flex-1 p-3">
            <nav className="space-y-1">
              {!Array.isArray(order) || order.length === 0 ? (
                <p className="text-sm text-muted-foreground p-2">No sections</p>
              ) : (
                order.map((sectionId, index) => {
                  const item = sections[sectionId];
                  if (!item) return null; // Defensive check

                  const isActive = item.id === currentSectionId;
                  const isCompleted = currentSectionId
                    ? order.indexOf(currentSectionId) > index
                    : false;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSectionClick(item.id)}
                      className={cn(
                        "w-full text-left p-2.5 rounded-lg transition-all flex items-start gap-2 text-sm",
                        isActive
                          ? "bg-primary/10 text-primary border-l-2 border-primary"
                          : isCompleted
                            ? "text-muted-foreground hover:bg-muted"
                            : "text-foreground hover:bg-muted",
                        item.level === 2 && "pl-4",
                        item.level === 3 && "pl-6"
                      )}
                    >
                      <span
                        className={cn(
                          "shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : isCompleted
                              ? "bg-green-500/20 text-green-400"
                              : "bg-muted text-muted-foreground"
                        )}
                      >
                        {isCompleted ? <Check className="h-3 w-3" /> : index + 1}
                      </span>
                      <span className="line-clamp-2">{item.title}</span>
                    </button>
                  );
                })
              )}
            </nav>
          </ScrollArea>
        </aside>
      )}

      {/* ============================================
          PANEL 3: Main Content (Flex 1)
      ============================================ */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden h-14 flex items-center justify-between px-4 border-b border-border bg-card shrink-0">
          {/* Progress Bar */}
          <div className="absolute top-0 left-0 w-full h-1 bg-muted">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${currentProgress}%` }}
            />
          </div>

          {/* Left: Menu + Title */}
          <div className="flex items-center gap-3">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0 bg-sidebar border-border">
                <div className="p-4 border-b border-border">
                  <h2 className="font-bold text-foreground">Table of Contents</h2>
                </div>
                <ScrollArea className="h-[calc(100vh-60px)] p-3">
                  <nav className="space-y-1">
                    {Array.isArray(order) && order.map((sectionId, index) => {
                      const item = sections[sectionId];
                      if (!item) return null; // Defensive check

                      const isActive = item.id === currentSectionId;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSectionClick(item.id)}
                          className={cn(
                            "w-full text-left p-3 rounded-lg flex items-center gap-3 text-sm",
                            isActive
                              ? "bg-primary/10 text-primary"
                              : "text-foreground hover:bg-muted"
                          )}
                        >
                          <span className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                            isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                          )}>
                            {index + 1}
                          </span>
                          {item.title}
                        </button>
                      );
                    })}
                  </nav>
                </ScrollArea>
              </SheetContent>
            </Sheet>

            <div>
              <h1 className="font-semibold text-sm text-foreground line-clamp-1">{module.title}</h1>
              <p className="text-[10px] text-muted-foreground">
                {currentSectionIndex + 1} of {order.length || 1}
              </p>
            </div>
          </div>

          {/* Right: Notes Toggle */}
          <Sheet open={mobileNotesOpen} onOpenChange={setMobileNotesOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <StickyNote className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 p-0 bg-sidebar border-border">
              <HybridGuidedNotes
                notes={notes || []}
                isLoading={notesLoading}
                onCreateNote={handleCreateNote}
                onDeleteNote={handleDeleteNote}
                isCreating={createNote.isPending}
                isDeleting={deleteNote.isPending}
              />
            </SheetContent>
          </Sheet>
        </header>

        {/* Content Renderer */}
        <HybridContentRenderer
          ref={contentRef}
          content={currentContent}
          metadata={metadata}
          onAddToNotes={handleAddToNotes}
          isLoading={false}
        />

        {/* Navigation Buttons (Bottom Bar) */}
        <div className="h-16 border-t border-border bg-card flex items-center justify-between px-6 shrink-0">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={!hasPrevious}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <Badge variant="secondary">
            {currentSectionIndex + 1} / {order.length || 1}
          </Badge>

          {hasNext ? (
            <Button onClick={handleNext}>
              Next Section
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={() => navigate("/dashboard")}
              className="bg-green-600 hover:bg-green-500 text-white"
            >
              <Check className="h-4 w-4 mr-2" />
              Complete
            </Button>
          )}
        </div>
      </div>

      {/* ============================================
          PANEL 4: Notes Panel (360px) - Desktop Only, Collapsible
      ============================================ */}
      {showNotes && (
        <div className="hidden lg:block">
          <HybridGuidedNotes
            notes={notes || []}
            isLoading={notesLoading}
            onCreateNote={handleCreateNote}
            onDeleteNote={handleDeleteNote}
            isCreating={createNote.isPending}
            isDeleting={deleteNote.isPending}
          />
        </div>
      )}
    </div>
  );
}
