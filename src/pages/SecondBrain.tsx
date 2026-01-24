import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLearningNotes, useDeleteLearningNote } from "@/hooks/useLearningNotes";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Brain,
    Search,
    Trash2,
    ExternalLink,
    StickyNote,
    Sparkles,
    Filter,
    Calendar,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

// ============================================
// TYPES
// ============================================
interface ModuleInfo {
    id: string;
    title: string;
}

// ============================================
// CUSTOM HOOK: Fetch Module Titles for Notes
// ============================================
function useModulesForNotes(moduleIds: string[]) {
    return useQuery({
        queryKey: ["modules-for-notes", moduleIds],
        queryFn: async () => {
            if (moduleIds.length === 0) return {};

            const { data, error } = await supabase
                .from("modules")
                .select("id, title")
                .in("id", moduleIds);

            if (error) throw error;

            // Create a map of moduleId -> title
            const moduleMap: Record<string, ModuleInfo> = {};
            (data ?? []).forEach((mod) => {
                moduleMap[mod.id] = { id: mod.id, title: mod.title };
            });
            return moduleMap;
        },
        enabled: moduleIds.length > 0,
    });
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function SecondBrain() {
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);

    // Fetch all notes for the user (no moduleId filter = all notes)
    const { data: notes, isLoading: notesLoading } = useLearningNotes(user?.id);
    const deleteNoteMutation = useDeleteLearningNote();

    // Extract unique module IDs from notes
    const moduleIds = useMemo(() => {
        if (!notes) return [];
        return [...new Set(notes.map((n) => n.module_id))];
    }, [notes]);

    // Fetch module titles
    const { data: modulesMap, isLoading: modulesLoading } = useModulesForNotes(moduleIds);

    // Filter notes by search query and selected module
    const filteredNotes = useMemo(() => {
        if (!notes) return [];
        return notes.filter((note) => {
            const matchesSearch =
                searchQuery === "" ||
                note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (note.highlighted_text?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

            const matchesModule = selectedModuleId === null || note.module_id === selectedModuleId;

            return matchesSearch && matchesModule;
        });
    }, [notes, searchQuery, selectedModuleId]);

    const isLoading = notesLoading || modulesLoading;

    // ============================================
    // RENDER
    // ============================================
    return (
        <DashboardLayout>
            <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                            <Brain className="h-6 w-6 text-purple-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Second Brain</h1>
                            <p className="text-sm text-muted-foreground">
                                Semua catatan Anda di satu tempat
                            </p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
                            <StickyNote className="h-3.5 w-3.5" />
                            {notes?.length ?? 0} Catatan
                        </Badge>
                        <Badge variant="outline" className="gap-1.5 px-3 py-1.5">
                            <Sparkles className="h-3.5 w-3.5" />
                            {moduleIds.length} Modul
                        </Badge>
                    </div>
                </div>

                {/* Search & Filter */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Cari catatan..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {/* Module Filter */}
                    <div className="flex gap-2 flex-wrap">
                        <Button
                            variant={selectedModuleId === null ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedModuleId(null)}
                            className="gap-1.5"
                        >
                            <Filter className="h-3.5 w-3.5" />
                            Semua
                        </Button>
                        {moduleIds.slice(0, 3).map((modId) => (
                            <Button
                                key={modId}
                                variant={selectedModuleId === modId ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSelectedModuleId(modId)}
                                className="max-w-[150px] truncate"
                            >
                                {modulesMap?.[modId]?.title ?? "Modul"}
                            </Button>
                        ))}
                        {moduleIds.length > 3 && (
                            <Badge variant="secondary" className="px-2.5">
                                +{moduleIds.length - 3} lainnya
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Notes Grid */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, i) => (
                            <Card key={i} className="h-[200px]">
                                <CardHeader className="space-y-2">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-3 w-1/2" />
                                </CardHeader>
                                <CardContent>
                                    <Skeleton className="h-16 w-full" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : filteredNotes.length === 0 ? (
                    <Card className="py-12">
                        <CardContent className="flex flex-col items-center justify-center text-center">
                            <div className="p-4 rounded-full bg-muted/50 mb-4">
                                <StickyNote className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <CardTitle className="text-lg mb-1">Belum Ada Catatan</CardTitle>
                            <CardDescription>
                                {searchQuery
                                    ? "Tidak ada catatan yang cocok dengan pencarian Anda."
                                    : "Mulai buat catatan saat belajar modul untuk melihatnya di sini."}
                            </CardDescription>
                        </CardContent>
                    </Card>
                ) : (
                    <ScrollArea className="h-[calc(100vh-280px)]">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pr-4">
                            {filteredNotes.map((note) => {
                                const moduleInfo = modulesMap?.[note.module_id];
                                return (
                                    <Card
                                        key={note.id}
                                        className={cn(
                                            "group relative hover:border-purple-500/50 transition-all duration-200",
                                            "hover:shadow-lg hover:shadow-purple-500/5"
                                        )}
                                    >
                                        <CardHeader className="pb-2">
                                            {/* Module Link */}
                                            <div className="flex items-start justify-between">
                                                <Link
                                                    to={`/modules/${note.module_id}/learn`}
                                                    className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition-colors group/link"
                                                >
                                                    <span className="truncate max-w-[180px]">
                                                        {moduleInfo?.title ?? "Modul"}
                                                    </span>
                                                    <ExternalLink className="h-3 w-3 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                                                </Link>

                                                {/* Delete Button */}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                                                    onClick={() => deleteNoteMutation.mutate(note.id)}
                                                    disabled={deleteNoteMutation.isPending}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>

                                            {/* Date */}
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <Calendar className="h-3 w-3" />
                                                {format(new Date(note.created_at), "dd MMM yyyy, HH:mm", {
                                                    locale: localeId,
                                                })}
                                            </div>
                                        </CardHeader>

                                        <CardContent className="space-y-2">
                                            {/* Highlighted Text */}
                                            {note.highlighted_text && (
                                                <div className="p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-xs text-yellow-200/80 italic">
                                                    "{note.highlighted_text}"
                                                </div>
                                            )}

                                            {/* Note Content */}
                                            <p className="text-sm text-foreground/90 line-clamp-4">
                                                {note.content}
                                            </p>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </ScrollArea>
                )}
            </div>
        </DashboardLayout>
    );
}
