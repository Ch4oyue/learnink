import { useState } from "react";
import { DashboardLayout } from "@/components/features/dashboard/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useMyRequests, useCreateRequest } from "@/hooks/useMaterialRequests";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { enUS as localeId } from "date-fns/locale";
import { Loader2, Plus, FileQuestion, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { displayCategory } from "@/lib/categoryLabels";

const categories = [
  { value: "AI & Machine Learning", label: "AI & Machine Learning" },
  { value: "Automation", label: "Automation" },
  { value: "Productivity", label: "Productivity" },
  { value: "Data Analysis", label: "Data Analysis" },
  { value: "Umum", label: "General" },
];

const statusConfig = {
  pending: { label: "Pending", icon: Clock, color: "bg-yellow-500/10 text-yellow-500" },
  reviewing: { label: "Under Review", icon: AlertCircle, color: "bg-blue-500/10 text-blue-500" },
  completed: { label: "Completed", icon: CheckCircle2, color: "bg-green-500/10 text-green-500" },
  rejected: { label: "Rejected", icon: XCircle, color: "bg-red-500/10 text-red-500" },
};

export default function DashboardRequestMaterial() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: requests, isLoading } = useMyRequests(user?.id);
  const createRequest = useCreateRequest();
  
  const [showForm, setShowForm] = useState(false);
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Umum");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !topic.trim()) return;

    createRequest.mutate(
      {
        userId: user.id,
        topic: topic.trim(),
        description: description.trim() || undefined,
        category,
      },
      {
        onSuccess: () => {
          toast({
            title: "Request Terkirim! 🎉",
            description: "Your material request will be processed by the team soon.",
          });
          setTopic("");
          setDescription("");
          setCategory("Umum");
          setShowForm(false);
        },
      }
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Material Requests</h1>
            <p className="text-muted-foreground">
              Request materi pembelajaran yang Anda butuhkan
            </p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="gap-2">
            <Plus className="h-4 w-4" />
            Request Baru
          </Button>
        </div>

        {/* Form */}
        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Material Requests Baru</CardTitle>
              <CardDescription>
                Jelaskan materi yang ingin Anda pelajari
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="topic">Material Topic *</Label>
                  <Input
                    id="topic"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Example: How to use ChatGPT to write emails"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe in more detail what you want to learn..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={createRequest.isPending}>
                    {createRequest.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Kirim Request
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowForm(false)}
                  >
                    Batal
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Requests List */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Request Saya</h2>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : requests && requests.length > 0 ? (
            <div className="grid gap-4">
              {requests.map((request) => {
                const status = statusConfig[request.status as keyof typeof statusConfig] || statusConfig.pending;
                const StatusIcon = status.icon;
                
                return (
                  <Card key={request.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium truncate">{request.topic}</h3>
                            <Badge variant="outline" className={status.color}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {status.label}
                            </Badge>
                          </div>
                          {request.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {request.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Category: {displayCategory(request.category)}</span>
                            <span>
                              {format(new Date(request.created_at!), "dd MMM yyyy", { locale: localeId })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <FileQuestion className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-1">Belum Ada Request</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Anda belum pernah membuat request materi
                  </p>
                  <Button onClick={() => setShowForm(true)} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Buat Request Pertama
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
