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
        { key: "javascript" as const, label: "React", icon: "⚛️" },
        { key: "python" as const, label: "Python", icon: "🐍" },
        { key: "typescript" as const, label: "TypeScript", icon: "📘" },
    ];

    return (
        <section className="pt-28 pb-20 sm:pt-32 sm:pb-28 overflow-hidden bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                {/* Version Badge */}
                <Badge
                    variant="outline"
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border-primary/30 text-primary text-sm font-medium mb-10"
                >
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse motion-reduce:animate-none" />
                    V2.0 IS LIVE
                </Badge>

                {/* Main Heading */}
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground mb-8 leading-[1.1] text-balance">
                    Master Technical Skills,
                    <br className="hidden sm:block" />
                    <span className="text-primary">The Lazy Way.</span>
                </h1>

                {/* Subtitle */}
                <p className="max-w-2xl mx-auto text-lg sm:text-xl text-muted-foreground mb-12 leading-relaxed">
                    Stop watching endless tutorials. Build real projects with{" "}
                    <strong className="text-foreground font-semibold">Guided Notes</strong>{" "}
                    that tracks your progress automatically.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-16">
                    <Button
                        asChild
                        size="lg"
                        className="w-full sm:w-auto px-8 py-3.5 shadow-glow group"
                    >
                        <Link to="/auth">
                            Start Learning Now
                            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                        </Link>
                    </Button>
                    <Button
                        variant="outline"
                        size="lg"
                        asChild
                        className="w-full sm:w-auto px-8 py-3.5"
                    >
                        {/* The label says what actually happens next. */}
                        <Link to={user ? "/dashboard" : "/auth"}>
                            <PlayCircle className="mr-2 h-5 w-5" aria-hidden="true" />
                            {user ? "Open Dashboard" : "Sign In to Try"}
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
                                className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${isSelected
                                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 ring-2 ring-primary/40 ring-offset-2 ring-offset-background"
                                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                                    }`}
                            >
                                <span className="mr-1.5" aria-hidden="true">{option.icon}</span>
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
