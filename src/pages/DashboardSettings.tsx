import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useModuleCategories, useModuleLevels, useCreateCategory, useCreateLevel, useDeleteCategory, useDeleteLevel } from "@/hooks/useModuleSettings";
import { useGetLatestIntegration, useGenerateApiKey } from "@/hooks/useIntegrations";
import {
  Settings,
  Folder,
  Layers,
  Plus,
  Trash2,
  Loader2,
  Palette,
  Webhook,
  Copy,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { IncomingNoteAlert } from "@/components/admin/IncomingNoteAlert";

export default function DashboardSettings() {
  const { role } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const isAdmin = role === 'admin';

  // Categories
  const { data: categories, isLoading: categoriesLoading } = useModuleCategories();
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#3B82F6");

  // Levels
  const { data: levels, isLoading: levelsLoading } = useModuleLevels();
  const createLevel = useCreateLevel();
  const deleteLevel = useDeleteLevel();
  const [newLevelName, setNewLevelName] = useState("");
  const [newLevelColor, setNewLevelColor] = useState("#10B981");

  // Integrations
  const { data: latestIntegration, isLoading: integrationLoading } = useGetLatestIntegration();
  const generateApiKey = useGenerateApiKey();

  const [webhookUrl, setWebhookUrl] = useState(`${window.location.origin}/api/webhook/notes`);
  const [secretKey, setSecretKey] = useState("sk_live_••••••••••••••••••••••••");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (latestIntegration) {
      setSecretKey(latestIntegration.api_key_preview);
      if (latestIntegration.webhook_url) {
        setWebhookUrl(latestIntegration.webhook_url);
      }
    }
  }, [latestIntegration]);

  const handleGenerateKey = () => {
    if (confirm("Membuat key baru akan menonaktifkan key lama jika ada (tergantung implementasi backend). Lanjutkan?")) {
      generateApiKey.mutate(
        { name: "n8n Integration" },
        {
          onSuccess: (data) => {
            setSecretKey(data.api_key); // Show full key once
            if (data.integration?.webhook_url) {
              setWebhookUrl(data.integration.webhook_url);
            }
            toast({
              title: "Key Baru Dibuat",
              description: "Secret key baru telah digenerate. Simpan dengan aman, ini tidak akan ditampilkan lagi!",
            });
          },
          onError: (error) => {
            toast({
              title: "Gagal",
              description: error.message,
              variant: "destructive",
            });
          }
        }
      );
    }
  };

  // Theme options
  const themeOptions = [
    { value: "light" as const, label: "Light", icon: Sun, description: "Light background with dark text" },
    { value: "dark" as const, label: "Dark", icon: Moon, description: "Dark background with light text" },
    { value: "system" as const, label: "System", icon: Monitor, description: "Follows your device settings" },
  ];

  // Non-admin users only see appearance settings
  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="space-y-6 max-w-3xl mx-auto">
          <div>
            <h1 className="text-2xl font-semibold">Settings</h1>
            <p className="text-muted-foreground">
              Manage your preferences
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize how LearnAI looks on your device
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {themeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setTheme(option.value)}
                    className={`flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all ${theme === option.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                      }`}
                  >
                    <option.icon
                      className={`h-8 w-8 ${theme === option.value ? "text-primary" : "text-muted-foreground"
                        }`}
                    />
                    <div className="text-center">
                      <span
                        className={`text-sm font-medium block ${theme === option.value ? "text-primary" : "text-foreground"
                          }`}
                      >
                        {option.label}
                      </span>
                      <span className="text-xs text-muted-foreground mt-1 block">
                        {option.description}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Changelog Link */}
          <Card>
            <CardContent className="py-4">
              <a
                href="/changelog"
                className="flex items-center justify-between text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <span>View Changelog & Version History</span>
                <span className="text-xs">v1.4.0</span>
              </a>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;

    createCategory.mutate({
      name: newCategoryName.trim(),
      color: newCategoryColor,
    }, {
      onSuccess: () => {
        setNewCategoryName("");
        toast({
          title: "Sukses",
          description: "Kategori berhasil ditambahkan",
        });
      }
    });
  };

  const handleDeleteCategory = (id: string, name: string) => {
    if (confirm(`Hapus kategori "${name}"?`)) {
      deleteCategory.mutate(id);
    }
  };

  const handleAddLevel = () => {
    if (!newLevelName.trim()) return;

    createLevel.mutate({
      name: newLevelName.trim(),
      color: newLevelColor,
    }, {
      onSuccess: () => {
        setNewLevelName("");
        toast({
          title: "Sukses",
          description: "Level berhasil ditambahkan",
        });
      }
    });
  };

  const handleDeleteLevel = (id: string, name: string) => {
    if (confirm(`Hapus level "${name}"?`)) {
      deleteLevel.mutate(id);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold">Pengaturan</h1>
          <p className="text-muted-foreground">
            Kelola kategori dan level modul pembelajaran
          </p>
        </div>

        <Tabs defaultValue="categories">
          <TabsList>
            <TabsTrigger value="categories" className="gap-2">
              <Folder className="h-4 w-4" />
              Kategori
            </TabsTrigger>
            <TabsTrigger value="levels" className="gap-2">
              <Layers className="h-4 w-4" />
              Level
            </TabsTrigger>
            <TabsTrigger value="integrations" className="gap-2">
              <Webhook className="h-4 w-4" />
              Integrasi
            </TabsTrigger>
          </TabsList>


          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tambah Kategori Baru</CardTitle>
                <CardDescription>
                  Kategori digunakan untuk mengelompokkan modul pembelajaran
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 items-end">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="categoryName">Nama Kategori</Label>
                    <Input
                      id="categoryName"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Contoh: Web Development"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="categoryColor">Warna</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="categoryColor"
                        type="color"
                        value={newCategoryColor}
                        onChange={(e) => setNewCategoryColor(e.target.value)}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Palette className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <Button
                    onClick={handleAddCategory}
                    disabled={createCategory.isPending || !newCategoryName.trim()}
                  >
                    {createCategory.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Daftar Kategori</CardTitle>
              </CardHeader>
              <CardContent>
                {categoriesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : categories && categories.length > 0 ? (
                  <div className="space-y-2">
                    {categories.map((cat) => (
                      <div
                        key={cat.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="font-medium">{cat.name}</span>
                          {cat.description && (
                            <span className="text-sm text-muted-foreground">
                              - {cat.description}
                            </span>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteCategory(cat.id, cat.name)}
                          disabled={deleteCategory.isPending}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Belum ada kategori
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Levels Tab */}
          <TabsContent value="levels" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tambah Level Baru</CardTitle>
                <CardDescription>
                  Level menunjukkan tingkat kesulitan modul
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 items-end">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="levelName">Nama Level</Label>
                    <Input
                      id="levelName"
                      value={newLevelName}
                      onChange={(e) => setNewLevelName(e.target.value)}
                      placeholder="Contoh: Expert"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="levelColor">Warna</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="levelColor"
                        type="color"
                        value={newLevelColor}
                        onChange={(e) => setNewLevelColor(e.target.value)}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Palette className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <Button
                    onClick={handleAddLevel}
                    disabled={createLevel.isPending || !newLevelName.trim()}
                  >
                    {createLevel.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Daftar Level</CardTitle>
              </CardHeader>
              <CardContent>
                {levelsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : levels && levels.length > 0 ? (
                  <div className="space-y-2">
                    {levels.map((level) => (
                      <div
                        key={level.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: level.color }}
                          />
                          <span className="font-medium">{level.name}</span>
                          {level.description && (
                            <span className="text-sm text-muted-foreground">
                              - {level.description}
                            </span>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteLevel(level.id, level.name)}
                          disabled={deleteLevel.isPending}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Belum ada level
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="space-y-4 mt-6">
            {/* Incoming Notes Preview */}
            <IncomingNoteAlert
              onApprove={(id) => {
                toast({
                  title: "Catatan Diterima",
                  description: `Catatan #${id} akan ditambahkan ke sistem`,
                });
              }}
              onDiscard={(id) => {
                toast({
                  title: "Catatan Dibuang",
                  description: `Catatan #${id} telah dihapus`,
                  variant: "destructive",
                });
              }}
            />

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Webhook className="h-5 w-5 text-primary" />
                  Webhook Configuration
                </CardTitle>
                <CardDescription>
                  Connect your n8n workflows to auto-import notes into LearnInk
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Webhook URL */}
                <div className="space-y-2">
                  <Label htmlFor="webhookUrl">Webhook Endpoint URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="webhookUrl"
                      value={webhookUrl}
                      readOnly
                      className="font-mono text-sm bg-muted"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        navigator.clipboard.writeText(webhookUrl);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                        toast({
                          title: "Disalin!",
                          description: "URL webhook berhasil disalin ke clipboard",
                        });
                      }}
                    >
                      {copied ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Point your n8n HTTP Request node to this URL
                  </p>
                </div>

                <Separator />

                {/* Secret Key */}
                <div className="space-y-2">
                  <Label htmlFor="secretKey">Secret Key</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secretKey"
                      value={secretKey}
                      readOnly
                      // Show password type only if it's not the full key (starts with sk_live and has no dots)
                      // Actually, let's keep it password type unless user wants to toggle visibility,
                      // but typically we want to allow copying.
                      // The requirements said: "Show the full key only immediately after generation"
                      // So for the preview, it is fine to be text since it is already masked.
                      // For the full key, it should probably be visible text so they can copy it.
                      type="text"
                      className="font-mono text-sm bg-muted"
                    />
                    <Button
                      variant="outline"
                      onClick={handleGenerateKey}
                      disabled={generateApiKey.isPending}
                    >
                      {generateApiKey.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      Generate New Key
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Add this key as a header: <code className="bg-muted px-1 rounded">X-Webhook-Secret</code> (or <code>Authorization: Bearer &lt;key&gt;</code>)
                  </p>
                </div>

                <Separator />

                {/* Instructions */}
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-lg p-4">
                  <div className="flex gap-3">
                    <AlertTriangle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm space-y-2">
                      <p className="font-medium text-blue-700 dark:text-blue-300">
                        Cara Menghubungkan n8n:
                      </p>
                      <ol className="list-decimal list-inside text-blue-600 dark:text-blue-400 space-y-1 text-xs">
                        <li>Buat workflow baru di n8n</li>
                        <li>Tambahkan node "HTTP Request"</li>
                        <li>Set method ke POST dan URL ke endpoint di atas</li>
                        <li>Tambahkan header <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">X-Webhook-Secret</code> dengan secret key</li>
                        <li>Kirim data dalam format JSON dengan field: title, content</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
