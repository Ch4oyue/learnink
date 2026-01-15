import { useNavigate } from "react-router-dom";
import {
    Layers,
    Settings,
    Check,
    Lock,
    Code,
    ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

// ============================================
// TYPES
// ============================================

interface Lesson {
    id: string;
    title: string;
    duration?: string;
    isCompleted?: boolean;
    isActive?: boolean;
    isLocked?: boolean;
}

interface NewSidebarProps {
    courseName?: string;
    courseProgress?: number;
    totalLessons?: number;
    completedLessons?: number;
    lessons?: Lesson[];
    onLessonClick?: (lessonId: string) => void;
    onSettingsClick?: () => void;
}

// ============================================
// MAIN COMPONENT (Fixed Position Sidebar)
// ============================================

export function NewSidebar({
    courseName = "Course Title",
    courseProgress = 0,
    totalLessons = 0,
    completedLessons = 0,
    lessons = [],
    onLessonClick,
    onSettingsClick,
}: NewSidebarProps) {
    const navigate = useNavigate();

    return (
        <aside className="fixed top-0 left-0 h-full w-[280px] bg-[#111316] border-r border-zinc-800 flex flex-col shrink-0 z-50">
            {/* Header with Logo */}
            <div className="h-14 flex items-center px-5 border-b border-zinc-800 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-black font-bold">
                        <Layers className="h-4 w-4" />
                    </div>
                    <span className="text-white font-semibold tracking-wide">LearnInk</span>
                </div>
            </div>

            {/* Course Info Section */}
            <div className="p-5 border-b border-zinc-800/50">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">
                    Current Course
                </h3>
                <h2 className="text-white font-medium mb-3 text-glow">{courseName}</h2>

                {/* Progress Bar */}
                <div className="relative w-full h-1.5 bg-zinc-800 rounded-full mb-2 overflow-hidden">
                    <div
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all duration-500"
                        style={{ width: `${courseProgress}%` }}
                    />
                </div>
                <div className="flex justify-between text-[11px] font-mono text-zinc-500">
                    <span>{courseProgress}% Complete</span>
                    <span>
                        {completedLessons}/{totalLessons}
                    </span>
                </div>
            </div>

            {/* Navigation List */}
            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                {lessons.map((lesson) => {
                    if (lesson.isActive) {
                        // Active Item
                        return (
                            <button
                                key={lesson.id}
                                onClick={() => onLessonClick?.(lesson.id)}
                                className="group relative block w-full p-3 rounded-r-xl rounded-l-sm bg-zinc-800 border-l-[3px] border-purple-500 shadow-md transition-all mb-1 text-left"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1 w-6 h-6 rounded-md bg-purple-500/10 flex items-center justify-center text-purple-400 text-xs shrink-0">
                                            <Code className="h-3.5 w-3.5" />
                                        </div>
                                        <div>
                                            <p className="text-white text-sm font-medium leading-tight">
                                                {lesson.title}
                                            </p>
                                            {lesson.duration && (
                                                <p className="text-[11px] text-zinc-500 mt-1">{lesson.duration}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 shrink-0" />
                                </div>
                            </button>
                        );
                    }

                    if (lesson.isCompleted) {
                        // Completed Item
                        return (
                            <button
                                key={lesson.id}
                                onClick={() => onLessonClick?.(lesson.id)}
                                className="group block w-full p-3 rounded-xl hover:bg-white/5 transition-colors opacity-60 text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 text-[10px] shrink-0">
                                        <Check className="h-3.5 w-3.5" />
                                    </div>
                                    <p className="text-zinc-400 text-sm font-medium line-through decoration-zinc-600">
                                        {lesson.title}
                                    </p>
                                </div>
                            </button>
                        );
                    }

                    // Locked/Default Item
                    return (
                        <button
                            key={lesson.id}
                            onClick={() => !lesson.isLocked && onLessonClick?.(lesson.id)}
                            className={cn(
                                "group block w-full p-3 rounded-xl transition-colors text-left",
                                lesson.isLocked
                                    ? "opacity-50 cursor-not-allowed"
                                    : "hover:bg-white/5"
                            )}
                            disabled={lesson.isLocked}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 flex items-center justify-center text-zinc-600 text-xs shrink-0">
                                    {lesson.isLocked ? (
                                        <Lock className="h-3.5 w-3.5" />
                                    ) : (
                                        <ChevronRight className="h-3.5 w-3.5" />
                                    )}
                                </div>
                                <p className="text-zinc-500 text-sm font-medium">{lesson.title}</p>
                            </div>
                        </button>
                    );
                })}
            </nav>

            {/* Bottom Preferences */}
            <div className="p-4 border-t border-zinc-800 mt-auto">
                <button
                    onClick={onSettingsClick || (() => navigate("/dashboard/settings"))}
                    className="flex items-center gap-3 text-zinc-500 hover:text-white transition-colors text-sm font-medium w-full py-2 px-3 rounded-lg hover:bg-zinc-800"
                >
                    <Settings className="h-4 w-4" />
                    <span>Preferences</span>
                </button>
            </div>
        </aside>
    );
}
