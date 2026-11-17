import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, PlayCircle, Check } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef, useState, lazy, Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePerformance } from "@/hooks/usePerformance";

// Lazy load the heavy code block component
const InteractiveCodeBlock = lazy(() => import("./InteractiveCodeBlock"));

export function Hero() {
    const { user } = useAuth();
    const { tier } = usePerformance();
    // Low-tier devices get the finished result immediately: no entrance animation,
    // no typing loop competing with first paint.
    const reducedEffects = tier === "low";
    const mockupRef = useRef(null);
    const isInView = useInView(mockupRef, { once: true, amount: 0.3 });
    const [selectedLanguage, setSelectedLanguage] = useState<"javascript" | "python" | "typescript">("javascript");

    const languageOptions = [
        { key: "javascript" as const, label: "React", dot: "#61DAFB" },
        { key: "python" as const, label: "Python", dot: "#3776AB" },
        { key: "typescript" as const, label: "TypeScript", dot: "#3178C6" },
    ];

    return (
        <section className="pt-28 pb-20 sm:pt-32 sm:pb-28 overflow-hidden bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                {/* Version Badge */}
                <Badge
                    variant="outline"
                    className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-secondary border-transparent text-muted-foreground text-[13px] font-medium mb-8"
                >
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    V2.0 is live
                </Badge>

                {/* Main Heading */}
                <h1 className="text-[2.75rem] sm:text-6xl md:text-7xl font-semibold tracking-[-0.03em] text-foreground mb-6 leading-[1.04] text-balance">
                    Master technical skills,
                    <br className="hidden sm:block" />
                    <span className="text-primary">the lazy way.</span>
                </h1>

                {/* Subtitle */}
                <p className="max-w-xl mx-auto text-lg text-muted-foreground mb-10 leading-relaxed">
                    Real projects, guided notes, progress that tracks itself.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-16">
                    <Button
                        asChild
                        size="lg"
                        className="w-full sm:w-auto group"
                    >
                        <Link to="/auth">
                            Start Learning
                            <ArrowRight className="ml-1.5 h-4 w-4 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
                        </Link>
                    </Button>
                    <Button
                        variant="link"
                        size="lg"
                        asChild
                        className="w-full sm:w-auto text-primary hover:no-underline hover:text-primary/70"
                    >
                        {/* The label says what actually happens next. */}
                        <Link to={user ? "/dashboard" : "/auth"}>
                            {user ? "Open Dashboard" : "Sign in to try"}
                            <PlayCircle className="ml-1.5 h-4 w-4" aria-hidden="true" />
                        </Link>
                    </Button>
                </div>

                {/* Language Selector Pills */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    {languageOptions.map((option) => {
                        const isSelected = selectedLanguage === option.key;
                        return (
                            <button
                                key={option.key}
                                type="button"
                                aria-pressed={isSelected}
                                onClick={() => setSelectedLanguage(option.key)}
                                className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-colors duration-150 ${isSelected
                                    ? "bg-foreground text-background"
                                    : "bg-secondary text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                <span className="mr-2 h-2 w-2 rounded-full" style={{ backgroundColor: option.dot }} aria-hidden="true" />
                                {option.label}
                                {isSelected && <Check className="ml-1.5 h-4 w-4" aria-hidden="true" />}
                            </button>
                        );
                    })}
                </div>

                {/* Interactive Code Editor with 3D Scroll Animation */}
                <motion.div
                    ref={mockupRef}
                    className="relative mx-auto max-w-4xl"
                    style={{ perspective: 1200 }}
                    initial={reducedEffects ? false : { rotateX: 15, scale: 0.95, opacity: 0, y: 40 }}
                    animate={reducedEffects || isInView ? { rotateX: 0, scale: 1, opacity: 1, y: 0 } : { rotateX: 15, scale: 0.95, opacity: 0, y: 40 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    {/* Interactive Code Block */}
                    <Suspense fallback={
                        <div className="w-full h-[400px] bg-[#1e1e1e] rounded-xl border border-zinc-800/60 shadow-2xl animate-pulse flex items-center justify-center">
                            <span className="text-zinc-400 font-mono">Loading editor…</span>
                        </div>
                    }>
                        <InteractiveCodeBlock
                            language={selectedLanguage}
                            showTypingAnimation={!reducedEffects}
                            typingSpeed={12}
                        />
                    </Suspense>
                </motion.div>
            </div>
        </section>
    );
}
