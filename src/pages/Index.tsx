import { Navbar } from "@/components/layout/Navbar";
import { HeroSection } from "@/components/sections/HeroSection";
import { FeaturesSection } from "@/components/sections/FeaturesSection";
import { ModulesSection } from "@/components/sections/ModulesSection";

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

        <section id="request" className="min-h-screen flex items-center justify-center">
          <h2 className="text-3xl font-semibold text-foreground">Request Materi</h2>
        </section>
      </main>
    </div>
  );
};

export default Index;
