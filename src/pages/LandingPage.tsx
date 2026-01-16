import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Terminal, Moon, Sun, Heart, Github, BookOpen } from "lucide-react";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { Footer } from "@/components/landing/Footer";

export default function LandingPage() {
    const [isDark, setIsDark] = useState(() => {
        if (typeof window !== "undefined") {
            return document.documentElement.classList.contains("dark") ||
                window.matchMedia("(prefers-color-scheme: dark)").matches;
        }
        return false;
    });

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    }, [isDark]);

    return (
        <div className="bg-background text-foreground transition-colors duration-300 min-h-screen flex flex-col font-sans antialiased">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-background/80 border-b border-border">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-lg">
                                <Terminal className="h-5 w-5" />
                            </div>
                            <span className="font-bold text-xl tracking-tight text-foreground">LearnInk</span>
                        </Link>

                        {/* Nav Links */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors hidden sm:block"
                            >
                                Features
                            </button>
                            <div className="h-4 w-[1px] bg-border mx-2 hidden sm:block" />
                            <Link
                                to="/auth"
                                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                            >
                                Log in
                            </Link>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setIsDark(!isDark)}
                                className="rounded-lg"
                            >
                                {isDark ? (
                                    <Sun className="h-4 w-4" />
                                ) : (
                                    <Moon className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-grow">
                <Hero />
                <Features />

                {/* Open Source & Free Section */}
                <section className="py-20 bg-gradient-to-b from-background to-primary/5 border-t border-border">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                            <Heart className="h-8 w-8 text-primary" />
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                            Open Source & Forever Free
                        </h2>
                        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
                            We believe education should be accessible to everyone. LearnInk is completely free—no premium tiers, no hidden costs.
                            Just pure, transparent learning materials built for the community, by the community.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Github className="h-5 w-5" />
                                <span>Open Source Codebase</span>
                            </div>
                            <div className="hidden sm:block w-1 h-1 rounded-full bg-muted-foreground" />
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <BookOpen className="h-5 w-5" />
                                <span>Free Learning Materials</span>
                            </div>
                            <div className="hidden sm:block w-1 h-1 rounded-full bg-muted-foreground" />
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Heart className="h-5 w-5" />
                                <span>Community Driven</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Trust Section */}
                <section className="py-12 bg-background border-t border-border">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-8">
                            Trusted by developers from
                        </p>
                        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-50 dark:opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
                            {/* Company Logos (Abstract) */}
                            <svg className="h-8 w-auto text-foreground" fill="currentColor" viewBox="0 0 100 30">
                                <path d="M10,15 L20,5 L30,15 L20,25 Z M40,5 H50 V25 H40 Z M60,5 H70 V25 H60 Z M80,5 H90 V25 H80 Z" />
                            </svg>
                            <svg className="h-8 w-auto text-foreground" fill="currentColor" viewBox="0 0 100 30">
                                <circle cx="15" cy="15" r="10" />
                                <rect height="20" width="20" x="35" y="5" />
                                <polygon points="70,25 80,5 90,25" />
                            </svg>
                            <svg className="h-8 w-auto text-foreground" fill="currentColor" viewBox="0 0 100 30">
                                <rect height="10" width="30" x="5" y="10" />
                                <rect height="20" width="10" x="45" y="5" />
                                <rect height="20" width="10" x="65" y="5" />
                                <rect height="10" width="10" x="85" y="10" />
                            </svg>
                            <svg className="h-8 w-auto text-foreground" fill="currentColor" viewBox="0 0 100 30">
                                <path d="M10,5 Q20,25 30,5 T50,5 T70,5" fill="none" stroke="currentColor" strokeWidth="4" />
                                <circle cx="85" cy="15" r="8" />
                            </svg>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
