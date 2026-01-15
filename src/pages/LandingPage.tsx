import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Terminal,
    ArrowRight,
    PlayCircle,
    Code,
    Braces,
    Database,
    GraduationCap,
    FolderOpen,
    Search,
    Settings,
    Sparkles,
    Lightbulb,
    CheckCircle,
    Circle,
    Moon,
    Sun,
} from "lucide-react";
import { useEffect, useState } from "react";

const LandingPage = () => {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        // Check initial theme
        setIsDark(document.documentElement.classList.contains("dark"));
    }, []);

    const toggleTheme = () => {
        document.documentElement.classList.toggle("dark");
        setIsDark(!isDark);
    };

    return (
        <div className="font-display bg-background text-foreground antialiased overflow-x-hidden transition-colors duration-300">
            {/* Navbar */}
            <nav className="fixed top-0 left-0 w-full z-50 border-b border-border bg-background/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 group cursor-pointer">
                        <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center text-background">
                            <Terminal className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-lg tracking-tight">LearnInk</span>
                    </Link>

                    <div className="flex items-center gap-4">
                        <Link
                            to="/auth"
                            className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Log in
                        </Link>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleTheme}
                            aria-label="Toggle Dark Mode"
                            className="text-muted-foreground"
                        >
                            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>
            </nav>

            {/* Main Layout */}
            <main className="relative pt-32 pb-20 min-h-screen flex flex-col items-center">
                {/* Background Grid */}
                <div className="absolute inset-0 z-0 bg-grid-pattern [mask-image:linear-gradient(to_bottom,white,transparent)] opacity-40 pointer-events-none" />

                {/* Hero Content */}
                <div className="relative z-10 max-w-4xl mx-auto px-6 text-center mb-16 group/hero">
                    {/* Badge */}
                    <Badge
                        variant="outline"
                        className="mb-6 px-3 py-1 rounded-full bg-primary/10 border-primary/20 text-primary text-xs font-bold uppercase tracking-wide"
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse mr-1.5 inline-block" />
                        v2.0 is live
                    </Badge>

                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter leading-[1.1] mb-6">
                        Master Tech Skills, <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
                            The Lazy Way.
                        </span>
                    </h1>

                    <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
                        Stop watching endless tutorials. Build real projects with auto-generated{" "}
                        <span className="text-foreground font-bold">Guided Notes</span> that track your progress
                        for you.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Button
                            asChild
                            size="lg"
                            className="h-12 px-8 rounded-xl font-bold text-sm tracking-wide shadow-md hover:shadow-lg hover:shadow-primary/30 transition-all"
                        >
                            <Link to="/modules">
                                Start Learning Now
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>

                        <Button
                            variant="outline"
                            size="lg"
                            className="h-12 px-8 rounded-xl font-bold text-sm"
                        >
                            <PlayCircle className="mr-2 h-4 w-4 fill-current" />
                            View Demo
                        </Button>
                    </div>

                    {/* Trust Indicators */}
                    <div className="mt-12 flex items-center justify-center gap-8 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
                        <div className="flex items-center gap-2 select-none pointer-events-none">
                            <Code className="h-5 w-5" />
                            <span className="font-bold text-sm">React</span>
                        </div>
                        <div className="flex items-center gap-2 select-none pointer-events-none">
                            <Braces className="h-5 w-5" />
                            <span className="font-bold text-sm">Python</span>
                        </div>
                        <div className="flex items-center gap-2 select-none pointer-events-none">
                            <Terminal className="h-5 w-5" />
                            <span className="font-bold text-sm">TypeScript</span>
                        </div>
                        <div className="flex items-center gap-2 select-none pointer-events-none">
                            <Database className="h-5 w-5" />
                            <span className="font-bold text-sm">SQL</span>
                        </div>
                    </div>
                </div>

                {/* 3D Mockup Visual */}
                <div className="relative z-10 w-full max-w-6xl px-4 perspective-[2000px] group/hero">
                    <div className="hero-tilt w-full bg-slate-900 dark:bg-slate-950 rounded-xl border border-slate-800/60 shadow-2xl overflow-hidden aspect-[16/10] md:aspect-[16/9] flex flex-col">
                        {/* Mockup Window Controls */}
                        <div className="h-10 bg-[#151f28] border-b border-slate-800 flex items-center px-4 justify-between shrink-0">
                            <div className="flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                                <div className="w-3 h-3 rounded-full bg-green-500/80" />
                            </div>
                            <div className="text-xs text-slate-500 font-mono">
                                intro-to-react.js — LearnInk
                            </div>
                            <div className="w-10" />
                        </div>

                        {/* Mockup App Body */}
                        <div className="flex flex-1 overflow-hidden">
                            {/* Sidebar (Navigation) */}
                            <div className="w-14 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-4 gap-4 shrink-0">
                                <div className="p-2 rounded-lg bg-primary/20 text-primary">
                                    <GraduationCap className="w-5 h-5" />
                                </div>
                                <div className="p-2 rounded-lg text-slate-500 hover:text-slate-300 cursor-pointer">
                                    <FolderOpen className="w-5 h-5" />
                                </div>
                                <div className="p-2 rounded-lg text-slate-500 hover:text-slate-300 cursor-pointer">
                                    <Search className="w-5 h-5" />
                                </div>
                                <div className="mt-auto p-2 rounded-lg text-slate-500 hover:text-slate-300 cursor-pointer">
                                    <Settings className="w-5 h-5" />
                                </div>
                            </div>

                            {/* Code Editor Pane */}
                            <div className="flex-1 bg-[#0d1117] p-6 font-mono text-sm overflow-hidden relative hidden md:block">
                                {/* Line Numbers */}
                                <div className="absolute left-0 top-6 w-10 text-right text-slate-600 select-none flex flex-col gap-1.5 text-xs">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((n) => (
                                        <div key={n}>{n}</div>
                                    ))}
                                </div>

                                {/* Code Content */}
                                <div className="pl-12 flex flex-col gap-1.5 text-slate-400">
                                    <div>
                                        <span className="text-purple-400">import</span> React, {"{ useState }"}{" "}
                                        <span className="text-purple-400">from</span>{" "}
                                        <span className="text-green-400">'react'</span>;
                                    </div>
                                    <div>&nbsp;</div>
                                    <div>
                                        <span className="text-purple-400">export default function</span>{" "}
                                        <span className="text-yellow-300">LazyLearning</span>() {"{"}
                                    </div>
                                    <div className="pl-4">
                                        <span className="text-slate-500">// Initialize state for progress tracking</span>
                                    </div>
                                    <div className="pl-4">
                                        <span className="text-purple-400">const</span> [progress, setProgress] ={" "}
                                        <span className="text-blue-400">useState</span>(
                                        <span className="text-orange-400">0</span>);
                                    </div>
                                    <div>&nbsp;</div>
                                    <div className="pl-4">
                                        <span className="text-purple-400">return</span> (
                                    </div>
                                    <div className="pl-8">
                                        &lt;<span className="text-red-400">div</span>{" "}
                                        <span className="text-purple-400">className</span>=
                                        <span className="text-green-400">"container"</span>&gt;
                                    </div>
                                    <div className="pl-12">
                                        &lt;<span className="text-red-400">h1</span>&gt;Welcome to LearnInk&lt;/
                                        <span className="text-red-400">h1</span>&gt;
                                    </div>
                                    <div className="pl-12">
                                        &lt;<span className="text-red-400">p</span>&gt;Auto-generating your notes...&lt;/
                                        <span className="text-red-400">p</span>&gt;
                                    </div>
                                    <div className="pl-12">
                                        &lt;<span className="text-yellow-300">ProgressBar</span>{" "}
                                        <span className="text-purple-400">value</span>={"{progress}"} /&gt;
                                    </div>
                                    <div className="pl-8">
                                        &lt;/<span className="text-red-400">div</span>&gt;
                                    </div>
                                    <div className="pl-4">);</div>
                                    <div>{"}"}</div>
                                </div>

                                {/* Cursor Blinking */}
                                <div className="absolute w-2 h-5 bg-primary/50 top-[198px] left-[180px] animate-pulse" />
                            </div>

                            {/* Divider */}
                            <div className="w-[1px] bg-slate-800 hidden md:block" />

                            {/* Notes/Preview Pane (Light Theme inside Dark UI) */}
                            <div className="w-full md:w-[45%] bg-white flex flex-col">
                                {/* Pane Header */}
                                <div className="h-12 border-b border-slate-100 flex items-center justify-between px-4 bg-slate-50/50">
                                    <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                        <Sparkles className="h-4 w-4 text-primary" />
                                        Guided Notes
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="w-2 h-2 rounded-full bg-slate-200" />
                                        <span className="w-2 h-2 rounded-full bg-slate-200" />
                                    </div>
                                </div>

                                {/* Notes Content */}
                                <div className="p-6 flex-1 overflow-y-auto no-scrollbar">
                                    <div className="prose prose-sm prose-slate max-w-none">
                                        <h3 className="text-slate-900 font-bold text-lg mb-2">
                                            React Hooks: useState
                                        </h3>
                                        <p className="text-slate-600 text-sm leading-relaxed mb-4">
                                            The{" "}
                                            <code className="bg-slate-100 px-1 py-0.5 rounded text-red-500 font-mono text-xs">
                                                useState
                                            </code>{" "}
                                            hook is the most fundamental hook in React. It allows you to add state
                                            variables to functional components.
                                        </p>

                                        <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 mb-4">
                                            <div className="flex items-start gap-2">
                                                <Lightbulb className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                                <p className="text-xs text-slate-700 font-medium leading-relaxed">
                                                    <strong>Pro Tip:</strong> Never call hooks inside loops, conditions, or
                                                    nested functions. Always use them at the top level.
                                                </p>
                                            </div>
                                        </div>

                                        <h4 className="text-slate-800 font-bold text-sm mb-2 mt-4">Key Takeaways</h4>
                                        <ul className="space-y-2">
                                            <li className="flex items-center gap-2 text-sm text-slate-600">
                                                <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                                                <span>Returns a pair: value & updater function</span>
                                            </li>
                                            <li className="flex items-center gap-2 text-sm text-slate-600">
                                                <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                                                <span>Initial state is only used on first render</span>
                                            </li>
                                            <li className="flex items-center gap-2 text-sm text-slate-600">
                                                <Circle className="h-4 w-4 text-slate-300 shrink-0" />
                                                <span>Updates are asynchronous</span>
                                            </li>
                                        </ul>
                                    </div>

                                    {/* Floating Action in Notes */}
                                    <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end">
                                        <Button size="sm" className="text-xs font-bold shadow-lg">
                                            Mark Section Complete
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Decorative Glow behind mockup */}
                    <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[80%] h-20 bg-primary/20 blur-[80px] -z-10 pointer-events-none rounded-full" />
                </div>
            </main>
        </div>
    );
};

export default LandingPage;
