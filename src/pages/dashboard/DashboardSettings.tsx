import { useState } from "react";
import { Navigate } from "react-router-dom";
import { DashboardLayout } from "@/components/features/dashboard/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useModuleCategories,
  useModuleLevels,
  useCreateCategory,
  useCreateLevel,
  useDeleteCategory,
  useDeleteLevel,
  useUpdateCategory,
  useUpdateLevel
} from "@/hooks/useModuleSettings";
import {
  Folder,
  Layers,
  Plus,
  Trash2,
  Loader2,
  Palette,
  Sun,
  Moon,
  Monitor,
  Edit,
  Download,
  CheckCircle2
} from "lucide-react";
import { usePWA } from "@/contexts/PWAContext";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function DashboardSettings({ adminMode = false }: { adminMode?: boolean }) {
  const { isAdmin } = useAuth();
  if (adminMode && !isAdmin) return <Navigate to="/dashboard/settings" replace />;
  return adminMode ? <AdminSettings /> : <PersonalSettings />;
}

function PersonalSettings() {
  const { theme, setTheme } = useTheme();
  const { isInstalled, deferredPrompt, installApp } = usePWA();
  // Theme options
  const themeOptions = [
    { value: "light" as const, label: "Light", icon: Sun },
    { value: "dark" as const, label: "Dark", icon: Moon },
    { value: "system" as const, label: "System", icon: Monitor },
  ];

  // Mobile Preferences State (Moved from BottomNavigation logic if needed, but handled here via localStorage)
  const [transparentNav, setTransparentNav] = useState(() => localStorage.getItem("transparentMobileNav") === "true");

  const toggleTransparentNav = () => {
    const newVal = !transparentNav;
    setTransparentNav(newVal);
    localStorage.setItem("transparentMobileNav", String(newVal));
    window.dispatchEvent(new Event("storage")); // Notify other components
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl mx-auto">
        <div>
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="text-muted-foreground">Manage your preferences</p>
        </div>
        <Card className="">
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {themeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTheme(option.value)}
                  aria-pressed={theme === option.value}
                  className={`flex flex-col items-center gap-3 p-6 rounded-2xl border transition-shadow duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${theme === option.value ? "border-primary bg-primary/10 shadow-md" : "  hover:bg-secondary/60"}`}
                >
                  <option.icon className={`h-8 w-8 ${theme === option.value ? "text-primary" : "text-muted-foreground"}`} />
                  <div className="text-center">
                    <span className={`text-sm font-bold block ${theme === option.value ? "text-primary" : "text-foreground"}`}>{option.label}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Mobile Preferences - Only visible on mobile/tablet */}
            <div className="mt-8 border-t pt-6 md:hidden">
              <h3 className="text-base font-bold mb-1">Mobile Preferences</h3>
              <p className="text-sm text-muted-foreground mb-4">Adjust settings for mobile experience</p>
              <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-2xl border">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-xl">
                    <Layers className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <span className="font-bold block text-sm">Transparent Navigation</span>
                    <span className="text-xs text-muted-foreground">Make bottom navigation bar glass-like</span>
                  </div>
                </div>
                <Button variant={transparentNav ? "default" : "outline"} size="sm" onClick={toggleTransparentNav} className="rounded-full">
                  {transparentNav ? "Enabled" : "Disabled"}
                </Button>
              </div>
            </div>

            {/* Install PWA Section */}
            <div className="mt-8 border-t pt-6">
              <h3 className="text-base font-bold mb-1">Install Application</h3>
              <p className="text-sm text-muted-foreground mb-4">Install LearnInk to your device for better experience.</p>
              {isInstalled ? (
                <Button disabled variant="outline" className="w-full gap-2 justify-start h-auto py-3 rounded-xl bg-secondary/50">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <div className="flex flex-col items-start">
                    <span className="font-bold text-foreground">App Installed</span>
                    <span className="text-xs font-normal">You are using the app version</span>
                  </div>
                </Button>
              ) : deferredPrompt ? (
                <Button onClick={installApp} className="w-full gap-2 justify-start h-auto py-3 rounded-xl">
                  <Download className="h-5 w-5" />
                  <div className="flex flex-col items-start">
                    <span className="font-bold">Install App</span>
                    <span className="text-xs font-normal opacity-90">Add to Home Screen</span>
                  </div>
                </Button>
              ) : (
                <div className="bg-secondary/50 rounded-xl p-4 border border-dashed">
                  <p className="text-sm text-muted-foreground text-center">
                    To install, use your browser's <strong>"Add to Home Screen"</strong> or <strong>"Install App"</strong> feature.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="mt-6">
          <CardContent className="py-4">
            <a href="/changelog" className="flex items-center justify-between text-sm text-muted-foreground hover:text-foreground transition-colors group">
              <span className="font-medium group-hover:text-primary transition-colors">View Changelog & Version History</span>
              <span className="text-xs bg-secondary px-2 py-1 rounded-full">v1.8.0</span>
            </a>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function AdminSettings() {
  const { toast } = useToast();
  // Categories
  const { data: categories, isLoading: categoriesLoading } = useModuleCategories();
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();
  const updateCategory = useUpdateCategory();

  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDesc, setNewCategoryDesc] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#3B82F6");

  // Levels
  const { data: levels, isLoading: levelsLoading } = useModuleLevels();
  const createLevel = useCreateLevel();
  const deleteLevel = useDeleteLevel();
  const updateLevel = useUpdateLevel();

  const [newLevelName, setNewLevelName] = useState("");
  const [newLevelDesc, setNewLevelDesc] = useState("");
  const [newLevelColor, setNewLevelColor] = useState("#10B981");

  // Edit State
  const [editingItem, setEditingItem] = useState<{
    type: 'category' | 'level';
    id: string;
    name: string;
    description: string;
    color: string;
  } | null>(null);

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    createCategory.mutate({
      name: newCategoryName.trim(),
      color: newCategoryColor,
      description: newCategoryDesc.trim() || undefined
    }, {
      onSuccess: () => {
        setNewCategoryName("");
        setNewCategoryDesc("");
        toast({ title: "Success", description: "Category added successfully" });
      }
    });
  };

  const handleAddLevel = () => {
    if (!newLevelName.trim()) return;
    createLevel.mutate({
      name: newLevelName.trim(),
      color: newLevelColor,
      description: newLevelDesc.trim() || undefined
    }, {
      onSuccess: () => {
        setNewLevelName("");
        setNewLevelDesc("");
        toast({ title: "Success", description: "Level added successfully" });
      }
    });
  };

  const handleUpdate = () => {
    if (!editingItem) return;
    const { id, type, name, color, description } = editingItem;

    if (type === 'category') {
      updateCategory.mutate({ id, name, color, description }, {
        onSuccess: () => setEditingItem(null)
      });
    } else {
      updateLevel.mutate({ id, name, color, description }, {
        onSuccess: () => setEditingItem(null)
      });
    }
  };

  const handleDelete = (id: string, name: string, type: 'category' | 'level') => {
    if (confirm(`Delete ${type === 'category' ? 'category' : 'level'} "${name}"?`)) {
      if (type === 'category') {
        deleteCategory.mutate(id);
      } else {
        deleteLevel.mutate(id);
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Admin Settings</h1>
          <p className="text-muted-foreground">Manage learning module categories and levels</p>
        </div>

        <Tabs defaultValue="categories">
          <TabsList>
            <TabsTrigger value="categories" className="gap-2"><Folder className="h-4 w-4" /> Category</TabsTrigger>
            <TabsTrigger value="levels" className="gap-2"><Layers className="h-4 w-4" /> Level</TabsTrigger>
          </TabsList>

          <TabsContent value="categories" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Add New Category</CardTitle>
                <CardDescription>Categories are used to group learning modules</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  <div className="flex gap-4 items-start">
                    <div className="flex-1 space-y-2">
                      <Label>Category Name</Label>
                      <Input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Example: Web Development" />
                    </div>
                    <div className="space-y-2">
                      <Label>Color</Label>
                      <div className="flex items-center gap-2">
                        <Input type="color" value={newCategoryColor} onChange={(e) => setNewCategoryColor(e.target.value)} className="w-12 h-10 p-1 cursor-pointer" />
                        <Palette className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4 items-end">
                    <div className="flex-1 space-y-2">
                      <Label>Description (Optional)</Label>
                      <Input value={newCategoryDesc} onChange={(e) => setNewCategoryDesc(e.target.value)} placeholder="Brief description..." />
                    </div>
                    <Button onClick={handleAddCategory} disabled={createCategory.isPending || !newCategoryName.trim()}>
                      {createCategory.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">Category List</CardTitle></CardHeader>
              <CardContent>
                {categoriesLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                ) : categories && categories.length > 0 ? (
                  <div className="space-y-2">
                    {categories.map((cat) => (
                      <div key={cat.id} className="flex items-center justify-between p-3 rounded-lg border group hover:border-primary/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }} />
                          <span className="font-medium">{cat.name}</span>
                          {cat.description && <span className="text-sm text-muted-foreground">- {cat.description}</span>}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingItem({ type: 'category', id: cat.id, name: cat.name, description: cat.description || '', color: cat.color })}
                            aria-label={`Edit category ${cat.name}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive-text hover:text-destructive-text"
                            onClick={() => handleDelete(cat.id, cat.name, 'category')}
                            aria-label={`Delete category ${cat.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-center text-muted-foreground py-8">No categories yet</p>}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="levels" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Add New Level</CardTitle>
                <CardDescription>Levels indicate module difficulty</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  <div className="flex gap-4 items-start">
                    <div className="flex-1 space-y-2">
                      <Label>Level Name</Label>
                      <Input value={newLevelName} onChange={(e) => setNewLevelName(e.target.value)} placeholder="Example: Expert" />
                    </div>
                    <div className="space-y-2">
                      <Label>Color</Label>
                      <div className="flex items-center gap-2">
                        <Input type="color" value={newLevelColor} onChange={(e) => setNewLevelColor(e.target.value)} className="w-12 h-10 p-1 cursor-pointer" />
                        <Palette className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4 items-end">
                    <div className="flex-1 space-y-2">
                      <Label>Description (Optional)</Label>
                      <Input value={newLevelDesc} onChange={(e) => setNewLevelDesc(e.target.value)} placeholder="Brief description..." />
                    </div>
                    <Button onClick={handleAddLevel} disabled={createLevel.isPending || !newLevelName.trim()}>
                      {createLevel.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">Level List</CardTitle></CardHeader>
              <CardContent>
                {levelsLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                ) : levels && levels.length > 0 ? (
                  <div className="space-y-2">
                    {levels.map((level) => (
                      <div key={level.id} className="flex items-center justify-between p-3 rounded-lg border group hover:border-primary/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: level.color }} />
                          <span className="font-medium">{level.name}</span>
                          {level.description && <span className="text-sm text-muted-foreground">- {level.description}</span>}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingItem({ type: 'level', id: level.id, name: level.name, description: level.description || '', color: level.color })}
                            aria-label={`Edit level ${level.name}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive-text hover:text-destructive-text"
                            onClick={() => handleDelete(level.id, level.name, 'level')}
                            aria-label={`Delete level ${level.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-center text-muted-foreground py-8">No levels yet</p>}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Dialog */}
        <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
          <DialogContent className="glass-liquid rounded-[24px]">
            <DialogHeader>
              <DialogTitle>Edit {editingItem?.type === 'category' ? 'Category' : 'Level'}</DialogTitle>
              <DialogDescription>Edit the item details below.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={editingItem?.name || ''}
                  onChange={(e) => setEditingItem(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={editingItem?.color || '#000000'}
                    onChange={(e) => setEditingItem(prev => prev ? ({ ...prev, color: e.target.value }) : null)}
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <span className="text-sm text-muted-foreground">{editingItem?.color}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={editingItem?.description || ''}
                  onChange={(e) => setEditingItem(prev => prev ? ({ ...prev, description: e.target.value }) : null)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setEditingItem(null)}>Cancel</Button>
              <Button onClick={handleUpdate} disabled={updateCategory.isPending || updateLevel.isPending}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
