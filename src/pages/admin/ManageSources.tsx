import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { DashboardLayout } from "@/components/features/dashboard/DashboardLayout";
import {
    useLearningSourcesCRUD,
    useCreateLearningSource,
    useUpdateLearningSource,
    useDeleteLearningSource,
    useToggleLearningSourceActive,
    LearningSource,
    CreateLearningSourceInput,
    UpdateLearningSourceInput,
} from "@/hooks/useLearningSourcesCRUD";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
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
import {
    Globe,
    Plus,
    Pencil,
    Trash2,
    ExternalLink,
    Loader2,
    ImageIcon,
    Search,
} from "lucide-react";

// ============================================
// TYPES
// ============================================

interface SourceFormData {
    name: string;
    logo_url: string;
    website_url: string;
    description: string;
    category: string;
    display_order: number;
    is_active: boolean;
}

const INITIAL_FORM_DATA: SourceFormData = {
    name: "",
    logo_url: "",
    website_url: "",
    description: "",
    category: "platform",
    display_order: 0,
    is_active: true,
};

const CATEGORY_OPTIONS = [
    { value: "platform", label: "Learning Platform" },
    { value: "university", label: "University" },
    { value: "company", label: "Tech Company" },
    { value: "community", label: "Community" },
    { value: "tool", label: "Tool/Software" },
    { value: "other", label: "Other" },
];

// ============================================
// LOADING SKELETON
// ============================================

function TableSkeleton() {
    return (
        <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4">
                    <Skeleton className="h-10 w-10 rounded" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-8 w-20 ml-auto" />
                </div>
            ))}
        </div>
    );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function ManageSources() {
    const { isAdmin, loading: authLoading } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingSource, setEditingSource] = useState<LearningSource | null>(null);
    const [deleteSource, setDeleteSource] = useState<LearningSource | null>(null);
    const [formData, setFormData] = useState<SourceFormData>(INITIAL_FORM_DATA);

    // Hooks
    const { data: sources, isLoading } = useLearningSourcesCRUD();
    const createMutation = useCreateLearningSource();
    const updateMutation = useUpdateLearningSource();
    const deleteMutation = useDeleteLearningSource();
    const toggleActiveMutation = useToggleLearningSourceActive();

    // Access control - Admin only
    if (authLoading) {
        return (
            <DashboardLayout>
                <div className="space-y-6">
                    <Skeleton className="h-10 w-64" />
                    <TableSkeleton />
                </div>
            </DashboardLayout>
        );
    }

    if (!isAdmin) {
        return <Navigate to="/dashboard" replace />;
    }

    // Filter sources
    const filteredSources = sources?.filter(
        (source) =>
            source.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            source.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Handlers
    const openCreateForm = () => {
        setFormData(INITIAL_FORM_DATA);
        setEditingSource(null);
        setIsFormOpen(true);
    };

    const openEditForm = (source: LearningSource) => {
        setFormData({
            name: source.name,
            logo_url: source.logo_url,
            website_url: source.website_url || "",
            description: source.description || "",
            category: source.category,
            display_order: source.display_order,
            is_active: source.is_active,
        });
        setEditingSource(source);
        setIsFormOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (editingSource) {
            const updateInput: UpdateLearningSourceInput = {
                id: editingSource.id,
                name: formData.name,
                logo_url: formData.logo_url,
                website_url: formData.website_url || null,
                description: formData.description || null,
                category: formData.category,
                display_order: formData.display_order,
                is_active: formData.is_active,
            };
            await updateMutation.mutateAsync(updateInput);
        } else {
            const createInput: CreateLearningSourceInput = {
                name: formData.name,
                logo_url: formData.logo_url,
                website_url: formData.website_url || null,
                description: formData.description || null,
                category: formData.category,
                display_order: formData.display_order,
                is_active: formData.is_active,
            };
            await createMutation.mutateAsync(createInput);
        }

        setIsFormOpen(false);
        setEditingSource(null);
    };

    const handleDelete = async () => {
        if (deleteSource) {
            await deleteMutation.mutateAsync(deleteSource.id);
            setDeleteSource(null);
        }
    };

    const handleToggleActive = (source: LearningSource) => {
        toggleActiveMutation.mutate({
            id: source.id,
            is_active: !source.is_active,
        });
    };

    const isSubmitting = createMutation.isPending || updateMutation.isPending;

    return (
        <DashboardLayout>
            {/* Header */}
            <div className="mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold text-foreground mb-1 flex items-center gap-2">
                            <Globe className="h-6 w-6 text-primary" />
                            Learning Sources Manager
                        </h1>
                        <p className="text-muted-foreground">
                            Manage learning sources shown in the Landing Page marquee.
                        </p>
                    </div>
                    <Button onClick={openCreateForm} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add New Source
                    </Button>
                </div>
            </div>

            {/* Search & Stats */}
            <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search sources..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>
                        Total: <strong className="text-foreground">{sources?.length || 0}</strong>
                    </span>
                    <span>
                        Active:{" "}
                        <strong className="text-green-500">
                            {sources?.filter((s) => s.is_active).length || 0}
                        </strong>
                    </span>
                </div>
            </div>

            {/* Table */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
                {isLoading ? (
                    <TableSkeleton />
                ) : (
                    <Table aria-label="Learning sources">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="hidden md:table-cell w-[60px]">Logo</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead className="hidden md:table-cell">Category</TableHead>
                                <TableHead className="hidden md:table-cell">Order</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredSources && filteredSources.length > 0 ? (
                                filteredSources.map((source) => (
                                    <TableRow key={source.id}>
                                        <TableCell className="hidden md:table-cell">
                                            <div className="h-10 w-10 rounded bg-muted flex items-center justify-center overflow-hidden">
                                                {source.logo_url ? (
                                                    <img
                                                        src={source.logo_url}
                                                        alt={source.name}
                                                        className="h-full w-full object-contain grayscale hover:grayscale-0 transition-all"
                                                    />
                                                ) : (
                                                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium text-foreground break-words">{source.name}</p>
                                                <p className="text-xs text-muted-foreground md:hidden">{source.category} · Order {source.display_order}</p>
                                                {source.website_url && (
                                                    <a
                                                        href={source.website_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                                                    >
                                                        <ExternalLink className="h-3 w-3" />
                                                        {new URL(source.website_url).hostname}
                                                    </a>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            <Badge variant="outline" className="capitalize">
                                                {source.category}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            <span className="text-muted-foreground">{source.display_order}</span>
                                        </TableCell>
                                        <TableCell>
                                            <Switch
                                                aria-label={`${source.name} active`}
                                                checked={source.is_active}
                                                onCheckedChange={() => handleToggleActive(source)}
                                                disabled={toggleActiveMutation.isPending}
                                            />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => openEditForm(source)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-destructive-text hover:text-destructive-text hover:bg-destructive/10"
                                                    onClick={() => setDeleteSource(source)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground whitespace-normal">
                                        {searchQuery
                                            ? "No sources found matching your search"
                                            : "No learning sources yet. Add your first one!"}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </div>

            {/* Add/Edit Dialog */}
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="max-w-md glass-liquid rounded-[24px]">
                    <DialogHeader>
                        <DialogTitle>
                            {editingSource ? "Edit Learning Source" : "Add New Learning Source"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingSource
                                ? "Update the details of this learning source."
                                : "Add a new learning source to display in the marquee."}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g., Coursera"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="logo_url">Logo URL *</Label>
                            <Input
                                id="logo_url"
                                value={formData.logo_url}
                                onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                                placeholder="https://example.com/logo.png"
                                required
                            />
                            {formData.logo_url && (
                                <div className="mt-2 h-12 w-12 rounded bg-muted flex items-center justify-center overflow-hidden">
                                    <img
                                        src={formData.logo_url}
                                        alt="Logo preview"
                                        className="h-full w-full object-contain"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = "none";
                                        }}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="website_url">Website URL</Label>
                            <Input
                                id="website_url"
                                value={formData.website_url}
                                onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                                placeholder="https://example.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Brief description of the source..."
                                rows={2}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="category">Category</Label>
                                <Select aria-label="Category"
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
                                <Label htmlFor="display_order">Display Order</Label>
                                <Input
                                    id="display_order"
                                    type="number"
                                    value={formData.display_order}
                                    onChange={(e) =>
                                        setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })
                                    }
                                    min={0}
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between rounded-lg border border-border p-3">
                            <div>
                                <Label htmlFor="is_active" className="cursor-pointer">
                                    Active
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    Show this source in the marquee
                                </p>
                            </div>
                            <Switch
                                id="is_active"
                                checked={formData.is_active}
                                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                {editingSource ? "Update" : "Create"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteSource} onOpenChange={() => setDeleteSource(null)}>
                <AlertDialogContent className="glass-liquid rounded-[24px]">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Learning Source</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete <strong>{deleteSource?.name}</strong>? This action
                            cannot be undone and will remove it from the Landing Page marquee.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </DashboardLayout>
    );
}
