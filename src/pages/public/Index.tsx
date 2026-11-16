import { Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { HeroSection } from "@/components/features/sections/HeroSection";
import { FeaturesSection } from "@/components/features/sections/FeaturesSection";
import { ModulesSection } from "@/components/features/sections/ModulesSection";
import { RequestSection } from "@/components/features/sections/RequestSection";
import { Footer } from "@/components/layout/Footer";
import { Toaster } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { 
  Bot, 
  Cpu, 
  Workflow, 
  Zap,
  ArrowRight,
  GraduationCap,
  BookOpen,
} from "lucide-react";

// Learning paths focused on AI & Automation
const learningPaths = [
  {
    title: "AI Fundamentals",
    description: "Understand the fundamental concepts of Artificial Intelligence and Machine Learning",
    icon: Bot,
    color: "from-cyan-500/20 to-blue-500/20",
    textColor: "text-cyan-600",
    modules: 8,
  },
  {
    title: "Automation Fundamentals",
    description: "Learn the basics of workflow automation and business processes",
    icon: Cpu,
    color: "from-purple-500/20 to-pink-500/20",
    textColor: "text-purple-600",
    modules: 10,
  },
  {
    title: "AI Tools & Apps",
    description: "Master ChatGPT, Midjourney, and other popular AI tools",
    icon: Zap,
    color: "from-orange-500/20 to-red-500/20",
    textColor: "text-orange-600",
    modules: 12,
  },
  {
    title: "Advanced Automation",
    description: "Build complex automation systems with AI integration",
    icon: Workflow,
    color: "from-emerald-500/20 to-teal-500/20",
    textColor: "text-emerald-600",
    modules: 6,
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-[4.5rem]">
        <HeroSection />
        
        <div id="fitur">
          <FeaturesSection />
        </div>

        {/* Syllabus Section */}
        <section id="silabus" className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            {/* Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                <GraduationCap className="h-4 w-4" />
                AI & Automation Curriculum
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Learning Paths
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Choose an AI and Automation learning path that matches your interests. Each path has structured modules from beginner to advanced.
              </p>
            </div>

            {/* Learning Paths Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {learningPaths.map((path, index) => {
                const Icon = path.icon;
                return (
                  <div 
                    key={index}
                    className="group relative bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                  >
                    {/* Gradient Background */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${path.color} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity`} />
                    
                    <div className="relative">
                      {/* Icon */}
                      <div className={`w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4 ${path.textColor}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      
                      {/* Content */}
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        {path.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {path.description}
                      </p>
                      
                      {/* Stats */}
                      <div className="flex items-center gap-2 text-sm">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{path.modules} Modules</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* CTA */}
            <div className="text-center">
              <Button asChild size="lg" className="group">
                <Link to="/syllabus">
                  View Full Syllabus
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <div id="modul">
          <ModulesSection />
        </div>

        <div id="request">
          <RequestSection />
        </div>
      </main>

      <Footer />
      <Toaster />
    </div>
  );
};

export default Index;
