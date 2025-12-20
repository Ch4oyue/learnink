import { Navbar } from "@/components/layout/Navbar";
import { HeroSection } from "@/components/sections/HeroSection";
import { FeaturesSection } from "@/components/sections/FeaturesSection";
import { ModulesSection } from "@/components/sections/ModulesSection";
import { RequestSection } from "@/components/sections/RequestSection";
import { Toaster } from "@/components/ui/toaster";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-[4.5rem]">
        <HeroSection />
        
        <div id="fitur">
          <FeaturesSection />
        </div>

        {/* Placeholder section */}
        <section id="silabus" className="min-h-screen flex items-center justify-center">
          <h2 className="text-3xl font-semibold text-foreground">Silabus</h2>
        </section>

        <div id="modul">
          <ModulesSection />
        </div>

        <div id="request">
          <RequestSection />
        </div>
      </main>

      <Toaster />
    </div>
  );
};

export default Index;
