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
import { ModulePreviewCard } from "./ModulePreviewCard";
import { ModuleContentPreview } from "./ModuleContentPreview";
import { displayCategory, displayLevel } from "@/lib/categoryLabels";

// ============================================
// CONSTANTS
// ============================================

export const icons = [
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
// ZOD SCHEMA
// ============================================

const moduleSchema = z.object({
  title: z.string().min(1, "Module title is required").max(200, "Title is too long"),
  summary: z.string().max(500, "Summary is too long").optional().or(z.literal("")),
  content: z.string().optional().or(z.literal("")),
  category: z.string().min(1, "Select a category"),
  level: z.string().min(1, "Select a level"),
  icon_name: z.string().min(1, "Select an icon"),
  is_published: z.boolean(),
});

export type ModuleFormData = z.infer<typeof moduleSchema>;

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

  // react-hook-form with zod validation
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

  const { control, handleSubmit, formState: { isSubmitting } } = form;

  // OPTIMIZATION: Removed global watch() that caused re-renders on every keystroke.
  // Instead, we use specific field watching or isolated components.
  const selectedIconName = form.watch("icon_name");
  const SelectedIcon = icons.find((i) => i.name === selectedIconName)?.icon || Bot;

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
          title: "Success",
          description: "Module created successfully",
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
          title: "Success",
          description: "Module updated successfully",
        });
        navigate("/dashboard/modules");
      }
    } catch (error) {
      logger.error("Error saving module:", error);
      toast({
        title: "Error",
        description: "Failed to save module",
        variant: "destructive",
      });
    }
  };

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
            Back
          </Button>
          <div className="flex items-center gap-4">
            <FormField
              control={control}
              name="is_published"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormControl>
                    <Switch
                      aria-label="Published"
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
              {isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Settings */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Module Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Module Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter module title..."
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
                    <FormLabel>Summary</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Short module description..."
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
                    <FormLabel>Category</FormLabel>
                    <Select aria-label="Category" value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {field.value && !categories.includes(field.value as typeof categories[number]) && <SelectItem value={field.value}>{displayCategory(field.value)}</SelectItem>}
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {displayCategory(cat)}
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
                    <Select aria-label="Level" value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {field.value && !levels.includes(field.value as typeof levels[number]) && <SelectItem value={field.value}>{displayLevel(field.value)}</SelectItem>}
                        {levels.map((level) => (
                          <SelectItem key={level} value={level}>
                            {displayLevel(level)}
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

              {/* Isolated Preview Card */}
              <ModulePreviewCard control={control} />

            </CardContent>
          </Card>

          {/* Right Column - Content Editor */}
          <Card className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-lg">Module Content</CardTitle>
                  <TabsList className="grid grid-cols-2 w-full sm:w-[200px]">
                    <TabsTrigger value="edit">Edit</TabsTrigger>
                    <TabsTrigger value="preview" className="gap-1">
                      <Eye className="h-3 w-3" />
                      Preview
                    </TabsTrigger>
                  </TabsList>
              </div>
            </CardHeader>
            <CardContent>
                <TabsContent value="edit" className="mt-0">
                  <FormField
                    control={control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder={`Write module content in Markdown...

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
                  {/* Isolated Content Preview */}
                  <ModuleContentPreview control={control} />
                </TabsContent>
            </CardContent>
            </Tabs>
          </Card>
        </div>
      </form>
    </Form>
  );
}
