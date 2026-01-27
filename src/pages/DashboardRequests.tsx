import { logger } from "@/lib/logger";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useAllRequests, useUpdateRequest, useCreateRequest, RequestType } from "@/hooks/useMaterialRequests";
import { useGenerateModule } from "@/hooks/useGenerateModule";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  Search,
  Sparkles,
  FileQuestion,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Loader2,
  Plus,
  Bug,
  Lightbulb,
  BookOpen
} from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  reviewing: "bg-primary/10 text-primary border-primary/20",
  completed: "bg-success/10 text-success border-success/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  reviewing: "Reviewing",
  completed: "Selesai",
  rejected: "Ditolak",
};

const statusIcons: Record<string, typeof Clock> = {
  pending: Clock,
  reviewing: Eye,
  completed: CheckCircle2,
  rejected: XCircle,
};

const typeIcons: Record<RequestType, React.ElementType> = {
  module: BookOpen,
  feature: Lightbulb,
  bug: Bug,
};

const typeLabels: Record<RequestType, string> = {
  module: "Materi",
  feature: "Fitur",
  bug: "Bug",
};

export default function DashboardRequests() {
  const { user, role } = useAuth();
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get("tab") as RequestType) || "module";
  const initialTopic = searchParams.get("topic") || "";

  const [activeTab, setActiveTab] = useState<RequestType>(initialTab);
  const [searchQuery, setSearchQuery] = useState(initialTopic);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [generateId, setGenerateId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    topic: initialTopic,
    description: "",
    category: "",
    priority: "medium",
    imageUrl: ""
  });

  // Queries & Mutations
  const { data: requests, isLoading } = useAllRequests(undefined, activeTab);
  const updateRequest = useUpdateRequest();
  const createRequest = useCreateRequest();
  const generateModule = useGenerateModule();

  const filteredRequests = requests?.filter((req) => {
    const matchesSearch =
      req.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleGenerate = async () => {
    if (!generateId || !user) return;
    try {
      await updateRequest.mutateAsync({
        id: generateId,
        status: "reviewing",
        assignedTo: user.id,
      });
      await generateModule.mutateAsync(generateId);
      setGenerateId(null);
    } catch (error) {
      logger.error("Generate error:", error);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    await createRequest.mutateAsync({
      userId: user.id,
      topic: formData.topic,
      description: formData.description,
      category: activeTab === 'module' ? formData.category : undefined,
      priority: formData.priority,
      type: activeTab,
      imageUrl: formData.imageUrl || undefined
    });

    setIsCreateOpen(false);
    setFormData({ topic: "", description: "", category: "", priority: "medium", imageUrl: "" });
  };

  const canManage = role === "tutor" || role === "admin" || role === "superadmin";

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'high': return "border-destructive/50 text-destructive";
      case 'medium': return "border-warning/50 text-warning";
      case 'low': return "border-success/50 text-success";
      default: return "";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Requests & Feedback</h1>
            <p className="text-muted-foreground">
              {canManage
                ? "Kelola permintaan dan feedback dari pengguna"
                : "Ajukan permintaan materi, fitur baru, atau laporkan bug"}
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Buat Request Baru
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as RequestType)} className="space-y-6">
          <TabsList>
            <TabsTrigger value="module" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Materi
            </TabsTrigger>
            <TabsTrigger value="feature" className="gap-2">
              <Lightbulb className="h-4 w-4" />
              Fitur
            </TabsTrigger>
            <TabsTrigger value="bug" className="gap-2">
              <Bug className="h-4 w-4" />
              Bug
            </TabsTrigger>
          </TabsList>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Cari ${typeLabels[activeTab]}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="reviewing">Reviewing</SelectItem>
                <SelectItem value="completed">Selesai</SelectItem>
                <SelectItem value="rejected">Ditolak</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table Content */}
          <TabsContent value={activeTab} className="mt-0">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="h-16" />
                  </Card>
                ))}
              </div>
            ) : filteredRequests?.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="bg-muted/50 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                    {activeTab === 'module' && <BookOpen className="h-8 w-8 text-muted-foreground" />}
                    {activeTab === 'feature' && <Lightbulb className="h-8 w-8 text-muted-foreground" />}
                    {activeTab === 'bug' && <Bug className="h-8 w-8 text-muted-foreground" />}
                  </div>
                  <h3 className="font-medium mb-2">Tidak ada data</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {searchQuery || statusFilter !== "all"
                      ? "Coba ubah filter pencarian"
                      : `Belum ada ${typeLabels[activeTab].toLowerCase()} yang diajukan`}
                  </p>
                  <Button onClick={() => setIsCreateOpen(true)} variant="outline">
                    Ajukan Sekarang
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Topik / Judul</TableHead>
                      {activeTab === 'module' && <TableHead>Kategori</TableHead>}
                      <TableHead>Status</TableHead>
                      <TableHead>Prioritas</TableHead>
                      <TableHead>Tanggal</TableHead>
                      {canManage && activeTab === 'module' && <TableHead className="w-[120px]">Aksi</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests?.map((request) => {
                      const StatusIcon = statusIcons[request.status || "pending"];
                      return (
                        <TableRow key={request.id}>
                          <TableCell>
                            <span className="font-medium block">{request.topic}</span>
                            {request.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                {request.description}
                              </p>
                            )}
                          </TableCell>
                          {activeTab === 'module' && (
                            <TableCell>
                              <Badge variant="secondary">{request.category || "Umum"}</Badge>
                            </TableCell>
                          )}
                          <TableCell>
                            <Badge className={`gap-1 ${statusColors[request.status || "pending"]}`}>
                              <StatusIcon className="h-3 w-3" />
                              {statusLabels[request.status || "pending"]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getPriorityColor(request.priority)}>
                              {request.priority || "medium"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {request.created_at &&
                              format(new Date(request.created_at), "dd MMM yyyy", { locale: localeId })}
                          </TableCell>
                          {canManage && activeTab === 'module' && (
                            <TableCell>
                              {request.status === "pending" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setGenerateId(request.id)}
                                  className="gap-1"
                                >
                                  <Sparkles className="h-3 w-3" />
                                  Generate
                                </Button>
                              )}
                              {request.status === "reviewing" && (
                                <Badge variant="secondary" className="gap-1">
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  Processing
                                </Badge>
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Request Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {activeTab === 'module' && "Request Materi Baru"}
              {activeTab === 'feature' && "Request Fitur Baru"}
              {activeTab === 'bug' && "Lapor Bug"}
            </DialogTitle>
            <DialogDescription>
              {activeTab === 'module' && "Ajukan topik materi yang ingin Anda pelajari."}
              {activeTab === 'feature' && "Berikan ide fitur yang dapat meningkatkan pengalaman belajar."}
              {activeTab === 'bug' && "Laporkan masalah teknis yang Anda temukan."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="topic">
                {activeTab === 'module' ? "Topik Materi *" : "Judul *"}
              </Label>
              <Input
                id="topic"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                placeholder={activeTab === 'module' ? "Contoh: Dasar Python" : "Ringkasan singkat"}
                required
              />
            </div>

            {activeTab === 'module' && (
              <div className="space-y-2">
                <Label htmlFor="category">Kategori</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Contoh: Programming"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={
                  activeTab === 'module' ? "Jelaskan detail materi yang diinginkan..." :
                  activeTab === 'feature' ? "Jelaskan manfaat dan cara kerja fitur..." :
                  "Jelaskan langkah-langkah untuk mereproduksi bug..."
                }
                rows={3}
              />
            </div>

            {activeTab === 'bug' && (
              <div className="space-y-2">
                <Label htmlFor="imageUrl">URL Screenshot (Opsional)</Label>
                <Input
                  id="imageUrl"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="priority">Prioritas</Label>
              <Select
                value={formData.priority}
                onValueChange={(val) => setFormData({ ...formData, priority: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={createRequest.isPending}>
                {createRequest.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Kirim Request
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Generate Confirmation Dialog (Only for Modules/Admins) */}
      <AlertDialog open={!!generateId} onOpenChange={() => setGenerateId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Generate Modul dengan AI?
            </AlertDialogTitle>
            <AlertDialogDescription>
              AI akan menghasilkan modul pembelajaran berdasarkan request ini.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleGenerate}
              disabled={generateModule.isPending}
            >
              {generateModule.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
