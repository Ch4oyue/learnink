import { Navbar } from "@/components/layout/Navbar";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section Placeholder */}
      <main className="pt-[4.5rem]">
        <section id="home" className="min-h-[80vh] flex items-center justify-center">
          <div className="container mx-auto px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground">
              Kuasai <span className="text-primary">AI Automation</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
              Platform belajar AI untuk mahasiswa dan profesional non-IT. Tanpa perlu coding.
            </p>
          </div>
        </section>

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
