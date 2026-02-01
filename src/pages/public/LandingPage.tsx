import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Terminal, Moon, Sun, Heart, Github, BookOpen, LayoutDashboard, Menu } from "lucide-react";
import { Hero } from "@/components/features/landing/Hero";
import { useTheme } from "@/contexts/ThemeContext";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { useSimpleSmoothScroll } from "@/hooks/useSmoothScroll";
import { lazy, Suspense, useState } from "react";
import SEO from "@/components/shared/SEO";

// Lazy load heavy below-the-fold components
const Features = lazy(() => import("@/components/features/landing/Features").then(module => ({ default: module.Features })));
const LearningSourcesMarquee = lazy(() => import("@/components/features/landing/LearningSourcesMarquee"));
const Footer = lazy(() => import("@/components/features/landing/Footer").then(module => ({ default: module.Footer })));

export default function LandingPage() {
    const { resolvedTheme, setTheme } = useTheme();
    const { user } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Enable smooth scrolling for anchor links
    useSimpleSmoothScroll();

    const toggleTheme = () => {
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
    };

    return (
        <div className="bg-background text-foreground transition-colors duration-300 min-h-screen flex flex-col font-sans antialiased">
            <SEO
                title="Platform Belajar AI Automation"
                description="Kuasai AI Automation tanpa perlu coding. Belajar workflow otomatisasi untuk produktivitas."
            />
            {/* Header */}
            <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-background/80 border-b border-border pt-[env(safe-area-inset-top)] transition-all">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-lg">
                                <Terminal className="h-5 w-5" />
                            </div>
                            <span className="font-bold text-xl tracking-tight text-foreground">LearnInk</span>
                        </Link>

                        {/* Nav Links - Desktop */}
                        <div className="hidden md:flex items-center gap-4">
                            <button
                                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                            >
                                Features
                            </button>
                            <div className="h-4 w-[1px] bg-border mx-2" />
                            {user ? (
                                <Link
                                    to="/dashboard"
                                    className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                                >
                                    <LayoutDashboard className="h-4 w-4" />
                                    Dashboard
                                </Link>
                            ) : (
                                <Link
                                    to="/auth"
                                    className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                                >
                                    Log in
                                </Link>
                            )}
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

                        {/* Mobile Menu */}
                        <div className="flex md:hidden items-center gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={toggleTheme}
                                className="rounded-lg mr-1"
                            >
                                {resolvedTheme === "dark" ? (
                                    <Sun className="h-4 w-4" />
                                ) : (
                                    <Moon className="h-4 w-4" />
                                )}
                            </Button>

                            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <Menu className="h-5 w-5" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                                    <nav className="flex flex-col gap-4 mt-8">
                                        {user ? (
                                            <Link
                                                to="/dashboard"
                                                onClick={() => setIsMobileMenuOpen(false)}
                                                className="flex items-center gap-2 text-lg font-medium text-primary hover:text-primary/80 transition-colors"
                                            >
                                                <LayoutDashboard className="h-5 w-5" />
                                                Dashboard
                                            </Link>
                                        ) : (
                                            <Link
                                                to="/auth"
                                                onClick={() => setIsMobileMenuOpen(false)}
                                                className="text-lg font-medium text-foreground hover:text-primary transition-colors"
                                            >
                                                Log in
                                            </Link>
                                        )}
                                        <button
                                            onClick={() => {
                                                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                                                setIsMobileMenuOpen(false);
                                            }}
                                            className="text-lg font-medium text-muted-foreground hover:text-primary transition-colors text-left"
                                        >
                                            Features
                                        </button>
                                        <div className="h-[1px] bg-border my-2" />
                                        <a
                                            href="https://github.com/Abelion512/learnink"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="flex items-center gap-2 text-muted-foreground"
                                        >
                                            <Github className="h-5 w-5" />
                                            GitHub
                                        </a>
                                    </nav>
                                </SheetContent>
                            </Sheet>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-grow">
                <Hero />

                <Suspense fallback={<div className="py-24 sm:py-32 bg-muted/50 border-t border-border flex items-center justify-center"><div className="animate-pulse bg-muted-foreground/10 w-full h-full max-w-7xl rounded-xl" /></div>}>
                    <Features />
                </Suspense>

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
                <Suspense fallback={<div className="py-16 sm:py-20 bg-card border-t border-border h-[300px]" />}>
                    <LearningSourcesMarquee />
                </Suspense>
            </main>

            <Suspense fallback={<div className="h-20 bg-card border-t border-border" />}>
                <Footer />
            </Suspense>
        </div>
    );
}
