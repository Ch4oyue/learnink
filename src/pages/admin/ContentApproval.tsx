import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { IncomingContent, ContentStatus } from "@/types/staging";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
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
    ExternalLink,
    RefreshCw,
} from "lucide-react";

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
    category: "Umum",
    level: "Pemula",
};

const CATEGORY_OPTIONS = [
    { value: "Umum", label: "Umum" },
    { value: "Produktivitas", label: "Produktivitas" },
    { value: "Teknologi", label: "Teknologi" },
    { value: "Bisnis", label: "Bisnis" },
    { value: "Pengembangan Diri", label: "Pengembangan Diri" },
    { value: "Lainnya", label: "Lainnya" },
];

const LEVEL_OPTIONS = [
    { value: "Pemula", label: "Pemula" },
    { value: "Menengah", label: "Menengah" },
    { value: "Lanjutan", label: "Lanjutan" },
];

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
    const { role, loading: authLoading, user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // State
    const [selectedContent, setSelectedContent] = useState<IncomingContent | null>(null);
    const [rejectContent, setRejectContent] = useState<IncomingContent | null>(null);
    const [formData, setFormData] = useState<PublishFormData>(INITIAL_FORM_DATA);
    const [isPublishOpen, setIsPublishOpen] = useState(false);

    // Fetch pending content
    const { data: pendingContents, isLoading, refetch } = useQuery({
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
        enabled: role === "admin",
    });

    // Approve and publish mutation
    const publishMutation = useMutation({
        mutationFn: async ({ content, formData }: { content: IncomingContent; formData: PublishFormData }) => {
            // 1. Insert into modules table
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

            // 2. Update incoming_contents status
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
                title: "Konten Berhasil Dipublikasi! 🎉",
                description: `Modul baru telah dibuat dengan ID: ${module.id}`,
            });
            setIsPublishOpen(false);
            setSelectedContent(null);
            queryClient.invalidateQueries({ queryKey: ["incoming-contents"] });
        },
        onError: (error) => {
            toast({
                title: "Gagal Mempublikasi",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    // Reject mutation
    const rejectMutation = useMutation({
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
            toast({
                title: "Konten Ditolak",
                description: "Konten telah ditandai sebagai ditolak.",
            });
            setRejectContent(null);
            queryClient.invalidateQueries({ queryKey: ["incoming-contents"] });
        },
        onError: (error) => {
            toast({
                title: "Gagal Menolak",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    // Handlers
    const openPublishDialog = (content: IncomingContent) => {
        setSelectedContent(content);
        setFormData({
            title: content.title,
            summary: `Materi pembelajaran tentang ${content.title}.`,
            content: content.raw_content?.content || "",
            category: "Umum",
            level: "Pemula",
        });
        setIsPublishOpen(true);
    };

    const handlePublish = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedContent) return;
        publishMutation.mutate({ content: selectedContent, formData });
    };

    const handleReject = () => {
        if (!rejectContent) return;
        rejectMutation.mutate(rejectContent);
    };

    // Access control - Admin only
    if (authLoading) {
        return (
            <DashboardLayout>
                <div className="space-y-6">
                    <Skeleton className="h-10 w-64" />
                    <CardSkeleton />
                </div>
            </DashboardLayout>
        );
    }

    if (role !== "admin") {
        return <Navigate to="/dashboard" replace />;
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <DashboardLayout>
            {/* Header */}
            <div className="mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold text-foreground mb-1 flex items-center gap-2">
                            <Inbox className="h-6 w-6 text-primary" />
                            Content Approval
                        </h1>
                        <p className="text-muted-foreground">
                            Review dan publikasi konten yang diterima dari n8n workflow.
                        </p>
                    </div>
                    <Button
                        onClick={() => refetch()}
                        variant="outline"
                        className="gap-2"
                        disabled={isLoading}
                    >
                        <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="mb-6 flex items-center gap-4 text-sm text-muted-foreground">
                <span>
                    Pending: <strong className="text-warning">{pendingContents?.length || 0}</strong>
                </span>
            </div>

            {/* Content Grid */}
            {isLoading ? (
                <CardSkeleton />
            ) : pendingContents && pendingContents.length > 0 ? (
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
                                    <Badge variant="outline" className="shrink-0 text-xs">
                                        {content.source}
                                    </Badge>
                                </div>
                            </CardHeader>

                            <CardContent className="pb-3">
                                {/* Content Preview */}
                                <div className="text-sm text-muted-foreground line-clamp-3 mb-3">
                                    {content.raw_content?.content?.substring(0, 200) || "No content preview available."}
                                    {(content.raw_content?.content?.length || 0) > 200 && "..."}
                                </div>

                                {/* Tags */}
                                {content.raw_content?.tags && content.raw_content.tags.length > 0 && (
                                    <div className="flex items-center gap-1 flex-wrap">
                                        <Tag className="h-3 w-3 text-muted-foreground" />
                                        {content.raw_content.tags.slice(0, 3).map((tag, idx) => (
                                            <Badge key={idx} variant="secondary" className="text-[10px] px-1.5">
                                                {tag}
                                            </Badge>
                                        ))}
                                        {content.raw_content.tags.length > 3 && (
                                            <Badge variant="secondary" className="text-[10px] px-1.5">
                                                +{content.raw_content.tags.length - 3}
                                            </Badge>
                                        )}
                                    </div>
                                )}
                            </CardContent>

                            <CardFooter className="gap-2 pt-3 border-t">
                                <Button
                                    size="sm"
                                    onClick={() => openPublishDialog(content)}
                                    className="flex-1 gap-1"
                                >
                                    <CheckCircle className="h-4 w-4" />
                                    Review & Publish
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setRejectContent(content)}
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                    <XCircle className="h-4 w-4" />
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-1">
                        Tidak ada konten pending
                    </h3>
                    <p className="text-muted-foreground text-sm max-w-md">
                        Semua konten sudah diproses. Konten baru dari n8n akan muncul di sini
                        secara otomatis.
                    </p>
                </div>
            )}

            {/* Publish Dialog */}
            <Dialog open={isPublishOpen} onOpenChange={setIsPublishOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-primary" />
                            Review & Publish Content
                        </DialogTitle>
                        <DialogDescription>
                            Edit konten sebelum mempublikasi sebagai modul baru.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handlePublish} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Judul Modul *</Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Masukkan judul modul"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="summary">Ringkasan</Label>
                            <Textarea
                                id="summary"
                                value={formData.summary}
                                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                                placeholder="Ringkasan singkat tentang modul ini..."
                                rows={2}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="category">Kategori</Label>
                                <Select
                                    value={formData.category}
                                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CATEGORY_OPTIONS.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="level">Level</Label>
                                <Select
                                    value={formData.level}
                                    onValueChange={(value) => setFormData({ ...formData, level: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {LEVEL_OPTIONS.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="content">Konten Markdown *</Label>
                            <Textarea
                                id="content"
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                placeholder="Konten modul dalam format Markdown..."
                                rows={12}
                                className="font-mono text-sm"
                                required
                            />
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsPublishOpen(false)}
                            >
                                Batal
                            </Button>
                            <Button type="submit" disabled={publishMutation.isPending}>
                                {publishMutation.isPending && (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                )}
                                Publish ke Modul
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Reject Confirmation */}
            <AlertDialog open={!!rejectContent} onOpenChange={() => setRejectContent(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Tolak Konten Ini?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Anda yakin ingin menolak konten <strong>"{rejectContent?.title}"</strong>?
                            Konten akan ditandai sebagai ditolak dan tidak akan dipublikasi.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleReject}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {rejectMutation.isPending && (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            )}
                            Tolak
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </DashboardLayout>
    );
}
