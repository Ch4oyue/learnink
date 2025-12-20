import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Zap, MessageSquare, Settings, BarChart, FileText, Bot } from "lucide-react";

const modules = [
  {
    icon: Zap,
    title: "Intro to AI",
    summary: "Pahami konsep dasar kecerdasan buatan dan bagaimana AI mengubah cara kita bekerja sehari-hari.",
    level: "Pemula",
    progress: 0,
  },
  {
    icon: MessageSquare,
    title: "ChatGPT 101",
    summary: "Kuasai teknik prompting dan maksimalkan produktivitas dengan ChatGPT untuk berbagai kebutuhan.",
    level: "Pemula",
    progress: 45,
  },
  {
    icon: Settings,
    title: "Automation Tools",
    summary: "Pelajari tools automasi populer seperti Zapier, Make, dan n8n untuk workflow yang efisien.",
    level: "Menengah",
    progress: 20,
  },
  {
    icon: BarChart,
    title: "AI untuk Analisis Data",
    summary: "Gunakan AI untuk menganalisis data, membuat visualisasi, dan menghasilkan insight bisnis.",
    level: "Menengah",
    progress: 0,
  },
  {
    icon: FileText,
    title: "Content Creation dengan AI",
    summary: "Buat konten berkualitas tinggi dengan bantuan AI untuk blog, sosial media, dan marketing.",
    level: "Pemula",
    progress: 75,
  },
  {
    icon: Bot,
    title: "Build Your Own AI Agent",
    summary: "Bangun AI agent custom untuk otomatisasi tugas kompleks dan workflow bisnis Anda.",
    level: "Lanjutan",
    progress: 0,
  },
];

const levelColors: Record<string, string> = {
  Pemula: "bg-emerald-100 text-emerald-700",
  Menengah: "bg-amber-100 text-amber-700",
  Lanjutan: "bg-rose-100 text-rose-700",
};

export const ModulesSection = () => {
  const [visibleCount, setVisibleCount] = useState(3);
  const visibleModules = modules.slice(0, visibleCount);
  const hasMore = visibleCount < modules.length;

  const handleLoadMore = () => {
    setVisibleCount((prev) => Math.min(prev + 3, modules.length));
  };

  return (
    <section className="py-24 md:py-32 bg-secondary/30">
      <div className="container mx-auto px-6 md:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 md:mb-20">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Daftar Modul
          </span>
          <h2 className="text-3xl md:text-4xl font-semibold text-foreground mb-4 tracking-tight">
            Mulai Perjalanan Belajar Anda
          </h2>
          <p className="text-muted-foreground text-lg">
            Pilih modul yang sesuai dengan level dan kebutuhan Anda. Belajar step-by-step dengan materi yang terstruktur.
          </p>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {visibleModules.map((module, index) => (
            <div
              key={module.title}
              className="group bg-card rounded-2xl p-8 shadow-soft hover:shadow-elevated transition-all duration-300 hover:-translate-y-1 border border-border/50 cursor-pointer"
              style={{
                animationDelay: `${index * 100}ms`,
              }}
            >
              {/* Header with Icon and Level */}
              <div className="flex items-start justify-between mb-5">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors duration-300">
                  <module.icon className="w-6 h-6 text-primary" />
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${levelColors[module.level]}`}
                >
                  {module.level}
                </span>
              </div>

              {/* Content */}
              <h3 className="text-lg font-semibold text-foreground mb-2 tracking-tight group-hover:text-primary transition-colors duration-300">
                {module.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                {module.summary}
              </p>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="text-foreground font-medium">{module.progress}%</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${module.progress}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load More Button */}
        {hasMore && (
          <div className="text-center mt-12">
            <Button
              variant="outline"
              size="lg"
              onClick={handleLoadMore}
              className="rounded-full px-8 hover:bg-primary hover:text-primary-foreground transition-all duration-300"
            >
              Load More
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};
