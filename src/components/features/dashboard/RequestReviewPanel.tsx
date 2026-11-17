import { useState } from 'react';
import { displayCategory } from '@/lib/categoryLabels';
import type { MaterialRequestWithUser, RequestStatus } from '@/hooks/useMaterialRequests';
import { Clock, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export type RequestFilter = RequestStatus | 'all';

const statusLabels: Record<RequestStatus, string> = {
  pending: 'Pending', reviewing: 'Reviewing', completed: 'Completed', rejected: 'Rejected',
};
const statusColors: Record<RequestStatus, string> = {
  pending: 'bg-amber-500/10 text-amber-600',
  reviewing: 'bg-primary/10 text-primary',
  completed: 'bg-green-500/10 text-green-600',
  rejected: 'bg-destructive/10 text-destructive-text',
};

export interface RequestReviewPanelProps {
  requests?: MaterialRequestWithUser[];
  requestsLoading: boolean;
  statusFilter: RequestFilter;
  onFilterChange: (filter: RequestFilter) => void;
  onStatusChange: (id: string, status: RequestStatus) => void;
  onGenerate: (id: string) => void;
  isGenerating: boolean;
  showCategory?: boolean;
}

/** Shared request UI only. The parent retains queries, mutations and role-specific content. */
export function RequestReviewPanel({ requests, requestsLoading, statusFilter, onFilterChange, onStatusChange, onGenerate, isGenerating, showCategory = false }: RequestReviewPanelProps) {
  const [generateDialog, setGenerateDialog] = useState({ open: false, requestId: '', topic: '' });
  const openGeneration = (requestId: string, topic: string) => {
    setGenerateDialog({ open: true, requestId, topic });
  };
  const confirmGeneration = () => {
    onGenerate(generateDialog.requestId);
    setGenerateDialog({ open: false, requestId: '', topic: '' });
  };

  return (
    <>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Material Requests</h2>
            <Select aria-label="Status filter"
              value={statusFilter}
              onValueChange={(value) => onFilterChange(value as RequestStatus | 'all')}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="reviewing">Under Review</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-card border border-border rounded-xl shadow-soft overflow-hidden">
            <Table aria-label="Material requests awaiting review">
              <TableHeader>
                <TableRow>
                  <TableHead>Topic</TableHead>
                  {showCategory && <TableHead>Category</TableHead>}
                  <TableHead>User</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requestsLoading ? (
                  <TableRow>
                    <TableCell colSpan={showCategory ? 6 : 5} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4 animate-spin" />
                        Loading...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : requests && requests.length > 0 ? (
                  requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {request.topic}
                      </TableCell>
                      {showCategory && (
                        <TableCell>
                          <Badge variant="outline">{displayCategory(request.category || 'Umum')}</Badge>
                        </TableCell>
                      )}
                      <TableCell>{request.user_display_name || 'Anonymous'}</TableCell>
                      <TableCell>
                        {request.created_at
                          ? new Date(request.created_at).toLocaleDateString('en-US')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[request.status || 'pending']}>
                          {statusLabels[request.status || 'pending']}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {(request.status === 'pending' || request.status === 'reviewing') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openGeneration(request.id, request.topic)}
                              disabled={isGenerating}
                              className="gap-1"
                            >
                              {isGenerating ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Sparkles className="h-3 w-3" />
                              )}
                              Generate AI
                            </Button>
                          )}
                          <Select aria-label="Request status"
                            value={request.status || 'pending'}
                            onValueChange={(value) => onStatusChange(request.id, value as RequestStatus)}
                          >
                            <SelectTrigger className="w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="reviewing">Under Review</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={showCategory ? 6 : 5} className="text-center py-8 text-muted-foreground">
                      No requests
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
      <AlertDialog
        open={generateDialog.open}
        onOpenChange={(open) => setGenerateDialog(prev => ({ ...prev, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Generate Module with AI
            </AlertDialogTitle>
            <AlertDialogDescription>
              AI will create a learning module for the request "{generateDialog.topic}".
              This may take a few seconds.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmGeneration}>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Module
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>    </>
  );
}
