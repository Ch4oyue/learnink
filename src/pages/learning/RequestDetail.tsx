import { useParams, useNavigate, Link } from "react-router-dom";
import { useMaterialRequest } from "@/hooks/useMaterialRequests";
import { useModuleByRequestId } from "@/hooks/useModules";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
import { displayCategory } from "@/lib/categoryLabels";
  ArrowLeft, 
  FileQuestion, 
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  BookOpen,
  Sparkles,
  Calendar,
  Tag,
  AlertCircle,
} from "lucide-react";

const statusConfig = {
  pending: {
    label: 'Pending',
    color: 'bg-amber-500/10 text-amber-600',
    icon: Clock,
    description: 'Your request is waiting to be reviewed by a tutor.',
  },
  reviewing: {
    label: 'Under Review',
    color: 'bg-primary/10 text-primary',
    icon: Eye,
    description: 'Your request is being reviewed by our tutors.',
  },
  completed: {
    label: 'Completed',
    color: 'bg-green-500/10 text-green-600',
    icon: CheckCircle,
    description: 'Your request has been processed and the module has been created.',
  },
  rejected: {
    label: 'Rejected',
    color: 'bg-destructive/10 text-destructive-text',
    icon: XCircle,
    description: 'Your request could not be processed. See the admin notes for details.',
  },
};

const priorityColors: Record<string, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-amber-500/10 text-amber-600',
  high: 'bg-red-500/10 text-red-600',
};

const priorityLabels: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export default function RequestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: request, isLoading: requestLoading } = useMaterialRequest(id);
  const { data: relatedModule } = useModuleByRequestId(id);

  if (requestLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="h-64 bg-muted rounded-xl" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <FileQuestion className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Request Tidak Ditemukan</h1>
            <p className="text-muted-foreground mb-6">
              Request yang Anda cari tidak ada atau bukan milik Anda.
            </p>
            <Button onClick={() => navigate('/dashboard/user')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali ke Dashboard
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const status = request.status || 'pending';
  const statusInfo = statusConfig[status];
  const StatusIcon = statusInfo.icon;
  const priority = request.priority || 'medium';

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>

        {/* Header */}
        <div className="bg-card border border-border rounded-2xl p-8 mb-6 shadow-soft">
          <div className="flex flex-wrap gap-3 mb-4">
            <Badge className={statusInfo.color}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusInfo.label}
            </Badge>
            <Badge className={priorityColors[priority]}>
              Priority: {priorityLabels[priority]}
            </Badge>
            {request.category && (
              <Badge variant="outline">
                <Tag className="h-3 w-3 mr-1" />
                {displayCategory(request.category)}
              </Badge>
            )}
          </div>
          
          <h1 className="text-2xl font-bold text-foreground mb-4">
            {request.topic}
          </h1>
          
          <p className="text-muted-foreground mb-6">
            {statusInfo.description}
          </p>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>
                Created: {request.created_at 
                  ? new Date(request.created_at).toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        {request.description && (
          <div className="bg-card border border-border rounded-2xl p-8 mb-6 shadow-soft">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Deskripsi Request
            </h2>
            <p className="text-foreground/90 whitespace-pre-wrap">
              {request.description}
            </p>
          </div>
        )}

        {/* AI Summary */}
        {request.ai_summary && (
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-2xl p-8 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">
                Ringkasan AI
              </h2>
            </div>
            <p className="text-foreground/90">
              {request.ai_summary}
            </p>
          </div>
        )}

        {/* Admin Notes */}
        {request.admin_notes && (
          <div className="bg-card border border-border rounded-2xl p-8 mb-6 shadow-soft">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold text-foreground">
                Catatan Admin
              </h2>
            </div>
            <p className="text-foreground/90 whitespace-pre-wrap">
              {request.admin_notes}
            </p>
          </div>
        )}

        {/* Related Module */}
        {relatedModule && (
          <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-8 shadow-soft">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h2 className="text-lg font-semibold text-foreground">
                Modul Telah Dibuat
              </h2>
            </div>
            <p className="text-muted-foreground mb-6">
              Request Anda telah diproses dan modul pembelajaran telah tersedia.
            </p>
            <Link 
              to={`/module/${relatedModule.id}`}
              className="inline-flex items-center gap-2"
            >
              <Button>
                <BookOpen className="h-4 w-4 mr-2" />
                Lihat Modul: {relatedModule.title}
              </Button>
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
