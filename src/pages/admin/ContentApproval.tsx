import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { DashboardLayout } from "@/components/features/dashboard/DashboardLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { IncomingContent, ContentStatus } from "@/types/staging";
import { useModuleCategories, useModuleLevels } from "@/hooks/useModuleSettings";
import { useAllRequests, useUpdateRequest, MaterialRequestWithUser } from "@/hooks/useMaterialRequests";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AutoResizeTextarea } from "@/components/ui/auto-resize-textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MarkdownRenderer } from "@/components/shared/MarkdownRenderer";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
    Inbox,
    CheckCircle,
    XCircle,
    Loader2,
    FileText,
    Clock,
    Tag,
    RefreshCw,
    User,
    Bug,
    Lightbulb,
    BookOpen,
    Eye,
    MessageSquare,
    ExternalLink
} from "lucide-react";
import { format } from "date-fns";
import { enUS as localeId } from "date-fns/locale";
import { displayCategory, displayLevel } from "@/lib/categoryLabels";

// ============================================
// TYPES
// ============================================

interface PublishFormData {
    title: string;
    summary: string;
    content: string;
    category: string;
    level: string;
}

const INITIAL_FORM_DATA: PublishFormData = {
    title: "",
    summary: "",
    content: "",
    category: "",
    level: "",
};

// ============================================
// LOADING SKELETON
// ============================================

function CardSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
                <Card key={i} className="overflow-hidden">
                    <CardHeader className="space-y-2">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-20 w-full" />
                    </CardContent>
                    <CardFooter className="gap-2">
                        <Skeleton className="h-9 w-24" />
                        <Skeleton className="h-9 w-20" />
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function ContentApproval() {
    const { isAdmin, loading: authLoading, user, role } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // State
    const [selectedContent, setSelectedContent] = useState<IncomingContent | null>(null);
    const [rejectContent, setRejectContent] = useState<IncomingContent | null>(null);
    const [selectedRequest, setSelectedRequest] = useState<MaterialRequestWithUser | null>(null);
    const [requestAction, setRequestAction] = useState<'approve' | 'reject' | null>(null);

    const [formData, setFormData] = useState<PublishFormData>(INITIAL_FORM_DATA);
    const [isPublishOpen, setIsPublishOpen] = useState(false);
    const [isRequestDetailOpen, setIsRequestDetailOpen] = useState(false);

    // Fetch dynamic categories and levels
    const { data: categories = [] } = useModuleCategories();
    const { data: levels = [] } = useModuleLevels();

    // --- QUERY: PENDING CONTENT (Drafts) ---
    const { data: pendingContents, isLoading: contentLoading, refetch: refetchContent } = useQuery({
        queryKey: ["incoming-contents", "pending"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("incoming_contents")
                .select("*")
                .eq("status", "pending")
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data as IncomingContent[];
        },
        enabled: isAdmin,
    });

    // --- QUERY: PENDING REQUESTS (User Reports) ---
    // Only fetch pending requests for the inbox
    const { data: pendingRequests, isLoading: requestsLoading, refetch: refetchRequests } = useAllRequests('pending');

    const updateRequestMutation = useUpdateRequest();

    // Realtime subscription
    useEffect(() => {
        if (!isAdmin) return;
        const channel = supabase
            .channel("approval-realtime")
            .on("postgres_changes", { event: "*", schema: "public", table: "incoming_contents" }, () => {
                queryClient.invalidateQueries({ queryKey: ["incoming-contents"] });
            })
            .on("postgres_changes", { event: "*", schema: "public", table: "material_requests" }, () => {
                queryClient.invalidateQueries({ queryKey: ["all-requests"] });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [isAdmin, queryClient]);

    // --- ACTIONS: PUBLISH CONTENT ---
    const publishMutation = useMutation({
        mutationFn: async ({ content, formData }: { content: IncomingContent; formData: PublishFormData }) => {
            const { data: module, error: moduleError } = await supabase
                .from("modules")
                .insert({
                    title: formData.title,
                    summary: formData.summary,
                    content: formData.content,
                    category: formData.category,
                    level: formData.level,
                    icon_name: "Sparkles",
                    is_published: true,
                    created_by: user?.id,
                })
                .select("id")
                .single();

            if (moduleError) throw moduleError;

            const { error: updateError } = await supabase
                .from("incoming_contents")
                .update({
                    status: "approved" as ContentStatus,
                    processed_at: new Date().toISOString(),
                    processed_by: user?.id,
                })
                .eq("id", content.id);

            if (updateError) throw updateError;
            return module;
        },
        onSuccess: (module) => {
            toast({
                title: "Content Published Successfully! 🎉",
                description: `New module ID: ${module.id}`,
            });
            setIsPublishOpen(false);
            setSelectedContent(null);
            queryClient.invalidateQueries({ queryKey: ["incoming-contents"] });
        },
        onError: (error) => {
            toast({ title: "Publish Failed", description: error.message, variant: "destructive" });
        },
    });

    const rejectContentMutation = useMutation({
        mutationFn: async (content: IncomingContent) => {
            const { error } = await supabase
                .from("incoming_contents")
                .update({
                    status: "rejected" as ContentStatus,
                    processed_at: new Date().toISOString(),
                    processed_by: user?.id,
                })
                .eq("id", content.id);
            if (error) throw error;
        },
        onSuccess: () => {
            toast({ title: "Content Rejected", description: "The content has been marked as rejected." });
            setRejectContent(null);
            queryClient.invalidateQueries({ queryKey: ["incoming-contents"] });
        },
        onError: (error) => {
            toast({ title: "Reject Failed", description: error.message, variant: "destructive" });
        },
    });

    // --- ACTIONS: HANDLE REQUESTS ---
    const handleRequestAction = async () => {
        if (!selectedRequest || !requestAction) return;

        // If approving a Feature, mark as 'completed' (Approved).
        // If approving a Module/Bug, mark as 'reviewing' (In Progress) or 'completed' depending on workflow.
        // For simplicity: Approve -> Reviewing (Working on it) or Completed (Done).
        // Let's assume Approve -> Reviewing (Accepted into backlog).
        // EXCEPT Feature: "Approve Fitur di Superadmin" -> Completed/Approved.

        let newStatus: 'reviewing' | 'completed' | 'rejected' = 'reviewing';

        if (requestAction === 'reject') {
            newStatus = 'rejected';
        } else {
             // Approval Logic
             if (selectedRequest.type === 'feature' && role === 'superadmin') {
                 newStatus = 'completed'; // Superadmin approves feature -> Done/Approved
             } else {
                 newStatus = 'reviewing'; // Standard approval moves to "In Progress"
             }
        }

        try {
            await updateRequestMutation.mutateAsync({
                id: selectedRequest.id,
                status: newStatus,
                assignedTo: user?.id
            });

            toast({
                title: requestAction === 'approve' ? "Request Approved" : "Request Rejected",
                description: `Status changed to ${newStatus}`,
            });
            setIsRequestDetailOpen(false);
            setSelectedRequest(null);
            setRequestAction(null);
        } catch (error) {
            // Error handled by mutation
        }
    };

    // --- HANDLERS ---
    const openPublishDialog = (content: IncomingContent) => {
        setSelectedContent(content);
        const raw = content.raw_content || {};
        setFormData({
            title: content.title,
            summary: content.summary || (raw.summary as string) || `Materi tentang ${content.title}.`,
            content: content.content || (raw.content as string) || "",
            category: content.category || (raw.category as string) || categories[0]?.name || "Umum",
            level: content.level || (raw.level as string) || levels[0]?.name || "Pemula",
        });
        setIsPublishOpen(true);
    };

    const handlePublishSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedContent) return;
        publishMutation.mutate({ content: selectedContent, formData });
    };

    const handleReject = () => {
        if (!rejectContent) return;
        rejectContentMutation.mutate(rejectContent);
    };

    if (authLoading) return <DashboardLayout><Skeleton className="h-10 w-64" /><CardSkeleton /></DashboardLayout>;
    if (!isAdmin) return <Navigate to="/dashboard" replace />;

    const formatDate = (dateString: string) => {
        return format(new Date(dateString), "dd MMM HH:mm", { locale: localeId });
    };

    return (
        <DashboardLayout>
            <div className="mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold text-foreground mb-1 flex items-center gap-2">
                            <Inbox className="h-6 w-6 text-primary" />
                            Unified Inbox
                        </h1>
                        <p className="text-muted-foreground">
                            Content and user request approval center.
                        </p>
                    </div>
                    <Button onClick={() => { refetchContent(); refetchRequests(); }} variant="outline" className="gap-2">
                        <RefreshCw className="h-4 w-4" /> Refresh
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="drafts" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="drafts" className="gap-2">
                        <FileText className="h-4 w-4" />
                        Content Drafts
                        {pendingContents && pendingContents.length > 0 && (
                            <Badge variant="secondary" className="ml-1 h-5 px-1.5">{pendingContents.length}</Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="requests" className="gap-2">
                        <MessageSquare className="h-4 w-4" />
                        User Requests
                        {pendingRequests && pendingRequests.length > 0 && (
                            <Badge variant="secondary" className="ml-1 h-5 px-1.5">{pendingRequests.length}</Badge>
                        )}
                    </TabsTrigger>
                </TabsList>

                {/* --- TAB: DRAFTS --- */}
                <TabsContent value="drafts">
                    {contentLoading ? <CardSkeleton /> : pendingContents && pendingContents.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {pendingContents.map((content) => (
                                <Card key={content.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-1 min-w-0 flex-1">
                                                <h3 className="font-semibold text-foreground leading-tight line-clamp-2">
                                                    {content.title}
                                                </h3>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <Clock className="h-3 w-3" />
                                                    {formatDate(content.created_at)}
                                                </div>
                                            </div>
                                            <Badge variant="outline" className="shrink-0 text-xs">{content.source}</Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pb-3">
                                        <div className="text-sm text-muted-foreground line-clamp-3 mb-3">
                                            {content.raw_content?.content?.substring(0, 200) || "No content preview."}
                                        </div>
                                    </CardContent>
                                    <CardFooter className="gap-2 pt-3 border-t">
                                        <Button size="sm" onClick={() => openPublishDialog(content)} className="flex-1 gap-1">
                                            <CheckCircle className="h-4 w-4" /> Review
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => setRejectContent(content)} className="text-destructive-text hover:bg-destructive/10">
                                            <XCircle className="h-4 w-4" />
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                            <h3 className="text-lg font-medium">Empty Inbox</h3>
                            <p className="text-muted-foreground">No pending draft content.</p>
                        </div>
                    )}
                </TabsContent>

                {/* --- TAB: REQUESTS --- */}
                <TabsContent value="requests">
                    {requestsLoading ? <CardSkeleton /> : pendingRequests && pendingRequests.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {pendingRequests.map((req) => (
                                <Card key={req.id} className="overflow-hidden hover:shadow-lg transition-shadow border-l-4" style={{
                                    borderLeftColor: req.type === 'bug' ? '#ef4444' : req.type === 'feature' ? '#f59e0b' : '#3b82f6'
                                }}>
                                    <CardHeader className="pb-3">
                                        <div className="flex justify-between items-start">
                                            <div className="flex gap-2">
                                                {req.type === 'bug' && <Bug className="h-5 w-5 text-red-500" />}
                                                {req.type === 'feature' && <Lightbulb className="h-5 w-5 text-amber-500" />}
                                                {req.type === 'module' && <BookOpen className="h-5 w-5 text-blue-500" />}
                                                <div>
                                                    <h3 className="font-semibold line-clamp-1">{req.topic}</h3>
                                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <User className="h-3 w-3" />
                                                        {req.user_display_name || "User"}
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge variant="outline" className="uppercase text-[13px]">{req.priority || "medium"}</Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pb-3">
                                        <p className="text-sm text-muted-foreground line-clamp-3">
                                            {req.description || "No description."}
                                        </p>
                                        {req.image_url && (
                                            <div className="mt-2 text-xs text-primary flex items-center gap-1">
                                                <ExternalLink className="h-3 w-3" />
                                                Lampiran Gambar
                                            </div>
                                        )}
                                    </CardContent>
                                    <CardFooter className="gap-2 pt-3 border-t">
                                        <Button size="sm" variant="secondary" onClick={() => { setSelectedRequest(req); setIsRequestDetailOpen(true); }} className="flex-1">
                                            <Eye className="h-4 w-4 mr-1" /> Detail
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <CheckCircle className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                            <h3 className="text-lg font-medium">All Clear!</h3>
                            <p className="text-muted-foreground">No pending user requests.</p>
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* --- DIALOG: PUBLISH CONTENT --- */}
            <Dialog open={isPublishOpen} onOpenChange={setIsPublishOpen}>
                <DialogContent className="max-w-7xl w-full max-h-[95vh] h-[95vh] flex flex-col glass-liquid rounded-[24px] p-0 gap-0 overflow-hidden">
                    <div className="p-4 md:p-6 pb-0">
                        <DialogHeader>
                            <DialogTitle>Review & Publish</DialogTitle>
                            <DialogDescription>Edit content before publishing.</DialogDescription>
                        </DialogHeader>
                    </div>
                    <form onSubmit={handlePublishSubmit} className="flex-1 flex flex-col p-4 md:p-6 gap-4 overflow-y-auto md:overflow-hidden">
                        <div className="space-y-2">
                            <Label>Title</Label>
                            <Input
                                value={formData.title}
                                onChange={e => setFormData({...formData, title: e.target.value})}
                                required
                                className="bg-black/20 border-white/10 rounded-2xl backdrop-blur-sm focus:bg-black/40 transition-all duration-300 placeholder:text-muted-foreground/50"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Summary</Label>
                                <Textarea
                                    value={formData.summary}
                                    onChange={e => setFormData({...formData, summary: e.target.value})}
                                    className="h-20 resize-none bg-black/20 border-white/10 rounded-2xl backdrop-blur-sm focus:bg-black/40 transition-all duration-300 placeholder:text-muted-foreground/50"
                                />
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Category</Label>
                                    <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v})}>
                                        <SelectTrigger className="bg-black/20 border-white/10 rounded-2xl backdrop-blur-sm focus:bg-black/40 transition-all duration-300"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {categories.map(c => <SelectItem key={c.id} value={c.name}>{displayCategory(c.name)}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Level</Label>
                                    <Select value={formData.level} onValueChange={v => setFormData({...formData, level: v})}>
                                        <SelectTrigger className="bg-black/20 border-white/10 rounded-2xl backdrop-blur-sm focus:bg-black/40 transition-all duration-300"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {levels.map(l => <SelectItem key={l.id} value={l.name}>{displayLevel(l.name)}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2 md:flex-1 md:flex md:flex-col md:min-h-0">
                            <Label>Content</Label>
                            {/* Desktop: Split View, Mobile: Tabs */}
                            <div className="hidden md:block flex-1 overflow-hidden min-h-0">
                                <ResizablePanelGroup direction="horizontal" className="gap-4">
                                    <ResizablePanel defaultSize={50} minSize={30}>
                                        <div className="h-full flex flex-col p-4 overflow-y-auto bg-black/20 border border-white/10 rounded-2xl backdrop-blur-sm">
                                            <span className="text-xs font-semibold text-muted-foreground mb-4 flex items-center gap-1 sticky top-0 bg-transparent z-10">
                                                <FileText className="h-3 w-3" /> Editor
                                            </span>
                                            <AutoResizeTextarea
                                                value={formData.content}
                                                onChange={e => setFormData({...formData, content: e.target.value})}
                                                className="w-full font-mono text-sm border-none focus-visible:ring-0 p-0 min-h-[500px] bg-transparent resize-none placeholder:text-muted-foreground/50"
                                                placeholder="Tulis konten menggunakan format Markdown..."
                                            />
                                        </div>
                                    </ResizablePanel>
                                    <ResizableHandle withHandle />
                                    <ResizablePanel defaultSize={50} minSize={30}>
                                        <div className="h-full flex flex-col p-4 bg-black/20 border border-white/10 rounded-2xl backdrop-blur-sm">
                                            <span className="text-xs font-semibold text-muted-foreground mb-4 flex items-center gap-1">
                                                <Eye className="h-3 w-3" /> Live Preview
                                            </span>
                                            <div className="flex-1 overflow-y-auto prose dark:prose-invert max-w-none">
                                                {formData.content ? (
                                                    <MarkdownRenderer content={formData.content} />
                                                ) : (
                                                    <p className="text-muted-foreground text-center italic py-8">No content to preview yet.</p>
                                                )}
                                            </div>
                                        </div>
                                    </ResizablePanel>
                                </ResizablePanelGroup>
                            </div>

                            {/* Mobile View */}
                            <div className="md:hidden w-full">
                                <Tabs defaultValue="edit" className="w-full">
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="edit">Editor</TabsTrigger>
                                        <TabsTrigger value="preview">Preview</TabsTrigger>
                                    </TabsList>
                                    <div className="mt-2">
                                        <TabsContent value="edit" className="mt-0">
                                            <AutoResizeTextarea
                                                value={formData.content}
                                                onChange={e => setFormData({...formData, content: e.target.value})}
                                                className="font-mono text-sm min-h-[300px] bg-black/20 border-white/10 rounded-2xl backdrop-blur-sm focus:bg-black/40 transition-all duration-300 placeholder:text-muted-foreground/50"
                                                placeholder="Tulis konten menggunakan format Markdown..."
                                            />
                                        </TabsContent>
                                        <TabsContent value="preview" className="mt-0">
                                            <div className="border border-white/10 rounded-2xl p-4 min-h-[300px] bg-black/20 backdrop-blur-sm">
                                                <MarkdownRenderer content={formData.content} />
                                            </div>
                                        </TabsContent>
                                    </div>
                                </Tabs>
                            </div>
                        </div>
                        <DialogFooter className="mt-auto">
                            <Button type="button" variant="ghost" onClick={() => setIsPublishOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={publishMutation.isPending}>Publish</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* --- DIALOG: REQUEST DETAIL --- */}
            <Dialog open={isRequestDetailOpen} onOpenChange={setIsRequestDetailOpen}>
                <DialogContent className="max-w-lg glass-liquid rounded-[24px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {selectedRequest?.type === 'bug' ? <Bug className="text-red-500" /> : selectedRequest?.type === 'feature' ? <Lightbulb className="text-amber-500" /> : <BookOpen className="text-blue-500" />}
                            Detail Request
                        </DialogTitle>
                        <DialogDescription>
                             Diajukan oleh <strong>{selectedRequest?.user_display_name}</strong> pada {selectedRequest?.created_at && formatDate(selectedRequest.created_at)}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div>
                            <h4 className="font-semibold text-sm mb-1">Topic</h4>
                            <p className="text-sm bg-muted/50 p-2 rounded-md">{selectedRequest?.topic}</p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-sm mb-1">Description</h4>
                            <p className="text-sm whitespace-pre-wrap bg-muted/50 p-2 rounded-md min-h-[80px]">
                                {selectedRequest?.description || "-"}
                            </p>
                        </div>
                        {selectedRequest?.image_url && (
                             <div>
                                <h4 className="font-semibold text-sm mb-1">Lampiran</h4>
                                <a href={selectedRequest.image_url} target="_blank" rel="noreferrer">
                                    <img src={selectedRequest.image_url} alt="Attachment" className="max-h-48 rounded-lg border hover:opacity-90 transition-opacity" />
                                </a>
                             </div>
                        )}
                        <div className="flex gap-4 text-sm">
                            <div><span className="text-muted-foreground">Kategori:</span> {selectedRequest?.category || "-"}</div>
                            <div><span className="text-muted-foreground">Prioritas:</span> {selectedRequest?.priority}</div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:justify-between">
                         <div className="flex gap-2 w-full">
                            <Button
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => { setRequestAction('approve'); handleRequestAction(); }}
                            >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                {selectedRequest?.type === 'feature' && role === 'superadmin' ? "Approve Feature" : "Terima"}
                            </Button>
                            <Button
                                className="flex-1"
                                variant="destructive"
                                onClick={() => { setRequestAction('reject'); handleRequestAction(); }}
                            >
                                <XCircle className="w-4 h-4 mr-2" />
                                Tolak
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* --- ALERT: REJECT CONTENT --- */}
            <AlertDialog open={!!rejectContent} onOpenChange={() => setRejectContent(null)}>
                <AlertDialogContent className="glass-liquid rounded-[24px]">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Reject Draft Content?</AlertDialogTitle>
                        <AlertDialogDescription>This content will be removed from the draft list.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleReject} className="bg-destructive text-destructive-foreground">Reject</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </DashboardLayout>
    );
}
