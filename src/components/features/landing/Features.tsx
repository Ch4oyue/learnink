import { Zap, BookOpen, LineChart } from "lucide-react";

const features = [
    {
        icon: Zap,
        title: "Instant Feedback",
        description: "No need to wait for code reviews. Get syntax and logic analysis in real time as you type.",
        color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    },
    {
        icon: BookOpen,
        title: "Automatic Notes",
        description: "AI compiles a summary of every lesson, so you can focus on writing code - not taking notes.",
        color: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
    },
    {
        icon: LineChart,
        title: "Progress Tracking",
        description: "Track your growth with analytics that show which concepts you have mastered.",
        color: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
    },
];

export function Features() {
    return (
        <section id="features" className="py-24 sm:py-32 bg-muted/50 border-t border-border cv-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {features.map((feature) => (
                        <div
                            key={feature.title}
                            className="group p-8 rounded-2xl bg-card hover:bg-card/80 border border-border hover:border-primary/30 transition-all duration-300 shadow-sm hover:shadow-lg"
                        >
                            <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                <feature.icon className="h-6 w-6" aria-hidden="true" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-3">
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
}
