import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/features/dashboard/DashboardLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Settings,
  ShieldAlert,
  Megaphone,
  TrendingUp,
  Smartphone,
  Tags,
  Plus,
  Trash2,
  Loader2,
  AlertTriangle,
  History,
  Activity,
  CheckCircle
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface SystemSetting {
  key: string;
  value: unknown;
  description: string;
}

interface LabelConfig {
  id: string;
  multiplier: number;
  description: string;
  is_active: boolean;
}

interface SecurityLog {
  id: string;
  event_type: string;
  ip_address: string;
  endpoint: string;
  error_message: string;
  created_at: string;
  metadata: Record<string, unknown>;
}

export default function SystemControl() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // --- LOCAL STATE ---
  const [globalXp, setGlobalXp] = useState("1.0");
  const [apkBonus, setApkBonus] = useState("1.0");
  const [broadcast, setBroadcast] = useState({ title: "", content: "", active: false });

  // --- QUERIES ---
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["system-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("system_settings").select("*");
      if (error) throw error;
      return data as SystemSetting[];
    }
  });

  const { data: labelConfigs, isLoading: labelsLoading } = useQuery({
    queryKey: ["label-configs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("label_configs").select("*").order("id");
      if (error) throw error;
      return data as LabelConfig[];
    }
  });

  const { data: securityLogs, isLoading: logsLoading } = useQuery({
    queryKey: ["security-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("security_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data as SecurityLog[];
    }
  });

  // Sync settings to local state
  useEffect(() => {
    if (settings) {
      const xp = settings.find(s => s.key === "global_xp_multiplier")?.value;
      const apk = settings.find(s => s.key === "apk_base_bonus")?.value;
      const msg = settings.find(s => s.key === "broadcast_message")?.value;

      if (xp) setGlobalXp(xp.toString());
      if (apk) setApkBonus(apk.toString());
      if (msg) setBroadcast(msg);
    }
  }, [settings]);

  // --- MUTATIONS ---
  const updateSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: unknown }) => {
      const { error } = await supabase
        .from("system_settings")
        .update({ value, updated_at: new Date().toISOString() })
        .eq("key", key);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-settings"] });
      toast({ title: "Pengaturan diperbarui" });
    }
  });

  const manageLabel = useMutation({
    mutationFn: async (label: LabelConfig) => {
      const { error } = await supabase
        .from("label_configs")
        .upsert(label);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["label-configs"] });
    }
  });

  const deleteLabel = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("label_configs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["label-configs"] });
      toast({ title: "Label dihapus" });
    }
  });

  // --- HELPERS ---
  const getSetting = (key: string) => settings?.find(s => s.key === key);

  if (settingsLoading || labelsLoading || logsLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-10">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8 text-primary" />
            System Control
          </h1>
          <p className="text-muted-foreground mt-2">
            Pusat kendali aplikasi untuk Super Admin. Kelola multiplier, mode pemeliharaan, dan pengumuman.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Global Multiplier */}
          <Card className="glass-liquid border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Global XP Multiplier
              </CardTitle>
              <CardDescription>
                Atur besaran multiplier XP yang berlaku untuk seluruh pengguna.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Input
                  type="number"
                  step="0.1"
                  value={globalXp}
                  onChange={(e) => setGlobalXp(e.target.value)}
                  className="max-w-[120px]"
                />
                <Button
                  onClick={() => updateSetting.mutate({ key: "global_xp_multiplier", value: globalXp })}
                  disabled={updateSetting.isPending}
                >
                  Simpan
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Maintenance Mode */}
          <Card className="glass-liquid border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-red-500" />
                Maintenance Mode
              </CardTitle>
              <CardDescription>
                Kunci akses aplikasi untuk semua pengguna kecuali Admin/Super Admin.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Status Pemeliharaan</Label>
                <p className="text-sm text-muted-foreground">Aktifkan saat melakukan update besar.</p>
              </div>
              <Switch
                checked={getSetting("maintenance_mode")?.value === "true" || getSetting("maintenance_mode")?.value === true}
                onCheckedChange={(checked) => updateSetting.mutate({ key: "maintenance_mode", value: checked.toString() })}
              />
            </CardContent>
          </Card>

          {/* APK Base Bonus */}
          <Card className="glass-liquid border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-blue-500" />
                APK Base Bonus
              </CardTitle>
              <CardDescription>
                Bonus XP tambahan untuk pengguna APK. 1.0 = +100% (Double XP).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Input
                  type="number"
                  step="0.1"
                  value={apkBonus}
                  onChange={(e) => setApkBonus(e.target.value)}
                  className="max-w-[120px]"
                />
                <Button
                  onClick={() => updateSetting.mutate({ key: "apk_base_bonus", value: apkBonus })}
                  disabled={updateSetting.isPending}
                >
                  Simpan
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Broadcast Message */}
          <Card className="glass-liquid border-white/10 md:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-amber-500" />
                Broadcast Message
              </CardTitle>
              <CardDescription>
                Kirim pengumuman global ke semua pengguna.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <Label>Aktifkan Pengumuman</Label>
                <Switch
                  checked={broadcast.active}
                  onCheckedChange={(checked) => setBroadcast({ ...broadcast, active: checked })}
                />
              </div>
              <div className="space-y-2">
                <Label>Judul</Label>
                <Input
                  value={broadcast.title}
                  onChange={(e) => setBroadcast({ ...broadcast, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Konten</Label>
                <Input
                  value={broadcast.content}
                  onChange={(e) => setBroadcast({ ...broadcast, content: e.target.value })}
                />
              </div>
            </CardContent>
            <CardFooter>
               <Button
                className="w-full"
                onClick={() => updateSetting.mutate({ key: "broadcast_message", value: broadcast })}
                disabled={updateSetting.isPending}
              >
                Update Pengumuman
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Security Audit Trail (Quick View) */}
        <Card className="glass-liquid border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-amber-500" />
              Security Audit Trail
            </CardTitle>
            <CardDescription>
              10 aktivitas keamanan terakhir yang tercatat di sistem.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {securityLogs?.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleString('en-US')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {log.event_type.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-mono">{log.endpoint}</TableCell>
                    <TableCell className="text-xs">{log.ip_address}</TableCell>
                    <TableCell>
                      {log.error_message ? (
                        <span className="text-destructive-text text-xs">{log.error_message}</span>
                      ) : (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {securityLogs?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                      Tidak ada log keamanan yang ditemukan.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" size="sm" className="w-full gap-2" asChild>
               <Link to="/dashboard/admin/logs">
                 <Activity className="h-4 w-4" /> View All Log
               </Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Label Configs Management */}
        <Card className="glass-liquid border-white/10">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Tags className="h-5 w-5 text-purple-500" />
                Manajemen Multiplier Label
              </CardTitle>
              <CardDescription>
                Atur multiplier XP untuk setiap label/tag pengguna.
              </CardDescription>
            </div>
            <Button onClick={() => {
              const id = prompt("Masukkan ID Label baru (misal: beta-tester):");
              if (id) manageLabel.mutate({ id, multiplier: 1.0, description: "", is_active: true });
            }} size="sm">
              <Plus className="h-4 w-4 mr-2" /> Tambah Label
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Label ID</TableHead>
                  <TableHead>Multiplier</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {labelConfigs?.map((label) => (
                  <TableRow key={label.id}>
                    <TableCell className="font-mono font-bold">{label.id}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.1"
                        defaultValue={label.multiplier}
                        className="w-20"
                        onBlur={(e) => manageLabel.mutate({ ...label, multiplier: parseFloat(e.target.value) })}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        defaultValue={label.description}
                        onBlur={(e) => manageLabel.mutate({ ...label, description: e.target.value })}
                      />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={label.is_active}
                        onCheckedChange={(checked) => manageLabel.mutate({ ...label, is_active: checked })}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive-text"
                        onClick={() => {
                          if (confirm(`Hapus label ${label.id}?`)) deleteLabel.mutate(label.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <div className="pt-6">
           <Card className="border-destructive/20 bg-destructive/5">
             <CardHeader>
               <CardTitle className="text-destructive-text flex items-center gap-2">
                 <AlertTriangle className="h-5 w-5" />
                 Danger Zone
               </CardTitle>
             </CardHeader>
             <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Aksi di bawah ini bersifat merusak atau berdampak besar pada sistem. Gunakan dengan sangat hati-hati.
                </p>
                <Button variant="destructive" className="gap-2">
                  <Trash2 className="h-4 w-4" /> Reset Semua Point Pengguna
                </Button>
             </CardContent>
           </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
