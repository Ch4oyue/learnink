import { Button } from "@/components/ui/button";
import { Sparkles, Zap, Brain, Bot, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export function HeroSection() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleStartLearning = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/auth");
    }
  };

  const handleViewModules = () => {
    const modulesSection = document.getElementById("modul");
    if (modulesSection) {
      modulesSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      id="home"
      className="relative min-h-[90vh] flex items-center justify-center overflow-hidden"
    >
      {/* Background Gradient Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -right-40 w-80 h-80 bg-primary/8 rounded-full blur-3xl animate-fade-in"
          style={{ animationDelay: "0.2s" }}
        />
        <div
          className="absolute top-1/2 -left-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-fade-in"
          style={{ animationDelay: "0.4s" }}
        />
        <div
          className="absolute -bottom-20 right-1/4 w-64 h-64 bg-accent/8 rounded-full blur-3xl animate-fade-in"
          style={{ animationDelay: "0.6s" }}
        />
      </div>

      <div className="container mx-auto px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8 animate-fade-in"
            style={{ animationDelay: "0.1s" }}
          >
            <Sparkles className="w-4 h-4" />
            <span>The #1 AI Learning Platform for Non-IT</span>
          </div>

          {/* Headline */}
          <h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight text-foreground leading-[1.1] animate-fade-in"
            style={{ animationDelay: "0.2s" }}
          >
            Master{" "}
            <span className="text-gradient">AI Automation</span>
            <br />
            Without the Hassle
          </h1>

          {/* Subheadline */}
          <p
            className="mt-6 md:mt-8 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-fade-in"
            style={{ animationDelay: "0.3s" }}
          >
            Request the materials you need. Learn AI with clear, beginner-friendly lessons.
          </p>

          {/* CTA Buttons */}
          <div
            className="mt-10 md:mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in"
            style={{ animationDelay: "0.4s" }}
          >
            <Button
              size="lg"
              onClick={handleStartLearning}
              className="w-full sm:w-auto px-8 py-6 text-base font-medium shadow-soft hover:shadow-medium transition-all duration-300 group press-effect rounded-xl"
            >
              Start Learning
              <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={handleViewModules}
              className="w-full sm:w-auto px-8 py-6 text-base font-medium border-border/60 hover:bg-secondary/50 transition-all duration-300 press-effect rounded-xl"
            >
              View Modules
            </Button>
          </div>

          {/* Trust Indicators */}
          <div
            className="mt-16 md:mt-20 animate-fade-in"
            style={{ animationDelay: "0.5s" }}
          >
            <p className="text-sm text-muted-foreground mb-6">
              Trusted by students and professionals
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
              <div className="flex items-center gap-2 text-muted-foreground/60">
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                  <Brain className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">1000+ Learners</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground/60">
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">50+ Modules</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground/60">
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">AI-Powered</span>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Illustration Elements */}
        <div className="absolute inset-0 pointer-events-none hidden lg:block">
          {/* Left floating elements */}
          <div
            className="absolute left-[5%] top-1/3 animate-fade-in"
            style={{ animationDelay: "0.7s" }}
          >
            <div className="w-16 h-16 rounded-2xl bg-card shadow-medium border border-border/50 flex items-center justify-center rotate-12 hover:rotate-0 transition-transform duration-500">
              <Brain className="w-8 h-8 text-primary" />
            </div>
          </div>
          <div
            className="absolute left-[10%] bottom-1/4 animate-fade-in"
            style={{ animationDelay: "0.8s" }}
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center -rotate-6">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
          </div>

          {/* Right floating elements */}
          <div
            className="absolute right-[5%] top-1/4 animate-fade-in"
            style={{ animationDelay: "0.9s" }}
          >
            <div className="w-14 h-14 rounded-2xl bg-card shadow-medium border border-border/50 flex items-center justify-center -rotate-12 hover:rotate-0 transition-transform duration-500">
              <Bot className="w-7 h-7 text-primary" />
            </div>
          </div>
          <div
            className="absolute right-[12%] bottom-1/3 animate-fade-in"
            style={{ animationDelay: "1s" }}
          >
            <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center rotate-6">
              <Zap className="w-5 h-5 text-primary" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </section>
  );
}
