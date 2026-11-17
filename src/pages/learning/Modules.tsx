import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useModules } from "@/hooks/useModules";
import { displayCategory, displayLevel } from "@/lib/categoryLabels";
import { useUserProgress } from "@/hooks/useUserProgress";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  BookOpen, 
  Search, 
  Code, 
  Brain, 
  Lightbulb, 
  Atom, 
  Calculator,
  Languages,
  Cpu,
  GraduationCap,
  BarChart3,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen, Code, Brain, Lightbulb, Atom, Calculator, Languages, Cpu, GraduationCap,
};

const levelColors: Record<string, string> = {
  Pemula: 'bg-green-500/10 text-green-600',
  Menengah: 'bg-amber-500/10 text-amber-600',
  Lanjutan: 'bg-red-500/10 text-red-600',
};

const categoryColors: Record<string, string> = {
  Umum: 'bg-primary/10 text-primary',
  Matematika: 'bg-blue-500/10 text-blue-600',
  Sains: 'bg-emerald-500/10 text-emerald-600',
  Bahasa: 'bg-purple-500/10 text-purple-600',
  Teknologi: 'bg-cyan-500/10 text-cyan-600',
};

const categories = ['Semua', 'Umum', 'Matematika', 'Sains', 'Bahasa', 'Teknologi'];
const levels = ['Semua', 'Pemula', 'Menengah', 'Lanjutan'];

export default function Modules() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Semua");
  const [levelFilter, setLevelFilter] = useState("Semua");

  const { data: modules, isLoading } = useModules(true);
  const { data: userProgress } = useUserProgress(user?.id);

  const progressMap = useMemo(() => {
    if (!userProgress) return new Map<string, number>();
    return new Map(userProgress.map(p => [p.module_id, p.progress_percent || 0]));
  }, [userProgress]);

  const filteredModules = modules?.filter(module => {
    const matchesSearch = module.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      module.summary?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'Semua' || module.category === categoryFilter;
    const matchesLevel = levelFilter === 'Semua' || module.level === levelFilter;
    return matchesSearch && matchesCategory && matchesLevel;
  });

  const getModuleProgress = (moduleId: string) => {
    return progressMap.get(moduleId) || 0;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Learning Modules
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore learning modules created by our tutors.
            Pick a module that matches your interests and skill level.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8 shadow-soft">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search modules..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select aria-label="Category filter" value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat === 'Semua' ? 'All' : displayCategory(cat)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select aria-label="Level filter" value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                {levels.map(lvl => (
                  <SelectItem key={lvl} value={lvl}>{lvl === 'Semua' ? 'All' : displayLevel(lvl)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Modules Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : filteredModules && filteredModules.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredModules.map((module) => {
              const IconComponent = iconMap[module.icon_name || 'BookOpen'] || BookOpen;
              const progress = getModuleProgress(module.id);
              const level = module.level || 'Pemula';
              const category = module.category || 'Umum';

              return (
                <Link 
                  key={module.id} 
                  to={`/module/${module.id}`}
                  className="group"
                >
                  <div className="bg-card border border-border rounded-xl p-6 shadow-soft hover:shadow-md transition-all duration-300 hover:border-primary/50 h-full flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <IconComponent className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex gap-2">
                        <Badge className={levelColors[level]}>
                          <BarChart3 className="h-3 w-3 mr-1" />
                          {displayLevel(level)}
                        </Badge>
                      </div>
                    </div>
                    
                    <Badge className={`${categoryColors[category] || categoryColors.Umum} w-fit mb-3`}>
                      {displayCategory(category)}
                    </Badge>

                    <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {module.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
                      {module.summary}
                    </p>

                    {user && progress > 0 && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-muted-foreground">Progress</span>
                          <span className="text-xs font-medium text-foreground">{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-1.5" aria-label={`${module.title} progress`} />
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              No Modules Found
            </h2>
            <p className="text-muted-foreground mb-6">
              {searchQuery || categoryFilter !== 'Semua' || levelFilter !== 'Semua'
                ? 'Try changing the filters or search keywords'
                : 'No modules available yet'}
            </p>
            {(searchQuery || categoryFilter !== 'Semua' || levelFilter !== 'Semua') && (
              <Button 
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('Semua');
                  setLevelFilter('Semua');
                }}
              >
                Reset Filter
              </Button>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
