import { BookOpen, Brain, Sparkles } from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "Dynamic Syllabus Generation",
    description:
      "A syllabus is generated automatically based on your topic and skill level. Learning becomes more focused and efficient.",
  },
  {
    icon: Brain,
    title: "AI-Assisted Learning Paths",
    description:
      "A personal learning path adapted to your progress and learning style. AI helps you stay on track.",
  },
  {
    icon: Sparkles,
    title: "Interactive Highlights & Quizzes",
    description:
      "Key material is highlighted automatically with interactive quizzes to ensure deep understanding.",
  },
];

export const FeaturesSection = () => {
  return (
    <section className="py-24 md:py-32 bg-secondary/30">
      <div className="container mx-auto px-6 md:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 md:mb-20">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Key Features
          </span>
          <h2 className="text-3xl md:text-4xl font-semibold text-foreground mb-4 tracking-tight">
            Learn Smarter, Not Harder
          </h2>
          <p className="text-muted-foreground text-lg">
            Our platform helps you learn more effectively with a personal, adaptive approach.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group bg-card rounded-2xl p-8 md:p-10 shadow-soft hover:shadow-elevated transition-all duration-300 hover:scale-[1.02] border border-border/50"
              style={{
                animationDelay: `${index * 100}ms`,
              }}
            >
              {/* Icon Container */}
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/15 transition-colors duration-300">
                <feature.icon className="w-7 h-7 text-primary" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold text-foreground mb-3 tracking-tight">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
