import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Inbox,
    Check,
    X,
    ExternalLink,
    Clock,
    AlertCircle
} from "lucide-react";
import type { IncomingNote } from "@/types/staging";

// Mock data for UI development
const MOCK_INCOMING_NOTES: IncomingNote[] = [
    {
        id: "1",
        source: "n8n",
        title: "React Hooks Deep Dive",
        content: "# useState vs useReducer\n\nWhen to use each hook:\n- useState: simple state\n- useReducer: complex state logic...",
        raw_data: { workflow_id: "abc123" },
        status: "pending",
        created_at: new Date().toISOString(),
    },
    {
        id: "2",
        source: "notion",
        title: "TypeScript Generics",
        content: "## Understanding Generics\n\nGenerics allow you to write flexible, reusable code...",
        raw_data: { page_id: "notion-xyz" },
        status: "pending",
        created_at: new Date(Date.now() - 3600000).toISOString(),
    },
];

interface IncomingNoteAlertProps {
    /** Optional: use real data instead of mock */
    notes?: IncomingNote[];
    /** Callback when user approves a note */
    onApprove?: (noteId: string) => void;
    /** Callback when user discards a note */
    onDiscard?: (noteId: string) => void;
}

export function IncomingNoteAlert({
    notes = [],
    onApprove,
    onDiscard
}: IncomingNoteAlertProps) {
    const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

    const pendingNotes = notes.filter(
        (note) => note.status === "pending" && !dismissedIds.has(note.id)
    );

    if (pendingNotes.length === 0) {
        return null;
    }

    const handleApprove = (noteId: string) => {
        onApprove?.(noteId);
        setDismissedIds((prev) => new Set(prev).add(noteId));
    };

    const handleDiscard = (noteId: string) => {
        onDiscard?.(noteId);
        setDismissedIds((prev) => new Set(prev).add(noteId));
    };

    const getSourceBadge = (source: IncomingNote["source"]) => {
        const configs = {
            n8n: { label: "n8n", className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
            notion: { label: "Notion", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
            manual: { label: "Manual", className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400" },
        };
        const config = configs[source];
        return <Badge variant="secondary" className={config.className}>{config.label}</Badge>;
    };

    const formatTimeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays}d ago`;
    };

    return (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/50">
                        <Inbox className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                        <CardTitle className="text-base">Incoming Notes</CardTitle>
                        <CardDescription className="text-xs">
                            {pendingNotes.length} item{pendingNotes.length > 1 ? "s" : ""} waiting for review
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                {pendingNotes.slice(0, 3).map((note) => (
                    <div
                        key={note.id}
                        className="p-3 rounded-lg border bg-background/80 space-y-2"
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                                {getSourceBadge(note.source)}
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatTimeAgo(note.created_at)}
                                </span>
                            </div>
                        </div>

                        {/* Title */}
                        {note.title && (
                            <h4 className="font-medium text-sm text-foreground">
                                {note.title}
                            </h4>
                        )}

                        {/* Content Preview */}
                        <p className="text-xs text-muted-foreground line-clamp-2">
                            {note.content.replace(/[#*`]/g, "").substring(0, 120)}...
                        </p>

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-1">
                            <Button
                                size="sm"
                                variant="default"
                                className="h-7 text-xs gap-1"
                                onClick={() => handleApprove(note.id)}
                            >
                                <Check className="h-3 w-3" />
                                Review & Add
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs gap-1 text-destructive-text hover:text-destructive-text"
                                onClick={() => handleDiscard(note.id)}
                            >
                                <X className="h-3 w-3" />
                                Discard
                            </Button>
                        </div>
                    </div>
                ))}

                {pendingNotes.length > 3 && (
                    <Button variant="link" className="w-full text-xs h-8" asChild>
                        <a href="/dashboard/staging">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View all {pendingNotes.length} incoming notes
                        </a>
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}

/**
 * Empty state component when no incoming notes
 */
export function NoIncomingNotes() {
    return (
        <Card className="border-dashed">
            <CardContent className="py-8 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-3">
                    <AlertCircle className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                    No incoming notes in staging area
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                    Notes from n8n webhooks will appear here for review
                </p>
            </CardContent>
        </Card>
    );
}
