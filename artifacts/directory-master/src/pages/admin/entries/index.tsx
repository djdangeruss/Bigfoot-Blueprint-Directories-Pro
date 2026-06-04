import { useState } from "react";
import { Link } from "wouter";
import { 
  useListEntries, 
  useDeleteEntry,
  useToggleEntryPublished,
  useGetPublicSettings,
  getListEntriesQueryKey,
  getListCategoriesQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { Plus, Search, Edit, Trash2, FilterX, Loader2, TriangleAlert, Star } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

export default function AdminEntriesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showClearAll, setShowClearAll] = useState(false);
  const [clearConfirmText, setClearConfirmText] = useState("");
  const [isClearing, setIsClearing] = useState(false);
  const [togglingFeatured, setTogglingFeatured] = useState<number | null>(null);

  const { data: publicSettings } = useGetPublicSettings();
  const primaryColor = (publicSettings as any)?.primaryColor as string | undefined;

  const { data: entriesData, isLoading } = useListEntries({
    page,
    limit: 20,
    search: search || undefined,
    published: status === "all" ? undefined : status === "published"
  });

  const deleteMutation = useDeleteEntry();
  const togglePublishMutation = useToggleEntryPublished();

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync({ id: deleteId });
      toast({ title: "Entry deleted successfully" });
      queryClient.invalidateQueries({ queryKey: getListEntriesQueryKey() });
    } catch (e: any) {
      toast({ title: "Failed to delete", description: e.message, variant: "destructive" });
    } finally {
      setDeleteId(null);
    }
  };

  const handleTogglePublish = async (id: number, currentStatus: boolean) => {
    try {
      await togglePublishMutation.mutateAsync({ id, data: { published: !currentStatus } });
      queryClient.invalidateQueries({ queryKey: getListEntriesQueryKey() });
    } catch (e: any) {
      toast({ title: "Failed to update status", description: e.message, variant: "destructive" });
    }
  };

  const handleToggleFeatured = async (id: number, currentFeatured: boolean) => {
    setTogglingFeatured(id);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/entries/${id}/featured`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ featured: !currentFeatured }),
      });
      if (!res.ok) throw new Error("Failed to update");
      queryClient.invalidateQueries({ queryKey: getListEntriesQueryKey() });
      toast({ title: currentFeatured ? "Removed from featured" : "Added to featured" });
    } catch (e: any) {
      toast({ title: "Failed to update featured", description: e.message, variant: "destructive" });
    } finally {
      setTogglingFeatured(null);
    }
  };

  const handleClearAll = async () => {
    setIsClearing(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/entries", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unknown error");
      toast({ title: `Cleared ${data.entriesDeleted} entries and all categories.` });
      queryClient.invalidateQueries({ queryKey: getListEntriesQueryKey() });
      queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
      setShowClearAll(false);
      setClearConfirmText("");
      setPage(1);
    } catch (e: any) {
      toast({ title: "Failed to clear entries", description: e.message, variant: "destructive" });
    } finally {
      setIsClearing(false);
    }
  };

  const totalCount = entriesData?.total ?? 0;
  const clearConfirmValid = clearConfirmText.trim().toUpperCase() === "DELETE";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Entries</h1>
          <p className="text-gray-500 mt-1">Manage all your directory listings.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 dark:border-red-900 dark:hover:bg-red-950/30"
            onClick={() => { setClearConfirmText(""); setShowClearAll(true); }}
          >
            <Trash2 className="h-4 w-4 mr-1.5" />
            Clear All
          </Button>
          <Link href="/admin/entries/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Entry
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search entries..." 
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Drafts</SelectItem>
          </SelectContent>
        </Select>
        {(search || status !== "all") && (
          <Button variant="ghost" onClick={() => { setSearch(""); setStatus("all"); }} className="px-3">
            <FilterX className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="bg-white dark:bg-gray-900 border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-gray-50/50 dark:bg-gray-800/50 border-b">
              <tr>
                <th className="px-6 py-4 font-medium">Entry</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium">Updated</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">Loading...</td>
                </tr>
              ) : entriesData?.entries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">No entries found matching your criteria.</td>
                </tr>
              ) : (
                entriesData?.entries.map((entry) => {
                  const isFeatured = (entry as any).featured as boolean;
                  const isToggling = togglingFeatured === entry.id;
                  return (
                    <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 dark:text-white mb-1">{entry.title}</div>
                        {entry.location && <div className="text-xs text-muted-foreground">{entry.location}</div>}
                      </td>
                      <td className="px-6 py-4">
                        {entry.category ? (
                          <Badge variant="secondary" className="font-normal">{entry.category}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                        {format(new Date(entry.updatedAt), "MMM d, yyyy")}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <Switch 
                            checked={entry.published} 
                            onCheckedChange={() => handleTogglePublish(entry.id, entry.published)}
                          />
                          <span className={`text-xs font-medium ${entry.published ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                            {entry.published ? "Published" : "Draft"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 ml-1"
                          disabled={isToggling}
                          title={isFeatured ? "Remove from Featured" : "Add to Featured"}
                          onClick={() => handleToggleFeatured(entry.id, isFeatured)}
                          style={isFeatured ? { color: primaryColor || "hsl(var(--primary))" } : {}}
                        >
                          {isToggling ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Star
                              className="h-4 w-4 transition-all"
                              fill={isFeatured ? (primaryColor || "hsl(var(--primary))") : "none"}
                              color={isFeatured ? (primaryColor || "hsl(var(--primary))") : "currentColor"}
                            />
                          )}
                        </Button>
                        <Link href={`/admin/entries/${entry.id}/edit`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 ml-1"
                          onClick={() => setDeleteId(entry.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {entriesData && entriesData.totalPages > 1 && (
          <div className="p-4 border-t">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                <PaginationItem>
                  <span className="text-sm font-medium px-4">
                    Page {page} of {entriesData.totalPages}
                  </span>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setPage(p => Math.min(entriesData.totalPages, p + 1))}
                    className={page === entriesData.totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      {/* Single-entry delete dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this entry? This action cannot be undone.
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

      {/* Clear All entries dialog */}
      <AlertDialog open={showClearAll} onOpenChange={(open) => { if (!open && !isClearing) { setShowClearAll(false); setClearConfirmText(""); } }}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center shrink-0">
                <TriangleAlert className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <AlertDialogTitle className="text-lg">Clear All Entries</AlertDialogTitle>
            </div>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  This will permanently delete{" "}
                  <span className="font-semibold text-foreground">
                    all {totalCount > 0 ? totalCount.toLocaleString() : ""} entries
                  </span>{" "}
                  and all categories from your directory. This action{" "}
                  <span className="font-semibold text-red-600 dark:text-red-400">cannot be undone</span>.
                </p>
                <p>You will need to re-import your data afterwards.</p>
                <div className="pt-1">
                  <label className="block text-xs font-medium text-foreground mb-1.5">
                    Type <span className="font-mono font-bold">DELETE</span> to confirm
                  </label>
                  <Input
                    value={clearConfirmText}
                    onChange={(e) => setClearConfirmText(e.target.value)}
                    placeholder="DELETE"
                    className="font-mono"
                    disabled={isClearing}
                    autoComplete="off"
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={isClearing} onClick={() => { setShowClearAll(false); setClearConfirmText(""); }}>
              Cancel
            </AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={!clearConfirmValid || isClearing}
              onClick={handleClearAll}
              className="min-w-[140px]"
            >
              {isClearing ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Clearing…</>
              ) : (
                <><Trash2 className="h-4 w-4 mr-2" /> Clear All Entries</>
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
