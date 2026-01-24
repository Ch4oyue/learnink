import { logger } from "@/lib/logger";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
  Loader2,
} from "lucide-react";

// ============================================
// CONSTANTS
// ============================================

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
] as const;

const categories = ["AI Dasar", "Automation", "AI Tools", "Advanced", "Prompt Engineering", "No-Code AI"] as const;
const levels = ["Pemula", "Menengah", "Lanjutan"] as const;

// ============================================
// ZOD SCHEMA - Proper validation at last!
// ============================================

const moduleSchema = z.object({
  title: z.string().min(1, "Judul modul wajib diisi").max(200, "Judul terlalu panjang"),
  summary: z.string().max(500, "Ringkasan terlalu panjang").optional().or(z.literal("")),
  content: z.string().optional().or(z.literal("")),
  category: z.string().min(1, "Pilih kategori"),
  level: z.string().min(1, "Pilih level"),
  icon_name: z.string().min(1, "Pilih icon"),
  is_published: z.boolean(),
});

type ModuleFormData = z.infer<typeof moduleSchema>;

// ============================================
// COMPONENT
// ============================================

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

  const [activeTab, setActiveTab] = useState("edit");

  // react-hook-form with zod validation and proper defaultValues
  // No more anti-pattern useEffect sync!
  const form = useForm<ModuleFormData>({
    resolver: zodResolver(moduleSchema),
    defaultValues: {
      title: module?.title ?? "",
      summary: module?.summary ?? "",
      content: module?.content ?? "",
      category: module?.category ?? "AI Dasar",
      level: module?.level ?? "Pemula",
      icon_name: module?.icon_name ?? "Bot",
      is_published: module?.is_published ?? false,
    },
  });

  const { watch, control, handleSubmit, formState: { isSubmitting } } = form;

  // Watch values for preview
  const watchedValues = watch();

  const onSubmit = async (data: ModuleFormData) => {
    try {
      if (mode === "create") {
        await createModule.mutateAsync({
          ...data,
          summary: data.summary || null,
          content: data.content || null,
          created_by: user?.id,
          generated_at: null,
          source_request_id: null,
        });
        toast({
          title: "Berhasil",
          description: "Modul berhasil dibuat",
        });
        navigate("/dashboard/modules");
      } else if (module) {
        await updateModule.mutateAsync({
          id: module.id,
          ...data,
          summary: data.summary || null,
          content: data.content || null,
        });
        toast({
          title: "Berhasil",
          description: "Modul berhasil diperbarui",
        });
        navigate("/dashboard/modules");
      }
    } catch (error) {
      logger.error("Error saving module:", error);
      toast({
        title: "Error",
        description: "Gagal menyimpan modul",
        variant: "destructive",
      });
    }
  };

  const SelectedIcon = icons.find((i) => i.name === watchedValues.icon_name)?.icon || Bot;
  const isPending = createModule.isPending || updateModule.isPending || isSubmitting;

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Header with actions */}
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
            <FormField
              control={control}
              name="is_published"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="text-sm font-normal cursor-pointer">
                    {field.value ? "Published" : "Draft"}
                  </FormLabel>
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isPending} className="gap-2">
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isPending ? "Menyimpan..." : "Simpan"}
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
              <FormField
                control={control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Judul Modul</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Masukkan judul modul..."
                        className="input-apple"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="summary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ringkasan</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Deskripsi singkat modul..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kategori</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Level</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {levels.map((level) => (
                          <SelectItem key={level} value={level}>
                            {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="icon_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Icon</FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-5 gap-2">
                        {icons.map(({ name, icon: Icon }) => (
                          <button
                            key={name}
                            type="button"
                            onClick={() => field.onChange(name)}
                            className={`p-2 rounded-lg border transition-all ${field.value === name
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border hover:border-primary/50"
                              }`}
                          >
                            <Icon className="h-5 w-5 mx-auto" />
                          </button>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Preview Card */}
              <div className="pt-4 border-t">
                <span className="text-muted-foreground text-xs">Preview Card</span>
                <div className="mt-2 p-4 rounded-xl border bg-card">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <SelectedIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {watchedValues.title || "Judul Modul"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {watchedValues.category} • {watchedValues.level}
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
                  <FormField
                    control={control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder={`Tulis konten modul dalam format Markdown...

# Heading 1
## Heading 2

**Bold text** dan *italic text*

- List item 1
- List item 2

\`\`\`python
# Code block
print('Hello World')
\`\`\``}
                            className="min-h-[500px] font-mono text-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                <TabsContent value="preview" className="mt-0">
                  <div className="min-h-[500px] p-4 rounded-lg border bg-muted/30 overflow-auto">
                    {watchedValues.content ? (
                      <MarkdownRenderer content={watchedValues.content} />
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
    </Form>
  );
}
