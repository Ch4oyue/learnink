import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/features/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useModules, useMyModules, useDeleteModule } from "@/hooks/useModules";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProgress } from "@/hooks/useUserProgress";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  BookOpen,
  Sparkles,
  CheckCircle2,
  Clock,
  Loader2,
} from "lucide-react";

// Status badge configuration
const STATUS_CONFIG = {
  mastered: {
    label: "Mastered",
    className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    icon: CheckCircle2,
  },
  exploring: {
    label: "Exploring",
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    icon: Loader2,
  },
  queue: {
    label: "Queue",
    className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    icon: Clock,
  },
} as const;


export default function DashboardModules() {
  const { user, role, enrolledTrackIds } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: allModules, isLoading: loadingAll } = useModules();
  const { data: myModules, isLoading: loadingMy } = useMyModules(user?.id);
  const { data: progress } = useUserProgress(user?.id);
  const deleteModule = useDeleteModule();

  const isTutorOrAdmin = role === "tutor" || role === "admin" || role === "superadmin";

  const handleDelete = async () => {
    if (deleteId) {
      await deleteModule.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  // Optimize progress lookup from O(N^2) to O(N) using a Map
  const progressMap = useMemo(() => {
    if (!progress) return new Map();
    return new Map(progress.map((p) => [p.module_id, p]));
  }, [progress]);

  const getProgressForModule = (moduleId: string) => {
    return progressMap.get(moduleId);
  };

  // Filter published modules based on search AND track visibility
  const publishedModules = useMemo(() => {
    if (!allModules) return [];

    const query = searchQuery.toLowerCase();
    // 1. Filter by published status
    let mods = allModules.filter(m => m.is_published);

    // 2. Filter by Search
    mods = mods.filter(m =>
      m.title.toLowerCase().includes(query) ||
      m.category?.toLowerCase().includes(query)
    );

    // 3. Filter by Track Visibility
    if (!isTutorOrAdmin) {
      mods = mods.filter(m => !m.track_id || enrolledTrackIds.includes(m.track_id));
    }

    return mods;
  }, [allModules, searchQuery, isTutorOrAdmin, enrolledTrackIds]);

  const myFilteredModules = useMemo(() => {
    if (!myModules) return [];
    const query = searchQuery.toLowerCase();
    return myModules.filter(m =>
      m.title.toLowerCase().includes(query) ||
      m.category?.toLowerCase().includes(query)
    );
  }, [myModules, searchQuery]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Modul Pembelajaran</h1>
            <p className="text-muted-foreground">
              {isTutorOrAdmin
                ? "Kelola dan buat modul pembelajaran"
                : "Jelajahi materi pembelajaran yang tersedia"}
            </p>
          </div>
          {isTutorOrAdmin && (
            <Button asChild className="gap-2">
              <Link to="/dashboard/modules/create">
                <Plus className="h-4 w-4" />
                Buat Modul
              </Link>
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari modul..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue={isTutorOrAdmin ? "my-modules" : "all"} className="space-y-4">
          <TabsList>
            {isTutorOrAdmin && <TabsTrigger value="my-modules">Modul Saya</TabsTrigger>}
            <TabsTrigger value="all">Semua Modul</TabsTrigger>
          </TabsList>

          {/* My Modules Tab (Tutor/Admin) */}
          {isTutorOrAdmin && (
            <TabsContent value="my-modules">
              {loadingMy ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="h-16" />
                    </Card>
                  ))}
                </div>
              ) : myFilteredModules.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="font-medium mb-2">Belum ada modul</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Mulai buat modul pembelajaran pertama Anda
                    </p>
                    <Button asChild>
                      <Link to="/dashboard/modules/create">
                        <Plus className="h-4 w-4 mr-2" />
                        Buat Modul
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Modul</TableHead>
                        <TableHead>Kategori</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Dibuat</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {myFilteredModules.map((module) => (
                        <TableRow key={module.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                                <BookOpen className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{module.title}</p>
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {module.summary}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{module.category}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{module.level}</Badge>
                          </TableCell>
                          <TableCell>
                            {module.is_published ? (
                              <Badge className="bg-success/10 text-success border-success/20">
                                Published
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Draft</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {module.created_at &&
                              format(new Date(module.created_at), "dd MMM yyyy", {
                                locale: localeId,
                              })}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => navigate(`/module/${module.id}`)}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Lihat
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    navigate(`/dashboard/modules/edit/${module.id}`)
                                  }
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => setDeleteId(module.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Hapus
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              )}
            </TabsContent>
          )}

          {/* All Modules Tab */}
          <TabsContent value="all">
            {loadingAll ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="h-40" />
                  </Card>
                ))}
              </div>
            ) : publishedModules.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Sparkles className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="font-medium mb-2">
                    {searchQuery ? `Tidak ditemukan modul "${searchQuery}"` : "Belum ada modul tersedia"}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {searchQuery
                      ? "Mungkin belum ada yang membuatnya. Jadilah yang pertama merequest!"
                      : "Modul akan muncul di sini ketika sudah dipublikasikan"}
                    {!isTutorOrAdmin && " (Hanya menampilkan modul sesuai Track Anda)"}
                  </p>
                  <Button asChild variant="outline">
                    <Link to={`/dashboard/requests?tab=module&topic=${encodeURIComponent(searchQuery)}`}>
                      Request Modul Ini
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {publishedModules.map((module) => {
                  const moduleProgress = getProgressForModule(module.id);
                  return (
                    <Link to={`/module/${module.id}`} key={module.id}>
                      <Card className="group hover:shadow-medium transition-all duration-300 h-full">
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between mb-3">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                              <BookOpen className="h-5 w-5 text-primary" />
                            </div>
                            {moduleProgress?.is_completed ? (
                              <Badge className="bg-success/10 text-success border-success/20 gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Selesai
                              </Badge>
                            ) : moduleProgress ? (
                              <Badge variant="secondary" className="gap-1">
                                <Clock className="h-3 w-3" />
                                {moduleProgress.progress_percent}%
                              </Badge>
                            ) : null}
                          </div>
                          <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                            {module.title}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {module.summary}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="secondary" className="text-xs">
                              {module.category}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {module.level}
                            </Badge>
                            {/* Module Status Badge (Creator Confidence) */}
                            {module.status && STATUS_CONFIG[module.status as keyof typeof STATUS_CONFIG] && (() => {
                              const config = STATUS_CONFIG[module.status as keyof typeof STATUS_CONFIG];
                              const StatusIcon = config.icon;
                              return (
                                <Badge className={`text-xs gap-1 ${config.className}`}>
                                  <StatusIcon className={`h-3 w-3 ${module.status === 'exploring' ? 'animate-spin' : ''}`} />
                                  {config.label}
                                </Badge>
                              );
                            })()}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="glass-liquid rounded-[24px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Modul?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Modul akan dihapus secara permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteModule.isPending ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
