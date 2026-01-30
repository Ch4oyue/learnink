import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useModule } from "@/hooks/useModules";
import { supabase } from "@/integrations/supabase/client";
import { useModuleProgress, useUpdateProgress } from "@/hooks/useUserProgress";
import { useLearningNotes, useCreateLearningNote, useDeleteLearningNote } from "@/hooks/useLearningNotes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
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
import ErrorBoundary from "@/components/ErrorBoundary";
import { usePyodidePreload } from "@/hooks/usePyodidePreload";
import { useModuleNavigation } from "@/hooks/useModuleNavigation";
import { useActiveTimeTracker } from "@/hooks/useActiveTimeTracker";

// Hybrid Components
import { HybridSidebar } from "@/components/module/HybridSidebar";
import { HybridContentRenderer } from "@/components/module/HybridContentRenderer";
import { HybridGuidedNotes } from "@/components/module/HybridGuidedNotes";
import { GachaCompletionModal } from "@/components/module/GachaCompletionModal";
import { RefreshCcw } from "lucide-react";

/**
 * ModuleLearn - Hybrid View with 4-Panel Layout
 * ==============================================
 * Layout: Rail (72px) + TOC (240px) + Content (flex) + Notes (360px)
 * Premium Dark Mode: #0b0c0e background, purple accents
 */

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

  // Performance: Preload Pyodide if needed
  usePyodidePreload(module?.content);

  // Analytics: Track active time
  useActiveTimeTracker(moduleId, user?.id);

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
  // LOGIC: Use Custom Hook
  // ============================================
  const {
    currentSectionId,
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
  } = useModuleNavigation({
    moduleId,
    userId: user?.id,
    moduleContent: module?.content,
    serverProgress: progress?.progress_percent || 0,
    onUpdateProgress: updateProgress.mutate,
  });

  // UI Helper for clicking section (also closes menu)
  const onSectionClick = useCallback((id: string) => {
    handleSectionClick(id);
    setMobileMenuOpen(false);
  }, [handleSectionClick]);

  // Gacha Logic
  const [showGacha, setShowGacha] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [xpEarned, setXpEarned] = useState<number | null>(null);

  useEffect(() => {
    // Only show if completed AND not claimed yet
    if (currentProgress >= 100 && moduleId && progress && !progress.reward_claimed) {
      const key = `gacha_shown_${moduleId}`;
      const shown = localStorage.getItem(key);

      // If we haven't shown it locally, OR if we haven't claimed it (and it's not currently being claimed/shown)
      // Actually, if it's not claimed, we definitely want to give them a chance if they just finished.
      // But we don't want to spam them on every reload if they chose not to claim (though modal shouldn't be closable without claiming? No, user might close).
      // Prompt says: "Modal ini HANYA boleh muncul ketika user mencapai progress 100% pada sebuah modul. Cek database... Jangan munculkan modal jika user sudah pernah klaim"

      if (!shown) {
        setShowGacha(true);
        // We set local storage to avoid popup on refresh if they don't claim immediately?
        // Or strictly strictly follows: 100% + !claimed.
        // If I refresh, I still have 100% and !claimed. Should it show?
        // Maybe yes, until they claim.
        // But to avoid annoyance, maybe we keep the localStorage check for "session" logic,
        // but if they explicitly finished just now, it shows.
        localStorage.setItem(key, "true");
      }
    }
  }, [currentProgress, moduleId, progress]);

  const handleClaimReward = async () => {
    if (!moduleId || !user) return;

    setIsClaiming(true);
    try {
      const { data, error } = await supabase.functions.invoke('award-xp', {
        body: { module_id: moduleId }
      });

      if (error) throw error;

      if (data.success) {
        setXpEarned(data.xp_gained);
        toast({
          title: "Reward Claimed!",
          description: `You earned ${data.xp_gained} XP!`,
        });
        // Invalidate progress to update 'reward_claimed' status
        updateProgress.mutate({
           userId: user.id,
           moduleId: moduleId,
           progressPercent: 100, // Ensure it stays 100
           isCompleted: true
        });
      } else {
        throw new Error(data.error || "Failed to claim reward");
      }
    } catch (error) {
      console.error("Claim Error:", error);
      toast({
        title: "Error",
        description: error.message || "Could not claim reward. Please try again.",
        variant: "destructive",
      });
      // Allow trying again or close?
      // If error is "already claimed", we should probably close.
      if (error.message?.includes("already claimed")) {
         setShowGacha(false);
      }
    } finally {
      setIsClaiming(false);
    }
  };

  const handleResetProgress = useCallback(() => {
    if (window.confirm("Are you sure you want to reset your progress? You can earn XP again!")) {
      if (moduleId && user) {
        updateProgress.mutate({
          userId: user.id,
          moduleId: moduleId,
          progressPercent: 0,
          isCompleted: false
        });
        localStorage.removeItem(`gacha_shown_${moduleId}`);
        resetLocalProgress();
        toast({ title: "Progress reset!", description: "You can now re-learn this module." });
      }
    }
  }, [moduleId, user, updateProgress, resetLocalProgress, toast]);

  // Scroll to top when section changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentSectionId]);

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
    <div className="flex bg-background min-h-screen md:h-screen md:overflow-hidden">
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
                  const isCompleted = index < maxVisitedSectionIndex;

                  return (
                    <button
                      key={item.id}
                      onClick={() => onSectionClick(item.id)}
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
      <div className="w-full md:flex-1 flex flex-col md:overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden sticky top-0 z-50 min-h-14 h-auto pt-[env(safe-area-inset-top)] flex items-center justify-between px-4 border-b border-border bg-card shrink-0 transition-all">
          {/* Progress Bar */}
          <div className="absolute top-0 left-0 w-full h-1 bg-muted z-10">
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
                  <SheetTitle className="font-bold text-foreground">Table of Contents</SheetTitle>
                </div>
                <ScrollArea className="h-[calc(100vh-60px)] p-3">
                  <nav className="space-y-1">
                    {Array.isArray(order) && order.map((sectionId, index) => {
                      const item = sections[sectionId];
                      if (!item) return null; // Defensive check

                      const isActive = item.id === currentSectionId;
                      const isCompleted = index < maxVisitedSectionIndex;

                      return (
                        <button
                          key={item.id}
                          onClick={() => onSectionClick(item.id)}
                          className={cn(
                            "w-full text-left p-3 rounded-lg flex items-center gap-3 text-sm",
                            isActive
                              ? "bg-primary/10 text-primary"
                              : isCompleted
                                ? "text-muted-foreground hover:bg-muted"
                                : "text-foreground hover:bg-muted"
                          )}
                        >
                          <span className={cn(
                            "w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-xs font-bold",
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : isCompleted
                                ? "bg-green-500/20 text-green-400"
                                : "bg-muted text-muted-foreground"
                          )}>
                            {isCompleted ? <Check className="h-3.5 w-3.5" /> : index + 1}
                          </span>
                          <span className="line-clamp-2">{item.title}</span>
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
              <SheetTitle className="hidden">Guided Notes</SheetTitle>
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
        <ErrorBoundary>
          <HybridContentRenderer
            ref={contentRef}
            content={currentContent}
            metadata={metadata}
            onAddToNotes={handleAddToNotes}
            isLoading={false}
          />
        </ErrorBoundary>

        {/* Navigation Buttons (Bottom Bar) */}
        <div className="min-h-16 h-auto pb-[env(safe-area-inset-bottom)] border-t border-border bg-card flex items-center justify-between px-6 py-3 shrink-0 sticky bottom-0 z-50 md:static transition-all">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevious}
            disabled={!hasPrevious}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Badge variant="secondary">
            {currentSectionIndex + 1} / {order.length || 1}
          </Badge>

          {hasNext ? (
            <Button size="icon" onClick={handleNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handleResetProgress}
                title="Reset Progress"
              >
                <RefreshCcw className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => navigate(module?.track_id ? `/dashboard/course/${module.track_id}` : "/dashboard")}
                className="bg-green-600 hover:bg-green-500 text-white"
              >
                <Check className="h-4 w-4 mr-2" />
                Complete
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ============================================
          PANEL 4: Notes Panel (360px) - Desktop Only, Collapsible
      ============================================ */}
      {showNotes && (
        <div className="hidden lg:block">
          <ErrorBoundary>
            <HybridGuidedNotes
              notes={notes || []}
              isLoading={notesLoading}
              onCreateNote={handleCreateNote}
              onDeleteNote={handleDeleteNote}
              isCreating={createNote.isPending}
              isDeleting={deleteNote.isPending}
            />
          </ErrorBoundary>
        </div>
      )}

      <GachaCompletionModal
        isOpen={showGacha}
        onClose={() => {
          setShowGacha(false);
          // If they closed after earning, we can reset state for next time (though next time won't happen for this module)
          if (xpEarned !== null) {
             setXpEarned(null);
          }
        }}
        moduleTitle={module.title}
        onClaim={handleClaimReward}
        isClaiming={isClaiming}
        xpEarned={xpEarned}
      />
    </div>
  );
}
