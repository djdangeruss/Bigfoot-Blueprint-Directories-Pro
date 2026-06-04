import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  useListCategories, 
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useGetPublicSettings,
  getListCategoriesQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Tag, Loader2, ImageIcon, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

type FormData = { id: number; name: string; description: string; imageUrl: string };

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: categories, isLoading } = useListCategories();
  const { data: publicSettings } = useGetPublicSettings();
  const primaryColor = (publicSettings as any)?.primaryColor as string | undefined;

  const { data: featuredData } = useQuery({
    queryKey: ["featured-count"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/entries?featured=true&limit=1", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) return { total: 0 };
      return res.json() as Promise<{ total: number }>;
    },
  });
  const featuredCount = featuredData?.total ?? 0;
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [imagePreviewError, setImagePreviewError] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({ id: 0, name: "", description: "", imageUrl: "" });
  
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  const handleOpenNew = () => {
    setFormData({ id: 0, name: "", description: "", imageUrl: "" });
    setImagePreviewError(false);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (category: any) => {
    setFormData({ 
      id: category.id, 
      name: category.name, 
      description: category.description || "",
      imageUrl: category.imageUrl || "",
    });
    setImagePreviewError(false);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const payload = {
      name: formData.name,
      description: formData.description || null,
      imageUrl: formData.imageUrl || null,
    } as any;

    try {
      if (formData.id) {
        await updateMutation.mutateAsync({ id: formData.id, data: payload });
        toast({ title: "Category updated" });
      } else {
        await createMutation.mutateAsync({ data: payload });
        toast({ title: "Category created" });
      }
      queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
      setIsFormOpen(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync({ id: deleteId });
      toast({ title: "Category deleted" });
      queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
    } catch (error: any) {
      toast({ title: "Cannot delete category", description: error.message, variant: "destructive" });
    } finally {
      setDeleteId(null);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const showPreview = !imagePreviewError && !!formData.imageUrl?.trim();

  const starColor = primaryColor || "hsl(var(--primary))";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
          <p className="text-gray-500 mt-1">Organize your directory into logical sections.</p>
        </div>
        <Button onClick={handleOpenNew}>
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-900 border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-gray-50/50 dark:bg-gray-800/50 border-b">
              <tr>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Entries</th>
                <th className="px-6 py-4 font-medium">Created</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {/* Virtual "Featured" row — always shown at top */}
              <tr className="bg-amber-50/40 dark:bg-amber-900/10 hover:bg-amber-50/60 dark:hover:bg-amber-900/20 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded border flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${starColor}15`, borderColor: `${starColor}30` }}>
                      <Star className="h-4 w-4" fill={starColor} color={starColor} />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                        Featured
                        <span className="text-xs font-normal px-1.5 py-0.5 rounded-full"
                          style={{ backgroundColor: `${starColor}15`, color: starColor }}>
                          Built-in
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Entries starred as featured across all categories
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-full px-2.5 py-0.5 text-xs font-medium">
                    {featuredCount} entries
                  </span>
                </td>
                <td className="px-6 py-4 text-muted-foreground text-xs italic">
                  Auto-managed
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-xs text-muted-foreground pr-2">
                    Star entries to add
                  </span>
                </td>
              </tr>

              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">Loading...</td>
                </tr>
              ) : categories?.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center">
                      <Tag className="h-8 w-8 mb-2 opacity-20" />
                      <p>No categories found.</p>
                      <Button variant="link" onClick={handleOpenNew}>Create your first category</Button>
                    </div>
                  </td>
                </tr>
              ) : (
                categories?.map((cat) => (
                  <tr key={cat.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {(cat as any).imageUrl ? (
                          <img
                            src={(cat as any).imageUrl}
                            alt={cat.name}
                            className="h-8 w-8 rounded object-cover flex-shrink-0 border"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded border bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                            <ImageIcon className="h-4 w-4 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{cat.name}</div>
                          {cat.description && <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{cat.description}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-full px-2.5 py-0.5 text-xs font-medium">
                        {cat.entryCount} entries
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {format(new Date(cat.createdAt), "MMM d, yyyy")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20" onClick={() => handleOpenEdit(cat)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 ml-1"
                        onClick={() => setDeleteId(cat.id)}
                        disabled={cat.entryCount > 0}
                        title={cat.entryCount > 0 ? "Cannot delete category with entries" : "Delete category"}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{formData.id ? "Edit Category" : "New Category"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name *</label>
              <Input 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                placeholder="e.g. Technology" 
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea 
                value={formData.description} 
                onChange={(e) => setFormData({...formData, description: e.target.value})} 
                placeholder="Optional description" 
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                Category Image URL
                <span className="text-xs font-normal text-muted-foreground">(optional)</span>
              </label>
              <Input
                value={formData.imageUrl}
                onChange={(e) => {
                  setFormData({...formData, imageUrl: e.target.value});
                  setImagePreviewError(false);
                }}
                placeholder="https://example.com/image.jpg"
                type="url"
              />
              <p className="text-xs text-muted-foreground">Shown on the category cards on the homepage.</p>
              {showPreview && (
                <div className="mt-2 rounded-lg border overflow-hidden bg-gray-50 dark:bg-gray-800">
                  <img
                    src={formData.imageUrl}
                    alt="Preview"
                    className="w-full h-32 object-cover"
                    onError={() => setImagePreviewError(true)}
                  />
                </div>
              )}
              {imagePreviewError && (
                <p className="text-xs text-destructive">Could not load image. Check the URL.</p>
              )}
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending || !formData.name.trim()}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {formData.id ? "Save Changes" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this category? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
