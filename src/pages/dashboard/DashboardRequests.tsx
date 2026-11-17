import { logger } from "@/lib/logger";
import { useState, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/features/dashboard/DashboardLayout";
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
import { enUS as localeId } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
  BookOpen,
  ImagePlus,
  Upload,
  X
} from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  reviewing: "bg-primary/10 text-primary border-primary/20",
  completed: "bg-success/10 text-success border-success/20",
  rejected: "bg-destructive/10 text-destructive-text border-destructive/20",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  reviewing: "Reviewing",
  completed: "Completed",
  rejected: "Rejected",
};

const statusIcons: Record<string, typeof Clock> = {
  pending: Clock,
  reviewing: Eye,
  completed: CheckCircle2,
  rejected: XCircle,
};

const typeLabels: Record<RequestType, string> = {
  module: "Material",
  feature: "Feature",
  bug: "Bug",
};

export default function DashboardRequests() {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get("tab") as RequestType) || "module";
  const initialTopic = searchParams.get("topic") || "";
  const initialDescription = searchParams.get("description") || "";
  const shouldOpenCreate = searchParams.get("openCreate") === "true";

  const [activeTab, setActiveTab] = useState<RequestType>(initialTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [generateId, setGenerateId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(shouldOpenCreate);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState({
    topic: initialTopic,
    description: initialDescription,
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

  const handleFileUpload = async (file: File) => {
    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('request-attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('request-attachments')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, imageUrl: data.publicUrl }));
      toast({ title: "Image uploaded" });
    } catch (error) {
      logger.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: (error as Error).message || "Make sure the 'request-attachments' bucket exists & is public.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const blob = items[i].getAsFile();
        if (blob) handleFileUpload(blob);
      }
    }
  };

  const canManage = role === "tutor" || role === "admin" || role === "superadmin";

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'high': return "border-destructive/50 text-destructive-text";
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
                ? "Manage requests and feedback from users"
                : "Request materials or new features, or report a bug"}
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create New Request
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as RequestType)} className="space-y-6">
          <TabsList>
            <TabsTrigger value="module" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Material
            </TabsTrigger>
            <TabsTrigger value="feature" className="gap-2">
              <Lightbulb className="h-4 w-4" />
              Feature
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
                placeholder={`Search ${typeLabels[activeTab]}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select aria-label="Status filter" value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="reviewing">Reviewing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
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
                  <h3 className="font-medium mb-2">No data</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {searchQuery || statusFilter !== "all"
                      ? "Try adjusting the search filter"
                      : `No ${typeLabels[activeTab].toLowerCase()} submitted yet`}
                  </p>
                  <Button onClick={() => setIsCreateOpen(true)} variant="outline">
                    Submit Now
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Topic / Title</TableHead>
                      {activeTab === 'module' && <TableHead>Category</TableHead>}
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Date</TableHead>
                      {canManage && activeTab === 'module' && <TableHead className="w-[120px]">Actions</TableHead>}
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
        <DialogContent className="max-w-lg glass-liquid rounded-[24px]">
          <DialogHeader>
            <DialogTitle>
              {activeTab === 'module' && "New Material Request"}
              {activeTab === 'feature' && "New Feature Request"}
              {activeTab === 'bug' && "Report a Bug"}
            </DialogTitle>
            <DialogDescription>
              Describe the material you want to learn.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="topic">
                {activeTab === 'module' ? "Material Topic *" : "Title *"}
              </Label>
              <Input
                id="topic"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                placeholder={activeTab === 'module' ? "Example: Python Basics" : "Short summary"}
                required
              />
            </div>

            {activeTab === 'module' && (
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Example: Programming"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="description">Description & Screenshot</Label>
              <div className="relative">
                 <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    onPaste={handlePaste}
                    placeholder="Detailed description... (paste images here)"
                    rows={4}
                  />
                  {uploading && (
                    <div className="absolute inset-0 bg-background/50 flex items-center justify-center rounded-md">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  )}
              </div>
            </div>

            {/* Attachment Preview Area */}
            <div className="space-y-2">
                <Label>Attachments</Label>
                <div className="flex items-center gap-4">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                    >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Image
                    </Button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(file);
                        }}
                    />

                    {formData.imageUrl && (
                        <div className="relative group">
                            <img src={formData.imageUrl} alt="Preview" className="h-16 w-16 object-cover rounded-lg border" />
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, imageUrl: "" }))}
                                className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    )}
                </div>
                <p className="text-xs text-muted-foreground">
                    Copy-paste an image directly into the description field or use the upload button.
                </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select aria-label="Priority"
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
                Cancel
              </Button>
              <Button type="submit" disabled={createRequest.isPending || uploading}>
                {createRequest.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Send Request
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
              Generate Module with AI?
            </AlertDialogTitle>
            <AlertDialogDescription>
              AI will create a learning module based on this request.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
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
