import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProgress } from "@/hooks/useUserProgress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  User,
  Mail,
  Shield,
  Calendar,
  BookOpen,
  Trophy,
  Save,
  Loader2,
} from "lucide-react";

const roleLabels: Record<string, string> = {
  user: "Pelajar",
  tutor: "Tutor",
  admin: "Administrator",
};

const roleBadgeVariants: Record<string, "default" | "secondary" | "destructive"> = {
  user: "secondary",
  tutor: "default",
  admin: "destructive",
};

export default function DashboardProfile() {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const { data: progress } = useUserProgress(user?.id);
  const [displayName, setDisplayName] = useState(
    user?.user_metadata?.display_name || ""
  );
  const [isUpdating, setIsUpdating] = useState(false);

  const completedModules = progress?.filter((p) => p.is_completed).length || 0;
  const totalProgress = progress?.length || 0;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { display_name: displayName },
      });

      if (error) throw error;

      // Also update the profiles table
      await supabase
        .from("profiles")
        .update({ display_name: displayName })
        .eq("id", user.id);

      toast({
        title: "Sukses",
        description: "Profil berhasil diperbarui",
      });
    } catch (error: any) {
      console.error("Update profile error:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal memperbarui profil",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold">Profil Saya</h1>
          <p className="text-muted-foreground">
            Kelola informasi profil dan pengaturan akun Anda
          </p>
        </div>

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">
                  {displayName?.charAt(0)?.toUpperCase() ||
                    user?.email?.charAt(0)?.toUpperCase() ||
                    "U"}
                </span>
              </div>
              <div>
                <CardTitle>{displayName || user?.email?.split("@")[0]}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <Mail className="h-3 w-3" />
                  {user?.email}
                </CardDescription>
                <Badge
                  variant={role ? roleBadgeVariants[role] : "secondary"}
                  className="mt-2"
                >
                  <Shield className="h-3 w-3 mr-1" />
                  {role ? roleLabels[role] : "Loading..."}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Nama Tampilan</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Masukkan nama tampilan..."
                  className="input-apple"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email tidak dapat diubah
                </p>
              </div>

              <Button type="submit" disabled={isUpdating} className="gap-2">
                {isUpdating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Simpan Perubahan
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Statistik Pembelajaran</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{totalProgress}</p>
                    <p className="text-xs text-muted-foreground">Modul Dipelajari</p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-success/5 border border-success/10">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                    <Trophy className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{completedModules}</p>
                    <p className="text-xs text-muted-foreground">Modul Selesai</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informasi Akun</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">Bergabung sejak</span>
              </div>
              <span className="text-sm font-medium">
                {user?.created_at
                  ? format(new Date(user.created_at), "dd MMMM yyyy", {
                      locale: localeId,
                    })
                  : "-"}
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                <span className="text-sm">User ID</span>
              </div>
              <code className="text-xs bg-muted px-2 py-1 rounded">
                {user?.id?.slice(0, 8)}...
              </code>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
