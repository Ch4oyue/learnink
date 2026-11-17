import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Terminal, Moon, Sun, Heart, Github, BookOpen, LayoutDashboard, Menu } from "lucide-react";
import { Hero } from "@/components/features/landing/Hero";
import { useTheme } from "@/contexts/ThemeContext";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { useSimpleSmoothScroll } from "@/hooks/useSmoothScroll";
import { lazy, Suspense, useState } from "react";
import { SEO } from "@/components/shared/SEO";
import { usePrefetch } from "@/hooks/usePrefetch";

// Lazy load heavy below-the-fold components
const Features = lazy(() => import("@/components/features/landing/Features").then(module => ({ default: module.Features })));
const LearningSourcesMarquee = lazy(() => import("@/components/features/landing/LearningSourcesMarquee"));
const Footer = lazy(() => import("@/components/features/landing/Footer").then(module => ({ default: module.Footer })));

export default function LandingPage() {
    const { resolvedTheme, setTheme } = useTheme();
    const { user } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const prefetch = usePrefetch();

    // Enable smooth scrolling for anchor links
    useSimpleSmoothScroll();

    const toggleTheme = () => {
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
    };

    return (
        <div className="bg-background text-foreground transition-colors duration-300 min-h-screen flex flex-col font-sans antialiased">
            <SEO
                title="LearnInk - Master Tech Skills The Lazy Way"
                description="Stop watching endless tutorials. Build real projects with Guided Notes that track your progress automatically."
            />
            {/* Header */}
            <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-background/70 border-b border-border/60 pt-[env(safe-area-inset-top)] transition-all">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2.5">
                            <div className="w-8 h-8 bg-foreground rounded-[10px] flex items-center justify-center text-background">
                                <Terminal className="h-5 w-5" strokeWidth={2.25} />
                            </div>
                            <span className="font-semibold text-[17px] tracking-tight text-foreground">LearnInk</span>
                        </Link>

                        {/* Nav Links - Desktop */}
                        <div className="hidden md:flex items-center gap-4">
                            <button
                                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Features
                            </button>
                            <div className="h-4 w-[1px] bg-border mx-2" />
                            {user ? (
                                <Link
                                    to="/dashboard"
                                    onMouseEnter={() => prefetch(() => import("@/pages/dashboard/DashboardHome"))}
                                    className="flex items-center gap-2 text-sm text-primary hover:text-primary/70 transition-colors"
                                >
                                    <LayoutDashboard className="h-4 w-4" />
                                    Dashboard
                                </Link>
                            ) : (
                                <Link
                                    to="/auth"
                                    onMouseEnter={() => prefetch(() => import("@/pages/auth/Auth"))}
                                    className="inline-flex items-center h-8 px-4 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                                >
                                    Sign In
                                </Link>
                            )}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={toggleTheme}
                                className="rounded-full h-9 w-9 text-muted-foreground hover:text-foreground"
                                aria-label="Toggle Theme"
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
                                aria-label="Toggle Theme"
                            >
                                {resolvedTheme === "dark" ? (
                                    <Sun className="h-4 w-4" />
                                ) : (
                                    <Moon className="h-4 w-4" />
                                )}
                            </Button>

                            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                                <SheetTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        aria-label="Main Menu"
                                    >
                                        <Menu className="h-5 w-5" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                                    <SheetTitle className="sr-only">Main Menu</SheetTitle>
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
                                                Sign In
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
                <section className="py-28 sm:py-32 bg-secondary/50 cv-auto">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-8">
                            <Heart className="h-6 w-6 text-primary" />
                        </div>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-foreground mb-5 leading-[1.08]">
                            Open source. Free forever.
                        </h2>
                        <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed">
                            No premium tiers, no hidden costs. Built by the community, for the community.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Github className="h-5 w-5" aria-hidden="true" />
                                <span>Open Source Code</span>
                            </div>
                            <div className="hidden sm:block w-1 h-1 rounded-full bg-muted-foreground" />
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <BookOpen className="h-5 w-5" aria-hidden="true" />
                                <span>Free Materials</span>
                            </div>
                            <div className="hidden sm:block w-1 h-1 rounded-full bg-muted-foreground" />
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Heart className="h-5 w-5" aria-hidden="true" />
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
