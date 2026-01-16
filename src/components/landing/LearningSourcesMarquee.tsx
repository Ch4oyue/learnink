import { useLearningSourcesMarquee, LearningSource } from "@/hooks/useLearningSourcesMarquee";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { motion } from "framer-motion";

// Fallback data when Supabase data is not available
const FALLBACK_SOURCES: LearningSource[] = [
    { id: "1", name: "freeCodeCamp", logo_url: "https://cdn.simpleicons.org/freecodecamp/0A0A23", website_url: "https://freecodecamp.org", description: null, category: "coding", display_order: 1 },
    { id: "2", name: "MDN Web Docs", logo_url: "https://cdn.simpleicons.org/mdnwebdocs/000000", website_url: "https://developer.mozilla.org", description: null, category: "docs", display_order: 2 },
    { id: "3", name: "Coursera", logo_url: "https://cdn.simpleicons.org/coursera/0056D2", website_url: "https://coursera.org", description: null, category: "courses", display_order: 3 },
    { id: "4", name: "YouTube", logo_url: "https://cdn.simpleicons.org/youtube/FF0000", website_url: "https://youtube.com", description: null, category: "video", display_order: 4 },
    { id: "5", name: "Stack Overflow", logo_url: "https://cdn.simpleicons.org/stackoverflow/F58025", website_url: "https://stackoverflow.com", description: null, category: "community", display_order: 5 },
    { id: "6", name: "GitHub", logo_url: "https://cdn.simpleicons.org/github/181717", website_url: "https://github.com", description: null, category: "code", display_order: 6 },
    { id: "7", name: "W3Schools", logo_url: "https://cdn.simpleicons.org/w3schools/04AA6D", website_url: "https://w3schools.com", description: null, category: "tutorials", display_order: 7 },
    { id: "8", name: "Udemy", logo_url: "https://cdn.simpleicons.org/udemy/A435F0", website_url: "https://udemy.com", description: null, category: "courses", display_order: 8 },
];

interface MarqueeItemProps {
    source: LearningSource;
}

function MarqueeItem({ source }: MarqueeItemProps) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <a
                    href={source.website_url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-6 py-3 mx-2 rounded-xl bg-zinc-900/40 border border-zinc-800/40 
                               hover:bg-zinc-800/60 hover:border-zinc-700/60 transition-all duration-300 group
                               shrink-0"
                >
                    <img
                        src={source.logo_url}
                        alt={source.name}
                        className="w-6 h-6 object-contain grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300"
                        onError={(e) => {
                            // Fallback to first letter if image fails
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                        }}
                    />
                    <span className="hidden w-6 h-6 rounded bg-zinc-700 items-center justify-center text-xs font-bold text-zinc-300">
                        {source.name.charAt(0)}
                    </span>
                    <span className="text-sm font-medium text-zinc-500 group-hover:text-zinc-200 transition-colors whitespace-nowrap">
                        {source.name}
                    </span>
                </a>
            </TooltipTrigger>
            <TooltipContent side="top" className="bg-zinc-800 border-zinc-700">
                <p className="text-sm">{source.description || `Learn from ${source.name}`}</p>
            </TooltipContent>
        </Tooltip>
    );
}

export function LearningSourcesMarquee() {
    const { data: sources, isLoading, isError } = useLearningSourcesMarquee();

    // Use fallback data if no sources from Supabase
    const displaySources = (sources && sources.length > 0) ? sources : FALLBACK_SOURCES;

    // Duplicate sources for seamless infinite scroll
    const duplicatedSources = [...displaySources, ...displaySources];

    return (
        <section className="py-16 sm:py-20 bg-zinc-950 border-t border-zinc-800/40 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center mb-12">
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.2em] mb-3">
                        Curated Learning Sources
                    </p>
                    <h3 className="text-lg sm:text-xl font-medium text-zinc-300">
                        We aggregate content from the best platforms
                    </h3>
                </div>

                {/* Infinite Marquee */}
                <div className="relative">
                    {/* Gradient fade edges */}
                    <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-zinc-950 to-transparent z-10 pointer-events-none" />
                    <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-zinc-950 to-transparent z-10 pointer-events-none" />

                    {/* Marquee container */}
                    <div className="overflow-hidden">
                        <motion.div
                            className="flex"
                            animate={{
                                x: [0, -50 * displaySources.length],
                            }}
                            transition={{
                                x: {
                                    duration: 30,
                                    repeat: Infinity,
                                    ease: "linear",
                                },
                            }}
                        >
                            {duplicatedSources.map((source, index) => (
                                <MarqueeItem
                                    key={`${source.id}-${index}`}
                                    source={source}
                                />
                            ))}
                        </motion.div>
                    </div>
                </div>

                {/* Loading state */}
                {isLoading && (
                    <div className="flex justify-center mt-4">
                        <div className="animate-pulse flex gap-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="w-32 h-10 bg-zinc-800/50 rounded-xl" />
                            ))}
                        </div>
                    </div>
                )}

                {/* Bottom text */}
                <p className="text-center text-xs text-zinc-600 mt-8">
                    Content is curated and organized to optimize your learning journey
                </p>
            </div>
        </section>
    );
}

export default LearningSourcesMarquee;
