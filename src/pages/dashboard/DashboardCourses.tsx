import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTracks, useEnrollTrack } from "@/hooks/useTracks";
import { DashboardLayout } from "@/components/features/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  CheckCircle2,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen, Code, Brain, Lightbulb, Atom, Calculator, Languages, Cpu, GraduationCap,
};

export default function DashboardCourses() {
  const { user, enrolledTrackIds } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const trackSlug = searchParams.get("track");

  const { data: tracks, isLoading } = useTracks();
  const enrollTrack = useEnrollTrack();

  const filteredTracks = tracks?.filter(track => {
    const matchesSearch = track.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSlug = trackSlug ? track.slug === trackSlug : true;

    return matchesSearch && matchesSlug;
  });

  const handleEnroll = async (trackId: string) => {
    if (!user) {
        navigate('/auth');
        return;
    }
    try {
        await enrollTrack.mutateAsync({ userId: user.id, trackId });
        navigate(`/dashboard/course/${trackId}`);
    } catch (error) {
        // Error handled by hook toast
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Course Catalog
          </h1>
          <p className="text-lg text-muted-foreground">
            Pilih jalur pembelajaran yang sesuai dengan minat dan tujuan karir Anda.
          </p>
        </div>

        {/* Search & Filter */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-soft space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {trackSlug && (
              <Button
                variant="ghost"
                onClick={() => setSearchParams({})}
                className="text-muted-foreground hover:text-foreground"
              >
                Clear Filter ({trackSlug})
              </Button>
            )}
          </div>
        </div>

        {/* Tracks Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : filteredTracks && filteredTracks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTracks.map((track) => {
              const IconComponent = iconMap[track.icon || 'BookOpen'] || BookOpen;
              const isEnrolled = enrolledTrackIds.includes(track.id);

              return (
                <div
                  key={track.id}
                  className="bg-card border border-border rounded-xl p-6 shadow-soft hover:shadow-md transition-all duration-300 h-full flex flex-col"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <IconComponent className="h-6 w-6 text-primary" />
                    </div>
                    {isEnrolled && (
                      <Badge className="bg-green-500/10 text-green-600 gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Terdaftar
                      </Badge>
                    )}
                  </div>

                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {track.name}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-6 flex-1">
                    {track.description}
                  </p>

                  <div className="mt-auto pt-4 border-t border-border">
                    {isEnrolled ? (
                      <Button
                        className="w-full gap-2"
                        onClick={() => navigate(`/dashboard/course/${track.id}`)}
                      >
                        <BookOpen className="h-4 w-4" />
                        Lanjut Belajar
                      </Button>
                    ) : (
                      <Button
                        className="w-full gap-2"
                        variant="outline"
                        onClick={() => handleEnroll(track.id)}
                        disabled={enrollTrack.isPending}
                      >
                        {enrollTrack.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <GraduationCap className="h-4 w-4" />
                        )}
                        Ambil Kursus
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-card border border-border rounded-xl">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Courses Found</h3>
            <p className="text-muted-foreground">
              Coba kata kunci pencarian yang lain.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
