import { useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useAllRequests, useUpdateRequest } from "@/hooks/useMaterialRequests";
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

export default function DashboardRequests() {
  const { user, role } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [generateId, setGenerateId] = useState<string | null>(null);

  const { data: requests, isLoading } = useAllRequests();
  const updateRequest = useUpdateRequest();
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
      // Update status to reviewing
      await updateRequest.mutateAsync({
        id: generateId,
        status: "reviewing",
        assignedTo: user.id,
      });

      // Generate module
      await generateModule.mutateAsync(generateId);

      setGenerateId(null);
    } catch (error) {
      console.error("Generate error:", error);
    }
  };

  const canManage = role === "tutor" || role === "admin";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold">Request Materi</h1>
          <p className="text-muted-foreground">
            {canManage
              ? "Kelola permintaan materi dari pengguna"
              : "Lihat status permintaan materi Anda"}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari request..."
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

        {/* Table */}
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
              <FileQuestion className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-medium mb-2">Tidak ada request</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery || statusFilter !== "all"
                  ? "Coba ubah filter pencarian"
                  : "Belum ada request materi yang masuk"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Topik</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Prioritas</TableHead>
                  <TableHead>Tanggal</TableHead>
                  {canManage && <TableHead className="w-[120px]">Aksi</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests?.map((request) => {
                  const StatusIcon = statusIcons[request.status || "pending"];
                  return (
                    <TableRow key={request.id}>
                      <TableCell>
                        <Link
                          to={`/request/${request.id}`}
                          className="font-medium hover:text-primary transition-colors"
                        >
                          {request.topic}
                        </Link>
                        {request.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                            {request.description}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{request.category || "Umum"}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`gap-1 ${statusColors[request.status || "pending"]}`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {statusLabels[request.status || "pending"]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            request.priority === "high"
                              ? "border-destructive/50 text-destructive"
                              : request.priority === "medium"
                              ? "border-warning/50 text-warning"
                              : ""
                          }
                        >
                          {request.priority || "medium"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {request.created_at &&
                          format(new Date(request.created_at), "dd MMM yyyy", {
                            locale: localeId,
                          })}
                      </TableCell>
                      {canManage && (
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
      </div>

      {/* Generate Confirmation Dialog */}
      <AlertDialog open={!!generateId} onOpenChange={() => setGenerateId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Generate Modul dengan AI?
            </AlertDialogTitle>
            <AlertDialogDescription>
              AI akan menghasilkan modul pembelajaran berdasarkan request ini.
              Proses ini membutuhkan waktu beberapa detik.
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
