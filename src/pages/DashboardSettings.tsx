import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useModuleCategories, useModuleLevels, useCreateCategory, useCreateLevel, useDeleteCategory, useDeleteLevel } from "@/hooks/useModuleSettings";
import { 
  Settings, 
  Folder, 
  Layers, 
  Plus, 
  Trash2, 
  Loader2,
  Palette
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function DashboardSettings() {
  const { role } = useAuth();
  const { toast } = useToast();
  
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

  if (role !== 'admin') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Akses Terbatas</h2>
            <p className="text-muted-foreground">
              Halaman ini hanya dapat diakses oleh Administrator
            </p>
          </div>
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
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
