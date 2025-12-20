import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useCreateModule, useUpdateModule, Module } from "@/hooks/useModules";
import { useAuth } from "@/contexts/AuthContext";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import {
  Bot,
  Cpu,
  Workflow,
  Zap,
  Brain,
  Cog,
  Code,
  BookOpen,
  Lightbulb,
  Sparkles,
  Save,
  Eye,
  ArrowLeft,
} from "lucide-react";

// Icons focused on AI & Automation
const icons = [
  { name: "Bot", icon: Bot },
  { name: "Cpu", icon: Cpu },
  { name: "Workflow", icon: Workflow },
  { name: "Zap", icon: Zap },
  { name: "Brain", icon: Brain },
  { name: "Cog", icon: Cog },
  { name: "Code", icon: Code },
  { name: "BookOpen", icon: BookOpen },
  { name: "Lightbulb", icon: Lightbulb },
  { name: "Sparkles", icon: Sparkles },
];

// Categories focused on AI & Automation
const categories = ["AI Dasar", "Automation", "AI Tools", "Advanced", "Prompt Engineering", "No-Code AI"];
const levels = ["Pemula", "Menengah", "Lanjutan"];

interface ModuleEditorProps {
  module?: Module;
  mode: "create" | "edit";
}

export function ModuleEditor({ module, mode }: ModuleEditorProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const createModule = useCreateModule();
  const updateModule = useUpdateModule();

  const [formData, setFormData] = useState({
    title: module?.title || "",
    summary: module?.summary || "",
    content: module?.content || "",
    category: module?.category || "AI Dasar",
    level: module?.level || "Pemula",
    icon_name: module?.icon_name || "Bot",
    is_published: module?.is_published || false,
  });

  const [activeTab, setActiveTab] = useState("edit");

  useEffect(() => {
    if (module) {
      setFormData({
        title: module.title,
        summary: module.summary || "",
        content: module.content || "",
        category: module.category || "AI Dasar",
        level: module.level || "Pemula",
        icon_name: module.icon_name || "Bot",
        is_published: module.is_published || false,
      });
    }
  }, [module]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Judul modul wajib diisi",
        variant: "destructive",
      });
      return;
    }

    try {
      if (mode === "create") {
        await createModule.mutateAsync({
          ...formData,
          created_by: user?.id,
          generated_at: null,
          source_request_id: null,
        });
        navigate("/dashboard/modules");
      } else if (module) {
        await updateModule.mutateAsync({
          id: module.id,
          ...formData,
        });
        navigate("/dashboard/modules");
      }
    } catch (error) {
      console.error("Error saving module:", error);
    }
  };

  const SelectedIcon = icons.find((i) => i.name === formData.icon_name)?.icon || Bot;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={() => navigate("/dashboard/modules")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Button>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="publish"
              checked={formData.is_published}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_published: checked })
              }
            />
            <Label htmlFor="publish" className="text-sm">
              {formData.is_published ? "Published" : "Draft"}
            </Label>
          </div>
          <Button
            type="submit"
            disabled={createModule.isPending || updateModule.isPending}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {createModule.isPending || updateModule.isPending ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Settings */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Pengaturan Modul</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Judul Modul</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Masukkan judul modul..."
                className="input-apple"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="summary">Ringkasan</Label>
              <Textarea
                id="summary"
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                placeholder="Deskripsi singkat modul..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Kategori</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Level</Label>
              <Select
                value={formData.level}
                onValueChange={(value) => setFormData({ ...formData, level: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {levels.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="grid grid-cols-5 gap-2">
                {icons.map(({ name, icon: Icon }) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon_name: name })}
                    className={`p-2 rounded-lg border transition-all ${
                      formData.icon_name === name
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Icon className="h-5 w-5 mx-auto" />
                  </button>
                ))}
              </div>
            </div>

            {/* Preview Card */}
            <div className="pt-4 border-t">
              <Label className="text-muted-foreground text-xs">Preview Card</Label>
              <div className="mt-2 p-4 rounded-xl border bg-card">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <SelectedIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {formData.title || "Judul Modul"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formData.category} • {formData.level}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Column - Content Editor */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Konten Modul</CardTitle>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-2 w-[200px]">
                  <TabsTrigger value="edit">Edit</TabsTrigger>
                  <TabsTrigger value="preview" className="gap-1">
                    <Eye className="h-3 w-3" />
                    Preview
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsContent value="edit" className="mt-0">
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Tulis konten modul dalam format Markdown...

# Heading 1
## Heading 2

**Bold text** dan *italic text*

- List item 1
- List item 2

```python
# Code block
print('Hello World')
```"
                  className="min-h-[500px] font-mono text-sm"
                />
              </TabsContent>
              <TabsContent value="preview" className="mt-0">
                <div className="min-h-[500px] p-4 rounded-lg border bg-muted/30 overflow-auto">
                  {formData.content ? (
                    <MarkdownRenderer content={formData.content} />
                  ) : (
                    <p className="text-muted-foreground text-center py-10">
                      Belum ada konten untuk di-preview
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
