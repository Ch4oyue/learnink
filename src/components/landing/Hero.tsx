import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, PlayCircle, GraduationCap, Folder, Search } from "lucide-react";

export function Hero() {
    return (
        <section className="pt-20 pb-16 sm:pt-24 sm:pb-24 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                {/* Version Badge */}
                <Badge
                    variant="outline"
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-xs font-semibold mb-8"
                >
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    V2.0 IS LIVE
                </Badge>

                {/* Main Heading */}
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground mb-6 leading-tight">
                    Master Tech Skills,
                    <br className="hidden sm:block" />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500">
                        The Lazy Way.
                    </span>
                </h1>

                {/* Subtitle */}
                <p className="max-w-2xl mx-auto text-lg sm:text-xl text-muted-foreground mb-10 leading-relaxed">
                    Stop watching endless tutorials. Build real projects with auto-generated{" "}
                    <strong className="text-foreground font-semibold">Guided Notes</strong>{" "}
                    that track your progress for you.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
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

                {/* Code Editor Mockup */}
                <div className="relative mx-auto max-w-5xl">
                    {/* Glow Effect */}
                    <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-2xl blur-2xl opacity-20 dark:opacity-10 pointer-events-none" />

                    <div className="relative bg-zinc-900 rounded-xl border border-zinc-800 shadow-2xl overflow-hidden">
                        {/* Mac Window Controls */}
                        <div className="bg-zinc-800/50 px-4 py-3 flex items-center border-b border-zinc-700">
                            <div className="flex gap-2">
                                <span className="h-3 w-3 rounded-full bg-red-500" />
                                <span className="h-3 w-3 rounded-full bg-yellow-500" />
                                <span className="h-3 w-3 rounded-full bg-green-500" />
                            </div>
                            <div className="mx-auto text-xs text-zinc-400 font-mono">
                                intro-to-react.js — LearnInk
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row h-[500px]">
                            {/* Sidebar */}
                            <div className="w-16 bg-zinc-900 border-r border-zinc-800 flex-col items-center py-6 gap-6 hidden md:flex">
                                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                                    <GraduationCap className="h-5 w-5" />
                                </div>
                                <div className="p-2 text-zinc-500 hover:text-zinc-300 cursor-pointer">
                                    <Folder className="h-5 w-5" />
                                </div>
                                <div className="p-2 text-zinc-500 hover:text-zinc-300 cursor-pointer">
                                    <Search className="h-5 w-5" />
                                </div>
                            </div>

                            {/* Code Editor */}
                            <div className="flex-1 bg-[#0d1117] p-6 overflow-hidden font-mono text-sm leading-relaxed text-left">
                                <div className="text-zinc-500 absolute left-20 top-20 select-none text-right w-6 hidden sm:block">
                                    1<br />2<br />3<br />4<br />5<br />6<br />7<br />8<br />9<br />10
                                </div>
                                <div className="ml-0 sm:ml-10 text-zinc-300">
                                    <span className="text-purple-400">import</span> React, {"{ useState }"} <span className="text-purple-400">from</span> <span className="text-green-400">'react'</span>;<br /><br />
                                    <span className="text-purple-400">export default function</span> <span className="text-yellow-200">LazyLearning</span>() {"{"}<br />
                                    <span className="text-zinc-500 ml-4">// Initialize state for progress tracking</span><br />
                                    <span className="text-purple-400 ml-4">const</span> [progress, setProgress] = <span className="text-blue-400">useState</span>(<span className="text-orange-400">0</span>);<br /><br />
                                    <span className="text-purple-400 ml-4">return</span> (<br />
                                    <span className="ml-8 text-zinc-400">&lt;<span className="text-red-400">div</span> <span className="text-purple-400">className</span>=<span className="text-green-400">"container"</span>&gt;</span><br />
                                    <span className="ml-12 text-zinc-400">&lt;<span className="text-red-400">h1</span>&gt;</span>Welcome to LearnInk<span className="text-zinc-400">&lt;/<span className="text-red-400">h1</span>&gt;</span><br />
                                    <span className="ml-8 text-zinc-400">&lt;/<span className="text-red-400">div</span>&gt;</span>
                                </div>
                            </div>

                            {/* Guided Notes Panel */}
                            <div className="w-full md:w-[45%] bg-card border-l border-border p-6 flex flex-col text-left overflow-y-auto">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                        <svg className="h-4 w-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M5 2a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7.414A2 2 0 0016.414 6L12 1.586A2 2 0 0010.586 1H5z" />
                                        </svg>
                                        Guided Notes
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-foreground mb-2">React Hooks: useState</h3>
                                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                                    The <code className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-1 py-0.5 rounded text-xs font-mono border border-red-100 dark:border-red-900/30">useState</code> hook is the most fundamental hook in React.
                                </p>
                                <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-lg p-3 mb-6 flex gap-3">
                                    <span className="text-blue-500 text-lg">💡</span>
                                    <div className="text-xs text-foreground/80 leading-relaxed">
                                        <strong>ProTip:</strong> Never call hooks inside loops, conditions, or nested functions.
                                    </div>
                                </div>
                                <div className="mt-auto pt-4 flex justify-end border-t border-border">
                                    <Button size="sm" className="text-xs">
                                        Mark Section Complete
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
