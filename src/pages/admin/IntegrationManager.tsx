import { logger } from "@/lib/logger";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { DashboardLayout } from "@/components/features/dashboard/DashboardLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Integration, IntegrationSource, CreateIntegrationInput } from "@/types/staging";
import { WORKFLOW_TEMPLATES, SOURCE_INFO, getTemplatesBySource } from "@/lib/workflowTemplates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarkdownRenderer } from "@/components/shared/MarkdownRenderer";
import { useToast } from "@/hooks/use-toast";
import {
    Plug,
    Plus,
    Copy,
    RefreshCw,
    Trash2,
    Loader2,
    Key,
    CheckCircle,
    ExternalLink,
    Workflow,
    FileText,
    Bot,
    Zap,
    Code,
    Clock,
    Activity,
    BookOpen,
    Eye,
    EyeOff,
} from "lucide-react";

// ============================================
// TYPES
// ============================================

const SOURCE_ICONS: Record<IntegrationSource, React.ReactNode> = {
    n8n: <Workflow className="h-4 w-4" />,
    notion: <FileText className="h-4 w-4" />,
    chatgpt: <Bot className="h-4 w-4" />,
    zapier: <Zap className="h-4 w-4" />,
    custom: <Code className="h-4 w-4" />,
};

const INITIAL_FORM: CreateIntegrationInput = {
    name: "",
    source: "n8n",
    description: "",
};

// ============================================
// LOADING SKELETON
// ============================================

function CardSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
                <Card key={i}>
                    <CardHeader>
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                    </CardContent>
                    <CardFooter>
                        <Skeleton className="h-9 w-full" />
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function IntegrationManager() {
    const { isAdmin, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [formData, setFormData] = useState<CreateIntegrationInput>(INITIAL_FORM);
    const [newApiKey, setNewApiKey] = useState<string | null>(null);
    const [deleteIntegration, setDeleteIntegration] = useState<Integration | null>(null);
    const [regenerateIntegration, setRegenerate] = useState<Integration | null>(null);
    const [showKeyId, setShowKeyId] = useState<string | null>(null);
    const [templateModal, setTemplateModal] = useState<{ open: boolean; source: IntegrationSource | null }>({
        open: false,
        source: null,
    });

    // Fetch integrations
    const { data: integrations, isLoading } = useQuery({
        queryKey: ["integrations"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("integrations")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data as Integration[];
        },
        enabled: isAdmin,
    });

    // Create integration mutation
    const createMutation = useMutation({
        mutationFn: async (input: CreateIntegrationInput) => {
            // Use supabase.functions.invoke - it handles auth automatically
            const { data, error } = await supabase.functions.invoke("generate-api-key", {
                body: input,
            });

            if (error) {
                logger.error("Edge Function error:", error);
                throw new Error(error.message || "Failed to call Edge Function");
            }

            if (!data?.success) {
                throw new Error(data?.error || "Failed to generate API key");
            }

            return data;
        },
        onSuccess: (data) => {
            toast({
                title: "Integration Created Successfully! 🎉",
                description: "Save this API key - it will not be shown again!",
            });
            setNewApiKey(data.api_key);
            setFormData(INITIAL_FORM);
            queryClient.invalidateQueries({ queryKey: ["integrations"] });
        },
        onError: (error) => {
            toast({
                title: "Failed to Create Integration",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    // Toggle active mutation
    const toggleActiveMutation = useMutation({
        mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
            const { error } = await supabase
                .from("integrations")
                .update({ is_active })
                .eq("id", id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["integrations"] });
        },
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from("integrations")
                .delete()
                .eq("id", id);

            if (error) throw error;
        },
        onSuccess: () => {
            toast({
                title: "Integration Deleted",
                description: "The API key is no longer valid.",
            });
            setDeleteIntegration(null);
            queryClient.invalidateQueries({ queryKey: ["integrations"] });
        },
    });

    // Regenerate key mutation
    const regenerateMutation = useMutation({
        mutationFn: async (integration: Integration) => {
            // Delete old integration
            const { error: deleteError } = await supabase
                .from("integrations")
                .delete()
                .eq("id", integration.id);

            if (deleteError) {
                throw new Error(`Failed to delete old integration: ${deleteError.message}`);
            }

            // Create new one
            const { data, error } = await supabase.functions.invoke("generate-api-key", {
                body: {
                    name: integration.name,
                    source: integration.source,
                    description: integration.description,
                },
            });

            if (error) {
                logger.error("Edge Function error:", error);
                throw new Error(error.message || "Failed to regenerate API key");
            }

            if (!data?.success) {
                throw new Error(data?.error || "Failed to generate API key");
            }

            return data;
        },
        onSuccess: (data) => {
            toast({
                title: "API Key Updated! 🔑",
                description: "The old key is no longer valid. Save the new key!",
            });
            setNewApiKey(data.api_key);
            setRegenerate(null);
            setIsCreateOpen(true); // Open dialog to show new key
            queryClient.invalidateQueries({ queryKey: ["integrations"] });
        },
        onError: (error) => {
            toast({
                title: "Failed to Update Key",
                description: error.message,
                variant: "destructive",
            });
            setRegenerate(null);
        },
    });

    // Handlers
    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        createMutation.mutate(formData);
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast({
            title: "Copied! 📋",
            description: `${label} copied to clipboard.`,
        });
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return "Never";
        return new Date(dateString).toLocaleDateString("en-US", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // Access control
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

    if (!isAdmin) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <DashboardLayout>
            {/* Header */}
            <div className="mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold text-foreground mb-1 flex items-center gap-2">
                            <Plug className="h-6 w-6 text-primary" />
                            Integration Manager
                        </h1>
                        <p className="text-muted-foreground">
                            Manage connections with n8n, Notion, and other external sources.
                        </p>
                    </div>
                    <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add Integration
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="mb-6 flex items-center gap-6 text-sm text-muted-foreground">
                <span>
                    Total: <strong className="text-foreground">{integrations?.length || 0}</strong>
                </span>
                <span>
                    Active:{" "}
                    <strong className="text-green-500">
                        {integrations?.filter((i) => i.is_active).length || 0}
                    </strong>
                </span>
            </div>

            {/* Tabs: Integrations & Templates */}
            <Tabs defaultValue="integrations" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="integrations" className="gap-2">
                        <Key className="h-4 w-4" />
                        My Integrations
                    </TabsTrigger>
                    <TabsTrigger value="templates" className="gap-2">
                        <BookOpen className="h-4 w-4" />
                        Templates & Guides
                    </TabsTrigger>
                </TabsList>

                {/* Integrations Tab */}
                <TabsContent value="integrations">
                    {isLoading ? (
                        <CardSkeleton />
                    ) : integrations && integrations.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {integrations.map((integration) => (
                                <Card key={integration.id} className="overflow-hidden">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-1">
                                                <CardTitle className="text-base flex items-center gap-2">
                                                    {SOURCE_ICONS[integration.source]}
                                                    {integration.name}
                                                </CardTitle>
                                                <CardDescription className="flex items-center gap-2">
                                                    <Badge
                                                        variant="outline"
                                                        className={SOURCE_INFO[integration.source].color}
                                                    >
                                                        {SOURCE_INFO[integration.source].label}
                                                    </Badge>
                                                </CardDescription>
                                            </div>
                                            <Switch
                                                checked={integration.is_active}
                                                onCheckedChange={(checked) =>
                                                    toggleActiveMutation.mutate({
                                                        id: integration.id,
                                                        is_active: checked,
                                                    })
                                                }
                                            />
                                        </div>
                                    </CardHeader>

                                    <CardContent className="space-y-3">
                                        {/* API Key */}
                                        <div className="space-y-1.5">
                                            <Label className="text-xs text-muted-foreground">API Key</Label>
                                            <div className="flex items-center gap-2">
                                                <code className="flex-1 text-xs bg-muted px-2 py-1.5 rounded font-mono truncate">
                                                    {showKeyId === integration.id
                                                        ? integration.api_key_preview
                                                        : "sk_live_••••••••••••"}
                                                </code>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-7 w-7"
                                                    onClick={() =>
                                                        setShowKeyId(
                                                            showKeyId === integration.id ? null : integration.id
                                                        )
                                                    }
                                                >
                                                    {showKeyId === integration.id ? (
                                                        <EyeOff className="h-3.5 w-3.5" />
                                                    ) : (
                                                        <Eye className="h-3.5 w-3.5" />
                                                    )}
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Webhook URL */}
                                        <div className="space-y-1.5">
                                            <Label className="text-xs text-muted-foreground">Webhook URL</Label>
                                            <div className="flex items-center gap-2">
                                                <code className="flex-1 text-xs bg-muted px-2 py-1.5 rounded font-mono truncate">
                                                    {integration.webhook_url}
                                                </code>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-7 w-7"
                                                    onClick={() =>
                                                        copyToClipboard(integration.webhook_url, "Webhook URL")
                                                    }
                                                >
                                                    <Copy className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Stats */}
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
                                            <span className="flex items-center gap-1">
                                                <Activity className="h-3 w-3" />
                                                {integration.request_count} requests
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {formatDate(integration.last_used_at)}
                                            </span>
                                        </div>
                                    </CardContent>

                                    <CardFooter className="gap-2 pt-3 border-t">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="flex-1 gap-1"
                                            onClick={() =>
                                                setTemplateModal({ open: true, source: integration.source })
                                            }
                                        >
                                            <BookOpen className="h-3.5 w-3.5" />
                                            Guide
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setRegenerate(integration)}
                                        >
                                            <RefreshCw className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-destructive-text hover:text-destructive-text hover:bg-destructive/10"
                                            onClick={() => setDeleteIntegration(integration)}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <Plug className="h-12 w-12 text-muted-foreground/50 mb-4" />
                            <h3 className="text-lg font-medium text-foreground mb-1">
                                No integrations yet
                            </h3>
                            <p className="text-muted-foreground text-sm max-w-md mb-4">
                                Create your first integration to connect LearnInk with n8n, Notion,
                                or other external sources.
                            </p>
                            <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                                <Plus className="h-4 w-4" />
                                Add First Integration
                            </Button>
                        </div>
                    )}
                </TabsContent>

                {/* Templates Tab */}
                <TabsContent value="templates">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {WORKFLOW_TEMPLATES.map((template) => (
                            <Card key={template.id}>
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        {SOURCE_ICONS[template.source]}
                                        {template.name}
                                    </CardTitle>
                                    <CardDescription>{template.description}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Badge
                                        variant="outline"
                                        className={SOURCE_INFO[template.source].color}
                                    >
                                        {template.type === "n8n_workflow" ? "n8n Workflow" : "Setup Guide"}
                                    </Badge>
                                </CardContent>
                                <CardFooter>
                                    <Button
                                        variant="outline"
                                        className="w-full gap-2"
                                        onClick={() => {
                                            if (template.type === "n8n_workflow") {
                                                copyToClipboard(template.content, "Workflow JSON");
                                            } else {
                                                setTemplateModal({ open: true, source: template.source });
                                            }
                                        }}
                                    >
                                        {template.type === "n8n_workflow" ? (
                                            <>
                                                <Copy className="h-4 w-4" />
                                                Copy JSON
                                            </>
                                        ) : (
                                            <>
                                                <ExternalLink className="h-4 w-4" />
                                                View Guide
                                            </>
                                        )}
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>

            {/* Create Integration Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={(open) => {
                setIsCreateOpen(open);
                if (!open) {
                    setNewApiKey(null);
                    setFormData(INITIAL_FORM);
                }
            }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Plus className="h-5 w-5 text-primary" />
                            {newApiKey ? "API Key Generated!" : "Add New Integration"}
                        </DialogTitle>
                        <DialogDescription>
                            {newApiKey
                                ? "Save this API key now. It will not be shown again!"
                                : "Create a new integration to connect external sources."}
                        </DialogDescription>
                    </DialogHeader>

                    {newApiKey ? (
                        <div className="space-y-4">
                            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                                <p className="text-sm text-amber-600 dark:text-amber-400 font-medium mb-2">
                                    ⚠️ Save this key now!
                                </p>
                                <code className="block text-xs bg-background p-3 rounded font-mono break-all border">
                                    {newApiKey}
                                </code>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => copyToClipboard(newApiKey, "API Key")}
                                >
                                    <Copy className="h-4 w-4 mr-2" />
                                    Copy Key
                                </Button>
                                <Button className="flex-1" onClick={() => {
                                    setIsCreateOpen(false);
                                    setNewApiKey(null);
                                }}>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Done
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Integration Name *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., My n8n Workflow"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="source">Source</Label>
                                <Select
                                    value={formData.source}
                                    onValueChange={(value: IntegrationSource) =>
                                        setFormData({ ...formData, source: value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="n8n">
                                            <span className="flex items-center gap-2">
                                                <Workflow className="h-4 w-4" />
                                                n8n
                                            </span>
                                        </SelectItem>
                                        <SelectItem value="notion">
                                            <span className="flex items-center gap-2">
                                                <FileText className="h-4 w-4" />
                                                Notion
                                            </span>
                                        </SelectItem>
                                        <SelectItem value="chatgpt">
                                            <span className="flex items-center gap-2">
                                                <Bot className="h-4 w-4" />
                                                ChatGPT
                                            </span>
                                        </SelectItem>
                                        <SelectItem value="zapier">
                                            <span className="flex items-center gap-2">
                                                <Zap className="h-4 w-4" />
                                                Zapier
                                            </span>
                                        </SelectItem>
                                        <SelectItem value="custom">
                                            <span className="flex items-center gap-2">
                                                <Code className="h-4 w-4" />
                                                Custom
                                            </span>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description (optional)</Label>
                                <Tabs defaultValue="write" className="w-full">
                                    <TabsList className="grid w-full grid-cols-2 mb-2">
                                        <TabsTrigger value="write">Write</TabsTrigger>
                                        <TabsTrigger value="preview">Preview</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="write" className="mt-0">
                                        <Textarea
                                            id="description"
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Describe what this integration is for (Markdown supported)..."
                                            rows={4}
                                        />
                                    </TabsContent>
                                    <TabsContent value="preview" className="mt-0">
                                        <div className="min-h-[114px] max-h-[200px] p-3 rounded-md border bg-muted/50 overflow-y-auto">
                                            {formData.description ? (
                                                <MarkdownRenderer content={formData.description} variant="compact" />
                                            ) : (
                                                <span className="text-muted-foreground text-sm italic">
                                                    No content to preview
                                                </span>
                                            )}
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={createMutation.isPending}>
                                    {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                    Generate API Key
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* Template/Guide Modal */}
            <Dialog
                open={templateModal.open}
                onOpenChange={(open) => setTemplateModal({ open, source: null })}
            >
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {templateModal.source && SOURCE_ICONS[templateModal.source]}
                            {templateModal.source && SOURCE_INFO[templateModal.source].label} Setup Guide
                        </DialogTitle>
                    </DialogHeader>
                    <div className="max-w-none">
                        {templateModal.source && (
                            <MarkdownRenderer
                                content={
                                    getTemplatesBySource(templateModal.source)
                                        .find((t) => t.type === "setup_guide")
                                        ?.content || "No guide available."
                                }
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteIntegration} onOpenChange={() => setDeleteIntegration(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Integration?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete <strong>{deleteIntegration?.name}</strong>?
                            The API key will become invalid and can no longer be used.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteIntegration && deleteMutation.mutate(deleteIntegration.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Regenerate Confirmation */}
            <AlertDialog open={!!regenerateIntegration} onOpenChange={() => setRegenerate(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Regenerate API Key?</AlertDialogTitle>
                        <AlertDialogDescription>
                            The old key for <strong>{regenerateIntegration?.name}</strong> will become invalid.
                            You will need to update the key in every workflow that uses it.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => regenerateIntegration && regenerateMutation.mutate(regenerateIntegration)}
                        >
                            {regenerateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Regenerate
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </DashboardLayout>
    );
}
