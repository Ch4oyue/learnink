import { useState, useEffect, useRef, useMemo } from "react";
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
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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

// ============================================
// TYPES
// ============================================

interface SectionData {
  id: string;
  title: string;
  level: number;
  content: string;
}

// ============================================
// HELPER: Parse all sections from Markdown (ONE-TIME)
// ============================================

function parseModuleSections(markdown: string): SectionData[] {
  if (!markdown) return [];

  const lines = markdown.split("\n");
  const sections: SectionData[] = [];
  const headingRegex = /^(#{1,3})\s+(.+)$/;

  let currentSection: SectionData | null = null;
  let contentLines: string[] = [];

  for (const line of lines) {
    const match = line.match(headingRegex);

    if (match) {
      // Save previous section if exists
      if (currentSection) {
        currentSection.content = contentLines.join("\n").trim();
        sections.push(currentSection);
      }

      // Start new section
      const level = match[1].length;
      const title = match[2].trim();
      const id = title
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-");

      currentSection = { id, title, level, content: "" };
      contentLines = [line]; // Include heading in content
    } else {
      // Accumulate content lines
      contentLines.push(line);
    }
  }

  // Don't forget the last section
  if (currentSection) {
    currentSection.content = contentLines.join("\n").trim();
    sections.push(currentSection);
  }

  return sections;
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function ModuleLearn() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const contentRef = useRef<HTMLElement>(null);

  // Data hooks
  const { data: module, isLoading } = useModule(moduleId ?? "");
  const { data: progress, refetch: refetchProgress } = useModuleProgress(user?.id, moduleId);
  const updateProgress = useUpdateProgress();

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

  // Persist panel visibility to localStorage
  const handleSetShowTOC = (show: boolean) => {
    setShowTOC(show);
    localStorage.setItem("module-show-toc", String(show));
  };

  const handleSetShowNotes = (show: boolean) => {
    setShowNotes(show);
    localStorage.setItem("module-show-notes", String(show));
  };

  // Derived state
  const currentProgress = progress?.progress_percent || 0;

  // ============================================
  // OPTIMIZED: Parse sections ONCE when content changes
  // ============================================
  const sections = useMemo(() => {
    if (!module?.content) return [];
    return parseModuleSections(module.content);
  }, [module?.content]);

  // Get current section content via simple lookup (O(n) but no string splitting)
  const currentSectionIndex = sections.findIndex((s) => s.id === currentSectionId);
  const currentSection = currentSectionIndex >= 0 ? sections[currentSectionIndex] : sections[0];
  const currentContent = currentSection?.content || module?.content || "";

  // Navigation helpers
  const hasPrevious = currentSectionIndex > 0;
  const hasNext = currentSectionIndex < sections.length - 1 && currentSectionIndex >= 0;

  // Set initial section
  useEffect(() => {
    if (sections.length > 0 && !currentSectionId) {
      setCurrentSectionId(sections[0].id);
    }
  }, [sections, currentSectionId]);

  // Scroll to top when section changes
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentSectionId]);

  // Update progress when changing sections
  useEffect(() => {
    if (!user || !moduleId || sections.length === 0 || currentSectionIndex < 0) return;

    const newProgress = Math.round(((currentSectionIndex + 1) / sections.length) * 100);
    if (newProgress > currentProgress) {
      // Silently save progress without notification
      updateProgress.mutate(
        {
          userId: user.id,
          moduleId: moduleId,
          progressPercent: Math.min(newProgress, 100),
          isCompleted: newProgress >= 100,
        },
        { onSuccess: () => refetchProgress() }
      );
    }
  }, [currentSectionIndex, sections.length, user, moduleId, currentProgress, updateProgress, refetchProgress]);

  // Navigation handlers
  const handlePrevious = () => {
    if (hasPrevious) {
      setCurrentSectionId(sections[currentSectionIndex - 1].id);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      setCurrentSectionId(sections[currentSectionIndex + 1].id);
    }
  };

  const handleSectionClick = (sectionId: string) => {
    setCurrentSectionId(sectionId);
    setMobileMenuOpen(false);
  };

  // Note handlers
  const handleCreateNote = (content: string) => {
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
  };

  const handleDeleteNote = (noteId: string) => {
    deleteNote.mutate(noteId);
  };

  const handleAddToNotes = (text: string) => {
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
  };

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
          onTableOfContentsClick={() => handleSetShowTOC(!showTOC)}
          onBackClick={() => navigate("/dashboard")}
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
              {sections.length === 0 ? (
                <p className="text-sm text-muted-foreground p-2">No sections</p>
              ) : (
                sections.map((item, index) => {
                  const isActive = item.id === currentSectionId;
                  const isCompleted = currentSectionId
                    ? sections.findIndex((i) => i.id === currentSectionId) > index
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
                    {sections.map((item, index) => {
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
                {currentSectionIndex + 1} of {sections.length || 1}
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
          metadata={{
            title: currentSection?.title || module.title,
            description: module.summary || undefined,
            category: module.category || undefined,
            readingTime: Math.ceil((currentContent?.length || 0) / 1000),
          }}
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
            {currentSectionIndex + 1} / {sections.length || 1}
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
