import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Terminal, Moon, Sun, Heart, Github, BookOpen } from "lucide-react";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { Footer } from "@/components/landing/Footer";
import { LearningSourcesMarquee } from "@/components/landing/LearningSourcesMarquee";
import { useTheme } from "@/contexts/ThemeContext";
import { useSimpleSmoothScroll } from "@/hooks/useSmoothScroll";

export default function LandingPage() {
    const { resolvedTheme, setTheme } = useTheme();

    // Enable smooth scrolling for anchor links
    useSimpleSmoothScroll();

    const toggleTheme = () => {
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
    };

    return (
        <div className="bg-background text-foreground transition-colors duration-300 min-h-screen flex flex-col font-sans antialiased">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-background/80 border-b border-border">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-lg">
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
                                onClick={toggleTheme}
                                className="rounded-lg"
                            >
                                {resolvedTheme === "dark" ? (
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
                <section className="py-28 sm:py-32 bg-muted/30 border-t border-border">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-8">
                            <Heart className="h-8 w-8 text-primary" />
                        </div>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground mb-6 leading-tight">
                            Open Source & Forever Free
                        </h2>
                        <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
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

                {/* Learning Sources Marquee */}
                <LearningSourcesMarquee />
            </main>

            <Footer />
        </div>
    );
}
