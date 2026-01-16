import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, PlayCircle } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { InteractiveCodeBlock } from "./InteractiveCodeBlock";

export function Hero() {
    const mockupRef = useRef(null);
    const isInView = useInView(mockupRef, { once: true, amount: 0.3 });
    const [selectedLanguage, setSelectedLanguage] = useState<"javascript" | "python" | "typescript">("javascript");

    const languageOptions = [
        { key: "javascript" as const, label: "React", icon: "⚛️" },
        { key: "python" as const, label: "Python", icon: "🐍" },
        { key: "typescript" as const, label: "TypeScript", icon: "📘" },
    ];

    return (
        <section className="pt-28 pb-20 sm:pt-32 sm:pb-28 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                {/* Version Badge */}
                <Badge
                    variant="outline"
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60 text-blue-600 dark:text-blue-300 text-xs font-medium mb-10 backdrop-blur-sm"
                >
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    V2.0 IS LIVE
                </Badge>

                {/* Main Heading */}
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-zinc-100 dark:text-zinc-200 mb-8 leading-[1.1]">
                    Master Tech Skills,
                    <br className="hidden sm:block" />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-blue-500 to-cyan-400">
                        The Lazy Way.
                    </span>
                </h1>

                {/* Subtitle */}
                <p className="max-w-2xl mx-auto text-lg sm:text-xl text-zinc-500 dark:text-zinc-400 mb-12 leading-relaxed">
                    Stop watching endless tutorials. Build real projects with auto-generated{" "}
                    <strong className="text-zinc-200 dark:text-zinc-200 font-semibold">Guided Notes</strong>{" "}
                    that track your progress for you.
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
                            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </Button>
                    <Button
                        variant="outline"
                        size="lg"
                        asChild
                        className="w-full sm:w-auto px-8 py-3.5"
                    >
                        <Link to="/dashboard">
                            <PlayCircle className="mr-2 h-5 w-5" />
                            View Demo
                        </Link>
                    </Button>
                </div>

                {/* Language Selector Pills */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    {languageOptions.map((option) => (
                        <button
                            key={option.key}
                            onClick={() => setSelectedLanguage(option.key)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${selectedLanguage === option.key
                                    ? "bg-primary text-white shadow-lg shadow-primary/30"
                                    : "bg-zinc-800/60 text-zinc-400 hover:bg-zinc-700/60 hover:text-zinc-200"
                                }`}
                        >
                            <span className="mr-1.5">{option.icon}</span>
                            {option.label}
                        </button>
                    ))}
                </div>

                {/* Interactive Code Editor with 3D Scroll Animation */}
                <motion.div
                    ref={mockupRef}
                    className="relative mx-auto max-w-4xl"
                    style={{ perspective: 1200 }}
                    initial={{ rotateX: 15, scale: 0.95, opacity: 0, y: 40 }}
                    animate={isInView ? { rotateX: 0, scale: 1, opacity: 1, y: 0 } : { rotateX: 15, scale: 0.95, opacity: 0, y: 40 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    {/* Glow Effect */}
                    <div className="absolute -inset-8 bg-gradient-to-r from-blue-500/30 via-purple-500/20 to-cyan-400/30 rounded-3xl blur-3xl opacity-40 dark:opacity-20 pointer-events-none" />

                    {/* Interactive Code Block */}
                    <InteractiveCodeBlock
                        language={selectedLanguage}
                        showTypingAnimation={true}
                        typingSpeed={12}
                    />
                </motion.div>

                {/* Feature highlights below code block */}
                <motion.div
                    className="flex flex-wrap items-center justify-center gap-6 mt-12 text-sm text-zinc-500"
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                >
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        Syntax Highlighting
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        Auto-Generated Notes
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                        Progress Tracking
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
