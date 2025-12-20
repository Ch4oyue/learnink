import { Navbar } from "@/components/layout/Navbar";
import { HeroSection } from "@/components/sections/HeroSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-[4.5rem]">
        <HeroSection />

        {/* Placeholder sections for scroll testing */}
        <section id="fitur" className="min-h-screen flex items-center justify-center bg-secondary/30">
          <h2 className="text-3xl font-semibold text-foreground">Fitur</h2>
        </section>

        <section id="silabus" className="min-h-screen flex items-center justify-center">
          <h2 className="text-3xl font-semibold text-foreground">Silabus</h2>
        </section>

        <section id="modul" className="min-h-screen flex items-center justify-center bg-secondary/30">
          <h2 className="text-3xl font-semibold text-foreground">Daftar Modul</h2>
        </section>

        <section id="request" className="min-h-screen flex items-center justify-center">
          <h2 className="text-3xl font-semibold text-foreground">Request Materi</h2>
        </section>
      </main>
    </div>
  );
};

export default Index;
